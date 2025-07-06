const fs = require("fs");
const path = require("path");
const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
  "https://khvjvzshyhfoookboaqf.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtodmp2enNoeWhmb29va2JvYXFmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA2OTIyNzIsImV4cCI6MjA2NjI2ODI3Mn0.FdOwlFP05seSbF69ErbFOyM3uO37Rul9vaLCX7bu0tg"
);

const imageMap = {
  default: "pixel.png",
  alt: "pixel-alt.png",
  protest: "pixel-protest.png",
  red: "pixel-red.png",
  green: "pixel-green.png",
  // Add more types as needed
};

module.exports = async (req, res) => {
  try {
    const emailId = req.query.emailId || "unknown";
    const type = req.query.type || "default";

    const logEntry = {
      emailId,
      ip: req.headers["x-forwarded-for"] || req.socket.remoteAddress,
      userAgent: req.headers["user-agent"],
      time: new Date().toISOString(),
    };

    const { error } = await supabase.from("logs").insert([logEntry]);

    if (error) {
      console.error("Supabase Error:", error);
    } else {
      console.log("Logged entry:", logEntry);
    }

    // Safe fallback for imageFile
    const imageFile = imageMap[type] || imageMap["default"];
    const imgPath = path.join(__dirname, "..", imageFile);

    console.log("__dirname:", __dirname);
    console.log("imageFile:", imageFile);
    console.log("imgPath:", imgPath);

    if (!fs.existsSync(imgPath)) {
      console.error("Image not found at path:", imgPath);
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
