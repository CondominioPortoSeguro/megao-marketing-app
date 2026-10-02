/** Regression tests for calendar bulk company reassignment. */
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const read=p=>fs.readFileSync(path.join(__dirname,'..',p),'utf8');
const html=read('index.html');
const main=html.split('<script>')[1]?.split('</script>')[0];
const upgrade=read('enhancements.js'),bulk=read('bulk-calendar.js');
new vm.Script(bulk,{filename:'bulk-calendar.js'});
assert(html.includes('bulk-calendar.js')&&html.includes('bulk-calendar.css'));
assert(read('sw.js').includes('bulk-calendar.js')&&read('sw.js').includes('bulk-calendar.css'));
const store={},app={html:'',set innerHTML(v){this.html=v},get innerHTML(){return this.html}};
let approve=true,confirmText='';
const context={Date,Math,Number,String,Array,JSON,Object,RegExp,Promise,console,structuredClone,
 localStorage:{getItem:k=>store[k]??null,setItem:(k,v)=>{store[k]=v}},
 navigator:{userAgent:'Android',maxTouchPoints:5},location:{protocol:'https:',hostname:'localhost'},
 confirm:text=>{confirmText=text;return approve},alert:msg=>{throw Error('Unexpected alert: '+msg)}};
context.window=context;context.addEventListener=()=>{};context.scrollTo=()=>{};context.matchMedia=()=>({matches:false});
context.document={getElementById:id=>id==='app'?app:null};
vm.createContext(context);vm.runInContext(main,context);vm.runInContext(upgrade,context);vm.runInContext(bulk,context);
const db=vm.runInContext('db',context);const brandA=db.brands[0].id,brandB=db.brands[1].id;
const future='2030-09-12',later='2030-10-23';
db.posts=[{id:'fix1',brandId:brandA,type:'Story',title:'Story da manhã',date:future,time:'08:30',
 caption:'Legenda original do story',hashtags:'#original',media:'data:image/png;base64,AA==',status:'Programado'},
 {id:'fix2',brandId:brandA,type:'Post Feed',title:'Feed da tarde',date:later,time:'16:45',
 caption:'Legenda que não pode mudar',status:'Rascunho',mediaRef:'m-001'},
 {id:'keep',brandId:brandB,type:'Vídeo',title:'Outra empresa',date:later,time:'11:00',caption:'Não alterar',status:'Programado'}];
context.ui.monthCursor='2030-09';context.go('calendar');
context.vzBulkOpen();
assert(app.html.includes('Corrigir empresa em lote'));
assert(app.html.includes('Empresa cadastrada por engano'));
assert(app.html.includes('Todas as datas'));
context.vzBulkSource(brandA);
assert(app.html.includes('Story da manhã'));assert(!app.html.includes('Feed da tarde'));
context.vzBulkScope('all');
assert(app.html.includes('Story da manhã'));assert(app.html.includes('Feed da tarde'));
context.vzBulkSelectAll();
assert(app.html.includes('2</strong> selecionadas'));
context.vzBulkTarget(brandB);
const untouched=JSON.parse(JSON.stringify(db.posts.map(({brandId,...rest})=>rest)));
approve=false;context.vzBulkApply();assert.equal(db.posts[0].brandId,brandA);
approve=true;context.vzBulkApply();
assert.equal(db.posts[0].brandId,brandB);assert.equal(db.posts[1].brandId,brandB);
assert.equal(db.posts[2].brandId,brandB);
assert.deepEqual(JSON.parse(JSON.stringify(db.posts.map(({brandId,...rest})=>rest))),untouched);
assert(confirmText.includes('somente a empresa')||confirmText.includes('somente a empresa')===false&&confirmText.includes('As datas'));
assert(app.html.includes('Concluído: 2 tarefa(s)'));
const saved=JSON.parse(store['megao-marketing-v2']);
assert(saved.posts[0].brandId===brandB&&saved.posts[1].brandId===brandB);
assert.equal(saved.posts[0].caption,'Legenda original do story');
console.log('PASS: filters, monthly/all-date selection and confirmation');
console.log('PASS: bulk changes only company; preserves date, time, caption, media and status');
console.log('PASS: changes persisted using the original local database');
console.log('ALL BULK CALENDAR TESTS PASSED');
