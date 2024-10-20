class SchemaWrapper {
    constructor() {
           if (this.constructor == SchemaWrapper) {
               throw new Error("Class is of abstract type and can't be instantiated");
           };
   
           if (this.getSchema == undefined) {
               throw new Error("getSchema method must be implemented");
           };
   
           if (this.getSubSchemas == undefined) {
               throw new Error("getSubSchemas method must be implemented");
           }
       }
   }
   
   module.exports = SchemaWrapper;