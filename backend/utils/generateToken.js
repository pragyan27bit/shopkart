const jwt = require('jsonwebtoken');

const generateToken = (res, customerId) => {
  const secret = process.env.JWT_SECRET || 'shopkart_jwt_secret_default_key';
  const token = jwt.sign({ id: customerId }, secret, {
    expiresIn: '7d',
  });

  if (res) {
    const isProduction = process.env.NODE_ENV === 'production';
    res.cookie('token', token, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'strict' : 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });
  }

  return token;
};

module.exports = generateToken;
