import { useEffect, useState } from "react";
import { getAITip } from "../utils/ai";

export default function Dashboard() {
  const [usage, setUsage] = useState("0m");
  const [tips, setTips] = useState([]);
  const [lastRefreshed, setLastRefreshed] = useState("Never");
  const [lastReset, setLastReset] = useState("Never");
  const [loading, setLoading] = useState(false);

  const todayKey = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });

  const refreshUsage = () => {
    chrome.storage.local.get(["usageData", "lastReset"], (data) => {
      const minutes = data.usageData?.[todayKey] || 0;
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      setUsage(`${hours > 0 ? hours + "h " : ""}${mins}m`);
      setLastReset(data.lastReset ? new Date(data.lastReset).toLocaleString("en-IN") : "Never");
    });
  };

  const fetchTip = (force = false) => {
    setLoading(true);
    getAITip(force).then(({ tip, lastTime }) => {
      setTips(Array.isArray(tip) ? tip : [tip]);
      setLastRefreshed(lastTime ? new Date(lastTime).toLocaleTimeString() : "Never");
      setLoading(false);
    });
  };

  useEffect(() => {
    refreshUsage();
    fetchTip(false);
    chrome.storage.onChanged.addListener((changes, area) => {
      if (area === "local" && (changes.usageData || changes.lastReset)) refreshUsage();
    });
  }, []);

  const isResetToday =
    lastReset !== "Never" &&
    new Date(lastReset).toDateString() === new Date().toDateString();

  return (
    <div className="container">
      <div className="card">
        <h2>Active Time Today</h2>
        <p style={{ fontSize: "1.5rem", fontWeight: "bold" }}>{usage}</p>
        <p className="text-sm text-gray-400">Last Refreshed: {lastRefreshed}</p>
        <p
          className="text-sm"
          style={{
            color: isResetToday ? "orange" : "#aaa",
            fontWeight: isResetToday ? "bold" : "normal",
          }}
        >
          Last Reset: {lastReset}
        </p>
      </div>

      <div className="card">
        <h2>AI Sleep Tips</h2>
        {loading ? (
          <p>Fetching new tips...</p>
        ) : (
          <ul style={{ paddingLeft: "20px", listStyleType: "disc" }}>
            {tips.map((t, idx) => (
              <li key={idx} style={{ marginBottom: "6px" }}>
                {t}
              </li>
            ))}
          </ul>
        )}
        <button onClick={() => fetchTip(true)} className="primary" disabled={loading}>
          {loading ? "Refreshing..." : "Refresh Tips"}
        </button>
      </div>
    </div>
  );
}
