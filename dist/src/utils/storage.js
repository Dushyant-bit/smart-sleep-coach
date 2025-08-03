export const getSessions = () =>
  new Promise((resolve) => {
    chrome.storage.local.get({ sessions: [] }, (data) => resolve(data.sessions));
  });

export const saveBedtime = (bedtime) => {
  chrome.storage.local.set({ bedtime }, () => {
    const now = new Date();
    const [h, m] = bedtime.split(":").map(Number);
    const bedtimeDate = new Date();
    bedtimeDate.setHours(h, m, 0, 0);
    let when = bedtimeDate.getTime();
    if (when < now.getTime()) when += 24 * 60 * 60 * 1000;
    chrome.alarms.create("bedtimeReminder", { when });
  });
};

export const getBedtime = () =>
  new Promise((resolve) => {
    chrome.storage.local.get({ bedtime: "23:00" }, (data) => resolve(data.bedtime));
  });
