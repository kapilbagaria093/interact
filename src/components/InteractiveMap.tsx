/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useRef } from 'react';
import L from 'leaflet';
import { Issue } from '../types';

interface InteractiveMapProps {
  issues: Issue[];
  onSelectIssue: (issue: Issue) => void;
  onMapClick: (lat: number, lng: number, address: string) => void;
  selectedIssueId: string | null;
  cartoonFilterClass?: string;
}

export default function InteractiveMap({
  issues,
  onSelectIssue,
  onMapClick,
  selectedIssueId,
  cartoonFilterClass = 'saturate-[2.0] contrast-[1.25]',
}: InteractiveMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const clickMarkerRef = useRef<L.Marker | null>(null);

  const onMapClickRef = useRef(onMapClick);
  const onSelectIssueRef = useRef(onSelectIssue);

  useEffect(() => {
    onMapClickRef.current = onMapClick;
  }, [onMapClick]);

  useEffect(() => {
    onSelectIssueRef.current = onSelectIssue;
  }, [onSelectIssue]);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    // Default center on SF
    const defaultCenter: L.LatLngExpression = [37.7749, -122.4194];
    const map = L.map(mapContainerRef.current, {
      zoomControl: false, // custom zoom controls
      attributionControl: true,
    }).setView(defaultCenter, 13);

    // Beautiful saturated CARTO voyager tile layer
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap &copy; CARTO',
    }).addTo(map);

    // Zoom controls in bottom right
    L.control.zoom({
      position: 'bottomright',
    }).addTo(map);

    markersLayerRef.current = L.layerGroup().addTo(map);
    mapRef.current = map;

    // Handle Map Clicks to Report Issues
    map.on('click', async (e: L.LeafletMouseEvent) => {
      const { lat, lng } = e.latlng;

      // Add temporary marker at click location
      if (clickMarkerRef.current) {
        try {
          clickMarkerRef.current.remove();
        } catch (err) {
          console.warn('Failed to remove click marker:', err);
        }
      }

      const tempIcon = L.divIcon({
        className: 'custom-temp-marker',
        html: `
          <div class="relative flex items-center justify-center w-12 h-12">
            <div class="absolute w-10 h-10 rounded-full bg-[#ff007f] opacity-40 animate-ping"></div>
            <div class="relative w-8 h-8 rounded-xl bg-[#ff007f] border-[3px] border-black shadow-[3px_3px_0px_rgba(0,0,0,1)] flex items-center justify-center text-white text-lg font-black font-mono">
              +
            </div>
          </div>
        `,
        iconSize: [48, 48],
        iconAnchor: [24, 24],
      });

      clickMarkerRef.current = L.marker([lat, lng], { icon: tempIcon }).addTo(map);

      // Fetch reverse geocode address
      let address = `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18`
        );
        if (res.ok) {
          const data = await res.json();
          if (data.display_name) {
            const parts = data.display_name.split(',');
            address = parts.slice(0, 3).join(',').trim();
          }
        }
      } catch (err) {
        console.error('Reverse geocode failed:', err);
      }

      onMapClickRef.current(lat, lng, address);
    });

    return () => {
      if (mapRef.current) {
        if (clickMarkerRef.current) {
          try {
            clickMarkerRef.current.remove();
          } catch (e) {
            console.warn(e);
          }
          clickMarkerRef.current = null;
        }
        if (markersLayerRef.current) {
          try {
            markersLayerRef.current.clearLayers();
            markersLayerRef.current.remove();
          } catch (e) {
            console.warn(e);
          }
          markersLayerRef.current = null;
        }
        try {
          mapRef.current.remove();
        } catch (e) {
          console.warn(e);
        }
        mapRef.current = null;
      }
    };
  }, []);

  // Update Markers when Issues list changes
  useEffect(() => {
    const map = mapRef.current;
    const markersLayer = markersLayerRef.current;
    if (!map || !markersLayer) return;

    try {
      markersLayer.clearLayers();
    } catch (e) {
      console.warn('Failed to clear layers:', e);
    }

    issues.forEach((issue) => {
      let iconHtml = '';
      
      if (issue.status === 'Resolved') {
        iconHtml = `
          <div class="relative flex items-center justify-center w-12 h-12 group" id="marker-${issue.id}">
            <div class="absolute w-10 h-10 rounded-full bg-[#00ff66] opacity-30 animate-pulse"></div>
            <div class="relative w-9 h-9 rounded-xl bg-[#00ff66] border-[3px] border-black shadow-[3px_3px_0px_rgba(0,0,0,1)] flex items-center justify-center text-black text-lg font-black transition-all duration-200 group-hover:scale-110 group-hover:rotate-12">
              ✅
            </div>
          </div>
        `;
      } else if (issue.severity === 'Critical') {
        iconHtml = `
          <div class="relative flex items-center justify-center w-12 h-12 group" id="marker-${issue.id}">
            <div class="absolute w-10 h-10 rounded-full bg-[#ff0055] opacity-40 animate-ping"></div>
            <div class="relative w-9 h-9 rounded-xl bg-[#ff0055] border-[3px] border-black shadow-[3px_3px_0px_rgba(0,0,0,1)] flex items-center justify-center text-white text-lg font-black transition-all duration-200 group-hover:scale-110 group-hover:-rotate-12">
              🔥
            </div>
          </div>
        `;
      } else {
        iconHtml = `
          <div class="relative flex items-center justify-center w-12 h-12 group" id="marker-${issue.id}">
            <div class="absolute w-10 h-10 rounded-full bg-[#ffcc00] opacity-30 animate-pulse"></div>
            <div class="relative w-9 h-9 rounded-xl bg-[#ffcc00] border-[3px] border-black shadow-[3px_3px_0px_rgba(0,0,0,1)] flex items-center justify-center text-black text-lg font-black transition-all duration-200 group-hover:scale-110 group-hover:scale-105">
              ⚠️
            </div>
          </div>
        `;
      }

      const icon = L.divIcon({
        className: 'custom-div-icon',
        html: iconHtml,
        iconSize: [48, 48],
        iconAnchor: [24, 24],
      });

      const marker = L.marker([issue.latitude, issue.longitude], { icon })
        .on('click', () => {
          onSelectIssueRef.current(issue);
          if (clickMarkerRef.current) {
            try {
              clickMarkerRef.current.remove();
            } catch (e) {
              console.warn(e);
            }
            clickMarkerRef.current = null;
          }
        });

      markersLayer.addLayer(marker);
    });
  }, [issues]);

  // Center Map on Selected Issue
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !selectedIssueId) return;

    const selectedIssue = issues.find((i) => i.id === selectedIssueId);
    if (selectedIssue) {
      map.setView([selectedIssue.latitude, selectedIssue.longitude], 15, {
        animate: true,
        duration: 1,
      });

      if (clickMarkerRef.current) {
        clickMarkerRef.current.remove();
        clickMarkerRef.current = null;
      }
    }
  }, [selectedIssueId, issues]);

  return (
    <div className="relative w-full h-full min-h-[400px] rounded-[24px] overflow-hidden border-[4px] border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] bg-white">
      {/* Real Map Canvas with saturated cartoon filter class */}
      <div 
        id="leaflet-map-element" 
        ref={mapContainerRef} 
        className={`w-full h-full z-0 transition-all duration-500 ${cartoonFilterClass}`} 
      />
      
      {/* Quick Map Overlay Instructions */}
      <div className="absolute top-4 left-4 z-10 bg-white border-[3px] border-black p-3.5 rounded-2xl shadow-[4px_4px_0px_rgba(0,0,0,1)] max-w-xs pointer-events-none">
        <p className="text-xs font-black text-black flex items-center gap-1.5 uppercase font-display">
          <span className="flex h-3 w-3 rounded-full bg-[#ff007f] border border-black animate-pulse"></span>
          HERO RADAR MAP
        </p>
        <p className="text-[11px] text-gray-800 font-medium mt-1 leading-relaxed">
          Tap on any blank space to drop a pin and report an issue, or click markers to open.
        </p>
      </div>

      {/* Legend Map Overlay */}
      <div className="absolute bottom-4 left-4 z-10 bg-white border-[3px] border-black p-3.5 rounded-2xl shadow-[4px_4px_0px_rgba(0,0,0,1)] flex flex-col gap-2 pointer-events-auto">
        <span className="text-[10px] font-black uppercase tracking-wider text-black border-b-2 border-black pb-1 font-mono">MAP LEGEND</span>
        <div className="flex items-center gap-2 text-xs text-black font-bold">
          <span className="text-sm">🔥</span>
          <span>CRITICAL RISK</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-black font-bold">
          <span className="text-sm">⚠️</span>
          <span>PENDING / IN PROG</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-black font-bold">
          <span className="text-sm">✅</span>
          <span>FULLY FIXED</span>
        </div>
      </div>
    </div>
  );
}
