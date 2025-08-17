const Prompt = require("../models/prompt.model");
const User = require("../models/user.model");
const { jsPDF } = require("jspdf");

// ---------- EXPORT SINGLE PROMPT AS JSON ----------
const exportPromptJson = async (req, res) => {
	try {
		const promptId = req.query.id;
		if (!promptId)
			return res.status(400).json({ message: "Prompt id required" });

		const prompt = await Prompt.findById(promptId);
		if (!prompt) return res.status(404).json({ message: "Prompt not found" });

		res.setHeader(
			"Content-Disposition",
			`attachment; filename=${prompt.title}.json`,
		);
		res.setHeader("Content-Type", "application/json");
		res.send(JSON.stringify(prompt, null, 2));
	} catch (error) {
		console.error(error);
		res.status(500).json({ message: "Error exporting prompt JSON" });
	}
};

// ---------- EXPORT SINGLE PROMPT AS PDF (App style) ----------
const exportPromptPdf = async (req, res) => {
	try {
		const promptId = req.query.id;
		if (!promptId)
			return res.status(400).json({ message: "Prompt id required" });

		const prompt = await Prompt.findById(promptId);
		if (!prompt) return res.status(404).json({ message: "Prompt not found" });

		const doc = new jsPDF("p", "mm", "a4");
		let y = 20;

		// Title
		doc.setFont("helvetica", "bold");
		doc.setFontSize(20);
		doc.text(prompt.title, 15, y);

		y += 10;

		// Username
		doc.setFont("helvetica", "normal");
		doc.setFontSize(12);
		doc.text(`by @${prompt.username || "unknown"}`, 15, y);

		y += 10;

		// Prompt
		doc.setFont("courier", "normal");
		doc.setFontSize(12);
		const promptLines = doc.splitTextToSize(prompt.prompt, 180);
		doc.text(promptLines, 15, y);

		y += promptLines.length * 7 + 10;

		// Tags
		if (prompt.tags && prompt.tags.length > 0) {
			doc.setFont("helvetica", "bold");
			doc.setFontSize(11);
			doc.text("Tags:", 15, y);
			doc.setFont("helvetica", "normal");
			doc.setFontSize(11);
			doc.text(prompt.tags.map((tag) => `#${tag}`).join(", "), 30, y);
			y += 10;
		}

		// Date
		doc.setFont("helvetica", "normal");
		doc.setFontSize(10);
		const dateStr = prompt.date
			? new Date(prompt.date).toLocaleDateString()
			: new Date().toLocaleDateString();
		doc.text(`Date: ${dateStr}`, 15, y);

		const pdfData = doc.output("arraybuffer");
		res.setHeader("Content-Type", "application/pdf");
		res.setHeader(
			"Content-Disposition",
			`attachment; filename=${prompt.title}.pdf`,
		);
		res.send(Buffer.from(pdfData));
	} catch (error) {
		console.error(error);
		res.status(500).json({ message: "Error exporting prompt PDF" });
	}
};

// ---------- EXPORT ALL USER PROMPTS AS JSON ----------
const exportJson = async (req, res) => {
	try {
		const userId = req.user.id;
		const user = await User.findById(userId).populate("prompts");

		if (!user) return res.status(404).json({ message: "User not found" });

		res.setHeader("Content-Disposition", "attachment; filename=prompts.json");
		res.setHeader("Content-Type", "application/json");
		res.send(JSON.stringify(user.prompts, null, 2));
	} catch (error) {
		console.error(error);
		res.status(500).json({ message: "Error exporting JSON" });
	}
};

// ---------- EXPORT ALL USER PROMPTS AS PDF ----------
const exportPdf = async (req, res) => {
	try {
		const userId = req.user.id;
		const user = await User.findById(userId).populate("prompts");

		if (!user) return res.status(404).json({ message: "User not found" });

		const doc = new jsPDF();

		doc.setFontSize(14);
		doc.text(`Prompts Export for ${user.username}`, 10, 10);

		let y = 20;
		user.prompts.forEach((p, i) => {
			doc.setFontSize(12);
			doc.text(`${i + 1}. ${p.title}`, 10, y);
			y += 7;
			doc.setFontSize(10);
			doc.text(`Prompt: ${p.prompt}`, 10, y);
			y += 10;
		});

		const pdfData = doc.output("arraybuffer");

		res.setHeader("Content-Type", "application/pdf");
		res.setHeader("Content-Disposition", "attachment; filename=prompts.pdf");
		res.send(Buffer.from(pdfData));
	} catch (error) {
		console.error(error);
		res.status(500).json({ message: "Error exporting PDF" });
	}
};

module.exports = { exportJson, exportPdf, exportPromptJson, exportPromptPdf };
