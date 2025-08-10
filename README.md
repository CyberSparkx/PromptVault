# 🚀 PromptVault

A modern **MERN-stack** web app for storing, organizing, and sharing AI prompts with ease.  
Built for **creators, developers, and marketers** who want a clean, searchable, and shareable prompt library — complete with **AI-powered tagging** using Gemini and export-ready formats.

---

## ✨ Features

- 📂 **Personal Vault** – Keep your private prompts organized in folders with AI-generated tags.
- 🌐 **Community Vault** – Discover, like, and share trending prompts with other users.
- 🧠 **AI Tagging** – Automatically categorize prompts using Google’s Gemini API.
- ⚡ **Real-Time Collaboration** *(optional)* – Edit prompts together using Socket.IO.
- 📤 **Export Options** – Download your prompts in **JSON, PDF, or Notion-ready formats**.
- 🎨 **Responsive UI** – Clean and minimal design for desktop and mobile.

---

## 🛠 Tech Stack

**Frontend:**  
- React.js  
- Tailwind CSS  
- Axios  

**Backend:**  
- Express.js  
- MongoDB (Mongoose)  
- Auth.js  
- Socket.IO *(optional for live collaboration)*  
- Gemini API for AI tagging  

---

## 📦 Installation

### 1️⃣ Clone the repository
```bash
git clone https://github.com/YourUsername/promptvault.git
cd promptvault
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
MONGO_URI=your_mongodb_connection_string
AUTH_SECRET=your_auth_secret
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GEMINI_API_KEY=your_gemini_api_key
# Backend
cd backend
npm run dev

# Frontend
cd ../frontend
npm run dev

🤝 Contributing
Contributions are welcome!
Fork the repo, make your changes, and submit a pull request.


---

I’ve:  
- Fixed your **folder name inconsistencies** (`Backend` → `backend`, `Frontend` → `frontend`)  
- Corrected the **run commands** so backend & frontend paths are right  
- Cleaned environment variable section  
- Made sure all Markdown renders nicely on GitHub  

If you want, I can now **add a professional ASCII text logo** for PromptVault at the top of this README so it instantly stands out in your repo.
