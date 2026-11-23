const types = {
  ru: ['Сайт', 'Интеграция с CRM', 'Своя CRM', 'Android-приложение', 'Windows-приложение', 'Маркетплейс', 'Другое'],
  en: ['Website', 'CRM integration', 'Custom CRM', 'Android app', 'Windows app', 'Marketplace', 'Other'],
  uz: ['Veb-sayt', 'CRM integratsiyasi', 'Maxsus CRM', 'Android ilova', 'Windows ilova', 'Marketplace', 'Boshqa'],
}
const keys = ['website', 'crm_integration', 'custom_crm', 'android', 'windows', 'marketplace', 'other']
const build = (t: string[], m: Record<string, string>) => ({ ...m, ...Object.fromEntries(keys.map((k, i) => ['inq.type.' + k, t[i]])) })

export const inquiryMessages = {
  ru: build(types.ru, {
    'inq.title': 'Оставить заявку на проект', 'inq.lead': 'Опишите задачу — заявка сразу попадёт в нашу CRM, и мы свяжемся с вами.',
    'inq.client': 'Контакты', 'inq.project': 'Проект', 'inq.name': 'Ваше имя', 'inq.phone': 'Телефон', 'inq.email': 'Email', 'inq.telegram': 'Telegram',
    'inq.method': 'Как с вами связаться', 'inq.type': 'Тип проекта', 'inq.ptitle': 'Название проекта', 'inq.desc': 'Подробное описание', 'inq.func': 'Нужный функционал',
    'inq.budget': 'Ориентировочный бюджет', 'inq.currency': 'Валюта', 'inq.time': 'Желаемый срок', 'inq.atLeast': 'Укажите хотя бы один способ связи.',
    'inq.b.under_300': 'До $300', 'inq.b.300_500': '$300–500', 'inq.b.500_1000': '$500–1 000', 'inq.b.1000_3000': '$1 000–3 000', 'inq.b.3000_plus': '$3 000+', 'inq.b.not_decided': 'Не определён',
    'inq.submit': 'Отправить заявку', 'inq.sending': 'Отправляем…', 'inq.ok': 'Заявка принята в CRM. Мы свяжемся с вами. Номер: ',
    'inq.queued': 'Заявка сохранена, но пока не подтверждена CRM. Мы отправим её автоматически, повторно отправлять не нужно. Номер: ', 'inq.failed': 'Не удалось отправить заявку. Свяжитесь с нами напрямую.',
    'inq.again': 'Отправить ещё одну', 'inq.tooMany': 'Слишком много попыток. Попробуйте позже.', 'inq.required': 'Обязательное поле',
  }),
  en: build(types.en, {
    'inq.title': 'Send a project inquiry', 'inq.lead': 'Describe your task — the inquiry goes straight into our CRM and we will contact you.',
    'inq.client': 'Contact details', 'inq.project': 'Project', 'inq.name': 'Your name', 'inq.phone': 'Phone', 'inq.email': 'Email', 'inq.telegram': 'Telegram',
    'inq.method': 'Preferred contact method', 'inq.type': 'Project type', 'inq.ptitle': 'Project title', 'inq.desc': 'Detailed description', 'inq.func': 'Required functionality',
    'inq.budget': 'Estimated budget', 'inq.currency': 'Currency', 'inq.time': 'Preferred timeframe', 'inq.atLeast': 'Provide at least one contact method.',
    'inq.b.under_300': 'Under $300', 'inq.b.300_500': '$300–500', 'inq.b.500_1000': '$500–1,000', 'inq.b.1000_3000': '$1,000–3,000', 'inq.b.3000_plus': '$3,000+', 'inq.b.not_decided': 'Not decided',
    'inq.submit': 'Send inquiry', 'inq.sending': 'Sending…', 'inq.ok': 'Your inquiry was received by our CRM. We will contact you. Reference: ',
    'inq.queued': 'Your inquiry is saved but not yet confirmed by our CRM. It will be delivered automatically — no need to resubmit. Reference: ', 'inq.failed': 'We could not send your inquiry. Please contact us directly.',
    'inq.again': 'Send another', 'inq.tooMany': 'Too many attempts. Please try again later.', 'inq.required': 'Required',
  }),
  uz: build(types.uz, {
    'inq.title': 'Loyiha uchun ariza qoldiring', 'inq.lead': 'Vazifani tasvirlang — ariza to‘g‘ridan-to‘g‘ri CRM’ga tushadi va biz siz bilan bog‘lanamiz.',
    'inq.client': 'Aloqa ma’lumotlari', 'inq.project': 'Loyiha', 'inq.name': 'Ismingiz', 'inq.phone': 'Telefon', 'inq.email': 'Email', 'inq.telegram': 'Telegram',
    'inq.method': 'Qulay aloqa usuli', 'inq.type': 'Loyiha turi', 'inq.ptitle': 'Loyiha nomi', 'inq.desc': 'Batafsil tavsif', 'inq.func': 'Kerakli funksionallik',
    'inq.budget': 'Taxminiy byudjet', 'inq.currency': 'Valyuta', 'inq.time': 'Kerakli muddat', 'inq.atLeast': 'Kamida bitta aloqa usulini kiriting.',
    'inq.b.under_300': '$300 gacha', 'inq.b.300_500': '$300–500', 'inq.b.500_1000': '$500–1 000', 'inq.b.1000_3000': '$1 000–3 000', 'inq.b.3000_plus': '$3 000+', 'inq.b.not_decided': 'Hali aniqlanmagan',
    'inq.submit': 'Ariza yuborish', 'inq.sending': 'Yuborilmoqda…', 'inq.ok': 'Ariza CRM tomonidan qabul qilindi. Biz bog‘lanamiz. Raqam: ',
    'inq.queued': 'Ariza saqlandi, lekin CRM hali tasdiqlamadi. U avtomatik yuboriladi, qayta yuborish shart emas. Raqam: ', 'inq.failed': 'Arizani yuborib bo‘lmadi. Biz bilan to‘g‘ridan-to‘g‘ri bog‘laning.',
    'inq.again': 'Yana yuborish', 'inq.tooMany': 'Urinishlar juda ko‘p. Keyinroq urinib ko‘ring.', 'inq.required': 'Majburiy maydon',
  }),
}
