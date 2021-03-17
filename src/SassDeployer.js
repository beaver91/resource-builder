
export const SASS_OUTPUT_STYLES = ['nested', 'expanded', 'compact', 'compressed'];

export class SassDeployer {
  uid;
  output;
  files;
  #options;

  /**
   * @param {string} uid
   * @param {string} output 
   * @param {array} files 
   */
  constructor(uid, output, files) {
    this.uid = uid;
    this.output = output;
    this.files = files;

    this.#options = {
      "--source-map": false,
      "--output-style": SASS_OUTPUT_STYLES[0],
    };
  }

  enableSourceMap() {
    this.#options['--source-map'] = true;
  }

  disableSourceMap() {
    this.#options['--source-map'] = false;
  }

  setOutputStyle(type) {
    type = String(type).toLowerCase();

    if (SASS_OUTPUT_STYLES.indexOf(type) == -1) {
      throw new Error("다음 타입 중 선택되어야 합니다. (nested, expanded, compact, compressed)");
    }

    this.#options['--output-style'] = type;
  }
}