# Paratope Clustering

Group antibodies by the binding site they present, not the lineage they came from. This Platforma block uses Parapred to predict which CDR residues actually contact antigen, then clusters antibodies on those residues with MMseqs2 — surfacing clonally unrelated antibodies that converged on the same binding mode.

Open-source analysis block for Platforma, the biologics discovery platform by MiLaboratories. For the full no-code workflow, see [platforma.bio](https://platforma.bio/).

## What it does

Clustering by overall sequence identity groups antibodies by ancestry: members of one clonal lineage land together. That is useful, but it answers a genetic question, not a functional one. Two antibodies from entirely different lineages can bind the same epitope — convergent evolution toward the same solution — and identity-based clustering will never put them in the same group.

Paratope clustering targets the functional question directly. Parapred, a deep learning model, scores each CDR residue for how likely it is to be part of the antigen-binding interface. Residues above your probability threshold are extracted as the predicted paratope, and clustering runs on those residues alone. Framework and non-contact CDR positions — which carry lineage signal but not binding signal — drop out of the comparison.

The result approximates what structure-based clustering would tell you at a small fraction of the cost, and without needing 3D structures at all: roughly 80% of the value, on any dataset with CDR sequences.

Clustering itself runs on MMseqs2, so the same controls apply as elsewhere: similarity scored by exact identity or a BLOSUM matrix (BLOSUM62 by default), a minimum identity threshold (0.8 by default), and a coverage threshold (0.9 by default). The paratope probability threshold defaults to 0.5 — raise it to keep only high-confidence contact residues, lower it to include more of the loop.

Results are explored as a per-cluster table, a bubble plot of the most abundant clusters, a cluster size histogram, and a distribution of Parapred scores so you can see how the probability threshold is landing on your data.

Cluster assignments become columns, so [Lead Selection](https://github.com/platforma-open/antibody-tcr-lead-selection) can diversify a panel across predicted binding modes — one candidate per mode, rather than several variants of the same one.

## Inputs & outputs

* **Input:** antibody clonotypes with CDR amino acid sequences, from any Platforma clonotyping or import block.
* **Output:** a paratope cluster ID per antibody with cluster-level statistics, plus per-residue Parapred scores, a cluster table, abundance bubble plot, cluster size histogram, and Parapred score distribution.

## Specifications

| | |
|---|---|
| Block title in app | Paratope clustering |
| Paratope prediction | [Parapred](https://github.com/eliberis/parapred) — convolutional and recurrent neural network model, per-residue contact probability |
| Clustering | [MMseqs2](https://github.com/soedinglab/MMseqs2) over the predicted paratope residues |
| Similarity scoring | Exact Match or BLOSUM40 / 50 / 62 / 80 / 90 — BLOSUM62 by default |
| Key parameters | Paratope probability threshold (default 0.5), minimal identity (default 0.8), coverage threshold (default 0.9) |
| Structures required | None |
| Views | Cluster table, most abundant clusters bubble plot, cluster size histogram, Parapred score distribution |

## Use cases

* **Convergent binders:** find antibodies from unrelated lineages that evolved the same binding mode, which identity-based clustering separates.
* **Functionally diverse panels:** diversify Lead Selection across predicted binding modes so a panel covers distinct mechanisms rather than variants of one.
* **Cross-donor comparison:** relate antibodies from different individuals by binding site rather than germline.
* **Structure-free triage:** get most of the benefit of structural clustering without running structure prediction first.
* **Epitope-bin hypotheses:** group candidates into likely epitope bins before committing to competition assays.
* **Redundancy check:** confirm that a shortlist is not several antibodies presenting the same paratope through different frameworks.

## How it compares to other Platforma blocks

* **Paratope Clustering** clusters on predicted antigen-contact residues — a functional grouping, no structures needed.
* **[Sequence Clustering](https://github.com/platforma-open/clonotype-clustering)** clusters on whole-sequence identity or BLOSUM similarity — the fastest option, and a lineage-oriented view.
* **[3D Structure Clustering](https://github.com/platforma-open/3d-structure-clustering)** clusters on predicted structure, the most direct measure of shape, but requires a structure prediction run upstream.
* **[Embedding Clustering](https://github.com/platforma-open/embedding-clustering)** clusters in protein language model space, capturing learned similarity across the whole sequence.

Each is a different axis, and Lead Selection can diversify on whichever the campaign calls for.

## FAQ

### What is a paratope?

The set of residues on an antibody that make contact with its antigen — mostly in the CDR loops, though not every CDR residue participates. Comparing antibodies on their paratopes compares what they bind with, rather than everything they happen to be made of.

### How is this different from clonotype clustering?

Clonotype clustering compares whole sequences, so it groups by lineage: variants descended from the same ancestor. Paratope clustering compares only the predicted contact residues, so it can group antibodies from different lineages that arrived at the same binding solution — and can separate lineage members whose contact residues actually differ.

### Do I need predicted structures?

No. Parapred works from CDR sequence, which is what makes this block cheap enough to run on a whole repertoire. If you do have structures, [3D Structure Clustering](https://github.com/platforma-open/3d-structure-clustering) measures shape more directly.

### What does the paratope probability threshold control?

How confident Parapred must be that a residue is a contact before it is included in the paratope used for clustering. The default of 0.5 is a balanced starting point. Raising it keeps only high-confidence contacts, producing tighter, more specific clusters; lowering it includes more of the loop and moves the result closer to plain CDR clustering. The Parapred score distribution page shows where your data sits relative to the threshold.

### Which similarity scoring should I use?

BLOSUM62 is the default and usually right: paratopes that differ by conservative substitutions often bind similarly. Exact Match is stricter and appropriate when you want identical contact residues.

### How good is it compared to structure-based clustering?

It recovers roughly 80% of the value of structure-based clustering at a small fraction of the compute, which for repertoire-scale datasets is usually the better trade. Use structural clustering when a specific shortlist warrants the extra cost.

## Citation

If you use this block in your research, please cite Parapred and MMseqs2:

> Liberis, E., Veličković, P., Sormanni, P., Vendruscolo, M., & Liò, P. (2018). Parapred: antibody paratope prediction using convolutional and recurrent neural networks. *Bioinformatics* **34**(17), 2944–2950. [https://doi.org/10.1093/bioinformatics/bty305](https://doi.org/10.1093/bioinformatics/bty305)

> Steinegger, M., & Söding, J. (2017). MMseqs2 enables sensitive protein sequence searching for the analysis of massive data sets. *Nature Biotechnology* **35**(11), 1026–1028. [https://doi.org/10.1038/nbt.3988](https://doi.org/10.1038/nbt.3988)


## Part of the Platforma ecosystem

This block is part of [Platforma](https://platforma.bio/) by [MiLaboratories](https://github.com/milaboratory), built on [Parapred](https://github.com/eliberis/parapred) and [MMseqs2](https://github.com/soedinglab/MMseqs2). Explore the other open-source blocks at [github.com/platforma-open](https://github.com/platforma-open) and the docs for antibody discovery at [docs.platforma.bio/biology-guides/antibody-discovery](https://docs.platforma.bio/biology-guides/antibody-discovery/).
