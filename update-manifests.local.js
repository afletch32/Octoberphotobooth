#!/usr/bin/env node
/**
 * Rebuild overlays.json, templates.json, and backgrounds.json by scanning asset folders.
 *
 * Usage:
 *   node tools/update-manifests.js            # scan repo under ./assets
 *   node tools/update-manifests.js assets/Hawks  # scan a subfolder only
 */

const { runCli } = require("./tools/update-manifests");

runCli();
