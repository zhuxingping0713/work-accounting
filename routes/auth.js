const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const router = express.Router();

// GET /login
router.get('/login', (req, res) => {
  if (req.cookies?.token) {
    try { jwt.verify(req.cookies.token, process.env.JWT_SECRET); return res.redirect('/'); } catch {}
  }
  res.render('login', { error: null });
});

// POST /login
router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  const user = await User.findOne({ username });
  if (!user) return res.render('login', { error: '用户名不存在' });
  const valid = await user.comparePassword(password);
  if (!valid) return res.render('login', { error: '密码错误' });
  const token = jwt.sign({ userId: user._id, username: user.username, displayName: user.displayName, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });
  res.cookie('token', token, { httpOnly: true, maxAge: 7 * 24 * 60 * 60 * 1000 });
  res.redirect('/');
});

// GET /logout
router.get('/logout', (req, res) => {
  res.clearCookie('token');
  res.redirect('/login');
});

// POST /api/auth/change-pwd
router.post('/api/auth/change-pwd', async (req, res) => {
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
router.post('/api/auth/register', async (req, res) => {
  const user = await User.findById(req.userId);
  if (!user || user.role !== 'admin') return res.status(403).json({ ok: false, msg: '无权限' });
  const { username, password, displayName } = req.body;
  const exists = await User.findOne({ username });
  if (exists) return res.json({ ok: false, msg: '用户名已存在' });
  await User.create({ username, password, displayName });
  res.json({ ok: true });
});

module.exports = router;
