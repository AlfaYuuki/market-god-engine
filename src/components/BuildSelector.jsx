import { motion } from 'framer-motion';

export default function BuildSelector({ builds, selectedBuild, onSelect }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-3xl border border-white/10 bg-white/5 p-5 shadow-glow"
    >
      <div className="text-sm uppercase tracking-[0.25em] text-white/50">Trader Build</div>
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        {builds.map((build) => (
          <button
            key={build.id}
            type="button"
            onClick={() => onSelect(build)}
            className={`rounded-3xl border px-4 py-4 text-left transition-all duration-200 ${selectedBuild.id === build.id ? 'border-neon-blue bg-neon-blue/10 text-neon-blue' : 'border-white/10 bg-black/40 text-white/75 hover:border-white/20 hover:bg-white/5'}`}
          >
            <div className="text-lg font-semibold">{build.theme} {build.label}</div>
            <div className="mt-2 text-sm text-white/60">{build.description}</div>
          </button>
        ))}
      </div>
    </motion.div>
  );
}
