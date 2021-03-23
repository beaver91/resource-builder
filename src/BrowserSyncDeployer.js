import browserSync from 'browser-sync';

export class BrowserSyncDeployer {
  #options;

  constructor() {
    this.#options = {};
    this.#options.host = 'localhost';
    this.#options.notify = true;
    this.#options.localOnly = true;
    this.#options.watchOptions = {
      usePolling: true,
      interval: 250,
    };
  }

  /**
   * @param {Array} dirs 
   */
  watchDirs(dirs) {
    if (!(dirs instanceof Array)) {
      throw new TypeError(`배열이 입력되어야 합니다. (${dirs})`);
    }

    this.#options.files = '../';
  }

  start() {
    browserSync.init(this.#options);
  }
}