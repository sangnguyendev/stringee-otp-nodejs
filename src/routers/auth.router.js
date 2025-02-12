const router = require('express').Router();
const OtpInController = require('../controllers/otp-in.controller');
const OtpOutController = require('../controllers/otp-out.controller');

router.post('/incall', [], OtpInController.request_otp_incall);
router.post('/incall/check', [], OtpInController.check_verify_otp_incall);

router.post('/outcall', [], OtpOutController.request_otp_outcall);
router.post('/outcall/verify', [], OtpOutController.verify_otp_outcall);

module.exports = router;
