<?php

namespace Database\Seeders;

use App\Models\Service;
use Illuminate\Database\Seeder;

class ServicePlanSeeder extends Seeder
{
    public function run(): void
    {
        $catalog = [
            'web' => [
                ['slug' => 'template-website', 'name' => 'Шаблонный сайт', 'description' => 'Готовый шаблон Nexio Lab, адаптированный под бизнес клиента.', 'price_amount' => 350, 'price_format' => 'fixed', 'duration' => 'до 3 недель – 1 месяца', 'included_revisions' => 3, 'extra_revision_price' => 10, 'features' => ['Выбор готового шаблона Nexio Lab', 'Адаптация шаблона под бизнес', 'Замена текстов и изображений', 'Настройка основной информации', 'До 3 небольших правок', 'Одна базовая интеграция Click'], 'extras' => [['name' => 'Дополнительная небольшая правка', 'price_label' => '+$10', 'price_amount' => 10], ['name' => 'Дополнительная страница', 'price_label' => '+$20', 'price_amount' => 20], ['name' => 'Payme', 'price_label' => '+$35', 'price_amount' => 35], ['name' => 'Банковский шлюз', 'price_label' => 'от +$60', 'price_amount' => 60]], 'notice' => 'Окончательная стоимость может изменяться в зависимости от дополнительного функционала и интеграций. Три бесплатные правки — небольшие изменения текста, дизайна, изображений или существующих элементов. Новые страницы, модули и функционал считаются отдельной работой.'],
                ['slug' => 'turnkey-website', 'name' => 'Сайт «Под ключ»', 'description' => 'Индивидуальная разработка под требования клиента.', 'price_amount' => 450, 'price_format' => 'from', 'duration' => 'от 1,5 месяца', 'included_revisions' => null, 'extra_revision_price' => null, 'features' => ['Индивидуальный Homepage', 'Страницы «Услуги», «О нас» и «Контакты»', 'CRM и административная панель', 'Управление заказами', 'Роли: владелец, администратор, менеджер, доставщик', 'Система доставки', 'База данных и серверная часть', 'Индивидуальный функционал'], 'extras' => [['name' => 'Стандартная платёжная система', 'price_label' => 'от +$35', 'price_amount' => 35], ['name' => 'Банковский шлюз', 'price_label' => 'от +$60', 'price_amount' => 60]], 'notice' => '$450 — минимальная стартовая стоимость. Финальная цена определяется после обсуждения проекта.'],
            ],
            'systems' => [
                ['slug' => 'simple-management-system', 'name' => 'Простая система управления', 'description' => 'Для небольших магазинов, складов и малого бизнеса.', 'price_amount' => 300, 'price_format' => 'fixed', 'duration' => '1–1,5 месяца', 'included_revisions' => 3, 'extra_revision_price' => 10, 'features' => ['Адаптация под бизнес', 'Управление складом и продажами', 'Учёт товаров', 'База данных', 'Управление пользователями', 'Административная часть'], 'extras' => [], 'notice' => null],
                ['slug' => 'corporate-system', 'name' => 'Корпоративная система', 'description' => 'Для компаний с несколькими сотрудниками и большим количеством процессов.', 'price_amount' => 525, 'price_format' => 'from', 'duration' => '3–4 месяца', 'included_revisions' => 5, 'extra_revision_price' => 10, 'features' => ['CRM и база клиентов', 'Продажи, заказы, товары и склад', 'Личные кабинеты и несколько ролей', 'Разграничение прав доступа', 'Панели администратора и руководителя', 'Аналитика, отчёты и история операций', 'Уведомления', 'Click и Payme включены', 'Адаптация системы под бизнес'], 'extras' => [['name' => 'Дополнительная платёжная система', 'price_label' => '+$50', 'price_amount' => 50], ['name' => 'Банковский шлюз', 'price_label' => 'от +$70', 'price_amount' => 70], ['name' => 'Нестандартный банковский API', 'price_label' => 'после оценки', 'price_amount' => null]], 'notice' => 'Стоимость нестандартных банковских API определяется после технической оценки.'],
            ],
            'applications' => [
                ['slug' => 'android-apk', 'name' => 'Android APK', 'description' => 'Android-приложение под ключ.', 'price_amount' => 300, 'price_format' => 'from', 'duration' => '2–3 месяца', 'included_revisions' => 3, 'extra_revision_price' => 10, 'features' => ['Android APK и индивидуальный дизайн', 'База данных и серверная часть', 'Подключение к сайту, CRM или корпоративной системе', 'Базовая CRM внутри приложения', 'Хостинг и домен при необходимости', 'Синхронизация данных', 'Подготовка приложения', 'Помощь с публикацией в Google Play'], 'extras' => [], 'notice' => 'Игры и сложные нестандартные приложения рассчитываются индивидуально.'],
                ['slug' => 'windows-application', 'name' => 'Windows Application', 'description' => 'Windows desktop-приложение под ключ.', 'price_amount' => 450, 'price_format' => 'from', 'duration' => '3–4 месяца', 'included_revisions' => 3, 'extra_revision_price' => 10, 'features' => ['Windows desktop-приложение', 'Индивидуальный интерфейс', 'База данных и серверная часть', 'CRM', 'Подключение к сайту и корпоративной системе', 'Синхронизация данных', 'Роли пользователей', 'Административные функции', 'Управление бизнес-процессами'], 'extras' => [], 'notice' => 'Сложные и нестандартные модули рассчитываются отдельно после технической оценки.'],
            ],
        ];

        foreach ($catalog as $serviceSlug => $plans) {
            $service = Service::query()->where('slug', $serviceSlug)->firstOrFail();

            foreach ($plans as $sortOrder => $plan) {
                $service->plans()->updateOrCreate(
                    ['slug' => $plan['slug']],
                    [...$plan, 'currency' => 'USD', 'sort_order' => $sortOrder, 'is_active' => true],
                );
            }
        }
    }
}
