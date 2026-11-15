# Agent Instructions

## Web application (`web/`)

A static, single-file web version of the ShareCertificate tool is being built
in stages. The binding plan, all decisions, the domain details of the C#
program and the status of each stage are in:

**`web/docs/PLAN.md`** - read it completely before working on `web/`.

Key rules (details in the plan, section 4):

- Work on exactly one stage at a time; respect its prerequisites.
- Small, traceable commits with short English messages:
  subject line = what was done, body (1-3 lines) = why it was done.
- Every commit builds and passes the tests (`npm test`, `npm run build` in `web/`).
- After finishing a stage: change its checkbox from `[ ]` to `[x]` in
  `web/docs/PLAN.md` in both places (checklist in section 8 and the stage
  heading in section 7), add findings to section 9, and commit that separately.
  Only mark `[x]` when all acceptance criteria are met.
- Do not commit unrelated working-tree changes.
- Never commit real customer data (addresses, amounts); use `CustomerTest/` only.
- UI language is German (de-CH); code, identifiers, comments and commit
  messages are English. ASCII only outside string literals. Always use braces.
