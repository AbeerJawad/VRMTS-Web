const session = require('express-session');
const MySQLStore = require('express-mysql-session')(session);
require('dotenv').config();

// Build connection options - try URL first, then individual vars
let options = {};

if (process.env.MYSQL_URL || process.env.DATABASE_URL) {
  const rawUrl = process.env.MYSQL_URL || process.env.DATABASE_URL;
  const url = new URL(rawUrl);
  options = {
    host:     url.hostname,
    port:     Number(url.port) || 3306,
    user:     url.username,
    password: url.password,
    database: url.pathname.slice(1),
  };
} else {
  options = {
    host:     process.env.MYSQLHOST     || process.env.DB_HOST,
    port:     Number(process.env.MYSQLPORT || process.env.DB_PORT || 3306),
    user:     process.env.MYSQLUSER     || process.env.DB_USER,
    password: process.env.MYSQLPASSWORD || process.env.DB_PASS,
    database: process.env.MYSQLDATABASE || process.env.DB_NAME,
  };
}

// ✅ Log resolved config so you can verify in Railway logs (no password)
console.log('Session DB config:', {
  host:     options.host,
  port:     options.port,
  user:     options.user,
  database: options.database,
  hasPassword: !!options.password,
});

if (!options.host || !options.user || !options.database) {
  throw new Error(
    'MySQL session store: missing required env vars. ' +
    'Set MYSQL_URL or MYSQLHOST/MYSQLUSER/MYSQLPASSWORD/MYSQLDATABASE in Railway.'
  );
}

Object.assign(options, {
  clearExpired:            true,
  checkExpirationInterval: 900000,   // 15 min
  expiration:              86400000, // 24 hrs
  createDatabaseTable:     true,
  schema: {
    tableName:   'sessions',
    columnNames: { session_id: 'session_id', expires: 'expires', data: 'data' },
  },
});

const sessionStore = new MySQLStore(options);

sessionStore.onReady().then(() => {
  console.log('✅ MySQL session store connected');
}).catch((err) => {
  console.error('❌ MySQL session store failed to connect:', err.message);
});

const isProduction = process.env.NODE_ENV === 'production';

if (!process.env.SESSION_SECRET) {
  throw new Error('SESSION_SECRET must be set');
}

module.exports = {
  key:              'session_cookie',
  secret:           process.env.SESSION_SECRET,
  store:            sessionStore,
  resave:           false,
  saveUninitialized: false,
  cookie: {
    maxAge:   1000 * 60 * 60 * 24,
    httpOnly: true,
    secure:   isProduction,
    sameSite: isProduction ? 'none' : 'lax',
  },
};