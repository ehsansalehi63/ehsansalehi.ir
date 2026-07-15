export type Language = 'fa' | 'en';

export interface Translations {
  // Navigation
  navHome: string;
  navNews: string;
  navProjects: string;
  navServices: string;
  navSkills: string;
  navAbout: string;
  navContact: string;
  navLogin: string;
  navRegister: string;
  navDashboard: string;
  navLogout: string;

  // Hero Section (`UnifiedHeroCard`)
  heroBadge: string;
  heroRole: string;
  heroName: string;
  heroSubtitle: string;
  heroTagline: string;
  heroDesc: string;
  heroCtaPrimary: string;
  heroCtaSecondary: string;
  heroSocialHeader: string;
  heroLiveNewsTitle: string;
  heroOnline: string;
  heroReadAI: string;
  heroViewAllNews: string;

  // Services Section
  servicesTitle: string;
  servicesSubtitle: string;
  service1Title: string;
  service1Desc: string;
  service2Title: string;
  service2Desc: string;
  service3Title: string;
  service3Desc: string;
  service4Title: string;
  service4Desc: string;

  // Projects Section
  projectsTitle: string;
  projectsSubtitle: string;
  projectsViewAll: string;
  projectsNoData: string;

  // About Section
  aboutTitle: string;
  aboutSubtitle: string;
  aboutDesc1: string;
  aboutDesc2: string;
  aboutExpYears: string;
  aboutExpLabel: string;
  aboutProjectsCount: string;
  aboutProjectsLabel: string;
  aboutClientsCount: string;
  aboutClientsLabel: string;

  // Skills Section
  skillsTitle: string;
  skillsSubtitle: string;

  // Contact Section
  contactTitle: string;
  contactSubtitle: string;
  contactEmail: string;
  contactPhone: string;
  contactLocation: string;
  contactLocationVal: string;
  contactFormName: string;
  contactFormEmail: string;
  contactFormMessage: string;
  contactFormSubmit: string;
  contactFormSubmitting: string;

  // Footer
  footerRights: string;
}

export const dictionary: Record<Language, Translations> = {
  fa: {
    navHome: 'خانه',
    navNews: 'اخبار فناوری و رمزارز 🔥',
    navProjects: 'پروژه‌ها',
    navServices: 'خدمات',
    navSkills: 'مهارت‌ها',
    navAbout: 'درباره',
    navContact: 'تماس',
    navLogin: 'ورود',
    navRegister: 'ثبت‌نام',
    navDashboard: 'داشبورد',
    navLogout: 'خروج',

    heroBadge: '👑 ۲۰+ سال سابقه درخشان',
    heroRole: 'معمار IT و امنیت',
    heroName: 'مهندس احسان صالحی',
    heroSubtitle: 'مشاور فناوری اطلاعات، معمار شبکه، امنیت سایبری و هوش مصنوعی',
    heroTagline: 'ساده‌سازی چالش‌های پیچیده در دنیای فناوری',
    heroDesc: 'از طراحی و ایمن‌سازی شبکه‌های پیشرفته سازمانی تا پیاده‌سازی سیستم‌های مدرن وب با Next.js و اتوماسیون‌های هوش مصنوعی؛ پروژه‌های شما با بالاترین استاندارد مهندسی تحویل داده می‌شود.',
    heroCtaPrimary: 'چطور می‌تونم کمک کنم؟',
    heroCtaSecondary: 'نمونه کارها و پروژه‌ها',
    heroSocialHeader: 'ارتباط مستقیم و سریع در شبکه‌های اجتماعی:',
    heroLiveNewsTitle: 'اخبار فوری فناوری و رمزارز',
    heroOnline: 'آنلاین',
    heroReadAI: 'مطالعه تحلیل هوش مصنوعی خبر',
    heroViewAllNews: 'مشاهده تمام اخبار',

    servicesTitle: 'تخصص‌ها و خدمات اصلی',
    servicesSubtitle: 'راهکارهای جامع فناوری اطلاعات برای سازمان‌ها و کسب‌وکارها',
    service1Title: 'طراحی و معماری شبکه',
    service1Desc: 'راه‌اندازی زیرساخت‌های شبکه سازمانی، سیسکو، میکروتیک و مانیتورینگ پیشرفته Zabbix.',
    service2Title: 'امنیت سایبری و تست نفوذ',
    service2Desc: 'ارزیابی امنیتی، ایمن‌سازی سرورها، فایروال، سخت‌سازی سیستم‌ها و مقابله با حملات سایبری.',
    service3Title: 'توسعه وب و فول‌استک',
    service3Desc: 'طراحی وب‌سایت‌های مدرن، پرسرعت و مقیاس‌پذیر با Next.js 16، React، Node.js و دیتابیس.',
    service4Title: 'هوش مصنوعی و اتوماسیون',
    service4Desc: 'یکپارچه‌سازی مدل‌های هوش مصنوعی (OpenAI/LLM)، خزنده‌های خودکار اخبار و چت‌بات‌های اختصاصی.',

    projectsTitle: 'منتخب نمونه کارها و پروژه‌ها',
    projectsSubtitle: 'بخشی از دستاوردهای مهندسی در توسعه وب و زیرساخت شبکه',
    projectsViewAll: 'مشاهده لیست کامل پروژه‌ها ←',
    projectsNoData: 'پروژه‌ای در دسته‌بندی فعلی یافت نشد.',

    aboutTitle: 'درباره مهندس احسان صالحی',
    aboutSubtitle: 'دو دهه عشق به فناوری، حل مسئله و خلق راهکارهای پایدار',
    aboutDesc1: 'من احسان صالحی هستم؛ فعالیت حرفه‌ای خود را در دنیای شبکه و امنیت اطلاعات آغاز کردم و در طول ۲۰ سال گذشته، در ده‌ها پروژه بزرگ ملی و سازمانی به عنوان معمار زیرساخت و مشاور ارشد IT حضور داشته‌ام.',
    aboutDesc2: 'امروز، با ترکیب تجربیات عمیق شبکه و معماری سیستم با جدیدترین فناوری‌های توسعه وب (Next.js) و هوش مصنوعی، راهکارهایی را می‌سازم که هم پایدار، هم پرسرعت و هم کاملاً امن هستند.',
    aboutExpYears: '۲۰+',
    aboutExpLabel: 'سال تجربه درخشان',
    aboutProjectsCount: '۵۰+',
    aboutProjectsLabel: 'پروژه موفق سازمانی',
    aboutClientsCount: '۱۰۰٪',
    aboutClientsLabel: 'رضایت کارفرمایان',

    skillsTitle: 'مهارت‌های تخصصی و فناوری‌ها',
    skillsSubtitle: 'تسلط بر مدرن‌ترین ابزارها و استانداردهای مهندسی IT',

    contactTitle: 'ارتباط با ما و درخواست مشاوره',
    contactSubtitle: 'برای شروع پروژه یا دریافت مشاوره تخصصی، فرم زیر را تکمیل کنید یا از طریق پیام‌رسان‌ها در ارتباط باشید.',
    contactEmail: 'ایمیل رسمی',
    contactPhone: 'تلفن و واتساپ',
    contactLocation: 'موقعیت مکانی',
    contactLocationVal: 'ایران، اصفهان',
    contactFormName: 'نام و نام خانوادگی',
    contactFormEmail: 'آدرس ایمیل',
    contactFormMessage: 'متن پیام یا جزئیات پروژه...',
    contactFormSubmit: 'ارسال پیام به احسان صالحی 🚀',
    contactFormSubmitting: 'در حال ارسال پیام...',

    footerRights: '© ۱۴۰۴ احسان صالحی – تمامی حقوق محفوظ است',
  },
  en: {
    navHome: 'Home',
    navNews: 'Tech & Crypto News 🔥',
    navProjects: 'Projects',
    navServices: 'Services',
    navSkills: 'Skills',
    navAbout: 'About',
    navContact: 'Contact',
    navLogin: 'Login',
    navRegister: 'Register',
    navDashboard: 'Dashboard',
    navLogout: 'Logout',

    heroBadge: '👑 20+ Years Experience',
    heroRole: 'IT & Security Architect',
    heroName: 'Eng. Ehsan Salehi',
    heroSubtitle: 'IT Consultant, Enterprise Network Architect, Cyber Security & AI Engineer',
    heroTagline: 'Simplifying Complex Technology Challenges',
    heroDesc: 'From designing and securing resilient enterprise corporate networks to building modern Next.js cloud architectures and cutting-edge AI automations — delivering world-class engineering standards.',
    heroCtaPrimary: 'How Can I Help You?',
    heroCtaSecondary: 'Portfolio & Projects',
    heroSocialHeader: 'Direct & Fast Communication Channels:',
    heroLiveNewsTitle: 'Live Tech & Crypto AI News Portal',
    heroOnline: 'Online',
    heroReadAI: 'Read Full AI Analysis & Summary',
    heroViewAllNews: 'View All News & Articles',

    servicesTitle: 'Core IT & Cloud Services',
    servicesSubtitle: 'Comprehensive Enterprise Technology Solutions for Businesses',
    service1Title: 'Network Architecture & Infrastructure',
    service1Desc: 'Enterprise network setup, Cisco, MikroTik routing, VLAN design, and Zabbix infrastructure monitoring.',
    service2Title: 'Cyber Security & Penetration Testing',
    service2Desc: 'Security auditing, server hardening, firewall configuration, vulnerability assessment, and threat mitigation.',
    service3Title: 'Full-Stack Web Development',
    service3Desc: 'Modern, high-speed, scalable web applications built with Next.js 16, React, Node.js, and Cloud SQL.',
    service4Title: 'AI Integration & Automation',
    service4Desc: 'Custom LLM integration (OpenAI/ChatGPT), automated news crawlers, smart chatbots, and workflow automation.',

    projectsTitle: 'Featured Portfolio & Projects',
    projectsSubtitle: 'Selected Engineering Achievements in Web Dev & IT Infrastructure',
    projectsViewAll: 'View Complete Projects List →',
    projectsNoData: 'No projects found in this category.',

    aboutTitle: 'About Eng. Ehsan Salehi',
    aboutSubtitle: 'Two Decades of Passion for Technology, Problem Solving, and Resilient Architecture',
    aboutDesc1: 'I am Ehsan Salehi. I began my professional journey in network architecture and information security, spending the past 20 years leading enterprise IT infrastructure and high-security system design for top-tier organizations.',
    aboutDesc2: 'Today, by combining deep networking expertise with modern web development frameworks (Next.js) and artificial intelligence, I build digital solutions that are secure, lightning-fast, and built to scale.',
    aboutExpYears: '20+',
    aboutExpLabel: 'Years of Experience',
    aboutProjectsCount: '50+',
    aboutProjectsLabel: 'Successful Enterprise Projects',
    aboutClientsCount: '100%',
    aboutClientsLabel: 'Client Satisfaction',

    skillsTitle: 'Technical Skills & Stack',
    skillsSubtitle: 'Mastery over Industry-Leading IT Standards and Development Tools',

    contactTitle: 'Get in Touch & Request Consultation',
    contactSubtitle: 'Fill out the form below to start a project or get specialized technical consultation, or reach out via direct messengers.',
    contactEmail: 'Official Email',
    contactPhone: 'WhatsApp & Phone',
    contactLocation: 'Location',
    contactLocationVal: 'Isfahan, Iran',
    contactFormName: 'Full Name',
    contactFormEmail: 'Email Address',
    contactFormMessage: 'Your message or project details...',
    contactFormSubmit: 'Send Message to Ehsan Salehi 🚀',
    contactFormSubmitting: 'Sending message...',

    footerRights: '© 2026 Ehsan Salehi – All Rights Reserved',
  }
};
