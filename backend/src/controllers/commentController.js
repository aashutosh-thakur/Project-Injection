const Comment = require('../models/Comment'); // Import Mongoose Comment model
const User = require('../models/user');     // Import Mongoose User model
const Payload = require('../models/Payload'); // Import Payload model

// Intentionally vulnerable function for HTML/XSS Injection (using Mongoose)
exports.submitVulnerableComment = async (req, res) => {
    const commentText = req.body.comment; // The payload from the frontend
    console.log('Received vulnerable comment (for storage):', commentText);

    try {
        const newComment = await Comment.create({ text: commentText });
        console.log(`Comment stored with ID: ${newComment._id}`);
        res.json({ message: `Your comment (Vulnerable, stored with ID ${newComment._id}): ${commentText}` });
    } catch (err) {
        console.error("Error storing vulnerable comment:", err.message);
        return res.status(500).json({ message: 'Failed to store comment.' });
    }
};

// Vulnerable function for NoSQL Injection (using Mongoose)
exports.searchVulnerableUser = async (req, res) => {
    const usernameQuery = req.query.username; // The payload from the frontend
    console.log('Received username for NoSQL Injection demo:', usernameQuery);

    let queryCondition;
    try {
        queryCondition = JSON.parse(usernameQuery);
    } catch (e) {
        queryCondition = { username: { $regex: usernameQuery, $options: 'i' } };
    }

    console.log('Executing vulnerable NoSQL query condition:', queryCondition);

    try {
        const users = await User.find(queryCondition);

        if (users.length > 0) {
            const usersFound = users.map(user => `${user.username} (ID: ${user._id}, Pass: ${user.password})`).join(', ');
            res.json({ message: `Users found: ${usersFound}` });
        } else {
            res.json({ message: `No users found for query: '${usernameQuery}'` });
        }
    } catch (err) {
        console.error("Error executing vulnerable NoSQL query:", err.message);
        return res.status(500).json({ message: `NoSQL Query Error: ${err.message}` });
    }
};

// Handle generic payloads (for the 'other' option in the frontend)
exports.handleGenericPayload = (req, res) => {
    const { payload } = req.body;
    console.log('Received generic payload:', payload);
    res.json({ message: `Generic payload received: ${payload}` });
};

// Function to get a random payload by type from the database
exports.getPayloadByType = async (req, res) => {
    const { type } = req.query;

    if (!type) {
        return res.status(400).json({ message: 'Payload type is required.' });
    }

    try {
        const payloads = await Payload.aggregate([
            { $match: { type: type } },
            { $sample: { size: 1 } }
        ]);

        if (payloads.length > 0) {
            res.json({ payload: payloads[0].value, name: payloads[0].name, description: payloads[0].description });
        } else {
            return res.status(404).json({ message: `No payloads found for type: ${type}.` });
        }
    } catch (err) {
        console.error(`Error fetching payload for type ${type}:`, err.message);
        res.status(500).json({ message: 'Error retrieving payload from database.' });
    }
};