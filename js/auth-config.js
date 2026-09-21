// Lilcrash15 — login configuration
//
// Fill these in once you've registered the apps (see cloudflare-worker/README.md
// for the full walkthrough). Nothing secret goes in this file — it's public,
// client-side config only.

window.LILCRASH_AUTH_CONFIG = {
  // Twitch Developer Console (dev.twitch.tv/console/apps) → your app's Client ID.
  // OAuth Redirect URL registered there must be wherever auth-callback.html
  // actually loads, subfolder included, e.g.:
  //   https://lilcrash15.github.io/LilcrashLive/auth-callback.html
  // Not set up yet — Twitch login will show a friendly "not configured" alert
  // until you register an app and fill this in.
  twitchClientId: "",

  // Discord login's Cloudflare Worker — live.
  discordAuthWorkerUrl: "https://lilcrash-discord-auth.lilcrash19.workers.dev"
};
