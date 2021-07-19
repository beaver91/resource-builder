import fs from 'fs'
import nodePath from 'path'
import watch from 'node-watch'
import { execSync } from 'child_process'
import consoleTable from 'console-table-printer'
import { SassDeployer, COMPRESSED, NODE_SASS, DART_SASS } from './SassDeployer.js'
import { verbose, packageInfo, NL, remove } from './intercept.js'
import colors from 'colors'
import versioning from './Versioning.js';
import importTree from './ImportTree.js';

export const OUTPUT_DIR = 'lib/style/dist'

export class DirectoryWatcher {
  dir;
  #watcher;
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
    importTree.scan(this.dir);
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
  start(useVersioning = false) {
    this.#watcher = watch(this.dir, {
      recursive: true,
      filter(f, skip) {
        if (/\/node_modules/.test(f)) return skip
        if (/\.git/.test(f)) return skip
        if (/\.resources/.test(f)) return skip
        if (/\.idea/.test(f)) return skip
        return true
      },
      delay : 500
    }, this._executeTask)
    if (useVersioning) {
      versioning.scan();
    }
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
          importTree.create(filepathNormalized, dir);
          if (filename.startsWith('_')) {
            const targetFiles = importTree.resolveSCSS(filepathNormalized);
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

          // 브랜치 변경할때 문제가 될 수 있음
          importTree.delete(filepathNormalized);
        }
      break;
    case 'css':
      // if (method == 'update') {
      //   let r = execSync('git diff --name-only --diff-filter=U', {cwd : process.env.WEB_DIR});
      //   console.log(r.toString());
      // }
      if (method == 'update' && versioning.compare(filepathNormalized) === false) {
        const scssPath = importTree.getMainSCSS(process.env.WEB_DIR, site, filename);
        if (scssPath) {
          console.log('\n', `${colors.red(`css 파일 변경이 감지되었습니다. ${scssPath} 파일을 다시 컴파일합니다.`)}`);
          DirectoryWatcher.compileSCSS(outdir, scssPath);
        }
      }
      break;
      default:
    }
  }

  static async compileSCSS(outdir, filepath) {
    const deployer = new SassDeployer(outdir, Array.isArray(filepath) ? filepath : [filepath]);

    deployer.useJsMode();
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
}
