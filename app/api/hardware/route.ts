import { NextRequest, NextResponse } from 'next/server';
import { SEED_LAPTOPS } from '@/lib/seedData';
import { makeUniqueHardwareSlug } from '@/lib/hardwareSlug';
import { applyHardwareMarkup, formatHardwarePrice } from '@/lib/hardwarePrice';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const slugCounts: Record<string, number> = {};

// Utility: Get image for model (fallback if not in seed data)
function getImageForModel(item: typeof SEED_LAPTOPS[0]): string {
  return item.image_url || '/images/laptops/thinkpad_stock.jpg';
}

// Utility: Get category
function getCategory(model: string): string {
  const m = model.toUpperCase();
  if (m.includes('PRECISION')) return 'ورک‌استیشن مهندسی';
  if (m.includes('OMEN') || m.includes('VICTUS')) return 'لپ‌تاپ گیمینگ / AI';
  if (m.includes('OMNIBOOK')) return 'لپ‌تاپ AI نسل جدید';
  if (m.includes('ELITEBOOK')) return 'لپ‌تاپ بیزنس پریمیوم';
  if (m.includes('PROBOOK') || m.includes('HP 250') || m.includes('HP LAPTOP')) return 'لپ‌تاپ اداری / مهندسی';
  if (m.includes('ENVY') || m.includes('PAVILION')) return 'لپ‌تاپ خانگی / حرفه‌ای';
  if (m.includes('CHROMEBOOK')) return 'کروم‌بوک آموزشی';
  if (m.includes('THINKPAD') || m.includes('LENOVO')) return 'لپ‌تاپ مهندسی';
  if (m.includes('LATITUDE')) return 'لپ‌تاپ بیزنس';
  if (m.includes('DELL')) return 'لپ‌تاپ مهندسی';
  if (m.includes('SURFACE')) return 'لپ‌تاپ پریمیوم';
  if (m.includes('IMAC') || m.includes('APPLE')) return 'آل‌این‌وان اپل';
  if (m.includes('شبکه') || m.includes('CISCO')) return 'تجهیزات شبکه';
  if (m.includes('قلم') || m.includes('STYLUS')) return 'لوازم جانبی';
  return 'لپ‌تاپ مهندسی';
}

// Comprehensive descriptions for each product based on specs
function getDescription(item: typeof SEED_LAPTOPS[0]): string {
  const m = item.model.toUpperCase();
  const ram = item.ram.toLowerCase();
  const gpu = item.gpu.toUpperCase();
  const cpu = item.cpu.toUpperCase();
  const hasTouch = m.includes('TOUCH') || item.display.includes('TOUCH');
  const hasX360 = m.includes('X360') || m.includes('2 IN 1');
  const isGaming = m.includes('OMEN') || m.includes('VICTUS');
  const isWorkstation = m.includes('PRECISION');
  const hasQuadro = gpu.includes('QUADRO') || gpu.includes('RTX') || gpu.includes('T1200') || gpu.includes('T2000') || gpu.includes('P2000');
  const isAiReady = m.includes('OMNIBOOK') || m.includes('NPU') || m.includes('AI BOOST') || cpu.includes('ULTRA') || cpu.includes('SNAPDRAGON');
  const isLatestGen = cpu.includes('12') || cpu.includes('13') || cpu.includes('ULTRA') || cpu.includes('SNAPDRAGON');

  if (m.includes('IMAC')) {
    return `آی‌مک ۲۱.۵ اینچ ۲۰۱۹ اپل، یک آل‌این‌وان حرفه‌ای با نمایشگر خیره‌کننده 4K Retina است که برای طراحان گرافیک، تدوین‌گران ویدیو، عکاسان حرفه‌ای و توسعه‌دهندگان macOS ایده‌آل است. پردازنده Core i5 نسل هشتم به همراه ۸ گیگابایت رم DDR4 و گرافیک مجزای Radeon Pro 560X با ۴ گیگابایت حافظه اختصاصی، این دستگاه را به یک ایستگاه کاری کامل برای کارهای سنگین گرافیکی تبدیل کرده. حافظه ۱ ترابایتی Fusion Drive سرعت بالا و فضای کافی برای فایل‌های بزرگ فراهم می‌کند. این محصول اوپن باکس با جعبه اورجینال، موس و کیبورد همراه است و برای استودیوهای طراحی، دفاتر معماری و کارهای حرفه‌ای چندرسانه‌ای عالی است. با سیستم‌عامل macOS و پشتیبانی از نرم‌افزارهای Adobe Creative Suite، Final Cut Pro و Xcode، این آی‌مک انتخاب اول حرفه‌ای‌هاست.`;
  }

  if (m.includes('PRECISION') && (m.includes('7770') || m.includes('7760'))) {
    const is7770 = m.includes('7770');
    if (is7770 && m.includes('A5500')) {
      return `Dell Precision 7770 قدرتمندترین ورک‌استیشن موبایل Dell است که برای مهندسان ارشد، محققان هوش مصنوعی، متخصصان CAD/CAM پیشرفته و استودیوهای انیمیشن‌سازی طراحی شده. پردازنده ۱۴ هسته‌ای Core i9 12950HX نسل دوازدهم با فرکانس بوست بالا، ۶۴ گیگابایت رم DDR5 فوق‌سریع و گرافیک حرفه‌ای NVIDIA RTX A5500 با ۱۶ گیگابایت حافظه اختصاصی، این دستگاه را به یک ایستگاه پردازش سیار تبدیل کرده. حافظه ۱ ترابایت SSD NVMe سرعت خواندن/نوشتن فوق‌العاده‌ای ارائه می‌دهد. این ورک‌استیشن برای شبیه‌سازی‌های سنگین CFD، رندرینگ ۳D حرفه‌ای، آموزش مدل‌های یادگیری عمیق (Deep Learning)، تحلیل عناصر محدود (FEA) و پردازش داده‌های ژئوفیزیکی بی‌نظیر است. نمایشگر ۱۷ اینچی FHD فضای کاری وسیعی برای مهندسان فراهم می‌کند.`;
    } else if (is7770) {
      return `Dell Precision 7770 با پردازنده Core i7 12850HX نسل دوازدهم، ۳۲ گیگابایت رم DDR5 و گرافیک حرفه‌ای RTX A3000 با ۱۲ گیگابایت حافظه، یک ورک‌استیشن موبایل قدرتمند برای مهندسان مکانیک، عمران و معماران است. این دستگاه برای کار با نرم‌افزارهای AutoCAD، SolidWorks، Revit، CATIA و ANSYS عالی است. حافظه ۵۱۲ گیگابایت SSD NVMe و نمایشگر ۱۷ اینچی FHD، تجربه کاری حرفه‌ای ارائه می‌دهد. مناسب برای شبیه‌سازی‌های مهندسی متوسط تا سنگین و طراحی سه‌بعدی.`;
    } else if (m.includes('A5000')) {
      return `Dell Precision 7760 با پردازنده Core i9 11950H، ۳۲ گیگابایت رم DDR4 و گرافیک RTX A5000 با ۱۶ گیگابایت حافظه، یک ورک‌استیشن موبایل رده‌بالا برای متخصصان هوش مصنوعی و پردازش‌های سنگین GPU است. این دستگاه برای آموزش مدل‌های یادگیری عمیق، رندرینگ ۳D حرفه‌ای، شبیه‌سازی CFD و تحلیل عناصر محدود ایده‌آل است. حافظه ۱ ترابایت SSD فضای کافی برای دیتاست‌های بزرگ فراهم می‌کند.`;
    } else {
      return `Dell Precision 7760 با پردازنده Intel Xeon W-11855M سروری، ۳۲ گیگابایت رم DDR4 ECC-ready و گرافیک RTX A4000 با ۸ گیگابایت حافظه، مخصوص کارهای محاسباتی سنگین و پایدار است. پردازنده Xeon برای کارهای ۲۴/۷ و پردازش‌های طولانی‌مدت بهینه شده. مناسب برای سرورهای محلی، مجازی‌سازی سنگین و کارهای مهندسی طولانی.`;
    }
  }

  if (isWorkstation && (m.includes('5530') || m.includes('5540') || m.includes('5550') || m.includes('5560'))) {
    if (m.includes('5530')) {
      return `Dell Precision 5530 با پردازنده Core i9 8950HK، ۱۶ گیگابایت رم و گرافیک Quadro P2000 با ۴ گیگابایت حافظه، ورک‌استیشن موبایل جمع‌وجوری است که برای مهندسان مکانیک و طراحان صنعتی عالی است. بدنه باریک و سبک آن با کیفیت ساخت پریمیوم، قابلیت حمل آسان فراهم می‌کند. مناسب برای AutoCAD، SolidWorks و کارهای طراحی سه‌بعدی متوسط.`;
    } else if (m.includes('5540')) {
      return `Dell Precision 5540 با پردازنده Core i9 9980HK هشت هسته‌ای، ۱۶ گیگابایت رم و گرافیک Quadro T2000 با ۴ گیگابایت حافظه، ورک‌استیشن حرفه‌ای برای مهندسان و طراحان سه‌بعدی است. پردازنده HK سری قابلیت اورکلاک و عملکرد بالا دارد. نمایشگر ۱۵.۶ اینچی FHD با دقت رنگ بالا، انتخاب عالی برای کارهای گرافیکی و CAD.`;
    } else if (m.includes('5550')) {
      return `Dell Precision 5550 با پردازنده Core i9 10885H ده هسته‌ای، ۱۶ گیگابایت رم و گرافیک Quadro T2000 Max-Q با ۴ گیگابایت حافظه، ترکیبی از قدرت و قابلیت حمل است. گرافیک Max-Q بهینه‌شده برای عملکرد بالا با مصرف انرژی کمتر. مناسب برای مهندسان معماری، طراحان صنعتی و توسعه‌دهندگان نرم‌افزار.`;
    } else {
      return `Dell Precision 5560 با پردازنده Core i7 11800H هشت هسته‌ای نسل یازدهم، ۱۶ گیگابایت رم و گرافیک NVIDIA T1200 با ۴ گیگابایت حافظه، جدیدترین ورک‌استیشن موبایل سری ۵۵۰۰ است. عملکرد پردازشی عالی با معماری Tiger Lake و گرافیک حرفه‌ای برای CAD/CAM متوسط. مناسب برای مهندسان، معماران و طراحان محصول.`;
    }
  }

  if (m.includes('PRECISION 3540')) {
    return `Dell Precision 3540 ورک‌استیشن ورودی Dell با پردازنده Core i7 8665U، ۸ گیگابایت رم و گرافیک AMD Radeon Pro WX2100 با ۲ گیگابایت حافظه است. این دستگاه برای مهندسان و طراحانی که به گرافیک حرفه‌ای نیاز دارند اما بودجه محدودتری دارند، ایده‌آل است. مناسب برای AutoCAD 2D/3D سبک، SolidWorks سطح مبتدی تا متوسط و کارهای مهندسی عمومی.`;
  }

  if (m.includes('OMEN TRANSCEND')) {
    return `HP Omen Transcend 14 یک لپ‌تاپ گیمینگ و AI فوق‌العاده قدرتمند است که با پردازنده Intel Ultra 7 155H، ۱۶ گیگابایت رم DDR5، ۱ ترابایت SSD و گرافیک NVIDIA RTX 4060 با ۸ گیگابایت حافظه، برای گیمرهای حرفه‌ای، توسعه‌دهندگان بازی و متخصصان هوش مصنوعی طراحی شده. نمایشگر ۱۴ اینچی 2K با نرخ نوسازی ۱۲۰ هرتز، تجربه بصری بی‌نظیری ارائه می‌دهد. NPU AI Boost برای پردازش‌های محلی هوش مصنوعی بهینه شده. بدنه سفید رنگ خاص و طراحی مدرن، این لپ‌تاپ را به یک انتخاب لوکس تبدیل کرده. اوپن باکس با کارتن اورجینال.`;
  }

  if (m.includes('VICTUS')) {
    return `HP Victus 15 لپ‌تاپ گیمینگ مقرون‌به‌صرفه HP با پردازنده Core i7 13620H نسل سیزدهم، ۱۶ گیگابایت رم DDR5، ۱ ترابایت SSD و گرافیک RTX 5050 با ۸ گیگابایت حافظه است. نمایشگر ۱۵.۶ اینچی FHD با نرخ نوسازی ۱۴۴ هرتز برای گیمینگ روان. این لپ‌تاپ برای گیمرها، دانشجویان رشته‌های مهندسی و توسعه‌دهندگانی که به قدرت پردازشی بالا نیاز دارند عالی است. اوپن باکس.`;
  }

  if (m.includes('OMNIBOOK') && m.includes('14')) {
    return `HP OmniBook 5 14 لپ‌تاپ نسل جدید AI با پردازنده Snapdragon X Plus شرکت Qualcomm، ۱۶ گیگابایت رم DDR5 و گرافیک Adreno X1-45 است. این لپ‌تاپ با NPU اختصاصی برای پردازش‌های هوش مصنوعی محلی بهینه شده و باتری فوق‌العاده بلندمدتی دارد. مناسب برای کاربران حرفه‌ای که به قابلیت حمل بالا، باتری طولانی و قابلیت‌های AI نیاز دارند. نمایشگر ۱۴ اینچی FHD. اوپن باکس.`;
  }

  if (m.includes('OMNIBOOK') && m.includes('16')) {
    return `HP OmniBook 5 16 نسخه بزرگتر لپ‌تاپ AI نسل جدید HP با پردازنده Snapdragon X Plus، ۳۲ گیگابایت رم DDR5 و گرافیک Adreno X1-45 است. رم ۳۲ گیگابایتی آن برای کارهای سنگین‌تر، ماشین مجازی و مولتی‌تسکینگ حرفه‌ای مناسب است. نمایشگر ۱۶ اینچی FHD فضای کاری بیشتری ارائه می‌دهد. NPU اختصاصی برای AI محلی. اوپن باکس.`;
  }

  if (m.includes('ELITEBOOK 840 G11')) {
    return `HP EliteBook 840 G11 جدیدترین لپ‌تاپ بیزنس پریمیوم HP با پردازنده Intel Core Ultra 7 155U، ۱۶ گیگابایت رم DDR5، ۵۱۲ گیگابایت SSD و گرافیک Intel Arc با NPU AI Boost است. این لپ‌تاپ با قابلیت‌های AI محلی، امنیت سازمانی پیشرفته (HP Wolf Security) و کیفیت ساخت پریمیوم، برای مدیران IT، مشاوران فناوری و متخصصان امنیت سایبری ایده‌آل است. اوپن باکس.`;
  }

  if (m.includes('ELITEBOOK 630')) {
    return `HP EliteBook 630 G9 Touch لپ‌تاپ بیزنس جمع‌وجور HP با پردازنده Core i5 1245U نسل دوازدهم، ۱۶ گیگابایت رم DDR4 و نمایشگر ۱۳.۳ اینچی لمسی FHD است. سبک و قابل حمل، مناسب برای مدیران، مشاوران و فریلنسرهایی که همیشه در حرکت هستند. گرافیک Intel Iris Xe برای کارهای گرافیکی سبک مناسب است.`;
  }

  if (m.includes('ELITEBOOK 650')) {
    return `HP EliteBook 650 G9 Touch لپ‌تاپ بیزنس ۱۵.۶ اینچی HP با پردازنده Core i5 1245U نسل دوازدهم، ۱۶ گیگابایت رم DDR4 و نمایشگر لمسی FHD است. صفحه‌نمایش بزرگتر برای مولتی‌تسکینگ بهتر و صفحه‌کلید عددی مناسب حسابداران و تحلیلگران مالی. گرافیک Intel Iris Xe.`;
  }

  if (m.includes('ELITEBOOK 735')) {
    return `HP EliteBook 735 G6 لپ‌تاپ بیزنس آلومینیومی HP با پردازنده AMD Ryzen 7 PRO 3700U، ۸ گیگابایت رم DDR4 و گرافیک Radeon Vega 10 با ۲ گیگابایت حافظه است. بدنه تمام آلومینیومی با کیفیت ساخت بالا. مناسب برای کارهای بیزنس، برنامه‌نویسی سبک و مولتی‌تسکینگ اداری. نمایشگر ۱۳ اینچی FHD جمع‌وجور و قابل حمل.`;
  }

  if (m.includes('ELITEBOOK 845')) {
    return `HP EliteBook 845 G7 لپ‌تاپ بیزنس AMD HP با پردازنده Ryzen 5 PRO 4650U شش هسته‌ای، ۸ گیگابایت رم DDR4 و ۲۵۶ گیگابایت SSD است. عملکرد چندوظیفه‌ای عالی با مصرف انرژی بهینه. مناسب برای برنامه‌نویسان، تحلیلگران داده و کاربران حرفه‌ای بیزنس.`;
  }

  if (m.includes('ENVY') && m.includes('X360')) {
    return `HP Envy 13 x360 Touch لپ‌تاپ تبدیل‌پذیر لمسی HP با پردازنده AMD Ryzen 7 3700U هشت هسته‌ای، ۱۶ گیگابایت رم DDR4 و گرافیک Radeon Vega 10 با ۲ گیگابایت حافظه است. قابلیت چرخش ۳۶۰ درجه لولا برای استفاده به عنوان تبلت، حالت ارائه و حالت خیمه. نمایشگر ۱۳ اینچی FHD لمسی با کیفیت بالا. مناسب برای طراحان دیجیتال، دانشجویان و کاربران خلاق.`;
  }

  if (m.includes('PAVILION X360')) {
    return `HP Pavilion x360 14 Touch لپ‌تاپ تبدیل‌پذیر لمسی HP با پردازنده Core i5 1155G7 نسل یازدهم، ۸ گیگابایت رم DDR4، ۵۱۲ گیگابایت SSD و گرافیک Intel Iris Xe است. نمایشگر ۱۴ اینچی FHD لمسی با لولای ۳۶۰ درجه. مناسب برای کاربران خانگی، دانشجویان و حرفه‌ای‌هایی که به ترکیب لپ‌تاپ و تبلت نیاز دارند. حافظه ۵۱۲ گیگابایتی فضای کافی برای فایل‌ها و نرم‌افزارها.`;
  }

  if (m.includes('HP LAPTOP 14')) {
    return `HP Laptop 14 لپ‌تاپ اقتصادی HP با پردازنده Core i3 1215U نسل دوازدهم، ۸ گیگابایت رم DDR4 و ۵۱۲ گیگابایت SSD است. پردازنده نسل جدید با عملکرد مناسب کارهای روزمره، وب‌گردی، آفیس و برنامه‌نویسی سبک. حافظه SSD بزرگ ۵۱۲ گیگابایتی. اوپن باکس با قیمت مناسب.`;
  }

  if (m.includes('CHROMEBOOK')) {
    return `HP Chromebook Fortis 11 لپ‌تاپ آموزشی و مقاوم HP با پردازنده MediaTek Helio P60T، ۴ گیگابایت رم و ۳۲ گیگابایت حافظه است. سیستم‌عامل ChromeOS سبک و امن. مناسب برای دانش‌آموزان، مدارس و استفاده‌های آموزشی. بدنه مقاوم در برابر ضربه و رطوبت.`;
  }

  if (m.includes('HP 250')) {
    return `HP 250R G9 لپ‌تاپ اقتصادی و کارآمد HP با پردازنده Core i5 1335U نسل سیزدهم، ۱۶ گیگابایت رم DDR4 و ۲۵۶ گیگابایت SSD است. پردازنده نسل جدید با عملکرد عالی برای کارهای اداری، حسابداری، وب‌گردی و برنامه‌نویسی سبک. رم ۱۶ گیگابایتی برای مولتی‌تسکینگ. اوپن باکس.`;
  }

  if (m.includes('PAVILION DV7')) {
    return `HP Pavilion DV7 لپ‌تاپ کلاسیک HP با پردازنده Core i7 2630QM چهار هسته‌ای، ۸ گیگابایت رم DDR3، ۲۴۰ گیگابایت SSD و گرافیک AMD Radeon HD 7400 با ۱ گیگابایت حافظه. نمایشگر ۱۷ اینچی HD. یک لپ‌تاپ با قیمت اقتصادی مناسب برای استفاده‌های خانگی، تماشای فیلم، وب‌گردی و کارهای سبک.`;
  }

  if (m.includes('PROBOOK 440') && m.includes('HD')) {
    return `HP ProBook 440 G6 لپ‌تاپ بیزنس قابل اعتماد HP با پردازنده Core i5 8265U، ۸ گیگابایت رم DDR4 و ۲۵۶ گیگابایت SSD. نمایشگر ۱۴ اینچی HD. مناسب برای کارهای اداری، حسابداری، وب‌گردی و مولتی‌تسکینگ سبک. بدنه مقاوم با استانداردهای نظامی MIL-STD.`;
  }

  if (m.includes('PROBOOK 440') && m.includes('FHD')) {
    return `HP ProBook 440 G6 لپ‌تاپ بیزنس قابل اعتماد HP با پردازنده Core i5 8265U، ۸ گیگابایت رم DDR4 و ۲۵۶ گیگابایت SSD. نمایشگر ۱۴ اینچی FHD با کیفیت بالاتر نسبت به نسخه HD. مناسب برای کارهای اداری، حسابداری، وب‌گردی و مولتی‌تسکینگ. بدنه مقاوم.`;
  }

  if (m.includes('PROBOOK 450 G3')) {
    return `HP ProBook 450 G3 لپ‌تاپ بیزنس HP با پردازنده Core i7 6500U، ۸ گیگابایت رم DDR4 و ۲۵۶ گیگابایت SSD. نمایشگر ۱۵.۶ اینچی FHD. مناسب برای کارهای اداری و مهندسی سبک. قیمت اقتصادی با عملکرد مناسب.`;
  }

  if (m.includes('PROBOOK 450 G4')) {
    return `HP ProBook 450 G4 لپ‌تاپ بیزنس HP با پردازنده Core i5 7200U، ۸ گیگابایت رم DDR4 و ۵۱۲ گیگابایت SSD. حافظه SSD بزرگ ۵۱۲ گیگابایتی فضای کافی برای فایل‌ها. نمایشگر ۱۵.۶ اینچی HD. مناسب برای کارهای اداری و آموزشی.`;
  }

  if (m.includes('PROBOOK 450 G5')) {
    return `HP ProBook 450 G5 لپ‌تاپ بیزنس HP با پردازنده Core i5 8250U چهار هسته‌ای نسل هشتم، ۸ گیگابایت رم DDR4 و ۲۵۶ گیگابایت SSD. نمایشگر ۱۵.۶ اینچی FHD. پردازنده چهار هسته‌ای عملکرد بهتری نسبت به نسل‌های قبل دارد. مناسب برای کارهای اداری و حسابداری.`;
  }

  if (m.includes('PROBOOK 450 G6')) {
    return `HP ProBook 450 G6 لپ‌تاپ بیزنس HP با پردازنده Core i5 8265U، ۸ گیگابایت رم DDR4 و ۲۵۶ گیگابایت SSD. نمایشگر ۱۵.۶ اینچی FHD. جدیدترین نسل ProBook 450 با پردازنده بهینه‌تر. مناسب برای کارهای اداری، حسابداری و مولتی‌تسکینگ.`;
  }

  if (m.includes('LATITUDE 3310')) {
    return `Dell Latitude 3310 2-in-1 لپ‌تاپ تبدیل‌پذیر لمسی Dell با پردازنده Core i5 8365U، ۸ گیگابایت رم DDR4 و ۲۵۶ گیگابایت SSD. قابلیت چرخش ۳۶۰ درجه و نمایشگر ۱۳.۳ اینچی FHD لمسی. مناسب برای دانشجویان، پزشکان و کسانی که به تبلت و لپ‌تاپ همزمان نیاز دارند. جمع‌وجور و قابل حمل.`;
  }

  if (m.includes('LATITUDE 5400') && m.includes('16GB')) {
    return `Dell Latitude 5400 لپ‌تاپ بیزنس Dell با پردازنده Core i5 8365U، ۱۶ گیگابایت رم DDR4 و ۲۵۶ گیگابایت SSD. رم ۱۶ گیگابایتی برای مولتی‌تسکینگ حرفه‌ای. نمایشگر ۱۴ اینچی FHD. مناسب برای برنامه‌نویسان، تحلیلگران و کاربران حرفه‌ای بیزنس.`;
  }

  if (m.includes('LATITUDE 5400')) {
    return `Dell Latitude 5400 لپ‌تاپ بیزنس Dell با پردازنده Core i5 8365U، ۸ گیگابایت رم DDR4 و ۲۵۶ گیگابایت SSD. نمایشگر ۱۴ اینچی FHD. بدنه مقاوم با استاندارد نظامی. مناسب برای کارهای اداری، برنامه‌نویسی سبک و مولتی‌تسکینگ.`;
  }

  if (m.includes('LATITUDE 5510') && m.includes('500')) {
    return `Dell Latitude 5510 لپ‌تاپ بیزنس Dell با پردازنده Core i5 10310U نسل دهم، ۱۶ گیگابایت رم DDR4 و ۵۰۰ گیگابایت SSD. حافظه SSD بزرگ ۵۰۰ گیگابایتی. نمایشگر ۱۵.۶ اینچی FHD. مناسب برای کاربران حرفه‌ای بیزنس که به فضای ذخیره‌سازی بزرگ نیاز دارند.`;
  }

  if (m.includes('LATITUDE 5510')) {
    return `Dell Latitude 5510 لپ‌تاپ بیزنس Dell با پردازنده Core i5 10310U نسل دهم، ۱۶ گیگابایت رم DDR4 و ۲۵۶ گیگابایت SSD. نمایشگر ۱۵.۶ اینچی FHD. مناسب برای کارهای اداری، برنامه‌نویسی و مولتی‌تسکینگ حرفه‌ای.`;
  }

  if (m.includes('LATITUDE 5591')) {
    return `Dell Latitude 5591 لپ‌تاپ بیزنس Dell با پردازنده Core i5 8400H قدرتمند، ۸ گیگابایت رم DDR4 و گرافیک مجزای NVIDIA GeForce MX130 با ۲ گیگابایت حافظه. نمایشگر ۱۵.۶ اینچی FHD. پردازنده سری H عملکرد بهتری نسبت به سری U دارد. گرافیک مجزا برای کارهای گرافیکی سبک و ویرایش عکس. مناسب برای مهندسان و طراحان.`;
  }

  if (m.includes('LATITUDE 7420')) {
    return `Dell Latitude 7420 لپ‌تاپ بیزنس پریمیوم Dell با پردازنده Core i7 1185G7 نسل یازدهم، ۱۶ گیگابایت رم DDR4 و ۲۵۶ گیگابایت SSD. گرافیک Intel Iris Xe برای کارهای گرافیکی متوسط. نمایشگر ۱۴ اینچی FHD. بدنه آلومینیومی با کیفیت ساخت بالا. مناسب برای مدیران IT، مشاوران فناوری و حرفه‌ای‌ها.`;
  }

  if (m.includes('THINKPAD X1 CARBON')) {
    return `Lenovo ThinkPad X1 Carbon Gen 6 لپ‌تاپ اولترابوک پریمیوم Lenovo با پردازنده Core i7 8650U، ۱۶ گیگابایت رم DDR4 و ۲۵۶ گیگابایت SSD. بدنه فیبر کربن فوق‌العاده سبک (زیر ۱.۲ کیلوگرم) با استحکام بالا. نمایشگر ۱۴ اینچی FHD. کیبورد افسانه‌ای ThinkPad با TrackPoint. مناسب برای مدیران ارشد، مشاوران و فریلنسرهای حرفه‌ای که همیشه در سفر هستند.`;
  }

  if (m.includes('THINKPAD T14S')) {
    return `Lenovo ThinkPad T14s نسخه سبک‌تر و باریک‌تر T14 با پردازنده Core i5 10210U، ۸ گیگابایت رم DDR4 و ۲۵۶ گیگابایت SSD. نمایشگر ۱۴ اینچی FHD. وزن کمتر از ۱.۵ کیلوگرم. مناسب برای برنامه‌نویسان و حرفه‌ای‌هایی که به قابلیت حمل بالا و عملکرد خوب نیاز دارند.`;
  }

  if (m.includes('THINKPAD T14')) {
    return `Lenovo ThinkPad T14 لپ‌تاپ بیزنس استاندارد Lenovo با پردازنده Core i5 10310U، ۱۶ گیگابایت رم DDR4 و ۲۵۶ گیگابایت SSD. رم ۱۶ گیگابایتی برای مولتی‌تسکینگ حرفه‌ای. نمایشگر ۱۴ اینچی FHD. کیبورد عالی ThinkPad. مناسب برای برنامه‌نویسان، تحلیلگران و کاربران حرفه‌ای.`;
  }

  if (m.includes('THINKPAD T480') && m.includes('S')) {
    return `Lenovo ThinkPad T480s لپ‌تاپ بیزنس سبک Lenovo با پردازنده Core i7 8650U، ۸ گیگابایت رم DDR4، ۲۵۶ گیگابایت SSD و نمایشگر ۱۴ اینچی FHD لمسی. نسخه سبک‌تر T480 با بدنه منیزیمی. تاچ‌اسکرین برای کارهای تعاملی. مناسب برای حرفه‌ای‌ها و برنامه‌نویسان.`;
  }

  if (m.includes('THINKPAD T480')) {
    return `Lenovo ThinkPad T480 لپ‌تاپ بیزنس محبوب Lenovo با پردازنده Core i7 8650U، ۱۶ گیگابایت رم DDR4، ۵۱۲ گیگابایت SSD و نمایشگر ۱۴ اینچی FHD لمسی. رم ۱۶ گیگابایتی و حافظه بزرگ ۵۱۲ گیگابایتی. قابلیت تعویض باتری دوگانه (Power Bridge). مناسب برای برنامه‌نویسان حرفه‌ای و مهندسان.`;
  }

  if (m.includes('THINKPAD T490S')) {
    return `Lenovo ThinkPad T490s نسخه سبک و باریک T490 با پردازنده Core i5 8365U، ۸ گیگابایت رم DDR4 و ۲۵۶ گیگابایت SSD. نمایشگر ۱۴ اینچی FHD. وزن زیر ۱.۵ کیلوگرم. مناسب برای حرفه‌ای‌هایی که به سبکی و قابلیت حمل اهمیت می‌دهند.`;
  }

  if (m.includes('THINKPAD T490')) {
    return `Lenovo ThinkPad T490 لپ‌تاپ بیزنس Lenovo با پردازنده Core i5 8365U، ۸ گیگابایت رم DDR4 و ۲۵۶ گیگابایت SSD. نمایشگر ۱۴ اینچی FHD. کیبورد عالی ThinkPad. مناسب برای برنامه‌نویسی، کارهای اداری و مولتی‌تسکینگ.`;
  }

  if (m.includes('THINKPAD T540P')) {
    return `Lenovo ThinkPad T540p لپ‌تاپ ورک‌استیشن قدیمی اما قدرتمند Lenovo با پردازنده Core i5 4300M، ۸ گیگابایت رم DDR3، ۲۵۶ گیگابایت SSD و گرافیک NVIDIA GeForce GT 730M با ۱ گیگابایت حافظه. نمایشگر ۱۵.۶ اینچی FHD. مناسب برای استفاده‌های خانگی، تماشای فیلم و کارهای سبک با قیمت اقتصادی.`;
  }

  if (m.includes('SURFACE') && m.includes('Intel')) {
    return `Microsoft Surface Laptop 4 نسخه Intel با پردازنده Core i5 1145G7 نسل یازدهم، ۸ گیگابایت رم DDR4، ۵۱۲ گیگابایت SSD و گرافیک Intel Iris Xe. نمایشگر ۱۳.۵ اینچی 2K لمسی با نسبت تصویر 3:2 و کیفیت فوق‌العاده. طراحی مینیمال و پریمیوم مایکروسافت. مناسب برای کاربران حرفه‌ای، نویسندگان و طراحانی که به نمایشگر باکیفیت و طراحی شیک اهمیت می‌دهند.`;
  }

  if (m.includes('SURFACE') && m.includes('AMD')) {
    return `Microsoft Surface Laptop 4 نسخه AMD با پردازنده Ryzen 5، ۱۶ گیگابایت رم DDR4، ۲۵۶ گیگابایت SSD و گرافیک AMD Radeon. رم ۱۶ گیگابایتی برای مولتی‌تسکینگ بهتر. نمایشگر ۱۳.۵ اینچی 2K لمسی. طراحی پریمیوم مایکروسافت. مناسب برای کاربران حرفه‌ای و مولتی‌تسکینگ.`;
  }

  if (m.includes('لوازم') || m.includes('شبکه')) {
    return `لوازم جانبی شبکه شامل کارت شبکه ۴ پورت. مناسب برای راه‌اندازی شبکه‌های کوچک و خانگی. تست‌شده و سالم.`;
  }

  if (m.includes('قلم') || m.includes('STYLUS')) {
    return `قلم HP Elite Stylus اصلی، سازگار با لپ‌تاپ‌های لمسی HP EliteBook و Envy. مناسب برای طراحی دیجیتال، یادداشت‌برداری و کارهای تعاملی با تاچ‌اسکرین.`;
  }

  // Default description
  return `لپ‌تاپ استوک ${item.model} با مشخصات: پردازنده ${item.cpu}، رم ${item.ram}، حافظه ${item.hard}، گرافیک ${item.gpu}، نمایشگر ${item.display}. تست‌شده و تاییدشده توسط مهندس احسان صالحی. Grade A++ اروپایی با مهلت تست.`;
}

// English description
function getDescriptionEn(item: typeof SEED_LAPTOPS[0]): string {
  return `Stock ${item.model} - CPU: ${item.cpu}, RAM: ${item.ram}, Storage: ${item.hard}, GPU: ${item.gpu}, Display: ${item.display}. Tested and verified by Eng. Ehsan Salehi. Grade A++ European stock with warranty.`;
}

// Badge based on specs
function getBadge(item: typeof SEED_LAPTOPS[0]): string {
  const m = item.model.toUpperCase();
  const gpu = item.gpu.toUpperCase();
  const cpu = item.cpu.toUpperCase();

  if (gpu.includes('RTX') && gpu.includes('A5500')) return '🏆 قوی‌ترین ورک‌استیشن موجود';
  if (gpu.includes('RTX') && gpu.includes('A5000')) return '🔥 هیولای پردازش GPU';
  if (gpu.includes('RTX') && (gpu.includes('4060') || gpu.includes('5050'))) return '⚡ گیمینگ + AI نسل جدید';
  if (m.includes('PRECISION 7770')) return '💎 ورک‌استیشن سطح سازمانی';
  if (m.includes('PRECISION 7760')) return '🛡️ ورک‌استیشن حرفه‌ای';
  if (m.includes('PRECISION 55') && m.includes('i9')) return '⭐ پیشنهاد مهندس صالحی';
  if (m.includes('PRECISION')) return '🔧 ورک‌استیشن مهندسی';
  if (m.includes('OMNIBOOK')) return '🤖 لپ‌تاپ AI نسل جدید';
  if (m.includes('ELITEBOOK 840 G11')) return '✨ جدیدترین نسل بیزنس';
  if (m.includes('OMEN')) return '🎮 گیمینگ + تولید محتوا';
  if (m.includes('VICTUS')) return '🎯 بهترین ارزش گیمینگ';
  if (m.includes('X1 CARBON')) return '💼 لوکس‌ترین اولترابوک';
  if (cpu.includes('ULTRA') || cpu.includes('SNAPDRAGON')) return '🤖 آماده AI';
  if (m.includes('SURFACE')) return '🎨 طراحی پریمیوم';
  return '✅ تاییدشده توسط مهندس صالحی';
}

// Condition grade
function getCondition(model: string): string {
  const m = model.toUpperCase();
  if (m.includes('OPEN BOX')) return 'Grade A++ (اوپن باکس)';
  return 'Grade A++ اروپایی';
}

export async function GET() {
  try {
    // Clear slug counts for fresh generation
    Object.keys(slugCounts).forEach(key => delete slugCounts[key]);
    
    // Build products array directly from seed data
    const products = SEED_LAPTOPS.map((item, index) => {
      const slug = makeUniqueHardwareSlug(item.model, index, slugCounts);
      const category = getCategory(item.model);
      const imageUrl = item.image_url || getImageForModel(item);
      const badge = getBadge(item);
      const condition = getCondition(item.model);
      const description = getDescription(item);
      const descriptionEn = getDescriptionEn(item);
      const finalPrice = formatHardwarePrice(item.base_price);
      const priceEstimate = formatHardwarePrice(item.base_price);

      const specs = `پردازنده: ${item.cpu} | رم: ${item.ram} | حافظه: ${item.hard} | گرافیک: ${item.gpu} | نمایشگر: ${item.display}`;
      const specsEn = `CPU: ${item.cpu} | RAM: ${item.ram} | Storage: ${item.hard} | GPU: ${item.gpu} | Display: ${item.display}`;

      return {
        id: slug,
        title: item.model,
        title_en: item.model,
        specs,
        specs_en: specsEn,
        description,
        description_en: descriptionEn,
        slug,
        cpu: item.cpu,
        ram: item.ram,
        hard: item.hard,
        gpu: item.gpu,
        display: item.display,
        base_price: applyHardwareMarkup(item.base_price),
        final_price: finalPrice,
        condition_grade: condition,
        price_estimate: priceEstimate,
        category,
        image_url: imageUrl,
        badge
      };
    });

    return NextResponse.json({ success: true, products });
  } catch (error: any) {
    console.error('Hardware API error:', error);
    return NextResponse.json({ success: false, error: error?.message || 'Unknown error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { name, phone, budget, useCase, notes } = body;

    // Log inquiry (in production, this would save to database or send notification)
    console.log('Hardware inquiry received:', { name, phone, budget, useCase, notes });

    return NextResponse.json({
      success: true,
      message: '✅ درخواست مشاوره خرید سخت‌افزار با موفقیت ثبت شد. مهندس احسان صالحی در اسرع وقت با شما تماس خواهند گرفت.'
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message }, { status: 500 });
  }
}
