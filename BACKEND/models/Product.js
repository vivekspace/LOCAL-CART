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
    ref: 'User', // Ensure 'Vendor' matches your actual Vendor model name
    required: [true, 'Product must belong to a vendor']
  },
  
  // UPDATED: Images field for Cloudinary URLs and public IDs
  images: [{
    url: {
      type: String,
      required: [true, 'Image URL is required']
    },
    publicId: {
      type: String,
      required: [true, 'Image public ID is required for deletion']
    },
    altText: {
      type: String,
      default: function() {
        return `${this.parent().name} product image`;
      }
    }
  }],
  
  // Optional: Single main image (first image from images array)
  mainImage: {
    type: String, // This will be the URL of the first image
    default: function() {
      return this.images && this.images.length > 0 ? this.images[0].url : null;
    }
  },

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

// Compound index for unique product name per seller
productSchema.index({ name: 1, seller: 1 }, { unique: true });

// Text index for search functionality
productSchema.index({ name: 'text', description: 'text', category: 'text', 'location.city': 'text' });

// Geospatial index for efficient `$geoNear` queries
productSchema.index({ location: '2dsphere' });

// Indexes for common queries
productSchema.index({ price: 1, ratingsAverage: -1 });
productSchema.index({ seller: 1 });
productSchema.index({ category: 1 });
productSchema.index({ 'location.city': 1 });

// Virtual for reviews
productSchema.virtual('reviews', {
  ref: 'Review',
  foreignField: 'product',
  localField: '_id'
});

// UPDATED: Middleware for handling default images with Cloudinary
productSchema.pre('save', function (next) {
  // Set mainImage from first image if not already set
  if (this.images && this.images.length > 0 && !this.mainImage) {
    this.mainImage = this.images[0].url;
  }
  
  // Validate that at least one image exists
  if (!this.images || this.images.length === 0) {
    return next(new Error('At least one product image is required'));
  }
  
  next();
});

// UPDATED: Middleware to update mainImage when images change
productSchema.pre('findOneAndUpdate', function(next) {
  const update = this.getUpdate();
  
  // If images are being updated, update mainImage too
  if (update.images && update.images.length > 0) {
    update.mainImage = update.images[0].url;
  }
  
  next();
});

// Query middleware to populate seller details
productSchema.pre(/^find/, function (next) {
  this.populate({
    path: 'seller',
    select: { name: 1, email: 1, _id: 1 }
  });
  next();
});

// UPDATED: Static method for getting product statistics
productSchema.statics.getProductStats = async function () {
  return this.aggregate([
    {
      $group: {
        _id: '$category',
        numProducts: { $sum: 1 },
        avgPrice: { $avg: '$price' },
        minPrice: { $min: '$price' },
        maxPrice: { $max: '$price' },
        totalImages: { $sum: { $size: '$images' } } // Count total images
      }
    },
    {
      $sort: { numProducts: -1 }
    }
  ]);
};

// ADDED: Static method to cleanup orphaned Cloudinary images
productSchema.statics.cleanupImages = async function (productId) {
  const { deleteImage } = require('../config/cloudinary');
  
  try {
    const product = await this.findById(productId);
    if (product && product.images) {
      // Delete all images from Cloudinary
      const deletePromises = product.images.map(image => deleteImage(image.publicId));
      await Promise.all(deletePromises);
      console.log(`🗑️ Cleaned up ${product.images.length} images for product ${productId}`);
    }
  } catch (error) {
    console.error(`❌ Failed to cleanup images for product ${productId}:`, error.message);
  }
};

// ADDED: Pre-remove middleware to cleanup images when product is deleted
productSchema.pre('findOneAndDelete', async function(next) {
  try {
    const product = await this.model.findOne(this.getQuery());
    if (product) {
      await this.model.cleanupImages(product._id);
    }
    next();
  } catch (error) {
    next(error);
  }
});

module.exports = mongoose.model('Product', productSchema);