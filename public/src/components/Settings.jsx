import { useEffect, useState } from "react";
import { saveBedtime, getBedtime } from "../utils/storage";

export default function Settings() {
  const [bedtime, setBedtime] = useState("23:00");
  const [alertsEnabled, setAlertsEnabled] = useState(true);

  useEffect(() => {
    getBedtime().then(setBedtime);
    chrome.storage.local.get("bedtimeAlertsEnabled", (data) => {
      setAlertsEnabled(data.bedtimeAlertsEnabled !== false);
    });
  }, []);

  const scheduleBedtimeAlarm = (time) => {
    chrome.alarms.clear("bedtimeReminder", () => {
      if (!alertsEnabled) return;
      const [hours, minutes] = time.split(":").map(Number);
      const now = new Date();
      const bedtimeDate = new Date();
      bedtimeDate.setHours(hours, minutes, 0, 0);
      if (bedtimeDate <= now) bedtimeDate.setDate(bedtimeDate.getDate() + 1);
      const delayMinutes = (bedtimeDate - now) / 60000;
      chrome.alarms.create("bedtimeReminder", { delayInMinutes: delayMinutes });
      console.log("[Settings] Bedtime alarm scheduled for:", bedtimeDate);
    });
  };

  const handleSave = () => {
    chrome.storage.local.set({ bedtimeAlertsEnabled: alertsEnabled });
    saveBedtime(bedtime);
    scheduleBedtimeAlarm(bedtime);
    alert("Settings saved!");
  };

  const resetToday = () => {
    if (
      confirm(
        "This will clear ONLY today's active time data. Past days' data will remain. Do you want to continue?"
      )
    ) {
      const todayKey = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
      chrome.storage.local.get("usageData", (data) => {
        const usage = data.usageData || {};
        delete usage[todayKey];
        chrome.storage.local.set({
          usageData: usage,
          lastReset: Date.now(),
        }, () => alert("Today's active time has been reset."));
      });
    }
  };

  const resetAll = () => {
    if (
      confirm(
        "This will clear ALL active time records (entire history). This cannot be undone. Are you sure?"
      )
    ) {
      chrome.storage.local.set({
        usageData: {},
        lastReset: Date.now(),
      }, () => alert("All active time records have been reset."));
    }
  };

  return (
    <div className="container">
      <div className="card">
        <h2>Bedtime Settings</h2>
        <label>Set your bedtime:</label>
        <input
          type="time"
          value={bedtime}
          onChange={(e) => setBedtime(e.target.value)}
          className="p-2 rounded text-black block mb-4"
        />
        <label className="block mb-4">
          <input
            type="checkbox"
            checked={alertsEnabled}
            onChange={(e) => setAlertsEnabled(e.target.checked)}
          /> Enable bedtime alerts
        </label>
        <button onClick={handleSave} className="primary">Save Settings</button>
      </div>

      <div className="card" style={{ marginTop: "20px" }}>
        <h2>Reset Usage Data</h2>
        <div style={{ display: "flex", alignItems: "center", marginBottom: "8px" }}>
          <button onClick={resetToday} className="primary" title="Clear only today's active time.">
            Reset Today
          </button>
          <span style={{ marginLeft: "8px", fontSize: "12px", color: "#aaa" }}>
            (Clears only today's data)
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center" }}>
          <button
            onClick={resetAll}
            className="danger"
            style={{ marginRight: "8px" }}
            title="Clear all active time records permanently."
          >
            Reset All
          </button>
          <span style={{ fontSize: "12px", color: "#aaa" }}>
            (Clears entire history)
          </span>
        </div>
      </div>
    </div>
  );
}
