/* ==========================================================
   Empowering the Nation — shared script (website + mobile app)
   Menus and drop-down, course search and filter, fee calculator
   with validation and quote, contact form with validation, map.
   ========================================================== */
(function () {
  "use strict";

  /* Course catalogue (generated from the same data as the pages) */
  var COURSES = {"first-aid": {"name": "First Aid", "fee": 1500, "duration": "6 months"}, "sewing": {"name": "Sewing", "fee": 1500, "duration": "6 months"}, "landscaping": {"name": "Landscaping", "fee": 1500, "duration": "6 months"}, "life-skills": {"name": "Life Skills", "fee": 1500, "duration": "6 months"}, "child-minding": {"name": "Child Minding", "fee": 750, "duration": "6 weeks"}, "cooking": {"name": "Cooking", "fee": 750, "duration": "6 weeks"}, "garden-maintenance": {"name": "Garden Maintenance", "fee": 750, "duration": "6 weeks"}};
  var VAT_RATE = 0.15;
  var CART_KEY = "etnCart";

  /* ---------- Helpers ---------- */
  function $(sel, root) { return (root || document).querySelector(sel); }
  function $all(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
  function round2(n) { return Math.round(n * 100) / 100; }
  function money(n) {
    return "R" + n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
  function setText(sel, txt) { var el = $(sel); if (el) el.textContent = txt; }
  function param(name) {
    try { return new URLSearchParams(window.location.search).get(name); } catch (e) { return null; }
  }

  // Error handling: storage can be blocked (private browsing, strict settings).
  // Every read and write is guarded so the site keeps working without it.
  function readCart() {
    try {
      var raw = window.sessionStorage.getItem(CART_KEY);
      var list = raw ? JSON.parse(raw) : [];
      return Array.isArray(list) ? list.filter(function (id) { return COURSES[id]; }) : [];
    } catch (e) { return []; }
  }
  function writeCart(ids) {
    try { window.sessionStorage.setItem(CART_KEY, JSON.stringify(ids)); } catch (e) { /* keep going without storage */ }
  }

  /* ---------- Validation rules ---------- */
  var RULES = {
    name: function (v) { return /^[A-Za-zÀ-ÿ'’\- ]+$/.test(v) && v.trim().split(/\s+/).length >= 2 && v.trim().length >= 4; },
    email: function (v) { return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v); },
    phone: function (v) {
      var d = v.replace(/[\s\-()]/g, "");
      return /^0[1-8]\d{8}$/.test(d) || /^\+27[1-8]\d{8}$/.test(d);
    }
  };
  // Shows or hides one field's error. The error text is only linked to the
  // field (aria-describedby) while it is showing, so screen readers don't
  // read out error messages for fields that are fine.
  function showError(input, errorEl, show) {
    if (errorEl) errorEl.classList.toggle("show", show);
    if (!input) return;
    if (!show) pruneSummary(input.id);
    input.setAttribute("aria-invalid", show ? "true" : "false");
    if (!errorEl) return;
    var ids = (input.getAttribute("aria-describedby") || "").split(/\s+/).filter(Boolean);
    var at = ids.indexOf(errorEl.id);
    if (show && at === -1) ids.push(errorEl.id);
    if (!show && at !== -1) ids.splice(at, 1);
    if (ids.length) input.setAttribute("aria-describedby", ids.join(" "));
    else input.removeAttribute("aria-describedby");
  }

  // Error summary at the top of a form: lists every problem as a link to its
  // field, then takes focus so screen readers announce it (WCAG 3.3.1, 3.3.3).
  function showSummary(box, problems) {
    if (!box) return;
    var list = $("ul", box);
    list.innerHTML = "";
    problems.forEach(function (p) {
      var li = document.createElement("li");
      var a = document.createElement("a");
      a.href = "#" + p.field.id;
      a.textContent = p.message;
      a.addEventListener("click", function (e) { e.preventDefault(); p.field.focus(); });
      li.appendChild(a); list.appendChild(li);
    });
    box.hidden = false;
    box.focus();
  }
  function hideSummary(box) { if (box) box.hidden = true; }
  // When a problem is fixed, take it off the list; hide the list once it is empty
  function pruneSummary(fieldId) {
    $all(".error-summary").forEach(function (box) {
      $all("a", box).forEach(function (a) {
        if (a.getAttribute("href") === "#" + fieldId) a.parentNode.remove();
      });
      if (!$("li", box)) box.hidden = true;
    });
  }

  /* ---------- Website: hamburger menu ---------- */
  var navToggle = $(".nav-toggle");
  if (navToggle) {
    navToggle.addEventListener("click", function () {
      var header = navToggle.closest(".site-header");
      var open = header.classList.toggle("nav-open");
      navToggle.setAttribute("aria-expanded", open ? "true" : "false");
      navToggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    });
  }

  /* ---------- Website: Courses drop-down menu ---------- */
  $all(".has-dropdown").forEach(function (dd) {
    var btn = $(".dropdown-toggle", dd);
    if (!btn) return;
    function setOpen(open) {
      dd.classList.toggle("open", open);
      btn.setAttribute("aria-expanded", open ? "true" : "false");
    }
    btn.addEventListener("click", function (e) {
      e.stopPropagation();
      var open = !dd.classList.contains("open");
      setOpen(open);
      if (open && e.detail === 0) { var first = $(".dropdown a", dd); if (first) first.focus(); }
    });
    dd.addEventListener("focusout", function (e) {
      if (!e.relatedTarget || !dd.contains(e.relatedTarget)) setOpen(false);
    });
    dd.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && dd.classList.contains("open")) { setOpen(false); btn.focus(); }
    });
    document.addEventListener("click", function (e) { if (!dd.contains(e.target)) setOpen(false); });
    // A menu opened by hovering can be closed with Escape without moving the mouse (WCAG 1.4.13)
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && dd.matches(":hover")) dd.classList.add("dismissed");
    });
    dd.addEventListener("mouseleave", function () { dd.classList.remove("dismissed"); });
  });

  /* ---------- Mobile app: menu drawer (a modal dialog) ---------- */
  var drawer = $("#menu-drawer");
  var drawerBtn = $("[data-menu-open]");
  if (drawer && drawerBtn) {
    var panel = $(".drawer-panel", drawer);
    var isOpen = function () { return drawer.classList.contains("open"); };
    var closeDrawer = function () {
      if (!isOpen()) return;
      drawer.classList.remove("open");
      drawerBtn.setAttribute("aria-expanded", "false");
      drawerBtn.focus(); // return focus to the button that opened it
    };
    drawerBtn.addEventListener("click", function () {
      drawer.classList.add("open");
      drawerBtn.setAttribute("aria-expanded", "true");
      var first = $(".drawer-links a", drawer); if (first) first.focus();
    });
    $all("[data-menu-close]", drawer).forEach(function (el) { el.addEventListener("click", closeDrawer); });
    document.addEventListener("keydown", function (e) {
      if (!isOpen()) return;
      if (e.key === "Escape") { closeDrawer(); return; }
      if (e.key !== "Tab") return;
      // Keep keyboard focus inside the open menu
      var items = $all("a[href], button", panel);
      var first = items[0], last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    });
  }

  /* ---------- "Add to fee calculator" links ---------- */
  $all("[data-add]").forEach(function (link) {
    link.addEventListener("click", function () {
      var id = link.getAttribute("data-add");
      var cart = readCart();
      if (COURSES[id] && cart.indexOf(id) === -1) cart.push(id);
      writeCart(cart);
    });
  });

  /* ---------- Courses: search and filter ---------- */
  var results = $("#course-results");
  if (results) {
    var search = $("#course-search");
    var duration = $("#filter-duration");
    var items = $all("[data-type]", results);
    var empty = $("#course-empty");
    var countEl = $("#course-count");
    var preset = param("type");
    if (preset === "six-month" || preset === "six-week") duration.value = preset;

    var apply = function () {
      var q = search.value.trim().toLowerCase();
      var d = duration.value;
      var shown = 0;
      items.forEach(function (el) {
        var ok = (d === "all" || el.getAttribute("data-type") === d) &&
                 (q === "" || el.getAttribute("data-name").indexOf(q) !== -1);
        el.hidden = !ok;
        if (ok) shown++;
      });
      empty.hidden = shown !== 0;
      countEl.textContent = shown === items.length ? "Showing all " + shown + " courses"
        : "Showing " + shown + " of " + items.length + " courses";
    };
    search.addEventListener("input", apply);
    duration.addEventListener("change", apply);
    $("#course-reset").addEventListener("click", function () {
      search.value = ""; duration.value = "all"; apply(); search.focus();
    });
    apply();
    if (window.location.hash === "#course-search") search.focus();
  }

  /* ---------- Fee calculator ---------- */
  function discountRate(count) {
    if (count <= 1) return 0;
    if (count === 2) return 0.05;
    if (count === 3) return 0.10;
    return 0.15;
  }
  function quote(ids) {
    var subtotal = 0;
    ids.forEach(function (id) { subtotal += COURSES[id].fee; });
    var rate = discountRate(ids.length);
    var discount = round2(subtotal * rate);
    var vat = round2((subtotal - discount) * VAT_RATE);
    return { count: ids.length, subtotal: subtotal, rate: rate, discount: discount, vat: vat, total: round2(subtotal - discount + vat) };
  }

  var feeForm = $("#fee-form");
  if (feeForm) {
    var boxes = $all('input[name="course"]', feeForm);
    var fields = { name: $("#q-name"), email: $("#q-email"), phone: $("#q-phone") };
    var notice = $("#fee-notice");
    var stepped = feeForm.hasAttribute("data-steps");

    // Pre-select courses added from course pages (?add=id or saved selection)
    var pre = readCart();
    var added = param("add");
    if (added) {
      if (COURSES[added]) { if (pre.indexOf(added) === -1) pre.push(added); }
      else {
        notice.textContent = "We couldn't find the course in that link. Please tick your courses from the list below.";
        notice.hidden = false;
      }
    }
    boxes.forEach(function (b) { b.checked = pre.indexOf(b.value) !== -1; });

    var selected = function () {
      return boxes.filter(function (b) { return b.checked; }).map(function (b) { return b.value; });
    };
    var render = function () {
      var ids = selected();
      var q = quote(ids);
      boxes.forEach(function (b) { b.closest(".check-item").classList.toggle("selected", b.checked); });
      setText("#sum-count", "Subtotal (" + q.count + (q.count === 1 ? " course)" : " courses)"));
      setText("#sum-sub", money(q.subtotal));
      setText("#sum-disc-label", q.rate ? "Discount (" + Math.round(q.rate * 100) + "%)" : "Discount (none)");
      setText("#sum-disc", (q.discount ? "-" : "") + money(q.discount));
      setText("#sum-vat", money(q.vat));
      setText("#sum-total", money(q.total));
      $all(".discount-table tr[data-count]").forEach(function (tr) {
        var c = parseInt(tr.getAttribute("data-count"), 10);
        tr.classList.toggle("current", q.count > 0 && (c === q.count || (c === 4 && q.count > 3)));
      });
      writeCart(ids);
      if (ids.length) courseError(false);
      return q;
    };
    // Screen readers hear one short update when a course is ticked, instead of the whole summary
    var status = $("#fee-status");
    boxes.forEach(function (b) {
      b.addEventListener("change", function () {
        var q = render();
        if (status) {
          status.textContent = q.count + (q.count === 1 ? " course" : " courses") + " selected. " +
            (q.rate ? Math.round(q.rate * 100) + "% discount. " : "") + "Total " + money(q.total) + " including VAT.";
        }
      });
    });
    render();

    var summaryBox = $("#fee-errors");
    function courseError(show) {
      var el = $("#course-error"), group = $("#step-1");
      el.classList.toggle("show", show);
      if (show) group.setAttribute("aria-describedby", "course-error");
      else { group.removeAttribute("aria-describedby"); pruneSummary(boxes[0].id); }
    }

    var checkField = function (key) {
      var ok = RULES[key](fields[key].value.trim());
      showError(fields[key], $("#" + fields[key].id + "-error"), !ok);
      return ok;
    };
    Object.keys(fields).forEach(function (key) {
      fields[key].addEventListener("blur", function () { if (fields[key].value.trim()) checkField(key); });
      fields[key].addEventListener("input", function () {
        if (fields[key].getAttribute("aria-invalid") === "true") checkField(key);
      });
    });

    // Mobile app: two-step form
    var goStep = function (n, keepFocus) {
      feeForm.setAttribute("data-step", String(n));
      $("#step2-actions").hidden = n !== 2;
      var i1 = $("#ind-1"), i2 = $("#ind-2");
      i1.classList.toggle("on", n === 1); i1.classList.toggle("done", n === 2);
      i2.classList.toggle("on", n === 2);
      if (n === 1) { i1.setAttribute("aria-current", "step"); i2.removeAttribute("aria-current"); }
      else { i2.setAttribute("aria-current", "step"); i1.removeAttribute("aria-current"); }
      window.scrollTo(0, 0);
      if (keepFocus) return;
      var target = n === 2 ? fields.name : boxes[0];
      if (target) target.focus();
    };
    var noCourseProblem = function () {
      return { field: boxes[0], message: $("#course-error").textContent };
    };
    if (stepped) {
      feeForm.setAttribute("data-step", "1");
      $("#to-step-2").addEventListener("click", function () {
        if (!selected().length) { courseError(true); showSummary(summaryBox, [noCourseProblem()]); return; }
        hideSummary(summaryBox);
        goStep(2);
      });
      $("#to-step-1").addEventListener("click", function () { hideSummary(summaryBox); goStep(1); });
    }

    var result = $("#quote-result");
    feeForm.addEventListener("submit", function (e) {
      e.preventDefault();
      var ids = selected();
      var problems = [];
      if (!ids.length) {
        courseError(true);
        if (stepped) { goStep(1, true); showSummary(summaryBox, [noCourseProblem()]); return; }
        problems.push(noCourseProblem());
      }
      Object.keys(fields).forEach(function (key) {
        if (!checkField(key)) problems.push({ field: fields[key], message: $("#" + fields[key].id + "-error").textContent });
      });
      if (problems.length) { showSummary(summaryBox, problems); return; }
      hideSummary(summaryBox);

      var q = quote(ids);
      var body = $("#quote-body"); body.innerHTML = "";
      ids.forEach(function (id) {
        var tr = document.createElement("tr");
        var th = document.createElement("th"); th.scope = "row"; th.textContent = COURSES[id].name;
        var td1 = document.createElement("td"); td1.textContent = COURSES[id].duration;
        var td2 = document.createElement("td"); td2.className = "num"; td2.textContent = money(COURSES[id].fee);
        tr.appendChild(th); tr.appendChild(td1); tr.appendChild(td2); body.appendChild(tr);
      });
      var foot = $("#quote-foot"); foot.innerHTML = "";
      [["Subtotal", money(q.subtotal), ""],
       [q.rate ? "Discount (" + Math.round(q.rate * 100) + "%)" : "Discount (none)", (q.discount ? "-" : "") + money(q.discount), ""],
       ["VAT (15%)", money(q.vat), ""],
       ["Total", money(q.total), "grand"]].forEach(function (r) {
        var tr = document.createElement("tr"); if (r[2]) tr.className = r[2];
        var td = document.createElement("td"); td.colSpan = 2; td.textContent = r[0];
        var tv = document.createElement("td"); tv.className = "num"; tv.textContent = r[1];
        tr.appendChild(td); tr.appendChild(tv); foot.appendChild(tr);
      });
      var first = fields.name.value.trim().split(/\s+/)[0];
      $("#quote-intro").textContent = "Thanks, " + first + ". Here is your quote for " + q.count +
        (q.count === 1 ? " course" : " courses") + ". We'll use " + fields.email.value.trim() + " and " +
        fields.phone.value.trim() + " to follow up.";
      feeForm.hidden = true;
      var stepper = $(".stepper"); if (stepper) stepper.hidden = true;
      result.hidden = false;
      result.focus();
      writeCart([]);
    });

    $("#quote-new").addEventListener("click", function () {
      feeForm.reset();
      boxes.forEach(function (b) { b.checked = false; });
      Object.keys(fields).forEach(function (k) { showError(fields[k], $("#" + fields[k].id + "-error"), false); });
      courseError(false);
      hideSummary(summaryBox);
      if (status) status.textContent = "";
      render();
      result.hidden = true;
      feeForm.hidden = false;
      var stepper = $(".stepper"); if (stepper) stepper.hidden = false;
      if (stepped) goStep(1); else boxes[0].focus();
    });
  }

  /* ---------- Contact form ---------- */
  var cForm = $("#contact-form");
  if (cForm) {
    var cf = {
      name: $("#c-name"), email: $("#c-email"), phone: $("#c-phone"),
      subject: $("#c-subject"), venue: $("#c-venue"), message: $("#c-message")
    };
    var count = $("#c-message-count");
    var MIN = 20, MAX = 500;
    var checks = {
      name: function () { return RULES.name(cf.name.value.trim()); },
      email: function () { return RULES.email(cf.email.value.trim()); },
      phone: function () { var v = cf.phone.value.trim(); return v === "" || RULES.phone(v); },
      subject: function () { return cf.subject.value !== ""; },
      venue: function () { return cf.venue.value !== ""; },
      message: function () { var n = cf.message.value.trim().length; return n >= MIN && n <= MAX; }
    };
    var validate = function (key) {
      var ok = checks[key]();
      showError(cf[key], $("#c-" + key + "-error"), !ok);
      return ok;
    };
    var updateCount = function () {
      var n = cf.message.value.trim().length;
      count.textContent = n + " of " + MAX + " characters" + (n < MIN ? " (at least " + MIN + " needed)" : "");
    };
    var cSummary = $("#contact-errors");
    cf.message.addEventListener("input", updateCount);
    updateCount();

    // Pre-fill subject from a course page (?course=id)
    var fromCourse = param("course");
    if (fromCourse && COURSES[fromCourse]) cf.subject.value = fromCourse;

    Object.keys(cf).forEach(function (key) {
      var el = cf[key];
      el.addEventListener(el.tagName === "SELECT" ? "change" : "blur", function () {
        if (el.tagName === "SELECT" || el.value.trim()) validate(key);
      });
      el.addEventListener("input", function () { if (el.getAttribute("aria-invalid") === "true") validate(key); });
    });

    cForm.addEventListener("submit", function (e) {
      e.preventDefault();
      var problems = [];
      Object.keys(cf).forEach(function (key) {
        if (!validate(key)) problems.push({ field: cf[key], message: $("#c-" + key + "-error").textContent });
      });
      if (problems.length) { showSummary(cSummary, problems); return; }
      hideSummary(cSummary);
      var venueName = cf.venue.options[cf.venue.selectedIndex].text;
      $("#contact-success-text").textContent = "Thank you, " + cf.name.value.trim().split(/\s+/)[0] +
        ". Your message about “" + cf.subject.options[cf.subject.selectedIndex].text.replace("Course: ", "") +
        "” is ready for the " + venueName + ". A consultant will reply to " + cf.email.value.trim() + ".";
      cForm.hidden = true;
      var ok = $("#contact-success"); ok.hidden = false; ok.focus();
    });
    $("#contact-new").addEventListener("click", function () {
      cForm.reset(); updateCount();
      Object.keys(cf).forEach(function (k) { showError(cf[k], $("#c-" + k + "-error"), false); });
      hideSummary(cSummary);
      $("#contact-success").hidden = true; cForm.hidden = false; cf.name.focus();
    });
  }

  /* ---------- Venue map switcher ---------- */
  var map = $("#venue-map");
  if (map) {
    $all(".venue-btn").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var addr = btn.getAttribute("data-address");
        $all(".venue-btn").forEach(function (b) {
          b.classList.toggle("on", b === btn);
          b.setAttribute("aria-pressed", b === btn ? "true" : "false");
        });
        map.src = "https://maps.google.com/maps?q=" + encodeURIComponent(addr) + "&z=15&output=embed";
        map.title = "Map of " + btn.querySelector("strong").textContent;
        $("#map-link").href = "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(addr);
      });
    });
  }
})();
