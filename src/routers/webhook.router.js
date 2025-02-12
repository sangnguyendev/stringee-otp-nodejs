const router = require('express').Router();
const WebhookController = require('../controllers/webhook.controller');

router.post('/number_event_url', [], WebhookController.number_event_url);
router.post('/number_event_dtmf_url', [], WebhookController.number_event_dtmf_url);
router.get('/number_anwser_url', [], WebhookController.number_anwser_url);

module.exports = router;
