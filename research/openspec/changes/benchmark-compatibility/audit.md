# Benchmark compatibility audit — 14 September 2026

Exact revision 1 packet verified against live Airtable recyaIgIRHGPyDqlc: Graham decision Approved, Review notes empty. Packet SHA256 7255e4f0bbb78a8f007c87850a7948a7cda86accffabd72a3fc99aa8d7a7c214. Approval authorises the audit and preview; it does not validate equivalence.

## Findings

Eight V3/V4 statements have identical text: d1 both fields, d9 both fields, d10 contribution, d11 contribution, d12 both fields. All eight have revised explanatory text. V3 presents one statement from each domain then the second pass; V4 presents each pair together. The five-point agreement scale and storage mapping remain consistent. Different ordering, changed neighbouring statements and revised explanations leave context effects unresolved. No equivalence experiment was performed. All cross-version groups therefore remain disabled, as revision 1 requires for uncertain comparisons.

V1 snapshot text and final V2 text are insufficient for blanket historical pooling. V2 changed within its recorded identifier; the affected variants cannot be inferred from reconstructed rationale labels. Neither is enabled in the runtime policy. Historical response versions and answers remain untouched.

## Availability

The aggregate-only availability audit found 15 eligible completions (V1 6, V2 6, V3 2, V4 1), plus one incomplete V3 record, with no duplicate completion tokens. Every current-version statement has one eligible numeric answer. Full numeric counts per version are retained privately in availability-audit.json. No answers, identifiers, contacts or tokens are retained in that audit artifact.

## Preview outcome

Statement-benchmark-v1-2026-09-14 retains same-version groups and threshold 15, excludes ambiguous duplicate completions, records policy/time/count/version provenance on newly sent results, and explains why comparisons remain unavailable. Synthetic scenarios demonstrate 14-answer, 15-answer and mixed availability through the real email renderer. This is a gap explanation and future availability improvement; no benchmark is fabricated for the present sample.

## Next Graham decision

Review the preview and this audit. Separately approve release of its exact implementation commit if the explanation is useful. Cross-version pooling would require a new approved equivalence/context investigation and explicit mapping revision. Invitations/recontact or external comparison samples remain separate work items. No participant email was sent, and no production deployment was authorised by this audit.

Hosted verification found the existing global X-Frame-Options DENY rule blocked fetched iframe documents. The preview now uses srcdoc generated from the same renderer, preserving the global header. Local desktop/mobile scenarios passed after the fix. Final preview commit: 0d0c7515acc311b766034a8f262653c63f10d60b.
