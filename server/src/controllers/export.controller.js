const Prompt = require("../models/prompt.model");
const User = require("../models/user.model");
const { jsPDF } = require("jspdf"); // for PDF
const fs = require("fs");
const { Client } = require("@notionhq/client"); // Notion SDK

// ---------- EXPORT AS JSON ----------
const exportJson = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId).populate("prompts");

    if (!user) return res.status(404).json({ message: "User not found" });

    res.setHeader("Content-Disposition", "attachment; filename=prompts.json");
    res.json(user.prompts);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error exporting JSON" });
  }
};

// ---------- EXPORT AS PDF ----------
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

    const pdfData = doc.output();

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", "attachment; filename=prompts.pdf");
    res.send(Buffer.from(pdfData, "binary"));
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error exporting PDF" });
  }
};

// ---------- EXPORT TO NOTION ----------
// const exportNotion = async (req, res) => {
//   try {
//     const userId = req.user.id;
//     const user = await User.findById(userId).populate("prompts");

//     if (!user) return res.status(404).json({ message: "User not found" });

//     // Initialize Notion client (make sure NOTION_TOKEN & NOTION_DB_ID in .env)
//     const notion = new Client({ auth: process.env.NOTION_TOKEN });
//     const databaseId = process.env.NOTION_DB_ID;

//     for (const p of user.prompts) {
//       await notion.pages.create({
//         parent: { database_id: databaseId },
//         properties: {
//           Title: {
//             title: [{ text: { content: p.title } }],
//           },
//           Prompt: {
//             rich_text: [{ text: { content: p.prompt } }],
//           },
//           Tags: {
//             multi_select: p.tags.map(tag => ({ name: tag })),
//           },
//           Username: {
//             rich_text: [{ text: { content: user.username } }],
//           },
//         },
//       });
//     }

//     res.json({ message: "Prompts exported to Notion successfully" });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ message: "Error exporting to Notion" });
//   }
// };

module.exports = { exportJson, exportPdf };
