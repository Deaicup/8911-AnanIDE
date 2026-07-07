import * as fs from 'fs';
import * as path from 'path';
import { expect, test } from '@playwright/test';

const root = path.resolve(__dirname, '../..');

test('Electron points at the Theia server safely', async () => {
  const source = fs.readFileSync(path.join(root, 'packages/electron/src/main.ts'), 'utf-8');

  expect(source).toContain("process.env.ANAN_THEIA_URL || 'http://localhost:3000'");
  expect(source).toContain('mainWindow.loadURL(theiaUrl)');
  expect(source).toContain('contextIsolation: true');
  expect(source).toContain('nodeIntegration: false');
});

test('Anan themes are registered for the Theia app', async () => {
  const source = fs.readFileSync(path.join(root, 'packages/theia-app/src/browser/style/anan-themes.ts'), 'utf-8');

  expect(source).toContain("id: 'anan-pink'");
  expect(source).toContain("id: 'anan-blue'");
  expect(source).toContain("id: 'anan-dark'");
  expect(source).toContain('ANAN_THEMES');
});
