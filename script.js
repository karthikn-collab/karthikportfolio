(function () {
  const body = document.body;
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  body.classList.add("loading");

  const loader = document.querySelector(".loader");
  const loaderWords = Array.from(document.querySelectorAll(".loader__word"));
  let loaderIndex = 0;

  function finishLoading() {
    if (!loader) return;
    loader.classList.add("is-hidden");
    body.classList.remove("loading");
    window.setTimeout(() => loader.remove(), reducedMotion ? 0 : 820);
  }

  if (reducedMotion) {
    finishLoading();
  } else {
    const loaderTimer = window.setInterval(() => {
      loaderWords[loaderIndex]?.classList.remove("is-active");
      loaderIndex = (loaderIndex + 1) % loaderWords.length;
      loaderWords[loaderIndex]?.classList.add("is-active");
    }, 210);

    window.setTimeout(() => {
      window.clearInterval(loaderTimer);
      finishLoading();
    }, 1250);
  }

  const menuButton = document.querySelector(".menu-button");
  const menuPanel = document.querySelector(".menu-panel");

  function setMenu(open) {
    body.classList.toggle("menu-open", open);
    menuButton?.setAttribute("aria-expanded", String(open));
    menuButton?.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    menuPanel?.setAttribute("aria-hidden", String(!open));
  }

  menuButton?.addEventListener("click", () => setMenu(!body.classList.contains("menu-open")));
  menuPanel?.addEventListener("click", (event) => {
    if (event.target instanceof HTMLAnchorElement || event.target === menuPanel) {
      setMenu(false);
    }
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") setMenu(false);
  });

  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener("click", (event) => {
      const id = anchor.getAttribute("href");
      if (!id || id === "#") return;
      const target = document.querySelector(id);
      if (!target) return;
      event.preventDefault();
      target.scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth", block: "start" });
      setMenu(false);
    });
  });

  const reveals = Array.from(document.querySelectorAll(".reveal"));
  if ("IntersectionObserver" in window) {
    const revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            revealObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" }
    );
    reveals.forEach((element) => revealObserver.observe(element));
  } else {
    reveals.forEach((element) => element.classList.add("is-visible"));
  }

  const cursor = document.querySelector(".cursor");
  const preview = document.querySelector(".preview");
  const previewImage = preview?.querySelector("img");
  const previewTargets = Array.from(document.querySelectorAll("[data-preview]"));
  const canHover = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

  if (cursor && preview && previewImage && canHover && !reducedMotion) {
    let mouseX = 0;
    let mouseY = 0;
    let cursorX = 0;
    let cursorY = 0;
    let previewX = 0;
    let previewY = 0;
    let raf = 0;

    const animatePointer = () => {
      cursorX += (mouseX - cursorX) * 0.22;
      cursorY += (mouseY - cursorY) * 0.22;
      previewX += (mouseX + 160 - previewX) * 0.16;
      previewY += (mouseY - 20 - previewY) * 0.16;
      cursor.style.transform = `translate3d(${cursorX}px, ${cursorY}px, 0) translate(-50%, -50%)`;
      preview.style.transform = `translate3d(${previewX}px, ${previewY}px, 0) translate(-50%, -50%)`;
      raf = window.requestAnimationFrame(animatePointer);
    };

    document.addEventListener("mousemove", (event) => {
      mouseX = event.clientX;
      mouseY = event.clientY;
      if (!raf) raf = window.requestAnimationFrame(animatePointer);
    });

    previewTargets.forEach((target) => {
      target.addEventListener("mouseenter", () => {
        const src = target.getAttribute("data-preview");
        if (src) previewImage.src = src;
        cursor.classList.add("is-visible");
        preview.classList.add("is-visible");
      });
      target.addEventListener("mouseleave", () => {
        cursor.classList.remove("is-visible");
        preview.classList.remove("is-visible");
      });
      target.addEventListener("focus", () => {
        const src = target.getAttribute("data-preview");
        if (src) previewImage.src = src;
        preview.classList.add("is-visible");
      });
      target.addEventListener("blur", () => preview.classList.remove("is-visible"));
    });
  }

  const magneticItems = Array.from(document.querySelectorAll(".magnetic"));
  if (canHover && !reducedMotion) {
    magneticItems.forEach((item) => {
      item.addEventListener("mousemove", (event) => {
        const rect = item.getBoundingClientRect();
        const x = event.clientX - rect.left - rect.width / 2;
        const y = event.clientY - rect.top - rect.height / 2;
        item.style.transform = `translate(${x * 0.16}px, ${y * 0.16}px)`;
      });
      item.addEventListener("mouseleave", () => {
        item.style.transform = "translate(0, 0)";
      });
    });
  }

  const counters = Array.from(document.querySelectorAll("[data-count]"));
  function runCounter(element) {
    const target = Number(element.getAttribute("data-count") || "0");
    const prefix = element.getAttribute("data-prefix") || "";
    const duration = reducedMotion ? 1 : 1100;
    const start = performance.now();

    function tick(now) {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const value = Math.round(target * eased);
      element.textContent = `${prefix}${value}`;
      if (progress < 1) window.requestAnimationFrame(tick);
    }

    window.requestAnimationFrame(tick);
  }

  if ("IntersectionObserver" in window) {
    const counterObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            runCounter(entry.target);
            counterObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.45 }
    );
    counters.forEach((counter) => counterObserver.observe(counter));
  } else {
    counters.forEach(runCounter);
  }

  const heroTrack = document.querySelector(".hero__name-track");
  const parallaxItems = Array.from(document.querySelectorAll("[data-parallax]"));
  let scrollRaf = 0;

  function onScrollFrame() {
    const scrollY = window.scrollY || 0;
    if (heroTrack && !reducedMotion) {
      heroTrack.style.transform = `translate3d(${-scrollY * 0.18}px, 0, 0)`;
    }
    if (!reducedMotion) {
      parallaxItems.forEach((item) => {
        const speed = Number(item.getAttribute("data-parallax") || 0);
        item.style.transform = `translate3d(0, ${scrollY * speed}px, 0)`;
      });
    }
    scrollRaf = 0;
  }

  window.addEventListener("scroll", () => {
    if (!scrollRaf) scrollRaf = window.requestAnimationFrame(onScrollFrame);
  }, { passive: true });
  onScrollFrame();

  const localTime = document.querySelector("#local-time");
  function updateTime() {
    if (!localTime) return;
    const formatted = new Intl.DateTimeFormat("en-GB", {
      timeZone: "Europe/Paris",
      hour: "2-digit",
      minute: "2-digit"
    }).format(new Date());
    localTime.textContent = formatted;
  }
  updateTime();
  window.setInterval(updateTime, 30000);
})();
