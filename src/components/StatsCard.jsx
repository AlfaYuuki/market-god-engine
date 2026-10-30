import { motion } from 'framer-motion';

export default function StatsCard({ label, value, accent, delta }) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-3xl border border-white/10 bg-white/5 p-5 shadow-glow"
    >
      <div className="text-sm uppercase tracking-[0.25em] text-white/50">{label}</div>
      <div className="mt-3 flex items-end gap-2">
        <span className={`text-4xl font-semibold ${accent}`}>{value}</span>
        {delta ? <span className="text-sm text-white/60">{delta}</span> : null}
      </div>
    </motion.div>
  );
}
