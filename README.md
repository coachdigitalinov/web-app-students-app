# Digital Inov – Education Performance & Testing Platform (V1)

Next.js (App Router, TypeScript) + SQLite (`better-sqlite3`). Implements the V1 workflow:

student registers → opens worksheets → starts a timed test → uploads answer sheet → teacher/admin corrects → marks saved → report generated → progress tracked.

## Run

```bash
npm install
npm run dev            # http://localhost:3000
# production
npm run build && npm start
```

On first start the database (`data/app.db`) is created and an admin is seeded:

| Variable | Default |
|---|---|
| `ADMIN_EMAIL` | `admin@digitalinov.local` |
| `ADMIN_PASSWORD` | `ChangeMe123!` |

Set both before the first start (and change the password for any real deployment). `npm run seed` adds a demo teacher and student (password `demo12345`) – development only.

Uploads are stored in `storage/` and served only through `/files/...` after a permission check. Back up `data/` and `storage/` together.

## Roles

- **Admin** – students, teachers, worksheets, tests, submissions (assign a corrector), referral fee and payment ledger.
- **Teacher** – corrects answer sheets assigned to them, views referred/assigned students, adds school-test results, sees own referral code and payments. Accounts are created by the admin.
- **Student** – self-registers (optional teacher referral code), views worksheets, takes timed tests, uploads answers, sees marks, feedback, weak areas and progress.

## Decisions made for V1 (change if the client disagrees)

- Worksheets, question papers and answer sheets: **PDF, JPG, PNG or WEBP**, max 15 MB each; contents are checked, not just the extension.
- **Teacher or admin** can correct; admin assigns sheets to a teacher, and a teacher sees only sheets assigned to them.
- Timer: starts when the student presses Start, deadline is enforced on the server. Uploads up to 10 minutes after the deadline are accepted and flagged **late**; later ones are refused. One attempt per test.
- Worksheets open in an inline viewer with no download link and `no-store` caching. This discourages casual copying but **cannot technically prevent** a determined student from saving or screenshotting a file.
- Referrals: a pending payment entry (default fee, editable by admin) is created when a student registers with a teacher's code. Admin marks entries paid and can add manual entries. No payment gateway.
- Progress status compares the average of the latest 3 platform results with the 3 before; weak areas are the topics teachers tag on corrections.
- Worksheets/tests can be limited to a grade; blank means every student.

## Not in V1

Parent login, notifications (email/SMS/WhatsApp), bulk student upload, payment gateway, password self-reset (admin resets passwords via the `resetPassword` action – no UI yet), multi-school dashboards.

## Deploying on Vercel

Vercel functions have a read-only filesystem, so on Vercel the app stores its SQLite database and uploads in `/tmp`. This makes the app **run**, but `/tmp` is wiped on cold starts and is not shared between function instances, so **all data and uploads are temporary**. It is fine for a demo only. For real use, host it somewhere with a persistent disk (a VPS, Fly.io or Railway with a volume), or switch the database to Postgres and uploads to object storage (Vercel Postgres/Neon and Vercel Blob).
