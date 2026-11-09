// LC Tools — renders the tool cards, download buttons, live download counter
// and the Support page, all from window.LC_TOOLS_CONFIG (config.js).
(function () {
  "use strict";

  var CFG = window.LC_TOOLS_CONFIG;
  if (!CFG) return;

  var API = "https://api.github.com";
  var CACHE_KEY = "lctools-releases-v1";
  var CACHE_FRESH_MS = Math.max(60 * 1000, (CFG.refreshMs || 300000) - 15000);

  // ---------- small helpers ----------------------------------------------

  function el(tag, attrs, children) {
    var node = document.createElement(tag);
    if (attrs) {
      Object.keys(attrs).forEach(function (k) {
        var v = attrs[k];
        if (v == null || v === false) return;
        if (k === "class") node.className = v;
        else if (k === "text") node.textContent = v;
        else node.setAttribute(k, v === true ? "" : v);
      });
    }
    (children || []).forEach(function (c) {
      if (c == null) return;
      node.appendChild(typeof c === "string" ? document.createTextNode(c) : c);
    });
    return node;
  }

  function fmtNumber(n) {
    return Number(n || 0).toLocaleString("en-US");
  }

  function fmtSize(bytes) {
    if (!bytes) return "";
    var mb = bytes / (1024 * 1024);
    return mb >= 1 ? mb.toFixed(mb >= 100 ? 0 : 1) + " MB" : Math.round(bytes / 1024) + " KB";
  }

  function fmtDate(iso) {
    if (!iso) return "";
    var d = new Date(iso);
    return d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
  }

  function timeAgo(ms) {
    var s = Math.round((Date.now() - ms) / 1000);
    if (s < 45) return "just now";
    var m = Math.round(s / 60);
    if (m < 60) return m + " min ago";
    var h = Math.round(m / 60);
    return h + " hr ago";
  }

  function isIgnored(name) {
    return (CFG.ignoreAssets || []).some(function (re) { return re.test(name); });
  }

  function repoUrl(repo) {
    return "https://github.com/" + CFG.githubOwner + "/" + repo;
  }

  function readCache() {
    try {
      var raw = localStorage.getItem(CACHE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) { return null; }
  }

  function writeCache(data) {
    try { localStorage.setItem(CACHE_KEY, JSON.stringify(data)); } catch (e) { /* private mode */ }
  }

  // Animated count-up that respects reduced motion.
  var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  function countTo(node, target) {
    var from = Number(node.getAttribute("data-value") || 0);
    node.setAttribute("data-value", target);
    if (reduceMotion || from === target) { node.textContent = fmtNumber(target); return; }
    var start = performance.now();
    var dur = Math.min(1400, 400 + Math.abs(target - from) * 8);
    function step(now) {
      var t = Math.min(1, (now - start) / dur);
      var eased = 1 - Math.pow(1 - t, 3);
      node.textContent = fmtNumber(Math.round(from + (target - from) * eased));
      if (t < 1) requestAnimationFrame(step);
      else if (from !== 0) {
        node.classList.remove("is-bumped");
        void node.offsetWidth;
        node.classList.add("is-bumped");
      }
    }
    requestAnimationFrame(step);
  }

  // ---------- GitHub data --------------------------------------------------

  // Summarise one repo's releases into what the page needs.
  function summarise(tool, releases) {
    var total = 0;
    var latest = null;
    releases.forEach(function (rel) {
      (rel.assets || []).forEach(function (a) {
        if (!isIgnored(a.name)) total += a.download_count || 0;
      });
      if (!latest && !rel.draft && !rel.prerelease) latest = rel;
    });
    latest = latest || releases[0] || null;

    var asset = null;
    if (latest) {
      var files = (latest.assets || []).filter(function (a) { return !isIgnored(a.name); });
      asset = files.filter(function (a) { return tool.assetMatch && tool.assetMatch.test(a.name); })[0] || files[0] || null;
    }
    return {
      total: total,
      releaseCount: releases.length,
      version: latest ? latest.tag_name : null,
      published: latest ? latest.published_at : null,
      releaseUrl: latest ? latest.html_url : repoUrl(tool.repo) + "/releases",
      asset: asset ? { name: asset.name, url: asset.browser_download_url, size: asset.size } : null
    };
  }

  function fetchRepo(tool) {
    var url = API + "/repos/" + CFG.githubOwner + "/" + tool.repo + "/releases?per_page=100";
    return fetch(url, { headers: { Accept: "application/vnd.github+json" } }).then(function (res) {
      if (!res.ok) {
        var err = new Error("GitHub " + res.status);
        err.status = res.status;
        throw err;
      }
      return res.json();
    }).then(function (releases) { return summarise(tool, releases); });
  }

  // Tools that own a repo (bundled tools reuse their parent's data).
  function repoTools() {
    return CFG.tools.filter(function (t) { return t.repo && t.status === "available"; });
  }

  function loadAll(force) {
    var cache = readCache();
    if (!force && cache && Date.now() - cache.at < CACHE_FRESH_MS) {
      return Promise.resolve({ data: cache.data, at: cache.at, stale: false });
    }
    var tools = repoTools();
    return Promise.all(tools.map(function (t) {
      return fetchRepo(t).then(function (s) { return [t.id, s]; }, function (e) { return [t.id, null, e]; });
    })).then(function (results) {
      var data = {};
      var failed = false;
      results.forEach(function (r) {
        if (r[1]) data[r[0]] = r[1];
        else {
          failed = true;
          if (cache && cache.data[r[0]]) data[r[0]] = cache.data[r[0]];
        }
      });
      if (!failed) {
        var at = Date.now();
        writeCache({ at: at, data: data });
        return { data: data, at: at, stale: false };
      }
      return { data: data, at: cache ? cache.at : null, stale: true };
    });
  }

  // ---------- Tools page ---------------------------------------------------

  var DOWNLOAD_ICON = '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v12"/><path d="m7 10 5 5 5-5"/><path d="M5 21h14"/></svg>';

  function toolById(id) {
    return CFG.tools.filter(function (t) { return t.id === id; })[0];
  }

  function buildCard(tool) {
    var statusLabel = { available: "Available", bundled: "Included with LCClips", "coming-soon": "Coming soon" }[tool.status];

    var head = el("div", { class: "tool-head" }, [
      el("div", { class: "tool-mark", "aria-hidden": "true" }, [
        el("small", { text: "LC" }),
        el("span", { text: tool.name.replace(/^LC/, "").charAt(0) })
      ]),
      el("div", { class: "tool-title" }, [
        el("h2", { text: tool.name }),
        el("span", { class: "tool-status status-" + tool.status, text: statusLabel })
      ])
    ]);

    var body = el("div", { class: "tool-body" }, [
      el("p", { class: "tool-tagline", text: tool.tagline }),
      el("p", { text: tool.about })
    ]);
    if (tool.features && tool.features.length) {
      body.appendChild(el("ul", { class: "tool-features" }, tool.features.map(function (f) {
        return el("li", { text: f });
      })));
    }

    var stats = el("div", { class: "tool-stats" });
    var actions = el("div", { class: "tool-actions" });

    if (tool.status === "available") {
      stats.appendChild(el("div", { class: "tool-stat" }, [
        el("span", { class: "tool-stat-value", "data-count": tool.id, text: "—" }),
        el("span", { class: "tool-stat-label", text: "downloads" })
      ]));
      stats.appendChild(el("div", { class: "tool-stat" }, [
        el("span", { class: "tool-stat-value small", "data-version": tool.id, text: "—" }),
        el("span", { class: "tool-stat-label", "data-date": tool.id, text: "latest release" })
      ]));

      var dl = el("a", { class: "btn btn-ember btn-download", href: repoUrl(tool.repo) + "/releases/latest", "data-download": tool.id });
      dl.innerHTML = DOWNLOAD_ICON;
      dl.appendChild(el("span", { "data-download-label": tool.id, text: "Download " + tool.name }));
      actions.appendChild(dl);
      actions.appendChild(el("a", { class: "btn btn-outline", href: repoUrl(tool.repo), target: "_blank", rel: "noopener", text: "View on GitHub" }));
      actions.appendChild(el("p", { class: "tool-meta", "data-meta": tool.id }, [tool.platform]));
    } else if (tool.status === "bundled") {
      var parent = toolById(tool.bundledWith);
      var link = el("a", { class: "btn btn-ember btn-download", href: "#" + parent.id, "data-download": parent.id });
      link.innerHTML = DOWNLOAD_ICON;
      link.appendChild(el("span", { text: "Get it with " + parent.name }));
      actions.appendChild(link);
      actions.appendChild(el("p", { class: "tool-meta" }, [tool.platform + ". Install LCClips and LCEdit is already there."]));
    } else {
      actions.appendChild(el("span", { class: "btn btn-outline is-disabled", "aria-disabled": "true", text: "Not released yet" }));
      if (tool.repo) {
        actions.appendChild(el("a", { class: "btn btn-outline", href: repoUrl(tool.repo), target: "_blank", rel: "noopener", text: "Follow on GitHub" }));
      }
    }

    return el("article", { class: "tool-card tool-" + tool.status, id: tool.id }, [head, body, stats.childNodes.length ? stats : null, actions]);
  }

  function applyData(result) {
    var data = result.data;
    var grand = 0;
    var haveAny = false;

    repoTools().forEach(function (tool) {
      var s = data[tool.id];
      if (!s) return;
      haveAny = true;
      grand += s.total;

      document.querySelectorAll('[data-count="' + tool.id + '"]').forEach(function (n) { countTo(n, s.total); });
      document.querySelectorAll('[data-version="' + tool.id + '"]').forEach(function (n) { n.textContent = s.version || "—"; });
      document.querySelectorAll('[data-date="' + tool.id + '"]').forEach(function (n) {
        n.textContent = s.published ? "released " + fmtDate(s.published) : "latest release";
      });

      // Point the main button straight at the installer file when we know it.
      if (s.asset) {
        document.querySelectorAll('a[data-download="' + tool.id + '"]').forEach(function (a) {
          if (a.getAttribute("href").charAt(0) === "#") return; // bundled card keeps its in-page link
          a.href = s.asset.url;
          a.setAttribute("download", "");
        });
        document.querySelectorAll('[data-download-label="' + tool.id + '"]').forEach(function (n) {
          n.textContent = "Download " + tool.name + (s.version ? " " + s.version : "");
        });
      }
      document.querySelectorAll('[data-meta="' + tool.id + '"]').forEach(function (n) {
        n.textContent = "";
        n.appendChild(document.createTextNode(tool.platform));
        if (s.asset) {
          n.appendChild(document.createTextNode(" · " + s.asset.name + (s.asset.size ? " (" + fmtSize(s.asset.size) + ")" : "")));
        }
        n.appendChild(document.createTextNode(" · "));
        n.appendChild(el("a", { href: s.releaseUrl, target: "_blank", rel: "noopener", text: "release notes" }));
      });
    });

    var total = document.getElementById("total-downloads");
    if (total && haveAny) countTo(total, grand);

    var status = document.getElementById("counter-status");
    if (status) {
      status.classList.toggle("is-stale", !!result.stale);
      if (!haveAny) {
        status.textContent = "Couldn't reach GitHub right now. Download links still work.";
      } else if (result.stale) {
        status.textContent = result.at
          ? "GitHub is rate-limiting this browser. Showing counts from " + timeAgo(result.at) + "."
          : "GitHub is rate-limiting this browser, so some counts may be missing. Download links still work.";
      } else {
        status.setAttribute("data-at", result.at);
        status.textContent = "Live from GitHub Releases · updated " + timeAgo(result.at);
      }
    }
  }

  function initToolsPage() {
    var grid = document.getElementById("tool-grid");
    if (!grid) return;
    CFG.tools.forEach(function (t) { grid.appendChild(buildCard(t)); });

    var cache = readCache();
    if (cache) applyData({ data: cache.data, at: cache.at, stale: false });

    function refresh(force) {
      loadAll(force).then(applyData).catch(function () {
        applyData({ data: {}, at: null, stale: true });
      });
    }
    refresh(false);

    // "Live": keep polling while the tab is visible.
    setInterval(function () {
      if (document.visibilityState === "visible") refresh(true);
    }, CFG.refreshMs || 300000);

    // Keep the "updated x min ago" text honest between refreshes.
    setInterval(function () {
      var status = document.getElementById("counter-status");
      var at = status && Number(status.getAttribute("data-at"));
      if (at && !status.classList.contains("is-stale")) {
        status.textContent = "Live from GitHub Releases · updated " + timeAgo(at);
      }
    }, 30000);
  }

  // ---------- Support page -------------------------------------------------

  function initSupportPage() {
    var list = document.getElementById("support-options");
    if (!list) return;
    var opts = (CFG.support.options || []).filter(function (o) { return o.url; });

    opts.forEach(function (o) {
      list.appendChild(el("article", { class: "support-card" + (o.recommended ? " is-recommended" : "") }, [
        o.recommended ? el("span", { class: "support-badge", text: "Recommended" }) : null,
        el("h2", { text: o.name }),
        el("p", { text: o.blurb }),
        el("a", { class: "btn " + (o.recommended ? "btn-ember" : "btn-outline"), href: o.url, target: "_blank", rel: "noopener", text: o.cta })
      ]));
    });

    var goals = document.getElementById("support-goals");
    if (goals) {
      (CFG.support.goals || []).forEach(function (g) { goals.appendChild(el("li", { text: g })); });
    }
  }

  // ---------- footer year --------------------------------------------------

  document.addEventListener("DOMContentLoaded", function () {
    initToolsPage();
    initSupportPage();
    document.querySelectorAll("[data-year]").forEach(function (n) { n.textContent = new Date().getFullYear(); });
  });
})();
