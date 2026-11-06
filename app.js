
/* ===== Division Dash engine (from v11) ===== */
(function () {
  "use strict";
  function randInt(a, b) { return a + Math.floor(Math.random() * (b - a + 1)); }

  /** Build the reference (correct-answer) DMSCB step list for dividend ÷ divisor. */
  function buildSteps(dividend, divisor) {
    const digs = String(dividend).split("").map(Number);
    const steps = [];
    let idx = 0;
    let working = 0;
    let quotientDigits = [];
    let started = false;
    let bringPending = null;

    // Take enough leading digits so working >= divisor (or all digits)
    while (idx < digs.length && working < divisor) {
      working = working * 10 + digs[idx];
      idx++;
    }

    while (true) {
      const qDigit = Math.floor(working / divisor);
      const product = qDigit * divisor;
      const diff = working - product;

      // Leading zeros in quotient only after we've started writing digits,
      // except when working was built from multiple leading digits and qDigit is 0
      // Standard long division: once we've consumed enough digits for first non-zero
      // quotient digit, every subsequent digit of dividend produces a quotient digit.
      if (!started) {
        if (qDigit === 0 && idx < digs.length) {
          // Still building — shouldn't happen if we seeded correctly, but guard
          working = working * 10 + digs[idx];
          idx++;
          continue;
        }
        started = true;
      }

      steps.push({
        type: "divide",
        prompt: "Divide",
        working,
        divisor,
        expected: qDigit,
        hintSoft: "Estimate how many times " + divisor + " goes into " + working + ".",
        hintHard: "How many times does " + divisor + " go into " + working + "? (Whole number 0–9)",
        quotIndex: quotientDigits.length
      });
      quotientDigits.push(qDigit);

      steps.push({
        type: "multiply",
        prompt: "Multiply",
        expected: product,
        qDigit,
        divisor,
        hintSoft: "Multiply the divisor by the digit you just found.",
        hintHard: "What is " + divisor + " × " + qDigit + "?",
        quotIndex: quotientDigits.length - 1
      });

      steps.push({
        type: "subtract",
        prompt: "Subtract",
        expected: diff,
        working,
        product,
        hintSoft: "Subtract the product from the working number.",
        hintHard: "What is " + working + " − " + product + "?",
        quotIndex: quotientDigits.length - 1
      });

      if (idx >= digs.length) {
        steps.push({
          type: "remainder",
          prompt: "Remainder",
          expected: diff,
          hintSoft: "What's left over? (Remainder must be < " + divisor + ")",
          hintHard: "The remainder is what's left after the last subtract: " + diff + " — enter it to confirm.",
          quotIndex: quotientDigits.length - 1
        });
        break;
      }

      const nextDigit = digs[idx];
      steps.push({
        type: "bringdown",
        prompt: "Bring down",
        expected: nextDigit,
        hintSoft: "Bring down the next digit of the dividend.",
        hintHard: "The next digit to bring down is from the dividend.",
        quotIndex: quotientDigits.length - 1,
        digitIndex: idx
      });
      working = diff * 10 + nextDigit;
      idx++;
    }

    const q = Math.floor(dividend / divisor);
    const r = dividend % divisor;
    // First quotient digit sits above the last digit of the smallest leading prefix ≥ divisor
    let firstPlacement = 0;
    let w0 = 0;
    for (let i = 0; i < digs.length; i++) {
      w0 = w0 * 10 + digs[i];
      if (w0 >= divisor) { firstPlacement = i; break; }
      firstPlacement = i;
    }
    return {
      dividend,
      divisor,
      quotient: q,
      remainder: r,
      digs,
      quotientDigits,
      steps,
      firstPlacement
    };
  }

  /** 0-based dividend column index where the first quotient digit belongs. */
  function firstPlacementIndex(dividend, divisor) {
    const digs = String(dividend).split("").map(Number);
    let w = 0;
    for (let i = 0; i < digs.length; i++) {
      w = w * 10 + digs[i];
      if (w >= divisor) return i;
    }
    return digs.length - 1;
  }

  /** Soft/hard hints for the placement step. */
  function placementHints(dividend, divisor) {
    const digs = String(dividend).split("").map(Number);
    const correct = firstPlacementIndex(dividend, divisor);
    const prefixes = [];
    let w = 0;
    for (let i = 0; i < digs.length; i++) {
      w = w * 10 + digs[i];
      prefixes.push(w);
      if (i >= correct) break;
    }
    const soft = "Tap the digit column where the first quotient digit belongs — how many leading digits does " + divisor + " fit into?";
    let hard;
    if (correct === 0) {
      hard = "Does " + divisor + " go into " + prefixes[0] + "? Yes — so the first quotient digit goes above the first digit.";
    } else {
      const tooSmall = prefixes[correct - 1];
      const justRight = prefixes[correct];
      hard = "Does " + divisor + " go into " + tooSmall + "? No. What about " + justRight + "? Yes — so tap the column above the last digit of " + justRight + ".";
    }
    return { soft, hard, correct };
  }

  function generateProblem(level, allowRemainder) {
    let divisor, dividend, q, r;
    for (let attempt = 0; attempt < 60; attempt++) {
      if (level <= 1) {
        // Level 1: mix 1-digit and 2-digit divisors from the start
        if (Math.random() < 0.5) {
          divisor = randInt(2, 9);
          q = randInt(10, 99);
        } else {
          divisor = randInt(11, 29);
          q = randInt(2, 20);
        }
      } else if (level === 2) {
        if (Math.random() < 0.45) {
          divisor = randInt(2, 9);
          q = randInt(100, 999);
        } else {
          divisor = randInt(11, 39);
          q = randInt(10, 80);
        }
      } else {
        // Level 3+: 2-digit and occasional 3-digit divisors
        if (Math.random() < 0.35) {
          divisor = randInt(101, 249);
          q = randInt(2, 40);
        } else {
          divisor = randInt(11, 49);
          q = randInt(12, 180);
        }
      }
      if (allowRemainder) {
        r = randInt(0, divisor - 1);
        if (Math.random() < 0.35) r = 0;
      } else {
        r = 0;
      }
      dividend = q * divisor + r;
      const len = String(dividend).length;
      if (level <= 1 && (len < 2 || len > 3)) continue;
      if (level === 2 && (len < 3 || len > 4)) continue;
      if (level >= 3 && (len < 3 || len > 5)) continue;
      if (q === 0) continue;
      break;
    }
    return buildSteps(dividend, divisor);
  }


  /**
   * Scaffolded single-digit × multi-digit multiplication (standard algorithm).
   * HARD RULE: never ask for a full product (no "8 × 9 = 72"). Every entry is a
   * single digit 0–9: ones digit of (q×d [+ carry]), then carry, then next column.
   * Leftmost leftover carry is written in front one digit at a time.
   */
  function buildMultiplyScaffold(qDigit, divisor) {
    const digs = String(divisor).split("").map(Number);
    const steps = [];
    let carry = 0;

    for (let i = digs.length - 1; i >= 0; i--) {
      const d = digs[i];
      const isLeftmost = (i === 0);
      const placeFromRight = digs.length - 1 - i;
      const partial = qDigit * d + carry;
      const writeDigit = partial % 10;
      const nextCarry = Math.floor(partial / 10);
      const fact = carry > 0
        ? (qDigit + " × " + d + " + carry " + carry)
        : (qDigit + " × " + d);

      steps.push({
        kind: "writeDigit",
        expected: writeDigit,
        prompt: "Ones digit of " + fact + "?",
        hintSoft: partial >= 10
          ? "Multiply in your head (" + fact + " = ?). Write the ones digit here — or type the whole " + partial + " and watch it split onto paper."
          : "Multiply in your head, then write only the ones digit in this place.",
        hintHard: "Ones digit of " + fact + " is " + writeDigit + ".",
        qDigit: qDigit,
        d: d,
        carryIn: carry,
        total: partial,
        digitIndex: i,
        placeFromRight: placeFromRight
      });

      if (!isLeftmost) {
        steps.push({
          kind: "carry",
          expected: nextCarry,
          prompt: nextCarry === 0 ? "Carry? (0 if none)" : "Carry the tens: ?",
          hintSoft: "After the ones digit, what tens do you carry to the next place left?",
          hintHard: nextCarry === 0
            ? "No tens left — enter 0."
            : "Carry " + nextCarry + " to the next place left.",
          total: partial,
          digitIndex: i,
          placeFromRight: placeFromRight
        });
        carry = nextCarry;
      } else {
        if (nextCarry > 0) {
          const lead = String(nextCarry);
          for (let k = lead.length - 1; k >= 0; k--) {
            const pos = placeFromRight + 1 + (lead.length - 1 - k);
            steps.push({
              kind: "writeLeading",
              expected: Number(lead[k]),
              prompt: lead.length === 1
                ? "Write the carry " + nextCarry + " in front"
                : "Write the next carry digit in front",
              hintSoft: "Nothing left to multiply — write the remaining tens as product digits to the left.",
              hintHard: "Write " + lead[k] + ".",
              total: partial,
              digitIndex: i,
              placeFromRight: pos
            });
          }
        }
        carry = 0;
      }
    }

    return {
      steps: steps,
      product: qDigit * divisor,
      qDigit: qDigit,
      divisor: divisor,
      digs: digs
    };
  }

  /**
   * Scaffolded column subtraction (standard algorithm), ones place first.
   * Borrow chains (e.g. 300 − 7) are applied in one student step: the borrowing
   * digit "becomes" top+10 and the digits to its left update visually (borrowMarks).
   */
  function buildSubtractScaffold(working, product) {
    const topDigs = String(working).split("").map(Number);
    const n = topDigs.length;
    const pStr = String(product);
    const botDigs = (pStr.length < n ? "0".repeat(n - pStr.length) + pStr : pStr).split("").map(Number);
    if (product > working) {
      return { tooHigh: true, steps: [], working: working, product: product, diff: working - product, topDigs: topDigs, botDigs: botDigs };
    }
    const cur = topDigs.slice();
    const steps = [];
    for (let i = n - 1; i >= 0; i--) {
      const placeFromRight = n - 1 - i;
      const top = cur[i];
      const bot = botDigs[i];
      if (top < bot) {
        const borrowMarks = [];
        let j = i - 1;
        while (j >= 0 && cur[j] === 0) { borrowMarks.push({ digitIndex: j, from: 0, to: 9 }); cur[j] = 9; j--; }
        if (j >= 0) { borrowMarks.push({ digitIndex: j, from: cur[j], to: cur[j] - 1 }); cur[j] = cur[j] - 1; }
        cur[i] = top + 10;
        const lender = borrowMarks.length ? borrowMarks[borrowMarks.length - 1] : null;
        steps.push({
          kind: "borrowTo",
          expected: top + 10,
          prompt: top + " < " + bot + " — borrow. This digit becomes?",
          hintSoft: "You can't take " + bot + " from " + top + ". Borrow 1 ten from the left — this digit gets 10 more.",
          hintHard: (lender ? "The " + lender.from + " becomes " + lender.to + (borrowMarks.length > 1 ? " (zeros in between become 9)" : "") + ", and " : "") +
            top + " becomes " + top + " + 10 = " + (top + 10) + ".",
          top: top, bot: bot, digitIndex: i, placeFromRight: placeFromRight,
          borrowMarks: borrowMarks,
          stateAfter: cur.slice()
        });
      }
      const t = cur[i];
      steps.push({
        kind: "subDigit",
        expected: t - bot,
        prompt: t + " − " + bot + " = ?",
        hintSoft: "Subtract the bottom digit from the top digit in this column.",
        hintHard: "Compute " + t + " − " + bot + " = " + (t - bot) + ".",
        top: t, bot: bot, digitIndex: i, placeFromRight: placeFromRight,
        stateAfter: cur.slice()
      });
    }
    return { tooHigh: false, steps: steps, working: working, product: product, diff: working - product, topDigs: topDigs, botDigs: botDigs };
  }

  // ---------- DMSCB engine (free estimate + compare) ----------
  // Places come from the reference steps. Because a place only advances once
  // compare passes (0 <= diff < divisor), the student's digit at that point is
  // always the true digit, so later working numbers match the reference.
  function getPlaces(problem) {
    const places = [];
    const st = problem.steps;
    for (let i = 0; i < st.length; i++) {
      if (st[i].type !== "divide") continue;
      const pl = { working: st[i].working, refDigit: st[i].expected, nextDigit: null, last: true };
      for (let j = i + 1; j < st.length && st[j].type !== "divide"; j++) {
        if (st[j].type === "bringdown") { pl.nextDigit = st[j].expected; pl.last = false; }
      }
      places.push(pl);
    }
    return places;
  }

  function createSession(problem) {
    return { problem, places: getPlaces(problem), place: 0, phase: "place", digit: null, product: null, diff: null, done: false, revisions: 0, placeMisses: 0, mulScaffold: null, mulIdx: 0, mulWritten: [], mulCarries: [], subScaffold: null, subIdx: 0, subWritten: [] };
  }

  /** Current step descriptor (same shape the UI already uses). */
  function sessionStep(ss) {
    if (ss.done) return null;
    const pl = ss.places[ss.place];
    const d = ss.problem.divisor;
    const base = { quotIndex: ss.place, working: pl.working, divisor: d, qDigit: ss.digit, product: ss.product };
    if (ss.phase === "place") {
      const hints = placementHints(ss.problem.dividend, d);
      return { type: "place", prompt: "Place", expected: ss.problem.firstPlacement, divisor: d,
        dividend: ss.problem.dividend, digs: ss.problem.digs, quotIndex: 0,
        hintSoft: hints.soft, hintHard: hints.hard };
    }
    switch (ss.phase) {
      case "divide": return Object.assign(base, { type: "divide", prompt: "Divide", expected: pl.refDigit, anyDigit: true,
        hintSoft: "Estimate how many times " + d + " goes into " + pl.working + ". Any digit 0–9 — Compare will check it.",
        hintHard: "Try " + d + " × a digit and see which gets closest to " + pl.working + " without going over." });
      case "multiply": {
        if (!ss.mulScaffold) {
          ss.mulScaffold = buildMultiplyScaffold(ss.digit, d);
          ss.mulIdx = 0;
          ss.mulWritten = [];
          ss.mulCarries = [];
        }
        const sc = ss.mulScaffold;
        const mi = ss.mulIdx;
        const mini = sc.steps[mi];
        return Object.assign(base, {
          type: "multiply",
          prompt: "Multiply",
          expected: mini.expected,
          mulKind: mini.kind,
          mulPrompt: mini.prompt,
          mulIndex: mi,
          mulTotal: sc.steps.length,
          mulMini: mini,
          productTarget: sc.product,
          hintSoft: mini.hintSoft,
          hintHard: mini.hintHard
        });
      }
      case "subtract": {
        if (ss.product > pl.working) {
          return Object.assign(base, { type: "subtract", prompt: "Subtract", expected: pl.working - ss.product, tooHigh: true,
            hintSoft: "Subtract the product from the working number.", hintHard: "What is " + pl.working + " − " + ss.product + "?" });
        }
        if (!ss.subScaffold) {
          ss.subScaffold = buildSubtractScaffold(pl.working, ss.product);
          ss.subIdx = 0;
          ss.subWritten = [];
        }
        const ssc = ss.subScaffold;
        const smini = ssc.steps[ss.subIdx];
        return Object.assign(base, {
          type: "subtract",
          prompt: "Subtract",
          tooHigh: false,
          expected: smini.expected,
          subKind: smini.kind,
          subPrompt: smini.prompt,
          subIndex: ss.subIdx,
          subTotal: ssc.steps.length,
          subMini: smini,
          diffTarget: ssc.diff,
          hintSoft: smini.hintSoft,
          hintHard: smini.hintHard
        });
      }
      case "compare": return Object.assign(base, { type: "compare", prompt: "Compare", expected: ss.diff < d ? 1 : 0, diff: ss.diff,
        hintSoft: "Is " + ss.diff + " smaller than " + d + "?", hintHard: "Compare " + ss.diff + " with the divisor " + d + ". Smaller → Yes. Equal or bigger → No." });
      case "bringdown": return Object.assign(base, { type: "bringdown", prompt: "Bring down", expected: pl.nextDigit,
        hintSoft: "Bring down the next digit of the dividend.", hintHard: "The next digit to bring down is from the dividend." });
      case "remainder": return Object.assign(base, { type: "remainder", prompt: "Remainder", expected: ss.diff,
        hintSoft: "What's left over? (Remainder must be < " + d + ")", hintHard: "The remainder is what's left after the last subtract: " + ss.diff + " — enter it to confirm." });
    }
    return null;
  }

  /**
   * Submit a value for the current phase. For compare, value is 1 (yes, smaller) or 0 (no).
   * Returns { ok, invalid?, needRevise?, msg }.
   */
  function sessionSubmit(ss, val) {
    const step = sessionStep(ss);
    if (!step) return { ok: false, invalid: true, msg: "Problem finished." };
    const d = ss.problem.divisor;
    const pl = ss.places[ss.place];
    if (step.type === "place") {
      if (!Number.isInteger(val) || val < 0 || val >= ss.problem.digs.length) {
        return { ok: false, invalid: true, msg: "Tap a digit column of the dividend." };
      }
      if (val !== step.expected) {
        ss.placeMisses = (ss.placeMisses || 0) + 1;
        const digs = ss.problem.digs;
        let prefix = 0;
        for (let i = 0; i <= val; i++) prefix = prefix * 10 + digs[i];
        let msg;
        if (prefix < d) {
          msg = d + " does not fit into " + prefix + " — try a longer prefix (tap further right).";
        } else {
          msg = "Too far right — " + d + " already fits into a shorter leading chunk. Try a column further left.";
        }
        return { ok: false, msg: msg };
      }
      ss.phase = "divide";
      ss.placeMisses = 0;
      return { ok: true, msg: "First quotient digit goes above that column. Now Divide." };
    }
    if (step.type === "divide") {
      if (!Number.isInteger(val) || val < 0 || val > 9) return { ok: false, invalid: true, msg: "Quotient estimate must be a single digit 0–9." };
      ss.digit = val; ss.product = null; ss.diff = null; ss.phase = "multiply";
      ss.mulScaffold = buildMultiplyScaffold(val, d);
      ss.mulIdx = 0;
      ss.mulWritten = [];
      ss.mulCarries = [];
      ss.subScaffold = null; ss.subIdx = 0; ss.subWritten = [];
      return { ok: true, msg: "Estimate " + val + " placed. Now multiply — ones digit first." };
    }
    if (step.type === "subtract" && step.tooHigh) {
      return { ok: false, needRevise: true, msg: ss.product + " is bigger than " + pl.working + " — you can't subtract. Your estimate " + ss.digit + " is too high: tap Change quotient." };
    }
    if (step.type === "multiply") {
      if (!Number.isInteger(val)) return { ok: false, invalid: true, msg: "Enter a whole number." };
      // v11: full partial product typed on a writeDigit (e.g. 72) — split ones/carry like paper
      if (step.mulKind === "writeDigit" && step.mulMini.total >= 10 && val === step.mulMini.total && val !== step.expected) {
        const mini = step.mulMini;
        const steps = ss.mulScaffold.steps;
        const nxt = steps[ss.mulIdx + 1];
        const ones = mini.total % 10;
        let splitAnim = null;
        if (nxt && nxt.kind === "carry" && nxt.digitIndex === mini.digitIndex) {
          ss.mulWritten[mini.placeFromRight] = ones;
          ss.mulCarries[mini.placeFromRight] = nxt.expected;
          ss.mulIdx += 2;
          splitAnim = { ones: ones, carry: nxt.expected, placeFromRight: mini.placeFromRight, total: mini.total };
        } else {
          ss.mulWritten[mini.placeFromRight] = ones;
          ss.mulIdx += 1;
          const leading = [];
          while (ss.mulIdx < steps.length && steps[ss.mulIdx].kind === "writeLeading" && steps[ss.mulIdx].digitIndex === mini.digitIndex) {
            const L = steps[ss.mulIdx];
            ss.mulWritten[L.placeFromRight] = L.expected;
            leading.push({ digit: L.expected, placeFromRight: L.placeFromRight });
            ss.mulIdx++;
          }
          splitAnim = { ones: ones, carry: null, leading: leading, placeFromRight: mini.placeFromRight, total: mini.total };
        }
        if (ss.mulIdx >= steps.length) {
          ss.product = ss.mulScaffold.product;
          ss.phase = "subtract";
          ss.subScaffold = buildSubtractScaffold(pl.working, ss.product);
          ss.subIdx = 0;
          ss.subWritten = [];
          return { ok: true, mulDone: true, splitAnim: splitAnim, msg: mini.total + " splits: write " + ones + ". Product " + ss.product + " complete. Now subtract." };
        }
        return { ok: true, mulDone: false, splitAnim: splitAnim, msg: mini.total + " splits: write " + ones + (splitAnim.carry ? ", carry " + splitAnim.carry : "") + ". Next: " + steps[ss.mulIdx].prompt };
      }
      if (val !== step.expected) {
        const kind = step.mulKind;
        let msg = "Not quite — try again.";
        if (kind === "writeDigit") {
          const m = step.mulMini;
          const fact = (m.carryIn > 0)
            ? (m.qDigit + " × " + m.d + " + carry " + m.carryIn)
            : (m.qDigit + " × " + m.d);
          msg = "Ones digit of " + fact + " only — try again.";
        } else if (kind === "carry") msg = "Carry is the tens part (or 0 if none).";
        else if (kind === "writeLeading") msg = "Write the carry digit " + step.mulMini.expected + " in front of the product.";
        return { ok: false, msg: msg };
      }
      // Record UI progress for write/carry
      const mini = step.mulMini;
      if (mini.kind === "writeDigit") {
        ss.mulWritten[mini.placeFromRight] = mini.expected;
      } else if (mini.kind === "carry") {
        ss.mulCarries[mini.placeFromRight] = mini.expected;
      } else if (mini.kind === "writeLeading") {
        ss.mulWritten[mini.placeFromRight] = mini.expected;
      }
      ss.mulIdx++;
      if (ss.mulIdx >= ss.mulScaffold.steps.length) {
        ss.product = ss.mulScaffold.product;
        ss.phase = "subtract";
        ss.subScaffold = buildSubtractScaffold(pl.working, ss.product);
        ss.subIdx = 0;
        ss.subWritten = [];
        return { ok: true, mulDone: true, msg: "Product " + ss.product + " complete. Now subtract." };
      }
      const next = ss.mulScaffold.steps[ss.mulIdx];
      return { ok: true, mulDone: false, msg: "Good — next: " + next.prompt };
    }
    if (step.type === "subtract") {
      if (!Number.isInteger(val)) return { ok: false, invalid: true, msg: "Enter a whole number." };
      const mini = step.subMini;
      if (val !== step.expected) {
        let msg = "Not quite — try again.";
        if (mini.kind === "borrowTo") msg = "After borrowing, this digit gets 10 more: " + mini.top + " + 10.";
        else if (mini.kind === "subDigit") msg = "Check " + mini.top + " − " + mini.bot + " again.";
        return { ok: false, msg: msg };
      }
      if (mini.kind === "subDigit") ss.subWritten[mini.placeFromRight] = mini.expected;
      ss.subIdx++;
      if (ss.subIdx >= ss.subScaffold.steps.length) {
        ss.diff = ss.subScaffold.diff;
        ss.phase = "compare";
        return { ok: true, subDone: true, msg: "Difference " + ss.diff + " complete. Now compare." };
      }
      const nextS = ss.subScaffold.steps[ss.subIdx];
      return { ok: true, subDone: false, msg: "Good — next: " + nextS.prompt };
    }
    if (val !== step.expected) {
      if (step.type === "compare") {
        return { ok: false, msg: step.expected === 1 ? ss.diff + " IS smaller than " + d + " — look again." : ss.diff + " is NOT smaller than " + d + " — look again." };
      }
      return { ok: false, msg: "Not quite — try again." };
    }
    switch (step.type) {
      case "compare":
        if (val === 0) {
          // Correct judgment: diff >= divisor → estimate too low; go back.
          ss.revisions++;
          return { ok: true, needRevise: true, msg: "Right — " + ss.diff + " ≥ " + d + ", so " + d + " still fits. Your estimate " + ss.digit + " is too low: tap Change quotient and try a bigger digit." };
        }
        ss.phase = pl.last ? "remainder" : "bringdown";
        return { ok: true, msg: "Compare passed: " + ss.diff + " < " + d + "." };
      case "bringdown":
        ss.place++; ss.phase = "divide"; ss.digit = null; ss.product = null; ss.diff = null;
        ss.mulScaffold = null; ss.mulIdx = 0; ss.mulWritten = []; ss.mulCarries = [];
        ss.subScaffold = null; ss.subIdx = 0; ss.subWritten = [];
        return { ok: true, msg: "Brought down." };
      case "remainder":
        ss.done = true; return { ok: true, msg: "Done." };
    }
    return { ok: false, msg: "?" };
  }

  /** Go back to Divide for the current place (allowed during multiply/subtract/compare). */
  function sessionChangeQuotient(ss) {
    if (ss.done || !["multiply", "subtract", "compare"].includes(ss.phase)) return false;
    ss.phase = "divide"; ss.digit = null; ss.product = null; ss.diff = null;
    ss.mulScaffold = null; ss.mulIdx = 0; ss.mulWritten = []; ss.mulCarries = [];
    ss.subScaffold = null; ss.subIdx = 0; ss.subWritten = [];
    return true;
  }
  function canChangeQuotient(ss) { return !!ss && !ss.done && ["multiply", "subtract", "compare"].includes(ss.phase); }
  window.__DivisionDash = { buildSteps, buildMultiplyScaffold, buildSubtractScaffold, generateProblem, createSession, sessionStep, sessionSubmit, sessionChangeQuotient, canChangeQuotient, firstPlacementIndex, placementHints };
})();
var AU=(function(){var ctx,muted=false;function ensure(){try{if(!ctx)ctx=new(window.AudioContext||window.webkitAudioContext)();if(ctx.state==='suspended')ctx.resume();return ctx;}catch(e){return null;}}function note(freq){if(muted||!ensure())return;var o=ctx.createOscillator(),g=ctx.createGain();o.type='sine';o.frequency.value=freq;g.gain.setValueAtTime(.0001,ctx.currentTime);g.gain.exponentialRampToValueAtTime(.08,ctx.currentTime+.01);g.gain.exponentialRampToValueAtTime(.0001,ctx.currentTime+.14);o.connect(g);g.connect(ctx.destination);o.start();o.stop(ctx.currentTime+.16);}return{ensure:ensure,toggle:function(){muted=!muted;return muted;},tick:function(){note(740);},buzz:function(){note(260);}}})();

(function () {
  "use strict";
  var E = window.__DivisionDash;
  function $(id) { return document.getElementById(id); }
  var GAME={score:0,streak:0,best:0,level:1,solved:0};
  try{var _g=JSON.parse(localStorage.getItem("notebook-game")||"null"); if(_g) Object.assign(GAME,_g); GAME.solved=+(localStorage.getItem("notebook-solved")||GAME.solved||0);}catch(e){}
  function saveGame(){ try{localStorage.setItem("notebook-game",JSON.stringify(GAME)); localStorage.setItem("notebook-solved",GAME.solved);}catch(e){} }
  function xpToNext(lv){ return 3 + Math.floor((lv-1)*1.5); }
  function toast(msg){ var t=$("g-toast"); if(!t) return; t.hidden=false; t.textContent=msg; t.classList.add("on"); clearTimeout(toast._tm); toast._tm=setTimeout(function(){t.classList.remove("on");},1800); }
  function paintGame(){
    if(!$("g-score")) return;
    $("g-score").textContent=GAME.score;
    $("g-streak").textContent=GAME.streak + (GAME.best? " · best "+GAME.best : "");
    $("g-level").textContent=GAME.level;
    var need=xpToNext(GAME.level), into=GAME.solved % need; // use progress within level via solvedSinceLevel
    var prog=GAME._prog||0; need=xpToNext(GAME.level);
    $("g-goal").textContent=prog+" / "+need;
    $("g-fill").style.width=Math.min(100, Math.round(100*prog/need))+"%";
  }
  function awardSolve(){
    GAME.solved++;
    GAME.streak++;
    if(GAME.streak>GAME.best) GAME.best=GAME.streak;
    var pts=100 + Math.min(200, (GAME.streak-1)*25);
    GAME.score+=pts;
    GAME._prog=(GAME._prog||0)+1;
    var need=xpToNext(GAME.level);
    var leveled=false;
    while(GAME._prog>=need){ GAME._prog-=need; GAME.level++; need=xpToNext(GAME.level); leveled=true; }
    saveGame(); paintGame();
    if(leveled) toast("⭐ Level "+GAME.level+"! Keep going!");
    else if(GAME.streak>=3 && GAME.streak%3===0) toast("🔥 "+GAME.streak+" streak! +"+pts+" pts");
    else toast("+"+pts+" pts");
  }

  var ss = null, buf = "", energy = 100, curKey = "38/9", lastWritten = {};
  var PHASES = [["place", "Place"], ["divide", "Divide"], ["multiply", "Multiply"], ["subtract", "Subtract"], ["compare", "Compare"], ["bringdown", "Bring down"]];

  function load(key) {
    curKey = key;
    var pr;
    if (key === "rand") {
      var count = +$("digits").value, min = Math.pow(10,count-1);
      var dividend = min + Math.floor(Math.random() * (min*9));
      var maxD = $("difficulty").value === "gentle" ? 9 : $("difficulty").value === "steady" ? 99 : 999;
      var divisor = 2 + Math.floor(Math.random()* (Math.min(maxD,dividend)-1));
      pr = E.buildSteps(dividend,divisor);
    }
    else { var p = key.split("/"); pr = E.buildSteps(+p[0], +p[1]); }
    ss = E.createSession(pr); buf = ""; lastWritten = {}; setEnergy(100);
    document.querySelectorAll("#probs button").forEach(function (b) { b.classList.toggle("on", b.dataset.p === key); });
    $("next").style.display = "none";
    fb("Tap the column where the first quotient digit belongs.", "");
    render();
  }

  function fb(msg, kind) { var f = $("fb"); f.textContent = msg; f.className = "fb " + (kind || ""); }
  function setEnergy(v) {
    energy = Math.max(0, Math.min(100, v));
    $("efill").style.width = energy + "%"; $("epct").textContent = Math.round(energy) + "%";
    $("efill").style.background = energy > 50 ? "linear-gradient(90deg,#22c55e,#a3e635)" : energy > 25 ? "linear-gradient(90deg,#f59e0b,#fbbf24)" : "linear-gradient(90deg,#dc2626,#f87171)";
    if (energy <= 0) { $("out").classList.add("on"); $("out-go").focus(); }
  }
  function drain(amount) {
    setEnergy(energy - amount);
    var b = $("ebar"); b.classList.remove("drain"); void b.offsetWidth; b.classList.add("drain");
  }

  function step() { return ss ? E.sessionStep(ss) : null; }
  function needDigits(st) {
    if (!st) return 1;
    if (st.type === "subtract" && st.subKind === "borrowTo") return 2;
    if (st.type === "remainder") return String(st.expected).length;
    return 1;
  }

  /* ---------- rendering the paper ---------- */
  function cell(content, cls, attrs) { return '<div class="c ' + (cls || "") + '" ' + (attrs || "") + ">" + (content == null ? "" : content) + "</div>"; }
  function render() {
    var st = step(), pr = ss.problem, N = pr.digs.length, fp = pr.firstPlacement, d = pr.divisor;
    $("problem-label").textContent = pr.dividend + " ÷ " + d;
    if (ss.done && !ss.counted) { ss.counted = true; awardSolve(); }
    $("progress").textContent = "★ Level " + GAME.level + " · " + GAME.solved + " solved · streak " + GAME.streak;
    var dw = (String(d).length * 30 + 10) + "px";
    var phase = ss.done ? "done" : ss.phase;
    var h = "";
    // quotient row
    h += '<div class="brow"><div style="width:' + dw + '"></div>' + cell("");
    for (var j = 0; j < N; j++) {
      var q = "", cls = "";
      var p = j - fp;
      if (p >= 0 && p < ss.place) q = ss.places[p].refDigit;
      else if (p === ss.place && ss.digit != null) q = ss.digit;
      else if (ss.done && p >= 0 && p < ss.places.length) q = ss.places[p].refDigit;
      if (ss.done && p === ss.places.length - 1) q = ss.places[p].refDigit;
      if (phase === "divide" && p === ss.place) cls = "act";
      if (phase === "place") cls = "click qpick";
      h += cell(q, cls + " hl", phase === "place" ? 'tabindex="0" role="button" aria-label="Choose column ' + (j+1) + '" data-col="' + j + '"' : "");
    }
    if (phase === "remainder") h += '<div class="rem">R <span class="c act" style="display:inline-block;width:auto;min-width:30px">' + (buf || "") + "</span></div>";
    else if (ss.done) h += '<div class="rem">R ' + pr.remainder + "</div>";
    h += "</div>";
    // dividend row
    h += '<div class="brow"><div class="divisor" style="width:' + dw + '">' + d + "</div>" + cell("");
    for (j = 0; j < N; j++) {
      var c2 = "top" + (j === 0 ? " br" : "");
      if (phase === "place") c2 += " click";
      if (phase === "bringdown" && j === fp + ss.place + 1) c2 += " hl";
      h += cell(pr.digs[j], c2, phase === "place" ? 'tabindex="0" role="button" aria-label="Choose column ' + (j+1) + '" data-col="' + j + '"' : "");
    }
    h += "</div>";
    // work rows
    var last = ss.done ? ss.places.length - 1 : ss.place;
    for (var pi = 0; pi <= last; pi++) {
      var e = fp + pi, pl = ss.places[pi], wlen = String(pl.working).length;
      var prodDigits = {}, prodAct = -1, show = false, minusAt = -1;
      if (pi < ss.place || ss.done) { var pv = String(pl.refDigit * d); for (var k = 0; k < pv.length; k++) prodDigits[k] = pv[pv.length - 1 - k]; show = true; }
      else if (ss.phase === "multiply") {
        (ss.mulWritten || []).forEach(function (v, i2) { if (v != null) prodDigits[i2] = v; });
        if (st.mulKind !== "carry") prodAct = st.mulMini.placeFromRight;
        show = true;
      } else if (ss.product != null) { pv = String(ss.product); for (k = 0; k < pv.length; k++) prodDigits[k] = pv[pv.length - 1 - k]; show = true; }
      if (!show) break;
      h += '<div class="brow"><div style="width:' + dw + '"></div>';
      var startCol = e - wlen + 1;
      for (j = -1; j < N; j++) {
        var k2 = e - j, v2 = prodDigits[k2], cl = "";
        if (j >= startCol && j <= e) cl += " ul";
        if (k2 === prodAct) cl += " act";
        if (j === startCol - 1) v2 = "−";
        var key = "p" + pi + "_" + k2; if (v2 != null && v2 !== "−" && !lastWritten[key]) { cl += " new"; lastWritten[key] = 1; }
        h += cell(v2, cl);
      }
      h += "</div>";
      // diff row
      var diffDigits = {}, diffAct = -1, bd = null, bdAct = false, showD = false;
      if (pi < ss.place || ss.done) {
        var dv = String(pl.working - pl.refDigit * d); for (k = 0; k < dv.length; k++) diffDigits[k] = dv[dv.length - 1 - k]; showD = true;
        if (!pl.last && pi < ss.place) bd = pl.nextDigit;
      } else if (ss.phase === "subtract" && !st.tooHigh) {
        (ss.subWritten || []).forEach(function (v, i3) { if (v != null) diffDigits[i3] = v; });
        if (st.subKind === "subDigit") diffAct = st.subMini.placeFromRight; showD = true;
      } else if (ss.diff != null) {
        dv = String(ss.diff); for (k = 0; k < dv.length; k++) diffDigits[k] = dv[dv.length - 1 - k]; showD = true;
        if (ss.phase === "bringdown") bdAct = true;
      }
      if (!showD) continue;
      h += '<div class="brow"><div style="width:' + dw + '"></div>';
      for (j = -1; j < N; j++) {
        var k3 = e - j, v3 = diffDigits[k3], cl3 = "";
        if (k3 === diffAct) cl3 += " act";
        if (j === e + 1) { if (bd != null) { v3 = bd; cl3 += " hl"; } if (bdAct) { cl3 += " act"; v3 = buf || ""; } }
        var key2 = "d" + pi + "_" + k3; if (v3 != null && v3 !== "" && !lastWritten[key2]) { cl3 += " new"; lastWritten[key2] = 1; }
        h += cell(v3, cl3);
      }
      h += "</div>";
    }
    $("board").innerHTML = h;
    $("board").querySelectorAll("[data-col]").forEach(function (el) { el.addEventListener("click", function () { tapCol(+el.dataset.col, el); }); });
    renderMini(st);
    // chips
    var ch = "";
    var idx = PHASES.findIndex(function (x) { return x[0] === phase; });
    if (phase === "remainder") idx = 5;
    PHASES.forEach(function (x, i) { ch += '<span class="chip ' + (ss.done ? "done" : i === idx ? "on" : i < idx ? "done" : "") + '">' + x[1] + "</span>"; });
    if (phase === "remainder" || ss.done) ch += '<span class="chip ' + (ss.done ? "done" : "on") + '">Remainder</span>';
    $("chips").innerHTML = ch;
    // prompt
    var pm = "";
    if (ss.done) pm = "Solved! " + pr.dividend + " ÷ " + d + " = " + pr.quotient + (pr.remainder ? " R " + pr.remainder : "");
    else if (phase === "place") pm = "Place: tap the column where the first quotient digit goes.";
    else if (phase === "divide") pm = "Divide: " + d + " goes into " + st.working + " how many times?";
    else if (phase === "multiply") pm = "Multiply: " + st.mulPrompt;
    else if (phase === "subtract") pm = st.tooHigh ? "Product " + ss.product + " is bigger than " + st.working + ". That estimate is too high, so change the quotient." : "Subtract: " + st.subPrompt;
    else if (phase === "compare") pm = "Compare: is " + ss.diff + " smaller than " + d + "?";
    else if (phase === "bringdown") pm = "Bring down: type the next digit of the dividend.";
    else if (phase === "remainder") pm = "Remainder: what's left over?";
    $("prompt").textContent = pm;
    $("entry").innerHTML = (buf ? buf : "") + '<span class="caret"></span>';
    $("entry").style.visibility = (ss.done || phase === "place" || phase === "compare" || (st && st.tooHigh)) ? "hidden" : "visible";
    $("cmp").style.display = phase === "compare" && !ss.needRevise ? "flex" : "none";
    $("chq").style.display = (!ss.done && (ss.needRevise || (st && st.tooHigh))) ? "inline-block" : "none";
    $("next").style.display = ss.done ? "inline-block" : "none";
  }

  function renderMini(st) {
    var m = $("mini");
    if (!st || ss.done) { m.innerHTML = ""; return; }
    if (st.type === "multiply") {
      var sc = ss.mulScaffold, digs = sc.digs, n = digs.length, cols = n + 1, mini = st.mulMini, h = '<div class="mini"><div class="t">Multiply · carries in orange</div>';
      // carry row
      h += '<div class="brow crow">' + '<div class="c carry"></div>';
      for (var j = 0; j < cols; j++) {
        var pfr = cols - 1 - j, v = (ss.mulCarries[pfr - 1]), cl = "carry";
        if (mini.kind === "carry" && mini.placeFromRight + 1 === pfr) cl += " act";
        h += cell(v ? v : "", cl);
      }
      h += "</div><div class=\"brow\">" + cell("");
      for (j = 0; j < cols; j++) { pfr = cols - 1 - j; h += cell(pfr < n ? digs[n - 1 - pfr] : "", ""); }
      h += "</div><div class=\"brow\">" + cell("×");
      for (j = 0; j < cols; j++) { pfr = cols - 1 - j; h += cell(pfr === 0 ? sc.qDigit : "", "ul"); }
      h += "</div><div class=\"brow\">" + cell("");
      for (j = 0; j < cols; j++) {
        pfr = cols - 1 - j; var w = ss.mulWritten[pfr], c2 = "";
        if ((mini.kind === "writeDigit" || mini.kind === "writeLeading") && mini.placeFromRight === pfr) { c2 = "act"; w = buf || ""; }
        h += cell(w, c2);
      }
      h += "</div></div>";
      m.innerHTML = h; return;
    }
    if (st.type === "subtract" && !st.tooHigh) {
      var sb = ss.subScaffold, top = sb.topDigs.slice(), n2 = top.length, changed = {};
      for (var i = 0; i < ss.subIdx; i++) {
        var s0 = sb.steps[i];
        if (s0.kind === "borrowTo") { (s0.borrowMarks || []).forEach(function (bm) { changed[bm.digitIndex] = bm.to; }); changed[s0.digitIndex] = s0.expected; }
      }
      var cur = st.subMini, h2 = '<div class="mini"><div class="t">Subtract · column by column</div><div class="brow crow">' + cell("");
      for (j = 0; j < n2; j++) {
        var act = cur.kind === "borrowTo" && cur.digitIndex === j;
        h2 += cell(act ? (buf || "") : (changed[j] != null ? changed[j] : ""), "carry" + (act ? " act" : ""));
      }
      h2 += '</div><div class="brow">' + cell("");
      for (j = 0; j < n2; j++) h2 += cell(top[j], changed[j] != null ? "strike" : "");
      h2 += '</div><div class="brow">' + cell("−");
      for (j = 0; j < n2; j++) h2 += cell(sb.botDigs[j], "ul");
      h2 += '</div><div class="brow">' + cell("");
      for (j = 0; j < n2; j++) {
        var pf2 = n2 - 1 - j, wv = ss.subWritten[pf2], c3 = "";
        if (cur.kind === "subDigit" && cur.placeFromRight === pf2) { c3 = "act"; wv = buf || ""; }
        h2 += cell(wv, c3);
      }
      h2 += "</div></div>";
      m.innerHTML = h2; return;
    }
    m.innerHTML = "";
  }

  /* ---------- input ---------- */
  function tapCol(j, el) {
    if ($("out").classList.contains("on")) return;
    if (!ss || ss.done || ss.phase !== "place") return;
    var r = E.sessionSubmit(ss, j);
    if (r.ok) { AU.tick(); fb("✓ " + r.msg, "good");  render(); }
    else {
      drain(20); fb("✗ " + r.msg + "  (−20% energy)", "bad"); AU.buzz(); 
      if (el) { el.classList.remove("miss"); void el.offsetWidth; el.classList.add("miss"); }
    }
  }
  function submit(val) {
    var st = step(); if (!st || ss.done) return;
    if (st.type === "place") return;
    var before = ss.phase, beforePlace = ss.place;
    var r = E.sessionSubmit(ss, val);
    buf = "";
    if (r.invalid) { fb(r.msg, "bad"); render(); return; }
    if (r.needRevise && !r.ok) { fb(r.msg, "bad"); ss.needRevise = true; render(); return; }
    if (!r.ok) {
      drain(10); AU.buzz();  fb("✗ " + r.msg + "  (−10% energy)", "bad");
      var en = $("entry"); en.classList.remove("bad"); void en.offsetWidth; en.classList.add("bad");
      render(); return;
    }
    if (r.needRevise) { ss.needRevise = true; fb(r.msg, ""); AU.tick(); render(); return; }
    AU.tick();
    var advanced = ss.done || ss.phase !== before || ss.place !== beforePlace;
    var now = step();
    if (advanced && now && now.type === "subtract" && now.tooHigh) {
      // Let the learner revise an overestimate.
       drain(10); ss.needRevise = true;
      fb("✗ " + ss.product + " is bigger than " + now.working + ". The estimate was too high (−10% energy). Change the quotient.", "bad");
    } else if (advanced) {
      setEnergy(energy + 4);
      
      fb("✓ " + r.msg, "good");
    } else fb("✓ " + r.msg, "good");
    render();
  }
  function typeDigit(dg) {
    if ($("out").classList.contains("on")) return;
    var st = step(); if (!st || ss.done) return;
    if (st.type === "place") return;
    if (st.type === "compare") { if (!ss.needRevise && (dg === 1 || dg === 0)) submit(dg); return; }
    if (ss.needRevise || st.tooHigh) { fb("Change the quotient first (C).", "bad"); return; }
    buf += String(dg);
    if (buf.length >= needDigits(st)) submit(Number(buf)); else render();
  }
  function changeQ() {
    if ($("out").classList.contains("on")) return;
    if (E.sessionChangeQuotient(ss)) { ss.needRevise = false; buf = ""; fb("Pick a new quotient digit.", ""); render(); }
  }
  document.addEventListener("keydown", function (e) {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    if (e.target.matches("select,input") || (e.target.matches("button") && (e.key === "Enter" || e.key === " "))) return;
    if (e.key === "Enter" && e.target.dataset.col != null) { e.preventDefault(); tapCol(+e.target.dataset.col,e.target); return; }
    if ($("out").classList.contains("on")) return;
    if (/^[0-9]$/.test(e.key)) { e.preventDefault(); typeDigit(+e.key); }
    else if (e.key === "Enter") { e.preventDefault(); if (buf) submit(Number(buf)); else if (ss.done) load(curKey === "38/9" ? "299/138" : "rand"); }
    else if (e.key === "Backspace") { buf = buf.slice(0, -1); render(); }
    else if (/^[yY]$/.test(e.key)) typeDigit(1);
    else if (/^[nN]$/.test(e.key)) typeDigit(0);
    else if (/^[cC]$/.test(e.key)) changeQ();
  });
  var kp = ""; for (var i = 1; i <= 10; i++) kp += '<button data-k="' + (i % 10) + '">' + (i % 10) + "</button>";
  kp += '<button data-k="bs" style="width:56px">⌫</button><button data-k="en" style="width:70px">Enter</button>';
  $("keypad").innerHTML = kp;
  $("keypad").addEventListener("click", function (e) {
    var b = e.target.closest("button"); if (!b) return; AU.ensure();
    var k = b.dataset.k; if (k === "bs") { buf = buf.slice(0, -1); render(); } else if (k === "en") { if (buf) submit(Number(buf)); } else typeDigit(+k);
  });
  $("cmp").addEventListener("click", function (e) { var b = e.target.closest("button"); if (b) typeDigit(+b.dataset.v); });
  $("chq").addEventListener("click", changeQ);
  $("next").addEventListener("click", function () { load(curKey === "38/9" ? "299/138" : "rand"); });
  $("probs").addEventListener("click", function (e) { var b = e.target.closest("button"); if (b) load(b.dataset.p); });
  $("out-go").addEventListener("click", function () { $("out").classList.remove("on"); setEnergy(100); });
  $("mute").addEventListener("click", function () { var m = AU.toggle(); this.textContent = m ? "🔇 Sound off" : "🔊 Sound on"; });
  $("rm-toggle").checked = matchMedia("(prefers-reduced-motion: reduce)").matches;
  $("rm-toggle").addEventListener("change", function () { document.body.classList.toggle("rm", this.checked); });
  document.addEventListener("pointerdown", function () { AU.ensure(); }, { once: true });

  window.__Game = { load: load, typeDigit: typeDigit, tapCol: tapCol, state: function () { return ss; }, energy: function () { return energy; } };
  setEnergy(100);
  load("38/9");
})();
