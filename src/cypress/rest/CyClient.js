/// <reference types="cypress" />

const authentications = {
    'APIKey': {type: 'apiKey', 'in': 'query', name: 'key', apiKey: '1ed35c7370a9db40c5620991249bba83'},
    'APIToken': {type: 'apiKey', 'in': 'query', name: 'token', apiKey: 'ATTAeb37060fbe9c88cd9305b72229b1b7518f8c80d0b011a96b300ead8da6d908d5CC81661D'},
}

/**
 * Makes a RESTful request.
 *
 * @param {string} requestAlias - The alias to assign to the request
 * @param {string} path - The path for the RESTful request
 * @param {string} httpMethod - The HTTP method for the request
 * @param {object} [pathParams={}] - The path parameters for the request
 * @param {object} [headerParams={}] - The header parameters for the request
 * @param {object} [queryParams={}] - The query parameters for the request
 * @param {string[]} [authNames=[]] - The authentication names
 * @param {boolean} [log=true] - Whether to log the request
 * @return {void}
 */
function requestRestFul({requestAlias, uri, path, httpMethod, pathParams = {}, headerParams = {}, queryParams = {}, authNames = [], log = true} = {}) {
    const pathUri = pathParams ? buildUrl(path, pathParams) : path;

    //remove undefined property values from query and header params
    removeUndefinedProperties(queryParams);
    removeUndefinedProperties(headerParams);

    // apply auth
    applyAuth(headerParams, queryParams, authNames);

    cy.api({
        method: httpMethod,
        url: uri + pathUri,
        headers: headerParams,
        qs: queryParams,
        failOnStatusCode: false,
        log: log
    }).as(requestAlias);
}

/**
 * Makes a RESTful request with a body.
 *
 * @param {string} requestAlias - the alias for the request
 * @param {string} path - the path for the request
 * @param {string} httpMethod - the HTTP method for the request
 * @param {object} body - the body of the request
 * @param {boolean} isForm - indicates if the body is form data (default is false)
 * @param {string[]} contentTypes - the content types for the request
 * @param {object} pathParams - the path parameters for the request
 * @param {object} headerParams - the header parameters for the request
 * @param {object} queryParams - the query parameters for the request
 * @param {string[]} authNames - the authentication names
 * @param {boolean} log - indicates whether to log the request (default is true)
 * @return {void}
 */
function requestRestFulWithBody({requestAlias, path, httpMethod, body, isForm = false, contentTypes = [], pathParams = {}, headerParams = {}, queryParams = {}, authNames = [], log = true} = {}) {
    
    const url = pathParams ? buildUrl(path, pathParams) : path;

    //remove undefined property values from query and header params
    removeUndefinedProperties(queryParams);
    removeUndefinedProperties(headerParams);

    // apply auth
    applyAuth(headerParams, queryParams, authNames);

    // apply content type
    applyContentTypeToHeaders(headerParams, contentTypes);

    cy.api({
        method: httpMethod,
        url: url,
        body: body,
        form: isForm,
        headers: headerParams,
        qs: queryParams,
        failOnStatusCode: false,
        log: log
    }).as(requestAlias);
}

/**
 * Removes any properties with a value of undefined from the given object.
 *
 * @param {object} obj - The object from which to remove undefined properties
 */
function removeUndefinedProperties(obj) {
    Object.keys(obj).forEach(key => obj[key] === undefined && delete obj[key]);
}

function applyAuth(headers, queryParams, authNames) {
    authNames.forEach((authName) => {
        var auth = authentications[authName];
        switch (auth.type) {
            case 'basic':
                if (auth.username || auth.password) {
                    // request.auth(auth.username || '', auth.password || '');
                    headers['Authorization'] = 'Basic ' + btoa(auth.username + ':' + auth.password);
                }

                break;
            case 'bearer':
                if (auth.accessToken) {
                    var localVarBearerToken = typeof auth.accessToken === 'function'
                      ? auth.accessToken()
                      : auth.accessToken
                    // request.set({'Authorization': 'Bearer ' + localVarBearerToken});
                    headers['Authorization'] = 'Bearer ' + localVarBearerToken;
                }

                break;
            case 'apiKey':
                if (auth.apiKey) {
                    var data = {};
                    if (auth.apiKeyPrefix) {
                        data[auth.name] = auth.apiKeyPrefix + ' ' + auth.apiKey;
                    } else {
                        data[auth.name] = auth.apiKey;
                    }

                    if (auth['in'] === 'header') {
                        // request.set(data);
                        headers[auth.name] = data[auth.name];
                    } else if (auth['in'] === 'query') {
                        queryParams[auth.name] = data[auth.name];
                    }
                }

                break;
            case 'oauth2':
                if (auth.accessToken) {
                    // request.set({'Authorization': 'Bearer ' + auth.accessToken});
                    headers['Authorization'] = 'Bearer ' + auth.accessToken;
                }

                break;
            default:
                throw new Error('Unknown authentication type: ' + auth.type);
        }
    });
}

function applyContentTypeToHeaders(headers, contentTypes) {
    if (contentTypes.length >= 1 ) {
        headers['Content-Type'] = jsonPreferredMime(contentTypes);
    } 
}

function buildUrl(url, pathParams) {
    if (!url.match(/^\//)) {
        url = '/' + url;
    }

    url = url.replace(/\{([\w-\.#]+)\}/g, (fullMatch, key) => {
        var value;
        if (pathParams.hasOwnProperty(key)) {
            value = paramToString(pathParams[key]);
        } else {
            value = fullMatch;
        }

        return encodeURIComponent(value);
    });
    return url;
}

function paramToString(param) {
    if (param == undefined || param == null) {
        return '';
    }
    if (param instanceof Date) {
        return param.toJSON();
    }
    if (canBeJsonified(param)) {
        return JSON.stringify(param);
    }
    return param.toString();
}

function canBeJsonified(str) {
    if (typeof str !== 'string' && typeof str !== 'object') return false;
    try {
        const type = str.toString();
        return type === '[object Object]'
            || type === '[object Array]';
    } catch (err) {
        return false;
    }
};

function jsonPreferredMime(contentTypes) {
    for (var i = 0; i < contentTypes.length; i++) {
        if (isJsonMime(contentTypes[i])) {
            return contentTypes[i];
        }
    }

    return contentTypes[0];
}

function isJsonMime(contentType) {
    return Boolean(contentType != null && contentType.match(/^application\/json(;.*)?$/i));
}

/**
* Builds the collection parameter based on the specified collection format.
*
* @param {Array} param - The parameter to be formatted
* @param {string} collectionFormat - The format of the collection
* @return {string|null|Array} The formatted collection parameter
*/
function buildCollectionParam(param, collectionFormat) {
    if (param == null) {
        return null;
    }
    switch (collectionFormat) {
        case 'csv':
            return param.map(paramToString, this).join(',');
        case 'ssv':
            return param.map(paramToString, this).join(' ');
        case 'tsv':
            return param.map(paramToString, this).join('\t');
        case 'pipes':
            return param.map(paramToString, this).join('|');
        case 'multi':
            //return the array directly as SuperAgent will handle it as expected
            return param.map(paramToString, this);
        case 'passthrough':
            return param;
        default:
        throw new Error('Unknown collection format: ' + collectionFormat);
    }
}

module.exports = {
    requestRestFul, requestRestFulWithBody, buildCollectionParam
}