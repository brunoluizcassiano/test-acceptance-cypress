const { defineConfig } = require("cypress");

module.exports = defineConfig({
  e2e: {
    specPattern: "features/execution/*.feature",
    setupNodeEvents(on, config) {
      // implement node event listeners here
    },
  },
});
