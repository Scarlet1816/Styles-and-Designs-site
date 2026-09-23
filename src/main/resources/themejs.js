const settingsBtn = document.getElementById("settings-btn");
const settingsDropdown = document.getElementById("settings-dropdown");

const pinkBtn = document.getElementById("pink-btn");
const lightBtn = document.getElementById("light-btn");
const darkBtn = document.getElementById("dark-btn");

const colorPicker = document.getElementById("color-picker");


// ======================================
// OPEN / CLOSE SETTINGS
// ======================================

if (settingsBtn && settingsDropdown) {
    settingsBtn.addEventListener("click", function(event) {
        event.stopPropagation();
        settingsDropdown.classList.toggle("hidden");
    });

    // Close settings when clicking elsewhere
    document.addEventListener("click", function(event) {
        if (
            !settingsDropdown.contains(event.target) &&
            event.target !== settingsBtn
        ) {
            settingsDropdown.classList.add("hidden");
        }
    });
}
// ======================================
// PINK
// ======================================

pinkBtn.addEventListener("click", function() {
    setTheme("#ff99cc");
});

// ======================================
// LIGHT PRESET
// ======================================
if (lightBtn) {
    lightBtn.addEventListener("click", function() {
        document.documentElement.removeAttribute("style"); // Fixed: Strips picker values cleanly
        document.documentElement.setAttribute("data-theme", "light");
        localStorage.setItem("user-theme-color", "light");
    });
}


// ======================================
// DARK PRESET
// ======================================
if (darkBtn) {
    darkBtn.addEventListener("click", function() {
        document.documentElement.removeAttribute("style"); 
        document.documentElement.setAttribute("data-theme", "dark");
        localStorage.setItem("user-theme-color", "dark");
    });
}


// ======================================
// COLOR PICKER
// ======================================
if (colorPicker) {
    colorPicker.addEventListener("input", function() {
        setTheme(colorPicker.value);
    });
}


// ======================================
// CHANGE WEBSITE THEME (Custom Generator)
// ======================================
function setTheme(color) {
    const root = document.documentElement;
    root.setAttribute("data-theme", "custom");
    root.style.setProperty("--accent", color);

    const brightness = getBrightness(color);

    if (brightness < 128) {
        // DARK OVERRIDES
        root.style.setProperty("--page-bg", lightenDarkenColor(color, -20));
        root.style.setProperty("--sidebar-bg", lightenDarkenColor(color, 20));
        root.style.setProperty("--card-bg", lightenDarkenColor(color, 30));
        root.style.setProperty("--accent-dark", lightenDarkenColor(color, -40));
        root.style.setProperty("--text-color", "#ffffff");
        root.style.setProperty("--text-muted", "#dddddd");
        root.style.setProperty("--border-color", "#ffffff");
    } else {
        // LIGHT OVERRIDES
        root.style.setProperty("--page-bg", lightenDarkenColor(color, -10));
        root.style.setProperty("--sidebar-bg", lightenDarkenColor(color, 25));
        root.style.setProperty("--card-bg", "#ffffff");
        root.style.setProperty("--accent-dark", lightenDarkenColor(color, -80));
        root.style.setProperty("--text-color", "#000000");
        root.style.setProperty("--text-muted", "#555555");
        root.style.setProperty("--border-color", "#000000");
    }

    localStorage.setItem("user-theme-color", color);
}


// ======================================
// CHECK COLOR BRIGHTNESS
// ======================================
function getBrightness(hex) {
    const rgb = parseInt(hex.substring(1), 16);
    const r = (rgb >> 16) & 255;
    const g = (rgb >> 8) & 255;
    const b = rgb & 255;
    return (0.299 * r + 0.587 * g + 0.114 * b);
}


// ======================================
// MAKE COLOR LIGHTER / DARKER
// ======================================
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


// ======================================
// LOAD SAVED COLOR STATE
// ======================================
const savedColor = localStorage.getItem("user-theme-color");

if (savedColor) {
    if (savedColor === "light" || savedColor === "dark") {
        document.documentElement.setAttribute("data-theme", savedColor);
    } else {
        if (colorPicker) colorPicker.value = savedColor;
        setTheme(savedColor);
    }
}


// ======================================
// KEEP ALL OPEN TABS IN SYNC
// ======================================
// Theme changes only used to apply to the page that made them, leaving
// any other already-open tab showing whatever theme was active when
// THAT tab last loaded. This listens for the change and re-applies it
// immediately in every other open tab of the site.
window.addEventListener("storage", function (event) {
    if (event.key !== "user-theme-color" || !event.newValue) return;

    const newColor = event.newValue;

    if (newColor === "light" || newColor === "dark") {
        document.documentElement.removeAttribute("style");
        document.documentElement.setAttribute("data-theme", newColor);
    } else {
        if (colorPicker) colorPicker.value = newColor;
        setTheme(newColor);
    }
});