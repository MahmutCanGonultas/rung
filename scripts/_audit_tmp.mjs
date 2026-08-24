import puppeteer from "puppeteer-core";
const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const OUT="/private/tmp/claude-501/-Users-mahmutcangonultas-Desktop-rung/1e981f21-28dd-4ee8-8880-a26f23178c56/scratchpad";
const b = await puppeteer.launch({executablePath:CHROME, headless:true, args:["--no-sandbox","--hide-scrollbars"]});
for (const [w,h,tag] of [[1440,900,"gs"],[390,844,"mb"]]) {
  const p = await b.newPage();
  await p.setViewport({width:w,height:h,deviceScaleFactor:1});
  await p.goto("http://localhost:3000/",{waitUntil:"networkidle0"});
  const r = await p.evaluate((vh)=>{
    const doc=document.documentElement;
    const out={scrollW:doc.scrollWidth, clientW:doc.clientWidth, scrollH:doc.scrollHeight};
    // overflow offenders
    out.wide=[...document.querySelectorAll("*")].filter(e=>e.getBoundingClientRect().right>doc.clientWidth+1||e.getBoundingClientRect().left<-1).slice(0,12).map(e=>({t:e.tagName,c:e.className&&e.className.toString().slice(0,60),r:Math.round(e.getBoundingClientRect().right),l:Math.round(e.getBoundingClientRect().left)}));
    out.headings=[...document.querySelectorAll("h1,h2,h3,h4,h5,h6")].map(e=>e.tagName+" :: "+e.textContent.trim().slice(0,50)+" @"+Math.round(e.getBoundingClientRect().top+window.scrollY));
    const q=(s)=>{const e=document.querySelector(s); if(!e) return null; const b=e.getBoundingClientRect(); return {top:Math.round(b.top+window.scrollY), h:Math.round(b.height), text:e.textContent.trim().slice(0,70)};};
    out.silent=q(".sample-silent");
    out.proofLead=q(".proof-cell.is-lead");
    out.thesis=q(".claim-thesis");
    out.actions=q(".claim-actions");
    out.close=q(".close");
    out.h1=q("h1");
    out.foldPct = out.proofLead? (out.proofLead.top/out.scrollH*100):null;
    out.viewportFolds = out.proofLead? (out.proofLead.top/vh):null;
    // what's visible in first viewport
    out.aboveFold=[...document.querySelectorAll(".land > * , .land > * > *")].filter(e=>{const b=e.getBoundingClientRect(); return b.top< vh && b.bottom>0;}).map(e=>e.tagName+"."+(e.className||"")).slice(0,20);
    // sticky?
    const bar=document.querySelector(".land-bar");
    out.barPos = bar? getComputedStyle(bar).position : null;
    return out;
  }, h);
  console.log("=== "+tag+" "+w+"x"+h+" ===");
  console.log(JSON.stringify(r,null,1));
  await p.screenshot({path:`${OUT}/land-${tag}.png`});
  await p.screenshot({path:`${OUT}/land-${tag}-full.png`, fullPage:true});
  await p.close();
}
await b.close();
