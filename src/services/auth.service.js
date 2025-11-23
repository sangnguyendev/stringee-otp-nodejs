const OTPRequestModel = require("../models/otp-request.model");
const PhoneHelper = require("../helpers/phone.helper");
const { BadRequestError, ForbiddenError } = require('../core/error.response');
const {STRINGEE_NUMBER} = require('../configs/constant/stringee.config');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const randomstring = require("randomstring");
const StringeeService = require('./stringee.service');

class AuthService {

    /**
     * Gửi yêu cầu đăng nhập bằng mã OTP
     * @param {string} phone
     * @param {string} ip
     * @param {"incall" | "outcall" | "incall2"} type 
     * @returns {Promise<{data: {number: string, authToken: string, OTPCode: string | null, expireAt: Date}, message: string}>}
     */
    async requestOTP(phone, ip, type) {

        if (!phone) throw new BadRequestError("phone là bắt buộc");
        if (!ip) throw new BadRequestError("ip là bắt buộc");
        if (!type) throw new BadRequestError("type là bắt buộc");
         /** Số điện thoại theo định dạng mã quốc gia 84xxxx */
        const PhoneLocal = PhoneHelper.detectPhone(phone);
       
        var Now = new Date();
        Now.setMinutes(Now.getMinutes() - 5);
        /** Kiểm tra địa chỉ IP */
        const CheckIPCount = await OTPRequestModel.countDocuments({createdAt: {$gte: Now}, ip: ip});
        if(CheckIPCount > 3) {
            throw new ForbiddenError(`Bạn đã gửi yêu cầu quá nhiều lần, vui lòng thử lại sau 5 phút`);
        }

        var OTPCode = randomstring.generate({length: 4, charset: 'numeric'});
        
        // Hashed mã otp trước khi lưu vào db
        const HashedOTP = await bcrypt.hash(OTPCode, 10);
        const expireAt = new Date();
        // thời gian hết hạn mã OTP là 5 phút
        expireAt.setMinutes(expireAt.getMinutes() + 5);

        // mã AuthToken ngẫu nhiên dùng xác minh request
        const AuthToken = randomstring.generate(20);

        const RequestOTP = await OTPRequestModel.create({
            phone: PhoneLocal,
            otpCode: OTPCode,
            otpCodeHash: HashedOTP,
            ip: ip,
            authToken: AuthToken,
            expireAt: expireAt,
            type: type
        });
        const number = PhoneHelper.decodePhone(STRINGEE_NUMBER);

        if(type === "incall") {
            // nếu là loại incall thì yêu cầu user gọi đến tổng đài để xác minh, trả về mã otp để hiển thị trên màn hình ứng dụng
            return {
                status: 'success',
                data: {
                    number: number, 
                    authToken: RequestOTP.authToken,
                    OTPCode: OTPCode,
                    expireAt: RequestOTP.expireAt
                },
                message: `Vui lòng gọi đến <a href="tel:${number}">${number}</a> từ số điện thoại ${phone} và nhập mã OTP`
            }
        }

         if(type === "incall2") {
            // nếu là loại incall2 thì yêu cầu user gọi đến tổng đài để nghe mã OTP

            return {
                status: 'success',
                data: {
                    number: number, 
                    authToken: RequestOTP.authToken,
                    OTPCode: null,
                    expireAt: RequestOTP.expireAt
                },
                message: `Vui lòng gọi đến <a href="tel:${number}">${number}</a> từ số điện thoại ${phone} để nghe mã OTP`
            }
        }
        // nếu là loại outcall thì thực hiện cuộc gọi từ tổng đài đến user để phát mã otp, lưu ý không trả về mã otp qua api trong trường hợp này
        await StringeeService.makeOutCallOTP(OTPCode, phone);
        return {
            status: 'success',
            data: {
                number: number, 
                authToken: RequestOTP.authToken,
                OTPCode: null,
                expireAt: RequestOTP.expireAt
            },
            message: `Vui lòng nhập mã OTP đã được gửi đến qua cuộc gọi`
        }
        

    }

    /**
     * Phát mã OTP cuộc gọi đến qua Stringee
     * @param {string} phone
     * @param {string} number 
     * @returns trả về mã OTP để phát mã OTP
     */
    async handleIncommingCall(phone, number) {

        if(!phone) throw new BadRequestError(`phone là bắt buộc`);
        if(!number) throw new BadRequestError(`number là bắt buộc`);
        const PhoneLocal = PhoneHelper.detectPhone(phone);
        if(PhoneHelper.detectPhone(number) !== PhoneHelper.detectPhone(STRINGEE_NUMBER)) {
            throw new ForbiddenError(`Số gọi đến không hợp lệ`);
        }

        const RequestOTP = await OTPRequestModel.findOne({phone: PhoneLocal}).sort({createdAt: -1}).lean();
        if(!RequestOTP) {
            throw new BadRequestError(`Yêu cầu không hợp lệ hoặc đã hết hạn, vui lòng thử lại`);
        }
        if(RequestOTP.failedCount >= 5) {
            throw new BadRequestError(`Bạn đã nhập sai mã OTP quá 5 lần, vui lòng thử lại sau 3 phút`);
        }
        // trả về mã OTP để Stringee phát mã OTP hoặc chờ nhập OTP trên bàn phím
        return {otpCode: RequestOTP.otpCode, authToken: RequestOTP.authToken, type: RequestOTP.type};

    }

    /**
     * Xác minh mã OTP
     * @param {string} authToken 
     * @param {string} phone 
     * @param {string} otpCode 
     * @param {string} ip
     * @returns {Promise<{authToken: string, accessToken: string}>} trả về tokens nếu xác minh thành công
     */
    async verifyOTP(authToken, phone, otpCode) {

        // số lần nhập sai mã OTP có thể thử
        const maxVerifyCount = 5;

        if (!authToken || !otpCode) throw new BadRequestError("authToken và otpCode là bắt buộc");
        if(!phone) throw new BadRequestError("phone là bắt buộc");
        const PhoneLocal = PhoneHelper.detectPhone(phone);
        const RequestOTP = await OTPRequestModel.findOne({authToken: authToken, phone: PhoneLocal}).lean();
        if(!RequestOTP) {
            throw new ForbiddenError(`Yêu cầu không hợp lệ hoặc đã hết hạn, vui lòng thử lại`);
        }
        if(RequestOTP.isVerified) {
            throw new BadRequestError(`Bạn đã xác minh số điện thoại rồi`);
        }
        if(RequestOTP.failedCount >= maxVerifyCount) {
            throw new BadRequestError(`Bạn đã nhập sai mã OTP quá 5 lần, vui lòng thử lại sau 3 phút`);
        }
        const formatedOTPCode = otpCode.replace("#", "");
        const isMatch = await bcrypt.compare(formatedOTPCode, RequestOTP.otpCodeHash);
        if (!isMatch) {
            await OTPRequestModel.findByIdAndUpdate(RequestOTP._id, { $inc: {failedCount: 1} });
            throw new BadRequestError(`Mã OTP không hợp lệ, bạn còn ${maxVerifyCount - (RequestOTP.failedCount + 1)} lần thử`);
        }
        await OTPRequestModel.findByIdAndUpdate(RequestOTP._id, {  isVerified: true });
        /** Trả về access token và refresh token, authToken để khôi phục mật khẩu nếu cần */
        const payload = {
            phone: RequestOTP.phone,
            name: RequestOTP.phone
        }
        const tokens = this.generateTokens({payload});

        return {status: 'success', message: 'Đăng nhập thành công', data: {...tokens, authToken}};

    }


    /**
     * Lấy trạng thái kết quả đã xác minh hay chưa
     * @param {string} phone 
     * @param {string} authToken
     * @param {string} ip
     * @returns {Promise<{accessToken: string, authToken: string}>} trả về tokens nếu đã xác minh thành công
     */
    async checkVerifyOTPStatus(phone, authToken) {

        if (!authToken) throw new BadRequestError("authToken là bắt buộc");
        if (!phone) throw new BadRequestError("phone là bắt buộc");
         /** Số điện thoại theo định dạng mã quốc gia 84xxxx */
         const PhoneLocal = PhoneHelper.detectPhone(phone);
        
        const RequestOTP = await OTPRequestModel.findOne({authToken: authToken, phone: PhoneLocal}).lean();
        if(!RequestOTP) {
            throw new ForbiddenError(`Yêu cầu không hợp lệ hoặc đã hết hạn, vui lòng thử lại`);
        }

        if(!RequestOTP.isVerified) {
            throw new BadRequestError(`Đang chờ xác minh`);
        }

        /** Trả về access token, authToken để khôi phục mật khẩu, đăng nhập, đăng ký */
        const payload = {

            phone: RequestOTP.phone,
            name: RequestOTP.phone
        }
        const tokens = this.generateTokens({payload});
        return {status: 'success', message: 'Đăng nhập thành công', data: {...tokens, authToken}};
        
    }    

    /**
     * generate Tokens
     * @param {*} payload
     * @returns {{accessToken: string}}
     */
    generateTokens = (payload) => {
        const {TOKEN_SECRET, TOKEN_SECRET_EXPIRE} = process.env;
        if(!TOKEN_SECRET) throw new Error(`TOKEN_SECRET chưa được cấu hình`);
        const accessToken = jwt.sign(payload, TOKEN_SECRET,{   
            expiresIn: TOKEN_SECRET_EXPIRE || "30d"
        });
        return {accessToken};
    
    }

}



module.exports = new AuthService();