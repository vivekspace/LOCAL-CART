const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Product name is required'],
    trim: true,
    maxlength: [100, 'Product name cannot exceed 100 characters'],
    minlength: [3, 'Product name must be at least 3 characters'],
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
    ref: 'Vendor', // Ensure 'Vendor' matches your actual Vendor model name
    required: [true, 'Product must belong to a vendor']
  },
  images: [{
    type: String,
    // If you always require at least one *actual* image from the user, keep 'required: true'
    // but ensure your middleware or controller sets the default *before* validation.
    // For now, leaving it not required for flexibility with the default image logic.
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
      required: [true, 'Location type is required and must be "Point"'],
      default: 'Point'
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      required: [true, 'Product location coordinates are required'],
      validate: {
        validator: function (v) {
          return Array.isArray(v) && v.length === 2 && typeof v[0] === 'number' && typeof v[1] === 'number';
        },
        message: props => `${props.value} is not a valid coordinate pair. Must be [longitude, latitude] numbers.`
      }
    },
    // IMPORTANT: Moved 'city' inside 'location' object for better semantic grouping
    // This aligns with geospatial data being related to a specific city.
    // Make sure your frontend logic is updated to access product.location.city.
    city: {
      type: String,
      required: [true, 'City name for location is required'],
      trim: true,
      minlength: [2, 'City name must be at least 2 characters'],
      maxlength: [50, 'City name cannot exceed 50 characters']
    }
  },
}, {
  timestamps: true, // Adds createdAt and updatedAt
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// --- Schema Enhancements & Middleware ---

// Compound index for unique product name per seller
productSchema.index({ name: 1, seller: 1 }, { unique: true });

// Text index for search functionality
productSchema.index({ name: 'text', description: 'text', category: 'text', 'location.city': 'text' }); // Added 'location.city' for text search

// Geospatial index for efficient `$geoNear` queries
productSchema.index({ location: '2dsphere' });

// Indexes for common queries (e.g., sorting, filtering)
productSchema.index({ price: 1, ratingsAverage: -1 });
productSchema.index({ seller: 1 });
productSchema.index({ category: 1 });
productSchema.index({ 'location.city': 1 }); // Index for efficient filtering/sorting by city

// Virtual populate reviews (if you have a Review model)
productSchema.virtual('reviews', {
  ref: 'Review',
  foreignField: 'product',
  localField: '_id'
});

// Document middleware to set default image if none provided
const DEFAULT_PRODUCT_IMAGE = 'default-product.png'; // Define this constant clearly
productSchema.pre('save', function (next) {
  if (!this.images || this.images.length === 0) {
    this.images = [DEFAULT_PRODUCT_IMAGE];
  }
  next();
});

// Query middleware to populate seller details on find queries
productSchema.pre(/^find/, function (next) {
  this.populate({
    path: 'seller',
    // FIX: Changed to object syntax to correctly exclude _id within an inclusion projection
    select: { name: 1, email: 1, _id: 0 } // Correct way to select specific fields and exclude _id
  });
  next();
});

// Static method for getting product stats by category (useful for analytics/dashboards)
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
    },
    {
      $sort: { numProducts: -1 }
    }
  ]);
};

module.exports = mongoose.model('Product', productSchema);