const AuthService = require('../services/auth.service');
/**
 * Controller gửi yêu cầu đăng nhập, user gọi đến tổng đài xác minh otp qua phím bấm dtmf
 * @param {*} req 
 * @param {*} res 
 * @param {*} next 
 * @returns 
 */
const request_otp_incall = async (req, res, next) => {
    try {
        const {phone} = req.body;
        const ip = req.clientIp || req.headers['CF-Connecting-IP'] || req.headers['x-real-ip'] || req.connection.remoteAddress;
        const result = await AuthService.requestOTP(phone, ip, "incall");
        return res.send(result);
    } catch (error) {
        next(error);
    }
};

/**
 * Controller gửi yêu cầu đăng nhập, user gọi đến tổng đài để nghe mã OTP
 * @param {*} req 
 * @param {*} res 
 * @param {*} next 
 * @returns 
 */
const request_otp_incall_2 = async (req, res, next) => {
    try {
        const {phone} = req.body;
        const ip = req.clientIp || req.headers['CF-Connecting-IP'] || req.headers['x-real-ip'] || req.connection.remoteAddress;
        const result = await AuthService.requestOTP(phone, ip, "incall2");
        return res.send(result);
    } catch (error) {
        next(error);
    }
};

/**
 * Controller kiểm tra trạng thái xác minh, user gọi đến tổng đài xác minh otp qua phím bấm dtmf
 * @param {*} req 
 * @param {*} res 
 * @param {*} next 
 * @returns 
 */
const check_verify_otp_incall = async (req, res, next) => {
    try {
        const {phone, authToken} = req.body;
        //const ip = req.clientIp || req.headers['CF-Connecting-IP'] || req.headers['x-real-ip'] || req.connection.remoteAddress;
        const result = await AuthService.checkVerifyOTPStatus(phone, authToken);
        return res.send(result);
    } catch (error) {
        next(error);
    }
};

/**
 * Controller kiểm tra mã OTP, user gọi đến tổng đài để nghe mã OTP
 * @param {*} req 
 * @param {*} res 
 * @param {*} next 
 * @returns 
 */
const verify_otp_incall_2 = async (req, res, next) => {
    try {
        const {phone, otpCode, authToken} = req.body;
        const result = await AuthService.verifyOTP(authToken, phone, otpCode);
        return res.send(result);
    } catch (error) {
        next(error);
    }
};

module.exports = {request_otp_incall, request_otp_incall_2, check_verify_otp_incall, verify_otp_incall_2};