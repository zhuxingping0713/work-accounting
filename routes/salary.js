const express = require('express');
const Salary = require('../models/Salary');
const Advance = require('../models/Advance');
const Employer = require('../models/Employer');
const basePath = process.env.BASE_PATH || '';
const router = express.Router();

router.get('/', async (req, res) => {
  const { month } = req.query;
  const now = new Date();
  const currentMonth = month || `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`;

  const salaries = await Salary.find({ userId: req.userId, date: { $regex: '^' + currentMonth } })
    .sort({ date: -1 }).populate('employerId', 'name').lean();
  const advances = await Advance.find({ userId: req.userId, date: { $regex: '^' + currentMonth } })
    .sort({ date: -1 }).populate('employerId', 'name').lean();
  const employers = await Employer.find({ userId: req.userId }).lean();

  const workDays = salaries.length;
  const totalSalary = salaries.reduce((s,r)=>s+r.amount, 0);
  const totalAdvance = advances.reduce((s,r)=>s+r.amount, 0);
  const netPay = totalSalary - totalAdvance;

  const months1 = await Salary.distinct('date', { userId: req.userId });
  const months2 = await Advance.distinct('date', { userId: req.userId });
  const months = [...new Set([...months1, ...months2].map(d => d.substring(0,7)))].sort((a,b)=>b.localeCompare(a));

  res.render('salary', { salaries, advances, employers, currentMonth, months, workDays, totalSalary, totalAdvance, netPay, basePath, user: req.user });
});

router.post('/checkin', async (req, res) => {
  const { date, hours, dailyWage, advance, employerId, remark } = req.body;
  const wage = +dailyWage || 240;
  const h = +hours || 1;
  await Salary.findOneAndUpdate(
    { userId: req.userId, date },
    { hours: h, dailyWage: wage, amount: h * wage, advance: +advance || 0, employerId: employerId || null, remark },
    { upsert: true, new: true }
  );
  res.redirect(basePath + '/salary?month=' + date.substring(0,7));
});

router.post('/advance', async (req, res) => {
  const { date, amount, employerId, remark } = req.body;
  await Advance.create({ userId: req.userId, date, amount: +amount, employerId: employerId || null, remark });
  res.redirect(basePath + '/salary?month=' + date.substring(0,7));
});

router.delete('/:id', async (req, res) => {
  await Salary.findOneAndDelete({ _id: req.params.id, userId: req.userId });
  res.json({ ok: true });
});

router.delete('/advance/:id', async (req, res) => {
  await Advance.findOneAndDelete({ _id: req.params.id, userId: req.userId });
  res.json({ ok: true });
});

module.exports = router;
