/* A Trade Pro – in-browser analysis engine (no API key). Works in browser (window.ATE) and Node (module.exports). */
(function(root){
'use strict';
const sma=(a,n)=>{const o=new Array(a.length).fill(NaN);let s=0;for(let i=0;i<a.length;i++){s+=a[i];if(i>=n)s-=a[i-n];if(i>=n-1)o[i]=s/n}return o};
const ema=(a,n)=>{const k=2/(n+1),o=new Array(a.length);let e=a[0];for(let i=0;i<a.length;i++){e=i?a[i]*k+e*(1-k):a[0];o[i]=e}return o};
const rma=(a,n)=>{const o=new Array(a.length).fill(NaN);let e=0;for(let i=0;i<a.length;i++){if(i<n){e+=a[i];if(i===n-1){e/=n;o[i]=e}}else{e=(e*(n-1)+a[i])/n;o[i]=e}}return o};
const std=(a,n)=>{const m=sma(a,n);return a.map((_,i)=>{if(i<n-1)return NaN;let s=0;for(let j=i-n+1;j<=i;j++)s+=(a[j]-m[i])**2;return Math.sqrt(s/n)})};
function rsi(c,n=14){const g=[0],l=[0];for(let i=1;i<c.length;i++){const d=c[i]-c[i-1];g.push(Math.max(d,0));l.push(Math.max(-d,0))}const G=rma(g,n),L=rma(l,n);return G.map((x,i)=>L[i]===0?100:100-100/(1+x/L[i]))}
function atr(C,n=14){const tr=C.map((x,i)=>i?Math.max(x.h-x.l,Math.abs(x.h-C[i-1].c),Math.abs(x.l-C[i-1].c)):x.h-x.l);return rma(tr,n)}
function adx(C,n=14){const p=[0],m=[0],tr=[C[0].h-C[0].l];for(let i=1;i<C.length;i++){const u=C[i].h-C[i-1].h,d=C[i-1].l-C[i].l;p.push(u>d&&u>0?u:0);m.push(d>u&&d>0?d:0);tr.push(Math.max(C[i].h-C[i].l,Math.abs(C[i].h-C[i-1].c),Math.abs(C[i].l-C[i-1].c)))}
  const T=rma(tr,n),P=rma(p,n),M=rma(m,n),pdi=P.map((x,i)=>100*x/T[i]),mdi=M.map((x,i)=>100*x/T[i]),dx=pdi.map((x,i)=>{const s=x+mdi[i];return s?100*Math.abs(x-mdi[i])/s:0});
  const dxc=dx.map(v=>isNaN(v)?0:v);return{adx:rma(dxc.slice(n),n).reduce((o,v)=>(o.push(v),o),new Array(n).fill(NaN)),pdi,mdi}}
function stochRsi(c,n=14,k=3,d=3){const r=rsi(c,n),o=r.map((v,i)=>{if(i<2*n)return NaN;const w=r.slice(i-n+1,i+1),mn=Math.min(...w),mx=Math.max(...w);return mx===mn?50:100*(v-mn)/(mx-mn)});const K=sma(o.map(v=>isNaN(v)?50:v),k);return{k:K,d:sma(K,d)}}
function ichimoku(C){const hh=(i,n)=>{let h=-Infinity,l=Infinity;for(let j=Math.max(0,i-n+1);j<=i;j++){h=Math.max(h,C[j].h);l=Math.min(l,C[j].l)}return(h+l)/2};
  const ten=C.map((_,i)=>hh(i,9)),kij=C.map((_,i)=>hh(i,26)),sa=C.map((_,i)=>(ten[i]+kij[i])/2),sb=C.map((_,i)=>hh(i,52));
  // cloud plotted 26 ahead -> cloud at i comes from i-26
  return{ten,kij,spanA:C.map((_,i)=>i>=26?sa[i-26]:NaN),spanB:C.map((_,i)=>i>=26?sb[i-26]:NaN),futA:sa,futB:sb}}
function indicators(C){
  const c=C.map(x=>x.c),v=C.map(x=>x.v||0),hasV=v.some(x=>x>0);
  const e={e9:ema(c,9),e21:ema(c,21),e50:ema(c,50),e100:ema(c,100),e200:ema(c,200)};
  const m12=ema(c,12),m26=ema(c,26),macd=m12.map((x,i)=>x-m26[i]),sig=ema(macd,9),hist=macd.map((x,i)=>x-sig[i]);
  const bbM=sma(c,20),bbS=std(c,20),A=atr(C,14),kcM=ema(c,20);
  const bbU=bbM.map((m,i)=>m+2*bbS[i]),bbL=bbM.map((m,i)=>m-2*bbS[i]),kcU=kcM.map((m,i)=>m+1.5*A[i]),kcL=kcM.map((m,i)=>m-1.5*A[i]);
  const squeeze=bbU.map((u,i)=>u<kcU[i]&&bbL[i]>kcL[i]);
  let obv=[0];for(let i=1;i<C.length;i++)obv.push(obv[i-1]+(c[i]>c[i-1]?v[i]:c[i]<c[i-1]?-v[i]:0));
  const pv=C.map(x=>(x.h+x.l+x.c)/3*(x.v||1)),vs=sma(v.map(x=>x||1),50),pvs=sma(pv,50),vwap=pvs.map((x,i)=>x/vs[i]);
  return{c,hasV,...e,macd,sig,hist,rsi:rsi(c),srsi:stochRsi(c),dmi:adx(C),bbM,bbU,bbL,kcU,kcL,squeeze,atr:A,ich:ichimoku(C),obv,obvE:ema(obv,20),vwap,volMA:sma(v,20)};
}
/* pivots confirmed k bars later */
function pivots(C,k=3){const H=[],L=[];for(let i=k;i<C.length-k;i++){let h=1,l=1;for(let j=1;j<=k;j++){if(C[i].h<C[i-j].h||C[i].h<C[i+j].h)h=0;if(C[i].l>C[i-j].l||C[i].l>C[i+j].l)l=0}if(h)H.push({i,p:C[i].h,cf:i+k});if(l)L.push({i,p:C[i].l,cf:i+k})}return{H,L}}
function structureAt(C,P,i){const H=P.H.filter(x=>x.cf<=i),L=P.L.filter(x=>x.cf<=i);if(H.length<2||L.length<2)return{trend:0,ev:''};
  const h1=H[H.length-1],h0=H[H.length-2],l1=L[L.length-1],l0=L[L.length-2],c=C[i].c;let trend=h1.p>h0.p&&l1.p>l0.p?1:h1.p<h0.p&&l1.p<l0.p?-1:0,ev='';
  if(c>h1.p){ev=trend<0?'CHoCH صعودی (تغییر کاراکتر روند)':'BOS صعودی (شکست سقف)';trend=trend<0?0.5:1}
  else if(c<l1.p){ev=trend>0?'CHoCH نزولی (تغییر کاراکتر روند)':'BOS نزولی (شکست کف)';trend=trend>0?-0.5:-1}
  return{trend,ev,lastH:h1.p,lastL:l1.p}}
function zones(C,P,i,A){const lv=[...P.H.filter(x=>x.cf<=i).map(x=>x.p),...P.L.filter(x=>x.cf<=i).map(x=>x.p)].slice(-60).sort((a,b)=>a-b),cl=[];
  for(const p of lv){const z=cl[cl.length-1];if(z&&p-z.hi<A*.6){z.hi=p;z.n++;z.mid=(z.lo+z.hi)/2}else cl.push({lo:p,hi:p,mid:p,n:1})}
  const c=C[i].c;return{sup:cl.filter(z=>z.mid<c).sort((a,b)=>b.mid-a.mid).slice(0,3),res:cl.filter(z=>z.mid>c).sort((a,b)=>a.mid-b.mid).slice(0,3)}}
function patternAt(C,i){const a=C[i],b=C[i-1],c=C[i-2],body=x=>Math.abs(x.c-x.o),rng=x=>(x.h-x.l)||1e-12,up=x=>x.h-Math.max(x.o,x.c),lw=x=>Math.min(x.o,x.c)-x.l,bu=x=>x.c>x.o,be=x=>x.c<x.o,out=[];
  if(be(b)&&bu(a)&&a.c>=b.o&&a.o<=b.c&&body(a)>body(b))out.push([1.2,'پوشای صعودی']);
  if(bu(b)&&be(a)&&a.o>=b.c&&a.c<=b.o&&body(a)>body(b))out.push([-1.2,'پوشای نزولی']);
  if(lw(a)>2*body(a)&&up(a)<body(a)&&body(a)>rng(a)*.1)out.push([.8,'چکش / پین‌بار صعودی']);
  if(up(a)>2*body(a)&&lw(a)<body(a)&&body(a)>rng(a)*.1)out.push([-.8,'ستاره ثاقب / پین‌بار نزولی']);
  if(be(c)&&body(b)<rng(b)*.3&&bu(a)&&a.c>(c.o+c.c)/2)out.push([1,'ستاره صبحگاهی']);
  if(bu(c)&&body(b)<rng(b)*.3&&be(a)&&a.c<(c.o+c.c)/2)out.push([-1,'ستاره شامگاهی']);
  if(bu(a)&&bu(b)&&bu(c)&&a.c>b.c&&b.c>c.c)out.push([.6,'سه سرباز سفید']);
  if(be(a)&&be(b)&&be(c)&&a.c<b.c&&b.c<c.c)out.push([-.6,'سه کلاغ سیاه']);
  return out}
function divergenceAt(C,I,P,i){const L=P.L.filter(x=>x.cf<=i).slice(-2),H=P.H.filter(x=>x.cf<=i).slice(-2);
  if(L.length===2&&i-L[1].i<15&&L[1].p<L[0].p&&I.rsi[L[1].i]>I.rsi[L[0].i])return[1,'واگرایی مثبت RSI (کف پایین‌تر قیمت، کف بالاتر RSI)'];
  if(H.length===2&&i-H[1].i<15&&H[1].p>H[0].p&&I.rsi[H[1].i]<I.rsi[H[0].i])return[-1,'واگرایی منفی RSI (سقف بالاتر قیمت، سقف پایین‌تر RSI)'];return null}
/* rule ensemble: returns score in [-1,1] and reasons */
function ruleScore(C,I,P,i,htf){const R=[],add=(w,v,t)=>{R.push({w,v,t})},c=I.c[i];
  const rib=[I.e9,I.e21,I.e50,I.e100,I.e200].map(a=>a[i]);let up=0;for(let j=0;j<4;j++)up+=rib[j]>rib[j+1]?1:-1;
  add(2,up/4,up>=3?'ریبون EMA (۹/۲۱/۵۰/۱۰۰/۲۰۰) کاملاً صعودی چیده شده':up<=-3?'ریبون EMA کاملاً نزولی چیده شده':'ریبون EMA درهم است (بازار بی‌روند)');
  add(1,c>I.e200[i]?1:-1,c>I.e200[i]?'قیمت بالای EMA200 (روند بلندمدت مثبت)':'قیمت زیر EMA200 (روند بلندمدت منفی)');
  const h=I.hist[i],hp=I.hist[i-1];add(1.2,(h>0?.5:-.5)+(h>hp?.5:-.5),h>0&&h>hp?'هیستوگرام MACD مثبت و رو به رشد':h<0&&h<hp?'هیستوگرام MACD منفی و رو به تقویت':'مومنتوم MACD در حال ضعیف‌شدن');
  const r=I.rsi[i];add(1,r>70?-.6:r<30?.6:(r-50)/25,'RSI='+r.toFixed(0)+(r>70?' (اشباع خرید)':r<30?' (اشباع فروش)':r>50?' (مومنتوم مثبت)':' (مومنتوم منفی)'));
  const k=I.srsi.k[i],d=I.srsi.d[i];if(!isNaN(k)){const x=k<20&&k>d?1:k>80&&k<d?-1:0;if(x)add(.8,x,x>0?'استوکاستیک RSI از ناحیه اشباع فروش رو به بالا قطع کرد':'استوکاستیک RSI از ناحیه اشباع خرید رو به پایین قطع کرد')}
  const ax=I.dmi.adx[i],pd=I.dmi.pdi[i],md=I.dmi.mdi[i];add(1.2*(ax>25?1.2:ax<18?.4:.8),pd>md?1:-1,'ADX='+(ax||0).toFixed(0)+(ax>25?' روند قوی':' روند ضعیف')+'؛ '+(pd>md?'+DI غالب (خریداران)':'−DI غالب (فروشندگان)'));
  if(I.squeeze[i-1]&&!I.squeeze[i])add(1.2,c>I.bbM[i]?1:-1,'خروج از فشردگی بولینگر/کلتنر (Squeeze) به سمت '+(c>I.bbM[i]?'بالا':'پایین')+' — شروع حرکت پرقدرت');
  else if(I.squeeze[i])R.push({w:0,v:0,t:'بازار در فشردگی (Squeeze) است؛ حرکت بزرگی در راه است، جهتش هنوز معلوم نیست'});
  if(c>I.bbU[i])add(.5,-.5,'قیمت بالای باند بالایی بولینگر (کشیدگی)');if(c<I.bbL[i])add(.5,.5,'قیمت زیر باند پایینی بولینگر (کشیدگی)');
  const ich=I.ich,top=Math.max(ich.spanA[i],ich.spanB[i]),bot=Math.min(ich.spanA[i],ich.spanB[i]);if(!isNaN(top)){const x=(c>top?.6:c<bot?-.6:0)+(ich.ten[i]>ich.kij[i]?.4:-.4);add(1.2,x,c>top?'قیمت بالای ابر ایچیموکو':c<bot?'قیمت زیر ابر ایچیموکو':'قیمت داخل ابر ایچیموکو (بلاتکلیفی)')}
  add(.7,c>I.vwap[i]?1:-1,c>I.vwap[i]?'قیمت بالای VWAP غلتان (خریداران در سود)':'قیمت زیر VWAP غلتان (فروشندگان در کنترل)');
  if(I.hasV){add(.7,I.obv[i]>I.obvE[i]?1:-1,I.obv[i]>I.obvE[i]?'OBV صعودی: حجم پشت خرید است':'OBV نزولی: حجم پشت فروش است');if(C[i].v>2*I.volMA[i])add(.6,C[i].c>C[i].o?1:-1,'حجم غیرعادی (بیش از ۲ برابر میانگین) در کندل آخر')}
  const s=structureAt(C,P,i);add(1.6,s.trend,s.ev||(s.trend>0?'ساختار HH/HL (سقف و کف بالاتر)':s.trend<0?'ساختار LH/LL (سقف و کف پایین‌تر)':'ساختار خنثی'));
  for(const[x,t]of patternAt(C,i))add(.8,Math.sign(x)*Math.min(1,Math.abs(x)),'الگوی کندلی: '+t);
  const dv=divergenceAt(C,I,P,i);if(dv)add(1,dv[0],dv[1]);
  if(htf!=null)add(2,htf,htf>.2?'تایم‌فریم بالاتر صعودی است (هم‌جهتی چندتایم‌فریمی)':htf<-.2?'تایم‌فریم بالاتر نزولی است':'تایم‌فریم بالاتر خنثی است');
  let sw=0,sv=0;for(const x of R){sw+=x.w;sv+=x.w*x.v}return{score:sw?sv/sw:0,reasons:R}}
/* features for ML */
function feats(C,I,P,i){const c=I.c[i],A=I.atr[i]||1e-9;const st=structureAt(C,P,i).trend;
  return[(c-I.e21[i])/A,(c-I.e50[i])/A,(c-I.e200[i])/A/3,(I.e9[i]-I.e21[i])/A,(I.rsi[i]-50)/25,(I.rsi[i]-I.rsi[i-3])/15,I.hist[i]/A,(I.hist[i]-I.hist[i-1])/A,
    ((I.srsi.k[i]||50)-50)/50,((I.dmi.pdi[i]||0)-(I.dmi.mdi[i]||0))/25,(I.dmi.adx[i]||20)/50,(c-I.bbM[i])/((I.bbU[i]-I.bbM[i])||A),I.squeeze[i]?1:0,
    (c-I.c[i-5])/A/3,(c-I.c[i-20])/A/6,st,A/c*100,I.hasV?Math.sign(I.obv[i]-I.obvE[i]):0,(c-I.vwap[i])/A]}
function trainLR(X,y,ep=60,lr=.05,l2=1e-3){const d=X[0].length,mu=new Array(d).fill(0),sd=new Array(d).fill(0);X.forEach(x=>x.forEach((v,j)=>mu[j]+=v/X.length));X.forEach(x=>x.forEach((v,j)=>sd[j]+=(v-mu[j])**2/X.length));const s=sd.map(v=>Math.sqrt(v)||1);
  const Z=X.map(x=>x.map((v,j)=>Math.max(-5,Math.min(5,(v-mu[j])/s[j])))),w=new Array(d).fill(0);let b=0;
  for(let e=0;e<ep;e++)for(let t=0;t<Z.length;t++){const z=Z[t];let q=b;for(let j=0;j<d;j++)q+=w[j]*z[j];const p=1/(1+Math.exp(-q)),g=p-y[t];for(let j=0;j<d;j++)w[j]-=lr*(g*z[j]+l2*w[j]);b-=lr*g}
  return{pred:x=>{let q=b;for(let j=0;j<d;j++)q+=w[j]*Math.max(-5,Math.min(5,(x[j]-mu[j])/s[j]));return 1/(1+Math.exp(-q))},w}}
function dataset(C,I,P,H,from,to){const X=[],y=[],idx=[];for(let i=from;i<to&&i+H<C.length;i++){X.push(feats(C,I,P,i));y.push(I.c[i+H]>I.c[i]?1:0);idx.push(i)}return{X,y,idx}}
/* walk-forward validation: train on past, test next block (labels never overlap test) */
function walkForward(C,I,P,H,folds=5){const start=210,n=C.length-H,blk=Math.floor((n-start)/(folds+1));if(blk<30)return null;let ok=0,tot=0,hc=0,ht=0,base=0,brier=0;const cal=[];
  for(let f=1;f<=folds;f++){const tr=dataset(C,I,P,H,start,start+f*blk-H),te=dataset(C,I,P,H,start+f*blk,Math.min(n,start+(f+1)*blk));if(tr.X.length<50)continue;const m=trainLR(tr.X,tr.y);
    const up=tr.y.reduce((a,b)=>a+b,0)/tr.y.length;te.X.forEach((x,t)=>{const p=m.pred(x),yy=te.y[t];tot++;if((p>.5)===(yy===1))ok++;if((up>.5)===(yy===1))base++;brier+=(p-yy)**2;cal.push([p,yy]);if(Math.abs(p-.5)>.1){ht++;if((p>.5)===(yy===1))hc++}})}
  return tot?{acc:ok/tot,base:base/tot,n:tot,hiAcc:ht?hc/ht:null,hiN:ht,brier:brier/tot,cal}:null}
/* backtest of the rule-ensemble signals */
function backtest(C,I,P,o={}){const th=o.th??.35,slM=o.slM??1.5,tpM=o.tpM??2.5,maxBars=o.maxBars??48,spot=o.spot;const tr=[];let i=210;
  while(i<C.length-2){const s=ruleScore(C,I,P,i,null).score;if(Math.abs(s)>=th&&!(spot&&s<0)){const d=Math.sign(s),e=C[i+1].o,A=I.atr[i],sl=e-d*A*slM,tp=e+d*A*tpM;let j=i+1,res=null;
      for(;j<C.length&&j<=i+maxBars;j++){const x=C[j];const hitSL=d>0?x.l<=sl:x.h>=sl,hitTP=d>0?x.h>=tp:x.l<=tp;if(hitSL){res=-slM;break}if(hitTP){res=tpM;break}}
      if(res==null){const ex=C[Math.min(j,C.length-1)].c;res=d*(ex-e)/A}tr.push({i,d,r:res});i=j+1}else i++}
  const w=tr.filter(t=>t.r>0),g=w.reduce((a,t)=>a+t.r,0),l=-tr.filter(t=>t.r<=0).reduce((a,t)=>a+t.r,0);
  return{n:tr.length,win:tr.length?w.length/tr.length:0,pf:l?g/l:(g?Infinity:0),expR:tr.length?(g-l)/tr.length:0,trades:tr}}
function fib(lo,hi,dir){const r=hi-lo;return dir>0?{r382:hi-r*.382,r5:hi-r*.5,r618:hi-r*.618,x1272:lo+r*1.272,x1618:lo+r*1.618,x1:hi}:{r382:lo+r*.382,r5:lo+r*.5,r618:lo+r*.618,x1272:hi-r*1.272,x1618:hi-r*1.618,x1:lo}}
function htfTrend(C){if(!C||C.length<210)return null;const I=indicators(C),P=pivots(C),i=C.length-1;return ruleScore(C,I,P,i,null).score}
/* full analysis */
function analyze(C,opt={}){const H=opt.horizon||6,I=indicators(C),P=pivots(C),i=C.length-1,c=I.c[i],A=I.atr[i];
  const htf=opt.htf?htfTrend(opt.htf):null,rs=ruleScore(C,I,P,i,htf);
  const wf=walkForward(C,I,P,H);const all=dataset(C,I,P,H,210,C.length-H),model=all.X.length>80?trainLR(all.X,all.y):null,pML=model?model.pred(feats(C,I,P,i)):.5;
  // blend: shrink ML toward 0.5 by its measured edge over 50%
  const edge=wf?Math.max(0,Math.min(1,(wf.acc-.5)/.1)):0,pRule=.5+rs.score*.35,pUp=Math.max(.05,Math.min(.95,.5+(pRule-.5)*.6+(pML-.5)*edge*.6));
  const bt=backtest(C,I,P,{spot:opt.spot});const btEdge=bt.n>=10?Math.max(0,Math.min(1,(bt.pf-.8)/.7)):.5;
  const dir=pUp>=.58?1:pUp<=.42?-1:0;let side=dir>0?'BUY':dir<0?'SELL':'WAIT';
  const conf=Math.round(50+Math.abs(pUp-.5)*100*(.6+.4*btEdge));
  const z=zones(C,P,i,A),st=structureAt(C,P,i);
  // swing for fib
  const Hs=P.H.filter(x=>x.cf<=i).slice(-1)[0],Ls=P.L.filter(x=>x.cf<=i).slice(-1)[0];const hi=Hs?Hs.p:c+A*3,lo=Ls?Ls.p:c-A*3,fb=fib(Math.min(lo,hi),Math.max(lo,hi),dir||1);
  let lv=null;if(dir){const near=dir>0?z.sup[0]:z.res[0];const eNear=dir>0?Math.max(fb.r382,near?near.hi:c-A*.5):Math.min(fb.r382,near?near.lo:c+A*.5);
    const ez=[Math.min(c,eNear),Math.max(c,eNear)];if(Math.abs(c-eNear)>A*1.5){ez[dir>0?0:1]=c-dir*A*.8}
    const ent=(ez[0]+ez[1])/2,base=dir>0?Math.min(ez[0],near?near.lo:Infinity,st.lastL||Infinity):Math.max(ez[1],near?near.hi:-Infinity,st.lastH||-Infinity);
    let sl=base-dir*A*.5;if(Math.abs(ent-sl)>A*3)sl=ent-dir*A*3;if(Math.abs(ent-sl)<A*.8)sl=ent-dir*A*.8;const R=Math.abs(ent-sl);
    const opp=(dir>0?z.res:z.sup).map(x=>x.mid);const cand=[ent+dir*R*1.2,ent+dir*R*2,ent+dir*R*3.2];
    const tps=cand.map((t,k)=>{const lvl=opp[k];return lvl&&Math.abs(lvl-ent)>R&&Math.abs(lvl-ent)<Math.abs(t-ent)*1.3?lvl:t});
    if(fb.x1272&&Math.sign(fb.x1272-ent)===dir&&Math.abs(fb.x1272-ent)>Math.abs(tps[1]-ent))tps[2]=Math.max(dir*tps[2],dir*fb.x1272)*dir;
    tps.sort((a,b)=>dir*(a-b));lv={ez,ent,sl,tps,R,rr:tps.map(t=>Math.abs(t-ent)/R)}}
  const reasons=rs.reasons.filter(x=>x.t).sort((a,b)=>Math.abs(b.w*b.v)-Math.abs(a.w*a.v));
  return{side,pUp,pRule,pML,conf,score:rs.score,reasons,wf,bt,lv,zones:z,structure:st,fib:fb,price:c,atr:A,htf,ind:{rsi:I.rsi[i],adx:I.dmi.adx[i],macd:I.hist[i],srsi:I.srsi.k[i],squeeze:I.squeeze[i],e50:I.e50[i],e200:I.e200[i],bbU:I.bbU[i],bbL:I.bbL[i]},I,horizon:H};
}
const api={indicators,pivots,ruleScore,feats,trainLR,walkForward,backtest,analyze,ema,sma,atr};
if(typeof module!=='undefined')module.exports=api;else root.ATE=api;
})(this);
