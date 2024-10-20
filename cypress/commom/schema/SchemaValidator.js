import Ajv from "ajv";

import SchemaWrapper from "./SchemaWrapper.js";

const ajv = new Ajv({ allErrors: true, discriminator: true });

const separator = "\n-------------------\n";

const getErrorMessage = (ajvError) => {
 return `Field: ${ajvError["instancePath"]} is invalid. Cause: ${ajvError["message"]}`
};

/**
 * Validates a JSON object against a given schema.
 *
 * @param {SchemaWrapper} schema - The schema to validate the JSON object against.
 * @param {object} json - The JSON object to validate.
 * @throws {Error} If the JSON object is invalid according to the schema.
 */
export const validateJson = (path, schema, json) => {
    let partes = path.split('/');
    let filePath = partes.slice(1).join('/');

    const schemaInstance = new schema();
    // Remove o schema anterior, se já estiver registrado
    if (ajv.getSchema(schemaInstance.getSchema().$id)) {
        ajv.removeSchema(schemaInstance.getSchema().$id);
    }

    schemaInstance.getSubSchemas().forEach((subSchema) => {
        let validate = ajv.getSchema(subSchema)
        if (!validate) {
            const subSchemaType = require(`../../../../../cypress/${filePath}/${subSchema}.js`)
            const subSchemaInstance = new subSchemaType()
            ajv.addSchema(subSchemaInstance.getSchema())
        }
    });

    const validate = ajv.compile(schemaInstance.getSchema());
    const valid = validate(json);

    if (!valid) {
        const validationErrorMessages = validate.errors.map((error) => getErrorMessage(error)).join(separator);
        throw new Error(validationErrorMessages);
    } else {
        cy.log("Schema validated!");
    }
};