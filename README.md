# Tru Concrete Driveways

Responsive homeowner driveway inquiry site for Tru Concrete Driveways, with a three-step form, server validation, SQLite persistence, and no runtime package dependencies.

## Local use

Requires Node.js 24 or later.

```sh
npm start
```

Open http://localhost:3000. Run `npm test` for API validation and persistence checks.

## Render deployment

Push this directory to a GitHub, GitLab, or Bitbucket repository. Create a Render **Node web service** from that repository with:

- Build command: `npm install --omit=dev`
- Start command: `npm start`
- Environment: `NODE_VERSION=24`, `DATABASE_PATH=/var/data/leads.sqlite`
- Health check path: `/health`
- Persistent disk mounted at `/var/data` (requires a compatible paid service; review current Render pricing before provisioning).

Render supplies `PORT`; the app listens on `0.0.0.0`. Do not deploy SQLite on Render's ephemeral filesystem for real inquiries: redeployments would lose the data. One instance is required for the local SQLite file. Use a managed database before scaling to multiple instances. Back up lead data and restrict administrative access through Render.

## Before public launch

Contact email and service area are intentionally pending, per the owner’s request for placeholders. Supply the company contact information and a complete privacy notice with retention and deletion terms before advertising this site. Configure lead delivery before public launch. This version saves inquiries in SQLite and explicitly tells submitters that delivery to the company is not configured; it does not email requests, generate estimates, or book work.

The interface uses an Unsplash architecture photograph, loaded externally. Project inquiries collect contact details, project address, and project preferences; no public lead-list endpoint is exposed. The basic in-memory submission limit is an abuse deterrent, not distributed bot protection.

## Accessing saved requests

Use authorized Render shell access and a SQLite client to inspect `/var/data/leads.sqlite`. The `leads` table contains the reference ID, UTC timestamp, and JSON payload. Never expose this file through public hosting or commit it to Git.
