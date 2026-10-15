const mongoose = require('mongoose');
const Product = require('../models/product.model');

// @desc    Create a product
// @route   POST /products
const createProduct = async (req, res) => {
  try {
    const { name, description, price, category, image, stock } = req.body;

    // Check for missing required fields
    if (
      !name ||
      !description ||
      price === undefined ||
      price === null ||
      !category ||
      !image ||
      stock === undefined ||
      stock === null
    ) {
      return res.status(400).json({
        success: false,
        message: 'All fields (name, description, price, category, image, stock) are required',
      });
    }

    // Validate price
    const numPrice = Number(price);
    if (isNaN(numPrice) || numPrice <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid price: price must be greater than 0',
      });
    }

    // Validate stock
    const numStock = Number(stock);
    if (isNaN(numStock) || numStock < 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid stock: stock cannot be negative',
      });
    }

    const product = await Product.create({
      name: name.trim(),
      description: description.trim(),
      price: numPrice,
      category: category.trim(),
      image: image.trim(),
      stock: numStock,
    });

    return res.status(201).json({
      success: true,
      product,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message || 'Error creating product',
    });
  }
};

// @desc    Get all products with optional search and category filter
// @route   GET /products
const getProducts = async (req, res) => {
  try {
    const { search, category } = req.query;
    const filter = {};

    // Dynamic search filter on name (case-insensitive)
    if (search && search.trim() !== '') {
      filter.name = { $regex: search.trim(), $options: 'i' };
    }

    // Dynamic category filter
    if (category && category.trim() !== '' && category.trim().toLowerCase() !== 'all categories' && category.trim().toLowerCase() !== 'all') {
      filter.category = category.trim();
    }

    const products = await Product.find(filter).select('-__v');

    return res.status(200).json({
      success: true,
      count: products.length,
      products,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Error fetching products',
    });
  }
};

// @desc    Get single product by ID
// @route   GET /products/:id
const getProductById = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid product ID',
      });
    }

    const product = await Product.findById(id).select('-__v');
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    return res.status(200).json({
      success: true,
      product,
      ...product.toObject(),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Error fetching product',
    });
  }
};

module.exports = {
  createProduct,
  getProducts,
  getProductById,
};
