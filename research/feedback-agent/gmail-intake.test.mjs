import assert from 'node:assert/strict';
import { gmailSearchQuery, normaliseGmail } from './gmail-intake.mjs';

const message = {
  id: 'fictional-gmail-1',
  internal_date: '1789330000000',
  label_ids: ['INBOX'],
  payload: {
    mime_type: 'text/plain',
    headers: [
      { name: 'Delivered-To', value: 'receiver@example.invalid' },
      { name: 'From', value: 'Participant <participant@example.invalid>' },
      { name: 'To', value: 'Feedback <feedback@turbulentground.com>' },
      { name: 'Message-ID', value: '<synthetic-1@example.invalid>' },
    ],
    body: {
      content: 'The results are confusing.\n\nOn Monday someone wrote:\n> Earlier email',
    },
  },
};

const normalised = normaliseGmail(message);
assert.equal(normalised.disposition, 'Ready');
assert.equal(normalised.source.text, 'The results are confusing.');
assert.equal(normalised.source.contactEmail, 'participant@example.invalid');
assert.equal(normalised.source.intendedRecipient, 'feedback@turbulentground.com');
assert.equal(normaliseGmail({ ...message, id: 'forwarded-copy' }).source.id, normalised.source.id);
assert.equal(normaliseGmail({ ...message, label_ids: ['SENT'] }).disposition, 'Ignore');
assert.equal(normaliseGmail({
  ...message,
  payload: { ...message.payload, headers: [{ name: 'To', value: 'other@example.invalid' }] },
}).disposition, 'Ignore');
assert.equal(normaliseGmail({
  ...message,
  payload: { ...message.payload, parts: [{ filename: 'image.png', body: { attachment_id: 'fake' } }] },
}).disposition, 'Needs review');
assert.equal(normaliseGmail({
  ...message,
  payload: {
    ...message.payload,
    headers: [...message.payload.headers, { name: 'Auto-Submitted', value: 'auto-replied' }],
  },
}).disposition, 'Ignore');
assert.match(gmailSearchQuery, /to:feedback@turbulentground\.com/);
assert.match(gmailSearchQuery, /-in:spam/);

console.log('PASS: scoped Gmail intake, forwarding-safe recipient check, stable identity, reply separation and review paths');
