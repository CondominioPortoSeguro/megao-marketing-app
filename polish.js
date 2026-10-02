/* Vinnyzau · polished mobile shell + local profile, layered on existing app. */
(function vinnyzauPolish(){
  'use strict';
  const PROFILE_KEY='vinnyzau-profile-v1';
  const defaults={name:'',role:'Gestão de marketing',photo:''};
  let profile;
  try{profile={...defaults,...JSON.parse(localStorage.getItem(PROFILE_KEY)||'{}')}}catch{profile={...defaults}}
  let panel=null, pendingPhoto=null;
  const previousRender=render;
  const greeting=()=>{
    const hour=new Date().getHours();
    return hour<12?'Bom dia':hour<18?'Boa tarde':'Boa noite';
  };
  const avatar=(cls='vz-avatar')=>profile.photo
    ?'<span class="'+cls+'"><img alt="Sua foto de perfil" src="'+esc(profile.photo)+'"></span>'
    :'<span class="'+cls+' vz-avatar-empty" aria-hidden="true">'+esc((profile.name||'V').trim().slice(0,1).toUpperCase())+'</span>';
  function safeName(){return profile.name?.trim()||'Seu perfil'}
  const upcoming=()=>db.posts.filter(p=>p.status!=='Publicado'&&p.date>=today());
  const countToday=()=>upcoming().filter(p=>p.date===today()).length;
  const countFuture=()=>upcoming().filter(p=>p.date>today()).length;
  const homeActions=()=>'<div class="vz-action-strip" aria-label="Atalhos rápidos">'+
    '<button type="button" onclick="vzOpenQuick()" class="vz-action vz-action-primary"><span>＋</span><strong>Criar</strong><small>Conteúdo</small></button>'+
    '<button type="button" onclick="go(\'calendar\')" class="vz-action"><span>▦</span><strong>Agenda</strong><small>Mês inteiro</small></button>'+
    '<button type="button" onclick="go(\'creative\')" class="vz-action"><span>▧</span><strong>Criativos</strong><small>Biblioteca</small></button>'+
    '<button type="button" onclick="go(\'reports\')" class="vz-action"><span>◫</span><strong>Resultados</strong><small>Relatórios</small></button>'+
    '</div>';
  function profileHTML(){
    const date=new Date().toLocaleDateString('pt-BR',{weekday:'long',day:'numeric',month:'long'});
    return '<div class="vz-layer" role="presentation" onclick="if(event.target===this)vzClosePanel()">'+
      '<section class="vz-sheet" role="dialog" aria-modal="true" aria-labelledby="vz-profile-title">'+
        '<div class="vz-sheet-grip" aria-hidden="true"></div>'+
        '<div class="vz-sheet-top"><div><div class="vz-overline">CONTA LOCAL</div><h2 id="vz-profile-title">Meu perfil</h2></div><button type="button" class="vz-close" aria-label="Fechar perfil" onclick="vzClosePanel()">×</button></div>'+
        '<form onsubmit="vzSaveProfile(event)">'+
        '<div class="vz-profile-photo">'+avatar('vz-avatar vz-avatar-large')+
           '<div><strong>Sua foto</strong><p>Personalize o aplicativo com a sua imagem.</p>'+
           '<label class="vz-photo-control" for="vzPhotoInput">Alterar foto</label>'+
           '<input id="vzPhotoInput" class="vz-visually-hidden" type="file" accept="image/png,image/jpeg,image/webp" onchange="vzPreviewPhoto(this)"></div></div>'+
        '<div class="form-field"><label for="vzName">Nome de exibição</label><input class="input" id="vzName" name="name" maxlength="50" autocomplete="name" value="'+esc(profile.name)+'" placeholder="Como prefere ser chamado?"></div>'+
        '<div class="form-field"><label for="vzRole">Sua função</label><input class="input" id="vzRole" name="role" maxlength="70" value="'+esc(profile.role)+'" placeholder="Ex.: Marketing e conteúdo"></div>'+
        '<p class="vz-small-note">Seu perfil, suas tarefas e suas fotos ficam neste dispositivo. Eles não são sincronizados automaticamente.</p>'+
        '<button type="submit" class="btn primary full">Salvar perfil</button>'+
        '</form><div class="vz-sheet-footer">'+esc(date)+'</div></section></div>';
  }
  function quickHTML(){
    return '<div class="vz-layer" role="presentation" onclick="if(event.target===this)vzClosePanel()">'+
      '<section class="vz-sheet vz-quick-sheet" role="dialog" aria-modal="true" aria-labelledby="vz-quick-title">'+
      '<div class="vz-sheet-grip" aria-hidden="true"></div>'+
      '<div class="vz-sheet-top"><div><div class="vz-overline">ACESSO RÁPIDO</div><h2 id="vz-quick-title">O que vamos criar?</h2></div><button type="button" class="vz-close" aria-label="Fechar" onclick="vzClosePanel()">×</button></div>'+
      '<button type="button" class="vz-quick-option" onclick="vzQuickAction(\'task\')"><span class="vz-quick-icon">📅</span><span><b>Nova tarefa</b><small>Escolha a data, o horário e a empresa</small></span><span>›</span></button>'+
      '<button type="button" class="vz-quick-option" onclick="vzQuickAction(\'post\')"><span class="vz-quick-icon">📣</span><span><b>Novo post ou story</b><small>Inclua legenda e mídia para agendar</small></span><span>›</span></button>'+
      '<button type="button" class="vz-quick-option" onclick="vzQuickAction(\'creative\')"><span class="vz-quick-icon">🎨</span><span><b>Novo criativo</b><small>Guarde vídeos, fotos e legendas</small></span><span>›</span></button>'+
      '</section></div>';
  }
  function decorate(){
    const root=$('app');
    if(!root)return;
    const inner=root.querySelector('.inner');
    if(inner){
      inner.insertAdjacentHTML('afterbegin','<div class="vz-app-header">'+
        '<div class="vz-wordmark"><span class="vz-wordmark-icon">V</span><span>vinnyzau<small>STUDIO</small></span></div>'+
        '<div class="vz-header-right">'+
        '<button type="button" aria-label="Criar nova tarefa ou conteúdo" class="vz-top-plus" onclick="vzOpenQuick()">＋</button>'+
        '<button type="button" aria-label="Abrir meu perfil" class="vz-profile-trigger" onclick="vzOpenProfile()">'+avatar()+'</button>'+
        '</div></div>');
      if(ui.page==='home'){
        const hero=inner.querySelector('.hero');
        if(hero){
          const eyebrow=hero.querySelector('.eyebrow'),h1=hero.querySelector('.h1'),paragraph=hero.querySelector('.muted');
          if(eyebrow)eyebrow.textContent=greeting()+', '+safeName()+' ✨';
          if(h1)h1.textContent='Seu trabalho, em dia.';
          if(paragraph)paragraph.textContent='Organize suas marcas com leveza e tudo em um só lugar.';
          hero.insertAdjacentHTML('afterend',
            '<div class="vz-today-highlights"><div><strong>'+countToday()+'</strong><span>Para hoje</span></div><div><strong>'+countFuture()+'</strong><span>Próximas tarefas</span></div><div><strong>'+db.brands.length+'</strong><span>Marcas</span></div></div>'+homeActions());
        }
      }
    }
    if(panel==='profile')root.insertAdjacentHTML('beforeend',profileHTML());
    if(panel==='quick')root.insertAdjacentHTML('beforeend',quickHTML());
  }
  render=function(){previousRender();decorate()};
  window.vzOpenProfile=()=>{panel='profile';pendingPhoto=null;ui.modal=null;render()};
  window.vzOpenQuick=()=>{panel='quick';ui.modal=null;render()};
  window.vzClosePanel=()=>{panel=null;pendingPhoto=null;render()};
  window.vzQuickAction=type=>{
    panel=null;
    if(type==='task'){vzNewTask(today());return}
    if(type==='post'){openPost();return}
    if(type==='creative'){showModal('upload');return}
    render();
  };
  window.vzPreviewPhoto=async input=>{
    const file=input.files?.[0];if(!file)return;
    if(file.size>8*1024*1024){alert('Escolha uma foto de até 8 MB.');return}
    if(!['image/jpeg','image/png','image/webp'].includes(file.type)){alert('Use uma foto JPG, PNG ou WebP.');return}
    try{
      pendingPhoto=await toSmallImage(file,360);
      // Avoid regenerating the form and losing unsaved name or role changes.
      const target=document.querySelector('.vz-profile-photo .vz-avatar');
      if(target){target.innerHTML='<img alt="Nova foto de perfil" src="'+pendingPhoto+'">';target.classList.remove('vz-avatar-empty')}
    }catch{alert('Não foi possível processar a foto. Escolha outra imagem.')}
  };
  window.vzSaveProfile=e=>{
    e.preventDefault();
    const f=e.target.elements;
    const next={name:f.namedItem('name').value.trim(),role:f.namedItem('role').value.trim()||defaults.role,
      photo:pendingPhoto||profile.photo};
    try{
      localStorage.setItem(PROFILE_KEY,JSON.stringify(next));
      profile=next;panel=null;pendingPhoto=null;render();
    }catch{alert('Não foi possível salvar a foto neste aparelho. Tente uma imagem menor.')}
  };
  window.addEventListener?.('keydown',e=>{if(e.key==='Escape'&&panel){panel=null;pendingPhoto=null;render()}});
  render();
})();
