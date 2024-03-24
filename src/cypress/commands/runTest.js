const cypress = require('cypress');
const path = require('path');

function runTests(){
    const options = {
        configFile: path.resolve(__dirname, 'cypress.config.js')
    };

    return cypress.run(options).then((results) => {
        console.log(results);
    }).catch((err) => {
        console.error(err);
    })
}

module.exports = runTests;