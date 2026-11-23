#!/usr/bin/env bash
# Nexio Lab — bitta buyruq bilan serverni yangilash (CloudPanel, sayt foydalanuvchisi nomidan):
#
#   cd ~/htdocs/nexiolab.uz && ./deploy.sh
#
# git pull qiladi, oxirgi muvaffaqiyatli deploy'dan beri o'zgargan fayllarni ko'rsatadi va
# faqat kerakli qadamlarni bajaradi:
#   backend/composer.*              -> composer install
#   backend/database/               -> maintenance rejimi + migrate
#   backend/**                      -> kesh qayta qurish + queue:restart (CRM'ga yuborish navbati)
#   frontend/ (src, package*.json...) -> npm ci + build (frontend/dist) + PM2 orqali 3001 portda berish
# Oxirgi muvaffaqiyatli deploy commit'i .last-deploy faylida saqlanadi, shuning uchun yarim
# yo'lda to'xtagan deploy keyingi safar to'liq qaytadan bajariladi.
#
# Portlar: frontend (statik dist, SPA) — FRONT_PORT=3001. Laravel API PHP-FPM orqali ishlaydi;
# nginx /api va /storage so'rovlarini Laravel'ga (backend/public), qolganini 127.0.0.1:3001 ga yo'naltirishi kerak.
#
# GitHub token faqat birinchi pull'da so'raladi va ~/.git-credentials'da saqlanadi.
#
# Env: FORCE=1 (hamma qadamlar), SKIP_PULL=1, SKIP_FRONTEND=1, BRANCH (main), PHP (php),
#      PM2_APP (nexio-lab), PM2_QUEUE (nexio-lab-queue), FRONT_PORT (3001).
set -euo pipefail

APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BRANCH="${BRANCH:-main}"
PHP="${PHP:-php}"
PM2_APP="${PM2_APP:-nexio-lab}"
PM2_QUEUE="${PM2_QUEUE:-nexio-lab-queue}"
FRONT_PORT="${FRONT_PORT:-3001}"
STATE_FILE="$APP_DIR/.last-deploy"

log()  { printf '\n\033[1;34m==> %s\033[0m\n' "$*"; }
skip() { printf '\033[0;90m    o'\''tkazildi: %s\033[0m\n' "$*"; }
warn() { printf '\033[1;33m    DIQQAT: %s\033[0m\n' "$*"; }
die()  { printf '\033[1;31m%s\033[0m\n' "$*" >&2; exit 1; }

[[ $EUID -ne 0 ]] || die "Root emas, sayt foydalanuvchisi nomidan ishga tushiring (su - <site-user>)."
cd "$APP_DIR"

# ── 1. Kod ──────────────────────────────────────────────────────────────────────────────
if [[ "${SKIP_PULL:-0}" != "1" && "${DEPLOY_REEXEC:-0}" != "1" ]]; then
    log "Kod yangilanmoqda ($BRANCH)"
    if [[ -n "$(git status --porcelain --untracked-files=no)" ]]; then
        git status --short --untracked-files=no >&2
        die "Serverda commit qilinmagan o'zgarishlar bor — avval tekshiring (git diff)."
    fi
    # HTTPS remote: GitHub login/tokenni birinchi marta so'raydi va ~/.git-credentials'ga
    # saqlaydi (fayl faqat shu foydalanuvchiga ochiq, 600). Keyingi safar so'ramaydi.
    if [[ "$(git remote get-url origin)" == https://* && -z "$(git config --get credential.helper || true)" ]]; then
        git config credential.helper "store --file=$HOME/.git-credentials"
        echo "GitHub bir marta so'raydi: Username — GitHub login, Password — token. Keyin eslab qoladi."
    fi
    git fetch --prune origin "$BRANCH"
    git checkout -q "$BRANCH"
    git merge --ff-only "origin/$BRANCH"

    # deploy.sh o'zi yangilangan bo'lsa, yangi versiyasini ishga tushiramiz.
    exec env DEPLOY_REEXEC=1 bash "$APP_DIR/deploy.sh"
fi

NEW_REV="$(git rev-parse HEAD)"
OLD_REV=""
if [[ -f "$STATE_FILE" ]]; then
    OLD_REV="$(tr -d '[:space:]' < "$STATE_FILE")"
    git cat-file -e "${OLD_REV}^{commit}" 2>/dev/null || OLD_REV=""
fi

# ── 2. Nima o'zgardi ────────────────────────────────────────────────────────────────────
FULL=0
[[ "${FORCE:-0}" == "1" || -z "$OLD_REV" ]] && FULL=1

if [[ "$FULL" == "1" ]]; then
    log "To'liq deploy ($([[ -z "$OLD_REV" ]] && echo 'oldingi deploy topilmadi' || echo 'FORCE=1'))"
    CHANGED="$(git ls-files)"
elif [[ "$OLD_REV" == "$NEW_REV" ]]; then
    log "Yangi o'zgarish yo'q ($(git log -1 --format='%h %s')). Hammasini qayta bajarish: FORCE=1 ./deploy.sh"
    exit 0
else
    log "Yangi commitlar"
    git --no-pager log --oneline --no-decorate "$OLD_REV..$NEW_REV"
    log "O'zgargan fayllar"
    git --no-pager diff --stat=120 "$OLD_REV" "$NEW_REV" | tail -n 40
    CHANGED="$(git diff --name-only "$OLD_REV" "$NEW_REV")"
fi

changed() { grep -Eq "$1" <<< "$CHANGED"; }

NEED_COMPOSER=0; NEED_MIGRATE=0; NEED_BACKEND=0; NEED_NPM=0; NEED_FRONTEND=0
{ changed '^backend/composer\.(json|lock)$' || [[ ! -f backend/vendor/autoload.php ]]; } && NEED_COMPOSER=1
changed '^backend/database/' && NEED_MIGRATE=1
changed '^backend/' && NEED_BACKEND=1
{ changed '^frontend/package(-lock)?\.json$' || [[ ! -d frontend/node_modules ]]; } && NEED_NPM=1
{ changed '^frontend/(src/|public/|index\.html$|package(-lock)?\.json$|vite\.config\.|tsconfig)' || [[ ! -d frontend/dist ]]; } && NEED_FRONTEND=1
[[ "${SKIP_FRONTEND:-0}" == "1" ]] && NEED_NPM=0 && NEED_FRONTEND=0

# ── 3. Backend (Laravel) ────────────────────────────────────────────────────────────────
cd "$APP_DIR/backend"

[[ -f .env ]] || die "backend/.env yo'q. Avval: cp .env.example .env && $PHP artisan key:generate (va DB_*, ADMIN_*, NEXIO_CRM_* ni to'ldiring)."

# CRM integratsiyasi sozlanmagan bo'lsa, arizalar 'pending' holatda saqlanadi (yo'qolmaydi, lekin CRM'ga ketmaydi).
for key in NEXIO_CRM_URL NEXIO_CRM_SECRET; do
    grep -Eq "^${key}=.+" .env || warn "$key backend/.env da to'ldirilmagan — loyiha arizalari CRM'ga yuborilmaydi."
done

log "Backend: composer"
if [[ "$NEED_COMPOSER" == "1" ]]; then
    composer install --no-dev --optimize-autoloader --no-interaction --no-progress
else
    skip "composer.json/lock o'zgarmagan"
fi

log "Backend: migratsiyalar"
if [[ "$NEED_MIGRATE" == "1" ]]; then
    # Migratsiya paytida API'ni to'xtatamiz; xato bo'lsa ham qayta yoqiladi.
    "$PHP" artisan down --retry=15 || true
    trap '"$PHP" "$APP_DIR/backend/artisan" up || true' EXIT
    "$PHP" artisan migrate --force
else
    # Yangi fayl bo'lmasa ham, qolib ketgan migratsiya bo'lsa bajariladi (bo'lmasa — hech narsa qilmaydi).
    "$PHP" artisan migrate --force
fi

log "Backend: kesh"
if [[ "$NEED_BACKEND" == "1" ]]; then
    "$PHP" artisan storage:link 2>/dev/null || true
    "$PHP" artisan optimize:clear
    "$PHP" artisan optimize
    "$PHP" artisan queue:restart
else
    skip "backend/ o'zgarmagan"
fi

if [[ "$NEED_MIGRATE" == "1" ]]; then
    "$PHP" artisan up
    trap - EXIT
fi

# CRM'ga yuborish navbati (qayta urinishlar) uchun doimiy worker. queue:restart uni yumshoq to'xtatadi, PM2 qayta ko'taradi.
log "Navbat worker ($PM2_QUEUE)"
if command -v pm2 >/dev/null; then
    if ! pm2 describe "$PM2_QUEUE" >/dev/null 2>&1; then
        pm2 start "$PHP" --name "$PM2_QUEUE" --cwd "$APP_DIR/backend" --interpreter none -- artisan queue:work --sleep=3 --tries=1 --max-time=3600
        pm2 save
    else
        skip "worker allaqachon ishlayapti"
    fi
else
    warn "pm2 topilmadi — 'php artisan queue:work' ni supervisor/PM2 bilan o'zingiz ishga tushiring, aks holda CRM qayta urinishlari ishlamaydi."
fi

# ── 4. Frontend (React/Vite) → $FRONT_PORT ──────────────────────────────────────────────
cd "$APP_DIR/frontend"
log "Frontend (port $FRONT_PORT)"
serve_frontend() {
    command -v pm2 >/dev/null || { echo "pm2 topilmadi — frontend/dist ni $FRONT_PORT portda qo'lda bering." >&2; return 0; }
    # Statik fayllarni SPA rejimida beradi (barcha yo'llar index.html'ga). Port o'zgargan bo'lsa jarayon qayta yaratiladi.
    pm2 delete "$PM2_APP" >/dev/null 2>&1 || true
    pm2 serve "$APP_DIR/frontend/dist" "$FRONT_PORT" --name "$PM2_APP" --spa
    pm2 save
}
if [[ "$NEED_FRONTEND" == "1" ]]; then
    if [[ "$NEED_NPM" == "1" ]]; then
        npm ci --no-audit --no-fund --loglevel=error
    else
        skip "npm ci (package-lock.json o'zgarmagan)"
    fi
    rm -rf dist.new
    npm run build -- --outDir dist.new --emptyOutDir
    # Faqat muvaffaqiyatli build'dan keyin almashtiramiz; eskisi dist.bak'da qoladi.
    rm -rf dist.bak
    [[ -d dist ]] && mv dist dist.bak
    mv dist.new dist
    serve_frontend
else
    skip "frontend fayllari o'zgarmagan"
    # Jarayon yo'q bo'lib qolgan bo'lsa (masalan server qayta ishga tushgan), 3001 portda qayta ko'taramiz.
    if command -v pm2 >/dev/null && ! pm2 describe "$PM2_APP" >/dev/null 2>&1 && [[ -d dist ]]; then serve_frontend; fi
fi

echo "$NEW_REV" > "$STATE_FILE"
log "Tayyor: $(git log -1 --format='%h %s')"
echo "Frontend: http://127.0.0.1:$FRONT_PORT  (nginx: /api va /storage -> Laravel, qolgani -> $FRONT_PORT)"
[[ -d dist.bak ]] && echo "Frontend'ni orqaga qaytarish: cd frontend && rm -rf dist && mv dist.bak dist && pm2 restart $PM2_APP"
exit 0
