const STORAGE_KEY = "ai-smart-reminder-web-demo";

const $ = (id) => document.getElementById(id);

const state = {
  reminders: JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"),
  timers: new Map(),
};

const repeatText = {
  none: "不重复",
  daily: "每天",
  weekly: "每周",
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

function scheduleReminder(reminder) {
  if (state.timers.has(reminder.id)) clearTimeout(state.timers.get(reminder.id));
  const target = new Date(`${reminder.date}T${reminder.time}:00`);
  const delay = target.getTime() - Date.now();
  if (delay > 0 && reminder.status === "pending") {
    const timer = setTimeout(() => notify(reminder.title, reminder.content, reminder.alertType), delay);
    state.timers.set(reminder.id, timer);
  }
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
    card.className = `card ${reminder.status === "completed" ? "done" : ""}`;
    card.innerHTML = `
      <div class="card-head">
        <div>
          <h3>${reminder.title}</h3>
          <p class="card-time">${reminder.date} ${reminder.time} · ${repeatText[reminder.repeatType]}</p>
        </div>
        <span class="badge ${reminder.status === "completed" ? "done" : ""}">${reminder.status === "completed" ? "已完成" : "待提醒"}</span>
      </div>
      <p class="card-content">${reminder.content}</p>
      <div class="actions">
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

  $("addBtn").addEventListener("click", () => {
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

  $("reminderList").addEventListener("click", (event) => {
    const completeId = event.target.dataset.complete;
    const deleteId = event.target.dataset.delete;
    if (completeId) {
      state.reminders = state.reminders.map((item) => (item.id === completeId ? { ...item, status: "completed" } : item));
    }
    if (deleteId) {
      state.reminders = state.reminders.filter((item) => item.id !== deleteId);
    }
    save();
    render();
  });
}

init();
