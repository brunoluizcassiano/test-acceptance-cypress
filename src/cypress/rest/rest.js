import {object, flatten, rest} from 'underscore';
import logRest from './restLog';

let responseStatusCode;
let responseBody;

function readTable(data = {}) {
    return object(rest(data.rawTable || []));
};s

class restFull {

    setResponseBody = _responseBody => {
        responseBody = _responseBody;
    };

    getResponseBody = _ => responseBody;

    setResponseStatusCode = _responseStatusCode => {
        responseStatusCode = _responseStatusCode;
    };

    getResponseStatusCode = _ => responseStatusCode;

    /**
     * STANDARD REST CALL, MUST BE PASSED THE VERB, URI AND PATH
     * @param {*} alias - Name to request
     * @param {*} reqType - Method (Ex: POST, GET, PUT or DELETE) verb
     * @param {*} uri - URI (BaseUrl)
     * @param {*} path - PATH (EndPoint)
     * @param {*} log  - LOG (true or false), default true
     */
    requestRestFull(alias, reqType, uri, path, log = true){

        cy.api({
            method: reqType,
            url: uri + path,
            failOnStatusCode: false,
            log: log
        }).as(alias).then((resp) => {
            this.setResponseStatusCode(resp.status);
            this.setResponseBody(resp.body);

            //SET LOG
            logRest.setRequest(uri, path, reqType, resp.status, resp.body);
        })

    };
};

export default restFull;