const { upload } = require('../config/cloudinary');
const multer = require('multer');

// Middleware for uploading multiple product images
const uploadMultiple = upload.array('productImages', 5); // Allow up to 5 images (matching your config)

// Error handling middleware for upload errors
const handleUploadError = (err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
                status: 'fail',
                message: 'File size too large. Maximum size is 5MB per image.'
            });
        }
        if (err.code === 'LIMIT_FILE_COUNT') {
            return res.status(400).json({
                status: 'fail',
                message: 'Too many files. Maximum 5 images allowed.'
            });
        }
        if (err.code === 'LIMIT_UNEXPECTED_FILE') {
            return res.status(400).json({
                status: 'fail',
                message: 'Unexpected field name. Use "productImages" for image uploads.'
            });
        }
    }
    
    if (err && err.message.includes('Only image files are allowed')) {
        return res.status(400).json({
            status: 'fail',
            message: 'Only image files (JPG, JPEG, PNG, GIF, WebP) are allowed.'
        });
    }
    
    if (err) {
        console.error('Upload error:', err);
        return res.status(500).json({
            status: 'error',
            message: 'Error uploading images. Please try again.'
        });
    }
    
    next();
};

// Middleware for single image upload (if needed)
const uploadSingle = upload.single('productImage');

// Middleware to process uploaded files and add to req.body
const processUploadedFiles = (req, res, next) => {
    if (req.files && req.files.length > 0) {
        // Extract Cloudinary URLs from uploaded files
        req.body.images = req.files.map(file => ({
            url: file.path,
            publicId: file.filename,
            originalName: file.originalname,
            altText: `${req.body.name || 'Product'} image`
        }));
    }
    next();
};

module.exports = {
    uploadMultiple,
    uploadSingle,
    handleUploadError,
    processUploadedFiles,
};