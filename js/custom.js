const toggle = document.getElementById("menuToggle");
const menu = document.getElementById("ceMenu");
const icon = document.getElementById("ceToggleIcon");
const navLinks = menu ? menu.querySelectorAll(".ce-navlink") : [];

function setActiveLink(clickedLink) {
  navLinks.forEach(link => {
    link.classList.remove("is-active");
    link.removeAttribute("aria-current");
  });

  clickedLink.classList.add("is-active");
  clickedLink.setAttribute("aria-current", "page");
}

function setMenuState(isOpen) {
  if (!menu || !toggle) return;

  menu.classList.toggle("active", isOpen);
  toggle.setAttribute("aria-expanded", String(isOpen));

  if (icon) {
    icon.setAttribute("name", isOpen ? "close-outline" : "menu-outline");
  }
}

toggle?.addEventListener("click", () => {
  const isOpen = !menu.classList.contains("active");
  setMenuState(isOpen);
});

navLinks.forEach(link => {
  link.addEventListener("click", () => {
    setActiveLink(link);

    // close menu after click on mobile
    if (window.matchMedia("(max-width: 992px)").matches) {
      setMenuState(false);
    }
  });
});

// click outside close (mobile)
document.addEventListener("click", (e) => {
  if (!menu || !toggle) return;
  const isMobile = window.matchMedia("(max-width: 992px)").matches;
  if (!isMobile) return;

  const clickedInsideMenu = menu.contains(e.target);
  const clickedToggle = toggle.contains(e.target);

  if (menu.classList.contains("active") && !clickedInsideMenu && !clickedToggle) {
    setMenuState(false);
  }
});



(function () {
  const root = document.querySelector("[data-ce-tm]");
  if (!root) return;

  const track = root.querySelector(".ce-tm-track");
  const viewport = root.querySelector(".ce-tm-viewport");
  const dotsWrap = root.querySelector(".ce-tm-dots");
  const cards = Array.from(root.querySelectorAll(".ce-tm-card"));

  let index = 0;
  let visible = 4;
  let gap = 28;
  let step = 0;
  let maxIndex = 0;
  let autoplay = null;

  // --- helpers ---
  function getGapPx() {
    const cs = getComputedStyle(track);
    // some browsers expose "gap" as "column-gap" or "gap"
    const g = parseFloat(cs.gap || cs.columnGap || "0");
    return Number.isFinite(g) ? g : 0;
  }

  function calcVisible() {
    const w = window.innerWidth;
    if (w <= 640) return 1;
    if (w <= 1100) return 2;
    return 4;
  }

  function calc() {
    visible = calcVisible();
    gap = getGapPx();

    const first = cards[0];
    if (!first) return;

    const cardW = first.getBoundingClientRect().width;
    step = cardW + gap;

    maxIndex = Math.max(0, cards.length - visible);
    index = Math.min(index, maxIndex);

    buildDots();
    go(index, true);
  }

  function buildDots() {
    dotsWrap.innerHTML = "";
    const count = maxIndex + 1;

    for (let i = 0; i < count; i++) {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "ce-tm-dot" + (i === index ? " is-active" : "");
      b.setAttribute("aria-label", `Go to slide ${i + 1}`);
      b.addEventListener("click", () => {
        stopAuto();
        go(i);
        startAuto();
      });
      dotsWrap.appendChild(b);
    }
  }

  function setActiveDot() {
    const dots = dotsWrap.querySelectorAll(".ce-tm-dot");
    dots.forEach((d, i) => d.classList.toggle("is-active", i === index));
  }

  function go(i, immediate = false) {
    index = Math.max(0, Math.min(i, maxIndex));

    if (immediate) track.style.transition = "none";
    track.style.transform = `translateX(${-index * step}px)`;
    setActiveDot();

    if (immediate) {
      requestAnimationFrame(() => {
        track.style.transition = "transform .55s var(--ease)";
      });
    }
  }

  function next() {
    if (maxIndex === 0) return;
    go(index >= maxIndex ? 0 : index + 1);
  }

  function startAuto() {
    stopAuto();
    // pause auto if user prefers reduced motion
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;
    autoplay = setInterval(next, 3800);
  }

  function stopAuto() {
    if (autoplay) clearInterval(autoplay);
    autoplay = null;
  }

  // --- swipe/drag ---
  let isDown = false;
  let startX = 0;
  let startT = 0;

  function onDown(clientX) {
    if (maxIndex === 0) return;
    isDown = true;
    startX = clientX;
    startT = -index * step;
    track.style.transition = "none";
    stopAuto();
  }

  function onMove(clientX) {
    if (!isDown) return;
    const dx = clientX - startX;
    track.style.transform = `translateX(${startT + dx}px)`;
  }

  function onUp(clientX) {
    if (!isDown) return;
    isDown = false;

    const dx = clientX - startX;
    const threshold = Math.min(80, step * 0.25);

    track.style.transition = "transform .55s var(--ease)";

    if (dx < -threshold) go(index + 1);
    else if (dx > threshold) go(index - 1);
    else go(index);

    startAuto();
  }

  // mouse
  viewport.addEventListener("mousedown", (e) => onDown(e.clientX));
  window.addEventListener("mousemove", (e) => onMove(e.clientX));
  window.addEventListener("mouseup", (e) => onUp(e.clientX));

  // touch
  viewport.addEventListener("touchstart", (e) => onDown(e.touches[0].clientX), { passive: true });
  viewport.addEventListener("touchmove", (e) => onMove(e.touches[0].clientX), { passive: true });
  viewport.addEventListener("touchend", (e) => onUp((e.changedTouches[0] || {}).clientX || startX), { passive: true });

  // pause on hover (desktop)
  root.addEventListener("mouseenter", stopAuto);
  root.addEventListener("mouseleave", startAuto);

  // init
  calc();
  startAuto();

  // recalc on resize
  let rT = null;
  window.addEventListener("resize", () => {
    clearTimeout(rT);
    rT = setTimeout(calc, 120);
  });
})();



(function () {
  const wrap = document.querySelector("[data-ce-faq]");
  if (!wrap) return;

  const items = Array.from(wrap.querySelectorAll(".ce-faq-item"));

  function setHeight(item, open) {
    const panel = item.querySelector(".ce-faq-a");
    if (!panel) return;

    if (!open) {
      panel.style.height = panel.getBoundingClientRect().height + "px";
      requestAnimationFrame(() => {
        panel.style.height = "0px";
      });
      return;
    }

    panel.style.height = "auto";
    const h = panel.scrollHeight;
    panel.style.height = "0px";
    requestAnimationFrame(() => {
      panel.style.height = h + "px";
    });
  }

  function closeItem(item) {
    if (!item.classList.contains("is-open")) return;
    item.classList.remove("is-open");

    const btn = item.querySelector(".ce-faq-q");
    if (btn) btn.setAttribute("aria-expanded", "false");

    setHeight(item, false);
  }

  function openItem(item) {
    if (item.classList.contains("is-open")) return;
    item.classList.add("is-open");

    const btn = item.querySelector(".ce-faq-q");
    if (btn) btn.setAttribute("aria-expanded", "true");

    setHeight(item, true);
  }

  function toggleItem(item) {
    const isOpen = item.classList.contains("is-open");

    // close others (one open at a time)
    items.forEach(it => {
      if (it !== item) closeItem(it);
    });

    if (isOpen) closeItem(item);
    else openItem(item);
  }

  // init: ensure correct open height for default open item
  items.forEach((item) => {
    const btn = item.querySelector(".ce-faq-q");
    const panel = item.querySelector(".ce-faq-a");

    if (!btn || !panel) return;

    // ensure aria state
    btn.setAttribute("aria-expanded", item.classList.contains("is-open") ? "true" : "false");

    // set initial height
    if (item.classList.contains("is-open")) {
      panel.style.height = "auto";
      const h = panel.scrollHeight;
      panel.style.height = h + "px";
    } else {
      panel.style.height = "0px";
    }

    btn.addEventListener("click", () => toggleItem(item));
  });

  // keep open panel correct on resize
  let rT = null;
  window.addEventListener("resize", () => {
    clearTimeout(rT);
    rT = setTimeout(() => {
      items.forEach((item) => {
        if (!item.classList.contains("is-open")) return;
        const panel = item.querySelector(".ce-faq-a");
        if (!panel) return;
        panel.style.height = "auto";
        const h = panel.scrollHeight;
        panel.style.height = h + "px";
      });
    }, 120);
  });

  // ESC closes all (nice professional touch)
  window.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;
    items.forEach(closeItem);
  });
})();
