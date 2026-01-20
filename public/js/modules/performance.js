const queuer_preparator = () => {
  window.action_queuer = []
  window.action_queuer.throttles = []
  window.action_queuer.debounces = []
}

const throttle = (func, limit, name, ...vars) => {
  if (!window.action_queuer.throttles[name]) {
    {
      if (typeof func !== "function") return
      window.action_queuer.throttles[name] = window.performance.now()
      func.apply(this, ...vars)
      return
    }
  }

  if (window.action_queuer.throttles[name] + limit > window.performance.now()) {
    return
  }

  if (typeof func !== "function") return
  window.action_queuer.throttles[name] = window.performance.now()
  func.apply(this, ...vars)
}

const debounce = (func, delay, name, ...vars) => {
  if (!window.action_queuer.debounces[name]) {
    window.action_queuer.debounces[name] = setTimeout(() => {
      if (typeof func !== "function") return
      func.apply(this, ...vars)
    }, delay)

    return
  }

  clearTimeout(window.action_queuer.debounces[name])
  window.action_queuer.debounces[name] = setTimeout(() => {
    if (typeof func !== "function") return
    func.apply(this, ...vars)
  }, delay)
}

const input_buffer_of_doom_rawr_xd = (name, ms, ...vars) => {
  window.action_queuer.push()
}

export { queuer_preparator, throttle, debounce }
