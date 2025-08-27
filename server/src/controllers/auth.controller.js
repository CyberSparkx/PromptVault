const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/user.model.js");

const registerController = async (req, res) => {
	try {
		const { username, email, password } = req.body;

		const existingUser = await User.findOne({ $or: [{ username }, { email }] });
		if (existingUser) {
			return res
				.status(400)
				.json({ message: "Username or Email already exists" });
		}

		const hashedPassword = await bcrypt.hash(password, 10);
		if (!hashedPassword) {
			return res.status(500).json({ message: "Something Went Wrong" });
		}

		const newUser = new User({
			username,
			email,
			password: hashedPassword,
			prompts: [],
			projects: [],
		});

		await newUser.save();

		const token = jwt.sign(
			{ id: newUser._id, username: newUser.username, email: newUser.email },
			process.env.JWT_SECRET,
			{ expiresIn: "1d" },
		);

		res.cookie("token", token, {
			httpOnly: true,
			secure: process.env.NODE_ENV === "production",
			sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
			maxAge: 24 * 60 * 60 * 1000,
			path: "/",
			...(process.env.NODE_ENV === "production" && { partitioned: true }),
		});

		res.status(201).json({
			message: "User registered successfully",
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
		const { id, username, email } = req.user || {};

		let finalEmail = email;
		if (!finalEmail && id) {
			const dbUser = await User.findById(id).select("email username");
			if (dbUser) {
				finalEmail = dbUser.email;
			}
		}

		if (!id || !username) {
			return res.json({ message: "Invalid session" });
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

		const existingUser = await User.findOne({
			$or: [{ username }, { email }],
		});

		if (!existingUser) {
			return res.status(400).json({ message: "Invalid credentials" });
		}

		const isPasswordValid = await bcrypt.compare(
			password,
			existingUser.password,
		);
		if (!isPasswordValid) {
			return res.status(400).json({ message: "Invalid credentials" });
		}

		const token = jwt.sign(
			{
				id: existingUser._id,
				username: existingUser.username,
				email: existingUser.email,
			},
			process.env.JWT_SECRET,
			{ expiresIn: "1d" },
		);

		res.cookie("token", token, {
			httpOnly: true,
			secure: process.env.NODE_ENV === "production",
			sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
			maxAge: 24 * 60 * 60 * 1000,
			path: "/",
			...(process.env.NODE_ENV === "production" && { partitioned: true }),
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
		secure: process.env.NODE_ENV === "production",
		sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
		path: "/",
		...(process.env.NODE_ENV === "production" && { partitioned: true }),
	});
	return res.json({ message: "Logged out" });
};

module.exports = {
	registerController,
	loginWithToken,
	loginController,
	logoutController,
};
