import type { StudentCard } from '../types';
import { AREA_COLORS, AREA_LABELS, SENIORITY_LABELS } from './colors';

export function escapeHTML(value: string): string {
  return value.replace(/[&<>"']/g, c => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] as string
  ));
}

export function buildPopupHTML(card: StudentCard): string {
  const color = AREA_COLORS[card.area] || '#ffffff';
  const areaLabel = AREA_LABELS[card.area] || card.area;
  const seniorityLabel = card.seniority ? SENIORITY_LABELS[card.seniority] : null;
  const avatarUrl = escapeHTML(card.avatarUrl);
  const name = escapeHTML(card.anonymousName);
  const insight = escapeHTML(card.keyInsight);
  const city = escapeHTML(card.city);
  const state = escapeHTML(card.state);
  const salary = escapeHTML(card.salary);
  const courseTime = card.courseTime ? escapeHTML(card.courseTime) : null;
  const stacks = card.stacks
    ? card.stacks.split(',').map(s => escapeHTML(s.trim())).filter(Boolean)
    : [];

  return `
    <div style="display:flex;gap:12px;align-items:flex-start;min-width:260px;max-width:300px;">
      <img src="${avatarUrl}" alt="${name}"
        style="width:69px;height:69px;border-radius:50%;border:2px solid #2a2a2e;box-shadow:0 0 12px #34d399, 0 0 24px #34d39988;flex-shrink:0;background:#1a1a1e;" />
      <div style="flex:1;min-width:0;">
        <div style="padding:8px;background:rgba(255,255,255,0.05);border-radius:6px;border-left:3px solid ${color};margin-bottom:8px;">
          <p style="color:#94a3b8;font-size:13px;line-height:1.6;margin:0;font-style:italic;">
            "${insight}"
          </p>
        </div>
        <div style="display:flex;justify-content:space-between;align-items:flex-start;">
          <strong style="color:#fff;font-size:17px;line-height:1.3;">${name}</strong>
        </div>
        <div style="color:#94a3b8;font-size:14px;margin-top:2px;">
          📍 ${city}, ${state}
        </div>
        <div style="display:flex;gap:5px;margin-top:8px;flex-wrap:wrap;">
          <span style="background:${color}22;color:${color};border:1px solid ${color}44;padding:2px 8px;border-radius:12px;font-size:13px;font-weight:600;">
            ${areaLabel}
          </span>
          ${seniorityLabel ? `
          <span style="background:rgba(148,163,184,0.15);color:#cbd5e1;border:1px solid rgba(148,163,184,0.3);padding:2px 8px;border-radius:12px;font-size:13px;font-weight:600;">
            ${seniorityLabel}
          </span>` : ''}
          ${card.firstJobInIt ? `
          <span style="background:rgba(251,191,36,0.15);color:#fbbf24;border:1px solid rgba(251,191,36,0.3);padding:2px 8px;border-radius:12px;font-size:13px;font-weight:600;">
            1ª vaga em TI
          </span>` : ''}
        </div>
        ${stacks.length ? `
        <div style="display:flex;gap:4px;margin-top:8px;flex-wrap:wrap;">
          ${stacks.map(stack => `
            <span style="color:#34d399;border:1px solid #34d399;padding:2px 8px;border-radius:4px;font-size:13px;font-weight:600;">
              ${stack}
            </span>
          `).join('')}
        </div>` : ''}
        <div style="display:flex;justify-content:space-between;align-items:center;margin-top:8px;padding:6px 8px;background:rgba(255,255,255,0.05);border-radius:6px;">
          <span style="color:#64748b;font-size:14px;">Salário</span>
          <span style="color:#fff;font-size:15px;font-weight:600;">${salary}</span>
        </div>
        ${courseTime ? `
        <div style="display:flex;justify-content:space-between;align-items:center;margin-top:6px;padding:6px 8px;background:rgba(255,255,255,0.05);border-radius:6px;">
          <span style="color:#64748b;font-size:14px;">Tempo no curso</span>
          <span style="color:#fff;font-size:15px;font-weight:600;">${courseTime}</span>
        </div>` : ''}
      </div>
    </div>
  `;
}
