import { Controller } from "@hotwired/stimulus"

/**
 * Demo Timestamps Controller
 *
 * Demonstrates that timestamps added after initial page load are enhanced by
 * Stimulus and that removing them triggers controller cleanup through the
 * normal Stimulus disconnect lifecycle.
 *
 * Targets:
 * - list: Container that receives dynamically inserted timestamp cards.
 * - status: Polite live region used to announce insertions and removals.
 *
 * Values:
 * - removalDelay: Number of milliseconds before the temporary card is removed.
 *   Defaults to 10000.
 *
 * Actions:
 * - add: Inserts a new timestamp card scoped to this controller.
 *
 * Events:
 * - demo-timestamps:added: Dispatched when a temporary timestamp is inserted.
 * - demo-timestamps:removed: Dispatched when the temporary timestamp is removed.
 *
 * Accessibility:
 * - Announces changes in a polite live region.
 * - Uses a real button for keyboard and pointer activation.
 * - Keeps DOM changes scoped to this controller's targets.
 *
 * @example
 * <section data-controller="demo-timestamps">
 *   <button data-action="demo-timestamps#add">Add timestamp</button>
 *   <p data-demo-timestamps-target="status" aria-live="polite"></p>
 *   <div data-demo-timestamps-target="list"></div>
 * </section>
 */
export default class extends Controller {
  static targets = ["list", "status"]
  static values = {
    removalDelay: { type: Number, default: 10000 }
  }

  connect() {
    this.removalTimers = new Set()
  }

  disconnect() {
    this.removalTimers.forEach((timer) => window.clearTimeout(timer))
    this.removalTimers.clear()
  }

  add(event) {
    event.preventDefault()

    const timestamp = new Date()
    const card = this.#buildCard(timestamp)
    this.listTarget.prepend(card)

    this.#announce("Added a temporary timestamp. It will remove itself in 10 seconds.")
    this.dispatch("added", { detail: { timestamp: timestamp.toISOString() } })

    const timer = window.setTimeout(() => {
      card.remove()
      this.removalTimers.delete(timer)
      this.#announce("Temporary timestamp removed and its Stimulus controller disconnected.")
      this.dispatch("removed", { detail: { timestamp: timestamp.toISOString() } })
    }, this.removalDelayValue)

    this.removalTimers.add(timer)
  }

  #buildCard(timestamp) {
    const card = document.createElement("article")
    card.className = "rounded-[1.5rem] border-2 border-[var(--ht-night)] bg-white p-5 shadow-[6px_6px_0_var(--ht-night)]"

    const label = document.createElement("p")
    label.className = "text-sm font-medium text-[var(--ht-night-60)]"
    label.textContent = "Inserted by Stimulus"

    const time = document.createElement("time")
    time.className = "font-display mt-2 block text-3xl font-semibold tracking-[-0.04em] text-[var(--ht-night)]"
    time.setAttribute("data-controller", "relative-timestamp")
    time.setAttribute("data-relative-timestamp-timestamp-value", timestamp.toISOString())
    time.setAttribute("datetime", timestamp.toISOString())
    time.textContent = "Now"

    card.append(label, time)
    return card
  }

  #announce(message) {
    if (this.hasStatusTarget) {
      this.statusTarget.textContent = message
    }
  }
}
