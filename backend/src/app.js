const express = require('express');
const cors = require('cors');
const session = require('express-session');
const sessionConfig = require('./config/session');
const authRoutes = require('./routes/auth.routes');

const app = express();

// Middleware - ORDER MATTERS!

// 1. CORS - MUST be first and configured for credentials
app.use(cors({
  origin: [process.env.CORS_ORIGIN, 'http://localhost:5173', 'http://localhost:3000'],
  credentials: true
}));

// 2. Body parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 3. Session middleware - MUST be after body parsers
app.use(session(sessionConfig));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/modules', require('./routes/modules.routes'));

// Dashboard routes
const dashboardRoutes = require('./routes/dashboard.routes');
app.use('/api/dashboard', dashboardRoutes);
console.log('✓ Dashboard routes registered at /api/dashboard');

app.use('/api/instructor', require('./routes/instructorDashboard.routes'));
app.use('/api/user', require('./routes/user.routes'));
app.use('/api/quiz', require('./routes/quiz.routes'));
app.use('/api/explore', require('./routes/moduleExploration.routes'));
app.use('/api/admin', require('./routes/admin.routes'));
app.use('/api/analytics', require('./routes/analytics.routes'));
app.use('/api/faculty/quiz', require('./routes/facultyQuiz.routes'));

// Debug: Test dashboard route
app.get('/api/dashboard/test', (req, res) => {
  res.json({ message: 'Dashboard routes are working!' });
});

// Test route
app.get('/api/test', (req, res) => {
  res.json({ message: 'API is working!' });
});

module.exports = app;
