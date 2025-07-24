const mongoose = require('mongoose');
// REMOVE: const Payload = require('./Payload'); // This line is causing the error

const payloadSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true
    },
    type: {
        type: String, // e.g., 'html', 'xss', 'sql', 'other'
        required: true
    },
    value: {
        type: String, // The actual injection string
        required: true
    },
    description: {
        type: String,
        default: ''
    },
    is_safe: { // Optional: for future "secure payload" demonstration
        type: Boolean,
        default: false
    },
    timestamp: {
        type: Date,
        default: Date.now
    }
});

const Payload = mongoose.model('Payload', payloadSchema); // This is the correct declaration

module.exports = Payload; // And this is the correct export