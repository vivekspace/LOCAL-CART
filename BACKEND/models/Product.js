const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Product name is required'],
    trim: true,
    maxlength: [100, 'Product name cannot exceed 100 characters'],
    minlength: [3, 'Product name must be at least 3 characters']
  },
  description: {
    type: String,
    required: [true, 'Product description is required'],
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  price: {
    type: Number,
    required: [true, 'Product price is required'],
    min: [0, 'Price must be a positive number'],
    set: val => Math.round(val * 100) / 100 // Ensures 2 decimal places
  },
  category: {
    type: String,
    required: [true, 'Product category is required'],
    enum: {
      values: [
        "Fruits",
        "Bakery",
        "Dairy & Eggs",
        "Honey",
        "Soap & Detergents",
        "Vegetables",
        "Meat & Poultry",
        "Beverages",
        "Mobile",
        "Electronics"
      ],
      message: 'Please select a valid category'
    }
  },
  seller: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vendor',
    required: [true, 'Product must belong to a vendor']
  },
  images: [{
    type: String,
    required: [true, 'Image path is required'],
  }],
  stock: {
    type: Number,
    required: [true, 'Please provide product stock'],
    min: [0, 'Stock cannot be negative'],
    default: 0
  },
  ratingsAverage: {
    type: Number,
    default: 0,
    min: [0, 'Rating must be at least 0'],
    max: [5, 'Rating must be at most 5'],
    set: val => Math.round(val * 10) / 10 // Rounds to 1 decimal
  },
  ratingsQuantity: {
    type: Number,
    default: 0
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      required: [true, 'Location type is required'],
      default: 'Point'
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      required: [true, 'Product location coordinates are required']
    },
  },
  city: {
    type: String,
    required: [true, 'City is required'],
    trim: true
  },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Add index for better performance on frequently queried fields
productSchema.index({ name: 'text', description: 'text' });
productSchema.index({ location: '2dsphere' }); // For geospatial queries
productSchema.index({ price: 1, ratingsAverage: -1 });
productSchema.index({ seller: 1 }); // FIXED: Changed from 'seller' to 'vendorId'

// Virtual populate reviews (if you have a Review model)
productSchema.virtual('reviews', {
  ref: 'Review',
  foreignField: 'product',
  localField: '_id'
});

// Document middleware to set default image if none provided
const DEFAULT_PRODUCT_IMAGE = 'default-product.png';
productSchema.pre('save', function (next) {
  if (this.images && this.images.length === 0) {
    this.images = [DEFAULT_PRODUCT_IMAGE];
  }
  next();
});

// FIXED: Query middleware to populate vendorId (not seller)
productSchema.pre(/^find/, function (next) {
  this.populate({
    path: 'seller',
    select: 'name email'
  });
  next();
});

// Static method for getting product stats by category
productSchema.statics.getProductStats = async function () {
  return this.aggregate([
    {
      $group: {
        _id: '$category',
        numProducts: { $sum: 1 },
        avgPrice: { $avg: '$price' },
        minPrice: { $min: '$price' },
        maxPrice: { $max: '$price' }
      }
    }
  ]);
};

module.exports = mongoose.model('Product', productSchema);