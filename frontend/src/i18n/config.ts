import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import Backend from 'i18next-http-backend';

// Translation resources
const resources = {
  en: {
    translation: {
      // Navigation
      dashboard: 'Dashboard',
      map: 'Interactive Map',
      analytics: 'Analytics',
      alerts: 'Alerts',
      community: 'Community',
      research: 'Research',
      sustainability: 'Sustainability',
      settings: 'Settings',

      // Common
      loading: 'Loading...',
      error: 'Error',
      retry: 'Retry',
      save: 'Save',
      cancel: 'Cancel',
      submit: 'Submit',
      search: 'Search',
      filter: 'Filter',
      export: 'Export',

      // Water Quality
      waterQuality: 'Water Quality',
      bod: 'BOD (Biochemical Oxygen Demand)',
      tds: 'TDS (Total Dissolved Solids)',
      ph: 'pH Level',
      heavyMetals: 'Heavy Metals',
      coliform: 'Coliform Count',
      dissolvedOxygen: 'Dissolved Oxygen',

      // Risk Levels
      safe: 'Safe',
      medium: 'Medium Risk',
      high: 'High Risk',
      critical: 'Critical',

      // Map
      zoomIn: 'Zoom In',
      zoomOut: 'Zoom Out',
      resetView: 'Reset View',
      fullscreen: 'Fullscreen',
      layers: 'Layers',
      timeLapse: 'Time Lapse',

      // Alerts
      newAlert: 'New Alert',
      alertRules: 'Alert Rules',
      notifications: 'Notifications',
      emergencyAlert: 'Emergency Alert',

      // Community
      reportIssue: 'Report Issue',
      discussions: 'Discussions',
      education: 'Educational Resources',
      socialShare: 'Share',

      // Research
      apiAccess: 'API Access',
      bulkDownload: 'Bulk Download',
      documentation: 'Documentation',

      // Sustainability
      carbonFootprint: 'Carbon Footprint',
      sdgGoals: 'SDG Goals',
      complianceMonitoring: 'Compliance Monitoring',
    },
  },
  hi: {
    translation: {
      // Navigation
      dashboard: 'डैशबोर्ड',
      map: 'इंटरैक्टिव मैप',
      analytics: 'एनालिटिक्स',
      alerts: 'अलर्ट',
      community: 'कम्युनिटी',
      research: 'रिसर्च',
      sustainability: 'सस्टेनेबिलिटी',
      settings: 'सेटिंग्स',

      // Common
      loading: 'लोड हो रहा है...',
      error: 'त्रुटि',
      retry: 'पुनः प्रयास',
      save: 'सेव करें',
      cancel: 'रद्द करें',
      submit: 'जमा करें',
      search: 'खोजें',
      filter: 'फिल्टर',
      export: 'एक्सपोर्ट',

      // Water Quality
      waterQuality: 'पानी की गुणवत्ता',
      bod: 'BOD (जैविक ऑक्सीजन मांग)',
      tds: 'TDS (कुल घुलित ठोस)',
      ph: 'pH स्तर',
      heavyMetals: 'भारी धातुएं',
      coliform: 'कोलिफॉर्म काउंट',
      dissolvedOxygen: 'घुलित ऑक्सीजन',

      // Risk Levels
      safe: 'सुरक्षित',
      medium: 'मध्यम जोखिम',
      high: 'उच्च जोखिम',
      critical: 'गंभीर',

      // Map
      zoomIn: 'ज़ूम इन',
      zoomOut: 'ज़ूम आउट',
      resetView: 'व्यू रीसेट करें',
      fullscreen: 'फुलस्क्रीन',
      layers: 'लेयर्स',
      timeLapse: 'टाइम लैप्स',

      // Alerts
      newAlert: 'नया अलर्ट',
      alertRules: 'अलर्ट नियम',
      notifications: 'सूचनाएं',
      emergencyAlert: 'आपातकालीन अलर्ट',

      // Community
      reportIssue: 'समस्या रिपोर्ट करें',
      discussions: 'चर्चा',
      education: 'शैक्षणिक संसाधन',
      socialShare: 'साझा करें',

      // Research
      apiAccess: 'API एक्सेस',
      bulkDownload: 'बल्क डाउनलोड',
      documentation: 'दस्तावेज़ीकरण',

      // Sustainability
      carbonFootprint: 'कार्बन फुटप्रिंट',
      sdgGoals: 'SDG लक्ष्य',
      complianceMonitoring: 'अनुपालन निगरानी',
    },
  },
  te: {
    translation: {
      // Navigation (Telugu)
      dashboard: 'డాష్‌బోర్డ్',
      map: 'ఇంటరాక్టివ్ మ్యాప్',
      analytics: 'అనలిటిక్స్',
      alerts: 'అలర్ట్‌లు',
      community: 'కమ్యూనిటీ',
      research: 'రీసెర్చ్',
      sustainability: 'సస్టైనబిలిటీ',
      settings: 'సెట్టింగ్‌లు',

      // Common
      loading: 'లోడ్ అవుతోంది...',
      error: 'లోపం',
      retry: 'మళ్లీ ప్రయత్నించండి',
      save: 'సేవ్ చేయండి',
      cancel: 'రద్దు చేయండి',
      submit: 'సబ్మిట్ చేయండి',
      search: 'వెతకండి',
      filter: 'ఫిల్టర్',
      export: 'ఎక్స్‌పోర్ట్',

      // Water Quality
      waterQuality: 'నీటి నాణ్యత',
      bod: 'BOD (జైవిక ఆక్సిజన్ డిమాండ్)',
      tds: 'TDS (మొత్తం కరిగిన ఘనపదార్థాలు)',
      ph: 'pH స్థాయి',
      heavyMetals: 'భారీ లోహాలు',
      coliform: 'కోలిఫార్మ్ కౌంట్',
      dissolvedOxygen: 'కరిగిన ఆక్సిజన్',
    },
  },
  ta: {
    translation: {
      // Navigation (Tamil)
      dashboard: 'டாஷ்போர்டு',
      map: 'இண்டராக்டிவ் வரைபடம்',
      analytics: 'பகுப்பாய்வு',
      alerts: 'எச்சரிக்கைகள்',
      community: 'சமூகம்',
      research: 'ஆராய்ச்சி',
      sustainability: 'நிலையான தன்மை',
      settings: 'அமைப்புகள்',

      // Common
      loading: 'ஏற்றுகிறது...',
      error: 'பிழை',
      retry: 'மீண்டும் முயற்சி',
      save: 'சேமிக்க',
      cancel: 'ரத்து',
      submit: 'சமர்ப்பிக்க',
      search: 'தேடல்',
      filter: 'வடிகட்டி',
      export: 'ஏற்றுமதி',

      // Water Quality
      waterQuality: 'நீரின் தரம்',
      bod: 'BOD (உயிரியல் ஆக்ஸிஜன் தேவை)',
      tds: 'TDS (மொத்த கரைந்த திடப்பொருட்கள்)',
      ph: 'pH அளவு',
      heavyMetals: 'கனமான உலோகங்கள்',
      coliform: 'கோலிஃபார்ம் எண்ணிக்கை',
      dissolvedOxygen: 'கரைந்த ஆக்ஸிஜன்',
    },
  },
};

i18n
  .use(Backend)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    debug: process.env.NODE_ENV === 'development',

    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage'],
    },

    interpolation: {
      escapeValue: false,
    },

    react: {
      useSuspense: false,
    },
  });

export default i18n;
