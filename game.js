(() => {
"use strict";
const $ = (id) => document.getElementById(id);
const FEE_RATE = 0.001;
const STARTING_CASH = 100000;
const SAVE_KEY = "market-god-paper-terminal-v1";
const assets = [
  {symbol:"BTC/USD",name:"Bitcoin",className:"CRYPTO",unit:"BTC",price:67420,vol:.0028,spread:7,drift:.00002,icon:"₿"},
  {symbol:"ETH/USD",name:"Ethereum",className:"CRYPTO",unit:"ETH",price:3520,vol:.0034,spread:9,drift:.00001,icon:"Ξ"},
  {symbol:"AAPL",name:"Apple Inc.",className:"US EQUITY",unit:"SHARES",price:213.40,vol:.0015,spread:3,drift:.000015,icon:"A"},
  {symbol:"TSLA",name:"Tesla Inc.",className:"US EQUITY",unit:"SHARES",price:248.70,vol:.0038,spread:5,drift:-.00001,icon:"T"},
  {symbol:"EUR/USD",name:"Euro / US Dollar",className:"FOREX",unit:"EUR",price:1.0842,vol:.00055,spread:1.2,drift:0,icon:"€"},
  {symbol:"GOLD",name:"Gold Spot",className:"COMMODITY",unit:"OZ",price:2388.50,vol:.0011,spread:4,drift:.00001,icon:"Au"}
];
const state = {
  cash:STARTING_CASH, realized:0, selected:0, tick:0, simMinutes:9*60+30,
  timeframe:1, candles:{}, orders:[], history:[], positions:{}, startEquity:STARTING_CASH,
  initialPrices:{}, session:"US SESSION", lastSave:0
};
assets.forEach(a => { state.initialPrices[a.symbol]=a.price; state.candles[a.symbol]=[]; });
let activeTab = "orders";
let chartCtx = null;
const fmt = (n, digits=2) => Number(n).toLocaleString("en-US",{minimumFractionDigits:digits,maximumFractionDigits:digits});
const money = n => (n<0?"−":"")+"$"+fmt(Math.abs(n),2);
const pct = n => (n>0?"+":"")+fmt(n,2)+"%";
const current = () => assets[state.selected];
const mid = a => a.price;
const quote = a => { const half=a.price*(a.spread/10000)/2; return {bid:a.price-half,ask:a.price+half,spread:half*2}; };
const position = symbol => state.positions[symbol] || null;
const notify = (message,type="") => { const el=$("ticket-message"); el.textContent=message; el.className="ticket-message "+type; };
const simTime = () => { const h=Math.floor(state.simMinutes/60)%24,m=state.simMinutes%60; return String(h).padStart(2,"0")+":"+String(m).padStart(2,"0")+":00"; };
function equity(){return state.cash+assets.reduce((sum,a)=>sum+(position(a.symbol)?.qty||0)*a.price,0);}
function totalUnrealized(){return assets.reduce((sum,a)=>{const p=position(a.symbol);return sum+(p?(a.price-p.avg)*p.qty:0);},0);}
function priceText(a){return a.price<10?fmt(a.price,4):a.price<1000?fmt(a.price,2):fmt(a.price,2);}
function seedCandles(a){
  const list=[]; let p=a.price*(1-(Math.random()*.012));
  for(let i=0;i<90;i++){const o=p,change=(Math.random()-.49)*a.vol*2.3*p,c=Math.max(.00001,o+change),h=Math.max(o,c)*(1+Math.random()*a.vol*.35),l=Math.min(o,c)*(1-Math.random()*a.vol*.35);list.push({o,h,l,c,v:Math.random()*900+100});p=c;}
  const factor=a.price/p; list.forEach(c=>{c.o*=factor;c.h*=factor;c.l*=factor;c.c*=factor;}); list[list.length-1].c=a.price; list[list.length-1].h=Math.max(list[list.length-1].h,a.price);list[list.length-1].l=Math.min(list[list.length-1].l,a.price);state.candles[a.symbol]=list;
}
function renderMarkets(){
  $("market-list").innerHTML=assets.map((a,i)=>{const change=(a.price/state.initialPrices[a.symbol]-1)*100;return `<button class="market-item ${i===state.selected?"active":""}" data-asset="${i}"><span class="market-left"><span class="coin-icon">${a.icon}</span><span><span class="market-symbol">${a.symbol}</span><span class="market-name">${a.name}</span></span></span><span class="market-right"><span class="market-price">${a.price<10?fmt(a.price,4):"$"+priceText(a)}</span><span class="market-change ${change>=0?"positive":"negative"}">${pct(change)}</span></span></button>`;}).join("");
  document.querySelectorAll("[data-asset]").forEach(b=>b.addEventListener("click",()=>{state.selected=Number(b.dataset.asset);renderAll();}));
}
function renderHeader(){
  const a=current(),q=quote(a),change=(a.price/state.initialPrices[a.symbol]-1)*100;
  $("asset-class").textContent=a.className+" · SIMULATED";
  $("asset-name").innerHTML=a.name+" <span>"+a.symbol+"</span>";
  $("main-price").textContent=(a.className==="FOREX"?"": "$")+priceText(a);
  $("main-change").textContent=pct(change);$("main-change").className=change>=0?"positive":"negative";
  $("ticket-symbol").textContent=a.symbol;
  $("ticket-quote").textContent="Bid "+priceText({...a,price:q.bid})+" · Ask "+priceText({...a,price:q.ask});
  $("quantity-unit").textContent=a.unit;
  $("spread-value").textContent=fmt(q.spread,a.price<10?5:4)+" ("+fmt(a.spread,1)+" bps)";
  const candle=state.candles[a.symbol].at(-1);
  if(candle)$("ohlc-line").textContent="O "+priceText({...a,price:candle.o})+"   H "+priceText({...a,price:candle.h})+"   L "+priceText({...a,price:candle.l})+"   C "+priceText({...a,price:candle.c});
  const qty=Math.max(0,Number($("order-quantity").value)||0),est=qty*q.ask;
  $("order-estimate").textContent=money(est);$("fee-estimate").textContent=money(est*FEE_RATE);
  $("buy-button").disabled=qty<=0;
  $("sell-button").disabled=qty<=0||!position(a.symbol)||position(a.symbol).qty+1e-9<qty;
}
function renderAccount(){
  const eq=equity(),unreal=totalUnrealized(),total=eq-STARTING_CASH,ret=total/STARTING_CASH*100;
  $("equity-value").textContent=money(eq);$("cash-value").textContent=money(state.cash);$("pnl-value").textContent=money(total);$("pnl-value").className=total>=0?"positive":"negative";
  $("pnl-percent").textContent=pct(ret)+" total return";$("realized-value").textContent=money(state.realized);$("realized-value").className=state.realized>=0?"positive":"negative";
  $("position-count").textContent=Object.values(state.positions).filter(p=>p.qty>0).length+" positions";
  $("tick-label").textContent="Tick "+state.tick;
  $("market-clock").textContent=simTime();
  $("session-label").textContent=state.simMinutes%1440>=13*60&&state.simMinutes%1440<20*60?"US SESSION":state.simMinutes%1440>=7*60&&state.simMinutes%1440<16*60?"EU SESSION":"ASIA SESSION";
}
function renderPositions(){
  const rows=assets.filter(a=>position(a.symbol)?.qty>0).map(a=>{const p=position(a.symbol),u=(a.price-p.avg)*p.qty;return `<tr><td class="asset-cell">${a.symbol}<span class="sub-cell">${a.name}</span></td><td>${fmt(p.qty,4)}</td><td>${priceText({...a,price:p.avg})}</td><td>${priceText(a)}</td><td class="${u>=0?"positive":"negative"}">${money(u)}</td><td><button class="text-button" data-close="${a.symbol}">Close</button></td></tr>`;}).join("");
  $("positions-body").innerHTML=rows||'<tr><td colspan="6" class="empty-state">No open positions. Place a practice trade to get started.</td></tr>';
  document.querySelectorAll("[data-close]").forEach(b=>b.addEventListener("click",()=>{const a=assets.find(x=>x.symbol===b.dataset.close);const p=position(a.symbol);if(p)execute(a,"sell",p.qty,"MARKET","Manual close");}));
}
function renderActivity(){
  $("open-order-count").textContent=state.orders.length;
  if(activeTab==="orders"){
    $("activity-head").innerHTML="<tr><th>TIME</th><th>ASSET</th><th>SIDE</th><th>TYPE</th><th>QTY</th><th>TRIGGER</th><th>STATUS</th><th></th></tr>";
    const rows=state.orders.map(o=>`<tr><td>${o.time}</td><td>${o.symbol}</td><td class="${o.side==="buy"?"positive":"negative"}">${o.side.toUpperCase()}</td><td>${o.type.toUpperCase()}</td><td>${fmt(o.qty,4)}</td><td>${priceText({...assets.find(a=>a.symbol===o.symbol),price:o.trigger})}</td><td><span class="status-pill status-pending">PENDING</span></td><td><button class="text-button" data-cancel="${o.id}">Cancel</button></td></tr>`).join("");
    $("activity-body").innerHTML=rows||'<tr><td colspan="8" class="empty-state">No pending orders. Limit and stop orders will appear here.</td></tr>';
    document.querySelectorAll("[data-cancel]").forEach(b=>b.addEventListener("click",()=>{state.orders=state.orders.filter(o=>o.id!==b.dataset.cancel);renderActivity();save();notify("Pending order cancelled.","good");}));
  }else{
    $("activity-head").innerHTML="<tr><th>TIME</th><th>ASSET</th><th>SIDE</th><th>TYPE</th><th>QTY</th><th>FILL PRICE</th><th>FEE</th><th>REALIZED P&amp;L</th></tr>";
    const rows=state.history.slice(0,40).map(t=>`<tr><td>${t.time}</td><td>${t.symbol}</td><td class="${t.side==="buy"?"positive":"negative"}">${t.side.toUpperCase()}</td><td>${t.type}</td><td>${fmt(t.qty,4)}</td><td>${priceText({...assets.find(a=>a.symbol===t.symbol),price:t.price})}</td><td>${money(t.fee)}</td><td class="${t.pnl>=0?"positive":"negative"}">${t.side==="buy"?"—":money(t.pnl)}</td></tr>`).join("");
    $("activity-body").innerHTML=rows||'<tr><td colspan="8" class="empty-state">Your completed trades will appear here.</td></tr>';
  }
}
function renderAll(){renderMarkets();renderHeader();renderAccount();renderPositions();renderActivity();drawChart();}
function recordTrade(a,side,qty,fill,type,fee,pnl){
  state.history.unshift({id:crypto.randomUUID?crypto.randomUUID():String(Date.now()+Math.random()),time:simTime(),symbol:a.symbol,side,qty,price:fill,type,fee,pnl});
  state.history=state.history.slice(0,150);
}
function execute(a,side,qty,type="MARKET",reason="Order filled"){
  qty=Number(qty);if(!Number.isFinite(qty)||qty<=0)return false;
  const q=quote(a),impact=Math.min(.004,(qty*a.price/Math.max(1000000,a.price*15000))*.0008);
  const slippage=a.price*(.00008+impact)*(1+(Math.random()*.4));
  const fill=side==="buy"?q.ask+slippage:q.bid-slippage,notional=fill*qty,fee=notional*FEE_RATE;
  if(side==="buy"){
    if(state.cash+1e-8<notional+fee){notify("Not enough available cash for this order, including estimated fees.","bad");return false;}
    const old=position(a.symbol),oldQty=old?.qty||0,avg=oldQty?((old.avg*oldQty)+(fill*qty))/(oldQty+qty):fill;
    state.cash-=notional+fee;state.positions[a.symbol]={qty:oldQty+qty,avg,stop:old?.stop||null,target:old?.target||null};
    const sl=Number($("stop-loss").value),tp=Number($("take-profit").value);
    if(a.symbol===current().symbol){if(sl>0&&sl<fill)state.positions[a.symbol].stop=sl;if(tp>fill)state.positions[a.symbol].target=tp;}
    state.realized-=fee;recordTrade(a,side,qty,fill,type,fee,0);
  }else{
    const p=position(a.symbol);if(!p||p.qty+1e-9<qty){notify("You can only sell units you currently hold. Short selling is disabled in this practice account.","bad");return false;}
    const pnl=(fill-p.avg)*qty-fee;state.cash+=notional-fee;state.realized+=pnl;p.qty-=qty;if(p.qty<1e-8)delete state.positions[a.symbol];recordTrade(a,side,qty,fill,type,fee,pnl);
  }
  notify(reason+" · "+side.toUpperCase()+" "+fmt(qty,4)+" "+a.unit+" at "+priceText({...a,price:fill}),"good");
  renderAll();save();return true;
}
function placeOrder(side){
  const a=current(),qty=Number($("order-quantity").value),type=$("order-type").value,trigger=Number($("trigger-price").value);
  if(!Number.isFinite(qty)||qty<=0){notify("Enter a quantity greater than zero.","bad");return;}
  if(side==="sell"&&(!position(a.symbol)||position(a.symbol).qty+1e-9<qty)){notify("Your available position is smaller than this sell quantity.","bad");return;}
  if(type!=="market"&&(!Number.isFinite(trigger)||trigger<=0)){notify("Enter a valid trigger price.","bad");return;}
  if(type==="market"){execute(a,side,qty,"MARKET","Market order filled");return;}
  state.orders.unshift({id:String(Date.now())+Math.random(),symbol:a.symbol,side,qty,type,trigger,time:simTime()});
  notify(type.toUpperCase()+" order placed. It will execute if the simulated market reaches your trigger.","good");renderActivity();save();
}
function processOrders(){
  const remaining=[];
  state.orders.forEach(o=>{
    const a=assets.find(x=>x.symbol===o.symbol);const hit=o.type==="limit"?(o.side==="buy"?a.price<=o.trigger:a.price>=o.trigger):(o.side==="buy"?a.price>=o.trigger:a.price<=o.trigger);
    if(hit){const ok=execute(a,o.side,o.qty,o.type.toUpperCase(),"Pending "+o.type+" filled");if(!ok){}}
    else remaining.push(o);
  });
  if(remaining.length!==state.orders.length){state.orders=remaining;renderActivity();}
}
function checkRiskExits(){
  assets.forEach(a=>{const p=position(a.symbol);if(!p)return;
    if(p.stop&&a.price<=p.stop){execute(a,"sell",p.qty,"STOP LOSS","Stop-loss triggered");}
    else if(p.target&&a.price>=p.target){execute(a,"sell",p.qty,"TAKE PROFIT","Take-profit triggered");}
  });
}
function tick(){
  state.tick++;state.simMinutes++;
  assets.forEach(a=>{
    const shock=(Math.random()-.5)*2*a.vol;
    const momentum=(Math.random()-.5)*a.vol*.22;
    const drift=a.drift+(Math.sin(state.tick/180)*a.vol*.025);
    const change=Math.max(-.025,Math.min(.025,shock+momentum+drift));
    const old=a.price;a.price=Math.max(.00001,a.price*(1+change));
    const list=state.candles[a.symbol],c=list[list.length-1];c.c=a.price;c.h=Math.max(c.h,a.price);c.l=Math.min(c.l,a.price);c.v+=Math.random()*300;
    if(state.tick%state.timeframe===0){list.push({o:a.price,h:a.price,l:a.price,c:a.price,v:Math.random()*1000+150});if(list.length>110)list.shift();}
  });
  processOrders();checkRiskExits();
  if(state.tick%2===0)renderAll();else{renderMarkets();renderHeader();renderAccount();}
  if(state.tick%8===0)save();
}
function drawChart(){
  const canvas=$("price-chart");if(!canvas)return;
  const rect=canvas.getBoundingClientRect();if(!rect.width||!rect.height)return;
  const dpr=Math.min(window.devicePixelRatio||1,2);canvas.width=Math.round(rect.width*dpr);canvas.height=Math.round(rect.height*dpr);
  const ctx=canvas.getContext("2d");chartCtx=ctx;ctx.scale(dpr,dpr);
  const w=rect.width,h=rect.height,a=current(),data=state.candles[a.symbol].filter((_,i)=>i%state.timeframe===0).slice(-75);
  ctx.clearRect(0,0,w,h);const pad={l:8,r:68,t:15,b:22},cw=w-pad.l-pad.r,ch=h-pad.t-pad.b;
  if(data.length<2)return;
  const min=Math.min(...data.map(c=>c.l)),max=Math.max(...data.map(c=>c.h)),range=Math.max(max-min,a.price*.002);
  const lo=min-range*.12,hi=max+range*.12;
  const y=v=>pad.t+(hi-v)/(hi-lo)*ch;
  ctx.font="9px system-ui";ctx.strokeStyle="#1d2a3c";ctx.lineWidth=1;
  for(let i=0;i<=4;i++){const yy=pad.t+ch*i/4;ctx.beginPath();ctx.moveTo(pad.l,yy);ctx.lineTo(w-pad.r,yy);ctx.stroke();const val=hi-(hi-lo)*i/4;ctx.fillStyle="#8190a7";ctx.fillText(a.price<10?fmt(val,4):"$"+fmt(val,2),w-pad.r+7,yy+3);}
  const step=cw/data.length,body=Math.max(2,Math.min(9,step*.62));
  data.forEach((c,i)=>{const x=pad.l+i*step+step/2,up=c.c>=c.o,col=up?"#35d39a":"#ff657a";ctx.strokeStyle=col;ctx.fillStyle=col;ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(x,y(c.h));ctx.lineTo(x,y(c.l));ctx.stroke();const top=y(Math.max(c.o,c.c)),bottom=y(Math.min(c.o,c.c));ctx.fillRect(x-body/2,top,body,Math.max(1,bottom-top));});
  const py=y(a.price);ctx.setLineDash([4,4]);ctx.strokeStyle="#79aaff";ctx.beginPath();ctx.moveTo(pad.l,py);ctx.lineTo(w-pad.r,py);ctx.stroke();ctx.setLineDash([]);ctx.fillStyle="#79aaff";ctx.fillRect(w-pad.r+3,py-8,62,16);ctx.fillStyle="#07101f";ctx.fillText(a.price<10?fmt(a.price,4):fmt(a.price,2),w-pad.r+7,py+3);
  const volMax=Math.max(...data.map(c=>c.v));data.forEach((c,i)=>{const x=pad.l+i*step+step/2;ctx.fillStyle=c.c>=c.o?"#35d39a33":"#ff657a33";ctx.fillRect(x-body/2,pad.t+ch+4,body,Math.max(1,(c.v/volMax)*14));});
}
function save(){
  const data={cash:state.cash,realized:state.realized,tick:state.tick,simMinutes:state.simMinutes,selected:state.selected,assets:assets.map(a=>({symbol:a.symbol,price:a.price})),positions:state.positions,orders:state.orders,history:state.history,candles:state.candles};
  try{localStorage.setItem(SAVE_KEY,JSON.stringify(data));}catch(e){console.warn("Could not save practice account",e);}
}
function load(){
  try{const d=JSON.parse(localStorage.getItem(SAVE_KEY)||"null");if(!d)return;
    if(Number.isFinite(d.cash)&&d.cash>=0)state.cash=d.cash;if(Number.isFinite(d.realized))state.realized=d.realized;
    state.tick=Math.max(0,Number(d.tick)||0);state.simMinutes=Number(d.simMinutes)||570;state.selected=Math.min(assets.length-1,Math.max(0,Number(d.selected)||0));
    if(d.positions&&typeof d.positions==="object")state.positions=d.positions;
    if(Array.isArray(d.orders))state.orders=d.orders.filter(o=>assets.some(a=>a.symbol===o.symbol));
    if(Array.isArray(d.history))state.history=d.history.slice(0,150);
    assets.forEach(a=>{const saved=d.assets?.find(x=>x.symbol===a.symbol);if(saved&&Number.isFinite(saved.price)&&saved.price>0)a.price=saved.price;if(Array.isArray(d.candles?.[a.symbol])&&d.candles[a.symbol].length>5)state.candles[a.symbol]=d.candles[a.symbol].slice(-110);});
  }catch(e){console.warn("Saved account could not be loaded",e);}
}
function reset(){
  if(!confirm("Reset your paper-trading account? This clears your virtual balance, positions, pending orders and trade history."))return;
  localStorage.removeItem(SAVE_KEY);state.cash=STARTING_CASH;state.realized=0;state.tick=0;state.simMinutes=570;state.selected=0;state.orders=[];state.history=[];state.positions={};state.initialPrices={};
  assets.forEach(a=>{a.price=({ "BTC/USD":67420,"ETH/USD":3520,"AAPL":213.4,"TSLA":248.7,"EUR/USD":1.0842,"GOLD":2388.5})[a.symbol];state.initialPrices[a.symbol]=a.price;seedCandles(a);});
  renderAll();notify("Practice account reset. Starting virtual cash: $100,000.","good");save();
}
function init(){
  load();assets.forEach(a=>{if(!state.candles[a.symbol]||state.candles[a.symbol].length<5)seedCandles(a);});
  $("buy-button").addEventListener("click",()=>placeOrder("buy"));$("sell-button").addEventListener("click",()=>placeOrder("sell"));
  $("order-type").addEventListener("change",()=>{$("trigger-row").hidden=$("order-type").value==="market";$("trigger-label").textContent=$("order-type").value==="limit"?"Limit price":"Trigger price";});
  $("order-quantity").addEventListener("input",renderHeader);$("reset-button").addEventListener("click",reset);
  document.querySelectorAll("[data-tf]").forEach(b=>b.addEventListener("click",()=>{state.timeframe=Number(b.dataset.tf);document.querySelectorAll("[data-tf]").forEach(x=>x.classList.toggle("active",x===b));drawChart();}));
  document.querySelectorAll("[data-tab]").forEach(b=>b.addEventListener("click",()=>{activeTab=b.dataset.tab;document.querySelectorAll("[data-tab]").forEach(x=>x.classList.toggle("active",x===b));renderActivity();}));
  window.addEventListener("resize",drawChart);window.addEventListener("beforeunload",save);
  renderAll();setInterval(tick,1000);
}
init();
})();