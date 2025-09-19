const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const mongoSanitize = require("express-mongo-sanitize");
const path = require("path");
const authRoutes = require("./routes/auth");
const articleRoutes = require("./routes/articles");

const app = express();

// ================== Security Middlewares ==================
app.use(helmet()); // secure HTTP headers

// Body parsers
app.use(express.json({ limit: "2mb" })); // JSON payloads
app.use(express.urlencoded({ extended: true })); // Form-data text fields

// Sanitize user input (prevent MongoDB injection)
app.use(mongoSanitize());

// ================== CORS ==================
// In production, replace allowed origins with your frontend/admin-panel domains
const corsOptions = {
  origin: (origin, callback) => {
    const allowed = [
      undefined, // allow curl/postman
      "http://localhost:3000", // frontend (Next.js)
      "http://localhost:3001", // admin-panel (React)
    ];
    if (allowed.includes(origin)) callback(null, true);
    else callback(new Error("Not allowed by CORS"));
  },
  credentials: true,
};
app.use(cors(corsOptions));

// ================== Rate Limiter ==================
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min window
  max: 20, // limit to 20 requests per IP
  message: "Too many requests from this IP, please try again later.",
});
app.use("/auth", authLimiter);

// ================== Routes ==================
app.use("/auth", authRoutes);
app.use("/articles", articleRoutes);

// ================== Static Files ==================
// Serve uploaded images from /uploads
app.use("/uploads", express.static(path.join(__dirname, "..", "uploads")));

// ================== Root Endpoint ==================
app.get("/", (req, res) => {
  res.json({ message: "API is running" });
});

module.exports = app;
