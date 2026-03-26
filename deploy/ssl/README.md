# Self-signed TLS files (generated)

Run **`bash deploy/setup-https-selfsigned.sh`** from the repo root on the server.

This directory will contain `fullchain.pem` and `privkey.pem`. They are **gitignored** — do not commit them.

Browsers will show a **warning** until you trust the certificate or switch to a real domain with Let’s Encrypt.
