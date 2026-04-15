# @platforma-open/milaboratories.paratope-clustering.workflow

## 1.0.6

### Patch Changes

- e06286e: Fix: for single-cell data, only primary chains are fed to Parapred and MMSeqs2 clustering. Previously, MiXCR single-cell input leaked both primary and secondary chains into the clustering input, which inflated the per-clonotype paratope and produced incorrect clusters. CellRanger and bulk inputs are unaffected.

## 1.0.5

### Patch Changes

- 9653382: Update cluster label to id

## 1.0.4

### Patch Changes

- Updated dependencies [1ad6e2f]
  - @platforma-open/milaboratories.paratope-clustering.software@1.0.3

## 1.0.3

### Patch Changes

- Updated dependencies [e14fb21]
  - @platforma-open/milaboratories.paratope-clustering.software@1.0.2

## 1.0.2

### Patch Changes

- d1ae953: Add colum tooltip
- 6ebc727: Support various blosum matrices

## 1.0.1

### Patch Changes

- bc44c8c: Initial implementation of paratope-clustering block
- Updated dependencies [bc44c8c]
  - @platforma-open/milaboratories.paratope-clustering.software@1.0.1
