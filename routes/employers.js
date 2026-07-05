const express = require('express');
const Employer = require('../models/Employer');
const Job = require('../models/Job');
const Salary = require('../models/Salary');
const Advance = require('../models/Advance');
const basePath = process.env.BASE_PATH || '';
const router = express.Router();

router.get('/', async (req, res) => {
  const employers = await Employer.find({ userId: req.userId }).lean();
  for (let e of employers) {
    // 累计收入：jobs 表中关联该雇主的收入
    const jobs = await Job.find({ userId: req.userId, employerId: e._id, type: 'income' });
    e.totalIncome = jobs.reduce((s,j)=>s+j.amount, 0);

    // 预支：advance 表中关联该雇主的预支
    const advances = await Advance.find({ userId: req.userId, employerId: e._id });
    e.totalAdvance = advances.reduce((s,a)=>s+a.amount, 0);

    // 应发工资：salary 表中关联该雇主的工资总额
    const salaries = await Salary.find({ userId: req.userId, employerId: e._id });
    e.totalSalary = salaries.reduce((s,r)=>s+r.amount, 0);

    // 实发工资 = 应发工资 - 预支
    e.netSalary = e.totalSalary - e.totalAdvance;

    // 最近打工
    const last = jobs.sort((a,b)=>b.date.localeCompare(a.date))[0];
    e.lastJob = last ? last.date : '-';
  }
  res.render('employers', { employers, basePath, user: req.user });
});

router.post('/', async (req, res) => {
  await Employer.create({ userId: req.userId, ...req.body });
  res.redirect(basePath + '/employers');
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
