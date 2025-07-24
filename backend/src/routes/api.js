const express = require('express');
const router = express.Router();
const commentController = require('../controllers/commentController');
const contactController = require('../controllers/contactController'); // This import is correct if files are separate

router.post('/submit-comment-vulnerable', commentController.submitVulnerableComment);
router.get('/search-user-vulnerable', commentController.searchVulnerableUser);
router.post('/generic-payload-test', commentController.handleGenericPayload);

router.post('/contact', contactController.submitContactForm); // This route is correct

router.get('/payloads', commentController.getPayloadByType);

module.exports = router;