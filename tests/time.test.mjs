// Runs under the UK timezone, where the clocks go forward in March (a 23-hour day) and back in October.
process.env.TZ = 'Europe/London';

import test from 'node:test';
import assert from 'node:assert/strict';
import { streakDays, activityByDay, dayKey, addDays, daysToTest, todayCount } from '../js/engine.js';

const at = (y, m, d, h = 12) => new Date(y, m - 1, d, h, 0, 0).getTime();
const att = (t, i) => ({ id: `a${i}`, q: 'x', ok: true, t, sel: [] });

test('the test environment really is on UK time', () => {
  assert.equal(new Date(2025, 2, 30, 12).getTimezoneOffset(), -60, 'BST after the change');
  assert.equal(new Date(2025, 2, 29, 12).getTimezoneOffset(), 0, 'GMT before it');
});

test('streak is correct across the spring-forward change (31 Mar 2025)', () => {
  const now = at(2025, 3, 31, 9);
  const sat = at(2025, 3, 29), sun = at(2025, 3, 30), mon = at(2025, 3, 31);
  assert.equal(streakDays([att(sat, 1), att(sun, 2), att(mon, 3)], now), 3);
  assert.equal(streakDays([att(sat, 1), att(mon, 3)], now), 1, 'Sunday missed, so the streak is just Monday');
  assert.equal(streakDays([att(sat, 1), att(sun, 2)], now), 2, 'nothing yet today still counts yesterday');
});

test('streak is correct across the autumn change (27 Oct 2025)', () => {
  const now = at(2025, 10, 27, 9);
  assert.equal(streakDays([att(at(2025, 10, 25), 1), att(at(2025, 10, 26), 2), att(at(2025, 10, 27), 3)], now), 3);
});

test('heatmap days are consecutive calendar dates across a clock change', () => {
  const now = at(2025, 4, 2, 10);
  const days = activityByDay([att(at(2025, 3, 30), 1)], 7, now);
  assert.deepEqual(days.map((d) => d.key), ['2025-03-27', '2025-03-28', '2025-03-29', '2025-03-30', '2025-03-31', '2025-04-01', '2025-04-02']);
  assert.equal(days.find((d) => d.key === '2025-03-30').n, 1, 'Sunday 30 March activity is drawn');
});

test('addDays steps by calendar days and daysToTest counts whole days over the change', () => {
  assert.equal(dayKey(addDays(at(2025, 3, 29, 0), 1)), '2025-03-30');
  assert.equal(dayKey(addDays(at(2025, 3, 30, 0), 1)), '2025-03-31');
  assert.equal(dayKey(addDays(at(2025, 10, 25, 0), 2)), '2025-10-27');
  assert.equal(daysToTest('2025-04-01', at(2025, 3, 28, 15)), 4);
  assert.equal(todayCount([att(at(2025, 3, 30, 0, 30), 1), att(at(2025, 3, 30, 23), 2)], at(2025, 3, 30, 12)), 2);
});
