const fs = require('fs');
const path = require('path');

const mainFile = path.resolve(__dirname, '../../packages/electron/src/main.ts');
const source = fs.readFileSync(mainFile, 'utf-8');

const checks = [
  ['uses ANAN_THEIA_URL override', "process.env.ANAN_THEIA_URL || 'http://localhost:3000'"],
  ['loads Theia through loadURL', 'mainWindow.loadURL(theiaUrl)'],
  ['keeps context isolation enabled', 'contextIsolation: true'],
  ['keeps node integration disabled', 'nodeIntegration: false'],
  ['uses single instance lock', 'requestSingleInstanceLock'],
];

const failures = checks.filter(([, snippet]) => !source.includes(snippet));

if (failures.length) {
  console.error('Electron smoke check failed:');
  for (const [name] of failures) {
    console.error(`- ${name}`);
  }
  process.exit(1);
}

console.log('Electron config smoke check passed.');
