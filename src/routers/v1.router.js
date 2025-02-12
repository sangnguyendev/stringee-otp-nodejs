const router = require('express').Router();
const WebhookRouter = require('./webhook.router');
const AuthRouter = require('./auth.router');

// router webhook sử dụng trong cấu hình Stringee Developer. Có thể áp dụng middlewwares: ValidatingRequestStringee để xác minh request từ Stringee
router.use('/webhook', [], WebhookRouter);
// router auth
router.use('/auth', [], AuthRouter);

module.exports = router;
