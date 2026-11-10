// PhysicsAILab - Configuración Dinámica del Endpoint VPS de TrueTrading Gold
// GET  /api/truetrading-config -> devuelve { ok, apiUrl, updatedAt, source }
// POST /api/truetrading-config -> protegido por Authorization: Bearer <TRUETRADING_CONFIG_SECRET>

const crypto = require('crypto');

const DEFAULT_API_URL = 'https://educational-calculator-briefly-ellen.trycloudflare.com';
const FIREBASE_CONFIG_URL = 'https://squashpopayan-65e33-default-rtdb.firebaseio.com/physicsailab/truetrading_config.json';

function cleanUrl(raw) {
  if (!raw || typeof raw !== 'string') return '';
  const trimmed = raw.trim().replace(/\/+$/, '');
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') return '';
    return parsed.origin + (parsed.pathname === '/' ? '' : parsed.pathname.replace(/\/+$/, ''));
  } catch (e) {
    return '';
  }
}

function timingSafeMatch(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string' || !a || !b) return false;
  const bufA = Buffer.from(a, 'utf8');
  const bufB = Buffer.from(b, 'utf8');
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

async function fetchJsonWithTimeout(url, options = {}, timeoutMs = 4500) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const resp = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(id);
    return resp;
  } catch (err) {
    clearTimeout(id);
    throw err;
  }
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate, max-age=0, s-maxage=0');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.setHeader('Content-Type', 'application/json; charset=utf-8');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'GET') {
    let stored = null;
    try {
      const fbResp = await fetchJsonWithTimeout(FIREBASE_CONFIG_URL, { cache: 'no-store' }, 4500);
      if (fbResp.ok) {
        stored = await fbResp.json();
      }
    } catch (e) {
      // Fallback limpio a DEFAULT_API_URL si Firebase no responde momentáneamente
    }

    const validStoredUrl = stored && cleanUrl(stored.apiUrl);
    const apiUrl = validStoredUrl || DEFAULT_API_URL;
    return res.status(200).json({
      ok: true,
      apiUrl,
      defaultApiUrl: DEFAULT_API_URL,
      updatedAt: (stored && stored.updatedAt) || new Date().toISOString(),
      source: validStoredUrl ? (stored.source || 'firebase') : 'default'
    });
  }

  if (req.method === 'POST') {
    const expectedSecret = process.env.TRUETRADING_CONFIG_SECRET || '';
    if (!expectedSecret) {
      return res.status(503).json({
        ok: false,
        error: 'TRUETRADING_CONFIG_SECRET no está configurado en las variables de entorno del servidor (Vercel).'
      });
    }

    const authHeader = String(req.headers.authorization || req.headers.Authorization || '');
    const bearerMatch = authHeader.match(/^Bearer\s+(.+)$/i);
    const providedToken = bearerMatch ? bearerMatch[1].trim() : '';

    if (!timingSafeMatch(providedToken, expectedSecret)) {
      return res.status(401).json({
        ok: false,
        error: 'No autorizado. Se requiere header Authorization: Bearer <SECRET> válido.'
      });
    }

    let body = req.body;
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch (e) {
        return res.status(400).json({ ok: false, error: 'JSON inválido en el cuerpo de la petición.' });
      }
    }
    body = body || {};

    const rawUrl = body.apiUrl || body.api_url || body.tunnel_url || body.url || '';
    const nextApiUrl = cleanUrl(rawUrl);
    if (!nextApiUrl) {
      return res.status(400).json({
        ok: false,
        error: 'El campo apiUrl debe ser una URL válida con https:// o http://.'
      });
    }

    const record = {
      apiUrl: nextApiUrl,
      updatedAt: new Date().toISOString(),
      source: String(body.source || 'vps-webhook')
    };

    try {
      const putResp = await fetchJsonWithTimeout(
        FIREBASE_CONFIG_URL,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(record)
        },
        4500
      );
      if (!putResp.ok) {
        const errText = await putResp.text().catch(() => '');
        return res.status(502).json({
          ok: false,
          error: `Error persistiendo configuración en Firebase (${putResp.status}): ${errText}`
        });
      }
      return res.status(200).json({
        ok: true,
        apiUrl: record.apiUrl,
        updatedAt: record.updatedAt,
        source: record.source,
        message: 'URL de TrueTrading actualizada correctamente'
      });
    } catch (err) {
      return res.status(502).json({
        ok: false,
        error: 'No se pudo guardar en Firebase RTDB: ' + (err.message || String(err))
      });
    }
  }

  return res.status(405).json({ ok: false, error: 'Método no permitido' });
};
