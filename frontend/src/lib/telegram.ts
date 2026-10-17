import type { DesignSelection, ProjectInquiryContact, ServiceExtra, ServicePlan } from '../types'
import type { Language } from '../i18n'

const telegramCopy: Record<Language, Record<string, string>> = {
  ru: { hello: 'Здравствуйте! Я хочу обсудить проект с Nexio Lab.', service: 'Услуга', startingPrice: 'Стартовая стоимость', duration: 'Срок', extras: 'Дополнительно', total: 'Предварительная сумма', from: 'от', design: 'Коды дизайна', palette: 'Цветовая гамма', font: 'Шрифт', style: 'Стиль сайта', interest: 'Меня интересует:', prompt: '[Пожалуйста, кратко опишите проект]', closing: 'Хотел бы узнать итоговую стоимость и обсудить детали.' },
  en: { hello: 'Hello! I would like to discuss a project with Nexio Lab.', service: 'Service', startingPrice: 'Starting price', duration: 'Timeline', extras: 'Additional options', total: 'Estimated total', from: 'from', design: 'Design codes', palette: 'Color palette', font: 'Font', style: 'Website style', interest: 'I am interested in:', prompt: '[Please describe your project briefly]', closing: 'I would like to confirm the final price and discuss the details.' },
  uz: { hello: 'Assalomu alaykum! Nexio Lab bilan loyihani muhokama qilmoqchiman.', service: 'Xizmat', startingPrice: 'Boshlang‘ich narx', duration: 'Muddat', extras: 'Qo‘shimcha imkoniyatlar', total: 'Taxminiy summa', from: 'dan boshlab', design: 'Dizayn kodlari', palette: 'Ranglar palitrasi', font: 'Shrift', style: 'Sayt uslubi', interest: 'Meni qiziqtiradi:', prompt: '[Iltimos, loyihani qisqacha yozing]', closing: 'Yakuniy narxni bilib, tafsilotlarni muhokama qilmoqchiman.' },
}

export function formatServicePrice(plan: Pick<ServicePlan, 'price_amount' | 'price_format' | 'currency'>, fromLabel = 'от') {
  const amount = Number(plan.price_amount).toLocaleString('en-US', { maximumFractionDigits: 2 })
  const symbol = plan.currency === 'USD' ? '$' : plan.currency + ' '
  return (plan.price_format === 'from' ? fromLabel + ' ' : '') + symbol + amount
}

export function generateTelegramMessage(plan: ServicePlan, selectedOptions: ServiceExtra[] = [], design: DesignSelection = {}, language: Language = 'ru') {
  const copy = telegramCopy[language]
  const lines = [
    copy.hello,
    '',
    copy.service + ': ' + plan.name,
    copy.startingPrice + ': ' + formatServicePrice(plan, copy.from),
    copy.duration + ': ' + plan.duration,
  ]

  if (selectedOptions.length) {
    lines.push('', copy.extras + ':')
    selectedOptions.forEach((option) => lines.push('- ' + option.name + ' — ' + option.price_label + ';'))
    const numericOptions = selectedOptions.filter((option) => option.price_amount !== null && option.price_amount !== undefined)
    if (numericOptions.length === selectedOptions.length) {
      const total = Number(plan.price_amount) + numericOptions.reduce((sum, option) => sum + Number(option.price_amount), 0)
      lines.push('', copy.total + ': ' + (plan.price_format === 'from' ? copy.from + ' ' : '') + (plan.currency === 'USD' ? '$' : plan.currency + ' ') + total.toLocaleString('en-US') + '.')
    }
  }

  const designCodes = [design.paletteCode, design.fontCode, design.styleCode].filter(Boolean)
  if (designCodes.length) {
    lines.push('', copy.design + ':')
    if (design.paletteCode) lines.push(copy.palette + ': ' + design.paletteCode)
    if (design.fontCode) lines.push(copy.font + ': ' + design.fontCode)
    if (design.styleCode) lines.push(copy.style + ': ' + design.styleCode)
  }

  lines.push('', copy.interest, copy.prompt, '', copy.closing)
  return lines.join('\n')
}

export function telegramProjectUrl(contact: ProjectInquiryContact | null | undefined, plan: ServicePlan, selectedOptions: ServiceExtra[] = [], design: DesignSelection = {}, language: Language = 'ru') {
  return telegramContactUrl(contact, generateTelegramMessage(plan, selectedOptions, design, language))
}

export function telegramContactUrl(contact: ProjectInquiryContact | null | undefined, message: string) {
  if (!contact?.active || !contact.telegram) return null
  const username = contact.telegram.trim().replace(/^https?:\/\/t\.me\//i, '').replace(/^@/, '').split(/[/?#]/)[0]
  if (!username) return null
  return 'https://t.me/' + encodeURIComponent(username) + '?text=' + encodeURIComponent(message)
}
