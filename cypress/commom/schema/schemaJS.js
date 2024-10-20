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

  loadDocumentation() {
    try {
      const fileContents = fs.readFileSync(
        path.join(__dirname, `/${this.filePath}`),
        "utf8"
      );
      this.document = yaml.load(fileContents);
      console.log(this.document);
    } catch (error) {
      console.error(`Error reading OpenAPI file: ${error.message}`);
    }
  }

  getPaths() {
    if (!this.document || !this.document.paths) {
      throw new Error("OpenAPI document is not loaded or invalid");
    }
    console.log(this.document.paths);
    return this.document.paths;
  }

  getSchemasForResponse(path, method) {
    const responses = this.document.paths[path][method].responses;
    const schemas = {};
    for (const [statusCode, response] of Object.entries(responses)) {
      if (response.content && response.content["application/json"]) {
        schemas[statusCode] = response.content["application/json"].schema;
      }
    }
    console.log(schemas);
    return schemas;
  }

  getRequestBodySchema(path, method) {
    const requestBody = this.document.paths[path][method].requestBody;
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

  generateClassesFromOpenAPI() {
    const schemas = this.document.components.schemas;
    // Gerar uma classe para cada schema
    Object.keys(schemas).forEach((schemaName) => {
      const schema = schemas[schemaName];

      console.log(`schemaName: ${schemaName}`);
      console.log(`schema: ${JSON.stringify(schema.type, null, 4)}`);

      this.generateClass(schemaName, schema);
    });
  }

  generateClass(className, schema) {
    const classCode =
      `
               const SchemaWrapper = require('./SchemaWrapper.js');
               class ${className} extends SchemaWrapper {
       
               getSchema() {
               return {
               "$id": "${className}",
               "type": "${schema.type}",
               "properties": ${JSON.stringify(schema.properties, null, 1)},
               "required": ${JSON.stringify(schema.required)}
               }
               }
       
               getSubSchemas() {
                   const directSubSchemas = [];
       
                   const subSchemas = directSubSchemas.map((subSchema) => {
                           const subSchemaType = require(` +
      "`./${subSchema}.js`)" +
      `
                           const subSchemaInstance = new subSchemaType()
                           return subSchemaInstance.getSubSchemas()
                   })
       
                   return directSubSchemas.concat(subSchemas.flat())
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
    console.log("Generated class code:", formattedCode); // Logando o código gerado
    // Salvar a classe em um arquivo JS
    try {
      fs.writeFileSync(
        path.join(__dirname, `/Generate/${className}.js`),
        formattedCode
      );
      console.log(`Class ${className}.js generated successfully!`);
    } catch (err) {
      console.error("Error writing file:", err);
    }
  }
}

module.exports = { schema };

// Caminho para o arquivo OpenAPI em YAML
const openApiPath = 'OpenAPI/onboardingCompany';
const openApiReader = new Schema(openApiPath);
openApiReader.loadDocumentation();
// openApiReader.getPaths();
// openApiReader.getSchemasForResponse('/api/onboarding', 'post');
// openApiReader.getRequestBodySchema('/api/onboarding', 'post');
openApiReader.generateClassesFromOpenAPI();