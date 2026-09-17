import {events,businesses,filterRecords,monthKey,calendarCells} from './data.js';
const $=s=>document.querySelector(s);
const state={month:new Date(Date.UTC(2027,4,1)),category:'All',view:'list'};
const prettyDate=date=>new Intl.DateTimeFormat('en-US',{month:'long',day:'numeric',year:'numeric',timeZone:'UTC'}).format(new Date(`${date}T12:00:00Z`));
function node(tag,cls,text){const e=document.createElement(tag);if(cls)e.className=cls;if(text!==undefined)e.textContent=text;return e;}
function showDetails(title,meta,description){$('#dialog-title').textContent=title;$('#dialog-meta').textContent=meta;$('#dialog-description').textContent=description;$('#detail-dialog').showModal();$('#close-dialog').focus();}
function openEvent(event){showDetails(event.title,`${prettyDate(event.date)} · ${event.time} · ${event.place}`,event.description);}
function eventCard(event){
  const card=node('article','event-card');const art=node('div',`event-art ${event.art}`);art.setAttribute('aria-hidden','true');
  art.append(node('span','art-line'),node('span','art-shape'),node('span','art-dot'));const badge=node('div','date-badge');badge.append(node('span','',event.date.slice(8)),node('small','',state.month.toLocaleString('en-US',{month:'short',timeZone:'UTC'})));art.append(badge);
  const body=node('div','event-body');body.append(node('p','eyebrow',event.category),node('h3','',event.title),node('p','event-meta',event.time),node('p','event-place',event.place));const button=node('button','text-link','Take a closer look ↗');button.setAttribute('aria-label',`View ${event.title}`);button.addEventListener('click',()=>openEvent(event));body.append(button);card.append(art,body);return card;
}
function renderEvents(){
  const label=new Intl.DateTimeFormat('en-US',{month:'long',year:'numeric',timeZone:'UTC'}).format(state.month);$('#month-label').textContent=label;
  const results=filterRecords(events,{query:$('#event-search').value,category:state.category,month:monthKey(state.month)});
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
  results.forEach(b=>{const card=node('article','business-card');const icon=node('div',`business-icon ${b.color}`,b.icon);icon.setAttribute('aria-hidden','true');card.append(icon,node('p','eyebrow',b.category),node('h3','',b.name),node('p','business-tag',b.tag));const button=node('button','text-link','Meet this local favorite ↗');button.setAttribute('aria-label',`View ${b.name}`);button.addEventListener('click',()=>showDetails(b.name,`${b.category} · Fictional sample business`,b.description));card.append(button);list.append(card);});
}
$('#prev-month').addEventListener('click',()=>{state.month.setUTCMonth(state.month.getUTCMonth()-1);renderEvents();});$('#next-month').addEventListener('click',()=>{state.month.setUTCMonth(state.month.getUTCMonth()+1);renderEvents();});
$('#event-filters').addEventListener('click',e=>{const button=e.target.closest('button[data-category]');if(!button)return;state.category=button.dataset.category;document.querySelectorAll('#event-filters button').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));renderEvents();});
$('#event-search').addEventListener('input',renderEvents);$('#business-search').addEventListener('input',renderBusinesses);$('#business-category').addEventListener('change',renderBusinesses);
for(const view of ['list','calendar'])$(`#${view}-view`).addEventListener('click',()=>{state.view=view;$('#list-view').setAttribute('aria-pressed',String(view==='list'));$('#calendar-view').setAttribute('aria-pressed',String(view==='calendar'));renderEvents();});
$('#close-dialog').addEventListener('click',()=>$('#detail-dialog').close());$('#done-dialog').addEventListener('click',()=>$('#detail-dialog').close());
const stories={art:['Art Trail, reimagined','A proposed content experience','This concept would connect individual artwork profiles, artist stories, a printable guide and an accessible self-guided route. Actual artwork data, photography rights and route details require DDA approval. The illustration is original and does not depict a real sculpture.'],market:['A dedicated market home','A proposed content experience','This concept would bring together approved season dates, location information, vendor profiles, FAQs and application links. No application or vendor submission is collected in this prototype.']};
document.querySelectorAll('[data-story]').forEach(b=>b.addEventListener('click',()=>showDetails(...stories[b.dataset.story])));
$('.menu-toggle').addEventListener('click',()=>{const open=$('.menu-toggle').getAttribute('aria-expanded')!=='true';$('.menu-toggle').setAttribute('aria-expanded',String(open));$('#navigation').classList.toggle('is-open',open);});
document.querySelectorAll('#navigation a').forEach(a=>a.addEventListener('click',()=>{$('.menu-toggle').setAttribute('aria-expanded','false');$('#navigation').classList.remove('is-open');}));
renderEvents();renderBusinesses();
