const express = require("express");
const dotenv = require("dotenv");

dotenv.config();

const app = express();

// Connect Database
require("./config/db");

app.use(express.json());

app.get("/", (req, res) => {
    res.send("TrustGuard AI Backend Running...");
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});