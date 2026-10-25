import {
  addCounter,
  loadCounters,
  removeCounter,
  saveCounters,
  updateCounter,
} from "./counters.js";

const LEGACY_COOKIE = "days_counter_date";

const listEl = document.getElementById("countersList");
const addBtn = document.getElementById("addCounterBtn");

function getCookie(name) {
  const match = document.cookie.match(
    new RegExp("(?:^|; )" + name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "=([^;]*)")
  );
  return match ? decodeURIComponent(match[1]) : null;
}

function clearLegacyCookie() {
  document.cookie =
    LEGACY_COOKIE + "=; path=/; max-age=0; SameSite=Lax";
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

function getTodayString() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return year + "-" + month + "-" + day;
}

function subtitleFor(dateStr) {
  if (!dateStr) return "Pick a date to begin";

  const days = diffDays(dateStr, new Date());
  const absDays = Math.abs(days);

  if (days === 0) {
    return "Today — " + formatDisplayDate(dateStr);
  }
  if (days > 0) {
    return (
      absDays +
      " " +
      pluralize(absDays, "day", "days") +
      " since " +
      formatDisplayDate(dateStr)
    );
  }
  return (
    absDays +
    " " +
    pluralize(absDays, "day", "days") +
    " until " +
    formatDisplayDate(dateStr)
  );
}

function displayCount(dateStr) {
  if (!dateStr) return { number: "—", label: "days" };
  const absDays = Math.abs(diffDays(dateStr, new Date()));
  return {
    number: String(absDays),
    label: pluralize(absDays, "day", "days"),
  };
}

let counters = loadCounters({
  getItem: (k) => localStorage.getItem(k),
  getCookie,
});

// Persist migration once so cookie isn't the source of truth anymore
saveCounters(counters, {
  setItem: (k, v) => localStorage.setItem(k, v),
});
if (getCookie(LEGACY_COOKIE)) {
  clearLegacyCookie();
}

function persist() {
  saveCounters(counters, {
    setItem: (k, v) => localStorage.setItem(k, v),
  });
}

function setCounters(next) {
  counters = next;
  persist();
  render();
}

function render() {
  const canRemove = counters.length > 1;
  listEl.innerHTML = "";

  for (const counter of counters) {
    const { number, label } = displayCount(counter.date);
    const article = document.createElement("article");
    article.className = "counter-block";
    article.dataset.id = counter.id;

    article.innerHTML =
      '<section class="counter-card">' +
      '<div class="counter-card-top">' +
      '<input type="text" class="title-input" data-field="title" ' +
      'placeholder="Name this counter" maxlength="60" aria-label="Counter name" />' +
      (canRemove
        ? '<button type="button" class="remove-btn" data-action="remove" aria-label="Remove counter">Remove</button>'
        : "") +
      "</div>" +
      '<div class="counter-display">' +
      '<span class="counter-number" data-field="number" aria-live="polite"></span>' +
      '<p class="counter-label" data-field="label"></p>' +
      "</div>" +
      '<p class="counter-subtitle" data-field="subtitle"></p>' +
      "</section>" +
      '<section class="input-card">' +
      '<label class="input-label">Start date</label>' +
      '<div class="date-input-row">' +
      '<input type="date" class="date-input" data-field="date" aria-label="Start date" />' +
      '<button type="button" class="today-btn" data-action="today">Today</button>' +
      "</div>" +
      '<p class="input-hint">Saved automatically</p>' +
      "</section>";

    const titleInput = article.querySelector('[data-field="title"]');
    const numberEl = article.querySelector('[data-field="number"]');
    const labelEl = article.querySelector('[data-field="label"]');
    const subtitleEl = article.querySelector('[data-field="subtitle"]');
    const dateInput = article.querySelector('[data-field="date"]');

    titleInput.value = counter.title;
    numberEl.textContent = number;
    labelEl.textContent = label;
    subtitleEl.textContent = subtitleFor(counter.date);
    if (counter.date) dateInput.value = counter.date;

    // Persist without re-render so typing keeps focus
    titleInput.addEventListener("input", () => {
      counters = updateCounter(counters, counter.id, {
        title: titleInput.value,
      });
      persist();
    });

    const onDate = () => {
      const value = dateInput.value;
      if (!value) return;
      counters = updateCounter(counters, counter.id, { date: value });
      persist();
      const shown = displayCount(value);
      numberEl.textContent = shown.number;
      labelEl.textContent = shown.label;
      subtitleEl.textContent = subtitleFor(value);
      numberEl.classList.remove("pop");
      void numberEl.offsetWidth;
      numberEl.classList.add("pop");
    };
    dateInput.addEventListener("change", onDate);
    dateInput.addEventListener("input", onDate);

    article.querySelector('[data-action="today"]').addEventListener("click", () => {
      setCounters(
        updateCounter(counters, counter.id, { date: getTodayString() })
      );
    });

    const removeBtn = article.querySelector('[data-action="remove"]');
    if (removeBtn) {
      removeBtn.addEventListener("click", () => {
        setCounters(removeCounter(counters, counter.id));
      });
    }

    listEl.appendChild(article);

    numberEl.classList.remove("pop");
    void numberEl.offsetWidth;
    numberEl.classList.add("pop");
  }
}

addBtn.addEventListener("click", () => {
  setCounters(addCounter(counters));
});

render();
