#!/usr/bin/env node

const { default: execute } = require("../lib/index.js");

execute()
  .then((output) => {
    console.log(
      "x-ember-cli executed successfully."
    );
    console.log(output);
    process.exit(0);
  })
  .catch((error) => {
    console.error("An error occured in x-ember-cli");
    console.error(error);
    // process.exit(1);
  });
