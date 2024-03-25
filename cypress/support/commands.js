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

import restFull from "../../src/cypress/rest/rest";

Cypress.Commands.add('setResponseBody', {prevSubject: false}, (responseBody) => {
    /**
     * Function to set response
     * @param {*} - responseBody 
     */
    restFull.setResponseBody(responseBody);
});

Cypress.Commands.add('getResponseBody', {prevSubject: false}, () => {
    /**
     * Function to consult the return in the response
     * @param {*} - responseBody
     * @returns - responseBody
     */
    return restFull.getResponseBody();
});

Cypress.Commands.add('setResponseStatusCode', {prevSubject: false}, (responseStatusCode) => {
     /**
     * Function to set status code
     * @param {*} - responseStatusCode 
     */
    restFull.setResponseStatusCode(responseStatusCode);
});

Cypress.Commands.add('getResponseStatusCode', {prevSubject: false}, () => {
    /**
     * Function to consult the return in the status code
     * @param {*} - responseStatusCode 
     * @returns - responseStatusCode 
     */
    return restFull.getResponseStatusCode();
});

Cypress.Commands.add('requestRestFull', {prevSubject: false}, (alias, reqType, uri, path) => {
    /**
     * STANDARD REST CALL, MUST BE PASSED THE VERB, URI AND PATH
     * @param {*} alias - Name to request
     * @param {*} reqType - Method (Ex: POST, GET, PUT or DELETE) verb
     * @param {*} uri - URI (BaseUrl)
     * @param {*} path - PATH (EndPoint)
     * @param {*} log  - LOG (true or false), default true
     */
    restFull.requestRestFull(alias, reqType, uri, path);
});

Cypress.Commands.add('requestRestFullWithHeaders', {prevSubject: false}, (alias, reqType, uri, path, headers) => {
   /**
     * STANDARD REST CALL WITH HEADERS, MUST CONTAIN VERO, URI AND PATH
     * @param {*} alias - Name to request
     * @param {*} reqType - Method (Ex: POST, GET, PUT or DELETE) verb
     * @param {*} uri - URI (BaseUrl)
     * @param {*} path - PATH (EndPoint)
     * @param {*} headers - Headers
     * @param {*} log - LOG (true or false), default true
     */
    restFull.requestRestFullWithHeaders(alias, reqType, uri, path, headers);
});

Cypress.Commands.add('requestRestFullFileData', {prevSubject: false}, (alias, reqType, uri, path, fileData) => {
    /**
      * STANDARD REST CALL WITH HEADERS, MUST CONTAIN VERO, URI AND PATH
      * @param {*} alias - Name to request
      * @param {*} reqType - Method (Ex: POST, GET, PUT or DELETE) verb
      * @param {*} uri - URI (BaseUrl)
      * @param {*} path - PATH (EndPoint)
      * @param {*} headers - Headers
      * @param {*} log - LOG (true or false), default true
      */
     restFull.requestRestFullFileData(alias, reqType, uri, path, fileData);
 });