# Technet SMS

Multi-tenant School Management System built with Next.js 16, Prisma, PostgreSQL, and Redis.

## What This Project Includes

- Role-based portals for `SUPER_ADMIN`, `SCHOOL_SUPER_ADMIN`, `SCHOOL_ADMIN`, `TEACHER`, and `STUDENT`
- School operations modules: students, staff, subjects, courses, classes, sections, enrollments
- Scheduling modules: section schedules, timetables, student attendance, staff attendance
- Finance modules: invoices, payments, refunds, payroll, monthly billing
- Platform modules: tenant management and subscriptions
- Security modules: email verification, 2FA, device approval flow, session lock, audit logs
- Internationalization with English (`en`) and Myanmar (`my`)

## Tech Stack

- `next@16.2.0` + `react@19.2.4`
- Prisma ORM (`prisma@7.5.0`, `@prisma/client@7.5.0`)
- PostgreSQL (`@prisma/adapter-pg`)
- Redis (`ioredis`)
- NextAuth credentials login + Prisma adapter
- Tailwind CSS v4 + shadcn/ui components

## ER Diagram

The ERD is generated from `prisma/schema.prisma`.

![LMS ER Diagram](docs/erd-lms.png)

Source files:
- `docs/erd-lms.svg`
- `docs/erd-lms.png`

## Quick Start (Local)

### 1) Install dependencies

```bash
pnpm install
```

### 2) Configure environment

Create local env files from your own secure values.

Recommended baseline variables:
- `DATABASE_URL`
- `DIRECT_URL` (for Prisma shadow DB / direct migrations when needed)
- `AUTH_SECRET` (preferred) or `NEXTAUTH_SECRET` (legacy fallback)
- `NEXTAUTH_URL`
- `REDIS_URL`
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_SECURE`
- `FROM_EMAIL`, `FROM_NAME`
- `APP_TIME_ZONE` (optional, defaults to `Asia/Yangon`)
- `NEXT_PUBLIC_VAPID_PUBLIC_KEY` (Web Push VAPID public key)
- `VAPID_PRIVATE_KEY` (Web Push VAPID private key)
- `VAPID_CONTACT_EMAIL` (optional, e.g. `mailto:ops@example.com`)
- `PUSH_REMINDER_CRON_SECRET` (secret header for reminder dispatch route)
- `PUSH_REMINDER_LEAD_MINUTES` (optional, defaults to `2`)

### 3) Generate Prisma client

```bash
pnpm db:generate
```

### 4) Apply migrations

```bash
pnpm db:migrate:deploy
```

### 5) Seed initial super admin

```bash
pnpm db:seed
```

Optional seed env vars:
- `SEED_SUPER_ADMIN_EMAIL`
- `SEED_SUPER_ADMIN_NAME`
- `SEED_SUPER_ADMIN_PASSWORD`

### 6) Start development server

```bash
pnpm dev
```

## Database Commands

Default profile:
- `pnpm db:generate`
- `pnpm db:migrate`
- `pnpm db:migrate:deploy`
- `pnpm db:migrate:status`
- `pnpm db:seed`
- `pnpm db:studio`

Environment-specific profiles:
- Local (`.env.local`): `pnpm db:local:*`
- Production migrate env (`.env.migrate`): `pnpm db:prod:*`
- UAT migrate env (`.env.migrate.uat`): `pnpm db:uat:*`

## Docker Compose Stack

Production-like stack in `docker-compose.yml` includes:
- App (`Next.js standalone`)
- PostgreSQL
- Redis
- NGINX reverse proxy
- Prometheus + Grafana
- Elasticsearch + Logstash + Kibana

Useful commands:

```bash
docker compose up -d
docker compose logs -f
docker compose down
docker compose --profile tools run --rm migrate
```

Development hot-reload overlay:

```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml up --build
```

## Kubernetes

Manifests are in `k8s/`:
- `namespace.yaml`
- `configmap.yaml`
- `secret.example.yaml`
- `app-deployment.yaml`
- `app-service.yaml`
- `ingress.yaml`
- `hpa.yaml`

Apply:

```bash
kubectl apply -f k8s/
```

## Deployment Notes (Vercel + Supabase)

- App deploy target: Vercel
- Database target: Supabase Postgres
- Before release: run `pnpm db:migrate:status`, `pnpm db:migrate:deploy`, `pnpm db:generate`
- CI safety scripts:
  - `pnpm release:build-gate`
  - `pnpm release:migration-gate`
  - `pnpm release:check`

## Project Structure

- `app/`: Next.js app routes, layouts, server actions
- `components/`: UI and domain components
- `lib/`: domain logic, auth, billing, exports, jobs
- `prisma/`: schema, migrations, seed script
- `docs/`: documentation artifacts (including ERD)
- `infra/` and `k8s/`: ops and deployment configs

## Push Reminder Dispatch

Teacher timetable push reminders are dispatched via:

`POST /api/push/teacher-reminders`

Required header:

- `x-cron-secret: <PUSH_REMINDER_CRON_SECRET>`

Recommended: run this endpoint every minute from your scheduler/cron service.

## Current Data Model Scope

Core entities in Prisma include:
- Tenancy and identity: `Tenant`, `User`, `Subscription`, `Account`, `Session`, `LoginApprovalRequest`, `Notification`, `AuditLog`
- School org: `Branch`, `Staff`, `Student`
- Academic setup: `Subject`, `Course`, `CourseSubject`, `Class`, `Section`, `SectionStaff`, `SectionSchedule`, `Timetable`
- Learning lifecycle: `Enrollment`, `Attendance`, `Progress`, `StaffAttendance`
- Finance: `Invoice`, `Payment`, `Refund`, `Payroll`
