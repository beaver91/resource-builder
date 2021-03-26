import fs from 'fs'
import watch from 'node-watch'
import { spawn } from 'child_process'
import consoleTable from 'console-table-printer'
import { SassDeployer, COMPRESSED } from './SassDeployer.js'
import { chcp, verbose, spawnIO, packageInfo, NL, remove } from './intercept.js'
import colors from 'colors'

export const OUTPUT_DIR = 'lib/style/dist'

export class DirectoryWatcher {
  dir

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
    watch(this.dir, { recursive: true/*, filter: */ }, this._fileHook)
  }

  /**
   * 파일 변경이 감지될 시 해당 콜백 메소드로 데이터가 넘어온다.
   * @param {string} method 'update'|'remove'
   * @param {string} filepath 
   */
  _fileHook(method, filepath) {
    filepath = DirectoryWatcher.pathNormalize(filepath)

    const site = DirectoryWatcher.extractSiteName(filepath)
    const { filename, ext } = DirectoryWatcher.filetype(filepath)
    const outdir = `${process.env.WEB_DIR}${site}/${OUTPUT_DIR}`

    switch (ext) {
      case 'scss':
      case 'sass':
        if (method == 'update') {
          if (!filename.startsWith('_')) {
            DirectoryWatcher.compileSCSS(outdir, filepath)
          }
        } else if (method == 'remove') {
          const remove1 = `${outdir}/${filename}.css`
          const remove2 = remove1 + '.map'

          verbose(NL)
          verbose(['remove', remove1])
          verbose(['remove', remove2])

          remove(remove1)
          remove(remove2)
        }
      break
      default:
    }
  }

  static compileSCSS(outdir, filepath) {
    const deployer = new SassDeployer(outdir, [filepath])
  
    deployer.enableSourceMap()
    deployer.disableSourceComments()
    deployer.setOutputStyle(COMPRESSED)

    const commands = deployer.buildCommand('build')
    verbose(NL)
    verbose(commands)

    const childProcess = spawn(chcp(commands[0]), commands.slice(1), { shell: true })
    spawnIO(childProcess, deployer.engine)
  }

  static extractSiteName(path) {
    return path.split(/[\\\/]+/)[1]
  }

  /**
   * @param {string} path 
   * @return {object}
   */
  static filetype(path) {
    let splitted = path.split('/').splice(-1)[0]
    let fileInfo = splitted.split('.')

    return {
      "filename": fileInfo[0],
      "ext": String(fileInfo[1]).toLowerCase().trim()
    }
  }

  static pathNormalize(path) {
    return path.replace(/\\+/g, '/')
  }
}