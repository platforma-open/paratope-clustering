# @platforma-open/milaboratories.paratope-clustering.model

## 1.0.3

### Patch Changes

- 69fcc61: Drop the duplicate per-clonotype "Representative Sequence" p-column from the exported p-frame. The genuine cluster-axis column in `clusterToSeqPf` is retained; the per-clonotype `flanked_sequence` is removed since it was unused (excluded from MSA, not consumed by the UI) and collided with the cluster-axis column on name and label.

## 1.0.2

### Patch Changes

- 6ebc727: Support various blosum matrices

## 1.0.1

### Patch Changes

- bc44c8c: Initial implementation of paratope-clustering block
