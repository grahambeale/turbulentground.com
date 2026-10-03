# Amendment 1 — Graham's decisions of 3 Oct 2026

Source: Graham, chat, 3 Oct 2026 (quoted in `approval.json`). These decisions amend `proposal.md` and `design.md`
without changing the file hashes recorded there.

- **D1 = preview-only with noindex.** `public-allowlist.json` has a `previewOnly` group holding the 13 research
  review and preview pages. `build-public` copies them only when `VERCEL_ENV` is not `production` and adds
  `<meta name="robots" content="noindex,nofollow">` to the copies (never to the source files). On production they
  return 404. The 4 build inputs (`partials/feedback.html`, `partials/footer.html`, `partials/nav.html`,
  `learnings/_article-template.html`) are in no group and are never served.
- **D2 = keep `writing.html`** in the public group.
- **D3 = keep the `.vercelignore` entries as a second layer.** `design.md` rollout step 5 ("simplify
  `.vercelignore`") is withdrawn: nothing is removed from `.vercelignore`. The allowlist is the first layer;
  `.vercelignore` stays as defence in depth, and must still never list a build input.
- **D4 = approved.** Parity crawls run at 4 at a time or fewer with about 1 s between requests; previews are crawled
  from the authenticated browser pane or the Vercel connector.

Consequences for the checks: the expected set of files in `public/` is `public` plus (`previewOnly` when
`VERCEL_ENV` is not `production`). The hook builds the preview variant (no `VERCEL_ENV`) and additionally proves the
production variant (`VERCEL_ENV=production`).

Scope of this approval: build the change on `chore/public-allowlist`, push through the hook, make a preview, and report.
**No production release.** A release needs a separate approval of the previewed head and goes through `scripts/release.sh`.
