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
  // Se o schema tiver uma referência ($ref), resolva-a
  if (schema.$ref) {
    const refSchema = resolveSchemaRef(schema.$ref, openApiDoc);
    // Mescla o schema resolvido com o atual
    schema = { ...schema, ...refSchema };
  }
  // Se o schema tiver propriedades, percorra-as e resolva-as
  if (schema.properties) {
    Object.keys(schema.properties).forEach((prop) => {
      const propSchema = schema.properties[prop];
      // Se houver um $ref nas propriedades, resolva também
      if (propSchema.$ref) {
        schema.properties[prop] = resolveSchemaProperties(
          propSchema,
          openApiDoc
        );
      }
      // Gere os getters e setters para as propriedades
      // Certifique-se de manter este código ativo para gerar os getters e setters corretamente
    });
  }
  return schema;
}

// Função para verificar se o método tem um corpo de requisição (request body)
function hasRequestBody(method, endpointMethods) {
  return (
    ["post", "put", "patch"].includes(method.toLowerCase()) &&
    endpointMethods[method].requestBody
  );
}

// Função para verificar se o método exige autenticação (token)
function requiresAuth(endpointMethods) {
  return endpointMethods.security && endpointMethods.security.length > 0;
}

// Função para gerar classes de request body e resolver dependências recursivas de $ref
async function generateRequestBodyClasses(
  endpointPath,
  methods,
  endpointMethods,
  openApiDoc,
  generatePathAppDriver
) {
  await methods.forEach(async (method) => {
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
    await generateRequestBodyClass(
      className,
      schema,
      openApiDoc,
      generatePathAppDriver
    );
    await verifyRequestBobySubClass(
      schema.properties,
      openApiDoc,
      generatePathAppDriver
    );
  });
}

async function verifyRequestBobySubClass(
  properties,
  openApiDoc,
  generatePathAppDriver
) {
  // Verificar se há referências ($ref) nas propriedades e gerar classes adicionais
  Object.keys(properties).forEach(async (prop) => {
    const propSchema = properties[prop];

    if (propSchema) {
      const subSchema = resolveSchemaProperties(propSchema, openApiDoc);
      const subClassName = capitalize(prop) + "Model";
      await generateRequestBodyClass(
        subClassName,
        subSchema,
        openApiDoc,
        generatePathAppDriver
      );
    }
  });
}

// Função principal para gerar classes com getters e setters
function generateClass(name, properties) {
  return `
    class ${name} {
       constructor() {
           ${Object.keys(properties)
             .map((prop) => {
               if (properties[prop].type === "array") {
                 return `this.${prop} = [];`;
               }
               return `this.${prop} = null;`;
             })
             .join("\n        ")}
       }
       ${generateGettersSetters(properties)}
       toJSON() {
           return {
               ${Object.keys(properties)
                 .map((prop) => {
                   if (properties[prop].type === "array") {
                     return `${prop}: this.${prop}.map(item => item.toJSON ? item.toJSON() : item)`;
                   }
                   return `${prop}: this.${prop}`;
                 })
                 .join(",\n            ")}
           };
       }
    }
    module.exports = ${name};
    `;
}

// Função para gerar os getters e setters, com suporte a arrays e objetos JSON
function generateGettersSetters(properties) {
  return Object.keys(properties)
    .map((prop) => {
      const propType = properties[prop].type;
      // Verificar se a propriedade é do tipo array
      if (propType === "array") {
        const itemType = properties[prop].items?.type || "object";
        const subClassName = capitalize(prop.slice(0, -1)); // Gerar nome da subclasse
        return `
       get${capitalize(prop)}() {
           return this.${prop};
       }
       addTo${capitalize(prop)}(item) {
           if (typeof item !== '${itemType}' && !(item instanceof ${subClassName})) {
               throw new Error('Expected ${prop} item to be of type ${itemType} or an instance of ${subClassName}');
           }
           this.${prop}.push(item);
       }
       removeFrom${capitalize(prop)}(index) {
           if (index >= 0 && index < this.${prop}.length) {
               this.${prop}.splice(index, 1);
           } else {
               throw new Error('Invalid index for ${prop}');
           }
       }
       set${capitalize(prop)}(items) {
           if (!Array.isArray(items)) {
               throw new Error('Expected an array for ${prop}');
           }
           this.${prop} = items.map(item => {
               if (typeof item !== '${itemType}' && !(item instanceof ${subClassName})) {
                   throw new Error('Expected ${prop} item to be of type ${itemType} or an instance of ${subClassName}');
               }
               return item;
           });
       }
    `;
      }
      // Verificar se a propriedade é do tipo objeto e deve aceitar um JSON
      if (propType === "object" && properties[prop].properties) {
        const subClassName = capitalize(prop);
        return `
       get${capitalize(prop)}() {
           return this.${prop} || new ${subClassName}();
       }
       set${capitalize(prop)}(value) {
           // if (typeof value === 'object' && !(value instanceof ${subClassName})) {
           //    // Converter JSON para uma instância da subclasse
           //    this.${prop} = new ${subClassName}();
           //    Object.assign(this.${prop}, value); // Preencher os campos da subclasse com os dados do JSON
           if(typeof value === 'object'){
               this.${prop} = value;
           } else if (value instanceof ${subClassName}) {
               this.${prop} = value;
           } else {
               throw new Error('Expected ${prop} to be a valid JSON object or an instance of ${subClassName}');
           }
       }
    `;
      }
      // Caso não seja array ou objeto complexo, gerar getters e setters normais
      return `
       get${capitalize(prop)}() {
           return this.${prop};
       }
       set${capitalize(prop)}(value) {
           ${
             propType === "integer"
               ? `
           if (value !== null && !Number.isInteger(value)) {
               throw new Error('Expected ${prop} to be an integer or null');
           }`
               : `
           if (value !== null && typeof value !== '${propType}') {
              throw new Error('Expected ${prop} to be of type ${propType} or null');
           }`
           }
           this.${prop} = value;
       }
    `;
    })
    .join("");
}

// Função para gerar a classe de um request body específico
async function generateRequestBodyClass(
  className,
  schema,
  openApiDoc,
  generatePathAppDriver
) {
  if (!schema) {
    console.log(`Nenhum schema encontrado para ${className.toUpperCase()}!`);
    return;
  }
  const finalSchema = resolveSchema(schema, openApiDoc);
  if (!finalSchema.properties) {
    console.log(
      `Nenhuma propriedade encontrada para ${className.toUpperCase()}!`
    );
    return;
  }
  // Geração de classes para "oneOf", "allOf", "anyOf"
  if (schema.oneOf) {
    schema.oneOf.forEach(async (ref) => {
      const subSchema = resolveRef(ref.$ref);
      const newSchema = openApiDoc.components.schemas[subSchema];
      const subClassName = capitalize(subSchema) + "Model";
      await generateRequestBodyClass(
        subClassName,
        newSchema,
        openApiDoc,
        generatePathAppDriver
      );
    });
  }
  if (schema.allOf) {
    schema.allOf.forEach(async (ref) => {
      const subSchema = resolveRef(ref.$ref);
      const newSchema = openApiDoc.components.schemas[subSchema];
      const subClassName = capitalize(subSchema) + "Model";
      await generateRequestBodyClass(
        subClassName,
        newSchema,
        openApiDoc,
        generatePathAppDriver
      );
    });
  }
  if (schema.anyOf) {
    schema.anyOf.forEach(async (ref) => {
      const subSchema = resolveRef(ref.$ref);
      const newSchema = openApiDoc.components.schemas[subSchema];
      const subClassName = capitalize(subSchema) + "Model";
      await generateRequestBodyClass(
        subClassName,
        newSchema,
        openApiDoc,
        generatePathAppDriver
      );
    });
  }
  // Geração da classe para o esquema atual
  const requestBodyClass = generateClass(className, schema.properties);
  const formattedCode = beautify(requestBodyClass, {
    indent_size: 2,
    space_in_empty_paren: true,
    end_with_newline: true,
  });
  // Definindo o nome do arquivo a ser gerado
  const fileName = `${className}.js`;
  try {
    const filePath = `${generatePathAppDriver}/Model/${fileName}`;
    fs.writeFileSync(filePath, formattedCode);
    console.log(`RequestBody ${fileName} generated successfully!`);
  } catch (err) {
    console.error(`Error writing file ${fileName}:`, err);
  }
  // Processamento recursivo de sub-esquemas nas propriedades
  Object.keys(schema.properties).forEach(async (prop) => {
    const property = schema.properties[prop];
    // Se a propriedade é um array de objetos
    if (property.type === "array" && property.items) {
      const subSchema = resolveRef(property.items.$ref || property.items);
      const newSchema = openApiDoc.components.schemas[subSchema];
      const subClassName = capitalize(subSchema) + "Model";
      await generateRequestBodyClass(
        subClassName,
        newSchema,
        openApiDoc,
        generatePathAppDriver
      );
    }
    // Se a propriedade tem um $ref
    else if (property.$ref) {
      const subSchema = resolveRef(property.$ref);
      const newSchema = openApiDoc.components.schemas[subSchema];
      const subClassName = capitalize(subSchema) + "Model";
      await generateRequestBodyClass(
        subClassName,
        newSchema,
        openApiDoc,
        generatePathAppDriver
      );
    }
  });
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
async function generateAppDriver(
  className,
  endpointPath,
  methods,
  endpointMethods,
  generatePathAppDriver
) {
  let driverCode = `
       class ${className} {
       `;
  methods.forEach((method) => {
    const requiresBody = hasRequestBody(method, endpointMethods);
    const requiresToken = requiresAuth(endpointMethods);
    const queryParams =
      endpointMethods[method].parameters?.filter(
        (param) => param.in === "query"
      ) || [];
    const pathParams =
      endpointMethods[method].parameters?.filter(
        (param) => param.in === "path"
      ) || [];
    driverCode += `
          static async request${capitalize(
            method
          )}(uri, data = {}, token = '') {
           return new Cypress.Promise((resolve, reject) => {`;
    // Adicionar validação dos parâmetros de caminho
    if (pathParams.length > 0) {
      driverCode += `
              const url = uri + \`${endpointPath.replace(
                /\{(.*?)\}/g,
                "${data.$1}"
              )}\`;`;
    } else {
      driverCode += `
              const url = uri + '${endpointPath}';`;
    }
    driverCode += `
               cy.request({
                  method: '${method.toUpperCase()}',
                  url,`;
    // Adicionar o corpo da requisição apenas se o método exigir
    if (requiresBody) {
      driverCode += `
                  body: data.body || {},`;
    }
    // Adicionar parâmetros de consulta (query params) se existirem
    if (queryParams.length > 0) {
      driverCode += `
                  qs: data.query || {},`;
    }
    // Adicionar cabeçalhos se houver necessidade de autenticação ou outros headers
    if (
      requiresToken ||
      endpointMethods[method].parameters?.some((param) => param.in === "header")
    ) {
      driverCode += `
                  headers: {
                      ${
                        requiresToken
                          ? "Authorization: token ? `Bearer ${token}` : undefined,"
                          : ""
                      }
                      ...data.headers
                  },`;
    }
    driverCode += `
              }).then((response) => {
                   // Realiza o log da requisição
                   let jsonData = {
                       "uri": uri,
                       "path": '${endpointPath}',
                       "reqType": '${method.toUpperCase()}',
                       "headers": false,
                       "token": false,
                       "body": data,
                       "statusCode": response.status,
                       "response": response.body
                   };
   
                   cy.task('logRequestToJson', jsonData)
                   .then(() => {
                       cy.log('Log de requisição salvo com sucesso.');
                       resolve(response);
                   })
               });
           });
       };
   
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
      `${generatePathAppDriver}/AppDriver/${fileName}`,
      formattedCode
    );
    console.log(`AppDriver ${fileName} generated successfully!`);
  } catch (err) {
    console.error("Error writing file:", err);
  }
}

module.exports = (on, config) => {
  // Função para gerar drivers de API e classes de request body
  async function generateAppDriversFromOpenAPI(
    openApiPath,
    endpoint,
    generatePathAppDriver
  ) {
    // const fileContents = fs.readFileSync(path.join(__dirname, `/${openApiPath}`), 'utf8');
    const fileContents = fs.readFileSync(`${openApiPath}`, "utf8");
    const openApiDoc = yaml.load(fileContents);
    const paths = openApiDoc.paths;

    if (endpoint) {
      const className = generateClassNameFromPath(endpoint);
      const methods = Object.keys(paths[endpoint]);
      await generateAppDriver(
        className,
        endpoint,
        methods,
        paths[endpoint],
        generatePathAppDriver
      );
      await generateRequestBodyClasses(
        endpoint,
        methods,
        paths[endpoint],
        openApiDoc,
        generatePathAppDriver
      );
    } else {
      // Iterar sobre os endpoints e gerar arquivos AppDriver simplificados
      Object.keys(paths).forEach(async (endpointPath) => {
        const className = generateClassNameFromPath(endpointPath);
        const methods = Object.keys(paths[endpointPath]);
        await generateAppDriver(
          className,
          endpointPath,
          methods,
          paths[endpointPath],
          generatePathAppDriver
        );
        await generateRequestBodyClasses(
          endpointPath,
          methods,
          paths[endpointPath],
          openApiDoc,
          generatePathAppDriver
        );
      });
    }

    return "generateAppDriversFromOpenAPI()";
  }

  on("task", {
    async generateAppDriversFromOpenAPI({
      filePath,
      path,
      generatePathAppDriver,
    }) {
      return await generateAppDriversFromOpenAPI(
        filePath,
        path,
        generatePathAppDriver
      );
    },
  });

  return config;
};
