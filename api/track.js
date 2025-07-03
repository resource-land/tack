const fs = require("fs");
const path = require("path");
const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
  "https://khvjvzshyhfoookboaqf.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtodmp2enNoeWhmb29va2JvYXFmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA2OTIyNzIsImV4cCI6MjA2NjI2ODI3Mn0.FdOwlFP05seSbF69ErbFOyM3uO37Rul9vaLCX7bu0tg"
);

module.exports = async (req, res) => {
  try {
    const emailId = req.query.emailId || "unknown";
    const type = req.query.type || "default"; // NEW: Add a type param to decide which image to serve

    const logEntry = {
      emailId,
      ip: req.headers["x-forwarded-for"] || req.socket.remoteAddress,
      userAgent: req.headers["user-agent"],
      time: new Date().toISOString(),
    };

    // Save to Supabase
    const { error } = await supabase.from("logs").insert([logEntry]);

    if (error) {
      console.error("Supabase Error:", error);
    } else {
      console.log("Logged entry:", logEntry);
    }

    // Serve different images based on 'type'
    const imageFile = type === "alt" ? "pixel-alt.png" : "pixel.png";
    const imgPath = path.join(__dirname, "..", imageFile);

    if (!fs.existsSync(imgPath)) {
      return res.status(404).send("Image not found");
    }

    const img = fs.readFileSync(imgPath);
    res.setHeader("Content-Type", "image/png");
    return res.status(200).send(img);
  } catch (err) {
    console.error("Handler Error:", err);
    return res.status(500).send("Internal Server Error");
  }
};
