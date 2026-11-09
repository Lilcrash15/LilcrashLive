// LC Tools — site configuration
//
// This is the ONLY file you need to edit to add a new tool, change a
// description, or turn on a donation option. Everything on the Tools and
// Support pages is built from this file.
//
// Downloads + the live counter come straight from each repo's GitHub
// Releases. Publish a release with an .exe attached and the site picks it up
// automatically — no site update needed.

window.LC_TOOLS_CONFIG = {
  githubOwner: "Lilcrash15",

  // How often (ms) the counter re-checks GitHub while the page is open.
  // GitHub allows 60 un-authenticated API calls per hour per visitor, and
  // each refresh costs one call per tool, so keep this at 5 min or more.
  refreshMs: 5 * 60 * 1000,

  // Release files that are NOT user downloads (updater metadata, checksums).
  // They're hidden from the download button and left out of the counter.
  ignoreAssets: [/\.json$/i, /\.sha256$/i, /\.sig$/i, /\.blockmap$/i],

  tools: [
    {
      id: "lcclips",
      page: "lcclips.html",           // the tool's own page (for search engines)
      name: "LCClips",
      repo: "LCClips",
      status: "available",          // "available" | "bundled" | "coming-soon"
      platform: "Windows 10 / 11 · 64-bit",
      tagline: "Instant-replay clipping that stays out of your game's way.",
      about:
        "LCClips keeps the last few seconds of your screen, game audio and mic in a " +
        "rolling buffer. Press a hotkey and that moment is saved as an MP4, like " +
        "ShadowPlay Instant Replay or Medal, but lightweight and with no account needed. " +
        "Capture and encoding run on your GPU, so the hit to your game's frame rate is tiny.",
      features: [
        "Hotkey save (default Alt+F10), works from a Stream Deck too",
        "GPU capture + encoding: NVENC, AMF or QuickSync, picked for you",
        "Game audio + mic, mixed with a sync-offset control",
        "Optional share links that play inline in Discord and X, on your own free Cloudflare account",
        "Built-in LC Editor for trimming clips",
        "Updates itself from GitHub releases"
      ],
      // Preferred file when a release has more than one download.
      assetMatch: /Setup.*\.exe$/i
    },
    {
      id: "lcbot",
      page: "lcbot.html",           // the tool's own page (for search engines)
      name: "LCBot",
      repo: "LCBot",
      status: "available",
      platform: "Windows 10 / 11 · 64-bit",
      tagline: "A self-hosted Twitch chat bot in the spirit of the original AnkhBot.",
      about:
        "LCBot runs on your own PC as a desktop app: no subscription, no cloud account. " +
        "Your points, commands and quotes stay in a local file next to the app. It covers " +
        "everything a streamer needs from a chat bot, all editable from the app.",
      features: [
        "Custom commands with variables, permissions and cooldowns",
        "Points system with !gamble, !slots, !roulette, !heist and boss fights",
        "Moderation filters with escalating timeouts and !permit",
        "Song requests with an OBS browser-source overlay",
        "Timers, quotes, follower / sub / raid alerts",
        "Discord \"went live\" announcements and built-in backup & restore"
      ],
      assetMatch: /\.exe$/i
    },
    {
      id: "lcedit",
      page: "lcedit.html",           // the tool's own page (for search engines)
      name: "LCEdit",
      repo: "LCClips",              // ships inside LCClips
      status: "bundled",
      bundledWith: "lcclips",
      platform: "Included with LCClips",
      tagline: "A quick, frame-accurate video cutter for your clips.",
      about:
        "LCEdit (the LC Editor) trims and joins clips without opening a full video editor. " +
        "Mark the parts you want, then save. It comes with LCClips: select a clip and press " +
        "✂ Edit in LC Editor, or use File → Open LC Editor.",
      features: [
        "Mark In / Out with I and O, or drag the handles",
        "Add several parts with A; they're joined in order",
        "Fast mode: lossless and near-instant",
        "Precise mode: frame-exact cuts, re-encoded on your GPU",
        "Saved cuts appear in your LCClips library right away"
      ]
    },
  ],

  // ---------------------------------------------------------------------
  // Support / donations
  //
  // Leave a url as "" to hide that option. Ko-fi is the recommended main
  // option: see tools/README.md for why and how to set it up.
  // ---------------------------------------------------------------------
  support: {
    options: [
      {
        id: "kofi",
        name: "Ko-fi",
        url: "https://ko-fi.com/lilcrash15",
        recommended: true,
        blurb: "One-time or monthly. Ko-fi takes 0% of one-time donations; you only pay the PayPal or Stripe processing fee. Cards, PayPal, Apple Pay and Google Pay all work.",
        cta: "Support on Ko-fi"
      },
      {
        id: "github",
        name: "GitHub Sponsors",
        url: "",                    // e.g. "https://github.com/sponsors/Lilcrash15"
        blurb: "Sponsor straight from GitHub with 0% fees on personal accounts. Good for developers who already use the tools from GitHub.",
        cta: "Sponsor on GitHub"
      },
      {
        id: "streamlabs",
        name: "Streamlabs tip jar",
        url: "https://streamlabs.com/lilcrash15/tip",
        blurb: "The same tip jar used on stream and in LCBot's support popup. Tips can show up live on stream.",
        cta: "Tip on Streamlabs"
      }
    ],
    goals: [
      "Code-signing certificate, so Windows stops showing the SmartScreen warning on install",
      "Time to build and ship new LC tools",
      "Keeping every LC tool free and open source, with no ads, accounts or subscriptions"
    ]
  }
};
