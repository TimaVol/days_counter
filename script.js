const COOKIE_NAME = "days_counter_date";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365; // 1 year

const dateInput = document.getElementById("dateInput");
const dayCountEl = document.getElementById("dayCount");
const dayLabelEl = document.getElementById("dayLabel");
const counterSubtitleEl = document.getElementById("counterSubtitle");

function getCookie(name) {
  const match = document.cookie.match(
    new RegExp("(?:^|; )" + name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "=([^;]*)")
  );
  return match ? decodeURIComponent(match[1]) : null;
}

function setCookie(name, value) {
  document.cookie =
    name +
    "=" +
    encodeURIComponent(value) +
    "; path=/; max-age=" +
    COOKIE_MAX_AGE +
    "; SameSite=Lax";
}

function toDateOnly(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function formatDisplayDate(dateStr) {
  const [year, month, day] = dateStr.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString(undefined, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function diffDays(fromStr, toDate) {
  const [year, month, day] = fromStr.split("-").map(Number);
  const from = toDateOnly(new Date(year, month - 1, day));
  const to = toDateOnly(toDate);
  const msPerDay = 24 * 60 * 60 * 1000;
  return Math.round((to - from) / msPerDay);
}

function pluralize(count, singular, plural) {
  return Math.abs(count) === 1 ? singular : plural;
}

function updateDisplay(dateStr) {
  if (!dateStr) {
    dayCountEl.textContent = "—";
    dayLabelEl.textContent = "days";
    counterSubtitleEl.textContent = "Pick a date to begin";
    return;
  }

  const days = diffDays(dateStr, new Date());
  const absDays = Math.abs(days);

  dayCountEl.textContent = String(absDays);
  dayLabelEl.textContent = pluralize(absDays, "day", "days");

  if (days === 0) {
    counterSubtitleEl.textContent = "Today — " + formatDisplayDate(dateStr);
  } else if (days > 0) {
    counterSubtitleEl.textContent =
      absDays +
      " " +
      pluralize(absDays, "day", "days") +
      " since " +
      formatDisplayDate(dateStr);
  } else {
    counterSubtitleEl.textContent =
      absDays +
      " " +
      pluralize(absDays, "day", "days") +
      " until " +
      formatDisplayDate(dateStr);
  }

  dayCountEl.classList.remove("pop");
  void dayCountEl.offsetWidth;
  dayCountEl.classList.add("pop");
}

function onDateChange() {
  const value = dateInput.value;
  if (!value) return;

  setCookie(COOKIE_NAME, value);
  updateDisplay(value);
}

const savedDate = getCookie(COOKIE_NAME);
if (savedDate) {
  dateInput.value = savedDate;
  updateDisplay(savedDate);
} else {
  updateDisplay(null);
}

dateInput.addEventListener("change", onDateChange);
dateInput.addEventListener("input", onDateChange);
