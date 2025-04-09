const express = require('express');
const session = require('express-session');
const MongoDBStore = require('connect-mongodb-session')(session);
const path = require('path');
const cors = require('cors');
const connectDB = require('./config/db');
require('dotenv').config();

// Create Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Connect to MongoDB
connectDB();

// MongoDB Connection for sessions
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/moodtracker';

// Session store setup
const store = new MongoDBStore({
  uri: MONGODB_URI,
  collection: 'sessions'
});

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use(express.static(path.join(__dirname, 'public')));

// Session middleware
app.use(session({
  secret: process.env.SESSION_SECRET || 'moodtracker-secret-key',
  resave: false,
  saveUninitialized: true,
  store: store,
  cookie: { 
    maxAge: 1000 * 60 * 60 * 24 * 7, // 1 week
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'lax'
  }
}));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/mood', require('./routes/mood'));
app.use('/api/todo', require('./routes/todo'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/resources', require('./routes/resources'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/chat', require('./routes/chat'));

// Serve HTML pages
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'login.html'));
});

// Add routes for all other HTML pages
app.get('/mood', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'mood.html'));
});

app.get('/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'dashboard.html'));
});

app.get('/todo', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'todo.html'));
});

app.get('/relax', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'relax.html'));
});

app.get('/pomodoro', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'pomodoro.html'));
});

app.get('/breathing', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'breathing.html'));
});

app.get('/chat', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'chat.html'));
});

app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'admin.html'));
});

// Create admin user on startup if it doesn't exist
const User = require('./models/User');
const createAdminUser = async () => {
  try {
    const adminExists = await User.findOne({ username: 'admin' });
    
    if (!adminExists) {
      const admin = new User({
        username: 'admin',
        name: 'المدير',
        password: 'admin',
        isAdmin: true
      });
      
      await admin.save();
      console.log('Admin user created');
    }
  } catch (err) {
    console.error('Error creating admin user:', err);
  }
};

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  createAdminUser();
}); 