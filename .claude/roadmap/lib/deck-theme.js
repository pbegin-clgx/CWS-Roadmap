const fs = require('fs');

const REQUIRED = ['dk1', 'lt1', 'dk2', 'lt2', 'accent1', 'accent2', 'accent3', 'accent4', 'accent5', 'accent6'];

function loadTheme(themePath) {
  if (!themePath || !fs.existsSync(themePath)) throw new Error(`Theme file not found: ${themePath}`);
  let t;
  try {
    t = JSON.parse(fs.readFileSync(themePath, 'utf8'));
  } catch (e) {
    throw new Error(`Theme file is not valid JSON: ${themePath} (${e.message})`);
  }
  const colors = t.colors || {};
  for (const k of REQUIRED) if (!colors[k]) throw new Error(`Theme is missing required color "${k}" in ${themePath}`);
  return { colors, majorFont: t.majorFont || 'Arial', minorFont: t.minorFont || 'Arial' };
}

module.exports = { loadTheme };
