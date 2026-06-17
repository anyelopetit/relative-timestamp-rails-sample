import { Controller } from "@hotwired/stimulus"
import { RelativeTimestamp } from "relative-timestamp-element"

/**
 * Relative Timestamp Controller
 *
 * Bridges Rails/Stimulus markup to the framework-free
 * `relative-timestamp-element` npm package. It progressively enhances existing
 * fallback text inside a `<time>` element, then keeps the visible label fresh
 * while the controller is connected.
 *
 * Targets:
 * - None
 *
 * Values:
 * - timestamp: ISO datetime, Unix seconds, or Unix milliseconds. Falls back to
 *   the element's `datetime`, `data-timestamp`, or `data-time` attributes.
 * - locale: Locale used for compact labels. Supports `en` and `es`. Defaults
 *   to `en`.
 *
 * Actions:
 * - None
 *
 * Events:
 * - relative-timestamp:connected: Dispatched after the timestamp enhancement is active.
 * - relative-timestamp:disconnected: Dispatched after timers are cleaned up.
 *
 * Accessibility:
 * - Preserves semantic `<time datetime="...">` markup for assistive technology.
 * - Adds `aria-live="polite"` when absent so screen readers may announce label
 *   changes without interrupting the user.
 * - Adds a descriptive `title` when absent to expose the machine-readable time.
 *
 * @example
 * <time
 *   data-controller="relative-timestamp"
 *   data-relative-timestamp-timestamp-value="2026-06-15T12:00:00Z"
 *   data-relative-timestamp-locale-value="es"
 *   datetime="2026-06-15T12:00:00Z"
 * >
 *   5 min
 * </time>
 */
export default class extends Controller {
  static values = {
    timestamp: String,
    locale: { type: String, default: "en" }
  }

  connect() {
    this.#syncDatasetFromValues()
    this.#applyAccessibilityDefaults()

    this.timestampController = new RelativeTimestamp(this.element, {
      locale: this.localeValue
    })
    this.timestampController.connect()

    this.dispatch("connected", {
      detail: { timestamp: this.#timestampValue() }
    })
  }

  disconnect() {
    this.timestampController?.disconnect()
    this.timestampController = null

    this.dispatch("disconnected", {
      detail: { timestamp: this.#timestampValue() }
    })
  }

  timestampValueChanged() {
    if (!this.timestampController) return

    this.#syncDatasetFromValues()
    this.timestampController.refresh()
  }

  localeValueChanged() {
    if (!this.timestampController) return

    this.#syncDatasetFromValues()
    this.timestampController.refresh()
  }

  #syncDatasetFromValues() {
    if (this.hasTimestampValue) {
      this.element.dataset.timestamp = this.timestampValue
    }

    this.element.dataset.relativeLocale = this.localeValue
  }

  #applyAccessibilityDefaults() {
    if (!this.element.hasAttribute("aria-live")) {
      this.element.setAttribute("aria-live", "polite")
    }

    if (!this.element.hasAttribute("title") && this.#timestampValue()) {
      this.element.setAttribute("title", this.#timestampValue())
    }
  }

  #timestampValue() {
    return this.timestampValue || this.element.dateTime || this.element.dataset.timestamp || this.element.dataset.time || null
  }
}
