// POST /api/research-results-email
// body: { token, email? }
//
// Sends a completed participant a factual summary of their own paired
// responses. Once five completed responses exist, it also shows the current
// invited-cohort mean for each statement, labelled as an early benchmark. It
// also compares the participant and cohort averages within
// each of the two lenses. It never collapses the lenses into one overall score.

const AIRTABLE_BASE_ID = "app7dKDinTjxczEfD";
const IDENTITY_TABLE_ID = "tblwpricYYzx4rmiR";
const RESPONSES_TABLE_ID = "tblL9mf8VfAmbhuG7";

const IDENTITY_FIELD = {
  token: "fld6danERot7gjOqb",
  name: "fldGto31lmx5KwyNr",
  email: "fldePJtCCYwLsmNjp",
  inviteStatus: "fldEhm06lLDvEeF6q",
  consentResults: "fldDQkh2LSSVjacTx",
  resultsSentAt: "fldcGbn19ft4z1OPe",
};

const RESPONSE_FIELD = {
  token: "flduL4PmBEfH9rLpz",
  pairResponsesJson: "fldvxb2mrIYVKLGVM",
  meetsCompletionFloor: "fldc1EMbDAHAO99Av",
};

const DOMAINS = [
  ["d1", "Judgement"], ["d2", "Time and workload"],
  ["d3", "Working relationships"], ["d4", "Skill and craft"],
  ["d5", "Autonomy"], ["d6", "Learning"], ["d7", "Trust"],
  ["d8", "Being seen"], ["d9", "Meaning"], ["d10", "Pace"],
  ["d11", "AI in team decisions"], ["d12", "Job security"],
];

const DOMAIN_INSIGHT = {
  d1: {
    contribution: "Relying on your own judgement when you and AI disagree",
    conditions: "Recognising when an AI suggestion is wrong",
    prompt: "What helps you decide when to question an AI suggestion?",
    comparable: false,
  },
  d2: {
    contribution: "Keeping some AI-saved time free from new tasks",
    conditions: "Being able to use AI-saved time to improve your work",
    prompt: "What happens to the time AI saves you?",
  },
  d3: {
    contribution: "Speaking directly with colleagues instead of relying on AI summaries",
    conditions: "Having colleagues speak with you instead of relying on AI summaries",
    prompt: "Where could direct conversation protect context that an AI summary misses?",
  },
  d4: {
    contribution: "Checking AI-assisted work as carefully as other work",
    conditions: "Having enough organisational time to check AI-assisted work",
    prompt: "Where does the time needed to check AI-assisted work currently come from?",
  },
  d5: {
    contribution: "Being comfortable explaining how you use AI at work",
    conditions: "Being able to use AI without close day-to-day monitoring",
    prompt: "What would make it easier to discuss AI use openly while keeping appropriate oversight?",
  },
  d6: {
    contribution: "Actively developing skills that AI cannot replace",
    conditions: "Having opportunities at work to build skills that AI cannot replace",
    prompt: "Which skills do you need more opportunity to develop at work?",
  },
  d7: {
    contribution: "Trusting colleagues to decide when to rely on AI",
    conditions: "Being trusted to decide when to rely on AI output",
    prompt: "Is trust around AI use given consistently in both directions?",
  },
  d8: {
    contribution: "Giving colleagues full credit when AI helps them work faster",
    conditions: "Receiving credit for the judgement you add to AI-assisted work",
    prompt: "How could your team make human judgement in AI-assisted work more visible?",
  },
  d9: {
    contribution: "Seeking out meaningful work as AI changes your tasks",
    conditions: "Experiencing the work you do alongside AI as meaningful",
    prompt: "Which parts of your changing work feel most worth protecting or developing?",
  },
  d10: {
    contribution: "Setting a sustainable pace when working with AI",
    conditions: "Experiencing the pace expected of you as sustainable",
    prompt: "Is the pace AI makes possible becoming the pace people are expected to maintain?",
  },
  d11: {
    contribution: "Influencing how your team uses AI",
    conditions: "Receiving clear organisational guidance about AI use",
    prompt: "Where do you need more clarity or influence over how AI is used?",
  },
  d12: {
    contribution: "Preparing for ways AI could change your role",
    conditions: "Feeling secure in your role as AI changes work",
    prompt: "What would help you prepare for change without making uncertainty harder to carry?",
  },
};

function looksLikeEmail(value) {
  return typeof value === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;").replace(/</g, "&lt;")
    .replace(/>/g, "&gt;").replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function displayValue(value) {
  if (typeof value === "number" && value >= 1 && value <= 5) return `${value} / 5`;
  if (value === "not_applicable") return "Not applicable";
  if (value === "skip") return "Prefer not to say";
  return "Not answered";
}

async function findRecord(tableId, token, tokenFieldId, airtableToken) {
  const formula = `{${tokenFieldId}}="${token.replace(/"/g, '\\"')}"`;
  const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${tableId}` +
    `?filterByFormula=${encodeURIComponent(formula)}&maxRecords=1&returnFieldsByFieldId=true`;
  const response = await fetch(url, { headers: { Authorization: `Bearer ${airtableToken}` } });
  if (!response.ok) throw new Error(`Airtable lookup failed: ${await response.text()}`);
  const data = await response.json();
  return data.records && data.records[0];
}

async function listResponsePairs(airtableToken) {
  const allPairs = [];
  let offset = "";
  do {
    const params = new URLSearchParams({ pageSize: "100", returnFieldsByFieldId: "true" });
    params.append("fields[]", RESPONSE_FIELD.pairResponsesJson);
    params.append("fields[]", RESPONSE_FIELD.meetsCompletionFloor);
    if (offset) params.set("offset", offset);
    const response = await fetch(
      `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${RESPONSES_TABLE_ID}?${params}`,
      { headers: { Authorization: `Bearer ${airtableToken}` } }
    );
    if (!response.ok) throw new Error(`Airtable cohort lookup failed: ${await response.text()}`);
    const data = await response.json();
    for (const record of data.records || []) {
      if (record.fields[RESPONSE_FIELD.meetsCompletionFloor] !== true) continue;
      try { allPairs.push(JSON.parse(record.fields[RESPONSE_FIELD.pairResponsesJson] || "{}")); }
      catch { /* Exclude unreadable records from the benchmark. */ }
    }
    offset = data.offset || "";
  } while (offset);
  return allPairs;
}

// Minimum eligible (Meets Completion Floor) responses before a benchmark
// mean is considered meaningful enough to show. Raised from 5 to 15 —
// 5 responses is too few for a mean to be statistically meaningful,
// independent of anything else.
const BENCHMARK_MIN_COHORT = 15;

function computeBenchmark(allPairs) {
  if (allPairs.length < BENCHMARK_MIN_COHORT) return { cohortSize: allPairs.length, domains: null };
  const domains = {};
  for (const [key] of DOMAINS) {
    domains[key] = {};
    for (const field of ["contribution", "conditions"]) {
      const values = allPairs.map(pairs => pairs?.[key]?.[field]).filter(value => typeof value === "number");
      domains[key][field] = values.length
        ? { mean: values.reduce((sum, value) => sum + value, 0) / values.length, n: values.length }
        : null;
    }
  }
  return { cohortSize: allPairs.length, domains };
}

function benchmarkValue(entry) {
  return entry ? `Current study benchmark ${entry.mean.toFixed(1)} / 5` : "No study benchmark yet";
}

function numericValues(pairs, field) {
  return DOMAINS.map(([key]) => pairs?.[key]?.[field]).filter(value => typeof value === "number");
}

function mean(values) {
  return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : null;
}

function lensSummary(pairs, benchmark, field) {
  const participantMean = mean(numericValues(pairs, field));
  if (!benchmark.domains) return { participantMean, benchmarkMean: null, difference: null };
  const benchmarkMeans = DOMAINS
    .map(([key]) => benchmark.domains[key]?.[field]?.mean)
    .filter(value => typeof value === "number");
  const benchmarkMean = mean(benchmarkMeans);
  return {
    participantMean,
    benchmarkMean,
    difference: participantMean === null || benchmarkMean === null ? null : participantMean - benchmarkMean,
  };
}

function differenceLabel(difference) {
  if (difference === null) return "Benchmark not available yet";
  if (Math.abs(difference) < 0.05) return "In line with the benchmark";
  return `${difference > 0 ? "+" : ""}${difference.toFixed(1)} ${difference > 0 ? "above" : "below"} the benchmark`;
}

function lensHighlights(pairs, benchmark, field) {
  if (!benchmark.domains) return null;
  const differences = DOMAINS.map(([key, label]) => {
    const response = pairs?.[key]?.[field];
    const benchmarkEntry = benchmark.domains[key]?.[field];
    if (typeof response !== "number" || !benchmarkEntry) return null;
    return { label, difference: response - benchmarkEntry.mean };
  }).filter(Boolean);
  return {
    above: differences.filter(item => item.difference > 0.05)
      .sort((a, b) => b.difference - a.difference).slice(0, 2),
    below: differences.filter(item => item.difference < -0.05)
      .sort((a, b) => a.difference - b.difference).slice(0, 2),
  };
}

function highlightItems(items, emptyLabel) {
  if (!items.length) return `<span style="color:#9e8e7c;">${escapeHtml(emptyLabel)}</span>`;
  return items.map(item => `${escapeHtml(item.label)} <strong style="color:#ef7b45;white-space:nowrap;">${item.difference > 0 ? "+" : ""}${item.difference.toFixed(1)}</strong>`).join("<br>");
}

function highlightsCard(label, highlights) {
  return `<td valign="top" style="width:50%;padding:16px;background:#1c1916;border:1px solid #3a332d;">
    <p style="margin:0 0 12px;color:#e8dcc8;font-family:Arial,sans-serif;font-size:16px;font-weight:700;">${escapeHtml(label)}</p>
    <p style="margin:0 0 12px;color:#d0bea2;font-family:Arial,sans-serif;font-size:13px;line-height:1.6;"><strong style="color:#e8dcc8;">Above benchmark</strong><br>${highlightItems(highlights.above, "No themes above the benchmark")}</p>
    <p style="margin:0;color:#d0bea2;font-family:Arial,sans-serif;font-size:13px;line-height:1.6;"><strong style="color:#e8dcc8;">Below benchmark</strong><br>${highlightItems(highlights.below, "No themes below the benchmark")}</p>
  </td>`;
}

function rankedResponses(pairs, field, predicate = () => true) {
  return DOMAINS.map(([key, label], order) => ({
    key,
    label,
    order,
    value: pairs?.[key]?.[field],
    text: DOMAIN_INSIGHT[key][field],
  })).filter(item => typeof item.value === "number" && predicate(item));
}

function personalInsights(pairs) {
  const contribution = rankedResponses(pairs, "contribution")
    .filter(item => item.value >= 4)
    .sort((a, b) => b.value - a.value || a.order - b.order)
    .slice(0, 3);
  const conditions = rankedResponses(pairs, "conditions", item => item.key !== "d1");
  const enabled = conditions.filter(item => item.value >= 4)
    .sort((a, b) => b.value - a.value || a.order - b.order)
    .slice(0, 2);
  const constrained = conditions.filter(item => item.value <= 2)
    .sort((a, b) => a.value - b.value || a.order - b.order)
    .slice(0, 2);
  const tensions = DOMAINS.map(([key, label], order) => {
    const contributionValue = pairs?.[key]?.contribution;
    const conditionsValue = pairs?.[key]?.conditions;
    if (DOMAIN_INSIGHT[key].comparable === false || typeof contributionValue !== "number" || typeof conditionsValue !== "number") return null;
    return {
      key,
      label,
      order,
      contributionValue,
      conditionsValue,
      difference: contributionValue - conditionsValue,
    };
  }).filter(item => item && Math.abs(item.difference) >= 1)
    .sort((a, b) => Math.abs(b.difference) - Math.abs(a.difference) || a.order - b.order)
    .slice(0, 3);

  const questionKeys = [];
  for (const item of [...tensions, ...constrained, ...contribution]) {
    if (!questionKeys.includes(item.key)) questionKeys.push(item.key);
    if (questionKeys.length === 3) break;
  }
  return { contribution, enabled, constrained, tensions, questionKeys };
}

function responseList(items, emptyText) {
  if (!items.length) return `<p style="margin:0;color:#9e8e7c;font-family:Arial,sans-serif;font-size:14px;line-height:1.6;">${escapeHtml(emptyText)}</p>`;
  return `<ul style="margin:0;padding-left:20px;color:#d0bea2;font-family:Arial,sans-serif;font-size:14px;line-height:1.65;">${items.map(item =>
    `<li style="margin:0 0 8px;"><strong style="color:#e8dcc8;">${escapeHtml(item.label)}</strong><br>${escapeHtml(item.text)} <span style="color:#9e8e7c;white-space:nowrap;">(${item.value} / 5)</span></li>`
  ).join("")}</ul>`;
}

function tensionList(items) {
  if (!items.length) return `<p style="margin:0;color:#9e8e7c;font-family:Arial,sans-serif;font-size:14px;line-height:1.6;">Your answers did not show a large gap within the comparable paired themes.</p>`;
  return `<ul style="margin:0;padding-left:20px;color:#d0bea2;font-family:Arial,sans-serif;font-size:14px;line-height:1.65;">${items.map(item => {
    const description = item.difference > 0
      ? `You rated your own action higher than the condition around you (${item.contributionValue} compared with ${item.conditionsValue}).`
      : `You rated the condition around you higher than your own action (${item.conditionsValue} compared with ${item.contributionValue}).`;
    return `<li style="margin:0 0 8px;"><strong style="color:#e8dcc8;">${escapeHtml(item.label)}</strong><br>${escapeHtml(description)}</li>`;
  }).join("")}</ul>`;
}

function reflectionList(keys) {
  if (!keys.length) return "";
  return `<ul style="margin:0;padding-left:20px;color:#d0bea2;font-family:Arial,sans-serif;font-size:14px;line-height:1.65;">${keys.map(key =>
    `<li style="margin:0 0 8px;">${escapeHtml(DOMAIN_INSIGHT[key].prompt)}</li>`
  ).join("")}</ul>`;
}

function personalSummary(pairs) {
  const insight = personalInsights(pairs);
  return `<h2 style="margin:28px 0 8px;font-family:Georgia,serif;font-size:26px;font-weight:400;color:#e8dcc8;">Your response at a glance</h2>
    <p style="font-family:Arial,sans-serif;font-size:13px;line-height:1.6;color:#9e8e7c;">This reflects how you answered today. It is not a score, diagnosis or judgement of your ability.</p>
    <div style="margin-top:18px;padding:18px;background:#1c1916;border:1px solid #3a332d;">
      <h3 style="margin:0 0 12px;font-family:Georgia,serif;font-size:20px;font-weight:400;color:#e8dcc8;">What you report bringing</h3>
      ${responseList(insight.contribution, "You did not strongly agree with any personal-practice statement. The detailed responses below preserve the full picture.")}
    </div>
    <div style="margin-top:12px;padding:18px;background:#1c1916;border:1px solid #3a332d;">
      <h3 style="margin:0 0 12px;font-family:Georgia,serif;font-size:20px;font-weight:400;color:#e8dcc8;">What your environment enables</h3>
      <p style="margin:0 0 8px;color:#e8dcc8;font-family:Arial,sans-serif;font-size:13px;font-weight:700;">More supported in your answers</p>
      ${responseList(insight.enabled, "No surrounding-condition statement received an agreement response of 4 or 5.")}
      <p style="margin:16px 0 8px;color:#e8dcc8;font-family:Arial,sans-serif;font-size:13px;font-weight:700;">Less supported in your answers</p>
      ${responseList(insight.constrained, "No surrounding-condition statement received a disagreement response of 1 or 2.")}
    </div>
    <div style="margin-top:12px;padding:18px;background:#1c1916;border:1px solid #3a332d;">
      <h3 style="margin:0 0 8px;font-family:Georgia,serif;font-size:20px;font-weight:400;color:#e8dcc8;">Where the tension sits</h3>
      <p style="margin:0 0 12px;color:#9e8e7c;font-family:Arial,sans-serif;font-size:13px;line-height:1.6;">These are the largest gaps between what you report doing and what you experience around you. A gap is a prompt for reflection, not proof of its cause.</p>
      ${tensionList(insight.tensions)}
    </div>
    <div style="margin-top:12px;padding:18px;background:#231c17;border-left:3px solid #e55b20;">
      <h3 style="margin:0 0 12px;font-family:Georgia,serif;font-size:20px;font-weight:400;color:#e8dcc8;">Questions worth discussing</h3>
      ${reflectionList(insight.questionKeys)}
    </div>`;
}

function scalePosition(value) {
  return Math.max(0, Math.min(100, ((value - 1) / 4) * 100));
}

function comparisonBar(value, benchmarkEntry) {
  if (typeof value !== "number") return "";
  const participantWidth = scalePosition(value);
  const benchmarkMarker = benchmarkEntry ? scalePosition(benchmarkEntry.mean) : null;
  return `<div role="img" aria-label="Your response ${value} out of 5${benchmarkEntry ? `; current benchmark ${benchmarkEntry.mean.toFixed(1)} out of 5` : ""}" style="margin-top:8px;">
    <div style="position:relative;height:10px;background:#3a332d;border-radius:999px;overflow:visible;">
      <div style="height:10px;width:${participantWidth}%;background:#e55b20;border-radius:999px;"></div>
      ${benchmarkMarker === null ? "" : `<div title="Current benchmark" style="position:absolute;left:${benchmarkMarker}%;top:-4px;width:2px;height:18px;background:#e8dcc8;"></div>`}
    </div>
    <div style="display:flex;justify-content:space-between;margin-top:4px;color:#786b5e;font-family:Arial,sans-serif;font-size:10px;"><span>1</span><span>5</span></div>
  </div>`;
}

function lensCard(label, summary) {
  const participant = summary.participantMean === null ? "Not available" : `${summary.participantMean.toFixed(1)} / 5`;
  const cohort = summary.benchmarkMean === null ? "Not available yet" : `${summary.benchmarkMean.toFixed(1)} / 5`;
  const difference = differenceLabel(summary.difference);
  return `<td valign="top" style="width:50%;padding:16px;background:#1c1916;border:1px solid #3a332d;">
    <p style="margin:0 0 8px;color:#9e8e7c;font-family:Arial,sans-serif;font-size:12px;text-transform:uppercase;letter-spacing:.08em;">${escapeHtml(label)}</p>
    <p style="margin:0;color:#e8dcc8;font-family:Georgia,serif;font-size:28px;">${participant}</p>
    <p style="margin:6px 0 0;color:#d0bea2;font-family:Arial,sans-serif;font-size:13px;">Current benchmark ${cohort}</p>
    <p style="margin:10px 0 0;color:#ef7b45;font-family:Arial,sans-serif;font-size:14px;font-weight:700;">${escapeHtml(difference)}</p>
  </td>`;
}

export function buildEmailHtml(name, pairs, benchmark, token) {
  const rows = DOMAINS.map(([key, label]) => {
    const pair = pairs[key] || {};
    const domainBenchmark = benchmark.domains && benchmark.domains[key];
    const contributionBenchmark = domainBenchmark && benchmarkValue(domainBenchmark.contribution);
    const conditionsBenchmark = domainBenchmark && benchmarkValue(domainBenchmark.conditions);
    return `<tr>
      <td style="padding:10px 8px;border-bottom:1px solid #3a332d;color:#e8dcc8;font-family:Arial,sans-serif;font-size:14px;">${escapeHtml(label)}</td>
      <td style="padding:10px 8px;border-bottom:1px solid #3a332d;color:#d0bea2;font-family:Arial,sans-serif;font-size:14px;">${displayValue(pair.contribution)}${contributionBenchmark ? `<br><span style="font-size:12px;color:#9e8e7c;">${contributionBenchmark}</span>` : ""}${comparisonBar(pair.contribution, domainBenchmark?.contribution)}</td>
      <td style="padding:10px 8px;border-bottom:1px solid #3a332d;color:#d0bea2;font-family:Arial,sans-serif;font-size:14px;">${displayValue(pair.conditions)}${conditionsBenchmark ? `<br><span style="font-size:12px;color:#9e8e7c;">${conditionsBenchmark}</span>` : ""}${comparisonBar(pair.conditions, domainBenchmark?.conditions)}</td>
    </tr>`;
  }).join("");

  const greeting = name ? `Hello ${escapeHtml(name)},` : "Hello,";
  const benchmarkNote = benchmark.domains
    ? `The comparison benchmark is likely to fluctuate frequently during the early phase of this research.`
    : `A comparison benchmark is not available yet. Your summary will show your own answers only.`;
  const contributionSummary = lensSummary(pairs, benchmark, "contribution");
  const conditionsSummary = lensSummary(pairs, benchmark, "conditions");
  const summaryCards = benchmark.domains ? `<table role="presentation" style="width:100%;border-collapse:separate;border-spacing:8px;margin:18px -8px 8px;">
    <tr>${lensCard("Your contribution", contributionSummary)}${lensCard("Conditions around you", conditionsSummary)}</tr>
  </table>
  <p style="font-family:Arial,sans-serif;font-size:12px;line-height:1.5;color:#9e8e7c;">The orange bar is your response. The light marker is the current study benchmark.</p>` : "";
  const contributionHighlights = lensHighlights(pairs, benchmark, "contribution");
  const conditionsHighlights = lensHighlights(pairs, benchmark, "conditions");
  const highlights = benchmark.domains ? `<h2 style="margin:28px 0 8px;font-family:Georgia,serif;font-size:24px;font-weight:400;color:#e8dcc8;">Benchmark highlights</h2>
  <p style="font-family:Arial,sans-serif;font-size:13px;line-height:1.6;color:#9e8e7c;">These are the largest differences in your answers. They are not strengths or weaknesses. Conditions around you reflects your experience of work, not an assessment of your whole organisation.</p>
  <table role="presentation" style="width:100%;border-collapse:separate;border-spacing:8px;margin:12px -8px 8px;"><tr>
    ${highlightsCard("Your contribution", contributionHighlights)}
    ${highlightsCard("Conditions around you", conditionsHighlights)}
  </tr></table>` : "";
  const participantSummary = personalSummary(pairs);
  const benchmarkSection = benchmark.domains ? `<h2 style="margin:32px 0 8px;font-family:Georgia,serif;font-size:26px;font-weight:400;color:#e8dcc8;">Your emerging benchmark comparison</h2>
    <p style="font-family:Arial,sans-serif;font-size:14px;line-height:1.6;color:#9e8e7c;">${benchmarkNote}</p>
    ${summaryCards}
    ${highlights}` : `<h2 style="margin:32px 0 8px;font-family:Georgia,serif;font-size:26px;font-weight:400;color:#e8dcc8;">Your emerging benchmark comparison</h2>
    <p style="font-family:Arial,sans-serif;font-size:14px;line-height:1.6;color:#9e8e7c;">${benchmarkNote}</p>`;
  return `<!doctype html><html><body style="margin:0;background:#131110;color:#e8dcc8;">
    <div style="max-width:680px;margin:0 auto;padding:40px 24px;">
      <p style="font-family:Arial,sans-serif;font-size:15px;color:#d0bea2;">${greeting}</p>
      <h1 style="font-family:Georgia,serif;font-size:30px;font-weight:400;line-height:1.2;">Your AI shift response summary</h1>
      <p style="font-family:Arial,sans-serif;font-size:15px;line-height:1.6;color:#d0bea2;">This shows how you answered across the 12 themes. Your contribution and the conditions around you are kept separate because the difference between them matters.</p>
      ${participantSummary}
      ${benchmarkSection}
      <h2 style="margin:32px 0 8px;font-family:Georgia,serif;font-size:26px;font-weight:400;color:#e8dcc8;">Your detailed responses</h2>
      <table role="presentation" style="width:100%;border-collapse:collapse;margin-top:24px;">
        <thead><tr>
          <th align="left" style="padding:10px 8px;border-bottom:2px solid #c9470e;color:#e8dcc8;font-family:Arial,sans-serif;font-size:13px;">Theme</th>
          <th align="left" style="padding:10px 8px;border-bottom:2px solid #c9470e;color:#e8dcc8;font-family:Arial,sans-serif;font-size:13px;">Your contribution</th>
          <th align="left" style="padding:10px 8px;border-bottom:2px solid #c9470e;color:#e8dcc8;font-family:Arial,sans-serif;font-size:13px;">Conditions around you</th>
        </tr></thead><tbody>${rows}</tbody>
      </table>
      <p style="font-family:Arial,sans-serif;font-size:13px;line-height:1.6;color:#9e8e7c;margin-top:24px;">The response scale runs from 1, strongly disagree, to 5, strongly agree. These results are descriptive and should not be treated as a psychological assessment.</p>
      <p style="font-family:Arial,sans-serif;font-size:13px;line-height:1.6;color:#9e8e7c;">You received this because you requested your summary after completing the invite-only Turbulent Ground research study.</p>
      <p style="font-family:Arial,sans-serif;font-size:13px;line-height:1.6;color:#9e8e7c;">This requested comparison is separate from optional study emails. If you agreed to future emails, you can <a href="https://www.turbulentground.com/api/research-unsubscribe?t=${encodeURIComponent(token)}" style="color:#ef7b45;">unsubscribe at any time</a>.</p>
    </div></body></html>`;
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  let data;
  try { data = typeof req.body === "string" ? JSON.parse(req.body) : req.body; }
  catch { return res.status(400).json({ error: "Invalid JSON" }); }

  const token = typeof data?.token === "string" ? data.token.trim() : "";
  if (!token) return res.status(400).json({ error: "Missing token" });

  const airtableToken = process.env.AIRTABLE_RESEARCH_TOKEN;
  const resendKey = process.env.RESEND_API_KEY;
  const resendFrom = process.env.RESEND_FROM;
  if (!airtableToken || !resendKey || !resendFrom) {
    console.error("Missing research results email configuration");
    return res.status(500).json({ error: "Results email is not configured" });
  }

  let identity;
  let responseRecord;
  let allPairs;
  try {
    [identity, responseRecord, allPairs] = await Promise.all([
      findRecord(IDENTITY_TABLE_ID, token, IDENTITY_FIELD.token, airtableToken),
      findRecord(RESPONSES_TABLE_ID, token, RESPONSE_FIELD.token, airtableToken),
      listResponsePairs(airtableToken),
    ]);
  } catch (error) {
    console.error(error.message);
    return res.status(502).json({ error: "Could not prepare your results" });
  }

  if (!identity || !responseRecord || identity.fields[IDENTITY_FIELD.inviteStatus] !== "Completed") {
    return res.status(403).json({ error: "Results are only available after completing the study" });
  }
  if (identity.fields[IDENTITY_FIELD.resultsSentAt]) {
    return res.status(409).json({ error: "Your results have already been sent" });
  }

  const suppliedEmail = typeof data?.email === "string" ? data.email.trim() : "";
  const storedEmail = identity.fields[IDENTITY_FIELD.email];
  const email = suppliedEmail || storedEmail || "";
  if (!looksLikeEmail(email)) return res.status(400).json({ error: "Please enter a valid email address" });

  let pairs;
  try { pairs = JSON.parse(responseRecord.fields[RESPONSE_FIELD.pairResponsesJson] || "{}"); }
  catch { return res.status(502).json({ error: "Could not read your saved responses" }); }
  const benchmark = computeBenchmark(allPairs);

  const name = identity.fields[IDENTITY_FIELD.name] || "";
  const emailResponse = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendKey}`,
      "Content-Type": "application/json",
      "Idempotency-Key": `research-results-${token}`,
    },
    body: JSON.stringify({
      from: resendFrom,
      to: [email],
      subject: "Your AI shift response summary",
      html: buildEmailHtml(name, pairs, benchmark, token),
    }),
  });
  if (!emailResponse.ok) {
    console.error("Resend results email failed:", await emailResponse.text());
    return res.status(502).json({ error: "Could not send your results. Please try again" });
  }

  const patchFields = {
    [IDENTITY_FIELD.consentResults]: true,
    [IDENTITY_FIELD.resultsSentAt]: new Date().toISOString(),
  };
  if (suppliedEmail) patchFields[IDENTITY_FIELD.email] = suppliedEmail;

  const patchResponse = await fetch(
    `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${IDENTITY_TABLE_ID}/${identity.id}`,
    {
      method: "PATCH",
      headers: { Authorization: `Bearer ${airtableToken}`, "Content-Type": "application/json" },
      body: JSON.stringify({ fields: patchFields }),
    }
  );
  if (!patchResponse.ok) {
    console.error("Results email audit write failed:", await patchResponse.text());
    return res.status(502).json({ error: "Results were sent, but the confirmation could not be saved" });
  }

  return res.status(200).json({ success: true });
}
