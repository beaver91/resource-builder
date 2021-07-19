import 'dotenv/config.js';
import fs from 'fs';
import { createHash } from 'crypto';
import glob from 'glob';

export default (new class {
  #use = false;
  #hash = createHash('md5');
  #list = new Map();
  #bakupList = new Map();
  constructor() {
    // this.scan();
  }

  get(path) {
    if (this.#use) {
      return this.#list.has(path) ? this.#list.get(path) : -1;
    } else {
      return -1;
    }
  }

  set(path, contents = null) {
    if (this.#use) {
      this.#bakupList.set(path, this.get(path));
      this.#list.set(path, this.hex(contents ? contents : fs.readFileSync(path)));
    }
  }

  delete(path) {
    if (this.#use) {
      this.#list.delete(path);
    }
  }

  scan(dir = '*') {
    this.#use = true;
    for (const path of glob.sync(`${process.env.WEB_DIR}${dir}/lib/style/dist/*.css`)) {
      this.set(path);
    }
    console.log(`${this.#list.size}개 css 파일 버전 확인`);
  }

  hex(contents) {
    return this.#hash.copy().update(contents).digest('hex');
  }

  compare(path) {
    const hash = this.get(path);
    if (hash === -1 || !fs.existsSync(path)) {
      return -1;
    }
    const fileHash = this.hex(fs.readFileSync(path));
    return hash == fileHash || this.#bakupList.get(path) == hash;
  }
});
