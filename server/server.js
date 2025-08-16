const express = require("express");
const app = express();
const connectDB = require("./src/db/db");
const cookieParser = require("cookie-parser");
require("dotenv").config();
const { registerRoute, loginRoute } = require("./src/routes/auth.route");
const projectCreaterRoute = require("./src/routes/projects.route");
const promptRoute = require("./src/routes/prompts.route");
const exportRoute = require("./src/routes/export.route");

connectDB();
app.use(express.json());
app.use(cookieParser());

// Routes
app.get("/", (req, res) => {
	res.send({
		message: "Hello From Backend",
	});
});

app.use("/api/auth/", registerRoute);
app.use("/api/auth/", loginRoute);
app.use("/api/", projectCreaterRoute);
app.use("/api/", promptRoute);
app.use("/api/export/", exportRoute);

app.listen(3000, () => {
	console.log("The Server is running on port 3000");
});

