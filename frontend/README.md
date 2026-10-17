# Nexio Lab frontend

Responsive React + TypeScript frontend for the Nexio Lab public site, secure client flow and protected administration interface.

## Run locally

```bash
npm install
copy .env.example .env
npm run dev
```

The app runs at `http://localhost:5173`. Vite proxies `/api` to `http://localhost:8000` by default. Set `VITE_PROXY_TARGET` to a different Laravel origin when needed. Production builds use `VITE_API_URL` (default: `/api/v1`).

```bash
npm run typecheck
npm run build
```

## API contract

- Public: `GET /home`, `/site`, `/services`, `/services/:slug`, `/projects`, `/projects/:slug`, `/employees`, `/employees/:slug`.
- Client: `POST /client/access/exchange`, then cookie-scoped `GET /client/order`, `PUT /client/order/brief`, `POST /client/order/review`.
- Admin: `/admin/auth/*`, `/admin/orders`, `/admin/reviews`, `/admin/employees`, `/admin/projects`, `/admin/media`, `/admin/site-settings`, `/admin/services`.
- Success payloads use `{ "data": ... }`; failures support `{ "error": { "code", "message", "fields", "request_id" } }` and the simpler Laravel `{ "message", "errors" }` during transition.

Authentication is cookie-based (`credentials: include`). Invitation tokens are read from `/client/access#token=...`, immediately removed from the address bar, exchanged server-side and never placed in local or session storage.

## Important caveat

The referenced hosted preview returned HTTP 401 and the original React source was not present in the repository. This implementation therefore follows the written master prompt and its blue/white/black visual direction; it does not claim pixel-identical preservation of the inaccessible design. No people, portfolio items, performance statistics, or personal contacts are fabricated. Their honest empty states remain visible until Laravel returns published records.

For direct route refreshes in production, configure the web server to fall back to `index.html` for non-API paths.
