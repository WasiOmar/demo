const express = require('express');
require('dotenv').config();
const connectDB = require('../connect');
const User = require('../models/User');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();

app.use(cors());
app.use(express.json());

// Signup Route
app.post('/api/auth/signup', async (req, res) => {
    try {
        const user = await User.create(req.body);
        res.status(201).json({ msg: 'User created successfully' });
    } catch (err) {
        res.status(500).json({ msg: err.message });
    }
});
app.get('/', (req, res) => {
    res.send('Server is working');
});

// Login Route
app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await User.findOne({ email });
        if (!user) return res.status(400).json({ msg: 'Invalid credentials' });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ msg: 'Invalid credentials' });

        const token = jwt.sign(
            { userId: user._id },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );

        res.status(200).json({ token, user: { name: user.name, email: user.email } });
    } catch (err) {
        res.status(500).json({ msg: err.message });
    }
});

// Example protected route
const authMiddleware = (req, res, next) => {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ msg: "No token, authorization denied" });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded.userId;
        next();
    } catch (err) {
        res.status(401).json({ msg: "Token is not valid" });
    }
};

app.get('/api/protected', authMiddleware, (req, res) => {
    res.json({ msg: 'This is a protected route', userId: req.user });
});

const start = async () => {
    try {
        await connectDB(process.env.MONGO_URI);
        app.listen(process.env.PORT, () => console.log('Server started ...'));
    } catch (err) {
        console.log(err);
    }
};
start();
