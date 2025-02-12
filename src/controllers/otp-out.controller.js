const AuthService = require('../services/auth.service');
/**
 * Controller gửi yêu cầu đăng nhập, tổng đài gọi ra user để phát mã OTP
 * @param {*} req 
 * @param {*} res 
 * @param {*} next 
 * @returns 
 */
const request_otp_outcall = async (req, res, next) => {
    try {
        const {phone} = req.body;
        const ip = req.clientIp || req.headers['CF-Connecting-IP'] || req.headers['x-real-ip'] || req.connection.remoteAddress;
        const result = await AuthService.requestOTP(phone, ip, "outcall");
        return res.send(result);
    } catch (error) {
        next(error);
    }
};

/**
 * Controller kiểm tra mã OTP, tổng đài gọi ra user để phát mã OTP
 * @param {*} req 
 * @param {*} res 
 * @param {*} next 
 * @returns 
 */
const verify_otp_outcall = async (req, res, next) => {
    try {
        const {phone, otpCode, authToken} = req.body;
        const result = await AuthService.verifyOTP(authToken, phone, otpCode);
        return res.send(result);
    } catch (error) {
        next(error);
    }
};

module.exports = {request_otp_outcall, verify_otp_outcall};