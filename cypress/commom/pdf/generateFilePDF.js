const pdfMake = require("pdfmake/build/pdfmake");
const pdfFonts = require("pdfmake/build/vfs_fonts");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

const { fileImg } = require("./listFileFromDirectory.js");
const {
  backendCallsWhenRunningTests,
} = require("./backendCallsWhenRunningTests.js");

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

function deleteFolder(testCaseKey) {
  const folder = `./temp/screenshots/${testCaseKey}`;
  fs.readdir(folder, (err, files) => {
    if (err) {
      console.error("Error reading folder:", err);
      return;
    }
    files.forEach((file) => {
      const filePath = path.join(folder, file);
      fs.unlink(filePath, (err) => {
        console.log(`File ${file} successfully deleted.`);
      });
    });
    fs.rm(folder, { recursive: true }, (err) => {
      if (err) {
        console.error(`Erro ao deletar a pasta: ${err.message}`);
      } else {
        console.log("Pasta deletada com sucesso!");
      }
    });
  });
}

async function generateFilePDF(
  testCaseKey,
  title,
  statusTest,
  duration,
  given,
  when,
  then,
  body,
  nameTester,
  projectName
) {
  if (process.env.WEB === "false") {
    // Defina as fontes
    pdfMake.vfs = pdfFonts.pdfMake.vfs;

    const img = await fileImg(testCaseKey);
    const backendCalls = await backendCallsWhenRunningTests(body);

    const header = {
      margin: [0, 0, 0, 0],
      alignment: "left",
      columns: [
        {
          image: `data:image/png;base64, ${require("fs")
            .readFileSync(path.resolve(__dirname, "./images/logoCoE.png"))
            .toString("base64")}`,
          fit: [100, 100],
        },
        {
          margin: [-140, 35, 0, 0],
          fontSize: 18,
          text: "Report - Automation Execution", //alignment: 'center',
          alignment: "left",
        },
      ],
    };

    // Crie o conteúdo do PDF
    const docDefinition = {
      pageSize: "A4",

      pageMargins: [10, 60, 10, 10],

      header: header,

      content: [
        {
          //margin: [0, 15, 0, 0],
          margin: [10, 15, 0, 5],
          layout: "lightHorizontalLines",
          table: {
            headerRows: 1,
            widths: ["10%", "20%", "10%", "60%"],
            body: [
              ["", "", "", ""],
              [
                { text: `Tribe: `, bold: true },
                projectName,
                { text: `Tester: `, bold: true },
                nameTester,
              ],
            ],
          },
        },
        {
          margin: [10, 15, 0, 5],
          table: {
            headerRows: 1,
            widths: ["40%", "10%", "30%", "20%"],
            body: [
              [
                { text: `Test Case Key`, bold: true },
                { text: `Status`, bold: true },
                "Date",
                "Duration",
              ],
              [testCaseKey, statusTest, `${todayDate()}`, `${duration}ms`],
            ],
          },
        },
        {
          margin: [10, 15, 0, 5],
          fontSize: 14,
          text: `\n
                     Cenario: ${title}\n
                     Dado que: ${given}
                     Quando: ${when}
                     Então: ${then}`,
        },

        img,
        backendCalls,
      ],
    };

    // Gere o PDF
    const pdfDoc = pdfMake.createPdf(docDefinition);

    // Salve o PDF em um arquivo
    pdfDoc.getBuffer((buffer) => {
      // Use o fs para salvar o buffer em um arquivo
      try {
        fs.writeFileSync(`./temp/${testCaseKey}.pdf`, buffer);
      } catch (error) {
        console.error("Erro na chamada da API Zephyr:", error.message);
        return false;
      }

      console.log("PDF gerado com sucesso!");
    });

    deleteFolder(testCaseKey);
  } else {
    // Defina as fontes
    pdfMake.vfs = pdfFonts.pdfMake.vfs;

    const img = await fileImg(testCaseKey);

    const conteudo = [
      {
        margin: [10, 15, 0, 5],
        layout: "lightHorizontalLines",
        table: {
          headerRows: 1,
          widths: ["10%", "20%", "10%", "60%"],
          body: [
            ["", "", "", ""],
            [
              { text: `Tribe: `, bold: true },
              `projectName`,
              { text: `Tester: `, bold: true },
              nameTester,
            ],
          ],
        },
      },
      {
        margin: [10, 15, 0, 5],
        table: {
          headerRows: 1,
          widths: ["40%", "10%", "30%", "20%"],
          body: [
            [
              { text: `Test Case Key`, bold: true },
              { text: `Status`, bold: true },
              "Date",
              "Duration",
            ],
            [testCaseKey, statusTest, `${todayDate()}`, `${duration}ms`],
          ],
        },
      },
      {
        margin: [10, 15, 0, 5],
        fontSize: 14,
        text: `\n
             Cenario: ${title}\n
             Dado que: ${given}
             Quando: ${when}
             Então: ${then}`,
      },
      img,
    ];

    if (typeof responseString !== "undefined") {
      conteudo.push({
        margin: [10, 15, 0, 5],
        fontSize: 14,
        text: `\n
             Erro testing: ${responseString}${process.env.WEB}`,
      });
    }

    const header = {
      margin: [0, 0, 0, 0],
      alignment: "left",

      columns: [
        {
          image: `data:image/png;base64, ${require("fs")
            .readFileSync(path.resolve(__dirname, "./images/logoCoE.png"))
            .toString("base64")}`,
          fit: [100, 100],
        },
        {
          margin: [-140, 35, 0, 0],
          fontSize: 18,
          text: "Report - Automation Execution",
          alignment: "left",
        },
      ],
    };

    // Crie o conteúdo do PDF
    const docDefinition = {
      pageSize: "A4",

      pageMargins: [10, 60, 10, 10],

      header: header,

      content: conteudo,
    };

    // Gere o PDF
    const pdfDoc = pdfMake.createPdf(docDefinition);

    // // Salve o PDF em um arquivo
    pdfDoc.getBuffer((buffer) => {
      try {
        fs.writeFileSync(`./temp/${testCaseKey}.pdf`, buffer);
      } catch (error) {
        console.error("Erro na chamada da API Zephyr:", error.message);
        return false;
      }
      console.log("PDF gerado com sucesso!");
    });

    deleteFolder(testCaseKey);
  }
}

module.exports = { generateFilePDF };
