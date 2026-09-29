/**
 * src/components/schoolMap.js
 * Interactive Google Maps & Vector Fallback Component for Premier Chinese Universities
 */
import { t } from '../i18n.js';

// High-Contrast Dark Theme styling for Google Maps (ultra-crisp typography & visible borders)
export const GOOGLE_MAPS_DARK_STYLE = [
  { elementType: "geometry", stylers: [{ color: "#212936" }] }, // High-contrast slate land
  { elementType: "labels.icon", stylers: [{ visibility: "off" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#ffffff" }] }, // High-contrast white text
  { elementType: "labels.text.stroke", stylers: [{ color: "#0f172a" }, { weight: 3.5 }] }, // Solid dark outline
  {
    featureType: "administrative",
    elementType: "geometry",
    stylers: [{ color: "#e5b045" }, { weight: 1.5 }] // Vibrant gold national borders
  },
  {
    featureType: "administrative.country",
    elementType: "labels.text.fill",
    stylers: [{ color: "#ffde00" }] // Gold country names
  },
  {
    featureType: "administrative.country",
    elementType: "labels.text.stroke",
    stylers: [{ color: "#0f172a" }, { weight: 4 }]
  },
  {
    featureType: "administrative.province",
    elementType: "geometry.stroke",
    stylers: [{ color: "#475569" }, { weight: 1.2 }] // Delineated Chinese province borders
  },
  {
    featureType: "administrative.locality",
    elementType: "labels.text.fill",
    stylers: [{ color: "#f8fafc" }] // Crisp city names
  },
  {
    featureType: "administrative.locality",
    elementType: "labels.text.stroke",
    stylers: [{ color: "#090d16" }, { weight: 3.5 }]
  },
  {
    featureType: "poi",
    elementType: "labels.text.fill",
    stylers: [{ color: "#94a3b8" }]
  },
  {
    featureType: "poi.park",
    elementType: "geometry",
    stylers: [{ color: "#162e24" }] // Distinct dark green
  },
  {
    featureType: "road",
    elementType: "geometry",
    stylers: [{ color: "#374151" }] // Clearly visible roads
  },
  {
    featureType: "road",
    elementType: "geometry.stroke",
    stylers: [{ color: "#1e293b" }]
  },
  {
    featureType: "road.highway",
    elementType: "geometry",
    stylers: [{ color: "#4b5563" }]
  },
  {
    featureType: "road.highway",
    elementType: "geometry.stroke",
    stylers: [{ color: "#0f172a" }]
  },
  {
    featureType: "road",
    elementType: "labels.text.fill",
    stylers: [{ color: "#e2e8f0" }]
  },
  {
    featureType: "transit",
    elementType: "geometry",
    stylers: [{ color: "#273449" }]
  },
  {
    featureType: "water",
    elementType: "geometry",
    stylers: [{ color: "#0c1726" }] // Distinct deep ocean blue
  },
  {
    featureType: "water",
    elementType: "labels.text.fill",
    stylers: [{ color: "#60a5fa" }] // Crisp water labels
  },
  {
    featureType: "water",
    elementType: "labels.text.stroke",
    stylers: [{ color: "#080e18" }, { weight: 3 }]
  }
];

let gmapInstance = null;
let markersMap = new Map();
let activeInfoWindow = null;
let currentMapMode = 'dark'; // 'dark' | 'satellite' | 'standard'

/**
 * Loads Google Maps JavaScript API dynamically if an API key is available
 */
export function loadGoogleMapsScript(apiKey) {
  if (typeof window === 'undefined') return Promise.reject(new Error('window is undefined'));
  if (window.google && window.google.maps && window.google.maps.Map) {
    return Promise.resolve(window.google.maps);
  }

  return new Promise((resolve, reject) => {
    // Listen for auth failures (e.g., API not enabled in Google Cloud Console, billing, or referrer restriction)
    window.gm_authFailure = () => {
      console.warn('[Google Maps] Authentification échouée. Vérifiez que "Maps JavaScript API" est activée dans votre Google Cloud Console pour cette clé.');
      reject(new Error('gm_authFailure'));
    };

    const callbackName = '__initGoogleMaps_' + Date.now().toString(36);
    window[callbackName] = () => {
      try {
        delete window[callbackName];
      } catch (_) {}
      if (window.google && window.google.maps && window.google.maps.Map) {
        resolve(window.google.maps);
      } else {
        reject(new Error('google.maps.Map not defined'));
      }
    };

    const existingScript = document.getElementById('google-maps-sdk');
    if (existingScript) {
      if (window.google && window.google.maps && window.google.maps.Map) {
        resolve(window.google.maps);
      } else {
        existingScript.addEventListener('load', () => {
          if (window.google && window.google.maps && window.google.maps.Map) {
            resolve(window.google.maps);
          } else {
            setTimeout(() => {
              if (window.google && window.google.maps && window.google.maps.Map) {
                resolve(window.google.maps);
              } else {
                reject(new Error('google.maps.Map not found'));
              }
            }, 300);
          }
        });
      }
      return;
    }

    const script = document.createElement('script');
    script.id = 'google-maps-sdk';
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}&v=weekly&callback=${callbackName}`;
    script.async = true;
    script.defer = true;
    script.onerror = (err) => reject(err);
    document.head.appendChild(script);
  });
}

/**
 * Renders the map container HTML
 */
export function renderSchoolMapMarkup() {
  return `
    <div class="school-map-container card" id="school-map-card">
      <div class="map-header-bar">
        <div class="map-title-wrap">
          <span class="map-badge-dot"></span>
          <span class="map-title-text">${t('Interactive University Map')}</span>
        </div>
        
        <!-- Header Actions -->
        <div class="map-actions-group">
          <button type="button" class="btn btn-ghost map-reset-view-btn" id="map-reset-view-btn" title="${t('Overview')}">
            <span>🗺️ ${t('Overview')}</span>
          </button>
        </div>
      </div>

      <!-- Active Selected University Mini Callout Bar -->
      <div class="map-active-callout" id="map-active-callout" style="display: none;">
        <span class="callout-star">★</span>
        <span class="callout-name" id="map-callout-name"></span>
        <span class="callout-city" id="map-callout-city"></span>
      </div>

      <!-- Map Display Area -->
      <div class="map-viewport" id="google-maps-viewport" tabindex="0" role="region" aria-label="Interactive Map of Chinese Universities">
        <div class="map-fallback-canvas" id="map-fallback-canvas"></div>
      </div>
    </div>
  `.trim();
}

export const DEFAULT_GMAPS_KEY = 'AIzaSyD3NQN4Mq9alnM9Wpvp_SMAilQ7sj-4nEA';

/**
 * Mounts the Interactive School Map component
 */
export function mountSchoolMap(containerEl, universities = []) {
  if (!containerEl) return null;

  const storedKey = (typeof window !== 'undefined' && (window.GOOGLE_MAPS_API_KEY || localStorage.getItem('china2027_gmaps_key'))) || DEFAULT_GMAPS_KEY;

  const resetBtn = containerEl.querySelector('#map-reset-view-btn');
  const viewport = containerEl.querySelector('#google-maps-viewport');
  const fallbackCanvas = containerEl.querySelector('#map-fallback-canvas');
  const callout = containerEl.querySelector('#map-active-callout');
  const calloutName = containerEl.querySelector('#map-callout-name');
  const calloutCity = containerEl.querySelector('#map-callout-city');

  // Southern-inclusive default center of China (comfortably covering Guangdong to Harbin)
  const defaultCenter = { lat: 32.5, lng: 113.5 };
  const defaultZoom = 4;

  let isGoogleMapsActive = false;

  const fitAllChinaBounds = (maps) => {
    if (!gmapInstance) return;
    const gmaps = maps || (window.google && window.google.maps);
    if (!gmaps || !gmaps.LatLngBounds) {
      gmapInstance.panTo(defaultCenter);
      gmapInstance.setZoom(defaultZoom);
      return;
    }

    const bounds = new gmaps.LatLngBounds();
    universities.forEach((u) => {
      if (u.coordinates) {
        bounds.extend(new gmaps.LatLng(u.coordinates.lat, u.coordinates.lng));
      }
    });

    // Explicit coordinate anchors ensuring South China (Guangdong, Greater Bay Area) and North (Harbin) are fully framed
    bounds.extend(new gmaps.LatLng(21.5, 113.0)); // Southern boundary buffer (Guangdong)
    bounds.extend(new gmaps.LatLng(46.0, 126.8)); // Northern boundary buffer (Heilongjiang)
    bounds.extend(new gmaps.LatLng(31.0, 102.5)); // Western buffer
    bounds.extend(new gmaps.LatLng(31.5, 122.0)); // Eastern buffer (Shanghai)

    gmapInstance.fitBounds(bounds, { top: 20, right: 20, bottom: 20, left: 20 });
  };

  const initGoogleMap = (maps) => {
    try {
      if (fallbackCanvas) fallbackCanvas.style.display = 'none';
      gmapInstance = new maps.Map(viewport, {
        center: defaultCenter,
        zoom: defaultZoom,
        styles: GOOGLE_MAPS_DARK_STYLE,
        disableDefaultUI: false,
        zoomControl: true,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: true,
        backgroundColor: '#1f2937'
      });

      markersMap.clear();

      universities.forEach((u) => {
        if (!u.coordinates) return;

        const isC9 = u.league && u.league.includes('C9');
        const marker = new maps.Marker({
          position: u.coordinates,
          map: gmapInstance,
          title: `${u.name} (${u.nameZh})`,
          icon: {
            path: maps.SymbolPath.CIRCLE,
            scale: 9,
            fillColor: isC9 ? '#FFDE00' : '#FF2A4A',
            fillOpacity: 1,
            strokeColor: '#FFFFFF',
            strokeWeight: 2.5
          }
        });

        const infoContent = `
          <div class="gmap-infowindow-card" style="background: #111827; color: #f3f4f6; padding: 12px 14px; border-radius: 8px; border: 1px solid rgba(255,222,0,0.35); font-family: system-ui, -apple-system, sans-serif; min-width: 220px; box-shadow: 0 10px 25px rgba(0,0,0,0.7);">
            <div style="font-weight: 800; font-size: 15px; color: #ffffff; margin-bottom: 2px;">${u.name}</div>
            <div style="color: #ffde00; font-size: 13px; font-weight: 600; margin-bottom: 6px;">${u.nameZh} · ${u.city}</div>
            <div style="display: flex; gap: 6px; align-items: center; margin-bottom: 8px; flex-wrap: wrap;">
              <span style="background: #DE2910; color: #FFF; padding: 2px 7px; border-radius: 4px; font-size: 11px; font-weight: bold;">QS #${u.rankQs}</span>
              <span style="background: rgba(255,222,0,0.15); color: #ffde00; border: 1px solid rgba(255,222,0,0.4); padding: 2px 7px; border-radius: 4px; font-size: 11px; font-weight: bold;">${u.league.split('·')[0]}</span>
              <span style="color: #9ca3af; font-size: 11px;">THE #${u.rankThe}</span>
            </div>
            <div style="font-size: 11px; color: #cbd5e1; line-height: 1.4;">${u.topPrograms ? u.topPrograms.slice(0, 3).join(', ') : ''}</div>
          </div>
        `;

        const infoWindow = new maps.InfoWindow({ content: infoContent });

        marker.addListener('click', () => {
          if (activeInfoWindow) activeInfoWindow.close();
          infoWindow.open(gmapInstance, marker);
          activeInfoWindow = infoWindow;
          highlightSchoolCard(u.id);
        });

        markersMap.set(u.id, { marker, infoWindow, u });
      });

      isGoogleMapsActive = true;
      // Frame all universities with Guangdong and Harbin bounds once tiles/viewport initialize
      setTimeout(() => fitAllChinaBounds(maps), 200);
    } catch (e) {
      console.warn('[schoolMap] Google Maps init failed, using vector fallback:', e);
      renderVectorFallback();
    }
  };

  const renderVectorFallback = () => {
    if (!fallbackCanvas) return;
    fallbackCanvas.style.display = 'block';

    // SVG Map of China with markers placed proportionally
    // Bounds approximately: Lat 20 to 48, Lng 100 to 132
    const minLat = 20, maxLat = 48, minLng = 105, maxLng = 130;

    const markersSvg = universities.map(u => {
      if (!u.coordinates) return '';
      // Map lat/lng to percentage in SVG viewBox 0 0 500 400
      const x = ((u.coordinates.lng - minLng) / (maxLng - minLng)) * 420 + 40;
      const y = (1 - (u.coordinates.lat - minLat) / (maxLat - minLat)) * 320 + 40;
      const isC9 = u.league && u.league.includes('C9');
      const pinColor = isC9 ? '#FFDE00' : '#FF2A4A';

      return `
        <g class="vector-map-pin" data-pin-id="${u.id}" transform="translate(${x.toFixed(1)}, ${y.toFixed(1)})" style="cursor: pointer;">
          <circle r="14" fill="${pinColor}" opacity="0.2" class="pin-pulse"></circle>
          <circle r="7" fill="${pinColor}" stroke="#FFF" stroke-width="2"></circle>
          <text y="-11" text-anchor="middle" fill="#F3F4F6" font-size="10" font-weight="700" font-family="sans-serif">${u.name.split(' ')[0]}</text>
        </g>
      `;
    }).join('');

    fallbackCanvas.innerHTML = `
      <div class="vector-map-wrap">
        <svg viewBox="0 0 500 400" class="vector-china-svg" preserveAspectRatio="xMidYMid meet">
          <!-- Subtle Grid Lines -->
          <line x1="0" y1="100" x2="500" y2="100" stroke="rgba(255,255,255,0.04)" stroke-dasharray="4"/>
          <line x1="0" y1="200" x2="500" y2="200" stroke="rgba(255,255,255,0.04)" stroke-dasharray="4"/>
          <line x1="0" y1="300" x2="500" y2="300" stroke="rgba(255,255,255,0.04)" stroke-dasharray="4"/>
          <line x1="150" y1="0" x2="150" y2="400" stroke="rgba(255,255,255,0.04)" stroke-dasharray="4"/>
          <line x1="300" y1="0" x2="300" y2="400" stroke="rgba(255,255,255,0.04)" stroke-dasharray="4"/>
          <line x1="450" y1="0" x2="450" y2="400" stroke="rgba(255,255,255,0.04)" stroke-dasharray="4"/>

          <!-- Stylized China Outline Contour Background -->
          <path d="M 120,80 Q 200,60 320,40 Q 420,50 460,90 Q 480,180 430,220 Q 380,260 360,340 Q 280,360 220,320 Q 140,280 100,200 Z" fill="rgba(222,41,16,0.05)" stroke="rgba(222,41,16,0.25)" stroke-width="1.5" />

          <!-- City Region Labels -->
          <text x="310" y="110" fill="#9ca3af" font-size="9" opacity="0.6">Beijing / Harbin (North)</text>
          <text x="390" y="240" fill="#9ca3af" font-size="9" opacity="0.6">Shanghai / Yangtze (East)</text>
          <text x="280" y="360" fill="#ffde00" font-size="9" opacity="0.8">Guangzhou / Guangdong (South)</text>

          <!-- University Pins -->
          ${markersSvg}
        </svg>
      </div>
    `;

    // Bind pin clicks
    fallbackCanvas.querySelectorAll('.vector-map-pin').forEach(pin => {
      pin.addEventListener('click', () => {
        const uId = pin.dataset.pinId;
        focusUniversityOnMap(uId);
        highlightSchoolCard(uId);
      });
    });
  };

  const highlightSchoolCard = (uId) => {
    const card = document.querySelector(`[data-university="${uId}"]`);
    if (card) {
      card.scrollIntoView({ behavior: 'smooth', block: 'center' });
      card.style.borderColor = 'var(--color-gold)';
      card.style.boxShadow = '0 0 24px rgba(255, 222, 0, 0.4)';
      setTimeout(() => {
        card.style.borderColor = '';
        card.style.boxShadow = '';
      }, 2500);
    }
  };

  // Attempt Google Maps script load
  if (storedKey) {
    loadGoogleMapsScript(storedKey)
      .then(initGoogleMap)
      .catch(() => renderVectorFallback());
  } else {
    renderVectorFallback();
  }

  // Reset view listener
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      if (isGoogleMapsActive && gmapInstance) {
        fitAllChinaBounds();
        if (activeInfoWindow) activeInfoWindow.close();
      }
      if (callout) callout.style.display = 'none';
    });
  }

  /**
   * Focuses and pans to a specific university on the map
   */
  function focusUniversityOnMap(uId) {
    const u = universities.find(x => x.id === uId);
    if (!u || !u.coordinates) return;

    if (callout && calloutName && calloutCity) {
      callout.style.display = 'flex';
      calloutName.textContent = u.name;
      calloutCity.textContent = `· ${u.city} (${u.coordinates.lat}°N, ${u.coordinates.lng}°E)`;
    }

    if (isGoogleMapsActive && gmapInstance) {
      gmapInstance.panTo(u.coordinates);
      gmapInstance.setZoom(12);
      const entry = markersMap.get(uId);
      if (entry && entry.marker) {
        if (activeInfoWindow) activeInfoWindow.close();
        entry.infoWindow.open(gmapInstance, entry.marker);
        activeInfoWindow = entry.infoWindow;
      }
    } else if (fallbackCanvas) {
      fallbackCanvas.querySelectorAll('.vector-map-pin').forEach(pin => {
        const isTarget = pin.dataset.pinId === uId;
        pin.querySelector('.pin-pulse').setAttribute('r', isTarget ? '22' : '14');
        pin.querySelector('.pin-pulse').setAttribute('opacity', isTarget ? '0.6' : '0.2');
      });
    }
  }

  return {
    focusSchool: focusUniversityOnMap,
    resetView: () => resetBtn && resetBtn.click()
  };
}

export default {
  GOOGLE_MAPS_DARK_STYLE,
  loadGoogleMapsScript,
  renderSchoolMapMarkup,
  mountSchoolMap
};
