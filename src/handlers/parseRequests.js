const requestHandler = require("../parseRequests/requestHandler");

exports.handler = async (event) => {
    const data = await requestHandler.default(event);
    
    const response = {
        statusCode: 200,
        body: data
    };

    return response;
};