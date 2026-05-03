const fs = require("fs");
const { generateFilePDF } = require("../pdf/generateFilePDF");
const { upPdf } = require("../pdf/uploadPDF");

module.exports = (on, config) => {
  on("task", {
    async readFileResult(event) {
      try {
        await generateFilePDF(
          event.annotation,
          event.title,
          event.result,
          event.duration,
          event.given,
          event.when,
          event.then,
          event.body,
          event.nameTester,
          event.projectName
        );
        console.log("Vamos montar o arquivo result_scenarios");
        if (fs.existsSync(event.dir)) {
          fs.readFile(event.dir, function readFileCallback(err, data) {
            if (err) {
              console.log(err);
            } else {
              table = JSON.parse(data);
              table.push({
                file: event.file,
                annotation: event.annotation,
                nomeCenario: event.title,
                status: event.result,
                duration: event.duration,
                given: event.given,
                when: event.when,
                then: event.then,
                errorMessage: event.errorMessage,
                body: event.body,
              });
              let json = JSON.stringify(table, null, 2);
              fs.writeFileSync(event.dir, json, function (err) {
                if (err) {
                  console.log(err);
                }
              });
              console.log("Arquivo atualizado com sucesso");
            }
          });
        } else {
          let table = [];
          table.push({
            file: event.file,
            annotation: event.annotation,
            nomeCenario: event.title,
            status: event.result,
            duration: event.duration,
            given: event.given,
            when: event.when,
            then: event.then,
            errorMessage: event.errorMessage,
            body: event.body,
          });
          let json = JSON.stringify(table, null, 2);
          fs.writeFileSync(event.dir, json, function (err) {
            if (err) {
              console.log(err);
            }
          });
          console.log("Novo arquivo gerado");
        }
        return true;
      } catch (error) {
        return false;
      }
    },
  }),
    on("task", {
      createFolder(folderPath) {
        if (!fs.existsSync(folderPath)) {
          fs.mkdirSync(folderPath, { recursive: true });
        }
        return null;
      },
    });

  on("task", {
    createFile(fileName) {
      fs.writeFileSync(fileName, "");
      return null;
    },
  });

  // on('task', {
  //   // Task para verificar se o arquivo existe
  //   fileExists(filePath) {
  //     return new Promise((resolve) => {
  //       fs.access(filePath, fs.constants.F_OK, (err) => {
  //         resolve(!err); // Retorna true se o arquivo existir, false se não existir
  //       });
  //     });
  //   },
  // })

  on("task", {
    async fileExists(path) {
      if (fs.existsSync(path)) {
        return JSON.parse(fs.readFileSync(path, "utf8"));
      }
      return null;
    },
  });

  // on('task', {
  //   async fileExists(path) {
  //     if (fs.existsSync(path)) {
  //       return JSON.parse(fs.readFileSync(path, 'utf8'))
  //     }
  //     return null
  //   }
  // });

  // on('task', {
  //   async fileExists(path) {
  //     try {
  //       return fs.existsSync(path);
  //     } catch (err) {
  //       return err; // Se houver um erro, retorna false
  //     }
  //   }
  // });

  // on('task', {
  //   async fileExists(path) {
  //     return new Promise((resolve, reject) => {
  //       try {
  //         const exist = fs.existsSync(path);
  //         resolve(exist)
  //       } catch (err) {
  //         reject(err); // Se houver um erro, retorna false
  //       }
  //     })
  //   }
  // });

  on("task", {
    logRequestToJson: ({ jsonData, idTest }) => {
      const filePath = `temp/${idTest}-resultRest.json`;

      // Verifica se o arquivo existe
      let logs = [];
      if (fs.existsSync(filePath)) {
        // Lê o arquivo existente
        const fileContent = fs.readFileSync(filePath, "utf8");
        logs = JSON.parse(fileContent || "[]"); // Converte o conteúdo em um array
      }

      // Adiciona a nova entrada de log
      logs.push({
        timestamp: new Date().toISOString(),
        uri: jsonData.uri,
        path: jsonData.path,
        reqType: jsonData.reqType,
        headers: jsonData.headers,
        token: jsonData.token,
        body: jsonData.body,
        statusCode: jsonData.statusCode,
        response: jsonData.response,
      });
      // Escreve o conteúdo atualizado no arquivo
      fs.mkdirSync("temp", { recursive: true });
      fs.writeFileSync(filePath, JSON.stringify(logs, null, 2));
      return null; // Retorna null para sinalizar sucesso no Cypress
    },
  });

  on("task", {
    filePath(path) {
      return fs.existsSync(path);
    },
  });

  on("task", {
    deleteFile(filePath) {
      const fs = require("fs");
      fs.unlinkSync(filePath);
      return null;
    },
  });

  on("task", {
    uploadPDF: ({
      policy,
      credential,
      date,
      signature,
      testCase,
      testeExecution,
      jiraProjectId,
      userAccountId,
    }) => {
      upPdf(
        policy,
        credential,
        date,
        signature,
        testCase,
        testeExecution,
        jiraProjectId,
        userAccountId
      );
      return null;
    },
  });

  on("task", {
    log(message) {
      console.log(message);
      return null;
    },
  });

  return config;
};
