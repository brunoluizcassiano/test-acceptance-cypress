var fs = require('fs');
var request = require('request');

async function upPdf(policy, credential, date, signature, testCase, testeExecution, jiraProjectId, userAccountId) {
 var options = {
        'method': 'POST',
        'url': 'https://smartbear-tm4j-prod-us-west-2-attachment.s3.us-west-2.amazonaws.com/',
        'headers': {
            'Sec-Fetch-Site': 'cross-site',
            'Cookie': ''
        },
        formData: {
            'key': `write/tenant/2aa1cd43-2dc9-35d6-ab7b-b7a49d7f78ba/project/${jiraProjectId}/testresult/${testeExecution}/67dedc81-079f-4720-9a90-b8428ffe31d7`,
            'acl': 'private',
            'Policy': policy,
            'X-Amz-Credential': credential,
            'X-Amz-Algorithm': 'AWS4-HMAC-SHA256',
            'X-Amz-Date': date,
            'X-Amz-Signature': signature,
            'X-Amz-Meta-user-account-id': userAccountId,
            'X-Amz-Meta-name': `${testCase}.pdf`,
            'Content-Type': 'application/pdf',
            'file': {
                'value': fs.createReadStream(`temp/${testCase}.pdf`),
                'options': {
                    'filename': `temp/${testCase}`,
                    'contentType': null
                }
            }
        }
    }
    const response = await requestHttps(options)
    return response
}

const requestHttps = (requestOptions) => {
    return new Promise((resolve, reject) => {
        request(requestOptions, function (error, response) {
            if (error) {
                console.error(error)
                reject(error)
            } else {
                console.log(response.statusCode)
                resolve(response.body)
            }
        })

    })
}

module.exports = { upPdf };