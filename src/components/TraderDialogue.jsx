import { motion } from 'framer-motion';

export default function TraderDialogue({ trader }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45 }}
      className="rounded-3xl border border-white/10 bg-slate-950/80 p-4 shadow-glow"
    >
      <div className="flex items-center justify-between gap-4">
        <div>
          <div className="text-sm uppercase tracking-[0.2em] text-white/60">Trader</div>
          <div className="mt-1 text-xl font-semibold text-neon-green">{trader.name}</div>
        </div>
        <div className="rounded-2xl border border-white/10 bg-black/40 px-3 py-1 text-xs uppercase text-white/70">
          {trader.style}
        </div>
      </div>
      <p className="mt-4 text-sm leading-6 text-white/80">"{trader.dialogue}"</p>
    </motion.div>
  );
}
