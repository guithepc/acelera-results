import { useEffect, useRef, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import type { AlunoGlobe, AlunoCard } from '../../types';
import { AREA_COLORS, AREA_LABELS } from '../../lib/colors';

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN;

interface Props {
  alunos: AlunoGlobe[];
  activeArea: string | null;
  onMarkerClick: (id: string) => void;
  selectedId: string | null;
  card: AlunoCard | null;
  loadingCard: boolean;
  onClose: () => void;
}

function buildPopupHTML(card: AlunoCard): string {
  const color = AREA_COLORS[card.area] || '#ffffff';
  const areaLabel = AREA_LABELS[card.area] || card.area;

  return `
    <div style="display:flex;gap:12px;align-items:flex-start;min-width:260px;max-width:300px;">
      <img src="${card.avatarUrl}" alt="${card.anonymousName}"
        style="width:69px;height:69px;border-radius:50%;border:2px solid #2a2a2e;box-shadow:0 0 12px #34d399, 0 0 24px #34d39988;flex-shrink:0;background:#1a1a1e;" />
      <div style="flex:1;min-width:0;">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;">
          <strong style="color:#fff;font-size:13px;line-height:1.3;">${card.anonymousName}</strong>
        </div>
        <div style="color:#94a3b8;font-size:11px;margin-top:2px;">
          📍 ${card.city}, ${card.state}
        </div>
        <div style="display:flex;gap:5px;margin-top:8px;flex-wrap:wrap;">
          <span style="background:${color}22;color:${color};border:1px solid ${color}44;padding:2px 8px;border-radius:12px;font-size:10px;font-weight:600;">
            ${areaLabel}
          </span>
          ${card.firstJobInIt ? `
          <span style="background:rgba(251,191,36,0.15);color:#fbbf24;border:1px solid rgba(251,191,36,0.3);padding:2px 8px;border-radius:12px;font-size:10px;font-weight:600;">
            1ª vaga em TI
          </span>` : ''}
        </div>
        <div style="display:flex;justify-content:space-between;align-items:center;margin-top:8px;padding:6px 8px;background:rgba(255,255,255,0.05);border-radius:6px;">
          <span style="color:#64748b;font-size:11px;">Salário</span>
          <span style="color:#fff;font-size:12px;font-weight:600;">${card.salary}</span>
        </div>
        <div style="margin-top:8px;padding:8px;background:rgba(255,255,255,0.05);border-radius:6px;border-left:3px solid ${color};">
          <p style="color:#94a3b8;font-size:10px;line-height:1.6;margin:0;font-style:italic;">
            "${card.keyInsight}"
          </p>
        </div>
      </div>
    </div>
  `;
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

export default function MapboxGlobe({ alunos, activeArea, onMarkerClick, selectedId, card, loadingCard, onClose }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<Map<string, { marker: mapboxgl.Marker; wrapper: HTMLDivElement }>>(new Map());
  const popupRef = useRef<mapboxgl.Popup | null>(null);
  const replacingPopupRef = useRef(false);

  useEffect(() => {
    if (!containerRef.current) return;

    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: 'mapbox://styles/mapbox/dark-v11',
      center: [-9.14, 38.74],
      zoom: 3,
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

    mapRef.current = map;

    return () => {
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

    markersRef.current.forEach(({ marker }) => marker.remove());
    markersRef.current.clear();

    const filtered = alunos.filter(a => !activeArea || a.area === activeArea);

    filtered.forEach(aluno => {
      const wrapper = document.createElement('div');
      wrapper.style.width = '60px';
      wrapper.style.height = '60px';
      wrapper.style.cursor = 'pointer';

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
      img.src = aluno.avatarUrl;
      img.alt = aluno.anonymousName;
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
        .setLngLat([aluno.lng, aluno.lat])
        .addTo(map);

      wrapper.addEventListener('click', (e) => {
        e.stopPropagation();
        handleMarkerClick(aluno.id);
      });

      markersRef.current.set(aluno.id, { marker, wrapper });
    });
  }, [alunos, activeArea, handleMarkerClick]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (!selectedId) {
      if (popupRef.current) {
        replacingPopupRef.current = true;
        popupRef.current.remove();
        replacingPopupRef.current = false;
        popupRef.current = null;
      }
      markersRef.current.forEach(({ wrapper }) => {
        wrapper.style.visibility = 'visible';
      });
      return;
    }

    const aluno = alunos.find(a => a.id === selectedId);
    if (!aluno) return;

    const entry = markersRef.current.get(selectedId);
    if (entry) entry.wrapper.style.visibility = 'hidden';

    if (popupRef.current) {
      popupRef.current.setHTML(loadingCard || !card ? buildLoadingHTML() : buildPopupHTML(card));
      return;
    }

    const popup = new mapboxgl.Popup({
      closeButton: true,
      closeOnClick: false,
      maxWidth: '380px',
      className: 'aluno-popup',
      anchor: 'top-left',
      offset: [-51, -51],
    })
      .setLngLat([aluno.lng, aluno.lat])
      .setHTML(loadingCard || !card ? buildLoadingHTML() : buildPopupHTML(card))
      .addTo(map);

    popup.on('close', () => {
      popupRef.current = null;
      if (entry) entry.wrapper.style.visibility = 'visible';
      if (!replacingPopupRef.current) {
        onClose();
      }
    });

    popupRef.current = popup;
  }, [selectedId, card, loadingCard, alunos, onClose]);

  return (
    <div
      ref={containerRef}
      style={{ position: 'absolute', inset: 0 }}
    />
  );
}
