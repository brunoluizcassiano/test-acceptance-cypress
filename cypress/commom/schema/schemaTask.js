const fs = require("fs");
const path = require("path");
const yaml = require("js-yaml");
const beautify = require("js-beautify").js;

/**
 * Funções relacionadas ao schema.
 */
class schema {
  constructor(filePath) {
    // Certificando-se de que o construtor recebe e define corretamente o caminho do arquivo
    if (!filePath) {
      throw new Error("filePath is required");
    }
    this.filePath = filePath;
    this.document = null; // Inicializando a documentação como null
  }

  static setFilePath(filePath) {
    this.filePath = filePath;
  }

  static getFilePath() {
    return this.filePath;
  }

  static setDocument(document) {
    this.document = document;
  }

  static getDocument() {
    return this.document;
  }
}

module.exports = (on, config) => {
  // Função para tratar $ref e extrair apenas o nome do schema
  const resolveRef = (ref) => {
    const refParts = ref.split("/");
    return refParts[refParts.length - 1]; // Retorna o último elemento após a barra
  };

  // Função para processar schemas e resolver referências
  const processSchema = (schema, subSchemas) => {
    if (schema.$ref) {
      const schemaName = resolveRef(schema.$ref);
      subSchemas.push(schemaName); // Adiciona o nome da referência ao array
      return { $ref: schemaName }; // Retorna o schema com o nome da referência
    }
    if (typeof schema === "object") {
      const filteredSchema = {};
      for (const key in schema) {
        if (key === "type") {
          if (schema[key] !== "enum") {
            filteredSchema[key] = schema[key]; // Mantém o 'type', exceto se for 'enum'
          }
        } else if (typeof schema[key] === "object") {
          const processed = processSchema(schema[key], subSchemas);
          if (processed && Object.keys(processed).length > 0) {
            filteredSchema[key] = processed; // Processa recursivamente
          }
        }
      }
      return filteredSchema;
    }
    return schema;
  };

  // Validação: Remove 'properties' ou 'required' se estiverem indefinidos ou vazios
  const getProperties = (processedSchema, requiredFields) => {
    let properties = "";
    if (
      !processedSchema.properties ||
      Object.keys(processedSchema.properties).length === 0
    ) {
      delete processedSchema.properties;
      return properties;
    } else {
      // Para cada propriedade, adicionar a verificação de nullable
      const updatedProperties = {};
      Object.keys(processedSchema.properties).forEach((field) => {
        const fieldSchema = processedSchema.properties[field];
        // Se o campo não for required e tiver um type definido, adicionamos nullable
        if (!requiredFields.includes(field)) {
          if (fieldSchema.type) {
            fieldSchema.nullable = true;
            fieldSchema.description = fieldSchema.description;
          } else {
            console.warn(
              `Campo ${field} não tem um tipo definido, nullable não será aplicado.`
            );
          }
        }
        updatedProperties[field] = fieldSchema;
      });
      properties = `properties: ${JSON.stringify(updatedProperties, null, 4)},`;
      return properties;
    }
  };

  // Validação: Remove 'properties' ou 'required' se estiverem indefinidos ou vazios
  const getRequired = (schema) => {
    let required = "";
    if (!schema.required || schema.required.length === 0) {
      delete schema.required;
      return required;
    } else {
      required = `"required": ${JSON.stringify(schema.required)}`;
      return required;
    }
  };

  // Validação: Remove 'properties' ou 'required' se estiverem indefinidos ou vazios
  const requiredSubSchema = (directSubSchemas) => {
    let subSchemaName = "";

    var aux = Array.from(new Set(directSubSchemas));

    if (aux.length > 0) {
      subSchemaName = `
            const schemas = {`;
      for (var x = 0; x < aux.length; x++) {
        subSchemaName = subSchemaName + `${aux[x]}: require('./${aux[x]}.js'),`;
      }
      subSchemaName =
        subSchemaName +
        `};
            `;
      return subSchemaName;
    } else {
      return subSchemaName;
    }
  };

  async function loadDocumentation(filePath) {
    schema.setFilePath(filePath);
    try {
      const fileContents = fs.readFileSync(`${schema.getFilePath()}`, "utf8");
      schema.setDocument(yaml.load(fileContents));
      return schema.getDocument();
    } catch (error) {
      return `Error reading OpenAPI file: ${error.message}`;
    }
  }

  async function getPaths() {
    if (!schema.getDocument() || !schema.getDocument().paths) {
      throw new Error("OpenAPI document is not loaded or invalid");
    }
    return schema.getDocument().paths;
  }

  async function getSchemasForResponse(path, method) {
    const responses = schema.getDocument().paths[path][method].responses;
    const schemas = {};
    for (const [statusCode, response] of Object.entries(responses)) {
      if (response.content && response.content["application/json"]) {
        schemas[statusCode] = response.content["application/json"].schema;
      }
    }
    return schemas;
  }

  async function getRequestBodySchema(path, method) {
    const requestBody = schema.getDocument().paths[path][method].requestBody;
    if (
      requestBody &&
      requestBody.content &&
      requestBody.content["application/json"]
    ) {
      console.log(requestBody.content["application/json"].schema);
      return requestBody.content["application/json"].schema;
    }
    console.log("null");
    return null;
  }

  // Função para gerar a classe de todos os endpoints ou de um endpoint específico
  async function generateFromOpenAPI(filePath, endpoint) {
    if (endpoint) {
      // Geração para um endpoint específico
      const paths = schema.getDocument().paths;
      if (paths[endpoint]) {
        const endpointData = paths[endpoint];
        const methods = Object.keys(endpointData); // Ex: ['get', 'post', 'put']
        methods.forEach((method) => {
          const operation = endpointData[method];
          const responseSchemas = operation.responses;
          if (responseSchemas) {
            for (const statusCode in responseSchemas) {
              const responseSchema =
                responseSchemas[statusCode].content?.["application/json"]
                  ?.schema;
              if (responseSchema && responseSchema.items.$ref) {
                const schemaName = resolveRef(responseSchema.items.$ref);
                generateClass(
                  filePath,
                  schemaName,
                  schema.getDocument().components.schemas[schemaName],
                  schema.getDocument()
                ); // Gera a classe para o endpoint
              }
            }
          }
        });
      } else {
        console.error(`Endpoint ${endpoint} not found in OpenAPI document.`);
      }
    } else {
      // Geração para todos os schemas do OpenAPI
      const schemas = schema.getDocument().components.schemas;
      for (const schemaName in schemas) {
        generateClass(
          filePath,
          schemaName,
          schemas[schemaName],
          schema.getDocument()
        ); // Gera todas as classes
      }
    }
    return "generateFromOpenAPI()";
  }

  // Função para gerar a classe de um schema específico
  async function generateClass(filePath, className, schema, document) {
    // Inicializa a lista de subSchemas
    const directSubSchemas = [];

    // Processar o schema antes de gerar a classe
    const processedSchema = processSchema(schema, directSubSchemas);

    const classCode = `
    const SchemaWrapper = require('cypress-pattern-globalcards/schemaWrapper');
    ${requiredSubSchema(directSubSchemas)}
    class ${className} extends SchemaWrapper {

    getSchema() {
    return {
    "$id": "${className}",
    "type": "${schema.type}",${getProperties(
      processedSchema,
      getRequired(schema)
    )}${getRequired(schema)}
    }
    }

    getSubSchemas() {
        const directSubSchemas = ${JSON.stringify(directSubSchemas)};

        const subSchemas = directSubSchemas.map((subSchema) => {
                const subSchemaType = schemas[subSchema];
                const subSchemaInstance = new subSchemaType();
                return subSchemaInstance.getSubSchemas();
        })

        return directSubSchemas.concat(subSchemas.flat());
    }
    }

    module.exports = ${className};
    `;

    // Formatar o código com JSBeautify
    const formattedCode = beautify(classCode, {
      indent_size: 2,
      space_in_empty_paren: true,
      end_with_newline: true,
    });

    // Salvar a classe em um arquivo JS
    try {
      // fs.writeFileSync(path.join(__dirname, `/Generate/${className}.js`), formattedCode);
      fs.writeFileSync(`${filePath}/${className}.js`, formattedCode);
      console.log(`Class ${className}.js generated successfully!`);
    } catch (err) {
      console.error("Error writing file:", err);
    }

    // Gerar os arquivos para as referências
    directSubSchemas.forEach((subSchema) => {
      if (document.components.schemas[subSchema]) {
        generateClass(
          filePath,
          subSchema,
          document.components.schemas[subSchema],
          document
        ); // Gera os arquivos de referência
      }
    });
  }

  on("task", {
    async loadDocumentation(filePath) {
      return await loadDocumentation(filePath);
    },
  });

  on("task", {
    async getPaths() {
      return await getPaths();
    },
  });

  on("task", {
    async getSchemasForResponse({ path, method }) {
      return await getSchemasForResponse(path, method);
    },
  });

  on("task", {
    async getRequestBodySchema({ path, method }) {
      return await getRequestBodySchema(path, method);
    },
  });

  on("task", {
    async generateClassesFromOpenAPI(filePath) {
      return await generateFromOpenAPI(filePath);
    },
  });

  on("task", {
    async generateClassFromEndpoint({ filePath, path }) {
      return await generateFromOpenAPI(filePath, path);
    },
  });

  return config;
};
