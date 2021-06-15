import fs from 'fs'
import nodePath from 'path'
import glob from 'glob'
import watch from 'node-watch'
import { execSync } from 'child_process'
import consoleTable from 'console-table-printer'
import { SassDeployer, COMPRESSED, NODE_SASS, DART_SASS } from './SassDeployer.js'
import { verbose, packageInfo, NL, remove } from './intercept.js'
import colors from 'colors'

export const OUTPUT_DIR = 'lib/style/dist'

export class DirectoryWatcher {
  dir;
  #watcher;
  static importTree = new Map();
  static reversImportTree = new Map();
  static tasks = [];

  constructor(dir) {
    this.dir = dir
  }

  /**
   * @throw {ReferenceError}
   * @return boolean
   */
  isValid() {
    if (!fs.existsSync(this.dir)) {
      throw new ReferenceError(`${colors.red('해당 디렉토리를 찾을 수 없습니다.')} (${colors.strikethrough(this.dir)})`)
    }
    DirectoryWatcher.scanImportTree(this.dir);
    return true
  }

  /**
   * @return void
   */
  stats() {
    const { printTable } = consoleTable
    const pkgInfo = packageInfo()
    let table = []

    verbose(NL)
    table.push({ "MetaTag": colors.yellow("App"), "MetaData": `${pkgInfo.name} (${colors.green(pkgInfo.version)})` })
    table.push({ "MetaTag": colors.yellow("Description"), "MetaData": pkgInfo.description })
    table.push({ "MetaTag": colors.yellow("Repository"), "MetaData": colors.brightBlue.underline(pkgInfo.homepage) })

    printTable(table)
  }

  /**
   * @return void
   */
  start() {
    this.#watcher = watch(this.dir, {
      recursive: true,
      filter(f, skip) {
        if (/\/node_modules/.test(f)) return skip
        if (/\.git/.test(f)) return skip
        if (/\.resources/.test(f)) return skip
        if (/\.idea/.test(f)) return skip
        return true
      }
    }, this._executeTask)
  }

  /**
   * 파일 변경이 감지될 시 해당 콜백 메소드로 데이터가 넘어온다.
   * @param {string} method 'update'|'remove'
   * @param {string} filepath
   */
  _executeTask(method, filepath) {
    const filepathNormalized = DirectoryWatcher.pathNormalize(filepath)

    const site = DirectoryWatcher.extractSiteName(filepathNormalized)
    const { filename, dir, ext } = DirectoryWatcher.filetype(filepathNormalized)
    const outdir = `${process.env.WEB_DIR}${site}/${OUTPUT_DIR}`

    switch (ext) {
      case 'scss':
      case 'sass':
        if (method == 'update') {
          DirectoryWatcher.createImportTree(filepathNormalized, dir);
          if (filename.startsWith('_')) {
            const targetFiles = DirectoryWatcher.resolveSCSS(filepathNormalized);
            if (targetFiles.size) {
              DirectoryWatcher.compileSCSS(outdir, Array.from(targetFiles));
            }
          } else {
            DirectoryWatcher.compileSCSS(outdir, filepathNormalized);
          }
        } else if (method == 'remove') {
          const remove1 = `${outdir}/${filename}.css`
          const remove2 = remove1 + '.map'

          verbose(NL)
          verbose(['remove', remove1])
          verbose(['remove', remove2])

          remove(remove1)
          remove(remove2)

          if (DirectoryWatcher.reversImportTree.has(filepathNormalized)) {
            for (const path of DirectoryWatcher.reversImportTree.get(filepathNormalized)) {
              if (DirectoryWatcher.importTree.has(path)) {
                DirectoryWatcher.importTree.get(path).delete(filepathNormalized);
              }
            }
            DirectoryWatcher.reversImportTree.delete(filepathNormalized);
          }
        }
      break
      default:
    }
  }

  static async compileSCSS(outdir, filepath) {
    const deployer = new SassDeployer(outdir, Array.isArray(filepath) ? filepath : [filepath]);

    deployer.useJsMode();
    deployer.setImporter(DirectoryWatcher.resolveImportPath);
    deployer.enableSourceMap();
    deployer.disableSourceComments();
    deployer.setOutputStyle(COMPRESSED);

    // TODO test
    // deployer.resolveAbsolutePaths()

    const commands = deployer.buildCommand('build');

    verbose(NL);
    verbose(commands);
    if (deployer.engine == NODE_SASS) {
      // const childProcess = spawn(chcp(commands[0]), commands.slice(1), { cwd: path.resolve(), shell: true })
      // spawnIO(childProcess, deployer.engine)

      let output = execSync(commands.join(' '))
      console.log(output.toString())
    }
  }

  static extractSiteName(path) {
    return path.split(/[\\\/]+/)[1]
  }

  /**
   * @param {string} path
   * @return {object}
   */
  static filetype(path) {
    let pathInfo = nodePath.parse(path);
    const filename = pathInfo.name, dir = pathInfo.dir, ext = pathInfo.ext.substr(1);
    return {filename, dir, ext};
  }

  static pathNormalize(path) {
    return path.replace(/\\+/g, '/')
  }

  static normalizeImportPath(importPath) {
    importPath = importPath.split('/');
    let lastPart = importPath.pop();
    if (lastPart.startsWith('_')) {
      importPath.push(lastPart.substr(1).replace('.scss', ''));
    } else {
      importPath.push(lastPart);
    }
    return importPath.join('/');
  }

  static createImportTree(filePath, dirPath) {
    let importPathArray = [],
      baseFilePath = DirectoryWatcher.normalizeImportPath(nodePath.posix.resolve('../', filePath));
    const contents = fs.readFileSync(filePath, 'utf8'),
      matches = contents.replace(/\/\*.+?\*\//gs, '').matchAll(/(?<!\/\/\s*)@import\s*(['"])(?!\/\/)(.+)(?!.+\1)\1;/g);
    for (const match of matches) {
      let importPath = DirectoryWatcher.resolveImportPath(match[2], baseFilePath).file;
      if (importPath == match[2]) {
        importPath = nodePath.posix.resolve('../', dirPath, importPath);
      }
      importPath = DirectoryWatcher.normalizeImportPath(importPath);

      if (!DirectoryWatcher.importTree.has(importPath)) {
        DirectoryWatcher.importTree.set(importPath, new Set());
      }

      if (importPath != baseFilePath) {
        DirectoryWatcher.importTree.get(importPath).add(baseFilePath);
        importPathArray.push(importPath);
      }
    }

    if (!DirectoryWatcher.reversImportTree.has(baseFilePath)) {
      DirectoryWatcher.reversImportTree.set(baseFilePath, new Set());
    }

    for (const path of DirectoryWatcher.reversImportTree.get(baseFilePath)) {
      if (!importPathArray.includes(path)) {
        DirectoryWatcher.importTree.get(path).delete(baseFilePath);
      }
    }
    DirectoryWatcher.reversImportTree.set(baseFilePath, new Set(importPathArray));
  }

  static scanImportTree(dir) {
    const start = Date.now();
    console.log(`${colors.cyan('import 의존성 스캔 시작')}`);
    for (const path of glob.sync(`${dir}*/lib/style/**/*.scss`)) {
      DirectoryWatcher.createImportTree(path, nodePath.dirname(path));
    }
    console.log(`${colors.cyan('import 의존성 스캔 종료')}`);
    console.log(`${colors.yellow(Date.now() - start)}ms 소요`);
  }

  static resolveSCSS(path) {
    let r = [];
    path = DirectoryWatcher.normalizeImportPath(nodePath.posix.resolve('../', path));
    if (DirectoryWatcher.importTree.has(path)) {
      for (const file of DirectoryWatcher.importTree.get(path)) {
        if (/\.scss$/.test(file)) {
          r.push(file);
        } else {
          r = r.concat(Array.from(DirectoryWatcher.resolveSCSS(file)));
        }
      }
    }
    return new Set(r);
  }

  static resolveImportPath(url, prev) {
    url = url.replace(/^~\/([^/]+)(?:\/lib\/style)?/, '../$1/lib/style');
    return {file : url};
  }
}
