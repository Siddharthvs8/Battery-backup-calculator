// Hybrid solar + Li-ion battery sizing. Loads come either from an itemised list
// (light / motor / power groups) or from group totals; the battery, inverter and
// solar sections all size off whichever mode is selected.

var GROUPS = [["light", "Light loads", "light load"], ["motor", "Motor loads", "motor load"], ["power", "Power loads", "power load"]];

// [name, running watts, power factor, Start × (starting / running current), hours per day]
var PRESETS = {
  light: [
    ["LED bulb", 9, 0.9, 1, 6],
    ["LED tube light", 20, 0.95, 1, 6],
    ["LED TV", 100, 0.9, 1, 5],
    ["Laptop", 65, 0.9, 1, 6],
    ["Desktop computer", 200, 0.95, 1, 6],
    ["Wi-Fi router", 15, 0.9, 1, 24],
    ["CCTV (4 cameras + DVR)", 60, 0.9, 1, 24],
    ["Set-top box", 20, 0.9, 1, 5],
    ["Phone charger", 10, 0.9, 1, 3]
  ],
  motor: [
    ["Ceiling fan", 75, 0.9, 2, 8],
    ["BLDC ceiling fan", 30, 0.95, 1, 8],
    ["Table / pedestal fan", 55, 0.9, 2, 6],
    ["Exhaust fan", 40, 0.85, 2, 4],
    ["Air cooler", 200, 0.85, 3, 8],
    ["Refrigerator (single door)", 150, 0.8, 6, 10],
    ["Refrigerator (double door)", 250, 0.8, 6, 10],
    ["Inverter refrigerator", 120, 0.95, 1.5, 12],
    ["Deep freezer", 300, 0.8, 6, 12],
    ["Washing machine", 500, 0.8, 3, 1],
    ["Mixer grinder", 750, 0.85, 3, 0.5],
    ["RO water purifier", 60, 0.8, 3, 2],
    ["Water pump 0.5 HP", 560, 0.8, 6, 1],
    ["Water pump 1 HP", 1000, 0.8, 6, 1],
    ["Water pump 1.5 HP", 1450, 0.8, 6, 1],
    ["Water pump 2 HP", 1900, 0.82, 6, 1],
    ["Borewell submersible 1 HP", 1250, 0.8, 7, 1],
    ["Borewell submersible 1.5 HP", 1800, 0.8, 7, 1],
    ["Borewell submersible 2 HP", 2300, 0.82, 7, 1],
    ["AC 1 ton (fixed speed)", 1100, 0.9, 5, 6],
    ["AC 1.5 ton (fixed speed)", 1600, 0.9, 5, 6],
    ["AC 2 ton (fixed speed)", 2100, 0.9, 5, 6],
    ["Inverter AC 1 ton", 900, 0.95, 1.5, 6],
    ["Inverter AC 1.5 ton", 1300, 0.95, 1.5, 6],
    ["Air compressor 2 HP", 1900, 0.8, 6, 1],
    ["3-phase motor 3 HP", 2600, 0.85, 6, 2],
    ["3-phase motor 5 HP", 4300, 0.85, 6, 2],
    ["3-phase motor 7.5 HP", 6400, 0.86, 6, 2]
  ],
  power: [
    ["Water heater (geyser)", 2000, 1, 1, 1],
    ["Electric iron", 1000, 1, 1, 0.5],
    ["Electric kettle", 1500, 1, 1, 0.25],
    ["Microwave oven", 1200, 0.95, 2, 0.5],
    ["Induction cooktop", 2000, 0.98, 1, 1],
    ["Room heater", 2000, 1, 1, 4],
    ["OTG oven", 1500, 1, 1, 0.5],
    ["Toaster", 800, 1, 1, 0.25],
    ["Rice cooker", 700, 1, 1, 1],
    ["Hair dryer", 1200, 1, 1, 0.25],
    ["EV charger 3.3 kW", 3300, 0.99, 1, 3],
    ["EV charger 7.4 kW", 7400, 0.99, 1, 2]
  ]
};
var CUSTOM = { light: ["Custom light load", 20, 0.9, 1, 4], motor: ["Custom motor load", 500, 0.8, 5, 2], power: ["Custom power load", 1000, 1, 1, 1] };
var FIELDS = [["w", "Watts"], ["q", "Qty"], ["h", "h/day"], ["pf", "PF"], ["st", "Start ×"]];
var TOTAL_FIELDS = [["w", "Total running watts"], ["h", "Average hours per day"], ["pf", "Power factor"]];
var BIG_MOTOR_FIELDS = [["bw", "Largest motor (W)"], ["bst", "Largest motor Start ×"]];
var STD_KVA = [1, 1.5, 2, 2.5, 3, 3.5, 4, 5, 6, 7.5, 8, 10, 12, 15, 20, 25, 30, 40, 50, 60, 75, 100];
var INV_MARGIN = 1.25, MPPT_MARGIN = 1.25, DC_AC_RATIO = 1.2, M2_PER_KWP = 5, W_PER_HP = 746;

function load(g, p, q, h) {
  return { g: g, name: p[0], w: p[1], q: q, h: h == null ? p[4] : h, pf: p[2], st: p[3], p3: /^3-phase/.test(p[0]) };
}
function preset(g, name) {
  return PRESETS[g].filter(function (p) { return p[0] === name; })[0];
}
function defaultLoads() {
  return [
    load("light", preset("light", "LED bulb"), 8, 5),
    load("light", preset("light", "LED TV"), 1, 4),
    load("light", preset("light", "Wi-Fi router"), 1, 24),
    load("light", preset("light", "Laptop"), 2, 6),
    load("motor", preset("motor", "Ceiling fan"), 4, 8),
    load("motor", preset("motor", "Refrigerator (single door)"), 1, 10),
    load("motor", preset("motor", "Water pump 1 HP"), 1, 1)
  ];
}
function defaultTotals() {
  return { light: { w: 400, h: 6, pf: 0.9 }, motor: { w: 1500, h: 6, pf: 0.8, bw: 1000, bst: 6 }, power: { w: 0, h: 1, pf: 1 } };
}
var state = { mode: "each", loads: defaultLoads(), totals: defaultTotals() };

var $ = function (i) { return document.getElementById(i); };
function esc(s) { return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;"); }
// Load fields: blanks and negatives count as zero, and a blank power factor as 1.
function num(v) { v = parseFloat(v); return v > 0 ? v : 0; }
function pfOf(v) { v = parseFloat(v); return v > 0 ? Math.min(Math.max(v, 0.1), 1) : 1; }
function up(x) { return Math.ceil(x - 1e-9); }
function f(x, d) { return x.toLocaleString("en-IN", { maximumFractionDigits: d == null ? 1 : d }); }
function units(n, one, many) { return n + " " + (n === 1 ? one : many); }
function tr(a) {
  return a.map(function (r) { return "<tr" + (r[2] ? ' class="' + r[2] + '"' : "") + "><td>" + r[0] + "</td><td>" + r[1] + "</td></tr>"; }).join("");
}
function flag(kind, text) { return '<div class="flag ' + kind + '">' + text + "</div>"; }
// Settings fields: marks the input and records it when outside its min/max.
function val(id, bad) {
  var el = $(id), v = parseFloat(el.value);
  var ok = v >= (parseFloat(el.min) || 0) && !(v > parseFloat(el.max));
  el.setAttribute("aria-invalid", ok ? "false" : "true");
  if (!ok) bad.push(id);
  return v;
}

function renderLoads() {
  $("groups").innerHTML = GROUPS.map(state.mode === "each" ? eachGroup : totalGroup).join("");
  $("hpAdd").textContent = state.mode === "each" ? "Add to motor loads" : "Use as largest motor";
}
function groupHead(G) {
  return '<div class="grp-head"><h3>' + G[1] + '</h3><span class="tot" id="tot-' + G[0] + '"></span></div>';
}
function eachGroup(G) {
  var g = G[0], rows = "";
  state.loads.forEach(function (l, i) {
    if (l.g !== g) return;
    rows += '<div class="load">'
      + '<input class="nm" aria-label="Load name" value="' + esc(l.name) + '" data-i="' + i + '" data-k="name">'
      + '<button type="button" class="x" aria-label="Remove ' + esc(l.name) + '" data-del="' + i + '">✕</button>'
      + FIELDS.map(function (fl) {
        return '<label class="f"><span>' + fl[1] + '</span><input type="number" inputmode="decimal" min="0" step="any" value="' + esc(l[fl[0]]) + '" data-i="' + i + '" data-k="' + fl[0] + '"></label>';
      }).join("")
      + "</div>";
  });
  var opts = PRESETS[g].map(function (p, j) { return '<option value="' + j + '">' + esc(p[0]) + " · " + f(p[1], 0) + " W</option>"; }).join("");
  return '<div class="grp">' + groupHead(G)
    + (rows || '<p class="empty">No ' + G[2] + "s added.</p>")
    + '<select class="pick" data-g="' + g + '" aria-label="Add a ' + G[2] + '"><option value="">+ Add a ' + G[2] + "</option>" + opts
    + '<option value="custom">Custom ' + G[2] + "</option></select></div>";
}
function totalGroup(G) {
  var g = G[0], t = state.totals[g];
  return '<div class="grp">' + groupHead(G) + '<div class="set">'
    + (g === "motor" ? TOTAL_FIELDS.concat(BIG_MOTOR_FIELDS) : TOTAL_FIELDS).map(function (fl) {
      var id = "t-" + g + "-" + fl[0];
      return '<div><label for="' + id + '">' + fl[1] + '</label><input id="' + id + '" type="number" inputmode="decimal" min="0" step="any" value="' + esc(t[fl[0]]) + '" data-t="' + g + '" data-k="' + fl[0] + '"></div>';
    }).join("")
    + "</div>"
    + (g === "motor" ? '<p class="hint">Include the largest motor in the total. Only its start adds to the surge; the other motors count as running load.</p>' : "")
    + "</div>";
}

// Running W, daily Wh and VA for the active mode, plus the extra kVA drawn while
// motors start: `one` is the biggest single start, `all` is every motor at once.
function loadTotals() {
  var L = { W: 0, Wh: 0, VA: 0, one: 0, all: 0, p3: false, bigOver: false, g: {} };
  GROUPS.forEach(function (G) { L.g[G[0]] = { W: 0, Wh: 0 }; });
  function add(g, w, h, pf) {
    L.W += w; L.Wh += w * h; L.VA += w / pf;
    L.g[g].W += w; L.g[g].Wh += w * h;
  }
  if (state.mode === "each") {
    state.loads.forEach(function (l) {
      var q = num(l.q), pf = pfOf(l.pf), st = Math.max(num(l.st), 1), unitVA = num(l.w) / pf;
      add(l.g, num(l.w) * q, num(l.h), pf);
      if (q > 0 && st > 1) {
        L.one = Math.max(L.one, unitVA * (st - 1));
        L.all += unitVA * q * (st - 1);
      }
      if (q > 0 && l.p3) L.p3 = true;
    });
  } else {
    GROUPS.forEach(function (G) { var t = state.totals[G[0]]; add(G[0], num(t.w), num(t.h), pfOf(t.pf)); });
    var m = state.totals.motor;
    L.one = L.all = num(m.bw) / pfOf(m.pf) * (Math.max(num(m.bst), 1) - 1);
    L.bigOver = num(m.bw) > num(m.w);
  }
  return L;
}

function blank() {
  ["bank", "tBat", "fBat", "tInv", "fInv", "tPv", "fPv"].forEach(function (id) { $(id).innerHTML = ""; });
  ["sBat", "sInv", "sPv"].forEach(function (id) { $(id).textContent = "–"; $(id + "Sub").textContent = ""; });
}

function calc() {
  var L = loadTotals(), bad = [];
  var s = {
    days: val("days", bad), V: val("volt", bad), unit: val("unit", bad), dod: val("dod", bad) / 100, be: val("bat", bad) / 100,
    mar: val("mar", bad) / 100, cc: val("cc", bad), cp: val("cp", bad),
    ie: val("inv", bad) / 100, surge: val("surge", bad), start: $("start").value,
    psh: val("psh", bad), wp: val("wp", bad), day: val("day", bad) / 100, pr: val("pr", bad) / 100, rt: val("rt", bad), chg: val("chg", bad)
  };

  // 1. Loads
  GROUPS.forEach(function (G) {
    var t = L.g[G[0]];
    $("tot-" + G[0]).textContent = f(t.W / 1000, 2) + " kW · " + f(t.Wh / 1000, 2) + " kWh/day";
  });
  var allStart = state.mode === "each" && s.start === "all";
  var peakVA = L.VA + (allStart ? L.all : L.one);
  var startNote = state.mode === "total" ? "largest motor starting" : allStart ? "all motors together" : "one motor at a time";
  $("tLoad").innerHTML = tr([
    ["Daily energy", f(L.Wh / 1000, 2) + " kWh"],
    ["Running load", f(L.W / 1000, 2) + " kW · " + f(L.VA / 1000, 2) + " kVA"],
    ["Overall power factor", L.VA ? f(L.W / L.VA, 2) : "–"],
    ["Peak starting load (" + startNote + ")", f(peakVA / 1000, 2) + " kVA"]
  ]);
  var fl = "";
  if (!L.W) fl += flag("w", "Add at least one load with watts and quantity.");
  if (L.bigOver) fl += flag("w", "The largest motor is bigger than the motor total. Include it in the total running watts.");
  $("fLoad").innerHTML = fl;
  if (!L.W) { blank(); return; }
  if (bad.length) return;

  // 2. Battery bank: the unit count is whichever of energy, continuous current
  // and starting current needs the most units.
  var unitWh = s.unit * s.V;
  var backupWh = L.Wh * s.days;
  var nomWh = backupWh / s.ie / (s.dod * s.be) * (1 + s.mar);
  var iCont = L.W / (s.V * s.ie);
  var iPeak = peakVA / (s.V * s.ie); // worst case: starting kVA taken as kW
  var need = { energy: up(nomWh / unitWh), current: up(iCont / (s.unit * s.cc)), surge: up(iPeak / (s.unit * s.cp)) };
  var n = Math.max(1, need.energy, need.current, need.surge);
  var setBy = need.energy >= n ? "energy" : need.current >= n ? "current" : "surge";
  var bankAh = n * s.unit, bankWh = n * unitWh;
  var usableWh = bankWh * s.dod * s.be / (1 + s.mar);
  $("bank").innerHTML = Array(n + 1).join("<i></i>");
  $("tBat").innerHTML = tr([
    ["Backup energy for " + units(s.days, "day", "days"), f(backupWh / 1000, 2) + " kWh"],
    ["Battery capacity needed", f(nomWh / 1000, 1) + " kWh · " + f(nomWh / s.V, 0) + " Ah"],
    ["Units needed for energy", need.energy, setBy === "energy" && "hi"],
    ["Units needed for continuous current", need.current, setBy === "current" && "hi"],
    ["Units needed for motor starting", need.surge, setBy === "surge" && "hi"],
    ["Installed bank", n + " × " + f(s.unit, 0) + " Ah = " + f(bankAh, 0) + " Ah · " + f(bankWh / 1000, 1) + " kWh", "total"],
    ["Usable energy (end of life)", f(usableWh / 1000, 1) + " kWh"],
    ["Runtime at full running load", f(usableWh * s.ie / L.W, 1) + " h"],
    ["Continuous battery current", f(iCont, 0) + " A · " + f(iCont / bankAh, 2) + " C"],
    ["Peak current at motor start", f(iPeak, 0) + " A · " + f(iPeak / bankAh, 2) + " C"]
  ]);
  $("fBat").innerHTML = setBy === "energy"
    ? flag("g", "Energy sets the bank size: " + units(n, "unit holds", "units hold") + " the backup energy after depth of discharge, losses and the ageing margin.")
    : setBy === "current"
      ? flag("w", "Continuous current sets the bank size. " + units(need.energy, "unit", "units") + " would hold the energy, but " + f(iCont, 0) + " A at " + f(s.cc, 2) + " C per unit needs " + n + ". Check the datasheet's continuous rating.")
      : flag("w", "Motor starting sets the bank size. A soft starter, VFD or staggered starting would bring it down to " + units(Math.max(1, need.energy, need.current), "unit", "units") + ".");

  // 3. Hybrid inverter: the larger of running kVA plus margin, or peak starting
  // kVA over the inverter's surge capacity, rounded up to a standard size.
  var contKVA = L.VA / 1000 * INV_MARGIN, surgeKVA = peakVA / 1000 / s.surge;
  var needKVA = Math.max(contKVA, surgeKVA);
  var std = STD_KVA.filter(function (k) { return k >= needKVA - 1e-9; })[0];
  $("tInv").innerHTML = tr([
    ["Running load", f(L.VA / 1000, 2) + " kVA"],
    ["Plus 25% continuous margin", f(contKVA, 2) + " kVA", contKVA >= surgeKVA && "hi"],
    ["Peak starting load", f(peakVA / 1000, 2) + " kVA"],
    ["Divided by " + f(s.surge) + "× surge capacity", f(surgeKVA, 2) + " kVA", surgeKVA > contKVA && "hi"],
    ["Minimum inverter size", f(needKVA, 2) + " kVA"],
    ["Standard size", std ? f(std) + " kVA" : "Above 100 kVA", "total"]
  ]);
  fl = contKVA >= surgeKVA
    ? flag("g", "The running load sets the inverter size.")
    : flag("w", "Motor starting sets the inverter size. A soft starter or VFD on the largest motor, or staggered starting, would reduce it.");
  if (!std) fl += flag("w", "No single standard inverter is large enough. Split the load across parallel inverters.");
  if (L.p3) fl += flag("w", "Three-phase motors need a three-phase hybrid inverter. The kVA here is the total across all three phases.");
  $("fInv").innerHTML = fl;

  // 4. Solar: cover the daytime load directly and refill the bank from empty
  // (its DoD window) within the recharge target.
  var dayWh = L.Wh * s.day, dayDC = dayWh / s.ie;
  var refillWh = bankWh * s.dod / s.be;
  var needDC = dayDC + refillWh / s.rt;
  var perKwp = s.psh * s.pr * 1000; // Wh per kWp per day after all solar losses
  var kwpNeed = needDC / perKwp;
  var panels = Math.max(1, up(kwpNeed * 1000 / s.wp)), kwp = panels * s.wp / 1000;
  var genWh = kwp * perKwp;
  var iChg = kwp * 1000 * s.pr / s.V, iChgMax = bankAh * s.chg;
  var surplus = genWh - dayDC, capWh = iChgMax * s.V * s.psh;
  var perDay = Math.min(surplus, capWh);
  var rechargeDays = perDay > 0 ? refillWh / perDay : Infinity;
  $("tPv").innerHTML = tr([
    ["Daytime load fed by solar", f(dayWh / 1000, 2) + " kWh/day"],
    ["Battery refill, empty to full", f(refillWh / 1000, 1) + " kWh"],
    ["Solar energy needed per day", f(needDC / 1000, 1) + " kWh"],
    ["Array needed", f(kwpNeed, 2) + " kWp"],
    ["Solar array", panels + " × " + f(s.wp, 0) + " Wp = " + f(kwp, 2) + " kWp", "total"],
    ["Daily generation", f(genWh / 1000, 1) + " kWh"],
    ["Panel area", "about " + f(kwp * M2_PER_KWP, 0) + " m²"],
    ["MPPT charge current (× 1.25)", f(kwp * 1000 / s.V * MPPT_MARGIN, 0) + " A"],
    ["Hybrid inverter PV input", "at least " + f(kwp / DC_AC_RATIO, 1) + " kW"],
    ["Peak solar charge current", f(iChg, 0) + " A"],
    ["Bank's max charge current", f(iChgMax, 0) + " A"],
    ["Full recharge time", isFinite(rechargeDays) ? units(+rechargeDays.toFixed(2), "day", "days") : "Never"]
  ]);
  fl = "";
  if (iChg > iChgMax) fl += flag("w", "At peak sun the array can push " + f(iChg, 0) + " A into the bank, above the " + f(iChgMax, 0) + " A it accepts at " + f(s.chg, 2) + " C. Set the inverter's maximum charge current to " + f(iChgMax, 0) + " A or add battery units.");
  if (rechargeDays > s.rt + 1e-6) {
    fl += flag("w", "A full recharge takes " + (isFinite(rechargeDays) ? f(rechargeDays, 2) + " days" : "forever") + ", longer than the " + units(s.rt, "day", "days") + " target. "
      + (capWh < surplus ? "The bank's charge limit is the bottleneck, so add battery units or raise the charge rate if the datasheet allows," : "Add panels,")
      + " or plan for grid or generator charging.");
  } else {
    fl += flag("g", "The array refills the bank from empty in " + f(rechargeDays, 2) + " days, within the " + units(s.rt, "day", "days") + " target.");
  }
  $("fPv").innerHTML = fl;

  // Pinned summary
  $("sBat").textContent = f(bankWh / 1000, 1) + " kWh";
  $("sBatSub").textContent = n + " × " + f(s.unit, 0) + " Ah · " + f(s.V) + " V";
  $("sInv").textContent = std ? f(std) + " kVA" : "> 100 kVA";
  $("sInvSub").textContent = "min " + f(needKVA, 2) + " kVA";
  $("sPv").textContent = f(kwp, 2) + " kWp";
  $("sPvSub").textContent = panels + " × " + f(s.wp, 0) + " Wp";
}

// HP to watts: input power = HP × 746 / motor efficiency.
function helper() {
  var bad = [], hp = val("hp", bad), eff = val("hpEff", bad) / 100, pf = val("hpPf", bad);
  if (bad.length) return null;
  var w = hp * W_PER_HP / eff;
  $("tHp").innerHTML = tr([["Input power", f(w, 0) + " W"], ["Apparent power", f(w / pf / 1000, 2) + " kVA"]]);
  return { hp: hp, w: Math.round(w), pf: pf };
}

document.addEventListener("input", function (e) {
  var d = e.target.dataset || {};
  if (d.i !== undefined) state.loads[d.i][d.k] = e.target.value;
  else if (d.t !== undefined) state.totals[d.t][d.k] = e.target.value;
  helper();
  calc();
});
document.addEventListener("change", function (e) {
  var t = e.target;
  if (t.name === "mode") {
    state.mode = t.value;
    renderLoads(); calc();
  } else if (t.classList.contains("pick") && t.value) {
    var g = t.dataset.g, custom = t.value === "custom";
    state.loads.push(load(g, custom ? CUSTOM[g] : PRESETS[g][+t.value], 1));
    renderLoads(); calc();
    if (custom) { var nm = document.querySelector('[data-i="' + (state.loads.length - 1) + '"][data-k="name"]'); nm.focus(); nm.select(); }
  }
});
document.addEventListener("click", function (e) {
  var d = e.target.dataset;
  if (d && d.del !== undefined) { state.loads.splice(+d.del, 1); renderLoads(); calc(); }
});
document.addEventListener("submit", function (e) { e.preventDefault(); });
document.addEventListener("reset", function (e) {
  var form = e.target;
  if (form.id === "loads") {
    if (!confirm("Reset all loads to the starting list?")) { e.preventDefault(); return; }
    state.loads = defaultLoads();
    state.totals = defaultTotals();
  }
  // The browser restores the default values after this event, so recalculate on the next tick.
  setTimeout(function () {
    if (form.id === "loads") {
      document.querySelector('input[name="mode"][value="' + state.mode + '"]').checked = true;
      renderLoads(); helper();
    }
    calc();
  }, 0);
});
$("hpAdd").onclick = function () {
  var h = helper();
  if (!h) return;
  if (state.mode === "each") state.loads.push({ g: "motor", name: f(h.hp, 2) + " HP motor", w: h.w, q: 1, h: 1, pf: h.pf, st: 6, p3: false });
  else state.totals.motor.bw = h.w;
  renderLoads(); calc();
};
renderLoads(); helper(); calc();

if ("serviceWorker" in navigator) {
  window.addEventListener("load", function () { navigator.serviceWorker.register("/sw.js").catch(function () {}); });
}
