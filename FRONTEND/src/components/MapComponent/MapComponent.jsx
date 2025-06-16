import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const MapComponent = ({ 
  lat, 
  lng, 
  markers = [], 
  zoom = 13, 
  height = '400px',
  width = '100%',
  showZoomControls = true,
  showFullscreenButton = true,
  showScaleControl = true,
  showAttribution = true,
  showMarkerCluster = true,
  draggable = false,
  scrollWheelZoom = true,
  doubleClickZoom = true,
  touchZoom = true,
  theme = 'default', // 'default', 'dark', 'satellite', 'topo', 'light'
  markerColor = '#22c55e',
  popupText = 'Product Location',
  className = '',
  onMapClick = null,
  onMarkerClick = null,
  customTileLayer = null,
  initialBounds = null,
  maxZoom = 19,
  minZoom = 1,
  loadingComponent = null,
  errorComponent = null,
  noLocationComponent = null
}) => {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerClusterRef = useRef(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [mapError, setMapError] = useState(false);
  const [currentTheme, setCurrentTheme] = useState(theme);

  // Load marker clustering if enabled
  useEffect(() => {
    if (showMarkerCluster) {
      const loadCluster = async () => {
        try {
          const { default: markerClusterGroup } = await import('leaflet.markercluster');
          markerClusterRef.current = markerClusterGroup;
        } catch (err) {
          console.warn('Failed to load marker clustering:', err);
        }
      };
      loadCluster();
    }
  }, [showMarkerCluster]);

  // Custom marker icons with better performance
  const createCustomIcon = (color = markerColor) => {
    return L.divIcon({
      className: 'custom-marker',
      html: `
        <svg viewBox="0 0 24 24" width="24" height="24" xmlns="http://www.w3.org/2000/svg">
          <path 
            fill="${color}" 
            stroke="white" 
            stroke-width="2" 
            d="M12 0C7.2 0 3 4.2 3 9c0 5.3 7.5 13.7 8.2 14.4.3.3.7.5 1.1.5h.4c.4-.1.7-.3 1-.6.7-.7 8.2-9.1 8.2-14.4C21 4.2 16.8 0 12 0zm0 14c-2.8 0-5-2.2-5-5s2.2-5 5-5 5 2.2 5 5-2.2 5-5 5z"
          />
          <circle fill="white" cx="12" cy="9" r="3"/>
        </svg>
      `,
      iconSize: [24, 24],
      iconAnchor: [12, 24],
      popupAnchor: [0, -24]
    });
  };

  // More tile layer options with better caching
  const getTileLayer = (theme) => {
    const layers = {
      'dark': {
        url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 20
      },
      'satellite': {
        url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
        maxZoom: 19
      },
      'topo': {
        url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
        attribution: 'Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, <a href="http://viewfinderpanoramas.org">SRTM</a> | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a> (<a href="https://creativecommons.org/licenses/by-sa/3.0/">CC-BY-SA</a>)',
        maxZoom: 17
      },
      'light': {
        url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 20
      },
      'default': {
        url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19
      }
    };

    return customTileLayer || layers[theme] || layers.default;
  };

  // Fullscreen handling with better cross-browser support
  const toggleFullscreen = () => {
    if (!isFullscreen) {
      const elem = mapRef.current;
      if (elem.requestFullscreen) {
        elem.requestFullscreen();
      } else if (elem.webkitRequestFullscreen) {
        elem.webkitRequestFullscreen();
      } else if (elem.msRequestFullscreen) {
        elem.msRequestFullscreen();
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
  };

  // Handle fullscreen change events
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('msfullscreenchange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('msfullscreenchange', handleFullscreenChange);
    };
  }, []);

  // Main map initialization and update logic
  useEffect(() => {
    if (!lat || !lng || !mapRef.current) return;

    const initializeMap = async () => {
      try {
        setIsLoading(true);
        setMapError(false);

        // Create map instance with enhanced options
        const mapInstance = L.map(mapRef.current, {
          zoomControl: false, // We'll add this manually for better control
          attributionControl: showAttribution,
          scrollWheelZoom,
          doubleClickZoom,
          touchZoom,
          dragging: draggable,
          fadeAnimation: true,
          zoomAnimation: true,
          markerZoomAnimation: true,
          maxZoom,
          minZoom,
          maxBounds: initialBounds,
          maxBoundsViscosity: 0.5
        }).setView([lat, lng], zoom);

        mapInstanceRef.current = mapInstance;

        // Add tile layer with caching options
        const tileLayerOptions = getTileLayer(currentTheme);
        L.tileLayer(tileLayerOptions.url, {
          attribution: tileLayerOptions.attribution,
          maxZoom: tileLayerOptions.maxZoom || maxZoom,
          minZoom: tileLayerOptions.minZoom || minZoom,
          subdomains: tileLayerOptions.subdomains || 'abc',
          detectRetina: true,
          crossOrigin: true,
          reuseTiles: true,
          updateWhenIdle: true
        }).addTo(mapInstance);

        // Add zoom control if enabled
        if (showZoomControls) {
          L.control.zoom({
            position: 'topright',
            zoomInText: '+',
            zoomInTitle: 'Zoom in',
            zoomOutText: '-',
            zoomOutTitle: 'Zoom out'
          }).addTo(mapInstance);
        }

        // Add scale control if enabled
        if (showScaleControl) {
          L.control.scale({
            position: 'bottomleft',
            imperial: false,
            maxWidth: 200
          }).addTo(mapInstance);
        }

        // Initialize marker cluster if enabled
        let markerCluster = null;
        if (showMarkerCluster && markerClusterRef.current) {
          markerCluster = new markerClusterRef.current({
            spiderfyOnMaxZoom: true,
            showCoverageOnHover: false,
            zoomToBoundsOnClick: true,
            maxClusterRadius: 40,
            iconCreateFunction: (cluster) => {
              const childCount = cluster.getChildCount();
              return L.divIcon({
                html: `<div style="
                  background-color: rgba(${parseInt(markerColor.slice(1, 3), 16)}, ${parseInt(markerColor.slice(3, 5), 16)}, ${parseInt(markerColor.slice(5, 7), 16)}, 0.6);
                  color: white;
                  width: 36px;
                  height: 36px;
                  border-radius: 50%;
                  border: 2px solid white;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  font-weight: bold;
                  font-size: 12px;
                ">${childCount}</div>`,
                className: 'marker-cluster-custom',
                iconSize: L.point(36, 36)
              });
            }
          }).addTo(mapInstance);
        }

        // Add main marker with custom icon
        const mainMarker = L.marker([lat, lng], {
          icon: createCustomIcon(markerColor),
          draggable: draggable,
          autoPan: true
        }).addTo(markerCluster || mapInstance);

        // Enhanced popup with better accessibility
        const popupContent = `
          <div class="leaflet-popup-content-wrapper">
            <div class="leaflet-popup-content">
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
                  ${lat.toFixed(6)}, ${lng.toFixed(6)}
                </div>
              </div>
            </div>
          </div>
        `;

        mainMarker.bindPopup(popupContent, {
          closeButton: true,
          autoClose: false,
          className: 'custom-popup',
          maxWidth: 300,
          minWidth: 150
        }).openPopup();

        // Add additional markers with event handlers
        markers.forEach(marker => {
          const markerInstance = L.marker([marker.lat, marker.lng], {
            icon: createCustomIcon(marker.color || '#6b7280'),
            draggable: marker.draggable || false
          });

          if (marker.popupText) {
            markerInstance.bindPopup(marker.popupText, {
              className: 'custom-popup'
            });
          }

          if (onMarkerClick) {
            markerInstance.on('click', () => onMarkerClick(marker));
          }

          if (markerCluster) {
            markerCluster.addLayer(markerInstance);
          } else {
            markerInstance.addTo(mapInstance);
          }
        });

        // Add a subtle circle around the main location with better visibility
        L.circle([lat, lng], {
          color: markerColor,
          fillColor: markerColor,
          fillOpacity: 0.1,
          radius: 500,
          weight: 2,
          opacity: 0.5,
          interactive: false
        }).addTo(mapInstance);

        // Add click handler if provided
        if (onMapClick) {
          mapInstance.on('click', (e) => {
            onMapClick({
              lat: e.latlng.lat,
              lng: e.latlng.lng
            });
          });
        }

        // Fit bounds if provided
        if (initialBounds) {
          mapInstance.fitBounds(initialBounds, {
            padding: [50, 50],
            maxZoom: zoom
          });
        }

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
    };

    initializeMap();

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [
    lat, 
    lng, 
    markers, 
    zoom, 
    currentTheme, 
    markerColor, 
    popupText, 
    showZoomControls,
    showAttribution,
    showScaleControl,
    showMarkerCluster,
    draggable,
    scrollWheelZoom,
    doubleClickZoom,
    touchZoom,
    onMapClick,
    onMarkerClick,
    customTileLayer,
    initialBounds,
    maxZoom,
    minZoom
  ]);

  // Theme switcher control
  const renderThemeSwitcher = () => {
    const themes = [
      { name: 'Default', value: 'default' },
      { name: 'Dark', value: 'dark' },
      { name: 'Satellite', value: 'satellite' },
      { name: 'Topo', value: 'topo' },
      { name: 'Light', value: 'light' }
    ];

    return (
      <div className="bg-white rounded-lg shadow-md p-1 flex">
        {themes.map((t) => (
          <button
            key={t.value}
            onClick={() => setCurrentTheme(t.value)}
            className={`p-1 rounded-md ${currentTheme === t.value ? 'bg-gray-100' : 'hover:bg-gray-50'}`}
            title={`Switch to ${t.name} theme`}
          >
            <div className={`w-4 h-4 rounded-sm ${t.value === 'default' ? 'bg-blue-500' : ''} ${t.value === 'dark' ? 'bg-gray-800' : ''} ${t.value === 'satellite' ? 'bg-green-700' : ''} ${t.value === 'topo' ? 'bg-brown-500' : ''} ${t.value === 'light' ? 'bg-gray-200' : ''}`}></div>
          </button>
        ))}
      </div>
    );
  };

  // Custom loading component
  if (isLoading && loadingComponent) {
    return loadingComponent;
  }

  // Custom error component
  if (mapError && errorComponent) {
    return errorComponent;
  }

  // Custom no location component
  if ((!lat || !lng) && noLocationComponent) {
    return noLocationComponent;
  }

  // Default no location state
  if (!lat || !lng) {
    return (
      <div className={`flex items-center justify-center bg-gray-100 rounded-lg ${className}`} 
           style={{ height, width }}>
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

  // Default error state
  if (mapError) {
    return (
      <div className={`flex items-center justify-center bg-red-50 rounded-lg border border-red-200 ${className}`} 
           style={{ height, width }}>
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
    <div className={`relative rounded-lg overflow-hidden shadow-lg ${className}`} style={{ width, height }}>
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
            aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
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
        
        {/* Theme switcher */}
        {renderThemeSwitcher()}
      </div>

      {/* Map container */}
      <div
        ref={mapRef}
        className="w-full h-full transition-all duration-300"
        aria-label="Interactive map"
        role="application"
      />

      {/* Custom CSS for map styling */}
      <style jsx global>{`
        .custom-popup .leaflet-popup-content-wrapper {
          background: white;
          border-radius: 8px;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
          border: 1px solid #e5e7eb;
          padding: 0;
          overflow: hidden;
        }
        
        .custom-popup .leaflet-popup-content {
          margin: 0;
          padding: 0;
          line-height: 1.4;
        }
        
        .custom-popup .leaflet-popup-tip {
          background: white;
          border: 1px solid #e5e7eb;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }
        
        .leaflet-control-zoom {
          border: none !important;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06) !important;
          margin-right: 10px !important;
          margin-top: 10px !important;
        }
        
        .leaflet-control-zoom a {
          background: white !important;
          border: 1px solid #e5e7eb !important;
          color: #374151 !important;
          font-weight: bold !important;
          transition: all 0.2s ease !important;
          width: 30px !important;
          height: 30px !important;
          line-height: 30px !important;
        }
        
        .leaflet-control-zoom a:hover {
          background: #f9fafb !important;
          border-color: #d1d5db !important;
        }
        
        .leaflet-control-attribution {
          background: rgba(255, 255, 255, 0.9) !important;
          border-radius: 4px !important;
          font-size: 10px !important;
          padding: 2px 5px !important;
        }
        
        .leaflet-control-scale {
          background: rgba(255, 255, 255, 0.8) !important;
          border: 2px solid rgba(0, 0, 0, 0.2) !important;
          border-radius: 4px !important;
          padding: 2px 5px 2px 5px !important;
        }
        
        .marker-cluster-custom {
          background-clip: padding-box;
          border-radius: 20px;
        }
        
        .marker-cluster-custom div {
          width: 30px;
          height: 30px;
          margin-left: 3px;
          margin-top: 3px;
          text-align: center;
          border-radius: 15px;
          font-weight: bold;
        }
        
        .leaflet-div-icon {
          background: transparent !important;
          border: none !important;
        }
        
        .leaflet-marker-icon {
          transition: transform 0.2s ease;
        }
        
        .leaflet-marker-icon:hover {
          transform: scale(1.2);
        }
      `}</style>
    </div>
  );
};

export default MapComponent;