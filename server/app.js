const cors = require("cors");
const express = require("express");
const dotenv = require("dotenv");
dotenv.config();

// Connect Database
require("./config/db");

const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const adminRoutes = require("./routes/adminRoutes");
const deviceRoutes = require("./routes/deviceRoutes");
const policyRoutes = require("./routes/policyRoutes");
const continuousAuthRoutes = require("./routes/continuousAuthRoutes");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/user", userRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/devices", deviceRoutes);
app.use("/api/policies", policyRoutes);
app.use("/api/continuous-auth", continuousAuthRoutes);
app.get("/", (req, res) => {
    res.send("TrustGuard AI Backend Running...");
});


const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});