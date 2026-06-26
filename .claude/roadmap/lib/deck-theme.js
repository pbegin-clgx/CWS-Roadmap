const fs = require('fs');

const REQUIRED = ['dk1', 'lt1', 'dk2', 'lt2', 'accent1', 'accent2', 'accent3', 'accent4', 'accent5', 'accent6'];

function loadTheme(path) {
  if (!path || !fs.existsSync(path)) throw new Error(`Theme file not found: ${path}`);
  const t = JSON.parse(fs.readFileSync(path, 'utf8'));
  const colors = t.colors || {};
  for (const k of REQUIRED) if (!colors[k]) throw new Error(`Theme is missing required color "${k}" in ${path}`);
  return { colors, majorFont: t.majorFont || 'Arial', minorFont: t.minorFont || 'Arial' };
}

module.exports = { loadTheme };
