// src/formatRelativeTime.js
var SECOND = 1e3;
var MINUTE = 60 * SECOND;
var HOUR = 60 * MINUTE;
var DAY = 24 * HOUR;
var MONTH = 30 * DAY;
var YEAR = 365 * DAY;
var LABELS = {
  en: {
    now: "Now",
    second: ["sec", "sec"],
    minute: ["min", "min"],
    hour: ["hr", "hr"],
    day: ["day", "days"],
    month: ["month", "months"],
    year: ["year", "years"]
  },
  es: {
    now: "Ahora",
    second: ["seg", "seg"],
    minute: ["min", "min"],
    hour: ["h", "h"],
    day: ["d\xEDa", "d\xEDas"],
    month: ["mes", "meses"],
    year: ["a\xF1o", "a\xF1os"]
  }
};
function normalizeLocale(locale) {
  return locale && LABELS[locale] ? locale : "en";
}
function unitLabel(locale, unit, value) {
  const labels = LABELS[normalizeLocale(locale)][unit];
  return value === 1 ? labels[0] : labels[1];
}
function rounded(value) {
  return Math.max(1, Math.floor(value));
}
function parseTimestamp(value) {
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }
  if (typeof value === "number") {
    const milliseconds = value < 1e10 ? value * SECOND : value;
    const date2 = new Date(milliseconds);
    return Number.isNaN(date2.getTime()) ? null : date2;
  }
  if (typeof value !== "string" || value.trim() === "") {
    return null;
  }
  const trimmed = value.trim();
  if (/^\d+$/.test(trimmed)) {
    return parseTimestamp(Number(trimmed));
  }
  const date = new Date(trimmed);
  return Number.isNaN(date.getTime()) ? null : date;
}
function formatRelativeTime(timestamp, options = {}) {
  const date = parseTimestamp(timestamp);
  if (!date) return options.fallback ?? "";
  const locale = normalizeLocale(options.locale);
  const now = parseTimestamp(options.now) ?? /* @__PURE__ */ new Date();
  const elapsed = Math.max(0, now.getTime() - date.getTime());
  const labels = LABELS[locale];
  if (elapsed < 10 * SECOND) return labels.now;
  if (elapsed < MINUTE) {
    const value2 = rounded(elapsed / SECOND);
    return `${value2} ${unitLabel(locale, "second", value2)}`;
  }
  if (elapsed < HOUR) {
    const value2 = rounded(elapsed / MINUTE);
    return `${value2} ${unitLabel(locale, "minute", value2)}`;
  }
  if (elapsed < DAY) {
    const value2 = rounded(elapsed / HOUR);
    return `${value2} ${unitLabel(locale, "hour", value2)}`;
  }
  if (elapsed < MONTH) {
    const value2 = rounded(elapsed / DAY);
    return `${value2} ${unitLabel(locale, "day", value2)}`;
  }
  if (elapsed < YEAR) {
    const value2 = rounded(elapsed / MONTH);
    return `${value2} ${unitLabel(locale, "month", value2)}`;
  }
  const value = rounded(elapsed / YEAR);
  return `${value} ${unitLabel(locale, "year", value)}`;
}
function getNextRefreshDelay(timestamp, options = {}) {
  const date = parseTimestamp(timestamp);
  if (!date) return null;
  const now = parseTimestamp(options.now) ?? /* @__PURE__ */ new Date();
  const elapsed = Math.max(0, now.getTime() - date.getTime());
  if (elapsed < MINUTE) return Math.max(SECOND, SECOND - elapsed % SECOND);
  if (elapsed < HOUR) return Math.max(SECOND, MINUTE - elapsed % MINUTE);
  if (elapsed < DAY) return Math.max(SECOND, HOUR - elapsed % HOUR);
  if (elapsed < MONTH) return Math.max(SECOND, DAY - elapsed % DAY);
  return DAY;
}
var relativeTimeIntervals = {
  SECOND,
  MINUTE,
  HOUR,
  DAY,
  MONTH,
  YEAR
};

// src/RelativeTimestamp.js
var RelativeTimestamp = class {
  constructor(element, options = {}) {
    if (!element) throw new TypeError("RelativeTimestamp requires an element");
    this.element = element;
    this.options = options;
    this.timer = null;
    this.connected = false;
  }
  connect() {
    if (this.connected) return;
    this.connected = true;
    this.refresh();
  }
  disconnect() {
    this.connected = false;
    this.clearTimer();
  }
  refresh() {
    if (!this.connected) return;
    const timestamp = this.timestamp;
    const date = parseTimestamp(timestamp);
    if (!date) return;
    this.element.textContent = formatRelativeTime(date, {
      ...this.options,
      fallback: this.element.textContent,
      locale: this.locale
    });
    this.scheduleNextRefresh(date);
  }
  scheduleNextRefresh(date) {
    this.clearTimer();
    const delay = getNextRefreshDelay(date);
    if (delay === null) return;
    this.timer = window.setTimeout(() => this.refresh(), delay);
  }
  clearTimer() {
    if (this.timer !== null) {
      window.clearTimeout(this.timer);
      this.timer = null;
    }
  }
  get timestamp() {
    return this.element.dataset.timestamp || this.element.dateTime || this.element.dataset.time || null;
  }
  get locale() {
    return this.element.dataset.relativeLocale || this.options.locale || "en";
  }
};

// src/autoRegister.js
var SELECTOR = "[data-relative-timestamp]";
function collectTimestampElements(node) {
  if (!node || node.nodeType !== Node.ELEMENT_NODE) return [];
  const elements = [];
  if (node.matches(SELECTOR)) elements.push(node);
  elements.push(...node.querySelectorAll(SELECTOR));
  return elements;
}
function registerRelativeTimestamps(root = document, options = {}) {
  const controllers = /* @__PURE__ */ new WeakMap();
  const connectedElements = /* @__PURE__ */ new Set();
  const scope = root.documentElement || root;
  function connectElement(element) {
    if (controllers.has(element)) return;
    const controller = new RelativeTimestamp(element, options);
    controllers.set(element, controller);
    connectedElements.add(element);
    controller.connect();
  }
  function disconnectElement(element) {
    const controller = controllers.get(element);
    if (!controller) return;
    controller.disconnect();
    connectedElements.delete(element);
  }
  scope.querySelectorAll(SELECTOR).forEach(connectElement);
  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      mutation.addedNodes.forEach((node) => {
        collectTimestampElements(node).forEach(connectElement);
      });
      mutation.removedNodes.forEach((node) => {
        collectTimestampElements(node).forEach(disconnectElement);
      });
    }
  });
  observer.observe(scope, {
    childList: true,
    subtree: true
  });
  return function cleanup() {
    observer.disconnect();
    connectedElements.forEach(disconnectElement);
  };
}
export {
  RelativeTimestamp,
  formatRelativeTime,
  getNextRefreshDelay,
  parseTimestamp,
  registerRelativeTimestamps,
  relativeTimeIntervals
};
