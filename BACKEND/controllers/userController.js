// controllers/userController.js

const User = require('../models/User');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const { upload, deleteImage } = require('../config/cloudinary'); // Import Cloudinary upload and delete utilities

// Helper function to filter allowed fields for updates
const filterObj = (obj, ...allowedFields) => {
    const newObj = {};
    Object.keys(obj).forEach(el => {
        if (allowedFields.includes(el)) newObj[el] = obj[el];
    });
    return newObj;
};

// --- Cloudinary Upload Middleware for User Photo ---
// This middleware handles the upload of a single file named 'photo'
// directly to Cloudinary using the configuration from '../config/cloudinary.js'.
// The uploaded file details (path/url and filename/publicId) will be available in req.file.
exports.uploadUserPhoto = upload.single('photo');

// --- Controller Function for updating profile including photo ---
exports.updateMe = catchAsync(async (req, res, next) => {
    // 1) Create error if user POSTs password data
    if (req.body.password || req.body.passwordConfirm) {
        return next(
            new AppError(
                'This route is not for password updates. Please use /updateMyPassword.',
                400
            )
        );
    }

    // 2) Filtered out unwanted fields names that are not allowed to be updated
    // Only 'name', 'email', 'bio' are allowed to be updated via this route besides the photo.
    const filteredBody = filterObj(req.body, 'name', 'email', 'bio');

    // 3) Handle photo upload and deletion of old photo
    if (req.file) { // If a new file was uploaded
        const user = await User.findById(req.user.id).select('+photo.publicId'); // Fetch user to get current publicId

        // IMPORTANT: Define the publicId of your default profile picture on Cloudinary.
        // This prevents attempting to delete a non-existent or shared default image.
        // Replace 'localcart/default' with the actual public ID of your default image
        // from your Cloudinary account (e.g., if you uploaded 'default.jpg' to 'localcart' folder,
        // its public ID might be 'localcart/default').
        const defaultPhotoPublicId = 'localcart/default'; // <<< VERIFY THIS VALUE

        // If an old photo exists and it's not the default one, delete it from Cloudinary
        if (user && user.photo && user.photo.publicId && user.photo.publicId !== defaultPhotoPublicId) {
            try {
                await deleteImage(user.photo.publicId);
                console.log(`🗑️ Old profile photo deleted from Cloudinary: ${user.photo.publicId}`);
            } catch (deleteError) {
                console.error(`❌ Failed to delete old profile photo ${user.photo.publicId}:`, deleteError.message);
                // Log the error but continue with the update, as failing to delete old image
                // shouldn't prevent saving the new one.
            }
        }

        // Add the new Cloudinary photo details to the filteredBody
        // req.file.path holds the URL (secure_url from Cloudinary)
        // req.file.filename holds the public_id (Multer-Cloudinary sets this)
        filteredBody.photo = {
            url: req.file.path,
            publicId: req.file.filename
        };
    }

    // 4) Update user document
    const updatedUser = await User.findByIdAndUpdate(req.user.id, filteredBody, {
        new: true, // Return the updated document
        runValidators: true // Run validators defined in the schema for 'name', 'email', 'bio'
    }).select('-password'); // Exclude password from the returned object for security

    if (!updatedUser) {
        return next(new AppError('No user found with that ID', 404));
    }

    res.status(200).json({
        status: 'success',
        message: 'Profile updated successfully!',
        data: {
            user: updatedUser
        }
    });
});

// 1. Get Me (Logged-in user's data)
// This middleware simply sets req.params.id to the logged-in user's ID
// so that the generic getUser controller can be reused.
exports.getMe = (req, res, next) => {
    req.params.id = req.user.id;
    next();
};

// Generic get user by ID
exports.getUser = catchAsync(async (req, res, next) => {
    // Finds a user by ID. It will return the user document,
    // including the 'photo' object with 'url' and 'publicId'.
    const user = await User.findById(req.params.id);

    if (!user) {
        return next(new AppError('No user found with that ID', 404));
    }

    res.status(200).json({
        status: 'success',
        data: {
            user
        }
    });
});

// --- Address Management Functions (Kept as is from your provided code) ---

// Function to fetch addresses for the logged-in user
exports.getAddresses = catchAsync(async (req, res, next) => {
    const user = await User.findById(req.user.id);
    if (!user) {
        return next(new AppError('User not found', 404));
    }
    res.status(200).json({
        status: 'success',
        data: {
            addresses: user.addresses || []
        }
    });
});

exports.addAddress = catchAsync(async (req, res, next) => {
    // Ensure all required fields for address are present in req.body.
    // I added 'phone' to the destructuring here as it was present in your request.
    const { name, street, apartment, city, state, zipCode, phone, isDefault } = req.body;

    const newAddressData = {
        name,
        street,
        apartment,
        city,
        state,
        phone, // Include phone if it's part of your address schema now
        zipCode,
        isDefault
    };
    console.log('newAddressData:', newAddressData);

    const user = await User.findById(req.user.id);
    if (!user) {
        return next(new AppError('User not found', 404));
    }

    console.log('User addresses before push:', user.addresses);

    user.addresses.push(newAddressData);
    console.log('User addresses after push:', user.addresses);

    await user.save();

    res.status(201).json({
        status: 'success',
        message: 'Address added successfully',
        data: {
            address: user.addresses[user.addresses.length - 1] // Return the newly added address
        }
    });
});

// Function to update an existing address
exports.updateAddress = catchAsync(async (req, res, next) => {
    const { addressId } = req.params;
    // Extract individual address fields from req.body for update
    const { name, street, apartment, city, state, zipCode, phone, isDefault } = req.body; // Added phone and isDefault

    const user = await User.findById(req.user.id);
    if (!user) {
        return next(new AppError('User not found', 404));
    }

    const address = user.addresses.id(addressId); // Mongoose helper to find sub-document by ID

    if (!address) {
        return next(new AppError('Address not found', 404));
    }

    // Update the address fields
    address.set({
        name: name !== undefined ? name : address.name, // Check for undefined to allow empty string updates
        street: street !== undefined ? street : address.street,
        apartment: apartment !== undefined ? apartment : address.apartment,
        city: city !== undefined ? city : address.city,
        state: state !== undefined ? state : address.state,
        zipCode: zipCode !== undefined ? zipCode : address.zipCode,
        phone: phone !== undefined ? phone : address.phone, // Update phone
        isDefault: isDefault !== undefined ? isDefault : address.isDefault // Update isDefault
    });

    await user.save();

    res.status(200).json({
        status: 'success',
        message: 'Address updated successfully',
        data: {
            address: address // Return the updated address
        }
    });
});

// Function to delete an address
exports.deleteAddress = catchAsync(async (req, res, next) => {
    const { addressId } = req.params;
    console.log('deleteAddress: addressId from params:', addressId);

    const user = await User.findById(req.user.id);
    console.log('deleteAddress: user found:', user ? true : false);

    if (!user) {
        return next(new AppError('User not found', 404));
    }

    const initialAddressCount = user.addresses.length;

    user.addresses.pull({ _id: addressId });

    if (user.addresses.length === initialAddressCount) {
        return next(new AppError('Address not found or already deleted', 404));
    }

    await user.save();
    console.log('deleteAddress: user saved after removal');

    res.status(204).json({ // 204 No Content is standard for successful DELETE
        status: 'success',
        message: 'Address deleted successfully',
        data: null
    });
});

exports.setAsDefaultAddress = async (req, res, next) => {
    try {
        const { addressId } = req.params;
        const userId = req.user.id;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const addressToSetDefault = user.addresses.id(addressId);
        if (!addressToSetDefault) {
            return res.status(404).json({ message: 'Address not found' });
        }

        user.addresses.forEach(addr => {
            if (addr._id.toString() !== addressId) {
                addr.isDefault = false;
            }
        });

        addressToSetDefault.isDefault = true;

        await user.save();

        res.status(200).json({
            status: 'success',
            message: 'Default address set successfully',
            data: {
                address: addressToSetDefault
            }
        });

    } catch (error) {
        console.error("Error setting default address:", error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to set default address',
            error: error.message
        });
    }
};