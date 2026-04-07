const fs = require('node:fs');
const path = require('node:path');

const targetFile = path.join(
  __dirname,
  '..',
  'node_modules',
  '@angular',
  'build',
  'src',
  'tools',
  'vite',
  'middlewares',
  'assets-middleware.js',
);

if (!fs.existsSync(targetFile)) {
  console.log('[patch-angular-vite-fs-encoding] Skip: target file not found.');
  process.exit(0);
}

const original = fs.readFileSync(targetFile, 'utf8');

if (original.includes('function encodeFsPathForVite(')) {
  console.log('[patch-angular-vite-fs-encoding] Already patched.');
  process.exit(0);
}

const helper = [
  'function encodeFsPathForVite(filePath) {',
  '    // encodeURI keeps # and ?, but in URLs these break @fs paths by starting hash/query sections.',
  "    return encodeURI(filePath).replace(/#/g, '%23').replace(/\\?/g, '%3F');",
  '}',
  '',
].join('\n');

let updated = original.replace(
  'const JS_TS_REGEXP = /\\.[cm]?[tj]sx?$/;',
  "const JS_TS_REGEXP = /\\.[cm]?[tj]sx?$/;\n" + helper,
);

updated = updated.replace(
  'req.url = `${server.config.base}@fs/${encodeURI(asset.source)}`;',
  'req.url = `${server.config.base}@fs/${encodeFsPathForVite(asset.source)}`;',
);

updated = updated.replace(
  'req.url = `${server.config.base}@fs/${encodeURI(htmlAssetSourcePath.source)}`;',
  'req.url = `${server.config.base}@fs/${encodeFsPathForVite(htmlAssetSourcePath.source)}`;',
);

if (updated === original) {
  console.log('[patch-angular-vite-fs-encoding] Skip: expected source markers not found.');
  process.exit(0);
}

fs.writeFileSync(targetFile, updated, 'utf8');
console.log('[patch-angular-vite-fs-encoding] Patch applied.');

