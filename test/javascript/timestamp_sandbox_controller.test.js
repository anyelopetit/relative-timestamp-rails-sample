import { Application } from "@hotwired/stimulus"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import TimestampSandboxController from "../../app/javascript/controllers/timestamp_sandbox_controller.js"
import RelativeTimestampController from "../../app/javascript/controllers/relative_timestamp_controller.js"

const now = new Date("2026-06-15T12:00:00.000Z")

function sandboxHTML() {
  return `
    <section data-controller="timestamp-sandbox">
      <span data-timestamp-sandbox-target="activeMetric">0</span>
      <span data-timestamp-sandbox-target="resultCount">0</span>
      <p data-timestamp-sandbox-target="status"></p>
      <select data-timestamp-sandbox-target="customLocale"><option value="en">English</option><option value="es">Spanish</option></select>
      <input type="datetime-local" data-timestamp-sandbox-target="customDatetime">
      <button data-action="timestamp-sandbox#runMixedBatch">Run basic batch</button>
      <button data-action="timestamp-sandbox#runEnglishBatch">Run English batch</button>
      <button data-action="timestamp-sandbox#runSpanishBatch">Run Spanish batch</button>
      <button data-action="timestamp-sandbox#addCustom">Add custom timestamp</button>
      <button data-action="timestamp-sandbox#setNow">Set to Now</button>
      <button data-action="timestamp-sandbox#clear">Clear</button>
      <div data-timestamp-sandbox-target="emptyState">Empty</div>
      <div data-timestamp-sandbox-target="list"></div>
    </section>
  `
}

async function nextTick() {
  await Promise.resolve()
  await Promise.resolve()
}

function labels() {
  return Array.from(document.querySelectorAll("[data-timestamp-sandbox-card] time"), (time) => time.textContent)
}

function locales() {
  return Array.from(document.querySelectorAll("[data-timestamp-sandbox-card] time"), (time) => time.dataset.relativeTimestampLocaleValue)
}

function datetimeLocalValue(date) {
  const offsetDate = new Date(date.getTime() - date.getTimezoneOffset() * 60_000)
  return offsetDate.toISOString().slice(0, 16)
}

describe("timestamp sandbox Stimulus integration", () => {
  let application

  beforeEach(async () => {
    vi.useFakeTimers()
    vi.setSystemTime(now)
    document.body.innerHTML = sandboxHTML()
    application = Application.start()
    application.register("timestamp-sandbox", TimestampSandboxController)
    application.register("relative-timestamp", RelativeTimestampController)
    await nextTick()
  })

  afterEach(() => {
    application.stop()
    document.body.innerHTML = ""
    vi.useRealTimers()
  })

  it("runs a 10-card mixed batch with varied labels", async () => {
    document.querySelector('[data-action="timestamp-sandbox#runMixedBatch"]').click()
    await nextTick()

    expect(document.querySelectorAll("[data-timestamp-sandbox-card]")).toHaveLength(10)
    expect(locales()).toContain("en")
    expect(locales()).toContain("es")
    expect(labels().some((label) => label !== "Now" && label !== "Ahora")).toBe(true)
    expect(document.querySelector('[data-timestamp-sandbox-target="resultCount"]').textContent).toBe("10")
    expect(document.querySelector('[data-timestamp-sandbox-target="emptyState"]').hidden).toBe(true)
  })

  it("runs a 10-card English batch", async () => {
    document.querySelector('[data-action="timestamp-sandbox#runEnglishBatch"]').click()
    await nextTick()

    expect(document.querySelectorAll("[data-timestamp-sandbox-card]")).toHaveLength(10)
    expect(locales().every((locale) => locale === "en")).toBe(true)
    expect(labels()).toContain("2 hr")
    expect(labels()).toContain("22 days")
  })

  it("runs a 10-card Spanish batch", async () => {
    document.querySelector('[data-action="timestamp-sandbox#runSpanishBatch"]').click()
    await nextTick()

    expect(document.querySelectorAll("[data-timestamp-sandbox-card]")).toHaveLength(10)
    expect(locales().every((locale) => locale === "es")).toBe(true)
    expect(labels()).toContain("2 h")
    expect(labels()).toContain("22 días")
  })

  it("adds one custom English timestamp", async () => {
    document.querySelector('[data-timestamp-sandbox-target="customLocale"]').value = "en"
    document.querySelector('[data-timestamp-sandbox-target="customDatetime"]').value = datetimeLocalValue(new Date(now.getTime() - 2 * 60 * 60 * 1000))
    document.querySelector('[data-action="timestamp-sandbox#addCustom"]').click()
    await nextTick()

    expect(document.querySelectorAll("[data-timestamp-sandbox-card]")).toHaveLength(1)
    expect(labels()).toEqual(["2 hr"])
  })

  it("adds one custom Spanish timestamp", async () => {
    document.querySelector('[data-timestamp-sandbox-target="customLocale"]').value = "es"
    document.querySelector('[data-timestamp-sandbox-target="customDatetime"]').value = datetimeLocalValue(new Date(now.getTime() - 2 * 60 * 60 * 1000))
    document.querySelector('[data-action="timestamp-sandbox#addCustom"]').click()
    await nextTick()

    expect(document.querySelectorAll("[data-timestamp-sandbox-card]")).toHaveLength(1)
    expect(labels()).toEqual(["2 h"])
  })

  it("validates custom timestamp input", async () => {
    document.querySelector('[data-action="timestamp-sandbox#addCustom"]').click()
    await nextTick()

    expect(document.querySelectorAll("[data-timestamp-sandbox-card]")).toHaveLength(0)
    expect(document.querySelector('[data-timestamp-sandbox-target="status"]').textContent).toBe("Choose a date and time first.")
  })

  it("sets a custom timestamp to now and counts seconds from there", async () => {
    document.querySelector('[data-action="timestamp-sandbox#setNow"]').click()
    await nextTick()

    expect(document.querySelectorAll("[data-timestamp-sandbox-card]")).toHaveLength(1)
    expect(document.querySelector('[data-timestamp-sandbox-target="customDatetime"]').value).toBe(datetimeLocalValue(now))
    expect(labels()).toEqual(["Now"])

    await vi.advanceTimersByTimeAsync(30_000)
    await nextTick()

    expect(labels()).toEqual(["30 sec"])
  })

  it("clears generated cards", async () => {
    document.querySelector('[data-action="timestamp-sandbox#runMixedBatch"]').click()
    await nextTick()

    document.querySelector('[data-action="timestamp-sandbox#clear"]').click()
    await nextTick()

    expect(document.querySelectorAll("[data-timestamp-sandbox-card]")).toHaveLength(0)
    expect(document.querySelector('[data-timestamp-sandbox-target="emptyState"]').hidden).toBe(false)
  })
})
