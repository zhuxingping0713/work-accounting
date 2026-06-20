const mongoose = require('mongoose');

const salarySchema = new mongoose.Schema({
  userId:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  date:      { type: String, required: true },
  hours:     { type: Number, default: 1 },
  dailyWage: { type: Number, default: 240 },
  amount:    { type: Number, default: 240 },
  advance:   { type: Number, default: 0 },
  remark:    { type: String, default: '' },
  createdAt: { type: Date, default: Date.now }
});

salarySchema.index({ userId: 1, date: -1 });
module.exports = mongoose.model('Salary', salarySchema);
