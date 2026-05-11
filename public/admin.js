var DB={};
function T(id){return document.getElementById(id);}
function toast(m,e){var t=T("toast");if(!t)return;t.textContent=m;t.style.background=e?"#c0392b":"#4a90e2";t.classList.add("show");setTimeout(function(){t.classList.remove("show");},3000);}

function SP(id,el){
    document.querySelectorAll(".panel").forEach(function(p){p.classList.remove("active");});
    document.querySelectorAll(".ni").forEach(function(n){n.classList.remove("active");});
    var p=T("pn-"+id);if(p)p.classList.add("active");
    if(el)el.classList.add("active");
    var m={"settings":"Boyut & Renk","hero":"Hero Gorseli","resume":"Resume CV","g-block-out":"Block Out","g-car-match":"Car Match","g-magic-sort":"Magic Sort","g-match-villains":"Match Villians","g-wonder-blast":"Wonder Blast","p-1":"Personal 1","p-2":"Personal 2","p-3":"Personal 3","p-4":"Personal 4","p-5":"Personal 5","p-6":"Personal 6","p-7":"Personal 7"};
    T("tt").textContent=m[id]||id;
}

async function init(){
    try{var r=await fetch("/api/data");DB=await r.json();loadSets();loadHero();loadResume();loadProjects();loadPersonals();}
    catch(e){toast("Veri yuklenemedi",true);}
}

function loadSets(){
    var s=DB.settings||{};
    var sc={"c-bg":"color_bg","c-bg2":"color_bg2","c-text":"color_text","c-muted":"color_muted","c-accent":"color_accent"};
    for(var k in sc){if(s[sc[k]]){var el=T(k);if(el)el.value=s[sc[k]];}}
    var sl={"s-lx":["nav_logo_x","v-lx"],"s-ly":["nav_logo_y","v-ly"],"s-sx":["nav_sub_x","v-sx"],"s-sy":["nav_sub_y","v-sy"]};
    for(var sid in sl){var d=sl[sid];if(s[d[0]]){var se=T(sid);if(se)se.value=s[d[0]];var ve=T(d[1]);if(ve)ve.textContent=s[d[0]];}}
}

function loadHero(){var h=DB.hero;if(h&&h.url){var i=T("hero-img"),p=T("hero-prev");if(i)i.src=h.url;if(p)p.style.display="block";}}
function loadResume(){var r=DB.resume;if(r&&r.url){var i=T("resume-img"),p=T("resume-prev");if(i)i.src=r.url;if(p)p.style.display="block";}}

function loadProjects(){
    var keys=["block-out","car-match","magic-sort","match-villains","wonder-blast"];
    var ids=["g-block-out","g-car-match","g-magic-sort","g-match-villains","g-wonder-blast"];
    for(var ii=0;ii<keys.length;ii++){
          var k=keys[ii];var id=ids[ii];var p=DB.projects&&DB.projects[k];
          if(!p)continue;
          var fn=T("fn-"+id);if(fn)fn.value=p.name||"";
          var fs=T("fs-"+id);if(fs)fs.value=p.studio||"";
          var fy=T("fy-"+id);if(fy)fy.value=p.year||"";
          var fi=T("fi-"+id);if(fi)fi.value=p.ios||"";
          var fa=T("fa-"+id);if(fa)fa.value=p.android||"";
          var fb=T("fb-"+id);if(fb)fb.value=p.about||"";
          var fc=T("fc-"+id);if(fc)fc.value=(p.credits&&p.credits.art_direction)||"";
          var fcc=T("fcc-"+id);if(fcc)fcc.value=(p.credits&&p.credits.concept_art)||"";
          var f3=T("f3-"+id);if(f3)f3.value=(p.credits&&p.credits.art_3d)||"";
          if(p.cover&&p.cover.url){var ci=T("cov-img-"+id),cp=T("cov-prev-"+id);if(ci)ci.src=p.cover.url;if(cp)cp.style.display="block";}
          renderWorks(k,id,p.works||[]);
    }
}

function loadPersonals(){
    for(var n=1;n<=7;n++){
          var p=DB.personal&&DB.personal[String(n)];
          if(!p)continue;
          var fn=T("pn-name-"+n);if(fn)fn.value=p.name||"";
          var fa=T("pn-about-"+n);if(fa)fa.value=p.about||"";
          renderPersonalSlides(n,p.slides||[]);
    }
}

function renderWorks(key,id,works){
    var container=T("works-"+id);
    if(!container)return;
    container.innerHTML="";
    if(!works||works.length===0){
          var em=document.createElement("p");
          em.style.cssText="color:#888;font-size:12px;margin:8px 0;";
          em.textContent="Henuz is gorseli yok";
          container.appendChild(em);
          return;
    }
    works.forEach(function(w,wi){
          var card=document.createElement("div");
          card.style.cssText="background:#111;border:1px solid #333;border-radius:6px;padding:10px;margin-bottom:14px;";

                      var thumbRow=document.createElement("div");
          thumbRow.style.cssText="display:flex;align-items:flex-start;gap:10px;margin-bottom:10px;";

                      var img=document.createElement("img");
          img.style.cssText="width:80px;height:80px;object-fit:cover;border-radius:4px;border:1px solid #444;flex-shrink:0;";
          img.src=w.url||"";
          img.onerror=function(){this.style.display="none";};

                      var infoCol=document.createElement("div");
          infoCol.style.cssText="flex:1;";

                      var label=document.createElement("div");
          label.style.cssText="font-size:11px;color:#aaa;margin-bottom:6px;";
          label.textContent="Is Gorseli #"+(wi+1);

                      var delBtn=document.createElement("button");
          delBtn.textContent="Sil";
          delBtn.style.cssText="background:#c0392b;color:#fff;border:none;padding:4px 10px;border-radius:4px;font-size:11px;cursor:pointer;";
          delBtn.onclick=(function(wii){return function(){deleteWork(key,id,wii);};})(wi);

                      infoCol.appendChild(label);
          infoCol.appendChild(delBtn);
          thumbRow.appendChild(img);
          thumbRow.appendChild(infoCol);
          card.appendChild(thumbRow);

                      var slideSection=document.createElement("div");
          slideSection.style.cssText="border-top:1px solid #333;padding-top:8px;";

                      var slideTitle=document.createElement("div");
          slideTitle.style.cssText="font-size:11px;color:#aaa;margin-bottom:8px;font-weight:bold;letter-spacing:0.5px;";
          slideTitle.textContent="SLIDE GORSELLERI (#"+(wi+1)+")";
          slideSection.appendChild(slideTitle);

                      var slideGrid=document.createElement("div");
          slideGrid.id="slides-"+id+"-"+wi;
          slideGrid.style.cssText="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:8px;";
          var slides=w.slides||[];
          if(slides.length===0){
                  var noSlide=document.createElement("p");
                  noSlide.style.cssText="color:#666;font-size:11px;margin:0;";
                  noSlide.textContent="Slide gorseli yok";
                  slideGrid.appendChild(noSlide);
          } else {
                  slides.forEach(function(sl,si){
                            var sw=document.createElement("div");
                            sw.style.cssText="position:relative;width:70px;height:70px;";
                            var si2=document.createElement("img");
                            si2.src=sl.url||"";
                            si2.style.cssText="width:70px;height:70px;object-fit:cover;border-radius:4px;border:1px solid #444;";
                            si2.onerror=function(){this.style.display="none";};
                            var sd=document.createElement("button");
                            sd.textContent="x";
                            sd.style.cssText="position:absolute;top:2px;right:2px;background:rgba(192,57,43,0.9);color:#fff;border:none;border-radius:50%;width:18px;height:18px;font-size:10px;cursor:pointer;line-height:18px;padding:0;";
                            sd.onclick=(function(wii,sii){return function(){deleteSlide(key,id,wii,sii);};})(wi,si);
                            sw.appendChild(si2);
                            sw.appendChild(sd);
                            slideGrid.appendChild(sw);
                  });
          }
          slideSection.appendChild(slideGrid);

                      var addSlideInput=document.createElement("input");
          addSlideInput.type="file";
          addSlideInput.accept="image/*";
          addSlideInput.multiple=true;
          addSlideInput.style.display="none";
          addSlideInput.id="slide-inp-"+id+"-"+wi;
          addSlideInput.onchange=(function(wii,inp){return function(){uploadSlides(key,id,wii,inp);};})(wi,addSlideInput);

                      var addSlideBtn=document.createElement("button");
          addSlideBtn.textContent="+ Slide Ekle";
          addSlideBtn.style.cssText="background:#2a5298;color:#fff;border:none;padding:5px 12px;border-radius:4px;font-size:11px;cursor:pointer;";
          addSlideBtn.onclick=function(){addSlideInput.click();};

                      slideSection.appendChild(addSlideInput);
          slideSection.appendChild(addSlideBtn);
          card.appendChild(slideSection);
          container.appendChild(card);
    });
}

async function deleteWork(key,id,wi){
    if(!confirm("Bu is gorselini silmek istediginizden emin misiniz?"))return;
    try{
          var r=await fetch("/api/project/"+key+"/work/"+wi,{method:"DELETE",headers:{"Authorization":"Basic "+btoa("semih:"+getPwd())}});
          var d=await r.json();
          if(d.ok){toast("Is gorseli silindi");var pr=DB.projects[key];if(pr&&pr.works)pr.works.splice(wi,1);renderWorks(key,id,pr.works||[]);}
          else{toast(d.error||"Hata",true);}
    }catch(e){toast("Silme hatasi",true);}
}

async function uploadSlides(key,id,wi,inp){
    var files=inp.files;
    if(!files||files.length===0)return;
    var pwd=getPwd();
    var success=0;
    for(var i=0;i<files.length;i++){
          var fd=new FormData();fd.append("image",files[i]);
          try{
                  var r=await fetch("/api/upload/project/"+key+"/work/"+wi+"/slide",{method:"POST",headers:{"Authorization":"Basic "+btoa("semih:"+pwd)},body:fd});
                  var d=await r.json();
                  if(d.ok){
                            var pr=DB.projects[key];
                            if(pr&&pr.works&&pr.works[wi]){
                                        if(!pr.works[wi].slides)pr.works[wi].slides=[];
                                        pr.works[wi].slides.push({url:d.url,public_id:""});
                            }
                            success++;
                  }else{toast(d.error||"Yukleme hatasi",true);}
          }catch(e){toast("Yukleme hatasi",true);}
    }
    inp.value="";
    if(success>0){
          toast(success+" slide yuklendi");
          var pr=DB.projects[key];
          renderWorks(key,id,pr.works||[]);
    }
}

async function deleteSlide(key,id,wi,si){
    if(!confirm("Bu slide gorselini silmek istediginizden emin misiniz?"))return;
    try{
          var r=await fetch("/api/project/"+key+"/work/"+wi+"/slide/"+si,{method:"DELETE",headers:{"Authorization":"Basic "+btoa("semih:"+getPwd())}});
          var d=await r.json();
          if(d.ok){
                  toast("Slide silindi");
                  var pr=DB.projects[key];
                  if(pr&&pr.works&&pr.works[wi]&&pr.works[wi].slides)pr.works[wi].slides.splice(si,1);
                  renderWorks(key,id,pr.works||[]);
          }else{toast(d.error||"Hata",true);}
    }catch(e){toast("Silme hatasi",true);}
}

function renderPersonalSlides(num,slides){
    var container=T("pslides-"+num);
    if(!container)return;
    container.innerHTML="";
    if(!slides||slides.length===0){
          var em=document.createElement("p");
          em.style.cssText="color:#888;font-size:12px;margin:8px 0;";
          em.textContent="Henuz gorsel yok";
          container.appendChild(em);
          return;
    }
    slides.forEach(function(sl,si){
          var wrap=document.createElement("div");
          wrap.style.cssText="position:relative;display:inline-block;margin:4px;";
          var img=document.createElement("img");
          img.src=sl.url||"";
          img.style.cssText="width:80px;height:80px;object-fit:cover;border-radius:4px;border:1px solid #444;display:block;";
          img.onerror=function(){this.style.display="none";};
          var del=document.createElement("button");
          del.textContent="x";
          del.style.cssText="position:absolute;top:2px;right:2px;background:rgba(192,57,43,0.9);color:#fff;border:none;border-radius:50%;width:18px;height:18px;font-size:10px;cursor:pointer;line-height:18px;padding:0;";
          del.onclick=(function(sii){return function(){deletePersonalSlide(num,sii);};})(si);
          wrap.appendChild(img);wrap.appendChild(del);container.appendChild(wrap);
    });
}

function getPwd(){return"semih2024";}

async function saveProject(key,id){
    var data={
          name:(T("fn-"+id)||{}).value||"",
          studio:(T("fs-"+id)||{}).value||"",
          year:(T("fy-"+id)||{}).value||"",
          ios:(T("fi-"+id)||{}).value||"",
          android:(T("fa-"+id)||{}).value||"",
          about:(T("fb-"+id)||{}).value||"",
          art_direction:(T("fc-"+id)||{}).value||"",
          concept_art:(T("fcc-"+id)||{}).value||"",
          art_3d:(T("f3-"+id)||{}).value||""
    };
    try{
          var r=await fetch("/api/project/"+key,{method:"POST",headers:{"Content-Type":"application/json","Authorization":"Basic "+btoa("semih:"+getPwd())},body:JSON.stringify(data)});
          var d=await r.json();
          if(d.ok){toast("Kaydedildi");if(DB.projects[key])Object.assign(DB.projects[key],{name:data.name,studio:data.studio,year:data.year,ios:data.ios,android:data.android,about:data.about,credits:{art_direction:data.art_direction,concept_art:data.concept_art,art_3d:data.art_3d}});}
          else{toast(d.error||"Hata",true);}
    }catch(e){toast("Kaydetme hatasi",true);}
}

async function savePersonal(num){
    var data={name:(T("pn-name-"+num)||{}).value||"",about:(T("pn-about-"+num)||{}).value||""};
    try{
          var r=await fetch("/api/personal/"+num,{method:"POST",headers:{"Content-Type":"application/json","Authorization":"Basic "+btoa("semih:"+getPwd())},body:JSON.stringify(data)});
          var d=await r.json();
          if(d.ok){toast("Kaydedildi");}else{toast(d.error||"Hata",true);}
    }catch(e){toast("Kaydetme hatasi",true);}
}

async function uploadHero(){
    var inp=T("hero-file");if(!inp||!inp.files[0])return;
    var fd=new FormData();fd.append("image",inp.files[0]);
    try{
          var r=await fetch("/api/upload/hero",{method:"POST",headers:{"Authorization":"Basic "+btoa("semih:"+getPwd())},body:fd});
          var d=await r.json();
          if(d.ok){toast("Hero yuklendi");DB.hero={url:d.url};var i=T("hero-img"),p=T("hero-prev");if(i)i.src=d.url;if(p)p.style.display="block";}
          else{toast(d.error||"Hata",true);}
    }catch(e){toast("Yukleme hatasi",true);}
}

async function uploadResume(){
    var inp=T("resume-file");if(!inp||!inp.files[0])return;
    var fd=new FormData();fd.append("image",inp.files[0]);
    try{
          var r=await fetch("/api/upload/resume",{method:"POST",headers:{"Authorization":"Basic "+btoa("semih:"+getPwd())},body:fd});
          var d=await r.json();
          if(d.ok){toast("Resume yuklendi");DB.resume={url:d.url};var i=T("resume-img"),p=T("resume-prev");if(i)i.src=d.url;if(p)p.style.display="block";}
          else{toast(d.error||"Hata",true);}
    }catch(e){toast("Yukleme hatasi",true);}
}

async function uploadCover(key,id){
    var inp=T("cov-file-"+id);if(!inp||!inp.files[0])return;
    var fd=new FormData();fd.append("image",inp.files[0]);
    try{
          var r=await fetch("/api/upload/project/"+key+"/cover",{method:"POST",headers:{"Authorization":"Basic "+btoa("semih:"+getPwd())},body:fd});
          var d=await r.json();
          if(d.ok){toast("Kapak yuklendi");if(DB.projects[key])DB.projects[key].cover={url:d.url};var i=T("cov-img-"+id),p=T("cov-prev-"+id);if(i)i.src=d.url;if(p)p.style.display="block";}
          else{toast(d.error||"Hata",true);}
    }catch(e){toast("Yukleme hatasi",true);}
}

async function uploadWork(key,id){
    var inp=T("work-file-"+id);if(!inp||!inp.files||inp.files.length===0)return;
    var pwd=getPwd();var success=0;
    for(var i=0;i<inp.files.length;i++){
          var fd=new FormData();fd.append("image",inp.files[i]);
          try{
                  var r=await fetch("/api/upload/project/"+key+"/work",{method:"POST",headers:{"Authorization":"Basic "+btoa("semih:"+pwd)},body:fd});
                  var d=await r.json();
                  if(d.ok){if(!DB.projects[key].works)DB.projects[key].works=[];DB.projects[key].works.push({url:d.url,public_id:"",slides:[]});success++;}
                  else{toast(d.error||"Hata",true);}
          }catch(e){toast("Yukleme hatasi",true);}
    }
    inp.value="";
    if(success>0){toast(success+" is gorseli yuklendi");renderWorks(key,id,DB.projects[key].works||[]);}
}

async function uploadPersonalSlide(num){
    var inp=T("pslide-file-"+num);if(!inp||!inp.files||inp.files.length===0)return;
    var pwd=getPwd();var success=0;
    for(var i=0;i<inp.files.length;i++){
          var fd=new FormData();fd.append("image",inp.files[i]);
          try{
                  var r=await fetch("/api/upload/personal/"+num+"/slide",{method:"POST",headers:{"Authorization":"Basic "+btoa("semih:"+pwd)},body:fd});
                  var d=await r.json();
                  if(d.ok){if(!DB.personal[num].slides)DB.personal[num].slides=[];DB.personal[num].slides.push({url:d.url});success++;}
                  else{toast(d.error||"Hata",true);}
          }catch(e){toast("Yukleme hatasi",true);}
    }
    inp.value="";
    if(success>0){toast(success+" gorsel yuklendi");renderPersonalSlides(num,DB.personal[num].slides||[]);}
}

async function deletePersonalSlide(num,idx){
    if(!confirm("Bu gorseli silmek istediginizden emin misiniz?"))return;
    try{
          var r=await fetch("/api/personal/"+num+"/slide/"+idx,{method:"DELETE",headers:{"Authorization":"Basic "+btoa("semih:"+getPwd())}});
          var d=await r.json();
          if(d.ok){toast("Gorsel silindi");if(DB.personal[num]&&DB.personal[num].slides)DB.personal[num].slides.splice(idx,1);renderPersonalSlides(num,DB.personal[num].slides||[]);}
          else{toast(d.error||"Hata",true);}
    }catch(e){toast("Silme hatasi",true);}
}

async function saveSettings(){
    var sc={"c-bg":"color_bg","c-bg2":"color_bg2","c-text":"color_text","c-muted":"color_muted","c-accent":"color_accent"};
    var data={};
    for(var k in sc){var el=T(k);if(el)data[sc[k]]=el.value;}
    var sl={"s-lx":"nav_logo_x","s-ly":"nav_logo_y","s-sx":"nav_sub_x","s-sy":"nav_sub_y"};
    for(var sid in sl){var se=T(sid);if(se)data[sl[sid]]=se.value;}
    try{
          var r=await fetch("/api/settings",{method:"POST",headers:{"Content-Type":"application/json","Authorization":"Basic "+btoa("semih:"+getPwd())},body:JSON.stringify(data)});
          var d=await r.json();
          if(d.ok){toast("Ayarlar kaydedildi");}else{toast(d.error||"Hata",true);}
    }catch(e){toast("Kaydetme hatasi",true);}
}

window.addEventListener("DOMContentLoaded",init);
