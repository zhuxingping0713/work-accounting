const jwt = require('jsonwebtoken');

module.exports = function(req, res, next) {
  const token = req.cookies?.token || req.headers.authorization?.split(' ')[1];
  if (!token) return res.redirect('/login');
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.userId;
    req.user = decoded;
    next();
  } catch (e) {
    res.clearCookie('token');
    return res.redirect('/login');
  }
};
