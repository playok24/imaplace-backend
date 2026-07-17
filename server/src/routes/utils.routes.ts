import { Router } from 'express';
import https from 'https';
import http from 'http';

const router = Router();

function fetchUrl(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    const req = client.get(url, { timeout: 10000, headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
      if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        const redirectUrl = res.headers.location.startsWith('http') ? res.headers.location : new URL(res.headers.location, url).href;
        return fetchUrl(redirectUrl).then(resolve).catch(reject);
      }
      let data = '';
      res.on('data', (chunk: string) => { data += chunk; });
      res.on('end', () => resolve(res.statusCode ? (res.headers.location || data) : data));
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('Timeout')); });
  });
}

router.post('/resolve-coordinates', async (req, res) => {
  try {
    const { url } = req.body;
    if (!url) return res.status(400).json({ error: 'URL requerida' });

    const finalUrl = await fetchUrl(url);
    const patterns = [
      /@(-?\d+\.\d+),(-?\d+\.\d+)/,
      /!3d(-?\d+\.\d+).*?!4d(-?\d+\.\d+)/s,
      /[?&]q=(-?\d+\.\d+)%2C(-?\d+\.\d+)/,
      /[?&]ll=(-?\d+\.\d+),(-?\d+\.\d+)/,
    ];

    for (const pattern of patterns) {
      const match = finalUrl.match(pattern);
      if (match) {
        return res.json({
          latitude: parseFloat(match[1]),
          longitude: parseFloat(match[2]),
          resolvedUrl: finalUrl,
        });
      }
    }

    res.status(400).json({ error: 'No se pudieron extraer coordenadas de la URL', resolvedUrl: finalUrl });
  } catch (err: any) {
    res.status(500).json({ error: 'Error al resolver la URL: ' + err.message });
  }
});

export default router;
