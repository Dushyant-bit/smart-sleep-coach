import { useState, useEffect } from "react";
import Dashboard from "./components/Dashboard.jsx";
import Settings from "./components/Settings.jsx";

export default function App() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [audioPrimed, setAudioPrimed] = useState(false);

  // Prime audio when popup is first opened
  useEffect(() => {
    const audio = new Audio(chrome.runtime.getURL("alarm.mp3"));
    audio.volume = 0; // muted
    audio.play()
      .then(() => {
        console.log("[Audio] Primed successfully");
        setAudioPrimed(true);
      })
      .catch(() => {
        console.log("[Audio] Priming failed — will require user interaction");
        setAudioPrimed(false);
      });
  }, []);

  return (
    <div>
      <header>
        <h1>Smart Sleep Coach</h1>
        <nav>
          <button
            onClick={() => setActiveTab("dashboard")}
            className={activeTab === "dashboard" ? "active" : ""}
          >
            Dashboard
          </button>
          <button
            onClick={() => setActiveTab("settings")}
            className={activeTab === "settings" ? "active" : ""}
          >
            Settings
          </button>
        </nav>
      </header>

      {!audioPrimed && (
        <div style={{ background: "#0c0b06ff", padding: "5px", textAlign: "center" }}>
        </div>
      )}

      <div className="tab-content">
        {activeTab === "dashboard" && (
          <div key="dashboard" className="fade-slide">
            <Dashboard />
          </div>
        )}
        {activeTab === "settings" && (
          <div key="settings" className="fade-slide">
            <Settings />
          </div>
        )}
      </div>
    </div>
  );
}
