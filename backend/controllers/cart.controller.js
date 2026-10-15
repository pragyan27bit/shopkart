const mongoose = require('mongoose');
const Customer = require('../models/customer.model');
const Product = require('../models/product.model');

// @desc    Add product to cart or increment quantity
// @route   POST /cart/:productId
const addToCart = async (req, res) => {
  try {
    const { productId } = req.params;

    // Validate productId
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid product ID',
      });
    }

    // Check if product exists in MongoDB
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    const user = await Customer.findById(req.user._id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    if (!user.cart) {
      user.cart = [];
    }

    // Check if product already exists in cart
    const existingIndex = user.cart.findIndex(
      (item) => item.product.toString() === productId
    );

    if (existingIndex > -1) {
      const targetQuantity = user.cart[existingIndex].quantity + 1;
      // Validate stock
      if (targetQuantity > product.stock) {
        return res.status(400).json({
          success: false,
          message: `Cannot add more. Available stock is ${product.stock}`,
        });
      }
      user.cart[existingIndex].quantity = targetQuantity;
    } else {
      // New item, check if product has at least 1 unit in stock
      if (product.stock < 1) {
        return res.status(400).json({
          success: false,
          message: 'Product is currently out of stock',
        });
      }
      user.cart.push({
        product: productId,
        quantity: 1,
      });
    }

    await user.save();
    await user.populate({
      path: 'cart.product',
      select: 'name price category image stock',
    });

    return res.status(200).json({
      success: true,
      message: 'Cart updated',
      cart: user.cart,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error adding to cart',
    });
  }
};

// @desc    Get current user's cart
// @route   GET /cart
const getCart = async (req, res) => {
  try {
    const user = await Customer.findById(req.user._id).populate({
      path: 'cart.product',
      select: 'name price category image stock',
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Filter out items where product may have been deleted
    const validCart = (user.cart || []).filter((item) => item.product !== null);

    return res.status(200).json({
      success: true,
      cart: validCart,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error fetching cart',
    });
  }
};

// @desc    Update product quantity in cart
// @route   PATCH /cart/:productId
const updateCartQuantity = async (req, res) => {
  try {
    const { productId } = req.params;
    const { quantity } = req.body;

    // Validate productId
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid product ID',
      });
    }

    // Validate quantity is a number
    const numQuantity = Number(quantity);
    if (isNaN(numQuantity) || !Number.isInteger(numQuantity)) {
      return res.status(400).json({
        success: false,
        message: 'Quantity must be an integer number',
      });
    }

    // Validate quantity >= 1
    if (numQuantity < 1) {
      return res.status(400).json({
        success: false,
        message: 'Quantity must be at least 1',
      });
    }

    // Check if product exists in MongoDB
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    // Check if quantity exceeds stock
    if (numQuantity > product.stock) {
      return res.status(400).json({
        success: false,
        message: `Quantity exceeds available stock of ${product.stock}`,
      });
    }

    const user = await Customer.findById(req.user._id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Find item in user's cart
    const cartItem = user.cart.find(
      (item) => item.product.toString() === productId
    );

    if (!cartItem) {
      return res.status(404).json({
        success: false,
        message: 'Product not in cart',
      });
    }

    cartItem.quantity = numQuantity;
    await user.save();
    await user.populate({
      path: 'cart.product',
      select: 'name price category image stock',
    });

    return res.status(200).json({
      success: true,
      message: 'Quantity updated',
      cart: user.cart,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error updating cart quantity',
    });
  }
};

// @desc    Remove product from authenticated user's cart
// @route   DELETE /cart/:productId
const removeFromCart = async (req, res) => {
  try {
    const { productId } = req.params;

    // Validate productId
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid product ID',
      });
    }

    const user = await Customer.findById(req.user._id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    const itemIndex = user.cart.findIndex(
      (item) => item.product.toString() === productId
    );

    if (itemIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Product not in cart',
      });
    }

    // Remove item
    user.cart.splice(itemIndex, 1);
    await user.save();
    await user.populate({
      path: 'cart.product',
      select: 'name price category image stock',
    });

    return res.status(200).json({
      success: true,
      message: 'Product removed from cart',
      cart: user.cart,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error removing product from cart',
    });
  }
};

module.exports = {
  addToCart,
  getCart,
  updateCartQuantity,
  removeFromCart,
};
