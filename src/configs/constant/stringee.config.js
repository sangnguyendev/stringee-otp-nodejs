module.exports = {
    STRINGEE_SID_KEY: process.env.STRINGEE_SID_KEY,
    STRINGEE_SECRET_KEY: process.env.STRINGEE_SECRET_KEY,
    STRINGEE_NUMBER: process.env.STRINGEE_NUMBER,
    STRINGEE_AUDIO_FILE: {
        STRINGEE_GREETING_INPUT_OTP_FILE_ID: process.env.STRINGEE_GREETING_INPUT_OTP_FILE_ID,
        STRINGEE_GREETING_OUTPUT_OTP_FILE_ID: process.env.STRINGEE_GREETING_OUTPUT_OTP_FILE_ID,
        STRINGEE_VERIFY_SUCCESS_FILE_ID: process.env.STRINGEE_VERIFY_SUCCESS_FILE_ID,
        STRINGEE_VERIFY_FAILED_FILE_ID: process.env.STRINGEE_VERIFY_FAILED_FILE_ID,
        STRINGEE_OTP_FILE: {
            0: process.env.STRINGEE_OTP_0_FILE_ID,
            1: process.env.STRINGEE_OTP_1_FILE_ID,
            2: process.env.STRINGEE_OTP_2_FILE_ID,
            3: process.env.STRINGEE_OTP_3_FILE_ID,
            4: process.env.STRINGEE_OTP_4_FILE_ID,
            5: process.env.STRINGEE_OTP_5_FILE_ID,
            6: process.env.STRINGEE_OTP_6_FILE_ID,
            7: process.env.STRINGEE_OTP_7_FILE_ID,
            8: process.env.STRINGEE_OTP_8_FILE_ID,
            9: process.env.STRINGEE_OTP_9_FILE_ID
        }
    }
};