import fs from 'fs';
import nodePath from 'path';
import colors from "colors";
import glob from "glob";

export function importer(url, prev) {
  return {file : url.replace(/^~\/([^/]+)(?:\/lib\/style)?/, '../$1/lib/style').replace('.scss', '')};
};

export default (new class {
  #tree = new Map();
  #reversTree = new Map();

  normalizePath(importPath) {
    importPath = importPath.split('/');
    let lastPart = importPath.pop();
    if (lastPart.startsWith('_')) {
      importPath.push(lastPart.substr(1).replace('.scss', ''));
    } else {
      importPath.push(lastPart);
    }
    return importPath.join('/');
  }

  create(filePath, dirPath) {
    let importPathArray = [],
      baseFilePath = this.normalizePath(nodePath.posix.resolve('../', filePath));
    const contents = fs.readFileSync(filePath, 'utf8'),
      matches = contents.replace(/\/\*.+?\*\//gs, '').matchAll(/(?<!\/\/\s*)@import\s*(['"])(?!\/\/)(.+)(?!.+\1)\1;/g);
    for (const match of matches) {
      let importPath = importer(match[2], baseFilePath).file;
      if (importPath == match[2]) {
        importPath = nodePath.posix.resolve('../', dirPath, importPath);
      }
      importPath = this.normalizePath(importPath);

      if (!this.#tree.has(importPath)) {
        this.#tree.set(importPath, new Set());
      }

      if (importPath != baseFilePath) {
        this.#tree.get(importPath).add(baseFilePath);
        importPathArray.push(importPath);
      }
    }

    if (!this.#reversTree.has(baseFilePath)) {
      this.#reversTree.set(baseFilePath, new Set());
    }

    for (const path of this.#reversTree.get(baseFilePath)) {
      if (!importPathArray.includes(path)) {
        this.#tree.get(path).delete(baseFilePath);
      }
    }
    this.#reversTree.set(baseFilePath, new Set(importPathArray));
  }

  delete(filePath) {
    if (this.#reversTree.has(filePath)) {
      for (const path of this.#reversTree.get(filePath)) {
        if (this.#tree.has(path)) {
          this.#tree.get(path).delete(filePath);
        }
      }
      this.#reversTree.delete(filePath);
    }
  }

  scan(dir) {
    const start = Date.now();
    console.log(`${colors.cyan('import 의존성 스캔 시작')}`);
    for (const path of glob.sync(`${dir}*/lib/style/**/*.scss`)) {
      this.create(path, nodePath.dirname(path));
    }
    console.log(`${colors.cyan('import 의존성 스캔 종료')}`);
    console.log(`${colors.yellow(Date.now() - start)}ms 소요`);
  }

  resolveSCSS(path) {
    let r = [];
    path = this.normalizePath(nodePath.posix.resolve('../', path));
    if (this.#tree.has(path)) {
      for (const file of this.#tree.get(path)) {
        if (/\.scss$/.test(file)) {
          r.push(file);
        } else {
          r = r.concat(Array.from(this.resolveSCSS(file)));
        }
      }
    }
    return new Set(r);
  }

  getMainSCSS(dir, site, filename) {
    const path1 = `${dir}${site}/lib/style/${filename}.scss`;
    const path2 = `${dir}${site}/lib/style/scss/${filename}.scss`;
    let scssPath = '';
    if (this.#reversTree.has(path1)) {
      scssPath = path1;
    } else if (this.#reversTree.has(path2)) {
      scssPath = path2;
    }
    return scssPath;
  }

  resolvebySite(site = '*') {
    let filesOfSites = new Map(), regex = (site == '*') ? null : new RegExp(`^\\.\\.\\/(${site})\\/`);
    for (const path of this.#reversTree.keys()) {
      if (regex === null || regex.test(path)) {
        let files = this.resolveSCSS(path);
        if (/\.scss$/.test(path)) {
          files.add(path);
        }
        for (const scss of files) {
          const match = scss.match(/^\.\.\/([^/]+)/);
          if (match && !filesOfSites.has(match[1])) {
            filesOfSites.set(match[1], new Set());
          }
          filesOfSites.get(match[1]).add(scss);
        }
      }
    }
    return filesOfSites;
  }
});
