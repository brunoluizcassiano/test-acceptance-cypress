async function backendCallsWhenRunningTests(body) {
  let bodyCall = [];

  if (body) {
    for (i = 0; i < body.length; i++) {
      var responseString = JSON.stringify(body[i].response);
      var bodyString = JSON.stringify(body[i].body);

      if (bodyCall === undefined) {
        bodyCall = {
          margin: [10, 15, 0, 5],
          fontSize: 14,
          text: `\n
                       uri: ${body[i].uri}
                       path: ${body[i].path}
                       method: ${body[i].reqType}
                       headers: ${body[i].headers}
                       token: ${body[i].token}
                       body: ${bodyString}
                       statusCode: ${body[i].statusCode}
                       response: ${responseString}`,
        };
      } else {
        bodyCall = bodyCall.concat({
          margin: [10, 15, 0, 5],
          fontSize: 14,
          text: `\n
                       uri: ${body[i].uri}
                       path: ${body[i].path}
                       method: ${body[i].reqType}
                       headers: ${body[i].headers}
                       token: ${body[i].token}
                       body: ${bodyString}
                       statusCode: ${body[i].statusCode}
                       response: ${responseString}`,
        });
      }
    }

    return bodyCall;
  }
}

module.exports = { backendCallsWhenRunningTests };
