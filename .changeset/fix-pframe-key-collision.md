---
"@platforma-open/milaboratories.paratope-clustering": patch
"@platforma-open/milaboratories.paratope-clustering.workflow": patch
---

Fix intermittent "field is already set" error when building the export and MSA pframes: column keys now separate the column name from the counter, so names like `sequence_1` and `sequence_11` can no longer produce the same key
