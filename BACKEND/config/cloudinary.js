// config/cloudinary.js
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

// Configure Cloudinary with your credentials
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Verify configuration
if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
    console.error('❌ Missing Cloudinary environment variables. Please check your .env file.');
    console.error('Required variables: CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET');
}

// Configure Multer to use Cloudinary storage
const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'localcart', // Folder name in your Cloudinary account
        allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
        transformation: [
            { width: 1200, height: 1200, crop: 'limit' }, // Limit max size to 1200x1200
            { quality: 'auto' }, // Auto optimize quality
            { fetch_format: 'auto' } // Auto format (WebP when supported by browser)
        ],
        public_id: (req, file) => {
            // Generate unique filename: timestamp + random number
            return `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
        },
    },
});

// Create multer upload instance with error handling
const upload = multer({ 
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB file size limit
        files: 5 // Maximum 5 files at once
    },
    fileFilter: (req, file, cb) => {
        // Check if file is an image
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed! Supported formats: JPG, JPEG, PNG, GIF, WebP'), false);
        }
    }
});

// Utility function to delete images from Cloudinary
const deleteImage = async (publicId) => {
    try {
        const result = await cloudinary.uploader.destroy(publicId);
        console.log(`🗑️  Image deleted from Cloudinary: ${publicId}`, result);
        return result;
    } catch (error) {
        console.error(`❌ Failed to delete image from Cloudinary: ${publicId}`, error.message);
        throw error;
    }
};

// Utility function to get optimized image URL
const getOptimizedImageUrl = (publicId, options = {}) => {
    const {
        width = 400,
        height = 400,
        crop = 'fill',
        quality = 'auto',
        format = 'auto'
    } = options;

    return cloudinary.url(publicId, {
        width,
        height,
        crop,
        quality,
        fetch_format: format
    });
};

module.exports = {
    cloudinary,
    upload,
    deleteImage,
    getOptimizedImageUrl
};