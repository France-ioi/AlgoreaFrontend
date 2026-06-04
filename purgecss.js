const fs = require('fs');
const path = require('path');
const { PurgeCSS } = require('purgecss');

const distPath = process.argv.slice(2)[0];

if (!distPath) {
  console.log('Need to provide path to dist folder');
  process.exit(1);
}

const cssFilesFolderPath = distPath;
const contentFilesFolderPath = [
  `${distPath}/**/*.html`,
  `${distPath}/**/*.js`,
];

const primeNgSafelist = [
  'p-toast-message-success',
  'p-toast-message-info',
  'p-toast-message-warn',
  'p-toast-message-error',
  'p-sorticon',
  'p-tableheadercheckbox',
  'p-tooltip',
  'p-tooltip-arrow',
  'p-tooltip-text',
  'p-tooltip-right',
  'p-tooltip-left',
  'p-tooltip-top',
  'p-tooltip-bottom',
  'tooltip-custom',
  'p-message',
  'p-message-wrapper',
  'p-message-success',
  'p-message-info',
  'p-message-error',
  'p-message-icon',
  'p-message-close-icon',
];

/** Regular-weight Phosphor icons referenced dynamically (ngClass, saved settings, etc.). */
function phosphorRegularSafelist() {
  const leftNavIconsPath = path.join(__dirname, 'src/app/items/models/left-nav-icons.ts');
  const content = fs.readFileSync(leftNavIconsPath, 'utf8');
  const catalogIcons = [ ...content.matchAll(/^\s+'([a-z0-9-]+)',$/gm) ]
    .map(([, name]) => `ph-${name}`);

  const navDefaults = [
    'ph-file-text',
    'ph-folder-simple',
    'ph-folder-simple-lock',
    'ph-file-lock',
    'ph-files',
    'ph-graduation-cap',
    'ph-users-three',
  ];

  return [ 'ph', ...navDefaults, ...catalogIcons ];
}

const phosphorPattern = /^ph-[\w-]+$/;

async function run() {
  const allCssFiles = getAllCssFiles(cssFilesFolderPath);

  if (allCssFiles.length === 0) {
    console.log('Css files are not found.');
    return;
  }

  const data = allCssFiles.map(file => ({
    file,
    originalSize: `${getFilesizeInKB(file)}kb`,
  }));

  console.log('Run PurgeCSS...');

  const purgeCSSResults = await new PurgeCSS().purge({
    content: contentFilesFolderPath,
    css: allCssFiles,
    safelist: {
      standard: [ ...primeNgSafelist, ...phosphorRegularSafelist() ],
      // Keep compound selectors like `.ph.ph-puzzle-piece:before` for dynamic icon classes.
      deep: [ phosphorPattern ],
      greedy: [ phosphorPattern ],
    },
  });

  for (const result of purgeCSSResults) {
    fs.writeFileSync(result.file, result.css, 'utf8');
  }

  console.table(
    data.map(fileData => ({
      ...fileData,
      newSize: `${getFilesizeInKB(fileData.file)}kb`,
    })),
  );
}

run().catch(error => {
  console.error(`PurgeCSS error: ${error.message}`);
  process.exit(1);
});

function getFilesizeInKB(filename) {
  const stats = fs.statSync(filename);
  const fileSizeInBytes = stats.size / 1024;
  return fileSizeInBytes.toFixed(2);
}

function getAllCssFiles(dir, extension = '.css', arrayOfFiles = []) {
  const files = fs.readdirSync(dir);

  files.forEach(file => {
    const filePath = `${dir}/${file}`;

    if (fs.statSync(filePath).isDirectory()) {
      arrayOfFiles = getAllCssFiles(filePath, extension, arrayOfFiles);
    } else if (file.endsWith(extension)) {
      arrayOfFiles.push(path.join(filePath));
    }
  });

  return arrayOfFiles;
}
