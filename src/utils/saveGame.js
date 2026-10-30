const STORAGE_KEY = 'market-god-engine-save';

export function loadGame() {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || !Number.isFinite(parsed.price) || !Array.isArray(parsed.history)) return null;
    return parsed;
  } catch (error) {
    return null;
  }
}

export function saveGame(state) {
  if (typeof window === 'undefined') return;
  const payload = {
    price: state.price,
    combo: state.combo,
    score: state.score,
    zoneId: state.selectedZone.id,
    buildId: state.selectedBuild.id,
    history: state.history,
    eventLog: state.eventLog ?? [],
    unlockedAchievements: state.unlockedAchievements ?? [],
    activeTraderIndex: state.activeTraderIndex ?? 0,
    leaderEvent: state.leaderEvent ?? 'Bull',
    traders: state.traders ?? []
  };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch (error) {
    // Storage can be unavailable or full; the simulation should remain playable.
  }
}
