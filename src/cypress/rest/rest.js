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
    static setResponseStatusCode = _responseStatusCode => {
        responseStatusCode = _responseStatusCode;
    };

    /**
     * Function to consult the return in the status code
     * @param {*} - responseStatusCode 
     * @returns - responseStatusCode 
     */
    static getResponseStatusCode = _ => responseStatusCode;

    /**
     * STANDARD REST CALL, MUST BE PASSED THE VERB, URI AND PATH
     * @param {*} alias - Name to request
     * @param {*} reqType - Method (Ex: POST, GET, PUT or DELETE) verb
     * @param {*} uri - URI (BaseUrl)
     * @param {*} path - PATH (EndPoint)
     * @param {*} log  - LOG (true or false), default true
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
};

export default restFull;