/** Regression tests for the Vinnyzau scheduling, creative and advisory upgrade. */
const assert=require('node:assert/strict');
const fs=require('node:fs');const vm=require('node:vm');const path=require('node:path');
const root=path.resolve(__dirname,'..'),read=x=>fs.readFileSync(path.join(root,x),'utf8');
const html=read('index.html'),main=html.match(/<script>([\s\S]*?)<\/script>/)?.[1];
const enhanced=read('enhancements.js'),css=read('enhancements.css');
assert(main&&enhanced&&css);new vm.Script(enhanced,{filename:'enhancements.js'});
assert(html.includes('src="./enhancements.js"')&&html.includes('enhancements.css'));
assert(read('sw.js').includes('enhancements.js')&&read('sw.js').includes('enhancements.css'));
const app={value:'',get innerHTML(){return this.value},set innerHTML(x){this.value=x}};
const store={};const ctx={structuredClone,Date,Math,Number,String,Array,JSON,Object,console,Promise,RegExp,
 localStorage:{getItem:k=>store[k]??null,setItem:(k,x)=>store[k]=x},
 navigator:{userAgent:'Android',maxTouchPoints:5},location:{protocol:'https:',hostname:'demo.vercel.app'},
 alert:x=>{throw Error('Unexpected alert: '+x)},confirm:()=>true,};
ctx.window=ctx;ctx.scrollTo=()=>{};ctx.matchMedia=()=>({matches:false});ctx.addEventListener=()=>{};
ctx.document={getElementById:id=>id==='app'?app:null};
vm.createContext(ctx);vm.runInContext(main,ctx);vm.runInContext(enhanced,ctx);
const evaluate=s=>vm.runInContext(s,ctx);
assert(app.value.includes('Vinnyzau'));assert(app.value.includes('Na sua agenda'));console.log('PASS: enhanced start screen');
ctx.go('calendar');assert(app.value.includes('vz-month-grid'));
assert.equal((app.value.match(/class="vz-day /g)||[]).length>=35,true);
console.log('PASS: full interactive month calendar');
const next=new Date();next.setDate(next.getDate()+1);
const iso=d=>d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
const tomorrow=iso(next);
ctx.vzPickDay(tomorrow);
assert(app.value.includes('Nova tarefa'));
assert(app.value.includes('value="'+tomorrow+'"'));
const data={brandId:'lumi',date:tomorrow,time:'10:30',type:'Story',platform:'Instagram',status:'Programado',
 title:'Apresentar novidades',caption:'Confira nossos novos modelos de óculos',hashtags:'#lumi'};
const form={elements:{namedItem:k=>({value:data[k]??''})}};
ctx.vzSaveTask({preventDefault(){},target:form});
assert.equal(evaluate('db.posts.length'),1);assert.equal(JSON.parse(store['megao-marketing-v2']).posts[0].type,'Story');
assert(app.value.includes('Apresentar novidades'));console.log('PASS: click day, create and persist story with time and caption');
ctx.go('brand',{brand:'lumi',tab:'Resumo'});
assert(app.value.includes('Stories de hoje e futuros'));assert(app.value.includes('Confira nossos novos modelos'));
console.log('PASS: individual company shows story, date, time and caption');
ctx.showModal('upload','lumi');assert(app.value.includes('Legenda principal')&&app.value.includes('Outra opção de legenda')&&app.value.includes('Texto para story'));
console.log('PASS: creative modal offers multiple descriptions and optional attachments');
const creative={brandId:'lumi',title:'Nova armação',kind:'Foto',status:'Salvo',desc0:'Legenda principal da imagem',
 desc1:'Legenda alternativa da imagem',desc2:'Versão curta para story',hashtags:'#novidade'};
returnPromise=ctx.vzSaveMaterial({preventDefault(){},target:{elements:{namedItem:k=>({value:creative[k]??''})}}},'');
Promise.resolve(returnPromise).then(()=>{
 assert.equal(evaluate('db.materials.length'),1);
 assert.equal(JSON.parse(store['megao-marketing-v2']).materials[0].descriptions[1],creative.desc1);
 assert(app.value.includes('Nova armação'));console.log('PASS: text-only creative and three captions persisted');
 ctx.go('reports',{filter:'lumi'});
 assert(app.value.includes('Seu ritmo de conteúdo')&&app.value.includes('Dicas de frequência e tempo'));
 assert(app.value.includes('dados automáticos'));
 console.log('PASS: reports distinguish manual metrics from calendar-based management tips');
 console.log('ALL UPGRADE TESTS PASSED');
}).catch(e=>{console.error(e);process.exitCode=1});
