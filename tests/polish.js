/** Test the polished Vinnyzau shell and local profile without a browser. */
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),read=x=>fs.readFileSync(path.join(root,x),'utf8');
const html=read('index.html');const main=html.split('<script>')[1]?.split('</script>')[0];
const extra=read('enhancements.js'),polish=read('polish.js');
new vm.Script(polish,{filename:'polish.js'});
assert(html.includes('polish.css')&&html.includes('polish.js'));
assert(read('sw.js').includes('polish.css')&&read('sw.js').includes('polish.js'));
const store={};
const inner={added:'',querySelector(selector){return selector==='.hero'?hero:null},insertAdjacentHTML(_,s){this.added+=s}};
const heroFields={};const hero={querySelector(selector){return heroFields[selector]||(heroFields[selector]={textContent:''})},insertAdjacentHTML(_,s){inner.added+=s}};
const app={html:'',get innerHTML(){return this.html},set innerHTML(s){this.html=s;inner.added=''},
 querySelector(selector){return selector==='.inner'?inner:null},
 insertAdjacentHTML(_pos,s){this.html+=s}};
const ctx={localStorage:{getItem:k=>store[k]??null,setItem:(k,v)=>store[k]=v},
 navigator:{userAgent:'Android',maxTouchPoints:5},location:{protocol:'https:',hostname:'localhost'},
 structuredClone,Date,Math,Number,String,JSON,Object,Promise,console,confirm:()=>true,
 alert:msg=>{throw Error('Unexpected alert: '+msg)}};
ctx.window=ctx;ctx.matchMedia=()=>({matches:false});ctx.addEventListener=()=>{};ctx.scrollTo=()=>{};
ctx.document={getElementById:id=>id==='app'?app:null,querySelector:()=>null};
vm.createContext(ctx);vm.runInContext(main,ctx);vm.runInContext(extra,ctx);vm.runInContext(polish,ctx);
assert(inner.added.includes('vinnyzau'));assert(inner.added.includes('vz-profile-trigger'));
assert(inner.added.includes('vz-today-highlights'));assert(inner.added.includes('vz-action-strip'));
console.log('PASS: refined dashboard, header and quick navigation render');
ctx.vzOpenProfile();assert(app.html.includes('Configurações')&&app.html.includes('vzPhotoInput'));
console.log('PASS: profile photo upload available');
const form={elements:{namedItem:n=>({value:n==='name'?'Vini':n==='role'?'Criador de conteúdo':''})}};
ctx.vzSaveProfile({preventDefault(){},target:form});
assert.equal(JSON.parse(store['vinnyzau-profile-v1']).name,'Vini');
assert(heroFields['.eyebrow'].textContent.includes('Vini'));console.log('PASS: profile saved locally and displayed');
ctx.vzOpenQuick();assert(app.html.includes('O que vamos criar?'));
ctx.vzQuickAction('task');assert(app.html.includes('Nova tarefa'));
console.log('PASS: quick task creation opens existing form');
console.log('ALL POLISH TESTS PASSED');
