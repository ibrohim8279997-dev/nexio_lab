<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('service_plans', function (Blueprint $table) {
            $table->id();
            $table->foreignId('service_id')->constrained()->cascadeOnDelete();
            $table->string('slug');
            $table->string('name');
            $table->text('description')->nullable();
            $table->decimal('price_amount', 10, 2);
            $table->string('price_format', 20)->default('from');
            $table->char('currency', 3)->default('USD');
            $table->string('duration');
            $table->unsignedSmallInteger('included_revisions')->nullable();
            $table->decimal('extra_revision_price', 10, 2)->nullable();
            $table->json('features')->nullable();
            $table->json('extras')->nullable();
            $table->text('notice')->nullable();
            $table->unsignedInteger('sort_order')->default(0);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            $table->unique(['service_id', 'slug']);
            $table->index(['service_id', 'is_active', 'sort_order']);
        });

        if (! DB::table('services')->exists()) {
            return;
        }

        $now = now();
        $directions = [
            ['slug' => 'web', 'name' => 'Веб-сайты', 'short_description' => 'Шаблонные и индивидуальные сайты для бизнеса.', 'description' => 'От быстрой адаптации готового решения до индивидуальной разработки под ключ.', 'sort_order' => 0],
            ['slug' => 'systems', 'name' => 'Системы', 'short_description' => 'Системы управления, CRM, складской и корпоративный учёт.', 'description' => 'Инструменты для управления продажами, товарами, заказами и бизнес-процессами.', 'sort_order' => 1],
            ['slug' => 'applications', 'name' => 'Приложения', 'short_description' => 'Android APK и Windows-приложения под ключ.', 'description' => 'Мобильные и desktop-приложения с серверной частью, базой данных и интеграциями.', 'sort_order' => 2],
        ];

        foreach ($directions as $direction) {
            DB::table('services')->updateOrInsert(
                ['slug' => $direction['slug']],
                [...$direction, 'is_published' => true, 'created_at' => $now, 'updated_at' => $now],
            );
        }

        $plans = [
            'web' => [
                [
                    'slug' => 'template-website', 'name' => 'Шаблонный сайт', 'description' => 'Готовый шаблон Nexio Lab, адаптированный под бизнес клиента.', 'price_amount' => 350, 'price_format' => 'fixed', 'duration' => 'до 3 недель – 1 месяца', 'included_revisions' => 3, 'extra_revision_price' => 10,
                    'features' => ['Выбор готового шаблона Nexio Lab', 'Адаптация шаблона под бизнес', 'Замена текстов и изображений', 'Настройка основной информации', 'До 3 небольших правок', 'Одна базовая интеграция Click'],
                    'extras' => [['name' => 'Дополнительная небольшая правка', 'price_label' => '+$10', 'price_amount' => 10], ['name' => 'Дополнительная страница', 'price_label' => '+$20', 'price_amount' => 20], ['name' => 'Готовая платёжная система, например Payme', 'price_label' => '+$35', 'price_amount' => 35], ['name' => 'Банковский платёжный шлюз', 'price_label' => 'от +$60', 'price_amount' => 60]],
                    'notice' => 'Окончательная стоимость может изменяться в зависимости от дополнительного функционала и интеграций. Три бесплатные правки — небольшие изменения текста, дизайна, изображений или существующих элементов. Новые страницы, модули и функционал считаются отдельной работой.',
                ],
                [
                    'slug' => 'turnkey-website', 'name' => 'Сайт «Под ключ»', 'description' => 'Индивидуальная разработка под требования клиента.', 'price_amount' => 450, 'price_format' => 'from', 'duration' => 'от 1,5 месяца', 'included_revisions' => null, 'extra_revision_price' => null,
                    'features' => ['Индивидуальный Homepage', 'Страницы «Услуги», «О нас» и «Контакты»', 'CRM и административная панель', 'Управление заказами', 'Роли: владелец, администратор, менеджер, доставщик', 'Система доставки', 'База данных и серверная часть', 'Индивидуальный функционал'],
                    'extras' => [['name' => 'Дополнительная стандартная платёжная система', 'price_label' => 'от +$35', 'price_amount' => 35], ['name' => 'Банковский платёжный шлюз', 'price_label' => 'от +$60', 'price_amount' => 60]],
                    'notice' => '$450 — минимальная стартовая стоимость. Финальная цена определяется после обсуждения проекта.',
                ],
            ],
            'systems' => [
                [
                    'slug' => 'simple-management-system', 'name' => 'Простая система управления', 'description' => 'Для небольших магазинов, складов, малого бизнеса, учёта товаров, продаж и заказов.', 'price_amount' => 300, 'price_format' => 'fixed', 'duration' => '1–1,5 месяца', 'included_revisions' => 3, 'extra_revision_price' => 10,
                    'features' => ['Адаптация под бизнес', 'Управление складом и продажами', 'Учёт товаров', 'База данных', 'Базовое управление пользователями', 'Административная часть'],
                    'extras' => [], 'notice' => null,
                ],
                [
                    'slug' => 'corporate-system', 'name' => 'Корпоративная система', 'description' => 'Для компаний с несколькими сотрудниками и большим количеством бизнес-процессов.', 'price_amount' => 525, 'price_format' => 'from', 'duration' => '3–4 месяца', 'included_revisions' => 5, 'extra_revision_price' => 10,
                    'features' => ['CRM и база клиентов', 'Управление продажами, заказами и товарами', 'Складской учёт', 'Личные кабинеты и несколько ролей', 'Разграничение прав доступа', 'Панели администратора и руководителя', 'Аналитика и отчёты', 'История операций и уведомления', 'Click и Payme включены', 'Адаптация под бизнес'],
                    'extras' => [['name' => 'Дополнительная стандартная платёжная система', 'price_label' => '+$50', 'price_amount' => 50], ['name' => 'Банковский платёжный шлюз', 'price_label' => 'от +$70', 'price_amount' => 70], ['name' => 'Нестандартный банковский API', 'price_label' => 'после технической оценки', 'price_amount' => null]],
                    'notice' => 'Стоимость нестандартных банковских API определяется после технической оценки.',
                ],
            ],
            'applications' => [
                [
                    'slug' => 'android-apk', 'name' => 'Android APK', 'description' => 'Android-приложение под ключ с индивидуальным дизайном и интеграциями.', 'price_amount' => 300, 'price_format' => 'from', 'duration' => '2–3 месяца', 'included_revisions' => 3, 'extra_revision_price' => 10,
                    'features' => ['Android APK', 'Индивидуальный дизайн', 'База данных и серверная часть', 'Подключение к сайту, CRM или корпоративной системе', 'Базовая CRM внутри приложения', 'Хостинг и домен при необходимости', 'Синхронизация данных', 'Подготовка приложения', 'Помощь с публикацией в Google Play'],
                    'extras' => [], 'notice' => 'Игры и сложные нестандартные приложения рассчитываются индивидуально в зависимости от сложности проекта.',
                ],
                [
                    'slug' => 'windows-application', 'name' => 'Windows Application', 'description' => 'Windows desktop-приложение для управления бизнес-процессами.', 'price_amount' => 450, 'price_format' => 'from', 'duration' => '3–4 месяца', 'included_revisions' => 3, 'extra_revision_price' => 10,
                    'features' => ['Windows desktop-приложение', 'Индивидуальный интерфейс', 'База данных и серверная часть', 'CRM', 'Подключение к сайту и корпоративной системе', 'Синхронизация данных', 'Роли пользователей', 'Административные функции', 'Управление бизнес-процессами'],
                    'extras' => [], 'notice' => 'Сложные и нестандартные модули рассчитываются отдельно после технической оценки.',
                ],
            ],
        ];

        foreach ($plans as $serviceSlug => $servicePlans) {
            $serviceId = DB::table('services')->where('slug', $serviceSlug)->value('id');

            foreach ($servicePlans as $sortOrder => $plan) {
                DB::table('service_plans')->updateOrInsert(
                    ['service_id' => $serviceId, 'slug' => $plan['slug']],
                    [...$plan, 'features' => json_encode($plan['features'], JSON_UNESCAPED_UNICODE), 'extras' => json_encode($plan['extras'], JSON_UNESCAPED_UNICODE), 'currency' => 'USD', 'sort_order' => $sortOrder, 'is_active' => true, 'created_at' => $now, 'updated_at' => $now],
                );
            }
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('service_plans');
    }
};
