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
  twitchClientId: "wn08s3m126fopegxk1dpycoam4xv4v",

  // Discord login's Cloudflare Worker — live.
  discordAuthWorkerUrl: "https://lilcrash-discord-auth.lilcrash19.workers.dev"
};
