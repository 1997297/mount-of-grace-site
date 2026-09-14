const { spawn } = require('child_process');
const fs = require('fs'), os = require('os'), path = require('path');
const CHROME = 'C:' + String.fromCharCode(92) + 'Program Files' + String.fromCharCode(92) + 'Google' + String.fromCharCode(92) + 'Chrome' + String.fromCharCode(92) + 'Application' + String.fromCharCode(92) + 'chrome.exe';
const PORT = 9232;
const sleep = ms => new Promise(r => setTimeout(r, ms));
const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'mog-v-'));
const chrome = spawn(CHROME, ['--headless=new','--disable-gpu','--no-first-run',
  '--remote-debugging-port='+PORT,'--user-data-dir='+profile,'about:blank'], { stdio:'ignore' });
(async () => {
  for (let i=0;i<80;i++){ try{ await (await fetch('http://127.0.0.1:'+PORT+'/json/version')).json(); break;}catch{ await sleep(250);} }
  const t = await (await fetch('http://127.0.0.1:'+PORT+'/json/new?about:blank',{method:'PUT'})).json();
  const ws = new WebSocket(t.webSocketDebuggerUrl);
  let id=0; const pend=new Map();
  ws.addEventListener('message', e => { const m=JSON.parse(e.data);
    if(m.id&&pend.has(m.id)){const{resolve}=pend.get(m.id);pend.delete(m.id);resolve(m.result);} });
  const send=(mth,p={})=>new Promise(r=>{const n=++id;pend.set(n,{resolve:r});ws.send(JSON.stringify({id:n,method:mth,params:p}));});
  await new Promise(r=>ws.addEventListener('open',r));
  await send('Runtime.enable'); await send('Page.enable');
  for (const w of [1280, 1100, 1024, 900, 390]) {
    await send('Emulation.setDeviceMetricsOverride',{width:w,height:900,deviceScaleFactor:1,mobile:w<1024});
    await send('Page.navigate',{url:'http://127.0.0.1:8765/index.html'});
    await sleep(1500);
    const r = (await send('Runtime.evaluate',{returnByValue:true,expression:`(()=>{
      const m=document.querySelector('.mobile-donate'), d=document.querySelector('.desktop-donate');
      const info=el=>{const s=getComputedStyle(el),b=el.getBoundingClientRect();
        return {display:s.display,w:Math.round(b.width),h:Math.round(b.height),
                onscreen: b.width>0 && b.height>0 && !!el.offsetParent};};
      return {mobile:info(m), desktop:info(d), navDisplay:getComputedStyle(document.getElementById('mainNav')).display};
    })()`})).result.value;
    console.log(w+'px  nav='+r.navDisplay
      +'\n   .mobile-donate  display='+r.mobile.display+' rendered='+r.mobile.onscreen+' '+r.mobile.w+'x'+r.mobile.h
      +'\n   .desktop-donate display='+r.desktop.display+' rendered='+r.desktop.onscreen+' '+r.desktop.w+'x'+r.desktop.h);
  }
  chrome.kill(); process.exit(0);
})().catch(e=>{console.error(e);chrome.kill();process.exit(1);});
