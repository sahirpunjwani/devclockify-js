/**
 * clockify-js
 * A full clock utility library — stopwatch, timer, alarm, audio & formatters.
 * GitHub: github.com/sahirpunjwani/clockify-js
 */

// ============================================================
// FORMATTERS
// ============================================================

/**
 * Pads a number to 2 digits.
 * pad2(5) → "05"
 */
function pad2(n) {
  return String(Math.floor(n)).padStart(2, '0');
}

/**
 * Formats milliseconds to stopwatch string.
 * fmtSW(75430) → "01:15.43"
 */
function fmtSW(ms) {
  const totalSec = ms / 1000;
  const m = Math.floor(totalSec / 60);
  const s = Math.floor(totalSec % 60);
  const cs = Math.floor((ms % 1000) / 10);
  return `${pad2(m)}:${pad2(s)}.${pad2(cs)}`;
}

/**
 * Formats total seconds to timer string.
 * fmtTM(3665) → "01:01:05"
 * fmtTM(125)  → "02:05"
 */
function fmtTM(totalSec) {
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  return h > 0
    ? `${pad2(h)}:${pad2(m)}:${pad2(s)}`
    : `${pad2(m)}:${pad2(s)}`;
}


// ============================================================
// AUDIO
// ============================================================

/**
 * Plays a single beep using the Web Audio API.
 * @param {number} freq - Frequency in Hz (default 880)
 * @param {number} dur  - Duration in seconds (default 0.35)
 *
 * Example:
 * makeBeep();         // default beep
 * makeBeep(440, 0.5); // lower pitch, longer
 */
function makeBeep(freq = 880, dur = 0.35) {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'sine';
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + dur);
  } catch (e) {}
}

/**
 * Starts ringing — beeps every 500ms continuously.
 * Returns an interval ID — pass it to stopRinging() to stop.
 *
 * Example:
 * const ring = startRinging();
 * setTimeout(() => stopRinging(ring), 5000); // stop after 5s
 */
function startRinging() {
  makeBeep();
  return setInterval(() => makeBeep(), 500);
}

/**
 * Stops a ringing interval started by startRinging().
 * @param {number} intervalId - The ID returned by startRinging()
 */
function stopRinging(intervalId) {
  clearInterval(intervalId);
}


// ============================================================
// STOPWATCH
// ============================================================

/**
 * Creates a stopwatch instance.
 *
 * Example:
 * const sw = createStopwatch();
 * sw.start();
 * sw.lap();
 * sw.pause();
 * sw.reset();
 * console.log(sw.getTime());  // "01:23.45"
 * console.log(sw.getLaps());  // [{n:1, t:5430, formatted:"00:05.43"}]
 */
function createStopwatch() {
  let running = false;
  let ms = 0;
  let lapMs = 0;
  let lapCount = 0;
  let laps = [];
  let interval = null;
  let startTime = 0;
  let onTickCb = null;
  let onLapCb = null;

  return {
    /** Start or resume the stopwatch */
    start() {
      if (running) return;
      startTime = Date.now() - ms;
      interval = setInterval(() => {
        ms = Date.now() - startTime;
        if (onTickCb) onTickCb(ms, fmtSW(ms));
      }, 50);
      running = true;
    },

    /** Pause the stopwatch */
    pause() {
      if (!running) return;
      clearInterval(interval);
      running = false;
    },

    /** Reset everything back to zero */
    reset() {
      clearInterval(interval);
      running = false;
      ms = 0; lapMs = 0; lapCount = 0; laps = [];
    },

    /** Record a lap (only works while running and ms > 0) */
    lap() {
      if (!running || ms === 0) return null;
      lapCount++;
      const lapTime = ms - lapMs;
      lapMs = ms;
      const lapObj = { n: lapCount, t: lapTime, formatted: fmtSW(lapTime) };
      laps.unshift(lapObj);
      if (onLapCb) onLapCb(lapObj, laps);
      return lapObj;
    },

    /** Get current elapsed time in ms */
    getMs() { return ms; },

    /** Get current elapsed time as formatted string */
    getTime() { return fmtSW(ms); },

    /** Get all recorded laps */
    getLaps() { return laps; },

    /** Is the stopwatch currently running? */
    isRunning() { return running; },

    /**
     * Callback fired every tick (every ~50ms)
     * @param {function} cb - (ms, formattedTime) => void
     */
    onTick(cb) { onTickCb = cb; },

    /**
     * Callback fired when a lap is recorded
     * @param {function} cb - (lapObj, allLaps) => void
     */
    onLap(cb) { onLapCb = cb; },
  };
}


// ============================================================
// TIMER
// ============================================================

/**
 * Creates a countdown timer instance.
 *
 * Example:
 * const timer = createTimer();
 * timer.set(0, 5, 30);   // set to 0h 5m 30s
 * timer.start();
 * timer.onDone(() => console.log('done!'));
 * timer.onTick((left, formatted) => console.log(formatted));
 */
function createTimer() {
  let running = false;
  let totalSec = 0;
  let secondsLeft = 0;
  let interval = null;
  let onTickCb = null;
  let onDoneCb = null;

  return {
    /**
     * Set the countdown duration
     * @param {number} h - hours (max 23)
     * @param {number} m - minutes (max 59)
     * @param {number} s - seconds (max 59)
     */
    set(h = 0, m = 0, s = 0) {
      if (running) return;
      h = Math.min(Math.max(parseInt(h) || 0, 0), 23);
      m = Math.min(Math.max(parseInt(m) || 0, 0), 59);
      s = Math.min(Math.max(parseInt(s) || 0, 0), 59);
      totalSec = h * 3600 + m * 60 + s;
      secondsLeft = totalSec;
    },

    /** Start or resume the timer */
    start() {
      if (running || secondsLeft === 0) return;
      const endTime = Date.now() + secondsLeft * 1000;
      interval = setInterval(() => {
        secondsLeft = Math.max(0, Math.round((endTime - Date.now()) / 1000));
        if (onTickCb) onTickCb(secondsLeft, fmtTM(secondsLeft));
        if (secondsLeft === 0) {
          clearInterval(interval);
          running = false;
          if (onDoneCb) onDoneCb();
        }
      }, 200);
      running = true;
    },

    /** Pause the timer */
    pause() {
      if (!running) return;
      clearInterval(interval);
      running = false;
    },

    /** Reset timer back to the last set duration */
    reset() {
      clearInterval(interval);
      running = false;
      secondsLeft = totalSec;
    },

    /** Get seconds remaining */
    getSecondsLeft() { return secondsLeft; },

    /** Get formatted time remaining */
    getTime() { return fmtTM(secondsLeft); },

    /** Is the timer currently running? */
    isRunning() { return running; },

    /**
     * Callback fired every tick
     * @param {function} cb - (secondsLeft, formattedTime) => void
     */
    onTick(cb) { onTickCb = cb; },

    /**
     * Callback fired when timer reaches zero
     * @param {function} cb - () => void
     */
    onDone(cb) { onDoneCb = cb; },
  };
}


// ============================================================
// ALARM
// ============================================================

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/**
 * Creates an alarm manager instance.
 * Alarms are saved to localStorage automatically.
 *
 * Example:
 * const alarmManager = createAlarmManager();
 * alarmManager.add('07:00', 'wake up', [1,2,3,4,5]); // Mon–Fri
 * alarmManager.onRing((alarm) => console.log('Ringing:', alarm.label));
 * alarmManager.start(); // starts checking every second
 */
function createAlarmManager(storageKey = 'clockify-alarms') {
  let alarms = _loadAlarms(storageKey);
  let ringInterval = null;
  let firedMinutes = new Set();
  let onRingCb = null;
  let onStopCb = null;
  let checkInterval = null;

  function _loadAlarms(key) {
    try { return JSON.parse(localStorage.getItem(key) || '[]'); }
    catch (e) { return []; }
  }

  function _saveAlarms() {
    localStorage.setItem(storageKey, JSON.stringify(alarms));
  }

  return {
    /**
     * Add a new alarm
     * @param {string} time     - "HH:MM" format e.g. "07:00"
     * @param {string} label    - optional label e.g. "wake up"
     * @param {number[]} days   - days to ring [0=Sun,1=Mon...6=Sat], empty = every day
     * @returns {object|null}   - the alarm object, or null if duplicate
     *
     * Example:
     * manager.add('07:00', 'wake up', [1,2,3,4,5]); // weekdays only
     * manager.add('09:00', 'weekend', [0,6]);         // weekends only
     * manager.add('12:00', 'lunch');                  // every day
     */
    add(time, label = '', days = []) {
      if (!time) return null;

      // Check for duplicate
      const duplicate = alarms.some(a => {
        const aDays = [...(a.days || [])].sort().join(',');
        const newDays = [...days].sort().join(',');
        return a.time === time && aDays === newDays;
      });
      if (duplicate) return null;

      const alarm = { id: Date.now(), time, label, on: true, days };
      alarms.push(alarm);
      _saveAlarms();
      return alarm;
    },

    /**
     * Delete an alarm by its id
     * @param {number} id - the alarm's id
     */
    delete(id) {
      alarms = alarms.filter(a => a.id !== id);
      _saveAlarms();
    },

    /**
     * Toggle an alarm on or off
     * @param {number} id - the alarm's id
     */
    toggle(id) {
      const alarm = alarms.find(a => a.id === id);
      if (alarm) { alarm.on = !alarm.on; _saveAlarms(); }
    },

    /** Get all alarms */
    getAll() { return alarms; },

    /** Get a single alarm by id */
    getById(id) { return alarms.find(a => a.id === id) || null; },

    /** Clear all alarms */
    clearAll() { alarms = []; _saveAlarms(); },

    /**
     * Start the alarm checker — checks every second
     * Must be called for alarms to actually fire.
     */
    start() {
      if (checkInterval) return;
      checkInterval = setInterval(() => {
        const now = new Date();
        const hh = pad2(now.getHours());
        const mm = pad2(now.getMinutes());
        const ss = now.getSeconds();
        const currentTime = `${hh}:${mm}`;
        const currentDay = now.getDay();

        if (ss === 0 && !firedMinutes.has(currentTime)) {
          alarms.forEach(alarm => {
            if (!alarm.on || ringInterval) return;
            if (alarm.time !== currentTime) return;
            const daysOk = !alarm.days || alarm.days.length === 0 || alarm.days.includes(currentDay);
            if (daysOk) {
              firedMinutes.add(currentTime);
              ringInterval = startRinging();
              if (onRingCb) onRingCb(alarm);
            }
          });
        }

        if (hh === '00' && mm === '00' && ss === 0) firedMinutes.clear();
      }, 1000);
    },

    /** Stop the alarm checker */
    stop() {
      clearInterval(checkInterval);
      checkInterval = null;
    },

    /** Stop the currently ringing alarm */
    stopRing() {
      stopRinging(ringInterval);
      ringInterval = null;
      if (onStopCb) onStopCb();
    },

    /** Is an alarm currently ringing? */
    isRinging() { return ringInterval !== null; },

    /**
     * Callback fired when an alarm rings
     * @param {function} cb - (alarm) => void
     */
    onRing(cb) { onRingCb = cb; },

    /**
     * Callback fired when ringing stops
     * @param {function} cb - () => void
     */
    onStop(cb) { onStopCb = cb; },

    /**
     * Get human readable day names for a days array
     * getDayNames([1,2,3]) → ["Mon","Tue","Wed"]
     */
    getDayNames(days) { return days.map(d => DAY_NAMES[d]); },
  };
}


// ============================================================
// EXPORTS
// ============================================================

// For npm / ES modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    // Formatters
    pad2, fmtSW, fmtTM,
    // Audio
    makeBeep, startRinging, stopRinging,
    // Stopwatch
    createStopwatch,
    // Timer
    createTimer,
    // Alarm
    createAlarmManager,
  };
}

// For browser <script> tag — attaches to window.Clockify
if (typeof window !== 'undefined') {
  window.devclockify = {
    pad2, fmtSW, fmtTM,
    makeBeep, startRinging, stopRinging,
    createStopwatch,
    createTimer,
    createAlarmManager,
  };
}
