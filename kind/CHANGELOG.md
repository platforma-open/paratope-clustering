# @platforma-open/milaboratories.paratope-clustering.kind

## 1.1.0

### Minor Changes

- 4d39f28: Update the SDK and accept a subset filter (e.g. a Repertoire Labeling label or Lead Selection picks) with the input dataset. The dataset list is built with buildDatasetOptions (requireEnrichments: false). The subset restricts the input before the analysis, so only its clonotypes are scored and clustered, and cluster abundance fractions are relative to the subset. Outputs of a subset run carry pl7.app/inputSubset in their domain (on the cluster axis, and on the per-clonotype distance and paratope columns) and a trace rooted in the subset, so their labels name it. Unfiltered runs are unchanged.
