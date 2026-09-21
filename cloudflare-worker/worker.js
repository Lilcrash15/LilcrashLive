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
//   ALLOWED_RETURN_ORIGIN — your site's origin, e.g. "https://lilcrash15.club"
//
// Discord app setup (discord.com/developers/applications → your app → OAuth2):
//   Add a redirect: https://<your-worker-subdomain>.workers.dev/callback

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/login") {
      const state = url.searchParams.get("state") || "";
      const returnOrigin = url.searchParams.get("return_origin") || "";

      if (returnOrigin !== env.ALLOWED_RETURN_ORIGIN) {
        return new Response("Origin not allowed", { status: 400 });
      }

      const redirectUri = `${url.origin}/callback`;
      const authorizeUrl = new URL("https://discord.com/oauth2/authorize");
      authorizeUrl.searchParams.set("client_id", env.DISCORD_CLIENT_ID);
      authorizeUrl.searchParams.set("redirect_uri", redirectUri);
      authorizeUrl.searchParams.set("response_type", "code");
      authorizeUrl.searchParams.set("scope", "identify");
      // Carry the return origin through Discord's redirect alongside our CSRF state.
      authorizeUrl.searchParams.set("state", `${state}.${btoa(returnOrigin)}`);

      return Response.redirect(authorizeUrl.toString(), 302);
    }

    if (url.pathname === "/callback") {
      const code = url.searchParams.get("code");
      const rawState = url.searchParams.get("state") || "";
      const dotIndex = rawState.indexOf(".");
      const state = dotIndex === -1 ? rawState : rawState.slice(0, dotIndex);
      const encodedOrigin = dotIndex === -1 ? "" : rawState.slice(dotIndex + 1);

      let returnOrigin;
      try {
        returnOrigin = atob(encodedOrigin);
      } catch (e) {
        return new Response("Bad state", { status: 400 });
      }
      if (returnOrigin !== env.ALLOWED_RETURN_ORIGIN) {
        return new Response("Origin not allowed", { status: 400 });
      }
      if (!code) {
        return Response.redirect(
          `${returnOrigin}/auth-callback.html?provider=discord&state=${encodeURIComponent(state)}`,
          302
        );
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
        return Response.redirect(
          `${returnOrigin}/auth-callback.html?provider=discord&state=${encodeURIComponent(state)}`,
          302
        );
      }

      const tokenData = await tokenResp.json();
      const userResp = await fetch("https://discord.com/api/users/@me", {
        headers: { Authorization: `Bearer ${tokenData.access_token}` }
      });
      const user = await userResp.json();

      const avatar = user.avatar
        ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png?size=64`
        : `https://cdn.discordapp.com/embed/avatars/${Number(user.discriminator || 0) % 5}.png`;

      const dest = new URL(`${returnOrigin}/auth-callback.html`);
      dest.searchParams.set("provider", "discord");
      dest.searchParams.set("username", user.username || "Discord user");
      dest.searchParams.set("avatar", avatar);
      dest.searchParams.set("state", state);

      return Response.redirect(dest.toString(), 302);
    }

    return new Response("Not found", { status: 404 });
  }
};
