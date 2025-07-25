const fs = require("fs");
const path = require("path");
const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
  "https://khvjvzshyhfoookboaqf.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtodmp2enNoeWhmb29va2JvYXFmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA2OTIyNzIsImV4cCI6MjA2NjI2ODI3Mn0.FdOwlFP05seSbF69ErbFOyM3uO37Rul9vaLCX7bu0tg"
);

// 1. Define a mapping of query parameters to their respective files.
// To add a new one, just add a new line here.
const imageConfig = {
  unhcr: "unhcr.png",
  mileston: "milestone.png",
  // --- Add as many new types as you need ---
  // Example:
  // "welcome-email": "welcome_banner.jpg",
  // "promo-q3": "promo_q3.gif",
};

// 2. Specify a fallback image in case an unknown type is requested.
const defaultImageFile = "default_pixel.png"; // A 1x1 transparent pixel is recommended

module.exports = async (req, res) => {
  try {
    // Get the type from the query, or use 'unknown' if not provided
    const type = req.query.type || "unknown";
    const emailId = req.query.emailId || "unknown";

    // The data to be logged is the same regardless of the image served
    const logEntry = {
      emailId,
      ip: req.headers["x-forwarded-for"] || req.socket.remoteAddress,
      userAgent: req.headers["user-agent"],
      time: new Date().toISOString(),
      tag: type, // The tag is the type requested by the user
    };

    // Save the log entry to your database
    const { error } = await supabase.from("logs").insert([logEntry]);
    if (error) {
      console.error("Supabase Error:", error);
      // We still try to serve an image even if logging fails
    }

    // 3. Look up the filename from the config object.
    // If the type isn't found in imageConfig, use the default file.
    const imageFile = imageConfig[type] || defaultImageFile;
    const imgPath = path.join(__dirname, "..", imageFile);

    if (!fs.existsSync(imgPath)) {
      console.error(`Image not found on server: ${imageFile}`);
      // If the configured file is missing, you might want to send a generic error
      // or serve the default pixel as a final fallback.
      return res.status(404).send("Image asset not found on server.");
    }
    
    // 4. Determine the correct Content-Type from the file extension
    const getMimeType = (file) => {
      switch (path.extname(file).toLowerCase()) {
        case ".png": return "image/png";
        case ".jpg":
        case ".jpeg": return "image/jpeg";
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
