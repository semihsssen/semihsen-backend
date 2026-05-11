var DB={};
function T(id){return document.getElementById(id);}
function toast(m,e){var t=T('toast');t.textContent=m;t.style.background=e?'#c0392b':'#4a90e2';t.classList.add('show');setTimeout(function(){t.classList.remove('show');},3000);}

function SP(id,el){
  document.querySelectorAll('.panel').forEach(function(p){p.classList.remove('active');});
  document.querySelectorAll('.ni').forEach(function(n){n.classList.remove('active');});
  var p=T('pn-'+id); if(p) p.classList.add('active');
  if(el) el.classList.add('active');
  var titles={
    'settings':'Boyut & Renk','hero':'Hero Gorseli','resume':'Resume CV',
    'g-block-out':'Block Out','g-car-match':'Car Match','g-magic-sort':'Magic Sort',
    'g-match-villains':'Match Villians','g-wonder-blast':'Wonder Blast',
    'p-1':'Personal 1','p-2':'Personal 2','p-3':'Personal 3','p-4':'Personal 4',
    'p-5':'Personal 5','p-6':'Personal 6','p-7':'Personal 7'
  };
  T('tt').textContent=titles[id]||id;
}

async function init(){
  try{
    var r=await fetch('/api/data'); DB=await r.json();
    loadSets(); loadHero(); loadResume(); loadProjects(); loadPersonals();
  }catch(e){toast('Veri yuklenemedi: '+e.message,true);}
}

function loadSets(){
  var s=DB.settings||{};
  if(s.color_bg) T('c-bg').value=s.color_bg;
  if(s.color_bg2) T('c-bg2').value=s.color_bg2;
  if(s.color_text) T('c-text').value=s.color_text;
  if(s.color_muted) T('c-muted').value=s.color_muted;
  if(s.color_accent) T('c-accent').value=s.color_accent;
  if(s.nav_logo_x){T('s-lx').value=s.nav_logo_x;T('v-lx').textContent=s.nav_logo_x;}
  if(s.nav_logo_y){T('s-ly').value=s.nav_logo_y;T('v-ly').textContent=s.nav_logo_y;}
  if(s.nav_sub_x){T('s-sx').value=s.nav_sub_x;T('v-sx').textContent=s.nav_sub_x;}
  if(s.nav_sub_y){T('s-sy').value=s.nav_sub_y;T('v-sy').textContent=s.nav_sub_y;}
}

function loadHero(){
  var h=DB.hero;
  if(h&&h.url){var i=T('hero-img'),p=T('hero-prev');if(i)i.src=h.url;if(p)p.style.display='block';}
}

function loadResume(){
  var r=DB.resume;
  if(r&&r.url){var i=T('resume-img'),p=T('resume-prev');if(i)i.src=r.url;if(p)p.style.display='block';}
}

function loadProjects(){
  var keys=['block-out','car-match','magic-sort','match-villains','wonder-blast'];
  var ids=['g-block-out','g-car-match','g-magic-sort','g-match-villains','g-wonder-blast'];
  for(var ii=0;ii<keys.length;ii++){
    var k=keys[ii],id=ids[ii],p=DB.projects&&DB.projects[k];
    if(!p) continue;
    var sv=function(fid,v){var el=T(fid);if(el&&v!=null)el.value=v;};
    sv(id+'-name',p.name);sv(id+'-studio',p.studio);sv(id+'-year',p.year);
    sv(id+'-ad',p.credits&&p.credits.art_direction);
    sv(id+'-ca',p.credits&&p.credits.concept_art);
    sv(id+'-3d',p.credits&&p.credits.art_3d);
    sv(id+'-ios',p.ios);sv(id+'-android',p.android);sv(id+'-about',p.about);
    if(p.cover&&p.cover.url){var ci=T(id+'-cimg'),cp=T(id+'-cprev');if(ci)ci.src=p.cover.url;if(cp)cp.style.display='block';}
    renderG(id+'-gallery',p.works||[],k);
  }
}

function loadPersonals(){
  for(var n=1;n<=7;n++){
    var p=DB.personal&&(DB.personal[n]||DB.personal[String(n)]);
    if(!p) continue;
    var ne=T('p'+n+'-name');if(ne)ne.value=p.name||'';
    var ae=T('p'+n+'-about');if(ae)ae.value=p.about||'';
    renderPG(n,p.slides||[]);
  }
}

function renderG(gid,works,key){
  var g=T(gid);if(!g)return;
  if(!works||!works.length){
    g.innerHTML='<div style="grid-column:1/-1;text-align:center;padding:30px;color:#888680;font-size:12px"><i class="ti ti-photo" style="font-size:24px;display:block;margin-bottom:8px"></i>Henuz gorsel yok</div>';
    return;
  }
  g.innerHTML=works.map(function(w,i){
    var url=(w.thumbnail&&w.thumbnail.url)||w.url||'';
    return '<div class="gallery-item"><img src="'+url+'" onerror="this.style.display='none'"><div class="g-overlay"><button class="del-btn" onclick="delWork(''+key+'','+i+',''+gid+'')"><i class="ti ti-trash"></i></button></div></div>';
  }).join('');
}

function renderPG(n,slides){
  var g=T('p'+n+'-gallery');if(!g)return;
  if(!slides||!slides.length){
    g.innerHTML='<div style="grid-column:1/-1;text-align:center;padding:30px;color:#888680;font-size:12px"><i class="ti ti-photo" style="font-size:24px;display:block;margin-bottom:8px"></i>Henuz gorsel yok</div>';
    return;
  }
  g.innerHTML=slides.map(function(s,i){
    return '<div class="gallery-item"><img src="'+s.url+'" onerror="this.style.display='none'"><div class="g-overlay"><button class="del-btn" onclick="delPSlide('+n+','+i+')"><i class="ti ti-trash"></i></button></div></div>';
  }).join('');
}

async function uploadHero(inp){
  if(!inp.files[0])return;
  var fd=new FormData();fd.append('image',inp.files[0]);
  toast('Yukleniyor...');
  try{
    var r=await fetch('/api/upload/hero',{method:'POST',body:fd});
    var d=await r.json();
    if(d.url){var i=T('hero-img'),p=T('hero-prev');if(i)i.src=d.url;if(p)p.style.display='block';toast('Hero guncellendi!');}
    else toast('Hata: '+(d.error||'bilinmiyor'),true);
  }catch(e){toast('Hata: '+e.message,true);}
}

async function uploadResume(inp){
  if(!inp.files[0])return;
  var fd=new FormData();fd.append('image',inp.files[0]);
  toast('Yukleniyor...');
  try{
    var r=await fetch('/api/upload/resume',{method:'POST',body:fd});
    var d=await r.json();
    if(d.url){var i=T('resume-img'),p=T('resume-prev');if(i)i.src=d.url;if(p)p.style.display='block';toast('CV guncellendi!');}
    else toast('Hata: '+(d.error||'bilinmiyor'),true);
  }catch(e){toast('Hata: '+e.message,true);}
}

async function uploadCover(key,id,inp){
  if(!inp.files[0])return;
  var fd=new FormData();fd.append('image',inp.files[0]);
  toast('Kapak yukleniyor...');
  try{
    var r=await fetch('/api/upload/project/'+key+'/cover',{method:'POST',body:fd});
    var d=await r.json();
    if(d.url){var i=T(id+'-cimg'),p=T(id+'-cprev');if(i)i.src=d.url;if(p)p.style.display='block';toast('Kapak guncellendi!');}
    else toast('Hata: '+(d.error||'bilinmiyor'),true);
  }catch(e){toast('Hata: '+e.message,true);}
}

async function uploadWorks(key,id,inp){
  if(!inp.files.length)return;
  var files=Array.from(inp.files);
  toast(files.length+' gorsel yukleniyor...');
  var ok=0;
  for(var i=0;i<files.length;i++){
    var fd=new FormData();fd.append('image',files[i]);
    try{var r=await fetch('/api/upload/project/'+key+'/work',{method:'POST',body:fd});var d=await r.json();if(d.ok)ok++;}catch(e){}
  }
  var rr=await fetch('/api/data');DB=await rr.json();
  var proj=DB.projects&&DB.projects[key];
  renderG(id+'-gallery',proj?proj.works||[]:[],key);
  toast(ok+'/'+files.length+' gorsel yuklendi!',ok<files.length);
}

async function delWork(key,wi,gid){
  if(!confirm('Silmek istediginize emin misiniz?'))return;
  toast('Siliniyor...');
  try{
    var r=await fetch('/api/project/'+key+'/work/'+wi,{method:'DELETE'});
    var d=await r.json();
    if(d.ok){var rr=await fetch('/api/data');DB=await rr.json();var proj=DB.projects&&DB.projects[key];renderG(gid,proj?proj.works||[]:[],key);toast('Silindi!');}
    else toast('Hata',true);
  }catch(e){toast('Hata: '+e.message,true);}
}

async function saveProj(key,id){
  var g=function(s){var e=T(id+'-'+s);return e?e.value:'';};
  var body={name:g('name'),studio:g('studio'),year:g('year'),ios:g('ios'),android:g('android'),about:g('about'),credits:{art_direction:g('ad'),concept_art:g('ca'),art_3d:g('3d')}};
  toast('Kaydediliyor...');
  try{
    var r=await fetch('/api/project/'+key,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
    var d=await r.json();
    if(d.ok)toast('Kaydedildi!');else toast('Hata: '+(d.error||''),true);
  }catch(e){toast('Hata: '+e.message,true);}
}

async function uploadPSlides(n,inp){
  if(!inp.files.length)return;
  var files=Array.from(inp.files);
  toast(files.length+' gorsel yukleniyor...');
  var ok=0;
  for(var i=0;i<files.length;i++){
    var fd=new FormData();fd.append('image',files[i]);
    try{var r=await fetch('/api/upload/personal/'+n+'/slide',{method:'POST',body:fd});var d=await r.json();if(d.ok)ok++;}catch(e){}
  }
  var rr=await fetch('/api/data');DB=await rr.json();
  var p=DB.personal&&(DB.personal[n]||DB.personal[String(n)])||{};
  renderPG(n,p.slides||[]);
  toast(ok+'/'+files.length+' gorsel yuklendi!',ok<files.length);
}

async function delPSlide(n,idx){
  if(!confirm('Silmek istediginize emin misiniz?'))return;
  toast('Siliniyor...');
  try{
    var r=await fetch('/api/personal/'+n+'/slide/'+idx,{method:'DELETE'});
    var d=await r.json();
    if(d.ok){var rr=await fetch('/api/data');DB=await rr.json();var p=DB.personal&&(DB.personal[n]||DB.personal[String(n)])||{};renderPG(n,p.slides||[]);toast('Silindi!');}
    else toast('Hata',true);
  }catch(e){toast('Hata: '+e.message,true);}
}

async function savePersonal(n){
  var ne=T('p'+n+'-name'),ae=T('p'+n+'-about');
  var body={name:ne?ne.value:'',about:ae?ae.value:''};
  toast('Kaydediliyor...');
  try{
    var r=await fetch('/api/personal/'+n,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
    var d=await r.json();
    if(d.ok)toast('Kaydedildi!');else toast('Hata',true);
  }catch(e){toast('Hata: '+e.message,true);}
}

async function saveColors(){
  var body={color_bg:T('c-bg').value,color_bg2:T('c-bg2').value,color_text:T('c-text').value,color_muted:T('c-muted').value,color_accent:T('c-accent').value};
  toast('Kaydediliyor...');
  try{
    var r=await fetch('/api/settings',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
    var d=await r.json();
    if(d.ok)toast('Renkler kaydedildi!');else toast('Hata',true);
  }catch(e){toast('Hata: '+e.message,true);}
}

async function saveFont(){
  var body={nav_logo_x:T('s-lx').value,nav_logo_y:T('s-ly').value,nav_sub_x:T('s-sx').value,nav_sub_y:T('s-sy').value};
  toast('Kaydediliyor...');
  try{
    var r=await fetch('/api/settings',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
    var d=await r.json();
    if(d.ok)toast('Ayarlar kaydedildi!');else toast('Hata',true);
  }catch(e){toast('Hata: '+e.message,true);}
}

document.addEventListener('DOMContentLoaded',init);
