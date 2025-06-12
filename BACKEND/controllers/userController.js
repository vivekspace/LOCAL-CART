// In your userController.js file

const User = require('../models/User');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const mongoose = require('mongoose'); // Keep this line as you've correctly added it

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

// >>> MODIFIED FUNCTIONS <<<

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

// Function to add a new address for the logged-in user
exports.addAddress = catchAsync(async (req, res, next) => {
    console.log('🔥🔥🔥 Hit addAddress controller! 🔥🔥🔥');
    // Extract individual address fields from req.body
    const { name, street, apartment, city, state, zipCode } = req.body;

    // Create the new address object matching the updated Mongoose schema
    const newAddressData = {
        name,
        street,
        apartment,
        city,
        state,
        zipCode
    };

    // Find the user
    const user = await User.findById(req.user.id);
    if (!user) {
        return next(new AppError('User not found', 404));
    }

    // Add the new address object to the addresses array
    user.addresses.push(newAddressData);

    // Save the user document. Mongoose will automatically validate the new address sub-document
    // Removing { validateBeforeSave: false } as we DO want validation for the new address.
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
    const { name, street, apartment, city, state, zipCode } = req.body;

    const user = await User.findById(req.user.id);
    if (!user) {
        return next(new AppError('User not found', 404));
    }

    const address = user.addresses.id(addressId); // Mongoose helper to find sub-document by ID
    
    if (!address) {
        return next(new AppError('Address not found', 404));
    }

    // Update the address fields
    address.set({ // Using .set() method is cleaner for updating subdocuments
        name: name || address.name, // Only update if new value is provided
        street: street || address.street,
        apartment: apartment || address.apartment,
        city: city || address.city,
        state: state || address.state,
        zipCode: zipCode || address.zipCode
    });

    // Save the user document. Mongoose will validate the updated sub-document.
    // Removing { validateBeforeSave: false } as we DO want validation for the updated address.
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

    const user = await User.findById(req.user.id);
    if (!user) {
        return next(new AppError('User not found', 404));
    }

    const address = user.addresses.id(addressId); // Mongoose helper to find sub-document by ID
    
    if (!address) {
        return next(new AppError('Address not found', 404));
    }

    address.remove(); // Removes the sub-document from the array

    // Save the user document. No need to bypass validation here typically.
    await user.save();

    res.status(204).json({ // 204 No Content is standard for successful DELETE
        status: 'success',
        message: 'Address deleted successfully',
        data: null
    });
});

exports.setAsDefaultAddress = async (req, res, next) => {
  try {
    const { addressId } = req.params;
    const userId = req.user.id; // Assuming req.user is set by protect middleware

    // 1. Find the address to set as default and ensure it belongs to the user
    const user = await User.findById(userId); // Assuming User is your Mongoose model
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const addressToSetDefault = user.addresses.id(addressId);
    if (!addressToSetDefault) {
      return res.status(404).json({ message: 'Address not found' });
    }

    // 2. Set all other addresses to not default
    user.addresses.forEach(addr => {
      if (addr._id.toString() !== addressId) {
        addr.isDefault = false;
      }
    });

    // 3. Set the chosen address to default
    addressToSetDefault.isDefault = true;

    await user.save(); // Save the updated user document

    res.status(200).json({
      status: 'success',
      message: 'Default address set successfully',
      data: {
        address: addressToSetDefault // Optionally send back the updated address
      }
    });

  } catch (error) {
    console.error("Error setting default address:", error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to set default address',
      error: error.message // Good for debugging, but be cautious in production
    });
  }
};