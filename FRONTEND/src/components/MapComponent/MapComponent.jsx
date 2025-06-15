import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const MapComponent = ({ 
  lat, 
  lng, 
  markers = [], 
  zoom = 13, 
  height = '400px',
  showZoomControls = true,
  showFullscreenButton = true,
  theme = 'default', // 'default', 'dark', 'satellite'
  markerColor = '#22c55e', // Green color for markers
  popupText = 'Product Location',
  className = ''
}) => {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [mapError, setMapError] = useState(false);

  // Custom marker icons
  const createCustomIcon = (color = markerColor) => {
    return L.divIcon({
      className: 'custom-marker',
      html: `
        <div style="
          background-color: ${color};
          width: 24px;
          height: 24px;
          border-radius: 50% 50% 50% 0;
          transform: rotate(-45deg);
          border: 3px solid white;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
          position: relative;
        ">
          <div style="
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%) rotate(45deg);
            width: 8px;
            height: 8px;
            background-color: white;
            border-radius: 50%;
          "></div>
        </div>
      `,
      iconSize: [24, 24],
      iconAnchor: [12, 24],
      popupAnchor: [0, -24]
    });
  };

  // Different tile layer options
  const getTileLayer = (theme) => {
    switch (theme) {
      case 'dark':
        return {
          url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
        };
      case 'satellite':
        return {
          url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
          attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
        };
      default:
        return {
          url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        };
    }
  };

  const toggleFullscreen = () => {
    if (!isFullscreen) {
      if (mapRef.current.requestFullscreen) {
        mapRef.current.requestFullscreen();
      } else if (mapRef.current.webkitRequestFullscreen) {
        mapRef.current.webkitRequestFullscreen();
      } else if (mapRef.current.msRequestFullscreen) {
        mapRef.current.msRequestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
      } else if (document.msExitFullscreen) {
        document.msExitFullscreen();
      }
    }
    setIsFullscreen(!isFullscreen);
  };

  useEffect(() => {
    if (!lat || !lng || !mapRef.current) return;

    try {
      setIsLoading(true);
      setMapError(false);

      // Create map instance
      const mapInstance = L.map(mapRef.current, {
        zoomControl: showZoomControls,
        attributionControl: true,
        scrollWheelZoom: true,
        doubleClickZoom: true,
        touchZoom: true,
        dragging: true,
        fadeAnimation: true,
        zoomAnimation: true,
        markerZoomAnimation: true
      }).setView([lat, lng], zoom);

      mapInstanceRef.current = mapInstance;

      // Add tile layer based on theme
      const tileLayer = getTileLayer(theme);
      L.tileLayer(tileLayer.url, {
        attribution: tileLayer.attribution,
        maxZoom: 19,
        minZoom: 1,
      }).addTo(mapInstance);

      // Add main marker with custom icon
      const mainMarker = L.marker([lat, lng], {
        icon: createCustomIcon(markerColor)
      }).addTo(mapInstance);

      // Create custom popup
      const popupContent = `
        <div style="
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          padding: 8px 0;
          text-align: center;
          min-width: 120px;
        ">
          <div style="
            font-weight: 600;
            color: #1f2937;
            margin-bottom: 4px;
            font-size: 14px;
          ">${popupText}</div>
          <div style="
            font-size: 12px;
            color: #6b7280;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 4px;
          ">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
              <circle cx="12" cy="10" r="3"/>
            </svg>
            ${lat.toFixed(4)}, ${lng.toFixed(4)}
          </div>
        </div>
      `;

      mainMarker.bindPopup(popupContent, {
        closeButton: true,
        autoClose: false,
        className: 'custom-popup'
      }).openPopup();

      // Add additional markers
      markers.forEach(marker => {
        L.marker([marker.lat, marker.lng], {
          icon: createCustomIcon(marker.color || '#6b7280')
        })
          .addTo(mapInstance)
          .bindPopup(marker.popupText || 'Marker', {
            className: 'custom-popup'
          });
      });

      // Add a subtle circle around the main location
      L.circle([lat, lng], {
        color: markerColor,
        fillColor: markerColor,
        fillOpacity: 0.1,
        radius: 500,
        weight: 2,
        opacity: 0.3
      }).addTo(mapInstance);

      // Map loaded successfully
      mapInstance.whenReady(() => {
        setIsLoading(false);
      });

      // Handle map errors
      mapInstance.on('tileerror', () => {
        setMapError(true);
        setIsLoading(false);
      });

    } catch (error) {
      console.error('Map initialization error:', error);
      setMapError(true);
      setIsLoading(false);
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [lat, lng, markers, zoom, theme, markerColor, popupText, showZoomControls]);

  if (!lat || !lng) {
    return (
      <div className={`flex items-center justify-center bg-gray-100 rounded-lg ${className}`} 
           style={{ height }}>
        <div className="text-center">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                  d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <p className="mt-2 text-sm text-gray-500">Location not available</p>
        </div>
      </div>
    );
  }

  if (mapError) {
    return (
      <div className={`flex items-center justify-center bg-red-50 rounded-lg border border-red-200 ${className}`} 
           style={{ height }}>
        <div className="text-center">
          <svg className="mx-auto h-12 w-12 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <p className="mt-2 text-sm text-red-600">Failed to load map</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-2 text-xs text-red-500 hover:text-red-700 underline"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative rounded-lg overflow-hidden shadow-lg ${className}`}>
      {/* Loading overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-50">
          <div className="flex items-center space-x-2">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-600"></div>
            <span className="text-sm text-gray-600">Loading map...</span>
          </div>
        </div>
      )}

      {/* Map controls */}
      <div className="absolute top-4 right-4 z-40 flex flex-col space-y-2">
        {showFullscreenButton && (
          <button
            onClick={toggleFullscreen}
            className="bg-white hover:bg-gray-50 p-2 rounded-lg shadow-md border border-gray-200 transition-colors"
            title={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
          >
            <svg className="w-4 h-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              {isFullscreen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                      d="M9 9V4.5M9 9H4.5M9 9L3.5 3.5M15 9h4.5M15 9V4.5M15 9l5.5-5.5M9 15v4.5M9 15H4.5M9 15l-5.5 5.5M15 15h4.5M15 15v4.5m0-4.5l5.5 5.5" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                      d="M4 8V4m0 0h4M4 4l5 5M20 8V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5M20 16v4m0 0h-4m4 0l-5-5" />
              )}
            </svg>
          </button>
        )}
      </div>

      {/* Map container */}
      <div
        ref={mapRef}
        className="w-full transition-all duration-300"
        style={{ height }}
      />

      {/* Custom CSS for map styling */}
      <style jsx>{`
        .custom-popup .leaflet-popup-content-wrapper {
          background: white;
          border-radius: 8px;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
          border: 1px solid #e5e7eb;
        }
        
        .custom-popup .leaflet-popup-content {
          margin: 0;
          padding: 0;
        }
        
        .custom-popup .leaflet-popup-tip {
          background: white;
          border: 1px solid #e5e7eb;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }
        
        .leaflet-control-zoom {
          border: none !important;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06) !important;
        }
        
        .leaflet-control-zoom a {
          background: white !important;
          border: 1px solid #e5e7eb !important;
          color: #374151 !important;
          font-weight: bold !important;
          transition: all 0.2s ease !important;
        }
        
        .leaflet-control-zoom a:hover {
          background: #f9fafb !important;
          border-color: #d1d5db !important;
        }
        
        .leaflet-control-attribution {
          background: rgba(255, 255, 255, 0.9) !important;
          border-radius: 4px !important;
          font-size: 10px !important;
        }
      `}</style>
    </div>
  );
};

export default MapComponent;