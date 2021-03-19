import fs from 'fs';
import path from 'path';
import os from 'os';
import md5 from 'md5';
import { fileURLToPath } from 'url';
import consoleTable from 'console-table-printer';
import colors from 'colors';
import { SassDeployer, NESTED, COMPRESSED } from './SassDeployer.js';
import { spawn } from 'child_process';
import { chcp, verbose, spawnIO } from './intercept.js';

export class ResourceBuilder {
  #deployers;
  #filepath;
  resources;

  constructor(filepath) {
    this.#deployers = {};
    this.#filepath = filepath;
    this.resources = JSON.parse(fs.readFileSync(this.#filepath));
  }

  stats() {

  }

  /**
   * @return {boolean}
   */
  isValid() {
    for (let site in this.resources) {
      for (let output in this.resources[site]) {
        let files = this.resources[site][output];

        if (files instanceof Array) {
          for (let file of files) {
            if (!fs.existsSync(file)) {
              throw new ReferenceError(`해당 파일이 존재하지 않습니다. (site: ${site}, output: ${output}, file: ${file})`);
            }
          }
        } else {
          throw new TypeError(`배열이 입력되어야 합니다. (site: ${site}, output: ${output})`);
        }
      }
    }

    return true;
  }

  /**
   * @return {Array}
   */
  getSites() {
    let sites = [];

    for (let site in this.resources) {
      sites.push(site);
    }

    return sites;
  }

  /**
   * @param {Array} sites 
   */
  setSites(sites) {
    if (!(sites instanceof Array)) {
      throw new TypeError(`배열이 입력되어야 합니다. (${sites})`);
    }

    for (let idx in sites) {
      let site = sites[idx];
      let resources = this.resources[site];

      for (let outdir in resources) {
        let output = this.resolvePath(site, outdir);
        let uid = md5(output);
        let files = resources[outdir];

        this.#deployers[uid] = new SassDeployer(uid, output, files);
      }
    }
  }

  /**
   * @param {string} site 
   * @param {string} outdir 
   * @return {string}
   */
  resolvePath(site, outdir) {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const ROOT_PATH = __dirname.split('.resources')[0];

    /**
     * @return {Array}
     */
    const fnResolveAddPath = function (path) {
      return path.split('/').filter(r => !!r);
    };

    let resolve = [ROOT_PATH];
    
    // `~` 특수 처리문자로 인벤 사이트 구조의 일반적인 파일 구성을 따른다.
    if (outdir.startsWith('~')) {
      resolve = [...resolve, site];

      switch (this.filetype(outdir)) {
        case 'css':
          resolve = [...resolve, 'lib', 'style'];
        break;
        case 'js':
          resolve = [...resolve, 'lib', 'js'];
        default:
      }

      resolve = [...resolve, ...fnResolveAddPath(outdir.substr(1))];
    } else {
      // TODO 커스텀 Path에 파일을 직접 지정할 수 있도록 기능 구현
    }

    return path.normalize(resolve.join(os.platform() == 'win32' ? '\\' : '/'));
  }

  filetype(outdir) {
    let splitted = outdir.split('.');
    return splitted[splitted.length - 1].toLowerCase();
  }

  monit() {
    const { printTable } = consoleTable;
    let table = [];

    for (let id in this.#deployers) {
      let watcher = this.#deployers[id];

      table.push({
        "deploy id": id.substr(0, 7),
        "files": watcher.files[0],
        "output": colors.brightBlue(watcher.output),
      });

      if (watcher.files.length > 1) {
        for (let idx = 1; idx < watcher.files.length; idx++) {
          table.push({ 
            "deploy id": "", 
            "files": watcher.files[idx],
            "output": "", 
          });
        }
      }
    }

    printTable(table);
  }

  watch() {
    for (let idx in this.#deployers) {
      let deployer = this.#deployers[idx];

      deployer.setOutputStyle(NESTED);
      deployer.enableSourceMap();
      deployer.enableSourceComments();

      let commands = deployer.command('watch');
      verbose(commands);

      let child = spawn(chcp(commands[0]), commands.slice(1), { shell: true });
      spawnIO(child, deployer.engine);
    }
  }

  build() {
    for (let idx in this.#deployers) {
      let deployer = this.#deployers[idx];

      deployer.setOutputStyle(COMPRESSED);
      deployer.disableSourceMap();
      deployer.disableSourceComments();

      let commands = deployer.command('build');
      verbose(commands);

      let child = spawn(chcp(commands[0]), commands.slice(1), { shell: true });
      spawnIO(child, deployer.engine);
    }
  }
}