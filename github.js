// api/auth.js
// Verifikasi login di server. Password tidak pernah tersimpan di browser.
// Set environment variable: ADMIN_USER=admin  ADMIN_PASS=passwordkamu

const crypto = require('crypto');

function sha256(str) {
  return crypto.createHash('sha256').update(str).digest('hex');
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { user, pass } = req.body;

  const token     = process.env.GITHUB_TOKEN;
  const ghOwner   = process.env.GH_OWNER;
  const ghRepo    = process.env.GH_REPO;
  const ghBranch  = process.env.GH_BRANCH || 'main';

  // Default dari env var
  let validUser = process.env.ADMIN_USER || 'admin';
  let validPassHash = process.env.ADMIN_PASS
    ? sha256(process.env.ADMIN_PASS)
    : sha256('admin123');

  // Coba baca password yang sudah diubah dari GitHub (_admin/config.json)
  if (token && ghOwner && ghRepo) {
    try {
      const cfgUrl = `https://api.github.com/repos/${ghOwner}/${ghRepo}/contents/_admin/config.json?ref=${ghBranch}`;
      const cfgRes = await fetch(cfgUrl, {
        headers: {
          Authorization: `token ${token}`,
          Accept: 'application/vnd.github.v3+json',
        },
      });
      if (cfgRes.ok) {
        const cfgData = await cfgRes.json();
        const cfg = JSON.parse(Buffer.from(cfgData.content, 'base64').toString('utf8'));
        if (cfg.adminPassHash) validPassHash = cfg.adminPassHash;
        if (cfg.adminUser)     validUser     = cfg.adminUser;
      }
    } catch (_) {
      // Gagal baca → pakai default dari env var
    }
  }

  if (user === validUser && sha256(pass) === validPassHash) {
    return res.json({ ok: true });
  } else {
    return res.status(401).json({ ok: false, error: 'Username atau password salah.' });
  }
}
