# Production operations

This guide targets one Ubuntu VPS with 2 vCPU and 4 GB RAM. It is an operational starting point, not a capacity promise; measure the real workload before setting concurrency targets.

## Runtime layout

- Nginx serves `frontend/dist`, `/storage`, and proxies `/api` plus `/up` to PHP-FPM.
- PHP 8.3+ with FPM, MySQL 8+ or PostgreSQL 16+, Composer 2, and Node 20+ for builds.
- Laravel scheduler runs every minute. A systemd or Supervisor worker runs `php artisan queue:work --sleep=3 --tries=3 --max-time=3600` when queued jobs are introduced.
- TLS is mandatory. Redirect HTTP to HTTPS and enable HSTS only after confirming every subdomain works over HTTPS.

## Release

1. Upload a versioned release and run `composer install --no-dev --classmap-authoritative`.
2. Build the frontend with `npm ci && npm run build`; set `VITE_API_URL=/api/v1`.
3. Configure `.env` outside source control. Use `APP_ENV=production`, `APP_DEBUG=false`, `SESSION_SECURE_COOKIE=true`, an exact `SESSION_DOMAIN`, `FRONTEND_URL`, and exact comma-separated `CORS_ALLOWED_ORIGINS`.
4. Create the storage link, then cache configuration: `php artisan storage:link`, `php artisan config:cache`, `php artisan route:cache`, `php artisan view:cache`.
5. Enter maintenance mode, back up, run `php artisan migrate --force`, atomically switch the `current` symlink, restart PHP-FPM/workers, and exit maintenance mode.
6. Check `/up`, `/api/v1/home`, admin login/2FA, one invitation exchange, media delivery, logs, and error rate.

Do not place `ADMIN_PASSWORD` or `ADMIN_2FA_SECRET` in shell history. Initial owner provisioning should use a protected secret store or a one-off interactive command; remove the bootstrap values after seeding and rotate them.

## Nginx essentials

Route unknown non-API paths to `frontend/dist/index.html`. Send `/api` to Laravel's `public/index.php`; never expose the repository, `.env`, `storage/app/private`, or database backups. Set conservative body limits (for example 10 MB), request timeouts, and standard security headers. Cloudflare/WAF may be placed in front, but it does not replace application authorization and rate limiting.

## Scheduler and worker

Cron entry for the deploy user:

```cron
* * * * * cd /var/www/nexio/current/backend && php artisan schedule:run >> /dev/null 2>&1
```

Run workers under systemd/Supervisor and restart them after every release with `php artisan queue:restart`.

## Backups and restore drill

Back up the database and `backend/storage/app/public` daily to encrypted off-host object storage. Keep daily, weekly, and monthly retention tiers appropriate to the company's data policy. Never write dumps inside the public web root.

MySQL example:

```bash
mysqldump --single-transaction --routines --triggers "$DB_DATABASE" | gzip > /srv/backups/nexio-db-$(date +%F-%H%M).sql.gz
tar -C /var/www/nexio/current/backend/storage/app -czf /srv/backups/nexio-media-$(date +%F-%H%M).tar.gz public
```

At least monthly, restore the newest backup into an isolated database and temporary media directory, run `php artisan migrate:status`, compare row/file counts, and exercise `/api/v1/home` plus a private order flow. Record duration and checksum results. A backup is not accepted until this drill succeeds.

## Monitoring

Alert on HTTP 5xx rate, p95 latency, disk usage, failed jobs, backup age, PHP-FPM saturation, database connections, CPU and RAM. Scrub invitation tokens, session cookies, passwords and unnecessary personal data from logs. Keep `X-Request-Id` for correlation.

## Rollback

1. Put the app into maintenance mode and stop workers.
2. Switch `current` back to the previous release and clear/rebuild Laravel caches.
3. Restart PHP-FPM and workers, then run smoke checks.
4. If a migration is not backward compatible, restore the pre-release database/media snapshot. Do not blindly run `migrate:rollback` when the old application may already have written data in a new shape.
5. Document the incident, preserve relevant sanitized logs, and rotate exposed credentials if compromise is suspected.

## Controlled load check

Run only against a private staging instance. A baseline of about 50 representative read/write actions per hour should be followed by a short, bounded burst (for example 10 concurrent public reads for 30 seconds). Capture p50/p95/p99 latency, error rate, CPU, RAM and database connections. Stop if errors rise or resource saturation appears; never direct a denial-of-service test at the public service.
