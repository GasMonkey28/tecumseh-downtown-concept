import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { DemoStore, formatMoney } from '../quotedesk/domain.js';

const config = JSON.parse(await readFile(new URL('../quotedesk/config/plans.example.json', import.meta.url), 'utf8'));
const fresh = () => new DemoStore(config);
const selectThree = store => ['case-1', 'case-2', 'case-3'].forEach(id => store.selectCase(id));

test('free primary journey keeps sharing separate from manual sent confirmation', () => {
  const store = fresh();
  const startingCredits = structuredClone(store.state.credits);
  assert.equal(store.quote('quote-1').amountCents, 485000);
  selectThree(store);
  store.selectCase('case-3'); store.selectCase('case-3');
  store.saveDraft('Hi Jordan, here are the examples you requested.');
  assert.deepEqual(store.state.credits, startingCredits);
  const share = store.createShare('quote-1');
  assert.equal(share.caseIds.length, 3);
  assert.match(store.openShare(), /Nothing was sent/);
  assert.equal(store.quote('quote-1').status, 'ready');
  assert.equal(store.state.events.at(-1).type, 'share_opened');
  store.confirmSent('quote-1');
  assert.equal(store.quote('quote-1').status, 'user_confirmed_sent');
  store.setReminder('quote-1', '2026-09-21');
  assert.equal(store.quote('quote-1').nextFollowup, '2026-09-21');
  assert.deepEqual(store.state.credits, startingCredits);
});

test('successful AI generation consumes once and does not invent commercial promises', () => {
  const store = fresh(); selectThree(store);
  const draft = store.generateDraft('quote-1', 'request-1');
  assert.equal(store.state.credits.monthly, 7);
  assert.equal(store.generateDraft('quote-1', 'request-1'), draft);
  assert.equal(store.state.credits.monthly, 7);
  assert.equal(store.state.events.filter(e => e.type === 'mock_draft_generated').length, 1);
  assert.doesNotMatch(draft, /\$|discount|guarantee|tomorrow|days|licensed|insured/i);
  store.generateDraft('quote-1', 'request-2');
  assert.equal(store.state.credits.monthly, 6);
  assert.throws(() => store.generateDraft('quote-2', 'request-1'), /different quote/);
});

test('AI failure preserves draft and credits; same failed request can succeed on retry', () => {
  const store = fresh(); store.setScenario('ai-error'); store.saveDraft('My manual draft');
  const before = store.serialize();
  assert.throws(() => store.generateDraft('quote-1', 'retry'), /No credit was used/);
  assert.equal(store.serialize(), before);
  store.state.scenario = 'normal';
  store.generateDraft('quote-1', 'retry');
  store.generateDraft('quote-1', 'retry');
  assert.equal(store.state.credits.monthly, 7);
});

test('monthly credits are spent before purchased credits', () => {
  const store = fresh(); store.state.credits = { monthly: 1, purchased: 2 };
  store.generateDraft('quote-1', 'a');
  assert.deepEqual(store.state.credits, { monthly: 0, purchased: 2 });
  store.generateDraft('quote-1', 'b');
  assert.deepEqual(store.state.credits, { monthly: 0, purchased: 1 });
});

test('zero credit users retain the complete manual journey', () => {
  const store = fresh(); store.setScenario('no-credits');
  assert.throws(() => store.generateDraft('quote-1', 'zero'), /Write your own draft for free/);
  selectThree(store); store.saveDraft('Manual follow-up');
  store.createShare('quote-1'); store.openShare(); store.confirmSent('quote-1');
  store.setReminder('quote-1', '2026-09-20');
  assert.deepEqual(store.state.credits, { monthly: 0, purchased: 0 });
});

test('one-time simulated pack adds configured credits once per request', () => {
  const store = fresh();
  const pack = config.topups.find(p => p.id === 'boost_10');
  const result = store.simulatePayment('boost_10', 'pay-1');
  assert.equal(result.amountCents, pack.price_cents);
  assert.equal(result.status, 'simulated_success');
  store.simulatePayment('boost_10', 'pay-1');
  assert.deepEqual(store.state.credits, { monthly: 8, purchased: pack.credits });
  assert.equal(store.state.planId, 'free');
  store.simulatePayment('boost_10', 'pay-2');
  assert.equal(store.state.credits.purchased, pack.credits * 2);
  assert.throws(() => store.simulatePayment('solo', 'pay-1'), /different product/);
});

test('failed simulated payment has no side effects and retry grants only once', () => {
  const store = fresh(); const before = store.serialize();
  assert.throws(() => store.simulatePayment('boost_10', 'failed', 'failed'), /No charge was made/);
  assert.equal(store.serialize(), before);
  store.simulatePayment('boost_10', 'failed');
  store.simulatePayment('boost_10', 'failed');
  assert.equal(store.state.credits.purchased, 10);
});

test('Solo replaces monthly balance, preserves topups and cancellation retains current rights', () => {
  const store = fresh(); store.simulatePayment('boost_10', 'pack');
  const payment = store.simulatePayment('solo', 'solo');
  assert.equal(payment.amountCents, config.plans.find(p => p.id === 'solo').monthly_cents);
  assert.deepEqual(store.state.credits, { monthly: 200, purchased: 10 });
  store.generateDraft('quote-1', 'after-upgrade');
  store.simulatePayment('solo', 'solo');
  assert.equal(store.state.credits.monthly, 199);
  assert.throws(() => store.simulatePayment('solo', 'duplicate-subscription'), /already has/);
  store.scheduleCancellation();
  assert.equal(store.state.pendingPlanId, 'free');
  assert.equal(store.state.planId, 'solo');
  assert.deepEqual(store.state.credits, { monthly: 199, purchased: 10 });
  assert.throws(() => fresh().scheduleCancellation(), /no simulated subscription/);
});

test('amounts and quota derive from supplied config rather than hardcoded billing values', () => {
  const changed = structuredClone(config);
  Object.assign(changed.plans.find(p => p.id === 'free'), { monthly_credits: 15 });
  Object.assign(changed.plans.find(p => p.id === 'solo'), { monthly_credits: 240, monthly_cents: 2100 });
  Object.assign(changed.topups[0], { credits: 12, price_cents: 125 });
  const store = new DemoStore(changed);
  assert.equal(store.state.credits.monthly, 13);
  assert.equal(store.simulatePayment('boost_10', 'pack').amountCents, 125);
  assert.equal(store.simulatePayment('solo', 'plan').amountCents, 2100);
  assert.deepEqual(store.state.credits, { monthly: 240, purchased: 12 });
  assert.equal(formatMoney(125), '$1.25');
  assert.equal(formatMoney(485000), '$4,850');
});

test('Team, annual and unknown checkout products are blocked', () => {
  const store = fresh(); const before = store.serialize();
  for (const product of ['team', 'solo_annual', 'team_annual', 'annual', 'real_checkout']) {
    assert.throws(() => store.simulatePayment(product, product), /unavailable/);
  }
  assert.equal(store.serialize(), before);
  assert.equal(config.production_checkout_enabled, false);
  assert.equal(config.annual_checkout_enabled, false);
});

test('draft and quote snapshots remain immutable and omit customer contact metadata', () => {
  const store = fresh(); selectThree(store); store.saveDraft('Original message');
  const share = store.createShare('quote-1');
  store.saveDraft('Changed message'); store.selectCase('case-1');
  store.quote('quote-1').amountCents = 999999;
  assert.deepEqual(store.getShare(), share);
  assert.equal(share.quoteSnapshot.amountCents, 485000);
  assert.doesNotMatch(JSON.stringify(share), /example\.invalid|email|address|homeowner/i);
  share.quoteSnapshot.amountCents = 1;
  assert.equal(store.getShare().quoteSnapshot.amountCents, 485000);
});

test('revoked and expired previews are unavailable, including invalid expiry', () => {
  const store = fresh(); selectThree(store); store.createShare('quote-1');
  store.revokeShare(); assert.equal(store.getShare(), null);
  assert.throws(() => store.openShare(), /expired or was revoked/);
  store.createShare('quote-1'); store.state.demoNow = '2026-10-17T15:00:00.000Z';
  assert.equal(store.getShare(), null);
  store.state.share.expiresAt = 'invalid'; assert.equal(store.getShare(), null);
});

test('selected case snapshots freeze only approved display fields', () => {
  const store = fresh(); selectThree(store);
  Object.assign(store.state.cases[0], { email: 'private@example.invalid', address: 'Private residence', previousPrice: 99900 });
  const share = store.createShare('quote-1');
  assert.equal(share.caseSnapshots.length, 3);
  assert.equal(share.caseSnapshots[0].title, 'Warm white living room');
  assert.doesNotMatch(JSON.stringify(share.caseSnapshots), /email|address|previousPrice|private@example/);
  store.state.cases[0].title = 'Changed title'; store.state.cases.splice(1, 1);
  assert.deepEqual(store.getShare().caseSnapshots, share.caseSnapshots);
});

test('only approved synthetic samples may be selected', () => {
  const store = fresh();
  store.state.cases[0].authorized = false;
  store.state.cases[1].synthetic = false;
  for (const id of ['case-1', 'case-2', 'missing']) assert.throws(() => store.selectCase(id), /approved synthetic/);
  assert.throws(() => store.createShare('quote-1'), /Choose at least one/);
  store.selectCase('case-3'); store.state.cases[2].authorized = false;
  assert.throws(() => store.createShare('quote-1'), /no longer approved/);
});

for (const status of ['won', 'lost', 'paused']) {
  test(`${status} clears reminder and blocks further follow-ups until reopened`, () => {
    const store = fresh(); store.setReminder('quote-1', '2026-09-22'); store.setQuoteStatus('quote-1', status);
    assert.equal(store.quote('quote-1').nextFollowup, null);
    assert.throws(() => store.setReminder('quote-1', '2026-09-23'), /Reopen/);
    assert.throws(() => store.confirmSent('quote-1'), /Reopen/);
    store.setQuoteStatus('quote-1', 'negotiating'); store.setReminder('quote-1', '2026-09-23');
    assert.equal(store.quote('quote-1').nextFollowup, '2026-09-23');
  });
}

test('invalid dates and IDs fail clearly without mutations', () => {
  const store = fresh(); const before = store.serialize();
  for (const date of ['2026-09-16', '2026-02-30', '2026-13-01', 'tomorrow', '2026-9-20']) {
    assert.throws(() => store.setReminder('quote-1', date), /valid date/);
  }
  assert.throws(() => store.quote('absent'), /unavailable/);
  assert.throws(() => store.setQuoteStatus('quote-1', 'delivered'), /Unsupported/);
  assert.throws(() => store.generateDraft('quote-1', ''), /request ID/);
  assert.throws(() => store.simulatePayment('solo', ''), /request ID/);
  assert.throws(() => store.saveDraft('x'.repeat(config.limits.maximum_input_characters_per_draft + 1)), /too long/);
  assert.equal(store.serialize(), before);
});

test('empty portfolio is recoverable using a clearly synthetic sample', () => {
  const store = fresh(); store.setScenario('empty-portfolio');
  assert.equal(store.state.cases.length, 0);
  assert.throws(() => store.createShare('quote-1'), /at least one/);
  assert.match(store.simulateUpload(), /No file was uploaded/);
  store.simulateUpload(); assert.equal(store.state.cases.length, 1);
  assert.equal(store.state.cases[0].synthetic, true);
  store.selectCase('case-upload'); assert.ok(store.createShare('quote-1'));
});

for (const scenario of ['upload-error', 'permission-denied']) {
  test(`${scenario} adds no image and leaves manual path available`, () => {
    const store = fresh(); store.setScenario(scenario); const before = store.serialize();
    assert.throws(() => store.simulateUpload(), scenario === 'upload-error' ? /failed/ : /permission denied/);
    assert.equal(store.serialize(), before);
    selectThree(store); store.saveDraft('Still works'); store.createShare('quote-1');
    store.setScenario('normal'); assert.equal(store.state.cases.length, 6);
    assert.deepEqual(store.state.selectedCaseIds, []);
  });
}

test('export, deletion and reload work on Free without automatically restoring deleted records', () => {
  const store = fresh(); selectThree(store); store.generateDraft('quote-1', 'd'); store.createShare('quote-1');
  const exported = JSON.parse(store.exportData());
  assert.equal(exported.customers.length, 3); assert.match(exported.notice, /Synthetic/);
  store.deleteData();
  const restored = new DemoStore(config, JSON.parse(store.serialize()));
  for (const key of ['customers', 'quotes', 'cases', 'selectedCaseIds', 'events']) assert.deepEqual(restored.state[key], []);
  assert.equal(restored.state.draft, ''); assert.equal(restored.state.share, null);
  assert.deepEqual(restored.state.credits, { monthly: 0, purchased: 0 });
  assert.deepEqual(restored.state.draftRequests, {}); assert.deepEqual(restored.state.paymentRequests, {});
  assert.equal(JSON.parse(restored.exportData()).customers.length, 0);
  restored.reset(); assert.equal(restored.state.customers.length, 3);
});

test('events hold operational metadata only, not contacts, photos or message bodies', () => {
  const store = fresh(); selectThree(store); store.saveDraft('Private draft unique marker');
  store.createShare('quote-1'); store.openShare(); store.confirmSent('quote-1'); store.setReminder('quote-1', '2026-09-23');
  store.simulatePayment('boost_10', 'payment');
  const log = JSON.stringify(store.state.events);
  assert.doesNotMatch(log, /Jordan|Ellis|example\.invalid|Private draft|email|address|case-1|http/i);
  for (const event of store.state.events) assert.deepEqual(Object.keys(event).sort(), ['at', 'id', 'quoteId', 'source', 'type']);
});

test('saved request IDs still deduplicate after local reload', () => {
  const store = fresh(); store.generateDraft('quote-1', '__proto__'); store.simulatePayment('boost_10', '__proto__');
  const restored = new DemoStore(config, JSON.parse(store.serialize()));
  restored.generateDraft('quote-1', '__proto__'); restored.simulatePayment('boost_10', '__proto__');
  assert.deepEqual(restored.state.credits, { monthly: 7, purchased: 10 });
});

test('valid local state including preview restores without warning', () => {
  const store = fresh(); selectThree(store); store.saveDraft('Restored draft');
  store.createShare('quote-1'); store.simulatePayment('boost_10', 'restore-payment');
  const restored = new DemoStore(config, JSON.parse(store.serialize()));
  assert.equal(restored.restoreWarning, '');
  assert.deepEqual(restored.state, store.state);
  assert.deepEqual(restored.getShare(), store.getShare());
});

test('structurally damaged JSON cache falls back to examples with a warning', () => {
  const mutations = [
    state => { state.quotes = [null]; },
    state => { state.draftRequests = null; },
    state => { state.paymentRequests = []; },
    state => { state.share = 'x'; },
    state => { state.share.quoteSnapshot = null; },
    state => { state.share.caseSnapshots = [null]; },
    state => { delete state.share.caseSnapshots; },
    state => { state.credits.monthly = -1; },
    state => { state.customers[0].name = null; },
    state => { state.selectedCaseIds = ['missing-case']; }
  ];
  for (const mutate of mutations) {
    const store = fresh(); selectThree(store); store.createShare('quote-1');
    const saved = JSON.parse(store.serialize()); mutate(saved);
    const restored = new DemoStore(config, saved);
    assert.match(restored.restoreWarning, /damaged or outdated/);
    assert.deepEqual(restored.state, fresh().state);
    assert.doesNotThrow(() => restored.generateDraft('quote-1', 'after-recovery'));
  }
});

test('drafts and chosen examples stay with their quote across switching and reload', () => {
  const store = fresh(); selectThree(store);
  store.generateDraft('quote-1', 'jordan-draft');
  const jordanDraft = store.state.draft;
  assert.match(jordanDraft, /Hi Jordan/);
  store.activateQuote('quote-2');
  assert.equal(store.state.draft, ''); assert.deepEqual(store.state.selectedCaseIds, []);
  store.selectCase('case-4'); store.saveDraft('Hi Morgan, here is the exterior trim example.');
  const morganShare = store.createShare('quote-2');
  assert.match(morganShare.draft, /Hi Morgan/); assert.doesNotMatch(morganShare.draft, /Jordan/);
  assert.deepEqual(morganShare.caseIds, ['case-4']);
  store.activateQuote('quote-1');
  assert.equal(store.state.draft, jordanDraft);
  assert.deepEqual(store.state.selectedCaseIds, ['case-1', 'case-2', 'case-3']);
  const restored = new DemoStore(config, JSON.parse(store.serialize()));
  assert.equal(restored.restoreWarning, ''); assert.equal(restored.state.draft, jordanDraft);
  restored.activateQuote('quote-2');
  assert.match(restored.state.draft, /Hi Morgan/);
  assert.deepEqual(restored.state.selectedCaseIds, ['case-4']);
  restored.activateQuote('quote-1'); assert.equal(restored.state.draft, jordanDraft);
});

test('direct preview and generation calls activate the correct quote instead of copying prior content', () => {
  const store = fresh(); selectThree(store); store.saveDraft('Only for Jordan');
  assert.throws(() => store.createShare('quote-2'), /Choose at least one/);
  assert.equal(store.state.draft, ''); assert.deepEqual(store.state.selectedCaseIds, []);
  store.generateDraft('quote-2', 'morgan-auto'); assert.match(store.state.draft, /Hi Morgan/);
  store.activateQuote('quote-1'); assert.equal(store.state.draft, 'Only for Jordan');
});

test('switching drops newly unapproved selections and tolerates older saved state', () => {
  const store = fresh(); selectThree(store); store.saveDraft('Retained text');
  const old = JSON.parse(store.serialize()); delete old.activeQuoteId; delete old.draftsByQuote;
  const restored = new DemoStore(config, old);
  assert.equal(restored.restoreWarning, '');
  restored.activateQuote('quote-2'); restored.state.cases[0].authorized = false;
  restored.activateQuote('quote-1');
  assert.equal(restored.state.draft, 'Retained text');
  assert.deepEqual(restored.state.selectedCaseIds, ['case-2', 'case-3']);
});
