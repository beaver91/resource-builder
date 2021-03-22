import { cat } from './intercept.js';
import md5 from 'md5';

export const NESTED = 'nested';
export const EXPANDED = 'expanded';
export const COMPACT = 'compact';
export const COMPRESSED = 'compressed';
export const SASS_OUTPUT_STYLES = [NESTED, EXPANDED, COMPACT, COMPRESSED];
export const NODE_SASS = 'node-sass';
export const DEFAULT_ENGINE = NODE_SASS;

export class SassDeployer {
  uid;
  output;
  files;
  #options;
  #engine;

  /**
   * @param {string} uid
   * @param {string} output 
   * @param {array} files 
   */
  constructor(uid, output, files) {
    this.uid = uid;
    this.output = output;
    this.files = files;

    this.#engine = NODE_SASS;
    this.#options = {
      "--output-style": SASS_OUTPUT_STYLES[0], // default is 'nested'
      // "--indent-type": 'space',
    };
  }

  enableSourceMap() {
    this.#options['--source-map'] = true;
    this.#options['--source-map-root'] = true;
  }

  disableSourceMap() {
    for (let option of ['--source-map', '--source-map-root']) {
      if (option in this.#options) {
        delete this.#options[option];
      }
    }
  }

  enableSourceComments() {
    this.#options['--source-comments'] = true;
  }

  disableSourceComments() {
    if ('--source-comments' in this.#options) {
      delete this.#options['--source-comments'];
    }
  }

  setOutputStyle(type) {
    type = String(type).toLowerCase();

    if (SASS_OUTPUT_STYLES.indexOf(type) == -1) {
      throw new Error(`다음 타입 중 선택되어야 합니다. (${SASS_OUTPUT_STYLES.join(', ')})`);
    }

    this.#options['--output-style'] = type;
  }

  /**
   * @param {string} type
   * @return {string}
   */
  command(type) {
    switch (this.#engine) {
      case NODE_SASS:
        return this._nodeSass(type);
      break;
      default:
        return this._nodeSass(type);
    }
  }

  /**
   * @examples `node-sass --watch .\resources\sass\test.scss .\resources\sass\test2.scss --output .\dist\`
   * @param {string} type 
   * @return {Array}
   */
  _nodeSass(type) {
    // let commands = ['./node_modules/node-sass/bin/node-sass'];
    let commands = ['node-sass', ...this._options()];
    let opt1 = (type == 'watch') ? '--watch' : null;
    let inputs = this.files;
    let output = this.output;

    // build 모드일 경우 1개의 파일로 내용 통합
    if (type == 'build') {
      let filename = output.split(/[\/\\]+/).splice(-1)[0];
      inputs = `./.inven/${md5(output)}/${filename}`;

      // 임시파일 생성
      cat(this.files, inputs);

      inputs = [inputs];
    }

    commands = [...commands, opt1, ...inputs].filter(r => r != null);
    commands = [...commands, '--output', output];

    return commands;
  }

  /**
   * @return {Array}
   */
  _options() {
    let options = [];

    for (const [key, value] of Object.entries(this.#options)) {
      if (value instanceof Boolean && value) {
        options.push(key);
      } else {
        options.push(key);
        options.push(value);
      }
    }

    return options;
  }

  get engine() {
    return this.#engine;
  }
}