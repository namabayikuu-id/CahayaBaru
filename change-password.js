// api/github.js
// Proxy semua panggilan ke GitHub API — TOKEN hanya ada di server Vercel, tidak pernah ke browser.
// Set environment variable di Vercel Dashboard: GITHUB_TOKEN=ghp_xxxxxx

export default async function handler(req, res) {
  // Hanya izinkan POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    return res.status(500).json({ error: 'GITHUB_TOKEN belum dikonfigurasi di Vercel Environment Variables.' });
  }

  const { method = 'GET', path, body: reqBody, ref } = req.body;

  if (!path) {
    return res.status(400).json({ error: 'Parameter "path" wajib diisi.' });
  }

  // Build URL GitHub API
  const url = `https://api.github.com/${path}${ref ? `?ref=${ref}` : ''}`;

  const fetchOptions = {
    method,
    headers: {
      Authorization: `token ${token}`,
      Accept: 'application/vnd.github.v3+json',
    },
  };

  if (reqBody && method !== 'GET') {
    fetchOptions.headers['Content-Type'] = 'application/json';
    fetchOptions.body = JSON.stringify(reqBody);
  }

  try {
    const ghRes = await fetch(url, fetchOptions);
    const data = await ghRes.json();
    return res.status(ghRes.status).json(data);
  } catch (e) {
    return res.status(500).json({ error: 'Proxy error: ' + e.message });
  }
}
