const express = require('express');
const Job = require('../models/Job');
const Bill = require('../models/Bill');
const Salary = require('../models/Salary');
const Advance = require('../models/Advance');
const router = express.Router();

router.get('/overview', async (req, res) => {
  const { month } = req.query;
  const now = new Date();
  const ym = month || `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`;

  const jobs = await Job.find({ userId: req.userId, date: { $regex: '^' + ym } });
  const income = jobs.filter(j=>j.type==='income').reduce((s,j)=>s+j.amount, 0);
  const expense = jobs.filter(j=>j.type==='expense').reduce((s,j)=>s+j.amount, 0);
  const bills = await Bill.find({ userId: req.userId, month: ym });
  const billTotal = bills.reduce((s,b)=>s+b.amount, 0);
  const salaries = await Salary.find({ userId: req.userId, date: { $regex: '^' + ym } });
  const advanceTotal = await Advance.aggregate([
    { $match: { userId: require('mongoose').Types.ObjectId(req.userId), date: { $regex: '^' + ym } } },
    { $group: { _id: null, total: { $sum: '$amount' } } }
  ]);
  const salaryTotal = salaries.reduce((s,r)=>s+r.amount, 0);
  const advTotal = advanceTotal[0]?.total || 0;
  const netSalary = salaryTotal - advTotal;

  // income by category
  const incomeByCat = await Job.aggregate([
    { $match: { userId: require('mongoose').Types.ObjectId(req.userId), type: 'income', date: { $regex: '^' + ym } } },
    { $group: { _id: '$categoryId', total: { $sum: '$amount' } } },
    { $lookup: { from: 'categories', localField: '_id', foreignField: '_id', as: 'cat' } },
    { $unwind: { path: '$cat', preserveNullAndEmptyArrays: true } },
    { $project: { name: { $ifNull: ['$cat.name', '未分类'] }, total: 1 } }
  ]);

  const expenseByCat = await Job.aggregate([
    { $match: { userId: require('mongoose').Types.ObjectId(req.userId), type: 'expense', date: { $regex: '^' + ym } } },
    { $group: { _id: '$categoryId', total: { $sum: '$amount' } } },
    { $lookup: { from: 'categories', localField: '_id', foreignField: '_id', as: 'cat' } },
    { $unwind: { path: '$cat', preserveNullAndEmptyArrays: true } },
    { $project: { name: { $ifNull: ['$cat.name', '未分类'] }, total: 1 } }
  ]);

  // trend (last 30 days)
  const trend = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now); d.setDate(d.getDate() - i);
    const ds = d.toISOString().substring(0,10);
    const dayJobs = await Job.find({ userId: req.userId, date: ds });
    trend.push({
      date: ds.substring(5),
      income: dayJobs.filter(j=>j.type==='income').reduce((s,j)=>s+j.amount,0),
      expense: dayJobs.filter(j=>j.type==='expense').reduce((s,j)=>s+j.amount,0)
    });
  }

  res.json({ income, expense, billTotal, salary: netSalary, netSalary, incomeByCat, expenseByCat, trend });
});

module.exports = router;
