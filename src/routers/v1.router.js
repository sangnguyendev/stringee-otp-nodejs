const router = require('express').Router();
const WebhookController = require('../controllers/webhook.controller');

router.post('/webhook/number_event_url', [], WebhookController.number_event_url);

module.exports = router;
