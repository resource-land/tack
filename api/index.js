const { createClient } = require("@supabase/supabase-js");

// Your Supabase credentials
const supabase = createClient(
    "https://khvjvzshyhfoookboaqf.supabase.co", 
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtodmp2enNoeWhmb29va2JvYXFmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA2OTIyNzIsImV4cCI6MjA2NjI2ODI3Mn0.FdOwlFP05seSbF69ErbFOyM3uO37Rul9vaLCX7bu0tg"
);

/**
 * Fetches all logs from the 'logs' table by paginating through the results.
 * This is necessary because Supabase limits queries to 1000 rows by default.
 * @returns {Promise<Array>} A promise that resolves to an array of all log objects.
 */
async function fetchAllLogs() {
    const allLogs = [];
    const pageSize = 1000;
    let page = 0;
    let hasMore = true;

    while (hasMore) {
        const { data, error } = await supabase
            .from('logs')
            // Only select the columns you actually need for better performance
            .select('tag, emailId, time')
            .order('time', { ascending: false })
            .range(page * pageSize, (page + 1) * pageSize - 1);

        if (error) {
            console.error("Error fetching logs:", error);
            // Stop fetching on error
            hasMore = false; 
            // Depending on your needs, you might want to throw the error
            // throw error; 
            return [];
        }

        if (data && data.length > 0) {
            allLogs.push(...data);
            page++;
            if (data.length < pageSize) {
                // This was the last page
                hasMore = false;
            }
        } else {
            // No more data to fetch
            hasMore = false;
        }
    }
    return allLogs;
}


module.exports = async (req, res) => {
    // 1. Fetch ALL logs from the database using our new paginating function
    const logs = await fetchAllLogs();

    if (!logs) {
        return res.status(500).send("Failed to load logs");
    }

    // 2. Define your campaigns
    const campaignConfig = {
        unhcr: {
            displayName: "UNHCR Campaign",
            totalSent: 7209
        },
        milestone: {
            displayName: "Mileston Campaign",
            totalSent: 1490
        },
        usaTarif: {
            displayName: "USA tarif Campaign",
            totalSent: 6000
        },
    };

    // --- DATA PROCESSING (This part is now correct because `logs` is complete) ---

    const summaryStats = {};
    const uniqueLogsByTag = {};

    for (const tag in campaignConfig) {
        const config = campaignConfig[tag];
        
        // Filter logs for the current tag, excluding those with no emailId
        const tagLogs = logs.filter(log => log.tag === tag && log.emailId);
        
        // Use a Map to get unique emails and their most recent time.
        // Since logs are sorted descending by time, the first entry is the latest.
        const uniqueEmails = new Map();
        for (const log of tagLogs) {
            if (!uniqueEmails.has(log.emailId)) {
                uniqueEmails.set(log.emailId, log.time);
            }
        }

        const uniqueOpenCount = uniqueEmails.size;
        const openRate = config.totalSent > 0 ? (uniqueOpenCount / config.totalSent) * 100 : 0;
        
        // Store summary stats for the top section
        summaryStats[tag] = `
            <li>
                <strong>${config.displayName}:</strong> 
                ${uniqueOpenCount} opens from inbox out of ${config.totalSent} sent (${openRate.toFixed(2)}%)
            </li>`;
            
        // Store detailed logs for the dropdown functionality
        uniqueLogsByTag[tag] = Array.from(uniqueEmails, ([emailId, time]) => ({ emailId, time }));
    }


    // 4. Generate the final HTML with embedded JavaScript
    const html = `
    <html>
    <head>
        <title>Email Campaign Report</title>
        <style>
            body { font-family: sans-serif; padding: 20px; color: #333; }
            h2, h3 { color: #005a9c; }
            ul { list-style-type: none; padding-left: 0; }
            li { background: #eaf6ff; margin-bottom: 8px; padding: 10px; border-left: 4px solid #005a9c; }
            select { font-size: 16px; padding: 8px; margin-top: 10px; }
            #email-list-container { margin-top: 20px; }
            table { border-collapse: collapse; width: 100%; max-width: 700px; }
            th, td { border: 1px solid #ccc; padding: 8px; text-align: left; }
            th { background: #f2f2f2; }
            #email-table { display: none; }
        </style>
    </head>
    <body>
        <h2>📬 Email Campaign Summary</h2>
        <ul>
            ${Object.values(summaryStats).join("")}
        </ul>

        <hr>

        <h3>📜 View Unique Opens by Campaign</h3>
        <select id="campaign-selector" onchange="showEmails(this.value)">
            <option value="">-- Select a Campaign --</option>
            ${Object.entries(campaignConfig).map(([tag, config]) => `
                <option value="${tag}">${config.displayName}</option>
            `).join("")}
        </select>

        <div id="email-list-container">
            <table id="email-table">
                <thead>
                    <tr><th>Email ID</th><th>Last Opened At</th></tr>
                </thead>
                <tbody id="email-table-body">
                </tbody>
            </table>
        </div>

        <script>
            // Safely embed the processed data from the server into our script
            const emailDataByTag = ${JSON.stringify(uniqueLogsByTag)};

            function showEmails(tag) {
                const table = document.getElementById('email-table');
                const tableBody = document.getElementById('email-table-body');
                
                tableBody.innerHTML = '';

                if (!tag || !emailDataByTag[tag]) {
                    table.style.display = 'none';
                    return;
                }

                const emails = emailDataByTag[tag];
                
                if (emails.length === 0) {
                    tableBody.innerHTML = '<tr><td colspan="2">No unique opens recorded for this campaign.</td></tr>';
                } else {
                    emails.forEach(log => {
                        const row = tableBody.insertRow();
                        const cell1 = row.insertCell(0);
                        const cell2 = row.insertCell(1);
                        
                        cell1.textContent = log.emailId;
                        // Format the timestamp for better readability in the user's local timezone
                        cell2.textContent = new Date(log.time).toLocaleString();
                    });
                }
                table.style.display = 'table';
            }
        </script>
    </body>
    </html>
    `;

    res.setHeader("Content-Type", "text/html");
    res.send(html);
};