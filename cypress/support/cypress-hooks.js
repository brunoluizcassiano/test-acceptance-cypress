// node_modules/sua-lib/cypress-hooks.js
module.exports = {
    setupHooks: () => {
   
           const dirResult = "temp/results_scenarios";
           const tribeProject = Cypress.env('tribeProject');
           const token = Cypress.env('userTokenZephyr');
           const idFolder = Cypress.env('folderId');
           const nameProject = Cypress.env('nameProject');
           const dateHours = todayDateHours()
           const obterAmbiente = Cypress.env('Environment') || Cypress.env('ENVIRONMENT') || '';
           const ambiente = obterAmbiente.replace(' LZ', '').replace('-lz', '');
           const testerName = Cypress.env('testerName');
           const threadID = Math.floor(Math.random() * 1000);
   
           function todayDateHours() {
               const currentDate = new Date();
               const day = currentDate.getDate();
               const month = currentDate.getMonth() + 1;
               const year = currentDate.getFullYear();
               const hours = currentDate.getHours();
               const minutes = currentDate.getMinutes();
               const seconds = currentDate.getSeconds();
               return `${day < 10 ? '0' + day : day}-${month < 10 ? '0' + month : month}-${year}T${hours}:${minutes}:${seconds}`;
           }
   
           before(function () {
               Cypress.env('THREAD_ID', threadID);
               if (Cypress.platform === 'linux') {
                   cy.task('filePath', 'cypress/fixtures/testCycleKey.json').then((fileContent) => {
                       if (fileContent) {
                           cy.readFile('cypress/fixtures/testCycleKey.json').then((resp) => {
                               cy.log(`Utilizando ciclo existente: ${resp.key}`)
                           })
                       } else {
                           const url = `${Cypress.env('urlZephyr')}${Cypress.env('testcycles')}`
                           cy.request({
                               method: "POST",
                               headers: {
                                   Authorization: `Bearer ${token}`
                               },
                               url: url,
                               body: {
                                   "name": `RegressivoAUT_${nameProject}_${dateHours}`,
                                   "projectKey": tribeProject,
                                   "folderId": idFolder,
                                   "customFields": {
                                       "Environment": ambiente
                                   }
                               },
                               failOnStatusCode: false
                           }).as('request_cycle').then((resp) => {
                               cy.writeFile('cypress/fixtures/testCycleKey.json', resp.body)
                               cy.task('log', `This was the cycle created: ${resp.body.key}`)
                           })
                       }
                   })
               } else {
                   cy.log('Cycle Create Operation Canceled')
               }
           });
   
           after(function () {
               const url = `${Cypress.env('urlZephyr')}${Cypress.env('testexecutions')}`;
               const token = Cypress.env('userTokenZephyr');
               const ambiente = Cypress.env('Environment');
               const jiraProjectId = Cypress.env('jiraProjectId');
               const emailJira = Cypress.env('emailJira');
               const userTokenJira = Cypress.env('userTokenJira');
               const userAccountId = Cypress.env('userAccountId');
               const threadId = Cypress.env('THREAD_ID');
   
               cy.task('fileExists', `${dirResult}_${threadId}.json`).then((existingData) => {
                   if (existingData) {
                       if (Cypress.platform === 'linux') {
                           const requestHttp = (item, jsonFile) => {
                               return cy.request({
                                   method: "POST",
                                   headers: {
                                       Authorization: `Bearer ${token}`
                                   },
                                   url: url,
                                   body: {
                                       "projectKey": item.annotation.split('-')[0],
                                       "statusName": item.status,
                                       "testCycleKey": jsonFile.key,
                                       "testCaseKey": item.annotation,
                                       "testScriptResults": [{ "statusName": item.status }],
                                       "environmentName": ambiente,
                                       "executionTime": item.duration
                                   },
                                   failOnStatusCode: false
                               }).as('request_endpoint').then((resp) => {
                                   const testeExecution = resp.body.id
                                   const testCase = item.annotation

                                   cy.uploadPdf(testCase, testeExecution, jiraProjectId, tribeProject, emailJira, userTokenJira, userAccountId, nameProject)
                                   cy.wait(2000)
                               })
                           }
                           cy.wait(2000)
                           cy.fixture('testCycleKey.json').then(jsonFile => {
                               cy.readFile(`${dirResult}_${threadId}.json`).then((jsonData) => {
                                   const promises = jsonData.map(item => requestHttp(item, jsonFile))
                                   return Promise.all(promises).then(() => {
                                       cy.deleteArchive().then(() => {
                                           cy.task('fileExists', `${dirResult}_${threadId}.json`).then((existingData) => {
                                               if (existingData) {
                                                   cy.task('deleteFile', `${dirResult}_${threadId}.json`);
                                               }
                                           });
                                       });
                                   })
                               })
                           })
                       } else {
                           cy.log('Execution Creation Operation Canceled')
   
                           cy.deleteArchive().then(() => {
                               cy.task('fileExists', 'temp/results_scenarios.json').then((existingData) => {
                                   if (existingData) {
                                       cy.task('deleteFile', 'temp/results_scenarios.json');
                                   }
                               });
                           });
                       }
                   }
               })
           })
   
           afterEach(function () {
               const fileResult = `temp/${window.testState.pickle.tags[1].name.replace('@', '')}-resultRest.json`;
               const threadId = Cypress.env('THREAD_ID');
   
               if (Cypress.env('WEB') === false) {
                   cy.task('fileExists', fileResult).then((existingData) => {
                       if (existingData) {
                           return cy.readFile(fileResult).then((jsonData) => {
                               let errorMessage = "";
                               if (this.currentTest.state === 'failed') {
                                   errorMessage = this.currentTest.err.message;
                               }
                               return cy.task("readFileResult",
                                   {
                                       dir: `${dirResult}_${threadId}.json`,
                                       file: window.testState.uri,
                                       annotation: window.testState.pickle.tags[1].name.replace('@', ''),
                                       title: this.currentTest.title,
                                       result: this.currentTest.state === 'passed' ? 'Pass' : this.currentTest.state === 'pending' ? 'Not Executed' : 'Fail',
                                       duration: this.currentTest.duration,
                                       given: window.testState.pickle.steps[0].text,
                                       when: window.testState.pickle.steps[1].text,
                                       then: window.testState.pickle.steps[2].text,
                                       errorMessage: errorMessage,
                                       body: jsonData,
                                       nameTester: testerName,
                                       projectName: nameProject
                                   })
                                   .then(() => {
                                       return cy.task('fileExists', fileResult).then((existingData) => {
                                           if (existingData) {
                                               return cy.task('deleteFile', fileResult);
                                           }
                                       });
                                   })
                           })
                       }
                   });
               } else {
                   let errorMessage
                   if (this.currentTest.state === 'failed') {
                       errorMessage = this.currentTest.err.message;
                   }
                   cy.task('filePath', `${dirResult}_${threadId}.json`).then((fileContent) => {
                       if (fileContent) {
                           cy.task("readFileResult",
                               {
                                   dir: `${dirResult}_${threadId}.json`,
                                   file: window.testState.pickle.uri,
                                   annotation: window.testState.pickle.tags[1].name.replace('@', ''),
                                   title: this.currentTest.title,
                                   result: this.currentTest.state === 'passed' ? 'Pass' : this.currentTest.state === 'pending' ? 'Not Executed' : 'Fail',
                                   duration: this.currentTest.duration,
                                   given: window.testState.pickle.steps[0].text,
                                   when: window.testState.pickle.steps[1].text,
                                   then: window.testState.pickle.steps[2].text,
                                   errorMessage: errorMessage,
                                   nameTester: testerName,
                                   projectName: nameProject,
                                   response: errorMessage
                               })
                               .then(() => {
                                   return cy.task('fileExists', fileResult).then((existingData) => {
                                       if (existingData) {
                                           return cy.task('deleteFile', fileResult);
                                       }
                                   });
                               })
                       } else {
                           cy.wait(3000)
                           cy.task("createFolder", "temp")
                           cy.task("readFileResult",
                               {
                                   dir: dirResult,
                                   file: window.testState.pickle.uri,
                                   annotation: window.testState.pickle.tags[1].name.replace('@', ''),
                                   title: this.currentTest.title,
                                   result: this.currentTest.state === 'passed' ? 'Pass' : this.currentTest.state === 'pending' ? 'Not Executed' : 'Fail',
                                   duration: this.currentTest.duration,
                                   given: window.testState.pickle.steps[0].text,
                                   when: window.testState.pickle.steps[1].text,
                                   then: window.testState.pickle.steps[2].text,
                                   errorMessage: errorMessage,
                                   nameTester: testerName,
                                   projectName: nameProject,
                                   response: errorMessage
                               })
                               .then(() => {
                                   return cy.task('fileExists', fileResult).then((existingData) => {
                                       if (existingData) {
                                           return cy.task('deleteFile', fileResult);
                                       }
                                   });
                               })
                       }
                   })
               }
           });
       }
   }
