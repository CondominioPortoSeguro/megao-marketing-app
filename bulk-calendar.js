/* Vinnyzau: safe bulk reassignment of calendar task companies. */
(function vinnyzauBulkCalendar(){
  'use strict';
  const previousCalendar=calendar;
  const state={open:false,scope:'month',source:'all',target:'',selected:new Set(),notice:''};
  const postedDate=p=>String(p.date||'');
  const items=()=>{
    const month=String(ui.monthCursor||'').slice(0,7);
    return [...db.posts].filter(p=>(state.scope==='all'||postedDate(p).slice(0,7)===month)
      &&(state.source==='all'||p.brandId===state.source))
      .sort((a,b)=>(postedDate(a)+(a.time||'')).localeCompare(postedDate(b)+(b.time||'')));
  };
  const safe=s=>esc(s??'');
  const visible=()=>{const ids=new Set(items().map(p=>String(p.id)));for(const id of state.selected)if(!ids.has(id))state.selected.delete(id);return ids};
  const companyOptions=(selected,all=false)=>{
    return (all?'<option value="all">Todas as empresas</option>':'<option value="">Selecione a empresa correta</option>')+
      db.brands.map(b=>'<option value="'+safe(b.id)+'" '+(b.id===selected?'selected':'')+'>'+safe(b.name)+'</option>').join('');
  };
  const heading=()=>'<div class="vz-bulk-heading"><div><div class="vz-bulk-eyebrow">CORRIGIR AGENDA</div>'+
    '<h2>Alterar empresa de várias tarefas</h2><p>Marque os compromissos e selecione a empresa correta. Datas, horários, legendas e mídias ficam iguais.</p></div>'+
    '<button type="button" aria-label="Fechar edição em lote" class="vz-bulk-close" onclick="vzBulkClose()">×</button></div>';
  function selectedCount(){return state.selected.size}
  function panel(){
    const list=items();visible();
    const targetExists=db.brands.some(b=>b.id===state.target);
    return '<section class="vz-bulk-panel" aria-label="Edição em lote das empresas">'+heading()+
      '<div class="vz-bulk-controls">'+
      '<div><label for="vz-bulk-source">Empresa cadastrada por engano</label>'+
      '<select class="input" id="vz-bulk-source" onchange="vzBulkSource(this.value)">'+companyOptions(state.source,true)+'</select></div>'+
      '<div><label>Quais compromissos mostrar?</label><div class="vz-bulk-scope">'+
      '<button type="button" class="'+(state.scope==='month'?'active':'')+'" onclick="vzBulkScope(\'month\')">Este mês</button>'+
      '<button type="button" class="'+(state.scope==='all'?'active':'')+'" onclick="vzBulkScope(\'all\')">Todas as datas</button></div></div></div>'+
      '<div class="vz-bulk-selectbar"><span><strong>'+list.length+'</strong> tarefas encontradas · <strong>'+selectedCount()+'</strong> selecionadas</span>'+
      '<div><button type="button" class="link" onclick="vzBulkSelectAll()">Selecionar todas</button>'+
      '<button type="button" class="link" onclick="vzBulkClear()">Limpar</button></div></div>'+
      '<div class="vz-bulk-list" role="group" aria-label="Tarefas disponíveis para alteração">'+
      (list.length?list.map(p=>{
        const b=db.brands.find(x=>x.id===p.brandId);
        return '<label class="vz-bulk-row" style="--vz-bulk-company:'+safe(b?.color||'#7135ec')+'">'+
          '<input type="checkbox" '+(state.selected.has(String(p.id))?'checked':'')+
          ' onchange="vzBulkToggle('+JSON.stringify(String(p.id)).replace(/"/g,'&quot;')+',this.checked)">'+
          '<span class="vz-bulk-row-content"><strong>'+safe(p.title||'Sem assunto')+'</strong>'+
          '<small>'+safe(p.date)+' · '+safe(p.time||'Sem horário')+' · '+safe(p.type||'Tarefa')+'</small>'+
          '<span class="vz-bulk-from">'+safe(b?.name||'Empresa desconhecida')+' · '+safe(p.status||'Sem status')+'</span></span></label>';
      }).join(''):'<div class="vz-bulk-empty">Não há compromissos para os filtros escolhidos.</div>')+'</div>'+
      '<div class="vz-bulk-target"><label for="vz-bulk-target">Nova empresa para as tarefas selecionadas</label>'+
      '<select class="input" id="vz-bulk-target" onchange="vzBulkTarget(this.value)">'+companyOptions(state.target)+'</select>'+
      '<button type="button" class="btn primary full" '+(!selectedCount()||!targetExists?'disabled':'')+
      ' onclick="vzBulkApply()">Alterar empresa de '+selectedCount()+' tarefa'+(selectedCount()===1?'':'s')+'</button>'+
      '<p class="vz-bulk-safety">Antes de salvar, você verá uma confirmação. Somente a empresa será alterada.</p>'+
      (state.notice?'<div class="vz-bulk-notice" role="status">'+safe(state.notice)+'</div>':'')+'</div></section>';
  }
  calendar=function(){
    const original=previousCalendar();
    const toggle='<button type="button" class="vz-bulk-toggle" onclick="vzBulkOpen()" aria-expanded="'+state.open+'">'+
      '<span>✎</span><span><b>Corrigir empresa em lote</b><small>Trocar a empresa de vários agendamentos</small></span>'+
      '<span class="vz-bulk-chevron">'+(state.open?'−':'›')+'</span></button>';
    const content=toggle+(state.open?panel():'');
    const anchor='<div class="vz-hint">Planeje, crie, aprove e publique.';
    if(original.includes(anchor))return original.replace(anchor,content+anchor);
    // Fallback if the agenda is restyled in a future release.
    return original+content;
  };
  window.vzBulkOpen=()=>{state.open=!state.open;state.notice='';render()};
  window.vzBulkClose=()=>{state.open=false;state.selected.clear();state.notice='';render()};
  window.vzBulkSource=value=>{state.source=db.brands.some(b=>b.id===value)?value:'all';state.selected.clear();state.notice='';render()};
  window.vzBulkScope=value=>{if(value!=='month'&&value!=='all')return;state.scope=value;state.selected.clear();state.notice='';render()};
  window.vzBulkTarget=value=>{state.target=db.brands.some(b=>b.id===value)?value:'';state.notice='';render()};
  window.vzBulkToggle=(id,checked)=>{if(!items().some(p=>String(p.id)===id))return;
    if(checked)state.selected.add(id);else state.selected.delete(id);state.notice='';render()};
  window.vzBulkSelectAll=()=>{state.selected=new Set(items().map(p=>String(p.id)));state.notice='';render()};
  window.vzBulkClear=()=>{state.selected.clear();state.notice='';render()};
  window.vzBulkApply=()=>{
    visible();
    const company=db.brands.find(b=>b.id===state.target);
    if(!company)return alert('Selecione a empresa correta.');
    if(!state.selected.size)return alert('Selecione pelo menos uma tarefa.');
    const chosen=db.posts.filter(p=>state.selected.has(String(p.id)));
    const changed=chosen.filter(p=>p.brandId!==company.id);
    if(!changed.length){state.notice='Todos os compromissos selecionados já pertencem a essa empresa.';render();return}
    if(!confirm('Alterar somente a empresa de '+changed.length+' tarefa(s) para '+company.name+'? As datas, horários, legendas e mídias serão preservados.'))return;
    const snapshot=changed.map(p=>({post:p,previous:p.brandId}));
    changed.forEach(p=>{p.brandId=company.id});
    try{
      save();
      state.selected.clear();
      state.notice='Concluído: '+changed.length+' tarefa(s) agora pertencem a '+company.name+'. Nenhuma data, horário ou legenda foi modificada.';
      // Reset the source filter so the moved records remain discoverable after saving.
      state.source='all';
      ui.filter='all';
      render();
    }catch(error){
      snapshot.forEach(({post,previous})=>{post.brandId=previous});
      alert('Não foi possível salvar. As alterações foram desfeitas; confira o armazenamento do navegador.');
      render();
    }
  };
})();
