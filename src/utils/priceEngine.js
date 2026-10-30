const baseImpact = {
  Bull: { price: 180, combo: 1, score: 1 },
  Bear: { price: -160, combo: 1, score: -1 },
  'Liquidity Raid': { price: -240, combo: 2, score: -2 },
  'Black Swan': { price: -360, combo: -1, score: -3 }
};

export function buildMultiplier(buildId) {
  return {
    Scalper: { speed: 1.4, risk: 0.85 },
    'Swing Trader': { speed: 1.0, risk: 1.0 },
    Whale: { speed: 0.7, risk: 1.6 }
  }[buildId] ?? { speed: 1, risk: 1 };
}

export function eventImpact(eventType, zoneMultiplier, buildId) {
  const event = baseImpact[eventType];
  const build = buildMultiplier(buildId);
  const price = Math.round(event.price * zoneMultiplier * build.risk);
  const combo = Math.round(event.combo * build.speed);
  const score = Math.round(event.score * build.risk);
  return { price, combo, score };
}
