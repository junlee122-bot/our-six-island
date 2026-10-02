import { chromium } from 'playwright-core';
import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path';
const root='/tmp/claude-0/-home-user-our-six-island/25363e67-b8be-5b81-a4ec-d0e424117a3f/scratchpad/view';
const srv=http.createServer((q,res)=>{const p=path.join(root,decodeURIComponent(q.url.split('?')[0].split('#')[0]));try{const b=fs.readFileSync(p.endsWith('/')?p+'index.html':p);res.writeHead(200,{'content-type':p.endsWith('.js')?'text/javascript':p.endsWith('.html')||p.endsWith('/')?'text/html':'application/octet-stream'});res.end(b);}catch{res.writeHead(404);res.end();}}).listen(8765);
const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium',args:['--use-gl=swiftshader','--enable-unsafe-swiftshader']});const pg=await b.newPage({viewport:{width:900,height:600}});
for(const n of process.argv.slice(2)){await pg.goto('http://localhost:8765/index.html#'+n);await pg.waitForFunction(()=>document.title==='done',null,{timeout:20000});await pg.screenshot({path:n+'.png'});}
await b.close();srv.close();
