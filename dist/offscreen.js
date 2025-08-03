chrome.runtime.sendMessage({ type: "OFFSCREEN_READY" });

chrome.runtime.onMessage.addListener((msg) => {
  if (msg.type === "PLAY_SOUND") {
    console.log("[Offscreen] PLAY_SOUND received, playing audio...");
    const audio = document.getElementById("alarmSound");
    audio.volume = 1.0;
    audio.play().then(() => {
      console.log("[Offscreen] Audio playback started.");
    }).catch(err => {
      console.error("[Offscreen] Audio playback failed:", err);
    });
  }
});
