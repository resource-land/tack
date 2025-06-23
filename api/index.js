const fs = require("fs");
const path = require("path");

const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
  
);

module.exports = async (req, res) => {
  const { data: logs, error } = await supabase.from("logs").select("*").order("time", { ascending: false });

  if (error) {
    console.error(error);
    return res.status(500).send("Failed to load logs");
  }else{
    console.log("Successfully connectd", logs)
  }

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
