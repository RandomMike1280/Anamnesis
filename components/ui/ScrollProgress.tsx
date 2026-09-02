'use client';

import { useEffect, useState } from 'react';
import { motion, useScroll } from 'framer-motion';

export function ScrollProgress() {
  const { scrollYProgress } = useScroll();

  return (
    <motion.div
      className="fixed top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-star-violet via-star-blue to-star-teal origin-left z-50"
      style={{ scaleX: scrollYProgress }}
    />
  );
}
