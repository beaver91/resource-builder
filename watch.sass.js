import inquirer from 'inquirer';
import { ResourceBuilder } from './src/ResourceBuilder.js';

let builder = new ResourceBuilder('./resources.json');

if (builder.isValid()) {
  inquirer.prompt([
    {
      type: "list",
      name: "build",
      message: "Select watch or build.",
      choices: ["watch", "build"],
    },
    {
      type: "checkbox",
      name: "sites",
      message: "Select a site to watch.",
      choices: [...builder.getSites(), new inquirer.Separator()],
    }
  ]).then(function (input) {
    builder.setSites(input.sites);
    builder.monit();

    if (input.build == 'watch') {
      builder.watch();
    } else {
      // TODO 
    }
  });
}