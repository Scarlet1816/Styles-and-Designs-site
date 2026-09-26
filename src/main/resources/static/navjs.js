/* =========================================================
   navjs.js — mobile hamburger toggle for the sidebar drawer
   ========================================================= */
(function () {
  "use strict";

  const btn = document.getElementById("hamburgerBtn");
  if (!btn) return;

  function openNav() {
    document.body.classList.add("nav-open");
    btn.setAttribute("aria-label", "Close navigation menu");
    btn.textContent = "×";
  }

  function closeNav() {
    document.body.classList.remove("nav-open");
    btn.setAttribute("aria-label", "Open navigation menu");
    btn.textContent = "☰";
  }

  function toggleNav() {
    if (document.body.classList.contains("nav-open")) closeNav();
    else openNav();
  }

  btn.addEventListener("click", toggleNav);

  /* Tap the dimmed backdrop to close */
  document.body.addEventListener("click", function (e) {
    if (!document.body.classList.contains("nav-open")) return;
    /* If click is not inside the sidebar and not on the hamburger */
    const sidebar = document.querySelector(".sidebar");
    if (sidebar && sidebar.contains(e.target)) return;
    if (e.target === btn) return;
    closeNav();
  });

  /* Auto-close when a nav link is clicked */
  document.querySelectorAll(".sidebar .nav-btn").forEach(function (link) {
    link.addEventListener("click", closeNav);
  });

  /* Escape key */
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") closeNav();
  });

  /* If viewport grows past mobile breakpoint, reset */
  window.addEventListener("resize", function () {
    if (window.innerWidth > 700) closeNav();
  });
})();
