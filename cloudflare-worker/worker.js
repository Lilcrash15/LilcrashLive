// Lilcrash15 — Discord login helper (Cloudflare Worker)
//
// Discord's OAuth requires a client secret to exchange the authorization code
// for a token, so that one step has to happen server-side. This worker does
// only that: it sends the visitor to Discord, exchanges the code Discord
// hands back, looks up their username/avatar, and redirects the browser back
// to the site with just that public info — the Discord access token itself
// never reaches the browser.
//
// Routes:
//   GET /login    — starts the flow (site links here)
//   GET /callback — Discord redirects here after the visitor approves
//
// Required secrets (set with `wrangler secret put <NAME>`, or in the
// Cloudflare dashboard under Settings → Variables):
//   DISCORD_CLIENT_ID
//   DISCORD_CLIENT_SECRET
//
// Required var (wrangler.toml [vars], or the dashboard):
//   ALLOWED_RETURN_ORIGIN — your site's origin ONLY (scheme + host, no path,
//   no trailing slash), e.g. "https://lilcrash15.club" or
//   "https://lilcrash15.github.io" — NOT the full page URL. The site's own
//   pages can live at any path under that origin (e.g. a GitHub Pages
//   project site under /LilcrashLive/) — the browser sends us the exact
//   auth-callback.html URL to return to, and we just check that its origin
//   matches this allowlist before trusting it.
//
// Discord app setup (discord.com/developers/applications → your app → OAuth2):
//   Add a redirect: https://<your-worker-subdomain>.workers.dev/callback

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/login") {
      const state = url.searchParams.get("state") || "";
      const returnUrlRaw = url.searchParams.get("return_url") || "";

      let returnUrl;
      try {
        returnUrl = new URL(returnUrlRaw);
      } catch (e) {
        return new Response("Bad return_url", { status: 400 });
      }
      if (returnUrl.origin !== env.ALLOWED_RETURN_ORIGIN) {
        return new Response("Origin not allowed", { status: 400 });
      }

      const redirectUri = `${url.origin}/callback`;
      const authorizeUrl = new URL("https://discord.com/oauth2/authorize");
      authorizeUrl.searchParams.set("client_id", env.DISCORD_CLIENT_ID);
      authorizeUrl.searchParams.set("redirect_uri", redirectUri);
      authorizeUrl.searchParams.set("response_type", "code");
      authorizeUrl.searchParams.set("scope", "identify");
      // Carry the full return URL (path and all) through Discord's redirect
      // alongside our CSRF state. Base64 has no "." in its alphabet, so
      // splitting on the first "." on the way back is always unambiguous.
      authorizeUrl.searchParams.set("state", `${state}.${btoa(returnUrlRaw)}`);

      return Response.redirect(authorizeUrl.toString(), 302);
    }

    if (url.pathname === "/callback") {
      const code = url.searchParams.get("code");
      const rawState = url.searchParams.get("state") || "";
      const dotIndex = rawState.indexOf(".");
      const state = dotIndex === -1 ? rawState : rawState.slice(0, dotIndex);
      const encodedReturnUrl = dotIndex === -1 ? "" : rawState.slice(dotIndex + 1);

      let returnUrl;
      try {
        returnUrl = new URL(atob(encodedReturnUrl));
      } catch (e) {
        return new Response("Bad state", { status: 400 });
      }
      if (returnUrl.origin !== env.ALLOWED_RETURN_ORIGIN) {
        return new Response("Origin not allowed", { status: 400 });
      }

      function bounceBack(extraParams) {
        const dest = new URL(returnUrl.toString());
        dest.search = ""; // auth-callback.html shouldn't carry its own query string forward
        Object.entries(extraParams).forEach(([k, v]) => dest.searchParams.set(k, v));
        return Response.redirect(dest.toString(), 302);
      }

      if (!code) {
        return bounceBack({ provider: "discord", state });
      }

      const redirectUri = `${url.origin}/callback`;
      const tokenResp = await fetch("https://discord.com/api/oauth2/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          client_id: env.DISCORD_CLIENT_ID,
          client_secret: env.DISCORD_CLIENT_SECRET,
          grant_type: "authorization_code",
          code,
          redirect_uri: redirectUri
        })
      });

      if (!tokenResp.ok) {
        return bounceBack({ provider: "discord", state });
      }

      const tokenData = await tokenResp.json();
      const userResp = await fetch("https://discord.com/api/users/@me", {
        headers: { Authorization: `Bearer ${tokenData.access_token}` }
      });
      const user = await userResp.json();

      const avatar = user.avatar
        ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png?size=64`
        : `https://cdn.discordapp.com/embed/avatars/${Number(user.discriminator || 0) % 5}.png`;

      return bounceBack({
        provider: "discord",
        username: user.username || "Discord user",
        avatar: avatar,
        state: state
      });
    }

    return new Response("Not found", { status: 404 });
  }
};
