# Overview

Clusters antibodies by their predicted antigen-binding sites (paratopes), enabling identification of functionally similar antibodies regardless of their genetic lineage. Unlike clonotype clustering which groups sequences by overall identity, paratope clustering captures convergent evolution — clonally unrelated antibodies that evolved to bind the same target.

The block uses Parapred to predict which residues in CDR loops are involved in antigen binding, extracts these predicted paratope residues, and clusters them using MMseqs2. This provides ~80% of structure-based clustering value at a fraction of the computational cost, without requiring 3D structure prediction.

The clustered data can be used in downstream analysis blocks such as Antibody/TCR Lead Selection to select functionally diverse antibody panels where each cluster represents a different predicted binding mode.

Parapred is a deep learning model for paratope prediction. For more information, please see: [https://github.com/eliberis/parapred](https://github.com/eliberis/parapred) and cite the following publication if used in your research:

> Liberis E, Velickovic P, Sormanni P, Vendruscolo M, and Lio P. Parapred: antibody paratope prediction using convolutional and recurrent neural networks. _Bioinformatics_, 34(17):2944–2950 (2018). [https://doi.org/10.1093/bioinformatics/bty305](https://doi.org/10.1093/bioinformatics/bty305)

MMseqs2 is developed by the Söding lab and Steinegger group. For more information, please see: [https://github.com/soedinglab/MMseqs2](https://github.com/soedinglab/MMseqs2) and cite the following publication if used in your research:

> Steinegger M and Soeding J. MMseqs2 enables sensitive protein sequence searching for the analysis of massive data sets. _Nature Biotechnology_, doi: 10.1038/nbt.3988 (2017). [https://doi.org/10.1038/nbt.3988](https://doi.org/10.1038/nbt.3988)
