const  {GoogleGenAI} = require("@google/genai");

const ai = new GoogleGenAI({});

const aiTagGenerator = async (prompt) => {
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: `Suggest exactly 5 relevant tags for this prompt: "${prompt}". 
                 Return only the tags, separated by commas. No explanation, no extra text.`,
  });
  return(response.text);
}

module.exports = aiTagGenerator;