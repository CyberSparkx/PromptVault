const express = require("express");
const router = express.Router();
const {
	exportPromptPdf,
	exportPromptJson,
	exportPdf,
	exportJson,
} = require("../controllers/export.controller");
const verifyToken = require("../middleware/authenticator.middleware");

// Single prompt PDF/JSON export
router.get("/export/pdf", verifyToken, exportPromptPdf);
router.get("/export/json", verifyToken, exportPromptJson);

// All prompts PDF/JSON export (user-wise)
router.get("/pdf", verifyToken, exportPdf);
router.get("/json", verifyToken, exportJson);

module.exports = router;
