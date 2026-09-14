# Survey response provenance

Responses.Instrument Version records the exact question set. Responses.Research Rationale Version records the published rationale identifier. Both are captured automatically on save and completion. Lookup returns the saved rationale and the browser preserves it on resume. Conflicting or unsupported versions stop before response writes rather than relabel saved answers.

Published rationale baseline: phase3-rationale-v1.0-2026-08-28. Its exact source snapshot and SHA256 are in registry.json. The approved 1.1 draft in the shared checkout is not released and is not used to label responses.

Existing completed responses are not backfilled: blank historical rationale fields mean not recorded. Existing in-progress responses without a rationale stamp acquire the currently supported baseline when next saved; this cannot establish which rationale applied before tracking began.

For a future release, archive its exact rationale, add its identifier and question-version associations to the registry and supported server versions, and update the browser identifier. Keep earlier supported versions for resume and analysis. Do not silently change an identifier's underlying document. Version tracking does not change scoring or cohort inclusion.
