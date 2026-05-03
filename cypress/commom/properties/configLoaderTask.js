const PropertiesReader = require("properties-reader");
const fs = require("fs");
require("dotenv").config({ path: "./properties/.env" }); // Carrega o arquivo .env

// Função para converter valores de string para boolean, se necessário
function convertToBoolean(value) {
  if (value === "true") {
    return true;
  } else if (value === "false") {
    return false;
  } else {
    return value; // Retorna o valor original se não for "true" ou "false"
  }
}

// Função para carregar propriedades de um arquivo e injetá-las no process.env
function loadProperties(filePath) {
  const envVars = {};
  if (fs.existsSync(filePath)) {
    const properties = PropertiesReader(filePath);
    properties.each((key, value) => {
      envVars[key] = convertToBoolean(value); // Converte string "true"/"false" para boolean
    });
    console.log(`✔️ Variáveis carregadas do arquivo: ${filePath}`);
  } else {
    console.warn(`⚠️ Arquivo ${filePath} não encontrado!`);
  }
  return envVars;
}

function assignToProcessEnv(envVars) {
  Object.keys(envVars).forEach((key) => {
    process.env[key] = envVars[key];
  });
}

module.exports = (on, config) => {
  // Verifica o ambiente a partir do arquivo .env
  const environment = process.env.ENVIRONMENT; // Lê a variável do .env
  console.log(`🔄 Ambiente configurado: ${environment}`);

  // Verifica o ambiente a partir do arquivo .env
  const tribeExecution = process.env.TRIBE; // Lê a variável do .env ou usa 'qa' como padrão
  console.log(`🔄 tribe configurado: ${tribeExecution.substring(1)}`);

  // Carregar variáveis application
  const applicationPropertiesPath = "./properties/application.properties";
  console.log("🔄 Carregando variáveis application...");
  const applicationVars = loadProperties(applicationPropertiesPath);

  // Carregar variáveis específicas do ambiente
  const envPropertiesPath = `./properties/profiles/environment/${environment.toLowerCase()}.properties`; // Nome do arquivo em minúsculas
  console.log(`🔄 Carregando variáveis do ambiente: ${environment}...`);
  const envVars = loadProperties(envPropertiesPath);

  // Carregar variáveis específicas do ambiente
  const envPropertiesTribe = `./properties/profiles/tribe/${tribeExecution
    .substring(1)
    .toLowerCase()}.properties`; // Nome do arquivo em minúsculas
  console.log(
    `🔄 Carregando tribe de execução: ${tribeExecution.substring(1)}...`
  );
  const tribeVars = loadProperties(envPropertiesTribe);

  // Adiciona as variáveis carregadas ao process.env
  assignToProcessEnv(applicationVars);
  assignToProcessEnv(envVars);
  assignToProcessEnv(tribeVars);

  config.env = {
    ...config.env,
    ENVIRONMENT: environment,
    TRIBE: tribeExecution,
    ...applicationVars,
    ...envVars,
    ...tribeVars, // Adiciona as variáveis carregadas ao ambiente do Cypress
  };

  console.log(
    "🔄 Todas as variáveis de ambiente foram carregadas para process.env e Cypress.env."
  );

  // Retorna o config atualizado, caso necessário
  return config;
};
