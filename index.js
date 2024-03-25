console.log("Biblioteca principal carregada");

const runTests = require('./src/cypress/commands/runTest');
const openCypress = require('./src/cypress/commands/openCypress');
const restFull = require('./src/cypress/rest/rest');

module.exports = { openCypress, runTests, restFull };

// module.exports = { restFull };