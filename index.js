console.log("Biblioteca principal carregada");

const runTests = require('./src/cypress/commands/runTest');
const openCypress = require('./src/cypress/commands/openCypress');

module.exports = { openCypress, runTests };