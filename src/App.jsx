import { AnimatePresence, motion } from 'framer-motion';
import { useEffect } from 'react';
import { useGameEngine } from './hooks/useGameEngine';
import LeaderPopup from './components/LeaderPopup';
import TraderDialogue from './components/TraderDialogue';
import BossOverlay from './components/BossOverlay';
import EndingScreen from './components/EndingScreen';
import StatsCard from './components/StatsCard';
import PriceChart from './components/PriceChart';
import ZoneSelector from './components/ZoneSelector';
import BuildSelector from './components/BuildSelector';
import EventButtons from './components/EventButtons';

function App() {
  const {
    price,
    combo,
    score,
    selectedZone,
    selectedBuild,
    eventLog,
    history,
    leaderEvent,
    bossActive,
    ending,
    activeTrader,
    achievementQueue,
    unlockedAchievements,
    zones,
    builds,
    events,
    triggerEvent,
    selectZone,
    selectBuild,
    setAchievementQueue,
    resetGame
  } = useGameEngine();

  useEffect(() => {
    if (achievementQueue.length) {
      const timeout = setTimeout(() => setAchievementQueue([]), 3000);
      return () => clearTimeout(timeout);
    }
    return undefined;
  }, [achievementQueue, setAchievementQueue]);

  return (
    <div className="min-h-screen px-4 py-6 sm:px-8 lg:px-16">
      <div className="mx-auto grid max-w-[1500px] gap-6 xl:grid-cols-[1.3fr_0.9fr]">
        <div className="space-y-6">
          <div className="rounded-[2rem] border border-white/10 bg-[#090b14]/95 p-6 shadow-glow">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm uppercase tracking-[0.3em] text-white/50">Market God Engine</p>
                <h1 className="mt-3 text-4xl font-black text-white sm:text-5xl">Dark Futuristic Trading Terminal</h1>
              </div>
              <button
                type="button"
                onClick={resetGame}
                className="rounded-full bg-neon-green px-5 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-black shadow-glow"
              >
                Reset Simulation
              </button>
            </div>
            <p className="mt-6 max-w-2xl text-base leading-7 text-white/70">
              Challenge global markets with trader builds, live zone multipliers and intense events. Every click shifts prices, comb
              os and score in an animated neon environment.
            </p>
          </div>

          <LeaderPopup eventType={leaderEvent} />

          <div className="grid gap-6 xl:grid-cols-[0.9fr_0.7fr]">
            <section className="space-y-6">
              <PriceChart data={history} />
              <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                <StatsCard label="Price" value={`$${price}`} accent="text-neon-blue" />
                <StatsCard label="Combo" value={combo} accent="text-neon-green" delta={combo >= 10 ? 'Streak mode' : 'Market flow'} />
                <StatsCard label="Score" value={score} accent={score >= 0 ? 'text-neon-green' : 'text-neon-purple'} delta={score >= 0 ? 'Profit' : 'Loss'} />
              </div>
            </section>

            <div className="space-y-6">
              <ZoneSelector zones={zones} selectedZone={selectedZone} onSelect={selectZone} />
              <BuildSelector builds={builds} selectedBuild={selectedBuild} onSelect={selectBuild} />
              <EventButtons events={events} onTrigger={triggerEvent} />
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-[1fr_0.75fr]">
            <div className="rounded-[2rem] border border-white/10 bg-white/5 p-6 shadow-glow">
              <div className="flex items-center justify-between">
                <p className="text-sm uppercase tracking-[0.25em] text-white/50">Trader Memory</p>
                <span className="text-xs uppercase text-white/60">Recent market pulse</span>
              </div>
              <div className="mt-5 space-y-4">
                <TraderDialogue trader={activeTrader} />
                <div className="grid gap-3 sm:grid-cols-2">
                  {eventLog.slice(0, 4).map((log, index) => (
                    <div key={index} className="rounded-3xl border border-white/10 bg-black/40 p-4 text-sm text-white/70">
                      <div className="font-semibold text-white">{log.type}</div>
                      <div className="mt-2">Price {log.impact.price > 0 ? '+' : ''}{log.impact.price}</div>
                      <div>Score {log.impact.score > 0 ? '+' : ''}{log.impact.score}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="rounded-[2rem] border border-white/10 bg-[#090b14]/95 p-6 shadow-glow">
              <div className="flex items-center justify-between">
                <p className="text-sm uppercase tracking-[0.25em] text-white/50">Achievements</p>
                <span className="text-xs uppercase text-white/60">Status</span>
              </div>
              <div className="mt-5 space-y-3">
                {unlockedAchievements.length ? (
                  unlockedAchievements.map((achievement) => (
                    <div key={achievement} className="rounded-3xl border border-neon-green/20 bg-neon-green/5 px-4 py-3 text-sm text-neon-green">
                      {achievement}
                    </div>
                  ))
                ) : (
                  <div className="rounded-3xl border border-white/10 bg-black/40 px-4 py-6 text-sm text-white/60">No achievements unlocked yet. Stay aggressive.</div>
                )}
              </div>
            </div>
          </div>
        </div>

        <aside className="space-y-6">
          <div className="rounded-[2rem] border border-white/10 bg-white/5 p-6 shadow-glow">
            <div className="text-sm uppercase tracking-[0.25em] text-white/50">Strategy Briefing</div>
            <div className="mt-4 space-y-3 text-sm leading-7 text-white/75">
              <p>Each event reshapes the terminal with powerful neon feedback. Select a zone and build to maximize market momentum.</p>
              <p>Liquidity Raid and Black Swan launch boss modes with dramatic visuals and persistent effects. Hold the line and chase higher scores.</p>
            </div>
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-white/5 p-6 shadow-glow">
            <div className="text-sm uppercase tracking-[0.25em] text-white/50">Terminal Controls</div>
            <div className="mt-5 space-y-3 text-sm leading-7 text-white/70">
              <div className="rounded-3xl bg-black/40 p-4">Zone multiplier and build synergy unlock unique combos.</div>
              <div className="rounded-3xl bg-black/40 p-4">Animated chart updates keep the market pulse visible every pulse.</div>
              <div className="rounded-3xl bg-black/40 p-4">Score, combo and memory interplay determines your ending path.</div>
            </div>
          </div>
        </aside>
      </div>

      <AnimatePresence>{bossActive ? <BossOverlay boss={bossActive} /> : null}</AnimatePresence>
      <EndingScreen ending={ending} onReset={resetGame} />

      <AnimatePresence>
        {achievementQueue.length ? (
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 24 }}
            className="fixed bottom-6 left-1/2 z-50 w-[min(420px,calc(100%-2rem))] -translate-x-1/2 rounded-3xl border border-neon-blue/30 bg-[#07101c]/95 p-4 text-sm text-white shadow-glow"
          >
            {achievementQueue.map((item) => (
              <div key={item} className="text-center">Achievement unlocked: {item}</div>
            ))}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

export default App;
