# Source-Audited Reconstruction: DeepSeek, Qwen, and GLM Training Systems

## 0. Audit contract

**Evidence labels**

| Label                 | Meaning                                                                                           |
| --------------------- | ------------------------------------------------------------------------------------------------- |
| **[R] Reported**      | Explicitly stated in an official paper, technical report, model card, or release note.            |
| **[C] Code-verified** | Present in an official configuration, tokenizer template, repository, or released implementation. |
| **[D] Derived**       | Algebraically inferred from reported/code-verified facts. Assumptions are stated.                 |
| **[U] Undisclosed**   | No official artifact identifies the value, mechanism, or implementation.                          |

### Audit result

1. **DeepSeek-V3 has the highest end-to-end pretraining observability.** The report discloses accelerator count, PP/EP degrees, ZeRO stage, absence of TP, DualPipe, FP8 boundaries, activation recomputation, all-to-all implementation, batch schedule, optimizer family, clipping, sequence extension, tokenizer, MoE routing, and MTP. ([arXiv][1])
2. **Qwen3 has strong algorithmic but weak systems disclosure.** Architecture, data stages, tokenizer, post-training, GRPO, mode fusion, and distillation are reported, but cluster topology, parallelism degrees, optimizer configuration, precision policy, microbatching, checkpointing, and collective scheduling are not. ([ar5iv][2])
3. **GLM-5 has unusually strong disclosure of memory management and RL infrastructure**, including interleaved PP, pipeline-aware ZeRO-2 gradient sharding, activation offload, distributed Muon, asynchronous rollout/training separation, TITO, policy-version filtering, and cross-stage distillation. Exact PP/TP/EP/DP degrees remain undisclosed. ([arXiv][3])
4. **Literal cycle-accurate reconstruction is impossible. [U]** None of the families releases the complete kernel trace, GPU clock history, stream/event DAG, NCCL channel assignment, CUDA graph, memory-allocation trace, or optimizer checkpoint required to recover hardware cycles. The defensible result is **operation-, schedule-slot-, tensor-byte-, and dependency-accurate**, not clock-cycle accurate.

---

# 1. Generation ledger

This audit treats “generation” as a backbone or training-recipe change, not every API snapshot.

| Family   | Generation        | Auditable training delta                                                       | Coverage                                                                                         |
| -------- | ----------------- | ------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------ |
| DeepSeek | LLM / Coder / MoE | Dense LM, code/FIM pipeline, fine-grained MoE                                  | Partial                                                                                          |
| DeepSeek | V2 / Coder-V2     | MLA, DeepSeekMoE, longer context                                               | Architecture-level                                                                               |
| DeepSeek | **V3**            | FP8 pretraining, DualPipe, MTP, loss-free routing                              | Fullest reconstruction                                                                           |
| DeepSeek | **R1 / R1-Zero**  | GRPO, cold start, two RL stages, reasoning distillation                        | Post-training reconstruction                                                                     |
| DeepSeek | V3.1              | 840B-token continued pretraining and agent post-training                       | Delta only ([DeepSeek API Docs][4])                                                              |
| DeepSeek | V3.2              | DSA continued training                                                         | Delta only ([DeepSeek API Docs][5])                                                              |
| DeepSeek | V4 Preview        | 1.6T/49B-active Pro; 284B/13B-active Flash; token-wise compression + DSA       | Full optimizer topology not reconstructed from the release announcement ([DeepSeek API Docs][6]) |
| Qwen     | Qwen / 1.5        | Dense causal models; first Qwen MoE                                            | Partial                                                                                          |
| Qwen     | **Qwen2**         | GQA, dense and MoE, 7T-token recipe, DPO/online RL                             | Strong algorithmic coverage                                                                      |
| Qwen     | **Qwen2.5**       | 18T tokens, expanded SFT and multi-stage RL                                    | Partial systems disclosure                                                                       |
| Qwen     | **Qwen3**         | 36T tokens, 128-expert MoE, thinking fusion, GRPO, strong-to-weak distillation | Main reconstruction                                                                              |
| Qwen     | 3.5–3.7           | Product/backbone updates, including multimodal and agent releases              | No complete public optimizer topology in the audited artifacts                                   |
| GLM      | GLM / GLM-130B    | Autoregressive blank infilling and bilingual dense scaling                     | Objective-level reconstruction                                                                   |
| GLM      | ChatGLM1–3        | Dialogue-aligned descendants                                                   | Limited training-system disclosure                                                               |
| GLM      | GLM-4             | 10T-token multilingual family; multi-stage alignment                           | Partial ([arXiv][7])                                                                             |
| GLM      | **GLM-4.5**       | Muon, loss-free MoE, MTP, 4K→128K mid-training                                 | Strong algorithmic coverage                                                                      |
| GLM      | **GLM-5**         | MLA/DSA, distributed Muon, ZeRO-2-style PP gradients, asynchronous RL          | Main reconstruction                                                                              |
| GLM      | GLM-5.1/5.2       | Long-horizon product updates                                                   | No new end-to-end pretraining topology disclosed in the release posts                            |

---

# 2. Distributed state-transition model

Let a rank have coordinates

[
r=(r_{\mathrm{DP}},r_{\mathrm{TP}},r_{\mathrm{PP}},
r_{\mathrm{EP}},r_{\mathrm{CP}})
]

with

[
P=P_{\mathrm{DP}}P_{\mathrm{TP}}P_{\mathrm{PP}}
P_{\mathrm{EP}}P_{\mathrm{CP}}.
]

Define:

* (B_\mu): sequences per microbatch per source rank.
* (S): sequence length.
* (S_c=S/P_{\mathrm{CP}}): context-local length.
* (T=B_\mu S_c): local token count.
* (H): residual width.
* (n_q,n_{kv}): query and KV head counts.
* (d_q,d_k,d_v): per-head dimensions.
* (E): routed experts.
* (k): activated experts per token.
* (I_e): expert intermediate dimension.
* (V): vocabulary size.

A complete optimizer transition is

[
\mathcal S_t=
(\theta_t,m_t,v_t,\mathcal R_t,\mathcal D_t)
\longrightarrow
\mathcal S_{t+1},
]

where (\mathcal R_t) contains RNG/counter state and (\mathcal D_t) contains data-loader, sampler, and curriculum state.

[
x \rightarrow h_0 \rightarrow {h_l}*{l=1}^{L}
\rightarrow z
\rightarrow \mathcal L
\rightarrow \nabla*\theta\mathcal L
\rightarrow \hat g
\rightarrow \theta_{t+1}.
]

## 2.1 Representative architecture constants

| Quantity             |        DeepSeek-V3 |            Qwen3-235B-A22B |                                          GLM-5 |
| -------------------- | -----------------: | -------------------------: | ---------------------------------------------: |
| Layers               |             61 [R] |                   94 [R/C] | 3 dense + 75 MoE = 78 transformer layers [R/C] |
| (H)                  |           7168 [R] |                   4096 [C] |                                     6144 [R/C] |
| Query heads          |            128 [R] |                   64 [R/C] |                                       64 [R/C] |
| KV representation    |                MLA |                 4-head GQA |                                      MLA + DSA |
| Query latent rank    |           1536 [R] |                        N/A |                                     2048 [R/C] |
| KV latent rank       |            512 [R] |                        N/A |                                      512 [R/C] |
| QK dimensions        |           (128+64) |                        128 |                                   (192+64=256) |
| Value head dimension |                128 |                        128 |                                            256 |
| Routed experts       |                256 |                        128 |                                            256 |
| Top-(k)              |                  8 |                          8 |                                              8 |
| Shared experts       |                  1 |                          0 |                                              1 |
| Expert intermediate  |               2048 |                       1536 |                                           2048 |
| Vocabulary           | 128K tokenizer [R] | 151,936 config entries [C] |                                  154,880 [R/C] |

DeepSeek constants are reported in the V3 report and official model configuration. Qwen and GLM configuration values are code-verified in their official `config.json` files. ([arXiv][1])

---

# 3. Tensor-state ledger for one optimizer step

## 3.1 Persistent and ephemeral tensors

| State                      | Logical shape                                         | Typical precision                  | Owner and sharding                        | Lifetime                                   |
| -------------------------- | ----------------------------------------------------- | ---------------------------------- | ----------------------------------------- | ------------------------------------------ |
| Token IDs                  | ([B_\mu,S_c])                                         | int32/int64                        | Source/context rank                       | Data fetch → embedding                     |
| Position/document metadata | ([B_\mu,S_c])                                         | int32/bool                         | Context rank                              | Forward                                    |
| Embedding table            | ([V,H])                                               | BF16 or master precision           | PP edge rank; TP-vocab shard if used      | Persistent                                 |
| Residual (h_l)             | ([T,H/P_{\mathrm{TP,row}}])                           | BF16                               | Current PP/TP/CP rank                     | Forward → backward or recompute            |
| Q projection               | ([T,n_qd_q])                                          | BF16 output; FP8 GEMM in DeepSeek  | Head/column shard if TP                   | Attention block                            |
| K projection/latent        | GQA: ([T,n_{kv}d_k]); MLA: ([T,r_{kv}]) plus RoPE key | BF16                               | Attention rank                            | Attention backward/recompute               |
| V projection/latent        | GQA: ([T,n_{kv}d_v]); MLA latent/up-projection        | BF16                               | Attention rank                            | Attention backward/recompute               |
| Scores                     | ([B_\mu,n_q,S_c,S]) logically                         | FP32/BF16 accumulator              | CP/attention rank                         | Ideally tiled; materialization undisclosed |
| Routing logits             | ([T,E])                                               | BF16/FP32                          | Replicated across EP group before routing | Router forward/backward                    |
| Top-(k) indices            | ([T,k])                                               | int32                              | Routing source rank                       | Dispatch → combine                         |
| Dispatch metadata          | counts, offsets, inverse permutation                  | int32/int64                        | EP rank                                   | MoE layer                                  |
| Dispatch activation        | ([N_{\rm recv},H])                                    | FP8 DeepSeek; undisclosed Qwen/GLM | Destination expert rank                   | Expert forward/backward                    |
| Expert intermediates       | ([N_e,I_e]) per local expert                          | BF16/FP8 cache                     | Expert owner rank                         | Expert backward/recompute                  |
| Logits                     | ([T,V]) logically                                     | BF16/FP32                          | Vocabulary shard or last PP rank          | CE forward/backward                        |
| Loss sum/count             | Scalars                                               | FP32                               | Last stage, then DP reduction             | Step                                       |
| Gradients                  | Parameter-local                                       | BF16/FP32                          | Model rank; DP replicated or sharded      | Backward → update                          |
| Optimizer moments          | Parameter-local                                       | BF16/FP32                          | ZeRO/distributed-optimizer owner          | Persistent                                 |
| Master weights             | Parameter-local                                       | BF16/FP32                          | Optimizer owner                           | Persistent                                 |
| Communication scratch      | Variable                                              | FP8/BF16/int32                     | NCCL/custom-kernel rank                   | Collective-local                           |

**[U]** Exact allocation addresses, CUDA streams, allocator fragmentation, tensor alignment, padding policy, and temporary workspace sizes are not public.

---

# 4. Operation-by-operation transformer graph

## 4.1 Input and embedding

[
x\in\mathbb Z^{B_\mu\times S_c},
\qquad
h_0=E[x]\in\mathbb R^{B_\mu\times S_c\times H}.
]

* **DeepSeek-V3 [R]:** embedding and output head remain in high precision rather than FP8. ([arXiv][1])
* **Qwen3 [C]:** released checkpoint dtype is BF16; this does not prove that all pretraining GEMMs were BF16. ([Hugging Face][8])
* **GLM-5 [C]:** released checkpoint dtype is BF16; pretraining compute precision boundaries are undisclosed. ([Hugging Face][9])

## 4.2 RMSNorm forward and backward

For residual vector (x\in\mathbb R^H),

[
r=(H^{-1}\sum_j x_j^2+\epsilon)^{-1/2},
\qquad
y_j=\gamma_jx_jr.
]

Given (\bar y=\partial\mathcal L/\partial y),

[
\frac{\partial\mathcal L}{\partial \gamma_j}
============================================

\sum_{\text{tokens}}\bar y_jx_jr,
]

[
\bar x_j
========

## r\gamma_j\bar y_j

\frac{x_jr^3}{H}
\sum_i \gamma_i\bar y_i x_i.
]

**[D]** The reduction over (H) is local when the residual width is unsharded. With sequence parallelism, the token dimension is partitioned but no hidden-width collective is required. With hidden-width TP, both (\sum x_i^2) and (\sum\gamma_i\bar y_ix_i) require an all-reduce across the hidden-width shard.

**[R]** DeepSeek-V3 recomputes all RMSNorm operations during backward instead of retaining their outputs. ([arXiv][1])

## 4.3 RoPE

For each two-dimensional coordinate pair,

[
\begin{bmatrix}q'*{2i}\q'*{2i+1}\end{bmatrix}
=============================================

\begin{bmatrix}
\cos\omega_i p&-\sin\omega_i p\
\sin\omega_i p& \cos\omega_i p
\end{bmatrix}
\begin{bmatrix}q_{2i}\q_{2i+1}\end{bmatrix}.
]

Backward is the inverse rotation:

[
\bar q=R(p)^\top\bar q'.
]

* **DeepSeek-V3 [R]:** RoPE is applied only to the decoupled positional query/key component in MLA; YaRN extension is applied to the shared decoupled key. ([arXiv][1])
* **Qwen3 [R/C]:** full GQA uses RoPE with base frequency (10^6); YaRN and DCA extend inference context. ([ar5iv][2])
* **GLM-4.5 [R]:** partial RoPE plus GQA and QK-Norm.
* **GLM-5 [R/C]:** MLA separates 192 non-positional and 64 positional QK dimensions. ([ar5iv][10])

## 4.4 Attention backward

Logically,

[
A=\frac{QK^\top}{\sqrt{d_k}}+M,\qquad
P=\operatorname{softmax}(A),\qquad
O=PV.
]

The exact backward is

[
\bar V=P^\top\bar O,
]

[
\bar P=\bar OV^\top,
]

[
\bar A=P\odot
\left(
\bar P-\operatorname{rowsum}(\bar P\odot P)
\right),
]

[
\bar Q=\bar AK/\sqrt{d_k},
\qquad
\bar K=\bar A^\top Q/\sqrt{d_k}.
]

**[U]** None of the principal reports proves whether every generation used a particular FlashAttention release, whether (P) was materialized, or the exact tiling and checkpoint policy. Therefore, memory accounting must not charge a persistent (O(S^2)) score tensor unless an implementation artifact proves materialization.

---

# 5. Family-specific attention state construction

## 5.1 DeepSeek-V3 MLA

For each token residual (h\in\mathbb R^{7168}):

[
c^Q=W^{DQ}h\in\mathbb R^{1536},
]

[
q^C=\operatorname{reshape}(W^{UQ}c^Q)
\in\mathbb R^{128\times128},
]

[
q^R=\operatorname{RoPE}
\left(
\operatorname{reshape}(W^{QR}c^Q)
\right)
\in\mathbb R^{128\times64},
]

[
c^{KV}=W^{DKV}h\in\mathbb R^{512},
]

[
k^C=\operatorname{reshape}(W^{UK}c^{KV})
\in\mathbb R^{128\times128},
]

[
v^C=\operatorname{reshape}(W^{UV}c^{KV})
\in\mathbb R^{128\times128},
]

[
k^R=\operatorname{RoPE}(W^{KR}h)\in\mathbb R^{64}.
]

The positional key is shared across heads:

[
q_i=[q_i^C;q_i^R]\in\mathbb R^{192},
\qquad
k_i=[k_i^C;k^R]\in\mathbb R^{192}.
]

The V3 report explicitly gives the 1536 query rank, 512 KV rank, 128 content dimension, 64 decoupled positional dimension, and 128 heads. ([arXiv][1])

**Backward [D]:**

1. Attention produces (\bar q^C,\bar q^R,\bar k^C,\bar k^R,\bar v^C).
2. Apply inverse RoPE to positional gradients.
3. Accumulate the shared-key gradient over all 128 heads.
4. Backpropagate through (W^{UK},W^{UV}) into (c^{KV}).
5. Sum the two latent contributions before (W^{DKV}).
6. Backpropagate (q^C,q^R) into (c^Q), then through (W^{DQ}).

**[R]** The MLA up-projections are recomputed during backward to reduce activation memory. ([arXiv][1])

## 5.2 Qwen3 GQA

For Qwen3-235B-A22B:

[
Q\in\mathbb R^{T\times64\times128},
]

[
K,V\in\mathbb R^{T\times4\times128}.
]

Each KV head serves

[
g=\frac{64}{4}=16
]

query heads.

**[D]** K/V replication across query groups is normally a logical view, not a persistent 16-fold copy. During backward, gradients from the 16 associated query heads are reduced into each KV head.

**[R]** Qwen3 adds QK-Norm and removes the QKV biases used in Qwen2. ([ar5iv][2])

## 5.3 GLM-5 MLA + DSA

GLM-5 uses

[
c^Q\in\mathbb R^{T\times2048},
\qquad
c^{KV}\in\mathbb R^{T\times512},
]

[
Q,K\in\mathbb R^{T\times64\times256},
\qquad
V\in\mathbb R^{T\times64\times256}.
]

The released configuration separates

[
d_{\mathrm{nope}}=192,\qquad
d_{\mathrm{rope}}=64.
]

DSA adds an indexer with

[
n_{\mathrm{index}}=32,\qquad
d_{\mathrm{index}}=128,\qquad
k_{\mathrm{DSA}}=2048.
]

These values are code-verified in the official GLM-5 configuration. ([Hugging Face][9])

**[R]** GLM-5 was continued from a dense-attention model into DSA rather than trained with sparse attention from initialization. Its reported adaptation has indexer warm-up followed by sparse joint training; the paper also reports freezing the indexer by default during RL and using deterministic `torch.topk` to prevent rollout/training routing mismatch. ([arXiv][3])

---

# 6. MoE state transition

For token (t), router preactivation is

[
u_t=W_gh_t\in\mathbb R^E.
]

For DeepSeek and GLM loss-free routers,

[
s_{t,e}=\sigma(u_{t,e}),
]

and routing selection uses corrected scores

[
\tilde s_{t,e}=s_{t,e}+b_e,
\qquad
I_t=\operatorname{TopK}(\tilde s_t,k).
]

The mixture output is

[
y_t=
y_t^{\mathrm{shared}}
+
\sum_{e\in I_t}
\alpha_{t,e}f_e(h_t),
\qquad
\alpha_{t,e}
============

\frac{s_{t,e}}
{\sum_{j\in I_t}s_{t,j}}.
]

The balancing bias (b_e) affects selection but is not differentiated through the model objective. It is updated from observed expert load.

## 6.1 Token permutation and all-to-all

For source rank (r_s):

1. Compute top-(k) expert IDs.
2. Map each expert ID to destination EP rank.
3. Histogram destination counts.
4. Exchange counts or precompute fixed-capacity offsets.
5. Stable- or grouped-sort ((t,e)) assignments.
6. Pack ([h_t,\alpha_{t,e},t,e]).
7. Execute EP all-to-all.
8. Locally sort by expert.
9. Run grouped GEMMs.
10. Reverse all-to-all.
11. Apply routing weights and inverse permutation.
12. Reduce the (k) expert outputs into one token output.

For a local token count (T), the logical dispatched activation volume is

[
N_{\mathrm{dispatch}}=Tk,
\qquad
V_{\mathrm{dispatch}}=TkH,b_a.
]

For balanced routing, each EP rank receives approximately

[
N_{\mathrm{recv}}\approx \frac{Tk}{P_{\mathrm{EP}}}.
]

### Family deltas

* **DeepSeek-V3 [R]:** 256 routed experts, top-8, one shared expert, maximum four destination nodes per token, no token dropping, FP8 dispatch, BF16 combine. ([arXiv][1])
* **Qwen3 [R/C]:** 128 experts, top-8, no shared experts, normalized selected probabilities, global-batch auxiliary balancing coefficient (10^{-3}) in the released configuration. ([ar5iv][2])
* **GLM-4.5/5 [R/C]:** sigmoid routing, loss-free balancing, top-8, one shared expert. GLM-4.5 reports bias update rate (10^{-3}) for the first 15T tokens, then zero, plus a sequence-level auxiliary loss weighted (10^{-4}). ([ar5iv][10])

## 6.2 Expert MLP

For SwiGLU expert (e),

[
a_e=X_eW_{e,g},
\qquad
b_e=X_eW_{e,u},
]

[
m_e=\operatorname{SiLU}(a_e)\odot b_e,
\qquad
Y_e=m_eW_{e,d}.
]

Shapes:

[
X_e\in\mathbb R^{N_e\times H},
\quad
a_e,b_e,m_e\in\mathbb R^{N_e\times I_e},
\quad
Y_e\in\mathbb R^{N_e\times H}.
]

Backward:

[
\bar m_e=\bar Y_eW_{e,d}^{\top},
]

[
\bar a_e=
\bar m_e\odot b_e\odot
\left[
\sigma(a_e)+a_e\sigma(a_e)(1-\sigma(a_e))
\right],
]

[
\bar b_e=\bar m_e\odot\operatorname{SiLU}(a_e),
]

followed by the three weight-gradient and input-gradient GEMMs.

**[R]** DeepSeek caches MoE SwiGLU inputs in FP8 and recomputes the output-side activation during backward. ([arXiv][1])

---

# 7. Vocabulary projection and distributed cross-entropy

[
z=h_LW_{\mathrm{vocab}}^\top,
\qquad
z\in\mathbb R^{T\times V}.
]

For a vocabulary-sharded head, rank (r_t) owns

[
V_r\approx V/P_{\mathrm{TP}}.
]

A numerically stable distributed CE requires:

1. Local maximum (m_r=\max_{v\in V_r}z_v).
2. Global maximum (m=\operatorname{allreduce}_{\max}(m_r)).
3. Local exponential sum (s_r=\sum_{v\in V_r}e^{z_v-m}).
4. Global sum (s=\operatorname{allreduce}_{\sum}(s_r)).
5. Owner rank extracts the target logit.
6. Target logit is globally reduced.
7. Compute

[
\ell_t=-z_{t,y_t}+m+\log s.
]

Backward is

[
\frac{\partial\ell_t}{\partial z_{t,v}}
=======================================

p_{t,v}-\mathbf 1[v=y_t].
]

**[U]** DeepSeek reports no TP for V3, so vocabulary TP is not part of its reported configuration. Qwen and GLM do not disclose whether their training heads used vocabulary parallelism.

---

# 8. DeepSeek-V3: one physical optimizer step

## 8.1 Reported topology

[
P=2048.
]

[
P_{\mathrm{PP}}=16,\qquad
P_{\mathrm{EP}}=64,\qquad
P_{\mathrm{TP}}=1.
]

DeepSeek reports ZeRO-1 DP and no tensor parallelism. ([arXiv][1])

Assuming these dimensions are orthogonal:

[
P_{\mathrm{DP}}
===============

\frac{2048}{16\cdot64}
=2.
]

Thus the source-supported reconstruction is

[
\boxed{
P=2_{\mathrm{DP}}\times1_{\mathrm{TP}}
\times16_{\mathrm{PP}}\times64_{\mathrm{EP}}
\times1_{\mathrm{CP}}
}
]

where (P_{\mathrm{DP}}=2) and (P_{\mathrm{CP}}=1) are **[D]**, because the report does not separately print them.

## 8.2 Step batch

At the final reported pretraining batch:

[
B_{\mathrm{global}}=15360\ \text{sequences},
\qquad
S=4096.
]

Therefore,

[
N_{\mathrm{tokens/step}}
========================

# 15360\cdot4096

62{,}914{,}560.
]

The batch grows from 3072 to 15360 sequences during the first 469B tokens. ([arXiv][1])

Let (b_\mu) be the undisclosed per-pipeline microbatch size. Then

[
N_{\mathrm{microbatches}}
=========================

# \frac{15360}{P_{\mathrm{DP}}b_\mu}

\frac{7680}{b_\mu}.
]

**[U]** (b_\mu), gradient-accumulation depth, and number of simultaneously resident DualPipe microbatches are not published.

## 8.3 Forward execution

1. **[R]** Load packed 4K sequences produced with document integrity but no cross-sample attention mask. Ten percent of documents are transformed by PSM FIM. ([arXiv][1])
2. **[R]** Embed with the 128K byte-level BPE vocabulary.
3. **[R]** Execute three dense FFN transformer layers, then 58 MoE layers.
4. **[R]** Linear Fprop GEMMs use FP8 inputs and return BF16 or FP32 outputs; norms, attention, router, embeddings, and output projection remain higher precision. ([arXiv][1])
5. **[R]** Each MoE layer dispatches top-8 routes across 64 EP ranks with at most four destination nodes per token.
6. **[R]** The primary head predicts (x_{i+1}); one MTP module predicts the additional future token. The MTP module shares embeddings/output head with the main model. ([arXiv][1])

The objective is

[
\mathcal L
==========

\mathcal L_{\mathrm{NTP}}
+
\lambda_{\mathrm{MTP}}\mathcal L_{\mathrm{MTP}}
+
\lambda_{\mathrm{seq-bal}}\mathcal L_{\mathrm{seq-bal}}.
]

[
\lambda_{\mathrm{MTP}}
======================

\begin{cases}
0.3,& \text{first }10\text{T tokens},\
0.1,& \text{remaining }4.8\text{T},
\end{cases}
]

and

[
\lambda_{\mathrm{seq-bal}}=10^{-4}.
]

## 8.4 Backward execution

1. Last PP stage initializes (\bar z) from distributed/local CE.
2. Backward traverses output projection and MTP in reverse dependency order.
3. DualPipe splits each attention and MLP backward into:

   * input-gradient computation (B_x);
   * weight-gradient computation (B_w).
4. RMSNorm and MLA up-projections are recomputed.
5. MoE combine backward reconstructs each routed expert contribution.
6. Reverse all-to-all sends expert input gradients back to source ranks.
7. FP8 Wgrad and Dgrad GEMMs compute local weight and activation gradients.
8. Gradients accumulate over all microbatches.
9. DP replicas synchronize gradients.
10. Compute global gradient norm and clip to one.
11. ZeRO-1 owners update their optimizer-state partitions.
12. Updated parameter partitions are broadcast/all-gathered to restore replicated parameters.

DeepSeek explicitly reports FP8 Fprop, Dgrad, and Wgrad; RMSNorm/MLA recomputation; gradient clipping at 1.0; and ZeRO-1. ([arXiv][1])

**[U]** Dynamic loss scaling, overflow thresholds, skip-step behavior, stochastic rounding policy, and exact master-weight dtype are not disclosed. The report says master weights, gradients, and optimizer state use higher precision than FP8, while optimizer states are specifically stored in BF16. ([arXiv][1])

## 8.5 Optimizer

DeepSeek reports AdamW, although several numeric values are missing from the arXiv HTML rendering. The original report configuration gives the commonly cited values

[
\beta_1=0.9,\qquad
\beta_2=0.95,\qquad
\lambda_{\mathrm{wd}}=0.1.
]

For optimizer-owned parameter (i):

[
m_{t,i}=\beta_1m_{t-1,i}+(1-\beta_1)\hat g_{t,i},
]

[
v_{t,i}=\beta_2v_{t-1,i}+(1-\beta_2)\hat g_{t,i}^{,2},
]

[
\theta_{t+1,i}
==============

## \theta_{t,i}

\eta_t
\left(
\frac{\hat m_{t,i}}
{\sqrt{\hat v_{t,i}}+\epsilon}
+
\lambda_{\mathrm{wd}}\theta_{t,i}
\right).
]

**[U]** The exact parameter groups excluded from decay are not specified in the V3 report. It is therefore unjustified to assert the standard “norm and bias excluded” rule.

## 8.6 DeepSeek memory model

[
M_{\mathrm{rank}}
=================

M_W+M_G+M_O+M_A+M_C+M_F.
]

For a rank owning (N_d) dense parameters and (N_e) expert parameters,

[
M_W=b_W(N_d+N_e).
]

With ZeRO-1 and (P_{\mathrm{DP}}=2):

[
M_G=b_G(N_d+N_e),
]

[
M_O\approx
\frac{b_O(N_d+N_e)}{2}.
]

Optimizer sharding does not shard weights or gradients under ZeRO-1.

A residual-dominant activation lower bound per resident layer is

[
M_{A,\min}
\gtrsim
b_A,T,H.
]

A more representative recompute-aware bound is

[
M_A
\approx
N_{\mathrm{resident\ chunks}}
,
b_A T
\left[
c_hH+
c_q(128)(192)+
c_v(128)(128)+
c_e kI_e
\right],
]

where the coefficients depend on which activations are cached versus recomputed.

Communication workspace includes approximately

[
M_{C,\mathrm{dispatch}}
\approx
b_{\mathrm{FP8}}\frac{TkH}{64}
]

for balanced incoming FP8 dispatch, plus BF16 combine buffers, counts, permutations, and RDMA/NVLink staging.

**[U]** (M_F), fragmentation and allocator slack, cannot be recovered without a memory trace.

---

# 9. DeepSeek pretraining, SFT, RL, and distillation

## 9.1 Pretraining

| Property                     | Audited result                                                                                                                     |
| ---------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| Tokenizer                    | **[R]** Byte-level BPE, 128K; multilingual pretokenizer; punctuation/newline fusion with random splitting to reduce boundary bias. |
| Corpus                       | **[R]** 14.8T tokens; English and Chinese dominant; enhanced math, code, and multilingual mixture.                                 |
| Packing                      | **[R]** Document-integrity packing; no cross-sample attention masking.                                                             |
| FIM                          | **[R]** PSM at document level with probability 0.1.                                                                                |
| Objective                    | **[R]** causal NTP + depth-1 MTP + small sequence-level balance loss.                                                              |
| Initialization               | **[R]** all trainable parameters sampled with standard deviation 0.006.                                                            |
| Initial context              | **[R]** 4096.                                                                                                                      |
| Context extension            | **[R]** 1000 steps at 32K, then 1000 at 128K; batch 1920 then 480; YaRN on decoupled key only.                                     |
| Global batch                 | **[R]** 3072→15360 sequences.                                                                                                      |
| Optimizer                    | **[R]** AdamW.                                                                                                                     |
| Precision                    | **[R]** FP8 linear GEMMs; higher precision attention/norm/router/embedding/head; BF16 optimizer state.                             |
| Checkpoint interval          | **[U]**                                                                                                                            |
| Validation interval          | **[U]**                                                                                                                            |
| Data-loader determinism      | **[U]**                                                                                                                            |
| Loss-scale/overflow protocol | **[U]**                                                                                                                            |

([arXiv][1])

## 9.2 SFT

DeepSeek-V3 uses 1.5M SFT instances and trains for two epochs. Reasoning examples are generated through specialist models and rejection sampling; non-reasoning examples are generated through a separate pipeline with human verification. Packed SFT sequences use sample-level masking to isolate examples. ([arXiv][1])

**Undisclosed SFT mechanics**

* **[U]** Exact chat-template control tokens.
* **[U]** Whether user/system tokens receive zero labels.
* **[U]** Per-token weighting.
* **[U]** Optimizer-state reuse from pretraining.
* **[U]** SFT microbatch and parallel topology.
* **[U]** Packing boundary implementation beyond sample isolation.

DeepSeek-R1 cold start explicitly uses a reasoning block followed by a summary block. Thousands of cold-start samples initialize the actor. A later SFT stage contains approximately 600K accepted reasoning traces and 200K non-reasoning examples and trains for two epochs. ([arXiv][11])

## 9.3 RL

DeepSeek-R1-Zero begins from the V3 base model without SFT. DeepSeek-R1 instead follows:

[
\text{cold-start SFT}
\rightarrow
\text{reasoning RL}
\rightarrow
\text{rejection-sampled SFT}
\rightarrow
\text{general RL}.
]

([arXiv][11])

For prompt (q), GRPO samples (G) responses:

[
o_i\sim\pi_{\theta_{\rm old}}(\cdot|q),
]

[
A_i=
\frac{r_i-\operatorname{mean}_j r_j}
{\operatorname{std}_j r_j+\epsilon}.
]

A reconstructed clipped objective is

[
\mathcal L_{\mathrm{GRPO}}
==========================

*

\frac{1}{G}
\sum_{i,t}
m_{i,t}
\min
\left[
\rho_{i,t}A_i,,
\operatorname{clip}
(\rho_{i,t},1-\epsilon,1+\epsilon)A_i
\right]
+
\beta D_{\mathrm{KL}}
(\pi_\theta\Vert\pi_{\mathrm{ref}}),
]

[
\rho_{i,t}
==========

\exp
\left[
\log\pi_\theta(a_{i,t}|s_{i,t})
-------------------------------

\log\pi_{\theta_{\rm old}}(a_{i,t}|s_{i,t})
\right].
]

* **[R]** GRPO eliminates the critic and derives the baseline from group rewards. ([arXiv][11])
* **[R]** Math and coding use rule-based correctness signals; general alignment uses reward models.
* **[R]** Language-consistency reward is added during reasoning RL.
* **[R]** The final RL stage combines reasoning correctness with helpfulness and harmlessness. ([arXiv][11])
* **[U]** Rollout/training GPU disaggregation, group size, PPO epochs, clipping coefficient, KL coefficient, policy staleness, actor synchronization frequency, and log-prob storage dtype.

## 9.4 Distillation

DeepSeek-R1 distillation is **sequence-level**, not reported logit-level distillation:

[
\mathcal D_{\mathrm{distill}}
=============================

{(q,o_{\mathrm{R1}}):
o_{\mathrm{R1}}\text{ passes filters}}.
]

The students are fine-tuned using the approximately 800K curated R1 samples. ([arXiv][11])

Therefore:

* Teacher temperature: **[U]**
* Logit transfer: **not reported**
* KL direction: **not applicable to the reported procedure**
* Confidence weighting: **[U]**
* Student-specific curriculum: **[U]**
* Capacity mismatch handling: **[D]** handled implicitly through hard-sequence SFT and data filtering, not through explicit teacher-logit calibration.

---

# 10. Qwen3: one logical optimizer step

## 10.1 Physical topology

[
P_{\mathrm{DP}},P_{\mathrm{TP}},P_{\mathrm{PP}},
P_{\mathrm{EP}},P_{\mathrm{CP}}
===============================

\boxed{\text{undisclosed}}.
]

No official Qwen3 report section identifies accelerator type/count, TP/PP/EP degrees, ZeRO/FSDP stage, pipeline schedule, or collective implementation. Any claimed Megatron or DeepSpeed topology would be a compatible implementation, not a reconstruction of Alibaba’s training run.

## 10.2 Code-verified local graph

For Qwen3-235B-A22B:

[
h_l\in\mathbb R^{T\times4096}.
]

GQA tensors are

[
Q\in\mathbb R^{T\times64\times128},
\qquad
K,V\in\mathbb R^{T\times4\times128}.
]

The MoE router emits

[
u\in\mathbb R^{T\times128},
]

and dispatches eight routes per token. Each expert maps

[
4096\rightarrow1536\rightarrow4096.
]

The model has 94 layers, 128 experts, top-8 routing, no shared experts, RMSNorm, QK-Norm, RoPE, SwiGLU, and untied embeddings. ([ar5iv][2])

The released objective-compatible loss is

[
\mathcal L
==========

\mathcal L_{\mathrm{NTP}}
+
\lambda_{\mathrm{GBLB}}\mathcal L_{\mathrm{GBLB}},
\qquad
\lambda_{\mathrm{GBLB}}=10^{-3}
]

from the released configuration.

**[U]** Whether the published `router_aux_loss_coef` exactly matches the full pretraining run or only the released Transformers representation cannot be independently verified.

## 10.3 One step

1. Token IDs are embedded to ([T,4096]).
2. RMSNorm normalizes the residual.
3. Q, K, V projections create 64 Q and four KV heads.
4. QK-Norm normalizes per-head Q and K vectors.
5. RoPE rotates Q/K coordinates.
6. Causal GQA computes attention output.
7. Residual addition forms the MoE input.
8. Router computes 128 logits and selects eight experts.
9. Tokens are permuted and dispatched to expert owners.
10. Grouped SwiGLU expert GEMMs execute.
11. Expert outputs are returned and weighted.
12. Final RMSNorm and vocabulary projection produce ([T,151936]) logical logits.
13. Shifted next-token CE and global-batch balance loss are reduced.
14. Backward traverses CE, head, MoE, attention, and embeddings.
15. Gradients are synchronized and the optimizer updates parameters.

Steps 1–13 are **[C/D]** from architecture configuration. Steps 8–10 require EP for practical execution at this scale, but the actual EP degree and collective are **[U]**.

## 10.4 Qwen3 memory

Because topology is undisclosed, only a parameterized expression is defensible:

[
M_W
===

b_W
\left(
\frac{N_{\mathrm{dense}}}
{P_{\mathrm{PP}}P_{\mathrm{TP}}}
+
\frac{N_{\mathrm{expert}}}
{P_{\mathrm{PP}}P_{\mathrm{TP}}P_{\mathrm{EP}}}
\right).
]

If gradients are DP-replicated:

[
M_G=b_GN_{\mathrm{owned}}.
]

If ZeRO-2/FSDP gradient sharding was used:

[
M_G\approx \frac{b_GN_{\mathrm{owned}}}{P_{\mathrm{DP}}}.
]

Both are compatible; neither is source-verified.

The dominant MoE activation traffic per layer is

[
V_{\mathrm{A2A}}
\approx
TkH,b_a
=======

8T(4096)b_a
]

logical bytes before balancing across EP ranks.

---

# 11. Qwen pretraining, SFT, RL, and distillation

## 11.1 Pretraining

Qwen3 uses a 151,669-token BBPE tokenizer at the tokenizer-design level; the released model configuration has 151,936 entries including reserved/special IDs. The corpus contains approximately 36T tokens over 119 languages and includes web text, PDF-extracted text, books, STEM, code, multilingual data, and synthetic data generated with Qwen2.5 variants. ([ar5iv][2])

The three stages are:

[
\begin{aligned}
S_1 &: >30\text{T tokens},\quad S=4096,\
S_2 &: \approx5\text{T tokens},\quad S=4096,\
S_3 &: \text{hundreds of billions},\quad S=32768.
\end{aligned}
]

Stage 2 increases STEM, coding, reasoning, and synthetic data and accelerates LR decay. Stage 3 uses 75% sequences in 16K–32K and 25% in 4K–16K. ([ar5iv][2])

| Property                                                        | Status                             |
| --------------------------------------------------------------- | ---------------------------------- |
| Corpus source categories                                        | [R]                                |
| Instance-level mixture optimization using proxy-model ablations | [R]                                |
| Document packing algorithm                                      | [U]                                |
| Cross-document attention policy                                 | [U]                                |
| Global batch                                                    | [U]                                |
| Microbatch/GAS                                                  | [U]                                |
| Optimizer and (\beta) values                                    | [U]                                |
| Weight decay                                                    | [U]                                |
| Precision used during training                                  | [U]                                |
| Gradient clipping                                               | [U]                                |
| Initialization used in actual run                               | [U]; released config says 0.02 [C] |
| Checkpoint/validation intervals                                 | [U]                                |
| Distributed topology                                            | [U]                                |

## 11.2 Qwen2 versus Qwen3 architectural deltas

* **Qwen2 [R]:** GQA, SwiGLU, RoPE, QKV bias, RMSNorm, dense and MoE variants; 7T principal training tokens, with MoE upcycling and later long-context adaptation. ([arXiv][12])
* **Qwen3 [R]:** removes QKV bias, adds QK-Norm, removes shared experts from its MoE, and uses global-batch balance loss. ([ar5iv][2])

These mechanisms must not be retroactively assigned to Qwen2.

## 11.3 SFT and mode fusion

Qwen3 post-training is:

[
\text{Long-CoT cold start}
\rightarrow
\text{Reasoning RL}
\rightarrow
\text{Thinking-mode fusion SFT}
\rightarrow
\text{General RL}.
]

The cold-start queries are filtered for verifiability and difficulty. Candidate traces are generated with QwQ-32B and rejected for incorrect answers, repetition, guessing, summary/reasoning inconsistency, language mixing, or validation-set similarity. ([ar5iv][2])

Thinking-mode fusion performs continual SFT on a mixture of:

* reasoning traces rejection-sampled from the Stage-2 model;
* non-thinking coding, math, multilingual, instruction-following, writing, QA, and role-playing data.

The chat template uses `/think` and `/no_think`; non-thinking samples retain an empty thinking block. Multi-turn samples may contain multiple switches, with the last flag controlling the response. ([ar5iv][2])

**Undisclosed**

* Exact role-token IDs and template probabilities.
* Prompt-token versus response-token loss mask.
* Per-token weighting of thinking/final-answer spans.
* Packing boundaries.
* Optimizer-state reuse.
* LR and batch size.
* Explicit anti-forgetting regularizer.

The main forgetting-control mechanism that is actually reported is **data replay through Stage-2-generated reasoning traces**, not EWC, L2-SP, or adapter isolation.

## 11.4 Reasoning RL

Qwen3 reports 3,995 query-verifier pairs and GRPO. It uses large batches, many rollouts per query, and some off-policy reuse. The flagship model’s reported reasoning RL lasts 170 optimizer updates. ([ar5iv][2])

**[U]**

* Group size.
* Number of samples retained per query.
* Off-policy replay depth.
* Clipping coefficient.
* KL/reference-model configuration.
* Reward normalization.
* Rollout engine architecture.
* Synchronization cadence.
* Policy-lag bound.
* Log-probability storage precision.

## 11.5 Strong-to-weak distillation

Qwen3 explicitly reports both off-policy and on-policy transfer for smaller models and states that direct teacher-logit distillation was substantially more efficient than reproducing all four post-training stages. ([ar5iv][2])

A defensible reconstruction is

[
\mathcal L_{\mathrm{distill}}
=============================

\lambda_{\mathrm{hard}}
\mathcal L_{\mathrm{CE}}(y,p_S)
+
\lambda_{\mathrm{KL}}T^2
D_{\mathrm{KL}}
\left(
p_T^{(T)}
\Vert
p_S^{(T)}
\right).
]

Off-policy phase:

[
x,y_T\sim\mathcal D_T,\qquad
p_T(\cdot|x,y_{T,<t})\rightarrow p_S.
]

On-policy phase:

[
y_S\sim\pi_S(\cdot|x),
\qquad
p_T(\cdot|x,y_{S,<t})\rightarrow p_S.
]

* Sequence and logit supervision: **[R]**
* Exact temperature (T): **[U]**
* KL direction: **[U]**, although teacher-to-student forward KL is the conventional interpretation.
* Confidence weighting: **[U]**
* Top-(k) logit truncation: **[U]**
* Teacher ensemble composition: **[U]**
* Student-capacity correction: **[U]**

---

# 12. GLM objective evolution

## 12.1 Original GLM and GLM-130B

Original GLM is not simply a GPT-style causal model. It corrupts an input into:

* Part A: visible text containing mask placeholders;
* Part B: masked spans generated autoregressively in a sampled order.

Part A uses bidirectional attention. Part B attends to Part A and preceding Part-B tokens. It adds two-dimensional position encodings to represent both the mask anchor and intra-span position. ([arXiv][13])

GLM-130B uses autoregressive blank infilling as its primary objective and includes a smaller multi-task component. It distinguishes `[MASK]` for short-span infilling and `[gMASK]` for left-to-right generation. ([GitHub][14])

**Critical generation distinction:** GLM-4.5 and GLM-5 reports describe modern causal/MoE pretraining and do not report that the original bidirectional Part-A blank-infilling mask remains the dominant objective. It is therefore invalid to project the GLM-130B attention mask onto GLM-4.5/5.

---

# 13. GLM-4.5 and GLM-5: optimizer step

## 13.1 GLM-4.5 graph

GLM-4.5 has:

* 3 dense layers;
* 89 MoE layers;
* one MoE MTP layer;
* (H=5120);
* 96 Q heads and eight KV heads;
* head dimension 128;
* 160 experts, top-8, one shared expert;
* QK-Norm and partial RoPE. ([ar5iv][10])

Its logical tensors are

[
Q\in\mathbb R^{T\times96\times128},
]

[
K,V\in\mathbb R^{T\times8\times128},
]

[
u_{\mathrm{router}}\in\mathbb R^{T\times160},
]

[
X_e\in\mathbb R^{N_e\times5120},
\qquad
M_e\in\mathbb R^{N_e\times1536}.
]

## 13.2 GLM-5 graph

GLM-5 changes to:

* 78 transformer layers in the released configuration;
* 744B total and 40B active parameters;
* (H=6144);
* 256 experts, top-8, one shared expert;
* MLA with query rank 2048 and KV rank 512;
* DSA indexer;
* parameter-shared MTP training;
* Muon Split for attention matrices. ([arXiv][3])

The paper says GLM-5 “reduces its layer count to 80,” while the architecture table/configuration decomposes the backbone as 3 dense plus 75 MoE transformer layers, with an additional MTP layer. This is a counting-convention discrepancy, not necessarily a weight mismatch.

## 13.3 Muon optimizer

GLM-4.5 uses Muon for all parameters except embeddings, biases, and RMSNorm weights. It reports:

[
\mu=0.95,
\qquad
N_{\mathrm{NS}}=5,
\qquad
\operatorname{RMS}(\Delta W)=0.2.
]

([ar5iv][10])

For a matrix parameter (W):

[
B_t=\mu B_{t-1}+G_t.
]

Muon approximately orthogonalizes the momentum matrix:

[
O_t\approx U V^\top
\quad\text{for}\quad
B_t=U\Sigma V^\top.
]

A Newton–Schulz realization iterates a normalized matrix polynomial rather than explicitly computing the SVD:

[
X_{j+1}
=======

aX_j+bX_jX_j^\top X_j
+cX_jX_j^\top X_jX_j^\top X_j.
]

After RMS scaling:

[
\Delta W_t
==========

0.2,
\frac{O_t}
{\operatorname{RMS}(O_t)+\epsilon},
]

[
W_{t+1}
=======

W_t-\eta_t
(\Delta W_t+\lambda W_t).
]

**[U]** The optimizer used for excluded embeddings, biases, and RMSNorm weights is not identified in the GLM-4.5 report. Assigning AdamW to them would be an unsupported assumption.

### Muon Split in GLM-5

Rather than orthogonalizing a fused multi-head projection matrix as one matrix, GLM-5 partitions Q/K/V projection weights by head and applies orthogonalization independently:

[
W_Q
===

[W_Q^{(1)};\ldots;W_Q^{(n_q)}].
]

[
O_Q^{(h)}
=========

\operatorname{MuonOrth}
(G_Q^{(h)}).
]

This permits head-dependent update scales and was introduced to close an MLA/GQA optimization gap. ([arXiv][3])

## 13.4 GLM-5 physical memory execution

The exact topology degrees are **[U]**, but several runtime states are reported.

### Interleaved PP

Each physical pipeline rank owns multiple virtual stages. MTP embedding/transformer components are placed on the stage before the output stage, while the MTP output projection is colocated with the primary output projection to share parameters and reduce final-stage imbalance. ([arXiv][3])

### Pipeline-aware ZeRO-2 gradient sharding

For stage (s) with (N_s) parameters:

[
M_{G,s}^{\mathrm{persistent}}
=============================

\frac{b_GN_s}{P_{\mathrm{DP}}}.
]

Only two full accumulation buffers are retained:

[
M_G
\approx
\sum_s\frac{b_GN_s}{P_{\mathrm{DP}}}
+
2b_G\max_sN_s.
]

One buffer accumulates the current stage while the previous buffer undergoes reduce-scatter. ([arXiv][3])

### Distributed Muon

Instead of all-gathering every parameter matrix on every DP rank, each rank gathers only the shards needed to construct/update parameters it owns and overlaps communication with local orthogonalization. ([arXiv][3])

### Activation offload

During PP warm-up:

[
A_l^{\mathrm{GPU}}
\xrightarrow{\mathrm{D2H}}
A_l^{\mathrm{CPU}},
]

then before backward:

[
A_l^{\mathrm{CPU}}
\xrightarrow{\mathrm{H2D}}
A_l^{\mathrm{GPU}}.
]

Offload is layer-granular and combined with recomputation. The transfer can be hidden only when

[
T_{\mathrm{compute\ gap}}
\ge
T_{\mathrm{D2H}}+T_{\mathrm{H2D}}.
]

Otherwise the reload becomes an exposed backward dependency.

---

# 14. GLM pretraining

## 14.1 GLM-4.5

The pretraining corpus includes web, social media, books, papers, multilingual data, and code. Web documents are quality-bucketed, semantic deduplication is applied, code is classified by language-specific quality models, and FIM is applied to all source code. ([ar5iv][10])

The sequence schedule is:

[
4096
\rightarrow
32768
\rightarrow
131072.
]

Pretraining uses random truncation rather than best-fit packing. Mid-training uses best-fit packing to preserve reasoning traces and repository-level code. ([ar5iv][10])

The global batch warms from 16M to 64M tokens over the first 500B tokens.

At 4K:

[
B_{\mathrm{seq}}
================

\frac{16{,}777{,}216}{4096}
=4096
]

to

[
B_{\mathrm{seq}}
================

\frac{67{,}108{,}864}{4096}
=16384.
]

The reported learning-rate trajectory is

[
0
\rightarrow
2.5\times10^{-4}
\rightarrow
2.5\times10^{-5}
]

using warm-up followed by cosine decay through mid-training. Weight decay is 0.1 and dropout is zero. ([ar5iv][10])

## 14.2 GLM-5

GLM-5 reports 28.5T total base-model tokens. Mid-training extends context through:

[
32\mathrm K:\ 1\mathrm T\ tokens,
]

[
128\mathrm K:\ 500\mathrm B\ tokens,
]

[
200\mathrm K:\ 50\mathrm B\ tokens.
]

Its issue/PR training data contains approximately 10M issue–PR pairs and 160B unique tokens after filtering. ([arXiv][3])

Learning rate:

[
0\rightarrow2\times10^{-4}
\rightarrow4\times10^{-5}
]

during pretraining, then

[
4\times10^{-5}
\rightarrow10^{-5}
]

during mid-training. DSA warm-up decays from (5\times10^{-3}) to (2\times10^{-4}); sparse adaptation uses (10^{-5}). ([arXiv][3])

**[U]**

* Tokenizer training corpus and tokenizer algorithm.
* Exact sample-boundary attention mask.
* Exact PP/EP/DP/TP degrees.
* Training accelerator count and topology.
* Microbatch size and GAS.
* Precision boundary for Muon and model GEMMs.
* Gradient clipping.
* Checkpoint cadence and format.
* Failure-recovery semantics.

---

# 15. GLM SFT, RL, and distillation

## 15.1 SFT

GLM-4.5 first trains specialist models using cold-start SFT and expert RL, then performs a unified SFT stage to distill their capabilities into one hybrid model. The unified dataset contains millions of reasoning, chat, agent, and long-context examples and supports 128K contexts. ([ar5iv][10])

GLM-5 expands SFT to general chat, reasoning, coding, and agent trajectories and trains at a maximum length of 202,752 tokens. It supports interleaved, preserved, and turn-level thinking. ([arXiv][3])

**[R]** GLM-5 applies INT4 quantization-aware training during SFT and reports a kernel designed to match training and offline quantization behavior bitwise. ([arXiv][3])

**[U]**

* Exact template Jinja for the production training corpus.
* Prompt/assistant loss mask.
* Think-block weighting.
* SFT optimizer and LR.
* Packing isolation.
* Optimizer-state continuation.
* QAT scale granularity, STE definition, and calibration distribution.

## 15.2 Synchronous reasoning RL

GLM-4.5 and GLM-5 build on group-wise policy optimization. GLM-4.5 explicitly excludes the KL term. ([ar5iv][10])

GLM-5 mixed reasoning RL uses binary, domain-specific outcome rewards for math, science, code, and tool-integrated reasoning. ([arXiv][3])

## 15.3 Asynchronous agent RL

The GLM-5 state machine is:

[
\text{rollout workers}
\rightarrow
\text{TITO gateway}
\rightarrow
\text{multi-task orchestrator}
\rightarrow
\text{trajectory queue}
\rightarrow
\text{learner}
\rightarrow
\text{weight publisher}.
]

### Rollout record

For trajectory (i):

[
\tau_i=
(x_i,a_{i,1:T_i},\ell^{\mathrm{beh}}_{i,1:T_i},
r_i,m_i,v_i),
]

where:

* (a_{i,t}): exact generated token ID;
* (\ell^{\mathrm{beh}}_{i,t}): rollout log probability;
* (m_i): generated-token mask;
* (v_i): sequence of policy versions that generated the trace.

TITO avoids decode→text→retokenize drift and preserves action-level correspondence. ([arXiv][3])

### Learner ratio

[
\rho_{i,t}
==========

\exp
\left[
\log\pi_\theta(a_{i,t}|s_{i,t})
-------------------------------

\ell^{\mathrm{beh}}_{i,t}
\right].
]

GLM-5 uses double-sided rejection rather than standard PPO value clipping:

[
m_{i,t}^{\mathrm{IS}}
=====================

\mathbf 1[
1-\epsilon_{\ell}
\le\rho_{i,t}\le
1+\epsilon_h
].
]

Tokens outside the trust interval contribute zero gradient. ([arXiv][3])

### Stale-policy filtering

For current learner version (v_\theta) and oldest rollout version (v_{\min,i}),

[
\text{retain }\tau_i
\iff
v_\theta-v_{\min,i}\le\Delta_{\max}.
]

The threshold (\Delta_{\max}) is **[U]**. Environment-collapse failures are removed; incomplete GRPO groups are padded with valid traces only when more than half the group survives, otherwise the group is dropped. ([arXiv][3])

### Synchronization

Inference and training engines occupy different GPU pools. New weights are periodically pushed to rollout workers. The optimizer is reset after each rollout-engine weight synchronization. ([arXiv][3])

This reset is an important state transition:

[
(\theta_t,m_t,v_t)
\rightarrow
(\theta_t,0,0)
]

at the reported synchronization boundary. It trades optimizer continuity for reduced inconsistency between asynchronous data regimes.

## 15.4 Cross-stage distillation

GLM-5 uses final checkpoints from preceding SFT/RL stages as teachers. Prompts are mixed from the corresponding stage-specific RL datasets. Teacher logits are fetched through the inference engine. Group size is one and batch size is 1024. ([arXiv][3])

A reconstructed token-level objective is

[
A^{\mathrm{distill}}_t
======================

\operatorname{sg}
\left[
\log\pi_T(a_t|s_t)
------------------

\log\pi_S(a_t|s_t)
\right],
]

inserted in place of the GRPO reward advantage.

This is on-policy because trajectories are sampled from the current student, while teacher evaluation supplies the learning signal.

---

# 16. Communication audit

For payload containing (N) elements of (b) bytes:

## 16.1 Collective cost formulas

Ring all-reduce per rank:

[
V_{\mathrm{AR}}
===============

2\frac{P-1}{P}Nb.
]

Reduce-scatter or all-gather per rank:

[
V_{\mathrm{RS}}
===============

# V_{\mathrm{AG}}

\frac{P-1}{P}Nb.
]

Expert all-to-all per rank under balanced routing:

[
V_{\mathrm{A2A}}
\approx
\frac{TkHb}{P_{\mathrm{EP}}}
]

sent and a comparable volume received.

PP send or receive:

[
V_{\mathrm{P2P}}=THb
]

per activation boundary, with the same order for backward gradients.

## 16.2 Collective map

| Collective             | Tensor                          | Dependency edge                | Overlap opportunity                   | Exposed latency condition                  |
| ---------------------- | ------------------------------- | ------------------------------ | ------------------------------------- | ------------------------------------------ |
| EP all-to-all dispatch | routed (h_t), weights, metadata | router → expert GEMM           | attention/other-direction work        | expert GEMM waits for final incoming chunk |
| EP all-to-all combine  | expert outputs                  | expert GEMM → residual         | opposite forward/backward component   | residual waits for incomplete token routes |
| DP reduce-scatter      | accumulated gradients           | final Wgrad → optimizer        | next stage’s Wgrad / double buffering | optimizer owner waits for shard            |
| DP all-gather          | updated parameters              | optimizer → next forward       | prefetch before layer use             | next forward reaches ungathered layer      |
| TP all-reduce          | row-parallel outputs            | local GEMM → residual          | next independent kernel               | residual consumes incomplete reduction     |
| TP all-gather          | sequence/hidden shards          | prior norm → column GEMM       | prefetch                              | GEMM lacks full operand                    |
| PP send/receive        | activations or input gradients  | stage boundary                 | DualPipe/opposite direction           | downstream stage starves                   |
| Broadcast              | scheduler/config/RNG/weights    | control or initialization edge | outside critical path where possible  | all ranks require state before launch      |

### Actual family use

| Technology                   | DeepSeek-V3                          | Qwen3                                                    | GLM-5                                             |
| ---------------------------- | ------------------------------------ | -------------------------------------------------------- | ------------------------------------------------- |
| Expert all-to-all            | **Reported**                         | Necessary for scalable MoE but exact use **undisclosed** | Implied by MoE; topology **undisclosed**          |
| TP collectives               | **Not used in reported V3 topology** | **Undisclosed**                                          | **Undisclosed**                                   |
| PP P2P                       | **Reported, DualPipe**               | **Undisclosed**                                          | **Reported, interleaved PP**                      |
| DP reduce-scatter            | ZeRO-1 does not shard gradients      | **Undisclosed**                                          | **Reported pipeline ZeRO-2-style**                |
| CP communication             | **Not reported**                     | **Undisclosed**                                          | **Undisclosed**                                   |
| Custom communication kernels | **Reported**                         | **Undisclosed**                                          | Muon and RL infrastructure optimizations reported |

DeepSeek reserves SMs for communication and reports that its all-to-all traverses an IB and NVLink hierarchy, including RDMA staging and reduction during combine. ([arXiv][1])

---

# 17. Pipeline schedule audit

## 17.1 1F1B

For (p) balanced stages and (m) microbatches, the idealized fill/drain bubble is

[
T_{\mathrm{bubble}}
===================

2(p-1)t_{\mathrm{stage}}.
]

Total schedule time is approximately

[
T_{\mathrm{1F1B}}
=================

2(m+p-1)t_{\mathrm{stage}}.
]

Thus

[
\beta_{\mathrm{1F1B}}
=====================

\frac{p-1}{m+p-1}.
]

This ignores communication, unequal forward/backward times, and split Wgrad.

## 17.2 Zero-Bubble scheduling

Zero-Bubble methods exploit

[
B=B_x+B_w,
]

where only (B_x) is on the cross-stage dependency path. (B_w) can fill otherwise idle slots.

**DeepSeek-V3 distinction:** it borrows the separation of input-gradient and weight-gradient work but reports DualPipe as the deployed schedule. Zero-Bubble itself is a comparator, not the reported V3 schedule. ([arXiv][1])

## 17.3 DualPipe

DualPipe:

* launches microbatches from both pipeline ends;
* splits attention, dispatch, expert MLP, combine, PP communication, (B_x), and (B_w);
* overlaps forward work in one direction with backward/communication work in the other;
* maintains two parameter copies;
* requires even divisibility of stages and microbatches. ([arXiv][1])

An equal-stage coarse bound replaces the one-direction fill distance (p-1) with approximately (p/2-1):

[
\beta_{\mathrm{DualPipe}}
\gtrsim
\frac{p/2-1}
{m+p/2-1}.
]

This is **[D, low confidence]**, not DeepSeek’s exact table formula, because the true schedule has heterogeneous attention, A2A, MLP, combine, (B_x), and (B_w) durations.

Literal cycle count remains **[U]**.

## 17.4 Virtual/interleaved pipeline

For (v) virtual stages per physical rank, each physical stage executes smaller layer chunks. The nominal imbalance changes from

[
\Delta_{\mathrm{stage}}
=======================

\max_p C_p-\frac{1}{P_{\mathrm{PP}}}\sum_p C_p
]

to a finer bin-packing problem over (vP_{\mathrm{PP}}) chunks.

The cost is:

* more PP messages;
* longer activation lifetimes;
* larger schedule metadata;
* possible improved compute balance.

**GLM-5 [R]:** interleaved PP is deployed, with MTP components explicitly redistributed to reduce stage imbalance. ([arXiv][3])

## 17.5 ZeRO/FSDP and distributed checkpointing

| Method                             | DeepSeek-V3  | Qwen3       | GLM-5                            |
| ---------------------------------- | ------------ | ----------- | -------------------------------- |
| ZeRO-1                             | Reported     | Undisclosed | Not the reported gradient scheme |
| ZeRO-2-style gradients             | No           | Undisclosed | Reported                         |
| FSDP full parameter sharding       | Not reported | Undisclosed | Not reported                     |
| Distributed Muon optimizer         | N/A          | Undisclosed | Reported                         |
| Distributed checkpoint format      | Undisclosed  | Undisclosed | Undisclosed                      |
| Async checkpoint I/O               | Undisclosed  | Undisclosed | Undisclosed                      |
| Optimizer-state reshard on restart | Undisclosed  | Undisclosed | Undisclosed                      |

Compatibility is not evidence of deployment.

---

# 18. Four-stage pseudo-algorithm

## Algorithm 1 — Pretraining optimizer transition

**Input:** packed samples (\mathcal B), parameters (\theta_t), optimizer state (\Omega_t), rank coordinates (r).
**Output:** ((\theta_{t+1},\Omega_{t+1})).

| Step | Operation                                                                                                                                           |
| ---: | --------------------------------------------------------------------------------------------------------------------------------------------------- |
|    1 | Select the family/generation curriculum stage and sequence length (S_t).                                                                            |
|    2 | Draw documents using the source-specific mixture and curriculum weights.                                                                            |
|    3 | Apply tokenizer; DeepSeek optionally applies PSM FIM; GLM-4.5 applies FIM to source code; Qwen3 uses causal sequences.                              |
|    4 | Pack/truncate samples according to the reported family policy; construct position IDs, document IDs, and attention mask.                            |
|    5 | Partition tokens over DP/CP source ranks; initialize loss numerator (L=0), denominator (N=0).                                                       |
|    6 | For each accumulated microbatch, execute embedding and PP send.                                                                                     |
|    7 | For each local layer, recompute or load pre-norm inputs and execute RMSNorm.                                                                        |
|    8 | Construct MLA, GQA, or historical GLM infilling attention state according to that exact generation.                                                 |
|    9 | Apply RoPE/partial RoPE, QK-Norm where reported, causal or infilling mask, softmax, value aggregation, and output projection.                       |
|   10 | Add attention residual.                                                                                                                             |
|   11 | For dense FFN, execute SwiGLU; for MoE, compute router logits, top-(k), permutation, EP dispatch, grouped expert GEMMs, combine, and shared expert. |
|   12 | Add FFN/MoE residual.                                                                                                                               |
|   13 | Execute primary vocabulary head and generation-specific auxiliary heads: DeepSeek MTP or GLM MTP.                                                   |
|   14 | Accumulate masked CE, MTP, and reported balance losses in FP32.                                                                                     |
|   15 | Backpropagate CE and auxiliary losses.                                                                                                              |
|   16 | Execute output/head, MoE, attention, norm, and embedding backward; recompute activations according to the family policy.                            |
|   17 | Accumulate gradients over microbatches; overlap EP, PP, and DP communication where the reported schedule allows.                                    |
|   18 | Synchronize gradients using the reported DP strategy: DeepSeek ZeRO-1 or GLM-5 pipeline ZeRO-2-style; Qwen unspecified.                             |
|   19 | Detect non-finite gradients **only if implemented; public overflow policy is undisclosed**.                                                         |
|   20 | Apply reported global clipping; DeepSeek uses norm 1.0, Qwen/GLM values undisclosed.                                                                |
|   21 | Update balancing bias counters independently of autograd for loss-free routing.                                                                     |
|   22 | Run AdamW, Muon/Muon Split, or undisclosed optimizer on owner ranks.                                                                                |
|   23 | Gather/broadcast updated parameter shards required by the next forward pass.                                                                        |
|   24 | Advance LR, batch-size, data-mixture, RNG, and checkpoint counters atomically.                                                                      |

## Algorithm 2 — Supervised fine-tuning

**Input:** base checkpoint (\theta_0), conversations/trajectories (\mathcal D_{\mathrm{SFT}}).
**Output:** SFT checkpoint (\theta_{\mathrm{SFT}}).

| Step | Operation                                                                                                                                |                        |
| ---: | ---------------------------------------------------------------------------------------------------------------------------------------- | ---------------------- |
|    1 | Generate or collect candidate prompts and responses.                                                                                     |                        |
|    2 | Apply family-specific verification: execution tests, answer checking, reward-model scoring, human review, or rejection sampling.         |                        |
|    3 | Construct role/control tokens using the generation-specific chat template.                                                               |                        |
|    4 | For Qwen3, inject thinking/non-thinking control and preserve an empty think block for non-thinking samples.                              |                        |
|    5 | For DeepSeek-R1, construct reasoning and summary regions.                                                                                |                        |
|    6 | For GLM-5, preserve interleaved thinking and tool-action boundaries.                                                                     |                        |
|    7 | Tokenize once and retain exact token boundaries.                                                                                         |                        |
|    8 | Construct labels (y_t=x_{t+1}).                                                                                                          |                        |
|    9 | Apply response/tool/generated-token masks only where the training recipe specifies them; otherwise mark masking policy undisclosed.      |                        |
|   10 | Pack samples while enforcing reported isolation boundaries.                                                                              |                        |
|   11 | Compute weighted masked CE: (\mathcal L=-\sum_tw_tm_t\log p_\theta(y_t                                                                   | x_{<t})/\sum_tw_tm_t). |
|   12 | Backpropagate, synchronize, clip, and update using disclosed or explicitly unknown hyperparameters.                                      |                        |
|   13 | Interleave reasoning/general/agent data to reduce catastrophic forgetting.                                                               |                        |
|   14 | Validate both target capabilities and regressions against base-model benchmarks.                                                         |                        |
|   15 | Persist template version, tokenizer hash, mixture state, and optimizer state; actual production checkpoint metadata remains undisclosed. |                        |

## Algorithm 3 — Reinforcement learning

**Input:** actor (\pi_\theta), optional reference (\pi_{\rm ref}), prompt/verifier distribution (\mathcal Q).
**Output:** updated actor.

| Step | Operation                                                                                                             |
| ---: | --------------------------------------------------------------------------------------------------------------------- |
|    1 | Sample prompts stratified by domain and difficulty.                                                                   |
|    2 | Snapshot or identify actor version (v).                                                                               |
|    3 | Generate (G) rollouts with token IDs, generated-token mask, token log probabilities, stop reason, and policy version. |
|    4 | Execute verifiers, code tests, environments, rule rewards, ORMs, or GRMs.                                             |
|    5 | Remove environment failures, malformed traces, and unverifiable samples.                                              |
|    6 | For synchronous GRPO, normalize rewards within each prompt group.                                                     |
|    7 | For asynchronous GLM-5, reject stale trajectories and tokens with out-of-range importance ratios.                     |
|    8 | Compute current-policy token log probabilities without retokenizing GLM-5 TITO trajectories.                          |
|    9 | Form clipped group-policy loss; include KL only where reported.                                                       |
|   10 | Mask environment/tool feedback tokens from policy loss where reported.                                                |
|   11 | Accumulate gradients across prompts and rollout groups.                                                               |
|   12 | Synchronize learner gradients and update actor parameters.                                                            |
|   13 | Publish new actor weights to rollout workers at the configured cadence.                                               |
|   14 | Reset optimizer at GLM-5’s reported asynchronous synchronization boundary.                                            |
|   15 | Update curriculum based on reward variance, pass rate, entropy, and domain coverage.                                  |
|   16 | Gate checkpoints on held-out verifier sets and general-capability regression suites.                                  |

## Algorithm 4 — Distillation

**Input:** teachers ({\pi_{T_j}}), student (\pi_S), prompt distribution (\mathcal Q).
**Output:** distilled student.

| Step | Operation                                                                                                                                |
| ---: | ---------------------------------------------------------------------------------------------------------------------------------------- |
|    1 | Sample prompts by capability and target student capacity.                                                                                |
|    2 | For sequence distillation, generate multiple teacher traces.                                                                             |
|    3 | Verify answers, code, formatting, language consistency, and contamination risk.                                                          |
|    4 | Reject incorrect, repetitive, guessed, inconsistent, or malformed traces.                                                                |
|    5 | For off-policy logit distillation, run the teacher on teacher-generated prefixes.                                                        |
|    6 | For on-policy distillation, sample student trajectories and query teachers on student prefixes.                                          |
|    7 | Store teacher logits or a compressed distribution only where the implementation supports it.                                             |
|    8 | Compute hard CE and/or (T^2D_{\mathrm{KL}}(p_T^{(T)}\Vert p_S^{(T)})).                                                                   |
|    9 | For GLM-5, replace the group advantage with stop-gradient teacher–student log-probability gap.                                           |
|   10 | Weight domains, sequence positions, and teachers; all exact weighting rules are undisclosed unless explicitly reported.                  |
|   11 | Backpropagate through the student only.                                                                                                  |
|   12 | Evaluate capability transfer, calibration, response length, diversity, and regression.                                                   |
|   13 | Increase curriculum difficulty only while the student maintains non-degenerate entropy and verifier pass rate.                           |
|   14 | Stop or reduce teacher pressure when capacity mismatch causes mode collapse, imitation plateaus, or excessive sequence-length inflation. |

---

# 19. Evidence matrices

## 19.1 DeepSeek

| Mechanism               | Version | Exact source location   | Verified behaviour                                    | Derived implication                                    | Missing disclosure          | Confidence  |
| ----------------------- | ------- | ----------------------- | ----------------------------------------------------- | ------------------------------------------------------ | --------------------------- | ----------- |
| MLA                     | V2/V3   | V3 report §2.1          | Query/KV low-rank compression, decoupled RoPE         | Lower KV state and different backward graph from GQA   | Kernel tiling               | High        |
| DeepSeekMoE             | V3      | §2.1, §4.2              | 256 routed, top-8, shared expert                      | Four experts/rank if evenly partitioned over EP64      | Expert mapping              | High        |
| Loss-free routing       | V3      | §2.1, §4.2              | Bias-controlled sigmoid routing                       | Bias update outside autograd                           | Exact counter reduction     | High        |
| MTP                     | V3      | §2.2                    | Depth one, shared head/embedding                      | Additional CE branch and backward dependencies         | Exact placement metadata    | High        |
| FP8 training            | V3      | §3.3                    | FP8 Fprop/Dgrad/Wgrad; higher-precision sensitive ops | Activation storage and A2A can be FP8                  | Overflow protocol           | High        |
| DualPipe                | V3      | §3.2.1                  | Bidirectional PP and comm/compute overlap             | Shorter fill distance than 1F1B                        | Runtime event trace         | High        |
| Topology                | V3      | §3.1–3.2                | 2048 H800, PP16, EP64, ZeRO-1, TP1                    | DP2 under orthogonal groups                            | Process-group map           | Medium-high |
| GRPO                    | R1      | §2.2–2.3                | Group baseline, no critic                             | No critic memory replica                               | Group size and clipping     | High        |
| Sequence distillation   | R1      | §2.4                    | 800K curated traces fine-tune Qwen/Llama students     | Hard-target distillation                               | Teacher logits/temperature  | High        |
| DSA                     | V3.2    | official release/report | Sparse attention continued from V3.x                  | New indexer state and routing consistency requirements | Full optimizer topology     | Medium      |
| Token compression + DSA | V4      | official release        | 1M context; Pro and Flash variants                    | Different attention-state graph from V3                | Detailed audit of V4 report | Medium      |

## 19.2 Qwen

| Mechanism                   | Version | Source                  | Verified behaviour                            | Derived implication                            | Missing disclosure          | Confidence  |
| --------------------------- | ------- | ----------------------- | --------------------------------------------- | ---------------------------------------------- | --------------------------- | ----------- |
| GQA                         | Qwen2/3 | Qwen2 and Qwen3 reports | 64 Q / 4 KV in flagship Qwen3                 | 16 Q heads share each KV head                  | Training kernel             | High        |
| QK-Norm                     | Qwen3   | §2                      | Added; QKV bias removed                       | Additional norm backward on Q/K                | Norm precision              | High        |
| Fine-grained MoE            | Qwen2/3 | §2 and config           | 128 experts, top-8, no shared expert in Qwen3 | Expert A2A state required                      | EP degree                   | High        |
| Global-batch balance        | Qwen3   | §2/config               | Auxiliary router loss                         | Cross-DP load statistics may require reduction | Exact reduction scope       | Medium-high |
| Three-stage pretraining     | Qwen3   | §3.2                    | 30T+5T+long-context                           | Curriculum and LR state transitions            | Optimizer/batch             | High        |
| Thinking fusion             | Qwen3   | §4.3                    | `/think`, `/no_think`, empty think block      | Template becomes model control protocol        | Sampling proportions        | High        |
| GRPO                        | Qwen3   | §4.2                    | 3995 verifier pairs; 170 updates              | RL is narrow but rollout-heavy                 | Full objective constants    | High        |
| Strong-to-weak distillation | Qwen3   | §4                      | Sequence/logit, off-/on-policy                | Smaller models avoid full RL pipeline          | KL temperature/weights      | Medium-high |
| Physical topology           | Qwen3   | —                       | None                                          | Cannot reconstruct ownership ranks             | All degrees and collectives | Undisclosed |

## 19.3 GLM

| Mechanism                      | Version  | Source                          | Verified behaviour                               | Derived implication                                          | Missing disclosure                  | Confidence  |
| ------------------------------ | -------- | ------------------------------- | ------------------------------------------------ | ------------------------------------------------------------ | ----------------------------------- | ----------- |
| Autoregressive blank infilling | GLM/130B | GLM paper, GLM-130B report/repo | Bidirectional Part A, AR Part B                  | Nonstandard mask and 2D positions                            | Later-generation continuity         | High        |
| GQA + partial RoPE             | GLM-4.5  | §2.1                            | 96 Q, 8 KV, QK-Norm                              | 12 Q heads per KV head                                       | Kernel                              | High        |
| MLA + DSA                      | GLM-5    | §2.1/config                     | 2048/512 latent ranks; top-2048 indexer          | Sparse index state dominates RL consistency                  | Exact sparse kernel                 | High        |
| Muon                           | GLM-4.5  | §2.4                            | NS=5, momentum .95, RMS .2                       | Non-Adam matrix update path                                  | Optimizer for exclusions            | High        |
| Muon Split                     | GLM-5    | §2.1                            | Per-head orthogonalization                       | Head-specific update scales                                  | Distributed implementation details  | High        |
| Interleaved PP                 | GLM-5    | §2.4                            | Virtual stages and flexible MTP placement        | Better stage balance, more P2P events                        | PP degree                           | High        |
| Pipeline ZeRO-2                | GLM-5    | §2.4                            | Sharded persistent gradients, two full buffers   | Bounded full-gradient memory                                 | DP degree                           | High        |
| Activation offload             | GLM-5    | §2.4                            | Layer-granular CPU offload                       | PCIe/NVLink-host transfer enters critical path if not hidden | Hardware topology                   | High        |
| Asynchronous RL                | GLM-5    | §3.6, §4.1                      | Separate engines, TITO, version filtering        | Explicit off-policy state machine                            | Sync period and staleness threshold | High        |
| Cross-stage distillation       | GLM-5    | §3.5                            | On-policy, group one, batch 1024, teacher logits | No group reward baseline required                            | Teacher mixture weights             | High        |
| Full training topology         | GLM-5    | —                               | Not published                                    | Physical rank ownership cannot be fixed                      | PP/EP/TP/DP degrees                 | Undisclosed |

---

# 20. Final technical verdict

**[R] DeepSeek-V3 is the only audited system among these three families for which the public record supports a near-complete pretraining execution topology:** 2048 H800s, PP16, EP64, ZeRO-1, no TP, custom hierarchical all-to-all, DualPipe, FP8 linear kernels, activation recomputation, MTP, and explicit batch/context schedules.

**[R] Qwen3 exposes the learning algorithm but not the machine:** its logical transformer/MoE state graph, 36T-token curriculum, thinking-mode SFT, GRPO, and strong-to-weak distillation are reconstructable; device ownership, optimizer state, scheduling, and collective traffic are not.

**[R] GLM-5 exposes the most sophisticated recent memory and RL state machine:** interleaved PP, pipeline-aware ZeRO-2 gradient buffers, activation offload, distributed Muon, DSA routing consistency, asynchronous actor–learner separation, TITO, stale-policy rejection, DP-aware rollout routing, and cross-stage distillation. Its numeric model-parallel topology remains undisclosed.

**[U] No source supports a fully numerical value for**

[
M_{\mathrm{rank}}
]

for Qwen3 or GLM-5, or an exact DeepSeek-V3 peak, because microbatch size, activation residency, allocator fragmentation, temporary kernel workspaces, rank-to-layer mapping, and several state dtypes are missing. Any report presenting exact per-rank GiB values without those inputs is simulation or speculation, not reconstruction.

[1]: https://arxiv.org/html/2412.19437 "https://arxiv.org/html/2412.19437"
[2]: https://ar5iv.org/html/2505.09388v1 "https://ar5iv.org/html/2505.09388v1"
[3]: https://arxiv.org/html/2602.15763 "https://arxiv.org/html/2602.15763"
[4]: https://api-docs.deepseek.com/news/news250821/ "https://api-docs.deepseek.com/news/news250821/"
[5]: https://api-docs.deepseek.com/news/news251201 "https://api-docs.deepseek.com/news/news251201"
[6]: https://api-docs.deepseek.com/news/news260424/ "https://api-docs.deepseek.com/news/news260424/"
[7]: https://arxiv.org/abs/2406.12793 "https://arxiv.org/abs/2406.12793"
[8]: https://huggingface.co/Qwen/Qwen3-235B-A22B/blob/main/config.json "https://huggingface.co/Qwen/Qwen3-235B-A22B/blob/main/config.json"
[9]: https://huggingface.co/zai-org/GLM-5/blob/main/config.json "https://huggingface.co/zai-org/GLM-5/blob/main/config.json"
[10]: https://ar5iv.labs.arxiv.org/html/2508.06471 "https://ar5iv.labs.arxiv.org/html/2508.06471"
[11]: https://arxiv.org/html/2501.12948 "https://arxiv.org/html/2501.12948"
[12]: https://arxiv.org/html/2407.10671 "https://arxiv.org/html/2407.10671"
[13]: https://arxiv.org/abs/2103.10360 "https://arxiv.org/abs/2103.10360"
[14]: https://github.com/zai-org/GLM-130B "https://github.com/zai-org/GLM-130B"
