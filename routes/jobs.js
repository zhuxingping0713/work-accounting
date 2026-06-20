const express = require('express');
const Job = require('../models/Job');
const Category = require('../models/Category');
const Employer = require('../models/Employer');
const basePath = process.env.BASE_PATH || '';

const router = express.Router();

router.get('/', async (req, res) => {
  const { month, type, keyword, page = 1 } = req.query;
  const filter = { userId: req.userId };
  if (type && type !== 'all') filter.type = type;
  if (month) filter.date = { $regex: '^' + month };
  if (keyword) filter.remark = { $regex: keyword, $options: 'i' };

  const limit = 20;
  const total = await Job.countDocuments(filter);
  const jobs = await Job.find(filter)
    .sort({ date: -1, createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .populate('categoryId', 'name')
    .populate('employerId', 'name')
    .lean();

  const categories = await Category.find({ userId: req.userId, type: { $in: ['income','expense'] } }).lean();
  const employers = await Employer.find({ userId: req.userId }).lean();

  const now = new Date();
  const ym = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`;
  const monthJobs = await Job.find({ userId: req.userId, date: { $regex: '^' + ym } });
  const monthIncome = monthJobs.filter(j => j.type === 'income').reduce((s,j)=>s+j.amount, 0);
  const monthExpense = monthJobs.filter(j => j.type === 'expense').reduce((s,j)=>s+j.amount, 0);

  res.render('jobs', { jobs, categories, employers, total, page: +page, totalPages: Math.ceil(total/limit),
    filter: { type: type||'all', month: month||'', keyword: keyword||'' },
    monthIncome, monthExpense, basePath, user: req.user });
});

router.post('/', async (req, res) => {
  const { type, date, categoryId, employerId, amount, remark } = req.body;
  await Job.create({ userId: req.userId, type, date, categoryId: categoryId||null, employerId: employerId||null, amount: +amount, remark });
  res.redirect(basePath + '/jobs');
});

router.put('/:id', async (req, res) => {
  const job = await Job.findOne({ _id: req.params.id, userId: req.userId });
  if (!job) return res.json({ ok: false, msg: '未找到' });
  Object.assign(job, req.body);
  await job.save();
  res.json({ ok: true });
});

router.delete('/:id', async (req, res) => {
  await Job.findOneAndDelete({ _id: req.params.id, userId: req.userId });
  res.json({ ok: true });
});

module.exports = router;
