const mongoose = require('mongoose');

const billSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type:   { type: String, enum: ['water','electric','gas','net','rent','other'], required: true },
  month:  { type: String, required: true },
  amount: { type: Number, required: true },
  paidDate: { type: String, default: '' },
  remark:  { type: String, default: '' }
});

billSchema.index({ userId: 1, month: -1 });
module.exports = mongoose.model('Bill', billSchema);
