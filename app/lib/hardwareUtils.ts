import { SEED_LAPTOPS } from './seedData';

export { SEED_LAPTOPS };

export function getExactModelImage(titleRaw: string): string {
  const title = (titleRaw || '').toUpperCase();

  // 1. Apple / iMac / MacBook
  if (title.includes('IMAC') || title.includes('APPLE IMAC')) return '/images/laptops/imac.jpg';
  if (title.includes('MACBOOK') || title.includes('APPLE MACBOOK')) return '/images/laptops/macbook.jpg';

  // 2. Microsoft Surface
  if (title.includes('SURFACE')) return '/images/laptops/surface.jpg';

  // 3. Lenovo ThinkPad
  if (title.includes('THINKPAD') || title.includes('LENOVO') || title.includes('CARBON') || title.includes('T14') || title.includes('T480') || title.includes('T490') || title.includes('T540')) {
    return '/images/laptops/thinkpad.jpg';
  }

  // 4. Dell
  if (title.includes('PRECISION')) return '/images/laptops/precision.jpg';
  if (title.includes('LATITUDE')) return '/images/laptops/latitude.jpg';
  if (title.includes('DELL')) return '/images/laptops/latitude.jpg';

  // 5. HP Workstations & Laptops
  if (title.includes('OMEN')) return '/images/laptops/omen.jpg';
  if (title.includes('VICTUS')) return '/images/laptops/victus.jpg';
  if (title.includes('OMNIBOOK')) return '/images/laptops/omnibook.jpg';
  if (title.includes('ENVY') || title.includes('PAVILION') || title.includes('X360')) return '/images/laptops/envy.jpg';
  if (title.includes('CHROMEBOOK') || title.includes('FORTIS')) return '/images/laptops/chromebook.jpg';
  if (title.includes('ELITEBOOK') || title.includes('HP ELITE')) return '/images/laptops/elitebook.jpg';
  if (title.includes('PROBOOK') || title.includes('HP 250') || title.includes('HP LAPTOP')) return '/images/laptops/probook.jpg';
  if (title.includes('HP ')) return '/images/laptops/probook.jpg';

  // 6. Cisco / Network Switches / Hardware
  if (title.includes('CISCO') || title.includes('CATALYST') || title.includes('SWITCH') || title.includes('لسکیپاگم') || title.includes('دوربین') || title.includes('روخ تراک')) {
    return '/images/laptops/cisco.jpg';
  }

  return '/images/laptops/thinkpad.jpg';
}

export function getPhotoChoicesForModel(titleRaw: string): Array<{ id: string; title: string; url: string; category: string }> {
  const title = (titleRaw || '').toUpperCase();
  
  if (title.includes('IMAC') || title.includes('APPLE IMAC')) {
    return [
      { id: 'imac-1', title: 'نمای روبرو آی‌مک ۲۱.۵ اینچ با کیبورد و موس', url: '/images/laptops/imac.jpg', category: 'Apple iMac' },
      { id: 'imac-2', title: 'نمای استودیو اپل (آی‌مک ۴کی)', url: '/images/laptops/macbook.jpg', category: 'Apple Studio' },
      { id: 'imac-3', title: 'ورک‌استیشن رومیزی نقره‌ای', url: '/images/laptops/surface.jpg', category: 'All-in-One' }
    ];
  }

  if (title.includes('MACBOOK') || title.includes('APPLE MACBOOK')) {
    return [
      { id: 'mac-1', title: 'مک‌بوک پرو ۱۶ اینچ (Space Gray)', url: '/images/laptops/macbook.jpg', category: 'MacBook Pro' },
      { id: 'mac-2', title: 'نمای زاویه‌دار مک‌بوک ایر / پرو با کد برنامه‌نویسی', url: '/images/laptops/envy.jpg', category: 'MacBook Developer' },
      { id: 'mac-3', title: 'مک‌بوک در استودیو طراحی', url: '/images/laptops/imac.jpg', category: 'Apple Ecosystem' }
    ];
  }

  if (title.includes('THINKPAD') || title.includes('LENOVO')) {
    return [
      { id: 'tp-1', title: 'ThinkPad T14 / T480 بدنه کربن با TrackPoint قرمز', url: '/images/laptops/thinkpad.jpg', category: 'ThinkPad Classic' },
      { id: 'tp-2', title: 'ThinkPad X1 Carbon زاویه ۹۰ درجه اداری', url: '/images/laptops/elitebook.jpg', category: 'ThinkPad Ultrabook' },
      { id: 'tp-3', title: 'نمای باز ThinkPad ورک‌استیشن برنامه‌نویسی', url: '/images/laptops/precision.jpg', category: 'ThinkPad Workstation' },
      { id: 'tp-4', title: 'ThinkPad سری T با نمایشگر ۴کی', url: '/images/laptops/latitude.jpg', category: 'ThinkPad T-Series' }
    ];
  }

  if (title.includes('PRECISION') || title.includes('LATITUDE') || title.includes('DELL')) {
    return [
      { id: 'dell-1', title: 'Dell Precision ورک‌استیشن پردازشی با دو دریچه خنک‌کننده', url: '/images/laptops/precision.jpg', category: 'Dell Precision' },
      { id: 'dell-2', title: 'Dell Latitude سری مدیریتی بدنه تیتانیوم', url: '/images/laptops/latitude.jpg', category: 'Dell Latitude' },
      { id: 'dell-3', title: 'Dell اولترابوک باریک لمسی 2-in-1', url: '/images/laptops/envy.jpg', category: 'Dell Touch' },
      { id: 'dell-4', title: 'Dell ورک‌استیشن در محیط شبکه', url: '/images/laptops/thinkpad.jpg', category: 'Dell Enterprise' }
    ];
  }

  if (title.includes('OMEN') || title.includes('VICTUS')) {
    return [
      { id: 'hp-g1', title: 'HP Omen با کیبورد RGB و شاسی سایبرپانک', url: '/images/laptops/omen.jpg', category: 'HP Omen Gaming/AI' },
      { id: 'hp-g2', title: 'HP Victus 16 سری مهندسی سرمه‌ای مات', url: '/images/laptops/victus.jpg', category: 'HP Victus' },
      { id: 'hp-g3', title: 'ورک‌استیشن پردازش هوش مصنوعی HP', url: '/images/laptops/precision.jpg', category: 'HP AI Workstation' }
    ];
  }

  if (title.includes('CISCO') || title.includes('SWITCH') || title.includes('لسکیپاگم')) {
    return [
      { id: 'cs-1', title: 'سوئیچ Cisco Catalyst 48-Port PoE+ با چراغ‌های LED', url: '/images/laptops/cisco.jpg', category: 'Cisco Enterprise' },
      { id: 'cs-2', title: 'تجهیزات رک‌مونت شبکه و سرور', url: '/images/laptops/thinkpad.jpg', category: 'Network Rack' }
    ];
  }

  return [
    { id: 'gen-1', title: 'HP EliteBook آلومینیومی فوق باریک (Grade A++)', url: '/images/laptops/elitebook.jpg', category: 'HP EliteBook' },
    { id: 'gen-2', title: 'HP ProBook سری اینترپرایز مهندسی', url: '/images/laptops/probook.jpg', category: 'HP ProBook' },
    { id: 'gen-3', title: 'HP Envy x360 لمسی چرخشی با قلم', url: '/images/laptops/envy.jpg', category: 'HP Envy Touch' },
    { id: 'gen-4', title: 'HP OmniBook / Ultra سری جدید هوش مصنوعی', url: '/images/laptops/omnibook.jpg', category: 'HP OmniBook' },
    { id: 'gen-5', title: 'لپ‌تاپ مهندسی ThinkPad بدنه کربنی', url: '/images/laptops/thinkpad.jpg', category: 'ThinkPad Alternative' },
    { id: 'gen-6', title: 'ورک‌استیشن Dell Precision قدرتمند', url: '/images/laptops/precision.jpg', category: 'Precision Alternative' }
  ];
}
