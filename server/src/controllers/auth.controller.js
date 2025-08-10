
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/user.model.js');


const registerController = async (req, res) => {
    try {
      const { username, email, password } = req.body;
  
      // Check for existing user
      const existingUser = await User.findOne({ $or: [{ username }, { email }] });
      if (existingUser) {
        return res.status(400).json({ message: "Username or Email already exists" });
      }
  
      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);
      if (!hashedPassword) {
        return res.status(500).json({ message: "Something Went Wrong" });
      }
  
      // Create new user
      const newUser = new User({
        username,
        email,
        password: hashedPassword,
        prompts: [],
        projects: []
      });
  
      await newUser.save();
  
      // Generate JWT
      const token = jwt.sign(
        { id: newUser._id, username: newUser.username },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
      );
  
       // Save token in cookie
       res.cookie('token', token, {
          httpOnly: true, // prevents JS access
          secure: process.env.NODE_ENV === 'production', // HTTPS only in prod
          sameSite: 'strict', // CSRF protection
          maxAge: 60 * 60 * 1000 // 1 hour
        });
  
      res.status(201).json({
        message: 'User registered successfully',
        token,
        user: {
          id: newUser._id,
          username: newUser.username,
          email: newUser.email
        }
      });
  
    } catch (error) {
      console.error('The error is:', error);
      res.status(500).json({ message: "Internal Server Error", error: error.message });
    }
  }


const loginWithToken = async (req,res) =>{
  res.json({
    message: 'Valid User'
  });
}


const loginController = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if ((!username && !email) || !password) {
      return res.status(400).json({ message: "Username/Email and password required" });
    }

    // Check for existing user by username or email
    const existingUser = await User.findOne({
      $or: [{ username }, { email }]
    });

    if (!existingUser) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // Compare password
    const isPasswordValid = await bcrypt.compare(password, existingUser.password);
    if (!isPasswordValid) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // Create JWT token
    const token = jwt.sign(
      { id: existingUser._id, username: existingUser.username, email: existingUser.email },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    // Store token in HTTP-only cookie
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 24 * 60 * 60 * 1000 // 1 day
    });

    return res.status(200).json({
      message: "Login successful"
    });

  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};


  module.exports = {
    registerController,
    loginWithToken,
    loginController 

  };