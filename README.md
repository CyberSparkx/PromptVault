# 🚀 PromptVault

> **Your personal & community-driven AI prompt library — built with the MERN stack, powered by AI tagging, and ready for export.**

PromptVault is a modern **MERN-stack** web application for **storing, organizing, and sharing AI prompts** with ease.  
Perfect for **creators, developers, and marketers** who want a clean, searchable, and shareable prompt vault — complete with **AI-powered tagging** using Gemini and export-ready formats.

---

## ✨ Features

- 📂 **Personal Vault** – Organize private prompts in folders with AI-generated tags.
- 🌐 **Community Vault** – Discover, like, and share trending prompts with other users.
- 🧠 **AI Tagging** – Categorize prompts automatically using Google’s Gemini API.
- ⚡ **Real-Time Collaboration** *(optional)* – Edit prompts together with Socket.IO.
- 📤 **Export Options** – Download prompts in **JSON, PDF, or Notion-ready formats**.
- 🔒 **Authentication via Auth.js** – Sign in with Google, GitHub, or Email.
- 🎨 **Responsive UI** – Minimal, modern design for desktop and mobile.

---

## 🛠 Tech Stack

**Frontend:**  
- [React.js](https://reactjs.org/)  
- [Vite](https://vitejs.dev/)  
- [Tailwind CSS](https://tailwindcss.com/)  
- [Axios](https://axios-http.com/)  

**Backend:**  
- [Express.js](https://expressjs.com/)  
- [MongoDB](https://www.mongodb.com/) with [Mongoose](https://mongoosejs.com/)  
- [Auth.js](https://authjs.dev/) for authentication  
- [Socket.IO](https://socket.io/) *(optional for live collaboration)*  
- [Gemini API](https://ai.google.dev/) for AI tagging  

---
<p align="center"> <img src="https://img.shields.io/badge/Made%20with-MERN-green?style=for-the-badge" /> <img src="https://img.shields.io/badge/Powered%20by-Gemini-blue?style=for-the-badge" /> <img src="https://img.shields.io/badge/Frontend-Vite-orange?style=for-the-badge" /> </p> 
## 📦 Installation

### 1️⃣ Clone the repository
```bash
git clone https://github.com/CyberSparkx/PromptVault.git
cd PromptVault
# Backend
cd server
npm install

# Frontend
cd ../client
npm install

MONGO_URI=your_mongodb_connection_string
AUTH_SECRET=your_auth_secret
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GEMINI_API_KEY=your_gemini_api_key

# Backend
cd server
npm run dev

# Frontend (in a new terminal)
cd client
npm run dev

🗺 Roadmap
🔍 Advanced search & filtering

📝 Prompt version history

👥 Team-based vaults

📦 More export formats (Markdown, CSV)

📊 Prompt analytics dashboard

🤝 Contributing
We welcome contributions!
Fork the repository, create a feature branch, commit your changes, and submit a pull request.