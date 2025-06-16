// In your userController.js file

const User = require('../models/User');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const mongoose = require('mongoose'); // Keep this line as you've correctly added it
const multer = require('multer');
const path = require('path'); // Import path module
const sharp = require('sharp'); // Import sharp if you intend to use it for resizing/processing

// Helper function to filter allowed fields
const filterObj = (obj, ...allowedFields) => {
    const newObj = {};
    Object.keys(obj).forEach(el => {
        if (allowedFields.includes(el)) newObj[el] = obj[el];
    });
    return newObj;
};

// --- MULTER CONFIGURATION FOR IMAGE UPLOADS ---

// 1. Storage Strategy: Use memory storage if you're processing images (e.g., resizing with sharp)
// and then saving them, or if uploading directly to cloud storage like S3.
// If you save directly to disk without processing, use diskStorage.
// For robust image handling (resizing, optimizing), memoryStorage + sharp is generally preferred.
const multerStorage = multer.memoryStorage(); // Store image in buffer

// 2. File Filter: Check if the uploaded file is an image
const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image')) {
    cb(null, true);
  } else {
    // If not an image, reject the upload
    cb(new AppError('Not an image! Please upload only images.', 400), false);
  }
};

// 3. Initialize Multer upload middleware
// 'photo' is the name of the field in the FormData on the frontend
const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // Limit file size to 5MB (matches frontend validation)
});

exports.uploadUserPhoto = upload.single('photo'); // 'photo' is the name of the field in your form

// --- Image Resizing/Processing Middleware (Optional but recommended) ---
// This should run AFTER uploadUserPhoto if you're using memoryStorage.
exports.resizeUserPhoto = catchAsync(async (req, res, next) => {
  if (!req.file) return next(); // If no file was uploaded, skip this middleware

  // Define the filename for the processed image.
  // Corrected template literal syntax.
  // Ensure 'photo' field in User model
  req.file.filename = `user-${req.user.id}-${Date.now()}.jpeg`; // Force JPEG for consistency

  // Use sharp to resize and save the image
  // This saves the processed image to the 'uploads' directory
  // Make sure 'uploads' directory is accessible by your static file server (server.js)
  const outputPath = path.join(__dirname, '../uploads', req.file.filename);
  console.log('Saving processed image to:', outputPath); // Debugging log

  await sharp(req.file.buffer) // Use the buffer from memory storage
    .resize(500, 500, {
      fit: sharp.fit.cover, // Crop to cover both dimensions, maintaining aspect ratio
      withoutEnlargement: true // Don't enlarge images smaller than dimensions
    })
    .toFormat('jpeg') // Convert to JPEG format
    .jpeg({ quality: 90 }) // Set JPEG quality
    .toFile(outputPath);

  next();
});

// --- Controller Function for updating profile including photo ---
// This function needs to be able to accept the 'photo' filename from req.file.filename
// after the upload and resize middleware have run.
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
    // Note: 'photo' field will be added separately if a file was uploaded
    const filteredBody = filterObj(req.body, 'name', 'email', 'bio');

    // 3) If there's an uploaded file (processed by multer and sharp)
    // The filename is set by `resizeUserPhoto`
    if (req.file && req.file.filename) {
      filteredBody.photo = req.file.filename; // Store the filename in the 'photo' field
    }

    // 4) Update user document
    const updatedUser = await User.findByIdAndUpdate(req.user.id, filteredBody, {
        new: true, // Return the updated document
        runValidators: true // Run validators defined in the schema
    }).select('-password'); // Exclude password from the returned object

    if (!updatedUser) {
        return next(new AppError('No user found with that ID', 404));
    }

    res.status(200).json({
        status: 'success',
        data: {
            user: updatedUser
        }
    });
});

// 1. Get Me (Logged-in user's data) - Existing
exports.getMe = (req, res, next) => {
    req.params.id = req.user.id;
    next();
};

// Generic get user by ID - Existing
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

// >>> MODIFIED FUNCTIONS (Keep your existing address functions as they are correct) <<<

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
    const { name, street, apartment, city, state, zipCode , phone , isDefault} = req.body;

    const newAddressData = {
        name,
        street,
        apartment,
        city,
        state,
        phone,
        zipCode,
        isDefault
    };
    console.log('newAddressData:', newAddressData); // Log the constructed address object

    const user = await User.findById(req.user.id);
    if (!user) {
        return next(new AppError('User not found', 404));
    }

    console.log('User addresses before push:', user.addresses); // Check existing addresses

    user.addresses.push(newAddressData);
    console.log('User addresses after push:', user.addresses); // Check after push

    await user.save();
      // <<< Potential issue point for 500 (validation or database error)

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
    console.log('deleteAddress: addressId from params:', addressId); //

    const user = await User.findById(req.user.id);
    console.log('deleteAddress: user found:', user ? true : false); //

    if (!user) {
        return next(new AppError('User not found', 404));
    }

    // --- CHANGE THIS PART ---
    // Instead of user.addresses.id(addressId).remove(), use .pull()
    // Check if the address exists before attempting to pull
    const initialAddressCount = user.addresses.length;

    // Mongoose's .pull() method is designed for removing subdocuments by _id
    user.addresses.pull({ _id: addressId }); // Pull the subdocument by its _id

    // Check if an address was actually removed
    if (user.addresses.length === initialAddressCount) {
          // This means no address with that ID was found and pulled
          return next(new AppError('Address not found or already deleted', 404));
    }
    // --- END CHANGE ---

    // Save the user document after modification
    await user.save();
    console.log('deleteAddress: user saved after removal'); //

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