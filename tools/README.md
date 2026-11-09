# LC Tools section

The Tools and Support pages live in this folder, inside the LilcrashLive site:

| File | What it is |
|---|---|
| `tools/index.html` | Tools page: every LC app, its description, download button and the live download counter |
| `tools/support.html` | Support / donation page |
| `tools/assets/config.js` | **The only file you normally edit.** Tools, descriptions, donation links |
| `tools/assets/tools.js` | Builds the cards, fetches GitHub Releases, runs the counter |
| `tools/assets/tools.css` | Styles for these pages (built on `css/style.css`) |

## How downloads and the counter work

- The pages call the public GitHub API (`/repos/Lilcrash15/<repo>/releases`) from the visitor's browser.
- **Download buttons** point straight at the newest release's installer
  (e.g. `.../releases/download/v0.4.5/LCClips-Setup-0.4.5.exe`). Publish a new release and the button updates by itself.
- **The counter** adds up `download_count` for every installer across every release. Files like `LCClips-build.json`
  (the updater's metadata) are skipped so update checks don't inflate the number.
- It refreshes every 5 minutes while the page is open and caches the result in the browser.
  GitHub allows 60 un-authenticated API calls per hour per visitor; one page load costs 2.
  If a visitor hits the limit, the page shows the last cached numbers and the buttons still work.
- Counts are GitHub's own numbers: every download of a release file, whether it came from this site, GitHub,
  or the apps' built-in updater.

## Adding a tool / shipping LCAI

1. Create the repo (e.g. `Lilcrash15/LCAI`) and publish a release with the `.exe` attached.
2. In `config.js`, set that tool's `repo: "LCAI"` and `status: "available"`, and add an `assetMatch` and a feature list.

That's it. For a brand-new tool, copy one of the entries in `tools: [...]`.

LCEdit is marked `status: "bundled"` because the LC Editor ships inside LCClips. If LCEdit ever gets its own
repo and installer, change it to `repo: "LCEdit"` and `status: "available"`.

## Donations: recommended setup

**Use Ko-fi as the main button, and keep Streamlabs for on-stream tips.**

- **Ko-fi** takes 0% of one-time donations (you only pay the PayPal or Stripe processing fee),
  supports monthly memberships, needs no approval and takes about 10 minutes to set up.
  Donors don't need an account. It's the usual choice for free indie software.
- **GitHub Sponsors** has 0% fees on personal accounts and adds a ❤ Sponsor button to every repo.
  It needs a Stripe Connect payout setup and approval, so it's a good second option.
- **Streamlabs** is already live and wired into LCBot's support popup, so it stays as is.
- Patreon takes 8–12% and suits content subscriptions more than one-off app support. Not recommended here.

To turn them on, paste the URLs into `support.options` in `config.js`:

```js
{ id: "kofi",   url: "https://ko-fi.com/YOUR_NAME", ... },
{ id: "github", url: "https://github.com/sponsors/Lilcrash15", ... },
```

Optional extra: add `.github/FUNDING.yml` to the LCClips and LCBot repos so GitHub shows a Sponsor button:

```yaml
ko_fi: YOUR_NAME
github: Lilcrash15
custom: ["https://lilcrash.com/tools/support.html"]
```

## Domain: lilcrash.com

GitHub Pages gives each repo **one** custom domain. The simplest setup that keeps everything combined is:

- `lilcrash.com` → this repo (stream site), with the tools at **`lilcrash.com/tools/`**
- `www.lilcrash.com` → redirects to it automatically

### 1. DNS (at your domain registrar)

| Type | Name | Value |
|---|---|---|
| A | `@` | `185.199.108.153` |
| A | `@` | `185.199.109.153` |
| A | `@` | `185.199.110.153` |
| A | `@` | `185.199.111.153` |
| AAAA | `@` | `2606:50c0:8000::153` |
| AAAA | `@` | `2606:50c0:8001::153` |
| AAAA | `@` | `2606:50c0:8002::153` |
| AAAA | `@` | `2606:50c0:8003::153` |
| CNAME | `www` | `lilcrash15.github.io` |

Remove any registrar "parking" or forwarding records for `@` and `www` first.

### 2. GitHub

1. Profile → **Settings → Pages → Add a verified domain** → `lilcrash.com`. This stops anyone else from claiming it.
2. LilcrashLive repo → **Settings → Pages → Custom domain** → `lilcrash.com` → Save. GitHub adds the `CNAME` file itself.
3. After the DNS check passes (minutes to a few hours), tick **Enforce HTTPS**.

Don't add the `CNAME` file before DNS is set up. GitHub would start redirecting the github.io address to a domain that doesn't work yet.

### 3. Things that care about the domain

- **Twitch embeds**: `lilcrash.com` and `www.lilcrash.com` are already added to the `parent` lists in `index.html` and `clips.html`.
- **Twitch login**: in dev.twitch.tv/console/apps, add `https://lilcrash.com/auth-callback.html` as an OAuth Redirect URL.
- **Discord login worker**: if it checks allowed origins or return URLs, add `https://lilcrash.com`.

### Want a separate tools subdomain instead?

- **`tools.lilcrash.com`**: works, but it needs its own repo (one custom domain per repo).
  Copy `tools/` plus `css/style.css`, `js/site.js` and `images/logo.png` into a new repo, fix the `../` paths,
  turn on Pages, and add a DNS `CNAME tools → lilcrash15.github.io`.
- **`lctools.dev`**: this is a different domain, not a subdomain of lilcrash.com. You'd have to buy it
  (`.dev` costs about $12–15 a year and forces HTTPS, which Pages handles). It could point at that same separate repo.
