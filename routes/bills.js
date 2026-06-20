const express = require('express');
const Bill = require('../models/Bill');
const router = express.Router();

const BILL_TYPES = ['water','electric','gas','net','rent','other'];
const TYPE_LABELS = { water:'水费', electric:'电费', gas:'燃气', net:'网费', rent:'房租', other:'其他' };

// GET list
router.get('/', async (req, res) => {
  const { month } = req.query;
  const filter = { userId: req.userId };
  if (month) filter.month = month;

  const bills = await Bill.find(filter).sort({ month: -1 }).lean();
  const now = new Date();
  const currentMonth = month || `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`;
  const currentBills = await Bill.find({ userId: req.userId, month: currentMonth }).lean();
  const total = currentBills.reduce((s,b)=>s+b.amount, 0);

  // get available months
  const months = await Bill.distinct('month', { userId: req.userId });
  months.sort((a,b)=>b.localeCompare(a));

  res.render('bills', { bills, currentBills, total, currentMonth, months, BILL_TYPES, TYPE_LABELS, user: req.user });
});

// POST create/update (upsert per type per month)
router.post('/', async (req, res) => {
  const { type, month, amount, paidDate, remark } = req.body;
  await Bill.findOneAndUpdate(
    { userId: req.userId, type, month },
    { amount: +amount, paidDate: paidDate||'', remark: remark||'' },
    { upsert: true, new: true }
  );
  res.redirect('/bills?month=' + month);
});

// DELETE
router.delete('/:id', async (req, res) => {
  await Bill.findOneAndDelete({ _id: req.params.id, userId: req.userId });
  res.json({ ok: true });
});

module.exports = router;
