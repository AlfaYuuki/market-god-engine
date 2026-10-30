(() => {
  "use strict";

  // Market God Engine — live, simulated market. The player is the only trader.
  const STORAGE_KEY = "market-god-engine-save";
  const START_CASH = 100000;
  const FEE_RATE = 0.001;
  const zones = [
    { id:"new-york", label:"New York", multiplier:1.1, volatility:1.0 },
    { id:"london", label:"London", multiplier:1.0, volatility:.88 },
    { id:"tokyo", label:"Tokyo", multiplier:1.2, volatility:1.12 },
    { id:"hong-kong", label:"Hong Kong", multiplier:1.15, volatility:1.18 },
    { id:"dubai", label:"Dubai", multiplier:1.3, volatility:1.25 }
  ];
  const builds = [
    { id:"Scalper", label:"Scalper", description:"Fast moves · higher volatility", theme:"⚡", volatility:1.45 },
    { id:"Swing Trader", label:"Swing Trader", description:"Balanced market exposure", theme:"🌊", volatility:1 },
    { id:"Whale", label:"Whale", description:"Large swings · high exposure", theme:"🐋", volatility:1.8 }
  ];
  const events = [
    { id:"Bull", icon:"📈", label:"Bull Run", description:"Strong buying pressure lifts prices." },
    { id:"Bear", icon:"📉", label:"Bear Pressure", description:"Sellers push the market lower." },
    { id:"Liquidity Raid", icon:"⚠️", label:"Liquidity Raid", description:"A sudden liquidity shock." },
    { id:"Black Swan", icon:"🌑", label:"Black Swan", description:"An unpredictable market shock." }
  ];
  const achievements = [
    { id:"First Trade", icon:"🎯", desc:"Complete your first buy or sell." },
    { id:"Profit Maker", icon:"💹", desc:"Reach $1,000 in realized profit." },
    { id:"Market Survivor", icon:"🛡️", desc:"Keep your portfolio above starting capital." },
    { id:"Big Position", icon:"🐋", desc:"Hold at least 10 MGX." },
    { id:"Market God", icon:"👑", desc:"Grow your equity to $150,000." }
  ];
  const eventEffects = {
    Bull:{ pct:.012, score:1, combo:1, message:"Buyers are taking control. Momentum turns bullish." },
    Bear:{ pct:-.010, score:-1, combo:1, message:"Sell pressure is building across the market." },
    "Liquidity Raid":{ pct:-.025, score:-2, combo:2, message:"Liquidity vanished. Volatility spikes sharply." },
    "Black Swan":{ pct:Math.random() < .5 ? -.045 : .045, score:-3, combo:-1, message:"Unexpected shock! The market reprices violently." }
  };
  const initial = () => ({
    price:2000, cash:START_CASH, units:0, avgCost:0, realizedPnl:0,
    tradeCount:0, playerName:"Player", zoneId:"new-york", buildId:"Swing Trader",
    combo:0, score:0, tick:0, paused:false, momentum:0, nextEventIn:24,
    history:Array.from({length:24},(_,i)=>({price:2000 + Math.sin(i/3)*3,label:"Opening"})),
    eventLog:[], tradeLog:[], unlockedAchievements:[]
  });
  let state=initial(), toastTimer=null, bossTimer=null, saveCounter=0;
  const $=id=>document.getElementById(id);
  const clamp=(v,min,max)=>Math.min(max,Math.max(min,v));
  const fmt=n=>Math.round(n).toLocaleString("en-US");
  const money=n=>(n<0?"−":"")+"$"+Math.abs(n).toLocaleString("en-US",{minimumFractionDigits:2,maximumFractionDigits:2});
  const units=n=>n.toFixed(4)+" MGX";
  const currentZone=()=>zones.find(z=>z.id===state.zoneId)||zones[0];
  const currentBuild=()=>builds.find(b=>b.id===state.buildId)||builds[1];
  const equity=()=>state.cash+state.units*state.price;
  const unrealized=()=>state.units*(state.price-state.avgCost);
  const escapeHTML=s=>String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));

  function load(){
    try{
      const raw=localStorage.getItem(STORAGE_KEY); if(!raw)return;
      const s=JSON.parse(raw); if(!s||typeof s!=="object"||!Number.isFinite(s.price))return;
      const base=initial();
      state={
        ...base,
        price:clamp(s.price,100,1000000),
        cash:Number.isFinite(s.cash)?Math.max(0,s.cash):START_CASH,
        units:Number.isFinite(s.units)?Math.max(0,s.units):0,
        avgCost:Number.isFinite(s.avgCost)?Math.max(0,s.avgCost):0,
        realizedPnl:Number.isFinite(s.realizedPnl)?s.realizedPnl:0,
        tradeCount:Number.isFinite(s.tradeCount)?Math.max(0,s.tradeCount):0,
        playerName:typeof s.playerName==="string"?s.playerName.slice(0,22):"Player",
        zoneId:zones.some(z=>z.id===(s.zoneId||s.selectedZone))?(s.zoneId||s.selectedZone):base.zoneId,
        buildId:builds.some(b=>b.id===(s.buildId||s.selectedBuild))?(s.buildId||s.selectedBuild):base.buildId,
        combo:Number.isFinite(s.combo)?Math.max(0,s.combo):0,
        score:Number.isFinite(s.score)?s.score:0,
        tick:Number.isFinite(s.tick)?Math.max(0,s.tick):0,
        momentum:Number.isFinite(s.momentum)?clamp(s.momentum,-.01,.01):0,
        history:Array.isArray(s.history)&&s.history.length?s.history.filter(p=>p&&Number.isFinite(p.price)).slice(-80):base.history,
        eventLog:Array.isArray(s.eventLog)?s.eventLog.slice(0,6):[],
        tradeLog:Array.isArray(s.tradeLog)?s.tradeLog.slice(0,6):[],
        unlockedAchievements:Array.isArray(s.unlockedAchievements)?s.unlockedAchievements.filter(a=>achievements.some(x=>x.id===a)):[],
        nextEventIn:Number.isFinite(s.nextEventIn)?clamp(s.nextEventIn,8,60):24
      };
    }catch(_){/* Invalid or blocked storage: run a fresh session. */}
  }
  function save(){
    try{
      const {price,cash,units:held,avgCost,realizedPnl,tradeCount,playerName,zoneId,buildId,combo,score,tick,momentum,history,eventLog,tradeLog,unlockedAchievements,nextEventIn}=state;
      localStorage.setItem(STORAGE_KEY,JSON.stringify({price,cash,units:held,avgCost,realizedPnl,tradeCount,playerName,zoneId,buildId,combo,score,tick,momentum,history,eventLog,tradeLog,unlockedAchievements,nextEventIn}));
    }catch(_){showToast("Browser storage unavailable — this session can still run.");}
  }
  function toast(message){
    $("toast").textContent=message;$("toast").classList.add("show");
    clearTimeout(toastTimer);toastTimer=setTimeout(()=>$("toast").classList.remove("show"),2500);
  }
  function addJournal(type,qty,price,detail){
    state.tradeLog.unshift({type,qty,price,detail,time:Date.now()});state.tradeLog=state.tradeLog.slice(0,6);
  }
  function trade(side){
    const input=$("trade-quantity"),qty=Number(input.value);
    if(!Number.isFinite(qty)||qty<=0){toast("Enter a valid order size.");return;}
    if(qty>100000){toast("Order size is too large.");return;}
    const gross=qty*state.price,fee=gross*FEE_RATE;
    if(side==="BUY"){
      const total=gross+fee;
      if(total>state.cash+1e-8){toast("Not enough cash for this order, including fees.");return;}
      state.avgCost=(state.avgCost*state.units+total)/(state.units+qty);
      state.units+=qty;state.cash-=total;state.combo++;
      addJournal("BUY",qty,state.price,"Fee "+money(fee));
      toast("Bought "+units(qty)+" at "+money(state.price));
    }else{
      if(qty>state.units+1e-8){toast("You cannot sell more MGX than you hold.");return;}
      const proceeds=gross-fee;
      const pnl=(state.price-state.avgCost)*qty-fee;
      state.realizedPnl+=pnl;state.cash+=proceeds;state.units-=qty;
      if(state.units<.0000001){state.units=0;state.avgCost=0;}
      state.combo=pnl>=0?state.combo+1:Math.max(0,state.combo-1);
      addJournal("SELL",qty,state.price,(pnl>=0?"Realized profit ":"Realized loss ")+money(pnl));
      toast("Sold "+units(qty)+" · "+(pnl>=0?"P/L ":"P/L ")+money(pnl));
    }
    state.tradeCount++;state.score+=side==="BUY"?1:0;
    awardAchievements();save();render();
  }
  function awardAchievements(){
    const checks={
      "First Trade":state.tradeCount>=1,
      "Profit Maker":state.realizedPnl>=1000,
      "Market Survivor":equity()>START_CASH,
      "Big Position":state.units>=10,
      "Market God":equity()>=150000
    };
    const earned=[];
    achievements.forEach(a=>{if(checks[a.id]&&!state.unlockedAchievements.includes(a.id)){state.unlockedAchievements.push(a.id);earned.push(a.id);}});
    if(earned.length)toast("Achievement unlocked: "+earned.join(" · "));
  }
  function applyEvent(type,automatic=false){
    const effect=eventEffects[type];if(!effect)return;
    const pct=type==="Black Swan"?(Math.random()<.5?-.045:.045):effect.pct;
    const old=state.price;
    state.price=clamp(state.price*(1+pct*currentZone().multiplier),50,1000000);
    state.momentum=clamp(state.momentum+pct*.12,-.01,.01);
    state.combo=Math.max(0,state.combo+effect.combo);state.score+=effect.score;
    const impact=state.price-old;
    state.history.push({price:state.price,label:type});state.history=state.history.slice(-80);
    state.eventLog.unshift({type,impact:Math.round(impact),message:effect.message,time:Date.now()});state.eventLog=state.eventLog.slice(0,6);
    state.nextEventIn=automatic?26+Math.floor(Math.random()*22):Math.max(12,state.nextEventIn-4);
    if(type==="Liquidity Raid"||type==="Black Swan")showBoss(type);
    awardAchievements();save();render();
    if(automatic)toast("LIVE MARKET EVENT · "+type.toUpperCase());
  }
  function tick(){
    if(state.paused||document.hidden)return;
    const zone=currentZone(),build=currentBuild();
    const noise=(Math.random()+Math.random()+Math.random()+Math.random()-2)*.0019;
    const cycle=Math.sin(state.tick/17)*.00028;
    const drift=state.momentum*.12;
    const move=(noise+cycle+drift)*zone.volatility*build.volatility;
    const old=state.price;
    state.price=clamp(state.price*(1+move),50,1000000);
    state.momentum=clamp(state.momentum*.91+noise*.08,-.006,.006);
    state.tick++;
    if(state.tick%2===0){state.history.push({price:state.price,label:"Live"});state.history=state.history.slice(-80);}
    state.nextEventIn--;
    if(state.nextEventIn<=0){
      const roll=Math.random();
      const type=roll<.48?"Bull":roll<.84?"Bear":roll<.95?"Liquidity Raid":"Black Swan";
      applyEvent(type,true);return;
    }
    saveCounter++;
    renderMarketNumbers(old);
    if(saveCounter>=5){save();saveCounter=0;}
    requestAnimationFrame(drawChart);
  }
  function showBoss(type){
    const data=type==="Liquidity Raid"
      ?{title:"LIQUIDITY RAID",sub:"MARKET DEPTH COLLAPSE",desc:"Liquidity has dried up and volatility is elevated. Review your position before placing another order."}
      :{title:"BLACK SWAN",sub:"UNEXPECTED MARKET SHOCK",desc:"An unpredictable event has moved the market sharply. Your portfolio value is changing with every tick."};
    $("boss-title").textContent=data.title;$("boss-subtitle").textContent=data.sub;$("boss-description").textContent=data.desc;
    $("boss-overlay").hidden=false;clearTimeout(bossTimer);bossTimer=setTimeout(()=>$("boss-overlay").hidden=true,4000);
  }
  function rank(){
    const growth=equity()-START_CASH;
    if(growth>=50000)return"MARKET LEGEND";
    if(growth>=20000)return"ELITE TRADER";
    if(growth>=5000)return"PRO TRADER";
    if(state.tradeCount>=1)return"ACTIVE TRADER";
    return"ROOKIE";
  }
  function renderChoices(){
    $("zone-options").innerHTML=zones.map(z=>{const on=z.id===state.zoneId;return '<button class="choice-button '+(on?"selected":"")+'" data-zone="'+z.id+'" aria-pressed="'+on+'" type="button"><span class="choice-name">'+z.label+(on?'<span class="check">✓</span>':"")+'</span><span class="choice-detail">×'+z.multiplier.toFixed(2)+' IMPACT</span></button>';}).join("");
    $("build-options").innerHTML=builds.map(b=>{const on=b.id===state.buildId;return '<button class="choice-button '+(on?"selected":"")+'" data-build="'+b.id+'" aria-pressed="'+on+'" type="button"><span class="choice-name">'+b.theme+" "+b.label+(on?'<span class="check">✓</span>':"")+'</span><span class="choice-detail">'+b.description+'</span></button>';}).join("");
    $("event-options").innerHTML=events.map(e=>'<button class="event-button '+(e.id==="Black Swan"?"black-swan":"")+'" data-event="'+e.id+'" type="button"><span class="event-icon">'+e.icon+'</span><strong>'+e.label+'</strong><small>'+e.description+'</small></button>').join("");
  }
  function renderMarketNumbers(previous=state.price){
    $("price-value").textContent=money(state.price);
    $("price-foot").textContent=(state.price>=2000?"▲ ":"▼ ")+((state.price/2000-1)*100).toFixed(2)+"% since opening";
    $("combo-value").textContent=fmt(state.combo);
    $("combo-foot").textContent=state.combo>=10?"STREAK MODE ACTIVE":state.combo?"Trading momentum":"Place your first trade";
    $("equity-value").textContent=money(equity());
    $("equity-foot").textContent=(equity()>=START_CASH?"+":"")+money(equity()-START_CASH)+" total return";
    $("chart-last").textContent="LATEST · "+money(state.price);
    $("cash-value").textContent=money(state.cash);
    $("holdings-value").textContent=units(state.units);
    $("avg-price-value").textContent=state.units?money(state.avgCost):"—";
    $("unrealized-value").textContent=money(unrealized());
    $("unrealized-value").className=unrealized()>=0?"positive":"negative";
    $("realized-value").textContent=money(state.realizedPnl);
    $("realized-value").className=state.realizedPnl>=0?"positive":"negative";
    $("net-worth-value").textContent=money(equity());
    $("player-rank").textContent=rank();
    $("market-state").textContent=state.paused?"PAUSED":"RUNNING";
    $("pause-button").textContent=state.paused?"▶ RESUME MARKET":"Ⅱ PAUSE MARKET";
    $("tick-clock").textContent="TICK "+state.tick+" · NEXT EVENT "+state.nextEventIn+"s";
    $("trade-estimate").textContent="Estimated order: "+money(Math.max(0,Number($("trade-quantity").value)||0)*state.price)+" + fee";
    $("buy-button").disabled=(Number($("trade-quantity").value)||0)*state.price*(1+FEE_RATE)>state.cash;
    $("sell-button").disabled=(Number($("trade-quantity").value)||0)>state.units;
    if(previous!==state.price){$("price-value").classList.remove("price-up","price-down");void $("price-value").offsetWidth;$("price-value").classList.add(state.price>=previous?"price-up":"price-down");}
  }
  function renderPlayer(){
    $("player-name").value=state.playerName;
    if(!state.tradeLog.length){$("event-log").innerHTML='<div class="log-empty">Your journal is empty. Place your first buy or sell order.</div>';return;}
    $("event-log").innerHTML=state.tradeLog.map(t=>'<article class="log-item"><div class="log-type '+(t.type==="BUY"?"positive":"negative")+'">'+t.type+' · '+units(t.qty)+'</div><div class="log-impact"><span>'+money(t.price)+'</span><span>'+escapeHTML(t.detail)+'</span></div></article>').join("");
  }
  function renderEvents(){
    if(!state.eventLog.length){$("event-log").insertAdjacentHTML("beforeend","");return;}
    // Market headlines are shown in the player journal's adjacent event log only after an event.
  }
  function renderAchievements(){
    $("achievement-count").textContent=state.unlockedAchievements.length+" / "+achievements.length;
    $("achievement-list").innerHTML=achievements.map(a=>{const done=state.unlockedAchievements.includes(a.id);return '<div class="achievement-item '+(done?"unlocked":"")+'"><span class="achievement-icon">'+a.icon+'</span><div><div class="achievement-name">'+a.id+'</div><div class="achievement-desc">'+a.desc+'</div></div><span class="achievement-status">'+(done?"UNLOCKED":"LOCKED")+'</span></div>';}).join("");
  }
  function renderLeader(){
    const latest=state.eventLog[0];
    const title=latest?latest.type+" MARKET": "MARKET OPEN";
    const message=latest?latest.message:"The simulated exchange is open. Price updates automatically every second.";
    const icon=latest?({Bull:"📈",Bear:"📉","Liquidity Raid":"⚠️","Black Swan":"🌑"}[latest.type]||"◈"):"◈";
    $("leader-card").innerHTML='<div class="leader-icon">'+icon+'</div><div><div class="leader-label">LIVE EXCHANGE / MARKET NEWS</div><div class="leader-title">'+title+'</div><div class="leader-reaction">'+escapeHTML(message)+'</div></div>';
  }
  function render(){
    renderChoices();renderPlayer();renderAchievements();renderLeader();renderMarketNumbers();requestAnimationFrame(drawChart);
  }
  function drawChart(){
    const canvas=$("price-chart"),rect=canvas.getBoundingClientRect();if(!rect.width||!rect.height)return;
    const dpr=Math.min(devicePixelRatio||1,2);canvas.width=Math.round(rect.width*dpr);canvas.height=Math.round(rect.height*dpr);
    const ctx=canvas.getContext("2d");ctx.scale(dpr,dpr);
    const w=rect.width,h=rect.height,pad={l:12,r:12,t:18,b:22};
    const pts=state.history.slice(-65),vals=pts.map(p=>p.price);
    let min=Math.min(...vals),max=Math.max(...vals);if(max-min<20){min-=10;max+=10;}const range=max-min||1;
    const x=i=>pad.l+i*(w-pad.l-pad.r)/Math.max(1,pts.length-1);
    const y=v=>pad.t+(max-v)/range*(h-pad.t-pad.b);
    ctx.clearRect(0,0,w,h);ctx.font="9px ui-monospace,monospace";ctx.fillStyle="rgba(128,146,172,.7)";
    for(let i=0;i<4;i++){const yy=pad.t+i*(h-pad.t-pad.b)/3;ctx.strokeStyle="rgba(151,177,216,.1)";ctx.beginPath();ctx.moveTo(pad.l,yy);ctx.lineTo(w-pad.r,yy);ctx.stroke();ctx.fillText("$"+Math.round(max-i*range/3).toLocaleString("en-US"),pad.l+3,yy-5);}
    if(pts.length<2)return;
    const gradient=ctx.createLinearGradient(0,pad.t,0,h-pad.b);gradient.addColorStop(0,"rgba(66,217,245,.22)");gradient.addColorStop(1,"rgba(66,217,245,0)");
    ctx.beginPath();pts.forEach((p,i)=>i?ctx.lineTo(x(i),y(p.price)):ctx.moveTo(x(i),y(p.price)));ctx.lineTo(x(pts.length-1),h-pad.b);ctx.lineTo(x(0),h-pad.b);ctx.closePath();ctx.fillStyle=gradient;ctx.fill();
    ctx.beginPath();pts.forEach((p,i)=>i?ctx.lineTo(x(i),y(p.price)):ctx.moveTo(x(i),y(p.price)));ctx.strokeStyle="#42d9f5";ctx.lineWidth=2.3;ctx.lineJoin="round";ctx.shadowColor="rgba(66,217,245,.5)";ctx.shadowBlur=10;ctx.stroke();ctx.shadowBlur=0;
    const last=pts.length-1;ctx.beginPath();ctx.arc(x(last),y(pts[last].price),4,0,Math.PI*2);ctx.fillStyle="#e7fbff";ctx.fill();
  }
  function reset(){
    if(!confirm("Reset the market and erase your player portfolio and trade history?"))return;
    state=initial();try{localStorage.removeItem(STORAGE_KEY);}catch(_){}
    $("boss-overlay").hidden=true;render();toast("New session started. You are the trader.");
  }

  document.addEventListener("click",e=>{
    const z=e.target.closest("[data-zone]"),b=e.target.closest("[data-build]"),ev=e.target.closest("[data-event]");
    if(z){state.zoneId=z.dataset.zone;save();render();}
    if(b){state.buildId=b.dataset.build;save();render();}
    if(ev)applyEvent(ev.dataset.event,false);
    if(e.target.closest("[data-close-overlay]"))$("boss-overlay").hidden=true;
  });
  $("buy-button").addEventListener("click",()=>trade("BUY"));
  $("sell-button").addEventListener("click",()=>trade("SELL"));
  $("trade-quantity").addEventListener("input",()=>renderMarketNumbers());
  $("player-name").addEventListener("change",e=>{state.playerName=e.target.value.trim().slice(0,22)||"Player";save();toast("Trader identity updated.");});
  $("pause-button").addEventListener("click",()=>{state.paused=!state.paused;renderMarketNumbers();save();});
  $("reset-button").addEventListener("click",reset);
  $("ending-reset").addEventListener("click",reset);
  window.addEventListener("resize",()=>requestAnimationFrame(drawChart));
  document.addEventListener("visibilitychange",()=>{save();});
  load();render();
  setInterval(tick,1000);
})();