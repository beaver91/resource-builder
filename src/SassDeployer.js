import { cat } from './intercept.js'
import md5 from 'md5'
import fs from 'fs'
import nodePath from 'path'
import sass from 'sass'

export const NESTED = 'nested'
export const EXPANDED = 'expanded'
export const COMPACT = 'compact'
export const COMPRESSED = 'compressed'
export const SASS_OUTPUT_STYLES = [NESTED, EXPANDED, COMPACT, COMPRESSED]
export const NODE_SASS = 'node-sass'
export const DART_SASS = 'dart-sass'
export const DEFAULT_ENGINE = NODE_SASS
export const ABSOLUTE_MASK = '~'

export class SassDeployer {
  output
  files
  #options
  #engine
  #recoverPaths
  #importer
  /**
   * @param {string} output
   * @param {array} files
   */
  constructor(output, files) {
    this.output = output
    this.files = files

    this.#recoverPaths = {}
    this.#engine = NODE_SASS
    this.#options = {
      "--output-style": SASS_OUTPUT_STYLES[0], // default is 'nested'
      // "--indent-type": 'space',
    }
    this.#importer = function() {};
  }

  enableSourceMap() {
    this.#options['--source-map'] = true
  }

  disableSourceMap() {
    for (let option of ['--source-map']) {
      if (option in this.#options) {
        delete this.#options[option]
      }
    }
  }

  enableSourceComments() {
    this.#options['--source-comments'] = true
  }

  disableSourceComments() {
    if ('--source-comments' in this.#options) {
      delete this.#options['--source-comments']
    }
  }

  useJsMode() {
    this.#engine = DART_SASS;
  }

  setImporter(fn) {
    this.#importer = fn;
  }

  setOutputStyle(type) {
    type = String(type).toLowerCase()

    if (SASS_OUTPUT_STYLES.indexOf(type) == -1) {
      throw new Error(`다음 타입 중 선택되어야 합니다. (${SASS_OUTPUT_STYLES.join(', ')})`)
    }

    this.#options['--output-style'] = type
  }

  resolveAbsolutePaths() {
    this.#recoverPaths = {}

    for (let i = 0; i < this.files.length; i++) {
      let file = this.files[i]
      let text = fs.readFileSync(file).toString()
      let matches = [...text.matchAll(/@import\s+\'(?<path>.*)\'\;/gm)]

      if (matches.length > 0 && !(file in this.#recoverPaths)) {
        this.#recoverPaths[file] = []
      }

      for (let match of matches) {
        this.#recoverPaths[file].push({
          "originPath": match[0],
          "path": match.groups.path,
        })

        if (match.groups.path.startsWith(ABSOLUTE_MASK)) {
          let resolvedPath = match.groups.path.replace(
            new RegExp(`^${ABSOLUTE_MASK}\/?`, 'i'),
            `${process.env.WEB_DIR}`,
          )

          text = text.replace(
            match[0],
            `@import '${resolvedPath}';`,
          )
        }
      }

      let passivePath = `./.passive/${md5(file)}/`
      let passiveFilename = `${file.split('/').slice(-1)[0]}`
      let passiveFile = passivePath + passiveFilename

      if (!fs.existsSync(passivePath)) {
        fs.mkdirSync(passivePath, { recursive: true })
      }

      fs.writeFileSync(passiveFile, text)

      // **실제 파일 경로가 아닌 passive 파일로 변경**
      this.files[i] = passiveFile
    }
  }

  /**
   * @param {string} type 'watch' | 'build'
   * @return {string}
   */
  buildCommand(type) {
    switch (this.#engine) {
      case DART_SASS:
        return this._dartSass();
      case NODE_SASS:
        return this._nodeSass(type)
      default:
        return this._nodeSass(type)
    }
  }

  /**
   * @examples `node-sass --watch .\resources\sass\test.scss .\resources\sass\test2.scss --output .\dist\`
   * @param {string} type
   * @return {Array}
   */
  _nodeSass(type) {
    let commands = ['node ./node_modules/node-sass/bin/node-sass', ...this._options()]
    // let commands = ['node-sass', ...this._options()]
    let opt1 = (type == 'watch') ? '--watch' : null
    let inputs = this.files
    let output = this.output

    commands = [...commands, opt1, ...inputs].filter(r => r != null)
    commands = [...commands, '--output', output]

    return commands
  }

  _dartSass() {
    let r = [];
    for (const file of this.files.filter(f => fs.existsSync(f))) {
      const filename = file.match(/\/([^/]+)\.scss$/)[1];
      const cssPath = `${this.output.replace(/..\/[^/]+/, file.match(/..\/[^/]+/)[0])}/${filename}.css`;
      try {
        const result = sass.renderSync({
          file : file,
          outputStyle : this.#options['--output-style'],
          sourceComments : '--source-comments' in this.#options,
          sourceMap : '--source-map' in this.#options,
          outFile : nodePath.resolve(cssPath),
          importer : this.#importer
        });
        fs.writeFileSync(cssPath, result.css);
        result.map && fs.writeFileSync(`${cssPath}.map`, result.map);
        r.push(`${file} -> ${cssPath}`);
      } catch (e) {
        fs.writeFileSync(cssPath, e.formatted);
        r.push(`${file} 파일 컴파일 - ${e.file} 파일에 오류가 있습니다.`);
      }
    }
    return r;
  }

  /**
   * @return {Array}
   */
  _options() {
    let options = []

    for (const [key, value] of Object.entries(this.#options)) {
      if (value instanceof Boolean && value) {
        options.push(key)
      } else {
        options.push(key)
        options.push(value)
      }
    }

    return options
  }

  get engine() {
    return this.#engine
  }
}
