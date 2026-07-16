'use client';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

export default function CustomCursor() {
  const [mousePosition, setMousePosition] = useState({ x: -100, y: -100 });
  const [isHovering, setIsHovering] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // فقط در دستگاه‌های دسکتاپ (غیر لمسی) فعال شود
    if (typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches) {
      return;
    }

    const updateMouse = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
      if (!isVisible) setIsVisible(true);

      const target = e.target as HTMLElement;
      if (target && target.closest('a, button, [role="button"], input, textarea, .hover-target, .project-card, .service-card')) {
        setIsHovering(true);
      } else {
        setIsHovering(false);
      }
    };

    const handleMouseLeave = () => setIsVisible(false);
    const handleMouseEnter = () => setIsVisible(true);

    window.addEventListener('mousemove', updateMouse, { passive: true });
    document.addEventListener('mouseleave', handleMouseLeave);
    document.addEventListener('mouseenter', handleMouseEnter);

    return () => {
      window.removeEventListener('mousemove', updateMouse);
      document.removeEventListener('mouseleave', handleMouseLeave);
      document.removeEventListener('mouseenter', handleMouseEnter);
    };
  }, [isVisible]);

  if (!isVisible) return null;

  return (
    <>
      {/* نقطه کوچک مرکزی پرسرعت و دقیق */}
      <motion.div
        className="fixed top-0 left-0 pointer-events-none z-[99999] w-2.5 h-2.5 rounded-full bg-gradient-to-r from-orange-400 to-amber-300 shadow-[0_0_12px_#ff6b00]"
        animate={{
          x: mousePosition.x - 5,
          y: mousePosition.y - 5,
          scale: isHovering ? 0.5 : 1,
        }}
        transition={{ type: 'spring', stiffness: 1200, damping: 35, mass: 10 }}
        style={{ willChange: 'transform' }}
      />

      {/* حلقه خارجی درخشان با تاخیر نرم (Trailing Cyber Ring) */}
      <motion.div
        className={`fixed top-0 left-0 pointer-events-none z-[99998] rounded-full transition-colors duration-300 ${
          isHovering
            ? 'w-14 h-14 bg-orange-500/20 border-2 border-orange-400/80 backdrop-blur-[1px] shadow-[0_0_25px_rgba(255,107,0,0.4)]'
            : 'w-8 h-8 border border-white/30 bg-white/5 shadow-[0_0_15px_rgba(255,255,255,0.05)]'
        }`}
        animate={{
          x: mousePosition.x - (isHovering ? 28 : 16),
          y: mousePosition.y - (isHovering ? 28 : 16),
          scale: isHovering ? 1.15 : 1,
        }}
        transition={{ type: 'spring', stiffness: 450, damping: 28, mass: 0.8 }}
        style={{ willChange: 'transform' }}
      />
    </>
  );
}
