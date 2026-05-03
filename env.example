// api/config.js
// Mengirim konfigurasi repo (bukan token!) ke browser.
// Set environment variables: GH_OWNER, GH_REPO, GH_BRANCH, GH_FILE_PATH, GH_IMAGE_FOLDER

export default function handler(req, res) {
  const owner       = process.env.GH_OWNER;
  const repo        = process.env.GH_REPO;
  const branch      = process.env.GH_BRANCH       || 'main';
  const filePath    = process.env.GH_FILE_PATH     || 'products.json';
  const imageFolder = process.env.GH_IMAGE_FOLDER  || 'images';

  if (!owner || !repo) {
    return res.status(500).json({
      error: 'GH_OWNER atau GH_REPO belum dikonfigurasi di Vercel Environment Variables.',
    });
  }

  return res.json({ owner, repo, branch, filePath, imageFolder });
}
