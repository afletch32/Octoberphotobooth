# assets-to-themes.mjs

Usage:
1) Place this file in your project root (where package.json is).
2) Make sure your current assets live under ./assets (e.g., assets/general/birthday/backgrounds).
3) Run:
   node assets-to-themes.mjs

Outputs:
- public/themes/** (copied images)
- themes.from_assets.cleaned.json (KV-ready JSON payload)
- themes_from_assets_manifest.csv (audit of what moved where)

Upload JSON to KV:
npx wrangler kv:key put --binding THEMES_KV themes --path ./themes.from_assets.cleaned.json
(or use --binding FONTS_KV if that's your binding)
