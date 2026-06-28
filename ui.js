
(function(){
const gsap=window.gsap; gsap.registerPlugin(window.ScrollTrigger);
const reduced=matchMedia('(prefers-reduced-motion:reduce)').matches;

/* ---- Lenis smooth scroll ---- */
let lenis=null;
if(!reduced && window.Lenis){
  lenis=new Lenis({duration:1.1,easing:t=>Math.min(1,1.001-Math.pow(2,-10*t)),smoothWheel:true});
  lenis.on('scroll',window.ScrollTrigger.update);
  gsap.ticker.add(t=>lenis.raf(t*1000)); gsap.ticker.lagSmoothing(0);
}
function scrollTo(sel){const el=document.querySelector(sel);if(!el)return;
  if(lenis)lenis.scrollTo(el,{offset:-10});else el.scrollIntoView({behavior:'smooth'});}
document.querySelectorAll('[data-scroll]').forEach(b=>b.addEventListener('click',()=>scrollTo(b.dataset.scroll)));
document.querySelectorAll('nav a[href^="#"],footer a[href^="#"]').forEach(a=>a.addEventListener('click',e=>{
  e.preventDefault();scrollTo(a.getAttribute('href'));}));

/* ---- custom cursor + magnetic ---- */
const cur=document.getElementById('cursor'),dot=document.getElementById('cursor-dot');
let cx=0,cy=0,tx2=0,ty2=0;
addEventListener('pointermove',e=>{tx2=e.clientX;ty2=e.clientY;dot.style.left=tx2+'px';dot.style.top=ty2+'px';});
(function cloop(){cx+=(tx2-cx)*.18;cy+=(ty2-cy)*.18;cur.style.left=cx+'px';cur.style.top=cy+'px';requestAnimationFrame(cloop);})();
document.querySelectorAll('a,button,.tile,.sw,.preset,.fab').forEach(el=>{
  el.addEventListener('mouseenter',()=>cur.classList.add('grow'));
  el.addEventListener('mouseleave',()=>cur.classList.remove('grow'));
});
document.querySelectorAll('.magnetic').forEach(el=>{
  el.addEventListener('mousemove',e=>{const r=el.getBoundingClientRect();const mx=e.clientX-r.left-r.width/2,my=e.clientY-r.top-r.height/2;
    gsap.to(el,{x:mx*.3,y:my*.4,duration:.4,ease:'power3.out'});});
  el.addEventListener('mouseleave',()=>gsap.to(el,{x:0,y:0,duration:.5,ease:'elastic.out(1,.4)'}));
});

/* ---- navbar solidify + active link + back-to-top ---- */
const nav=document.getElementById('nav'),toTop=document.getElementById('toTop');
window.ScrollTrigger.create({start:'top -80',onUpdate:s=>{
  nav.classList.toggle('solid',s.scroll()>80); toTop.classList.toggle('show',s.scroll()>600);}});
const navLinks=[...document.querySelectorAll('nav ul a')];
navLinks.forEach(a=>{const id=a.getAttribute('href');
  window.ScrollTrigger.create({trigger:id,start:'top 50%',end:'bottom 50%',
    onToggle:s=>{if(s.isActive)navLinks.forEach(x=>x.classList.toggle('active',x===a));}});});
toTop.onclick=()=>scrollTo('#top');
document.getElementById('menuBtn').onclick=()=>scrollTo('#contact');

/* ---- reveal on scroll ---- */
document.querySelectorAll('.reveal').forEach(el=>{
  gsap.to(el,{opacity:1,y:0,duration:.9,ease:'power3.out',
    scrollTrigger:{trigger:el,start:'top 86%'}});
});

/* ---- SERVICES ---- */
const services=[
  ['◰','Luxury Kitchens','Modular kitchens engineered like furniture.'],
  ['▤','Wardrobes','Floor-to-ceiling, fingerprint-free storage.'],
  ['☾','Bedroom Interiors','Calm, considered, beautifully lit.'],
  ['◐','Living Room','Statement spaces for everyday life.'],
  ['◇','Dining','Where the family gathers, elevated.'],
  ['▭','TV Units','Sculptural media walls, cable-free.'],
  ['▦','Office Interiors','Focus, finished with intent.'],
  ['◠','False Ceiling','Layered light and clean lines.'],
  ['✦','Lighting Design','Mood, task and accent in balance.'],
  ['❖','Custom Furniture','One-off pieces, made to order.']
];
const sg=document.getElementById('svcGrid');
services.forEach((s,i)=>{const d=document.createElement('div');d.className='svc';
  d.innerHTML=`<div class="ic">${s[0]}</div><div><h3 class="serif">${s[1]}</h3><p>${s[2]}</p></div>`;
  sg.appendChild(d);
  gsap.from(d,{opacity:0,y:50,duration:.7,ease:'power3.out',scrollTrigger:{trigger:d,start:'top 90%'},delay:(i%4)*0.06});
});

/* ---- PORTFOLIO ---- */
const imgIds=['1556909114-f6e7ad7d3136','1600585154340-be6161a56a0c','1600210492486-724fe5c67fb0','1600607687939-ce8a6c25118c','1600566753086-00f18fb6b3ea','1556912173-3bb406ef7e77','1565538810643-b5bdb714032a','1616486338812-3dadae4b4ace','1583847268964-b28dc8f51f92','1631679706909-1844bbd07221','1617104551722-3b2d51366400','1618221195710-dd6b41faaea6'];
const cats=['Kitchen','Living Room','Bedroom','Kitchen','Apartment','Villa','Office','Living Room','Bedroom','Kitchen','Villa','Apartment'];
const names=['Marble & Walnut Kitchen','Penthouse Living','Master Suite','Island Kitchen','Skyline Apartment','Hillside Villa','Studio Office','Garden Lounge','Quiet Bedroom','Dark Edition Kitchen','Coastal Villa','City Apartment'];
const mEl=document.getElementById('masonry');
imgIds.forEach((id,i)=>{
  const t=document.createElement('div');t.className='tile';t.dataset.cat=cats[i];
  const url=`https://images.unsplash.com/photo-${id}?w=700&q=80`;
  t.innerHTML=`<img loading="lazy" src="${url}" alt="${names[i]}" data-full="https://images.unsplash.com/photo-${id}?w=1600&q=85"/><div class="cap"><b>${names[i]}</b><span>${cats[i]}</span></div>`;
  mEl.appendChild(t);
  const img=t.querySelector('img');
  img.onerror=()=>{img.style.aspectRatio='4/3';img.removeAttribute('src');};
});
// hover tilt
mEl.addEventListener('mousemove',e=>{const t=e.target.closest('.tile');if(!t)return;
  const r=t.getBoundingClientRect();const px=(e.clientX-r.left)/r.width-.5,py=(e.clientY-r.top)/r.height-.5;
  gsap.to(t,{rotateY:px*8,rotateX:-py*8,duration:.4,ease:'power2.out',transformPerspective:800});});
mEl.addEventListener('mouseleave',e=>{const t=e.target.closest&&e.target.closest('.tile');});
mEl.querySelectorAll('.tile').forEach(t=>t.addEventListener('mouseleave',()=>gsap.to(t,{rotateX:0,rotateY:0,duration:.5})));
// filters
document.querySelectorAll('#filters button').forEach(b=>b.onclick=()=>{
  document.querySelectorAll('#filters button').forEach(x=>x.classList.remove('active'));b.classList.add('active');
  const f=b.dataset.f;
  mEl.querySelectorAll('.tile').forEach(t=>{const show=f==='all'||t.dataset.cat===f;
    gsap.to(t,{opacity:show?1:0,scale:show?1:.9,duration:.4});t.style.display=show?'':'none';});
});
// lightbox
const lb=document.getElementById('lightbox'),lbImg=document.getElementById('lbImg');let gallery=[],gi=0;
function openLB(i){gallery=[...mEl.querySelectorAll('.tile:not([style*="display: none"]) img')];gi=i;showLB();lb.classList.add('show');}
function showLB(){const im=gallery[gi];if(im)lbImg.src=im.dataset.full||im.src;}
mEl.querySelectorAll('.tile').forEach((t,i)=>t.addEventListener('click',()=>{
  const vis=[...mEl.querySelectorAll('.tile')].filter(x=>x.style.display!=='none');openLB(vis.indexOf(t));}));
document.getElementById('lbClose').onclick=()=>lb.classList.remove('show');
document.getElementById('lbNext').onclick=()=>{gi=(gi+1)%gallery.length;showLB();};
document.getElementById('lbPrev').onclick=()=>{gi=(gi-1+gallery.length)%gallery.length;showLB();};
lb.addEventListener('click',e=>{if(e.target===lb)lb.classList.remove('show');});
addEventListener('keydown',e=>{if(!lb.classList.contains('show'))return;
  if(e.key==='Escape')lb.classList.remove('show');if(e.key==='ArrowRight')document.getElementById('lbNext').click();if(e.key==='ArrowLeft')document.getElementById('lbPrev').click();});

/* ---- BEFORE / AFTER ---- */
(function(){const ba=document.getElementById('ba'),after=ba.querySelector('.after'),handle=document.getElementById('baHandle');
let drag=false;
function set(x){const r=ba.getBoundingClientRect();let p=(x-r.left)/r.width;p=Math.max(0,Math.min(1,p));
  after.style.clipPath=`inset(0 0 0 ${p*100}%)`;handle.style.left=p*100+'%';}
handle.addEventListener('pointerdown',()=>drag=true);
addEventListener('pointerup',()=>drag=false);
addEventListener('pointermove',e=>{if(drag)set(e.clientX);});
ba.addEventListener('click',e=>{if(e.target!==handle)set(e.clientX);});
})();

/* ---- PROCESS TIMELINE ---- */
const steps=[
  ['01','Consultation','We listen — to your space, your habits, your taste.'],
  ['02','Measurements','Laser-precise site survey down to the millimetre.'],
  ['03','Design','Layouts and concepts tailored to how you live.'],
  ['04','3D Visualisation','Walk your kitchen before a single panel is cut.'],
  ['05','Material Selection','Hand-picked finishes, samples to your door.'],
  ['06','Manufacturing','German hardware, furniture-grade fabrication.'],
  ['07','Installation','White-glove fitting by our own craftsmen.'],
  ['08','Quality Check','A 40-point inspection before we hand over.'],
  ['09','Delivery','Your finished space — the heart of your home.']
];
const tl=document.getElementById('timeline');
steps.forEach(s=>{const d=document.createElement('div');d.className='tl';
  d.innerHTML=`<div class="step">${s[0]} · ${s[1]}</div><h3 class="serif">${s[1]}</h3><p>${s[2]}</p>`;tl.appendChild(d);
  gsap.to(d,{opacity:1,x:0,duration:.7,ease:'power3.out',scrollTrigger:{trigger:d,start:'top 88%'}});});

/* ---- STATS counters ---- */
document.querySelectorAll('[data-count]').forEach(el=>{
  const end=parseFloat(el.dataset.count),dec=+el.dataset.dec||0;
  window.ScrollTrigger.create({trigger:el,start:'top 90%',once:true,onEnter:()=>{
    gsap.to({v:0},{v:end,duration:2,ease:'power2.out',onUpdate:function(){el.textContent=this.targets()[0].v.toFixed(dec);}});}});
});

/* ---- TESTIMONIALS ---- */
const revs=[
  ['★★★★★','The team translated a vague idea into the most beautiful kitchen we have ever seen. Flawless from concept to install.','Ananya & Rohit Mehra','Gurugram'],
  ['★★★★★','Furniture-grade quality, German hardware, and a process that actually respected our timeline. Worth every rupee.','Karan Malhotra','Mumbai'],
  ['★★★★★','The 3D visualisation sold us — and the finished home looked exactly like it. Obsessive attention to detail.','Dr. Priya Nair','Bengaluru'],
  ['★★★★★','We renovated our entire apartment with Atelier Noir. Calm, elegant, and built to last. Highly recommend.','Vikram Shah','Pune']
];
const track=document.getElementById('ttrack'),dots=document.getElementById('tdots');let ti=0;
revs.forEach((r,i)=>{const c=document.createElement('div');c.className='tcard';
  c.innerHTML=`<div class="inner"><div class="stars">${r[0]}</div><q>${r[1]}</q><div class="who"><img src="https://i.pravatar.cc/96?img=${i+12}" alt="${r[2]}"/><div><b>${r[2]}</b><span>${r[3]}</span></div></div></div>`;
  track.appendChild(c);
  const dt=document.createElement('i');if(i===0)dt.classList.add('on');dt.onclick=()=>go(i);dots.appendChild(dt);});
function go(i){ti=i;track.style.transform=`translateX(-${i*100}%)`;[...dots.children].forEach((d,x)=>d.classList.toggle('on',x===i));}
let tAuto=setInterval(()=>go((ti+1)%revs.length),5000);
track.addEventListener('mouseenter',()=>clearInterval(tAuto));
track.addEventListener('mouseleave',()=>tAuto=setInterval(()=>go((ti+1)%revs.length),5000));

/* ---- CONTACT FORM validation ---- */
const f=document.getElementById('cform');
const rules={
  name:v=>v.trim().length>1,
  phone:v=>/^[+\d][\d\s-]{6,}$/.test(v.trim()),
  email:v=>/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v.trim()),
  location:v=>v.trim().length>1,
  ptype:v=>v!=='', budget:v=>v!=='', message:v=>v.trim().length>4
};
f.addEventListener('submit',e=>{e.preventDefault();let ok=true;
  Object.keys(rules).forEach(k=>{const inp=f.elements[k];const field=inp.closest('.form-field');
    const valid=rules[k](inp.value);field.classList.toggle('err',!valid);if(!valid)ok=false;});
  if(ok){document.getElementById('formOk').style.display='block';f.reset();
    gsap.fromTo('#formOk',{opacity:0,y:-8},{opacity:1,y:0,duration:.5});
    setTimeout(()=>document.getElementById('formOk').scrollIntoView({behavior:'smooth',block:'center'}),100);}
});
f.querySelectorAll('input,select,textarea').forEach(inp=>inp.addEventListener('input',()=>{
  const k=inp.name;if(rules[k])inp.closest('.form-field').classList.toggle('err',!rules[k](inp.value));}));
})();
