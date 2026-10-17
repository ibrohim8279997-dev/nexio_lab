export interface ColorPaletteOption {
  code: string
  name: string
  colors: [string, string, string]
}

export interface FontOption {
  code: string
  name: string
  family: string
}

export interface SiteStyleOption {
  code: string
  name: string
}

export const colorPalettes: ColorPaletteOption[] = [
  { code: 'NX-C01', name: 'Corporate Blue', colors: ['#0B1F4D', '#1687FF', '#EAF6FF'] },
  { code: 'NX-C02', name: 'Midnight Cyan', colors: ['#071426', '#00B8D9', '#F4F8FB'] },
  { code: 'NX-C03', name: 'Graphite Lime', colors: ['#161A1D', '#A3E635', '#F5F7F8'] },
  { code: 'NX-C04', name: 'Classic Burgundy', colors: ['#4A0E1B', '#D6B06A', '#FAF7F2'] },
  { code: 'NX-C05', name: 'Luxury Black Gold', colors: ['#111111', '#C9A227', '#F6F1E6'] },
  { code: 'NX-C06', name: 'Forest Sand', colors: ['#173E34', '#C6A86B', '#F2EFE7'] },
  { code: 'NX-C07', name: 'Violet Tech', colors: ['#2E1065', '#7C3AED', '#EDE9FE'] },
  { code: 'NX-C08', name: 'Coral Navy', colors: ['#152238', '#FF6B5E', '#FFF4F2'] },
  { code: 'NX-C09', name: 'Ocean Mint', colors: ['#0D3B4C', '#2EC4B6', '#ECFFFB'] },
  { code: 'NX-C10', name: 'Terracotta Cream', colors: ['#7A3E2A', '#D98C5F', '#FFF5E9'] },
  { code: 'NX-C11', name: 'Slate Sky', colors: ['#27384A', '#5DA9E9', '#F4F8FC'] },
  { code: 'NX-C12', name: 'Rose Charcoal', colors: ['#2B2228', '#D66A8A', '#FFF0F5'] },
]

export const fontOptions: FontOption[] = [
  { code: 'NX-F01', name: 'Inter', family: 'Inter, Arial, sans-serif' },
  { code: 'NX-F02', name: 'PT Serif', family: '"PT Serif", Georgia, serif' },
  { code: 'NX-F03', name: 'Comfortaa', family: 'Comfortaa, Arial, sans-serif' },
  { code: 'NX-F04', name: 'PT Sans Narrow', family: '"PT Sans Narrow", "Arial Narrow", sans-serif' },
  { code: 'NX-F05', name: 'Lato', family: 'Lato, Arial, sans-serif' },
  { code: 'NX-F06', name: 'Liberation Serif', family: '"Liberation Serif", Georgia, serif' },
  { code: 'NX-F07', name: 'FreeSans', family: 'FreeSans, Arial, sans-serif' },
  { code: 'NX-F08', name: 'DejaVu Sans Mono', family: '"DejaVu Sans Mono", Consolas, monospace' },
  { code: 'NX-F09', name: 'Noto Serif', family: '"Noto Serif", Georgia, serif' },
]

export const siteStyles: SiteStyleOption[] = [
  { code: 'NX-S01', name: 'Classic' },
  { code: 'NX-S02', name: 'Modern' },
  { code: 'NX-S03', name: 'Minimal' },
  { code: 'NX-S04', name: 'Tech' },
  { code: 'NX-S05', name: 'Premium' },
  { code: 'NX-S06', name: 'Creative' },
  { code: 'NX-S07', name: 'Corporate' },
  { code: 'NX-S08', name: 'Dark UI' },
  { code: 'NX-S09', name: 'Editorial' },
]
