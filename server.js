require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser');
const expressLayouts = require('express-ejs-layouts');
const path = require('path');
const auth = require('./middleware/auth');
const User = require('./models/User');
const Category = require('./models/Category');

const app = express();
app.locals.basePath = process.env.BASE_PATH || '';

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.set('view engine', 'ejs');
app.use(expressLayouts);
app.set('layout', 'layout');

// Public routes
app.use('/', require('./routes/auth'));

// Protected routes
app.use('/jobs', auth, require('./routes/jobs'));
app.use('/bills', auth, require('./routes/bills'));
app.use('/salary', auth, require('./routes/salary'));
app.use('/employers', auth, require('./routes/employers'));
app.use('/categories', auth, require('./routes/categories'));
app.use('/api/stats', auth, require('./routes/stats'));

// Settings page
app.get('/settings', auth, (req, res) => {
  res.render('settings', { basePath: process.env.BASE_PATH || '', user: req.user });
});

// Home - Dashboard
app.get('/', auth, async (req, res) => {
  const now = new Date();
  const ym = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`;

  const Job = require('./models/Job');
  const Bill = require('./models/Bill');
  const Salary = require('./models/Salary');
  const Advance = require('./models/Advance');

  const monthJobs = await Job.find({ userId: req.userId, date: { $regex: '^' + ym } });
  const monthIncome = monthJobs.filter(j=>j.type==='income').reduce((s,j)=>s+j.amount, 0);
  const monthExpense = monthJobs.filter(j=>j.type==='expense').reduce((s,j)=>s+j.amount, 0);
  const monthBills = await Bill.find({ userId: req.userId, month: ym });
  const billTotal = monthBills.reduce((s,b)=>s+b.amount, 0);
  const monthSalaries = await Salary.find({ userId: req.userId, date: { $regex: '^' + ym } });
  const monthAdvances = await Advance.find({ userId: req.userId, date: { $regex: '^' + ym } });
  const salaryTotal = monthSalaries.reduce((s,r)=>s+r.amount, 0);
  const advanceTotal = monthAdvances.reduce((s,r)=>s+r.amount, 0);
  const netSalary = salaryTotal - advanceTotal;
  const balance = monthIncome + netSalary - monthExpense - billTotal;

  res.render('index', {
    basePath: process.env.BASE_PATH || '',
    user: req.user,
    currentMonth: ym,
    monthIncome, monthExpense, billTotal,
    salaryTotal, advanceTotal, netSalary, balance
  });
});

// Init default data
async function initData() {
  const userCount = await User.countDocuments();
  if (userCount === 0) {
    const admin = await User.create({
      username: process.env.ADMIN_USER || 'admin',
      password: process.env.ADMIN_PASS || 'admin123',
      displayName: '管理员',
      role: 'admin'
    });
    console.log('Created default admin: admin / admin123');

    // Default categories
    const cats = [
      { userId: admin._id, name: '工资', type: 'income' },
      { userId: admin._id, name: '跑腿', type: 'income' },
      { userId: admin._id, name: '兼职', type: 'income' },
      { userId: admin._id, name: '家教', type: 'income' },
      { userId: admin._id, name: '其他收入', type: 'income' },
      { userId: admin._id, name: '餐饮', type: 'expense' },
      { userId: admin._id, name: '交通', type: 'expense' },
      { userId: admin._id, name: '购物', type: 'expense' },
      { userId: admin._id, name: '娱乐', type: 'expense' },
      { userId: admin._id, name: '医疗', type: 'expense' },
      { userId: admin._id, name: '其他支出', type: 'expense' },
    ];
    await Category.insertMany(cats);
    console.log('Created default categories');
  }
}

// Start
const PORT = process.env.PORT || 3001;
mongoose.connect(process.env.MONGODB_URI).then(async () => {
  console.log('MongoDB connected');
  await initData();
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}).catch(err => console.error('MongoDB error:', err));
