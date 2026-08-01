import { describe, it, expect } from 'vitest';
import { buildPopupHTML, escapeHTML } from './popup';
import type { StudentCard } from '../types';

const baseCard: StudentCard = {
  id: '1',
  anonymousName: 'stellar-falcon',
  avatarUrl: 'https://api.dicebear.com/9.x/open-peeps/svg?seed=stellar-falcon',
  area: 'BACKEND',
  seniority: 'JUNIOR',
  city: 'São Paulo',
  state: 'SP',
  salary: 'R$ 5.000',
  firstJobInIt: true,
  keyInsight: 'Primeira vaga conquistada',
  stacks: 'Java, Quarkus',
  courseTime: '6 meses',
};

describe('escapeHTML', () => {
  it('escapes html special characters', () => {
    expect(escapeHTML(`<script>alert(1)</script>`)).toBe('&lt;script&gt;alert(1)&lt;/script&gt;');
    expect(escapeHTML(`"quoted" & 'single'`)).toBe('&quot;quoted&quot; &amp; &#39;single&#39;');
  });
});

describe('buildPopupHTML', () => {
  it('renders a normal card', () => {
    const html = buildPopupHTML(baseCard);
    expect(html).toContain('stellar-falcon');
    expect(html).toContain('Primeira vaga conquistada');
    expect(html).toContain('R$ 5.000');
  });

  it('neutralizes XSS in keyInsight', () => {
    const html = buildPopupHTML({
      ...baseCard,
      keyInsight: `<img src=x onerror=alert(1)>`,
    });
    expect(html).not.toContain('<img src=x onerror=alert(1)>');
    expect(html).toContain('&lt;img src=x onerror=alert(1)&gt;');
  });

  it('neutralizes XSS in anonymousName and stacks', () => {
    const html = buildPopupHTML({
      ...baseCard,
      anonymousName: `<script>document.cookie</script>`,
      stacks: `React, <svg onload=alert(2)>`,
    });
    expect(html).not.toContain('<script>');
    expect(html).not.toContain('<svg');
    expect(html).toContain('&lt;script&gt;document.cookie&lt;/script&gt;');
    expect(html).toContain('&lt;svg onload=alert(2)&gt;');
  });

  it('neutralizes XSS in avatarUrl attribute', () => {
    const html = buildPopupHTML({
      ...baseCard,
      avatarUrl: `https://evil.example/x" onerror="alert(1)`,
    });
    expect(html).toContain('https://evil.example/x&quot; onerror=&quot;alert(1)');
    expect(html).not.toMatch(/src="[^"]*" onerror="[^"]*"/);
  });

  it('renders without stacks when null', () => {
    const html = buildPopupHTML({ ...baseCard, stacks: null, courseTime: null });
    expect(html).not.toContain('>Java<');
    expect(html).not.toContain('Tempo no curso');
  });
});
