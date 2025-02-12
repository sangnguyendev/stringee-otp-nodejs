const mongoose = require('mongoose');
const appDB = require('../configs/database/mongodb.init');
const OTPRequestSchema = new mongoose.Schema( {
    phone: {
        type: String,
        index: true,
        required: true,
        maxlength: 11,
        validate: {
            validator: function (v) {
                return /^(\+84|0|84)[0-9]{9,10}$/.test(v); // Kiểm tra định dạng số điện thoại Việt Nam
            },
            message: props => `${props.value} không phải là số điện thoại hợp lệ!`
        }
    },
    // otpCode: {
    //     type: String,
    //     index: true,
    //     required: true,
    //     maxlength: 4,
    //     minlength: 4
    // },
    type: {
        type: String,
        required: true,
        enum: ["incall", "outcall"]
    },
    otpCodeHash: {
        type: String,
        index: true,
        required: true,
    },
    ip: {
        type: String,
        required: true
    },
    authToken: {
        type: String,
        index: true,
        required: true,
        maxlength: 40,
        unique: true
    },
    failedCount: {
        type: Number,
        default: 0
    },
    resendCount: {
        type: Number,
        default: 0
    },
    expireAt: {
        type: Date,
        required: true
    },
    isVerified: {
        type: Boolean,
        default: false
    }
}, {versionKey: false, timestamps: true});
// Chỉ mục TTL và chỉ mục tổng hợp
OTPRequestSchema.index( { "expireAt": 1 }, { expireAfterSeconds: 0 } );
OTPRequestSchema.index({ phone: 1, ip: 1, createdAt: -1 });



// Phương thức kiểm tra resend
OTPRequestSchema.methods.canResendOTP = function () {
    return this.resendCount < 3; // Chỉ cho phép gửi lại tối đa 3 lần
};

module.exports = appDB.model('OTPRequest', OTPRequestSchema);
