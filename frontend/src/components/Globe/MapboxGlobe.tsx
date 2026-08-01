import { useEffect, useRef, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import type { StudentGlobe, StudentCard } from '../../types';
import { buildPopupHTML } from '../../lib/popup';

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN;

interface Props {
  students: StudentGlobe[];
  activeArea: string | null;
  onMarkerClick: (id: string) => void;
  selectedId: string | null;
  card: StudentCard | null;
  loadingCard: boolean;
  onClose: () => void;
}

function buildLoadingHTML(): string {
  return `
    <div style="display:flex;gap:12px;align-items:center;min-width:200px;padding:8px 0;">
      <div style="width:48px;height:48px;border-radius:50%;background:#1a2030;flex-shrink:0;"></div>
      <div style="flex:1;">
        <div style="height:14px;background:#1a2030;border-radius:4px;margin-bottom:8px;"></div>
        <div style="height:10px;background:#1a2030;border-radius:4px;width:60%;"></div>
      </div>
    </div>
  `;
}

export default function MapboxGlobe({ students, activeArea, onMarkerClick, selectedId, card, loadingCard, onClose }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<Map<string, { marker: mapboxgl.Marker; wrapper: HTMLDivElement }>>(new Map());
  const popupRef = useRef<mapboxgl.Popup | null>(null);
  const popupGenRef = useRef(0);
  const spinningRef = useRef(true);

  useEffect(() => {
    if (!containerRef.current) return;

    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: 'mapbox://styles/mapbox/dark-v11',
      center: [-20, 5],
      zoom: 2,
      projection: 'globe',
      attributionControl: false,
    });

    map.on('style.load', () => {
      map.setFog({
        color: 'rgb(5, 5, 20)',
        'high-color': 'rgb(20, 20, 60)',
        'horizon-blend': 0.08,
        'space-color': 'rgb(2, 4, 8)',
        'star-intensity': 0.6,
      });
    });

    map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), 'top-right');

    spinningRef.current = true;

    const spinInterval = setInterval(() => {
      if (!spinningRef.current) return;
      const center = map.getCenter();
      map.jumpTo({ center: [center.lng - 0.08, center.lat] });
    }, 16);

    const stopSpin = () => {
      spinningRef.current = false;
    };
    map.on('mousedown', stopSpin);
    map.on('touchstart', stopSpin);

    mapRef.current = map;

    return () => {
      spinningRef.current = false;
      clearInterval(spinInterval);
      map.remove();
      mapRef.current = null;
    };
  }, []);

  const handleMarkerClick = useCallback((id: string) => {
    onMarkerClick(id);
  }, [onMarkerClick]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const seen = new Set<string>();

    students.forEach(student => {
      seen.add(student.id);
      const entry = markersRef.current.get(student.id);
      const visible = (!activeArea || student.area === activeArea) && student.id !== selectedId;

      if (entry) {
        entry.wrapper.style.visibility = visible ? 'visible' : 'hidden';
        return;
      }

      const wrapper = document.createElement('div');
      wrapper.style.width = '60px';
      wrapper.style.height = '60px';
      wrapper.style.cursor = 'pointer';
      wrapper.style.visibility = visible ? 'visible' : 'hidden';

      const inner = document.createElement('div');
      inner.style.width = '100%';
      inner.style.height = '100%';
      inner.style.borderRadius = '50%';
      inner.style.overflow = 'hidden';
      inner.style.border = '2px solid #2a2a2e';
      inner.style.boxShadow = '0 0 8px #34d39988, 0 0 16px #34d39944';
      inner.style.transition = 'transform 0.2s, box-shadow 0.2s';
      inner.style.background = '#1a1a1e';

      const img = document.createElement('img');
      img.src = student.avatarUrl;
      img.alt = student.anonymousName;
      img.style.width = '100%';
      img.style.height = '100%';
      img.style.objectFit = 'cover';
      img.style.display = 'block';
      inner.appendChild(img);
      wrapper.appendChild(inner);

      wrapper.addEventListener('mouseenter', () => {
        inner.style.transform = 'scale(1.15)';
        inner.style.boxShadow = '0 0 12px #34d399, 0 0 24px #34d39988';
      });
      wrapper.addEventListener('mouseleave', () => {
        inner.style.transform = 'scale(1)';
        inner.style.boxShadow = '0 0 8px #34d39988, 0 0 16px #34d39944';
      });

      const marker = new mapboxgl.Marker({ element: wrapper, anchor: 'center' })
        .setLngLat([student.lng, student.lat])
        .addTo(map);

      wrapper.addEventListener('click', (e) => {
        e.stopPropagation();
        spinningRef.current = false;
        handleMarkerClick(student.id);
      });

      markersRef.current.set(student.id, { marker, wrapper });
    });

    markersRef.current.forEach(({ marker }, id) => {
      if (!seen.has(id)) marker.remove();
    });
    markersRef.current.forEach((_, id) => {
      if (!seen.has(id)) markersRef.current.delete(id);
    });
  }, [students, activeArea, selectedId, handleMarkerClick]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const closePopup = () => {
      if (popupRef.current) {
        popupGenRef.current += 1;
        popupRef.current.remove();
        popupRef.current = null;
      }
    };

    if (!selectedId) {
      closePopup();
      return;
    }

    const student = students.find(s => s.id === selectedId);
    if (!student) return;

    const entry = markersRef.current.get(selectedId);

    if (popupRef.current) {
      const prevPos = popupRef.current.getLngLat();
      const isSameStudent = prevPos.lng === student.lng && prevPos.lat === student.lat;
      if (isSameStudent && !loadingCard && card) {
        popupRef.current.setHTML(buildPopupHTML(card));
        return;
      }
      closePopup();
    }

    if (entry) entry.wrapper.style.visibility = 'hidden';

    const gen = popupGenRef.current + 1;
    popupGenRef.current = gen;

    const popup = new mapboxgl.Popup({
      closeButton: true,
      closeOnClick: true,
      maxWidth: '380px',
      className: 'student-popup',
      anchor: 'top-left',
      offset: [-51, -51],
    })
      .setLngLat([student.lng, student.lat])
      .setHTML(loadingCard || !card ? buildLoadingHTML() : buildPopupHTML(card))
      .addTo(map);

    popup.on('close', () => {
      if (gen !== popupGenRef.current) return;
      popupRef.current = null;
      const prevEntry = markersRef.current.get(selectedId);
      if (prevEntry) prevEntry.wrapper.style.visibility = 'visible';
      onClose();
    });

    popupRef.current = popup;
  }, [selectedId, card, loadingCard, students, onClose]);

  return (
    <div
      ref={containerRef}
      style={{ position: 'absolute', inset: 0 }}
    />
  );
}
