const express = require('express');
const Employer = require('../models/Employer');
const Job = require('../models/Job');
const router = express.Router();

router.get('/', async (req, res) => {
  const employers = await Employer.find({ userId: req.userId }).lean();
  // calc total income per employer
  for (let e of employers) {
    const jobs = await Job.find({ userId: req.userId, employerId: e._id, type: 'income' });
    e.totalIncome = jobs.reduce((s,j)=>s+j.amount, 0);
    const last = jobs.sort((a,b)=>b.date.localeCompare(a.date))[0];
    e.lastJob = last ? last.date : '-';
  }
  res.render('employers', { employers, user: req.user });
});

router.post('/', async (req, res) => {
  await Employer.create({ userId: req.userId, ...req.body });
  res.redirect('/employers');
});

router.put('/:id', async (req, res) => {
  await Employer.findOneAndUpdate({ _id: req.params.id, userId: req.userId }, req.body);
  res.json({ ok: true });
});

router.delete('/:id', async (req, res) => {
  await Employer.findOneAndDelete({ _id: req.params.id, userId: req.userId });
  res.json({ ok: true });
});

module.exports = router;
