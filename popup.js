function getTodayUsage(sessions) {
  const today = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
  let total = 0;
  sessions.forEach(s => {
    if (s.openedAt && new Date(s.openedAt).toLocaleDateString("en-CA") === today) {
      const end = s.closedAt ? new Date(s.closedAt) : new Date();
      total += (end - new Date(s.openedAt)) / 60000;
    }
  });
  return Math.round(total);
}

document.getElementById("saveBedtime").addEventListener("click", () => {
  const bedtime = document.getElementById("bedtimeInput").value;
  if (!bedtime) return alert("Please set a valid time.");
  chrome.storage.local.set({ bedtime }, () => {
    const now = new Date();
    const [h, m] = bedtime.split(":").map(Number);
    const bedtimeDate = new Date();
    bedtimeDate.setHours(h, m, 0, 0);
    let when = bedtimeDate.getTime();
    if (when < now.getTime()) when += 24 * 60 * 60 * 1000;
    chrome.alarms.create("bedtimeReminder", { when });
    alert("Bedtime saved & reminder set!");
  });
});

chrome.storage.local.get(["sessions"], (data) => {
  const total = getTodayUsage(data.sessions || []);
  document.getElementById("usage").innerHTML = `<b>Today's usage:</b> ${total} mins`;
});

// (Optional) Fetch AI Tips
fetch("https://openrouter.ai/api/v1/chat/completions", {
  method: "POST",
  headers: { "Authorization": "Bearer YOUR_API_KEY", "Content-Type": "application/json" },
  body: JSON.stringify({
    model: "google/gemma-2-9b-it:free",
    messages: [{ role: "user", content: "Give me a short sleep health tip" }]
  })
}).then(res => res.json())
.then(data => {
  const tip = data.choices?.[0]?.message?.content || "Stay consistent with your sleep!";
  document.getElementById("aiTips").innerHTML = `<b>AI Tip:</b> ${tip}`;
}).catch(() => {
  document.getElementById("aiTips").innerHTML = `<b>AI Tip:</b> Stay consistent with your sleep!`;
});
