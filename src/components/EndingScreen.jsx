import { motion } from 'framer-motion';

export default function EndingScreen({ ending, onReset }) {
  if (!ending) return null;
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-6"
    >
      <div className="w-full max-w-2xl rounded-[2rem] border border-white/10 bg-[#080911]/95 p-8 text-center shadow-glow">
        <div className="text-6xl tracking-[0.15em] text-neon-green">{ending.icon}</div>
        <div className="mt-4 text-4xl font-bold text-white">{ending.title}</div>
        <p className="mt-3 text-lg text-white/70">{ending.subtitle}</p>
        <button
          type="button"
          onClick={onReset}
          className="mt-8 rounded-full bg-neon-blue px-8 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-black shadow-glow"
        >
          Restart Simulation
        </button>
      </div>
    </motion.div>
  );
}
