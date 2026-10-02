/** Calendar strokes must represent events, not distinct companies. */
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const read=p=>fs.readFileSync(path.join(__dirname,'..',p),'utf8');
const html=read('index.html');const main=html.split('<script>')[1]?.split('</script>')[0];
const enhancement=read('enhancements.js');
new vm.Script(enhancement,{filename:'enhancements.js'});
assert(read('enhancements.css').includes('.vz-event-lines'));
assert(read('sw.js').includes("const CACHE='vinnyzau-v"));
const store={},app={value:'',set innerHTML(v){this.value=v},get innerHTML(){return this.value}};
const ctx={structuredClone,Date,Math,Number,Array,JSON,Object,String,RegExp,Promise,console,
 localStorage:{getItem:k=>store[k]??null,setItem:(k,v)=>store[k]=v},
 navigator:{userAgent:'Android',maxTouchPoints:5},location:{protocol:'https:',hostname:'localhost'},
 alert:m=>{throw Error(m)},confirm:()=>true};
ctx.window=ctx;ctx.addEventListener=()=>{};ctx.matchMedia=()=>({matches:false});ctx.scrollTo=()=>{};
ctx.document={getElementById:id=>id==='app'?app:null};
vm.createContext(ctx);vm.runInContext(main,ctx);vm.runInContext(enhancement,ctx);
const state=vm.runInContext('db',ctx);assert(state.brands.length>=2);
const companyA=state.brands[0],companyB=state.brands[1];
const date='2030-08-12';
state.posts=[
 {id:'a1',brandId:companyA.id,date,time:'08:00',title:'A'},
 {id:'a2',brandId:companyA.id,date,time:'09:00',title:'B'},
 {id:'b1',brandId:companyB.id,date,time:'10:00',title:'C'},
 {id:'a3',brandId:companyA.id,date,time:'11:00',title:'D'},
 {id:'b2',brandId:companyB.id,date,time:'12:00',title:'E'},
 {id:'b3',brandId:companyB.id,date:'2030-08-13',time:'13:00',title:'F'}
];
vm.runInContext("ui.monthCursor='2030-08';ui.filter='all';go('calendar')",ctx);
function dayMarkup(d){const pat=new RegExp('<button class="vz-day [^"]*"\\s*aria-label="[^"]*"\\s*onclick="vzPickDay\\(\\\''+d+'\\\'\\)"[\\s\\S]*?<\\/button>');return app.value.match(pat)?.[0]||''}
const five=dayMarkup(date);
assert(five,'The scheduled day must be rendered');
assert.equal((five.match(/class="vz-event-line"/g)||[]).length,5,'show all five events as strokes');
assert(!five.includes('vz-event-more'),'no overflow numbers');
assert(!five.includes('<small>5</small>'),'no numeric count below day');
assert.equal((five.match(new RegExp('background:'+companyA.color,'g'))||[]).length,3);
assert.equal((five.match(new RegExp('background:'+companyB.color,'g'))||[]).length,2);
assert.equal((dayMarkup('2030-08-13').match(/class="vz-event-line"/g)||[]).length,1);
console.log('PASS: five events appear as five colour-coded strokes with no number');
vm.runInContext('ui.filter='+JSON.stringify(companyA.id)+';render()',ctx);
const filtered=dayMarkup(date);
assert.equal((filtered.match(/class="vz-event-line"/g)||[]).length,3);
assert(!filtered.includes('<small>3</small>'));
assert(!filtered.includes('vz-event-more'));
console.log('PASS: company filter shows three strokes for three events of the same company');
state.posts[0].brandId=companyB.id;
vm.runInContext('render()',ctx);
assert.equal((dayMarkup(date).match(/class="vz-event-line"/g)||[]).length,2);
console.log('PASS: strokes reflect updated event company assignment');
console.log('ALL EVENT LINE TESTS PASSED');
