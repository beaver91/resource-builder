import 'dotenv/config.js';
import { DirectoryWatcher, OUTPUT_DIR } from './src/DirectoryWatcher.js';
import glob from 'glob';
import colors from 'colors';
import importTree from './src/ImportTree.js';

const buildSites = process.argv.slice(2);
let dir = '*';
if (buildSites.length >= 1 && buildSites[0] != 'all') {
  dir = buildSites.join('|');
}
importTree.scan(process.env.WEB_DIR);
let logs = [[]];
for (const [site, files] of importTree.resolvebySite(dir)) {
  const outdir = `${process.env.WEB_DIR}${site}/${OUTPUT_DIR}`;
  DirectoryWatcher.compileSCSS(outdir, Array.from(files));
  logs[logs.length - 1].push(`${site} ${files.size}개`);
  if (logs[logs.length - 1].length % 10 == 0) {
    logs.push([]);
  }
}
console.log(`${colors.green(`${logs.map(l => l.join(', ')).join('\n')}\nscss 빌드 완료`)}`);
