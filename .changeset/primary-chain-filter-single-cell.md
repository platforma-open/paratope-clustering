---
'@platforma-open/milaboratories.paratope-clustering.workflow': patch
'@platforma-open/milaboratories.paratope-clustering': patch
---

Fix: for single-cell data, only primary chains are fed to Parapred and MMSeqs2 clustering. Previously, MiXCR single-cell input leaked both primary and secondary chains into the clustering input, which inflated the per-clonotype paratope and produced incorrect clusters. CellRanger and bulk inputs are unaffected.
