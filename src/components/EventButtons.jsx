import { motion } from 'framer-motion';

export default function EventButtons({ events, onTrigger }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-3xl border border-white/10 bg-white/5 p-5 shadow-glow"
    >
      <div className="text-sm uppercase tracking-[0.25em] text-white/50">Market Events</div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {events.map((event) => (
          <button
            key={event.id}
            type="button"
            onClick={() => onTrigger(event.id)}
            className="rounded-3xl border border-white/10 bg-black/40 px-5 py-4 text-left text-white transition-all duration-200 hover:border-neon-green hover:bg-neon-green/10"
          >
            <div className="text-lg font-semibold">{event.label}</div>
            <div className="mt-2 text-sm text-white/60">{event.description}</div>
          </button>
        ))}
      </div>
    </motion.div>
  );
}
