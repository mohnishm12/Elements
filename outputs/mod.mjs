
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';

const reduced = window.matchMedia('(prefers-reduced-motion:reduce)').matches;
const gsap = window.gsap; gsap.registerPlugin(window.ScrollTrigger);

/* ---------------- renderer / scene ---------------- */
const canvas = document.getElementById('scene-canvas');
const renderer = new THREE.WebGLRenderer({canvas, antialias:true, alpha:true});
renderer.setPixelRatio(Math.min(devicePixelRatio,2));
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05;
renderer.outputColorSpace = THREE.SRGBColorSpace;

const scene = new THREE.Scene();
scene.fog = new THREE.Fog(0x0b0b0c, 14, 40);
const camera = new THREE.PerspectiveCamera(42, innerWidth/innerHeight, 0.1, 200);
camera.position.set(0, 2.4, 9);

const pmrem = new THREE.PMREMGenerator(renderer);
scene.environment = pmrem.fromScene(new RoomEnvironment(renderer), 0.5).texture;

/* ---------------- lights ---------------- */
const ambient = new THREE.AmbientLight(0xffffff, .55); scene.add(ambient);
const sun = new THREE.DirectionalLight(0xffe6c2, 2.4);
sun.position.set(7, 9, 5); sun.castShadow = true;
sun.shadow.mapSize.set(2048,2048); sun.shadow.camera.near=1; sun.shadow.camera.far=40;
sun.shadow.camera.left=-12;sun.shadow.camera.right=12;sun.shadow.camera.top=12;sun.shadow.camera.bottom=-12;
sun.shadow.bias=-0.0004; scene.add(sun);
const fill = new THREE.DirectionalLight(0x88aaff, .35); fill.position.set(-6,4,-4); scene.add(fill);

// warm under-cabinet + pendant lights (toggleable)
const warmLights = [];
function addWarm(x,y,z,intensity,dist){const p=new THREE.PointLight(0xffca70,intensity,dist,2);p.position.set(x,y,z);scene.add(p);warmLights.push(p);return p;}
addWarm(0,2.55,-3.2,8,7);     // under wall units
addWarm(-2.4,2.55,-3.2,5,6);
addWarm(2.4,2.55,-3.2,5,6);
const pendant1 = addWarm(-0.7,3.0,0.4,6,6);
const pendant2 = addWarm(0.7,3.0,0.4,6,6);

/* ---------------- materials ---------------- */
const PALETTE = {
  cab:  [ {n:'Matte Black',c:0x171717,r:.35,m:.1}, {n:'Walnut',c:0x5b3a29,r:.45,m:.05}, {n:'Oak',c:0xc9a875,r:.55,m:.0}, {n:'Pure White',c:0xeeece6,r:.4,m:.0}, {n:'Sage',c:0x6f7a64,r:.5,m:.0}, {n:'Navy',c:0x222b3a,r:.4,m:.05} ],
  top:  [ {n:'Carrara Marble',c:0xe9e6df,r:.18,m:.0}, {n:'Black Granite',c:0x101012,r:.15,m:.2}, {n:'Quartz Sand',c:0xcabfa8,r:.3,m:.0}, {n:'Brushed Gold',c:0xc8a24c,r:.25,m:.85}, {n:'Concrete',c:0x8c8a86,r:.6,m:.0} ],
  bsp:  [ {n:'Marble Slab',c:0xddd8cd,r:.2,m:.0}, {n:'Smoked Glass',c:0x2a2d33,r:.05,m:.3}, {n:'Brass Tile',c:0xb8923f,r:.3,m:.7}, {n:'White Subway',c:0xf2efe8,r:.3,m:.0} ],
  flr:  [ {n:'Walnut Plank',c:0x4a3022,r:.5,m:.0}, {n:'Oak Plank',c:0xb59264,r:.55,m:.0}, {n:'Marble Floor',c:0xcfcabd,r:.2,m:.05}, {n:'Charcoal',c:0x1b1b1d,r:.45,m:.05} ],
  wall: [ {n:'Warm White',c:0xe8e2d6,r:.9,m:.0}, {n:'Greige',c:0xb8ae9d,r:.9,m:.0}, {n:'Charcoal',c:0x222225,r:.9,m:.0}, {n:'Clay',c:0xa9755a,r:.9,m:.0} ]
};
function mat(o){return new THREE.MeshStandardMaterial({color:o.c,roughness:o.r,metalness:o.m});}
const M = {
  cab: mat(PALETTE.cab[0]), top: mat(PALETTE.top[0]), bsp: mat(PALETTE.bsp[0]),
  flr: mat(PALETTE.flr[0]), wall: mat(PALETTE.wall[0]),
  handle: new THREE.MeshStandardMaterial({color:0xc8a24c,roughness:.25,metalness:.9}),
  steel: new THREE.MeshStandardMaterial({color:0xb8bcc0,roughness:.25,metalness:.85}),
  glass: new THREE.MeshPhysicalMaterial({color:0xbfd0d8,roughness:.05,metalness:0,transmission:.9,transparent:true,opacity:.5,ior:1.4})
};

/* ---------------- kitchen build ---------------- */
const kitchen = new THREE.Group(); scene.add(kitchen);
const box=(w,h,d,m)=>{const g=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),m);g.castShadow=true;g.receiveShadow=true;return g;};

// floor + walls
const floor=box(40,.1,40,M.flr); floor.position.y=-.05; floor.receiveShadow=true; kitchen.add(floor);
const backWall=box(20,8,.2,M.wall); backWall.position.set(0,3.9,-4.1); kitchen.add(backWall);
const sideWall=box(.2,8,20,M.wall); sideWall.position.set(-7,3.9,0); kitchen.add(sideWall);
// window opening on back wall (glass + frame, lets sun in)
const win=box(4.4,3,.05,M.glass); win.position.set(4.2,4.2,-4.0); kitchen.add(win);
const frameMat=new THREE.MeshStandardMaterial({color:0x141414,roughness:.4,metalness:.2});
[[4.4,.12,2.85],[ .12,3,2.85]].forEach(()=>{});
const winFrameT=box(4.6,.14,.12,frameMat);winFrameT.position.set(4.2,5.75,-3.98);kitchen.add(winFrameT);
const winFrameB=box(4.6,.14,.12,frameMat);winFrameB.position.set(4.2,2.65,-3.98);kitchen.add(winFrameB);
const winFrameM=box(.12,3,.12,frameMat);winFrameM.position.set(4.2,4.2,-3.98);kitchen.add(winFrameM);

// cabinet doors / drawers registries for animation
const doors=[]; const drawers=[]; const appliances=[];

// ---- base run along back wall ----
function baseUnit(x,withDrawers){
  const g=new THREE.Group(); g.position.set(x,0,-3.35);
  const carcass=box(1.18,1.7,1.0,M.cab); carcass.position.y=.86; g.add(carcass);
  if(withDrawers){
    for(let i=0;i<3;i++){
      const dr=new THREE.Group(); dr.position.set(0,.42+i*.5,.5);
      const front=box(1.12,.46,.06,M.cab); dr.add(front);
      const h=box(.34,.05,.05,M.handle); h.position.set(0,.16,.04); dr.add(h);
      dr.userData={closedZ:.5,open:false}; g.add(dr); drawers.push(dr);
    }
  } else {
    // two hinged doors
    [-1,1].forEach(side=>{
      const pivot=new THREE.Group(); pivot.position.set(side*0.56,.86,.5);
      const door=box(.54,1.5,.05,M.cab); door.position.x=-side*0.27; pivot.add(door);
      const h=box(.05,.34,.05,M.handle); h.position.set(side*0.18,0,.04); pivot.add(h);
      pivot.userData={side,open:false,type:'door'}; g.add(pivot); doors.push(pivot);
    });
  }
  return g;
}
[-2.4,-1.1, 1.1, 2.4].forEach((x,i)=>kitchen.add(baseUnit(x, i===1||i===2)));

// countertop slab
const counter=box(6.2,.12,1.06,M.top); counter.position.set(0,1.74,-3.35); kitchen.add(counter);
// backsplash
const splash=box(6.2,1.05,.06,M.bsp); splash.position.set(0,2.45,-3.86); kitchen.add(splash);

// ---- wall cabinets ----
[-2,-.7,.7,2].forEach((x)=>{
  const wc=box(1.18,.9,.5,M.cab); wc.position.set(x,3.25,-3.6); wc.castShadow=true; kitchen.add(wc);
});

// ---- appliances ----
// range / hob in counter
const hob=box(1.0,.04,.7,new THREE.MeshStandardMaterial({color:0x0c0c0d,roughness:.2,metalness:.4}));
hob.position.set(0,1.82,-3.35); hob.userData={spec:['Induction Hob','5-zone flex induction · 7.4kW · touch slider']}; kitchen.add(hob); appliances.push(hob);
// range hood
const hood=box(1.1,.5,.7,M.steel); hood.position.set(0,3.55,-3.55);
const hoodN=box(.5,.55,.45,M.steel); hoodN.position.set(0,4.1,-3.7);
hood.userData={spec:['Chimney Hood','Brushed steel · 1200m³/h · whisper mode']}; kitchen.add(hood); kitchen.add(hoodN); appliances.push(hood);
// tall fridge
const fridge=box(1.0,3.0,.9,M.steel); fridge.position.set(-3.8,1.5,-3.45);
const fh1=box(.04,.5,.05,M.handle); fh1.position.set(-3.32,2.4,-2.99);
const fh2=box(.04,.5,.05,M.handle); fh2.position.set(-3.32,.9,-2.99);
fridge.userData={spec:['Built-in Refrigerator','French-door · 600L · no-frost · inverter']}; kitchen.add(fridge);kitchen.add(fh1);kitchen.add(fh2); appliances.push(fridge);
// sink
const sink=box(.7,.06,.5,M.steel); sink.position.set(2.0,1.78,-3.35); kitchen.add(sink);
const tap=box(.05,.4,.05,M.handle); tap.position.set(2.0,1.95,-3.6); kitchen.add(tap);

// ---- island (rotatable) with drawers ----
const island=new THREE.Group(); island.position.set(0,0,0.4); kitchen.add(island);
const isbody=box(2.6,1.7,1.3,M.cab); isbody.position.y=.86; island.add(isbody);
const istop=box(2.85,.14,1.55,M.top); istop.position.y=1.76; island.add(istop);
// island drawers
for(let i=0;i<3;i++){
  const dr=new THREE.Group(); dr.position.set(-.7,.5+i*.45,.66);
  const front=box(1.0,.4,.06,M.cab); dr.add(front);
  const h=box(.32,.05,.05,M.handle); h.position.set(0,.14,.04); dr.add(h);
  dr.userData={closedZ:.66,open:false}; island.add(dr); drawers.push(dr);
}
// island stools hint
[-0.7,0.3,1.3].forEach(x=>{const s=box(.34,.7,.34,new THREE.MeshStandardMaterial({color:0x2a2622,roughness:.6}));s.position.set(x,.35,1.5);island.add(s);});

// pendant fixtures over island
[-0.7,0.7].forEach(x=>{
  const c=box(.04,1.0,.04,frameMat); c.position.set(x,3.5,0.4); kitchen.add(c);
  const shade=new THREE.Mesh(new THREE.ConeGeometry(.26,.3,24,1,true), new THREE.MeshStandardMaterial({color:0xc8a24c,roughness:.3,metalness:.7,side:THREE.DoubleSide}));
  shade.position.set(x,2.95,0.4); kitchen.add(shade);
});

// floating particles (dust in sunlight)
const pCount=380, pGeo=new THREE.BufferGeometry(), pPos=new Float32Array(pCount*3);
for(let i=0;i<pCount;i++){pPos[i*3]=(Math.random()-.5)*12;pPos[i*3+1]=Math.random()*6;pPos[i*3+2]=(Math.random()-.5)*9;}
pGeo.setAttribute('position',new THREE.BufferAttribute(pPos,3));
const particles=new THREE.Points(pGeo,new THREE.PointsMaterial({color:0xffe6c2,size:.025,transparent:true,opacity:.6,depthWrite:false}));
scene.add(particles);

/* ---------------- post processing (bloom) ---------------- */
let composer=null, bloom=null;
const usePost = !reduced && innerWidth>720;
if(usePost){
  composer=new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene,camera));
  bloom=new UnrealBloomPass(new THREE.Vector2(innerWidth,innerHeight),0.55,0.6,0.85);
  composer.addPass(bloom);
}

/* ---------------- controls (only in studio) ---------------- */
const controls=new OrbitControls(camera,renderer.domElement);
controls.enableDamping=true; controls.dampingFactor=.06;
controls.minDistance=4; controls.maxDistance=12; controls.maxPolarAngle=Math.PI/2.05;
controls.target.set(0,1.6,-1); controls.enabled=false;
let interactive=false;

/* ---------------- camera scroll story ---------------- */
// keyframes for scenes 0..7 (hero + 7 story steps)
const camPath=[
  {p:[0,2.4,9],   t:[0,2.0,-1]},   // hero
  {p:[-5,2.0,6.5],t:[-1,1.8,-2]},  // 1 empty
  {p:[4.5,2.6,6], t:[0,2.0,-2]},   // 2 build
  {p:[-2.5,1.7,3.2],t:[-1.5,1.3,-3]},// 3 open
  {p:[2.8,2.2,3.4],t:[1,1.8,-3]},  // 4 surfaces
  {p:[0,1.5,4.2], t:[0,1.0,0]},    // 5 storage
  {p:[3.5,2.8,5.5],t:[0,2.2,-2]},  // 6 night
  {p:[0,2.6,8],   t:[0,2.0,-1]}    // 7 complete
];
const camProxy={i:0};
const storyEl=document.getElementById('story');
if(!reduced){
  gsap.to(camProxy,{
    i:camPath.length-1, ease:'none',
    scrollTrigger:{trigger:storyEl,start:'top top',end:'bottom bottom',scrub:1}
  });
}
// reveal story text per step
document.querySelectorAll('.story-step .inner').forEach(el=>{
  gsap.to(el,{opacity:1,y:0,duration:.8,ease:'power3.out',
    scrollTrigger:{trigger:el.parentElement,start:'top 55%',end:'bottom 45%',toggleActions:'play reverse play reverse'}});
});

function lerpCam(){
  if(interactive) return;
  const f=camProxy.i, i=Math.floor(f), k=Math.min(i+1,camPath.length-1), a=f-i;
  const A=camPath[i], B=camPath[k];
  camera.position.set(
    THREE.MathUtils.lerp(A.p[0],B.p[0],a),
    THREE.MathUtils.lerp(A.p[1],B.p[1],a),
    THREE.MathUtils.lerp(A.p[2],B.p[2],a));
  const tx=THREE.MathUtils.lerp(A.t[0],B.t[0],a),
        ty=THREE.MathUtils.lerp(A.t[1],B.t[1],a),
        tz=THREE.MathUtils.lerp(A.t[2],B.t[2],a);
  // mouse parallax
  camera.position.x+=mouse.x*0.5; camera.position.y+=mouse.y*0.25;
  camera.lookAt(tx,ty,tz);
}

// auto-open doors/drawers during scene 3 & 5
window.ScrollTrigger.create({trigger:storyEl,start:'top top',end:'bottom bottom',
  onUpdate:self=>{ if(interactive)return;
    const seg=self.progress*7;
    setDoors(seg>2.4 && seg<5.6);
    setDrawers(seg>4.4 && seg<5.8);
    setNight(seg>5.2 && seg<6.8);
  }});

/* ---------------- studio activation ---------------- */
window.ScrollTrigger.create({trigger:'#studio',start:'top 60%',end:'bottom top',
  onEnter:()=>enterStudio(), onEnterBack:()=>enterStudio(),
  onLeave:()=>exitStudio(), onLeaveBack:()=>exitStudio()});
function enterStudio(){
  interactive=true; controls.enabled=true; canvas.style.pointerEvents='auto';
  document.getElementById('config').classList.add('show');
  gsap.to(camera.position,{x:5.5,y:2.4,z:5.5,duration:1.2,ease:'power3.inOut',onUpdate:()=>controls.update()});
  gsap.to(controls.target,{x:0,y:1.5,z:-1,duration:1.2,ease:'power3.inOut'});
}
function exitStudio(){
  interactive=false; controls.enabled=false; canvas.style.pointerEvents='none';
  document.getElementById('config').classList.remove('show');
}

/* ---------------- animations: doors/drawers/island/lights ---------------- */
let doorsOpen=false,drawersOpen=false,islandRot=false,lightsOn=true,night=false;
function setDoors(v){ if(v===doorsOpen)return; doorsOpen=v;
  doors.forEach((d,i)=>gsap.to(d.rotation,{y:v?d.userData.side*1.15:0,duration:.9,ease:'power3.inOut',delay:i*0.04}));
  syncToggle('t-doors',v);
}
function setDrawers(v){ if(v===drawersOpen)return; drawersOpen=v;
  drawers.forEach((d,i)=>gsap.to(d.position,{z:v?d.userData.closedZ+0.42:d.userData.closedZ,duration:.7,ease:'power3.out',delay:i*0.03}));
  syncToggle('t-draw',v);
}
function setIslandRot(v){islandRot=v;syncToggle('t-rot',v);}
function setLights(v){ lightsOn=v; warmLights.forEach(l=>gsap.to(l,{intensity:v?(l.baseInt||l.intensity):0,duration:.6}));
  if(v)warmLights.forEach(l=>l.baseInt=l.baseInt||l.intensity);
  syncToggle('t-light',v);
}
warmLights.forEach(l=>l.baseInt=l.intensity);
function setLights2(v){lightsOn=v;warmLights.forEach(l=>gsap.to(l,{intensity:v?l.baseInt:0,duration:.6}));syncToggle('t-light',v);}
function setNight(v){ if(v===night)return; night=v;
  gsap.to(sun,{intensity:v?0.25:2.4,duration:1});
  gsap.to(ambient,{intensity:v?0.18:0.55,duration:1});
  gsap.to(scene.fog,{near:v?8:14,far:v?28:40,duration:1});
  if(v && !lightsOn) setLights2(true);
  syncToggle('t-night',v);
}
function syncToggle(id,v){const b=document.getElementById(id);if(b)b.classList.toggle('on',v);}

/* ---------------- raycasting: hover + click ---------------- */
const ray=new THREE.Raycaster(); const ndc=new THREE.Vector2();
const mouse={x:0,y:0}; let hovered=null;
const tip=document.getElementById('spec-tip');
addEventListener('pointermove',e=>{
  mouse.x=(e.clientX/innerWidth-.5)*2; mouse.y=-(e.clientY/innerHeight-.5)*2;
  if(!interactive){tip.style.opacity=0;return;}
  ndc.x=(e.clientX/innerWidth)*2-1; ndc.y=-(e.clientY/innerHeight)*2+1;
  ray.setFromCamera(ndc,camera);
  const hits=ray.intersectObjects(appliances,false);
  if(hits.length){const o=hits[0].object;tip.innerHTML='<b>'+o.userData.spec[0]+'</b><span>'+o.userData.spec[1]+'</span>';
    tip.style.left=(e.clientX+16)+'px';tip.style.top=(e.clientY+14)+'px';tip.style.opacity=1;tip.style.transform='none';canvas.style.cursor='help';}
  else {tip.style.opacity=0;
    // highlight cabinet door under cursor
    const dh=ray.intersectObjects(doors,true);
    if(hovered){hovered.scale.set(1,1,1);hovered=null;}
    if(dh.length){let g=dh[0].object;while(g.parent && !doors.includes(g))g=g.parent;if(doors.includes(g)){hovered=g;g.scale.set(1.02,1.02,1.02);canvas.style.cursor='pointer';}}
    else canvas.style.cursor='grab';
  }
});
addEventListener('pointerdown',e=>{
  if(!interactive)return;
  ndc.x=(e.clientX/innerWidth)*2-1; ndc.y=-(e.clientY/innerHeight)*2+1;
  ray.setFromCamera(ndc,camera);
  const dh=ray.intersectObjects(doors,true);
  if(dh.length){let g=dh[0].object;while(g.parent&&!doors.includes(g))g=g.parent;
    if(doors.includes(g)){g.userData.open=!g.userData.open;gsap.to(g.rotation,{y:g.userData.open?g.userData.side*1.15:0,duration:.8,ease:'power3.inOut'});}return;}
  const drh=ray.intersectObjects(drawers,true);
  if(drh.length){let g=drh[0].object;while(g.parent&&!drawers.includes(g))g=g.parent;
    if(drawers.includes(g)){g.userData.open=!g.userData.open;gsap.to(g.position,{z:g.userData.open?g.userData.closedZ+.42:g.userData.closedZ,duration:.6,ease:'power3.out'});}}
});

/* ---------------- config panel wiring ---------------- */
function buildSwatches(key,elId){
  const el=document.getElementById(elId);
  PALETTE[key].forEach((o,i)=>{
    const s=document.createElement('div'); s.className='sw'+(i===0?' active':'');
    s.style.background='#'+o.c.toString(16).padStart(6,'0'); s.title=o.n;
    if(o.m>.5)s.style.boxShadow='inset 0 0 8px rgba(255,255,255,.4)';
    s.onclick=()=>{el.querySelectorAll('.sw').forEach(x=>x.classList.remove('active'));s.classList.add('active');applyMat(key,o);};
    el.appendChild(s);
  });
}
function applyMat(key,o){
  const m=M[key]; const c=new THREE.Color(o.c);
  gsap.to(m.color,{r:c.r,g:c.g,b:c.b,duration:.6});
  gsap.to(m,{roughness:o.r,metalness:o.m,duration:.6});
}
buildSwatches('cab','sw-cab');buildSwatches('top','sw-top');buildSwatches('bsp','sw-bsp');buildSwatches('flr','sw-flr');buildSwatches('wall','sw-wall');

const PRESETS={
  modern:{cab:0,top:0,bsp:0,flr:0,wall:0,night:false},
  luxury:{cab:1,top:3,bsp:2,flr:0,wall:3,night:false},
  minimal:{cab:3,top:0,bsp:3,flr:2,wall:0,night:false},
  classic:{cab:2,top:2,bsp:0,flr:1,wall:1,night:false},
  dark:{cab:0,top:1,bsp:1,flr:3,wall:2,night:true}
};
function applyPreset(name){
  const p=PRESETS[name]; if(!p)return;
  [['cab','sw-cab'],['top','sw-top'],['bsp','sw-bsp'],['flr','sw-flr'],['wall','sw-wall']].forEach(([k,id])=>{
    const o=PALETTE[k][p[k]]; applyMat(k,o);
    const sws=document.querySelectorAll('#'+id+' .sw'); sws.forEach((s,i)=>s.classList.toggle('active',i===p[k]));
  });
  setNight(p.night);
  document.querySelectorAll('.preset').forEach(b=>b.classList.toggle('active',b.dataset.preset===name));
}
document.querySelectorAll('.preset').forEach(b=>b.onclick=()=>applyPreset(b.dataset.preset));

document.getElementById('t-light').onclick=()=>setLights2(!lightsOn);
document.getElementById('t-night').onclick=()=>setNight(!night);
document.getElementById('t-doors').onclick=()=>{doors.forEach((d,i)=>{d.userData.open=!doorsOpen;});setDoors(!doorsOpen);};
document.getElementById('t-draw').onclick=()=>{drawers.forEach(d=>d.userData.open=!drawersOpen);setDrawers(!drawersOpen);};
document.getElementById('t-rot').onclick=()=>setIslandRot(!islandRot);

/* ---------------- render loop ---------------- */
const clock=new THREE.Clock();
function loop(){
  requestAnimationFrame(loop);
  const dt=clock.getDelta(), t=clock.elapsedTime;
  particles.rotation.y=t*0.02;
  const pp=particles.geometry.attributes.position.array;
  for(let i=1;i<pp.length;i+=3){pp[i]+=dt*0.08;if(pp[i]>6)pp[i]=0;}
  particles.geometry.attributes.position.needsUpdate=true;
  if(islandRot) island.rotation.y+=dt*0.5;
  if(interactive) controls.update(); else lerpCam();
  if(composer && !reduced) composer.render(); else renderer.render(scene,camera);
}
loop();

addEventListener('resize',()=>{
  camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();
  renderer.setSize(innerWidth,innerHeight); if(composer)composer.setSize(innerWidth,innerHeight);
});

/* ---------------- loader ---------------- */
let prog=0; const bar=document.getElementById('loadbar'),pct=document.getElementById('loadpct');
const fakeLoad=setInterval(()=>{prog=Math.min(100,prog+Math.random()*16);bar.style.width=prog+'%';pct.textContent=Math.floor(prog);
  if(prog>=100){clearInterval(fakeLoad);setTimeout(revealHero,350);}},120);
function revealHero(){
  document.getElementById('loader').classList.add('hide');
  if(!reduced){
    gsap.to('[data-hero]',{y:0,opacity:1,duration:1,stagger:.08,ease:'power3.out',delay:.2});
    gsap.fromTo('.hero h1 .line span',{y:'110%'},{y:'0%',duration:1.1,stagger:.12,ease:'power4.out',delay:.3});
  } else {
    document.querySelectorAll('[data-hero],.hero h1 .line span').forEach(e=>{e.style.opacity=1;e.style.transform='none';});
  }
}
// set initial hidden state for hero (handled by reveal)
document.querySelectorAll('[data-hero]').forEach(e=>{e.style.opacity=0;e.style.transform='translateY(24px)';e.style.transition='none';});

window.__atelierReady=true;
