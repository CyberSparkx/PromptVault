const { GoogleGenAI } = require("@google/genai");

const ai = new GoogleGenAI({});

const aiTagGenerator = async (prompt) => {
	const response = await ai.models.generateContent({
		model: "gemini-2.5-flash",
		contents: `Suggest exactly 3 relevant tags for this prompt: "${prompt}". 
      Return only the tags, separated by commas. No explanation, no extra text.`,
	});
	const tagsArr = response.text
		.split(",")
		.map((tag) => tag.trim())
		.filter((tag) => !!tag);
	return tagsArr;
};

module.exports = aiTagGenerator;

