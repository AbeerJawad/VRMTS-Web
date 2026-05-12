const db = require('../config/db');

// Login
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ 
        message: 'Email and password are required' 
      });
    }

    const connection = await db();
    
    const [users] = await connection.execute(
      'SELECT * FROM User WHERE email = ?',
      [email]
    );

    if (users.length === 0) {
      await connection.end();
      return res.status(401).json({ 
        message: 'Wrong email or password' 
      });
    }

    const user = users[0];

    if (!user.isActive) {
      await connection.end();
      return res.status(403).json({ 
        message: 'Account is not active' 
      });
    }

    if (password !== user.passwordHash) {
      await connection.end();
      return res.status(401).json({ 
        message: 'Wrong email or password' 
      });
    }

    // Update last login time
    await connection.execute(
      'UPDATE User SET lastLogin = NOW() WHERE userId = ?',
      [user.userId]
    );

    // CREATE SESSION DATA
    req.session.user = {
      userId: user.userId,
      email: user.email,
      name: user.name,
      userType: user.userType
    };

    // ADD ROLE-SPECIFIC ID
    if (user.userType === 'teacher') {
      const [teachers] = await connection.execute(
        'SELECT teacherId FROM Teacher WHERE userId = ?',
        [user.userId]
      );
      if (teachers.length > 0) {
        req.session.user.teacherId = teachers[0].teacherId;
      }
    } else if (user.userType === 'student') {
      const [students] = await connection.execute(
        'SELECT studentId FROM Student WHERE userId = ?',
        [user.userId]
      );
      if (students.length > 0) {
        req.session.user.studentId = students[0].studentId;
      }
    }

    await connection.end();

    // CRITICAL: Save session before sending response
    req.session.save((err) => {
      if (err) {
        console.error('Session save error:', err);
        return res.status(500).json({
          message: 'Session creation failed',
          error: err.message
        });
      }

      console.log('Session created:', req.session.user); // Debug log

      // Send response AFTER session is saved
      res.json({
        message: 'Login successful',
        user: req.session.user
      });
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      message: 'Login failed',
      error: error.message 
    });
  }
};

// Logout
const logout = async (req, res) => {
  try {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ 
          message: 'Logout failed',
          error: err.message 
        });
      }
      
      res.clearCookie('session_cookie');
      res.json({ 
        message: 'Logout successful'
      });
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ 
      message: 'Logout failed',
      error: error.message 
    });
  }
};

// Check authentication
const checkAuth = async (req, res) => {
  console.log('Checking auth, session:', req.session); // Debug log

  if (req.session && req.session.user) {
    res.json({
      isAuthenticated: true,
      user: req.session.user
    });
  } else {
    res.status(401).json({
      isAuthenticated: false,
      message: 'Not authenticated'
    });
  }
};

module.exports = { login, logout, checkAuth };