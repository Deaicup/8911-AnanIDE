const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const nativeBinding = path.join(root, 'node_modules', 'drivelist', 'build', 'Release', 'drivelist.node');
const backendBundle = path.join(root, 'packages', 'theia-app', 'lib', 'backend', 'main.js');
const needle = 'return require("drivelist/build/Release/drivelist.node");';
const replacement = 'return { list: callback => callback(null, []) };';

if (fs.existsSync(nativeBinding)) {
  console.log('drivelist native binding exists; no Theia backend patch needed.');
  process.exit(0);
}

if (!fs.existsSync(backendBundle)) {
  console.log('Theia backend bundle does not exist yet; skipping drivelist patch.');
  process.exit(0);
}

const source = fs.readFileSync(backendBundle, 'utf-8');
if (source.includes(replacement)) {
  console.log('Theia drivelist fallback patch is already applied.');
  process.exit(0);
}

if (!source.includes(needle)) {
  console.warn('Theia drivelist binding pattern was not found; startup may still require native drivelist.');
  process.exit(0);
}

fs.writeFileSync(backendBundle, source.replace(needle, replacement), 'utf-8');
console.log('Applied Theia drivelist fallback patch.');
