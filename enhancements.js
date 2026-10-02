(function vinnyzauEnhancements() {
  'use strict';
  const original={home,brandPage,editor,openPost,modalHTML};
  const dateKey=d=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  const nowKey=()=>dateKey(new Date());
  const dayLabel=s=>new Date(`${s}T12:00:00`).toLocaleDateString('pt-BR',{weekday:'long',day:'numeric',month:'long'});
  const sorted=list=>[...list].sort((a,b)=>(a.date+(a.time||'00:00')).localeCompare(b.date+(b.time||'00:00')));
  const notDone=p=>p.status!=='Publicado';
  const isStory=p=>/story/i.test(p.type||'');
  const displayType=t=>/story/i.test(t||'')?'Story':t||'Post';
  const localeDate=(s)=>new Date(`${s}T12:00:00`);
  const mediaUrls={};
  let dbPromise;
  const cleanDesc=m=>Array.isArray(m.descriptions)?m.descriptions:[m.caption||'',m.alternative||'',m.storyCaption||''];
  const mediaLink=m=>m?.data||mediaUrls[m?.id]||'';
  const safeURL=m=>esc(mediaLink(m));
  function openMediaDatabase(){
    if(typeof indexedDB==='undefined')return Promise.resolve(null);
    if(dbPromise)return dbPromise;
    dbPromise=new Promise((resolve,reject)=>{
      const request=indexedDB.open('vinnyzau-media',1);
      request.onupgradeneeded=()=>{const store=request.result;if(!store.objectStoreNames.contains('files'))store.createObjectStore('files');};
      request.onsuccess=()=>resolve(request.result);
      request.onerror=()=>reject(request.error);
    }).catch(()=>null);
    return dbPromise;
  }
  async function writeFile(key,blob){
    const database=await openMediaDatabase();
    if(!database)throw Error('Este navegador não permite armazenar anexos. Abra no Chrome ou Safari.');
    await new Promise((resolve,reject)=>{
      let tr=database.transaction('files','readwrite');
      tr.objectStore('files').put(blob,key);
      tr.oncomplete=resolve;tr.onerror=()=>reject(tr.error);tr.onabort=()=>reject(tr.error);
    });
    if(mediaUrls[key])URL.revokeObjectURL(mediaUrls[key]);
    mediaUrls[key]=URL.createObjectURL(blob);
  }
  async function fetchFile(key){
    const database=await openMediaDatabase();
    if(!database)return;
    const blob=await new Promise((resolve,reject)=>{
      let tr=database.transaction('files','readonly');
      let request=tr.objectStore('files').get(key);
      request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error);
    }).catch(()=>null);
    if(blob){if(mediaUrls[key])URL.revokeObjectURL(mediaUrls[key]);mediaUrls[key]=URL.createObjectURL(blob);}
  }
  async function removeFile(key){
    if(mediaUrls[key]){URL.revokeObjectURL(mediaUrls[key]);delete mediaUrls[key];}
    const database=await openMediaDatabase();if(!database)return;
    await new Promise(resolve=>{const tr=database.transaction('files','readwrite');tr.objectStore('files').delete(key);tr.oncomplete=resolve;tr.onerror=resolve;});
  }
  async function hydrateMedia(){
    if(!db.materials)db.materials=[];
    const keys=db.materials.filter(m=>m.fileKey&&!m.data).map(m=>m.fileKey)
      .concat(db.posts.filter(p=>p.mediaRef&&p.mediaRef.startsWith('post-')).map(p=>p.mediaRef));
    await Promise.all(keys.map(fetchFile));
    if(ui.page==='creative'||ui.page==='brand'||ui.page==='editor')render();
  }
  function assetForPost(p){
    if(p.mediaRef){
      const linked=db.materials.find(m=>m.id===p.mediaRef);
      return linked?{src:mediaLink(linked),mime:linked.mime||''}:{src:mediaUrls[p.mediaRef]||'',mime:p.mediaMime||''};
    }
    return {src:p.media||'',mime:p.mediaMime||'image/jpeg'};
  }
  function preview(src,mime,cls='vz-preview'){
    if(!src)return `<div class="${cls} vz-empty-media">🎨 Sem anexo</div>`;
    return mime.startsWith('video/')?`<video class="${cls}" src="${esc(src)}" controls playsinline preload="metadata"></video>`:`<img class="${cls}" src="${esc(src)}" alt="Prévia do criativo">`;
  }
  function agendaItem(p){
    let b=brand(p.brandId);
    const state=p.date<nowKey()&&notDone(p)?'⚠ Atrasado':p.date===nowKey()?'Hoje':fmt(p.date);
    return `<article class="vz-agenda-item" style="--item-color:${esc(b.color)}">
      <div class="row space wrap"><b>${esc(p.title||'Sem assunto')}</b><span class="vz-chip">${state} · ${esc(p.time||'--:--')}</span></div>
      <div class="small muted">${esc(b.name)} · ${esc(displayType(p.type))} · ${esc(p.platform||'Sem plataforma')} · ${esc(p.status||'Programado')}</div>
      ${p.caption?`<p class="vz-caption">${esc(p.caption)}</p>`:''}
      ${p.hashtags?`<div class="small muted">${esc(p.hashtags)}</div>`:''}
      <div class="vz-item-actions"><button class="link" onclick="openPost('${p.id}')">✎ Abrir e editar</button>${p.caption?`<button class="link" onclick="vzCopyPost('${p.id}')">Copiar legenda</button>`:''}</div>
    </article>`;
  }
  window.vzCopyPost=async id=>{
    const p=db.posts.find(x=>x.id===id);if(!p?.caption)return;
    try{await navigator.clipboard.writeText([p.caption,p.hashtags||''].filter(Boolean).join('\n\n'));alert('Legenda copiada.');}
    catch{alert('Não foi possível copiar automaticamente. Abra o post e selecione a legenda.');}
  };
  function homeUpcoming(){
    const list=sorted(db.posts.filter(p=>notDone(p)&&p.date>=nowKey())).slice(0,4);
    return `<section class="vz-home-focus">
      <div class="row space"><h2 class="h2">📌 Na sua agenda</h2><button class="link" onclick="go('calendar')">Calendário ›</button></div>
      ${list.length?list.map(p=>`<button class="vz-home-task" onclick="go('brand',{brand:'${p.brandId}',tab:'Resumo'})" style="--item-color:${esc(color(p.brandId))}">
      <span class="vz-home-mark">${isStory(p)?'📱':'📣'}</span><span><strong>${esc(brand(p.brandId).name)}</strong><small>${p.date===nowKey()?'Hoje':fmt(p.date)} · ${esc(p.time||'--:--')} · ${esc(displayType(p.type))}</small><small>${esc(p.title||'Sem assunto')}</small></span><span>›</span></button>`).join(''):'<div class="empty">Nenhuma tarefa futura. Abra uma marca ou o calendário para agendar.</div>'}
      </section>`;
  }
  home=function(){
    const base=original.home();
    return base.replace('<div class="section-head"><h2>Meus estabelecimentos',homeUpcoming()+'<div class="section-head"><h2>Meus estabelecimentos');
  };
  brandPage=function(){
    if(ui.tab!=='Resumo')return original.brandPage();
    const b=brand(ui.brand);if(!b)return original.brandPage();
    const head=original.brandPage();
    const start=head.indexOf('<section class="card"');
    if(start<0)return head;
    const pending=sorted(db.posts.filter(p=>p.brandId===b.id&&notDone(p)));
    const todayPosts=pending.filter(p=>p.date===nowKey()&&!isStory(p));
    const futurePosts=pending.filter(p=>p.date>nowKey()&&!isStory(p));
    const overdue=pending.filter(p=>p.date<nowKey());
    const stories=pending.filter(p=>p.date>=nowKey()&&isStory(p));
    const published=sorted(db.posts.filter(p=>p.brandId===b.id&&p.status==='Publicado')).reverse().slice(0,2);
    const section=(title,items,empty)=>`<div class="section-head"><h2>${title}</h2><span class="tiny-count">${items.length}</span></div>${items.length?items.map(agendaItem).join(''):`<div class="vz-hint">${empty}</div>`}`;
    return head.slice(0,start)+`
      <section class="vz-brand-summary" style="--item-color:${esc(b.color)}">
        <div class="row space"><div><b>${esc(b.name)}</b><p class="small no-margin">${esc(b.platforms.join(' · '))}</p></div><span class="vz-summary-status">${b.active?'● Ativo':'○ Inativo'}</span></div>
        <p class="small">Ritmo definido: ${esc(b.frequency)} · ${pending.length} tarefas pendentes</p>
        <button class="btn primary full" onclick="vzNewTask('${nowKey()}','${b.id}')">＋ Adicionar tarefa</button>
      </section>
      ${overdue.length?section('⚠ Para reorganizar',overdue,''):''}
      ${section('📅 Suas tarefas de hoje',todayPosts,'Nenhum post de feed ou vídeo previsto para hoje.')}
      ${section('⏰ Próximas publicações',futurePosts,'Nenhuma publicação futura agendada.')}
      ${section('📱 Stories de hoje e futuros',stories,'Nenhum story agendado.')}
      ${section('✅ Últimos publicados',published,'Ainda não há posts marcados como publicados.')}
      <button class="btn ghost full" style="margin-top:16px" onclick="go('calendar',{filter:'${b.id}'})">Ver calendário da empresa</button>`;
  };
  ui.monthCursor=ui.monthCursor||nowKey().slice(0,7);
  window.vzMonth=offset=>{
    const [year,month]=ui.monthCursor.split('-').map(Number);
    const d=new Date(year,month-1+offset,1);
    ui.monthCursor=`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
    ui.calendarDate=null;render();
  };
  window.vzToday=()=>{ui.monthCursor=nowKey().slice(0,7);ui.calendarDate=nowKey();render();};
  window.vzNewTask=(date,brandId)=>{
    if(!db.brands.length)return showModal('brand');
    ui.calendarDate=date||nowKey();
    showModal('vz-task',brandId||((ui.filter==='all')?db.brands[0].id:ui.filter));
  };
  window.vzPickDay=date=>{ui.calendarDate=date;window.vzNewTask(date);};
  calendar=function(){
    const [year,month]=ui.monthCursor.split('-').map(Number);
    const first=new Date(year,month-1,1),count=new Date(year,month,0).getDate();
    const padding=(first.getDay()+6)%7,cellCount=Math.ceil((padding+count)/7)*7;
    const posts=sortedPosts().filter(p=>ui.filter==='all'||p.brandId===ui.filter);
    const cells=Array.from({length:cellCount},(_,i)=>{
      const d=new Date(year,month-1,1+i-padding),key=dateKey(d),other=d.getMonth()!==month-1;
      const listed=posts.filter(p=>p.date===key),colors=[...new Set(listed.map(p=>color(p.brandId)))].slice(0,4);
      const label=d.toLocaleDateString('pt-BR',{weekday:'long',day:'numeric',month:'long'});
      return `<button class="vz-day ${other?'vz-other':''} ${key===nowKey()?'vz-today':''} ${key===ui.calendarDate?'vz-selected':''}"
          aria-label="${esc(label)}: ${listed.length} tarefas. Toque para agendar."
          onclick="vzPickDay('${key}')"><span>${d.getDate()}</span>
          <span class="vz-dots">${colors.map(c=>`<i style="background:${esc(c)}"></i>`).join('')}</span>
          ${listed.length?`<small>${listed.length}</small>`:''}
        </button>`;
    }).join('');
    const selected=ui.calendarDate||nowKey();
    const selectedItems=posts.filter(p=>p.date===selected);
    const monthName=first.toLocaleDateString('pt-BR',{month:'long',year:'numeric'});
    return `<header class="top-actions"><h1 class="h1">Calendário 📅</h1><button class="btn primary smallbtn" onclick="vzNewTask('${selected}')">＋ Tarefa</button></header>
      <p class="muted">Toque em qualquer dia para incluir um compromisso com horário e legenda.</p>${pillFilter()}
      <section class="vz-month card">
       <div class="row space"><button class="vz-arrow" onclick="vzMonth(-1)" aria-label="Mês anterior">‹</button>
       <strong class="vz-month-title">${esc(monthName)}</strong><button class="vz-arrow" onclick="vzMonth(1)" aria-label="Próximo mês">›</button></div>
       <div class="vz-month-grid">${['Seg','Ter','Qua','Qui','Sex','Sáb','Dom'].map(d=>`<span class="vz-weekday">${d}</span>`).join('')}${cells}</div>
       <button class="link" onclick="vzToday()">Ir para hoje</button>
      </section>
      <div class="vz-hint">Planeje, crie, aprove e publique. Tudo no tempo certo, sem confusão!</div>
      <div class="section-head"><h2>📌 ${esc(dayLabel(selected))}</h2><span class="tiny-count">${selectedItems.length}</span></div>
      ${selectedItems.length?selectedItems.map(agendaItem).join(''):'<div class="empty">Sem tarefas para este dia. Toque no dia para agendar.</div>'}
      <button class="btn primary full" onclick="vzNewTask('${selected}')">＋ Agendar neste dia</button>
      <div class="section-head"><h2>Próximos compromissos</h2></div>
      ${posts.filter(p=>p.date>selected&&notDone(p)).slice(0,6).map(agendaItem).join('')||'<div class="vz-hint">Nenhuma tarefa futura neste filtro.</div>'}`;
  };
  window.vzSaveTask=e=>{
    e.preventDefault();
    const f=e.target.elements;
    const val=n=>f.namedItem(n)?.value||'';
    if(!val('title').trim()||!val('date')||!val('time'))return alert('Informe assunto, data e horário.');
    const type=val('type');
    const post={id:'p'+Date.now()+'_'+Math.random().toString(36).slice(2,6),brandId:val('brandId'),
      date:val('date'),time:val('time'),type,platform:type==='Outra tarefa'?'Organização':val('platform'),
      status:val('status'),title:val('title').trim(),caption:val('caption').trim(),
      hashtags:val('hashtags').trim(),media:''};
    db.posts.push(post);
    try{save();ui.calendarDate=post.date;ui.monthCursor=post.date.slice(0,7);ui.modal=null;render();}
    catch{db.posts.pop();alert('Não foi possível salvar. Verifique o espaço de armazenamento do navegador.');}
  };
  const taskForm=()=>{
    const b=ui.modal.id,selected=ui.calendarDate||nowKey(),hour=new Date().getHours();
    const pad=n=>String(n).padStart(2,'0');
    return `<div class="modal"><div class="row space"><h2>＋ Nova tarefa</h2><button class="back" aria-label="Fechar" onclick="closeModal()">×</button></div>
      <p class="small muted">O compromisso aparecerá na agenda da empresa, separado por tipo.</p>
      <form onsubmit="vzSaveTask(event)">
       <div class="form-field"><label>Empresa</label><select class="input" name="brandId">${options(b,false)}</select></div>
       <div class="grid2"><div class="form-field"><label>Dia</label><input required class="input" type="date" name="date" value="${esc(selected)}"></div>
       <div class="form-field"><label>Hora</label><input required class="input" type="time" name="time" value="${pad(hour)}:00"></div></div>
       <div class="grid2"><div class="form-field"><label>Tipo</label><select class="input" name="type">
        ${['Post Feed','Story','Reel','Vídeo','Carrossel','Outra tarefa'].map(t=>`<option>${t}</option>`).join('')}</select></div>
        <div class="form-field"><label>Plataforma</label><select class="input" name="platform">${['Instagram','Facebook','TikTok','YouTube','Pinterest','Outros'].map(t=>`<option>${t}</option>`).join('')}</select></div></div>
       <div class="form-field"><label>Assunto / tarefa *</label><input class="input" name="title" required maxlength="100" placeholder="Ex.: Divulgar promoção da loja"></div>
       <div class="form-field"><label>Legenda / observações</label><textarea class="input" name="caption" rows="4" maxlength="2200" placeholder="Legenda, roteiro ou instruções para o dia..."></textarea></div>
       <div class="form-field"><label>Hashtags</label><input class="input" name="hashtags" placeholder="#promoção #novidade"></div>
       <div class="form-field"><label>Status</label><select class="input" name="status">${['Programado','Rascunho','Aguardando Aprovação','Publicado'].map(t=>`<option>${t}</option>`).join('')}</select></div>
       <button class="btn primary full" type="submit">Salvar tarefa na agenda</button>
      </form></div>`;
  };
  function materialForm(m){
    const editing=!!m;
    const desc=editing?cleanDesc(m):['','',''];
    return `<div class="modal"><div class="row space"><h2>${editing?'Editar criativo':'Novo criativo e legendas'}</h2>
       <button class="back" aria-label="Fechar" onclick="closeModal()">×</button></div>
       <p class="small muted">Guarde fotos, vídeos, stories e até três versões de legenda para reutilizar.</p>
       <form onsubmit="vzSaveMaterial(event,'${editing?m.id:''}')">
         <div class="form-field"><label>Empresa</label><select class="input" name="brandId">${options(editing?m.brandId:(ui.modal.id||db.brands[0]?.id),false)}</select></div>
         <div class="form-field"><label>Nome do material *</label><input class="input" name="title" required maxlength="100" value="${esc(m?.title||'')}" placeholder="Ex.: Novidades da semana"></div>
         <div class="grid2"><div class="form-field"><label>Conteúdo</label><select class="input" name="kind">${['Foto','Vídeo','Story','Carrossel','Texto / legenda'].map(t=>`<option ${m?.kind===t?'selected':''}>${t}</option>`).join('')}</select></div>
          <div class="form-field"><label>Situação</label><select class="input" name="status">${[['Desenvolvimento','Em desenvolvimento'],['Salvo','Arquivo salvo'],['Publicado','Já publicado']].map(([v,t])=>`<option value="${v}" ${m?.status===v?'selected':''}>${t}</option>`).join('')}</select></div></div>
         ${editing?preview(mediaLink(m),m.mime||'','vz-preview'):''}
         <div class="form-field"><label>📎 ${editing?'Trocar anexo (opcional)':'Foto ou vídeo (opcional)'}</label>
           <input class="input" type="file" id="vzMaterialFile" accept="image/jpeg,image/png,video/mp4">
           <p class="small muted">JPG, PNG e MP4. O anexo fica salvo neste aparelho; arquivos grandes dependem do espaço disponível.</p></div>
         ${['Legenda principal','Outra opção de legenda','Texto para story / roteiro'].map((label,i)=>`
          <div class="form-field"><label>${label}</label><textarea class="input" name="desc${i}" rows="3" maxlength="3500"
          placeholder="${i===0?'Escreva a legenda que acompanhará a foto ou vídeo':i===1?'Guarde outra maneira de divulgar':'Texto curto para story ou roteiro do vídeo'}">${esc(desc[i]||'')}</textarea></div>`).join('')}
         <div class="form-field"><label>Hashtags</label><textarea class="input" name="hashtags" rows="2" placeholder="#minhaloja #novidade">${esc(m?.hashtags||'')}</textarea></div>
         <button class="btn primary full" type="submit">${editing?'Salvar alterações':'Salvar criativo e legendas'}</button>
       </form>
       ${editing?`<div class="vz-detail-buttons"><button class="btn ghost" onclick="vzUseMaterial('${m.id}')">Criar post com este material</button><button class="btn" style="color:#bd244f" onclick="vzRemoveMaterial('${m.id}')">Excluir material</button></div>`:''}
     </div>`;
  }
  window.vzSaveMaterial=async(e,id)=>{
    e.preventDefault();
    const f=e.target.elements,v=n=>f.namedItem(n)?.value||'';
    const file=document.getElementById('vzMaterialFile')?.files?.[0];
    if(file&&!['image/jpeg','image/png','video/mp4'].includes(file.type))return alert('Anexe apenas JPG, PNG ou MP4.');
    if(file&&file.size>50*1024*1024)return alert('Use arquivos de até 50 MB.');
    const existing=db.materials.find(m=>m.id===id);
    const entry=existing||{id:'m'+Date.now()+'_'+Math.random().toString(36).slice(2,6),date:nowKey(),mime:'',data:''};
    const update={brandId:v('brandId'),title:v('title').trim(),kind:v('kind'),status:v('status'),
      descriptions:[v('desc0'),v('desc1'),v('desc2')],hashtags:v('hashtags').trim()};
    if(!update.title)return alert('Informe um nome para o material.');
    if(file){
      try{await writeFile(entry.id,file);update.mime=file.type;update.fileKey=entry.id;update.data='';}
      catch(err){return alert('Não foi possível guardar o arquivo neste aparelho: '+err.message);}
    }
    const before=existing?{...existing}:null;
    Object.assign(entry,update);
    if(!existing)db.materials.push(entry);
    try{save();}
    catch{if(existing)Object.assign(entry,before);else db.materials.pop();return alert('Sem espaço para guardar este cadastro.');}
    ui.filter=entry.brandId;ui.creativeTab=entry.status==='Publicado'?'Já Publicados':entry.status==='Salvo'?'Arquivos Salvos':'Em Desenvolvimento';
    ui.modal=null;go('creative');
  };
  window.vzRemoveMaterial=async id=>{
    const item=db.materials.find(m=>m.id===id);
    if(!item||!confirm('Deseja excluir este criativo e suas legendas?'))return;
    // Keep media referenced by existing posts until those posts are manually updated.
    if(db.posts.some(p=>p.mediaRef===id))return alert('Este criativo está vinculado a um post. Edite o post antes de excluir.');
    db.materials=db.materials.filter(m=>m.id!==id);
    try{save();if(item.fileKey)await removeFile(item.fileKey);closeModal();}
    catch{db.materials.push(item);alert('Não foi possível excluir agora.');}
  };
  window.vzCopyCaption=async(id,i)=>{
    const m=db.materials.find(x=>x.id===id),txt=cleanDesc(m)[i];
    if(!txt)return alert('Esse campo de legenda está vazio.');
    const full=txt+(m.hashtags?'\n\n'+m.hashtags:'');
    try{await navigator.clipboard.writeText(full);alert('Legenda copiada.');}
    catch{alert('Não foi possível copiar automaticamente. Abra o material e selecione o texto.');}
  };
  window.vzUseMaterial=id=>{
    const m=db.materials.find(x=>x.id===id);if(!m)return;
    if(!db.brands.some(b=>b.id===m.brandId))return alert('Cadastre uma empresa para usar este criativo.');
    ui.editId=null;ui.postBrand=m.brandId;ui.vzMaterialId=m.id;ui.vzPendingFile=null;
    go('editor');
    const form=document.getElementById('postForm');
    if(!form)return;
    form.elements.namedItem('title').value=m.title;
    form.elements.namedItem('type').value=m.kind==='Story'?'Story':m.kind==='Vídeo'?'Vídeo':m.kind==='Carrossel'?'Carrossel':'Post Feed';
    form.elements.namedItem('caption').value=cleanDesc(m)[0]||cleanDesc(m)[2]||'';
    form.elements.namedItem('hashtags').value=m.hashtags||'';
    const target=document.getElementById('postPreview');
    if(target)target.innerHTML=preview(mediaLink(m),m.mime||'');
    document.getElementById('vzLinked')?.replaceChildren(document.createTextNode('Anexo vinculado: '+m.title));
  };
  function materialCard(m){
    const cap=cleanDesc(m).filter(Boolean)[0]||'Nenhuma legenda cadastrada.';
    let src=mediaLink(m),thumb=src?(m.mime||'').startsWith('video/')?`<video src="${esc(src)}" muted playsinline preload="metadata"></video>`:`<img src="${esc(src)}" alt="${esc(m.title)}">`:'<span>📝</span>';
    return `<article class="vz-creative-card">
      <div class="vz-media-thumb">${thumb}<span class="overlay-tag">${esc(m.kind||'Criativo')}</span></div>
      <div class="vz-creative-body"><b>${esc(m.title)}</b><div class="small muted">${esc(brand(m.brandId)?.name||'')} · ${esc(m.status||'Salvo')}</div>
      <p class="vz-caption vz-clip">${esc(cap)}</p>
      <div class="vz-item-actions"><button class="link" onclick="showModal('material','${m.id}')">Ver legendas</button>
       <button class="link" onclick="vzUseMaterial('${m.id}')">Usar no post</button></div></div>
    </article>`;
  }
  creativeContent=function(bid){
    const m=db.materials.filter(item=>(bid?item.brandId===bid:ui.filter==='all'||item.brandId===ui.filter)&&
      (ui.creativeTab==='Já Publicados'?item.status==='Publicado':ui.creativeTab==='Em Desenvolvimento'?item.status==='Desenvolvimento':item.status==='Salvo'));
    return `<div class="tabs">${['Já Publicados','Em Desenvolvimento','Arquivos Salvos'].map(t=>`<button class="tab ${ui.creativeTab===t?'active':''}" onclick="ui.creativeTab='${t}';render()">${t}</button>`).join('')}</div>
    <div class="vz-creative-grid">${m.map(materialCard).join('')}</div>
    ${m.length?'':'<div class="empty">Nenhum material nesta aba. Salve fotos, vídeos ou legendas para começar.</div>'}
    <div class="drop"><b>📎 Sua biblioteca de fotos, vídeos e legendas</b><p class="small muted">Cadastre até três versões de texto por material e reutilize na hora de agendar.</p>
     <button class="btn inkbtn" onclick="showModal('upload'${bid?`,'${bid}'`:''})">＋ Criar material</button></div>`;
  };
  creative=function(){
    return `<div class="top-actions"><h1 class="h1">Criativos 🎨</h1><button class="btn inkbtn smallbtn" onclick="showModal('upload')">＋ Criar</button></div>
    <p class="muted">Fotos, vídeos, stories e suas legendas, organizados por empresa.</p>${pillFilter()}${creativeContent(null)}`;
  };
  modalHTML=function(){
    if(!ui.modal)return '';
    if(ui.modal.kind==='vz-task')return taskForm();
    if(ui.modal.kind==='upload')return materialForm(null);
    if(ui.modal.kind==='material'){
      const m=db.materials.find(x=>x.id===ui.modal.id);
      if(!m)return '';
      const desc=cleanDesc(m);
      return `<div class="modal"><div class="row space"><h2>${esc(m.title)}</h2><button class="back" aria-label="Fechar" onclick="closeModal()">×</button></div>
       ${preview(mediaLink(m),m.mime||'')}
       <p class="small muted">${esc(brand(m.brandId)?.name||'')} · ${esc(m.kind||'Criativo')}</p>
       ${['Legenda principal','Outra opção de legenda','Texto do story / roteiro'].map((t,i)=>`<div class="vz-desc-read">
         <b>${t}</b><p>${esc(desc[i]||'Sem texto cadastrado.')}</p>
         ${desc[i]?`<button class="link" onclick="vzCopyCaption('${m.id}',${i})">📋 Copiar legenda</button>`:''}
       </div>`).join('')}
       ${m.hashtags?`<div class="vz-hint"># ${esc(m.hashtags)}</div>`:''}
       <div class="vz-detail-buttons"><button class="btn ghost" onclick="vzUseMaterial('${m.id}')">Criar post com este material</button>
       <button class="btn primary" onclick="showModal('vz-edit-material','${m.id}')">Editar material e textos</button></div></div>`;
    }
    if(ui.modal.kind==='vz-edit-material'){
      const m=db.materials.find(x=>x.id===ui.modal.id);
      return m?materialForm(m):'';
    }
    return original.modalHTML();
  };
  const baseEditor=original.editor;
  editor=function(){
    let html=baseEditor();
    const p=db.posts.find(x=>x.id===ui.editId);
    const ref=ui.vzMaterialId||p?.mediaRef;
    let src='',mime='';
    if(ref){
      const m=db.materials.find(x=>x.id===ref);
      if(m){src=mediaLink(m);mime=m.mime||'';}else{src=mediaUrls[ref]||'';mime=p?.mediaMime||'';}
    }
    if(src){
      const replacement=preview(src,mime);
      html=html.replace(/<div class="preview" id="postPreview">[\s\S]*?<\/div>/,
        `<div class="preview" id="postPreview">${replacement}</div>`);
    }
    html=html.replace('accept="image/png,image/jpeg" id="postMedia"',
      'accept="image/png,image/jpeg,video/mp4" id="postMedia"');
    html=html.replace('<div class="form-field"><label>Legenda</label>',
      `<p class="vz-hint" id="vzLinked">${ref?'Mídia vinculada à biblioteca. Você pode editar ou trocar o anexo.':'Você pode criar este post com um criativo e uma legenda salvos na aba Criativos.'}</p><div class="form-field"><label>Legenda</label>`);
    if(p?.type==='Outra tarefa')html=html.replace(/(<select class="input" name="type">)([\s\S]*?)(<\/select>)/,(_,a,b,c)=>a+b+'<option selected>Outra tarefa</option>'+c);
    return html;
  };
  openPost=function(id=null,bid){
    ui.vzPendingFile=null;ui.vzMaterialId=db.posts.find(p=>p.id===id)?.mediaRef||null;
    original.openPost(id,bid);
  };
  previewPostFile=async function(input){
    const file=input.files?.[0];if(!file)return;
    if(!['image/jpeg','image/png','video/mp4'].includes(file.type))return alert('Escolha JPG, PNG ou MP4.');
    if(file.size>50*1024*1024)return alert('O limite para anexos é de 50 MB.');
    if(ui.vzPreviewUrl)URL.revokeObjectURL(ui.vzPreviewUrl);
    ui.vzPreviewUrl=URL.createObjectURL(file);
    ui.vzPendingFile=file;ui.vzMaterialId=null;
    document.getElementById('mediaValue').value='';
    document.getElementById('postPreview').innerHTML=preview(ui.vzPreviewUrl,file.type);
    const hint=document.getElementById('vzLinked');
    if(hint)hint.textContent='Novo anexo selecionado. Ele será salvo neste dispositivo quando você salvar o post.';
  };
  savePost=async function(e){
    e.preventDefault();
    const f=e.target.elements,v=n=>f.namedItem(n)?.value||'';
    if(!v('title').trim()||!v('date')||!v('time'))return alert('Preencha o assunto, a data e o horário.');
    const id=ui.editId||'p'+Date.now()+'_'+Math.random().toString(36).slice(2,6);
    const existing=db.posts.find(p=>p.id===id);
    const entry={id,brandId:v('brandId'),platform:v('platform'),type:v('type'),date:v('date'),time:v('time'),status:v('status'),
      title:v('title').trim(),caption:v('caption'),hashtags:v('hashtags'),media:v('media'),
      mediaRef:ui.vzMaterialId||existing?.mediaRef||null,mediaMime:existing?.mediaMime||''};
    if(ui.vzPendingFile){
      const key='post-'+id;
      try{await writeFile(key,ui.vzPendingFile);entry.media='';entry.mediaRef=key;entry.mediaMime=ui.vzPendingFile.type;}
      catch(err){return alert('Não foi possível salvar o anexo: '+err.message);}
    }
    const snapshot=existing?{...existing}:null;
    if(existing)Object.assign(existing,entry);else db.posts.push(entry);
    try{save();}
    catch{if(existing)Object.assign(existing,snapshot);else db.posts.pop();return alert('Sem espaço para salvar este post.');}
    ui.vzPendingFile=null;ui.vzMaterialId=null;ui.calendarDate=entry.date;ui.monthCursor=entry.date.slice(0,7);
    ui.filter='all';go('calendar');
  };
  function reportDetails(bid){
    const b=brand(bid);if(!b)return '';
    const todayDate=nowKey(),days7=new Date();days7.setDate(days7.getDate()+7);
    const seven=dateKey(days7),days28=new Date();days28.setDate(days28.getDate()-28);
    const start28=dateKey(days28),posts=db.posts.filter(p=>p.brandId===bid);
    const published=posts.filter(p=>p.status==='Publicado'&&p.date>=start28&&p.date<=todayDate);
    const scheduled=posts.filter(p=>notDone(p)&&p.date>=todayDate&&p.date<seven);
    const overdue=posts.filter(p=>notDone(p)&&p.date<todayDate);
    const stories=posts.filter(isStory),storyWeek=scheduled.filter(isStory).length;
    const target=parseInt(b.frequency,10)||3;
    const last28Avg=(published.length/4).toFixed(1).replace('.',',');
    const notes=[];
    if(overdue.length)notes.push(`Você tem ${overdue.length} compromisso(s) cuja data passou sem marcar como publicado. Confira e reagende.`);
    if(scheduled.length<target)notes.push(`Você definiu uma frequência de ${esc(b.frequency)}. Há ${scheduled.length} tarefa(s) nos próximos 7 dias. Planeje as próximas publicações com antecedência.`);
    else notes.push(`Você tem ${scheduled.length} tarefa(s) nos próximos 7 dias. Revise as legendas e os anexos antes de publicar.`);
    if(storyWeek===0)notes.push('Ainda não há stories agendados para os próximos dias. Avalie se faz sentido incluí-los na sua estratégia.');
    notes.push('Reserve um período fixo na semana para criar vários materiais e outro para revisar a agenda e preparar as legendas.');
    return `<section class="vz-report-extra">
      <div class="section-head"><h2>📊 Seu ritmo de conteúdo</h2></div>
      <div class="vz-report-grid">
       <div class="vz-report-stat"><b>${published.length}</b><small>Marcados como publicados nos últimos 28 dias</small></div>
       <div class="vz-report-stat"><b>${scheduled.length}</b><small>Agendados nos próximos 7 dias</small></div>
       <div class="vz-report-stat"><b>${stories.length}</b><small>Stories cadastrados no total</small></div>
       <div class="vz-report-stat"><b>${last28Avg}</b><small>Publicações por semana (média registrada)</small></div>
      </div>
      <div class="card"><h2 class="h2" style="margin:0 0 12px">💡 Dicas de frequência e tempo</h2>
        ${notes.map((n,i)=>`<div class="vz-tip"><span>${['🗓','🎯','📱','⏱'][i%4]}</span><p>${n}</p></div>`).join('')}
        <p class="small muted">Orientações baseadas nos registros deste aplicativo, não em dados automáticos do Instagram, TikTok ou Facebook.</p>
       <button class="btn ghost full" onclick="go('calendar',{filter:'${bid}'})">Organizar minha agenda</button>
      </div></section>`;
  }
  const oldReportsContent=reportsContent;
  reportsContent=function(id){return oldReportsContent(id)+reportDetails(id);};
  if(typeof indexedDB!=='undefined')hydrateMedia().catch(err=>console.warn('Não foi possível recuperar anexos:',err));
  render();
})();
