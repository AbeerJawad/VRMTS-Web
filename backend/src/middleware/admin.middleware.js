const adminMiddleware = (req, res, next) => {
  if (req.session && req.session.user && req.session.user.userType === 'admin') {
    return next();
  }

  res.status(403).json({
    success: false,
    message: 'Access denied: Admin privileges required'
  });
};

module.exports = adminMiddleware;
