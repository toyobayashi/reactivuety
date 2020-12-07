let isFlushing = false
let isFlushPending = false
let flushIndex = 0

const queue: Function[] = []
const resolvedPromise = Promise.resolve()
let currentFlushPromise: Promise<void> | null = null

/** @public */
export function nextTick (fn?: () => void): Promise<void> {
  const p = currentFlushPromise ?? resolvedPromise
  return fn ? p.then(fn) : p
}

export function queueJob (job: Function): void {
  if (!queue.length || !queue.includes(job)) {
    queue.push(job)
    queueFlush()
  }
}

function queueFlush (): void {
  if (!isFlushing && !isFlushPending) {
    isFlushPending = true
    currentFlushPromise = resolvedPromise.then(flushJobs)
  }
}

function flushJobs (): void {
  isFlushPending = false
  isFlushing = true

  try {
    for (flushIndex = 0; flushIndex < queue.length; flushIndex++) {
      const job = queue[flushIndex]
      if (job) {
        try {
          job()
        } catch (err) {
          if (typeof console !== 'undefined') {
            console.error(err)
          }
        }
      }
    }
  } finally {
    flushIndex = 0
    queue.length = 0
    isFlushing = false
    currentFlushPromise = null
  }
}
