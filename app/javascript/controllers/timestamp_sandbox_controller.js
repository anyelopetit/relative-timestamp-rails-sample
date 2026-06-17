import { Controller } from "@hotwired/stimulus"

const SECOND = 1000
const MINUTE = 60 * SECOND
const HOUR = 60 * MINUTE
const DAY = 24 * HOUR

const SAMPLE_AGES = [
  0,
  30 * SECOND,
  5 * MINUTE,
  45 * MINUTE,
  2 * HOUR,
  6 * HOUR,
  12 * HOUR,
  23 * HOUR,
  2 * DAY,
  22 * DAY
]

/**
 * Timestamp Sandbox Controller
 *
 * Provides a small, understandable playground for the Hellotext relative
 * timestamp element. It generates bounded sample batches and custom timestamp
 * cards using the real `data-controller="relative-timestamp"` integration.
 *
 * Targets:
 * - list: Container where generated timestamp cards are inserted.
 * - emptyState: Placeholder shown while no generated cards exist.
 * - status: Polite live region for action feedback.
 * - customLocale: Locale select for custom timestamp creation.
 * - customDatetime: Native datetime-local input for one custom timestamp.
 * - activeMetric: Visible count of active timestamp cards.
 * - resultCount: Visible active-card count in the results panel.
 *
 * Actions:
 * - runMixedBatch: Replaces results with 10 alternating English/Spanish samples.
 * - runEnglishBatch: Replaces results with 10 English samples.
 * - runSpanishBatch: Replaces results with 10 Spanish samples.
 * - addCustom: Adds one timestamp from the custom datetime-local input.
 * - setNow: Sets the custom datetime to now and adds it immediately.
 * - clear: Removes all generated cards and restores the empty state.
 *
 * Events:
 * - timestamp-sandbox:generated: Dispatched after a batch insert.
 * - timestamp-sandbox:custom-added: Dispatched after one custom card is added.
 * - timestamp-sandbox:cleared: Dispatched after all generated cards are removed.
 *
 * Accessibility:
 * - Uses native buttons, selects, and datetime-local input.
 * - Announces action results through a polite live region.
 * - Keeps all DOM writes scoped to this controller's targets.
 *
 * @example
 * <section data-controller="timestamp-sandbox">
 *   <button data-action="timestamp-sandbox#runMixedBatch">Run basic batch</button>
 *   <input type="datetime-local" data-timestamp-sandbox-target="customDatetime">
 *   <div data-timestamp-sandbox-target="list"></div>
 * </section>
 */
export default class extends Controller {
  static targets = [
    "list",
    "emptyState",
    "status",
    "customLocale",
    "customDatetime",
    "activeMetric",
    "resultCount"
  ]

  connect() {
    this.#renderMetrics()
    this.#announce("Sandbox ready.")
  }

  runMixedBatch(event) {
    event.preventDefault()
    this.#replaceWithSamples((index) => (index % 2 === 0 ? "en" : "es"))
    this.#announce("Generated 10 mixed timestamps.")
    this.dispatch("generated", { detail: { count: 10, locale: "mixed" } })
  }

  runEnglishBatch(event) {
    event.preventDefault()
    this.#replaceWithSamples(() => "en")
    this.#announce("Generated 10 English timestamps.")
    this.dispatch("generated", { detail: { count: 10, locale: "en" } })
  }

  runSpanishBatch(event) {
    event.preventDefault()
    this.#replaceWithSamples(() => "es")
    this.#announce("Generated 10 Spanish timestamps.")
    this.dispatch("generated", { detail: { count: 10, locale: "es" } })
  }

  addCustom(event) {
    event.preventDefault()

    if (!this.hasCustomDatetimeTarget || this.customDatetimeTarget.value.trim() === "") {
      this.#announce("Choose a date and time first.")
      return
    }

    const timestamp = new Date(this.customDatetimeTarget.value)
    if (Number.isNaN(timestamp.getTime())) {
      this.#announce("Choose a valid date and time.")
      return
    }

    this.listTarget.prepend(this.#buildCard(timestamp, this.#customLocale()))
    this.customDatetimeTarget.value = ""
    this.#renderMetrics()
    this.#announce("Added custom timestamp.")
    this.dispatch("custom-added", { detail: { timestamp: timestamp.toISOString(), locale: this.#customLocale() } })
  }

  setNow(event) {
    event.preventDefault()

    const timestamp = new Date()
    if (this.hasCustomDatetimeTarget) {
      this.customDatetimeTarget.value = this.#datetimeLocalValue(timestamp)
    }

    this.listTarget.prepend(this.#buildCard(timestamp, this.#customLocale()))
    this.#renderMetrics()
    this.#announce("Added timestamp for now. Watch it count up from here.")
    this.dispatch("custom-added", { detail: { timestamp: timestamp.toISOString(), locale: this.#customLocale() } })
  }

  clear(event) {
    event.preventDefault()

    const removedCount = this.#cards().length
    this.listTarget.replaceChildren()
    this.#renderMetrics()
    this.#announce(removedCount === 0 ? "Sandbox is already clear." : `Cleared ${removedCount} timestamps.`)
    this.dispatch("cleared", { detail: { removed: removedCount } })
  }

  #replaceWithSamples(localeForIndex) {
    const fragment = document.createDocumentFragment()
    const now = Date.now()

    SAMPLE_AGES.forEach((age, index) => {
      fragment.append(this.#buildCard(new Date(now - age), localeForIndex(index)))
    })

    this.listTarget.replaceChildren(fragment)
    this.#renderMetrics()
  }

  #buildCard(timestamp, locale) {
    const card = document.createElement("article")
    card.className = "rounded-[1.35rem] border border-[var(--ht-night-10)] bg-white p-4 transition-colors duration-200 hover:border-[var(--ht-indigo)]"
    card.dataset.timestampSandboxCard = "true"

    const label = document.createElement("p")
    label.className = "text-xs font-semibold uppercase tracking-[0.16em] text-[var(--ht-night-60)]"
    label.textContent = locale === "es" ? "Marca de tiempo" : "Timestamp sample"

    const time = document.createElement("time")
    time.className = "font-display mt-2 block text-3xl font-semibold tracking-[-0.04em] text-[var(--ht-night)]"
    time.setAttribute("data-controller", "relative-timestamp")
    time.setAttribute("data-relative-timestamp-timestamp-value", timestamp.toISOString())
    time.setAttribute("data-relative-timestamp-locale-value", locale)
    time.setAttribute("datetime", timestamp.toISOString())
    time.textContent = locale === "es" ? "Ahora" : "Now"

    const meta = document.createElement("p")
    meta.className = "mt-3 truncate text-xs text-[var(--ht-night-60)]"
    meta.textContent = timestamp.toISOString()

    card.append(label, time, meta)
    return card
  }

  #customLocale() {
    return this.hasCustomLocaleTarget ? this.customLocaleTarget.value : "en"
  }

  #datetimeLocalValue(date) {
    const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60_000)
    return localDate.toISOString().slice(0, 16)
  }

  #renderMetrics() {
    const activeCards = this.#cards().length
    this.#setText(this.hasActiveMetricTarget ? this.activeMetricTarget : null, activeCards)
    this.#setText(this.hasResultCountTarget ? this.resultCountTarget : null, activeCards)

    if (this.hasEmptyStateTarget) {
      this.emptyStateTarget.hidden = activeCards > 0
    }

    if (this.hasListTarget) {
      this.listTarget.classList.toggle("mt-0", activeCards === 0)
      this.listTarget.classList.toggle("mt-4", activeCards > 0)
    }
  }

  #cards() {
    if (!this.hasListTarget) return []

    return Array.from(this.listTarget.querySelectorAll("[data-timestamp-sandbox-card]"))
  }

  #setText(target, value) {
    if (target) target.textContent = value.toLocaleString()
  }

  #announce(message) {
    if (this.hasStatusTarget) this.statusTarget.textContent = message
  }
}
