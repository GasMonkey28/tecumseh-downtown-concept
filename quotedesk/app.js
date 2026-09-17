import { DemoStore, formatMoney } from './domain.js';

const app = document.querySelector('#app');
const dialog = document.querySelector('#dialog');
const KEY = 'portfolio-quotedesk-public-v1';
let config, store, storageWarning = '', toastTimer, paymentReview = null, dialogReturnFocus = null;
const esc = value => String(value ?? '').replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
const iconPaths = {
  home: '<path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1Z"/><path d="M9 21v-8h6v8"/>',
  quotes: '<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M9 8h6M9 12h6M9 16h3"/>',
  image: '<rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="8" cy="8" r="1.5"/><path d="m3 16 5-5 4 4 3-3 6 6"/>',
  users: '<circle cx="9" cy="8" r="3"/><path d="M3 21v-3a6 6 0 0 1 12 0v3M16 5a3 3 0 0 1 0 6M21 21v-3a6 6 0 0 0-3-5"/>',
  settings: '<path d="m9 3-1 3-3 1v4l2 2-1 3 3 3 3-1 3 1 3-3-1-3 2-2V7l-3-1-1-3Z"/><circle cx="12" cy="11" r="3"/>',
  arrow: '<path d="M4 12h15m-5-5 5 5-5 5"/>',
  back: '<path d="M20 12H5m5-5-5 5 5 5"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  check: '<path d="m5 12 4 4L19 6"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  spark: '<path d="m12 3 2.4 6.6L21 12l-6.6 2.4L12 21l-2.4-6.6L3 12l6.6-2.4Z"/>',
  send: '<path d="m3 3 18 9-18 9 4-9Zm4 9h14"/>',
  bell: '<path d="M5 16V9a7 7 0 0 1 14 0v7l2 3H3Zm5 6h4"/>',
  shield: '<path d="m12 3 8 3v6c0 5-8 9-8 9s-8-4-8-9V6Z"/><path d="m8 12 3 3 5-6"/>',
  close: '<path d="m6 6 12 12M6 18 18 6"/>',
  download: '<path d="M12 3v12m-4-4 4 4 4-4M4 16v5h16v-5"/>',
  link: '<path d="m10 13 4-4m-6 6-2 2a4 4 0 0 1-6-6l4-4a4 4 0 0 1 6 0m4 2 2-2a4 4 0 0 1 6 6l-4 4a4 4 0 0 1-6 0" transform="translate(1 -1)"/>',
  wallet: '<rect x="3" y="5" width="18" height="15" rx="2"/><path d="M17 11h4v5h-4a2.5 2.5 0 0 1 0-5ZM3 8V5l14-3v3"/>',
  leaf: '<path d="M20 3C9 2 2 8 5 15s16 4 15-12ZM4 21l11-12"/>'
};
const icon = name => `<svg class="icon" viewBox="0 0 24 24" aria-hidden="true">${iconPaths[name] || iconPaths.quotes}</svg>`;
const money = value => formatMoney(Number(value) || 0);
const state = () => store.state;
const customerFor = q => state().customers.find(c => c.id === q.customerId) || { name: 'Sample customer', initials: 'SC' };
const dateLabel = date => date ? new Date(`${date.slice(0, 10)}T12:00:00Z`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'America/Chicago' }) : 'No reminder';
const statusLabel = s => ({ ready: 'Ready to share', user_confirmed_sent: 'Manually confirmed sent', negotiating: 'In conversation', won: 'Won · manually recorded', lost: 'Lost · manually recorded', paused: 'Paused', draft: 'Draft' }[s] || s);
const route = () => location.hash.slice(1) || 'today';
const quoteId = () => route().split('/')[1] || 'quote-1';
const currentQuote = () => state().quotes.find(q => q.id === quoteId());
const navItems = [['today', 'home', 'Today'], ['quotes', 'quotes', 'Quotes'], ['portfolio', 'image', 'Portfolio'], ['customers', 'users', 'Customers'], ['settings', 'settings', 'Settings']];
const uid = prefix => `${prefix}-${crypto.randomUUID()}`;

function art(c = {}) {
  const n = Number(String(c.id || 'case-1').split('-')[1]) || 1;
  const color = /^#[0-9a-f]{6}$/i.test(c.color || '') ? c.color : '#d7dac6';
  return `<svg viewBox="0 0 520 340" role="img" aria-label="Synthetic illustration: ${esc(c.title || 'a freshly painted room')}">
  <rect width="520" height="340" fill="${color}"/><path d="M0 0h65v255L0 288Z" fill="#edeadf"/><path d="M520 0h-65v255l65 33Z" fill="#c9c8b9" opacity=".55"/><path d="M0 270h520v70H0Z" fill="#c9b397"/><path d="m0 340 135-70m90 70 45-70m125 70-45-70m170 70-125-70" stroke="#af957b" opacity=".45"/><path d="M64 252h391v17H64Z" fill="#f2f0e7"/>
  <path d="M95 35h130v150H95Z" fill="#f6f5ed"/><path d="M105 45h110v130H105Z" fill="#c6d4cb"/><path d="M160 45v130M105 111h110" stroke="#f8f7ee" stroke-width="7"/><path d="m111 48 43 0-43 70Zm58 0h39l-39 74Z" fill="#e8efe2" opacity=".7"/><path d="m225 178 127 73H129Z" fill="#fcf7da" opacity=".25"/>
  ${n === 5 ? '<rect x="270" y="64" width="144" height="111" rx="2" fill="#ece8d7"/><path d="M342 66v109M270 120h144" stroke="#bcbaa9"/><path d="M330 84v18M352 84v18M330 137v18M352 137v18" stroke="#65705f" stroke-width="3"/><rect x="265" y="190" width="155" height="65" fill="#e5dfc7"/><path d="M255 184h172v9H255Z" fill="#787e69"/>' : '<rect x="287" y="62" width="73" height="92" fill="#edece1"/><rect x="294" y="69" width="59" height="78" fill="#d4c0a0"/><path d="M300 131c7-45 36-63 48-44v52h-48Z" fill="#8b9278"/><circle cx="336" cy="84" r="9" fill="#eae3c8"/>'}
  ${n === 3 ? '<rect x="277" y="183" width="112" height="13" rx="4" fill="#987e5d"/><path d="M288 196v64m90-64v64" stroke="#836b4e" stroke-width="6"/><path d="M302 168h23v15h-23Z" fill="#d2b091"/><path d="M313 168v-33m0 15-13-9m13 20 12-12" stroke="#6f8060" stroke-width="4"/>' : '<ellipse cx="278" cy="288" rx="136" ry="23" fill="#a68d73" opacity=".16"/><rect x="161" y="208" width="224" height="54" rx="11" fill="#e6e0d0"/><rect x="178" y="180" width="190" height="64" rx="13" fill="#efebe1"/><rect x="158" y="209" width="23" height="57" rx="9" fill="#ded6c5"/><rect x="367" y="209" width="23" height="57" rx="9" fill="#ded6c5"/><path d="M181 263v15m185-15v15" stroke="#816e53" stroke-width="6"/><rect x="192" y="190" width="48" height="39" rx="8" fill="#a7af98" transform="rotate(-8 216 209)"/><rect x="311" y="192" width="43" height="37" rx="8" fill="#c5a581" transform="rotate(9 332 210)"/>'}
  <path d="M426 259h31l-5 33h-22Z" fill="#b39273"/><path d="M441 261v-77" stroke="#708464" stroke-width="4"/><ellipse cx="429" cy="217" rx="10" ry="22" fill="#849679" transform="rotate(-37 429 217)"/><ellipse cx="452" cy="201" rx="10" ry="24" fill="#758b6a" transform="rotate(29 452 201)"/><ellipse cx="451" cy="237" rx="9" ry="19" fill="#93a080" transform="rotate(38 451 237)"/>
  <path d="M60 184v80m-21-80h42l-11-33H50Z" stroke="#857958" stroke-width="3" fill="#ede5cf"/>
  </svg>`;
}

function brand() { return `<span class="brand"><span class="brand-mark">${icon('quotes')}</span><span>QuoteDesk<small>STUDIO</small></span></span>`; }
function navigation(bottom = false) {
  const active = route().split('/')[0];
  return `<nav class="${bottom ? 'bottom-nav' : 'nav'}" aria-label="${bottom ? 'Mobile navigation' : 'Main navigation'}">${navItems.map(([id, ic, label]) => `<a href="#${id}" class="${active === id || (id === 'quotes' && ['quote', 'preview'].includes(active)) ? 'active' : ''}" ${active === id ? 'aria-current="page"' : ''}>${icon(ic)}<span>${label}</span>${id === 'today' && !bottom ? `<span class="count">${state().quotes.filter(q => q.nextFollowup && q.nextFollowup <= '2026-09-17').length}</span>` : ''}</a>`).join('')}</nav>`;
}
function shell(content) {
  const r = route().split('/')[0];
  const title = ({ today: 'Today', quotes: 'Quotes', quote: 'Quote details', portfolio: 'Portfolio', customers: 'Customers', settings: 'Settings & billing', preview: 'Client preview' })[r] || 'Today';
  return `<aside class="sidebar"><a href="#today" aria-label="QuoteDesk Studio home">${brand()}</a><div class="workspace"><div class="avatar">O&L</div><div><b>Oak & Lime Painting</b><span>Example workspace</span></div></div>${navigation()}<div class="sidebar-bottom"><div class="help-card"><b>A little follow-up goes a long way.</b><p>Your next conversation starts with your best work.</p><a href="#portfolio">Explore your portfolio ${icon('arrow')}</a></div><div class="profile"><div class="avatar">AL</div><div>Alex Lane<small>Demo owner · ${esc(state().planId)} plan</small></div></div></div></aside><div class="page-shell"><header class="topbar"><div class="mobile-brand"><a href="#today">${brand()}</a></div><div class="breadcrumbs">Workspace <span>/</span> <b>${title}</b></div><div class="topbar-right"><span class="demo-pill"><span class="dot"></span>PUBLIC DEMO</span><span class="subtle">${r === 'preview' ? 'Private preview' : 'Sep 17, 2026'}</span>${icon('bell')}</div></header><main class="main" id="main" tabindex="-1">${storageWarning ? `<div class="notice error">${esc(storageWarning)}</div>` : ''}${state().scenario !== 'normal' ? `<div class="notice scenario-flag"><span>Demo scenario: <b>${esc(scenarioLabel(state().scenario))}</b>. Synthetic records only.</span><button class="text-btn" data-action="reset">Reset examples</button></div>` : ''}<div class="notice quiet"><strong>In-development product · Public interaction demo</strong><br>This snapshot uses the project's earlier browser prototype. The newer Flutter app and local backend are not deployed here. Synthetic records only; edits stay in this browser. <a href="../portfolio/">Back to selected work</a></div>${content}${footer()}</main></div>${navigation(true)}`;
}
function scenarioLabel(id) { return ({ normal: 'Normal', 'empty-portfolio': 'No cases', 'no-credits': 'No AI credits', 'upload-error': 'Upload failure', 'permission-denied': 'Photo permission denied', 'ai-error': 'AI service error' })[id]; }
function footer() {
  return `<footer class="footer"><span>Made for the work after the estimate.</span><span>Synthetic examples · No messages sent · No real payments · America/Chicago</span></footer><details class="demo-controls"><summary>Demo controls & test scenarios</summary><div class="control-content"><label for="scenario">Scenario</label><select id="scenario">${['normal', 'empty-portfolio', 'no-credits', 'upload-error', 'permission-denied', 'ai-error'].map(s => `<option value="${s}" ${state().scenario === s ? 'selected' : ''}>${scenarioLabel(s)}</option>`).join('')}</select><button class="btn small" data-action="reset">Reset examples</button><p>Changing scenarios replaces local demo edits. Fixed demo date: Sep 17, 2026.</p></div></details>`;
}
function heading(eyebrow, title, subtitle, action = '') { return `<div class="page-heading"><div><div class="eyebrow">${eyebrow}</div><h1>${title}</h1><p>${subtitle}</p></div>${action}</div>`; }
function empty(title, text, action = '') { return `<div class="empty">${icon('image')}<h2>${title}</h2><p>${text}</p>${action}</div>`; }
function caseCard(c, selectable = false) {
  const selected = state().selectedCaseIds.includes(c.id);
  const tag = selectable ? 'button' : 'article';
  return `<${tag} class="case-card ${selectable ? 'selectable' : ''} ${selectable && selected ? 'selected' : ''}" ${selectable ? `data-action="select-case" data-id="${esc(c.id)}" aria-pressed="${selected}" aria-label="${selected ? 'Deselect' : 'Select'} ${esc(c.title)}"` : ''}><div class="case-art">${art(c)}</div>${selectable ? `<span class="case-check">${selected ? icon('check') : ''}</span>` : ''}<div class="case-copy"><h3>${esc(c.title)}</h3><p>${esc(c.tag)} · Synthetic illustration</p></div></${tag}>`;
}
function quoteCard(q, featured = false) {
  const c = customerFor(q);
  return `<article class="followup-card ${featured ? 'featured' : ''}"><div class="card-top"><div class="avatar">${esc(c.initials)}</div><div class="customer-info"><h3>${esc(c.name)}</h3><p>${esc(q.title)}</p></div><div class="money">${money(q.amountCents)}</div></div><div class="reason">${icon(featured ? 'image' : 'clock')}<span>${esc(q.reason)} <span style="color:#9d957f">· ${dateLabel(q.nextFollowup)}</span></span></div><div class="card-bottom"><div class="last-event"><span class="tag ${featured ? 'orange' : 'gray'}">${esc(statusLabel(q.status))}</span><div style="margin-top:6px">${esc(q.lastEvent)}</div></div><a class="btn ${featured ? 'primary' : ''} small" href="#quote/${esc(q.id)}">${featured ? 'Prepare follow-up' : 'View quote'} ${icon('arrow')}</a></div></article>`;
}
function today() {
  const due = state().quotes.filter(q => q.nextFollowup && q.nextFollowup <= '2026-09-17');
  const open = state().quotes.filter(q => !['won', 'lost', 'paused'].includes(q.status));
  const first = state().cases[0];
  return `${heading('THURSDAY, SEPTEMBER 17 · DEMO DATE', 'Good morning, Alex.', 'A few thoughtful follow-ups. A little more momentum.', `<a class="btn" href="#quotes">${icon('quotes')} View quotes</a>`)}<section class="stats" aria-label="Workspace overview"><div class="stat"><span class="stat-icon orange">${icon('clock')}</span><div><div class="stat-label">Follow-ups today</div><div class="stat-value">${due.length}<span class="stat-note">Ready when you are</span></div></div></div><div class="stat"><span class="stat-icon">${icon('quotes')}</span><div><div class="stat-label">Open quotes</div><div class="stat-value">${open.length}<span class="stat-note">Conversations in progress</span></div></div></div><div class="stat"><span class="stat-icon">${icon('wallet')}</span><div><div class="stat-label">Open quote value</div><div class="stat-value">${money(open.reduce((sum, q) => sum + q.amountCents, 0))}</div></div></div></section><div class="today-grid"><section><div class="section-title"><h2>Your next conversations</h2><span class="subtle">${due.length} to follow up</span></div>${due.length ? due.map((q, i) => quoteCard(q, !i)).join('') : empty('A little breathing room.', 'No follow-ups are due on the demo date. Your saved quotes and reminders are still here.', '<a class="btn" href="#quotes">View your quotes</a>')}</section><aside class="today-aside"><div class="studio-card"><div class="studio-art">${art(first)}<span class="art-caption">SYNTHETIC ILLUSTRATION</span></div><div class="studio-copy"><span class="tiny-label">LET YOUR WORK SPEAK</span><h2>The right example.<br>A better conversation.</h2><p>Pair your estimate with a few relevant projects. Give your customer something to picture.</p><a class="btn small" href="#portfolio">Explore portfolio ${icon('arrow')}</a></div></div><div class="note-card">${icon('leaf')}<div><h3>A follow-up, on your terms.</h3><p>Review every draft. Choose when to share.<br>Nothing is sent automatically.</p></div></div></aside></div><section class="portfolio-strip"><div class="section-title"><h2>A little inspiration from your library</h2><a class="text-btn" href="#portfolio">View all ${icon('arrow')}</a></div>${state().cases.length ? `<div class="portfolio-grid">${state().cases.slice(0, 3).map(c => caseCard(c)).join('')}</div>` : empty('Your portfolio starts here.', 'Add a sample illustration to explore the local sharing workflow.', '<button class="btn" data-action="upload">Add sample image</button>')}</section>`;
}
function quotes() {
  return `${heading('KEEP THE CONVERSATION GOING', 'Your quotes.', 'Every estimate, with its next step close at hand.')}<div class="notice quiet">Sample records are already prepared for this demo. Amounts and scopes are human-reviewed examples; no new quote or real customer account is created here.</div><section class="quote-list">${state().quotes.length ? state().quotes.map((q, i) => quoteCard(q, !i)).join('') : empty('No quotes here yet.', 'Your demo records were deleted. Restore synthetic examples when you are ready.', '<button class="btn" data-action="reset">Restore examples</button>')}</section>`;
}
function portfolio() {
  const active = state().quotes.find(q => q.id === state().activeQuoteId) || state().quotes[0];
  return `${heading('YOUR WORK, ALL TOGETHER', 'A portfolio worth sharing.', 'Select the examples that fit the conversation.', '<button class="btn primary" data-action="upload">' + icon('plus') + ' Add sample image</button>')}<div class="notice quiet">All images are self-made synthetic illustrations, not photographs or completed customer projects. Examples are private until you choose them for a local preview. “Add sample image” simulates upload; no files or device permissions are accessed.</div>${state().cases.length ? `<div class="section-title"><h2>Sample project library</h2><span class="subtle">${state().cases.length} examples · ${state().selectedCaseIds.length} selected</span></div><div class="portfolio-grid">${state().cases.map(c => caseCard(c, true)).join('')}</div><div class="actions"><a class="btn primary" href="${active ? '#quote/' + esc(active.id) : '#quotes'}">${active ? 'Continue with ' + esc(customerFor(active).name.split(' ')[0]) + '’s quote' : 'View quotes'} ${icon('arrow')}</a><span class="help-text">Selected images are saved locally.</span></div>` : empty('Make room for your best work.', 'There are no sample cases in this scenario. Add a synthetic image, or write a manual follow-up from the quote.', '<button class="btn primary" data-action="upload">Add sample image</button><a class="btn" href="#quote/quote-1" style="margin:8px">Open quote</a>')}`;
}
function quoteDetail() {
  const q = currentQuote();
  if (!q) return empty('This quote is unavailable.', 'The local data may have been deleted. You can restore synthetic examples.', '<button class="btn" data-action="reset">Restore examples</button>');
  store.activateQuote(q.id);
  persist();
  const c = customerFor(q), credits = state().credits.monthly + state().credits.purchased;
  const share = store.getShare();
  return `<div class="quote-page"><a href="#today" class="back">${icon('back')} Back to Today</a>${heading('QUOTE · ' + esc(q.id.toUpperCase()), esc(c.name) + '’s next chapter.', esc(q.title), `<span class="tag green">${esc(statusLabel(q.status))}</span>`)}<div class="flow-steps"><span class="current"><b>1</b> Choose examples</span><span class="${state().draft ? 'current' : ''}"><b>2</b> Review draft</span><span class="${share ? 'current' : ''}"><b>3</b> Preview & follow up</span></div><div class="quote-layout"><div><section class="panel"><span class="step-label">THE ESTIMATE</span><div class="quote-summary"><div class="customer-info"><h3>${esc(q.title)}</h3><p>Prepared for ${esc(c.name)}</p></div><div class="money">${money(q.amountCents)}</div></div><p class="scope">${esc(q.scope)}</p><dl class="meta-grid"><div><dt>Valid through</dt><dd>${dateLabel(q.validUntil)}, 2026</dd></div><div><dt>Quote version</dt><dd>Version ${esc(q.version || 1)} · USD</dd></div></dl></section><section class="panel" id="case-picker"><span class="step-label">01 / SHOW YOUR WORK</span><div class="flow-header"><h2>A few examples, picked for them.</h2><span class="tag green">${state().selectedCaseIds.length} selected</span></div><p>Try selecting three images. Only your selected, approved examples appear in the local customer preview.</p>${state().cases.length ? `<div class="portfolio-grid workflow-grid">${state().cases.map(c => caseCard(c, true)).join('')}</div>` : empty('No examples yet.', 'Add a sample image to try the preview. You can still write, manually record a follow-up, and set a reminder for free.', '<button class="btn" data-action="upload">Add sample image</button>')}<p class="help-text">Synthetic illustrations only · No prior homeowner details or project prices</p></section><section class="panel" id="draft-panel"><span class="step-label">02 / MAKE IT PERSONAL</span><div class="flow-header"><h2>Your words. A helpful first draft.</h2><span class="tag gray">${credits} AI credits left</span></div><p>Start with a simulated AI suggestion, or write your own for free. Review the recipient, quote amount, scope, and wording before you continue.</p>${credits === 0 ? '<div class="notice">Your AI balance is empty. Manual writing, sharing previews, reminders, history, and export remain free.</div>' : ''}<label class="label" for="draft">Follow-up message</label><textarea id="draft" class="field" maxlength="${config.limits.maximum_input_characters_per_draft}" placeholder="Hi ${esc(c.name.split(' ')[0])}, here are a few examples to go with your painting estimate…">${esc(state().draft)}</textarea><div class="actions split-actions"><button class="btn" data-action="generate" data-id="${esc(q.id)}">${icon('spark')} ${state().draft ? 'Generate a new draft' : 'Generate a draft'} · 1 credit</button><span class="saved-label" id="draft-saved">Edits save locally as you type</span></div><p class="help-text">AI is simulated. Only a successful new draft uses 1 credit. Technical failures do not. Editing and copying cost 0 credits.</p><div class="actions"><button class="btn primary" data-action="preview" data-id="${esc(q.id)}">Preview for customer ${icon('arrow')}</button><button class="text-btn" data-action="manual-copy">Simulate copying text</button></div><p class="help-text">Preview freezes this quote version, draft, and selected illustrations. A new preview replaces the previous local preview.</p></section></div><aside class="quote-aside"><section class="panel side-panel"><h3>The next conversation</h3><p>${esc(q.reason)}. Your last recorded event is shown below; no replies or views are detected automatically.</p><div class="activity"><div class="activity-item"><b>Last recorded event</b>${esc(q.lastEvent)}</div><div class="activity-item"><b>Next reminder</b>${dateLabel(q.nextFollowup)}${q.nextFollowup ? ', 2026 · America/Chicago' : ''}</div><div class="activity-item"><b>Sending status</b>${esc(statusLabel(q.status))}</div></div><button class="btn full" data-action="reminder" data-id="${esc(q.id)}">${icon('clock')} Set a reminder</button><div class="actions"><button class="text-btn" data-action="confirm-sent" data-id="${esc(q.id)}">Manually confirm sent</button></div><p class="help-text">Local record only. No email, SMS, or push notification is sent.</p></section><section class="panel side-panel"><h3>Keep the record up to date</h3><label class="label" for="quote-status">Manually recorded outcome</label><div class="status-form"><select id="quote-status" class="field"><option value="negotiating">In conversation / reopen</option><option value="won">Won</option><option value="lost">Lost</option><option value="paused">Paused</option></select><button class="btn small" data-action="status" data-id="${esc(q.id)}">Save</button></div><p class="help-text">Won, lost, and paused quotes stop future reminders.</p>${state().share?.quoteId === q.id ? `<hr style="border:0;border-top:1px solid var(--line);margin:20px 0"><h3>Customer preview</h3><p>${share ? 'A local snapshot is ready to review.' : 'This local preview is unavailable.'}</p><a class="btn full" href="#preview">View local preview</a>${share ? '<button class="text-btn" style="margin-top:13px" data-action="revoke">Revoke preview</button>' : ''}` : ''}</section></aside></div></div>`;
}
function customers() {
  return `${heading('PEOPLE BEHIND THE PROJECTS', 'Good work starts here.', 'A little context for your next conversation.')}<div class="notice quiet">These customers are fictional, with reserved example email addresses. No contacts, email accounts, or address books are connected.</div><section class="customers-grid">${state().customers.length ? state().customers.map(c => { const qs = state().quotes.filter(q => q.customerId === c.id); return `<article class="panel customer-card"><div class="avatar">${esc(c.initials)}</div><h2>${esc(c.name)}</h2><p>${esc(c.email)}</p><span class="tag gray">${qs.length} sample quote${qs.length === 1 ? '' : 's'}</span><div class="actions">${qs.map(q => `<a class="text-btn" href="#quote/${esc(q.id)}">View ${money(q.amountCents)} quote ${icon('arrow')}</a>`).join('')}</div></article>`; }).join('') : empty('No customer records.', 'Deleted demo data stays deleted after refresh. Restore examples to explore again.', '<button class="btn" data-action="reset">Restore examples</button>')}</section>`;
}
function settings() {
  const p = config.plans.find(p => p.id === state().planId), topup = config.topups[0];
  return `${heading('ROOM TO GROW, ON YOUR TERMS', 'Your plan & your data.', 'Explore draft pricing with simulated payments. No card. No charge.')}<div class="notice">Local simulation only. All prices and limits are product hypotheses. Checkout is unavailable in production; no payment service or account is connected.</div><div class="billing-usage"><section class="panel"><span class="step-label">AI DRAFT CREDITS</span><div class="usage-number">${state().credits.monthly + state().credits.purchased}<small> credits available</small></div><div class="meter"><span style="width:${Math.max(0, Math.min(100, state().credits.monthly / p.monthly_credits * 100))}%"></span></div><p class="help-text">${state().credits.monthly} of ${p.monthly_credits} monthly credits remaining · ${state().credits.purchased} purchased credits</p><p class="help-text">${state().planId === 'free' ? `The starter sample uses 2 monthly credits, so a fresh normal demo begins at ${Math.max(0, p.monthly_credits - 2)} of ${p.monthly_credits}.` : 'Solo replaces the monthly allowance after simulated confirmation.'} Monthly credits are used first and reset each month. Purchased credits do not expire.</p><p class="help-text">One successful AI follow-up draft = 1 credit. Manual follow-ups, reminders, and images use 0.</p></section><section class="panel"><span class="step-label">A LITTLE EXTRA, WHEN YOU NEED IT</span><h2>${topup.credits} more drafts. ${money(topup.price_cents)} once.</h2><p>Try a credit pack without changing your plan. Repeat purchases are possible; each pack requires a separate review and confirmation.</p><div class="actions"><button class="btn" data-action="payment" data-product="${esc(topup.id)}">Review simulated ${money(topup.price_cents)} pack ${icon('arrow')}</button></div><p class="help-text">One-time purchase · No auto-renewal · No storage increase</p>${state().lastPayment ? `<p class="help-text">Last simulated payment: ${money(state().lastPayment.amountCents)} · ${esc(state().lastPayment.status.replaceAll('_', ' '))}</p>` : ''}</section></div><div class="section-title"><h2>Find your fit</h2><span class="subtle">USD · Draft pricing</span></div><div class="billing-grid">${config.plans.map(plan => `<section class="panel plan-card ${plan.id === 'solo' ? 'featured' : ''}"><div class="flow-header"><h2>${plan.id[0].toUpperCase() + plan.id.slice(1)}</h2>${state().planId === plan.id ? '<span class="tag green">Current plan</span>' : ''}</div><div class="plan-price">${money(plan.monthly_cents)}<span> / month</span></div><ul><li>${plan.monthly_credits} AI credits / month</li><li>${plan.active_quotes} active quotes</li><li>${plan.storage_mb} MB storage</li><li>${plan.seats} ${plan.seats === 1 ? 'seat' : 'seats · planned'}</li><li>Manual follow-up & data export</li></ul>${plan.id === 'team' ? '<button class="btn" disabled>Team features not delivered</button>' : plan.id === state().planId ? '<button class="btn" disabled>Current simulated plan</button>' : plan.id === 'free' ? '<button class="btn" data-action="cancel-plan">Schedule switch to Free</button>' : '<button class="btn primary" data-action="payment" data-product="solo">Review simulated Solo</button>'}<p class="help-text">${plan.id === 'free' ? 'Keep historical records, exports, and deletion.' : `Annual hypothesis: ${money(plan.annual_cents)} / year. Annual checkout unavailable.`}</p></section>`).join('')}</div>${state().planId !== 'free' ? `<div class="panel" style="margin-top:22px"><h2>Subscription control</h2><p>Cancel renewal in this simulation. Your current plan and remaining credits stay available through the simulated paid period. No automatic period transition runs here.</p>${state().pendingPlanId === 'free' ? '<div class="notice quiet" style="margin:0">Cancellation scheduled in the simulation. The plan will switch to Free at period end; this demo does not advance billing time.</div>' : '<button class="btn" data-action="cancel-plan">Review cancellation</button>'}</div>` : ''}<section class="panel data-actions"><div><h2>Your data stays yours.</h2><p>Export or delete your local demo records on every plan.<br>Deletion removes customers, quotes, images, drafts, previews, and history.</p></div><div class="actions"><button class="btn" data-action="export">${icon('download')} Export JSON</button><button class="btn danger" data-action="delete">Delete local data</button></div></section>`;
}
function preview() {
  const share = store.getShare();
  if (!share) return `${heading('LOCAL CUSTOMER PREVIEW', 'This preview is unavailable.', 'A revoked or expired preview cannot be opened again.')}<div class="notice quiet">This demo never creates a separate shareable customer URL. Revocation stops future preview access here; it cannot erase a screenshot or an already downloaded copy.</div>${empty('The preview has been closed.', 'Return to a quote to select images and create a new local snapshot.', '<a class="btn primary" href="#quotes">Back to quotes</a>')}`;
  const q = share.quoteSnapshot;
  return `<div class="preview-toolbar"><a href="#quote/${esc(share.quoteId)}" class="back" style="margin:0">${icon('back')} Back to quote</a><div class="actions"><button class="btn small" data-action="share">${icon('send')} Simulate share</button><button class="btn small" data-action="revoke">Revoke preview</button></div></div><div class="notice quiet">Local customer-view simulation · No separate customer link exists. No account or contact details are exposed. Anyone with a real private link could forward it; production access controls are not implemented here.</div><article class="preview-page"><div class="preview-brand"><span class="brand-mark">${icon('leaf')}</span><div>Oak & Lime Painting<small>Fictional contractor · Local demo</small></div></div><span class="tag green">YOUR PAINTING ESTIMATE · VERSION ${esc(q.version || 1)}</span><h1>${esc(q.title)}</h1><p class="scope">A thoughtful refresh, with a few ideas to help you picture it.</p><div class="quote-summary"><div><div class="eyebrow">ESTIMATED TOTAL · USD</div><div class="money">${money(q.amountCents)}</div></div><span class="subtle">Valid through ${dateLabel(q.validUntil)}, 2026</span></div><p class="scope">${esc(q.scope)}</p>${share.draft ? `<div class="preview-message">${esc(share.draft)}</div>` : ''}<div class="section-title" style="margin-top:30px"><h2>Selected project inspiration</h2><span class="subtle">${share.caseSnapshots?.length || 0} illustrations</span></div><div class="portfolio-grid">${(share.caseSnapshots || []).map(c => caseCard(c)).join('')}</div><p class="preview-note">All project visuals are synthetic illustrations, not photographs of completed work. This is a local demonstration, not a live offer. No customer email, address, original homeowner information, or previous project price is included.<br><br>Local preview expires ${dateLabel(share.expiresAt)}, 2026 (fixed demo clock). No read tracking, messaging, online signature, or project-payment collection.</p></article><section class="panel" style="max-width:850px;margin:23px auto 0"><span class="step-label">BACK IN YOUR WORKSPACE</span><h2>Shared it yourself?</h2><p>Opening the share simulation does not mean a message was sent, delivered, or read. Make a separate manual record when you choose.</p><div class="actions"><button class="btn primary" data-action="confirm-sent" data-id="${esc(share.quoteId)}">Manually confirm sent</button><button class="btn" data-action="reminder" data-id="${esc(share.quoteId)}">${icon('clock')} Set a reminder</button></div></section>`;
}

function render() {
  const name = route().split('/')[0];
  app.innerHTML = shell(({ today, quotes, quote: quoteDetail, portfolio, customers, settings, preview })[name]?.() || today());
  document.title = `${name === 'today' ? 'Today' : name[0]?.toUpperCase() + name.slice(1)} · QuoteDesk Studio demo`;
}
function persist() {
  try { localStorage.setItem(KEY, store.serialize()); }
  catch { storageWarning = 'Local storage is unavailable. You can keep exploring, but changes may be lost after refresh. Export a JSON copy to keep them.'; }
}
function toast(message, error = false) {
  const box = document.querySelector('#toast');
  clearTimeout(toastTimer); box.textContent = message; box.className = 'show' + (error ? ' error' : '');
  toastTimer = setTimeout(() => { box.className = ''; }, error ? 8500 : 5000);
}
function mutate(fn, success, rerender = true) {
  try { const result = fn(); persist(); if (rerender) render(); if (success) toast(typeof success === 'function' ? success(result) : success); return true; }
  catch (error) {
    const message = error.message || 'That action could not be completed. Try again.';
    if (dialog.open && document.querySelector('#dialog-error')) document.querySelector('#dialog-error').textContent = message;
    toast(message, true); return false;
  }
}
function openDialog(title, body, actions = '') {
  const opener = document.activeElement;
  dialogReturnFocus = opener?.dataset.action ? { action: opener.dataset.action, id: opener.dataset.id, product: opener.dataset.product } : null;
  dialog.innerHTML = `<button class="close-dialog" data-action="close-dialog" aria-label="Close dialog">${icon('close')}</button><div class="eyebrow">QUOTEDESK · LOCAL SIMULATION</div><h2 id="dialog-title">${title}</h2>${body}<div id="dialog-error" class="error-message" role="alert"></div><div class="dialog-actions"><button class="btn" data-action="close-dialog">Back</button>${actions}</div>`;
  dialog.showModal();
}
function closeDialog() {
  dialog.close(); paymentReview = null;
  const ref = dialogReturnFocus;
  const target = ref ? Array.from(document.querySelectorAll('#app [data-action]')).find(el => el.dataset.action === ref.action && el.dataset.id === ref.id && el.dataset.product === ref.product) : null;
  (target || document.querySelector('#main'))?.focus({ preventScroll: true });
  dialogReturnFocus = null;
}
function paymentDialog(productId) {
  const isSolo = productId === 'solo';
  const item = isSolo ? config.plans.find(p => p.id === productId) : config.topups.find(p => p.id === productId);
  if (!item) return;
  paymentReview = { productId, requestId: uid('payment') };
  openDialog(isSolo ? 'Try the Solo plan.' : 'A few more helpful drafts.', `<div class="notice">SIMULATED PAYMENT · No card, no charge, no external service.</div><div class="review-row"><span>Product</span><b>${isSolo ? 'Solo monthly' : `${item.credits} AI credit pack`}</b></div><div class="review-row"><span>Draft price</span><b>${money(item.monthly_cents ?? item.price_cents)}${isSolo ? ' / month' : ' one time'}</b></div><div class="review-row"><span>Credits</span><b>${item.monthly_credits ?? item.credits}${isSolo ? ' monthly' : ' non-expiring'}</b></div><p>${isSolo ? 'In a real subscription, renewal would be monthly until canceled. This simulation replaces your monthly credit balance with the Solo allowance, preserves purchased credits, and performs no actual renewal.' : 'This is a one-time pack. It does not auto-renew or change your plan. Purchased credits remain after a monthly reset; monthly credits are spent first.'}</p><label class="label" for="payment-outcome">Simulated result</label><select class="field" id="payment-outcome"><option value="success">Successful payment</option><option value="failed">Failed payment (test recovery)</option></select>`, '<button class="btn primary" data-action="confirm-payment">Confirm simulated payment</button>');
}

document.addEventListener('click', event => {
  const button = event.target.closest('[data-action]');
  if (!button || button.disabled) return;
  const action = button.dataset.action, id = button.dataset.id;
  if (action === 'reload') return location.reload();
  if (action === 'close-dialog') return closeDialog();
  if (action === 'select-case') { const y = scrollY; if (mutate(() => store.selectCase(id))) { window.scrollTo(0, y); document.querySelector(`[data-action="select-case"][data-id="${CSS.escape(id)}"]`)?.focus({ preventScroll: true }); } }
  if (action === 'upload') mutate(() => store.simulateUpload(), value => value);
  if (action === 'generate') {
    const generate = () => mutate(() => store.generateDraft(id, uid('draft')), 'Simulated draft ready. 1 credit used. Review and edit before sharing.');
    if (state().draft.trim()) openDialog('Replace your current draft?', '<p>A successful new simulated draft will use 1 credit and replace your current text. A technical failure uses no credits.</p>', `<button class="btn primary" data-action="confirm-generate" data-id="${esc(id)}">Generate new draft · 1 credit</button>`);
    else generate();
  }
  if (action === 'confirm-generate') { mutate(() => store.generateDraft(id, uid('draft')), 'New simulated draft ready. 1 credit used.'); closeDialog(); }
  if (action === 'preview') { if (mutate(() => store.createShare(id), 'Local snapshot created. Nothing was sent.', false)) location.hash = 'preview'; }
  if (action === 'manual-copy') toast('Copy action simulated. No clipboard or message was changed; nothing was sent.');
  if (action === 'share') {
    if (mutate(() => store.openShare(), null, false)) openDialog('Your sharing step, simulated.', '<p>A real product would open your device’s sharing options. This local demo does not open a messaging app, copy a public link, or send anything.</p><div class="notice quiet">Recorded: share opened.<br>Sending status has not changed.</div><p>Return to the preview, then use “Manually confirm sent” only as a separate simulated record.</p>', '<button class="btn primary" data-action="close-dialog">Return to preview</button>');
  }
  if (action === 'confirm-sent') openDialog('Record a manual send?', '<p>This records your own confirmation, not a delivery receipt or customer reply. In this local demo, no actual message has been sent.</p><label class="checkbox-label"><input type="checkbox" id="sent-confirmation">I understand this is a simulated manual record, not proof of delivery or reading.</label>', `<button class="btn primary" data-action="save-sent" data-id="${esc(id)}">Confirm manual record</button>`);
  if (action === 'save-sent') {
    if (!document.querySelector('#sent-confirmation').checked) { document.querySelector('#dialog-error').textContent = 'Please acknowledge the manual record before confirming.'; return; }
    if (mutate(() => store.confirmSent(id), 'Manually confirmed sent · simulation. No delivery or reply was inferred.')) closeDialog();
  }
  if (action === 'reminder') {
    const q = state().quotes.find(q => q.id === id);
    openDialog('Give the conversation a next step.', `<p>A reminder stays in your local workspace. No automatic follow-up message or push notification is sent.</p><label class="label" for="reminder-date">Next follow-up · America/Chicago</label><input class="field" type="date" id="reminder-date" value="${esc(q?.nextFollowup || '2026-09-20')}" min="2026-09-17"><p class="help-text">Today in this demo is September 17, 2026. Suggested first follow-up: September 20 (D+3).</p>`, `<button class="btn primary" data-action="save-reminder" data-id="${esc(id)}">Save local reminder</button>`);
  }
  if (action === 'save-reminder') { if (mutate(() => store.setReminder(id, document.querySelector('#reminder-date').value), 'Reminder saved locally. Check Today when it is due.')) closeDialog(); }
  if (action === 'status') mutate(() => store.setQuoteStatus(id, document.querySelector('#quote-status').value), 'Manual outcome saved. Won, lost, or paused quotes have no future reminder.');
  if (action === 'revoke') openDialog('Close this customer preview?', '<p>The local snapshot will become unavailable. Screenshots or already downloaded copies cannot be recalled. No real public link exists in this demo.</p>', '<button class="btn danger" data-action="confirm-revoke">Revoke local preview</button>');
  if (action === 'confirm-revoke') { mutate(() => store.revokeShare(), 'Preview revoked. It can no longer be opened.'); closeDialog(); if (route() !== 'preview') location.hash = 'preview'; }
  if (action === 'payment') paymentDialog(button.dataset.product);
  if (action === 'confirm-payment' && paymentReview) {
    try { const payment = store.simulatePayment(paymentReview.productId, paymentReview.requestId, document.querySelector('#payment-outcome').value); persist(); render(); closeDialog(); toast(`${money(payment.amountCents)} payment simulated. No real charge. Credits updated locally.`); }
    catch (error) { document.querySelector('#dialog-error').textContent = error.message; }
  }
  if (action === 'cancel-plan') openDialog('Keep control of your subscription.', '<p>Schedule a switch to Free at the end of the simulated paid period. Your current plan, remaining credits, history, and export stay available. No real subscription is canceled.</p>', '<button class="btn primary" data-action="confirm-cancel">Schedule simulated cancellation</button>');
  if (action === 'confirm-cancel') { if (mutate(() => store.scheduleCancellation(), 'Simulated cancellation scheduled. Current access remains.')) closeDialog(); }
  if (action === 'export') {
    const url = URL.createObjectURL(new Blob([store.exportData()], { type: 'application/json' }));
    const link = document.createElement('a'); link.href = url; link.download = 'quotedesk-synthetic-demo.json'; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000); toast('Synthetic demo data exported as JSON.');
  }
  if (action === 'delete') openDialog('Delete local demo data?', '<p>This removes all local sample customers, quotes, portfolio items, drafts, previews, and activity. It also clears simulated payment state. The empty workspace stays empty after refresh.</p><p>Export first if you want a copy. You can separately restore synthetic examples later.</p>', '<button class="btn danger" data-action="confirm-delete">Delete all local demo data</button>');
  if (action === 'confirm-delete') { mutate(() => store.deleteData(), 'Local demo data deleted. Examples will not return on refresh.'); closeDialog(); }
  if (action === 'reset') openDialog('Restore the sample workspace?', '<p>This replaces your local demo edits with the original synthetic examples and resets the simulated plan and credits. No real account or records are affected.</p>', '<button class="btn primary" data-action="confirm-reset">Restore examples</button>');
  if (action === 'confirm-reset') { mutate(() => store.reset(), 'Synthetic examples restored.'); closeDialog(); location.hash = 'today'; }
});
document.addEventListener('input', event => {
  if (event.target.id === 'draft') {
    try { store.saveDraft(event.target.value); persist(); const label = document.querySelector('#draft-saved'); if (label) label.textContent = storageWarning ? 'In-memory only · storage unavailable' : 'Saved locally'; }
    catch (error) { toast(error.message, true); }
  }
});
document.addEventListener('change', event => {
  if (event.target.id === 'scenario') {
    mutate(() => store.setScenario(event.target.value), 'Scenario loaded with fresh synthetic examples.');
    if (route() === 'preview') location.hash = 'quote/quote-1';
  }
});
window.addEventListener('hashchange', () => { if (dialog.open) closeDialog(); render(); window.scrollTo(0, 0); document.querySelector('#main')?.focus({ preventScroll: true }); });
dialog.addEventListener('click', event => { if (event.target === dialog) { const r = dialog.getBoundingClientRect(); if (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) closeDialog(); } });

async function init() {
  try {
    const response = await fetch('./config/plans.example.json', { cache: 'no-store' });
    if (!response.ok) throw new Error('The local pricing configuration could not be loaded.');
    config = await response.json();
    let saved;
    try { const raw = localStorage.getItem(KEY); if (raw) saved = JSON.parse(raw); }
    catch { storageWarning = 'Saved demo data could not be read. A fresh synthetic workspace is shown; local persistence may be unavailable.'; }
    store = new DemoStore(config, saved);
    if (store.restoreWarning) storageWarning = store.restoreWarning;
    try { render(); }
    catch { store = new DemoStore(config); storageWarning = 'Saved demo data was incompatible. A fresh synthetic workspace has been loaded.'; render(); }
  } catch (error) {
    app.innerHTML = `<main class="main"><div class="empty"><h1>The local studio could not open.</h1><p>${esc(error.message)}</p><p>Refresh this page to retry loading the demonstration.</p><button class="btn" data-action="reload">Try again</button></div></main>`;
  }
}
init();


