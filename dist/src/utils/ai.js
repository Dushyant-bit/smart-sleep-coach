export const getAITip = (force = false) =>
  new Promise((resolve) => {
    chrome.storage.local.get(
      ["aiTip", "aiTipTime", "bedtime", "usageData"],
      async (cache) => {
        const now = Date.now();
        const twelveHours = 12 * 60 * 60 * 1000;

        const todayKey = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
        const totalMinutes = cache.usageData?.[todayKey] || 0;
        const hours = Math.floor(totalMinutes / 60);
        const mins = totalMinutes % 60;
        const bedtime = cache.bedtime || "23:00";
        const currentTime = new Date().toLocaleTimeString("en-GB", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
          timeZone: "Asia/Kolkata",
        });

        if (
          !force &&
          cache.aiTip &&
          Array.isArray(cache.aiTip) &&
          cache.aiTipTime &&
          now - cache.aiTipTime < twelveHours
        ) {
          return resolve({ tip: cache.aiTip, lastTime: cache.aiTipTime });
        }

        try {
          const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
              Authorization: "Bearer sk-orv1-0ab2699975ff60ef548ca779be3a5084ec739f75ce0db52e43312446d88ba583",
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
  model: "google/gemma-2-9b-it:free",
  messages: [
    {
      role: "system",
      content: `You are a strict sleep coach. Not a chatbot or ai assitant, just a sleep coach 
      RULES:
      - Reply with EXACTLY 3 short actionable tips.
      - No greetings, no explanations, no extra text. 
      - Do not use bullets, numbering, or extra formatting.
      - Be Strict with whatever Example is provided nothing extra just folow Example.
      - Show 1 consequence as well if user is already passing his bedtime and not sleeping.
      Example:
       Reduce screen time 30 minutes before bed.
       Stick to your bedtime schedule.
       Keep your bedroom cool and dark.`,
    },
    {
      role: "user",
      content: `The user has been active on their browser for ${hours}h ${mins}m today.
      Their set bedtime is ${bedtime}, and the current time is ${currentTime}.
      Generate 3 personalized bedtime tips.`,
    },
  ],
}),


          });
          const data = await res.json();
          let content =
            data.choices?.[0]?.message?.content ||
            "Stay consistent with your sleep schedule.\nAvoid screens before bed.\nKeep your room cool and dark.";

          // Split into array by newlines
          let tips = content
            .replace(/\r/g, "")
            .split(/\n+/)
            .map((t) => t.replace(/^[-•\d.]\s*/, "").trim())
            .filter((t) => t.length > 0)
            .slice(0, 3); // limit to 3

          chrome.storage.local.set({ aiTip: tips, aiTipTime: Date.now() });

          resolve({ tip: tips, lastTime: Date.now() });
        } catch {
          resolve({
            tip: [
              "Stick to your bedtime to improve sleep quality.",
              "Limit screen time before sleeping.",
              "Create a relaxing pre-bed routine.",
            ],
            lastTime: cache.aiTipTime,
          });
        }
      }
    );
  });
