---
"@platforma-open/milaboratories.paratope-clustering.model": patch
"@platforma-open/milaboratories.paratope-clustering.ui": patch
"@platforma-open/milaboratories.paratope-clustering.workflow": patch
---

Compute the block label without the UI

The trace label and the subtitle are now built by the model from the clustering
settings, so opening the block no longer changes its arguments and a block that was
never opened gets the same label. Existing blocks show as stale once after the update
because the arguments change shape.
