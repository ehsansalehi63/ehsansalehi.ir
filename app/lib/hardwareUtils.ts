import { SEED_LAPTOPS } from './seedData';

export { SEED_LAPTOPS };

export function getExactModelImage(titleRaw: string): string {
  const title = (titleRaw || '').toUpperCase();

  // 1. Apple / iMac / MacBook
  if (title.includes('IMAC') || title.includes('APPLE IMAC')) return '/images/laptops/imac_stock.jpg';
  if (title.includes('MACBOOK') || title.includes('APPLE MACBOOK')) return '/images/laptops/macbook.jpg';

  // 2. Microsoft Surface
  if (title.includes('SURFACE')) return '/images/laptops/surface_stock.jpg';

  // 3. Lenovo ThinkPad
  if (title.includes('THINKPAD') || title.includes('LENOVO') || title.includes('CARBON') || title.includes('T14') || title.includes('T480') || title.includes('T490') || title.includes('T540')) {
    return '/images/laptops/thinkpad_stock.jpg';
  }

  // 4. Dell
  if (title.includes('PRECISION') && (title.includes('7760') || title.includes('7770'))) return '/images/laptops/precision7770_stock.jpg';
  if (title.includes('PRECISION')) return '/images/laptops/precision_stock.webp';
  if (title.includes('LATITUDE') && title.includes('3310')) return '/images/laptops/latitude3310_stock.jpg';
  if (title.includes('LATITUDE') && title.includes('7420')) return '/images/laptops/latitude7420_stock.png';
  if (title.includes('LATITUDE')) return '/images/laptops/latitude_stock.png';
  if (title.includes('DELL')) return '/images/laptops/latitude_stock.png';

  // 5. HP Workstations & Laptops
  if (title.includes('OMEN')) return '/images/laptops/omen_stock.webp';
  if (title.includes('VICTUS')) return '/images/laptops/victus_stock.jpg';
  if (title.includes('OMNIBOOK')) return '/images/laptops/omnibook_stock.webp';
  if (title.includes('ENVY') || title.includes('PAVILION') || title.includes('X360')) return '/images/laptops/envy_stock.jpg';
  if (title.includes('CHROMEBOOK') || title.includes('FORTIS')) return '/images/laptops/chromebook.jpg';
  if (title.includes('ELITEBOOK') || title.includes('HP ELITE')) return '/images/laptops/elitebook_stock.png';
  if (title.includes('PROBOOK') || title.includes('HP 250') || title.includes('HP LAPTOP')) return '/images/laptops/probook_stock.jpg';
  if (title.includes('HP ')) return '/images/laptops/probook_stock.jpg';

  // 6. Cisco / Network Switches / Hardware
  if (title.includes('CISCO') || title.includes('CATALYST') || title.includes('SWITCH') || title.includes('شبکه') || title.includes('لوازم')) {
    return '/images/laptops/cisco.jpg';
  }

  // 7. Stylus / Accessories
  if (title.includes('قلم') || title.includes('STYLUS')) return '/images/laptops/elitebook.jpg';

  return '/images/laptops/thinkpad_stock.jpg';
}

export function getPhotoChoicesForModel(titleRaw: string): Array<{ id: string; title: string; url: string; category: string }> {
  const title = (titleRaw || '').toUpperCase();
  
  if (title.includes('IMAC') || title.includes('APPLE IMAC')) {
    return [
      { id: 'imac-1', title: 'آی‌مک ۲۱.۵ اینچ استوک با کیبورد و موس', url: '/images/laptops/imac_stock.jpg', category: 'Apple iMac' },
      { id: 'imac-2', title: 'نمای استودیو اپل (آی‌مک ۴کی)', url: '/images/laptops/imac.jpg', category: 'Apple Studio' },
    ];
  }

  if (title.includes('THINKPAD') || title.includes('LENOVO')) {
    return [
      { id: 'tp-1', title: 'ThinkPad T14 / T480 بدنه کربن با TrackPoint قرمز', url: '/images/laptops/thinkpad_stock.jpg', category: 'ThinkPad Classic' },
      { id: 'tp-2', title: 'ThinkPad X1 Carbon زاویه ۹۰ درجه اداری', url: '/images/laptops/thinkpad.jpg', category: 'ThinkPad Ultrabook' },
    ];
  }

  if (title.includes('PRECISION') && (title.includes('7770') || title.includes('7760'))) {
    return [
      { id: 'dell-p7-1', title: 'Dell Precision 7770 ورک‌استیشن رده‌بالا', url: '/images/laptops/precision7770_stock.jpg', category: 'Dell Precision 7770' },
      { id: 'dell-p7-2', title: 'Dell Precision 5560 ورک‌استیشن حرفه‌ای', url: '/images/laptops/precision_stock.webp', category: 'Dell Precision 5560' },
    ];
  }

  if (title.includes('PRECISION') || title.includes('LATITUDE') || title.includes('DELL')) {
    return [
      { id: 'dell-1', title: 'Dell Precision ورک‌استیشن پردازشی', url: '/images/laptops/precision_stock.webp', category: 'Dell Precision' },
      { id: 'dell-2', title: 'Dell Latitude سری مدیریتی', url: '/images/laptops/latitude_stock.png', category: 'Dell Latitude' },
    ];
  }

  if (title.includes('OMEN') || title.includes('VICTUS')) {
    return [
      { id: 'hp-g1', title: 'HP Omen گیمینگ با کیبورد RGB', url: '/images/laptops/omen_stock.webp', category: 'HP Omen Gaming' },
      { id: 'hp-g2', title: 'HP Victus گیمینگ مقرون‌به‌صرفه', url: '/images/laptops/victus_stock.jpg', category: 'HP Victus' },
    ];
  }

  if (title.includes('ELITEBOOK') || title.includes('HP ELITE')) {
    return [
      { id: 'hp-e1', title: 'HP EliteBook بیزنس پریمیوم', url: '/images/laptops/elitebook_stock.png', category: 'HP EliteBook' },
      { id: 'hp-e2', title: 'HP EliteBook آلومینیومی فوق باریک', url: '/images/laptops/elitebook.jpg', category: 'HP EliteBook Alt' },
    ];
  }

  return [
    { id: 'gen-1', title: 'HP EliteBook آلومینیومی فوق باریک (Grade A++)', url: '/images/laptops/elitebook_stock.png', category: 'HP EliteBook' },
    { id: 'gen-2', title: 'HP ProBook سری اینترپرایز', url: '/images/laptops/probook_stock.jpg', category: 'HP ProBook' },
    { id: 'gen-3', title: 'HP Envy x360 لمسی چرخشی', url: '/images/laptops/envy_stock.jpg', category: 'HP Envy Touch' },
    { id: 'gen-4', title: 'HP OmniBook AI نسل جدید', url: '/images/laptops/omnibook_stock.webp', category: 'HP OmniBook' },
  ];
}
