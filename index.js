import inquirer from 'inquirer';
import { ResourceParser } from './src/ResourceParser.js';

let parser = new ResourceParser('./resources.json');

if (parser.isValid()) {
  inquirer.prompt([
    {
      type: "checkbox",
      name: "selected_sites",
      message: "Select a site to watch.",
      choices: [...parser.getSites(), new inquirer.Separator()],
    }
  ]).then(function (answers) {
    parser.watch(answers.selected_sites);
    parser.monit();
    parser.deploy();
  });
}