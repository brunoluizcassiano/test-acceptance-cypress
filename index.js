console.log("Biblioteca principal carregada");

const runTests = require('./src/cypress/commands/runTest');
const openCypress = require('./src/cypress/commands/openCypress');
const setResponseBody = require('./src/cypress/rest/rest')
// import restFull from './src/cypress/rest/rest';

module.exports = { openCypress, runTests, setResponseBody };