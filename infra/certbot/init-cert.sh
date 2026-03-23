#!/usr/bin/env sh
set -eu

if [ "$#" -lt 2 ]; then
  echo "Usage: sh infra/certbot/init-cert.sh <domain> <email>"
  exit 1
fi

DOMAIN="$1"
EMAIL="$2"

docker compose run --rm certbot certonly \
  --webroot -w /var/www/certbot \
  -d "$DOMAIN" \
  --email "$EMAIL" \
  --agree-tos --no-eff-email

docker compose restart nginx
echo "Certificate issued for $DOMAIN and nginx reloaded."
