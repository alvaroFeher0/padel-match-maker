import { motion } from 'framer-motion';

interface PadelBallProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const PadelBall = ({ className = '', size = 'md' }: PadelBallProps) => {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-20 h-20',
  };

  return (
    <motion.div
      className={`${sizeClasses[size]} rounded-full gradient-accent shadow-glow-accent ${className}`}
      animate={{
        y: [0, -8, 0],
      }}
      transition={{
        duration: 1.5,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
    >
      <div className="w-full h-full rounded-full bg-gradient-to-br from-white/30 to-transparent" />
    </motion.div>
  );
};
