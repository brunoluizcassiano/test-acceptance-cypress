const cypress = require('cypress');
const path = require('path');

function openCypress(){
    const options = {
        configFile: path.resolve(__dirname, '../../../cypress.config.js')
    };
    
    return cypress.open(options).then((results) => {
        console.log(results);
    }).catch((err) => {
        console.error(err);
    })
}

module.exports = openCypress;