const { defineConfig } = require("cypress");

module.exports = defineConfig({
  e2e: {
    supportFile: "cypress/support/e2e.js",
    specPattern: "features/execution/*.feature",
    setupNodeEvents(on, config) {
      // implement node event listeners here
    },
  },
});
