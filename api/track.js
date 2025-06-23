const fs = require("fs");
const path = require("path");
const { createClient } = require("@supabase/supabase-js");
const { error } = require("console");

const supabase = createClient(
    "https://khvjvzshyhfoookboaqf.supabase.co", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtodmp2enNoeWhmb29va2JvYXFmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA2OTIyNzIsImV4cCI6MjA2NjI2ODI3Mn0.FdOwlFP05seSbF69ErbFOyM3uO37Rul9vaLCX7bu0tg"
);

module.exports = async (req, res) => {
  try {
    const emailId = req.query.emailId || "unknown";

    const logEntry = {
      emailId,
      ip: req.headers["x-forwarded-for"] || req.socket.remoteAddress,
      userAgent: req.headers["user-agent"],
      time: new Date().toISOString()
    };

    // Save to Supabase
    await supabase.from("logs").insert([logEntry]);

    if(error){
      console.error(error);
      console.log("error")
      //return res.status(500).send("Failed to load logs");
    }else{
      console.log("No error to load images", logEntry)
    }

    // Serve image
    const imgPath = path.join(__dirname, "..", "pixel.png");
    const img = fs.readFileSync(imgPath);
    res.setHeader("Content-Type", "image/png");
    return res.status(200).send(img);
  } catch (err) {
    console.error("Error:", err);
    return res.status(500).send("Error");
  }
};
