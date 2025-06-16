const mongoose = require('mongoose');

const vendorSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  storeName: { type: String },
  phone: { type: String },
  products: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
  rating: { type: Number,  max: 5, default: 0 },
    status: { type: String, enum: ['active', 'inactive', 'pending'], default: 'pending' }},
    {
      timestamps: true
    }
);

module.exports = mongoose.model('Vendor', vendorSchema);
