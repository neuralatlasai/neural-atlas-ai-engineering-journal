# DeepSeek-V4-Pro: Evidence-Calibrated Architecture Reconstruction

## 1. Executive architectural statement

**DeepSeek-V4-Pro is a post-trained, decoder-only sparse MoE language model with 1.6T total parameters, approximately 49B activated parameters per token, and a maximum context length of (2^{20}=1{,}048{,}576) tokens.** The released checkpoint uses mixed FP4/FP8 storage: routed MoE expert parameters are FP4, while most remaining parameters are FP8. The technical report is arXiv v1, submitted on April 26, 2026, and describes the release as a preview of the V4 series. ([Hugging Face][1])

Its defining architectural changes are:

[
\boxed{
\text{hybrid CSA/HCA attention}
+
\text{mHC residual topology}
+
\text{DeepSeekMoE}
+
\text{Muon training}
}
]

The attention architecture is not merely a modified MLA layer. It uses a **single shared 512-dimensional KV representation serving simultaneously as key and value**, 128 query heads, low-rank query projection, compressed KV blocks, local sliding-window entries, and either learned sparse retrieval—CSA—or deterministic heavy compression—HCA. ([arXiv][2])

I use the supplied protocol’s distinction between **VERIFIED**, **DERIVED**, **LINEAGE EVIDENCE**, and **UNDISCLOSED**, rather than transferring DeepSeek-V3 defaults into V4 without evidence. 

---

## 2. Target-version and evidence boundary

**Target:** `deepseek-ai/DeepSeek-V4-Pro`, the post-trained/instruct checkpoint—not `DeepSeek-V4-Pro-Base`.

**Primary executable artifacts inspected:**

* `config.json`, revision `4504094`
* released custom inference implementation
* 64 checkpoint shards
* official technical report, arXiv:2606.19348v1
* official model card

The Hugging Face repository occupies approximately 865 GB and contains 64 Safetensors shards. ([Hugging Face][3])

### Unresolved metadata contradiction

The report and model card both state **1.6T total parameters**, whereas the Hugging Face UI displays “862B params.” The latter is not accompanied by an architectural counting methodology and may reflect packed tensor metadata or quantized checkpoint accounting. Therefore:

* **1.6T:** VERIFIED by the technical report and model card.
* **862B:** VERIFIED as Hugging Face UI metadata.
* **Explanation of the discrepancy:** UNDISCLOSED.

The two values must not be averaged or silently reconciled. ([arXiv][2])

---

## 3. Verified configuration

| Component                   | DeepSeek-V4-Pro configuration |
| --------------------------- | ----------------------------: |
| Transformer blocks          |                            61 |
| Hidden dimension            |                         7,168 |
| Vocabulary size             |                       129,280 |
| Context length              |                     1,048,576 |
| Residual expansion          |           (n_{\mathrm{hc}}=4) |
| mHC Sinkhorn iterations     |                            20 |
| Attention query heads       |                           128 |
| Shared KV heads             |                             1 |
| Attention head dimension    |                           512 |
| RoPE dimensions per head    |                            64 |
| Query low-rank dimension    |                         1,536 |
| Output groups               |                            16 |
| Output intermediate/group   |                         1,024 |
| CSA compression ratio       |                             4 |
| CSA indexer heads           |                            64 |
| CSA indexer head dimension  |                           128 |
| CSA attention Top-(K)       |                         1,024 |
| HCA compression ratio       |                           128 |
| Sliding window              |                           128 |
| Routed experts/layer        |                           384 |
| Shared experts/layer        |                             1 |
| Activated routed experts    |                             6 |
| Expert intermediate width   |                         3,072 |
| Hash-routed layers          |                       First 3 |
| MTP depth                   |                             1 |
| Normalization               |   RMSNorm, (\epsilon=10^{-6}) |
| Position extension          |   YaRN, factor 16 from 65,536 |
| Embedding/LM-head tying     |                        Untied |
| Routed expert precision     |                           FP4 |
| General weight quantization |        FP8 E4M3, UE8M0 scales |

These values are jointly established by the released configuration and the model-setup section of the report. ([Hugging Face][3])

### Executable layer schedule

The released `compress_ratios` vector contains:

[
[128,128,4,128,4,\ldots,128,4,0].
]

This resolves the 61 blocks as:

[
\boxed{
31\ \text{HCA}
+
29\ \text{CSA}
+
1\ \text{pure sliding-window block}
}
]

The report says the first two layers use HCA and the later layers interleave CSA/HCA. The executable configuration adds an important refinement: the final block has compression ratio zero and therefore uses only the 128-token local cache. ([Hugging Face][3])

---

## 4. End-to-end computational graph

For token IDs

[
X_{\mathrm{id}}\in\mathbb N^{B\times T},
]

the released implementation performs:

[
X_{\mathrm{id}}
\rightarrow
E[X_{\mathrm{id}}]\in\mathbb R^{B\times T\times7168}
\rightarrow
\operatorname{Repeat}_{4}
\rightarrow
H^{(0)}\in\mathbb R^{B\times T\times4\times7168}.
]

Each Transformer block applies:

[
\begin{aligned}
U_a,A_a,B_a,C_a
&=\operatorname{mHCPre}*{a}(H),\
Y_a
&=\operatorname{Attention}
\left(\operatorname{RMSNorm}(U_a)\right),\
H_a
&=\operatorname{mHCPost}(Y_a,H;B_a,C_a),[2mm]
U_f,A_f,B_f,C_f
&=\operatorname{mHCPre}*{f}(H_a),\
Y_f
&=\operatorname{MoE}
\left(\operatorname{RMSNorm}(U_f)\right),\
H'
&=\operatorname{mHCPost}(Y_f,H_a;B_f,C_f).
\end{aligned}
]

After 61 blocks, a learned mHC head collapses the four residual streams into one, followed by final RMSNorm and an untied vocabulary-parallel LM head:

[
H^{(61)}
\rightarrow
\bar H\in\mathbb R^{B\times T\times7168}
\rightarrow
Z\in\mathbb R^{B\times T\times129280}.
]

The released inference code constructs one additional MTP block, sharing the token embedding and prediction head, although the normal inference forward path directly returns the main-token logits. ([Hugging Face][4])

RMSNorm is implemented as:

[
\operatorname{RMSNorm}(x)
=========================

\gamma\odot
x
\left(
\frac{1}{d}\sum_{i=1}^{d}x_i^2+\epsilon
\right)^{-\frac12},
\qquad \epsilon=10^{-6}.
]

The checkpoint norm weights are stored in BF16, while the reference implementation holds them in FP32 during execution. ([Hugging Face][4])

---

## 5. Hybrid sequence mixer

### 5.1 Shared attention backbone

For hidden state (h_t\in\mathbb R^{7168}):

[
c_t^Q
=====

\operatorname{RMSNorm}
\left(h_tW_{DQ}\right)
\in\mathbb R^{1536},
]

[
Q_t
===

c_t^QW_{UQ}
\in\mathbb R^{128\times512},
]

[
c_t^{KV}
========

\operatorname{RMSNorm}
\left(h_tW_{KV}\right)
\in\mathbb R^{512}.
]

Thus the raw 65,536-dimensional multi-head query representation,

[
128\times512=65{,}536,
]

is generated through a 1,536-dimensional latent query bottleneck. The model creates only one shared 512-dimensional KV vector per cached position; the same vector is used as both key and value in MQA. The last 64 dimensions carry RoPE. ([Hugging Face][4])

The attention implementation’s docstring calls the module “MLA,” but the report and actual computation define the V4 mechanism as shared-KV compressed MQA inside CSA/HCA. The docstring should therefore not be treated as sufficient evidence that the complete V4 sequence mixer is conventional DeepSeek-V3 MLA. ([Hugging Face][4])

### 5.2 Compressed Sparse Attention

CSA first compresses every four source positions into one KV entry:

[
T\longrightarrow \left\lceil\frac{T}{4}\right\rceil.
]

It uses two overlapping compressor streams. Each output compressed vector is a channel-wise weighted aggregation of (2m=8) source entries, while overlap between adjacent streams preserves an effective compression ratio of (m=4). ([arXiv][2])

A separate indexer creates compressed keys

[
K^{I}_{\mathrm{comp}}
\in
\mathbb R^{T/4\times128}.
]

For 64 indexer heads:

[
I_{t,s}
=======

\sum_{j=1}^{64}
w_{t,j}^{I}
\operatorname{ReLU}
\left(
q_{t,j}^{I\top}k_s^{I}
\right).
]

CSA selects the top 1,024 compressed positions and concatenates them with the most recent 128 uncompressed positions:

[
\mathcal K_t^{\mathrm{CSA}}
===========================

\operatorname{TopK}*{1024}(I*{t,:})
\cup
{t-127,\ldots,t}.
]

The core attention therefore processes at most approximately 1,152 real KV entries per query, but the indexer must score the compressed history. ([arXiv][2])

Decode-time complexity separates into:

[
C_{\mathrm{index}}
==================

O\left(
64\cdot\frac{T}{4}\cdot128
\right),
]

[
C_{\mathrm{core,CSA}}
=====================

O\left(
128\cdot(1024+128)\cdot512
\right).
]

Consequently, CSA’s core attention is capped with respect to (T), but its retrieval scan remains linear in the compressed context length. The indexer’s FP4 execution is therefore architecturally important rather than a secondary quantization choice.

### 5.3 Heavily Compressed Attention

HCA compresses non-overlapping groups of 128 tokens:

[
T\longrightarrow \left\lceil\frac{T}{128}\right\rceil.
]

Unlike CSA, HCA has no learned sparse selector. Each query attends to all HCA-compressed entries plus the local 128-token window:

[
\mathcal K_t^{\mathrm{HCA}}
===========================

\left{
1,\ldots,\left\lfloor\frac{t}{128}\right\rfloor
\right}
\cup
{t-127,\ldots,t}.
]

At a one-million-token context, this gives approximately:

[
8192+128=8320
]

attended entries per HCA block. Its decode complexity is:

[
C_{\mathrm{HCA}}
================

O\left(
128\cdot
\left(\frac{T}{128}+128\right)
\cdot512
\right).
]

HCA retains global coverage but at substantially reduced sequence resolution. ([arXiv][2])

### 5.4 Attention sink and grouped output projection

For each query head, a learned sink logit (z'_h) contributes mass to the softmax denominator:

[
a_{h,i,j}
=========

\frac{\exp z_{h,i,j}}
{\sum_k\exp z_{h,i,k}+\exp z'_h}.
]

Therefore the attention weights over actual cached entries need not sum to one; a head may effectively suppress its attention output. ([arXiv][2])

Directly projecting (128\times512=65{,}536) attention channels to 7,168 would be expensive. V4 divides heads into 16 groups, projects each 4,096-dimensional group to 1,024 dimensions, concatenates the resulting 16,384 channels, and then projects to 7,168:

[
4096
\xrightarrow[]{W_{O1,g}}
1024,
\qquad g=1,\ldots,16,
]

[
16\times1024=16384
\xrightarrow[]{W_{O2}}
7168.
]

This grouped low-rank output path is visible in both the report and implementation. ([arXiv][2])

---

## 6. Manifold-Constrained Hyper-Connections

mHC replaces the single residual vector with four parallel streams:

[
X_l\in\mathbb R^{4\times7168}.
]

For each attention and MoE sublayer, the flattened residual state

[
\operatorname{vec}(X_l)\in\mathbb R^{28672}
]

generates three input-dependent mappings:

* (A_l\in\mathbb R^{1\times4}): pre-block stream aggregation
* (B_l\in\mathbb R^{4\times4}): residual-stream mixing
* (C_l\in\mathbb R^{4\times1}): post-block injection

The effective computation is:

[
u_l=A_lX_l,
]

[
y_l=F_l!\left(\operatorname{RMSNorm}(u_l)\right),
]

[
X_{l+1}=B_lX_l+C_ly_l.
]

The constraints are:

[
A_l=\sigma(\widetilde A_l),
\qquad
C_l=2\sigma(\widetilde C_l),
]

[
B_l=
\operatorname{Sinkhorn}
\left(
\exp\widetilde B_l
\right),
]

where 20 alternating row/column normalization iterations project (B_l) toward the Birkhoff polytope of doubly stochastic matrices. This constrains amplification, cancellation, and uncontrolled residual-state drift while retaining dynamic cross-stream routing. ([arXiv][2])

The implementation performs this procedure independently around attention and MoE. It is therefore a **depth-routing mechanism**, not a token-level sequence mixer or an MoE router.

---

## 7. DeepSeekMoE topology

Every Transformer block contains:

[
384\ \text{routed experts}
+
1\ \text{shared expert}.
]

Each routed expert is a clamped SwiGLU FFN:

[
\operatorname{Expert}(x)
========================

W_2
\left[
\operatorname{SiLU}
\left(
\min(W_1x,10)
\right)
\odot
\operatorname{clip}(W_3x,-10,10)
\right].
]

The expert intermediate width is 3,072. ([Hugging Face][4])

For layers (l\ge3), routing scores are:

[
s_e(x)
======

\sqrt{\operatorname{Softplus}(w_e^\top x)}.
]

A learned bias affects expert selection but not mixture weights:

[
\mathcal I(x)
=============

\operatorname{Top6}\big(s(x)+b\big),
]

[
\alpha_e(x)
===========

2.5,
\frac{s_e(x)}
{\sum_{j\in\mathcal I(x)}s_j(x)},
\qquad e\in\mathcal I(x).
]

For the first three blocks, the six expert indices are obtained from a fixed token-ID-to-expert table. However, the mixture weights are still computed from the hidden-state-dependent router scores at those selected indices. Thus “hash routing” fixes assignment but does not reduce the routed contribution to an unweighted lookup. ([arXiv][2])

The reference implementation shards experts across ranks and performs an output `all_reduce`. This establishes the behavior of the released demonstrator, but it is not sufficient evidence that the production training or serving system uses the identical expert-parallel dispatch topology. ([Hugging Face][4])

### Derived parameter accounting

One expert contains three matrices:

[
P_{\mathrm{expert}}
===================

# 3d,d_{\mathrm{ff}}

# 3(7168)(3072)

66{,}060{,}288.
]

All routed-expert matrices contribute:

[
P_{\mathrm{routed}}
===================

# 61\cdot384\cdot66{,}060{,}288

1{,}547{,}396{,}186{,}112.
]

Shared-expert matrices contribute:

[
P_{\mathrm{shared}}
===================

# 61\cdot66{,}060{,}288

4{,}029{,}677{,}568.
]

The activated expert matrices per token are:

[
P_{\mathrm{active,expert}}
==========================

# 61(6+1)(66{,}060{,}288)

28{,}207{,}742{,}976.
]

Thus approximately 28.21B of the reported 49B active parameters are expert matrices. The remainder comes primarily from attention, compression/indexing, mHC, routing, embeddings, and output projections. The routed-expert sparsity factor is:

[
\frac{384}{6}=64.
]

The untied input embedding and LM head jointly contain:

[
2(129280)(7168)
===============

1{,}853{,}358{,}080
]

parameters. These derivations are arithmetically consistent with the reported 1.6T/49B scale. ([Hugging Face][3])

---

## 8. KV-cache analysis at one million tokens

Let:

[
T=1{,}048{,}576,\quad
W=128,\quad
c=512.
]

Using the executable schedule—29 CSA, 31 HCA, one sliding-only layer—the main attention cache contains:

[
\begin{aligned}
N_{\mathrm{vectors}}
=&;
29\left(W+\frac{T}{4}\right)
+
31\left(W+\frac{T}{128}\right)
+
W\
=&;
7{,}863{,}936
\end{aligned}
]

512-dimensional vectors per sequence.

### Pure-BF16 reference payload

[
M_{\mathrm{main,BF16}}
======================

N_{\mathrm{vectors}}\cdot512\cdot2
\approx
7.50\ \text{GiB}.
]

The released Python implementation explicitly comments that the current main KV-cache implementation uses BF16, even though the architecture was QAT-trained to support FP8 KV storage. ([Hugging Face][4])

### Intended mixed-precision payload

The report specifies:

* 64 RoPE dimensions in BF16
* 448 non-RoPE dimensions in FP8

Therefore each main-cache vector has an ideal payload of:

[
64(2)+448(1)=576\ \text{bytes},
]

giving:

[
M_{\mathrm{main,mixed}}
=======================

7{,}863{,}936\cdot576
\approx
4.22\ \text{GiB}.
]

CSA additionally stores indexer keys:

[
29\cdot\frac{T}{4}\cdot128
]

FP4 scalars. Ignoring packing and scale metadata:

[
M_{\mathrm{indexer,FP4}}
\approx
0.453\ \text{GiB}.
]

Hence the **ideal architectural payload** is approximately:

[
M_{\mathrm{cache,ideal}}
\approx
4.22+0.453
==========

4.67\ \text{GiB/sequence}.
]

This excludes FP8/FP4 scales, alignment, block tables, allocator fragmentation, compressor scratch buffers, prefix metadata, and any duplicated speculative or beam state. The report states that the complete system reaches 10% of DeepSeek-V3.2’s KV cache and approximately 2% of a BF16 GQA8/head-dimension-128 baseline at one million tokens. ([arXiv][2])

---

## 9. Precision and training system

The released instruct checkpoint uses:

* FP4 E2M1 routed-expert weights
* FP8 E4M3 for most remaining weights
* UE8M0 scaling
* (128\times128) FP8 weight blocks
* (1\times32) FP4 expert sub-blocks
* dynamic FP8 activation quantization
* BF16 RMSNorm checkpoint parameters

Post-training QAT is applied to both MoE expert weights and the CSA indexer’s QK path. The indexer’s Q/K activations are cached and multiplied in FP4, while index scores are reduced from FP32 to BF16. DeepSeek reports a (2\times) selector speedup with 99.7% KV-selection recall. During QAT, FP32 master expert weights are quantized to FP4 and losslessly expanded into FP8 E4M3 for computation under the reported scale-range condition; backward gradients are propagated using an STE-equivalent path. ([arXiv][2])

Muon is used for most model matrices. AdamW remains assigned to embeddings, prediction heads, RMSNorm parameters, and static mHC biases/gating factors. The Muon update applies momentum, a hybrid Newton–Schulz orthogonalization, shape-dependent RMS rescaling, and decoupled weight decay. ([arXiv][2])

The models were pretrained on more than 32T tokens. The report describes the tokenizer vocabulary as rounded “128K,” while the executable configuration gives the exact value 129,280. V4 extends the V3 tokenizer with a small number of context-construction tokens, retains token-splitting and FIM mechanisms, and introduces sample-level attention masks for packed pretraining sequences. ([arXiv][2])

---

## 10. Autoregressive decode algorithm

**Input:** token ID (x_t), position (t)
**State:** 61 main KV caches, 29 indexer caches, compressor state
**Output:** logits (z_t\in\mathbb R^{129280}), updated cache state

1. Embed (x_t) to (h_t\in\mathbb R^{7168}).
2. Replicate it into (H_t\in\mathbb R^{4\times7168}).
3. For each block (l=0,\ldots,60):

   1. Generate mHC pre-, post-, and residual-mixing coefficients from (\operatorname{vec}(H_t)).
   2. Aggregate four residual streams and apply RMSNorm.
   3. Produce (Q_t\in\mathbb R^{128\times512}) through the 1,536-dimensional query bottleneck.
   4. Produce shared (KV_t\in\mathbb R^{512}).
   5. Append (KV_t) to the 128-entry circular local cache.
   6. When the block’s compression boundary is reached:

      * CSA: update ratio-4 main and indexer compressors.
      * HCA: update the ratio-128 main compressor.
   7. Construct attended indices:

      * CSA: FP4 index scan (\rightarrow) Top-1024 compressed positions (+) local window.
      * HCA: all compressed positions (+) local window.
      * ratio 0: local window only.
   8. Evaluate shared-KV MQA with learned attention sinks.
   9. Apply grouped output projection and mHC post-mixing.
   10. Compute router scores.
   11. Select six routed experts—hash lookup in blocks 0–2, biased Top-6 otherwise.
   12. Execute selected FP4 experts plus the shared expert.
   13. Combine cross-rank partial results and perform the second mHC post-mixing.
4. Collapse four residual streams with the learned mHC head.
5. Apply final RMSNorm and the untied vocabulary projection.
6. Return logits and mutated cache state.

This algorithm follows the released inference graph; it does not assume production-only cache allocation, expert all-to-all, or scheduler behavior that is absent from the public implementation. ([Hugging Face][4])

---

## 11. Principal unresolved fields

| Field                                               | Status                  | Reason                                                                        |
| --------------------------------------------------- | ----------------------- | ----------------------------------------------------------------------------- |
| Exact reconciliation of 1.6T vs HF 862B             | **UNDISCLOSED**         | No common counting convention supplied                                        |
| Production expert-dispatch topology                 | **UNDISCLOSED**         | Reference code is not proof of production EP                                  |
| Exact deployed KV scale overhead                    | **UNDISCLOSED**         | Scale grouping and allocator accounting incomplete                            |
| Production heterogeneous/on-disk cache layout       | **PARTIALLY DISCLOSED** | High-level design reported; complete runtime implementation absent            |
| Exact custom kernel tile shapes                     | **PARTIALLY DISCLOSED** | TileLang/quantization kernels released, full deployment kernel set incomplete |
| Training-time activation and optimizer-state memory | **UNDISCLOSED**         | Full sharding/checkpointing topology not executable publicly                  |
| Independent reproduction of benchmark claims        | **NOT VERIFIED**        | Published results are source-reported                                         |
| Final-layer pure sliding-window rationale           | **UNDISCLOSED**         | Configuration establishes it; paper does not explain it                       |

---

## 12. Evidence-calibrated confidence

Using

[
100(0.40E+0.25R+0.20V+0.15K),
]

where (E) is primary evidence, (R) is cross-artifact agreement, (V) is executable/mathematical verification, and (K) is field completeness:

| Area                         |  (E) |  (R) |  (V) |  (K) |    Score |
| ---------------------------- | ---: | ---: | ---: | ---: | -------: |
| Core model dimensions        | 1.00 | 1.00 | 1.00 | 0.98 | **99.7** |
| CSA/HCA topology             | 1.00 | 1.00 | 0.95 | 0.92 | **97.8** |
| mHC implementation           | 1.00 | 1.00 | 1.00 | 0.92 | **98.8** |
| MoE routing and expert shape | 1.00 | 1.00 | 1.00 | 0.95 | **99.3** |
| Parameter decomposition      | 1.00 | 0.95 | 1.00 | 0.82 | **96.1** |
| Architectural KV payload     | 1.00 | 0.95 | 1.00 | 0.78 | **95.5** |
| Quantization/QAT             | 1.00 | 0.95 | 0.80 | 0.82 | **92.1** |
| Production serving topology  | 0.55 | 0.40 | 0.25 | 0.35 | **42.3** |

## Bottom line

DeepSeek-V4-Pro’s central systems contribution is a carefully coupled hierarchy:

[
\boxed{
\begin{array}{c}
\text{CSA provides high-resolution retrieved global memory}\
\text{HCA provides low-resolution dense global memory}\
\text{sliding windows preserve exact local state}\
\text{mHC controls depth-wise state propagation}\
\text{MoE scales channel capacity sparsely}
\end{array}
}
]

The result is not simply a larger DeepSeek-V3 or an MLA model with an extended RoPE schedule. It is a **multi-resolution memory architecture** in which representation compression, sparse retrieval, residual-state routing, precision selection, and expert sparsity are jointly designed around million-token inference. The report attributes a one-million-token operating point of 27% of V3.2’s single-token inference FLOPs and 10% of its KV-cache footprint; these are official source-reported system measurements, not independently reproduced results. ([Hugging Face][1])

[1]: https://huggingface.co/deepseek-ai/DeepSeek-V4-Pro "deepseek-ai/DeepSeek-V4-Pro · Hugging Face"
[2]: https://arxiv.org/pdf/2606.19348 "DeepSeek-V4: Towards Highly Efficient Million-Token Context Intelligence"
[3]: https://huggingface.co/deepseek-ai/DeepSeek-V4-Pro/blob/main/config.json "config.json · deepseek-ai/DeepSeek-V4-Pro at main"
[4]: https://huggingface.co/deepseek-ai/DeepSeek-V4-Pro/blob/main/inference/model.py "inference/model.py · deepseek-ai/DeepSeek-V4-Pro at main"


# (\textsc{DeepSeek-V4-Pro}): Mathematical Pseudo-Algorithm

[
\begin{aligned}
&L=61,\quad d=7168,\quad V=129280,\quad n_{\mathrm{hc}}=4,\
&H_q=128,\quad d_h=512,\quad d_{\mathrm{rope}}=64,\quad d_q=1536,\
&G_O=16,\quad d_O=1024,\quad W_{\mathrm{local}}=128,\
&E=384,\quad K_E=6,\quad E_{\mathrm{shared}}=1,\quad d_{\mathrm{ff}}=3072,\
&H_I=64,\quad d_I=128,\quad K_I=1024.
\end{aligned}
]

[
r_\ell=
\begin{cases}
128,
&
\ell\in{1,2}\cup{4,6,\ldots,60},
[1mm]
4,
&
\ell\in{3,5,\ldots,59},
[1mm]
0,
&
\ell=61.
\end{cases}
\quad
\triangleright
\begin{matrix}
r_\ell=4:\mathrm{CSA},\
r_\ell=128:\mathrm{HCA},\
r_\ell=0:\mathrm{local\ only}.
\end{matrix}
]

([Hugging Face][1])
(\triangleright) Visual cross-check: HCA, mHC, Muon, and fused-MoE panels. 

---

## (\boxed{\textsc{Algorithm 1: Manifold-Constrained Hyper-Connection}})

[
\begin{array}{ll}
\textbf{Input:}
&
X\in\mathbb R^{B\times T\times n_{\mathrm{hc}}\times d},
\quad
F:\mathbb R^{B\times T\times d}\rightarrow
\mathbb R^{B\times T\times d}
[1mm]
\textbf{Output:}
&
X^{+}\in\mathbb R^{B\times T\times n_{\mathrm{hc}}\times d}
\end{array}
]

| (s) | Operation                                                                                                                                                                                 |
| --: | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
|   1 | (\widehat X=\operatorname{RMSNorm}!\left(\operatorname{vec}*{\mathrm{hc},d}(X)\right)\in\mathbb R^{B\times T\times n*{\mathrm{hc}}d}) (\triangleright) state-conditioned residual routing |
|   2 | (\widetilde A=\alpha_{\mathrm{pre}}!\left(\widehat XW_{\mathrm{pre}}\right)+S_{\mathrm{pre}}\in\mathbb R^{B\times T\times1\times n_{\mathrm{hc}}})                                        |
|   3 | (\widetilde B=\alpha_{\mathrm{res}}\operatorname{Mat}!\left(\widehat XW_{\mathrm{res}}\right)+S_{\mathrm{res}}\in\mathbb R^{B\times T\times n_{\mathrm{hc}}\times n_{\mathrm{hc}}})       |
|   4 | (\widetilde C=\alpha_{\mathrm{post}}!\left(\widehat XW_{\mathrm{post}}\right)^{\mathsf T}+S_{\mathrm{post}}\in\mathbb R^{B\times T\times n_{\mathrm{hc}}\times1})                         |
|   5 | (A=\sigma(\widetilde A)) (\triangleright) bounded non-negative pre-block aggregation                                                                                                      |
|   6 | (C=2\sigma(\widetilde C)) (\triangleright) bounded sublayer-output injection                                                                                                              |
|   7 | (M^{(0)}=\exp(\widetilde B))                                                                                                                                                              |
|   8 | (\displaystyle M^{(j)}=\mathcal T_{\mathrm{row}}!\left(\mathcal T_{\mathrm{col}}!\left(M^{(j-1)}\right)\right),\quad j=1,\ldots,20)                                                       |
|   9 | (B=M^{(20)},\quad B\mathbf1=\mathbf1,\quad B^{\mathsf T}\mathbf1=\mathbf1,\quad B\ge0) (\triangleright) Birkhoff-polytope projection                                                      |
|  10 | (U=AX\in\mathbb R^{B\times T\times d})                                                                                                                                                    |
|  11 | (Y=F!\left(\operatorname{RMSNorm}(U)\right)\in\mathbb R^{B\times T\times d})                                                                                                              |
|  12 | (\boxed{X^{+}=BX+CY}) (\triangleright) stream transport plus controlled information injection                                                                                             |

[
\operatorname{mHC}_{F}(X)
\equiv
B(X)X+C(X)F!\left(\operatorname{RMSNorm}(A(X)X)\right).
]

([arXiv][2])

---

## (\boxed{\textsc{Algorithm 2: Token-Level KV Compressor}})

[
\begin{array}{ll}
\textbf{Input:}
&
U\in\mathbb R^{B\times T\times d},
\quad r\in{4,128}
\
\textbf{Output:}
&
C^{\mathrm{comp}}\in
\mathbb R^{B\times\lfloor T/r\rfloor\times d_h}
\end{array}
]

### (\mathrm{CSA}): (r=4), overlapping dual-stream compression

| (s) | Operation                                                                                                                                          |
| --: | -------------------------------------------------------------------------------------------------------------------------------------------------- |
|   1 | (C^{a}=UW^{a}*{KV},\quad C^{b}=UW^{b}*{KV})                                                                                                        |
|   2 | (Z^{a}=UW^{a}*{Z},\quad Z^{b}=UW^{b}*{Z})                                                                                                          |
|   3 | (\mathcal J_i^{a}={ri,\ldots,r(i+1)-1})                                                                                                            |
|   4 | (\mathcal J_i^{b}={r(i-1),\ldots,ri-1}) (\triangleright) preceding overlapping block                                                               |
|   5 | (\displaystyle [S_i^{a};S_i^{b}]=\operatorname{Softmax}*{\mathrm{token}}!\left([Z^{a}*{\mathcal J_i^a}+P^{a};Z^{b}_{\mathcal J_i^b}+P^{b}]\right)) |
|   6 | (\displaystyle C_i^{\mathrm{comp}}=\sum_{j\in\mathcal J_i^a}S_{i,j}^{a}\odot C_j^{a}+\sum_{j\in\mathcal J_i^b}S_{i,j}^{b}\odot C_j^{b})            |
|   7 | (C_i^{\mathrm{comp}}\leftarrow\operatorname{RMSNorm}(C_i^{\mathrm{comp}}))                                                                         |
|   8 | (C_{i,-64:}^{\mathrm{comp}}\leftarrow\operatorname{RoPE}*{ri}(C*{i,-64:}^{\mathrm{comp}}))                                                         |

### (\mathrm{HCA}): (r=128), non-overlapping compression

| (s) | Operation                                                                                   |
| --: | ------------------------------------------------------------------------------------------- |
|   1 | (C=UW_{KV}^{C},\quad Z=UW_{Z}^{C})                                                          |
|   2 | (\mathcal J_i={ri,\ldots,r(i+1)-1})                                                         |
|   3 | (\displaystyle S_i=\operatorname{Softmax}*{\mathrm{token}}!\left(Z*{\mathcal J_i}+P\right)) |
|   4 | (\displaystyle C_i^{\mathrm{comp}}=\sum_{j\in\mathcal J_i}S_{i,j}\odot C_j)                 |
|   5 | (C_i^{\mathrm{comp}}\leftarrow\operatorname{RMSNorm}(C_i^{\mathrm{comp}}))                  |
|   6 | (C_{i,-64:}^{\mathrm{comp}}\leftarrow\operatorname{RoPE}*{ri}(C*{i,-64:}^{\mathrm{comp}}))  |

([arXiv][2])

---

## (\boxed{\textsc{Algorithm 3: Hybrid CSA/HCA Attention}})

[
\begin{array}{ll}
\textbf{Input:}
&
U\in\mathbb R^{B\times T\times d},
\quad
r_\ell\in{0,4,128}
\
\textbf{State:}
&
\mathcal K_{\ell}^{\mathrm{local}},
\quad
\mathcal C_{\ell}^{\mathrm{comp}},
\quad
\mathcal C_{\ell}^{I}
\
\textbf{Output:}
&
Y_{\ell}^{A}\in\mathbb R^{B\times T\times d}
\end{array}
]

| (s) | Operation                                                                                           |
| --: | --------------------------------------------------------------------------------------------------- |
|   1 | (C^{Q}=\operatorname{RMSNorm}(UW_{DQ})\in\mathbb R^{B\times T\times1536})                           |
|   2 | (Q=\operatorname{reshape}*{128,512}(C^{Q}W*{UQ})\in\mathbb R^{B\times T\times128\times512})         |
|   3 | (Q_{t,h}\leftarrow\operatorname{RMSNorm}(Q_{t,h}))                                                  |
|   4 | (Q_{t,h,-64:}\leftarrow\operatorname{RoPE}*{t}(Q*{t,h,-64:}))                                       |
|   5 | (K!V^{\mathrm{local}}=\operatorname{RMSNorm}(UW_{KV})\in\mathbb R^{B\times T\times512})             |
|   6 | (K!V^{\mathrm{local}}*{t,-64:}\leftarrow\operatorname{RoPE}*{t}(K!V^{\mathrm{local}}_{t,-64:}))     |
|   7 | (\mathcal L_t={\max(0,t-127),\ldots,t})                                                             |
|   8 | (\mathcal K_{\ell}^{\mathrm{local}}\leftarrow\operatorname{RingAppend}_{128}(K!V^{\mathrm{local}})) |

### (r_\ell=4): (\mathrm{CSA})

| (s) | Operation                                                                                                                               |              |              |
| --: | --------------------------------------------------------------------------------------------------------------------------------------- | ------------ | ------------ |
|   9 | (\mathcal C_{\ell}^{\mathrm{comp}}\leftarrow\operatorname{OverlapCompress}_{4}(U))                                                      |              |              |
|  10 | (\mathcal C_{\ell}^{I}\leftarrow\operatorname{OverlapCompress}^{I}_{4}(U)\in\mathbb R^{B\times\lfloor T/4\rfloor\times128})             |              |              |
|  11 | (Q^{I}=\operatorname{reshape}*{64,128}(C^{Q}W*{IUQ}))                                                                                   |              |              |
|  12 | (Q^{I}*{t,h,-64:}\leftarrow\operatorname{RoPE}*{t}(Q^{I}_{t,h,-64:}))                                                                   |              |              |
|  13 | (w^{I}=UW_w\in\mathbb R^{B\times T\times64})                                                                                            |              |              |
|  14 | (\displaystyle I_{t,s}=\sum_{h=1}^{64}w^{I}*{t,h}\operatorname{ReLU}!\left(\left\langle Q^{I}*{t,h},C_{\ell,s}^{I}\right\rangle\right)) |              |              |
|  15 | (\mathcal R_t=\operatorname{TopK}*{1024}{I*{t,s}:4s<t}) (\triangleright) causal compressed retrieval                                    |              |              |
|  16 | (\mathcal S_t=\mathcal L_t\cup\mathcal R_t,\quad                                                                                        | \mathcal S_t | \le128+1024) |

### (r_\ell=128): (\mathrm{HCA})

| (s) | Operation                                                                          |
| --: | ---------------------------------------------------------------------------------- |
|  17 | (\mathcal C_{\ell}^{\mathrm{comp}}\leftarrow\operatorname{BlockCompress}_{128}(U)) |
|  18 | (\mathcal R_t={s:128(s+1)\le t}) (\triangleright) all preceding compressed blocks  |
|  19 | (\mathcal S_t=\mathcal L_t\cup\mathcal R_t)                                        |

### (r_\ell=0): local-only

| (s) | Operation                   |
| --: | --------------------------- |
|  20 | (\mathcal S_t=\mathcal L_t) |

### Shared-KV multi-query attention

| (s) | Operation                                                                                                                                                              |              |             |
| --: | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------ | ----------- |
|  21 | (M_t=\operatorname{Gather}!\left(\mathcal K_{\ell}^{\mathrm{local}},\mathcal C_{\ell}^{\mathrm{comp}};\mathcal S_t\right)\in\mathbb R^{                                | \mathcal S_t | \times512}) |
|  22 | (\displaystyle z_{t,h,j}=\frac{\langle Q_{t,h},M_{t,j}\rangle}{\sqrt{512}})                                                                                            |              |             |
|  23 | (\displaystyle a_{t,h,j}=\frac{\exp(z_{t,h,j})}{\exp(\zeta_{\ell,h})+\sum_{u\in\mathcal S_t}\exp(z_{t,h,u})}) (\triangleright) learned attention sink (\zeta_{\ell,h}) |              |             |
|  24 | (\displaystyle O_{t,h}=\sum_{j\in\mathcal S_t}a_{t,h,j}M_{t,j}\in\mathbb R^{512})                                                                                      |              |             |
|  25 | (O_{t,h,-64:}\leftarrow\operatorname{RoPE}*{-t}(O*{t,h,-64:}))                                                                                                         |              |             |
|  26 | (O_t^{(g)}=\operatorname{Concat}(O_{t,8g+1},\ldots,O_{t,8g+8})\in\mathbb R^{4096})                                                                                     |              |             |
|  27 | (P_t^{(g)}=O_t^{(g)}W_{O,a}^{(g)}\in\mathbb R^{1024},\quad g=0,\ldots,15)                                                                                              |              |             |
|  28 | (\boxed{Y_{\ell,t}^{A}=\operatorname{Concat}*{g=0}^{15}(P_t^{(g)})W*{O,b}\in\mathbb R^{7168}})                                                                         |              |             |

([arXiv][2])

---

## (\boxed{\textsc{Algorithm 4: DeepSeekMoE}})

[
\begin{array}{ll}
\textbf{Input:}
&
U\in\mathbb R^{B\times T\times7168},
\quad
X_{\mathrm{id}}\in\mathbb N^{B\times T},
\quad
\ell
\
\textbf{Output:}
&
Y^{E}\in\mathbb R^{B\times T\times7168}
\end{array}
]

| (s) | Operation                                                                                                                                                            |
| --: | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
|   1 | (R=UW_R^{\mathsf T}\in\mathbb R^{BT\times384})                                                                                                                       |
|   2 | (S_e=\sqrt{\operatorname{Softplus}(R_e)})                                                                                                                            |
|   3 | (\displaystyle \mathcal I_t=\begin{cases}\operatorname{HashTable}*{\ell}(X*{\mathrm{id},t}),&\ell\le3,[1mm]\operatorname{TopK}*{6}(S_t+b*\ell),&\ell>3.\end{cases})  |
|   4 | (\displaystyle \alpha_{t,e}=2.5,\frac{S_{t,e}}{\sum_{j\in\mathcal I_t}S_{t,j}},\qquad e\in\mathcal I_t) (\triangleright) selection bias excluded from mixture weight |
|   5 | (G_e=\min(UW_{1,e}^{\mathsf T},10))                                                                                                                                  |
|   6 | (P_e=\operatorname{clip}(UW_{3,e}^{\mathsf T},-10,10))                                                                                                               |
|   7 | (E_e(U)=\left[\operatorname{SiLU}(G_e)\odot P_e\right]W_{2,e}^{\mathsf T})                                                                                           |
|   8 | (\mathcal D=\operatorname{Dispatch}{(U_t,\alpha_{t,e}):e\in\mathcal I_t}) (\triangleright) logical expert routing                                                    |
|   9 | (\displaystyle Y_t^{\mathrm{routed}}=\sum_{e\in\mathcal I_t}\alpha_{t,e}E_e(U_t))                                                                                    |
|  10 | (Y_t^{\mathrm{shared}}=E_{\mathrm{shared}}(U_t))                                                                                                                     |
|  11 | (\boxed{Y_t^{E}=Y_t^{\mathrm{routed}}+Y_t^{\mathrm{shared}}})                                                                                                        |
|  12 | (Y^{E}\leftarrow\operatorname{ReduceExpertPartitions}(Y^{E})) (\triangleright) required only when experts are partitioned                                            |

[
\begin{aligned}
&W_{1,e},W_{3,e}\in\mathbb R^{3072\times7168},
\
&W_{2,e}\in\mathbb R^{7168\times3072},
\
&\Theta_{\mathrm{expert}}:\mathrm{FP4},
\qquad
\Theta_{\mathrm{nonexpert}}:\mathrm{FP8\ E4M3}.
\end{aligned}
]

([arXiv][2])

---

## (\boxed{\textsc{Algorithm 5: DeepSeek-V4-Pro Prefill / Backbone Forward}})

[
\begin{array}{ll}
\textbf{Input:}
&
X_{\mathrm{id}}\in{0,\ldots,V-1}^{B\times T},
\quad T\le1{,}048{,}576
[1mm]
\textbf{Output:}
&
Z\in\mathbb R^{B\times T\times V},
\quad
\mathcal C^{+}
\end{array}
]

| (s) | Operation                                                                                                            |
| --: | -------------------------------------------------------------------------------------------------------------------- |
|   1 | (H^{(0)}=\operatorname{Embedding}(X_{\mathrm{id}})\in\mathbb R^{B\times T\times7168})                                |
|   2 | (X^{(0)}=\operatorname{Repeat}_{4}(H^{(0)})\in\mathbb R^{B\times T\times4\times7168})                                |
|   3 | (\mathbf{for}\ \ell=1,\ldots,61)                                                                                     |
|   4 | (\quad X_{\ell}^{A}=\operatorname{mHC}*{,\operatorname{HybridAttn}*{r_\ell}}!\left(X^{(\ell-1)}\right))              |
|   5 | (\quad X^{(\ell)}=\operatorname{mHC}*{,\operatorname{DeepSeekMoE}*{\ell}}!\left(X_{\ell}^{A};X_{\mathrm{id}}\right)) |
|   6 | (\mathbf{end\ for})                                                                                                  |
|   7 | (\widehat X=\operatorname{RMSNorm}!\left(\operatorname{vec}_{4,d}(X^{(61)})\right))                                  |
|   8 | (\widetilde\pi=\alpha_{\mathrm{head}}\widehat XW_{\mathrm{head}}+S_{\mathrm{head}})                                  |
|   9 | (\pi=\sigma(\widetilde\pi)+\epsilon_{\mathrm{hc}}\in\mathbb R^{B\times T\times4})                                    |
|  10 | (H^{\mathrm{out}}=\displaystyle\sum_{i=1}^{4}\pi_i\odot X_{:, :, i,:}^{(61)}\in\mathbb R^{B\times T\times7168})      |
|  11 | (\overline H=\operatorname{RMSNorm}(H^{\mathrm{out}}))                                                               |
|  12 | (Z=\overline HW_{\mathrm{LM}}^{\mathsf T},\quad W_{\mathrm{LM}}\in\mathbb R^{129280\times7168})                      |
|  13 | (Z\leftarrow\operatorname{AllGather}_{V}(Z)) (\triangleright) vocabulary-parallel execution only                     |
|  14 | (\boxed{\operatorname{return}\ Z,\mathcal C^{+}})                                                                    |

[
\mathcal C^{+}
==============

\left{
\mathcal K_{\ell}^{\mathrm{local}},
\mathcal C_{\ell}^{\mathrm{comp}},
\mathcal C_{\ell}^{I},
\mathcal S_{\ell}^{\mathrm{compressor}}
\right}_{\ell=1}^{61}.
]

([Hugging Face][3])

---

## (\boxed{\textsc{Algorithm 6: Single Autoregressive Decode Step}})

[
\begin{array}{ll}
\textbf{Input:}
&
x_t\in{0,\ldots,V-1}^{B\times1},
\quad
t,
\quad
\mathcal C_t
\
\textbf{Output:}
&
z_t\in\mathbb R^{B\times V},
\quad
\mathcal C_{t+1}
\end{array}
]

| (s) | Operation                                                                                                                                                               |
| --: | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
|   1 | (h_t=\operatorname{Embedding}(x_t)\in\mathbb R^{B\times1\times7168})                                                                                                    |
|   2 | (X_t^{(0)}=\operatorname{Repeat}_{4}(h_t))                                                                                                                              |
|   3 | (\mathbf{for}\ \ell=1,\ldots,61)                                                                                                                                        |
|   4 | (\quad (A_{\ell}^{A},B_{\ell}^{A},C_{\ell}^{A})=\operatorname{mHCParameters}(X_t^{(\ell-1)}))                                                                           |
|   5 | (\quad u_{\ell}^{A}=\operatorname{RMSNorm}(A_{\ell}^{A}X_t^{(\ell-1)}))                                                                                                 |
|   6 | (\quad c_t^{Q}=\operatorname{RMSNorm}(u_{\ell}^{A}W_{DQ,\ell}))                                                                                                         |
|   7 | (\quad q_t=\operatorname{HeadRMSNorm}!\left(\operatorname{reshape}*{128,512}(c_t^{Q}W*{UQ,\ell})\right))                                                                |
|   8 | (\quad kv_t=\operatorname{RMSNorm}(u_{\ell}^{A}W_{KV,\ell}))                                                                                                            |
|   9 | (\quad q_{t,-64:},kv_{t,-64:}\leftarrow\operatorname{RoPE}*{t}(q*{t,-64:},kv_{t,-64:}))                                                                                 |
|  10 | (\quad\mathcal K_{\ell,t}^{\mathrm{local}}\leftarrow\operatorname{RingAppend}*{128}(\mathcal K*{\ell,t-1}^{\mathrm{local}},kv_t))                                       |
|  11 | (\quad\mathbf{if}\ r_\ell=4\land(t+1)\bmod4=0)                                                                                                                          |
|  12 | (\qquad\mathcal C_{\ell}^{\mathrm{comp}},\mathcal C_{\ell}^{I}\leftarrow\operatorname{OverlapCompressUpdate}*{4}(u*{\ell}^{A}))                                         |
|  13 | (\quad\mathbf{else\ if}\ r_\ell=128\land(t+1)\bmod128=0)                                                                                                                |
|  14 | (\qquad\mathcal C_{\ell}^{\mathrm{comp}}\leftarrow\operatorname{BlockCompressUpdate}*{128}(u*{\ell}^{A}))                                                               |
|  15 | (\quad\mathbf{end\ if})                                                                                                                                                 |
|  16 | (\quad\mathcal S_{\ell,t}\leftarrow\operatorname{SelectContext}(q_t,\mathcal K_{\ell}^{\mathrm{local}},\mathcal C_{\ell}^{\mathrm{comp}},\mathcal C_{\ell}^{I};r_\ell)) |
|  17 | (\quad y_{\ell,t}^{A}=\operatorname{SharedKVAttention}(q_t,\mathcal S_{\ell,t};\zeta_\ell))                                                                             |
|  18 | (\quad X_{\ell,t}^{A}=B_{\ell}^{A}X_t^{(\ell-1)}+C_{\ell}^{A}y_{\ell,t}^{A})                                                                                            |
|  19 | (\quad(A_{\ell}^{E},B_{\ell}^{E},C_{\ell}^{E})=\operatorname{mHCParameters}(X_{\ell,t}^{A}))                                                                            |
|  20 | (\quad u_{\ell}^{E}=\operatorname{RMSNorm}(A_{\ell}^{E}X_{\ell,t}^{A}))                                                                                                 |
|  21 | (\quad y_{\ell,t}^{E}=\operatorname{DeepSeekMoE}*{\ell}(u*{\ell}^{E},x_t))                                                                                              |
|  22 | (\quad X_t^{(\ell)}=B_{\ell}^{E}X_{\ell,t}^{A}+C_{\ell}^{E}y_{\ell,t}^{E})                                                                                              |
|  23 | (\mathbf{end\ for})                                                                                                                                                     |
|  24 | (h_t^{\mathrm{out}}=\operatorname{HCHead}(X_t^{(61)}))                                                                                                                  |
|  25 | (z_t=W_{\mathrm{LM}}\operatorname{RMSNorm}(h_t^{\mathrm{out}}))                                                                                                         |
|  26 | (x_{t+1}\sim\operatorname{DecodeDistribution}(z_t))                                                                                                                     |
|  27 | (\boxed{\operatorname{return}\ z_t,\mathcal C_{t+1}})                                                                                                                   |

([Hugging Face][3])

---

## (\boxed{\textsc{Algorithm 7: Single MTP Auxiliary Module}})

[
\begin{array}{ll}
\textbf{Input:}
&
X^{(61)}*{1:T-1}\in
\mathbb R^{B\times(T-1)\times4\times7168},
\quad
X*{\mathrm{id},2:T}
\
\textbf{Target:}
&
X_{\mathrm{id},3:T+1}
\end{array}
]

| (s) | Operation                                                                                                         |
| --: | ----------------------------------------------------------------------------------------------------------------- |
|   1 | (E^{+}=\operatorname{RMSNorm}!\left(\operatorname{Embedding}(X_{\mathrm{id},2:T})\right))                         |
|   2 | (H=\operatorname{RMSNorm}(X^{(61)}_{1:T-1}))                                                                      |
|   3 | (M^{(0)}=W_EE^{+}\otimes\mathbf1_{4}+W_HH)                                                                        |
|   4 | (M^{(1)}=\operatorname{mHC}_{\operatorname{HybridAttn}}!\left(M^{(0)}\right))                                     |
|   5 | (M^{(2)}=\operatorname{mHC}_{\operatorname{DeepSeekMoE}}!\left(M^{(1)}\right))                                    |
|   6 | (Z^{\mathrm{MTP}}=\operatorname{LMHead}!\left(\operatorname{HCHead}(M^{(2)})\right))                              |
|   7 | (\displaystyle \mathcal L_{\mathrm{NTP}}=-\sum_t\log p_\theta(x_{t+1}\mid x_{\le t}))                             |
|   8 | (\displaystyle \mathcal L_{\mathrm{MTP}}=-\sum_t\log p_\theta^{\mathrm{MTP}}(x_{t+2}\mid x_{\le t+1},X_t^{(61)})) |
|   9 | (\boxed{\mathcal L=\mathcal L_{\mathrm{NTP}}+\lambda_{\mathrm{MTP}}\mathcal L_{\mathrm{MTP}}})                    |
|  10 | (\operatorname{Discard}(Z^{\mathrm{MTP}})\quad\text{during autoregressive inference})                             |

([arXiv][2])

[1]: https://huggingface.co/deepseek-ai/DeepSeek-V4-Pro/blob/main/config.json "config.json · deepseek-ai/DeepSeek-V4-Pro at main"
[2]: https://arxiv.org/pdf/2606.19348 "DeepSeek-V4: Towards Highly Efficient Million-Token Context Intelligence"
[3]: https://huggingface.co/deepseek-ai/DeepSeek-V4-Pro/blob/main/inference/model.py "inference/model.py · deepseek-ai/DeepSeek-V4-Pro at main"
