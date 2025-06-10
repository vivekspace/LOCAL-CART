// In your userController.js file

const User = require('../models/User');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
// import mongoose from 'mongoose'; // REMOVE THIS LINE
const mongoose = require('mongoose'); // ADD THIS LINE

// Helper function to filter allowed fields
const filterObj = (obj, ...allowedFields) => {
    const newObj = {};
    Object.keys(obj).forEach(el => {
        if (allowedFields.includes(el)) newObj[el] = obj[el];
    });
    return newObj;
};

// 1. Get Me (Logged-in user's data)
exports.getMe = (req, res, next) => {
    req.params.id = req.user.id;
    next();
};

// Generic get user by ID
exports.getUser = catchAsync(async (req, res, next) => {
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

// 2. Update Me (Logged-in user updates their own data)
exports.updateMe = catchAsync(async (req, res, next) => {
    if (req.body.password || req.body.passwordConfirm) {
        return next(
            new AppError(
                'This route is not for password updates. Please use /updateMyPassword.',
                400
            )
        );
    }

    const filteredBody = filterObj(req.body, 'name', 'email', 'bio', 'avatar');

    const updatedUser = await User.findByIdAndUpdate(req.user.id, filteredBody, {
        new: true,
        runValidators: true
    });

    res.status(200).json({
        status: 'success',
        data: {
            user: updatedUser
        }
    });
});

// >>> ADD THESE FUNCTIONS <<<

// Example placeholder for fetching addresses
exports.getAddresses = catchAsync(async (req, res, next) => {
    // Implement logic to fetch addresses for req.user.id
    // For now, sending a placeholder response
    const user = await User.findById(req.user.id);
    if (!user) {
        return next(new AppError('User not found', 404));
    }
    res.status(200).json({
        status: 'success',
        data: {
            addresses: user.addresses || [] // Assuming addresses are an array in your User model
        }
    });
});

// Example placeholder for adding an address
exports.addAddress = catchAsync(async (req, res, next) => {
        console.log('🔥🔥🔥 Hit addAddress controller! 🔥🔥🔥'); // <--- ADD THIS

    const { name, fullAddress } = req.body;
    // Implement logic to add address to req.user.id
    // For now, sending a placeholder response
    const user = await User.findById(req.user.id);
    if (!user) {
        return next(new AppError('User not found', 404));
    }
    // Assuming you have an 'addresses' array in your User schema
    user.addresses.push({ name, fullAddress, _id: new mongoose.Types.ObjectId() }); // Add an _id for new addresses
    await user.save({ validateBeforeSave: false }); // Bypass top-level validation if just updating nested array

    res.status(201).json({
        status: 'success',
        message: 'Address added successfully (placeholder)',
        data: {
            addresses: user.addresses // Return updated addresses
        }
    });
});

// Example placeholder for updating an address
exports.updateAddress = catchAsync(async (req, res, next) => {
    const { addressId } = req.params;
    const { name, fullAddress } = req.body;

    const user = await User.findById(req.user.id);
    if (!user) {
        return next(new AppError('User not found', 404));
    }

    const addressIndex = user.addresses.findIndex(addr => addr._id.toString() === addressId);
    if (addressIndex === -1) {
        return next(new AppError('Address not found', 404));
    }

    user.addresses[addressIndex].name = name || user.addresses[addressIndex].name;
    user.addresses[addressIndex].fullAddress = fullAddress || user.addresses[addressIndex].fullAddress;

    await user.save({ validateBeforeSave: false });

    res.status(200).json({
        status: 'success',
        message: 'Address updated successfully (placeholder)',
        data: {
            address: user.addresses[addressIndex]
        }
    });
});

// Example placeholder for deleting an address
exports.deleteAddress = catchAsync(async (req, res, next) => {
    const { addressId } = req.params;

    const user = await User.findById(req.user.id);
    if (!user) {
        return next(new AppError('User not found', 404));
    }

    const initialLength = user.addresses.length;
    user.addresses = user.addresses.filter(addr => addr._id.toString() !== addressId);

    if (user.addresses.length === initialLength) {
        return next(new AppError('Address not found', 404));
    }

    await user.save({ validateBeforeSave: false });

    res.status(204).json({
        status: 'success',
        message: 'Address deleted successfully (placeholder)',
        data: null
    });
});