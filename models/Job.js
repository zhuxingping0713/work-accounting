const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema({
  userId:     { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type:       { type: String, enum: ['income', 'expense'], required: true },
  date:       { type: String, required: true },
  categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
  employerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Employer', default: null },
  amount:     { type: Number, required: true },
  remark:     { type: String, default: '' },
  createdAt:  { type: Date, default: Date.now }
});

jobSchema.index({ userId: 1, date: -1 });
module.exports = mongoose.model('Job', jobSchema);
