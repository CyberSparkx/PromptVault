const express = require("express");
const router = express.Router();
const {
	registerController,
	loginWithToken,
	loginController,
	logoutController,
} = require("../controllers/auth.controller.js");
const verifyToken = require("../middleware/authenticator.middleware.js");

router.post("/register", registerController);
router.get("/login", verifyToken, loginWithToken);
router.post("/login", loginController);
router.post("/logout", verifyToken, logoutController);

module.exports = {
	registerRoute: router,
	loginRoute: router,
	loginWithTokenRoute: router,
};
