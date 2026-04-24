const jwt = require('jsonwebtoken');
const axios = require('axios');
const {STRINGEE_NUMBER, STRINGEE_SID_KEY, STRINGEE_SECRET_KEY, STRINGEE_AUDIO_FILE} = require('../configs/constant/stringee.config');

const PhoneHelper = require('../helpers/phone.helper');
class StringeeService {

    /**
     * Thực hiện cuộc gọi ra phát mã otp
     * @param {string} otpCode 
     * @param {string} phone
     * @param {'vn' | 'en'} lang 
     * @returns {Promise<{callId: string}>}
     */
    async makeOutCallOTP(otpCode, phone, lang = "vn") {

        if(!STRINGEE_NUMBER) throw new Error(`Stringee Number chưa được cấu hình`);
        const StringeeAPIURL = `https://api.stringee.com/v1/call2/callout`;
        const otpNumbers = STRINGEE_AUDIO_FILE[lang].STRINGEE_OTP_FILE;

        const codeNumbers = otpCode.split("");
        let codeNumberPlay = [];
        for(let i = 0; i < codeNumbers.length; i++) {

            let code = parseInt(codeNumbers[i]);
            codeNumberPlay.push(
                {
                    "action": "play",
                    "fileName": otpNumbers[code],
                    "continueWhilePlay": false
                }
            );

        }

        let plays = [
            {
                "action": "record",
                "eventUrl": "",
                "format": "mp3"
            },
            {
                "action": "play",
                "fileName": STRINGEE_AUDIO_FILE[lang].STRINGEE_GREETING_OUTPUT_OTP_FILE_ID, // lời chào
                "continueWhilePlay": false
            }
        ];

        let actions = plays.concat(codeNumberPlay);


        let connect = { 
            "from": {
                "type": "external", 
                "number": PhoneHelper.detectPhone(STRINGEE_NUMBER), 
                "alias": PhoneHelper.detectPhone(STRINGEE_NUMBER)
            },
            "to": [
                {
                    "type": "external", 
                    "number": PhoneHelper.detectPhone(phone), 
                    "alias": phone
                }
            ],
            "actions": actions
        };

        let headers = {
            "X-STRINGEE-AUTH": this.getStringeeToken()
        };
        try {
            const res = await axios.post(StringeeAPIURL, connect, { headers:headers});
            const {data} = res;
            const {call_id} = data;
            return {callId: call_id};
        } catch (error) {
            throw Error(error.message);
        }


    }

    /**
     * Lấy SCCO phản hồi chờ nhập OTP dtmf
     * @param {string} authToken 
     * @param {string} phone 
     * @param {string} number 
     * @param {'vn' | 'en'} lang 
     * @returns 
     */
    getStringeeSCCOInCallOTP(authToken, phone, number, lang = "vn") {

        const eventUrl = `${process.env.BASE_API_DOMAIN}/1.0/webhook/number_event_dtmf_url?from=${phone}&to=${number}`;
        var actions = [
            {
                "action": "play",
                "fileName": STRINGEE_AUDIO_FILE[lang].STRINGEE_GREETING_INPUT_OTP_FILE_ID, // lời chào
            },
            {
                "action": "input",
                "eventUrl": eventUrl,
                "submitOnHash": false,
                "timeout": "8",
                "maxDigits": "4",
                "customField": JSON.stringify({authToken: authToken, phone: phone})
            }
        ];
        return actions;

    }

    /**
     * Lấy SCCO phát mã OTP
     * @param {string} otpCode 
     * @param {'vn' | 'en'} lang 
     * @returns 
     */
    getStringeeSCCOInCall2OTP(otpCode, lang = "vn") {

        const otpNumbers = STRINGEE_AUDIO_FILE[lang].STRINGEE_OTP_FILE;

        const codeNumbers = otpCode.split("");
        let codeNumberPlay = [];
        for(let i = 0; i < codeNumbers.length; i++) {

            let code = parseInt(codeNumbers[i]);
            codeNumberPlay.push(
                {
                    "action": "play",
                    "fileName": otpNumbers[code],
                    "continueWhilePlay": false
                }
            );

        }
        let plays = [
            {
                "action": "record",
                "eventUrl": "",
                "format": "mp3"
            },
            {
                "action": "play",
                "fileName": STRINGEE_AUDIO_FILE[lang].STRINGEE_GREETING_OUTPUT_OTP_FILE_ID, // lời chào
                "continueWhilePlay": false
            }
        ];

        let actions = plays.concat(codeNumberPlay);

        return actions;

    }

    /**
     * Lấy SCCO báo lỗi mặc định khi user gọi đến tổng đài không thực hiện lệnh xác minh mã OTP
     * @param {string} phone 
     * @param {string} number 
     * @param {'vn' | 'en'} lang
     * @returns 
     */
    getStringeeSCCODefault(phone, number, lang = "vn") {

        return [
            {
                "action": "play",
                "fileName": STRINGEE_AUDIO_FILE[lang].STRINGEE_GREETING_DEFAULT_FILE_ID,
                "continueWhilePlay": true
            },
            {
                "action": "connect",
                "from": {
                    "type": "external",
                    "number": phone,
                    "alias": phone
                },
                "to": {
                    "type": "internal",
                    "number": number,
                    "alias": number
                },
                "customData": JSON.stringify({msg: 'Người dùng gọi đến tổng đài nhưng không thực hiện lệnh xác minh mã OTP', number: number, phone: phone, lang: lang}),
                "timeout": 60,
                "maxConnectTime": 0,
                "peerToPeerCall": false
            }
        ];
    }

    /**
     * get Stringee Token, cached lại trong db nếu cần
     * @returns {string} Stringee rest api access token
     */
    getStringeeToken() {

        if(!STRINGEE_SID_KEY || !STRINGEE_SECRET_KEY) throw new Error(`Stringee API Key chưa được cấu hình`);
        var now = Math.floor(Date.now() / 1000);
        var exp = now + 36000;
        var header = {
            "typ": "JWT",
            "alg": "HS256",// only support HS256
            "cty": "stringee-api;v=1"
        }
        var payload = {
            "jti": STRINGEE_SID_KEY+ "-" + now,
            "iss": STRINGEE_SID_KEY,
            "exp": exp,
            "rest_api": true
        };
        return jwt.sign(payload, STRINGEE_SECRET_KEY, {algorithm: 'HS256', header: header});
    
    };

}

module.exports = new StringeeService();