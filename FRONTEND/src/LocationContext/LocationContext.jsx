// LocationContext.js
import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useMemo,
} from "react";
import axios from "axios";
import { toast } from "react-toastify";

export const LocationContext = createContext();

export const useLocation = () => {
  const context = useContext(LocationContext);
  if (!context)
    throw new Error("useLocation must be used within LocationProvider");
  return context;
};

export const LocationProvider = ({ children }) => {
  // Constants
  const USER_LOCATION_KEY = "user_preferred_location_v3";
  const LOCATIONS_CACHE_KEY = "available_locations_cache";
  const IP_LOCATION_KEY = "ip_detected_location";
  const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
  const GEOLOCATION_TIMEOUT = 10000; // 10 seconds

  const LOCATION_TYPE_IP = "ip_detected";
  const LOCATION_TYPE_GPS = "gps_location";
  const LOCATION_TYPE_MANUAL = "manual_selection";
  const LOCATION_TYPE_DEFAULT = "default_fallback";

  // State
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [availableLocations, setAvailableLocations] = useState([]);
  const [locationsLoading, setLocationsLoading] = useState(true);
  const [ipLocation, setIpLocation] = useState(null);
  const [gpsLocation, setGpsLocation] = useState(null);
  const [userPreferredLocation, setUserPreferredLocation] = useState(null);

  // 1. IP Location Detection
  const detectIpLocation = useCallback(async () => {
    try {
      // Check cache first
      const cached = localStorage.getItem(IP_LOCATION_KEY);
      if (cached) {
        const { data, timestamp } = JSON.parse(cached);
        if (Date.now() - timestamp < CACHE_DURATION) {
          return data;
        }
      }

      // Fallback services (try multiple for reliability)
      const services = [
        "https://ipapi.co/json/",
        "https://api.ipgeolocation.io/ipgeo?apiKey=free",
        "https://ipwhois.app/json/",
      ];

      for (const url of services) {
        try {
          const response = await axios.get(url, { timeout: 3000 });
          const data = response.data;

          if (data.city && data.country) {
            const location = {
              city: data.city.toLowerCase(),
              region: data.region || data.state || "",
              country: data.country_name || data.country,
              name: `${data.city}, ${
                data.region || data.country_name || data.country
              }`,
              lat: data.latitude || data.lat,
              lng: data.longitude || data.lng || data.lon,
              type: LOCATION_TYPE_IP,
            };

            localStorage.setItem(
              IP_LOCATION_KEY,
              JSON.stringify({
                data: location,
                timestamp: Date.now(),
              })
            );

            return location;
          }
        } catch (e) {
          console.warn(`IP service failed (${url}):`, e);
          continue;
        }
      }

      throw new Error("All IP services failed");
    } catch (error) {
      console.error("IP detection failed:", error);
      return null;
    }
  }, [CACHE_DURATION]);

  // 2. GPS Location Detection
  const detectGpsLocation = useCallback(async () => {
    if (!navigator.geolocation) {
      throw new Error("Geolocation not supported");
    }

    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const { latitude, longitude } = position.coords;

            // Try multiple reverse geocoding services to avoid CORS issues
            const reverseGeocodingServices = [
              // Service 1: OpenCage (if you have API key)
              // `https://api.opencagedata.com/geocode/v1/json?q=${latitude}+${longitude}&key=YOUR_API_KEY`,

              // Service 2: BigDataCloud (free, no API key needed)
              `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`,

              // Service 3: Nominatim with different approach
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=10&addressdetails=1`,
            ];

            let location = null;

            // Try BigDataCloud first (most reliable for CORS)
            try {
              const response = await axios.get(reverseGeocodingServices[0], {
                timeout: 5000,
                headers: {
                  Accept: "application/json",
                },
              });

              const data = response.data;
              if (data.city || data.locality) {
                location = {
                  city: data.city || data.locality || "Current Location",
                  region: data.principalSubdivision || data.countryName || "",
                  country: data.countryName || "",
                  name: `${data.city || data.locality || "Current Location"}, ${
                    data.principalSubdivision || data.countryName || ""
                  }`
                    .replace(", ", ", ")
                    .trim(),
                  lat: latitude,
                  lng: longitude,
                  type: LOCATION_TYPE_GPS,
                };
              }
            } catch (error) {
              console.warn("BigDataCloud geocoding failed:", error);
            }

            // Fallback to Nominatim if BigDataCloud fails
            if (!location) {
              try {
                const response = await axios.get(reverseGeocodingServices[1], {
                  timeout: 5000,
                  headers: {
                    "User-Agent": "LocalCart-App",
                    Accept: "application/json",
                  },
                });

                const address = response.data.address;
                if (address) {
                  location = {
                    city:
                      address.city ||
                      address.town ||
                      address.village ||
                      "Current Location",
                    region: address.state || address.region || "",
                    country: address.country || "",
                    name: `${
                      address.city ||
                      address.town ||
                      address.village ||
                      "Current Location"
                    }, ${address.state || address.region || ""}`
                      .replace(", ", ", ")
                      .trim(),
                    lat: latitude,
                    lng: longitude,
                    type: LOCATION_TYPE_GPS,
                  };
                }
              } catch (error) {
                console.warn("Nominatim geocoding failed:", error);
              }
            }

            // If all reverse geocoding fails, use coordinates only
            if (!location) {
              location = {
                city: "current_location",
                name: "Current Location",
                lat: latitude,
                lng: longitude,
                type: LOCATION_TYPE_GPS,
              };
            }

            resolve(location);
          } catch (error) {
            // Final fallback
            resolve({
              city: "current_location",
              name: "Current Location",
              lat: position.coords.latitude,
              lng: position.coords.longitude,
              type: LOCATION_TYPE_GPS,
            });
          }
        },
        (error) => {
          reject(
            new Error(
              error.code === error.PERMISSION_DENIED
                ? "Location permission denied"
                : "Couldn't retrieve location"
            )
          );
        },
        {
          enableHighAccuracy: false,
          timeout: GEOLOCATION_TIMEOUT,
          maximumAge: 300000, // 5 minute cache
        }
      );
    });
  }, [GEOLOCATION_TIMEOUT]);

  // 3. Fetch Available Locations (Vendor Areas)
  const fetchAvailableLocations = useCallback(async () => {
    try {
      // Check cache
      const cached = localStorage.getItem(LOCATIONS_CACHE_KEY);
      if (cached) {
        const { data, timestamp } = JSON.parse(cached);
        if (Date.now() - timestamp < CACHE_DURATION) {
          console.log("Using cached available locations.");
          return data;
        }
      }

      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/locations/service-areas `
      );
      const locations = response.data?.data?.locations || [];

      const formatted = locations
        .filter((loc) => loc && loc.city) // Filter out null/undefined locs or those missing 'city'
        .map((loc) => ({
          name: String(loc.city), // Ensure name is always a string
          city: String(loc.city).toLowerCase(), // Ensure city is always a string and lowercase
          lat:
            loc.coordinates && loc.coordinates.length === 2
              ? loc.coordinates[1]
              : undefined,
          lng:
            loc.coordinates && loc.coordinates.length === 2
              ? loc.coordinates[0]
              : undefined,
          type: LOCATION_TYPE_MANUAL,
        }));

      console.log("Fetched and formatted available locations:", formatted);

      localStorage.setItem(
        LOCATIONS_CACHE_KEY,
        JSON.stringify({
          data: formatted,
          timestamp: Date.now(),
        })
      );

      return formatted;
    } catch (error) {
      console.error("Failed to fetch locations:", error);
      return [];
    }
  }, [CACHE_DURATION]);
  // 4. Location Initialization
  const initializeLocation = useCallback(async () => {
    setLocationsLoading(true);

    try {
      // Step 1: Fetch available vendor locations
      const vendorLocations = await fetchAvailableLocations();
      setAvailableLocations(vendorLocations);

      // Step 2: Check saved user preference
      const savedLocation = localStorage.getItem(USER_LOCATION_KEY);
      if (savedLocation) {
        const parsed = JSON.parse(savedLocation);
        if (parsed?.name) {
          setSelectedLocation(parsed);
          setUserPreferredLocation(parsed);
          setLocationsLoading(false);
          return;
        }
      }

      // Step 3: Try IP detection
      const ipLoc = await detectIpLocation();
      if (ipLoc) {
        setIpLocation(ipLoc);

        // Find matching vendor location
        const match = vendorLocations.find(
          (loc) =>
            loc.city === ipLoc.city ||
            loc.name.toLowerCase().includes(ipLoc.city)
        );

        setSelectedLocation(match || ipLoc);
        setLocationsLoading(false);
        return;
      }

      // Step 4: Final fallback
      setSelectedLocation(
        vendorLocations[0] || {
          name: "Default Location",
          city: "default",
          type: LOCATION_TYPE_DEFAULT,
        }
      );
    } catch (error) {
      console.error("Location init failed:", error);
      setSelectedLocation({
        name: "Default Location",
        city: "default",
        type: LOCATION_TYPE_DEFAULT,
      });
    } finally {
      setLocationsLoading(false);
    }
  }, [fetchAvailableLocations, detectIpLocation]);

  // 5. Update User Location
  const updateUserLocation = useCallback(
    async (location) => {
      if (!location) return;

      try {
        let finalLocation = location;

        // Handle "Use Current Location" case
        if (
          location.type === LOCATION_TYPE_GPS ||
          location.city === "current_location"
        ) {
          const gpsLoc = await detectGpsLocation();
          finalLocation = gpsLoc;
          setGpsLocation(gpsLoc);
          toast.success("Location updated to your current position!");
        }

        // Save preference
        localStorage.setItem(USER_LOCATION_KEY, JSON.stringify(finalLocation));
        setSelectedLocation(finalLocation);
        setUserPreferredLocation(finalLocation);
      } catch (error) {
        toast.error(error.message);
        console.error("Location update failed:", error);
      }
    },
    [detectGpsLocation]
  );

  // Initialize on mount
  useEffect(() => {
    initializeLocation();
  }, [initializeLocation]);

  const contextValue = useMemo(
    () => ({
      selectedLocation,
      availableLocations,
      locationsLoading,
      ipLocation,
      gpsLocation,
      userPreferredLocation,
      updateUserLocation,
      detectGpsLocation,
      LOCATION_TYPE_IP,
      LOCATION_TYPE_GPS,
      LOCATION_TYPE_MANUAL,
      LOCATION_TYPE_DEFAULT,
    }),
    [
      selectedLocation,
      availableLocations,
      locationsLoading,
      ipLocation,
      gpsLocation,
      userPreferredLocation,
      updateUserLocation,
      detectGpsLocation, 
    ]
  );

  return (
    <LocationContext.Provider value={contextValue}>
      {children}
    </LocationContext.Provider>
  );
};
