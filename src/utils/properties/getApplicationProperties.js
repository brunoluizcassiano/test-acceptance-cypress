const PropertiesReader = require('properties-reader');
const prop = PropertiesReader('resources/application.properties');

module.exports = {
    GetProperty: function (pty) {
        return prop.get(pty)
    }
}