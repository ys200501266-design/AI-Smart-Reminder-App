const STORAGE_KEY = "ai-smart-reminder-web-demo";

const $ = (id) => document.getElementById(id);

const state = {
  reminders: JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"),
  timers: new Map(),
  repeaters: new Map(),
};

const repeatText = {
  none: "不重复",
  daily: "每天",
  weekly: "每周",
};

const statusText = {
  pending: "待提醒",
  ringing: "提醒中",
  reminded: "已提醒",
  completed: "已完成",
};

const pad = (value) => String(value).padStart(2, "0");

const formatDate = (date) =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

const formatTime = (date) => `${pad(date.getHours())}:${pad(date.getMinutes())}`;

const addDays = (date, days) => {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
};

const defaultDateTime = () => {
  const next = new Date(Date.now() + 60 * 60 * 1000);
  return { date: formatDate(next), time: formatTime(next) };
};

const chineseNumbers = {
  零: 0,
  一: 1,
  二: 2,
  两: 2,
  三: 3,
  四: 4,
  五: 5,
  六: 6,
  七: 7,
  八: 8,
  九: 9,
  十: 10,
  十一: 11,
  十二: 12,
};

function parseChineseNumber(raw) {
  if (/^\d+$/.test(raw)) return Number(raw);
  if (raw in chineseNumbers) return chineseNumbers[raw];
  if (raw.startsWith("十")) return 10 + (chineseNumbers[raw.slice(1)] || 0);
  if (raw.includes("十")) {
    const [tens, ones] = raw.split("十");
    return (chineseNumbers[tens || "一"] || 1) * 10 + (chineseNumbers[ones || "零"] || 0);
  }
  return undefined;
}

function parseReminderText(input) {
  const text = input.trim().replace(/\s+/g, "");
  const repeatType = /每天|每日|天天/.test(text) ? "daily" : /每周|每星期|每礼拜/.test(text) ? "weekly" : "none";
  let date = /后天/.test(text) ? addDays(new Date(), 2) : /明天|明早|明晚/.test(text) ? addDays(new Date(), 1) : new Date();

  let hour;
  let minute = 0;
  const colonMatch = text.match(/([01]?\d|2[0-3])[:：]([0-5]\d)/);
  const timeMatch = text.match(/(凌晨|早上|上午|中午|下午|晚上|今晚|明早|明晚)?([零一二两三四五六七八九十\d]{1,3})点(半|[零一二两三四五六七八九十\d]{1,3}分?)?/);

  if (colonMatch) {
    hour = Number(colonMatch[1]);
    minute = Number(colonMatch[2]);
  } else if (timeMatch) {
    const period = timeMatch[1] || "";
    hour = parseChineseNumber(timeMatch[2]);
    if (/下午|晚上|今晚|明晚/.test(period) && hour < 12) hour += 12;
    if (/中午/.test(period) && hour < 11) hour += 12;
    if (timeMatch[3] === "半") minute = 30;
  }

  if (hour !== undefined) date.setHours(hour, minute, 0, 0);
  if (hour !== undefined && date.getTime() <= Date.now()) date = addDays(date, 1);

  const content =
    text
      .replace(/(后天|明天|今天|今晚|明早|明晚|每天|每日|天天|每周|每星期|每礼拜)/g, "")
      .replace(/(凌晨|早上|上午|中午|下午|晚上)?[零一二两三四五六七八九十\d]{1,3}点(半|[零一二两三四五六七八九十\d]{1,3}分?)?/g, "")
      .replace(/([01]?\d|2[0-3])[:：]([0-5]\d)/g, "")
      .replace(/提醒我|提醒一下我|叫我|让我|记得|去|提醒|一下/g, "")
      .trim() || input;

  return {
    title: content.length > 12 ? `${content.slice(0, 12)}...` : content,
    content,
    date: formatDate(date),
    time: hour === undefined ? formatTime(new Date()) : formatTime(date),
    repeatType,
    needsConfirmation: hour === undefined,
  };
}

function save() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.reminders));
}

function getTargetTime(reminder) {
  return new Date(`${reminder.date}T${reminder.time}:00`);
}

function notify(title, body, alertType) {
  if ((alertType === "notification" || alertType === "both") && "Notification" in window) {
    if (Notification.permission === "granted") {
      new Notification(title, { body });
    } else if (Notification.permission !== "denied") {
      Notification.requestPermission().then((permission) => {
        if (permission === "granted") new Notification(title, { body });
      });
    }
  }
  if ((alertType === "vibration" || alertType === "both") && "vibrate" in navigator) {
    navigator.vibrate([300, 160, 300]);
  }
  alert(`${title}\n${body}`);
}

function stopRepeating(id) {
  if (state.repeaters.has(id)) {
    clearInterval(state.repeaters.get(id));
    state.repeaters.delete(id);
  }
}

async function ensureNotificationPermission(alertType) {
  if (!(alertType === "notification" || alertType === "both") || !("Notification" in window)) {
    return true;
  }

  if (Notification.permission === "granted") return true;
  if (Notification.permission === "denied") {
    alert("浏览器通知权限已被关闭，请在手机浏览器设置里允许通知。");
    return false;
  }

  const permission = await Notification.requestPermission();
  return permission === "granted";
}

function advanceRepeat(reminder) {
  const next = getTargetTime(reminder);
  const step = reminder.repeatType === "daily" ? 1 : 7;
  while (next.getTime() <= Date.now()) {
    next.setDate(next.getDate() + step);
  }
  return { ...reminder, date: formatDate(next), time: formatTime(next), status: "pending" };
}

function showReminderModal(reminder) {
  $("modalTitle").textContent = reminder.title;
  $("modalContent").textContent = reminder.content;
  $("ackBtn").dataset.ack = reminder.id;
  $("reminderModal").classList.remove("hidden");
}

function hideReminderModalIfClear() {
  const ringing = state.reminders.find((item) => item.status === "ringing");
  if (!ringing) {
    $("reminderModal").classList.add("hidden");
    $("ackBtn").dataset.ack = "";
  }
}

function repeatUntilAcknowledged(reminder) {
  stopRepeating(reminder.id);
  showReminderModal(reminder);
  notify(reminder.title, reminder.content, reminder.alertType);

  const interval = setInterval(() => {
    const current = state.reminders.find((item) => item.id === reminder.id);
    if (!current || current.status !== "ringing") {
      stopRepeating(reminder.id);
      hideReminderModalIfClear();
      return;
    }
    showReminderModal(current);
    notify(current.title, current.content, current.alertType);
  }, 12000);

  state.repeaters.set(reminder.id, interval);
}

function handleReminderDue(reminder) {
  const ringingReminder = { ...reminder, status: "ringing" };
  state.reminders = state.reminders.map((item) => {
    if (item.id !== reminder.id) return item;
    return ringingReminder;
  });
  save();
  render();
  repeatUntilAcknowledged(ringingReminder);
}

function scheduleReminder(reminder) {
  if (state.timers.has(reminder.id)) clearTimeout(state.timers.get(reminder.id));
  if (reminder.status !== "pending") return;
  const target = getTargetTime(reminder);
  const delay = target.getTime() - Date.now();
  if (delay > 0) {
    const timer = setTimeout(() => handleReminderDue(reminder), delay);
    state.timers.set(reminder.id, timer);
  }
}

function acknowledgeReminder(id) {
  const target = state.reminders.find((item) => item.id === id);
  if (!target) return;

  stopRepeating(id);
  state.reminders = state.reminders.map((item) => {
    if (item.id !== id) return item;
    return item.repeatType === "none" ? { ...item, status: "reminded" } : advanceRepeat(item);
  });
  save();
  render();
  hideReminderModalIfClear();
  state.reminders.forEach(scheduleReminder);
}

function checkDueReminders() {
  const due = state.reminders.find(
    (reminder) => reminder.status === "pending" && getTargetTime(reminder).getTime() <= Date.now(),
  );
  if (due) handleReminderDue(due);
}

function render() {
  $("totalCount").textContent = state.reminders.length;
  $("pendingCount").textContent = state.reminders.filter((item) => item.status === "pending").length;
  const list = $("reminderList");
  list.innerHTML = "";

  if (!state.reminders.length) {
    list.innerHTML = '<div class="empty">还没有提醒，先试试输入“明天早上九点提醒我交作业”。</div>';
    return;
  }

  state.reminders.forEach((reminder) => {
    const card = document.createElement("article");
    card.className = `card ${reminder.status === "completed" ? "done" : ""} ${reminder.status === "ringing" ? "ringing" : ""}`;
    const badgeClass = reminder.status === "pending" ? "" : reminder.status === "ringing" ? "ringing" : "done";
    card.innerHTML = `
      <div class="card-head">
        <div>
          <h3>${reminder.title}</h3>
          <p class="card-time">${reminder.date} ${reminder.time} · ${repeatText[reminder.repeatType]}</p>
        </div>
        <span class="badge ${badgeClass}">${statusText[reminder.status] || "待提醒"}</span>
      </div>
      <p class="card-content">${reminder.content}</p>
      <div class="actions">
        ${reminder.status === "ringing" ? `<button data-ack="${reminder.id}">我知道了</button>` : ""}
        <button data-complete="${reminder.id}">标记完成</button>
        <button class="delete" data-delete="${reminder.id}">删除</button>
      </div>
    `;
    list.appendChild(card);
  });
}

function resetForm() {
  const next = defaultDateTime();
  $("titleInput").value = "";
  $("contentInput").value = "";
  $("dateInput").value = next.date;
  $("timeInput").value = next.time;
  $("repeatInput").value = "none";
  $("alertInput").value = "both";
}

function init() {
  resetForm();
  state.reminders.forEach(scheduleReminder);
  state.reminders.filter((item) => item.status === "ringing").forEach(repeatUntilAcknowledged);
  render();

  $("parseBtn").addEventListener("click", () => {
    const text = $("naturalText").value;
    if (!text.trim()) return alert("请输入一句提醒，例如：明天早上九点提醒我交作业");
    const parsed = parseReminderText(text);
    $("titleInput").value = parsed.title;
    $("contentInput").value = parsed.content;
    $("dateInput").value = parsed.date;
    $("timeInput").value = parsed.time;
    $("repeatInput").value = parsed.repeatType;
    $("parseHint").textContent = parsed.needsConfirmation ? "已尽量解析，请手动确认日期和时间。" : "解析成功，请确认后创建提醒。";
  });

  $("addBtn").addEventListener("click", async () => {
    const reminder = {
      id: String(Date.now()),
      title: $("titleInput").value.trim(),
      content: $("contentInput").value.trim(),
      date: $("dateInput").value,
      time: $("timeInput").value,
      repeatType: $("repeatInput").value,
      alertType: $("alertInput").value,
      status: "pending",
    };
    if (!reminder.title || !reminder.content || !reminder.date || !reminder.time) return alert("请补全提醒信息");
    await ensureNotificationPermission(reminder.alertType);
    state.reminders.unshift(reminder);
    scheduleReminder(reminder);
    save();
    render();
    resetForm();
    $("naturalText").value = "";
    $("parseHint").textContent = "";
  });

  $("testBtn").addEventListener("click", () => {
    setTimeout(() => notify("10 秒测试提醒", "如果你看到这条提醒，说明 Demo 功能可用。", "both"), 10000);
    alert("测试提醒已安排，10 秒后触发。");
  });

  window.addEventListener("focus", checkDueReminders);
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) checkDueReminders();
  });
  setInterval(checkDueReminders, 30000);
  checkDueReminders();

  $("reminderList").addEventListener("click", (event) => {
    const ackId = event.target.dataset.ack;
    const completeId = event.target.dataset.complete;
    const deleteId = event.target.dataset.delete;
    if (ackId) {
      acknowledgeReminder(ackId);
      return;
    }
    if (completeId) {
      stopRepeating(completeId);
      state.reminders = state.reminders.map((item) => (item.id === completeId ? { ...item, status: "completed" } : item));
    }
    if (deleteId) {
      stopRepeating(deleteId);
      state.reminders = state.reminders.filter((item) => item.id !== deleteId);
    }
    save();
    render();
    hideReminderModalIfClear();
  });

  $("ackBtn").addEventListener("click", (event) => {
    const ackId = event.target.dataset.ack;
    if (ackId) acknowledgeReminder(ackId);
  });
}

init();

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./service-worker.js").catch(() => {
      // The demo still works if the browser blocks service workers.
    });
  });
}
