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
  twitchClientId: "",

  // Your deployed Cloudflare Worker's base URL (no trailing slash), e.g.
  //   https://lilcrash-discord-auth.yoursubdomain.workers.dev
  // See cloudflare-worker/README.md for setup.
  discordAuthWorkerUrl: ""
};
