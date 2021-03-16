export class ResourceWatcher {
  output;
  files;

  /**
   * @param {string} output 
   * @param {array} files 
   */
  constructor(output, files) {
    this.output = output;
    this.files = files;
  }
}