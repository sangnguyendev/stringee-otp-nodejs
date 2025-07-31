const AuthService = require('../services/auth.service');
const StringeeService = require('../services/stringee.service');
const {STRINGEE_AUDIO_FILE, STRINGEE_NUMBER} = require('../configs/constant/stringee.config');
const PhoneHelper = require('../helpers/phone.helper');

/**
 * Controller nhận tất cả sự kiện của cuộc gọi từ Stringee
 * @param {*} req 
 * @param {*} res 
 * @param {*} next 
 * @returns 
 */
const number_event_url = async(req, res, next) => {

    try {

        return res.send();
    } catch (error) {
        next(error);
    }

}

/**
 * Controller phản hồi SCCO cho Stringee khi có cuộc gọi đến tổng đài
 * @param {*} req 
 * @param {*} res 
 * @param {*} next 
 * @returns 
 */
const number_anwser_url = async(req, res, next) => {

    try {
        const {from, to} = req.query;
        const getOTPCode = await AuthService.handleIncommingCall(from, to);
        // getStringeeSCCOInCall2OTP
        if(getOTPCode.type === "incall") {
            return res.send(StringeeService.getStringeeSCCOInCallOTP(getOTPCode.authToken, from, to))
        }
        if(getOTPCode.type === "incall2") {
            return res.send(StringeeService.getStringeeSCCOInCall2OTP(getOTPCode.otpCode))
        }
        return res.status(403).send();
    } catch (error) {
        next(error);
    }

}

/**
 * Controller nhận sự kiện khi user bấm phím dtmf trong cuộc gọi
 * @param {*} req 
 * @param {*} res 
 * @param {*} next 
 * @returns 
 */
const number_event_dtmf_url = async(req, res) => {

    try {
        const event = req.body;
        var dtmf = event.dtmf;
        const customField = event.customField;
        if(!dtmf) throw Error(`dtmf is require`);
        if(!customField) throw Error(`customField is require`);
        const customData = JSON.parse(customField);
        if(!customData || typeof customData !== "object") {
            throw Error(`invalid data`);
        }
        // authToken nằm trong customField body
        if(!customData.authToken) {
            throw Error(`invalid data`);
        }
        const authToken = customData.authToken;
        if(!authToken) throw Error(`invalid authToken`);
        if(!dtmf || dtmf && !dtmf.length) {
            // mã otp chưa đủ ký tự, trả về
            throw new Error(`Xác minh thất bại`);
        }

        const phone = req.query.from;
        const number = req.query.to;
        if(PhoneHelper.detectPhone(number) !== PhoneHelper.detectPhone(STRINGEE_NUMBER)) {
            throw new Error(`Số tổng đài không hợp lệ`);
        }

         // đầu tiên là chỉ lấy 4 số đầu tiên nếu người dùng nhập thêm các ký tự đằng sau
         dtmf = dtmf.substring(0,4);
         const verifyOTP = await AuthService.verifyOTP(authToken, phone, dtmf );
         if(!verifyOTP) throw new Error(`Xác minh thất bại`);
         // trả về kết quả xác minh thành công
         return res.send([
             {   
                 "action": "play",
                 "fileName": STRINGEE_AUDIO_FILE.STRINGEE_VERIFY_SUCCESS_FILE_ID,
                 "bargeIn": true,
                 "continueWhilePlay": false
     
             }
         ]);

    } catch (error) {
       // xác minh thất bại
       console.log(error.message);
       return res.send([
        {   
            "action": "play",
            "fileName": STRINGEE_AUDIO_FILE.STRINGEE_VERIFY_FAILED_FILE_ID,
            "bargeIn": true,
            "continueWhilePlay": false
        }
    ]);
    }

}

module.exports = {number_event_url, number_anwser_url, number_event_dtmf_url};