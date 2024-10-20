const fs = require("fs");
const path = require("path");
const yaml = require("js-yaml");
const beautify = require("js-beautify").js;

// Função para capitalizar a primeira letra de uma string
function capitalize(str) {
  if (typeof str !== "string") {
    throw new Error("Expected a string to capitalize");
  }
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// Função para resolver $ref dentro do OpenAPI de forma recursiva
function resolveSchemaRef(ref, openApiDoc) {
  const refPath = ref.replace("#/", "").split("/");
  let schema = openApiDoc;
  refPath.forEach((segment) => {
    schema = schema[segment];
  });
  return schema;
}

// Função para tratar $ref e extrair apenas o nome do schema
const resolveRef = (ref) => {
  const refParts = ref.split("/");
  return refParts[refParts.length - 1]; // Retorna o último elemento após a barra
};

// Função para resolver $ref em schemas
function resolveSchema(schema, openApiDoc) {
  if (schema.$ref) {
    const refPath = schema.$ref.replace("#/", "").split("/");
    return refPath.reduce((acc, part) => acc[part], openApiDoc);
  }
  return schema;
}

// Função para resolver propriedades dentro de um schema recursivamente, lidando com dependências
function resolveSchemaProperties(schema, openApiDoc) {
  if (schema.$ref) {
    schema = resolveSchemaRef(schema.$ref, openApiDoc);
  }
  if (schema.properties) {
    Object.keys(schema.properties).forEach((prop) => {
      const propSchema = schema.properties[prop];
      if (propSchema.$ref) {
        schema.properties[prop] = resolveSchemaProperties(
          propSchema,
          openApiDoc
        );
      }
    });
  }
  return schema;
}

// Função para gerar classes de request body e resolver dependências recursivas de $ref
function generateRequestBodyClasses(
  endpointPath,
  methods,
  endpointMethods,
  openApiDoc
) {
  methods.forEach((method) => {
    let schema =
      endpointMethods[method].requestBody?.content?.["application/json"]
        ?.schema;

    // Resolver o schema, incluindo $ref
    if (schema) {
      schema = resolveSchemaProperties(schema, openApiDoc);
    }
    if (!schema || !schema.properties) return; // Se não houver um schema válido, retorna
    const className =
      resolveRef(
        endpointMethods[method].requestBody?.content?.["application/json"]
          ?.schema.$ref
      ) + "Model";

    // Gerar a classe do request body principal
    generateRequestBodyClass(className, schema, openApiDoc);
    verifyRequestBobySubClass(schema.properties, openApiDoc);
  });
}

function verifyRequestBobySubClass(properties, openApiDoc) {
  // Verificar se há referências ($ref) nas propriedades e gerar classes adicionais
  Object.keys(properties).forEach((prop) => {
    const propSchema = properties[prop];

    if (propSchema) {
      const subSchema = resolveSchemaProperties(propSchema, openApiDoc);
      const subClassName = capitalize(prop) + "Model";
      generateRequestBodyClass(subClassName, subSchema, openApiDoc);
    }
  });
}

// Função para gerar a classe de um request body específico
function generateRequestBodyClass(className, schema, openApiDoc) {
  if (!schema) {
    console.log(`Nenhum schema encontrado para ${className.toUpperCase()}!`);
    return;
  }

  const finalSchema = resolveSchema(schema, openApiDoc);
  if (!finalSchema.properties) {
    console.log(
      `Nenhuma propriedade encontrada para ${className.toUpperCase()}!`
    );
    if (schema.oneOf) {
      Object.keys(schema.oneOf).forEach((ref) => {
        const subClass = resolveRef(schema.oneOf[ref].$ref);
        const newSchema = openApiDoc.components.schemas[subClass];
        const subClassName = capitalize(subClass) + "Model";
        generateRequestBodyClass(subClassName, newSchema, openApiDoc);
      });
    }
    return;
  }

  let gettersSetters = "";
  Object.keys(schema.properties).forEach((prop) => {
    const propSchema = schema.properties[prop];
    let propType = propSchema.type;
    // Resolver tipos referenciados por $ref
    if (propSchema.$ref) {
      const refSchema = resolveSchemaRef(propSchema.$ref, openApiDoc);
      propType = refSchema.type || "object";
    }
    if (propType) {
      gettersSetters += `
      get${capitalize(prop)}() {
          return this.${prop};
      }
      set${capitalize(prop)}(value) {
          if (typeof value !== '${propType}') {
              throw new Error('Expected ${prop} to be of type ${propType}');
          }
          this.${prop} = value;
      }
      `;
    }
  });
  const requestBodyClass = `
   class ${className} {
      constructor() {
          ${Object.keys(schema.properties)
            .map((prop) => `this.${prop} = null;`)
            .join("\n        ")}
      }
      ${gettersSetters}
      toJSON() {
          return {
              ${Object.keys(schema.properties)
                .map((prop) => `${prop}: this.${prop}`)
                .join(",\n            ")}
          };
      }
   }
   module.exports = ${className};
   `;
  const formattedCode = beautify(requestBodyClass, {
    indent_size: 2,
    space_in_empty_paren: true,
    end_with_newline: true,
  });
  const fileName = `${className}.js`;
  try {
    fs.writeFileSync(path.join(__dirname, `model/${fileName}`), formattedCode);
    console.log(`RequestBody ${fileName} generated successfully!`);
  } catch (err) {
    console.error("Error writing file:", err);
  }

  Object.keys(schema.properties).forEach((prop) => {
    if (schema.properties[prop].items) {
      // aqui precisamos criar um objeto
      const subClass = resolveRef(schema.properties[prop].items.$ref);
      const newSchema = openApiDoc.components.schemas[subClass];
      const subClassName = capitalize(subClass) + "Model";
      generateRequestBodyClass(subClassName, newSchema, openApiDoc);
    }
  });
}

// Função para gerar drivers de API e classes de request body
function generateAppDriversFromOpenAPI(openApiPath, endpoint) {
  const fileContents = fs.readFileSync(
    path.join(__dirname, `/${openApiPath}`),
    "utf8"
  );
  const openApiDoc = yaml.load(fileContents);
  const paths = openApiDoc.paths;

  if (endpoint) {
    const className = generateClassNameFromPath(endpoint);
    const methods = Object.keys(paths[endpoint]);
    generateAppDriver(className, endpoint, methods, paths[endpoint]);
    generateRequestBodyClasses(endpoint, methods, paths[endpoint], openApiDoc);
  } else {
    // Iterar sobre os endpoints e gerar arquivos AppDriver simplificados
    Object.keys(paths).forEach((endpointPath) => {
      const className = generateClassNameFromPath(endpointPath);
      const methods = Object.keys(paths[endpointPath]);
      generateAppDriver(className, endpointPath, methods, paths[endpointPath]);
      generateRequestBodyClasses(
        endpointPath,
        methods,
        paths[endpointPath],
        openApiDoc
      );
    });
  }
}

// Função para gerar nome da classe e do arquivo
function generateClassNameFromPath(endpointPath) {
  const cleanedPath = endpointPath
    .replace(/\//g, " ")
    .replace(/\{.*?\}/g, "")
    .replace(/[^a-zA-Z0-9 ]/g, "")
    .trim()
    .split(" ")
    .map((word, index) =>
      index === 0
        ? word.toLowerCase()
        : word.charAt(0).toUpperCase() + word.slice(1)
    )
    .join("");
  return `${capitalize(cleanedPath)}AppDriver`;
}

// Função para gerar um arquivo appDriver que realiza as requests com Cypress, unificando os métodos (GET, POST etc.)
function generateAppDriver(className, endpointPath, methods, endpointMethods) {
  let driverCode = `
   class ${className} {
   `;
  methods.forEach((method) => {
    driverCode += `
      static request${capitalize(method)}(data, token = '') {
          return cy.request({
              method: '${method.toUpperCase()}',
              url: \`${endpointPath.replace(/\{(.*?)\}/g, "${data.$1}")}\`,
              body: data.body || {},
              headers: {
                  Authorization: token ? \`Bearer \${token}\` : undefined,
                  ...data.headers
              },
              qs: data.query || {}
          });
      }
      static validate${capitalize(method)}Response(response, statusCode) {
          cy.wrap(response).its('status').should('equal', statusCode);
      }
   `;
  });
  driverCode += `
   }
   module.exports = ${className};
   `;
  // Formatar o código com JSBeautify
  const formattedCode = beautify(driverCode, {
    indent_size: 2,
    space_in_empty_paren: true,
    end_with_newline: true,
  });
  // Gerar o nome do arquivo baseado no endpoint
  const fileName = `${className}.js`;
  // Salvar o arquivo AppDriver automaticamente
  try {
    fs.writeFileSync(
      path.join(__dirname, `appDriver/${fileName}`),
      formattedCode
    );
    console.log(`AppDriver ${fileName} generated successfully!`);
  } catch (err) {
    console.error("Error writing file:", err);
  }
}

// Caminho para o arquivo OpenAPI em YAML
// const openApiPath = './onboardingCompany';
const openApiPath = "./cadastral-domain-api";
// Executar o gerador de AppDrivers
generateAppDriversFromOpenAPI(openApiPath, "/v1/persondocumenttype");
