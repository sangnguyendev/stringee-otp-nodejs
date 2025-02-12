const crypto = require('crypto')
/**
    * Xác minh request từ Stringee
    * @param {*} request
    * @param {*} response
    * @param {*} next 
*/
const ValidatingRequestsStringee = (request, response, next) => {
    const SIGNATURE = request.header('X-STRINGEE-SIGNATURE');
    if(!SIGNATURE) return response.status(401).send({status:'error',message:'Unauthorized'});
    var data = request.originalUrl;
    if (request.method == "POST") {
        // do form handling
        data = request.body;
    }
    console.log(data);
    const {STRINGEE_SECRET_KEY} = process.env;
    if(!STRINGEE_SECRET_KEY) return response.status(500).send({status:'error',message:'Stringee API Key chưa được cấu hình'});
    const decrypt = crypto.createHmac('SHA256', STRINGEE_SECRET_KEY).update(data).digest('base64');
    if(decrypt !== SIGNATURE) return response.status(401).send({status:'error',message:'Unauthorized'});
    return next();
}

module.exports = ValidatingRequestsStringee;