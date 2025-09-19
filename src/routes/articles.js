const express = require("express");
const jwt = require("jsonwebtoken");
const slugify = require("slugify");
const multer = require("multer");
const path = require("path");
const Article = require("../models/Article");

const router = express.Router();

// ================== Multer Config (for image uploads) ==================
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, "..", "..", "uploads")); // always inside backend/uploads
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({ storage });

// ================== Middleware to verify token ==================
function verifyToken(req, res, next) {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "Missing token" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.id;
    req.userRole = decoded.role;
    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid token" });
  }
}

// ================== CRUD ROUTES ==================

// CREATE article (with optional image, tags, and status)
router.post("/", verifyToken, upload.single("image"), async (req, res) => {
  try {
    const { title, content, tags, status } = req.body;

    if (!title || !content) {
      return res.status(400).json({ error: "Title and content are required" });
    }

    // ✅ Generate slug (supports Unicode)
    let slug = slugify(title, {
      lower: true,
      strict: false,
      locale: "en",
    });

    // ✅ Ensure slug is unique
    let existing = await Article.findOne({ slug });
    if (existing) slug = `${slug}-${Date.now()}`;

    // ✅ Handle uploaded image
    const imageUrl = req.file ? `/uploads/${req.file.filename}` : null;

    // ✅ Handle tags (comma-separated → array)
    const tagsArray = tags ? tags.split(",").map((t) => t.trim()) : [];

    // ✅ Editors can only create drafts
    let finalStatus = "draft";
    if (req.userRole === "admin" && status === "published") {
      finalStatus = "published";
    }

    const article = new Article({
      title,
      content,
      slug,
      imageUrl,
      tags: tagsArray,
      status: finalStatus,
      author: req.userId || null,
    });

    await article.save();
    res.json({ message: "✅ Article created successfully", article });
  } catch (err) {
    console.error("Article creation error:", err);
    res.status(500).json({ error: "Server error", details: err.message });
  }
});

// READ all articles
router.get("/", async (req, res) => {
  try {
    const filter = {};
    if (req.query.status) filter.status = req.query.status;

    const articles = await Article.find(filter)
      .populate("author", "username role")
      .sort({ createdAt: -1 });

    res.json({ articles });
  } catch (err) {
    console.error("Fetch articles error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// READ single article by slug
router.get("/slug/:slug", async (req, res) => {
  try {
    const article = await Article.findOne({ slug: req.params.slug }).populate(
      "author",
      "username role"
    );
    if (!article) return res.status(404).json({ error: "Article not found" });

    res.json(article);
  } catch (err) {
    console.error("Fetch article by slug error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// READ single article by ID
router.get("/:id", async (req, res) => {
  try {
    const article = await Article.findById(req.params.id).populate(
      "author",
      "username role"
    );
    if (!article) return res.status(404).json({ error: "Article not found" });

    res.json(article);
  } catch (err) {
    console.error("Fetch article error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// UPDATE article (with optional new image, tags, and status)
router.put("/:id", verifyToken, upload.single("image"), async (req, res) => {
  try {
    const { title, content, tags, status } = req.body;
    const updateData = {};

    if (title) {
      updateData.title = title;
      let newSlug = slugify(title, { lower: true, strict: false, locale: "en" });
      const existing = await Article.findOne({ slug: newSlug });
      if (existing && existing._id.toString() !== req.params.id) {
        newSlug = `${newSlug}-${Date.now()}`;
      }
      updateData.slug = newSlug;
    }

    if (content) updateData.content = content;

    if (req.file) {
      updateData.imageUrl = `/uploads/${req.file.filename}`;
    }

    if (tags) {
      updateData.tags = tags.split(",").map((t) => t.trim());
    }

    // ✅ Editors cannot publish
    if (status && req.userRole === "admin") {
      updateData.status = status;
    }

    const article = await Article.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
    });

    if (!article) return res.status(404).json({ error: "Article not found" });

    res.json({ message: "✅ Article updated successfully", article });
  } catch (err) {
    console.error("Update article error:", err);
    res.status(500).json({ error: "Server error", details: err.message });
  }
});

// DELETE article
router.delete("/:id", verifyToken, async (req, res) => {
  try {
    const article = await Article.findByIdAndDelete(req.params.id);
    if (!article) return res.status(404).json({ error: "Article not found" });

    res.json({ message: "🗑️ Article deleted successfully" });
  } catch (err) {
    console.error("Delete article error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// ================== ADMIN: Publish / Unpublish Article ==================
router.patch("/:id/publish", verifyToken, async (req, res) => {
  try {
    if (req.userRole !== "admin") {
      return res.status(403).json({ error: "Access denied. Admins only." });
    }

    const { status } = req.body;
    if (!["draft", "published"].includes(status)) {
      return res.status(400).json({ error: "Invalid status value" });
    }

    const article = await Article.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (!article) return res.status(404).json({ error: "Article not found" });

    res.json({
      message: `✅ Article ${status === "published" ? "published" : "set to draft"} successfully`,
      article,
    });
  } catch (err) {
    console.error("Publish/unpublish article error:", err);
    res.status(500).json({ error: "Server error", details: err.message });
  }
});

module.exports = router;
