const STORAGE_KEY = 'market-god-engine-save';

export function loadGame() {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
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
    history: state.history
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
}
