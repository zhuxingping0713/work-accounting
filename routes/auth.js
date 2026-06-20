const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const basePath = process.env.BASE_PATH || '';

const router = express.Router();

// GET /login
router.get('/login', (req, res) => {
  if (req.cookies?.token) {
    try { jwt.verify(req.cookies.token, process.env.JWT_SECRET); return res.redirect(basePath + '/'); } catch {}
  }
  res.render('login', { error: null, basePath, layout: false });
});

// POST /login
router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  const user = await User.findOne({ username });
  if (!user) return res.render('login', { error: '用户名不存在', basePath, layout: false });
  const valid = await user.comparePassword(password);
  if (!valid) return res.render('login', { error: '密码错误', basePath, layout: false });
  const token = jwt.sign({ userId: user._id, username: user.username, displayName: user.displayName, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });
  res.cookie('token', token, { httpOnly: true, maxAge: 7 * 24 * 60 * 60 * 1000 });
  res.redirect(basePath + '/');
});

// GET /logout
router.get('/logout', (req, res) => {
  res.clearCookie('token');
  res.redirect(basePath + '/login');
});

// Auth check middleware for API routes
const apiAuth = (req, res, next) => {
  const token = req.cookies?.token || req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ ok: false, msg: '未登录' });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.userId;
    req.user = decoded;
    next();
  } catch (e) {
    return res.status(401).json({ ok: false, msg: '登录已过期' });
  }
};

// POST /api/auth/change-name
router.post('/api/auth/change-name', apiAuth, async (req, res) => {
  const { displayName } = req.body;
  if (!displayName || !displayName.trim()) return res.json({ ok: false, msg: '昵称不能为空' });
  await User.findByIdAndUpdate(req.userId, { displayName: displayName.trim() });
  // 重新签发 token 让导航栏立即显示新昵称
  const token = jwt.sign({ userId: req.userId, username: req.user.username, displayName: displayName.trim(), role: req.user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });
  res.cookie('token', token, { httpOnly: true, maxAge: 7 * 24 * 60 * 60 * 1000 });
  res.json({ ok: true });
});

// POST /api/auth/change-username
router.post('/api/auth/change-username', apiAuth, async (req, res) => {
  const { username, password } = req.body;
  if (!username || !username.trim()) return res.json({ ok: false, msg: '用户名不能为空' });
  const user = await User.findById(req.userId);
  if (!user) return res.json({ ok: false, msg: '用户不存在' });
  const valid = await user.comparePassword(password);
  if (!valid) return res.json({ ok: false, msg: '密码错误' });
  const exists = await User.findOne({ username: username.trim() });
  if (exists) return res.json({ ok: false, msg: '用户名已被占用' });
  user.username = username.trim();
  await user.save();
  // 重新签发 token
  const token = jwt.sign({ userId: user._id, username: user.username, displayName: user.displayName, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });
  res.cookie('token', token, { httpOnly: true, maxAge: 7 * 24 * 60 * 60 * 1000 });
  res.json({ ok: true, username: user.username });
});

// POST /api/auth/change-pwd
router.post('/api/auth/change-pwd', apiAuth, async (req, res) => {
  const { oldPwd, newPwd } = req.body;
  const user = await User.findById(req.userId);
  if (!user) return res.status(404).json({ ok: false, msg: '用户不存在' });
  const valid = await user.comparePassword(oldPwd);
  if (!valid) return res.json({ ok: false, msg: '原密码错误' });
  user.password = newPwd;
  await user.save();
  res.json({ ok: true });
});

// POST /api/auth/register (admin only)
router.post('/api/auth/register', apiAuth, async (req, res) => {
  const user = await User.findById(req.userId);
  if (!user || user.role !== 'admin') return res.status(403).json({ ok: false, msg: '无权限' });
  const { username, password, displayName } = req.body;
  const exists = await User.findOne({ username });
  if (exists) return res.json({ ok: false, msg: '用户名已存在' });
  await User.create({ username, password, displayName });
  res.json({ ok: true });
});

module.exports = router;
