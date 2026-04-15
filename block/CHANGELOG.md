# @platforma-open/milaboratories.paratope-clustering

## 1.0.7

### Patch Changes

- e06286e: Fix: for single-cell data, only primary chains are fed to Parapred and MMSeqs2 clustering. Previously, MiXCR single-cell input leaked both primary and secondary chains into the clustering input, which inflated the per-clonotype paratope and produced incorrect clusters. CellRanger and bulk inputs are unaffected.
- Updated dependencies [e06286e]
  - @platforma-open/milaboratories.paratope-clustering.workflow@1.0.6

## 1.0.6

### Patch Changes

- Updated dependencies [46a7b7b]
  - @platforma-open/milaboratories.paratope-clustering.ui@1.0.4

## 1.0.5

### Patch Changes

- Updated dependencies [9653382]
  - @platforma-open/milaboratories.paratope-clustering.workflow@1.0.5
  - @platforma-open/milaboratories.paratope-clustering.ui@1.0.3

## 1.0.4

### Patch Changes

- @platforma-open/milaboratories.paratope-clustering.workflow@1.0.4

## 1.0.3

### Patch Changes

- @platforma-open/milaboratories.paratope-clustering.workflow@1.0.3

## 1.0.2

### Patch Changes

- Updated dependencies [d1ae953]
- Updated dependencies [6ebc727]
  - @platforma-open/milaboratories.paratope-clustering.workflow@1.0.2
  - @platforma-open/milaboratories.paratope-clustering.model@1.0.2
  - @platforma-open/milaboratories.paratope-clustering.ui@1.0.2

## 1.0.1

### Patch Changes

- bc44c8c: Initial implementation of paratope-clustering block
- Updated dependencies [bc44c8c]
  - @platforma-open/milaboratories.paratope-clustering.workflow@1.0.1
  - @platforma-open/milaboratories.paratope-clustering.model@1.0.1
  - @platforma-open/milaboratories.paratope-clustering.ui@1.0.1
