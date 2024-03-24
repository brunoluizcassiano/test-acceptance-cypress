console.log("Biblioteca principal carregada");

const cypress = require('cypress');

function runTests(){
    cypress.run().then((results) => {
        console.log(results);
    }).catch((err) => {
        console.error(err);
    })
}

function openTests(){
    cypress.open().then((results) => {
        console.log(results);
    }).catch((err) => {
        console.error(err);
    })
}

module.exports = { runTests, openTests };