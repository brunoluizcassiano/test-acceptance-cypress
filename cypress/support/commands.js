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

// cypress/support/commands.js

function todayDate() {
  const currentDate = new Date();
  const day = currentDate.getDate();
  const month = currentDate.getMonth() + 1;
  const year = currentDate.getFullYear();
  return `${year}-${month < 10 ? "0" + month : month}-${
    day < 10 ? "0" + day : day
  }`;
}

function todayDateHours() {
  const currentDate = new Date();
  currentDate.setHours(currentDate.getHours() + 3);
  const day = currentDate.getDate();
  const month = currentDate.getMonth() + 1;
  const year = currentDate.getFullYear();
  const hours = currentDate.getHours().toString().padStart(2, "0");
  const minutes = currentDate.getMinutes().toString().padStart(2, "0");
  const seconds = currentDate.getSeconds().toString().padStart(2, "0");
  const milliseconds = currentDate
    .getMilliseconds()
    .toString()
    .padStart(3, "0");
  return `${year}-${month < 10 ? "0" + month : month}-${
    day < 10 ? "0" + day : day
  }T${hours}:${minutes}:${seconds}.${milliseconds}Z`;
}

Cypress.Commands.add("deleteArchive", () => {
  const existingFilePath = "temp/resultsLog.json";
  const dataToMergeFilePath = "temp/results_scenarios.json";

  cy.task("fileExists", dataToMergeFilePath).then((existingData) => {
    if (existingData) {
      cy.readFile(dataToMergeFilePath).then((dataToMerge) => {
        cy.task("fileExists", existingFilePath).then((existingData) => {
          let newData = [];
          if (existingData !== null) {
            // Novo array para armazenar os dados atualizados
            const sizeObjExisting = Object.keys(existingData).length;
            const sizeObjDataToMerge = Object.keys(dataToMerge).length;
            // Mescla os dados existentes e os novos
            for (let count = 0; count < sizeObjExisting; count++) {
              newData.push(existingData[count]);
            }
            for (let count = 0; count < sizeObjDataToMerge; count++) {
              newData.push(dataToMerge[count]);
            }
            // Atualiza o arquivo existente com os dados mesclados
            cy.writeFile(existingFilePath, newData).then(() => {
              cy.log("Arquivo existente atualizado com sucesso.");
            });
          } else {
            // Se não existir arquivo, cria um novo arquivo com os dados novos
            cy.readFile(dataToMergeFilePath).then((dataToMerge) => {
              cy.writeFile(existingFilePath, dataToMerge).then(() => {
                cy.log("Novo arquivo criado com sucesso.");
              });
            });
          }
        });
      });
    }
  });
});

Cypress.Commands.add(
  "uploadPdf",
  (
    testCase,
    testeExecution,
    jiraProjectId,
    tribeProject,
    emailJira,
    userTokenJira,
    userAccountId,
    nameProject
  ) => {
    cy.request({
      method: "POST",
      url: `https://f1rst-odin-org.atlassian.net/plugins/servlet/ac/com.kanoah.test-manager/main-project-page?classifier=json&project.id=${jiraProjectId}&project.key=${tribeProject}`,
      auth: {
        username: emailJira,
        password: userTokenJira,
      },
      failOnStatusCode: false,
    }).then((respToken) => {
      const token = respToken.body.contextJwt;
      cy.request({
        method: "GET",
        url: "https://app.tm4j.smartbear.com/backend/rest/tests/2.0/uploaddetails/attachment",
        headers: {
          "Accept-Language": " pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7",
          Authorization: `JWT ${token}`,
          Connection: " keep-alive",
          Origin: " https://app.tm4j.smartbear.com",
          Referer: " https://app.tm4j.smartbear.com/",
          "Sec-Fetch-Dest": " empty",
          "Sec-Fetch-Mode": " cors",
          "Sec-Fetch-Site": " same-origin",
          "X-Requested-With": " XMLHttpRequest",
          "jira-project-id": ` ${jiraProjectId}`,
          "sec-ch-ua":
            ' "Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
          "sec-ch-ua-mobile": " ?0",
        },
        failOnStatusCode: false,
      })
        .then(async (respParams) => {
          const policy = respParams.body.policy;
          const credential = respParams.body.credential;
          const date = respParams.body.date;
          const signature = respParams.body.signature;
          await cy.task("uploadPDF", {
            policy,
            credential,
            date,
            signature,
            testCase,
            testeExecution,
            jiraProjectId,
            userAccountId,
          });
        })
        .then(async () => {
          await cy.readFile(`temp/${testCase}.pdf`).then((fileContent) => {
            const fileSize = fileContent.length;
            cy.request({
              method: "POST",
              url: "https://app.tm4j.smartbear.com/backend/rest/tests/2.0/attachment/metadata",
              headers: {
                "Accept-Language": " pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7",
                Authorization: `JWT ${token}`,
                Connection: " keep-alive",
                Origin: " https://app.tm4j.smartbear.com",
                Referer: " https://app.tm4j.smartbear.com/",
                "Sec-Fetch-Dest": " empty",
                "Sec-Fetch-Mode": " cors",
                "Sec-Fetch-Site": " same-origin",
                "X-Requested-With": " XMLHttpRequest",
                "jira-project-id": ` ${jiraProjectId}`,
                "sec-ch-ua":
                  ' "Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
                "sec-ch-ua-mobile": " ?0",
                "Content-Type": "application/json",
              },
              body: {
                createdOn: todayDateHours(),
                userAccountId: userAccountId,
                size: fileSize,
                mimeType: "application/pdf",
                name: `EVD_${nameProject}_${testCase}_${todayDate()}.pdf`,
                s3Key: `write/tenant/2aa1cd43-2dc9-35d6-ab7b-b7a49d7f78ba/project/${jiraProjectId}/testresult/${testeExecution}/67dedc81-079f-4720-9a90-b8428ffe31d7`,
                testExecutionId: `${testeExecution}`,
              },
              failOnStatusCode: false,
            }).as("response_endpoint");
          });
        });
    });
  }
);

Cypress.Commands.add("logRequestToJson", (jsonData, idTest) => {
  return cy.task("logRequestToJson", { jsonData, idTest }).then(() => {
    cy.captureApiScreenshot(jsonData);
  });
});

Cypress.Commands.add("captureApiScreenshot", (jsonData) => {
  const request = {
    uri: jsonData.uri,
    path: jsonData.path,
    reqType: jsonData.reqType,
    headers: jsonData.headers,
    token: jsonData.token,
    body: jsonData.body,
  };
  cy.visit(
    "node_modules/cypress-pattern-globalcards/cypress/support/api-visualizer.html",
    { log: false }
  )
    .then((win) => {
      const doc = win.document;
      doc.getElementById("request").textContent = JSON.stringify(
        request,
        null,
        2
      );
      doc.getElementById("status").textContent = jsonData.statusCode;
      doc.getElementById("response").textContent = JSON.stringify(
        jsonData.response,
        null,
        2
      );
    })
    .then(() => {
      cy.document({ log: false }).then((doc) => {
        const pageHeight = doc.documentElement.scrollHeight;
        const screenshotName = window.testState.pickle.tags[1].name.replace(
          "@",
          ""
        );
        if (pageHeight <= 660) {
          // Captura única se a página for pequena
          cy.screenshot(screenshotName, { capture: "viewport", log: false });
        } else {
          // Captura múltiplas seções da página
          let scrollPosition = 0;
          const scrollStep = 300;
          const captureNextSection = () => {
            if (scrollPosition < pageHeight) {
              cy.screenshot(screenshotName, {
                capture: "viewport",
                log: false,
              }).then(() => {
                cy.scrollTo(0, scrollPosition + scrollStep, {
                  log: false,
                }).then(() => {
                  scrollPosition += scrollStep;
                  captureNextSection(); // Captura a próxima seção após rolar
                });
              });
            }
          };
          // Inicia a captura múltipla
          captureNextSection();
        }
      });
    });
});
