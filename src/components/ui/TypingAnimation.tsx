'use client'

import { motion } from 'framer-motion';

interface TypingAnimationProps {
  text: string;
  className?: string;
}

const TypingAnimation: React.FC<TypingAnimationProps> = ({ text, className }) => {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
      },
    },
  };

  const letterVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <motion.div
      className={className}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      aria-label={text}
    >
      {text.split('').map((char, index) => (
        <motion.span
          key={`${char}-${index}`}
          variants={letterVariants}
          style={{ display: 'inline-block' }} // Use inline-block to have transform props and preserve space
        >
          {char === ' ' ? '\u00A0' : char} 
        </motion.span>
      ))}
    </motion.div>
  );
};

export default TypingAnimation;
