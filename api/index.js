const fs = require("fs");
const path = require("path");

const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
    "https://khvjvzshyhfoookboaqf.supabase.co", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtodmp2enNoeWhmb29va2JvYXFmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA2OTIyNzIsImV4cCI6MjA2NjI2ODI3Mn0.FdOwlFP05seSbF69ErbFOyM3uO37Rul9vaLCX7bu0tg"
);

module.exports = async (req, res) => {
  const { data: logs, error } = await supabase.from("logs").select("*").order("time", { ascending: false });

  if (error) {
    console.error(error);
    return res.status(500).send("Failed to load logs");
  }else{
    console.log("Successfully connectd", logs)
  }

    const { count, error: countError } = await supabase
    .from("logs")
    .select("emailId", { count: "exact", head: true })
    .eq("tag", "unhcr")
    .neq("emailId", null)
    .distinct();

  if (countError) {
    console.error(countError);
    return res.status(500).send("Failed to count distinct emailIds");
  }

  console.log("Distinct email count:", count);


  const html = `
    <html>
    <head>
      <title>Email Logs</title>
      <style>
        body { font-family: sans-serif; padding: 20px; }
        table { border-collapse: collapse; width: 100%; }
        th, td { border: 1px solid #ccc; padding: 8px; }
        th { background: #eee; }
      </style>
    </head>
    <body>
      <h2>📬 Email Open Logs (from Supabase)</h2>
      <p><strong>Total email open from inbox:</strong> ${count} out of 1470 (${(count/1470)*100}%)</p>
      <table>
        <tr><th>Email ID</th><th>IP</th><th>User-Agent</th><th>Time</th></tr>
        ${logs.map(l => `
          <tr>
            <td>${l.emailId}</td>
            <td>${l.ip}</td>
            <td>${l.userAgent}</td>
            <td>${l.time}</td>
          </tr>`).join("")}
      </table>
    </body>
    </html>
  `;

  res.setHeader("Content-Type", "text/html");
  res.send(html);
};
