const express = require('express');
const Category = require('../models/Category');
const basePath = process.env.BASE_PATH || '';
const router = express.Router();

router.get('/', async (req, res) => {
  const cats = await Category.find({ userId: req.userId }).lean();
  const income = cats.filter(c=>c.type==='income');
  const expense = cats.filter(c=>c.type==='expense');
  const utility = cats.filter(c=>c.type==='utility');
  res.render('categories', { income, expense, utility, basePath, user: req.user });
});

router.post('/', async (req, res) => {
  await Category.create({ userId: req.userId, ...req.body });
  res.redirect(basePath + '/categories');
});

router.put('/:id', async (req, res) => {
  await Category.findOneAndUpdate({ _id: req.params.id, userId: req.userId }, req.body);
  res.json({ ok: true });
});

router.delete('/:id', async (req, res) => {
  await Category.findOneAndDelete({ _id: req.params.id, userId: req.userId });
  res.json({ ok: true });
});

module.exports = router;
