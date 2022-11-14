const exec = require('child_process').exec;
const fs = require('fs');
const path = require('path');

const distPath = process.argv.slice(2)[0];

if (!distPath) {
    console.log('Need to provide path to dist folder');
    return;
}

const cssFilesFolderPath = distPath;
const contentFilesFolderPath = [
    `${ distPath }/**/*.html`,
    `${ distPath }/**/*.js`,
];
const allCssFiles = getAllCssFiles(cssFilesFolderPath);

if (allCssFiles.length === 0) {
    console.log('Css files are not found.');
    return;
}

const data = allCssFiles.map(file => ({
    file,
    originalSize: `${ getFilesizeInKB(file) }kb`,
}));

let cmd = data.map(fileData =>
    `npx purgecss -css ${fileData.file} --content ${ contentFilesFolderPath.join(' ') } -o ${ fileData.file }`
);

console.log('Run PurgeCSS...');

exec(cmd.join(' & '), (error, stdout, stderr) => {
    if (error) {
        console.error(`PurgeCSS error: ${ error.message }`);
    }

    console.table(
        data.map(fileData => ({
            ...fileData,
            newSize: `${ getFilesizeInKB(fileData.file) }kb`,
        }))
    );
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
        } else {
            if (file.endsWith(extension)) {
                arrayOfFiles.push(path.join(filePath));
            }
        }
    }, []);

    return arrayOfFiles;
}
