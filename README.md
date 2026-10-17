# Nexio Lab

Nexio Lab is a full-stack company website with a public catalogue, team profiles, a protected client order portal, and a three-part administration area (CRM, employees, and site management).

## Project layout

- `frontend/` — React, TypeScript, Vite, responsive public site and portals.
- `backend/` — Laravel JSON API, cookie sessions, 2FA, CRM, media and content management.
- `backend/openapi.yaml` — versioned API contract.
- `backend/docs/DEPLOYMENT.md` — production deployment, backup, monitoring and rollback guide.

## Local setup

Requirements: PHP 8.3+, Composer, Node.js 20+, and MySQL 8+/PostgreSQL 16+. SQLite is used only by automated tests.

```powershell
cd backend
Copy-Item .env.example .env
composer install
php artisan key:generate
# Configure DB_* and optional ADMIN_* values in .env
php artisan migrate --seed
php artisan storage:link

cd ..\frontend
Copy-Item .env.example .env
npm install
```

Run the two applications in separate terminals:

```powershell
cd backend
php artisan serve --host=127.0.0.1 --port=8000
```

```powershell
cd frontend
npm run dev -- --host 127.0.0.1 --port 5173
```

Open `http://127.0.0.1:5173`. The Vite proxy forwards `/api` to Laravel. Admin is at `/admin`; client invitations open `/client/access#token=...` and the token is removed from the address bar immediately after exchange.

## Verification

```powershell
cd backend
php artisan test --compact
vendor\bin\pint.bat --dirty --format agent

cd ..\frontend
npm run build
```

Seeded content contains only generic service descriptions and an explicit demo site text. No people, clients, portfolio results, or personal contacts are fabricated. Before production, configure real public content through the admin panel and create an owner with a strong password and a valid base32 TOTP secret through protected environment variables.

The referenced hosted design preview returned HTTP 401 and its source was not present in this workspace. The implementation follows both master prompts and the specified blue/white/black direction, but does not claim pixel-identical reproduction of inaccessible source material.
