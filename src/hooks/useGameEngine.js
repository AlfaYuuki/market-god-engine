import { useEffect, useMemo, useRef, useState } from 'react';
import tradersData from '../data/traders';
import zonesData from '../data/zones';
import dialogueMap from '../data/dialogues';
import { eventImpact } from '../utils/priceEngine';
import { loadGame, saveGame } from '../utils/saveGame';

const BUILDS = [
  { id: 'Scalper', label: 'Scalper', description: 'Fast combo gain', theme: '⚡' },
  { id: 'Swing Trader', label: 'Swing Trader', description: 'Balanced gameplay', theme: '🌊' },
  { id: 'Whale', label: 'Whale', description: 'Huge price movement', theme: '🐋' }
];

const EVENTS = [
  { id: 'Bull', label: '📈 Bull', description: 'Bull rally pushes price upward.' },
  { id: 'Bear', label: '📉 Bear', description: 'Bear pressure pulls the market down.' },
  { id: 'Liquidity Raid', label: '⚠ Liquidity Raid', description: 'Market depth collapses abruptly.' },
  { id: 'Black Swan', label: '🌑 Black Swan', description: 'Unexpected shock shakes the system.' }
];

const ACHIEVEMENTS = [
  { id: 'Market God', condition: ({ score }) => score >= 10, description: 'You dominate the market.' },
  { id: 'Combo Master', condition: ({ combo }) => combo >= 12, description: 'A flawless streak.' },
  { id: 'Bull King', condition: ({ score }) => score >= 5, description: 'Riding the bull wave.' },
  { id: 'Survivor', condition: ({ score }) => score > 0, description: 'Still in control.' },
  { id: 'Whale', condition: ({ buildId }) => buildId === 'Whale', description: 'Massive market power.' }
];

const START_STATE = {
  price: 2000,
  combo: 0,
  score: 0,
  selectedZone: zonesData[0],
  selectedBuild: BUILDS[1],
  eventLog: [],
  history: [{ price: 2000, label: 'Start' }],
  achievementQueue: [],
  unlockedAchievements: [],
  activeTraderIndex: 0,
  leaderEvent: 'Bull',
  bossActive: null,
  ending: null,
  traders: tradersData.map((trader) => ({ ...trader, memory: [] }))
};

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function getDialogue(trader) {
  const counts = trader.memory.reduce((acc, event) => {
    acc[event] = (acc[event] || 0) + 1;
    return acc;
  }, {});

  if (counts.Bull >= 3) return 'FOMO has taken over.';
  if (counts.Bear >= 2) return 'Too many bears, market PTSD.';
  if ((counts['Liquidity Raid'] || 0) >= 2) return 'Liquidity is being hunted.';
  if ((counts['Black Swan'] || 0) >= 1) return 'The model did not see that coming.';

  const latest = trader.memory[0];
  if (latest && dialogueMap[latest]) {
    const options = dialogueMap[latest];
    return options[trader.memory.length % options.length];
  }

  return 'Watching the data stream.';
}

function randomFactor() {
  return 0.92 + Math.random() * 0.16;
}

export function useGameEngine() {
  const [price, setPrice] = useState(START_STATE.price);
  const [combo, setCombo] = useState(START_STATE.combo);
  const [score, setScore] = useState(START_STATE.score);
  const [selectedZone, setSelectedZone] = useState(START_STATE.selectedZone);
  const [selectedBuild, setSelectedBuild] = useState(START_STATE.selectedBuild);
  const [history, setHistory] = useState(START_STATE.history);
  const [eventLog, setEventLog] = useState(START_STATE.eventLog);
  const [achievementQueue, setAchievementQueue] = useState(START_STATE.achievementQueue);
  const [unlockedAchievements, setUnlockedAchievements] = useState(START_STATE.unlockedAchievements);
  const [activeTraderIndex, setActiveTraderIndex] = useState(START_STATE.activeTraderIndex);
  const [leaderEvent, setLeaderEvent] = useState(START_STATE.leaderEvent);
  const [bossActive, setBossActive] = useState(START_STATE.bossActive);
  const [ending, setEnding] = useState(START_STATE.ending);
  const [traders, setTraders] = useState(START_STATE.traders);
  const [recentDelta, setRecentDelta] = useState(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const saved = loadGame();
    if (saved && Number.isFinite(saved.price) && Array.isArray(saved.history)) {
      const zone = zonesData.find((item) => item.id === saved.zoneId) ?? zonesData[0];
      const build = BUILDS.find((item) => item.id === saved.buildId) ?? BUILDS[1];
      setPrice(saved.price);
      setCombo(Number.isFinite(saved.combo) ? saved.combo : START_STATE.combo);
      setScore(Number.isFinite(saved.score) ? saved.score : START_STATE.score);
      setSelectedZone(zone);
      setSelectedBuild(build);
      setHistory(saved.history.length ? saved.history : START_STATE.history);
      setEventLog(Array.isArray(saved.eventLog) ? saved.eventLog : START_STATE.eventLog);
      setUnlockedAchievements(saved.unlockedAchievements ?? []);
      setActiveTraderIndex(Number.isInteger(saved.activeTraderIndex) ? ((saved.activeTraderIndex % START_STATE.traders.length) + START_STATE.traders.length) % START_STATE.traders.length : 0);
      setLeaderEvent(saved.leaderEvent ?? 'Bull');
      setTraders(Array.isArray(saved.traders) && saved.traders.length === START_STATE.traders.length ? saved.traders : START_STATE.traders);
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    saveGame({
      price,
      combo,
      score,
      selectedZone,
      selectedBuild,
      history,
      eventLog,
      unlockedAchievements,
      activeTraderIndex,
      leaderEvent,
      traders,
      unlockedAchievements,
      activeTraderIndex
    });
  }, [hydrated, price, combo, score, selectedZone, selectedBuild, history, eventLog, unlockedAchievements, activeTraderIndex, leaderEvent, traders]);

  useEffect(() => {
    if (!bossActive) return undefined;
    const timeout = window.setTimeout(() => setBossActive(null), 2400);
    return () => window.clearTimeout(timeout);
  }, [bossActive]);

  const tradersWithDialogue = useMemo(
    () => traders.map((trader) => ({
      ...trader,
      lastEvent: trader.memory[0] || 'Calibrating',
      dialogue: getDialogue(trader)
    })),
    [traders]
  );

  const activeTrader = tradersWithDialogue[activeTraderIndex];

  const eventOptions = EVENTS.map((event) => ({
    id: event.id,
    label: event.label,
    description: event.description
  }));

  const awardAchievements = ({ score: currentScore, combo: currentCombo, buildId }) => {
    const earned = ACHIEVEMENTS.filter((achievement) => {
      if (unlockedAchievements.includes(achievement.id)) return false;
      return achievement.condition({ score: currentScore, combo: currentCombo, buildId });
    }).map((achievement) => achievement.id);

    if (earned.length) {
      setUnlockedAchievements((prev) => [...prev, ...earned]);
      setAchievementQueue((prev) => [...prev, ...earned]);
    }
  };

  useEffect(() => {
    awardAchievements({ score, combo, buildId: selectedBuild.id });
  }, [score, combo, selectedBuild.id]);

  const triggerEvent = (type) => {
    const impact = eventImpact(type, selectedZone.multiplier, selectedBuild.id);
    const adjusted = {
      price: Math.round(impact.price * randomFactor()),
      combo: Math.round(impact.combo * randomFactor()),
      score: Math.round(impact.score * randomFactor())
    };

    const nextPrice = clamp(price + adjusted.price, 100, 9999);
    const nextCombo = Math.max(0, combo + adjusted.combo);
    const nextScore = score + adjusted.score;
    const nextHistory = [...history, { price: nextPrice, label: `${type}` }].slice(-20);
    const nextLog = [{ type, impact: adjusted, time: Date.now() }, ...eventLog].slice(0, 5);
    const updatedTraders = traders.map((trader) => ({
      ...trader,
      memory: [type, ...trader.memory].slice(0, 5)
    }));

    setPrice(nextPrice);
    setCombo(nextCombo);
    setScore(nextScore);
    setHistory(nextHistory);
    setEventLog(nextLog);
    setLeaderEvent(type);
    setBossActive(type === 'Liquidity Raid' ? 'JPOW' : type === 'Black Swan' ? 'BLACK SWAN' : null);
    setActiveTraderIndex((prev) => (prev + 1) % traders.length);
    setTraders(updatedTraders);
    setRecentDelta(adjusted.score);

    awardAchievements({ score: nextScore, combo: nextCombo, buildId: selectedBuild.id });

    if (nextScore >= 10) setEnding({ title: 'GOD', subtitle: 'You control the market.', icon: '👑' });
    else if (nextScore >= 5) setEnding({ title: 'RICH', subtitle: 'You mastered profit.', icon: '💰' });
    else if (nextScore <= -10) setEnding({ title: 'CORRUPTED', subtitle: 'You became the manipulation.', icon: '🐋' });
    else if (nextScore <= -5) setEnding({ title: 'BROKE', subtitle: 'Market destroyed you.', icon: '📉' });
    else setEnding(null);
  };

  const selectZone = (zone) => setSelectedZone(zone);
  const selectBuild = (build) => setSelectedBuild(build);

  const resetGame = () => {
    setPrice(START_STATE.price);
    setCombo(START_STATE.combo);
    setScore(START_STATE.score);
    setSelectedZone(START_STATE.selectedZone);
    setSelectedBuild(START_STATE.selectedBuild);
    setHistory(START_STATE.history);
    setEventLog(START_STATE.eventLog);
    setAchievementQueue(START_STATE.achievementQueue);
    setUnlockedAchievements(START_STATE.unlockedAchievements);
    setActiveTraderIndex(START_STATE.activeTraderIndex);
    setLeaderEvent(START_STATE.leaderEvent);
    setBossActive(START_STATE.bossActive);
    setEnding(START_STATE.ending);
    setTraders(START_STATE.traders);
    setRecentDelta(null);
  };

  return {
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
    unlockedAchievements,
    achievementQueue,
    zones: zonesData,
    builds: BUILDS,
    events: eventOptions,
    traders,
    recentDelta,
    triggerEvent,
    selectZone,
    selectBuild,
    setAchievementQueue,
    resetGame
  };
}
