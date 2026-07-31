import { motion } from 'framer-motion';

export default function ZoneSelector({ zones, selectedZone, onSelect }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-3xl border border-white/10 bg-white/5 p-5 shadow-glow"
    >
      <div className="text-sm uppercase tracking-[0.25em] text-white/50">Market Zone</div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {zones.map((zone) => (
          <button
            key={zone.id}
            type="button"
            onClick={() => onSelect(zone)}
            className={`rounded-3xl border px-4 py-3 text-left transition-all duration-200 ${selectedZone.id === zone.id ? 'border-neon-green bg-neon-green/10 text-neon-green' : 'border-white/10 bg-black/40 text-white/75 hover:border-white/20 hover:bg-white/5'}`}
          >
            <div className="text-base font-semibold">{zone.label}</div>
            <div className="mt-1 text-sm text-white/60">x{zone.multiplier.toFixed(2)} multiplier</div>
          </button>
        ))}
      </div>
    </motion.div>
  );
}
