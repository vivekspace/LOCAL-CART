import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const MapComponent = ({
  lat,
  lng,
  zoom = 13,
  height = '400px',
  markers = [],
  popupText = 'Location',
  showControls = true,
  scrollWheelZoom = true,
  doubleClickZoom = true,
  dragging = true,
  theme = 'light', // 'light' | 'dark' | 'satellite' | 'topographic'
  onMapClick,
  onMarkerClick,
  className = ''
}) => {
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const markerGroup = useRef(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentTheme, setCurrentTheme] = useState(theme);

  // Theme configurations
  const themes = {
    light: {
      url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    },
    dark: {
      url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
    },
    satellite: {
      url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
    },
    topographic: {
      url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
      attribution: 'Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, <a href="http://viewfinderpanoramas.org">SRTM</a> | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a> (<a href="https://creativecommons.org/licenses/by-sa/3.0/">CC-BY-SA</a>)'
    }
  };

  // Custom marker icon
  const createCustomIcon = (color = '#3388ff') => {
    return L.divIcon({
      className: 'custom-marker',
      html: `
        <svg viewBox="0 0 24 24" width="24" height="24" xmlns="http://www.w3.org/2000/svg">
          <path fill="${color}" stroke="#ffffff" stroke-width="1.5" d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
        </svg>
      `,
      iconSize: [24, 24],
      iconAnchor: [12, 24],
      popupAnchor: [0, -24]
    });
  };

  // Initialize map
  useEffect(() => {
    if (!mapRef.current || !lat || !lng) return;

    setIsLoading(true);

    // If a map instance already exists, remove it before creating a new one
    if (mapInstance.current) {
      mapInstance.current.remove();
    }

    // Create map instance
    mapInstance.current = L.map(mapRef.current, {
      zoomControl: false,
      attributionControl: false,
      scrollWheelZoom,
      doubleClickZoom,
      dragging
    }).setView([lat, lng], zoom);

    // Add tile layer
    L.tileLayer(themes[currentTheme].url, {
      attribution: themes[currentTheme].attribution,
      maxZoom: 19,
      detectRetina: true
    }).addTo(mapInstance.current);

    // Add marker group
    markerGroup.current = L.layerGroup().addTo(mapInstance.current);

    // Add main marker
    const mainMarker = L.marker([lat, lng], {
      icon: createCustomIcon(),
      zIndexOffset: 1000 // Ensure this marker is on top of other map elements
    }).addTo(markerGroup.current);

    mainMarker.bindPopup(`
      <div class="p-1">
        <h4 class="font-semibold text-sm">${popupText}</h4>
        <p class="text-xs text-gray-600">${lat.toFixed(4)}, ${lng.toFixed(4)}</p>
      </div>
    `).openPopup();

    // Add additional markers
    markers.forEach(marker => {
      const m = L.marker([marker.lat, marker.lng], {
        icon: createCustomIcon(marker.color),
        ...(marker.draggable && { draggable: true })
      }).addTo(markerGroup.current);

      if (marker.popup) {
        m.bindPopup(marker.popup);
      }

      if (onMarkerClick) {
        m.on('click', () => onMarkerClick(marker));
      }
    });

    // Add controls
    if (showControls) {
      L.control.zoom({ position: 'topright' }).addTo(mapInstance.current);
      L.control.attribution({ position: 'bottomright' }).addTo(mapInstance.current);
      L.control.scale({ position: 'bottomleft' }).addTo(mapInstance.current);
    }

    // Add click handler
    if (onMapClick) {
      mapInstance.current.on('click', e => {
        onMapClick({
          lat: e.latlng.lat,
          lng: e.latlng.lng
        });
      });
    }

    // Add location circle
    L.circle([lat, lng], {
      color: '#3388ff',
      fillColor: '#3388ff',
      fillOpacity: 0.1,
      radius: 500
    }).addTo(mapInstance.current);

    mapInstance.current.whenReady(() => setIsLoading(false));

    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, [currentTheme, lat, lng, zoom, markers, popupText, showControls, scrollWheelZoom, doubleClickZoom, dragging, onMapClick, onMarkerClick]); // Added all dependencies for useEffect

  // Theme switcher control
  const renderThemeSwitcher = () => (
    // Changed 'right-4' to 'left-4'
    <div className="absolute top-4 left-4 z-[1000] bg-white p-1 rounded-md shadow-md flex gap-1">
      {Object.keys(themes).map(themeKey => (
        <button
          key={themeKey}
          onClick={() => setCurrentTheme(themeKey)}
          className={`w-6 h-6 rounded-sm ${currentTheme === themeKey ? 'ring-2 ring-blue-500' : ''}`}
          style={{
            background: themeKey === 'dark' ? '#333' : 
                        themeKey === 'satellite' ? '#2d6a4f' : 
                        themeKey === 'topographic' ? '#6b7280' : '#f3f4f6'
          }}
          title={`${themeKey} theme`}
        />
      ))}
    </div>
  );

  if (!lat || !lng) {
    return (
      <div className={`flex items-center justify-center bg-gray-100 ${className}`} style={{ height }}>
        <div className="text-center">
          <svg className="mx-auto h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="mt-2 text-sm text-gray-500">Location not available</p>
        </div>
      </div>
    );
  }

  return (
    // Added z-10 to the main container to ensure it sits below elements with higher z-index (like navbars/chatbots)
    <div className={`relative rounded-xl overflow-hidden z-10 ${className}`} style={{ height }}>
      {isLoading && (
        <div className="absolute inset-0 bg-white bg-opacity-70 flex items-center justify-center z-[1000]">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      )}
      
      {showControls && renderThemeSwitcher()}
      
      <div 
        ref={mapRef} 
        className="w-full h-full z-0" // Ensure the actual map div has a lower z-index than its parent if needed
      />
      
      <style jsx global>{`
        .leaflet-container {
          background-color: #f8fafc !important;
        }
        .custom-marker {
          background: transparent !important;
          border: none !important;
        }
        .leaflet-popup-content-wrapper {
          border-radius: 8px !important;
          box-shadow: 0 3px 10px rgba(0,0,0,0.2) !important;
          padding: 0 !important;
        }
        .leaflet-popup-content {
          margin: 0 !important;
          min-width: 120px;
        }
        .leaflet-control-attribution {
        display:none;
          background: rgba(255,255,255,0.8) !important;
          font-size: 10px !important;
        }
        .leaflet-control-zoom a {
          width: 30px !important;
          height: 30px !important;
          line-height: 30px !important;
          font-size: 18px !important;
        }
      `}</style>
    </div>
  );
};

export default MapComponent;
