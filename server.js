const express = require("express");
const multer = require("multer");
const mongoose = require("mongoose");
const path = require("path");
const bodyParser = require("body-parser");
const File = require("./models/File"); // Import the File model
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.static("public")); 


// Middleware
app.set("view engine", "ejs"); // Set EJS as the template engine
app.use(express.static("uploads")); // Serve uploaded files statically
app.use(bodyParser.urlencoded({ extended: true }));

// Connect to MongoDB
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("MongoDB connection error:", err));

// Multer Storage Configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "./uploads"); // Specify uploads directory
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`); // Rename uploaded file
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // Limit file size to 5MB
  fileFilter: (req, file, cb) => {
    const fileTypes = /jpeg|jpg|png|gif/; // Allowed file types
    const extname = fileTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = fileTypes.test(file.mimetype);

    if (extname && mimetype) {
      cb(null, true);
    } else {
      cb(new Error("Only image files (jpeg, jpg, png, gif) are allowed"));
    }
  },
});

// Routes

// Home route to render the file upload form
app.get("/", (req, res) => {
  res.render("upload");
});

// Handle file upload
app.post("/upload", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).render("upload", { error: "No file uploaded" });
    }

    // Save file details to MongoDB
    const file = new File({
      filename: req.file.originalname,
      filepath: `/uploads/${req.file.filename}`,
      filetype: req.file.mimetype,
      size: req.file.size,
    });

    await file.save();

    // Render success page
    res.render("success", { file });
  } catch (err) {
    res.status(500).render("upload", { error: "Error uploading file" });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
