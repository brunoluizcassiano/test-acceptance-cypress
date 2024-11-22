const { defineConfig } = require("cypress");

const createBundler = require("@bahmutov/cypress-esbuild-preprocessor");
const {
  addCucumberPreprocessorPlugin,
  beforeRunHandler,
  afterRunHandler,
  beforeSpecHandler,
  afterSpecHandler,
  afterScreenshotHandler,
} = require("@badeball/cypress-cucumber-preprocessor");
const createEsbuildPlugin =
  require("@badeball/cypress-cucumber-preprocessor/esbuild").createEsbuildPlugin;

const schemaPlugin = require("./cypress/commom/schema/schemaTask");
const appDriverPlugin = require("./cypress/commom/appDriver/appDriverTask");
const integrationPlugin = require("./cypress/commom/zephyr/integrationTask");
const configLoaderPlugin = require("./cypress/commom/properties/configLoaderTask");

const { createLog } = require("./cypress/commom/log/generateLog");

const moment = require("moment");
const path = require("path");
const fs = require("fs");

module.exports = defineConfig({
  e2e: {
    specPattern: "cypress/**/*.feature",
    retries: 0,
    responseTimeout: 30000,
    experimentalInteractiveRunEvents: true,
    screenshotOnRunFailure: true,
    screenshotsFolder: "temp/screenshots",
    video: false,
    chromeWebSecurity: false,
    experimentalModifyObstructiveThirdPartyCode: true,
    async setupNodeEvents(on, config) {
      on("after:screenshot", (details) => {
        return new Promise((resolve, reject) => {
          afterScreenshotHandler(config);

          const newFolder = `./temp/screenshots/${details.name}`;
          const newPath = `./temp/screenshots/${details.name}/${details.name}_${details.takenAt}.png`;
          // Função para garantir que o arquivo existe antes de tentar renomeá-lo
          const waitForFile = (filePath, attempts = 5) => {
            if (fs.existsSync(filePath)) {
              return Promise.resolve();
            }
            if (attempts <= 0) {
              return Promise.reject(
                new Error(
                  `Arquivo não encontrado após várias tentativas: ${filePath}`
                )
              );
            }
            return new Promise((resolve) => setTimeout(resolve, 200)).then(() =>
              waitForFile(filePath, attempts - 1)
            );
          };
          // Garantir que a pasta existe
          if (!fs.existsSync(newFolder)) {
            fs.mkdirSync(newFolder, { recursive: true });
          }
          // Espera o arquivo estar disponível e, então, move ele
          waitForFile(details.path)
            .then(() => {
              fs.rename(details.path, newPath, (err) => {
                if (err) return reject(err);
                resolve({ path: newPath });
              });
            })
            .catch((err) => reject(err));
        });
      });

      await addCucumberPreprocessorPlugin(on, config, {
        omitBeforeRunHandler: true,
        omitAfterRunHandler: true,
        omitBeforeSpecHandler: true,
        omitAfterSpecHandler: true,
        omitAfterScreenshotHandler: true,
      });

      on("before:run", async (details) => {
        await beforeRunHandler(config);

        const tempDirectory = path.join(__dirname, "../../temp");
        const fixturesDirectory = path.join(
          __dirname,
          "../../cypress/fixtures"
        );
        if (fs.existsSync(fixturesDirectory)) {
          fs.rm(fixturesDirectory, { recursive: true }, () => {
            console.log(`INFO......: Deleting fixtures ${fixturesDirectory}`);
            console.log(
              `INFO......: Fixtures deleted sucessfully!..............`
            );
          });
        }
        if (fs.existsSync(tempDirectory)) {
          fs.rm(tempDirectory, { recursive: true }, () => {
            console.log(`INFO......: Deleting temp ${tempDirectory}`);
            console.log(`INFO......: temp deleted sucessfully!..............`);
          });
        }

        // Caminho para a pasta de relatório
        const reportDir = path.join(__dirname, "report");
        // Verifica se a pasta de relatório existe, caso contrário, cria-a
        if (!fs.existsSync(reportDir)) {
          fs.mkdirSync(reportDir, { recursive: true });
          console.log(`Pasta criada: ${reportDir}`);
        } else {
          console.log(`A pasta já existe: ${reportDir}`);
        }
      });

      on("after:run", async (results) => {
        await afterRunHandler(config);

        resultsTests = {
          status: results.status,
          startedTestsAt: results.startedTestsAt,
          endedTestsAt: results.endedTestsAt,
          totalDuration: results.totalDuration,
          totalSuites: results.totalSuites,
          totalTests: results.totalTests,
          totalPassed: results.totalPassed,
          totalPending: results.totalPending,
          totalFailed: results.totalFailed,
          totalSkipped: results.totalSkipped,
          cypressVersion: results.cypressVersion,
          osVersion: results.osVersion,
          osName: results.osName,
          browserName: results.browserName,
          browserVersion: results.browserVersion,
        };
        const fixturesDirectory = path.join(
          __dirname,
          "../../report/cypress_wrapper_results.json"
        );
        fs.writeFile(fixturesDirectory, JSON.stringify(resultsTests, null, 2));
        await createLog();
      });

      on("before:spec", async (spec) => {
        await beforeSpecHandler(config, spec);

        // Your own `before:spec` code goes here.
      });

      on("after:spec", async (spec, results) => {
        await afterSpecHandler(config, spec, results);

        if (results && results.stats.tests > 0) {
          let timestamp = moment().format("YYYYMMDD_HHmmss");
          let folder = path.join(__dirname, "../../report/cucumber-json");
          let reportFile = `${timestamp}_${path.basename(spec.fileName)}`;
          if (!fs.existsSync(folder)) {
            fs.mkdirSync(folder, { recursive: true });
          }
          let jsonReport = path.join(folder, `${reportFile}.json`);
          fs.writeFileSync(jsonReport, JSON.stringify(results));
        }
      });

      on(
        "file:preprocessor",
        createBundler({
          plugins: [createEsbuildPlugin(config)],
        })
      );

      schemaPlugin(on, config);
      appDriverPlugin(on, config);
      integrationPlugin(on, config);
      configLoaderPlugin(on, config);

      return config;
    },
  },
  env: {
    TAGS: process.env.TRIBE,
  },
});
