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
| `PORT` | no | HTTP port (default `8080`) |

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

## Deploy to Oracle Cloud VM (recommended)

Railway and similar PaaS hosts often **block outbound SMTP**, producing `[admin-notifications] SMTP send failed: Connection timeout`. Use a VPS where port 465 to Qserver is reachable.

### 1. Provision the VM

1. Create an Oracle Cloud **Always Free** (or paid) VM instance (Ubuntu 22.04+).
2. Open ingress: **443** (HTTPS, if using nginx + TLS) and/or **8080** (direct, dev only).
3. Ensure **egress** to `26.qservers.net:465` is allowed (default on most VPS).

### 2. Install Node.js on the VM

```bash
sudo apt update && sudo apt install -y git curl
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
```

### 3. Deploy the relay

```bash
git clone <your-repo-url> tipmanna
cd tipmanna/email-relay
npm ci
npm run build
cp .env.example .env
# edit .env with QSERVER_* and RELAY_API_KEY
```

### 4. Run with systemd

Create `/etc/systemd/system/tipmanna-email-relay.service`:

```ini
[Unit]
Description=TipManna admin email relay
After=network.target

[Service]
Type=simple
User=ubuntu
WorkingDirectory=/home/ubuntu/tipmanna/email-relay
EnvironmentFile=/home/ubuntu/tipmanna/email-relay/.env
ExecStart=/usr/bin/node dist/index.js
Restart=on-failure
RestartSec=5

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now tipmanna-email-relay
sudo systemctl status tipmanna-email-relay
```

### 5. TLS reverse proxy (production)

Put nginx + Let's Encrypt in front of port 8080 so TipManna calls `https://relay.yourdomain.com`.

Example nginx site:

```nginx
server {
  listen 443 ssl;
  server_name relay.yourdomain.com;
  ssl_certificate     /etc/letsencrypt/live/relay.yourdomain.com/fullchain.pem;
  ssl_certificate_key /etc/letsencrypt/live/relay.yourdomain.com/privkey.pem;

  location / {
    proxy_pass http://127.0.0.1:8080;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
  }
}
```

### 6. Verify on the VM

```bash
curl "http://127.0.0.1:8080/health"
```

From your laptop (after TLS):

```bash
curl "https://relay.yourdomain.com/health"
curl -X POST "https://relay.yourdomain.com/admin-notifications" \
  -H "Authorization: Bearer $RELAY_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"type":"smoke","subject":"Relay smoke","message":"Test"}'
```

Confirm delivery to the admin mailbox.

### 7. Wire TipManna backend (Render)

| Variable | Value |
|----------|-------|
| `EMAIL_RELAY_URL` | `https://relay.yourdomain.com` (no trailing slash) |
| `EMAIL_RELAY_API_KEY` | Same value as relay `RELAY_API_KEY` |

Do **not** set `QSERVER_*` on Render. User/host mail continues to use Resend unchanged.

See also: [docs/ops/admin-email-relay.md](../docs/ops/admin-email-relay.md).

## Why not Railway?

Railway was tested but outbound SMTP to Qserver timed out (`Connection timeout`). That is expected on many managed platforms. The relay must run on infrastructure with working SMTP egress — Oracle VM is the current target.

## Scripts

| Command | Purpose |
|---------|---------|
| `npm run dev` | Start with hot reload |
| `npm run build` | Compile TypeScript to `dist/` |
| `npm start` | Run production build |
| `npm test` | Run unit tests |
| `npm run typecheck` | Type-check without emit |
