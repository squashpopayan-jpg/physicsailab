// Ajustes guardados en el celular y último lanzamiento (solo datos; el video queda en memoria hasta guardarlo).

const KEY = 'apogeo.ajustes.v1';
const LAST = 'apogeo.ultimo.v1';

export const DEFAULTS = {
  d: 40, sigD: 0.5, mode: 'tripod', lateralFix: true, countdown: 5,
  fNorm: 0.8, lensCalibrated: false,
  camId: '', res: '1280x720', ana: 640, sigSensorDeg: 0.3, latencyMs: 60, label: '', showRoi: true,
  demo: { preset: 'agua', wind: 3, windDir: 90, Hobs: 1.5 },
};

export function loadSettings() {
  try {
    const s = JSON.parse(localStorage.getItem(KEY) || '{}');
    return { ...DEFAULTS, ...s, demo: { ...DEFAULTS.demo, ...(s.demo || {}) } };
  } catch {
    return JSON.parse(JSON.stringify(DEFAULTS));
  }
}

export function saveSettings(s) {
  try { localStorage.setItem(KEY, JSON.stringify(s)); } catch { /* sin almacenamiento */ }
}

export function saveLast(obj) {
  try { localStorage.setItem(LAST, JSON.stringify(obj)); } catch { /* sin almacenamiento */ }
}

export function loadLast() {
  try { return JSON.parse(localStorage.getItem(LAST) || 'null'); } catch { return null; }
}
