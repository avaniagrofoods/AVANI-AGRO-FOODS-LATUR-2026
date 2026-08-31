import { createContext, useContext, useState, useEffect } from 'react'

const LanguageContext = createContext()

const translations = {
  en: {
    home: 'Home',
    about: 'About',
    products: 'Products',
    exportProcess: 'Export Process',
    resources: 'Resources',
    blog: 'Blog',
    b2bStore: 'B2B Network',
    contact: 'Contact',
    getQuote: 'Request a B2B Quote',
    viewCatalog: 'View Catalog',
    heroTitle1: 'Indian Agricultural Ingredients for',
    heroTitle2: 'Global B2B Buyers',
    heroTitle3: 'Moringa & Red Onion Powder',
    heroDesc: 'AVANI AGRO FOODS coordinates sourcing of export-grade Moringa Powder and Red Onion Powder from qualified Indian manufacturing and processing partners for importers, distributors, food manufacturers and ingredient buyers worldwide.',
    exploreProducts: 'Explore Products',
    directory: 'Directory'
  },
  ar: {
    home: 'الرئيسية',
    about: 'حولنا',
    products: 'المنتجات',
    exportProcess: 'عملية التصدير',
    resources: 'الموارد والتوصيات',
    blog: 'المدونة',
    b2bStore: 'شبكة B2B',
    contact: 'اتصل بنا',
    getQuote: 'طلب عرض سعر B2B',
    viewCatalog: 'عرض الكتالوج',
    heroTitle1: 'مكونات زراعية هندية',
    heroTitle2: 'للمشترين التجاريين حول العالم',
    heroTitle3: 'مسحوق المورينجا والبصل الأحمر',
    heroDesc: 'تنسق شركة أفاني أجرو فودز توريد مسحوق المورينجا ومسحوق البصل الأحمر من شركاء المعالجة والتصنيع المؤهلين في الهند للمستوردين والموزعين والمصنعين عالمياً.',
    exploreProducts: 'استكشف المنتجات',
    directory: 'الدليل'
  },
  fr: {
    home: 'Accueil',
    about: 'À Propos',
    products: 'Produits',
    exportProcess: 'Processus d\'Export',
    resources: 'Ressources',
    blog: 'Blog',
    b2bStore: 'Réseau B2B',
    contact: 'Contact',
    getQuote: 'Demander un Devis B2B',
    viewCatalog: 'Voir le Catalogue',
    heroTitle1: 'Ingrédients Agricoles Indiens pour',
    heroTitle2: 'Acheteurs B2B Mondiaux',
    heroTitle3: 'Poudre de Moringa & Oignon Rouge',
    heroDesc: 'AVANI AGRO FOODS coordonne l\'approvisionnement en poudre de Moringa et poudre d\'oignon rouge de qualité export auprès de partenaires de transformation indiens qualifiés pour les importateurs, distributeurs et industriels de l\'alimentation.',
    exploreProducts: 'Explorer les Produits',
    directory: 'Annuaire'
  }
}

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(localStorage.getItem('avani_lang') || 'en')
  
  const isRTL = lang === 'ar'

  useEffect(() => {
    localStorage.setItem('avani_lang', lang)
    document.dir = isRTL ? 'rtl' : 'ltr'
    document.documentElement.lang = lang
  }, [lang, isRTL])

  const t = translations[lang] || translations.en

  return (
    <LanguageContext.Provider value={{ lang, setLang, t, isRTL }}>
      {children}
    </LanguageContext.Provider>
  )
}

export const useLanguage = () => useContext(LanguageContext)
