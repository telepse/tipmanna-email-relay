# TipManna admin email relay

Standalone Node.js/TypeScript service that receives admin notification requests from the TipManna backend over HTTPS and delivers them to the admin mailbox via Qserver SMTP.

TipManna on Render uses Resend for user/host mail. This relay is the **only** component that holds Qserver SMTP credentials.

## API

### `GET /health`

Returns SMTP connectivity status.

| Status | Meaning |
|--------|---------|
| `200` | SMTP connection verified |
| `503` | SMTP unreachable |

```json
{ "ok": true, "status": "healthy", "smtp": "connected" }
```

### `POST /admin-notifications`

Requires `Authorization: Bearer <RELAY_API_KEY>`.

Request body:

```json
{
  "type": "event_submitted",
  "subject": "NEW EVENT notification",
  "message": "Plain text body",
  "html": "<p>Optional HTML</p>"
}
```

| Status | Meaning |
|--------|---------|
| `200` | Email sent |
| `400` | Validation error |
| `401` | Missing/invalid Authorization header |
| `403` | Invalid API key |
| `502` | SMTP delivery failed |

Success response:

```json
{ "ok": true, "type": "event_submitted" }
```

## Environment variables

Copy `.env.example` to `.env` for local development.

| Variable | Required | Description |
|----------|----------|-------------|
| `RELAY_API_KEY` | yes | Shared secret; TipManna sets the same value in `EMAIL_RELAY_API_KEY` |
| `QSERVER_SMTP_HOST` | yes | e.g. `26.qservers.net` |
| `QSERVER_SMTP_PORT` | yes | `465` (implicit TLS) |
| `QSERVER_SMTP_USER` | yes | Qserver mailbox username |
| `QSERVER_SMTP_PASSWORD` | yes | Qserver mailbox password |
| `QSERVER_FROM_EMAIL` | yes | From address, e.g. `hello@tipmanna.com` |
| `ADMIN_NOTIFICATION_EMAIL` | yes | Team inbox that receives alerts |
| `PORT` | no | HTTP port (default `8080`; Railway sets this automatically) |

SMTP credentials must come exclusively from environment variables and must never be hard-coded.

## Local development

```bash
cd email-relay
npm install
cp .env.example .env
# fill in QSERVER_* and RELAY_API_KEY
npm run dev
```

Smoke test:

```bash
curl -X POST "http://localhost:8080/admin-notifications" \
  -H "Authorization: Bearer $RELAY_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"type":"smoke","subject":"Relay smoke","message":"Test"}'
```

## Deploy to Railway

This service must run on a host that can reach Qserver SMTP (`26.qservers.net:465`). Railway is suitable because it is off Render and can reach external SMTP.

### 1. Create the Railway project

1. Push this repo to GitHub (or connect an existing repo).
2. In [Railway](https://railway.app/), click **New Project** → **Deploy from GitHub repo**.
3. Select the TipManna repository.
4. Open the new service **Settings** → **Root Directory** and set it to `email-relay`.
5. Railway detects Node.js and runs:
   - **Build:** `npm install && npm run build`
   - **Start:** `npm start`

Alternatively, deploy only the `email-relay` folder as its own repository.

### 2. Configure environment variables

In Railway → **Variables**, add:

| Variable | Value |
|----------|-------|
| `RELAY_API_KEY` | Generate a long random secret |
| `QSERVER_SMTP_HOST` | `26.qservers.net` |
| `QSERVER_SMTP_PORT` | `465` |
| `QSERVER_SMTP_USER` | Your Qserver SMTP username |
| `QSERVER_SMTP_PASSWORD` | Your Qserver SMTP password |
| `QSERVER_FROM_EMAIL` | `hello@tipmanna.com` |
| `ADMIN_NOTIFICATION_EMAIL` | Team inbox address |

Do **not** commit secrets. Railway injects them at runtime.

### 3. Generate a public URL

1. Open **Settings** → **Networking** → **Generate Domain**.
2. Copy the HTTPS URL, e.g. `https://tipmanna-email-relay-production.up.railway.app`.

### 4. Verify deployment

```bash
curl "https://YOUR-RAILWAY-DOMAIN/health"
```

```bash
curl -X POST "https://YOUR-RAILWAY-DOMAIN/admin-notifications" \
  -H "Authorization: Bearer $RELAY_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"type":"smoke","subject":"Relay smoke","message":"Test"}'
```

Confirm delivery to the admin mailbox before wiring TipManna production.

### 5. Wire TipManna backend (Render)

On the TipManna backend only (not this relay):

| Variable | Value |
|----------|-------|
| `EMAIL_RELAY_URL` | Railway HTTPS base URL (no trailing slash) |
| `EMAIL_RELAY_API_KEY` | Same value as relay `RELAY_API_KEY` |

Do **not** set `QSERVER_*` on Render. User/host mail continues to use Resend unchanged.

See also: [docs/ops/admin-email-relay.md](../docs/ops/admin-email-relay.md).

## Scripts

| Command | Purpose |
|---------|---------|
| `npm run dev` | Start with hot reload |
| `npm run build` | Compile TypeScript to `dist/` |
| `npm start` | Run production build |
| `npm test` | Run unit tests |
| `npm run typecheck` | Type-check without emit |
