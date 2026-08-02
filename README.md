# Futebolada

Web app for organising the weekly football game: players enroll for a game, teams
get assigned, results get recorded. When someone enrolls or drops out, a
notification is posted to the WhatsApp group.

Built with [React Router](https://reactrouter.com/) (SSR), Express, PostgreSQL and
[WAHA](https://waha.devlike.pro/) for the WhatsApp integration.

This README is a handbook. Sections 1–3 are for working on the code, sections 4–7
are the operational runbook for the server.

---

## 1. Local development

```bash
npm install
cp .env.example .env    # then fill it in, see below
docker compose up -d db # the app itself runs on the host, not in Docker
npm run dev
```

The app is served at `http://localhost:3000`.

Locally, `npm run dev` runs **on your machine**, outside Docker, and reaches
Postgres and WAHA through published ports on `localhost`. That is why the local
`.env` uses `localhost` where the server uses Docker service names:

| variable        | local                       | server                 |
| --------------- | --------------------------- | ---------------------- |
| `DB_HOST`       | `localhost`                 | `db`                   |
| `WAHA_BASE_URL` | `http://localhost:3001/api` | `http://waha:3000/api` |

Other useful commands:

```bash
npm run typecheck   # react-router typegen && tsc
npm run build       # production build into build/
npm run migrate     # apply DB migrations (needs DATABASE_URL)
```

## 2. Environment variables

All of these live in `.env`, both locally and on the server. `.env.example` lists
them with empty values.

| variable                                                              | what it is                                                         |
| --------------------------------------------------------------------- | ------------------------------------------------------------------ |
| `DB_HOST` `DB_PORT` `DB_USER` `DB_PASSWORD` `DB_NAME`                 | Postgres connection                                                |
| `GOOGLE_CLIENT_ID` `GOOGLE_CLIENT_SECRET` `GOOGLE_REDIRECT_URI`       | Google login                                                       |
| `FACEBOOK_CLIENT_ID` `FACEBOOK_CLIENT_SECRET` `FACEBOOK_REDIRECT_URI` | Facebook login                                                     |
| `SESSION_SECRET`                                                      | signs user session cookies                                         |
| `WAHA_BASE_URL`                                                       | where the app reaches WAHA (see table above)                       |
| `WAHA_API_KEY`                                                        | authenticates every WAHA request                                   |
| `WAHA_CHAT_ID`                                                        | the WhatsApp group notifications go to, e.g. `3519...-163...@g.us` |
| `WAHA_DASHBOARD_ENABLED` `WHATSAPP_SWAGGER_ENABLED`                   | WAHA's web UI and API docs, both `false` in production             |

## 3. Database migrations

Migrations live in `migrations/` and run through `node-pg-migrate`.

```bash
npm run migrate                        # locally
docker compose up -d migrate --build   # on the server
```

---

## 4. Deploying

```bash
ssh root@XXX.XXX.XXX.XXX
cd futebolada
git pull
```

Update `.env` first if the change needs new variables. Then run only what you need:

| you changed                            | run                                    |
| -------------------------------------- | -------------------------------------- |
| app code                               | `docker compose up -d app --build`     |
| migrations                             | `docker compose up -d migrate --build` |
| `docker-compose.yml` (waha, db, caddy) | `docker compose up -d <service>`       |
| everything                             | `docker compose up -d --build`         |

**`--build` is required for `app` and `migrate`.** Both are built from the
`Dockerfile`, and the code is baked into the image at build time. Without
`--build`, Docker reuses the old image and your changes silently do not ship.

Direct database access:

```bash
docker compose exec db psql -U futebolada -d futebolada
```

---

## 5. Talking to the WAHA API

Everything in the next two sections uses the same pattern. Read the key out of
`.env` rather than typing it:

```bash
cd ~/futebolada
KEY=$(grep -E "^WAHA_API_KEY" .env | cut -d= -f2-)
CHAT=$(grep -E "^WAHA_CHAT_ID" .env | cut -d= -f2-)
```

Then every request carries `-H "X-Api-Key: $KEY"`:

```bash
curl -s -H "X-Api-Key: $KEY" http://localhost:3001/api/sessions
```

> **Write these as one line.** Multi-line `curl` commands with `\` continuations
> get mangled when pasted into an SSH session — the `-H` flag is dropped, the
> request goes out with no key, and you get a confusing `401 Unauthorized` that
> looks like a broken key. If you see a 401, suspect the paste before the key.

Note that in production the WAHA dashboard and Swagger UI are both disabled, so
the HTTP API is the only way in.

### Health checks

```bash
# Session health. Want "status":"WORKING", a "me" object with the phone
# number, and "store":{"enabled":true,"fullSync":true}
curl -s -H "X-Api-Key: $KEY" http://localhost:3001/api/sessions/default

# Has the app been crash-looping? Want a number that does not grow
docker inspect futebolada-app-1 --format '{{.RestartCount}}'

# How big is the WhatsApp history store getting?
docker exec futebolada-waha-1 du -sh /app/.sessions
```

---

## 6. Re-authenticating WhatsApp

The WhatsApp login is stored in the `waha_sessions` volume and survives container
restarts and image upgrades. You should rarely need this.

You **do** need it if WhatsApp logs the device out, if the session is deleted, or
if the volume is lost.

### Step 1 — create and start the session

Skip this if `GET /api/sessions/default` already returns a session. The `config`
block matters; see the warning below.

```bash
curl -s -X POST -H "X-Api-Key: $KEY" -H "Content-Type: application/json" -d '{"name":"default","start":true,"config":{"noweb":{"store":{"enabled":true,"fullSync":true}}}}' http://localhost:3001/api/sessions/
```

Within a few seconds the status should move to `SCAN_QR_CODE`.

### Step 2 — scan the QR code

Run this **on your laptop**, not on the server. It pulls the QR down and opens it:

```bash
ssh root@XXX.XXX.XXX.XXX 'cd ~/futebolada; KEY=$(grep -E "^WAHA_API_KEY" .env | cut -d= -f2-); curl -s -H "X-Api-Key: $KEY" -H "Accept: image/png" http://localhost:3001/api/default/auth/qr' > /tmp/qr.png && open /tmp/qr.png
```

Scan it with **WhatsApp → Settings → Linked devices → Link a device**.

The code rotates every ~20 seconds. If it expires, run the command again for a
fresh one.

### Step 3 — confirm

```bash
curl -s -H "X-Api-Key: $KEY" http://localhost:3001/api/sessions/default
```

Want `"status":"WORKING"` and a `"me"` object with the phone number.

### ⚠️ The session config is not in this repo

`docker-compose.yml` does **not** control the notification store — it is
per-session config held in WAHA's own database, inside the `waha_sessions`
volume. If a session is created without it, notifications fail with a `400`.

Creating the session as in step 1 sets it. To fix a session that already exists:

```bash
curl -s -X PUT -H "X-Api-Key: $KEY" -H "Content-Type: application/json" -d '{"config":{"noweb":{"store":{"enabled":true,"fullSync":true}}}}' http://localhost:3001/api/sessions/default
```

This restarts the session but does **not** require scanning the QR code again.

---

## 7. When notifications stop working

Notifications are sent in the background, so a failure never breaks enrolling —
the player is still enrolled and the page still loads. The failure only shows up
in the logs:

```bash
docker logs -f futebolada-app-1
```

- `✅ Message sent: <id>` — working.
- `Failed to send WhatsApp notification: ...` — something below is wrong.

Before a message is sent, the app marks the chat as read and shows a typing
indicator, so the traffic does not look automated. **If any of those steps fail,
the message is deliberately not sent** — sending anyway risks the number being
blocked by WhatsApp. So a broken presence step means silence, not a broken app.

Test the three steps directly. None of them post anything to the group, so they
are safe to run at any time:

```bash
for ep in sendSeen startTyping stopTyping; do printf "%-12s " $ep; curl -s -w " [%{http_code}]\n" -X POST -H "X-Api-Key: $KEY" -H "Content-Type: application/json" -d "{\"chatId\":\"$CHAT\",\"session\":\"default\"}" http://localhost:3001/api/$ep; done
```

Three `201`s means the path is healthy. Otherwise:

| symptom                               | meaning                                  | fix                                         |
| ------------------------------------- | ---------------------------------------- | ------------------------------------------- |
| `401 Unauthorized`                    | key never reached WAHA                   | rewrite the command on one line (section 5) |
| `400` mentioning "Enable NOWEB store" | session created without the store config | run the `PUT` in section 6                  |
| `404 Session not found`               | no session exists                        | create it, section 6 step 1                 |
| `"status":"SCAN_QR_CODE"`             | logged out of WhatsApp                   | re-scan, section 6 step 2                   |
| `500`                                 | WAHA cannot reach WhatsApp               | check `docker logs futebolada-waha-1`       |
| all `201` but no message arrives      | `WAHA_CHAT_ID` may be wrong              | verify the group id in `.env`               |

If `RestartCount` on `futebolada-app-1` is climbing, that is separate and more
serious — the server is dying and returning errors to real users. Check the app
logs for an unhandled rejection.

---

## 8. Security notes

- **`WAHA_API_KEY` is the only thing protecting the WhatsApp account.** Anyone
  with it can read chats and send messages as you. Do not paste it into
  issues, chats or screenshots. To rotate it, change `.env` and run
  `docker compose up -d waha app` — both containers read it, so both must
  restart. Rotating the key does not log WhatsApp out.
