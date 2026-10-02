/** Offline smoke tests for the standalone Megão Marketing PWA. Run: npm test */
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');const read=n=>fs.readFileSync(path.join(root,n),'utf8');
const html=read('index.html');const script=html.match(/<script>([\s\S]*?)<\/script>/)?.[1];assert(script,'Main application script missing');
new vm.Script(script,{filename:'app.js'});console.log('PASS: JavaScript parses');
const manifest=JSON.parse(read('manifest.webmanifest'));assert.equal(manifest.display,'standalone');assert(manifest.name.includes('Megão Marketing'));
for(const asset of ['index.html','sw.js','manifest.webmanifest','icon.svg','icon-192.png','icon-512.png','vercel.json'])assert(fs.existsSync(path.join(root,asset)),'Missing '+asset);
for(const icon of manifest.icons)assert(fs.existsSync(path.join(root,icon.src)),'Missing '+icon.src);
const sw=read('sw.js');new vm.Script(sw,{filename:'sw.js'});assert(/cache\.addAll/.test(sw));
assert(html.includes('beforeinstallprompt'));assert(html.includes('Instalar aplicativo')||html.includes('Instalar Megão Marketing'));console.log('PASS: PWA manifest, icons, service worker, installation interface');
const saved={};let content='';let events={};const app={set innerHTML(v){content=v},get innerHTML(){return content}};
const ctx={localStorage:{getItem:k=>saved[k]??null,setItem:(k,v)=>{saved[k]=v}},navigator:{userAgent:'Android',maxTouchPoints:5},window:{matchMedia:()=>({matches:false}),addEventListener:(k,v)=>{events[k]=v},scrollTo:()=>{}},location:{protocol:'https:',hostname:'demo.vercel.app'},document:{getElementById:id=>id==='app'?app:null},structuredClone,Date,Number,Array,Object,JSON,console,confirm:()=>true,alert:m=>{throw Error(m)}};
ctx.window.navigator=ctx.navigator;vm.createContext(ctx);vm.runInContext(script,ctx);assert.equal(vm.runInContext('db.brands.length',ctx),2);assert(content.includes('Gestão de'));assert(content.includes('Instalar'));console.log('PASS: Home loads with install button');
vm.runInContext("go('calendar');openPost(null,'megao')",ctx);
const f={brandId:{value:'megao'},platform:{value:'Instagram'},type:{value:'Post Feed'},date:{value:'2026-10-10'},time:{value:'14:00'},status:{value:'Rascunho'},title:{value:'Teste campanha'},caption:{value:'Legenda'},hashtags:{value:'#teste'},media:{value:''}};
vm.runInContext('savePost',ctx)({preventDefault(){},target:{elements:{namedItem:k=>f[k]}}});assert.equal(vm.runInContext('db.posts.length',ctx),1);assert.equal(JSON.parse(saved['megao-marketing-v2']).posts[0].title,'Teste campanha');assert(content.includes('Teste campanha'));console.log('PASS: Post saved, persisted and shown on calendar');console.log('ALL TESTS PASSED');
