/** Regression: clicking avatar opens theme settings, switching palette preserves profile and persists. */
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path'),assert=require('node:assert/strict');
const read=x=>fs.readFileSync(path.join(__dirname,'..',x),'utf8');
const html=read('index.html'),main=html.split('<script>')[1]?.split('</script>')[0];
const enhancements=read('enhancements.js'),polish=read('polish.js'),themes=read('themes.js'),css=read('themes.css');
for(const [name,content] of [['enhancements',enhancements],['polish',polish],['themes',themes]])new vm.Script(content,{filename:name+'.js'});
assert(html.includes('themes.css')&&html.includes('themes.js'));
assert(read('sw.js').includes('themes.css')&&read('sw.js').includes('themes.js'));
for(const value of ['claro','noturno','verde','azul','roxo'])assert(css.includes('[data-vz-theme="'+value+'"]'),'Missing CSS preset '+value);
assert(css.includes(' .nav svg')&&css.includes(' .input')&&css.includes(' .primary'),'Missing visual contrast styles');
const stored={},rootAttrs={},themeMeta={content:'',setAttribute(k,v){this[k]=v}};
const inner={added:'',querySelector(s){return s==='.hero'?hero:null},insertAdjacentHTML(_p,s){this.added+=s}};
const heroFields={},hero={querySelector(s){return heroFields[s]||(heroFields[s]={textContent:''})},insertAdjacentHTML(_p,s){inner.added+=s}};
const app={markup:'',set innerHTML(s){this.markup=s;inner.added=''},get innerHTML(){return this.markup},
 querySelector(s){return s==='.inner'?inner:null},insertAdjacentHTML(_p,s){this.markup+=s}};
const doc={documentElement:{dataset:rootAttrs},querySelector:s=>s==='meta[name="theme-color"]'?themeMeta:null,getElementById:id=>id==='app'?app:null};
const ctx={window:null,document:doc,localStorage:{getItem:k=>stored[k]??null,setItem:(k,v)=>{stored[k]=v}},Date,Math,Number,String,Array,RegExp,Object,Promise,JSON,structuredClone,console,
 navigator:{userAgent:'Android',maxTouchPoints:5},location:{hostname:'localhost',protocol:'https:'},
 alert:m=>{throw Error('Unexpected alert '+m)},confirm:()=>true};
ctx.window=ctx;ctx.scrollTo=()=>{};ctx.addEventListener=()=>{};ctx.matchMedia=()=>({matches:false});
vm.createContext(ctx);vm.runInContext(main,ctx);vm.runInContext(enhancements,ctx);vm.runInContext(polish,ctx);vm.runInContext(themes,ctx);
assert.equal(rootAttrs.vzTheme,'roxo');assert.equal(ctx.vzGetTheme(),'roxo');
ctx.vzOpenProfile();
assert(app.markup.includes('Configurações')&&app.markup.includes('vzPhotoInput'));
for(const name of ['Claro','Noturno','Verde','Azul','Roxo'])assert(app.markup.includes('>'+name+'</span>'));
assert(app.markup.includes('checked'),'Selected theme must be indicated');
console.log('PASS: avatar settings include photo and five accessible themes');
for(const [name,color] of Object.entries({claro:'#ffffff',noturno:'#101823',verde:'#146247',azul:'#195bb4',roxo:'#7135ec'})){
 assert(ctx.vzChooseTheme(name));assert.equal(rootAttrs.vzTheme,name);assert.equal(stored['vinnyzau-theme-v1'],name);assert.equal(themeMeta.content,color);
}
assert.equal(ctx.vzChooseTheme('unknown'),false);assert.equal(rootAttrs.vzTheme,'roxo');
console.log('PASS: immediate theme switch updates root palette, browser toolbar and storage');
ctx.vzChooseTheme('noturno');
const form={elements:{namedItem:name=>({value:name==='name'?'Vini':'Criador de conteúdo'})}};
ctx.vzSaveProfile({preventDefault(){},target:form});
assert.equal(JSON.parse(stored['vinnyzau-profile-v1']).name,'Vini');
assert.equal(rootAttrs.vzTheme,'noturno');
ctx.vzOpenProfile();
assert(app.markup.includes('value="noturno" checked'));
console.log('PASS: profile editing keeps theme and selected radio reflects persisted value');
const fresh={...ctx,window:null,document:{...doc,documentElement:{dataset:{}},getElementById:()=>null,querySelector:()=>null}};
fresh.window=fresh;vm.createContext(fresh);vm.runInContext(themes,fresh);
assert.equal(fresh.document.documentElement.dataset.vzTheme,'noturno');
console.log('PASS: selected theme restored after reloading');
console.log('ALL THEME TESTS PASSED');
