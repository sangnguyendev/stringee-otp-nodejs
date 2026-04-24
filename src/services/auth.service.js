const OTPRequestModel = require("../models/otp-request.model");
const PhoneHelper = require("../helpers/phone.helper");
const { BadRequestError, ForbiddenError } = require('../core/error.response');
const {STRINGEE_NUMBER, N8N_AUTOMATION_WEBHOOK_URL} = require('../configs/constant/stringee.config');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const randomstring = require("randomstring");
const StringeeService = require('./stringee.service');
const axios = require('axios');

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
        const PhoneLocal = this.validatePhone(phone);
       
        var Now = new Date();
        Now.setMinutes(Now.getMinutes() - 5);
        /** Kiểm tra địa chỉ IP */
        const CheckIPCount = await OTPRequestModel.countDocuments({createdAt: {$gte: Now}, ip: ip});
        if(CheckIPCount > 3) {
            throw new ForbiddenError(`Bạn đã gửi yêu cầu quá nhiều lần, vui lòng thử lại sau 5 phút`);
        }

        const OTPCode = randomstring.generate({length: 4, charset: 'numeric'});
        
        // Hashed mã otp trước khi lưu vào db
        const HashedOTP = await bcrypt.hash(OTPCode, 10);
        const expireAt = new Date();
        // thời gian hết hạn mã OTP là 5 phút
        expireAt.setMinutes(expireAt.getMinutes() + 5);

        // mã AuthToken ngẫu nhiên dùng xác minh request
        const AuthToken = randomstring.generate(20);

        const lang = this.isVietnamesePhone(PhoneLocal) ? "vn" : "en";

        const RequestOTP = await OTPRequestModel.create({
            phone: PhoneLocal,
            otpCode: OTPCode,
            otpCodeHash: HashedOTP,
            ip: ip,
            authToken: AuthToken,
            expireAt: expireAt,
            type: type,
            lang: lang
        });
        const number = lang === "vn" ? PhoneHelper.decodePhone(STRINGEE_NUMBER) : `+${STRINGEE_NUMBER}`;

        if(type === "incall") {
            // nếu là loại incall thì yêu cầu user gọi đến tổng đài để xác minh, trả về mã otp để hiển thị trên màn hình ứng dụng
            // send request to n8n webhook
            this.sendRequestOTPToN8N(PhoneLocal, number, ip, type);
            return {
                status: 'success',
                data: {
                    number: number, 
                    authToken: RequestOTP.authToken,
                    OTPCode: OTPCode,
                    expireAt: RequestOTP.expireAt
                },
                message: lang === "vn" ? `Vui lòng gọi đến <a href="tel:${number},${OTPCode}">${number}</a> từ số điện thoại ${phone} và nhập mã OTP` : `Please call <a href="tel:${number},${OTPCode}">${number}</a> from phone number ${phone} and enter the OTP code`
            }
        }

         if(type === "incall2") {
            // nếu là loại incall2 thì yêu cầu user gọi đến tổng đài để nghe mã OTP
            // send request to n8n webhook
            this.sendRequestOTPToN8N(PhoneLocal, number, ip, type);
            return {
                status: 'success',
                data: {
                    number: number, 
                    authToken: RequestOTP.authToken,
                    OTPCode: null,
                    expireAt: RequestOTP.expireAt
                },
                message: lang === "vn" ? `Vui lòng gọi đến <a href="tel:${number}">${number}</a> từ số điện thoại ${phone} để nghe mã OTP` : `Please call <a href="tel:${number}">${number}</a> from phone number ${phone} to hear the OTP code`
            }
        }


        // nếu là loại outcall thì thực hiện cuộc gọi từ tổng đài đến user để phát mã otp, lưu ý không trả về mã otp qua api trong trường hợp này
        await StringeeService.makeOutCallOTP(OTPCode, phone, lang);
        return {
            status: 'success',
            data: {
                number: number, 
                authToken: RequestOTP.authToken,
                OTPCode: null,
                expireAt: RequestOTP.expireAt
            },
            message: lang === "vn" ? `Vui lòng nhập mã OTP đã được gửi đến qua cuộc gọi` : `Please enter the OTP code that was sent to you via call`
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
        const lang = RequestOTP?.lang || "vn";
        if(!RequestOTP) {
            // nếu caller này chưa thực hiện lệnh xác minh mã OTP mà gọi trực tiếp đến tổng đài thì trả về null
            return null;
        }
        if(RequestOTP.failedCount >= 5) {
            throw new BadRequestError(lang === "vn" ? `Bạn đã nhập sai mã OTP quá 5 lần, vui lòng thử lại sau 3 phút` : `You have entered the OTP code incorrectly 5 times, please try again after 3 minutes`);
        }
        // trả về mã OTP để Stringee phát mã OTP hoặc chờ nhập OTP trên bàn phím
        return {otpCode: RequestOTP.otpCode, authToken: RequestOTP.authToken, type: RequestOTP.type, lang: RequestOTP.lang};

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

        if (!authToken || !otpCode) throw new BadRequestError(lang === "vn" ? "authToken và otpCode là bắt buộc" : "authToken and otpCode are required");
        if(!phone) throw new BadRequestError(lang === "vn" ? "phone là bắt buộc" : "phone is required");
        const PhoneLocal = PhoneHelper.detectPhone(phone);
        const RequestOTP = await OTPRequestModel.findOne({authToken: authToken, phone: PhoneLocal}).lean();
        const lang = RequestOTP?.lang || "vn";
        if(!RequestOTP) {
            throw new ForbiddenError(lang === "vn" ? `Yêu cầu không hợp lệ hoặc đã hết hạn, vui lòng thử lại` : `Request not found or expired, please try again`);
        }
        if(RequestOTP.isVerified) {
            throw new BadRequestError(lang === "vn" ? `Bạn đã xác minh số điện thoại rồi` : `You have verified your phone number`);
        }
        if(RequestOTP.failedCount >= maxVerifyCount) {
            throw new BadRequestError(lang === "vn" ? `Bạn đã nhập sai mã OTP quá 5 lần, vui lòng thử lại sau 3 phút` : `You have entered the OTP code incorrectly 5 times, please try again after 3 minutes`);
        }
        const formatedOTPCode = otpCode.replace("#", "");
        const isMatch = (formatedOTPCode === RequestOTP.otpCode);
        if (!isMatch) {
            await OTPRequestModel.findByIdAndUpdate(RequestOTP._id, { $inc: {failedCount: 1} });
            throw new BadRequestError(lang === "vn" ? `Mã OTP không hợp lệ, bạn còn ${maxVerifyCount - (RequestOTP.failedCount + 1)} lần thử` : `Invalid OTP code, you have ${maxVerifyCount - (RequestOTP.failedCount + 1)} attempts left`);
        }
        await OTPRequestModel.findByIdAndUpdate(RequestOTP._id, {  isVerified: true });
        /** Trả về access token và refresh token, authToken để khôi phục mật khẩu nếu cần */
        const payload = {
            phone: RequestOTP.phone,
            name: RequestOTP.phone
        }
        const tokens = this.generateTokens({payload});

        return {status: 'success', message: lang === "vn" ? "Đăng nhập thành công" : "Login success", data: {...tokens, authToken}};

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

    /**
     * Validate phone number, including international format or not
     * @param {string} phone 
     * @returns {string} phone number
     */
    validatePhone(phone) {
        if (!phone) {
            throw new BadRequestError("Số điện thoại là bắt buộc");
        }
        const PhoneLocal = PhoneHelper.detectPhone(phone);
        if (!/^\+?[0-9]{10,15}$/.test(PhoneLocal)) {
            throw new BadRequestError("Số điện thoại không hợp lệ");
        }
        return PhoneLocal;
    }

    /**
     * Kiểm tra số điện thoại là số Việt Nam, bắt đầu bằng 84 hoặc +84 hoặc 0
     * @param {string} phone 
     * @returns {boolean}
     */
    isVietnamesePhone(phone) {
        if (!phone) {
            throw new BadRequestError("Số điện thoại là bắt buộc");
        }
        const PhoneLocal = PhoneHelper.detectPhone(phone);
        return /^84[0-9]{9}$/.test(PhoneLocal) || /^\+84[0-9]{9}$/.test(PhoneLocal);
    }


    /**
     * Gửi thông tin request otp đến n8n webhook
     * @param {string} phone 
     * @param {string} number 
     * @param {string} ip
     * @param {string} type
     */
    async sendRequestOTPToN8N(phone, number, ip, type) {
        if (!N8N_AUTOMATION_WEBHOOK_URL) {
            console.warn("N8N_AUTOMATION_WEBHOOK_URL not configured, skipping webhook call");
            return;
        }

        const url = `${N8N_AUTOMATION_WEBHOOK_URL}`;
        const data = {
            phone,
            number,
            ip,
            type,
            createdAt: new Date()
        };
        try {
            await axios.post(url, data);
            console.debug("Sent request OTP to n8n webhook successfully");
        } catch (error) {
            console.error("Error sending request OTP to n8n webhook:", error);
        }
    }
}



module.exports = new AuthService();