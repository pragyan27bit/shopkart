require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('./models/product.model');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/shopkart';

const seedProducts = [
  {
    name: 'Mechanical Keyboard',
    description: 'RGB mechanical keyboard with blue switches, tactile feedback, and durable double-shot keycaps.',
    price: 2999,
    category: 'Electronics',
    image: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=600&q=80',
    stock: 10,
  },
  {
    name: 'Noise Cancelling Headphones',
    description: 'Wireless over-ear headphones with active noise cancellation, deep bass, and 30-hour battery life.',
    price: 4999,
    category: 'Electronics',
    image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=600&q=80',
    stock: 12,
  },
  {
    name: 'Smart Fitness Watch',
    description: 'Track your health metrics, heart rate, sleep quality, and workouts with a bright AMOLED touch screen.',
    price: 3499,
    category: 'Electronics',
    image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=600&q=80',
    stock: 18,
  },
  {
    name: 'Minimalist Denim Jacket',
    description: 'Classic vintage-washed indigo denim jacket tailored with premium cotton for comfortable everyday wear.',
    price: 1999,
    category: 'Fashion',
    image: 'https://images.unsplash.com/photo-1576995853123-5a10305d93c0?auto=format&fit=crop&w=600&q=80',
    stock: 15,
  },
  {
    name: 'Classic Cotton T-Shirt',
    description: 'Ultra-soft 100% combed organic cotton regular-fit t-shirt designed for breathable all-day comfort.',
    price: 799,
    category: 'Fashion',
    image: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=600&q=80',
    stock: 30,
  },
  {
    name: 'Clean Code',
    description: 'A handbook of agile software craftsmanship by Robert C. Martin. Essential reading for software developers.',
    price: 899,
    category: 'Books',
    image: 'https://images.unsplash.com/photo-1532012164546-f432f2e3edd4?auto=format&fit=crop&w=600&q=80',
    stock: 20,
  },
  {
    name: 'The Pragmatic Programmer',
    description: 'Your journey to mastery: 20th Anniversary Edition by David Thomas and Andrew Hunt.',
    price: 1299,
    category: 'Books',
    image: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=600&q=80',
    stock: 14,
  },
  {
    name: 'Ceramic Coffee Mug Set',
    description: 'Handcrafted stoneware ceramic mugs set of 2 with matte finish and ergonomic heat-insulated handle.',
    price: 649,
    category: 'Home',
    image: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=600&q=80',
    stock: 25,
  },
  {
    name: 'Minimalist Desk Lamp',
    description: 'Modern aluminum LED desk lamp featuring touch dimming, 3 color temperatures, and USB charging port.',
    price: 1499,
    category: 'Home',
    image: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=600&q=80',
    stock: 8,
  },
];

async function seed() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB for seeding...');
    await Product.deleteMany({});
    const inserted = await Product.insertMany(seedProducts);
    console.log(`Seeded ${inserted.length} products successfully!`);
    process.exit(0);
  } catch (error) {
    console.error('Seeding error:', error);
    process.exit(1);
  }
}

seed();
