const eyes = () => {
  console.log("wtf")

  /* ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ */
  /** 1. Grab the *real* outer wrapper – we give it a data‑attribute so we can target it exactly. */
  const carousel = document.querySelector("[data-carousel]")

  if (!carousel) {
    console.warn(
      "No element with [data-carousel] found – aborting carousel init.",
    )
    return
  }

  /* ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ */
  /** 2. All other elements are now selected relative to that wrapper – no class‑mixing. */
  const container = carousel.querySelector(".items")
  const itemsReal = [...container.children] // only the original set
  const prevBtn = carousel.querySelector(".prev")
  const nextBtn = carousel.querySelector(".next")

  /** 3. How many real items do we have? */
  const N = itemsReal.length

  /* ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ */
  /** 4. Clone a few items on each side – this is what makes the loop “infinite”. */
  const CLONE_COUNT = 1 // tweak if you need more safety

  function cloneSide(arr, count) {
    return arr
      .slice(0, count)
      .map((el) => el.cloneNode(true))
      .concat(arr.slice(-count).map((el) => el.cloneNode(true)))
  }
  const frontClones = cloneSide(itemsReal, CLONE_COUNT)
  const backClones = cloneSide(itemsReal, CLONE_COUNT)

  /* ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ */
  /** 5. Re‑build the container so that the order is: back‑clones → real items → front‑clones. */
  container.innerHTML = ""
  backClones.forEach((el) => container.appendChild(el))
  itemsReal.forEach((el) => container.appendChild(el))
  frontClones.forEach((el) => container.appendChild(el))

  /* ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ */
  /** 6. Basic state variables. */
  let activeIdx = -1 // start at the “other” end – change to 0 for first item
  let animating = false

  /* ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ */
  /** 7. We need the width of a *single* real item + gap.
   *   The values are only meaningful after the first paint – so we wait for `load`. */
  let ITEM_W, GAP
  function measure() {
    ITEM_W = itemsReal[0].offsetWidth // all items are same size
    const computed = window.getComputedStyle(container)
    GAP = parseInt(computed.gap) || 12 // Tailwind default is `gap-3` → 12px
  }

  /* ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ */
  /** 8. Normalise an index to a real 0…N‑1 value. */
  function norm(i) {
    return ((i % N) + N) % N
  }

  /* ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ */
  /** 9. Position the container so that *activeIdx* sits exactly at centre of the viewport. */
  function setOffset(instant = false) {
    const offset = -(norm(activeIdx) + CLONE_COUNT) * (ITEM_W + GAP)
    if (instant) container.style.transition = "none"
    else container.style.transition = ""
    container.style.transform = `translateX(${offset}px)`
  }

  /* ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ */
  /** 10. Highlight the active element – we toggle a tiny Tailwind utility class (`scale-115`). */
  function updateActive() {
    itemsReal.forEach((el) => el.classList.remove("active"))
    const actEl = itemsReal[norm(activeIdx)]
    if (actEl) actEl.classList.add("active")
  }

  /* ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ */
  /** 11. The “move” routine – one click or a key press.  */
  function move(dir) {
    if (animating) return
    animating = true
    activeIdx += dir

    setOffset() // normal transition

    /* we wait for the CSS duration (300 ms + tiny safety). */
    setTimeout(() => {
      if (activeIdx >= N || activeIdx < 0) {
        activeIdx = norm(activeIdx) // instant jump
        setOffset(true)
      }
      updateActive()
      animating = false
    }, 350) // 350 ms > 300 ms CSS duration
  }

  /* ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ */
  /** 12. Wire the arrows & keys. */
  prevBtn.addEventListener("click", () => move(-1))
  nextBtn.addEventListener("click", () => move(+1))

  document.addEventListener("keydown", (e) => {
    if (e.key === "ArrowLeft") prevBtn.click()
    else if (e.key === "ArrowRight") nextBtn.click()
  })

  /* ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ */
  /** 13. Initialise – but only after the page (and its images) is fully loaded. */
  function init() {
    measure() // compute ITEM_W & GAP
    setOffset(true) // instant first positioning
    updateActive()
  }

  if (document.readyState === "complete") init()
  else window.addEventListener("load", init)
}

export default { eyes }
