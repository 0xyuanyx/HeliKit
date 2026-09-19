// Copies the static web app into www/ for Capacitor (tests and docs excluded).
import { cpSync, mkdirSync, readdirSync, rmSync } from 'node:fs';

const out = 'www';
rmSync(out, { recursive: true, force: true });
mkdirSync(out);

const rootFiles = readdirSync('.').filter(name =>
  name === 'index.html' || name === 'style.css' || name.endsWith('.svg') || name.endsWith('.png')
  || (name.endsWith('.mjs') && !name.endsWith('.test.mjs')));
for (const name of rootFiles) cpSync(name, `${out}/${name}`);
for (const dir of ['helicopter-icons', 'measurement-icons', 'vendor']) {
  cpSync(dir, `${out}/${dir}`, { recursive: true, filter: src => !src.endsWith('.DS_Store') });
}
console.log(`www/: ${rootFiles.join(', ')} + icons, vendor`);
