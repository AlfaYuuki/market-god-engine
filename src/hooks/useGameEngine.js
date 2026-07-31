import { useEffect, useMemo, useState } from 'react';
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

const EVENTS = ['Bull', 'Bear', 'Liquidity Raid', 'Black Swan'];

const ACHIEVEMENTS = [
  { id: 'Market God', condition: (score) => score >= 10, description: 'You dominate the market.' },
  { id: 'Combo Master', condition: (combo) => combo >= 12, description: 'A flawless streak.' },
  { id: 'Bull King', condition: (score) => score >= 5, description: 'Riding the bull wave.' },
  { id: 'Survivor', condition: (score) => score >= 0, description: 'Still in control.' },
  { id: 'Whale', condition: (_, buildId) => buildId === 'Whale', description: 'Massive market power.' }
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
  ending: null
};

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
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
  const [traders, setTraders] = useState(tradersData);

  useEffect(() => {
    const saved = loadGame();
    if (saved) {
      const zone = zonesData.find((item) => item.id === saved.zoneId) ?? zonesData[0];
      const build = BUILDS.find((item) => item.id === saved.buildId) ?? BUILDS[1];
      setPrice(saved.price);
      setCombo(saved.combo);
      setScore(saved.score);
      setSelectedZone(zone);
      setSelectedBuild(build);
      setHistory(saved.history.length ? saved.history : START_STATE.history);
    }
  }, []);

  useEffect(() => {
    saveGame({ price, combo, score, selectedZone, selectedBuild, history });
  }, [price, combo, score, selectedZone, selectedBuild, history]);

  const tradersWithDialogue = useMemo(
    () => traders.map((trader) => ({
      ...trader,
      lastEvent: trader.memory[0] || 'None',
      dialogue: dialogueMap[trader.memory[0]]?.[Math.floor(Math.random() * 3)] ?? 'Watching the data stream.'
    })),
    [traders]
  );

  const activeTrader = tradersWithDialogue[activeTraderIndex];

  const eventOptions = EVENTS.map((type) => ({
    id: type,
    label: type,
    description: `${type} market impact.`
  }));

  const triggerEvent = (type) => {
    const impact = eventImpact(type, selectedZone.multiplier, selectedBuild.id);
    const nextPrice = clamp(price + impact.price, 100, 9999);
    const nextCombo = Math.max(0, combo + impact.combo);
    const nextScore = score + impact.score;
    const nextHistory = [...history, { price: nextPrice, label: type }].slice(-20);
    const nextLog = [{ type, impact, time: Date.now() }, ...eventLog].slice(0, 5);
    const nextTraders = traders.map((trader, index) => ({
      ...trader,
      memory: index === activeTraderIndex ? [type, ...trader.memory].slice(0, 5) : trader.memory
    }));

    setPrice(nextPrice);
    setCombo(nextCombo);
    setScore(nextScore);
    setHistory(nextHistory);
    setEventLog(nextLog);
    setLeaderEvent(type);
    setBossActive(type === 'Liquidity Raid' ? 'JPOW' : type === 'Black Swan' ? 'BLACK SWAN' : null);
    setActiveTraderIndex((prev) => (prev + 1) % traders.length);
    setTraders(nextTraders);

    const earned = ACHIEVEMENTS.filter((achievement) => {
      if (unlockedAchievements.includes(achievement.id)) return false;
      return achievement.condition(type === 'Combo Master' ? nextCombo : nextScore, selectedBuild.id, nextCombo);
    }).map((achievement) => achievement.id);

    if (earned.length) {
      setUnlockedAchievements((prev) => [...prev, ...earned]);
      setAchievementQueue((prev) => [...prev, ...earned]);
    }

    if (nextScore >= 10) setEnding({ title: 'GOD', subtitle: 'You control the market.', icon: '👑' });
    else if (nextScore >= 5) setEnding({ title: 'RICH', subtitle: 'You mastered profit.', icon: '💰' });
    else if (nextScore <= -10) setEnding({ title: 'CORRUPTED', subtitle: 'You became the manipulation.', icon: '🐋' });
    else if (nextScore <= -5) setEnding({ title: 'BROKE', subtitle: 'Market destroyed you.', icon: '📉' });
    else setEnding(null);
  };

  const resetGame = () => {
    setPrice(2000);
    setCombo(0);
    setScore(0);
    setSelectedZone(zonesData[0]);
    setSelectedBuild(BUILDS[1]);
    setHistory([{ price: 2000, label: 'Start' }]);
    setEventLog([]);
    setAchievementQueue([]);
    setUnlockedAchievements([]);
    setActiveTraderIndex(0);
    setLeaderEvent('Bull');
    setBossActive(null);
    setEnding(null);
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
    triggerEvent,
    selectZone: setSelectedZone,
    selectBuild: setSelectedBuild,
    setAchievementQueue,
    resetGame
  };
}
