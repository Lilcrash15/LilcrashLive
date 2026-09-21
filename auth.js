// Lilcrash15 — site login (Twitch implicit grant + Discord via a Cloudflare Worker)
//
// This is a DECORATIVE, site-only login: it lets a visitor sign in so the site
// can greet them by name. It does NOT and cannot log the visitor into the
// embedded Twitch video/chat player — that's controlled entirely by Twitch's
// own session in the visitor's browser, and cross-origin security rules mean
// no third-party site can hand it a token on the visitor's behalf. If a
// visitor is already logged into twitch.tv in that browser, the embed will
// show them as logged in automatically, independent of anything here.

(function () {
  var CONFIG = window.LILCRASH_AUTH_CONFIG || {};
  var STORAGE_KEY = "lilcrash_auth";
  var STATE_KEY = "lilcrash_oauth_state";
  var RETURN_KEY = "lilcrash_return_path";

  function randomState() {
    var arr = new Uint8Array(16);
    crypto.getRandomValues(arr);
    return Array.from(arr, function (b) {
      return b.toString(16).padStart(2, "0");
    }).join("");
  }

  // The login itself lives in localStorage (survives closing the tab/browser)
  // — only the short-lived CSRF state and return-path values below stay in
  // sessionStorage, since those only need to survive a single redirect trip.
  function saveSession(session) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  }

  function loadSession() {
    var raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    try {
      var session = JSON.parse(raw);
      if (session.expiresAt && Date.now() > session.expiresAt) {
        localStorage.removeItem(STORAGE_KEY);
        return null;
      }
      return session;
    } catch (e) {
      return null;
    }
  }

  function clearSession() {
    localStorage.removeItem(STORAGE_KEY);
  }

  function startTwitchLogin() {
    if (!CONFIG.twitchClientId) {
      alert("Twitch login isn't configured yet — add a Client ID to js/auth-config.js.");
      return;
    }
    var state = randomState();
    sessionStorage.setItem(STATE_KEY, state);
    sessionStorage.setItem(RETURN_KEY, window.location.pathname);

    var redirectUri = new URL("auth-callback.html", window.location.href).toString();
    var url =
      "https://id.twitch.tv/oauth2/authorize" +
      "?client_id=" + encodeURIComponent(CONFIG.twitchClientId) +
      "&redirect_uri=" + encodeURIComponent(redirectUri) +
      "&response_type=token" +
      "&scope=" +
      "&state=" + encodeURIComponent(state);

    window.location.href = url;
  }

  function startDiscordLogin() {
    if (!CONFIG.discordAuthWorkerUrl) {
      alert("Discord login isn't configured yet — add your Worker URL to js/auth-config.js.");
      return;
    }
    var state = randomState();
    sessionStorage.setItem(STATE_KEY, state);
    sessionStorage.setItem(RETURN_KEY, window.location.pathname);

    // The full URL of this site's callback page, wherever it actually lives
    // (root domain, or a subfolder like a GitHub Pages project site) — the
    // Worker uses this exact URL to send the browser back, it only checks
    // that the origin matches what it's configured to trust.
    var callbackUrl = new URL("auth-callback.html", window.location.href).toString();

    var url =
      CONFIG.discordAuthWorkerUrl.replace(/\/$/, "") + "/login" +
      "?state=" + encodeURIComponent(state) +
      "&return_url=" + encodeURIComponent(callbackUrl);

    window.location.href = url;
  }

  function logout() {
    clearSession();
    renderWidget();
  }

  function escapeHtml(str) {
    var div = document.createElement("div");
    div.textContent = str == null ? "" : str;
    return div.innerHTML;
  }

  function renderWidget() {
    var widgets = document.querySelectorAll(".account-widget");
    if (!widgets.length) return;
    var session = loadSession();

    widgets.forEach(function (widget) {
      if (session) {
        widget.innerHTML =
          '<div class="account-chip">' +
          (session.avatar ? '<img class="account-avatar" src="' + escapeHtml(session.avatar) + '" alt="">' : "") +
          '<span class="account-name">' + escapeHtml(session.username) + "</span>" +
          '<button type="button" class="account-logout">Log out</button>' +
          "</div>";
        widget.querySelector(".account-logout").addEventListener("click", logout);
      } else {
        widget.innerHTML =
          '<div class="account-actions">' +
          '<button type="button" class="btn-mini btn-mini-twitch" data-login="twitch">Twitch</button>' +
          '<button type="button" class="btn-mini btn-mini-discord" data-login="discord">Discord</button>' +
          "</div>";
        widget.querySelectorAll("[data-login]").forEach(function (btn) {
          btn.addEventListener("click", function () {
            if (btn.dataset.login === "twitch") startTwitchLogin();
            else startDiscordLogin();
          });
        });
      }
    });
  }

  window.LilcrashAuth = {
    renderWidget: renderWidget,
    loadSession: loadSession,
    saveSession: saveSession,
    clearSession: clearSession,
    consumeState: function () {
      var expected = sessionStorage.getItem(STATE_KEY);
      sessionStorage.removeItem(STATE_KEY);
      return expected;
    },
    consumeReturnPath: function () {
      var path = sessionStorage.getItem(RETURN_KEY) || "index.html";
      sessionStorage.removeItem(RETURN_KEY);
      return path;
    }
  };

  document.addEventListener("DOMContentLoaded", renderWidget);
})();
