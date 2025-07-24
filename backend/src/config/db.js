const mongoose = require('mongoose');

const connectDB = () => {
    return new Promise((resolve, reject) => {
        // Get the MongoDB URI from environment variables
        const mongoURI = process.env.MONGO_URI;

        if (!mongoURI) {
            console.error('MONGO_URI is not defined in .env file.');
            reject(new Error('MongoDB URI not found.'));
            return;
        }

        mongoose.connect(mongoURI, {
            // These options are recommended to avoid deprecation warnings
            // useNewUrlParser: true, // Deprecated in Mongoose 6+
            // useUnifiedTopology: true, // Deprecated in Mongoose 6+
        })
        .then(() => {
            console.log('Connected to MongoDB Atlas!');
            resolve(); // Resolve the promise once connection is successful
        })
        .catch(err => {
            console.error('Failed to connect to MongoDB Atlas:', err.message);
            reject(err);
        });
    });
};

// For Mongoose, you don't typically 'getDb' in the same way as SQLite.
// Instead, you import and use the Mongoose models directly (e.g., Comment, User).
// This getDb function is largely ceremonial and won't be used by controllers directly.
const getDb = () => {
    return mongoose.connection.readyState === 1 ? mongoose.connection.db : null;
};

module.exports = { connectDB, getDb };