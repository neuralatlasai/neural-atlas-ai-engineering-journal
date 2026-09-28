# DeepSeek-V4.1-Flash: Technical Report Reconstruction

## 0. System Objective

Long-horizon agent workloads change the serving regime from predominantly decode-centric inference toward **input-heavy repeated prefill, persistent prefix reuse, and large-context state movement**. The dominant deployment costs therefore become

$$
\boxed{
\mathcal C_{\mathrm{serve}}
=
\mathcal C_{\mathrm{prefill}}
+
\mathcal C_{\mathrm{decode}}
+
M_{\mathrm{HBM,KV}}
+
M_{\mathrm{persistent,KV}}
+
\mathcal C_{\mathrm{KV\ I/O}}
}
$$

where global KV dominates runtime memory for sufficiently long sequences, persistent KV consumes SSD/host-memory capacity, and cache migration is constrained by I/O and interconnect bandwidth. 

DeepSeek-V4.1-Flash targets these quantities jointly rather than optimizing attention FLOPs alone:

$$
\boxed{
\begin{aligned}
\text{Prefill compute}
&\rightarrow \text{CED},\\
\text{layer-wise KV duplication}
&\rightarrow \text{CSA2},\\
\text{index-search cost}
&\rightarrow \text{Hierarchical Sparse Indexer},\\
\text{KV element size}
&\rightarrow \text{FP4 main KV},\\
\text{persistent SWA storage}
&\rightarrow \text{SWA Bounded Replay},\\
\text{residual memory traffic}
&\rightarrow \text{Single-Pass mHC},\\
\text{decode throughput}
&\rightarrow \text{DSpark}.
\end{aligned}}
$$

The released model contains **552B backbone parameters**, an additional **196B Engram conditional-memory parameters**, supports **1M-token context**, activates approximately **8B parameters/token during prefill** and **16B/token during decode**, stores global KV at **890 bytes/token**, and reduces persistent KV to approximately \(1/8\) of DeepSeek-V4-Flash. 

---

# 1. End-to-End Architecture

The language backbone contains

$$
\boxed{
L=40,\qquad
d_{\mathrm{model}}=5120
}
$$

split into

$$
\boxed{
20\ \text{causal-encoder layers}
+
20\ \text{decoder layers}.
}
$$

Every Transformer block contains an MoE feed-forward layer. The first two encoder layers use pure Sliding-Window Attention; the remaining backbone uses CSA2. Images are transformed by a vision encoder and MLP projector, converted into visual embeddings, inserted into the token sequence, and jointly processed with text embeddings. 

The high-level graph is

$$
\boxed{
\begin{array}{c}
I
\rightarrow
\mathrm{DeepSeek\!-\!ViT}
\rightarrow
\mathrm{PixelUnshuffle}_{3\times3}
\rightarrow
\mathrm{MLP}
\rightarrow
E_{\mathrm{vision}}
\\[1mm]
X
\rightarrow
E_{\mathrm{text}}
\\
\downarrow
\\
[E_{\mathrm{text}};E_{\mathrm{vision}}]
\rightarrow
\mathrm{Encoder}_{20}
\rightarrow
H_{20}
\rightarrow
\mathrm{Decoder}_{20}
\rightarrow
\mathrm{LM\ Head}.
\end{array}}
$$

The principal language-model configuration is

$$
\begin{aligned}
H_q &=64, &
d_h &=512, &
d_{Q,\mathrm{comp}} &=1280,\\
H_I &=32, &
d_I &=128, &
K_{\mathrm{attn}} &=512,\\
W_{\mathrm{SWA}}&=128, &
n_{\mathrm{mHC}}&=4, &
N_{\mathrm{Sinkhorn}}&=20.
\end{aligned}
$$

Each MoE layer contains

$$
\boxed{
384\ \text{routed experts}
+
1\ \text{shared expert},
\qquad
K_E=6
}
$$

with expert intermediate dimension \(2304\), SwiGLU activation, and activation clamping at 10. 

---

# 2. Native Multimodal Pathway

For image \(I\),

$$
I
\rightarrow
F_{\mathrm{ViT}}
\in
\mathbb R^{H'\times W'\times d_v}.
$$

A \(3\times3\) pixel-unshuffle maps each spatial neighborhood into channels,

$$
\operatorname{PU}_{3\times3}:
\mathbb R^{H'\times W'\times d_v}
\rightarrow
\mathbb R^{\frac{H'}3\times\frac{W'}3\times9d_v},
$$

reducing visual-token count by

$$
\boxed{9\times}.
$$

The resulting representations are projected to the language hidden dimension:

$$
E_{\mathrm{vision}}
=
\operatorname{MLP}
\left(
\operatorname{PU}_{3\times3}
(F_{\mathrm{ViT}}(I))
\right)
\in\mathbb R^{T_v\times5120}.
$$

DeepSeek-ViT uses 32 layers, hidden dimension 1024, 16 attention heads and patch size 14. It replaces absolute positional embeddings with **2D-RoPE**, convolutional patch embedding with a linear projection, and uses RMSNorm and SwiGLU. The resulting image pathway supports resolutions up to approximately \(1344\times1344\).  

### Modality-specific MoE balancing

Text and visual tokens maintain independent expert-load correction biases:

$$
b_e^{(\mathrm{text})},
\qquad
b_e^{(\mathrm{image})}.
$$

The bias associated with the current token modality affects expert **selection**, whereas the original router score determines expert-output weighting. Each bias population is updated independently from modality-specific expert loads. 

Thus

$$
\boxed{
\text{routing load balance}
\neq
\text{shared text-image load statistics}.
}
$$

---

# 3. Causal Encoder–Decoder

## 3.1 Prefill bottleneck

Conventional \(L\)-layer autoregressive prefill applies all layers to every prompt token:

$$
\mathcal C_{\mathrm{prefill}}
=
O(NL).
$$

CED partitions the model into a lower causal encoder and upper decoder.

For decoder layer

$$
l>\frac L2,
$$

global KV is **not generated from \(H_l\)**. Instead:

$$
\boxed{
C_l
=
H_{L/2}W_l^{KV},
\qquad
Z_l
=
H_{L/2}W_l^{Z}.
}
\tag{1}
$$

\(C_l\) denotes decoder global-KV entries and \(Z_l\) their compression weights. Therefore most prompt tokens only need full Transformer execution through the encoder. 

SWA is different. Local KV remains layer-specific:

$$
K_l^{\mathrm{SWA}},V_l^{\mathrm{SWA}}
=
f_l(H_l),
$$

so decoder SWA state cannot be projected directly from \(H_{L/2}\).

Consequently,

$$
\boxed{
\mathcal C_{\mathrm{CED}}
=
O\left(
\frac{NL}{2}
+
\frac{n_{\mathrm{win}}L}{2}
\right)
}
$$

and for

$$
N\gg n_{\mathrm{win}},
$$

$$
\boxed{
\mathcal C_{\mathrm{CED}}
\approx
O\left(\frac{NL}{2}\right).
}
$$

The architecture therefore separates

$$
\boxed{
\text{global-context construction depth}
\neq
\text{prompt-token transformation depth}.
}
$$

The remaining decoder SWA dependency becomes the motivation for bounded replay. 

---

# 4. Compressed Sparse Attention 2

Long-context KV cost factorizes conceptually as

$$
\boxed{
M_{\mathrm{KV}}
\propto
S_{\mathrm{entry}}
\times
N_{\mathrm{entries}}
\times
L_{\mathrm{materialized}}.
}
$$

These correspond respectively to compression over:

$$
\boxed{
\text{representation dimension}
\times
\text{sequence dimension}
\times
\text{layer dimension}.
}
$$

CSA2 explicitly introduces cross-layer compression while retaining sequence compression and low-precision representation. 

## 4.1 CSA → CSA2 compressor simplification

For compression ratio \(m\), original CSA forms one compressed KV entry from \(2m\) overlapping source positions and includes absolute positional information inside the compressor.

CSA2 changes this path:

$$
\boxed{
\begin{array}{l}
\text{remove overlapping source blocks},\\
\text{remove compressor absolute-position embedding},\\
K_{\mathrm{index}}
\leftarrow
\text{projection from main KV}.
\end{array}}
$$

A separate hidden-state-to-indexer-K compression path is therefore unnecessary. 

---

# 5. Cross-Layer KV and Index Reuse

CSA2 defines three static layer modes.

## Full Mode

$$
\boxed{
\begin{aligned}
KV_l &=f_{KV}(H_l),\\
K_l^I&=f_I(KV_l),\\
Q_l^I&=g_I(H_l),\\
\mathcal I_l
&=
\operatorname{TopK}
\left(
Q_l^I(K_l^I)^\top
\right).
\end{aligned}}
$$

The layer computes new global KV, indexer K, indexer Q and Top-K selection.

## Reindex Mode

$$
\boxed{
KV_l
=
KV_{l^\star},
\qquad
K_l^I=K_{l^\star}^I
}
$$

but

$$
Q_l^I=g_l^I(H_l)
$$

and therefore

$$
\boxed{
\mathcal I_l
=
\operatorname{TopK}
\left(
Q_l^I(K_{l^\star}^I)^\top
\right).
}
$$

Representation is reused while sparse selection changes.

## Reuse Mode

$$
\boxed{
KV_l=KV_{l^\star},
\qquad
K_l^I=K_{l^\star}^I,
\qquad
\mathcal I_l=\mathcal I_{l'}
}
$$

so neither new global KV nor new index scoring is required.

Every mode still computes its own:

$$
\boxed{
Q_l^{\mathrm{main}}
\quad\text{and}\quad
KV_l^{\mathrm{SWA}}.
}
$$

Therefore CSA2 explicitly decouples

$$
\boxed{
\text{KV representation sharing}
\quad\perp\quad
\text{sparse-selection sharing}.
}
$$

 

---

# 6. Exact CSA2 Layer Schedule

### Encoder

The first two layers use SWA only.

The remaining 18 layers use compression

$$
m_{\mathrm{enc}}=2
$$

and are partitioned into three six-layer groups:

$$
\boxed{
[\mathrm{Full},
\mathrm{Reuse},
\mathrm{Reuse},
\mathrm{Reuse},
\mathrm{Reuse},
\mathrm{Reuse}]
\times3.
}
$$

### Decoder

All 20 decoder layers use

$$
m_{\mathrm{dec}}=1.
$$

First four-layer group:

$$
\boxed{
[\mathrm{Full},\mathrm{Reuse},\mathrm{Reuse},\mathrm{Reuse}].
}
$$

Remaining four groups:

$$
\boxed{
[\mathrm{Reindex},\mathrm{Reuse},\mathrm{Reuse},\mathrm{Reuse}]
\times4.
}
$$

Hence only a minority of layers materialize global KV or execute fresh sparse retrieval. 

---

# 7. Hierarchical Sparse Indexer

Cross-layer reuse decreases the number of indexer executions, but an ordinary surviving indexer still scans a causally visible context of length \(N\):

$$
C_{\mathrm{index}}
=
O(N).
$$

The decoder therefore introduces a hierarchical search.

The first Full-mode decoder indexer executes over the complete history:

$$
s_{t,j}
=
f(Q_t^I,K_j^I),
\qquad
j=1,\ldots,t,
$$

and selects

$$
\operatorname{Top512}(s_t).
$$

It additionally partitions positions into blocks of eight and assigns block \(b\)

$$
S_b
=
\max_{j\in b}s_{t,j}.
$$

Up to 2,048 blocks are retained:

$$
\boxed{
2048\times8
=
16\,384
}
$$

candidate positions.

Subsequent Reindex layers search only this candidate set:

$$
\mathcal C_t
\subseteq\{1,\ldots,t\},
\qquad
|\mathcal C_t|\le16\,384,
$$

then produce their own

$$
\operatorname{Top512}_{j\in\mathcal C_t}.
$$

Thus

$$
\boxed{
C_{\mathrm{first}}
=
O(N),
\qquad
C_{\mathrm{later}}
=
O(16\,384)
}
$$

for fixed candidate capacity.

The first Full layer **still performs a full-context scan**. Hierarchical indexing therefore does not make the entire indexing stack \(O(1)\) with context length; it bounds later Reindex operations. 

The candidate restriction is training-aware and applied consistently in training and inference. 

---

# 8. Single-Pass mHC

Original mHC maintains

$$
X_l\in\mathbb R^{n\times d}
$$

with

$$
\boxed{
X_{l+1}
=
B_lX_l+
C_lF_l(A_lX_l),
\qquad
(A_l,B_l,C_l)=\mathcal H(X_l).
}
\tag{2}
$$

The V4 implementation decomposes this dependency into:

$$
X_l
=
B_{l-1}X_{l-1}
+
C_{l-1}Y_{l-1},
\tag{3}
$$

$$
(A_l,B_l,C_l)=\mathcal H(X_l),
\tag{4}
$$

$$
\widehat X_l=A_lX_l.
\tag{5}
$$

Because \(A_l\) is unavailable until \(\mathcal H(X_l)\) finishes its reduction, input mixing requires another traversal of \(X_l\).

The theoretical activation-traffic lower bound is

$$
\boxed{
(2n+2)d.
}
$$

The original implementation incurs

$$
\boxed{
(4n+4)d.
}
$$

Single-Pass mHC shifts input mixing one block backward:

$$
\boxed{
X_{l+1}
=
B_lX_l+
C_lF_l(A_{l-1}X_l),
\qquad
(A_l,B_l,C_l)=\mathcal H(X_l).
}
\tag{6}
$$

Now \(A_{l-1}\) already exists when \(X_l\) is traversed. Input mixing and coefficient prediction can consume the same tiles.

Mega-mHC therefore reaches

$$
\boxed{
(2n+2)d
}
$$

reads/writes for Single-Pass mHC versus

$$
(3n+2)d
$$

for fused conventional mHC and

$$
(4n+4)d
$$

for the earlier implementation.  

---

# 9. Engram Conditional Memory

Engram adds a sparsely accessed memory axis distinct from MoE conditional compute and sparse attention.

The configuration allocates

$$
\boxed{
196\mathrm{B}
}
$$

parameters across two Engram modules.

Each uses

$$
N\text{-gram orders}=\{2,3,4\},
$$

with eight hash heads and total embedding dimension 2048 per order. Each head addresses approximately 16M entries, with distinct-prime table sizes. 

The conceptual retrieval is

$$
g_h(x_{t-n+1:t})
\rightarrow
\operatorname{Hash}_h
\rightarrow
E_h[\operatorname{index}]
\rightarrow
\text{context-aware gate}
\rightarrow
H_t.
$$

Two changes relative to the original Engram design are reported:

$$
\boxed{
\begin{array}{l}
\text{short causal convolution removed},\\
\text{embedding optimization changed to momentum + Sinkhorn balancing}.
\end{array}}
$$

The modules are positioned at zero-indexed layers 1 and 14. Embeddings and KV projections use FP8. Deterministic addressing allows host-resident embeddings to be prefetched through background RDMA transfers. 

---

# 10. DSpark Speculative Decoding

DSpark replaces joint-pretraining MTP as the serving-time speculative mechanism.

Its drafter contains

$$
\boxed{
3\ \text{Transformer blocks},
\qquad
W=128.
}
$$

A single pass generates base logits for

$$
\boxed{5}
$$

draft positions simultaneously.

A lightweight Markov head models dependencies among proposed tokens. A confidence head predicts conditional acceptance probabilities

$$
p_i
=
P(\text{draft}_i\ \text{accepted}
\mid
\text{accepted prefix}),
$$

from which prefix survival can be estimated:

$$
P_{\mathrm{survive}}(m)
\approx
\prod_{i=1}^{m}p_i.
$$

The scheduler combines these estimates with measured engine-throughput profiles and dynamically selects verification length to maximize expected system-wide token throughput under current load. 

DSpark is **not jointly trained with backbone pretraining**:

$$
\boxed{
\text{Backbone pretraining}
\rightarrow
\text{freeze backbone}
\rightarrow
\text{train DSpark}.
}
$$

During post-training, DSpark continues to train alongside the evolving backbone, but DSpark-objective gradients are not propagated into the backbone. This maintains drafter-policy alignment for serving and RL/OPD rollout generation. 

---

# 11. FP4 Main KV Cache

Main global KV uses quantization-aware training.

The selected format is approximately NVFP4-style

$$
\boxed{
\mathrm{E2M1}
+
\mathrm{E4M3\ scale/16\ channels}
}
$$

without the second global scale.

The representable magnitude is reported as

$$
448\times6=2688.
$$

For the normalized 512-dimensional KV latent,

$$
\|c\|_2
\lesssim
\sqrt{512}
\approx22.6,
$$

and the maximum magnitude observed in training is approximately 10. Hence the omitted global scale is unnecessary for the observed dynamic range. 

Quantization occurs

$$
\boxed{\text{after RoPE}}
$$

rather than before it.

Main KV:

$$
\mathrm{FP4}.
$$

SWA KV:

$$
\boxed{\mathrm{FP8}}
$$

because the local cache is reported to be more sensitive to quantization.

Relative to V4's FP8 main KV, FP4 approximately halves main-KV storage in both HBM and offloaded storage. 

---

# 12. Optimization

Three optimizer families are partitioned by parameter structure.

$$
\boxed{
\begin{array}{c|c}
\text{Parameters} & \text{Optimizer/update}\\ \hline
\text{linear matrices} & \text{Muon}\\
Q/K\ \text{matrices} & \text{head-wise Muon}\\
\text{RMSNorm + non-matrix params} & \text{AdamW}\\
\text{Engram/embedding/LM head} & \text{Sinkhorn-balanced momentum}
\end{array}}
$$

Head-wise Muon gives each attention head its own matrix preconditioner instead of sharing one across the complete projection. 

### Sinkhorn-balanced update

Momentum:

$$
M_t
=
\beta M_{t-1}
+
(1-\beta)G_t.
$$

Nesterov gradient:

$$
\widehat G_t
=
\beta M_t
+
(1-\beta)G_t.
$$

Alternating row/column normalization produces \(U^{(K)}\), then

$$
\boxed{
\Delta_t
=
\sqrt n\,U^{(K)}.
}
$$

The update is

$$
\widetilde\eta_t
=
\gamma\eta_t,
\qquad
W_{t+1}
=
W_t-\widetilde\eta_t\Delta_t.
$$

Its target condition approximately equalizes row- and column-wise update RMS:

$$
\frac1n\sum_j(\Delta_t)_{ij}^2\approx1,
\qquad
\frac1m\sum_i(\Delta_t)_{ij}^2\approx1.
$$

The reported learning-rate correction is

$$
\boxed{\gamma=0.18}.
$$



---

# 13. Distributed Multimodal Training

Contrastive vision-language training requires global text and visual representations across data-parallel ranks.

Instead of serializing AllGather with compute, the schedule overlaps them:

$$
\boxed{
F(V)
\rightarrow
\left[
F(T)\parallel\operatorname{AllGather}(V)
\right]
\rightarrow
\nabla T
}
$$

followed by

$$
\boxed{
\left[
B(T)\parallel\operatorname{AllGather}(T)
\right]
\rightarrow
\nabla V
\rightarrow
B(V).
}
$$

Both collective operations are therefore hidden behind useful computation. 

The vision encoder is disaggregated from the LLM parameter tree. Each training step executes:

$$
\boxed{
\text{Vision Forward}
\rightarrow
\text{LLM Forward/Backward}
\rightarrow
\text{Vision Backward}.
}
$$

This allows the LLM stage to retain the normal text-model parallel strategy. 

---

# 14. Million-Token Multimodal I/O

Image-dense million-token samples can shift the bottleneck toward CPU, storage and host memory.

Images belonging to a long sequence are therefore distributed across context-parallel ranks, with every image loaded exactly once.

Loading remains hidden behind computation when

$$
\frac{N\rho}{B_{\mathrm{IO}}}
<
\frac{NC}{B_{\mathrm{GPU}}},
$$

giving

$$
\boxed{
\rho
<
\frac{B_{\mathrm{IO}}}{B_{\mathrm{GPU}}}C.
}
$$

Because \(N\) cancels, the criterion depends on **per-token input bytes and per-token compute**, rather than sequence length directly. 

RL image transfers are incremental, and CPU-side decoding/preprocessing outputs are persisted for reuse across rollouts and later training. 

---

# 15. CSA2 Distributed Training State

Cross-layer reuse creates non-local parameter/state dependencies when producer and consumer layers occupy different pipeline stages.

The training system introduces **shadow indexers**: executable replicas exist on participating pipeline stages while one logical owner maintains optimization and checkpoint authority. Parameter synchronization and gradient aggregation keep replicas consistent.

Cross-boundary pipeline payloads carry intermediate representations and sparse-routing information and remain partitioned consistently with context parallelism. Shared-state lifetime is tracked per microbatch across forward execution, activation recomputation and backward propagation; state is released after the last consumer completes. 

---

# 16. Engram Distributed Infrastructure

Engram tables are row-partitioned over dedicated Engram process groups. Optimizer states are additionally sharded over replicas.

Because lookup addresses depend only on input token sequences,

$$
\boxed{
\text{Engram addresses can be computed before pipeline execution}.
}
$$

Consequently, embeddings are prefetched for the local batch before pipeline-stage microbatch processing begins.

Embedding gradients are buffered and returned to owning ranks after backbone backward. During multimodal training, prefetch and gradient communication overlap vision-encoder execution.

Stored/fetched Engram embeddings use FP8. During RL rollouts the tables remain GPU-resident to reduce host-memory pressure and fragmentation. 

---

# 17. Inference Kernel Graph

The inference path aggressively fuses the architecture into a small number of kernels.

The reported stack includes fused operations from FlashMLA, DeepGEMM, TileKernels and DeepSelect. For the dominant CSA2 Reuse-mode layers:

$$
\boxed{
N_{\mathrm{kernels,prefill}}=15,
\qquad
N_{\mathrm{kernels,decode}}=11.
}
$$

Deployment uses **Encoder–Prefill–Decode disaggregation**, enabling vision encoding, prompt prefill and token decoding to scale independently and overlap. 

---

# 18. Runtime and Persistent KV

Runtime global KV is HBM-resident.

Persistent global KV is stored for reuse in SSD/host-memory infrastructure.

The report distinguishes reuse lifetimes:

$$
\boxed{
\begin{aligned}
\text{global KV}
&:\text{long-tail reuse},\\
\text{SWA KV}
&:\text{minute-scale active-session reuse}.
\end{aligned}}
$$

V4 persisted both, with global and SWA caches independently managed by LRU. Global KV could remain resident beyond 72 hours, while SWA typically becomes useless after a session or subsequent turn. 

V4.1 therefore removes SWA KV from the persistent cache.

Instead:

$$
\boxed{
\text{SWA KV}
\rightarrow
10\%\ \text{host DRAM distributed pool}
}
$$

with minute-scale TTL, while global KV maintains at least 72-hour persistence. 

---

# 19. SWA Bounded Replay

Exact reconstruction across \(L\) layers would require approximately

$$
\boxed{
L\,n_{\mathrm{win}}
}
$$

replayed token-layer computations.

Bounded Replay restricts reconstruction to the latest \(n_{\mathrm{win}}\) tokens.

For replay beginning at \(s\), token \(i\) attends locally over

$$
\boxed{
[\max(s,i-W+1),\,i].
}
$$

Thus

$$
L\,n_{\mathrm{win}}
\rightarrow
n_{\mathrm{win}}
$$

at the replay-sequence level.

### Encoder replay

On a global-KV cache hit with missing encoder SWA state:

$$
\boxed{
\text{cached global KV}
+
\text{replay last }n_{\mathrm{win}}\text{ prefix tokens}
+
\text{uncached suffix}.
}
$$

Replayed tokens regenerate SWA only; cached global KV is neither recomputed nor overwritten. 

### Decoder replay

Decoder global KV already comes from the final encoder state. Decoder SWA remains missing, so the last \(n_{\mathrm{win}}\) prompt tokens are passed through decoder layers under truncated SWA. The reconstructed decoder SWA is used for decoding, not persistent prefix caching. 

Critically,

$$
\boxed{
\text{Bounded Replay is approximate, not exact}.
}
$$

The reconstructed state can depend on the cache-hit location and need not equal full-forward state. Training simulates this reconstruction during post-training to adapt the model to the approximation. 

---

# 20. Pretraining Data

The model is pretrained on

$$
\boxed{45\ \mathrm{T\ tokens}}
$$

of multimodal data.

The corpus combines text-only and multimodal sources using an eventual token mixture of

$$
\boxed{
7:1
\quad
\text{text : multimodal}.
}
$$

Overlapping text and multimodal samples are resolved by replacing the text-only instance with its multimodal counterpart.

Ultra-long documents are deterministically pre-split before mixing, and best-fit packing reaches reported padding

$$
\boxed{\le10^{-4}}.
$$



Multimodal pretraining data comprises:

$$
\boxed{
\text{image-text pairs}
+
\text{interleaved image-text}
+
\text{domain-specific visual data}.
}
$$

Web-derived data is prioritized over broad synthetic generation. Interleaved documents undergo staged filtering before image retrieval, semantic image deduplication, image-aware filtering and final quality scoring. Domain-specific additions target visual grounding, pointing, OCR, long-tail knowledge, image-code pairs and computer-use trajectories. 

---

# 21. Pretraining Schedule

The model is trained from scratch with sparse attention at

$$
\boxed{64\mathrm{K}}
$$

context without dense-attention warmup.

At

$$
\boxed{34\mathrm{T}}
$$

tokens, context is extended to

$$
\boxed{1\mathrm{M}}.
$$

Batch size remains

$$
\boxed{100.6\ \mathrm{M\ tokens}}
$$

throughout training.

Learning rate:

$$
\eta(t)=
\begin{cases}
\text{linear warmup},
&0\rightarrow2000\ \text{steps},\\[1mm]
2.6\times10^{-4},
&\text{through }28\mathrm{T},\\[1mm]
\text{cosine decay},
&28\mathrm{T}\rightarrow40\mathrm{T},\\[1mm]
2.6\times10^{-5},
&40\mathrm{T}\rightarrow45\mathrm{T}.
\end{cases}
$$

AdamW configuration:

$$
\beta_1=0.9,\qquad
\beta_2=0.95,\qquad
\epsilon=10^{-20},\qquad
\lambda=0.1.
$$

Muon:

$$
\beta=0.95,
\qquad
\lambda=0.1,
\qquad
\mathrm{RMS\ correction}=0.18.
$$

Sinkhorn update:

$$
K=11,
\qquad
\tau=10^{-3},
\qquad
\epsilon=10^{-20}.
$$

Engram learning rate is scaled by \(5\times\). 

---

# 22. Vision Encoder Training

DeepSeek-ViT is trained separately before integration.

### Stage I — contrastive pretraining

$$
\boxed{
\sim47\mathrm{B}\ \text{image-text pairs}
}
$$

using SigLIP-style sigmoid contrastive loss.

Resolution is capped at approximately

$$
224\times224
$$

during this phase. 

### Stage II — autoregressive visual refinement

The encoder is attached to a

$$
\boxed{4\mathrm{B}\ \mathrm{MoE\ LLM}}
$$

and trained on

$$
\boxed{236\mathrm{B}\ \text{tokens}}
$$

covering captions, alt text, charts and OCR.

Resolution range:

$$
544\times544
\le
R
\le
1344\times1344.
$$

After training, the helper LLM is discarded and only the vision encoder is retained. 

---

# 23. Base-Model Evaluation

The report evaluates world knowledge, language/reasoning, coding/math, long context and multimodal capability. 

Representative reported results:

| Benchmark    | V4-Flash Base | V4-Pro Base | V4.1-Flash Base |
| ------------ | ------------: | ----------: | --------------: |
| MMLU-Pro     |          68.3 |        73.5 |        **74.1** |
| SuperGPQA    |          46.5 |    **53.9** |            53.1 |
| HumanEval    |          69.5 |        76.8 |        **79.4** |
| GSM8K        |          90.8 |        92.6 |        **93.0** |
| MATH         |          57.4 |    **64.5** |            61.1 |
| LongBench-V2 |          44.7 |    **51.5** |            45.2 |
| MMMU-Pro     |             — |           — |            56.5 |
| DocVQA       |             — |           — |            95.6 |

The associated parameter counts are

$$
284\mathrm{B},
\qquad
1.6\mathrm{T},
\qquad
552\mathrm{B},
$$

while V4.1 activation is \(8\mathrm{B}/16\mathrm{B}\) for prefill/decode. 

**[SOURCE-REPORTED; internal evaluation framework.]**

---

# 24. Post-Training Pipeline

The report explicitly introduces **no new post-training optimization algorithm**.

$$
\boxed{
\mathrm{SFT}
\rightarrow
\mathrm{RL}
\rightarrow
\mathrm{OPD}.
}
$$

The reported development focus shifts from optimization-objective novelty toward

$$
\boxed{
\text{task synthesis}
+
\text{environment construction}
+
\text{verification}
+
\text{data scale}
+
\text{rollout scale}.
}
$$



---

# 25. Agent Task Synthesis

Each training task is formalized as

$$
\boxed{
\mathcal T
=
(\text{problem},
\text{environment},
\text{verification system}).
}
$$

Task quality is judged along:

$$
\boxed{
\text{difficulty}
\quad+\quad
\text{correctness}.
}
$$

Generated RL trajectories subsequently become evidence for re-auditing task quality.

General-agent environments reconstruct observed real workflows and mocked tools, including tool interfaces, API schemas, output structures and behavioral constraints. Failure trajectories and negative feedback are replayed to create targeted training environments. 

Coding environments are built from difficult coding-agent sessions and qualifying public repositories. Specialized construction agents establish buildability and verifiability, generate implementation directions and evaluation criteria, create isolated environments and tests, run multiple solver agents, inspect hackability and factual consistency, and repair failed environments before admission. 

---

# 26. RL Scaling

RL uses synthesized tasks and scales along two axes:

$$
\boxed{
\text{training compute}
\times
\text{number/diversity of scaffolds}.
}
$$

Rollout execution is separated into an agent sandbox and worker container. A scaffold-agnostic control layer normalizes different interaction protocols into a common trajectory format and communicates with training.

Successive RL runs can be initialized through checkpoint merging across different scaffolds/configurations:

$$
\boxed{
\theta_{k+1}^{(0)}
=
\operatorname{Merge}
(
\theta_k^{(1)},
\theta_k^{(2)},
\ldots
).
}
$$

The report observes additional capability and token-efficiency gains from this continuation strategy.  

---

# 27. DSec Agent Execution Infrastructure

Large-scale agent training requires millions of heterogeneous sandbox instances.

DSec partitions compute into independent **scale units** and uses a placement architecture with relaxed global consistency.

$$
\boxed{
\text{eventual-consistency placement}
+
\text{strict node-local admission}.
}
$$

Independent placement replicas estimate resource availability without synchronized global coordination. Every compute node validates proposed placement against hard local resource limits. 

Node-level execution uses hardware-supported sub-NUMA partitioning, with each worker VM bound to a NUMA domain.

Reported density increases from approximately

$$
1000
\rightarrow
>2500
$$

concurrent live containers per physical node before measurable end-to-end degradation. 

Agent containment uses per-sandbox AppArmor policies and fine-grained eBPF network controls. Environment crashes become failed trajectories with repercussion feedback to RL. 

---

# 28. Controllable Reasoning Effort

The policy conditions directly on scalar effort

$$
\boxed{
b\in\{1,\ldots,100\}.
}
$$

For prompt \(x\),

$$
z_{b,j}
\sim
\pi_\theta(\cdot\mid x,b),
\qquad
j=1,\ldots,M_b.
\tag{8}
$$

Rewards are normalized within the same \((x,b)\) subgroup; trajectories generated at different effort levels are not directly compared.

The length component is

$$
\boxed{
r_{b,j}^{\mathrm{len}}
=
-\min
\left\{
C_{\max},
k(b)
\frac{\ell_{b,j}}{L_{\mathrm{norm}}}
\right\}.
}
\tag{9}
$$

with

$$
\boxed{
k(b)
=
k_0
\exp
\left(
-\frac{b-b_{\min}}{\tau}
\right),
\qquad
\tau=\lambda\Delta b.
}
\tag{10}
$$

Lower effort therefore imposes stronger marginal token pressure. 

Deployment presets are

$$
\boxed{
\text{low}=50,\qquad
\text{high}=75,\qquad
\text{max}=100.
}
$$



---

# 29. Marginal-Utility Interpretation of Effort

Let

$$
p_x(\ell)
$$

be the probability of solving problem \(x\) after \(\ell\) reasoning tokens.

Preferred reasoning length satisfies

$$
\ell_x^\star(b)
\in
\arg\max_{\ell\ge0}
\left[
p_x(\ell)
-
k(b)\frac{\ell}{L_{\mathrm{norm}}}
\right].
\tag{13}
$$

For an interior optimum,

$$
\boxed{
p_x'
\left(
\ell_x^\star(b)
\right)
=
\frac{k(b)}{L_{\mathrm{norm}}}.
}
\tag{14}
$$

Assume locally

$$
p_x'(\ell)
\approx
a_xe^{-\ell/s_x}.
\tag{15}
$$

Substitution gives

$$
\boxed{
\ell_x^\star(b)
\approx
C_x
-
s_x\log k_0
+
\frac{s_x}{\tau}
(b-b_{\min}).
}
\tag{16}
$$

Therefore

$$
\boxed{
\ell_x^\star(b_2)
-
\ell_x^\star(b_1)
\approx
\frac{s_x}{\tau}(b_2-b_1).
}
\tag{17}
$$

This is only a **local reward-level approximation**. The paper explicitly excludes interpreting it as guaranteed linear or monotonic realized trajectory length because policy strategy, stochastic decoding, multi-turn structure, subgroup normalization and the reward cap alter observed behavior.  

---

# 30. Asynchronous RL

Rollout and training share the same physical devices through time-sharing.

The system controls a maximum number of in-flight samples and ultimately adopts **sample-level dispatch**.

A new prompt can be dispatched when the number of completed samples is sufficient to form the required next GRPO group, rather than waiting for one particular prompt group to complete. Batch-level dispatch caused oscillatory training metrics; prompt-level dispatch remained vulnerable to long-tail group completion times. 

Asynchrony introduces two statistical problems:

$$
\boxed{
\text{length bias}
+
\text{off-policy staleness}.
}
$$

Length bias is mitigated using dataset-level concurrency control and optional removal of excessively early short samples.

Off-policy deviation is bounded by dispatch/wait logic, while tokens exceeding a staleness threshold are removed from the training loss through masking. 

---

# 31. Token-Level Interrupt and Resume

Rollout generation can be interrupted at any token boundary.

The system persists:

$$
\boxed{
\text{KV state}
+
\text{expert-routing state}
}
$$

at token granularity.

After switching to a newer policy checkpoint, the rollout resumes from this state instead of re-prefilling the sequence.

Sample-level garbage collection releases stored state immediately when a trajectory terminates. The same mechanism permits training jobs to respond to cluster preemption without discarding partially generated rollouts. 

---

# 32. On-Policy Distillation

Final full-vocabulary OPD uses

$$
\boxed{>40\ \text{teacher models}}
$$

across all domains.

Teachers may come from different training stages and may be architecturally heterogeneous with respect to both one another and the student.

The asynchronous infrastructure supports dynamic changes to

$$
\boxed{
\text{dataset mixture},
\quad
\text{dataset concurrency},
\quad
\text{active teacher set}
}
$$

while samples generated under old and new configurations coexist in flight. 

---

# 33. Agentic Evaluation

Evaluation covers reasoning, coding agents, cyber-security agents, general agents and visual agents.

Code-agent runs use a 1M-token context, temperature \(1.0\) and top-\(p=0.95\). Visual-agent evaluation uses 512K context. Internet access is restricted where required, Git histories are removed, and build/package caches are purged to reduce solution leakage and reward hacking. 

Selected reported Max-effort results:

| Benchmark          | V4.1-Flash |
| ------------------ | ---------: |
| GPQA Diamond       |       90.9 |
| Codeforces rating  |       3471 |
| MathArena Apex     |       65.6 |
| Terminal-Bench 2.1 |       90.6 |
| Terminal-Bench 3.0 |       30.0 |
| Terminal-Bench 4.0 |       31.2 |
| DeepSWE v1.1       |       74.2 |
| NL2Repo-Bench      |       65.4 |
| CyberGym           |       88.1 |
| SEC-Bench Pro      |       62.8 |
| AutomationBench    |       54.8 |
| Agents' Last Exam  |       31.8 |
| HLE with tools     |       63.9 |
| Chartography       |       78.9 |
| BabyVision         |       89.6 |
| ZeroBench-main     |       49.0 |



**[SOURCE-REPORTED; not independently reproduced.]**

---

# 34. Reasoning-Effort Cost–Quality Frontier

Increasing effort from

$$
25\rightarrow100
$$

raises the reported average score over eight reasoning-intensive evaluations from

$$
\boxed{
67.1\%\rightarrow76.3\%
}
$$

while output-token usage increases approximately

$$
\boxed{2.5\times}.
$$

DeepSWE:

$$
66.0\%\rightarrow74.2\%.
$$

Terminal-Bench 2.1:

$$
82.4\%\rightarrow90.6\%.
$$

Most gains occur around effort \(60\!-\!80\); moving to effort 100 substantially lengthens trajectories for smaller marginal accuracy gains. 

Across individual reasoning benchmarks, output length increases approximately \(2.0\!-\!3.1\times\) over effort 25→100. The appendix reports MathArena Apex improving from \(25.3\%\) to \(65.6\%\). 

---

# 35. Scaffold Dependence

The same checkpoint is evaluated across:

$$
\boxed{
\text{Claude Code},
\text{Codex},
\text{OpenCode},
\text{Pi},
\text{mini-SWE},
\text{DeepSeek Harness}.
}
$$

At Max effort:

| Scaffold     | DeepSWE v1.1 | Terminal-Bench 2.1 |
| ------------ | -----------: | -----------------: |
| Claude Code  |         69.8 |               88.0 |
| Codex        |         65.6 |               84.1 |
| OpenCode     |         65.5 |               85.0 |
| Pi           |         66.2 |               86.1 |
| mini-SWE     |     **74.2** |               90.3 |
| DSH Minimal  |         72.6 |           **90.6** |
| DSH Standard |         70.5 |               85.8 |
| DSH PTC      |         67.6 |               85.8 |

All reported runs retain the same checkpoint, decoding configuration and benchmark tasks while changing the surrounding system prompt, tool schema and interaction protocol. 

The appendix further shows that scaffold choice can affect performance at least as strongly as reasoning effort once a task approaches saturation. 

---

# 36. Multi-Agent Execution

Agent Team mode contains a lead agent that can create persistent teammates.

Teammates can begin from:

$$
\boxed{
\text{fresh context}
\quad\text{or}\quad
\text{forked lead-state snapshot}.
}
$$

Agents share one repository checkout and communicate through durable mailboxes. A shared task board maintains ownership, dependencies and advisory write scopes with revision checking. 

Training reward combines:

$$
\boxed{
R
=
R_{\mathrm{task}}
+
R_{\mathrm{collaboration}}
-
\lambda R_{\mathrm{derived\ latency}}.
}
$$

Derived latency constructs a DAG of execution events and collaboration dependencies. Event costs combine model-token execution under fixed prefill/decode rates and measured tool time; the latency objective uses the DAG critical path.

This rewards useful parallelism while penalizing unnecessary synchronization. 

Reported test-time scaling shows multi-agent configurations outperforming strongest single-agent counterparts at every tested deadline on ProgramBench and FrontierSWE v2. ProgramBench reaches \(30.04\%\) versus \(20.39\%\); FrontierSWE v2 reaches \(32.90\%\) versus \(28.20\%\) at the longest reported deadlines. 

---

# 37. Systems-Level Result

The final model couples four distinct forms of sparsity/compression:

$$
\boxed{
\begin{array}{ll}
\textbf{MoE sparsity} &\rightarrow\text{conditional parameter activation},\\
\textbf{CSA2 sparsity} &\rightarrow\text{conditional context access},\\
\textbf{Engram sparsity} &\rightarrow\text{conditional externalized memory},\\
\textbf{CED depth sparsity} &\rightarrow\text{conditional prompt computation}.
\end{array}}
$$

and combines them with

$$
\boxed{
\text{FP4 state compression}
+
\text{bounded approximate reconstruction}
+
\text{kernel fusion}
+
\text{speculative decode}.
}
$$

The resulting source-reported operating point is:

$$
\boxed{
\begin{aligned}
P_{\mathrm{backbone}} &=552\mathrm{B},\\
P_{\mathrm{Engram}} &=196\mathrm{B},\\
P_{\mathrm{active,prefill}}&=8\mathrm{B/token},\\
P_{\mathrm{active,decode}}&=16\mathrm{B/token},\\
T_{\max}&=1\,048\,576,\\
M_{\mathrm{global-KV}}&=890\ \mathrm{bytes/token},\\
M_{\mathrm{persistent}}
&\approx\frac18 M_{\mathrm{V4\text{-}Flash}}.
\end{aligned}}
$$

The report attributes the global-KV reduction jointly to **CSA2 cross-layer reuse and FP4 main KV**, while persistent-cache reduction additionally depends on removing SWA from long-lived persistence and reconstructing it with bounded replay. 

---

# 38. Technical Boundaries

The report explicitly identifies two architecture-induced robustness boundaries:

$$
\boxed{
\text{CSA2 sparse-selection error}
}
$$

and

$$
\boxed{
\text{approximate SWA-state reconstruction error}.
}
$$

Neither is claimed to be eliminated. The published evaluations did not reveal systematic degradation in tested regimes, but the report states that finite testing cannot establish robustness for every extreme context or cache-resumption configuration. 

Similarly,

$$
\boxed{
\text{benchmark proximity}
\not\Rightarrow
\text{frontier-capability equivalence}.
}
$$

The report explicitly acknowledges a remaining gap on the hardest reasoning and edge-case tasks despite comparatively narrow benchmark differences. 

$$
\boxed{
\textbf{Core technical result: }
\text{V4.1-Flash co-designs model topology, KV representation,}
\atop
\text{cache lifetime, reconstruction, distributed training, kernels,}
\atop
\text{rollout infrastructure and post-training data generation}
\atop
\text{around the economics of million-token agent execution.}
}
$$
