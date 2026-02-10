import polars as pl
import polars_ds as pds
import argparse

parser = argparse.ArgumentParser(description='Process paratope clustering results and compute summaries')
args = parser.parse_args()

clustersTsv = "clusters.tsv"
cloneTableTsv = "cloneTable.tsv"
paratopeSequencesTsv = "paratopeSequences.tsv"
clusterToSeqTsv = "cluster-to-seq.tsv"
cloneToClusterTsv = "clone-to-cluster.tsv"
abundancesTsv = "abundances.tsv"
abundancesPerClusterTsv = "abundances-per-cluster.tsv"
clusterRadiusTsv = "cluster-radius.tsv"

# sampleId, clonotypeKey, clonotypeKeyLabel, sequence_* columns, abundance
cloneTable = pl.read_csv(cloneTableTsv, separator="\t")

# clonotypeKey, paratope_sequence
paratopeSequences = pl.read_csv(paratopeSequencesTsv, separator="\t")

# Get all sequence columns
sequence_cols = [col for col in cloneTable.columns
                 if col.startswith('sequence_')]

# Create fullSequence by concatenating sequence columns
if sequence_cols:
    sorted_sequence_cols = sorted(sequence_cols)
    cloneTable = cloneTable.with_columns(
        pl.concat_str([pl.col(c).fill_null("") for c in sorted_sequence_cols], separator="====").alias('fullSequence')
    )

# Transform clonotypeKeyLabel from "C-XXXXXX" to "CL-XXXXXX"
cloneTable = cloneTable.with_columns(
    pl.col('clonotypeKeyLabel').str.replace('C-', 'CL-', n=1).alias('clusterLabel')
)

# Join paratope sequences to clone table
cloneTable = cloneTable.join(
    paratopeSequences.unique(subset=["clonotypeKey"], keep="first"),
    on="clonotypeKey",
    how="left"
)

# clusterId, clonotypeKey
clusters = pl.read_csv(clustersTsv, separator="\t", has_header=False,
                       new_columns=["clusterId", "clonotypeKey"])

# Remove the "s-" prefix from clusterId and clonotypeKey
clusters = clusters.with_columns(
    pl.col("clusterId").str.strip_prefix("s-"),
    pl.col("clonotypeKey").str.strip_prefix("s-")
)

# Calculate cluster sizes
clusters = clusters.with_columns(
    pl.col('clonotypeKey').count().over('clusterId').alias('size')
)

# Merge clusters with cloneTable to get clusterLabel for the centroid
labelsTable_for_join = cloneTable.select(
    pl.col('clonotypeKey').alias('clusterId'),
    'clusterLabel'
).unique(subset=['clusterId'], keep='first')

clusters = clusters.join(
    labelsTable_for_join,
    on='clusterId',
    how='left'
)

# --- Generate cluster-to-seq.tsv ---
unique_clusters_info = clusters.select(["clusterId", "clusterLabel", "size"]).unique(subset=["clusterId"], keep="first")

centroid_select_cols = [pl.col('clonotypeKey').alias("centroid_key_cts")] + sequence_cols + ["paratope_sequence"]
if "flanked_sequence" in cloneTable.columns:
    centroid_select_cols.append("flanked_sequence")

centroid_sequences_for_cts = cloneTable.select(
    centroid_select_cols
).unique("centroid_key_cts", keep="first")

cluster_to_seq_df = unique_clusters_info.join(
    centroid_sequences_for_cts,
    left_on="clusterId",
    right_on="centroid_key_cts",
    how="left"
)

required_cols_cts = ['clusterId', 'clusterLabel', 'size'] + sequence_cols + ['paratope_sequence']
if "flanked_sequence" in cluster_to_seq_df.columns:
    required_cols_cts.append("flanked_sequence")
cluster_to_seq = cluster_to_seq_df.select(required_cols_cts)
cluster_to_seq.write_csv(clusterToSeqTsv, separator="\t")


# --- Generate clone-to-cluster.tsv ---
clone_to_cluster = clusters.select(['clusterId',
                                    'clonotypeKey',
                                    'clusterLabel']
                                   ).with_columns(pl.lit(1).alias('link'))
clone_to_cluster.write_csv(cloneToClusterTsv, separator="\t")


# --- Generate abundances.tsv ---
merged_abundances = cloneTable.select(['sampleId', 'clonotypeKey', 'abundance']).join(
    clusters.select(['clusterId', 'clonotypeKey']).unique(subset=["clonotypeKey"], keep="first"),
    left_on='clonotypeKey',
    right_on='clonotypeKey',
    how='inner'
)

cluster_abundances = merged_abundances.group_by(['sampleId', 'clusterId']).agg(
    pl.sum('abundance').alias('abundance')
)

cluster_abundances = cluster_abundances.with_columns(
    pl.sum('abundance').over('sampleId').alias('total_sample_abundance')
)
cluster_abundances = cluster_abundances.with_columns(
    (pl.col('abundance') / pl.col('total_sample_abundance')).alias('abundance_normalized')
)
cluster_abundances = cluster_abundances.drop('total_sample_abundance')

cluster_abundances.write_csv(abundancesTsv, separator="\t")

# --- Generate abundances-per-cluster.tsv ---
abundances_per_cluster = cluster_abundances.group_by(
    'clusterId').agg(pl.sum('abundance').alias('abundance_per_cluster'))

total_abundance = abundances_per_cluster.select(pl.sum('abundance_per_cluster')).item()
abundances_per_cluster = abundances_per_cluster.with_columns(
    pl.when(pl.lit(total_abundance) > 0)
      .then(pl.col('abundance_per_cluster') / pl.lit(total_abundance))
      .otherwise(pl.lit(0.0, dtype=pl.Float64))
      .alias('abundance_fraction_per_cluster')
)

abundances_per_cluster.write_csv(abundancesPerClusterTsv, separator="\t")

# --- Get top clusters for bubble plot ---
top_cluster_ids_df = abundances_per_cluster.sort(
    'abundance_per_cluster', descending=True
).head(100).select('clusterId')

# --- Export per-clonotype paratope sequences ---
paratope_out_cols = ["clonotypeKey", "paratope_sequence"]
if "flanked_sequence" in cloneTable.columns:
    paratope_out_cols.append("flanked_sequence")

if "paratope_sequence" in cloneTable.columns:
    (
        cloneTable
        .select(paratope_out_cols)
        .unique(subset=["clonotypeKey"], keep="first")
    ).write_csv("paratope-sequences.tsv", separator="\t")
else:
    empty_data = {"clonotypeKey": [], "paratope_sequence": [], "flanked_sequence": []}
    pl.DataFrame(empty_data).write_csv("paratope-sequences.tsv", separator="\t")


# --- Generate distance_to_centroid.tsv ---
distance_df_base = clusters.select([
    pl.col("clonotypeKey"),
    pl.col("clusterId"),
    pl.col("clusterLabel")
])

member_original_labels = cloneTable.select([
    pl.col("clonotypeKey").alias("member_key_for_label_join"),
    pl.col("clonotypeKeyLabel")
]).unique("member_key_for_label_join", keep="first")

distance_df = distance_df_base.join(
    member_original_labels,
    left_on="clonotypeKey",
    right_on="member_key_for_label_join",
    how="left"
)

# Use paratope sequences for distance calculation
member_para_seq = cloneTable.select([
    pl.col("clonotypeKey").alias("member_join_key"),
    pl.col("paratope_sequence").fill_null("").alias("member_paratope")
]).unique("member_join_key", keep="first")

centroid_para_seq = cloneTable.select([
    pl.col("clonotypeKey").alias("centroid_join_key"),
    pl.col("paratope_sequence").fill_null("").alias("centroid_paratope")
]).unique("centroid_join_key", keep="first")

distance_df = distance_df.join(
    member_para_seq,
    left_on="clonotypeKey",
    right_on="member_join_key",
    how="left"
)

distance_df = distance_df.join(
    centroid_para_seq,
    left_on="clusterId",
    right_on="centroid_join_key",
    how="left"
)

# Calculate normalized Levenshtein distance on paratope sequences
distance_df = distance_df.with_columns(
    pl.when(pl.col("member_paratope").is_not_null() & pl.col("centroid_paratope").is_not_null())
      .then(pds.str_leven(pl.col("member_paratope"), pl.col("centroid_paratope"), return_sim=False))
      .when(pl.col("member_paratope").is_not_null() & pl.col("centroid_paratope").is_null())
      .then(pl.col("member_paratope").str.len_chars())
      .when(pl.col("member_paratope").is_null() & pl.col("centroid_paratope").is_not_null())
      .then(pl.col("centroid_paratope").str.len_chars())
      .otherwise(0)
      .alias("raw_distance"),

    pl.col("centroid_paratope").str.len_chars().fill_null(0).alias("centroid_length")
)

distance_df = distance_df.with_columns(
    pl.when(pl.col("centroid_length") > 0)
      .then(
          pl.min_horizontal(
              pl.lit(1.0, dtype=pl.Float64),
              pl.col("raw_distance").cast(pl.Float64) / pl.col("centroid_length").cast(pl.Float64)
          )
      )
      .when(pl.col("raw_distance") == 0)
      .then(pl.lit(0.0, dtype=pl.Float64))
      .otherwise(pl.lit(1.0, dtype=pl.Float64))
      .alias("distanceToCentroid")
)

output_columns = [
    "clonotypeKey",
    "clusterId",
    "clonotypeKeyLabel",
    "clusterLabel",
    "distanceToCentroid"
]
distance_df_to_write = distance_df.select(output_columns)
distance_df_to_write = distance_df_to_write.unique(subset=["clonotypeKey"], keep="first")

output_distance_tsv = "distance_to_centroid.tsv"
distance_df_to_write.write_csv(output_distance_tsv, separator="\t")
print(f"Generated {output_distance_tsv}")

# --- Generate cluster-radius.tsv ---
cluster_radius_df = distance_df_to_write.group_by("clusterId").agg(
    pl.max("distanceToCentroid").alias("clusterRadius")
)
cluster_radius_df.write_csv(clusterRadiusTsv, separator="\t")
print(f"Generated {clusterRadiusTsv}")

# --- Generate files for top clusters for bubble plotting ---
cluster_abundances_top_df = cluster_abundances.join(top_cluster_ids_df, on="clusterId", how="inner")
cluster_abundances_top_df.write_csv("abundances-top.tsv", separator="\t")

cluster_to_seq_top_df = cluster_to_seq.join(top_cluster_ids_df, on="clusterId", how="inner")
cluster_to_seq_top_df.write_csv("cluster-to-seq-top.tsv", separator="\t")

cluster_radius_top_df = cluster_radius_df.join(top_cluster_ids_df, on="clusterId", how="inner")
cluster_radius_top_df.write_csv("cluster-radius-top.tsv", separator="\t")
