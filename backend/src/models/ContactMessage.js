const mongoose = require('mongoose');

const contactMessageSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        // Basic email format validation (more robust validation should be done on the frontend too)
        match: [/.+@.+\..+/, 'Please fill a valid email address'] 
    },
    subject: {
        type: String,
        required: true
        // No default value needed for subject.
    },
    message: {
        type: String,
        required: true
    },
    timestamp: {
        type: Date,
        default: Date.now
    }
});

const ContactMessage = mongoose.model('ContactMessage', contactMessageSchema);

module.exports = ContactMessage;