const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URL);
    console.log('✅ Database Connected');
  } catch (error) {
    console.error('❌ Database Connection Failed:', error.message);
    process.exit(1); // Stop the app if DB fails
  }
};

module.exports = connectDB;
