const { defineConfig } = require("cypress");
const cucumber = require('cypress-cucumber-preprocessor').default

module.exports = defineConfig({
  e2e: {
    supportFile: "./node_modules/test-acceptance-cypress/cypress/support/e2e.js",
    specPattern: "cypress/features/execution/*.feature",
    retries: 0,
    responseTimeout: 30000,
    experimentalInteractiveRunEvents: true,
    screenshotOnRunFailure: true,
    video: false,
    chromeWebSecurity: false,
    setupNodeEvents(on, config) {
      on('file:preprocessor', cucumber())
    },
  },
});
