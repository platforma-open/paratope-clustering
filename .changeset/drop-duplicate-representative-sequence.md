---
"@platforma-open/milaboratories.paratope-clustering.workflow": patch
"@platforma-open/milaboratories.paratope-clustering.model": patch
---

Drop the duplicate per-clonotype "Representative Sequence" p-column from the exported p-frame. The genuine cluster-axis column in `clusterToSeqPf` is retained; the per-clonotype `flanked_sequence` is removed since it was unused (excluded from MSA, not consumed by the UI) and collided with the cluster-axis column on name and label.