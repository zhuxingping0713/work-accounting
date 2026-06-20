const mongoose = require('mongoose');

const employerSchema = new mongoose.Schema({
  userId:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name:    { type: String, required: true },
  contact: { type: String, default: '' },
  phone:   { type: String, default: '' },
  remark:  { type: String, default: '' }
});

employerSchema.index({ userId: 1 });
module.exports = mongoose.model('Employer', employerSchema);
