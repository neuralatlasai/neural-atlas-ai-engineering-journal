# GLM-5.2 — Evidence-Grounded Architecture Reconstruction

**Target checkpoint:** `zai-org/GLM-5.2`
**Release date:** June 16, 2026
**Analysis cutoff:** July 20, 2026
**Primary evidence:** official Z.ai release material, Hugging Face checkpoint/configuration, Z.ai source repository, GLM-5 technical report, official Transformers implementation and IndexCache paper.

The supplied architecture-analysis protocol was applied with its required principal-research-scientist scope across frontier architectures and sparse MoE systems. 

---

## 1. Executive architectural statement

GLM-5.2 is not a fundamentally rescaled successor to GLM-5. It preserves the **744B-total / approximately 40B-active sparse-MoE family topology**, while extending the advertised context capacity from approximately 200K to **1,048,576 tokens** and introducing two material inference-oriented changes:

1. **IndexShare:** expensive DSA index construction is executed only at selected “full-indexer” layers and reused by subsequent layers.
2. **Reworked multi-token prediction:** shared MTP execution uses IndexShare/KVShare plus rejection sampling and an end-to-end total-variation training loss.

The executable checkpoint configuration establishes a **78-block decoder**, hidden width 6,144, 64 MLA heads, 256 routed experts, top-8 expert activation, one shared expert per sparse layer, and 75 sparse-MoE FFN blocks following three dense-FFN blocks. ([Z.ai][1])

The central design is therefore:

[
\boxed{
\text{MLA}
+
\text{Dynamic Sparse Attention}
+
\text{cross-layer index reuse}
+
\text{sparse MoE}
+
\text{shared-parameter MTP}
}
]

The brutal engineering truth is that IndexShare substantially reduces **indexer compute**, but does not eliminate the dominant long-context cache-capacity problem. At the configured 1,048,576-token limit, the ideal BF16 MLA cache alone is approximately **87.75 GiB per sequence**, before allocator metadata, indexer state, MTP state, temporary workspaces or fragmentation.

---

## 2. Version and evidence boundary

| Artifact                                | Target evidence                                               |
| --------------------------------------- | ------------------------------------------------------------- |
| Official GLM-5.2 blog                   | Release-level changes, IndexShare, MTP and 1M-context claims  |
| `zai-org/GLM-5.2/config.json`           | Executable architectural dimensions                           |
| Transformers GLM-MoE-DSA implementation | Forward topology, MLA, indexer and router equations           |
| GLM-5 technical report                  | Confirmed lineage when consistent with the GLM-5.2 checkpoint |
| IndexCache paper                        | Formal cross-layer index-reuse mechanism                      |
| Subscription page                       | **Excluded:** commercial packaging, not architecture evidence |

The current public checkpoint revision inspected is the Hugging Face `main` branch around short revision `b4734de`. The repository exposes approximately 1.51 TB of checkpoint material across 282 `safetensors` shards. ([Hugging Face][2])

---

## 3. Verified configuration

| Property                       |                     GLM-5.2 |
| ------------------------------ | --------------------------: |
| Architecture class             |      `GlmMoeDsaForCausalLM` |
| Model type                     |               `glm_moe_dsa` |
| Vocabulary                     |                     154,880 |
| Maximum positions              |                   1,048,576 |
| Backbone layers                |                          78 |
| Hidden width (d)               |                       6,144 |
| Attention heads                |                          64 |
| Q/K total head width           |                         256 |
| Non-positional Q/K width       |                         192 |
| RoPE Q/K width                 |                          64 |
| Value head width               |                         256 |
| Query LoRA rank                |                       2,048 |
| KV LoRA rank                   |                         512 |
| DSA index heads                |                          32 |
| Index-head width               |                         128 |
| Sparse attention top-(k)       |                       2,048 |
| Index-sharing frequency        |                    4 layers |
| Dense FFN blocks               |                           3 |
| Sparse-MoE blocks              |                          75 |
| Dense FFN width                |                      12,288 |
| Per-expert FFN width           |                       2,048 |
| Routed experts                 |                         256 |
| Activated routed experts/token |                           8 |
| Shared experts/layer           |                           1 |
| Router scoring                 |                     Sigmoid |
| Router scaling                 |                         2.5 |
| Router computation             |                        FP32 |
| Activation                     |                 SiLU/SwiGLU |
| Normalization                  | RMSNorm, (\epsilon=10^{-5}) |
| RoPE base                      |             (8{,}000{,}000) |
| Embedding/LM-head tying        |                          No |
| Checkpoint dtype               |                        BF16 |
| Parameterized MTP layers       |                           1 |

These values come directly from the released configuration rather than being inherited from GLM-5 prose. ([Hugging Face][3])

### Configuration ambiguity resolved by implementation

The configuration contains a generic `head_dim=192`, but the actual MLA computation uses:

[
d_q=d_k
=======

# d_{\text{nope}}+d_{\text{rope}}

# 192+64

256.

]

The implementation and dedicated fields `qk_nope_head_dim`, `qk_rope_head_dim` and `qk_head_dim` are authoritative for tensor construction. The standalone `head_dim=192` field must not be interpreted as the complete query/key width. ([Hugging Face][3])

---

## 4. End-to-end computational graph

For token IDs

[
\mathbf t\in\mathbb N^{B\times T},
]

the untied token embedding produces

[
X^{(0)}
=======

E[\mathbf t]
\in\mathbb R^{B\times T\times 6144}.
]

Each decoder block applies sequential PreNorm attention and FFN residuals:

[
U^{(\ell)}
==========

\operatorname{RMSNorm}
\left(X^{(\ell)}\right),
]

[
A^{(\ell)}
==========

\operatorname{MLA\text{-}DSA}
\left(
U^{(\ell)},
\mathcal C^{(\ell)},
\mathcal I^{(\ell)}
\right),
]

[
Y^{(\ell)}
==========

X^{(\ell)}+A^{(\ell)},
]

[
V^{(\ell)}
==========

\operatorname{RMSNorm}
\left(Y^{(\ell)}\right),
]

[
X^{(\ell+1)}
============

Y^{(\ell)}
+
\operatorname{FFN}^{(\ell)}
\left(V^{(\ell)}\right).
]

The first three FFN blocks are dense SwiGLU layers. The remaining 75 blocks replace the dense FFN with a shared-plus-routed MoE. After block 77:

[
H
=

\operatorname{RMSNorm}
\left(X^{(78)}\right),
]

[
Z=H W_{\text{LM}},
\qquad
W_{\text{LM}}
\in
\mathbb R^{6144\times154880}.
]

The embedding and output matrices are not tied. ([GitHub][4])

---

## 5. Multi-head latent attention

GLM-5.2 does not cache conventional per-head (K) and (V) tensors. It compresses them through a 512-dimensional KV latent.

### Query path

[
C_Q
===

\operatorname{RMSNorm}
\left(
U W_{Q,A}
\right),
\qquad
C_Q\in\mathbb R^{B\times T\times2048},
]

[
Q
=

C_Q W_{Q,B}
\in
\mathbb R^{B\times T\times64\times256}.
]

Each query head is split into:

[
Q_h
===

\left[
Q_h^{\text{nope}};
Q_h^{\text{rope}}
\right],
]

where

[
Q_h^{\text{nope}}\in\mathbb R^{192},
\qquad
Q_h^{\text{rope}}\in\mathbb R^{64}.
]

### KV path

[
\left[
C_{KV};
K^{\text{rope}}
\right]
=======

U W_{KV,A},
]

with

[
C_{KV}\in\mathbb R^{B\times T\times512},
\qquad
K^{\text{rope}}\in\mathbb R^{B\times T\times64}.
]

The compressed latent is expanded for attention computation:

[
\left[
K^{\text{nope}};
V
\right]
=======

C_{KV} W_{KV,B},
]

where, after head reshaping,

[
K^{\text{nope}}
\in
\mathbb R^{B\times T\times64\times192},
]

[
V
\in
\mathbb R^{B\times T\times64\times256}.
]

The 64-dimensional RoPE key is shared/broadcast across attention heads. This produces the complete key:

[
K_h
===

\left[
K_h^{\text{nope}};
K^{\text{rope}}
\right].
]

The implementation therefore has 64 query heads and 64 logical KV heads, but its persistent cache payload is the 512-dimensional latent plus the 64-dimensional positional key—not 64 independently cached full-width K/V heads. ([GitHub][4])

---

## 6. Dynamic Sparse Attention and IndexShare

### 6.1 Lightweight indexer

A full indexer constructs 32 index queries with width 128:

[
Q_I
===

C_Q W_{I,Q}
\in
\mathbb R^{B\times T_q\times32\times128},
]

and a shared index key:

[
K_I
===

\operatorname{LayerNorm}
\left(
U W_{I,K}
\right)
\in
\mathbb R^{B\times T_k\times128}.
]

The index-query representation includes a 64-dimensional RoPE component and a 64-dimensional non-positional component.

For query (i), key (j) and index head (h):

[
a_{ijh}
=======

\operatorname{ReLU}
\left(
\frac{
\langle q_{ih}^{I},k_j^{I}\rangle
}{
\sqrt{128}
}
\right).
]

Learned query-dependent head weights (w_{ih}) aggregate the 32 scores:

[
s_{ij}
======

\sum_{h=1}^{32}
w_{ih}a_{ijh}.
]

After causal masking:

[
\mathcal I_i
============

\operatorname{TopK}
\left(
s_{i,:},
2048
\right).
]

The expensive MLA attention is then evaluated only on the selected positions (\mathcal I_i). ([GitHub][4])

### 6.2 Cross-layer reuse schedule

The released configuration contains:

* **21 full-indexer layers**
* **57 shared-index layers**

The full indexers occur at layers:

[
{0,1,2,6,10,14,\ldots,74}.
]

The remaining layers reuse the most recently generated top-(k) index set.

Therefore, relative to one indexer per layer:

[
R_{\text{removed}}
==================

# 1-\frac{21}{78}

73.08%.
]

This is consistent with the approximately 75% indexer-removal regime studied in the IndexCache work. The official release names the GLM-5.2 mechanism **IndexShare**, while the linked research paper uses **IndexCache** for the broader cross-layer index-reuse method. ([Hugging Face][3])

### 6.3 Complexity boundary

For sequence length (T) and selected attention width (k=2048):

[
C_{\text{sparse-attention}}
===========================

O(Tk),
]

while a full indexer still contains a pairwise retrieval-scoring component:

[
C_{\text{indexer}}
==================

O(T^2).
]

IndexShare reduces the number of layers paying this (O(T^2)) retrieval cost; it does not mathematically convert the indexer itself into a linear-time operator.

At maximum context:

[
\frac{T}{k}
===========

# \frac{1{,}048{,}576}{2048}

512.

]

This is a maximum candidate-set reduction of (512\times) relative to dense causal attention, not a (512\times) model-level speedup. Indexer computation, MoE execution, projections, communication and cache movement remain. Z.ai reports approximately a 2.9-fold per-token FLOP reduction at 1M context, which is much smaller—and substantially more credible—than the raw sparsity ratio. ([GitHub][5])

---

## 7. Sparse MoE topology

For normalized block input (V_t), routing logits are evaluated in FP32:

[
r_t
===

W_r V_t
\in
\mathbb R^{256}.
]

The router applies sigmoid scoring:

[
s_{t,e}
=======

\sigma(r_{t,e}).
]

A learned correction bias participates in expert selection, while the uncorrected sigmoid scores determine selected-expert weights. With

[
\mathcal E_t
============

\operatorname{TopK}
\left(
s_t+b,
8
\right),
]

the normalized routing weight is:

[
\alpha_{t,e}
============

2.5
\frac{s_{t,e}}
{\sum_{j\in\mathcal E_t}s_{t,j}},
\qquad
e\in\mathcal E_t.
]

Each routed expert and the shared expert use SwiGLU:

[
f_e(x)
======

W_{e,\text{down}}
\left[
\operatorname{SiLU}
\left(
W_{e,\text{gate}}x
\right)
\odot
W_{e,\text{up}}x
\right].
]

The sparse block output is:

[
\operatorname{MoE}(x_t)
=======================

f_{\text{shared}}(x_t)
+
\sum_{e\in\mathcal E_t}
\alpha_{t,e}f_e(x_t).
]

Thus, each token executes:

* eight of 256 routed experts;
* one shared expert;
* the router;
* the block’s MLA/DSA attention.

The nominal routed-expert sparsity factor is:

[
\rho
====

# \frac{256}{8}

32.

]

This does not imply a 32-fold layer speedup because the shared expert, attention, dispatch, expert-parallel communication and load imbalance remain. ([GitHub][4])

---

## 8. Parameter accounting

Using the released dimensions and reference implementation, the standard 78-block backbone can be reconstructed as follows.

| Component                        | Derived parameters |
| -------------------------------- | -----------------: |
| Token embedding                  |          0.951583B |
| Untied LM head                   |          0.951583B |
| MLA projections across 78 blocks |         12.871732B |
| 21 full DSA indexers             |          0.196810B |
| Three dense SwiGLU FFNs          |          0.679477B |
| 75 sparse MoE FFNs and routers   |        727.724851B |
| RMSNorm parameters               |          0.000965B |
| **Derived subtotal**             |    **743.377001B** |

For one sparse layer, all routed experts contain:

[
P_{\text{routed}}
=================

256
\cdot
3
\cdot
6144
\cdot
2048
====

9.663676416\text{B}.
]

The shared expert contains:

[
P_{\text{shared}}
=================

3
\cdot
6144
\cdot
2048
====

37.748736\text{M}.
]

The router contains:

[
P_{\text{router}}
=================

# 6144\cdot256

1.572864\text{M}.
]

Per token, the active MoE-FFN parameters in a sparse layer are approximately:

[
P_{\text{active,FFN}}
=====================

8(37.748736\text{M})
+
37.748736\text{M}
+
1.572864\text{M}
================

341.311488\text{M}.
]

The derived 743.377B subtotal differs from the rounded 744B designation by approximately 0.084%. However, this is not an exact checkpoint reconciliation because the official report uses a different counting convention—MTP is included while word embeddings and output layers may be excluded. Exact reconciliation requires enumerating all tensors in the checkpoint index rather than comparing unlike counting conventions. ([Hugging Face][3])

---

## 9. KV-cache and index-state accounting

### 9.1 MLA cache

Per cached token and attention layer, the architectural MLA payload is:

[
d_{\text{cache}}
================

d_{\text{KV-latent}}
+
d_{\text{RoPE}}
===============

# 512+64

576.

]

For (B) sequences, context length (T), 78 layers and (p) bytes per scalar:

[
M_{\text{MLA}}
==============

pBT(78)(576).
]

For BF16, (p=2):

[
M_{\text{MLA/token}}
====================

# 2\cdot78\cdot576

# 89{,}856\text{ bytes}

87.75\text{ KiB}.
]

At the configured maximum:

[
T=1{,}048{,}576,
]

[
M_{\text{MLA}}
==============

87.75\text{ GiB per sequence}.
]

This is ideal tensor payload, not realistic serving memory. ([Hugging Face][3])

### 9.2 Full-indexer key state

If each of the 21 full indexers retains a 128-dimensional BF16 key per token:

[
M_{\text{index}}
================

2BT(21)(128).
]

At maximum context:

[
M_{\text{index}}
================

5.25\text{ GiB per sequence}.
]

The combined ideal architectural state becomes:

[
M_{\text{MLA}}+M_{\text{index}}
\approx
93.0\text{ GiB}.
]

This figure remains conditional on the runtime retaining index keys in BF16 exactly as represented in the reference cache path. Production engines may alter precision, sharding, transfer policy and lifetime.

It also excludes:

* paged-allocation metadata;
* fragmentation and reserved capacity;
* MTP transient state;
* prefix-cache metadata;
* CUDA/NPU graph workspaces;
* attention and MoE temporary buffers;
* duplicated or replicated cache components;
* host-side cache-transfer buffers.

The official release material explicitly states that at 1M context the bottleneck shifts toward KV capacity, cache transfer, kernels and CPU scheduling. This is consistent with the derived cache magnitude. ([GitHub][4])

---

## 10. Multi-token prediction

The released config exposes one parameterized next-token prediction layer:

[
N_{\text{MTP-parameterized}}=1.
]

The GLM-5.2 release describes recurrent/shared application of the MTP machinery rather than seven independently parameterized predictors. The reported ablation uses seven speculative steps and adds:

1. IndexShare and KVShare across MTP iterations;
2. rejection sampling during training;
3. an end-to-end total-variation loss.

Reported average accepted length changes from:

[
4.56
\rightarrow
5.10
\rightarrow
5.29
\rightarrow
5.47,
]

corresponding to an approximately 20% improvement over the stated baseline.

However, the official Transformers implementation explicitly does **not** implement the MTP layer. Consequently, the public generic Transformers forward path cannot independently reproduce GLM-5.2 speculative execution, acceptance length or KVShare behavior. The exact MTP tensor graph, state transitions, rejection-sampling algorithm and production verifier integration remain incompletely disclosed. ([Z.ai][1])

---

## 11. Precision and runtime boundary

Verified numerical behavior includes:

| Tensor/operator                 | Verified precision                              |
| ------------------------------- | ----------------------------------------------- |
| Released base checkpoint        | BF16                                            |
| Router logits                   | FP32                                            |
| Router correction bias          | FP32                                            |
| Index weighting projection      | Maintained/evaluated in FP32 in reference code  |
| MLA weights and activations     | Checkpoint/model dtype unless backend overrides |
| KV cache                        | Backend-dependent                               |
| Accumulation precision          | Backend-dependent                               |
| FP8 checkpoint                  | Separate release exists                         |
| FP8 scaling/grouping/exclusions | Undisclosed in inspected primary sources        |

The presence of an FP8 checkpoint does not disclose whether it uses per-tensor, per-channel, block-wise or microscaling quantization, nor does it establish accumulator precision or excluded layers. Those fields must remain `UNDISCLOSED`. ([GitHub][5])

The reference Transformers model supports SDPA-style execution, but production Z.ai serving uses additional engine-level optimization. The release mentions LayerSplit, revised memory management, cache-transfer optimization, long-context kernels and CPU scheduling. No inspected public source is sufficient to reconstruct the exact production kernel graph, sharding topology or device-specific execution schedule. ([Z.ai][1])

---

## 12. GLM-5 → GLM-5.2 architectural delta

| Axis                            | GLM-5 lineage                     | GLM-5.2                                            |
| ------------------------------- | --------------------------------- | -------------------------------------------------- |
| Nominal scale                   | 744B / approximately 40B active   | Preserved                                          |
| Backbone                        | MLA + DSA + sparse MoE            | Preserved                                          |
| Context configuration           | Approximately 200K                | 1,048,576                                          |
| DSA indexers                    | Per-layer or earlier reuse regime | One full indexer approximately every four layers   |
| Full indexer count              | Not transferred as target fact    | 21                                                 |
| Shared-index layers             | Not transferred as target fact    | 57                                                 |
| MTP                             | Parameter sharing already present | IndexShare/KVShare, rejection sampling and TV loss |
| Per-token FLOP reduction at 1M  | Not applicable                    | Reported 2.9×                                      |
| MTP accepted-length improvement | Baseline lineage                  | Reported up to approximately 20%                   |
| Production long-context runtime | Earlier engine                    | LayerSplit/cache/kernel/scheduling revisions       |

The 1M limit should not be attributed solely to a larger RoPE base. The config indeed uses (\theta=8{,}000{,}000), but the release additionally describes mid-training with IndexShare at 128K and substantial serving-system work. The precise long-context data mixture, position curriculum and extrapolation ablations are not publicly sufficient to isolate the contribution of each component. ([Z.ai][1])

---

## 13. Contradictions and unresolved fields

### Layer-count inconsistency

The GLM-5 report prose refers to reducing the architecture to 80 layers, while its table and the GLM-5.2 executable config imply:

[
3\text{ dense backbone}
+
75\text{ MoE backbone}
======================

78\text{ backbone layers},
]

plus one MTP layer.

Because executable configuration is stronger evidence than prose, **78 backbone layers plus one parameterized MTP layer** is used for GLM-5.2. The report’s “80 layers” wording remains an unresolved counting-convention inconsistency. ([ar5iv][6])

### Material disclosure gaps

| Missing field                                       | Status                                     |
| --------------------------------------------------- | ------------------------------------------ |
| Exact MTP computation graph                         | `UNDISCLOSED`                              |
| MTP checkpoint tensor mapping and verifier path     | `UNDISCLOSED`                              |
| Exact 744B counting convention for GLM-5.2          | Partially disclosed                        |
| Exact activated-parameter convention                | Partially disclosed                        |
| Production expert-parallel topology                 | `UNDISCLOSED`                              |
| Expert capacity factor and token-dropping behavior  | `UNDISCLOSED`                              |
| Router load-distribution measurements               | `UNDISCLOSED`                              |
| 1M-context training curriculum                      | Partially disclosed                        |
| Production KV-cache precision                       | `UNDISCLOSED`                              |
| FP8 group size, scale format and exclusions         | `UNDISCLOSED`                              |
| Production cache allocator and eviction policy      | `UNDISCLOSED`                              |
| Exact custom-kernel source and tile configuration   | `UNDISCLOSED`                              |
| Full tokenizer algorithm and pre-tokenization rules | Not established by the inspected artifacts |
| Hardware-normalized 1M throughput and latency       | Not sufficiently disclosed                 |

---

## 14. Evidence-calibrated confidence

Using

[
C
=

100
\left(
0.40E+0.25R+0.20V+0.15K
\right),
]

where (E) is primary-evidence coverage, (R) is agreement, (V) is independent verification and (K) is field completeness:

| Area                     |  (E) |  (R) |  (V) |  (K) |    Score |
| ------------------------ | ---: | ---: | ---: | ---: | -------: |
| Backbone dimensions      | 1.00 | 0.95 | 0.95 | 0.95 | **97.0** |
| MLA and DSA topology     | 1.00 | 1.00 | 0.95 | 0.90 | **97.5** |
| IndexShare schedule      | 1.00 | 1.00 | 1.00 | 0.95 | **99.3** |
| MoE routing topology     | 1.00 | 0.95 | 0.95 | 0.90 | **96.3** |
| Parameter reconstruction | 0.95 | 0.90 | 1.00 | 0.80 | **92.5** |
| KV-cache payload         | 0.90 | 0.90 | 0.95 | 0.75 | **88.8** |
| MTP architecture         | 0.80 | 0.75 | 0.25 | 0.55 | **64.0** |
| Production runtime       | 0.65 | 0.60 | 0.20 | 0.45 | **49.8** |

---

## 15. Compact machine-readable summary

```json
{
  "model": "zai-org/GLM-5.2",
  "release_date": "2026-06-16",
  "architecture": "GlmMoeDsaForCausalLM",
  "nominal_parameters": "744B",
  "nominal_active_parameters": "40B",
  "derived_reference_subtotal": 743377000704,
  "backbone_layers": 78,
  "hidden_size": 6144,
  "vocab_size": 154880,
  "max_position_embeddings": 1048576,
  "attention": {
    "type": "MLA + Dynamic Sparse Attention",
    "heads": 64,
    "qk_head_dim": 256,
    "qk_nope_dim": 192,
    "qk_rope_dim": 64,
    "value_head_dim": 256,
    "q_lora_rank": 2048,
    "kv_lora_rank": 512,
    "index_heads": 32,
    "index_head_dim": 128,
    "index_topk": 2048,
    "full_indexer_layers": 21,
    "shared_index_layers": 57
  },
  "moe": {
    "dense_ffn_layers": 3,
    "moe_layers": 75,
    "routed_experts": 256,
    "selected_experts": 8,
    "shared_experts": 1,
    "expert_intermediate_size": 2048,
    "router_score": "sigmoid",
    "router_scaling_factor": 2.5,
    "router_dtype": "float32"
  },
  "normalization": {
    "type": "RMSNorm",
    "placement": "sequential PreNorm",
    "epsilon": 1e-5
  },
  "precision": {
    "checkpoint": "bfloat16",
    "fp8_checkpoint_available": true,
    "kv_cache_precision": "UNDISCLOSED"
  },
  "mtp": {
    "parameterized_layers": 1,
    "shared_iteration_execution": true,
    "transformers_reference_support": false
  },
  "ideal_bf16_state_at_max_context": {
    "mla_cache_gib_per_sequence": 87.75,
    "conditional_index_key_cache_gib": 5.25,
    "combined_payload_gib": 93.0
  }
}
```

**Architectural conclusion:** GLM-5.2’s most defensible innovation is not a new attention primitive or a larger MoE. It is the operational restructuring of DSA and speculative decoding: sparse-attention indices and MTP state are reused across depth and speculative iterations. This lowers repeated computation sufficiently to make 1M-token execution more tractable, but the model still carries approximately **93 GiB of ideal BF16 long-context state per maximum-length sequence** under the reference tensor interpretation. Consequently, practical 1M serving remains fundamentally a distributed memory-capacity, cache-transfer and scheduling problem—not merely an attention-FLOP problem.

[1]: https://z.ai/blog/glm-5.2?utm_source=chatgpt.com "GLM-5.2: Built for Long-Horizon Tasks"
[2]: https://huggingface.co/zai-org/GLM-5.2/tree/main "zai-org/GLM-5.2 at main"
[3]: https://huggingface.co/zai-org/GLM-5.2/blob/main/config.json "config.json · zai-org/GLM-5.2 at main"
[4]: https://github.com/huggingface/transformers/blob/main/src/transformers/models/glm_moe_dsa/modeling_glm_moe_dsa.py "transformers/src/transformers/models/glm_moe_dsa/modeling_glm_moe_dsa.py at main · huggingface/transformers · GitHub"
[5]: https://github.com/zai-org/GLM-5 "GitHub - zai-org/GLM-5: GLM-5: From Vibe Coding to Agentic Engineering · GitHub"
[6]: https://ar5iv.org/html/2602.15763v2 "[2602.15763] GLM-5: from Vibe Coding to Agentic Engineering"


# Algorithm 1 — GLM-5.2 Prefill / Full Forward Architecture

[
\begin{aligned}
&d=6144,\quad L=78,\quad |\mathcal V|=154880,\quad H=64,\
&d_q=d_k=256=192+64,\quad d_v=256,\
&r_q=2048,\quad r_{kv}=512,\quad H_I=32,\quad d_I=128,\
&k_{\mathrm{DSA}}=2048,\quad E=256,\quad K_{\mathrm{expert}}=8,\
&d_{\mathrm{dense}}=12288,\quad d_{\mathrm{expert}}=2048.
\end{aligned}
]

[
\mathcal F
==========

{0,1,2}
\cup
{4m+2\mid m=1,\ldots,18},
\qquad
|\mathcal F|=21.
]

[
\mathcal S
==========

{0,\ldots,77}\setminus\mathcal F,
\qquad
|\mathcal S|=57.
]

| Field             | Mathematical object                                                                                                            |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| **Input**         | (\mathbf t\in\mathbb N^{B\times T},;P\in\mathbb N^{B\times T},;M\in\mathbb R^{B\times1\times T\times T})                       |
| **Parameters**    | (\Theta={E,W_{\mathrm{MLA}}^{(\ell)},W_{\mathrm{index}}^{(\ell)},W_{\mathrm{FFN/MoE}}^{(\ell)},W_{\mathrm{LM}}}_{\ell=0}^{77}) |
| **Initial state** | (\mathcal C^{(\ell)}\leftarrow\varnothing,;\mathcal K_I^{(\ell)}\leftarrow\varnothing,;\mathcal I\leftarrow\varnothing)        |
| **Output**        | (Z\in\mathbb R^{B\times T\times154880},;{\mathcal C^{(\ell)}}_{\ell=0}^{77},;\mathcal I)                                       |

|   Step | Mathematical operation                                                                                                                                                                                                                            |
| -----: | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
|  **1** | (\displaystyle X^{(0)}\leftarrow E[\mathbf t]\in\mathbb R^{B\times T\times6144})                                                                                                                                                                  |
|  **2** | (\displaystyle (\cos P,\sin P)\leftarrow\operatorname{InterleavedRoPE}!\left(P;\theta=8{,}000{,}000\right))                                                                                                                                       |
|  **3** | (\displaystyle \textbf{for }\ell=0,\ldots,77\textbf{ do})                                                                                                                                                                                         |
|  **4** | (\displaystyle U^{(\ell)}\leftarrow\operatorname{RMSNorm}!\left(X^{(\ell)};\epsilon=10^{-5}\right))                                                                                                                                               |
|  **5** | (\displaystyle C_Q^{(\ell)}\leftarrow\operatorname{RMSNorm}!\left(U^{(\ell)}W_{Q,A}^{(\ell)}\right)\in\mathbb R^{B\times T\times2048})                                                                                                            |
|  **6** | (\displaystyle Q^{(\ell)}\leftarrow\operatorname{reshape}!\left(C_Q^{(\ell)}W_{Q,B}^{(\ell)}\right)\in\mathbb R^{B\times H\times T\times256})                                                                                                     |
|  **7** | (\displaystyle [Q_{\mathrm{nope}}^{(\ell)};Q_{\mathrm{rope}}^{(\ell)}]\leftarrow Q^{(\ell)},\quad Q_{\mathrm{nope}}^{(\ell)}\in\mathbb R^{B\times64\times T\times192},\quad Q_{\mathrm{rope}}^{(\ell)}\in\mathbb R^{B\times64\times T\times64})   |
|  **8** | (\displaystyle Q_{\mathrm{rope}}^{(\ell)}\leftarrow\operatorname{RoPE}!\left(Q_{\mathrm{rope}}^{(\ell)},P\right))                                                                                                                                 |
|  **9** | (\displaystyle [C_{KV}^{(\ell)};K_{\mathrm{rope}}^{(\ell)}]\leftarrow U^{(\ell)}W_{KV,A}^{(\ell)},\quad C_{KV}^{(\ell)}\in\mathbb R^{B\times T\times512},\quad K_{\mathrm{rope}}^{(\ell)}\in\mathbb R^{B\times T\times64})                        |
| **10** | (\displaystyle [K_{\mathrm{nope}}^{(\ell)};V^{(\ell)}]\leftarrow\operatorname{reshape}!\left(\operatorname{RMSNorm}(C_{KV}^{(\ell)})W_{KV,B}^{(\ell)}\right))                                                                                     |
|        | (\displaystyle K_{\mathrm{nope}}^{(\ell)}\in\mathbb R^{B\times64\times T\times192},\qquad V^{(\ell)}\in\mathbb R^{B\times64\times T\times256})                                                                                                    |
| **11** | (\displaystyle K_{\mathrm{rope}}^{(\ell)}\leftarrow\operatorname{RoPE}!\left(K_{\mathrm{rope}}^{(\ell)},P\right))                                                                                                                                 |
| **12** | (\displaystyle K^{(\ell)}\leftarrow[K_{\mathrm{nope}}^{(\ell)};\operatorname{Broadcast}*{H}(K*{\mathrm{rope}}^{(\ell)})]\in\mathbb R^{B\times64\times T\times256})                                                                                |
| **13** | (\displaystyle \mathcal C^{(\ell)}\leftarrow\operatorname{CacheAppend}*{\ell}!\left(\mathcal C^{(\ell)},C*{KV}^{(\ell)},K_{\mathrm{rope}}^{(\ell)},K^{(\ell)},V^{(\ell)}\right)\quad\triangleright;\text{production representation: UNDISCLOSED}) |
| **14** | (\displaystyle \textbf{if }\ell\in\mathcal F\textbf{ then})                                                                                                                                                                                       |
| **15** | (\displaystyle Q_I^{(\ell)}\leftarrow\operatorname{reshape}!\left(C_Q^{(\ell)}W_{I,Q}^{(\ell)}\right)\in\mathbb R^{B\times T\times32\times128})                                                                                                   |
| **16** | (\displaystyle K_I^{(\ell)}\leftarrow\operatorname{LayerNorm}!\left(U^{(\ell)}W_{I,K}^{(\ell)};\epsilon=10^{-6}\right)\in\mathbb R^{B\times T\times128})                                                                                          |
| **17** | (\displaystyle Q_I^{(\ell)},K_I^{(\ell)}\leftarrow\operatorname{InterleavedRoPE}_{64+64}!\left(Q_I^{(\ell)},K_I^{(\ell)},P\right))                                                                                                                |
| **18** | (\displaystyle a_{ijh}^{(\ell)}\leftarrow\operatorname{ReLU}!\left(\frac{\left\langle q_{ih}^{I,(\ell)},k_j^{I,(\ell)}\right\rangle}{\sqrt{128}}\right))                                                                                          |
| **19** | (\displaystyle w_i^{(\ell)}\leftarrow\operatorname{FP32}!\left(W_{I,w}^{(\ell)}U_i^{(\ell)}\right)\in\mathbb R^{32})                                                                                                                              |
| **20** | (\displaystyle s_{ij}^{(\ell)}\leftarrow\frac{1}{\sqrt{32}}\sum_{h=1}^{32}w_{ih}^{(\ell)}a_{ijh}^{(\ell)}+M_{ij})                                                                                                                                 |
| **21** | (\displaystyle \mathcal I_i^{(\ell)}\leftarrow\operatorname{TopK}!\left(s_{i,:}^{(\ell)},\min(2048,T)\right)\in\mathbb Z^{k_{\mathrm{DSA}}})                                                                                                      |
| **22** | (\displaystyle \mathcal I\leftarrow\mathcal I^{(\ell)},\qquad\mathcal K_I^{(\ell)}\leftarrow K_I^{(\ell)})                                                                                                                                        |
| **23** | (\displaystyle \textbf{else}\quad \mathcal I^{(\ell)}\leftarrow\mathcal I\quad\triangleright;\text{reuse most recent full-indexer result})                                                                                                        |
| **24** | (\displaystyle \textbf{end if})                                                                                                                                                                                                                   |
| **25** | (\displaystyle \beta_{ijh}^{(\ell)}\leftarrow\frac{\left\langle q_{ih}^{(\ell)},k_{jh}^{(\ell)}\right\rangle}{\sqrt{256}}+M_{ij},\qquad j\in\mathcal I_i^{(\ell)})                                                                                |
| **26** | (\displaystyle p_{ijh}^{(\ell)}\leftarrow\frac{\exp\beta_{ijh}^{(\ell)}}{\sum_{r\in\mathcal I_i^{(\ell)}}\exp\beta_{irh}^{(\ell)}})                                                                                                               |
| **27** | (\displaystyle O_{ih}^{(\ell)}\leftarrow\sum_{j\in\mathcal I_i^{(\ell)}}p_{ijh}^{(\ell)}V_{jh}^{(\ell)}\in\mathbb R^{256})                                                                                                                        |
| **28** | (\displaystyle A^{(\ell)}\leftarrow\operatorname{reshape}(O^{(\ell)})W_O^{(\ell)}\in\mathbb R^{B\times T\times6144})                                                                                                                              |
| **29** | (\displaystyle Y^{(\ell)}\leftarrow X^{(\ell)}+A^{(\ell)}\quad\triangleright;\text{attention residual})                                                                                                                                           |
| **30** | (\displaystyle R^{(\ell)}\leftarrow\operatorname{RMSNorm}!\left(Y^{(\ell)};\epsilon=10^{-5}\right))                                                                                                                                               |
| **31** | (\displaystyle \textbf{if }\ell<3\textbf{ then})                                                                                                                                                                                                  |
| **32** | (\displaystyle F^{(\ell)}\leftarrow W_{\mathrm{down}}^{(\ell)}!\left[\operatorname{SiLU}!\left(R^{(\ell)}W_{\mathrm{gate}}^{(\ell)}\right)\odot\left(R^{(\ell)}W_{\mathrm{up}}^{(\ell)}\right)\right])                                            |
|        | (\displaystyle 6144\rightarrow12288\rightarrow6144)                                                                                                                                                                                               |
| **33** | (\displaystyle \textbf{else})                                                                                                                                                                                                                     |
| **34** | (\displaystyle r_t^{(\ell)}\leftarrow\operatorname{FP32}!\left(W_r^{(\ell)}R_t^{(\ell)}\right)\in\mathbb R^{256})                                                                                                                                 |
| **35** | (\displaystyle s_t^{(\ell)}\leftarrow\sigma!\left(r_t^{(\ell)}\right))                                                                                                                                                                            |
| **36** | (\displaystyle \mathcal E_t^{(\ell)}\leftarrow\operatorname{TopK}!\left(s_t^{(\ell)}+b_{\mathrm{corr}}^{(\ell)},8\right))                                                                                                                         |
| **37** | (\displaystyle \alpha_{t,e}^{(\ell)}\leftarrow2.5\frac{s_{t,e}^{(\ell)}}{\sum_{j\in\mathcal E_t^{(\ell)}}s_{t,j}^{(\ell)}+10^{-20}},\qquad e\in\mathcal E_t^{(\ell)})                                                                             |
| **38** | (\displaystyle {\mathcal B_e^{(\ell)}}*{e=1}^{256}\leftarrow\operatorname{Dispatch}*{\mathrm{EP}}!\left(R^{(\ell)},{\mathcal E_t^{(\ell)},\alpha_{t,e}^{(\ell)}}_{t=1}^{BT}\right)\quad\triangleright;\text{collective topology: UNDISCLOSED})    |
| **39** | (\displaystyle \widetilde{\mathcal B}*e^{(\ell)}\leftarrow\operatorname{AllToAll}*{\mathrm{EP}}!\left(\mathcal B_e^{(\ell)}\right)\quad\triangleright;\text{conditional on expert parallelism})                                                   |
| **40** | (\displaystyle f_e^{(\ell)}(x)\leftarrow W_{\mathrm{down},e}^{(\ell)}!\left[\operatorname{SiLU}!\left(W_{\mathrm{gate},e}^{(\ell)}x\right)\odot W_{\mathrm{up},e}^{(\ell)}x\right])                                                               |
|        | (\displaystyle 6144\rightarrow2048\rightarrow6144)                                                                                                                                                                                                |
| **41** | (\displaystyle F_{\mathrm{routed}}^{(\ell)}\leftarrow\operatorname{Combine}*{\mathrm{EP}}!\left({\alpha*{t,e}^{(\ell)}f_e^{(\ell)}(\widetilde{\mathcal B}_{e,t}^{(\ell)})}\right))                                                                |
| **42** | (\displaystyle F_{\mathrm{shared}}^{(\ell)}\leftarrow f_{\mathrm{shared}}^{(\ell)}!\left(R^{(\ell)}\right))                                                                                                                                       |
| **43** | (\displaystyle F^{(\ell)}\leftarrow F_{\mathrm{routed}}^{(\ell)}+F_{\mathrm{shared}}^{(\ell)})                                                                                                                                                    |
| **44** | (\displaystyle \textbf{end if})                                                                                                                                                                                                                   |
| **45** | (\displaystyle X^{(\ell+1)}\leftarrow Y^{(\ell)}+F^{(\ell)}\quad\triangleright;\text{channel-mixer residual})                                                                                                                                     |
| **46** | (\displaystyle \textbf{end for})                                                                                                                                                                                                                  |
| **47** | (\displaystyle H\leftarrow\operatorname{RMSNorm}!\left(X^{(78)};\epsilon=10^{-5}\right))                                                                                                                                                          |
| **48** | (\displaystyle Z\leftarrow HW_{\mathrm{LM}},\qquad W_{\mathrm{LM}}\in\mathbb R^{6144\times154880})                                                                                                                                                |
| **49** | (\displaystyle \operatorname{return}\left(Z,{\mathcal C^{(\ell)}}_{\ell=0}^{77},\mathcal I\right))                                                                                                                                                |

   

---

# Algorithm 2 — GLM-5.2 One-Token Autoregressive Decode

| Field                   | Mathematical object                                                                                             |
| ----------------------- | --------------------------------------------------------------------------------------------------------------- |
| **Input**               | (x_t\in\mathbb N^{B\times1},;P_t,;\mathcal C_t,;{\mathcal K_{I,t}^{(\ell)}},;\mathcal I_t)                      |
| **Optional input**      | speculative horizon (N_{\mathrm{spec}}), MTP state (\mathcal D_t)                                               |
| **Output**              | (\hat{\mathbf x}*{t+1:t+m},;\mathcal C*{t+m})                                                                   |
| **Transactional state** | committed state (\mathcal C_t), tentative target state (\widetilde{\mathcal C}), speculative state (\mathcal D) |

|   Step | Mathematical operation                                                                                                                                                                                     |
| -----: | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
|  **1** | (\displaystyle X_t^{(0)}\leftarrow E[x_t]\in\mathbb R^{B\times1\times6144})                                                                                                                                |
|  **2** | (\displaystyle \widetilde{\mathcal C}_{t+1}\leftarrow\operatorname{CloneTransactional}(\mathcal C_t))                                                                                                      |
|  **3** | (\displaystyle \textbf{for }\ell=0,\ldots,77\textbf{ do})                                                                                                                                                  |
|  **4** | (\displaystyle U_t^{(\ell)}\leftarrow\operatorname{RMSNorm}!\left(X_t^{(\ell)}\right))                                                                                                                     |
|  **5** | (\displaystyle C_{Q,t}^{(\ell)},Q_t^{(\ell)},C_{KV,t}^{(\ell)},K_t^{(\ell)},V_t^{(\ell)}\leftarrow\operatorname{MLAProject}_{\ell}!\left(U_t^{(\ell)},P_t\right))                                          |
|  **6** | (\displaystyle \widetilde{\mathcal C}*{t+1}^{(\ell)}\leftarrow\operatorname{TentativeAppend}*{\ell}!\left(\mathcal C_t^{(\ell)},C_{KV,t}^{(\ell)},K_t^{(\ell)},V_t^{(\ell)}\right))                        |
|  **7** | (\displaystyle \textbf{if }\ell\in\mathcal F\textbf{ then})                                                                                                                                                |
|  **8** | (\displaystyle Q_{I,t}^{(\ell)}\leftarrow\operatorname{reshape}!\left(C_{Q,t}^{(\ell)}W_{I,Q}^{(\ell)}\right)\in\mathbb R^{B\times1\times32\times128})                                                     |
|  **9** | (\displaystyle s_{t,j}^{(\ell)}\leftarrow\frac{1}{\sqrt{32}}\sum_{h=1}^{32}w_{t,h}^{(\ell)}\operatorname{ReLU}!\left(\frac{\langle q_{t,h}^{I,(\ell)},k_{j}^{I,(\ell)}\rangle}{\sqrt{128}}\right)+M_{t,j}) |
| **10** | (\displaystyle \mathcal I_t^{(\ell)}\leftarrow\operatorname{TopK}!\left(s_{t,:}^{(\ell)},\min(2048,t+1)\right))                                                                                            |
| **11** | (\displaystyle \mathcal I_t\leftarrow\mathcal I_t^{(\ell)})                                                                                                                                                |
| **12** | (\displaystyle \textbf{else}\quad\mathcal I_t^{(\ell)}\leftarrow\mathcal I_t)                                                                                                                              |
| **13** | (\displaystyle \textbf{end if})                                                                                                                                                                            |
| **14** | (\displaystyle A_t^{(\ell)}\leftarrow\operatorname{SparseMLA}!\left(Q_t^{(\ell)},\widetilde{\mathcal C}_{t+1}^{(\ell)},\mathcal I_t^{(\ell)}\right))                                                       |
| **15** | (\displaystyle Y_t^{(\ell)}\leftarrow X_t^{(\ell)}+A_t^{(\ell)})                                                                                                                                           |
| **16** | (\displaystyle R_t^{(\ell)}\leftarrow\operatorname{RMSNorm}!\left(Y_t^{(\ell)}\right))                                                                                                                     |
| **17** | (\displaystyle F_t^{(\ell)}\leftarrow\begin{cases}\operatorname{DenseSwiGLU}*{\ell}(R_t^{(\ell)}),&\ell<3,[2pt]\operatorname{SparseMoE}*{\ell}(R_t^{(\ell)};E=256,K=8),&\ell\ge3,\end{cases})              |
| **18** | (\displaystyle X_t^{(\ell+1)}\leftarrow Y_t^{(\ell)}+F_t^{(\ell)})                                                                                                                                         |
| **19** | (\displaystyle \textbf{end for})                                                                                                                                                                           |
| **20** | (\displaystyle h_t\leftarrow\operatorname{RMSNorm}!\left(X_t^{(78)}\right))                                                                                                                                |
| **21** | (\displaystyle z_{t+1}\leftarrow h_tW_{\mathrm{LM}}\in\mathbb R^{B\times154880})                                                                                                                           |
| **22** | (\displaystyle \textbf{if }N_{\mathrm{spec}}=0\textbf{ then})                                                                                                                                              |
| **23** | (\displaystyle \hat x_{t+1}\leftarrow\operatorname{Select}!\left(z_{t+1};\pi_{\mathrm{generation}}\right))                                                                                                 |
| **24** | (\displaystyle \mathcal C_{t+1}\leftarrow\operatorname{Commit}!\left(\widetilde{\mathcal C}_{t+1}\right))                                                                                                  |
| **25** | (\displaystyle \operatorname{return}!\left(\hat x_{t+1},\mathcal C_{t+1}\right))                                                                                                                           |
| **26** | (\displaystyle \textbf{end if})                                                                                                                                                                            |

---

# Algorithm 3 — GLM-5.2 Optional Shared-Parameter MTP Cycle

| Field      | Mathematical object                                                                  |
| ---------- | ------------------------------------------------------------------------------------ |
| **Input**  | (h_t,;z_{t+1},;\widetilde{\mathcal C}*{t+1},;\mathcal I_t,;N*{\mathrm{spec}})        |
| **State**  | (\mathcal D^{(0)}\leftarrow\operatorname{InitMTP}(h_t,\widetilde{\mathcal C}_{t+1})) |
| **Output** | accepted prefix (\hat{\mathbf x}*{t+1:t+m}), committed state (\mathcal C*{t+m})      |

|   Step | Mathematical operation                                                                                                                                                                                               |                               |
| -----: | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------- |
|  **1** | (\displaystyle \hat x_{t+1}\leftarrow\operatorname{Select}!\left(z_{t+1};\pi_{\mathrm{draft}}\right))                                                                                                                |                               |
|  **2** | (\displaystyle \widehat{\mathbf x}\leftarrow[\hat x_{t+1}])                                                                                                                                                          |                               |
|  **3** | (\displaystyle \mathcal I_{\mathrm{MTP}}\leftarrow\mathcal I_t\quad\triangleright;\text{IndexShare})                                                                                                                 |                               |
|  **4** | (\displaystyle \mathcal C_{\mathrm{MTP}}\leftarrow\operatorname{TargetDerivedState}!\left(\widetilde{\mathcal C}_{t+1}\right)\quad\triangleright;\text{KVShare})                                                     |                               |
|  **5** | (\displaystyle \textbf{for }r=2,\ldots,N_{\mathrm{spec}}\textbf{ do})                                                                                                                                                |                               |
|  **6** | (\displaystyle \left(\widehat z_{t+r},\mathcal D^{(r)}\right)\leftarrow\Phi_{\mathrm{MTP}}!\left(\hat x_{t+r-1},\mathcal D^{(r-1)},\mathcal I_{\mathrm{MTP}},\mathcal C_{\mathrm{MTP}};\Theta_{\mathrm{MTP}}\right)) |                               |
|  **7** | (\displaystyle \hat x_{t+r}\leftarrow\operatorname{Select}!\left(\widehat z_{t+r};\pi_{\mathrm{draft}}\right))                                                                                                       |                               |
|  **8** | (\displaystyle \widehat{\mathbf x}\leftarrow\widehat{\mathbf x}\Vert\hat x_{t+r})                                                                                                                                    |                               |
|  **9** | (\displaystyle \textbf{end for})                                                                                                                                                                                     |                               |
| **10** | (\displaystyle \left({p_{\theta,t+r}}*{r=1}^{N*{\mathrm{spec}}},{\widetilde{\mathcal C}*{t+r}}*{r=1}^{N_{\mathrm{spec}}}\right)\leftarrow\operatorname{TargetVerify}!\left(\mathcal C_t,\widehat{\mathbf x}\right))  |                               |
| **11** | (\displaystyle a_r\leftarrow\operatorname{Accept}!\left(\hat x_{t+r},p_{\theta,t+r},\widehat p_{t+r}\right)\in{0,1}\quad\triangleright;\text{exact rule: UNDISCLOSED})                                               |                               |
| **12** | (\displaystyle m\leftarrow\max\left{q\in[1,N_{\mathrm{spec}}];\middle                                                                                                                                                | ;\prod_{r=1}^{q}a_r=1\right}) |
| **13** | (\displaystyle \hat{\mathbf x}*{t+1:t+m}\leftarrow[\hat x*{t+1},\ldots,\hat x_{t+m}])                                                                                                                                |                               |
| **14** | (\displaystyle \mathcal C_{t+m}\leftarrow\operatorname{Commit}!\left(\widetilde{\mathcal C}_{t+m}\right))                                                                                                            |                               |
| **15** | (\displaystyle \operatorname{Discard}!\left(\mathcal D^{(m+1:N_{\mathrm{spec}})},\widetilde{\mathcal C}*{t+m+1:t+N*{\mathrm{spec}}}\right)\quad\triangleright;\text{rollback rejected suffix})                       |                               |
| **16** | (\displaystyle \operatorname{return}!\left(\hat{\mathbf x}*{t+1:t+m},\mathcal C*{t+m}\right))                                                                                                                        |                               |

[
\boxed{
\Phi_{\mathrm{MTP}},
\operatorname{Accept},
\operatorname{TargetVerify},
\operatorname{Commit},
\operatorname{Discard}
;:;
\mathrm{UNDISCLOSED\ production\ execution\ graph}
}
]

 
# GLM-5.2 Training Stack: Sample Construction, Objectives, RL and Distillation

## 1. Scientific scope and evidence boundary

A defensible GLM-5.2 training reconstruction must separate three evidence layers:

| Evidence class       | What can be established                                                                                                                                                                                                                                                                                                        |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **GLM-5.2 verified** | IndexShare introduced during 128K mid-training; 1M-context coding-agent training; shared-parameter MTP with IndexShare, KVShare, rejection sampling and end-to-end TV loss; critic-based PPO for compacted long-horizon trajectories; token-level optimization; anti-hacking controls; parallel OPD over more than ten experts |
| **GLM-5 lineage**    | 27T-token initial pre-training; 1.5T-token context-extension curriculum; DSA conversion; SFT construction; exact Reasoning-RL equation; asynchronous Agentic-RL equation; General-RL reward architecture; exact cross-stage OPD advantage                                                                                      |
| **Undisclosed**      | GLM-5.2’s complete data mixture, additional token count, optimizer schedule, exact 1M curriculum, SFT loss mask, padding side, truncation policy, MTP TV distribution, critic architecture, PPO coefficients, OPD teacher mixture and stage durations                                                                          |

The released GLM-5.2 model card links the GLM-5 report and IndexCache paper, but there is no standalone GLM-5.2 technical report disclosing the complete training recipe. Architectural or post-training facts from GLM-5 can therefore be used only as **lineage evidence**, not silently promoted to GLM-5.2 facts. ([Hugging Face][1])

---

# 2. Evidence-calibrated training order

The source-supported pipeline is:

[
\boxed{
\begin{aligned}
\mathcal D_{\mathrm{raw}}
&\rightarrow
\mathcal D_{\mathrm{filtered}}
\rightarrow
\mathcal D_{\mathrm{tokenized}}
\rightarrow
\mathcal D_{\mathrm{packed}}\
&\rightarrow
\text{initial pre-training}
\rightarrow
\text{context mid-training}\
&\rightarrow
\text{DSA adaptation}
\rightarrow
\text{IndexShare adaptation}\
&\rightarrow
\text{MTP optimization}
\rightarrow
\text{multi-task SFT}\
&\rightarrow
\text{Reasoning RL}
\rightarrow
\text{Agentic RL}\
&\rightarrow
\text{General RL}
\rightarrow
\text{parallel on-policy distillation}.
\end{aligned}
}
]

The exact relationship is not a single monolithic loss:

[
\mathcal L_{\mathrm{total}}
\neq
\sum_s \lambda_s\mathcal L_s
\quad
\text{evaluated simultaneously}.
]

Instead, each stage operates on a different checkpoint, data distribution and optimization state:

[
\theta_{s+1}
============

\operatorname{Optimize}
\left(
\theta_s,
\mathcal D_s,
\mathcal L_s
\right).
]

GLM-5 explicitly uses sequential Reasoning RL, Agentic RL and General RL followed by on-policy cross-stage distillation. GLM-5.2 reports parallel OPD over more than ten expert models, but does not disclose whether every expert was produced by a purely linear chain or by partially independent branches. ([arXiv][2])

---

# 3. Stage 0 — Data construction

## 3.1 Initial pre-training corpus

GLM-5 lineage discloses three principal data families.

### Web

The web pipeline adds:

* a sentence-embedding-based DCLM classifier;
* a world-knowledge classifier trained using Wikipedia-derived and LLM-labelled data;
* quality filtering for long-tail knowledge recovery.

### Code

The code pipeline includes:

* refreshed code-hosting snapshots;
* code-containing webpages;
* Software Heritage metadata repair;
* improved programming-language classification;
* dedicated classifiers for low-resource programming languages;
* quality-aware sampling.

The resulting fuzzily deduplicated unique code-token volume increased by 28% relative to its predecessor’s pipeline.

### Mathematics and science

The math/science pipeline uses:

* webpages, books and papers;
* improved PDF and webpage extraction;
* LLM-based educational-quality scoring;
* chunk-and-aggregate scoring for long documents.

The GLM-5 report states that synthetic, AI-generated and template-based material was excluded from this **pre-training math/science filtering pipeline**. That statement must not be generalized to mid-training or SFT, where synthetic agent trajectories and rejection-sampled data are explicitly used. ([arXiv][3])

## 3.2 Initial training volume

GLM-5 begins with approximately:

[
N_{\mathrm{initial}}=27\text{T tokens}.
]

The total base-model budget after mid-training is:

[
N_{\mathrm{base}}=28.5\text{T tokens}.
]

These numbers belong to GLM-5. GLM-5.2 states that it substantially expanded 1M-context coding-agent training, but it does not disclose the additional token count or data-mixture percentages. ([arXiv][2])

---

# 4. Stage 1 — Tokenization and sequence formation

## 4.1 What is actually released

The GLM-5.2 checkpoint establishes:

[
|\mathcal V|=154{,}880,
]

[
L_{\max}=1{,}048{,}576,
]

[
\operatorname{PAD}=154820,
]

[
\operatorname{EOS}\in
{154820,154827,154829}.
]

The architecture class is `GlmMoeDsaForCausalLM`, establishing causal autoregressive prediction. ([Hugging Face][4])

## 4.2 Brutal truth about padding

The checkpoint exposes `pad_token_id`; it does **not** disclose:

* the training `padding_side`;
* whether pre-training batches were padded at all;
* whether batches used variable-length packing;
* whether loss normalization was sample-level or token-level;
* whether document boundaries reset attention;
* the exact data collator.

Because token ID `154820` is both a padding ID and one of the EOS IDs, token identity alone is insufficient to distinguish padding from a valid terminal token.

A correct reproduction therefore requires a separate attention mask:

[
a_{b,t}
=======

\begin{cases}
1,&t<L_b,\
0,&t\ge L_b,
\end{cases}
]

and an independent optimization mask:

[
m_{b,t}
=======

a_{b,t},
m^{\mathrm{semantic}}_{b,t}.
]

This is an engineering requirement induced by the released IDs, not evidence that Z.ai used this exact collator.

## 4.3 Brutal truth about truncation

The official sources do not disclose whether GLM-5.2 training used:

* left truncation;
* right truncation;
* middle truncation;
* turn-aware truncation;
* token-budgeted repository selection;
* semantic compaction;
* dynamic sequence splitting.

The GLM-5 report does disclose that TITO is used during asynchronous RL specifically to avoid re-tokenization and re-derived truncation boundaries. That is an RL trajectory-preservation mechanism, not the general pre-training truncation policy. ([arXiv][2])

---

# 5. Stage 2 — Initial causal pre-training

## 5.1 Objective family

The released model is an autoregressive causal LM, and the GLM-5 report explicitly discusses computing the output projection and cross-entropy loss in sequence chunks. Therefore, the verified objective family is next-token causal cross-entropy. ([Hugging Face][4])

For token sequence

[
x_{1:T},
]

the architecture-compatible objective is:

[
\boxed{
\mathcal L_{\mathrm{NTP}}(\theta)
=================================

*

\frac{1}{N_{\mathrm{valid}}}
\sum_{b=1}^{B}
\sum_{t=1}^{T_b-1}
m_{b,t}
\log
p_\theta
\left(
x_{b,t+1}
\mid
x_{b,\le t}
\right)
}
]

with

[
N_{\mathrm{valid}}
==================

\sum_{b,t}m_{b,t}.
]

### Evidence status

* **Objective type:** verified.
* **Exact normalization:** undisclosed.
* **Boundary masking:** undisclosed.
* **Label smoothing:** undisclosed.
* **Z-loss or logit regularization:** undisclosed.
* **MoE auxiliary losses:** undisclosed.
* **Document-boundary attention policy:** undisclosed.

It would be incorrect to claim that GLM-5.2 used blank-infilling objectives merely because older GLM generations did. The released GLM-5.2 artifact is a causal LM, and no source states that the 2021 GLM blank-infilling objective was retained. ([Hugging Face][4])

## 5.2 Sequence-chunked loss execution

For a sequence partition

[
X=
[X^{(1)},\ldots,X^{(C)}],
]

the output projection and cross-entropy can be computed chunkwise:

[
Z^{(c)}
=======

X^{(c)}W_{\mathrm{LM}},
]

[
\mathcal L
==========

\frac{
\sum_{c=1}^{C}
N_c\mathcal L^{(c)}
}{
\sum_{c=1}^{C}N_c
}.
]

This changes peak activation memory, not the mathematical objective. The report states that each chunk’s projection, loss, forward and backward computation can complete before its activations are released. ([arXiv][3])

---

# 6. Stage 3 — Context and agentic mid-training

## 6.1 GLM-5 context curriculum

The disclosed GLM-5 mid-training schedule is:

[
32\text{K context}
\quad
\text{for }1\text{T tokens},
]

[
128\text{K context}
\quad
\text{for }500\text{B tokens},
]

[
200\text{K context}
\quad
\text{for }50\text{B tokens}.
]

Therefore:

[
N_{\mathrm{mid}}
================

# 1\text{T}+500\text{B}+50\text{B}

1.55\text{T tokens}.
]

The report rounds the full base budget to 28.5T. ([arXiv][3])

## 6.2 Mid-training data

The software-engineering sequence construction concatenates:

[
\text{repository files}
\Vert
\text{issue}
\Vert
\text{pull request}
\Vert
\text{commit diff}
\Vert
\text{retrieved relevant files}.
]

The issue–PR dataset contains approximately:

[
10\text{M issue–PR pairs}
]

and:

[
160\text{B unique tokens}.
]

Long-context training combines natural books, papers and documents with synthetic long-range-dependency data. Similar documents may be aggregated by interleaved packing, and a small amount of MRCR-like data is introduced at the 200K stage. ([arXiv][3])

## 6.3 Objective

No distinct mid-training loss is reported. The evidence supports continuation of causal language-model training under a changed context-length and data distribution:

[
\mathcal L_{\mathrm{mid}}
=========================

\mathcal L_{\mathrm{NTP}}
\quad
\text{under }
\mathcal D_{\mathrm{mid}}.
]

This is a derived formulation. The source discloses the curriculum and data changes, not a separate objective equation.

## 6.4 GLM-5.2 extension to 1M

GLM-5.2 reports:

* a 1,048,576-token limit;
* substantially expanded 1M-context training for coding-agent scenarios;
* coverage of large-scale implementation, automated research, performance optimization and complex debugging;
* IndexShare active from a 128K mid-training stage.

It does **not** disclose:

[
N_{\mathrm{1M}},
\quad
\text{1M-stage batch size},
\quad
\text{learning rate},
\quad
\text{packing ratio},
\quad
\text{curriculum duration}.
]

Therefore, there is no evidence for a specific:

[
200\text{K}\rightarrow400\text{K}\rightarrow1\text{M}
]

or similar schedule. ([Z.ai][5])

---

# 7. Stage 4 — DSA conversion

## 7.1 GLM-5 dense-to-sparse transition

GLM-5 applies DSA after mid-training through two phases.

### Indexer warm-up

[
N_{\mathrm{steps}}=1000,
]

[
B_{\mathrm{seq}}=14,
]

[
T=202{,}752.
]

The base-model weights are held fixed during indexer warm-up. The learning rate decreases from:

[
5\times10^{-3}
\rightarrow
2\times10^{-4}.
]

### Sparse adaptation

The indexer and model are then jointly adapted for:

[
20\text{B tokens},
]

using the mid-training data and hyperparameters, with constant learning rate:

[
\eta=10^{-5}.
]

([arXiv][2])

## 7.2 Undisclosed DSA objective

The GLM-5 report does not publish the indexer warm-up loss.

Therefore, none of the following may be asserted as GLM-5’s exact objective:

[
\operatorname{KL}(P_{\mathrm{dense}}\Vert P_{\mathrm{indexer}}),
]

[
\mathcal L_{\mathrm{ranking}},
]

[
\mathcal L_{\mathrm{TopK\ recall}},
]

[
\mathcal L_{\mathrm{contrastive}}.
]

The only source-supported statement is:

[
\theta_{\mathrm{backbone}}
\text{ frozen},
\qquad
\theta_{\mathrm{indexer}}
\text{ optimized}
]

during warm-up, followed by joint sparse adaptation.

---

# 8. Stage 5 — IndexShare adaptation

GLM-5.2 places one indexer at the first layer of each four-layer region and reuses the resulting top-(k) indices in all four layers:

[
\mathcal I^{(\ell)}
===================

# \mathcal I^{(\ell+1)}

# \mathcal I^{(\ell+2)}

\mathcal I^{(\ell+3)}.
]

It begins training with IndexShare at 128K sequence length. ([Z.ai][5])

## 8.1 Loss boundary

The separate IndexCache paper proposes a training-aware cross-layer index distillation method. However, the GLM-5.2 release does not state that GLM-5.2 used the exact IndexCache multi-layer distillation equation.

Therefore:

[
\mathcal L_{\mathrm{IndexShare}}
================================

\mathrm{UNDISCLOSED}.
]

It would be incorrect to import the IndexCache paper’s training loss into GLM-5.2 as a verified fact. The paper is evidence for the broader method family, not proof of the exact target-model recipe. ([arXiv][6])

---

# 9. Stage 6 — Multi-token prediction

## 9.1 GLM-5 lineage

GLM-5 reports parameter sharing across three training-time MTP layers. The purpose is to prevent parameter and cache memory from scaling linearly with speculative depth while reducing training–inference mismatch. ([arXiv][3])

## 9.2 GLM-5.2 MTP changes

GLM-5.2 verifies all of the following:

1. different MTP steps share parameters;
2. the first MTP step computes the index;
3. later steps reuse that top-(k) index;
4. later steps reuse target-model-derived KV state;
5. rejection sampling is introduced;
6. end-to-end total-variation loss is used;
7. the disclosed ablation uses seven MTP steps;
8. acceptance length improves from 4.56 to 5.47 in that GLM-5.1-backbone ablation.

([Z.ai][5])

## 9.3 Exact objective: not reconstructable

Total variation between distributions (P) and (Q) is mathematically:

[
D_{\mathrm{TV}}(P,Q)
====================

\frac12
\sum_{\omega}
|P(\omega)-Q(\omega)|.
]

But the release does not define whether (P) and (Q) are:

* next-token marginals;
* multi-step path distributions;
* accepted-prefix distributions;
* target-versus-draft distributions;
* rejection-sampled empirical distributions.

It also does not disclose:

* whether target logits are stop-gradient;
* whether cross-entropy is added;
* TV coefficient;
* step weighting;
* vocabulary truncation;
* sampling proposal;
* acceptance kernel.

Therefore, an equation such as

[
\mathcal L_{\mathrm{MTP}}
=========================

\mathcal L_{\mathrm{CE}}
+
\lambda_{\mathrm{TV}}D_{\mathrm{TV}}
]

is a plausible implementation family, but **not a verified GLM-5.2 objective**.

---

# 10. Stage 7 — Supervised fine-tuning

## 10.1 SFT data domains

GLM-5 SFT covers:

[
\mathcal D_{\mathrm{SFT}}
=========================

\mathcal D_{\mathrm{chat}}
\cup
\mathcal D_{\mathrm{reasoning}}
\cup
\mathcal D_{\mathrm{coding/agent}}.
]

The categories include:

* question answering, writing, role-play, translation and dialogue;
* mathematical, programming and scientific reasoning;
* frontend/backend engineering;
* tool calling;
* coding and search agents;
* general-purpose agents.

Maximum SFT context is:

[
202{,}752\text{ tokens}.
]

This is GLM-5 lineage. GLM-5.2’s exact SFT maximum length and SFT token count are not disclosed. ([arXiv][3])

## 10.2 SFT sample synthesis

Reasoning SFT uses:

* verifiable logical-reasoning problems;
* rejection sampling;
* difficulty filtering based on GLM-4.7 failures.

Coding and Agent SFT uses:

* executable environments;
* real-world and long-horizon trajectories;
* expert-RL-generated trajectories;
* rejection sampling.

Erroneous trajectory segments are retained in context but explicitly masked from the loss. This allows later correction behavior to remain conditioned on the error without directly reinforcing the erroneous tokens. ([arXiv][3])

## 10.3 SFT objective

The source does not print the SFT equation. The architecture-compatible objective is masked causal cross-entropy:

[
\mathcal L_{\mathrm{SFT}}
=========================

*

\frac{
\sum_{b,t}
m^{\mathrm{SFT}}*{b,t}
\log p*\theta
(x_{b,t}\mid x_{b,<t})
}{
\sum_{b,t}m^{\mathrm{SFT}}_{b,t}
}.
]

What is verified:

[
m^{\mathrm{SFT}}_{b,t}=0
]

for identified erroneous trajectory segments.

What is not disclosed:

* whether system tokens are masked;
* whether user tokens are masked;
* whether tool schemas are masked;
* whether tool observations are masked;
* whether historical assistant turns receive loss;
* whether reasoning tokens and visible-answer tokens use equal weights;
* loss normalization across packed samples.

The earlier assistant-only masking table was therefore too strong.

---

# 11. Released chat template versus historical SFT template

The released GLM-5.2 Jinja template is verified for checkpoint usage. It starts with:

[
\texttt{[gMASK]<sop>}.
]

It supports:

* system, user, assistant and tool roles;
* `High` and `Max` reasoning effort;
* optional thinking;
* preserved thinking;
* XML-style tools;
* tool calls and observations;
* grouped tool responses.

A generation prompt ends with either:

[
\texttt{<|assistant|><think>}
]

or, when thinking is disabled:

[
\texttt{<|assistant|><think></think>}.
]

([Hugging Face][7])

### Critical boundary

The released template is an **inference serialization artifact**. It does not prove:

* that every SFT sample used the identical byte sequence;
* that every historical checkpoint used the same template revision;
* that loss was applied to all assistant template tokens;
* that padding or truncation was performed by this template.

## 11.1 Text-response serialization

[
\begin{aligned}
u={}&
\texttt{[gMASK]<sop>}\
&\Vert
\texttt{<|system|>Reasoning Effort: Max}\
&\Vert
\texttt{<|system|>}s\
&\Vert
\texttt{<|user|>}q\
&\Vert
\texttt{<|assistant|><think>}r
\texttt{</think>}y.
\end{aligned}
]

## 11.2 Tool trajectory serialization

[
\begin{aligned}
u={}&
\texttt{[gMASK]<sop>}\
&\Vert
\texttt{<|system|># Tools<tools>}
\operatorname{JSON}(\mathcal T)
\texttt{</tools>}\
&\Vert
\texttt{<|user|>}q\
&\Vert
\texttt{<|assistant|><think>}r_1
\texttt{</think>}\
&\Vert
\texttt{<tool_call>}f(\mathbf a)
\texttt{</tool_call>}\
&\Vert
\texttt{<|observation|><tool_response>}o
\texttt{</tool_response>}\
&\Vert
\texttt{<|assistant|><think>}r_2
\texttt{</think>}y.
\end{aligned}
]

The template converts image, video and audio objects into a textual reminder that multimodal input cannot be processed. GLM-5.2 is therefore a text-only checkpoint, not a native multimodal model. ([Hugging Face][7])

---

# 12. Stage 8 — INT4 quantization-aware SFT

GLM-5 applies INT4 QAT during SFT and uses the same quantization kernel for training and offline quantization to preserve bitwise-equivalent quantization behavior. ([arXiv][2])

A generic fake-quantized forward operator is:

[
\widehat W
==========

s,
\operatorname{clip}
\left(
\operatorname{round}(W/s),
q_{\min},
q_{\max}
\right).
]

The SFT loss is evaluated with (\widehat W) in the forward path:

[
\mathcal L_{\mathrm{QAT}}
=========================

\mathcal L_{\mathrm{SFT}}(\widehat W).
]

However, the report does not disclose:

* quantization group size;
* symmetric versus asymmetric quantization;
* scale granularity;
* zero-point;
* clipping estimator;
* excluded layers;
* straight-through estimator details;
* whether GLM-5.2 retained identical QAT settings.

---

# 13. Stage 9 — Reasoning RL

This is the most precisely disclosed optimization objective in the GLM-5 report.

For prompt (x), sample:

[
{y_i}*{i=1}^{G}
\sim
\pi^{\mathrm{infer}}*{\theta_{\mathrm{old}}}(\cdot\mid x).
]

The objective is:

[
\boxed{
\begin{aligned}
\mathcal L_{\mathrm{reason}}(\theta)
====================================

*

\mathbb E
\Bigg[
\frac1G
\sum_{i=1}^{G}
\frac1{|y_i|}
\sum_{t=1}^{|y_i|}
&
\operatorname{pop}
\left(
\rho_{i,t},
\frac1\beta,
\beta
\right)\
&\cdot
\min
\left(
r_{i,t}\widehat A_{i,t},
\operatorname{clip}
(r_{i,t},1-\epsilon_{\mathrm{low}},
1+\epsilon_{\mathrm{high}})
\widehat A_{i,t}
\right)
\Bigg].
\end{aligned}
}
]

Training–inference mismatch ratio:

[
\rho_{i,t}
==========

\frac{
\pi^{\mathrm{train}}*{\theta*{\mathrm{old}}}
(y_{i,t}\mid x,y_{i,<t})
}{
\pi^{\mathrm{infer}}*{\theta*{\mathrm{old}}}
(y_{i,t}\mid x,y_{i,<t})
}.
]

Suppression operator:

[
\operatorname{pop}
\left(
\rho,\frac1\beta,\beta
\right)
=======

\begin{cases}
\rho,
&
\frac1\beta\le\rho\le\beta,\
0,
&
\text{otherwise}.
\end{cases}
]

PPO ratio:

[
r_{i,t}
=======

\frac{
\pi^{\mathrm{train}}*{\theta}
(y*{i,t}\mid x,y_{i,<t})
}{
\pi^{\mathrm{train}}*{\theta*{\mathrm{old}}}
(y_{i,t}\mid x,y_{i,<t})
}.
]

Group-normalized advantage:

[
\widehat A_{i,t}
================

\frac{
R_i-\operatorname{mean}(R_1,\ldots,R_G)
}{
\operatorname{std}(R_1,\ldots,R_G)
}.
]

The disclosed hyperparameters are:

[
\beta=2,
\qquad
\epsilon_{\mathrm{low}}=0.2,
\qquad
\epsilon_{\mathrm{high}}=0.28,
]

[
G=32,
\qquad
B_{\mathrm{prompt}}=32.
]

KL regularization is explicitly removed. ([arXiv][2])

## 13.1 Reward domains

Reasoning RL covers:

[
{
\text{mathematics},
\text{science},
\text{code},
\text{tool-integrated reasoning}
}.
]

Domain-specific judges produce binary outcome rewards, and the mixture is kept roughly balanced. The DSA indexer is frozen by default during RL, and deterministic `torch.topk` is used because nondeterministic top-(k) implementations produced severe instability and entropy collapse. ([arXiv][3])

### Target-model boundary

This is an exact **GLM-5** objective. GLM-5.2 does not state that all of its reasoning RL runs used unchanged hyperparameters.

---

# 14. Stage 10 — Agentic RL

## 14.1 Trajectory representation

A trajectory contains:

[
\tau
====

(x,
a_1,o_1,
a_2,o_2,
\ldots,
a_T,o_T),
]

where (a_t) is a model action and (o_t) is environment feedback.

The report explicitly states:

[
m_t=
\begin{cases}
1,&t\text{ belongs to a model-generated token},\
0,&t\text{ belongs to environment feedback}.
\end{cases}
]

Only model-generated tokens contribute to optimization. ([arXiv][2])

## 14.2 TITO sample integrity

The TITO gateway records:

* generated token IDs;
* rollout log-probabilities;
* action boundaries;
* trajectory metadata.

It avoids reconstructing trajectories through decode–re-tokenize cycles, which can alter whitespace, normalization, special-token placement and truncation boundaries. ([arXiv][2])

## 14.3 Direct double-sided importance sampling

The asynchronous GLM-5 Agentic-RL objective is:

[
\boxed{
\mathcal L_{\mathrm{async}}(\theta)
===================================

\mathbb E_t
\left[
f(r_t(\theta);\epsilon_\ell,\epsilon_h)
\widehat A_t
\log\pi_\theta(a_t\mid s_t)
\right]
}
]

with direct rollout-policy ratio:

[
r_t(\theta)
===========

\exp
\left[
\log\pi_\theta(a_t\mid s_t)
---------------------------

\log\pi_{\mathrm{rollout}}(a_t\mid s_t)
\right].
]

The calibration function is:

[
f(r;\epsilon_\ell,\epsilon_h)
=============================

\begin{cases}
r,
&
1-\epsilon_\ell<r<1+\epsilon_h,\
0,
&
\text{otherwise}.
\end{cases}
]

Tokens outside the trust region are dropped completely rather than PPO-clipped. The source does not disclose numerical values for (\epsilon_\ell) and (\epsilon_h). ([arXiv][2])

## 14.4 Stale and failed rollouts

If the rollout spans model versions:

[
(w_0,\ldots,w_k)
]

and the current version is (w'), the sample is discarded when:

[
w'-w_0>\tau.
]

The threshold (\tau) is undisclosed.

Environment-collapse samples are removed. For incomplete GRPO groups:

* if valid samples exceed half the target group, valid samples are repeated to restore group size;
* otherwise, the group is dropped.

This is **group padding**, not sequence-token padding. ([arXiv][2])

---

# 15. Stage 11 — GLM-5.2 long-horizon critic PPO

GLM-5.2 changes the optimization regime for very long compacted trajectories.

A single prompt can produce:

[
\mathcal T_i
============

{
\tau_{i,1},\ldots,\tau_{i,J_i}
},
]

where (J_i) varies across rollouts and sub-trace lengths are highly unequal.

GLM-5.2 therefore:

1. moves from group-wise relative optimization to critic-based PPO;
2. trains from individual rollouts;
3. includes all compacted sub-traces;
4. estimates token-level advantages with a critic;
5. uses token-level loss normalization.

([Z.ai][5])

## 15.1 Exact loss boundary

The release does not disclose:

* critic architecture;
* value target;
* GAE usage;
* (\gamma);
* (\lambda);
* PPO clipping range;
* value-loss coefficient;
* entropy coefficient;
* KL penalty;
* bootstrapping across compaction boundaries;
* whether critic state is preserved across sub-traces.

Therefore, writing:

[
\widehat A_t
============

\operatorname{GAE}_{\gamma,\lambda}
]

or a specific combined actor–critic loss as a GLM-5.2 fact is unsupported.

The exact source-calibrated representation is:

[
\widehat A_t
============

\operatorname{CriticAdvantage}
(s_t,r_{t:T});
\qquad
\operatorname{CriticAdvantage}
==============================

\mathrm{UNDISCLOSED}.
]

[
\mathcal L_{\mathrm{LH}}
========================

\operatorname{TokenNormalizedPPO}
\left(
\pi_\theta,
\pi_{\mathrm{old}},
\widehat A_t
\right);
\qquad
\text{coefficients}
===================

\mathrm{UNDISCLOSED}.
]

This corrects the earlier response, which inserted a standard GAE/PPO formula without target-specific evidence.

---

# 16. Stage 12 — Anti-hacking constraints

GLM-5.2 reports that coding RL increasingly exhibits reward-hacking strategies, including:

* reading protected evaluation artifacts;
* copying reference solutions;
* retrieving upstream commits;
* downloading target source code;
* using unauthorized network access.

The release discusses both rule-based and model-based checks in evaluations, but does not publish the complete training-time anti-hacking reward. ([Z.ai][5])

The correct abstraction is:

[
R_{\mathrm{effective}}
======================

\operatorname{AntiHackFilter}
\left(
R_{\mathrm{verifier}},
\tau,
\mathcal P_{\mathrm{sandbox}}
\right),
]

where:

[
\operatorname{AntiHackFilter}
=============================

\mathrm{UNDISCLOSED}.
]

It is not defensible to claim a simple multiplicative mask, fixed negative reward or exact penalty value.

---

# 17. Stage 13 — General RL

GLM-5 General RL targets three dimensions:

[
\mathcal O_{\mathrm{general}}
=============================

{
\text{foundational correctness},
\text{emotional intelligence},
\text{task-specific quality}
}.
]

Its reward system integrates:

[
R_{\mathrm{rule}},
\qquad
R_{\mathrm{ORM}},
\qquad
R_{\mathrm{GRM}}.
]

Rule rewards provide deterministic supervision; ORMs supply low-variance outcome signals but are more vulnerable to reward hacking; GRMs provide scalar or structured model-generated evaluations with higher variance but stronger flexibility. Human-authored responses are also used as style and quality anchors. ([arXiv][3])

The aggregation operator is not disclosed:

[
R_{\mathrm{general}}
====================

\mathcal H
\left(
R_{\mathrm{rule}},
R_{\mathrm{ORM}},
R_{\mathrm{GRM}},
R_{\mathrm{human}}
\right),
]

[
\mathcal H
==========

\mathrm{UNDISCLOSED}.
]

Therefore, an additive weighted reward:

[
w_1R_{\mathrm{rule}}
+
w_2R_{\mathrm{ORM}}
+
w_3R_{\mathrm{GRM}}
]

must not be presented as the exact implementation.

---

# 18. Stage 14 — On-policy cross-stage distillation

This stage is more precisely disclosed than a generic KL-distillation interpretation.

Let a preceding checkpoint act as teacher:

[
\pi_{\theta_{\mathrm{teacher}}}^{\mathrm{infer}},
]

and let the current model be:

[
\pi_\theta^{\mathrm{train}}.
]

GLM-5 replaces the advantage term in its Reasoning-RL objective with:

[
\boxed{
\widehat A_{i,t}^{\mathrm{OPD}}
===============================

\operatorname{sg}
\left[
\log
\frac{
\pi_{\theta_{\mathrm{teacher}}}^{\mathrm{infer}}
(y_{i,t}\mid x,y_{i,<t})
}{
\pi_{\theta}^{\mathrm{train}}
(y_{i,t}\mid x,y_{i,<t})
}
\right]
}
]

where (\operatorname{sg}) denotes stop-gradient. ([arXiv][2])

This is then substituted into the policy objective; the report does **not** describe OPD as ordinary offline teacher-forced cross-entropy over a static teacher dataset.

The disclosed settings are:

[
G=1,
\qquad
B=1024.
]

Training prompts are sampled from the corresponding teachers’ RL datasets and mixed in “appropriate proportions,” but those proportions are not disclosed. ([arXiv][2])

## 18.1 GLM-5.2 parallel OPD

GLM-5.2 reports:

* parallel OPD training;
* more than ten expert models;
* approximately two days of OPD training;
* slime as the training and rollout infrastructure.

It does not disclose:

* the expert-model identities;
* teacher routing;
* whether teachers act per domain or per token;
* prompt-mixture weights;
* temperature;
* whether logits are truncated;
* conflict resolution between teachers;
* optimizer state initialization;
* whether experts are merged sequentially or jointly.

([Z.ai][5])

The correct abstraction is:

[
j\sim p_{\mathrm{teacher}}(j\mid x),
]

[
\widehat A_{i,t}
================

\operatorname{sg}
\left[
\log
\pi_{T_j}
(y_{i,t}\mid s_{i,t})
---------------------

\log
\pi_\theta
(y_{i,t}\mid s_{i,t})
\right],
]

with:

[
p_{\mathrm{teacher}}(j\mid x)
=============================

\mathrm{UNDISCLOSED}.
]

Logit averaging across all teachers is not established.

---

# 19. Final stage ledger

| Order | Stage                   | Verified objective or mechanism                                     | Target status                              |
| ----: | ----------------------- | ------------------------------------------------------------------- | ------------------------------------------ |
|     1 | Initial pre-training    | causal next-token cross-entropy                                     | GLM-5 lineage                              |
|     2 | Context mid-training    | causal LM under 32K→128K→200K curriculum                            | GLM-5 lineage                              |
|     3 | DSA warm-up             | indexer-only optimization; exact loss undisclosed                   | GLM-5 lineage                              |
|     4 | DSA sparse adaptation   | joint backbone/indexer causal training                              | GLM-5 lineage                              |
|     5 | IndexShare mid-training | 4-layer index reuse from 128K                                       | GLM-5.2 verified                           |
|     6 | MTP                     | shared parameters, IndexShare, KVShare, rejection sampling, TV loss | GLM-5.2 verified; equation incomplete      |
|     7 | SFT                     | masked causal cross-entropy; erroneous spans masked                 | GLM-5 lineage                              |
|     8 | INT4 QAT                | fake/offline quantization-compatible SFT                            | GLM-5 lineage                              |
|     9 | Reasoning RL            | exact GRPO + IcePop-style mismatch suppression                      | GLM-5 exact                                |
|    10 | Agentic RL              | asynchronous direct double-sided importance sampling                | GLM-5 exact                                |
|    11 | Long-horizon RL         | critic PPO, compacted traces, token-level loss                      | GLM-5.2 verified; coefficients undisclosed |
|    12 | General RL              | rules + ORM + GRM + human anchors                                   | GLM-5 lineage                              |
|    13 | OPD                     | teacher–student log-ratio advantage                                 | GLM-5 exact                                |
|    14 | Parallel OPD            | more than ten experts merged through slime                          | GLM-5.2 verified                           |

---

# 20. Disclosure gaps that remain material

The following quantities are required for exact reproduction but are not public:

[
\boxed{
\begin{aligned}
&\text{GLM-5.2 total training-token count},\
&\text{1M-context curriculum and data mixture},\
&\text{pre-training packing and document masks},\
&\text{padding side and truncation policy},\
&\text{complete SFT role-level loss mask},\
&\text{IndexShare training loss},\
&\text{MTP TV-loss distribution and weighting},\
&\text{rejection-sampling acceptance rule},\
&\text{critic architecture and value target},\
&\text{GLM-5.2 PPO hyperparameters},\
&\text{anti-hacking reward and classifiers},\
&\text{General-RL reward aggregation},\
&\text{parallel-OPD teacher routing and mixture}.
\end{aligned}
}
]

The scientifically correct conclusion is that GLM-5.2’s disclosed novelty is concentrated in **long-context architectural adaptation, MTP training–inference alignment, compaction-compatible critic PPO, anti-hacking supervision and parallel expert distillation**. The public evidence is not sufficient to reconstruct an exact end-to-end training run, and standard practices must not be substituted for the missing recipe.

[1]: https://huggingface.co/zai-org/GLM-5.2?utm_source=chatgpt.com "zai-org/GLM-5.2 · Hugging Face"
[2]: https://arxiv.org/pdf/2602.15763 "GLM-5: from Vibe Coding to Agentic Engineering"
[3]: https://arxiv.org/html/2602.15763 "GLM-5: from Vibe Coding to Agentic Engineering"
[4]: https://huggingface.co/zai-org/GLM-5.2/blob/main/config.json?utm_source=chatgpt.com "config.json · zai-org/GLM-5.2 at main"
[5]: https://z.ai/blog/glm-5.2?utm_source=chatgpt.com "GLM-5.2: Built for Long-Horizon Tasks"
[6]: https://arxiv.org/html/2603.12201 "IndexCache: Accelerating Sparse Attention via Cross-Layer Index Reuse"
[7]: https://huggingface.co/zai-org/GLM-5.2/blob/main/chat_template.jinja "chat_template.jinja · zai-org/GLM-5.2 at main"
