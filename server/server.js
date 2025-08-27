require("dotenv").config();
const express = require("express");
const app = express();
const connectDB = require("./src/db/db");
const cookieParser = require("cookie-parser");
const cors = require("cors");

app.use(
	cors({
		origin: process.env.FRONTEND_URL || "http://localhost:5173",
		credentials: true,
	}),
);

const { registerRoute, loginRoute } = require("./src/routes/auth.route");
const projectCreaterRoute = require("./src/routes/projects.route");
const promptRoute = require("./src/routes/prompts.route");
const exportRoute = require("./src/routes/export.route");

connectDB();
app.use(express.json());
app.use(cookieParser());

app.get("/", (req, res) => {
	res.send({
		message: "Hello From Backend",
	});
});

app.use("/api/auth/", registerRoute);
app.use("/api/auth/", loginRoute);
app.use("/api/", projectCreaterRoute);
app.use("/api/", promptRoute);
app.use("/api/prompts/", exportRoute);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
	console.log(`The Server is running on port ${PORT}`);
});
