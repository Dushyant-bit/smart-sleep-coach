// === KEEP ALIVE ===
setInterval(() => {
  chrome.alarms.getAll((alarms) => {
    console.log("[Background] Keep-alive ping. Current alarms:", alarms.map(a => a.name));
  });
}, 25000);

// === ICON GLOW FUNCTIONS ===
let glowInterval;

function startIconGlow() {
  let isGlowing = false;
  glowInterval = setInterval(() => {
    chrome.action.setIcon({
      path: { "128": isGlowing ? "icon128.png" : "icon128_glow.png" }
    });
    isGlowing = !isGlowing;
  }, 500); // toggle every 500ms
}

function stopIconGlow() {
  clearInterval(glowInterval);
  chrome.action.setIcon({ path: { "128": "icon128.png" } }); // reset to normal
}

// === USAGE TRACKING ===
chrome.runtime.onInstalled.addListener(() => {
  chrome.alarms.create("usageTracker", { periodInMinutes: 1 });
  scheduleAlarmFromStorage();
});
chrome.runtime.onStartup.addListener(() => {
  chrome.alarms.create("usageTracker", { periodInMinutes: 1 });
  scheduleAlarmFromStorage();
});

function getTodayKey() {
  return new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
}

function handleUsageTracker() {
  chrome.idle.queryState(60, (state) => {
    if (state === "active") {
      const today = getTodayKey();
      chrome.storage.local.get(["usageData"], (data) => {
        const usage = data.usageData || {};
        usage[today] = (usage[today] || 0) + 1;
        chrome.storage.local.set({ usageData: usage });
        console.log(`[Usage] Added 1 min. Total for ${today}: ${usage[today]} minutes`);
      });
    }
  });
}

// === BEDTIME REMINDER ===
async function ensureOffscreen() {
  const exists = await chrome.offscreen.hasDocument();
  if (!exists) {
    console.log("[Background] Creating offscreen document...");
    await chrome.offscreen.createDocument({
      url: chrome.runtime.getURL("offscreen.html"),
      reasons: ["AUDIO_PLAYBACK"],
      justification: "Play alarm sound for bedtime reminder"
    });
  } else {
    console.log("[Background] Offscreen document already exists.");
  }
}

function waitForOffscreenReady() {
  return new Promise((resolve) => {
    const listener = (msg) => {
      if (msg.type === "OFFSCREEN_READY") {
        console.log("[Background] Offscreen is ready.");
        chrome.runtime.onMessage.removeListener(listener);
        resolve();
      }
    };
    chrome.runtime.onMessage.addListener(listener);
  });
}

async function playAlarmSound() {
  await ensureOffscreen();
  await waitForOffscreenReady();
  try {
    await chrome.runtime.sendMessage({ type: "PLAY_SOUND" });
    console.log("[Background] Sent PLAY_SOUND message to offscreen.");
  } catch (err) {
    console.error("[Background] Failed to send PLAY_SOUND:", err);
  }
}

function scheduleAlarmFromStorage() {
  chrome.storage.local.get("bedtime", (data) => {
    if (data.bedtime) {
      const [hours, minutes] = data.bedtime.split(":").map(Number);
      const now = new Date();
      const bedtimeDate = new Date();
      bedtimeDate.setHours(hours, minutes, 0, 0);
      if (bedtimeDate <= now) bedtimeDate.setDate(bedtimeDate.getDate() + 1);
      const delayMinutes = (bedtimeDate - now) / 60000;
      chrome.alarms.create("bedtimeReminder", { delayInMinutes: delayMinutes });
      console.log("[Background] Alarm scheduled for:", bedtimeDate);
    } else {
      console.log("[Background] No bedtime set. Alarm not scheduled.");
    }
  });
}

async function handleBedtimeReminder() {
  console.log("[Background] Bedtime alarm triggered");
  chrome.storage.local.get(["bedtimeAlertsEnabled"], async (data) => {
    if (data.bedtimeAlertsEnabled === false) {
      console.log("[Background] Alerts disabled, skipping.");
      return;
    }

    chrome.notifications.create({
      type: "basic",
      iconUrl: "icon128.png",
      title: "Bedtime Reminder",
      message: "It's time to wind down and sleep!"
    }, (id) => console.log("[Background] Notification created with ID:", id));

    // Start glowing icon & stop after 10s
    startIconGlow();
    setTimeout(stopIconGlow, 10000);

    await playAlarmSound();
    scheduleAlarmFromStorage();
  });
}

// === ALARM LISTENER ===
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === "usageTracker") handleUsageTracker();
  if (alarm.name === "bedtimeReminder") handleBedtimeReminder();
});

// === DEBUG / TEST ===
chrome.runtime.onMessage.addListener((msg) => {
  if (msg.type === "TEST_NOTIFICATION") {
    console.log("[Background] Triggering test notification...");
    chrome.notifications.create({
      type: "basic",
      iconUrl: "icon128.png",
      title: "Test Notification",
      message: "This is a test!"
    });
    startIconGlow();
    setTimeout(stopIconGlow, 10000);
    playAlarmSound();
  }
});
