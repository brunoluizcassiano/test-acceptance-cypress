export default class logRest {

    /**
     * LOG STANDARD REST CALL, MUST BE PASSED THE VERB, URI AND PATH
     * @param {*} uri - URI (BaseUrl)
     * @param {*} path - PATH (EndPoint)
     * @param {*} reqType - Method (Ex: POST, GET, PUT or DELETE) verb
     * @param {*} statusCode - Status Code
     * @param {*} response - Response
     */
    static setRequet(uri, path, reqType, statusCode, response){

        let jsonData = {
            "uri": uri,
            "path": path,
            "reqType": reqType,
            "headers": null,
            "body": null,
            "statusCode": statusCode,
            "response": response
        }
        cy.writeFile("cypress/fixtures/resultRest.json", (jsonData));

    };

    /**
     * STANDARD REST CALL WITH HEADERS, MUST CONTAIN VERO, URI AND PATH
     * @param {*} uri - URI (BaseUrl)
     * @param {*} path - PATH (EndPoint)
     * @param {*} reqType - Method (Ex: POST, GET, PUT or DELETE) verb
     * @param {*} headers - Headers
     * @param {*} statusCode - Status Code
     * @param {*} response - Response
     */
    static setRequetHeaders(uri, path, reqType, headers, statusCode, response){

        let jsonData = {
            "uri": uri,
            "path": path,
            "reqType": reqType,
            "headers": headers,
            "body": null,
            "statusCode": statusCode,
            "response": response
        }
        cy.writeFile("cypress/fixtures/resultRest.json", (jsonData));

    };

    /**
     * STANDARD REST CALL WITH BODY, MUST CONTAIN VERO, URI AND PATH
     * @param {*} uri - URI (BaseUrl)
     * @param {*} path - PATH (EndPoint)
     * @param {*} reqType - Method (Ex: POST, GET, PUT or DELETE) verb
     * @param {*} body - Body
     * @param {*} statusCode - Status Code
     * @param {*} response - Response
     */
    static setRequetBody(uri, path, reqType, body, statusCode, response){

        let jsonData = {
            "uri": uri,
            "path": path,
            "reqType": reqType,
            "headers": null,
            "body": body,
            "statusCode": statusCode,
            "response": response
        }
        cy.writeFile("cypress/fixtures/resultRest.json", (jsonData));

    };
}