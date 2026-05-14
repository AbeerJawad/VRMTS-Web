const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const session = require('express-session');
const sessionConfig = require('./config/session');
const authRoutes = require('./routes/auth.routes');

const app = express();
const isProduction = process.env.NODE_ENV === 'production';
const corsOrigins = (process.env.CORS_ORIGIN || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);
const defaultDevOrigins = ['http://localhost:5173', 'http://localhost:3000'];
const allowedOrigins = isProduction ? corsOrigins : [...new Set([...corsOrigins, ...defaultDevOrigins])];

// Trust proxy required for secure cookies behind Railway/Vercel
app.set('trust proxy', 1);

// Middleware - ORDER MATTERS!

// 1. CORS - MUST be first and configured for credentials
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
      return;
    }
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true
}));

// 2. Body parsers
app.use(helmet());
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

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

if (!isProduction) {
  app.get('/api/dashboard/test', (req, res) => {
    res.json({ message: 'Dashboard routes are working!' });
  });

  app.get('/api/test', (req, res) => {
    res.json({ message: 'API is working!' });
  });
}

module.exports = app;
