const ContactMessage = require('../models/ContactMessage'); // Import the ContactMessage model

exports.submitContactForm = async (req, res) => {
    const { name, email, subject, message } = req.body;

    // Basic server-side validation (important even with client-side validation)
    if (!name || !email || !subject || !message) {
        return res.status(400).json({ success: false, message: 'All fields are required.' });
    }

    try {
        const newContactMessage = await ContactMessage.create({
            name,
            email,
            subject,
            message
        });
        console.log('New contact message saved:', newContactMessage);
        res.status(201).json({ success: true, message: 'Your message has been sent successfully!' });
    } catch (error) {
        console.error('Error saving contact message:', error);
        // Mongoose validation error
        if (error.name === 'ValidationError') {
            return res.status(400).json({ success: false, message: error.message });
        }
        res.status(500).json({ success: false, message: 'Failed to send message. Please try again later.' });
    }
};