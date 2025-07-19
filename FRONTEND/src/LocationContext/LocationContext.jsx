// LocationContext.js - Optimized Version
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
  const GEOLOCATION_TIMEOUT = 8000; // Reduced to 8 seconds
  const IP_DETECTION_TIMEOUT = 4000; // 4 seconds max for IP detection

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

  // 1. OPTIMIZED IP Location Detection - Parallel requests
  const detectIpLocation = useCallback(async () => {
    try {
      // Check cache first
      const cached = localStorage.getItem(IP_LOCATION_KEY);
      if (cached) {
        const { data, timestamp } = JSON.parse(cached);
        if (Date.now() - timestamp < CACHE_DURATION) {
          console.log("Using cached IP location");
          return data;
        }
      }

      // Use fastest and most reliable services with parallel requests
      const services = [
        "https://ipapi.co/json/",
        "https://api.ipgeolocation.io/ipgeo?apiKey=free",
        // Remove unreliable service that might cause delays
      ];

      // Race multiple services - use whichever responds first
      const racePromises = services.map(async (url) => {
        try {
          const response = await axios.get(url, { 
            timeout: IP_DETECTION_TIMEOUT / 2 // 2 seconds per service
          });
          const data = response.data;

          if (data.city && data.country) {
            return {
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
          }
          throw new Error("Invalid data format");
        } catch (e) {
          throw new Error(`Service ${url} failed: ${e.message}`);
        }
      });

      // Add a timeout promise
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("IP detection timeout")), IP_DETECTION_TIMEOUT)
      );

      // Race all promises including timeout
      const location = await Promise.race([
        Promise.any(racePromises), // Resolves with first successful result
        timeoutPromise
      ]);

      // Cache successful result
      localStorage.setItem(
        IP_LOCATION_KEY,
        JSON.stringify({
          data: location,
          timestamp: Date.now(),
        })
      );

      return location;

    } catch (error) {
      console.warn("IP detection failed:", error.message);
      return null;
    }
  }, [CACHE_DURATION, IP_DETECTION_TIMEOUT]);

  // 2. SIMPLIFIED GPS Location Detection
  const detectGpsLocation = useCallback(async () => {
    if (!navigator.geolocation) {
      throw new Error("Geolocation not supported");
    }

    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const { latitude, longitude } = position.coords;

            // Use only the most reliable reverse geocoding service
            try {
              const response = await axios.get(
                `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`,
                {
                  timeout: 3000, // Reduced timeout
                  headers: { Accept: "application/json" },
                }
              );

              const data = response.data;
              if (data.city || data.locality) {
                const location = {
                  city: data.city || data.locality || "Current Location",
                  region: data.principalSubdivision || data.countryName || "",
                  country: data.countryName || "",
                  name: `${data.city || data.locality || "Current Location"}, ${
                    data.principalSubdivision || data.countryName || ""
                  }`.replace(", ", ", ").trim(),
                  lat: latitude,
                  lng: longitude,
                  type: LOCATION_TYPE_GPS,
                };
                resolve(location);
                return;
              }
            } catch (error) {
              console.warn("Reverse geocoding failed:", error);
            }

            // Fallback location without reverse geocoding
            resolve({
              city: "current_location",
              name: "Current Location",
              lat: latitude,
              lng: longitude,
              type: LOCATION_TYPE_GPS,
            });

          } catch (error) {
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
          enableHighAccuracy: false, // Faster response
          timeout: GEOLOCATION_TIMEOUT,
          maximumAge: 600000, // 10 minute cache (increased)
        }
      );
    });
  }, [GEOLOCATION_TIMEOUT]);

  // 3. Fetch Available Locations (Same as before but with error handling)
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
        `${import.meta.env.VITE_API_URL}/api/locations/service-areas`,
        { timeout: 5000 } // Add timeout
      );
      const locations = response.data?.data?.locations || [];

      const formatted = locations
        .filter((loc) => loc && loc.city)
        .map((loc) => ({
          name: String(loc.city),
          city: String(loc.city).toLowerCase(),
          lat: loc.coordinates?.length === 2 ? loc.coordinates[1] : undefined,
          lng: loc.coordinates?.length === 2 ? loc.coordinates[0] : undefined,
          type: LOCATION_TYPE_MANUAL,
        }));

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
      // Return cached data even if expired, as fallback
      const cached = localStorage.getItem(LOCATIONS_CACHE_KEY);
      if (cached) {
        try {
          const { data } = JSON.parse(cached);
          console.log("Using expired cached locations as fallback");
          return data;
        } catch (e) {
          console.error("Failed to parse cached locations:", e);
        }
      }
      return [];
    }
  }, [CACHE_DURATION]);

  // 4. OPTIMIZED Location Initialization - Show results immediately
  const initializeLocation = useCallback(async () => {
    setLocationsLoading(true);

    try {
      // Step 1: Check saved user preference first (INSTANT)
      const savedLocation = localStorage.getItem(USER_LOCATION_KEY);
      if (savedLocation) {
        try {
          const parsed = JSON.parse(savedLocation);
          if (parsed?.name) {
            console.log("Using saved user preference");
            setSelectedLocation(parsed);
            setUserPreferredLocation(parsed);
            setLocationsLoading(false);
            
            // Still fetch available locations in background for dropdown
            fetchAvailableLocations().then(setAvailableLocations);
            return;
          }
        } catch (e) {
          console.error("Failed to parse saved location:", e);
          localStorage.removeItem(USER_LOCATION_KEY);
        }
      }

      // Step 2: Start fetching available locations (parallel with IP detection)
      const vendorLocationsPromise = fetchAvailableLocations();
      const ipLocationPromise = detectIpLocation();

      // Wait for both with a reasonable timeout
      const [vendorLocations, ipLoc] = await Promise.allSettled([
        vendorLocationsPromise,
        ipLocationPromise
      ]);

      const locations = vendorLocations.status === 'fulfilled' ? vendorLocations.value : [];
      const ipLocation = ipLoc.status === 'fulfilled' ? ipLoc.value : null;

      setAvailableLocations(locations);

      if (ipLocation) {
        setIpLocation(ipLocation);
        
        // Try to match with vendor locations
        const match = locations.find(
          (loc) =>
            loc.city === ipLocation.city ||
            loc.name.toLowerCase().includes(ipLocation.city)
        );

        setSelectedLocation(match || ipLocation);
      } else {
        // Use first available location or default
        setSelectedLocation(
          locations[0] || {
            name: "Default Location",
            city: "default",
            type: LOCATION_TYPE_DEFAULT,
          }
        );
      }

    } catch (error) {
      console.error("Location initialization failed:", error);
      setSelectedLocation({
        name: "Default Location",
        city: "default",
        type: LOCATION_TYPE_DEFAULT,
      });
    } finally {
      setLocationsLoading(false);
    }
  }, [fetchAvailableLocations, detectIpLocation]);

  // 5. Update User Location (same but with better error handling)
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