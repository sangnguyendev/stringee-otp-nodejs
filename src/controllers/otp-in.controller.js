/**
 * Controller gửi yêu cầu đăng nhập, user gọi đến tổng đài
 * @param {*} req 
 * @param {*} res 
 * @param {*} next 
 * @returns 
 */
const request_otp_incall = async (req, res, next) => {
    try {
        return res.send();
    } catch (error) {
        next(error);
    }
};

module.exports = {request_otp_incall};