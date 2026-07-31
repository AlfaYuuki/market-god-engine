import { motion } from 'framer-motion';
import leaders from '../data/leaders';

export default function LeaderPopup({ eventType }) {
  const leader = leaders[eventType];
  return (
    <motion.div
      initial={{ opacity: 0, y: -32, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.45, ease: 'easeOut' }}
      className="rounded-3xl border border-white/10 bg-white/5 p-5 shadow-glow backdrop-blur-xl"
    >
      <div className="text-sm uppercase tracking-[0.3em] text-neon-blue">World Leader</div>
      <div className="mt-3 text-2xl font-semibold text-white">{leader.title}</div>
      <div className={`mt-2 text-lg font-medium ${leader.color}`}>{leader.reaction}</div>
    </motion.div>
  );
}
