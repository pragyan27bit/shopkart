const express = require('express');
const router = express.Router();
const {
  registerCustomer,
  loginCustomer,
  getCustomerProfile,
  logoutCustomer,
} = require('../controllers/customer.controller');
const { protect } = require('../middlewares/auth.middleware');

router.post('/register', registerCustomer);
router.post('/login', loginCustomer);
router.get('/me', protect, getCustomerProfile);
router.post('/logout', logoutCustomer);

module.exports = router;
