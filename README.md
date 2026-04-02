# SMS SaaS Infrastructure

Production-ready infra stack for a multi-tenant SMS:

- Next.js app (standalone)
- BullMQ worker
- PostgreSQL
- Redis
- NGINX reverse proxy
- Certbot (auto-renew)
- Prometheus + Grafana
- Elasticsearch + Logstash + Kibana

## 1) Environment

```bash
cp .env.example .env
```

Update secrets in `.env`:

- `AUTH_SECRET`
- `POSTGRES_PASSWORD`
- `GRAFANA_ADMIN_PASSWORD`
- `NEXTAUTH_URL`

## 2) Run With Docker Compose

Start:

```bash
docker compose up -d
```

Logs:

```bash
docker compose logs -f
```

Stop:

```bash
docker compose down
```

Rebuild:

```bash
docker compose up --build -d
```

## 3) Prisma Migration / Seed

Run migration with the dedicated tools container:

```bash
docker compose --profile tools run --rm migrate
```

Seed from worker container:

```bash
docker compose exec worker pnpm prisma db seed
```

Supabase migration flow (recommended for Vercel deployments):

```bash
# 1) Set DATABASE_URL (pooler) and DIRECT_URL (direct DB) in .env
# 2) Check migration status
pnpm db:migrate:status

# 3) Apply existing migrations safely
pnpm db:migrate:deploy

# 4) Generate Prisma client
pnpm db:generate
```

## 4) SSL (Certbot + NGINX)

Set your domain/email in `.env`:

- `DOMAIN=your-domain.com`
- `CERTBOT_EMAIL=you@example.com`

Initial certificate issue:

```bash
sh infra/certbot/init-cert.sh your-domain.com you@example.com
```

Then reload NGINX:

```bash
docker compose restart nginx
```

Auto-renew is already configured in `certbot` service.

## 5) Monitoring

- Prometheus: `http://localhost:9090`
- Grafana: `http://localhost:3001`
- Grafana datasource is provisioned automatically.

## 6) Logging (ELK)

- Elasticsearch: `http://localhost:9200`
- Logstash TCP JSON input: `localhost:${LOGSTASH_TCP_PORT:-15000}`
- Kibana: `http://localhost:5601`

## 7) Development vs Production

Development (hot reload):

```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml up --build
```

Local email delivery (signup verification/resend):

- Set real SMTP values in `.env` (`SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `FROM_EMAIL`).
- For Gmail, use `SMTP_HOST=smtp.gmail.com`, `SMTP_PORT=587`, `SMTP_SECURE=false`, and a Google App Password.
- Run the email worker process; queueing alone is not delivery:

```bash
pnpm worker:email
```

Production:

- Use built images
- No bind-mount for source code
- Use real secrets via environment/secret manager
- Keep Postgres/Redis private (no public exposure in cloud firewall)

## 8) Kubernetes

Manifests are in `k8s/`:

- `namespace.yaml`
- `configmap.yaml`
- `secret.example.yaml`
- `app-deployment.yaml`
- `worker-deployment.yaml`
- `app-service.yaml`
- `ingress.yaml`
- `hpa.yaml`

Apply:

```bash
kubectl apply -f k8s/
```

## 9) Vercel + Supabase + Render (Production)

Vercel project is linked via `.vercel/project.json` (`technetmm`).

Deployment topology:

- Web app: Vercel (Git auto-deploy from `main`)
- Worker: Render worker service (`render.yaml`)
- Shared backing services: Supabase Postgres + Redis

Set these Vercel environment variables (Production/Preview as needed):

- `DATABASE_URL` (Supabase pooled URL)
- `DIRECT_URL` (Supabase direct DB URL)
- `AUTH_SECRET` (canonical auth secret; `NEXTAUTH_SECRET` is only a legacy fallback)
- `NEXTAUTH_URL` (your Vercel app URL)
- `REDIS_URL` (shared Redis for BullMQ)
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS`
- `FROM_EMAIL`, `FROM_NAME`

Configure Vercel Git integration:

- Connect this repository to the linked Vercel project.
- Enable Preview deployments for pull requests.
- Set Production Branch to `main`.

Run migrations against Supabase before first production cutover:

```bash
pnpm db:migrate:status
pnpm db:migrate:deploy
pnpm db:generate
```

Release gates in CI (`.github/workflows/deploy.yml`):

- Always gate on `pnpm db:generate` + `pnpm build`.
- On pushes to `main`, also gate on `pnpm db:migrate:status` if `PRODUCTION_DATABASE_URL` secret is configured.
- Optional secret: `PRODUCTION_DIRECT_URL` (falls back to `PRODUCTION_DATABASE_URL` if omitted).
- Local equivalent checks: `pnpm release:build-gate` and `pnpm release:check`.

Background workers do not run persistently on Vercel. Deploy `render.yaml` to Render as a worker service:

- Build command: `pnpm install --frozen-lockfile && pnpm db:generate`
- Start command: `pnpm worker:start`
- Use the same `DATABASE_URL`, `DIRECT_URL`, `REDIS_URL`, `AUTH_SECRET`, and SMTP env vars as production.
