import {events,businesses,filterRecords,monthKey,calendarCells} from './data.js';
const $=s=>document.querySelector(s);
const state={month:new Date(Date.UTC(2027,4,1)),category:'All',view:'list'};
const prettyDate=date=>new Intl.DateTimeFormat('en-US',{month:'long',day:'numeric',year:'numeric',timeZone:'UTC'}).format(new Date(`${date}T12:00:00Z`));
function node(tag,cls,text){const e=document.createElement(tag);if(cls)e.className=cls;if(text!==undefined)e.textContent=text;return e;}
function showDetails(title,meta,description){$('#detail-permalink').hidden=true;$('#dialog-title').textContent=title;$('#dialog-meta').textContent=meta;$('#dialog-description').textContent=description;$('#detail-dialog').showModal();$('#close-dialog').focus();}
function openEvent(event){showDetails(event.title,`${prettyDate(event.date)} · ${event.time} · ${event.place}`,event.description);const url=new URL(location.href);url.search='';url.searchParams.set('event',event.id);url.hash='events';$('#detail-permalink').href=url.href;$('#detail-permalink').hidden=false;}
function eventCard(event){
  const card=node('article','event-card');const art=node('div',`event-art ${event.art}`);art.setAttribute('aria-hidden','true');
  art.append(node('span','art-line'),node('span','art-shape'),node('span','art-dot'));const badge=node('div','date-badge');badge.append(node('span','',event.date.slice(8)),node('small','',state.month.toLocaleString('en-US',{month:'short',timeZone:'UTC'})));art.append(badge);const words={market:'Fresh finds.\nFull hearts.',art:'A different\nperspective.',music:'Good company.\nGreat sound.'};art.append(node('p','poster-type',words[event.art]));art.append(node('small','poster-note','DOWNTOWN / DEMO SERIES'));
  const body=node('div','event-body');body.append(node('p','eyebrow',event.category),node('h3','',event.title),node('p','event-meta',event.time),node('p','event-place',event.place));const button=node('button','text-link','Take a closer look ↗');button.setAttribute('aria-label',`View ${event.title}`);button.addEventListener('click',()=>openEvent(event));body.append(button);card.append(art,body);return card;
}
function renderEvents(){
  const label=new Intl.DateTimeFormat('en-US',{month:'long',year:'numeric',timeZone:'UTC'}).format(state.month);$('#month-label').textContent=label;
  const from=$('#event-from').value,to=$('#event-to').value;const invalid=Boolean(from&&to&&from>to);$('#date-error').hidden=!invalid;const results=invalid?[]:filterRecords(events,{query:$('#event-search').value,category:state.category,month:monthKey(state.month)}).filter(e=>(!from||e.date>=from)&&(!to||e.date<=to));
  $('#event-count').textContent=`${results.length} sample ${results.length===1?'event':'events'} in ${label}`;
  const container=$('#event-results');container.replaceChildren();container.className=state.view==='list'?'event-grid':'calendar-wrap';
  if(state.view==='list'){if(!results.length){const empty=node('div','empty-state','No sample events match. Try another category, search, or May–June 2027.');container.append(empty);}else results.forEach(e=>container.append(eventCard(e)));return;}
  const table=node('table','calendar');const caption=node('caption','sr-only',`Sample events for ${label}`);table.append(caption);const head=node('thead');const row=node('tr');['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].forEach(day=>{const th=node('th','',day);th.scope='col';row.append(th);});head.append(row);table.append(head);
  const tbody=node('tbody');const cells=calendarCells(state.month.getUTCFullYear(),state.month.getUTCMonth());
  for(let i=0;i<cells.length;i+=7){const week=node('tr');cells.slice(i,i+7).forEach(day=>{const cell=node('td');if(day!==null){cell.append(node('span','calendar-day',String(day)));const date=`${monthKey(state.month)}-${String(day).padStart(2,'0')}`;results.filter(e=>e.date===date).forEach(e=>{const button=node('button','calendar-event',e.title);button.setAttribute('aria-label',`${prettyDate(date)}: ${e.title}`);button.addEventListener('click',()=>openEvent(e));cell.append(button);});}else cell.className='blank-day';week.append(cell);});tbody.append(week);}table.append(tbody);container.append(table);
}
function renderBusinesses(){
  const results=filterRecords(businesses,{query:$('#business-search').value,category:$('#business-category').value});$('#business-count').textContent=`${results.length} fictional ${results.length===1?'business':'businesses'}`;const list=$('#business-results');list.replaceChildren();
  if(!results.length){list.append(node('div','empty-state','No sample businesses match. Try another search or category.'));return;}
  results.forEach(b=>{const card=node('article','business-card');const icon=node('div',`business-icon ${b.color}`);icon.setAttribute('aria-hidden','true');const illustration=node('img');illustration.src='assets/'+b.color+'.svg';illustration.alt='';illustration.loading='lazy';illustration.width=280;illustration.height=220;icon.append(illustration);card.append(icon,node('p','eyebrow',b.category),node('h3','',b.name),node('p','business-tag',b.tag));const button=node('button','text-link','Meet this local favorite ↗');button.setAttribute('aria-label',`View ${b.name}`);button.addEventListener('click',()=>showDetails(b.name,`${b.category} · Fictional sample business`,b.description));card.append(button);list.append(card);});
}
$('#prev-month').addEventListener('click',()=>{state.month.setUTCMonth(state.month.getUTCMonth()-1);renderEvents();});$('#next-month').addEventListener('click',()=>{state.month.setUTCMonth(state.month.getUTCMonth()+1);renderEvents();});
$('#event-filters').addEventListener('click',e=>{const button=e.target.closest('button[data-category]');if(!button)return;state.category=button.dataset.category;document.querySelectorAll('#event-filters button').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));renderEvents();});
$('#event-search').addEventListener('input',renderEvents);$('#business-search').addEventListener('input',renderBusinesses);$('#business-category').addEventListener('change',renderBusinesses);
for(const view of ['list','calendar'])$(`#${view}-view`).addEventListener('click',()=>{state.view=view;$('#list-view').setAttribute('aria-pressed',String(view==='list'));$('#calendar-view').setAttribute('aria-pressed',String(view==='calendar'));renderEvents();});
$('#close-dialog').addEventListener('click',()=>$('#detail-dialog').close());$('#done-dialog').addEventListener('click',()=>$('#detail-dialog').close());
$('.menu-toggle').addEventListener('click',()=>{const open=$('.menu-toggle').getAttribute('aria-expanded')!=='true';$('.menu-toggle').setAttribute('aria-expanded',String(open));$('#navigation').classList.toggle('is-open',open);});
document.querySelectorAll('#navigation a').forEach(a=>a.addEventListener('click',()=>{$('.menu-toggle').setAttribute('aria-expanded','false');$('#navigation').classList.remove('is-open');}));
renderEvents();renderBusinesses();

const stops=[
 ['The Gathering','An imagined bronze form about the places we meet. A sample profile for artwork, artist and installation details.'],
 ['Open Circle','A fictional sculpture framing the sky. This sample illustrates how a visitor could move from a trail marker to the story behind a work.'],
 ['Rooted','An imagined steel sculpture inspired by growing things. Approved artist biographies, photographs and route details would belong here.']
];
document.querySelectorAll('[data-stop]').forEach(button=>button.addEventListener('click',()=>{const index=Number(button.dataset.stop);document.querySelectorAll('[data-stop]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));$('#trail-number').textContent='STOP 0'+(index+1)+' / 03';$('#trail-title').textContent=stops[index][0];$('#trail-description').textContent=stops[index][1];}));
const plans={
 slow:[['Start with something warm','Find coffee & a sweet little pause.','The Corner Cup','corner-cup'],['Leave room for a discovery','Browse thoughtful things made for keeping.','Paper & Petal','paper-petal'],['Take the scenic way back','Explore a fictional outdoor art stop.','Art Trail preview','trail']],
 creative:[['Follow a new perspective','Begin with the illustrated sculpture trail.','Art Trail preview','trail'],['Meet your next inspiration','Make room for art, craft and curious things.','North Street Studio','north-studio'],['Keep the conversation going','Settle into a good meal and good company.','The Market Table','market-table']],
 together:[['Make a little time','Start your visit around a shared table.','The Market Table','market-table'],['Find a little something','Look for a thoughtful gift or keepsake.','Paper & Petal','paper-petal'],['Finish on a bright note','Explore something unexpected together.','Art Trail preview','trail']]
};
function renderPlan(key){const list=$('#plan-stops');list.replaceChildren();plans[key].forEach((stop,index)=>{const item=node('li');item.append(node('span','step-number','0'+(index+1)));const body=node('div');body.append(node('h3','',stop[0]),node('p','',stop[1]));const link=node(stop[3]==='trail'?'a':'button','text-link',stop[2]+' ↗');if(stop[3]==='trail')link.href='#trail-preview';else link.addEventListener('click',()=>{const b=businesses.find(b=>b.id===stop[3]);showDetails(b.name,b.category+' · Fictional sample business',b.description);});body.append(link);item.append(body);list.append(item);});}
document.querySelectorAll('[data-plan]').forEach(button=>button.addEventListener('click',()=>{document.querySelectorAll('[data-plan]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));renderPlan(button.dataset.plan);}));
renderPlan('slow');
for(const id of ['event-from','event-to'])$('#'+id).addEventListener('input',renderEvents);
$('#reset-events').addEventListener('click',()=>{state.month=new Date(Date.UTC(2027,4,1));state.category='All';for(const id of ['event-from','event-to','event-search'])$('#'+id).value='';document.querySelectorAll('#event-filters button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.category==='All')));renderEvents();});
document.querySelectorAll('[data-featured]').forEach(button=>button.addEventListener('click',()=>openEvent(events.find(e=>e.id===button.dataset.featured))));
const sharedEvent=new URLSearchParams(location.search).get('event');if(sharedEvent){const event=events.find(e=>e.id===sharedEvent);if(event)openEvent(event);}
$('#navigation').addEventListener('keydown',e=>{if(e.key==='Escape'){$('.menu-toggle').setAttribute('aria-expanded','false');$('#navigation').classList.remove('is-open');$('.menu-toggle').focus();}});
