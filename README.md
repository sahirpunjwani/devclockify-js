# clockify-js

A full clock utility library for JavaScript — stopwatch, timer, alarm, audio & formatters.

---

## Install

```bash
npm install devclockify-js
```

Or use directly in the browser:

```html
<script src="index.js"></script>
<!-- Then use window.devclockify.createStopwatch() etc. -->
```

---

## Stopwatch

```javascript
import { createStopwatch } from 'devclockify-js';

const sw = createStopwatch();

sw.onTick((ms, formatted) => {
  console.log(formatted); // "01:23.45"
});

sw.onLap((lap, allLaps) => {
  console.log('Lap:', lap.formatted);
});

sw.start();
sw.lap();
sw.pause();
sw.reset();

sw.getTime();  // "01:23.45"
sw.getLaps();  // [{n:1, t:5430, formatted:"00:05.43"}, ...]
sw.isRunning(); // true / false
```

---

## Timer

```javascript
import { createTimer } from 'devclockify-js';

const timer = createTimer();

timer.set(0, 5, 30); // 0 hours, 5 minutes, 30 seconds

timer.onTick((secondsLeft, formatted) => {
  console.log(formatted); // "05:30"
});

timer.onDone(() => {
  console.log('Timer done!');
});

timer.start();
timer.pause();
timer.reset();

timer.getTime();        // "04:58"
timer.getSecondsLeft(); // 298
timer.isRunning();      // true / false
```

---

## Alarm

```javascript
import { createAlarmManager } from 'devclockify-js';

const manager = createAlarmManager();

// Add alarms
manager.add('07:00', 'wake up', [1,2,3,4,5]); // Mon–Fri only
manager.add('09:00', 'weekend',  [0,6]);        // Sat & Sun only
manager.add('12:00', 'lunch');                  // every day

// Callbacks
manager.onRing((alarm) => {
  console.log('Ringing:', alarm.label);
  // stop after 10 seconds
  setTimeout(() => manager.stopRing(), 10000);
});

manager.onStop(() => {
  console.log('Alarm stopped');
});

// Start checking (must call this!)
manager.start();

// Manage alarms
manager.getAll();         // all alarms array
manager.toggle(alarmId);  // turn on/off
manager.delete(alarmId);  // remove
manager.clearAll();       // remove all
manager.isRinging();      // true / false
manager.getDayNames([1,2,3]); // ["Mon","Tue","Wed"]
```

---

## Audio

```javascript
import { makeBeep, startRinging, stopRinging } from 'devclockify-js';

makeBeep();           // default beep (880Hz, 0.35s)
makeBeep(440, 0.5);   // lower pitch, longer

const ring = startRinging();       // beeps every 500ms
stopRinging(ring);                 // stop it
```

---

## Formatters

```javascript
import { pad2, fmtSW, fmtTM } from 'devclockify-js';

pad2(5);       // "05"
pad2(12);      // "12"

fmtSW(75430);  // "01:15.43"  (milliseconds → MM:SS.cs)
fmtTM(3665);   // "01:01:05"  (seconds → HH:MM:SS)
fmtTM(125);    // "02:05"     (no hours if under 1hr)
```

---

## License

MIT — free to use in any project.
