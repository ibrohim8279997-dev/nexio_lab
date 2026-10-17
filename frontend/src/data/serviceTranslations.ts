import type { Language } from '../i18n'
import type { ServicePlan } from '../types'

type PlanCopy = Pick<ServicePlan, 'name' | 'description' | 'duration' | 'features' | 'notice'> & { extras?: string[] }

const en: Record<string, PlanCopy> = {
  'template-website': { name: 'Template website', description: 'A ready Nexio Lab template adapted to your business.', duration: 'up to 3 weeks–1 month', features: ['Choose a ready Nexio Lab template', 'Adapt the template to your business', 'Replace text and images', 'Configure essential information', 'Up to 3 small revisions', 'One basic Click integration'], extras: ['Additional small revision', 'Additional page', 'Payme', 'Bank payment gateway'], notice: 'The final price may change depending on extra functionality and integrations. Three free revisions cover small changes to text, design, images or existing elements. New pages, modules and functionality are quoted separately.' },
  'turnkey-website': { name: 'Turnkey website', description: 'Custom development tailored to your requirements.', duration: 'from 1.5 months', features: ['Custom homepage', 'Services, About and Contacts pages', 'CRM and admin panel', 'Order management', 'Owner, administrator, manager and courier roles', 'Delivery system', 'Database and backend', 'Custom functionality'], extras: ['Standard payment system', 'Bank payment gateway'], notice: '$450 is the minimum starting price. The final price is confirmed after discussing the project.' },
  'simple-management-system': { name: 'Simple management system', description: 'For small shops, warehouses and small businesses.', duration: '1–1.5 months', features: ['Adaptation to the business', 'Warehouse and sales management', 'Product inventory', 'Database', 'User management', 'Administration area'], notice: null },
  'corporate-system': { name: 'Corporate system', description: 'For companies with several employees and many business processes.', duration: '3–4 months', features: ['CRM and customer database', 'Sales, orders, products and inventory', 'Personal accounts and multiple roles', 'Access control', 'Administrator and executive dashboards', 'Analytics, reports and operation history', 'Notifications', 'Click and Payme included', 'Adaptation to the business'], extras: ['Additional payment system', 'Bank payment gateway', 'Non-standard bank API'], notice: 'The price of non-standard banking APIs is determined after a technical assessment.' },
  'android-apk': { name: 'Android APK', description: 'A turnkey Android application.', duration: '2–3 months', features: ['Android APK and custom design', 'Database and backend', 'Connection to a website, CRM or corporate system', 'Basic CRM inside the application', 'Hosting and domain when required', 'Data synchronisation', 'Application preparation', 'Google Play publishing assistance'], notice: 'Games and complex non-standard applications are quoted individually.' },
  'windows-application': { name: 'Windows Application', description: 'A turnkey Windows desktop application.', duration: '3–4 months', features: ['Windows desktop application', 'Custom interface', 'Database and backend', 'CRM', 'Connection to a website and corporate system', 'Data synchronisation', 'User roles', 'Administration functions', 'Business process management'], notice: 'Complex and non-standard modules are quoted separately after a technical assessment.' },
}

const uz: Record<string, PlanCopy> = {
  'template-website': { name: 'Shablon sayt', description: 'Nexio Lab tayyor shabloni biznesingizga moslashtiriladi.', duration: '3 hafta–1 oygacha', features: ['Nexio Lab tayyor shablonini tanlash', 'Shablonni biznesga moslashtirish', 'Matn va rasmlarni almashtirish', 'Asosiy ma’lumotlarni sozlash', '3 tagacha kichik tuzatish', 'Bitta asosiy Click integratsiyasi'], extras: ['Qo‘shimcha kichik tuzatish', 'Qo‘shimcha sahifa', 'Payme', 'Bank to‘lov shlyuzi'], notice: 'Yakuniy narx qo‘shimcha funksiyalar va integratsiyalarga qarab o‘zgarishi mumkin. Uchta bepul tuzatish matn, dizayn, rasm yoki mavjud elementlardagi kichik o‘zgarishlarni qamrab oladi. Yangi sahifa, modul va funksiyalar alohida hisoblanadi.' },
  'turnkey-website': { name: 'Tayyor sayt', description: 'Mijoz talablariga mos individual ishlab chiqish.', duration: '1,5 oydan boshlab', features: ['Individual bosh sahifa', 'Xizmatlar, Biz haqimizda va Kontaktlar sahifalari', 'CRM va admin panel', 'Buyurtmalarni boshqarish', 'Egasi, administrator, menejer va yetkazib beruvchi rollari', 'Yetkazib berish tizimi', 'Ma’lumotlar bazasi va backend', 'Individual funksiyalar'], extras: ['Standart to‘lov tizimi', 'Bank to‘lov shlyuzi'], notice: '$450 — eng kam boshlang‘ich narx. Yakuniy narx loyiha muhokamasidan keyin aniqlanadi.' },
  'simple-management-system': { name: 'Oddiy boshqaruv tizimi', description: 'Kichik do‘kon, ombor va kichik biznes uchun.', duration: '1–1,5 oy', features: ['Biznesga moslashtirish', 'Ombor va savdoni boshqarish', 'Tovarlar hisobi', 'Ma’lumotlar bazasi', 'Foydalanuvchilarni boshqarish', 'Admin bo‘limi'], notice: null },
  'corporate-system': { name: 'Korporativ tizim', description: 'Bir nechta xodim va ko‘p biznes jarayoniga ega kompaniyalar uchun.', duration: '3–4 oy', features: ['CRM va mijozlar bazasi', 'Savdo, buyurtma, tovar va ombor', 'Shaxsiy kabinetlar va bir nechta rollar', 'Kirish huquqlarini ajratish', 'Administrator va rahbar panellari', 'Analitika, hisobotlar va amallar tarixi', 'Bildirishnomalar', 'Click va Payme kiritilgan', 'Tizimni biznesga moslashtirish'], extras: ['Qo‘shimcha to‘lov tizimi', 'Bank to‘lov shlyuzi', 'Nostandart bank API'], notice: 'Nostandart bank API narxi texnik baholashdan keyin aniqlanadi.' },
  'android-apk': { name: 'Android APK', description: 'Tayyor Android ilovasi.', duration: '2–3 oy', features: ['Android APK va individual dizayn', 'Ma’lumotlar bazasi va backend', 'Sayt, CRM yoki korporativ tizimga ulash', 'Ilova ichidagi asosiy CRM', 'Kerak bo‘lsa hosting va domen', 'Ma’lumotlarni sinxronlash', 'Ilovani tayyorlash', 'Google Play’ga joylashda yordam'], notice: 'O‘yinlar va murakkab nostandart ilovalar alohida hisoblanadi.' },
  'windows-application': { name: 'Windows ilovasi', description: 'Tayyor Windows desktop ilovasi.', duration: '3–4 oy', features: ['Windows desktop ilovasi', 'Individual interfeys', 'Ma’lumotlar bazasi va backend', 'CRM', 'Sayt va korporativ tizimga ulash', 'Ma’lumotlarni sinxronlash', 'Foydalanuvchi rollari', 'Admin funksiyalari', 'Biznes jarayonlarini boshqarish'], notice: 'Murakkab va nostandart modullar texnik baholashdan keyin alohida hisoblanadi.' },
}

function localizePriceLabel(label: string, language: Language) {
  if (language === 'en') return label.replace(/^от\s+/i, 'from ').replace('после оценки', 'after assessment')
  if (language === 'uz') return label.replace(/^от\s+/i, '').replace('после оценки', 'baholashdan keyin')
  return label
}

export function localizeServicePlan(plan: ServicePlan, language: Language): ServicePlan {
  if (language === 'ru') return plan
  const copy = (language === 'en' ? en : uz)[plan.slug]
  if (!copy) return plan
  return {
    ...plan,
    ...copy,
    extras: plan.extras.map((extra, index) => ({ ...extra, name: copy.extras?.[index] || extra.name, price_label: localizePriceLabel(extra.price_label, language) })),
  }
}
