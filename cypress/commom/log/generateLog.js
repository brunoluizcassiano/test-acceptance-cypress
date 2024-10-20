const fs = require("fs");
const fileResultLog = "../../../../../temp/resultsLog.json";

function todayDate() {
  const currentDate = new Date();
  const day = currentDate.getDate();
  const month = currentDate.getMonth() + 1;
  const year = currentDate.getFullYear();
  const hours = currentDate.getHours();
  const minutes = currentDate.getMinutes();
  const seconds = currentDate.getSeconds();
  return `${day < 10 ? "0" + day : day}-${
    month < 10 ? "0" + month : month
  }-${year}T${hours}${minutes}${seconds}`;
}

const createLog = async () => {
  var jsonData = "";
  try {
    jsonData = require("../../../../../temp/resultsLog.json");
  } catch (error) {}

  // Função para converter os dados em formato CSV
  function convertToCSV(jsonArr) {
    if (!jsonArr) {
      console.log(`Erro ao gravar o log: ${jsonArr}`);
    } else {
      const header = [
        "ID ZEPHYR",
        "TEST SCENARIO",
        "STATUS",
        "TIME EXECUTION",
        "GIVEN",
        "WHEN",
        "THEN",
        "ERROR MESSAGE",
        "BACKENDCALLSWHENRUNNINGTESTS",
        "LAST REQ TYPE",
        "LAST URI",
        "LAST PATH",
        "LAST HEADERS",
        "LAST TOKEN",
        "LAST BODY",
        "LAST STATUS CODE",
        "LAST RESPONSE",
      ];
      const csv = [header.join(";")];
      jsonArr.forEach((obj) => {
        var erroMessage = "";
        if (obj.errorMessage) {
          erroMessage = obj.errorMessage.replace(/(\r\n|\n|\r)/gm, "/n");
        }

        var length = 30000;
        var body = "";
        if (obj.body) {
          body = JSON.stringify(obj.body).substring(0, length);
        }

        var lenghBody = obj.body.length - 1;
        var lastReqType = obj.body[lenghBody].reqType;
        var lastUri = obj.body[lenghBody].uri;
        var lastPath = obj.body[lenghBody].path;
        var lastHeaders = obj.body[lenghBody].headers;
        var lastToken = obj.body[lenghBody].token;
        var lastBody = "";
        if (obj.body) {
          lastBody = JSON.stringify(obj.body[lenghBody].body).substring(
            0,
            length
          );
        }
        var lastStatusCode = obj.body[lenghBody].statusCode;
        var lasResponse = JSON.stringify(obj.body[lenghBody].response);

        const row = [
          obj.annotation,
          obj.nomeCenario,
          obj.status,
          obj.duration,
          obj.given,
          obj.when,
          obj.then,
          erroMessage,
          body,
          lastReqType,
          lastUri,
          lastPath,
          lastHeaders,
          lastToken,
          lastBody,
          lastStatusCode,
          lasResponse,
        ];
        csv.push(row.join(";"));
      });
      return csv.join("\n");
    }
  }
  // Nome do arquivo CSV
  const filename = `./report/logExecution_${todayDate()}.csv`;

  // Convertendo e escrevendo o arquivo CSV
  fs.writeFileSync(filename, convertToCSV(jsonData));

  console.log(`O arquivo ${filename} foi gerado com sucesso.`);
};

module.exports = { createLog };
