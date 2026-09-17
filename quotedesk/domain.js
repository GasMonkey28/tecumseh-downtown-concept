// M1 in-browser simulation only. This is NOT an authorization or billing backend.
export const formatMoney = cents => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: cents % 100 ? 2 : 0 }).format(cents / 100);
const clone = value => structuredClone(value);
const DEMO_NOW = '2026-09-17T15:00:00.000Z';
const scenarios = ['normal', 'empty-portfolio', 'no-credits', 'upload-error', 'permission-denied', 'ai-error'];
const record = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const strings = (value, keys) => record(value) && keys.every(key => typeof value[key] === 'string');
const validBalance = value => Number.isSafeInteger(value) && value >= 0;
function validSaved(saved, config) {
  return record(saved) && saved.schemaVersion === 1
    && Array.isArray(saved.quotes) && saved.quotes.every(q => strings(q, ['id', 'customerId', 'title', 'scope', 'validUntil', 'status', 'lastEvent', 'reason']) && validBalance(q.amountCents) && (q.nextFollowup === null || typeof q.nextFollowup === 'string'))
    && Array.isArray(saved.customers) && saved.customers.every(c => strings(c, ['id', 'name', 'initials', 'email']))
    && Array.isArray(saved.cases) && saved.cases.every(c => strings(c, ['id', 'title', 'tag', 'description', 'color']) && typeof c.authorized === 'boolean' && c.synthetic === true)
    && Array.isArray(saved.selectedCaseIds) && saved.selectedCaseIds.every(id => typeof id === 'string' && saved.cases.some(c => c.id === id))
    && Array.isArray(saved.events) && saved.events.every(e => strings(e, ['type', 'at', 'source']))
    && typeof saved.draft === 'string' && config.plans.some(p => p.id === saved.planId)
    && scenarios.includes(saved.scenario) && validBalance(saved.credits?.monthly) && validBalance(saved.credits?.purchased)
    && record(saved.draftRequests) && Object.values(saved.draftRequests).every(r => strings(r, ['quoteId', 'text']))
    && record(saved.paymentRequests) && Object.values(saved.paymentRequests).every(r => strings(r, ['id', 'productId', 'status', 'at']) && validBalance(r.amountCents))
    && (saved.activeQuoteId === undefined || saved.activeQuoteId === null || typeof saved.activeQuoteId === 'string')
    && (saved.draftsByQuote === undefined || (record(saved.draftsByQuote) && Object.values(saved.draftsByQuote).every(d => strings(d, ['draft']) && Array.isArray(d.selectedCaseIds) && d.selectedCaseIds.every(id => typeof id === 'string'))))
    && validBalance(saved.sequence) && typeof saved.demoNow === 'string' && Number.isFinite(Date.parse(saved.demoNow))
    && (saved.share === null || (strings(saved.share, ['id', 'quoteId', 'draft', 'expiresAt']) && typeof saved.share.revoked === 'boolean'
      && Array.isArray(saved.share.caseIds) && saved.share.caseIds.every(id => typeof id === 'string')
      && Array.isArray(saved.share.caseSnapshots) && saved.share.caseSnapshots.every(c => strings(c, ['id', 'title', 'tag', 'description', 'color']))
      && strings(saved.share.quoteSnapshot, ['title', 'scope', 'validUntil']) && validBalance(saved.share.quoteSnapshot.amountCents)));
}

function seed(config) {
  return {
    schemaVersion: 1, demoNow: DEMO_NOW, planId: 'free', pendingPlanId: null,
    credits: { monthly: Math.max(0, config.plans.find(p => p.id === 'free').monthly_credits - 2), purchased: 0 },
    customers: [
      { id: 'customer-1', name: 'Jordan Ellis', initials: 'JE', email: 'jordan@example.invalid' },
      { id: 'customer-2', name: 'Morgan Reed', initials: 'MR', email: 'morgan@example.invalid' },
      { id: 'customer-3', name: 'Taylor Brooks', initials: 'TB', email: 'taylor@example.invalid' }
    ],
    quotes: [
      { id: 'quote-1', customerId: 'customer-1', title: 'A fresh start for the living room', amountCents: 485000, scope: 'Interior repaint: living room and hallway walls, surface preparation, and two finish coats. Demo total includes all quoted charges; no additional tax is calculated in this prototype.', validUntil: '2026-10-01', status: 'ready', nextFollowup: '2026-09-17', lastEvent: 'Manually recorded: requested similar interior projects', reason: 'Asked to see similar work', version: 1 },
      { id: 'quote-2', customerId: 'customer-2', title: 'Exterior trim refresh', amountCents: 230000, scope: 'Preparation and repainting of exterior trim. Synthetic estimate.', validUntil: '2026-10-05', status: 'user_confirmed_sent', nextFollowup: '2026-09-17', lastEvent: 'Sample history: owner confirmed sending', reason: 'Check in on the estimate', version: 1 },
      { id: 'quote-3', customerId: 'customer-3', title: 'Kitchen cabinet repaint', amountCents: 365000, scope: 'Preparation and repainting of kitchen cabinet fronts. Synthetic estimate.', validUntil: '2026-10-07', status: 'negotiating', nextFollowup: '2026-09-18', lastEvent: 'Manually recorded: discussing colors', reason: 'Follow up on color choices', version: 1 }
    ],
    cases: [
      { id: 'case-1', title: 'Warm white living room', tag: 'Interior', description: 'Soft neutral walls and crisp trim.', color: '#e7ded0' },
      { id: 'case-2', title: 'Sage reading nook', tag: 'Interior', description: 'A calm green accent with a clean finish.', color: '#879887' },
      { id: 'case-3', title: 'Light-filled hallway', tag: 'Interior', description: 'A bright transition from room to room.', color: '#d6be9e' },
      { id: 'case-4', title: 'Charcoal exterior trim', tag: 'Exterior', description: 'A contrasting trim palette.', color: '#676f69' },
      { id: 'case-5', title: 'Cream kitchen cabinets', tag: 'Cabinets', description: 'Warm cabinet fronts with dark hardware.', color: '#ddd2b9' },
      { id: 'case-6', title: 'Blue bedroom accent', tag: 'Interior', description: 'A muted blue feature wall.', color: '#8a9ca7' }
    ].map(c => ({ ...c, authorized: true, synthetic: true })),
    selectedCaseIds: [], draft: '', activeQuoteId: 'quote-1', draftsByQuote: {}, share: null, events: [], scenario: 'normal', lastPayment: null,
    draftRequests: {}, paymentRequests: {}, sequence: 0
  };
}

export class DemoStore {
  constructor(config, saved) {
    this.config = clone(config);
    this.state = seed(config);
    // Saved data is only a local demo convenience, never trusted entitlement data.
    this.restoreWarning = saved !== undefined && !validSaved(saved, config)
      ? 'Saved demo data was damaged or outdated. Fresh synthetic examples were loaded.' : '';
    if (validSaved(saved, config)) {
      this.state = { ...this.state, ...clone(saved) };
    }
  }
  quote(id) {
    const quote = this.state.quotes.find(q => q.id === id);
    if (!quote) throw new Error('This sample quote is unavailable. Reset examples to start again.');
    return quote;
  }
  event(type, quoteId) {
    this.state.events.push({ id: ++this.state.sequence, type, quoteId: quoteId || null, at: DEMO_NOW, source: 'local_simulation' });
  }
  activateQuote(quoteId) {
    this.quote(quoteId);
    if (this.state.activeQuoteId === quoteId) return;
    if (this.state.activeQuoteId) this.state.draftsByQuote[this.state.activeQuoteId] = {
      draft: this.state.draft, selectedCaseIds: [...this.state.selectedCaseIds]
    };
    const prior = this.state.draftsByQuote[quoteId];
    this.state.activeQuoteId = quoteId;
    this.state.draft = prior?.draft || '';
    this.state.selectedCaseIds = (prior?.selectedCaseIds || []).filter(id => this.state.cases.some(c => c.id === id && c.authorized));
  }
  selectCase(id) {
    const item = this.state.cases.find(c => c.id === id);
    if (!item?.authorized || !item.synthetic) throw new Error('Only approved synthetic examples can be selected in this demo.');
    const selected = this.state.selectedCaseIds;
    this.state.selectedCaseIds = selected.includes(id) ? selected.filter(i => i !== id) : [...selected, id];
  }
  saveDraft(text) {
    if (String(text).length > this.config.limits.maximum_input_characters_per_draft) throw new Error('This draft is too long. Shorten it and try again.');
    this.state.draft = String(text);
  }
  generateDraft(quoteId, requestId) {
    const quote = this.quote(quoteId);
    this.activateQuote(quoteId);
    if (!requestId || typeof requestId !== 'string') throw new Error('A demo request ID is required.');
    const key = `request:${requestId}`;
    if (Object.hasOwn(this.state.draftRequests, key)) {
      const prior = this.state.draftRequests[key];
      if (prior.quoteId !== quoteId) throw new Error('This request ID belongs to a different quote.');
      this.state.draft = prior.text;
      return prior.text;
    }
    if (this.state.scenario === 'ai-error') throw new Error('The simulated draft service failed. No credit was used. Try again or write your own.');
    const credits = this.state.credits;
    if (credits.monthly + credits.purchased <= 0) throw new Error('No AI credits left. Write your own draft for free, or try a simulated credit pack.');
    const customer = this.state.customers.find(c => c.id === quote.customerId);
    const text = `Hi ${customer?.name.split(' ')[0] || 'there'}, just checking in on your painting estimate.${this.state.selectedCaseIds.length ? ' I’ve included a few selected project examples for you to review.' : ''} Let me know if you have any questions. Happy to talk through the details.`;
    credits[credits.monthly > 0 ? 'monthly' : 'purchased'] -= 1;
    this.state.draft = text;
    this.state.draftRequests[key] = { quoteId, text };
    this.event('mock_draft_generated', quoteId);
    return text;
  }
  createShare(quoteId) {
    const quote = this.quote(quoteId);
    this.activateQuote(quoteId);
    if (!this.state.selectedCaseIds.length) throw new Error('Choose at least one sample image to preview.');
    if (this.state.selectedCaseIds.some(id => !this.state.cases.find(c => c.id === id)?.authorized)) throw new Error('A selected image is no longer approved. Choose again.');
    this.state.share = { id: `local-preview-${++this.state.sequence}`, quoteId, caseIds: [...this.state.selectedCaseIds],
      caseSnapshots: this.state.selectedCaseIds.map(id => {
        const c = this.state.cases.find(item => item.id === id);
        return { id: c.id, title: c.title, tag: c.tag, description: c.description, color: c.color, synthetic: true };
      }), draft: this.state.draft,
      quoteSnapshot: { title: quote.title, amountCents: quote.amountCents, scope: quote.scope, validUntil: quote.validUntil, version: quote.version },
      revoked: false, expiresAt: '2026-10-17T15:00:00.000Z' };
    this.event('local_preview_created', quoteId);
    return clone(this.state.share);
  }
  getShare() {
    const share = this.state.share;
    return share && !share.revoked && Date.parse(share.expiresAt) > Date.parse(this.state.demoNow) ? clone(share) : null;
  }
  openShare() {
    if (!this.getShare()) throw new Error('This local preview has expired or was revoked. Create a new preview.');
    this.event('share_opened', this.state.share.quoteId);
    return 'Simulated share opened. Nothing was sent.';
  }
  confirmSent(quoteId) {
    const quote = this.quote(quoteId);
    if (['won', 'lost', 'paused'].includes(quote.status)) throw new Error('Reopen this quote before recording a follow-up.');
    quote.status = 'user_confirmed_sent';
    quote.lastEvent = 'Manually confirmed sent · simulation';
    this.event('user_confirmed_sent', quoteId);
  }
  revokeShare() {
    if (this.state.share) { this.state.share.revoked = true; this.event('local_preview_revoked', this.state.share.quoteId); }
  }
  setReminder(quoteId, date) {
    const quote = this.quote(quoteId);
    if (['won', 'lost', 'paused'].includes(quote.status)) throw new Error('Reminders are stopped for this quote. Reopen it first.');
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || Number.isNaN(Date.parse(date)) || new Date(date).toISOString().slice(0, 10) !== date || date < '2026-09-17') throw new Error('Choose a valid date on or after the demo date, September 17, 2026.');
    quote.nextFollowup = date;
    this.event('local_reminder_saved', quoteId);
  }
  setQuoteStatus(quoteId, status) {
    if (!['won', 'lost', 'paused', 'negotiating'].includes(status)) throw new Error('Unsupported quote status.');
    const quote = this.quote(quoteId);
    quote.status = status;
    if (['won', 'lost', 'paused'].includes(status)) quote.nextFollowup = null;
    quote.lastEvent = `Manually recorded: ${status}`;
    this.event(`manual_${status}`, quoteId);
  }
  simulatePayment(productId, requestId, outcome = 'success') {
    if (!['solo', 'boost_10'].includes(productId)) throw new Error('Team and annual checkout are unavailable. No real checkout exists in this demo.');
    if (!requestId || typeof requestId !== 'string') throw new Error('A demo payment request ID is required.');
    const key = `payment:${requestId}`;
    if (Object.hasOwn(this.state.paymentRequests, key)) {
      const prior = this.state.paymentRequests[key];
      if (prior.productId !== productId) throw new Error('This payment request belongs to a different product.');
      return clone(prior);
    }
    if (outcome !== 'success') throw new Error('Simulated payment failed. No charge was made and no credits were added.');
    const item = productId === 'solo' ? this.config.plans.find(p => p.id === productId) : this.config.topups.find(p => p.id === productId);
    if (productId === 'solo') {
      if (this.state.planId !== 'free') throw new Error('This workspace already has a simulated paid plan.');
      this.state.planId = 'solo'; this.state.pendingPlanId = null; this.state.credits.monthly = item.monthly_credits;
    } else { this.state.credits.purchased += item.credits; }
    const payment = { id: requestId, productId, amountCents: item.price_cents ?? item.monthly_cents, status: 'simulated_success', at: DEMO_NOW };
    this.state.lastPayment = payment; this.state.paymentRequests[key] = payment;
    this.event('mock_payment_success');
    return clone(payment);
  }
  scheduleCancellation() {
    if (this.state.planId === 'free') throw new Error('There is no simulated subscription to cancel.');
    this.state.pendingPlanId = 'free';
    this.event('mock_cancellation_scheduled');
  }
  setScenario(scenario) {
    if (!scenarios.includes(scenario)) throw new Error('Unknown demo scenario.');
    this.reset(); this.state.scenario = scenario;
    if (scenario === 'empty-portfolio') this.state.cases = [];
    if (scenario === 'no-credits') this.state.credits = { monthly: 0, purchased: 0 };
  }
  simulateUpload() {
    if (this.state.scenario === 'upload-error') throw new Error('Sample upload failed. Nothing was saved. Retry after selecting the normal scenario.');
    if (this.state.scenario === 'permission-denied') throw new Error('Photo permission denied (simulation). Your existing cases and manual follow-up remain available.');
    if (!this.state.cases.some(c => c.id === 'case-upload')) this.state.cases.push({ id: 'case-upload', title: 'New sample room', tag: 'Interior', description: 'A synthetic illustration added locally. No real image was uploaded.', color: '#b5bda8', authorized: true, synthetic: true });
    return 'Synthetic sample added locally. No file was uploaded.';
  }
  reset() { this.state = seed(this.config); }
  deleteData() {
    this.state = { ...seed(this.config), activeQuoteId: null, customers: [], quotes: [], cases: [], selectedCaseIds: [], credits: { monthly: 0, purchased: 0 } };
  }
  serialize() { return JSON.stringify(this.state); }
  exportData() { return JSON.stringify({ notice: 'Synthetic local demo data only. No real customer records or payments.', ...this.state }, null, 2); }
}
