require('dotenv').config();

const express = require('express');
const cors = require('cors');
const apiRoutes = require('./routes/api'); // Assuming this handles other API routes
const { connectDB } = require('./config/db');
const User = require('./models/user');
const Payload = require('./models/Payload'); // Import Payload model

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json()); // For parsing application/json
app.use(express.urlencoded({ extended: true })); // For parsing application/x-www-form-urlencoded

// Serve static files from the 'public' directory, assuming it's correctly relative
// If your frontend HTML/CSS/JS are in a 'public' folder *outside* the backend directory,
// you might need to adjust this path, e.g., app.use(express.static(path.join(__dirname, '..', 'public')));
// Make sure to import 'path' if using path.join
app.use(express.static('public'));

// --- New/Updated Injection Playground Endpoints ---
// These are the specific endpoints your try-injection-script.js will interact with

// Vulnerable comment submission endpoint (for HTML/XSS)
app.post('/api/submit-comment-vulnerable', (req, res) => {
    const comment = req.body.comment;
    // In a real vulnerable app, this comment would be directly rendered.
    // For demonstration, we'll simulate success if it contains common script/HTML tags.
    const isVulnerable = comment.includes('<script>') || comment.includes('<h1>') || comment.includes('<img');
    if (isVulnerable) {
        res.json({ success: true, message: `Your comment was received and appears vulnerable: ${comment}` });
    } else {
        res.json({ success: false, message: `Your comment was received, but the payload did not trigger a visible vulnerability: ${comment}` });
    }
});

// Vulnerable user search endpoint (for SQLi conceptual / NoSQLi)
app.get('/api/search-user-vulnerable', async (req, res) => {
    const username = req.query.username;
    let isSqlInjected = false;
    let message = `Searching for user: ${username}`;
    let usersFound = [];

    // Simulate SQLi/NoSQLi success logic based on common patterns
    if (username.includes("' OR 1=1") || username.includes("--") || username.includes("admin'")) {
        isSqlInjected = true;
        message = `SQL/NoSQL Injection payload detected. Attempting to bypass authentication or retrieve all records.`;
        // In a real scenario, this would involve a vulnerable database query
        // For MongoDB, a common NoSQL injection for 'admin' would be finding documents
        // where 'username' is 'admin' OR 'password' is not 'undefined' (e.g., using $ne operator)
        // Or if the query directly takes the input as regex:
        try {
            usersFound = await User.find({}); // Simulate fetching all users on successful injection
            message += ` Found ${usersFound.length} users.`;
        } catch (error) {
            console.error("Error simulating NoSQLi fetch:", error);
            message += ` Error during simulated NoSQLi: ${error.message}`;
            isSqlInjected = false; // Even if payload hit, if simulation failed, mark as not successful
        }

    } else if (username.includes('{"$regex": ".*"}') || username.includes('{"$gt": ""}')) {
         isSqlInjected = true;
         message = `NoSQL Injection payload detected. Attempting to bypass authentication or retrieve all records.`;
         try {
            usersFound = await User.find({}); // Simulate fetching all users on successful injection
            message += ` Found ${usersFound.length} users.`;
        } catch (error) {
            console.error("Error simulating NoSQLi fetch:", error);
            message += ` Error during simulated NoSQLi: ${error.message}`;
            isSqlInjected = false;
        }
    }

    if (isSqlInjected) {
        res.json({ success: true, message: message, users: usersFound });
    } else {
        res.json({ success: false, message: message });
    }
});

// Generic payload test endpoint
app.post('/api/generic-payload-test', (req, res) => {
    const payload = req.body.payload;
    const type = req.body.type;
    // Simulate some logic to determine if 'other' payload worked
    if (payload && payload.length > 20 && type === 'other') {
        res.json({ success: true, message: `Generic payload processed and appears effective: ${payload}` });
    } else {
        res.json({ success: false, message: `Generic payload processed, but no clear impact observed: ${payload}` });
    }
});

// Endpoint to save payloads to MongoDB
app.post('/api/save-payload', async (req, res) => {
    const { type, payload, name, description } = req.body; // Added name and description for Payload model
    if (type && payload) {
        try {
            const newPayload = new Payload({
                name: name || `Custom ${type} Payload`, // Use provided name or generate one
                type: type,
                value: payload, // 'value' field for the actual payload string
                description: description || 'User-saved payload'
            });
            await newPayload.save();
            res.json({ success: true, message: 'Payload saved successfully to database.' });
        } catch (error) {
            console.error("Error saving payload to database:", error);
            res.status(500).json({ success: false, message: `Failed to save payload to database: ${error.message}` });
        }
    } else {
        res.status(400).json({ success: false, message: 'Type and payload are required.' });
    }
});

// Endpoint to get saved payloads from MongoDB
app.get('/api/get-payloads', async (req, res) => {
    try {
        const payloads = await Payload.find({}); // Fetch all payloads from the database
        res.json({ success: true, payloads: payloads });
    } catch (error) {
        console.error("Error fetching payloads from database:", error);
        res.status(500).json({ success: false, message: `Failed to retrieve payloads: ${error.message}` });
    }
});
// --- End New/Updated Injection Playground Endpoints ---


// Existing API routes (e.g., /api/users, /api/login, etc.)
// Make sure this line is *after* your specific injection playground routes
// if those specific routes are also prefixed with /api, to ensure they are handled first.
app.use('/api', apiRoutes);

app.get('/', (req, res) => {
    res.send('Project Injection Backend server is running! Access API at /api');
});

// Connect to database first, then start the Express server
connectDB()
    .then(async () => {
        console.log('Database connection successful. Starting server...');
        await populateDefaultMongoUsers();
        await populateDefaultPayloads(); // Populate default payloads
        app.listen(PORT, () => {
            console.log(`Project Injection Backend server running on http://localhost:${PORT}`);
            console.log('Open frontend/index.html in your browser to interact with the frontend.');
        });
    })
    .catch(err => {
        console.error("Failed to connect to database, server not started:", err);
        process.exit(1);
    });

// Function to populate default users for MongoDB (if collection is empty)
async function populateDefaultMongoUsers() {
    const defaultUsers = [
        { username: 'admin', password: 'secure_admin_pass' },
        { username: 'user1', password: 'password123' },
        { username: 'testuser', password: 'testpass' }
    ];

    try {
        const count = await User.countDocuments();
        if (count === 0) {
            console.log("No users found in MongoDB, populating default users...");
            await User.insertMany(defaultUsers);
            console.log('Default MongoDB users population complete.');
        } else {
            console.log(`MongoDB Users collection already contains ${count} users.`);
        }
    } catch (err) {
        console.error("Error populating default MongoDB users:", err.message);
    }
}

// Function to populate default payloads for MongoDB (if collection is empty)
async function populateDefaultPayloads() {
    const defaultPayloads = [
        // --- HTML Injection Payloads ---
        { name: 'HTML - Bold Text', type: 'html', value: '<b>Bold Text Injected</b>', description: 'Injects bold text.' },
        { name: 'HTML - Italic Text', type: 'html', value: '<i>Italic Text Injected</i>', description: 'Injects italic text.' },
        { name: 'HTML - Underlined Text', type: 'html', value: '<u>Underlined Injected</u>', description: 'Injects underlined text.' },
        { name: 'HTML - Big Header', type: 'html', value: '<h1>Big Header</h1>', description: 'Injects a large header.' },
        { name: 'HTML - Scrolling Text', type: 'html', value: '<marquee>Scrolling Text</marquee>', description: 'Injects scrolling text (marquee tag is often deprecated but shows injection).' },
        { name: 'HTML - Image Error Trigger', type: 'html', value: '<img src="x" onerror="alert(\'HTML Injected!\')">', description: 'Injects an image that triggers an alert on error (can also be XSS).' },
        { name: 'HTML - Clickable Link', type: 'html', value: '<a href="https://example.com">Click me</a>', description: 'Injects a clickable link.' },
        { name: 'HTML - Injected Input', type: 'html', value: '<input type="text" value="Injected Input">', description: 'Injects a text input field.' },
        { name: 'HTML - Blue Div', type: 'html', value: '<div style="color:blue;">Blue Div</div>', description: 'Injects a div with inline styling.' },
        { name: 'HTML - Injected Table', type: 'html', value: '<table><tr><td>Injected Table</td></tr></table>', description: 'Injects a basic HTML table.' },
        { name: 'HTML - Clickable Paragraph', type: 'html', value: '<p onclick="alert(\'Clicked!\')">Click me!</p>', description: 'Injects a paragraph with an inline JavaScript event.' },

        // --- XSS Payloads ---
        { name: 'XSS - Basic Alert', type: 'xss', value: '<script>alert(\'XSS\')</script>', description: 'Basic XSS with an alert box.' },
        { name: 'XSS - Double Quote Context', type: 'xss', value: '"><script>alert(\'XSS\')</script>', description: 'Breaks out of a double-quoted attribute and injects script.' },
        { name: 'XSS - Image OnError', type: 'xss', value: '<img src=x onerror=alert(\'XSS\')>', description: 'XSS via image loading error event.' },
        { name: 'XSS - SVG OnLoad', type: 'xss', value: '<svg onload=alert(\'XSS\')>', description: 'XSS via SVG onload event.' },
        { name: 'XSS - Body OnLoad', type: 'xss', value: '<body onload=alert(\'XSS\')>', description: 'XSS via body onload event (requires specific context).' },
        { name: 'XSS - Iframe JS URL', type: 'xss', value: '<iframe src="javascript:alert(\'XSS\')">', description: 'XSS via iframe with JavaScript URL.' },
        { name: 'XSS - Image OnError Confirm', type: 'xss', value: '"><img src=x onerror=confirm(1)>', description: 'Breaks out of quote, injects image onerror with confirm.' },
        { name: 'XSS - Video OnError', type: 'xss', value: '<video><source onerror="javascript:alert(\'XSS\')">', description: 'XSS via video source error event.' },
        { name: 'XSS - Details Ontoggle', type: 'xss', value: '<details open ontoggle=alert(\'XSS\')>', description: 'XSS via HTML5 details tag with ontoggle event.' },
        { name: 'XSS - MathML Annotation', type: 'xss', value: '<math><mtext></mtext><annotation encoding="application/x-tex">alert(\'XSS\')</annotation></math>', description: 'XSS using MathML annotation (advanced).' },
        { name: 'XSS - Anchor JS URL', type: 'xss', value: '<a href="javascript:alert(\'XSS\')">Click me</a>', description: 'XSS via anchor tag with JavaScript URL.' },

        // --- SQL/NoSQL Injection Payloads (Mapped to 'sql' type for frontend) ---
        { name: 'NoSQLi/SQL - OR 1=1 (SQL)', type: 'sql', value: "' OR '1'='1", description: 'Classic SQLi: always true condition. (Conceptual for NoSQL)' },
        { name: 'NoSQLi/SQL - OR 1=1 (Comment)', type: 'sql', value: "' OR 1=1 --", description: 'Classic SQLi: always true with comment. (Conceptual for NoSQL)' },
        { name: 'NoSQLi/SQL - OR a=a (SQL)', type: 'sql', value: "' OR 'a'='a", description: 'Classic SQLi: always true condition. (Conceptual for NoSQL)' },
        { name: 'NoSQLi/SQL - Admin Comment (SQL)', type: 'sql', value: "admin' --", description: 'SQLi: Admin username with comment to bypass password. (Conceptual for NoSQL)' },
        { name: 'NoSQLi/SQL - Admin Hash (SQL)', type: 'sql', value: "admin' #", description: 'SQLi: Admin username with hash to comment out. (Conceptual for NoSQL)' },
        { name: 'NoSQLi/SQL - Admin Multi-line (SQL)', type: 'sql', value: "admin'/*", description: 'SQLi: Admin username with multi-line comment. (Conceptual for NoSQL)' },
        { name: 'NoSQLi/SQL - Union Select Version (SQL)', type: 'sql', value: "' UNION SELECT null, version() --", description: 'SQLi: Union query to get DB version. (Conceptual for NoSQL)' },
        { name: 'NoSQLi/SQL - Union Select Data (SQL)', type: 'sql', value: "' AND 1=0 UNION SELECT 'HACKED', null --", description: 'SQLi: Union query to inject data. (Conceptual for NoSQL)' },
        { name: 'NoSQLi/SQL - Order By (SQL)', type: 'sql', value: "1' ORDER BY 1--", description: 'SQLi: Order By query to find column count. (Conceptual for NoSQL)' },
        { name: 'NoSQLi/SQL - Limit/Offset (SQL)', type: 'sql', value: "' OR 1=1 LIMIT 1 OFFSET 1 --", description: 'SQLi: Limit/offset to fetch specific rows. (Conceptual for NoSQL)' },
        { name: 'NoSQLi/SQL - Sleep (SQL)', type: 'sql', value: "' OR sleep(5) --", description: 'SQLi: Time-based blind injection. (Conceptual for NoSQL)' },
        { name: 'NoSQLi - Regex All', type: 'sql', value: '{"$regex": ".*"}', description: 'NoSQLi: Regex to match all users, bypassing specific checks.' },
        { name: 'NoSQLi - Type Confusion (Empty String)', type: 'sql', value: '{"$gt": ""}', description: 'NoSQLi: Object injection to retrieve all records using comparison operator.' }
    ];

    try {
        const count = await Payload.countDocuments();
        if (count === 0) {
            console.log("No payloads found in MongoDB, populating default payloads...");
            await Payload.insertMany(defaultPayloads);
            console.log('Default MongoDB payloads population complete.');
        } else {
            console.log(`MongoDB Payloads collection already contains ${count} payloads.`);
        }
    } catch (err) {
        console.error("Error populating default MongoDB payloads:", err.message);
    }
}