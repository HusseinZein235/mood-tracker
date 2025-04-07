// Authentication middleware

// Check if user is authenticated
exports.isAuth = (req, res, next) => {
  if (req.session && req.session.user && req.session.user.id) {
    console.log('User authenticated:', req.session.user.username);
    return next();
  }
  console.log('Authentication failed, no valid session');
  res.status(401).json({ msg: 'غير مصرح به، يرجى تسجيل الدخول' });
};

// Check if user is admin
exports.isAdmin = (req, res, next) => {
  if (req.session && req.session.user && req.session.user.isAdmin) {
    console.log('Admin authenticated:', req.session.user.username);
    return next();
  }
  res.status(403).json({ msg: 'ليس لديك صلاحية للوصول' });
}; 