import { createContext, useContext, useState, useEffect } from 'react'

const LanguageContext = createContext()

const translations = {
  en: {
    home: 'Home',
    about: 'About',
    products: 'Products',
    blog: 'Blog',
    affiliate: 'Affiliate',
    b2bStore: 'B2B Store',
    contact: 'Contact',
    getQuote: 'Get Bulk Quote',
    viewCatalog: 'View Catalog',
    heroTitle1: "India's Finest",
    heroTitle2: "Moringa Powder",
    heroTitle3: "Global Export",
    heroDesc: "Premium FSSAI & APEDA-certified Moringa Powder and Red Onion Powder — export-ready for USA, UK, UAE, and 25+ countries.",
    manufacturers: 'Manufacturers DB',
    importers: 'Global Importers',
    directory: 'Directory'
  },
  ar: {
    home: 'الرئيسية',
    about: 'حولنا',
    products: 'المنتجات',
    blog: 'المدونة',
    affiliate: 'برنامج الشركاء',
    b2bStore: 'متجر B2B',
    contact: 'اتصل بنا',
    getQuote: 'احصل على عرض سعر',
    viewCatalog: 'عرض الكتالوج',
    heroTitle1: "أجود أنواع",
    heroTitle2: "مسحوق المورينجا",
    heroTitle3: "تصدير عالمي",
    heroDesc: "مسحوق المورينجا ومسحوق البصل الأحمر الفاخر المعتمد من FSSAI و APEDA - جاهز للتصدير إلى الولايات المتحدة والمملكة المتحدة والإمارات وأكثر من 25 دولة.",
    manufacturers: 'قاعدة بيانات المصنعين',
    importers: 'المستوردون العالميون',
    directory: 'الدليل'
  },
  fr: {
    home: 'Accueil',
    about: 'À Propos',
    products: 'Produits',
    blog: 'Blog',
    affiliate: 'Affilié',
    b2bStore: 'Boutique B2B',
    contact: 'Contact',
    getQuote: 'Obtenir un Devis',
    viewCatalog: 'Voir le Catalogue',
    heroTitle1: "Le meilleur de l'Inde",
    heroTitle2: "Poudre de Moringa",
    heroTitle3: "Exportation Mondiale",
    heroDesc: "Poudre de Moringa et poudre d'oignon rouge de première qualité certifiées FSSAI et APEDA — prêtes à l'exportation vers les USA, le Royaume-Uni, les ÉAU et plus de 25 pays.",
    manufacturers: 'Base de données fabricants',
    importers: 'Importateurs mondiaux',
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

  const t = translations[lang]

  return (
    <LanguageContext.Provider value={{ lang, setLang, t, isRTL }}>
      {children}
    </LanguageContext.Provider>
  )
}

export const useLanguage = () => useContext(LanguageContext)
