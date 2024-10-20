
cy.plard = {};

cy.plard.log = {}

cy.plard.rest = {};

cy.plard.schema = {}

cy.plard.appdriver = {}

cy.plard.log.request = (jsonData) => {
 const idTest = window.testState.pickle.tags[1].name.replace('@', '');
    return cy.task('logRequestToJson', { jsonData, idTest }, {log: false}).then(() => {
        cy.captureApiScreenshot(jsonData);
    });
};

cy.plard.rest.request = (url, options) => {
    return cy.request({
        method: 'POST', // Default method
        url: url,
        ...options
    });
};

cy.plard.rest.requestRestFul = (method, uri, path, alias = 'response_endpoint', log = false) => {
    return cy.request({
        method: method,
        url: uri + path,
        failOnStatusCode: false,
        log: log
    }).as(alias).then((resp) => {
        // resultsRest.setRequest(uri, path, reqType, resp.status, resp.body);
        // this.setResponseStatusCode(resp.status)
        // this.setResponseBody(resp.body)
    })
}

cy.plard.schema.loadDocumentation = (filePath) => {
    return cy.task('loadDocumentation', filePath);
}

cy.plard.schema.getPaths = () => {
    return cy.task('getPaths');
}

cy.plard.schema.getSchemasForResponse = (path, method) => {
    return cy.task('getSchemasForResponse', { path, method });
}

cy.plard.schema.getRequestBodySchema = (path, method) => {
    return cy.task('getRequestBodySchema', { path, method });
}

cy.plard.schema.generateClassesFromOpenAPI = (filePath) => {
    return cy.task('generateClassesFromOpenAPI', filePath);
}

cy.plard.schema.generateClassFromEndpoint = (filePath, path) => {
    return cy.task('generateClassFromEndpoint', { filePath, path });
}

cy.plard.appdriver.generateAppDriversFromOpenAPI = (filePath, path, generatePathAppDriver) => {
    return cy.task('generateAppDriversFromOpenAPI', { filePath, path, generatePathAppDriver });
}