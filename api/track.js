const fs = require("fs");
const path = require("path");
const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
  "https://khvjvzshyhfoookboaqf.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtodmp2enNoeWhmb29va2JvYXFmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA2OTIyNzIsImV4cCI6MjA2NjI2ODI3Mn0.FdOwlFP05seSbF69ErbFOyM3uO37Rul9vaLCX7bu0tg"
);

// Define your mapping of types to filenames
const imageConfig = {
  unhcr: "unhcr.png",
  mileston: "milestone.png",
  // Add more types and their corresponding image files here
};

// A fallback image in case the type is not found
const defaultImageFile = "milestone.png"; // Or a dedicated 1x1 pixel

module.exports = async (req, res) => {
  try {
    const type = req.query.type || "unknown";
    const emailId = req.query.emailId || "unknown";

    const logEntry = {
      emailId,
      ip: req.headers["x-forwarded-for"] || req.socket.remoteAddress,
      userAgent: req.headers["user-agent"],
      time: new Date().toISOString(),
      tag: type,
    };

    // Save log to database
    await supabase.from("logs").insert([logEntry]);

    // --- The only line that really changes is below ---
    const imageFile = imageConfig[type] || defaultImageFile;
    // The path is simpler now because the images are in the same directory.
    const imgPath = path.join(__dirname, imageFile);

    if (!fs.existsSync(imgPath)) {
      // This error shouldn't happen if you moved the files correctly
      return res.status(404).send("Image not found");
    }
    
    // Determine Content-Type automatically
    const getMimeType = (file) => {
      switch (path.extname(file).toLowerCase()) {
        case ".png": return "image/png";
        case ".jpg": case ".jpeg": return "image/jpeg";
        case ".gif": return "image/gif";
        default: return "application/octet-stream";
      }
    };
    
    const img = fs.readFileSync(imgPath);
    res.setHeader("Content-Type", getMimeType(imageFile));
    return res.status(200).send(img);

  } catch (err) {
    console.error("Handler Error:", err);
    return res.status(500).send("Internal Server Error");
  }
};