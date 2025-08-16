const express = require("express");
const router = express.Router();
const { exportPdf, exportJson } = require("../controllers/export.controller");
const verifyToken = require("../middleware/authenticator.middleware");

// Export prompts as PDF
router.get("/pdf", verifyToken, exportPdf);

// Export prompts as JSON
router.get("/json", verifyToken, exportJson);

// Export prompts to Notion
// router.get("/notion", verifyToken, exportNotion);

module.exports = router;
