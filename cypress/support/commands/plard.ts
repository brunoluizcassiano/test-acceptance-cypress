// Define the Plard namespace and the rest structure within it
export {};
declare global {
  namespace Cypress {
    interface Chainable<Subject = any> {
      /**
       * Plard - Global cards
       */
      plard: {
        /**
         * Functions log
         */
        log: {
          /**
          * Sends a REST request using Cypress.
          *
          * @param {string} jsonData - The URL to which the request will be sent.
          * @param {string} idTest - path for the request, such as method, headers, body, etc.
          * @returns {Chainable<any>} - Returns log the of request.
          *
          * @example
          * cy.plard.log.request({
            "uri": uri,
            "path": '/onboarding/v4/devices',
            "reqType": 'POST',
            "headers": false,
            "token": false,
            "body": data,
            "statusCode": response.status,
            "response": response.body
          }, "teste1")
          */
          request(jsonData: string, idTest: string): Chainable<any>;
        };
        /**
         * Functions rest
         */
        rest: {
          /**
           * Sends a REST request using Cypress.
           *
           * @param {string} url - The URL to which the request will be sent.
           * @param {object} options - Options for the request, such as method, headers, body, etc.
           * @param {string} [options.method=POST] - The HTTP method to use (e.g., POST, GET).
           * @param {object} [options.headers] - Custom headers for the request.
           * @param {object} [options.body] - The body of the request to be sent.
           * @returns {Chainable<any>} - Returns a Cypress chainable, allowing for further command chaining.
           *
           * @example
           * cy.plard.rest.request('/api/v1/resource', {
           *   method: 'POST',
           *   headers: { 'Content-Type': 'application/json' },
           *   body: { key: 'value' }
           * }).then((response) => {
           *   expect(response.status).to.eq(200);
           * });
           */
          request(url: string, options: object): Chainable<any>;
          /**
           * Sends a request full REST request using Cypress.
           *
           * @param {string} method - The HTTP method to use (e.g., POST, GET).
           * @param {string} uri - The URL to which the request will be sent.
           * @param {string} path - Options for the request, such as method, headers, body, etc.
           * @param {string} alias - Custom headers for the request, optional, with a default value of 'response_endpoi'.
           * @param {boolean} log - The body of the request to be sent, optional, with a default value of false.
           * @returns {Cypress.Chainable} - Returns a Cypress chainable, allowing for further command chaining.
           *
           * @example
           * cy.plard.rest.requestRestFul({
           *   'GET',
           *   'https://test.com',
           *   '/api/v1/resource',
           *   'alisGesTest',
           *   true
           * }).then((response) => {
           *   expect(response.status).to.eq(200);
           * });
           */
          requestRestFul(
            method: string,
            uri: string,
            path: string,
            alias: string,
            log: boolean
          ): Chainable<any>;
        };
        schema: {
          /**
            * Loads OpenAPI documentation from a YAML file.
            * @function
            * @memberof cy.plard.schema
            * @param {string} filePath - The path to the OpenAPI YAML file.
            * @returns {Schema} - The instance of the Schema class with the documentation loaded.
            *
            * @example
            * cy.plard.schema.loadDocumentation('PathOpenAPI/openapi').then(schema => {
                cy.log(schema);
            });
            */
          loadDocumentation(filePath: string): Chainable<any>;
          /**
            * Loads OpenAPI documentation from a YAML file.
            * @function
            * @memberof cy.plard.schema
            * @see loadDocumentation - Prerequisite, execute the load Documentation function.
            * @returns {Paths} - The instance of the Schema class with the Paths existing in the documentation.
            *
            * @example
            * cy.plard.schema.getPaths().then(pathEndPoint => {
                  cy.log(pathEndPoint);
              })
            */
          getPaths(): Chainable<any>;
          /**
            * Return the schema response for a given endpoint with its method according to the YAML documentation
            * @function
            * @memberof cy.plard.schema
            * @see loadDocumentation - Prerequisite, execute the load Documentation function.
            * @param {string} path - path for http/https request.
            * @param {string} method - method for http/https request.
            * @returns {responses} - returns the possible responses for the method and path according to the YAML documentation.
            *
            * @example
            * cy.plard.schema.getSchemasForResponse('/v1/openapi', 'post').then((responses) => {
                cy.log(responses);
            });;
            */
          getSchemasForResponse(path: string, method: string): Chainable<any>;
          /**
            * Return the schema response for a given endpoint with its method according to the YAML documentation
            * @function
            * @memberof cy.plard.schema
            * @see loadDocumentation - Prerequisite, execute the load Documentation function.
            * @param {string} path - path for http/https request.
            * @param {string} method - method for http/https request.
            * @returns {Request} - returns the possible Request for the method and path according to the YAML documentation.
            *
            * @example
            * cy.plard.schema.getRequestBodySchema('/v1/openapi', 'post').then((Request) => {
                cy.log(Request);
            });;
            */
          getRequestBodySchema(path: string, method: string): Chainable<any>;
          /**
           * Generate schemas and subshemas through the OpenAPI documentation of a YAML file.
           * @function
           * @memberof cy.plard.schema
           * @see loadDocumentation - Prerequisite, execute the load Documentation function.
           * @param {string} filePath - The path to generating schema and subschemas.
           * @returns {Schemas} - Returns the generated schema and subschemas files in the specified location.
           *
           * @example
           * cy.plard.schema.generateClassesFromOpenAPI('Generate/Schemas');
           */
          generateClassesFromOpenAPI(filePath: string): Chainable<any>;
          /**
           * Generate schemas and subschemas for a given path via OpenAPI documentation from a YAML file.
           * @function
           * @memberof cy.plard.schema
           * @see loadDocumentation - Prerequisite, execute the load Documentation function.
           * @param {string} filePath - The path to generating schema and subschemas.
           * @param {string} path - The path to generating schema and subschemas.
           * @returns {Schemas} - Returns the generated schema and subschemas files for a given path, in the specified location.
           *
           * @example
           * cy.plard.schema.generateClassFromEndpoint('Generate/Schemas', '/v1/openapi');
           */
          generateClassFromEndpoint(
            filePath: string,
            path: string
          ): Chainable<any>;
        };
        appdriver: {
          /**
           * Generate schemas and subschemas for a given path via OpenAPI documentation from a YAML file.
           * @function
           * @memberof cy.plard.appdriver
           * @param {string} filePath - The path to generating schema and subschemas.
           * @param {string} path - The path to generating schema and subschemas.
           * @returns {Schemas} - Returns the generated appDriver and models files for a given path, in the specified location.
           *
           * @example
           * cy.plard.appdriver.generateAppDriversFromOpenAPI('Generate/Schemas', '/v1/openapi');
           */
          generateAppDriversFromOpenAPI(
            filePath: string,
            path: string
          ): Chainable<any>;
        };
      };
    }
  }
}
