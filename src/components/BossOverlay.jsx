import { motion } from 'framer-motion';

const bossData = {
  JPOW: {
    title: 'JPOW',
    subtitle: 'THE FED OVERLORD',
    accent: 'neon-blue',
    description: 'Liquidity Raid is on. Brace for systemic force.'
  },
  'BLACK SWAN': {
    title: 'BLACK SWAN',
    subtitle: 'GLOBAL SHOCK',
    accent: 'neon-purple',
    description: 'An unexpected world event crashed the market.'
  }
};

export default function BossOverlay({ boss }) {
  if (!boss) return null;
  const metadata = bossData[boss];
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-40 flex items-center justify-center bg-black/80 p-6"
    >
      <motion.div
        initial={{ scale: 0.95, rotate: -2 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="w-full max-w-3xl rounded-[2rem] border border-white/10 bg-[#090b14]/95 p-8 shadow-glow"
      >
        <div className="text-sm uppercase tracking-[0.35em] text-white/50">Boss Encounter</div>
        <div className="mt-6 flex flex-col gap-3">
          <div className="text-5xl font-black text-neon-blue">{metadata.title}</div>
          <div className="text-xl uppercase tracking-[0.3em] text-white/60">{metadata.subtitle}</div>
          <p className="mt-4 text-base text-white/80">{metadata.description}</p>
          <div className="mt-6 rounded-3xl border border-neon-blue/30 bg-white/5 p-5 text-white/80">
            Market shock is active. This event will reshape every indicator.
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
