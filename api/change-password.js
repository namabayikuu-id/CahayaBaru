// api/change-password.js
// Ganti password admin — hash disimpan di GitHub (file _admin/config.json), bukan di browser.
// File ini otomatis dibuat/diupdate di repo saat password diubah.

const crypto = require('crypto');

function sha256(str) {
  return crypto.createHash('sha256').update(str).digest('hex');
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { currentPass, newPass } = req.body;

  if (!newPass || newPass.length < 6) {
    return res.status(400).json({ ok: false, error: 'Password baru minimal 6 karakter.' });
  }

  const token     = process.env.GITHUB_TOKEN;
  const ghOwner   = process.env.GH_OWNER;
  const ghRepo    = process.env.GH_REPO;
  const ghBranch  = process.env.GH_BRANCH || 'main';

  if (!token || !ghOwner || !ghRepo) {
    return res.status(500).json({ ok: false, error: 'Konfigurasi server belum lengkap.' });
  }

  // Verifikasi password saat ini (sama seperti di auth.js)
  let validPassHash = process.env.ADMIN_PASS
    ? sha256(process.env.ADMIN_PASS)
    : sha256('admin123');
  let validUser = process.env.ADMIN_USER || 'admin';

  const cfgUrl = `https://api.github.com/repos/${ghOwner}/${ghRepo}/contents/_admin/config.json?ref=${ghBranch}`;
  let existingSha = null;
  let existingCfg = {};

  try {
    const getRes = await fetch(cfgUrl, {
      headers: {
        Authorization: `token ${token}`,
        Accept: 'application/vnd.github.v3+json',
      },
    });
    if (getRes.ok) {
      const d = await getRes.json();
      existingSha = d.sha;
      existingCfg = JSON.parse(Buffer.from(d.content, 'base64').toString('utf8'));
      if (existingCfg.adminPassHash) validPassHash = existingCfg.adminPassHash;
      if (existingCfg.adminUser)     validUser     = existingCfg.adminUser;
    }
  } catch (_) {}

  // Cek password saat ini
  if (sha256(currentPass) !== validPassHash) {
    return res.status(401).json({ ok: false, error: 'Password saat ini salah.' });
  }

  // Buat/update _admin/config.json dengan hash password baru
  const newCfg = {
    ...existingCfg,
    adminUser:     validUser,
    adminPassHash: sha256(newPass),
    _updated:      new Date().toISOString(),
    _info:         'File ini dikelola otomatis oleh Admin Panel Cahaya Baru. Jangan edit manual.',
  };

  const content = Buffer.from(JSON.stringify(newCfg, null, 2)).toString('base64');
  const putBody = {
    message: `Update admin password — ${new Date().toLocaleString('id-ID')}`,
    content,
    branch: ghBranch,
  };
  if (existingSha) putBody.sha = existingSha;

  const putRes = await fetch(
    `https://api.github.com/repos/${ghOwner}/${ghRepo}/contents/_admin/config.json`,
    {
      method: 'PUT',
      headers: {
        Authorization: `token ${token}`,
        'Content-Type': 'application/json',
        Accept: 'application/vnd.github.v3+json',
      },
      body: JSON.stringify(putBody),
    }
  );

  if (!putRes.ok) {
    const err = await putRes.json();
    return res.status(500).json({ ok: false, error: err.message || 'Gagal simpan ke GitHub.' });
  }

  return res.json({ ok: true });
}
