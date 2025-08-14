const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/user.model.js");

const registerController = async (req, res) => {
	try {
		const { username, email, password } = req.body;

		// Check for existing user
		const existingUser = await User.findOne({ $or: [{ username }, { email }] });
		if (existingUser) {
			return res
				.status(400)
				.json({ message: "Username or Email already exists" });
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
			projects: [],
		});

		await newUser.save();

		// Generate JWT (include email for consistency)
		const token = jwt.sign(
			{ id: newUser._id, username: newUser.username, email: newUser.email },
			process.env.JWT_SECRET,
			{ expiresIn: "1d" },
		);

		// Save token in cookie
		res.cookie("token", token, {
			httpOnly: true, // prevents JS access
			secure: process.env.NODE_ENV === "production", // HTTPS only in prod
			sameSite: "lax", // works well across localhost ports
			maxAge: 24 * 60 * 60 * 1000, // 1 day
			path: "/",
		});

		res.status(201).json({
			message: "User registered successfully",
			// token: token, // optional: better not to return token in body
			user: {
				id: newUser._id,
				username: newUser.username,
				email: newUser.email,
			},
		});
	} catch (error) {
		console.error("The error is:", error);
		res
			.status(500)
			.json({ message: "Internal Server Error", error: error.message });
	}
};

const loginWithToken = async (req, res) => {
	try {
		// verifyToken sets req.user from JWT payload
		const { id, username, email } = req.user || {};

		// If email missing in token (older tokens), fetch from DB
		let finalEmail = email;
		if (!finalEmail && id) {
			const dbUser = await User.findById(id).select("email username");
			if (dbUser) {
				finalEmail = dbUser.email;
			}
		}

		if (!id || !username) {
			return res.status(401).json({ message: "Invalid session" });
		}

		return res.json({
			message: "Valid User",
			user: {
				id,
				username,
				email: finalEmail || null,
			},
		});
	} catch (err) {
		console.error("loginWithToken error:", err);
		return res.status(500).json({ message: "Internal server error" });
	}
};

const loginController = async (req, res) => {
	try {
		const { username, email, password } = req.body;

		if ((!username && !email) || !password) {
			return res
				.status(400)
				.json({ message: "Username/Email and password required" });
		}

		// Check for existing user by username or email
		const existingUser = await User.findOne({
			$or: [{ username }, { email }],
		});

		if (!existingUser) {
			return res.status(400).json({ message: "Invalid credentials" });
		}

		// Compare password
		const isPasswordValid = await bcrypt.compare(
			password,
			existingUser.password,
		);
		if (!isPasswordValid) {
			return res.status(400).json({ message: "Invalid credentials" });
		}

		// Create JWT token (include email)
		const token = jwt.sign(
			{
				id: existingUser._id,
				username: existingUser.username,
				email: existingUser.email,
			},
			process.env.JWT_SECRET,
			{ expiresIn: "1d" },
		);

		// Store token in HTTP-only cookie
		res.cookie("token", token, {
			httpOnly: true,
			secure: process.env.NODE_ENV === "production",
			sameSite: "lax",
			maxAge: 24 * 60 * 60 * 1000, // 1 day
			path: "/",
		});

		return res.status(200).json({
			message: "Login successful",
			user: {
				id: existingUser._id,
				username: existingUser.username,
				email: existingUser.email,
			},
		});
	} catch (error) {
		console.error("Login error:", error);
		return res.status(500).json({ message: "Internal server error" });
	}
};

const logoutController = (req, res) => {
	res.clearCookie("token", {
		httpOnly: true,
		sameSite: process.env.NODE_ENV === "production" ? "lax" : "lax",
		secure: process.env.NODE_ENV === "production",
		path: "/",
	});
	return res.json({ message: "Logged out" });
};

module.exports = {
	registerController,
	loginWithToken,
	loginController,
	logoutController,
};

