/**
 * Canteen admin login — separate from Firebase user auth.
 * Demo: identifier `admin` (any case) + password `admin`.
 * No password strength rules; any password string is accepted when credentials match.
 */
(function () {
  const ADMIN_SESSION_KEY = "csmss_canteen_admin_ok";
  const ADMIN_ID_KEY = "csmss_canteen_admin_identifier";

  function isDemoAdmin(identifier, password) {
    const id = String(identifier || "").trim().toLowerCase();
    const pass = String(password || "");
    // Primary demo pair (identifier may be typed as email/phone label suggests).
    if (id === "admin" && pass === "admin") return true;
    // Optional fixed account for demos / screenshots.
    if (id === "canteen@canteen.local" && pass === "canteen123") return true;
    return false;
  }

  function setError(msg) {
    const el = document.getElementById("admin-login-error");
    if (!el) return;
    if (!msg) {
      el.textContent = "";
      el.classList.add("is-hidden");
      return;
    }
    el.textContent = msg;
    el.classList.remove("is-hidden");
  }

  document.addEventListener("DOMContentLoaded", () => {
    try {
      if (sessionStorage.getItem(ADMIN_SESSION_KEY) === "1") {
        window.location.replace("canteen-dashboard.html");
        return;
      }
    } catch {
      // ignore
    }

    const form = document.getElementById("admin-login-form");
    const idEl = document.getElementById("admin-identifier");
    const passEl = document.getElementById("admin-password");

    if (!form || !idEl || !passEl) return;

    form.addEventListener("submit", (e) => {
      e.preventDefault();
      setError("");
      const identifier = String(idEl.value || "").trim();
      const password = String(passEl.value || "");

      if (!identifier) {
        setError("Enter email or phone number.");
        return;
      }
      if (!password) {
        setError("Password is required.");
        return;
      }

      if (!isDemoAdmin(identifier, password)) {
        setError("Invalid admin credentials.");
        return;
      }

      try {
        sessionStorage.setItem(ADMIN_SESSION_KEY, "1");
        sessionStorage.setItem(ADMIN_ID_KEY, identifier);
      } catch (err) {
        console.error(err);
        setError("Could not save session. Check browser storage settings.");
        return;
      }

      window.location.href = "canteen-dashboard.html";
    });
  });
})();
