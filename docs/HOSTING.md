# Share the course publicly

`127.0.0.1` is only the computer opening that address. Share a hosted HTTPS
address instead. This application is static: R runs in visitors’ browsers.
No application server, learner account, API key, or database service is needed.

## Cloudflare Pages: manual upload

1. Run `pnpm install --frozen-lockfile` and `pnpm build` in the project.
2. Sign in to Cloudflare and open **Workers & Pages → Create application →
   Get started → Drag and drop your files** (choose Pages).
3. Choose a project name and upload the complete `dist` folder, or the prepared
   `release/statistics-with-r.zip`. The archive has `index.html` at its root.
4. Select **Deploy site**. Share the resulting `https://<project>.pages.dev`
   address; append `/#r-essentials` to open the first notebook directly.
5. For updates, rebuild and use **Create a new deployment** in the same project.

Your computer can be turned off after uploading. Only you need a hosting
account. Keep the whole `webr` directory and all fonts/assets. Do not enable
optional analytics if you want to preserve the tracking-free application.

[Official upload instructions](https://developers.cloudflare.com/pages/get-started/direct-upload/)
allow a ZIP or folder, with 1,000 files and 25 MiB per individual file for
browser uploads. This build fits those limits. Direct Upload projects cannot
switch to Git integration; create a Git-integrated project from the outset if
you prefer automatic publishing after future commits.

## Other static hosts

Upload all of `dist`, preserving relative paths. Serve `.wasm` as
`application/wasm`, JavaScript with its normal MIME type, and use HTTPS.
The app uses hash navigation and relative assets, so no route rewrites or
special cross-origin-isolation headers are required. A subdirectory deployment
is covered by the production tests. No secrets belong in the browser bundle.

## Saved work

Each visitor’s edits stay in their own browser. Localhost and the public site
have separate storage. Use **Export all saved work** locally and **Import saved
work** on the public site to move edits. Hosting does not add cloud syncing.

The prepared archive is a snapshot: rebuild and replace it after source changes.
Public deployment and provider-specific headers have not been verified until
an actual site is uploaded; local production tests verify static hosting.
