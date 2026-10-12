import {motion} from './motion-config.js';
const cleanups=[];
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
function menu(){
 const dialog=document.querySelector('#mobile-menu'), toggle=document.querySelector('.menu-toggle');
 if(!dialog || !toggle || typeof dialog.showModal!=='function')return;
 const fallback=document.querySelector('.mobile-menu-fallback');
 toggle.hidden=false;if(fallback)fallback.hidden=true;
 const close=()=>{if(dialog.open)dialog.close();};
 const reset=()=>{toggle.setAttribute('aria-expanded','false');document.body.classList.remove('menu-open');toggle.focus();};
 const open=()=>{dialog.showModal();toggle.setAttribute('aria-expanded','true');document.body.classList.add('menu-open');dialog.querySelector('.menu-close').focus();};
 toggle.addEventListener('click',open);dialog.querySelector('.menu-close').addEventListener('click',close);
 dialog.addEventListener('close',reset);dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)close();}});
 dialog.querySelectorAll('a').forEach(a=>a.addEventListener('click',close));
 dialog.addEventListener('keydown',e=>{if(e.key==='Tab'){const nodes=[...dialog.querySelectorAll('a,button')].filter(n=>!n.hidden);const first=nodes[0],last=nodes.at(-1);if(e.shiftKey && document.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey && document.activeElement===last){e.preventDefault();first.focus();}}});
 const wide=matchMedia(motion.desktopQuery);const onWide=e=>{if(e.matches)close();};wide.addEventListener('change',onWide);cleanups.push(()=>wide.removeEventListener('change',onWide));
}
function reveals(){
 if(reduced.matches || !('IntersectionObserver' in window))return;
 const elements=[...document.querySelectorAll('[data-reveal]')];let observer;
 const showAll=()=>{document.documentElement.classList.remove('reveal-ready');elements.forEach(el=>el.classList.add('is-visible'));observer?.disconnect();};
 try{
  const root=document.documentElement;
  root.style.setProperty('--reveal-distance',motion.revealDistance+'px');root.style.setProperty('--reveal-time',motion.revealDuration+'ms');
  observer=new IntersectionObserver(entries=>{entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add('is-visible');observer.unobserve(entry.target);}});},{threshold:motion.revealThreshold});
  elements.forEach((el,i)=>{el.style.setProperty('--reveal-delay',(i%3)*motion.revealStagger+'ms');observer.observe(el);});
  root.classList.add('reveal-ready');
  const onReduced=e=>{if(e.matches)showAll();};reduced.addEventListener('change',onReduced);
  cleanups.push(()=>{showAll();reduced.removeEventListener('change',onReduced);});
  // Keep contents readable if an observer fails to deliver callbacks.
  const safety=setTimeout(showAll,12000);cleanups.push(()=>clearTimeout(safety));
 }catch{showAll();}
}
function parallax(){
 if(!('IntersectionObserver' in window))return;
 const desktop=matchMedia(motion.desktopQuery),items=[...document.querySelectorAll('[data-parallax]')],visible=new Set();let raf=0;
 const enabled=()=>desktop.matches&&!reduced.matches;
 const render=()=>{raf=0;if(!enabled())return;visible.forEach(el=>{const r=el.getBoundingClientRect();const p=Math.max(0,Math.min(1,(innerHeight-r.top)/(innerHeight+r.height)));const img=el.querySelector('img');if(img){const max=Math.min(motion.parallaxRange,r.height*.035);img.style.transform=`translateY(${(p*2-1)*max}px)${el.classList.contains('hero-photo')?'':' scale(1.065)'}`;}});};
 const request=()=>{if(enabled()&&visible.size&&!raf)raf=requestAnimationFrame(render);};
 const observer=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting)visible.add(e.target);else visible.delete(e.target);request();}));items.forEach(el=>observer.observe(el));
 const changed=()=>{items.forEach(el=>el.querySelector('img')?.style.removeProperty('transform'));request();};
 addEventListener('scroll',request,{passive:true});addEventListener('resize',changed);desktop.addEventListener('change',changed);reduced.addEventListener('change',changed);
 cleanups.push(()=>{cancelAnimationFrame(raf);observer.disconnect();removeEventListener('scroll',request);removeEventListener('resize',changed);desktop.removeEventListener('change',changed);reduced.removeEventListener('change',changed);});
}
function filters(){document.querySelectorAll('.schedule-widget').forEach(widget=>{const controls=widget.querySelector('.day-filters');if(!controls)return;controls.hidden=false;controls.querySelectorAll('button').forEach(button=>button.addEventListener('click',()=>{const day=button.dataset.day;controls.querySelectorAll('button').forEach(b=>{const active=b===button;b.classList.toggle('active',active);b.setAttribute('aria-pressed',String(active));});widget.querySelectorAll('[data-day-panel]').forEach(panel=>panel.hidden=day!=='all'&&panel.dataset.dayPanel!==day);}));});}
function expiry(){const hideExpired=()=>document.querySelectorAll('[data-notice-end]').forEach(el=>{if(Date.now()>=Date.parse(el.dataset.noticeEnd))el.remove();});hideExpired();const timer=setInterval(hideExpired,60000);cleanups.push(()=>clearInterval(timer));}
for(const init of [menu,reveals,parallax,filters,expiry]){try{init();}catch(error){document.documentElement.classList.remove('reveal-ready');console.warn('Interação indisponível:',error.message);}}
addEventListener('pagehide',()=>cleanups.forEach(fn=>fn()),{once:true});
