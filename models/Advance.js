const mongoose = require('mongoose');

const advanceSchema = new mongoose.Schema({
  userId:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  date:      { type: String, required: true },
  amount:    { type: Number, required: true },
  deducted:  { type: Boolean, default: false },
  remark:    { type: String, default: '' },
  createdAt: { type: Date, default: Date.now }
});

advanceSchema.index({ userId: 1, date: -1 });
module.exports = mongoose.model('Advance', advanceSchema);
