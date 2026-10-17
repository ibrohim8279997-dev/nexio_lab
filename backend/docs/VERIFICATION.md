# Verification report

Date: 2026-10-01. Environment: local Windows development machine, Laravel's PHP development server, SQLite local database, and Vite development server. These numbers are not production capacity claims.

## Automated checks

- Backend: 16 tests passed, 45 assertions, 0 failures.
- PHP style: Laravel Pint passed.
- Frontend: TypeScript project build and Vite production build passed (36 modules).
- Database: all migrations applied and the generic service/site seed completed.
- Routes: 37 versioned API routes registered.
- Storage: `public/storage` link created.

Covered security and lifecycle behavior includes anonymous CRM denial, staff order scoping, owner/admin write authorization, mandatory administrator 2FA hand-off, one-time/expired client invitations, client-order isolation, completion-gated one-review policy, HTML stripping, forged image rejection, published-only public services, and historical employee slug redirects.

## HTTP smoke check

The public home, services, employees and CSRF endpoints returned 200. Vite direct navigation to `/`, `/services/web`, `/works`, `/team`, `/contacts`, and `/admin` returned 200. An anonymous `/api/v1/admin/orders` request returned the standard JSON 401 response. CORS returned the configured exact origin, and `X-Request-Id` plus `X-Content-Type-Options: nosniff` were present.

## Controlled local load check

Fifty sequential public API requests across home, services, projects, employees and site completed with 0 errors: p50 333.67 ms, p95 403.13 ms, p99 413.33 ms. The PHP server process stayed at about 47.14 MiB working set; accumulated CPU time rose from 47.41 s to 63.33 s during the sample. A bounded burst of 10 simultaneous home requests completed with 0 errors in 3.35 s total.

The single-process development server is deliberately not representative of Nginx/PHP-FPM. Repeat the documented check on staging and record p50/p95/p99 latency, error rate, PHP-FPM saturation, database connections, CPU and RAM before choosing production limits.

## Residual production work

- Replace the explicit demo copy with approved company text, contacts, real staff, and real portfolio entries.
- Provision the first owner through protected environment/secrets handling and enroll a TOTP authenticator; no default credentials are committed.
- Configure production database, HTTPS, cookie domain, exact CORS origins, mail/recovery procedure, monitoring, queue supervision and retention policy.
- Run and record a real off-host database/media restore drill. Backups were not restored in this local workspace because no production backup source exists.
- Validate the inaccessible approved design against its original source or authenticated preview. The public URL supplied with the prompt returned HTTP 401.
- Re-run controlled load checks on the actual 2 vCPU/4 GB staging stack; local dev-server numbers cannot establish capacity.
