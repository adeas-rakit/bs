'use client'

import { motion } from 'framer-motion';
import { ThemeProvider } from 'next-themes';

export default function AppWrapper({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        {children}
      </motion.div>
    </ThemeProvider>
  );
}
