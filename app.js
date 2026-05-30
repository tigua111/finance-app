const STORAGE_KEY = "daily-finance-state-v1";

const defaultState = {
  userName: "",
  balance: 0,
  records: [],
  ready: false,
};

const state = loadState();

const setupScreen = document.querySelector("#setupScreen");
const mainScreen = document.querySelector("#mainScreen");
const recordsScreen = document.querySelector("#recordsScreen");
const setupForm = document.querySelector("#setupForm");
const entryForm = document.querySelector("#entryForm");
const nameInput = document.querySelector("#nameInput");
const savingsInput = document.querySelector("#savingsInput");
const amountInput = document.querySelector("#amountInput");
const purposeInput = document.querySelector("#purposeInput");
const userName = document.querySelector("#userName");
const todayText = document.querySelector("#todayText");
const balanceOutput = document.querySelector("#balanceOutput");
const incomeTotal = document.querySelector("#incomeTotal");
const expenseTotal = document.querySelector("#expenseTotal");
const recordList = document.querySelector("#recordList");
const monthNav = document.querySelector("#monthNav");
const emptyState = document.querySelector("#emptyState");
const recordsTab = document.querySelector("#recordsTab");
const homeTab = document.querySelector("#homeTab");
const recordsHomeTab = document.querySelector("#recordsHomeTab");
const backHomeButton = document.querySelector("#backHomeButton");
const resetButton = document.querySelector("#resetButton");

const moneyFormatter = new Intl.NumberFormat("zh-TW", {
  style: "currency",
  currency: "TWD",
  maximumFractionDigits: 0,
});

const dateFormatter = new Intl.DateTimeFormat("zh-TW", {
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
});

const weekdayFormatter = new Intl.DateTimeFormat("zh-TW", {
  month: "long",
  day: "numeric",
  weekday: "long",
});

setupForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const enteredName = nameInput.value.trim();
  const enteredSavings = toAmount(savingsInput.value);

  if (!enteredName || enteredSavings < 0) {
    return;
  }

  state.userName = enteredName;
  state.balance = enteredSavings;
  state.records = [];
  state.ready = true;
  saveState();
  showMain();
});

entryForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const amount = toAmount(amountInput.value);
  const purpose = purposeInput.value.trim();
  const type = new FormData(entryForm).get("entryType");

  if (amount <= 0 || !purpose || !type) {
    return;
  }

  const record = {
    id: crypto.randomUUID(),
    amount,
    purpose,
    type,
    createdAt: new Date().toISOString(),
  };

  state.balance += type === "income" ? amount : -amount;
  state.records.unshift(record);
  amountInput.value = "";
  purposeInput.value = "";
  saveState();
  render();
});

recordsTab.addEventListener("click", showRecords);
homeTab.addEventListener("click", showMain);
recordsHomeTab.addEventListener("click", showMain);
backHomeButton.addEventListener("click", showMain);
monthNav.addEventListener("click", (event) => {
  const button = event.target.closest(".month-button");
  if (!button) {
    return;
  }

  const month = Number(button.dataset.month) + 1;
  document.querySelector(`#month-${month}`)?.scrollIntoView({
    behavior: "smooth",
    block: "start",
  });
});

resetButton.addEventListener("click", () => {
  const shouldReset = window.confirm("要重新輸入名字與目前存款嗎？現有紀錄會清空。");
  if (!shouldReset) {
    return;
  }

  Object.assign(state, defaultState, { records: [] });
  saveState();
  showSetup();
});

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("service-worker.js").catch(() => {});
}

if (state.ready) {
  showMain();
} else {
  showSetup();
}

function showSetup() {
  setupScreen.classList.remove("hidden");
  mainScreen.classList.add("hidden");
  recordsScreen.classList.add("hidden");
  nameInput.value = state.userName;
  savingsInput.value = state.balance || "";
}

function showMain() {
  setupScreen.classList.add("hidden");
  mainScreen.classList.remove("hidden");
  recordsScreen.classList.add("hidden");
  render();
}

function showRecords() {
  setupScreen.classList.add("hidden");
  mainScreen.classList.add("hidden");
  recordsScreen.classList.remove("hidden");
  render();
}

function render() {
  todayText.textContent = weekdayFormatter.format(new Date());
  userName.textContent = state.userName || "你好";
  balanceOutput.textContent = formatMoney(state.balance);

  const totals = state.records.reduce(
    (sum, record) => {
      sum[record.type] += record.amount;
      return sum;
    },
    { income: 0, expense: 0 },
  );

  incomeTotal.textContent = formatMoney(totals.income);
  expenseTotal.textContent = formatMoney(totals.expense);
  recordList.innerHTML = "";

  const recordsByMonth = groupRecordsByMonth(state.records);
  const currentMonth = new Date().getMonth();

  monthNav.querySelectorAll(".month-button").forEach((button) => {
    const index = Number(button.dataset.month);
    const count = recordsByMonth[index].length;
    button.className = `month-button${index === currentMonth ? " current" : ""}`;
    button.dataset.empty = count === 0 ? "true" : "false";
    button.setAttribute("aria-label", `${index + 1}月明細，共 ${count} 筆`);
  });

  recordsByMonth.forEach((records, index) => {
    const section = document.createElement("section");
    const heading = document.createElement("h2");
    const list = document.createElement("ol");

    section.className = "month-section";
    section.id = `month-${index + 1}`;
    heading.textContent = `${index + 1}月`;
    list.className = "record-list";

    if (records.length === 0) {
      const emptyMonth = document.createElement("p");
      emptyMonth.className = "month-empty";
      emptyMonth.textContent = "這個月份尚無明細";
      section.append(heading, emptyMonth);
      recordList.append(section);
      return;
    }

    records.forEach((record) => {
      const item = document.createElement("li");
      const isIncome = record.type === "income";
      const icon = document.createElement("span");
      const meta = document.createElement("span");
      const title = document.createElement("strong");
      const time = document.createElement("time");
      const amount = document.createElement("span");

      item.className = "record-item";
      icon.className = `record-icon ${record.type}`;
      icon.setAttribute("aria-hidden", "true");
      icon.textContent = isIncome ? "+" : "-";

      meta.className = "record-meta";
      title.textContent = record.purpose || (isIncome ? "收入" : "花費");
      time.dateTime = record.createdAt;
      time.textContent = `${isIncome ? "收入" : "花費"} · ${dateFormatter.format(new Date(record.createdAt))}`;

      amount.className = `record-amount ${record.type}`;
      amount.textContent = `${isIncome ? "+" : "-"}${formatMoney(record.amount)}`;

      meta.append(title, time);
      item.append(icon, meta, amount);
      list.append(item);
    });

    section.append(heading, list);
    recordList.append(section);
  });

  emptyState.classList.add("hidden");
}

function groupRecordsByMonth(records) {
  const grouped = Array.from({ length: 12 }, () => []);

  records.forEach((record) => {
    const month = new Date(record.createdAt).getMonth();
    if (month >= 0 && month < 12) {
      grouped[month].push(record);
    }
  });

  return grouped;
}

function loadState() {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return {
      ...defaultState,
      ...stored,
      records: Array.isArray(stored?.records) ? stored.records : [],
    };
  } catch {
    return { ...defaultState, records: [] };
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function toAmount(value) {
  const number = Number(value);
  return Number.isFinite(number) ? Math.round(number) : 0;
}

function formatMoney(value) {
  return moneyFormatter.format(value).replace("NT$", "$");
}
