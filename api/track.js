const fs = require("fs");
const path = require("path");

// --- Vercel Build Trick ---
// This block's only purpose is to force the Vercel bundler to include these files.
// It tells the build system that these files are dependencies.
try {
  fs.readFileSync(path.join(__dirname, 'unhcr.png'));
  fs.readFileSync(path.join(__dirname, 'milestone.png'));
  fs.readFileSync(path.join(__dirname, 'pixel.png'));
  fs.readFileSync(path.join(__dirname, 'USA_tarif.png'));
  fs.readFileSync(path.join(__dirname, 'Auguest.png'));
  fs.readFileSync(path.join(__dirname, 'onePixel.png'));
  fs.readFileSync(path.join(__dirname, 'FailureGovt.png'));
  fs.readFileSync(path.join(__dirname, 'cardEng.png'));
} catch (e) {
  // This block might show an error in a local terminal, which is okay.
  // It's not meant to run successfully, only to guide the Vercel deployment.
}
// --- End of Trick ---


const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
  "https://khvjvzshyhfoookboaqf.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtodmp2enNoeWhmb29va2JvYXFmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA2OTIyNzIsImV4cCI6MjA2NjI2ODI3Mn0.FdOwlFP05seSbF69ErbFOyM3uO37Rul9vaLCX7bu0tg"
);

// This configuration matches your file structure screenshot
const imageConfig = {
  unhcr: "unhcr.png",
  milestone: "milestone.png",
  pixel: "pixel.png",
  usaTarif: "USA_tarif.png",
  auguest: 'Auguest.png',
  failureGovt: 'FailureGovt.png',
  onePixel: 'onePixel.png',
  inviteCard: 'cardEng.png',
};

const defaultImageFile = "pixel.png";

module.exports = async (req, res) => {
  try {
    const type = req.query.type || "unknown";
    const emailId = req.query.emailId || "unknown";

    const logEntry = {
      emailId,
      time: new Date().toISOString(),
      tag: type,
    };

    await supabase.from("logs").insert([logEntry]);

    const imageFile = imageConfig[type] || defaultImageFile;
    const imgPath = path.join(__dirname, imageFile);

    if (!fs.existsSync(imgPath)) {
      console.error(`CRITICAL: The file system check failed for path: ${imgPath}`);
      return res.status(500).send(`Server error: Image file "${imageFile}" was not found in the deployment. Please check build logs.`);
    }

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