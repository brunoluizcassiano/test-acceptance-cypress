// import {object, flatten, rest} from 'underscore';
import logRest from './restLog';

let responseStatusCode;
let responseBody;

// function readTable(data = {}) {
//     return object(rest(data.rawTable || []));
// };

class restFull {

    constructor(){}

    /**
     * Function to set response
     * @param {*} - responseBody 
     */
    static setResponseBody = _responseBody => {
        responseBody = _responseBody;
    };

    /**
     * Function to consult the return in the response
     * @param {*} - responseBody
     * @returns - responseBody
     */
    static getResponseBody = _ => responseBody;

    /**
     * Function to set status code
     * @param {*} - responseStatusCode 
     */
    setResponseStatusCode = _responseStatusCode => {
        responseStatusCode = _responseStatusCode;
    };

    /**
     * Function to consult the return in the status code
     * @param {*} - responseStatusCode 
     * @returns - responseStatusCode 
     */
    getResponseStatusCode = _ => responseStatusCode;

    /**
     * STANDARD REST CALL, MUST BE PASSED THE VERB, URI AND PATH
     * @param {*} alias - Name to request
     * @param {*} reqType - Method (Ex: POST, GET, PUT or DELETE) verb
     * @param {*} uri - URI (BaseUrl)
     * @param {*} path - PATH (EndPoint)
     * @param {*} log - LOG (true or false), default true
     */
    static requestRestFull(alias, reqType, uri, path, log = true){

        cy.api({
            method: reqType,
            url: uri + path,
            failOnStatusCode: false,
            log: log
        }).as(alias).then((resp) => {
            this.setResponseStatusCode(resp.status);
            this.setResponseBody(resp.body);

            // SET LOG
            logRest.setRequet(uri, path, reqType, resp.status, resp.body);
        })

    };

    /**
     * STANDARD REST CALL WITH HEADERS, MUST CONTAIN VERO, URI AND PATH
     * @param {*} alias - Name to request
     * @param {*} reqType - Method (Ex: POST, GET, PUT or DELETE) verb
     * @param {*} uri - URI (BaseUrl)
     * @param {*} path - PATH (EndPoint)
     * @param {*} headers - Headers
     * @param {*} log - LOG (true or false), default true
     */
    static requestRestFullWithHeaders(alias, reqType, uri, path, headers, log = true){

        cy.api({
            method: reqType,
            url: uri + path,
            headers: headers,
            failOnStatusCode: false,
            log: log
        }).as(alias).then((resp) => {
            this.setResponseStatusCode(resp.status);
            this.setResponseBody(resp.body);

            // SET LOG
            logRest.setRequetHeaders(uri, path, reqType, headers, resp.status, resp.body);
        })

    };

    /**
     * STANDARD REST CALL WITH FILE DATA, MUST CONTAIN VERO, URI AND PATH
     * @param {*} alias - Name to request
     * @param {*} reqType - Method (Ex: POST, GET, PUT or DELETE) verb
     * @param {*} uri - URI (BaseUrl)
     * @param {*} path - PATH (EndPoint)
     * @param {*} fileData - File Data
     * @param {*} log  - LOG (true or false), default true
     */
    requestRestFullFileData(alias, reqType, uri, path, fileData, log = true){

        cy.readFile(fileData, { log: log }).then(bodyData => {
            cy.api({
                method: reqType,
                url: uri + path,
                body: bodyData,
                failOnStatusCode: false,
                log: log
            }).as(alias).then((resp) => {
                this.setResponseStatusCode(resp.status);
                this.setResponseBody(resp.body);
    
                // SET LOG
                logRest.setRequetBody(uri, path, reqType, bodyData, resp.status, resp.body);
            })
        })
        
    };

    /**
     * STANDARD REST CALL WITH HEADERS AND FILE DATA, MUST CONTAIN VERO, URI AND PATH
     * @param {*} alias - Name to request
     * @param {*} reqType - Method (Ex: POST, GET, PUT or DELETE) verb
     * @param {*} uri - URI (BaseUrl)
     * @param {*} path - PATH (EndPoint)
     * @param {*} headers - Headers
     * @param {*} fileData - File Data
     * @param {*} log - LOG (true or false), default true
     */
    static requestRestFullFileDataWithHeaders(alias, reqType, uri, path, headers, fileData, log = true){

        cy.readFile(fileData, { log: log }).then(bodyData => {
            cy.api({
                method: reqType,
                url: uri + path,
                headers: headers,
                body: bodyData,
                failOnStatusCode: false,
                log: log
            }).as(alias).then((resp) => {
                this.setResponseStatusCode(resp.status);
                this.setResponseBody(resp.body);
    
                // SET LOG
                logRest.setRequetBodyWithHeaders(uri, path, reqType, headers, bodyData, resp.status, resp.body);
            })
        })
        
    };
};

export default restFull;