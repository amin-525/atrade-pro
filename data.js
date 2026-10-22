/* Keyless, CORS-enabled market data. Binance (data-api.binance.vision) + Kraken public OHLC. */
(function(root){
const TF={'15m':{b:'15m',k:15,m:15,up:'1h'},'1h':{b:'1h',k:60,m:60,up:'4h'},'4h':{b:'4h',k:240,m:240,up:'1d'},'1d':{b:'1d',k:1440,m:1440,up:'1w'},'1w':{b:'1w',k:10080,m:10080,up:null}};
const MARKETS=[
 {g:'crypto',fa:'ارز دیجیتال',src:'binance',list:['BTCUSDT','ETHUSDT','BNBUSDT','SOLUSDT','XRPUSDT','DOGEUSDT','ADAUSDT','TRXUSDT','AVAXUSDT','LINKUSDT','TONUSDT','DOTUSDT','LTCUSDT','SUIUSDT','PEPEUSDT']},
 {g:'gold',fa:'طلا (توکن طلای فیزیکی)',src:'binance',list:['PAXGUSDT','XAUTUSDT'],note:'PAXG و XAUT هر کدام پشتوانه یک اونس طلای واقعی دارند و تقریباً هم‌قیمت XAU/USD هستند.'},
 {g:'forex',fa:'فارکس',src:'kraken',list:['EURUSD','GBPUSD','USDJPY','AUDUSD','USDCAD','USDCHF'],note:'از Kraken؛ حداکثر ۷۲۰ کندل آخر در دسترس است.'},
 {g:'stock',fa:'سهام و ETF آمریکا (توکنی)',src:'binance',list:['SPYBUSDT','QQQBUSDT','AAPLBUSDT','NVDABUSDT','TSLABUSDT','MSFTBUSDT','AMZNBUSDT','GOOGLBUSDT','METABUSDT','AMDBUSDT','NFLXBUSDT','COINBUSDT','MSTRBUSDT','PLTRBUSDT','JPMBUSDT'],note:'نسخه توکنی سهام در Binance؛ قیمت نزدیک سهم اصلی است ولی ساعات و حجم معاملات متفاوت است.'},
 {g:'shot',fa:'کالا، نفت، بورس ایران و بقیه',src:'screenshot',list:[],note:'برای این بازارها منبع داده رایگانِ بدون کلید و سازگار با مرورگر پیدا نشد؛ از حالت اسکرین‌شات استفاده کنید.'}];
async function j(u){const r=await fetch(u);if(!r.ok)throw new Error('HTTP '+r.status);return r.json()}
async function binance(sym,tf,limit=1000){const d=await j('https://data-api.binance.vision/api/v3/klines?symbol='+sym+'&interval='+TF[tf].b+'&limit='+limit);return d.map(x=>({t:x[0],o:+x[1],h:+x[2],l:+x[3],c:+x[4],v:+x[5]}))}
async function kraken(sym,tf){const k=TF[tf].k;if(k>10080)throw new Error('tf');const d=await j('https://api.kraken.com/0/public/OHLC?pair='+sym+'&interval='+k);if(d.error&&d.error.length)throw new Error(d.error[0]);const key=Object.keys(d.result).find(x=>x!=='last');return d.result[key].map(x=>({t:x[0]*1000,o:+x[1],h:+x[2],l:+x[3],c:+x[4],v:+x[6]}))}
async function binanceSearch(q){const d=await j('https://data-api.binance.vision/api/v3/exchangeInfo?permissions=SPOT');q=q.toUpperCase();return d.symbols.filter(s=>s.status==='TRADING'&&s.quoteAsset==='USDT'&&s.symbol.includes(q)).slice(0,30).map(s=>s.symbol)}
async function load(src,sym,tf){const C=src==='kraken'?await kraken(sym,tf):await binance(sym,tf);const up=TF[tf].up;let H=null;try{if(up)H=src==='kraken'?await kraken(sym,up):await binance(sym,up,600)}catch(e){}if(C.length&&Date.now()-C[C.length-1].t<TF[tf].m*6e4)C.pop();/* drop unfinished candle */return{C,H}}
const api={TF,MARKETS,load,binanceSearch};if(typeof module!=='undefined')module.exports=api;else root.ATD=api;
})(this);
