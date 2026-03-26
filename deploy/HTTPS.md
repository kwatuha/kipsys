# HTTPS for production (Docker nginx)

The app is served by **`kiplombe_nginx`**. Two options:

1. **Self-signed** — works with **IP only** (e.g. `41.89.173.8`). Browsers show a **warning** until you proceed or trust the cert.
2. **Let’s Encrypt** — needs a **DNS hostname** (not a bare IP). Use when you have a domain.

---

## A) Self-signed (no website / no domain yet)

On the **server**, from the repo (e.g. `~/kiplombe-hmis`):

```bash
# Ensure stack is up (nginx must mount deploy/ssl)
docker compose -f docker-compose.deploy.yml up -d

bash deploy/setup-https-selfsigned.sh
# Or pass your public IP explicitly:
bash deploy/setup-https-selfsigned.sh 41.89.173.8
```

Optional — redirect `http://41.89.173.8/...` to HTTPS (same IP in the cert):

```bash
bash deploy/setup-https-selfsigned.sh 41.89.173.8 --redirect
```

Then set in **`~/kiplombe-hmis/.env`** (use your IP):

```env
FRONTEND_URL=https://41.89.173.8
NEXT_PUBLIC_BASE_URL=https://41.89.173.8
```

Restart API + frontend:

```bash
docker compose -f docker-compose.deploy.yml up -d api frontend
```

**Browser:** open `https://41.89.173.8` → “Advanced” / “Proceed” (or import `deploy/ssl/fullchain.pem` into your OS trust store).  
**Zoom / media:** same **secure context** rules as HTTPS — better than plain HTTP on a LAN IP.

Certs live in **`deploy/ssl/`** (gitignored). Regenerate anytime by running the script again.

---

## B) Let’s Encrypt (when you have a domain)

Let’s Encrypt **does not** issue certs for a bare IP — you need a hostname with an **A record** to the server.

```bash
sudo apt update && sudo apt install -y certbot
sudo bash deploy/setup-https.sh your.hostname.org admin@your.org
# optional:  ... --redirect
```

See comments inside `deploy/setup-https.sh` and use **`FRONTEND_URL=https://your.hostname.org`**.

---

## Other notes

- **Port 443** must be open in the firewall / cloud security group.
- If **host** `nginx` (systemd) uses port 80, stop it: `sudo systemctl disable --now nginx` while Docker serves the app.
- **Renewal** applies only to Let’s Encrypt; self-signed certs are long-lived (script uses 825 days).
