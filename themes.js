/* Vinnyzau: persistent, contrast-aware app appearance. */
(function vinnyzauThemes(){
  'use strict';
  const KEY='vinnyzau-theme-v1';
  const allowed=['claro','noturno','verde','azul','roxo'];
  const browserColors={claro:'#ffffff',noturno:'#101823',verde:'#146247',azul:'#195bb4',roxo:'#7135ec'};
  let current='roxo';
  try{
    const saved=localStorage.getItem(KEY);
    if(allowed.includes(saved))current=saved;
  }catch(err){console.warn('Tema local indisponível',err)}
  function apply(theme,persist){
    if(!allowed.includes(theme))return false;
    if(persist){
      try{localStorage.setItem(KEY,theme)}
      catch(err){alert('Não foi possível salvar a preferência neste navegador. O tema será usado até você fechar o aplicativo.')}
    }
    current=theme;
    window.vzActiveTheme=theme;
    document.documentElement.dataset.vzTheme=theme;
    const color=document.querySelector('meta[name="theme-color"]');
    if(color)color.setAttribute('content',browserColors[theme]);
    const status=document.getElementById('vzThemeStatus');
    if(status)status.textContent='Tema '+({claro:'claro',noturno:'noturno',verde:'verde',azul:'azul',roxo:'roxo'}[theme])+' selecionado.';
    return true;
  }
  window.vzChooseTheme=theme=>apply(theme,true);
  window.vzGetTheme=()=>current;
  apply(current,false);
})();
