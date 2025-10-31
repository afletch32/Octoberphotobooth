# Deploying October Photobooth

This project can be published either through GitHub Pages or Cloudflare Pages. The sections below walk through what needs to happen after you make local changes so they become available on your live site.

## GitHub Pages

1. Commit your local changes.
2. Push to the branch that GitHub Pages is configured to publish (often `main`, `master`, or `gh-pages`).
3. Wait for the GitHub Pages build to finish. You can monitor the progress from **Settings → Pages** or by opening the workflow run under **Actions** if the site is built with GitHub Actions.
4. Once the build completes, refresh your live site. If you still see stale assets, clear the browser cache or perform a hard refresh.

> **Tip:** If the repository uses a dedicated `docs/` folder or the `gh-pages` branch for the site content, make sure your changes land in that location before pushing.

## Cloudflare Pages

If you also host the project on Cloudflare Pages and the build is failing:

1. Open the Cloudflare Pages dashboard and review the failing build log for the commit you just pushed.
2. Fix any issues reported in the build log locally.
3. Commit and push the fixes. Cloudflare will retry the deployment automatically for the new commit.
4. If you need to redeploy without pushing again, trigger the project’s Deploy Hook from the admin UI or the dashboard.

You can always deploy manually by running `npm run ship`, which rebuilds the manifests and calls the Cloudflare deploy script defined in `package.json`.

