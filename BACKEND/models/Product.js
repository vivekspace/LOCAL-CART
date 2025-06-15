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
    validate: {
      validator: function (v) {
        return v.length > 0 && !v.includes(DEFAULT_PRODUCT_IMAGE);
      },
      message: 'At least one product image is required'
    }
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
    set: val => Math.round(val * 10) / 10 // Rounds to 1 decimal place
  },
  ratingsQuantity: {
    type: Number,
    default: 0
  },
  location: {
    type: {
      type: String, // Must be 'Point' for 2dsphere index
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
    // IMPORTANT: 'city' is now nested within 'location' object.
    // Make sure your frontend and backend logic accessing this is updated to product.location.city.
    city: {
      type: String,
      required: [true, 'City name for location is required'],
      trim: true,
      minlength: [2, 'City name must be at least 2 characters'],
      maxlength: [50, 'City name cannot exceed 50 characters']
    }
  },
}, {
  timestamps: true, // Adds createdAt and updatedAt fields
  toJSON: { virtuals: true }, // Include virtuals when converting to JSON
  toObject: { virtuals: true } // Include virtuals when converting to plain object
});

// --- Schema Enhancements & Middleware ---

// Compound index for unique product name per seller (ensures a seller doesn't have duplicate product names)
productSchema.index({ name: 1, seller: 1 }, { unique: true });

// Text index for search functionality (enables text search queries across these fields)
productSchema.index({ name: 'text', description: 'text', category: 'text', 'location.city': 'text' });

// Geospatial index for efficient `$geoNear` queries (CRITICAL for nearby product search)
productSchema.index({ location: '2dsphere' });

// Indexes for common queries (improves performance of filtering, sorting)
productSchema.index({ price: 1, ratingsAverage: -1 }); // For sorting by price (ascending) then ratings (descending)
productSchema.index({ seller: 1 }); // For finding products by a specific seller
productSchema.index({ category: 1 }); // For filtering products by category
productSchema.index({ 'location.city': 1 }); // For filtering products by a specific city

productSchema.virtual('reviews', {
  ref: 'Review',          // The model to use for population
  foreignField: 'product', // Field in the 'Review' model that references 'Product._id'
  localField: '_id'       // Field in the 'Product' model that matches 'foreignField'
});

// Document middleware to set a default image if none provided
const DEFAULT_PRODUCT_IMAGE = 'default-product.png'; // Define your actual default image filename
productSchema.pre('save', function (next) {
  // Only set default if no files were processed
  if ((!this.images || this.images.length === 0) && !this._processedFiles) {
    this.images = [DEFAULT_PRODUCT_IMAGE];
  }
  next();
});

// Query middleware to populate seller details on find queries
// This automatically fetches seller information when you query for products
productSchema.pre(/^find/, function (next) {
  this.populate({
    path: 'seller',
    // Select specific fields to return from the 'seller' document
    // name: 1, email: 1 (include these)
    // _id: 0 (exclude _id)
    select: { name: 1, email: 1, _id: 1 }
  });
  next(); // Proceed to the next middleware or query execution
});

// Static method for getting product statistics by category
// Useful for analytics dashboards or summary views
productSchema.statics.getProductStats = async function () {
  return this.aggregate([
    {
      $group: {
        _id: '$category', // Group by category
        numProducts: { $sum: 1 }, // Count products in each category
        avgPrice: { $avg: '$price' }, // Calculate average price
        minPrice: { $min: '$price' }, // Find minimum price
        maxPrice: { $max: '$price' }  // Find maximum price
      }
    },
    {
      $sort: { numProducts: -1 } // Sort results by number of products in descending order
    }
  ]);
};

module.exports = mongoose.model('Product', productSchema);