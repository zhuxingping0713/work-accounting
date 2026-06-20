const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name:   { type: String, required: true },
  type:   { type: String, enum: ['income','expense','utility'], required: true },
  icon:   { type: String, default: '' }
});

categorySchema.index({ userId: 1, type: 1 });
module.exports = mongoose.model('Category', categorySchema);
