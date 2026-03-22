# HTTPS with Docker nginx + Let’s Encrypt

Your app is served by **`kiplombe_nginx`** (Docker), not by `apt install nginx`. The **`python3-certbot-nginx`** plugin only edits **host** nginx configs — use **`certbot certonly --webroot`** instead, with the webroot path shared with the container.

## 1. Avoid port 80 conflict

If the **system** nginx service is enabled, it can fight Docker for port 80:

```bash
sudo systemctl disable --now nginx
```

(You can keep the `certbot` and `python3-certbot-nginx` packages; only the **nginx** service needs to stay off while Docker owns `:80`.)

## 2. DNS

Point your **hostname** (e.g. `hmis.example.org`) **A record** to `41.89.173.8`. Let’s Encrypt does not issue normal certs for bare IPs.

## 3. Webroot on disk

From the repo directory on the server (adjust path):

```bash
mkdir -p deploy/certbot/www
```

This repo mounts `deploy/certbot/www` → `/var/www/certbot` in `docker-compose.deploy.yml` so ACME challenges are served by **container** nginx.

Redeploy / recreate nginx so the volume is mounted:

```bash
docker compose -f docker-compose.deploy.yml up -d nginx
```

## 4. Issue the certificate

```bash
sudo certbot certonly --webroot \
  -w /full/path/to/kiplombehmis/deploy/certbot/www \
  -d your.hostname.org \
  --email you@example.org \
  --agree-tos --non-interactive
```

Replace paths and domain. Certbot writes into `/etc/letsencrypt/live/your.hostname.org/`.

## 5. Enable TLS in Docker nginx

1. **Mount** Let’s Encrypt into the nginx container (read-only) — see `docker-compose.deploy.yml` comments for `certificates:` volume.
2. **Edit** `deploy/nginx.conf`:
   - Set `server_name your.hostname.org;` on the `:80` server (instead of `_`).
   - Add a second `server { listen 443 ssl http2; ... }` block with:
     - `ssl_certificate /etc/letsencrypt/live/your.hostname.org/fullchain.pem;`
     - `ssl_certificate_key /etc/letsencrypt/live/your.hostname.org/privkey.pem;`
   - (Optional) On `:80`, redirect to HTTPS: `return 301 https://$host$request_uri;` for locations **except** `/.well-known/acme-challenge/` (keep the ACME `location` block first).

3. **Publish** 443 in Compose: `443:443` on the `nginx` service.

4. **Open** TCP **443** in your cloud firewall / security group if needed.

5. Reload:

```bash
docker compose -f docker-compose.deploy.yml up -d nginx
docker exec kiplombe_nginx nginx -t && docker exec kiplombe_nginx nginx -s reload
```

## 6. Renewals

Certbot renews with `certbot renew`. After renewal, **reload** nginx so it picks up new certs:

```bash
sudo certbot renew --deploy-hook "docker exec kiplombe_nginx nginx -s reload"
```

Or a weekly cron:

```cron
0 3 * * * certbot renew --quiet --deploy-hook "docker exec kiplombe_nginx nginx -s reload"
```

## 7. App env

Set `FRONTEND_URL`, `NEXT_PUBLIC_BASE_URL`, and CORS-related vars to `https://your.hostname.org` (not `http://41.89.173.8`).
