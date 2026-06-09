const fs = require('fs');
const path = require('path');
const { marked } = require('marked');

const ROOT = __dirname;
const SECTIONS_DIR = path.join(ROOT, 'sections');
const TEMPLATE_FILE = path.join(ROOT, 'template.html');
const DIST_DIR = path.join(ROOT, 'dist');
const OUTPUT_FILE = path.join(DIST_DIR, 'admin-guide.html');

// Update these when publishing a new version
const META = {
  VERSION: '8.6',
  DATE: 'June 2026',
  ISSUE: '1.0',
};

function extractHeadings(html) {
  const headings = [];
  const re = /<h([1-3])[^>]*id="([^"]*)"[^>]*>(.*?)<\/h\1>/gi;
  let m;
  while ((m = re.exec(html)) !== null) {
    headings.push({ level: parseInt(m[1]), id: m[2], text: m[3].replace(/<[^>]+>/g, '') });
  }
  return headings;
}

function buildToc(headings) {
  return headings.map(h => {
    const cls = h.level === 3 ? ' class="section-link"' : '';
    return `<a href="#${h.id}"${cls}>${h.text}</a>`;
  }).join('\n');
}

function slugify(text) {
  return text.toLowerCase().replace(/[^\w\s-]/g, '').replace(/[\s_-]+/g, '-').replace(/^-+|-+$/g, '');
}

const renderer = new marked.Renderer();

// Override heading to add id attribute
renderer.heading = function(text, level, raw) {
  const id = slugify(text);
  return `<h${level} id="${id}">${text}</h${level}>\n`;
};

// Override image to use figure/figcaption
renderer.image = function(href, title, text) {
  const cap = title || text || '';
  return `<figure class="screenshot"><img src="${href}" alt="${text}"><figcaption>${cap}</figcaption></figure>`;
};

marked.setOptions({ renderer, gfm: true, breaks: false });

function build() {
  if (!fs.existsSync(DIST_DIR)) fs.mkdirSync(DIST_DIR, { recursive: true });

  const sectionFiles = fs.readdirSync(SECTIONS_DIR)
    .filter(f => f.endsWith('.md'))
    .sort();

  let combinedHtml = '';
  for (const file of sectionFiles) {
    const md = fs.readFileSync(path.join(SECTIONS_DIR, file), 'utf8');
    combinedHtml += marked.parse(md) + '\n';
  }

  const headings = extractHeadings(combinedHtml);
  const toc = buildToc(headings);
  let template = fs.readFileSync(TEMPLATE_FILE, 'utf8');

  template = template
    .replaceAll('{{VERSION}}', META.VERSION)
    .replaceAll('{{DATE}}', META.DATE)
    .replaceAll('{{ISSUE}}', META.ISSUE)
    .replaceAll('{{TOC}}', toc)
    .replaceAll('{{CONTENT}}', combinedHtml);

  fs.writeFileSync(OUTPUT_FILE, template, 'utf8');
  console.log(`✓ Built: ${OUTPUT_FILE}`);
  console.log(`  Sections: ${sectionFiles.length}`);
  console.log(`  TOC entries: ${headings.length}`);
}

build();
