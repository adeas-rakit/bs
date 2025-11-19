
import { motion } from 'framer-motion';

const Loading = () => {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <motion.div
        animate={{
          scale: [1, 1.2, 1],
          rotate: [0, 360],
        }}
        transition={{
          duration: 2,
          ease: "easeInOut",
          repeat: Infinity,
        }}
      >
        <svg
          className="w-24 h-24 text-green-600"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 4v.01M12 20v.01M4.93 4.93l.01.01M19.07 19.07l.01.01M4.93 19.07l.01-.01M19.07 4.93l.01-.01M20 12h-.01M4 12h-.01"
          />
        </svg>
      </motion.div>
    </div>
  );
};

export default Loading;
