
export const SASS_OUTPUT_STYLES = ['nested', 'expanded', 'compact', 'compressed'];
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
      "--indent-type": 'space',
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

  setOutputStyle(type) {
    type = String(type).toLowerCase();

    if (SASS_OUTPUT_STYLES.indexOf(type) == -1) {
      throw new Error(`다음 타입 중 선택되어야 합니다. (${SASS_OUTPUT_STYLES.join(', ')})`);
    }

    this.#options['--output-style'] = type;
  }

  /**
   * @return {string}
   */
  buildCommand() {
    switch (this.#engine) {
      case NODE_SASS:
        return this._nodeSass();
      break;
      default:
        return this._nodeSass();
    }
  }

  /**
   * @examples `node-sass --watch .\resources\sass\test.scss .\resources\sass\test2.scss --output .\dist\`
   * @return {Array}
   */
  _nodeSass() {
    // let commands = ['./node_modules/node-sass/bin/node-sass'];
    let commands = ['node-sass', ...this._options()];

    commands = [...commands, '--watch', ...this.files];
    commands = [...commands, '--output', this.output];
    // commands = [...commands, '--output', './dist/'];

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
}