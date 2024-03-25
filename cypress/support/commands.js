// ***********************************************
// This example commands.js shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************
//
//
// -- This is a parent command --
// Cypress.Commands.add('login', (email, password) => { ... })
//
//
// -- This is a child command --
// Cypress.Commands.add('drag', { prevSubject: 'element'}, (subject, options) => { ... })
//
//
// -- This is a dual command --
// Cypress.Commands.add('dismiss', { prevSubject: 'optional'}, (subject, options) => { ... })
//
//
// -- This will overwrite an existing command --
// Cypress.Commands.overwrite('visit', (originalFn, url, options) => { ... })

const restFull = require('../../src/cypress/rest/rest');

/**
     * Function to set response
     * @param {*} - responseBody 
     */
Cypress.Commands.add('setResponseBody', (responseBody) => {
    restFull.setResponseBody(responseBody);
});








/**
     * STANDARD REST CALL, MUST BE PASSED THE VERB, URI AND PATH
     * @param {*} alias - Name to request
     * @param {*} reqType - Method (Ex: POST, GET, PUT or DELETE) verb
     * @param {*} uri - URI (BaseUrl)
     * @param {*} path - PATH (EndPoint)
     * @param {*} log  - LOG (true or false), default true
     */
Cypress.Commands.add('requestRestFull', (alias, reqType, uri, path) => {
    restFull.requestRestFull(alias, reqType, uri, path);
});