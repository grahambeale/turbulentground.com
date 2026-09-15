import { createHash } from 'node:crypto';

const FEEDBACK_ADDRESS = 'feedback@turbulentground.com';
const EXCLUDED_LABELS = new Set(['SENT', 'DRAFT', 'SPAM', 'TRASH']);

const digest = value => createHash('sha256').update(value).digest('hex');

function headerValues(message, name) {
  return (message.payload?.headers || [])
    .filter(header => header.name?.toLowerCase() === name.toLowerCase())
    .map(header => header.value || '');
}

function addressFrom(value = '') {
  const angle = value.match(/<([^<>@\s]+@[^<>\s]+)>/);
  if (angle) return angle[1].toLowerCase();
  const plain = value.match(/(?:^|[\s,;])([^\s,;<>]+@[^\s,;<>]+)(?:$|[\s,;])/);
  return plain?.[1]?.toLowerCase() || '';
}

function collectPlainText(part, result) {
  if (!part) return;
  if (part.filename || part.body?.attachment_id) {
    result.attachments.push(part.filename || 'attachment');
  }
  if (part.mime_type === 'text/plain' && typeof part.body?.content === 'string') {
    result.text.push(part.body.content);
  }
  for (const child of part.parts || []) collectPlainText(child, result);
}

function newReplyText(original) {
  const cutoff = original.search(
    /^(?:On .+ wrote:|>+|[- ]*Original Message[- ]*|Begin forwarded message:)/m,
  );
  return (cutoff >= 0 ? original.slice(0, cutoff) : original).trim();
}

export function normaliseGmail(message) {
  const labels = message.label_ids || [];
  if (labels.some(label => EXCLUDED_LABELS.has(label))) {
    return { disposition: 'Ignore', reason: 'Excluded mailbox state' };
  }

  const recipients = [...headerValues(message, 'to'), ...headerValues(message, 'cc')].join(', ');
  const feedbackPattern = /(?:^|[\s<,;])feedback@turbulentground\.com(?:$|[\s>,;])/i;
  if (!feedbackPattern.test(recipients)) {
    return { disposition: 'Ignore', reason: 'Not addressed to feedback inbox' };
  }

  const autoSubmitted = headerValues(message, 'auto-submitted').join(', ').trim();
  if (autoSubmitted && !/^no$/i.test(autoSubmitted)) {
    return { disposition: 'Ignore', reason: 'Automated message; avoid receipt loops' };
  }

  const collected = { text: [], attachments: [] };
  collectPlainText(message.payload, collected);
  const originalText = collected.text.join('\n').replace(/\r\n/g, '\n');
  const text = newReplyText(originalText);
  const providerMessageId = headerValues(message, 'message-id').join(', ').trim();
  const sender = addressFrom(headerValues(message, 'from')[0]);
  const epoch = Number(message.internal_date);
  const receivedAt = Number.isFinite(epoch) && epoch > 0
    ? new Date(epoch).toISOString()
    : null;

  const reasons = [];
  if (!providerMessageId) reasons.push('Missing Message-ID; duplicate handling needs review');
  if (!receivedAt) reasons.push('Missing received date');
  if (!text) reasons.push('No unambiguous new plain-text feedback');
  if (collected.attachments.length) reasons.push('Attachments require separate review');
  if (!message.id) reasons.push('Missing Gmail ID');

  const stableIdentity = providerMessageId || `gmail:${message.id || ''}`;
  return {
    disposition: reasons.length ? 'Needs review' : 'Ready',
    reasons,
    source: {
      id: `EMAIL-${digest(stableIdentity).slice(0, 24).toUpperCase()}`,
      gmailMessageId: message.id || null,
      providerMessageId: providerMessageId || null,
      receivedAt,
      text,
      originalText,
      contactEmail: sender || null,
      channel: 'Email',
      stage: 'Results email reply',
      instrumentVersion: null,
      attachmentsPresent: collected.attachments.length > 0,
      intendedRecipient: FEEDBACK_ADDRESS,
    },
  };
}

export const gmailSearchQuery =
  'to:feedback@turbulentground.com -in:sent -in:drafts -in:spam -in:trash';
