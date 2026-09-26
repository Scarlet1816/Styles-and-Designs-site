/* =========================================================
   themejs.js — theme system (null-safe)
   Presets: Blue (default), Pink, Light, Dark, Custom
   ========================================================= */

const settingsBtn      = document.getElementById("settings-btn");
const settingsDropdown = document.getElementById("settings-dropdown");

const blueBtn  = document.getElementById("blue-btn");
const pinkBtn  = document.getElementById("pink-btn");
const lightBtn = document.getElementById("light-btn");
const darkBtn  = document.getElementById("dark-btn");

const colorPicker = document.getElementById("color-picker");

/* =========================
   OPEN / CLOSE SETTINGS
   ========================= */
if (settingsBtn && settingsDropdown) {
  settingsBtn.addEventListener("click", function (event) {
    event.stopPropagation();
    settingsDropdown.classList.toggle("hidden");
  });

  document.addEventListener("click", function (event) {
    if (!settingsDropdown.contains(event.target) && event.target !== settingsBtn) {
      settingsDropdown.classList.add("hidden");
    }
  });

  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape" && !settingsDropdown.classList.contains("hidden")) {
      settingsDropdown.classList.add("hidden");
    }
  });
}

/* =========================
   PRESET HANDLERS
   ========================= */
function applyPreset(name) {
  document.documentElement.removeAttribute("style");
  document.documentElement.setAttribute("data-theme", name);
  localStorage.setItem("user-theme-color", name);
}

if (blueBtn)  blueBtn.addEventListener("click",  function () { applyPreset("blue");  });
if (pinkBtn)  pinkBtn.addEventListener("click",  function () { applyPreset("pink");  });
if (lightBtn) lightBtn.addEventListener("click", function () { applyPreset("light"); });
if (darkBtn)  darkBtn.addEventListener("click",  function () { applyPreset("dark");  });

/* =========================
   COLOR PICKER (custom)
   ========================= */
if (colorPicker) {
  colorPicker.addEventListener("input", function () {
    setTheme(colorPicker.value);
  });
}

/* =========================
   APPLY CUSTOM COLOR
   ========================= */
function setTheme(color) {
  if (!/^#[0-9a-fA-F]{6}$/.test(color)) return;

  const root = document.documentElement;
  root.setAttribute("data-theme", "custom");
  root.style.setProperty("--accent", color);

  const brightness = getBrightness(color);

  if (brightness < 128) {
    /* Dark custom theme */
    root.style.setProperty("--page-bg",      lightenDarkenColor(color, -20));
    root.style.setProperty("--sidebar-bg",   lightenDarkenColor(color,  20));
    root.style.setProperty("--card-bg",      lightenDarkenColor(color,  30));
    root.style.setProperty("--accent-dark",  lightenDarkenColor(color, -40));
    root.style.setProperty("--text-color",   "#ffffff");
    root.style.setProperty("--text-muted",   "#dddddd");
    root.style.setProperty("--border-color", "#ffffff");
  } else {
    /* Light custom theme */
    root.style.setProperty("--page-bg",      lightenDarkenColor(color, -10));
    root.style.setProperty("--sidebar-bg",   lightenDarkenColor(color,  25));
    root.style.setProperty("--card-bg",      "#ffffff");
    root.style.setProperty("--accent-dark",  lightenDarkenColor(color, -80));
    root.style.setProperty("--text-color",   "#000000");
    root.style.setProperty("--text-muted",   "#555555");
    root.style.setProperty("--border-color", "#000000");
  }

  localStorage.setItem("user-theme-color", color);
}

/* =========================
   HELPERS
   ========================= */
function getBrightness(hex) {
  const rgb = parseInt(hex.substring(1), 16);
  const r = (rgb >> 16) & 255;
  const g = (rgb >> 8) & 255;
  const b = rgb & 255;
  return (0.299 * r + 0.587 * g + 0.114 * b);
}

function lightenDarkenColor(hex, amount) {
  let num = parseInt(hex.substring(1), 16);
  let r = (num >> 16) + amount;
  let g = ((num >> 8) & 255) + amount;
  let b = (num & 255) + amount;
  r = Math.max(0, Math.min(255, r));
  g = Math.max(0, Math.min(255, g));
  b = Math.max(0, Math.min(255, b));
  return "#" + ((r << 16) | (g << 8) | b).toString(16).padStart(6, "0");
}

/* =========================
   LOAD SAVED THEME
   ========================= */
(function loadSavedTheme() {
  const saved = localStorage.getItem("user-theme-color");

  /* Nothing saved → keep the CSS default (blue) */
  if (!saved) return;

  if (saved === "blue" || saved === "pink" || saved === "light" || saved === "dark") {
    document.documentElement.setAttribute("data-theme", saved);
  } else {
    /* Assume it's a hex color */
    if (colorPicker) colorPicker.value = saved;
    setTheme(saved);
  }
})();

/* =========================
   KEEP TABS IN SYNC
   ========================= */
window.addEventListener("storage", function (event) {
  if (event.key !== "user-theme-color" || !event.newValue) return;

  const newColor = event.newValue;

  if (newColor === "blue" || newColor === "pink" || newColor === "light" || newColor === "dark") {
    document.documentElement.removeAttribute("style");
    document.documentElement.setAttribute("data-theme", newColor);
  } else {
    if (colorPicker) colorPicker.value = newColor;
    setTheme(newColor);
  }
});
