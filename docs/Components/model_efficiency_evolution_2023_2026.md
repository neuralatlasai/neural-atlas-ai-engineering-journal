# From compression algorithms to inference co-design

## How quantization, pruning, distillation, speculative decoding, and sparsity evolved from 2023 to August 2026


Between 2023 and 2026, model efficiency stopped being a collection of independent compression tricks. The field moved toward co-design: a model transformation is useful only when its numerical representation, checkpoint encoding, execution kernel, accelerator, serving scheduler, and evaluation protocol agree.

This distinction matters. AWQ is not INT4. INT4 is not W4A16. W4A16 is not Marlin. Marlin is not GGUF. A sparse checkpoint is not automatically a faster model. A speculative-decoding paper is not automatically usable under continuous batching. A distilled model can be smaller without being cheaper if its generated sequences become longer. The public literature often collapses these layers; production systems cannot.

This article reconstructs five parallel efficiency directions—**quantization, pruning, distillation, speculative decoding, and sparsity**—from January 2023 through August 15, 2026. Each direction is examined through the same eight evidence planes:

1. original research;
2. official implementation;
3. checkpoint and configuration representation;
4. transformation or training toolchain;
5. serving-runtime integration;
6. kernel and hardware execution;
7. model-producer deployment; and
8. evaluation evidence.

The objective is not to crown one universal technique. There is no universal optimum. The objective is to expose which methods exist, what operation each performs, where it actually runs, and which claims remain research-only.

---

## The short version

Five changes define the 2023–2026 period.

**Quantization moved from weight-only INT4 toward joint numerical and kernel co-design.** GPTQ and AWQ remained important, but rotation methods, microscaling, FP8, NVFP4, MXFP4, attention quantization, and KV-cache quantization became the frontier. By 2026, the decisive question was no longer “four bits or eight bits?” but “which payload format, scaling hierarchy, accumulator, packing, and GEMM path does this accelerator execute natively?”

**Pruning split into two different fields.** Unstructured methods such as SparseGPT and Wanda optimized reconstruction under a mask, while structured methods such as Minitron, DarwinLM, Puzzle, and Puzzletron searched for smaller executable architectures. The first can produce high nominal sparsity without speedup; the second usually produces a real latency reduction but demands expensive recovery training.

**Distillation moved from static teacher data toward student-distribution training.** Response distillation remained the most deployable black-box technique. White-box logit distillation evolved through reverse-KL, generalized on-policy distillation, Jensen–Shannon objectives, quantization-aware distillation, and reasoning-policy distillation. The central problem became exposure bias: the student must learn on states it actually visits, not only on ideal teacher trajectories.

**Speculative decoding evolved from a two-model acceptance algorithm into a family of proposer architectures.** Small draft models were joined by Medusa heads, recurrent drafters, feature-level EAGLE models, MTP heads, retrieval and suffix proposers, and block-parallel diffusion drafters. Runtime scheduling, batching, verification kernels, vocabulary alignment, and drafter cost now determine the speedup as much as acceptance rate.

**Sparsity moved from zero weights toward dynamic computation selection.** The active frontier is attention, KV cache, activations, and experts: NSA/DSA, indexer-based top-k attention, KV eviction and hierarchical memory, contextual neuron sparsity, and MoE routing. Sparse execution is now a data-movement problem as much as a FLOP-reduction problem.

---

# 1. How to read the map

## 1.1 The eight-plane evidence model

A technique is assigned the strongest public status that can be verified.

| Status | Required evidence | What it proves |
|---|---|---|
| Research-proposed | Original paper or technical report | The algorithm and reported experiment exist |
| Open-implemented | Official or author-maintained source | The algorithm can be inspected or reproduced |
| Checkpoint-represented | Public config, model card, or serialized format | A model can encode the transformation |
| Toolchain-supported | Official compressor/trainer/exporter | The transformation can be produced through a maintained workflow |
| Runtime-integrated | Documented vLLM, SGLang, TensorRT-LLM, llama.cpp, or equivalent path | A serving engine recognizes and executes it |
| Kernel-accelerated | Dedicated CUDA, ROCm, CPU, TPU, or NPU kernel | The representation has an execution path beyond generic dequantization |
| Production-validated | Official model deployment plus workload measurements | The end-to-end system—not only a microbenchmark—was evaluated |
| Undisclosed | No public mechanism-level evidence | No technical conclusion is justified |

These states are not interchangeable. A paper with a CUDA prototype is not a general vLLM feature. A runtime that loads a checkpoint may dequantize it into a different format. A kernel benchmark does not establish end-to-end throughput under prefix caching, continuous batching, tensor parallelism, or long-context decode.

## 1.2 The system boundary

The common deployment path is

\[
\text{trained model}
\rightarrow
\text{model transformation}
\rightarrow
\text{serialized checkpoint}
\rightarrow
\text{runtime loader}
\rightarrow
\text{kernel selection}
\rightarrow
\text{accelerator execution}
\rightarrow
\text{scheduler-visible latency/throughput}.
\]

Every method in this article belongs to at least one of these stages. Calling all of them “compression” loses the causal structure.



---

# 2. Quantization: from scalar rounding to hierarchical numerical systems

## What changed

In 2023, the dominant deployment question was how to compress weights to three or four bits without retraining. By 2026, production quantization was a joint design over payload datatype, scale datatype, scale granularity, calibration, outlier control, tensor layout, accumulator precision, and hardware-native matrix instructions.

## 2.1 Formal operation

For uniform affine quantization,

\[
q_i = \operatorname{clip}\!\left(\left\lfloor \frac{x_i}{s}\right\rceil + z,
q_{\min},q_{\max}\right),
\qquad
\hat{x}_i=s(q_i-z),
\]

where \(s\) is a scale and \(z\) is a zero point. The critical systems variable is the domain over which \(s\) and \(z\) are shared:

\[
g \in \{\text{tensor,row,token,channel,group,block,head,KV-channel}\}.
\]

The quantization problem can be written

\[
\min_{Q,s,z}\;\mathcal{E}(X,\hat X)
\quad \text{s.t.}\quad
\hat X=s\bigl(Q(X;s,z)-z\bigr),
\]

but the choice of \(\mathcal E\) separates method families:

- RTN minimizes local scalar rounding error;
- GPTQ approximates layer-output error using second-order information;
- AWQ protects activation-salient weight channels;
- SmoothQuant moves activation outlier difficulty into weights through an equivalent rescaling;
- OmniQuant and related methods optimize clipping/scales through calibration;
- QuaRot, SpinQuant, QuIP#, DuQuant, and FlatQuant transform the basis before quantization;
- AQLM, QTIP, and I-quants use non-scalar or nonuniform codebooks;
- KVQuant, KIVI, GEAR, MiKV, and TurboQuant target the KV cache rather than only model weights.

## 2.2 Numerical representation map

| Family | Payload | Scale structure | Nominal storage relative to FP16 |
|---|---|---|---:|
| FP8 | E4M3 or E5M2 | tensor, row, block, delayed, dynamic | 50% |
| INT8 | signed or affine integer | tensor, channel, token, block | 50% |
| FP6 | E2M3 or E3M2 | normally microscaled | 37.5% plus metadata |
| INT6 | uniform/nonuniform | group or block | 37.5% plus metadata |
| INT5 | uniform/nonuniform | group or block | 31.25% plus metadata |
| FP4 | E2M1 | external block/tensor scale | 25% plus metadata |
| INT4 | uniform or affine | channel, group, block | 25% plus metadata |
| NF4 | 16-value normal codebook | block scale; optional double quantization | 25% plus metadata |
| INT3 | uniform/nonuniform/codebook | group or block | 18.75% plus metadata |
| INT2 | uniform/nonuniform/codebook | group or block | 12.5% plus metadata |
| Binary | \(\{-1,+1\}\) or \(\{0,1\}\) | tensor/channel/block | 6.25% plus metadata |
| Ternary | \(\{-1,0,+1\}\) | tensor/channel/block | encoding-dependent |
| MXFP4 | E2M1 | 32-value block + E8M0 scale | 4.25 effective bits/value |
| NVFP4 | E2M1 | 16-value block + E4M3 scale + tensor FP32 scale | approximately 4.5 bits before outer-scale amortization |

FP8 E4M3/E5M2 is documented by [NVIDIA Transformer Engine](https://docs.nvidia.com/deeplearning/transformer-engine/user-guide/examples/fp8_primer.html). The OCP MX family was publicly developed across AMD, Arm, Intel, Meta, Microsoft, NVIDIA, and Qualcomm; [MXFP4](https://rocm.blogs.amd.com/software-tools-optimization/mxfp4-mxfp6-quantization/README.html) uses E2M1 values in groups of 32 with E8M0 scaling. [NVFP4](https://developer.nvidia.com/blog/introducing-nvfp4-for-efficient-and-accurate-low-precision-inference/) changes the group to 16 values, uses E4M3 block scales, and adds a second-level FP32 scale.

## 2.3 Scaling and transformation taxonomy

**Scale placement:** per-tensor, per-row, per-token, per-channel, per-head, per-group, per-block, microscaling, tensor-plus-block dual scaling.

**Scale timing:** offline/static, online/dynamic, delayed, amax-history, calibration-derived, load-time requantization.

**Mapping:** symmetric, asymmetric affine, zero-point, power-of-two, nonuniform codebook, learned codebook, vector/product quantization.

**Error control:** clipping, outlier isolation, mixed precision, activation smoothing, importance weighting, Hessian compensation, low-rank residual, Hadamard rotation, orthogonal rotation, scale search.

## 2.4 Evolution, 2023–2026

| Year | Publicly named techniques and formats |
|---|---|
| 2023 | GPTQ; SmoothQuant; AWQ; SpQR; SqueezeLLM; OmniQuant; RPTQ; QuIP; QLoRA; NF4; Double Quantization; LLM-QAT; HQQ; SignRound/AutoRound; Atom; LLM-FP4; ZeroQuant-V2; OCP MX; GGUF K-quants; importance-matrix quantization |
| 2024 | AQLM; QuIP#; KVQuant; KIVI; QuaRot; SpinQuant; DuQuant; QServe; QQQ; QTIP; VPTQ; FlatQuant; EfficientQAT; BitDistiller; BitNet b1.58; SageAttention; GEAR; MiKV; IntactKV; WKVQuant; Marlin; GGUF I-quants; GGUF T-quants; compressed-tensors |
| 2025 | NVFP4; MXFP4 production deployment; MXFP8; SVDQuant; ParetoQ; QuEST; RaZeR; ICQuant; SageAttention2; SageAttention3; TurboQuant; PrefixQuant; QAD; Petit-NVFP4; Quark INT4-to-FP8 MoE; ModelOpt FP4 |
| 2026: implemented/runtime-visible | ScaleSearch; ScaleSearchAttention; Four-over-Six/Adaptive Block Scaling; NVFP4 KV cache; online NVFP4 MoE; BF16-to-MXFP4; FP8-to-MXFP4; NVFP4-to-MXFP4; mixed prefill/decode quantization |
| 2026: research frontier | NanoQuant; OAS; MBS; SliderQuant; ReSpinQuant; DuQuant++; QAM-W; FOCUS; PolarQuant; KVarN; Quantized Prefilling/Precise Decoding |

Primary examples include [AWQ](https://arxiv.org/abs/2306.00978), [OmniQuant](https://arxiv.org/abs/2308.13137), [AQLM](https://arxiv.org/abs/2401.06118), [QuaRot](https://arxiv.org/abs/2404.00456), [SpinQuant](https://arxiv.org/abs/2405.16406), [DuQuant](https://arxiv.org/abs/2406.01721), and [NanoQuant](https://arxiv.org/abs/2602.06694).

## 2.5 Current implementation map

### vLLM

Current public paths include AutoAWQ, BitsAndBytes, GPTQModel, Intel Neural Compressor/AutoRound, LLM Compressor, compressed-tensors, NVIDIA ModelOpt, AMD Quark, TorchAO, FP8 W8A8, INT8 W8A8, INT4 W4A16, INT8 W4A8, GGUF, Marlin, and quantized KV cache. Hardware support is method-specific rather than uniform. See [vLLM quantization](https://docs.vllm.ai/en/latest/features/quantization/).

### SGLang

Current public paths include FP8, MXFP4, blockwise INT8, W8A8 INT8, W8A8 FP8, AWQ, GPTQ, compressed-tensors, Quark, AutoRound, AWQ-Marlin, GPTQ-Marlin, GGUF, ModelOpt FP8/FP4, NVFP4 Online, Petit-NVFP4, Quark INT4FP8 MoE, and Quark MXFP4. SGLang explicitly distinguishes offline checkpoints from online load-time conversion. See [SGLang quantization](https://docs.sglang.io/docs/advanced_features/quantization).

### TensorRT-LLM and NVIDIA ModelOpt

The current TensorRT-LLM matrix exposes FP8 per-tensor, FP8 block scaling, FP8 rowwise, FP8 KV cache, NVFP4, NVFP4 KV cache, MXFP4, W4A16/W4A8 GPTQ, and W4A16/W4A8 AWQ. ModelOpt supplies PTQ, QAT, QAD, SmoothQuant, AWQ, SVDQuant, double quantization, and export. See [TensorRT-LLM quantization](https://nvidia.github.io/TensorRT-LLM/latest/features/quantization.html) and [ModelOpt](https://github.com/NVIDIA/Model-Optimizer).

### AMD

Quark supplies AWQ, GPTQ, SmoothQuant, rotation and mixed-format workflows; AITER supplies ROCm-native GEMM and attention paths. CDNA4 deployments add native MXFP4 execution, while SGLang exposes `quark_mxfp4` and `quark_int4fp8_moe` load-time transformations.

### llama.cpp and GGUF

The relevant public families are Q4/Q5/Q8 legacy blocks, K-quants, I-quants, T-quants, importance-matrix model presets, MXFP4, and NVFP4 tensor types. GGUF is the strongest portability path in this map, but portability does not imply that every backend has an equally optimized kernel. The authoritative structures live in [ggml-common.h](https://github.com/ggml-org/llama.cpp/blob/master/ggml/src/ggml-common.h).

## 2.6 The fastest practical vLLM starting point

“Fastest quantization” can mean shortest conversion time, lowest single-request latency, highest saturated throughput, or smallest resident memory. The table below gives the first configuration to benchmark—not a hardware-independent winner.

| Deployment target | First vLLM path to benchmark | Main reason | Required comparison |
|---|---|---|---|
| NVIDIA Blackwell | ModelOpt/compressed-tensors NVFP4; MXFP4 where the model and kernel path support it | native low-precision tensor-core execution and high compression | FP8 baseline at identical quality and concurrency |
| NVIDIA Hopper | compressed-tensors or ModelOpt FP8 W8A8; FP8 KV cache for long-context capacity | mature native FP8 GEMM path | BF16 plus W4A16 Marlin at low concurrency |
| NVIDIA Ampere or Ada, memory-bound decode | AWQ-Marlin or GPTQ-Marlin W4A16 | mature packed INT4 weight-only path | FP16/BF16 and FP8 where available |
| AMD CDNA3 | Quark FP8 or INT8 path with AITER kernels | ROCm-native dense low-precision execution | BF16 at the same ROCm/AITER revision |
| AMD CDNA4 | Quark MXFP4 or supported FP8/MXFP4 path with AITER | native microscaling execution | FP8 and BF16 quality/throughput baselines |
| CPU or heterogeneous edge | GGUF in llama.cpp rather than treating vLLM as the default | broader CPU/backend kernel coverage and mixed-tensor presets | `Q4_K_M`, `Q5_K_M`, and an unquantized baseline |

For the shortest path to a credible vLLM result, start from a checkpoint already serialized in the runtime’s native quantization schema, confirm that the selected kernel appears in startup logs, and benchmark the real prompt/output-length and concurrency distribution. Online load-time quantization is convenient for experimentation, but its startup cost and selected execution format must be reported separately. The relevant support matrices are the [vLLM quantization guide](https://docs.vllm.ai/en/latest/features/quantization/), [TensorRT-LLM quantization matrix](https://nvidia.github.io/TensorRT-LLM/latest/features/quantization.html), and [SGLang quantization guide](https://docs.sglang.io/docs/advanced_features/quantization).

## 2.7 Evaluation

Quantization must be evaluated across four surfaces:

1. **Numerical:** MSE, cosine similarity, SQNR, clipping rate, saturation rate, scale distribution.
2. **Model quality:** perplexity, task accuracy, pass@1/pass@k, calibration, long-context stability, multimodal regression.
3. **Memory:** serialized bytes, resident weight memory, scale/zero-point overhead, KV-cache bytes/token, workspace memory.
4. **Systems:** quantization time, load time, TTFT, TPOT, tokens/s, concurrency, energy/token, kernel occupancy.

### Note

`The lowest bit width is rarely the fastest configuration. W4A16 can be memory-efficient but decode slowly if dequantization or packing is mismatched. FP8 can outperform INT4 at high batch sizes because it maps directly to tensor-core GEMMs. NVFP4 and MXFP4 are not interchangeable formats. GGUF quality labels such as "Q4_K_M" describe a mixed tensor policy, not a single universal four-bit code. Any quality or speed claim without the exact checkpoint, group size, scale policy, kernel, GPU architecture, batch distribution, and context-length distribution is incomplete.`

---

# 3. Pruning: from sparse masks to executable architecture search

## What changed

Pruning developed along two incompatible deployment paths.

**Mask pruning** preserves tensor shapes and replaces selected values with zero. It can achieve strong perplexity retention at 50% or higher sparsity, but requires sparse storage and sparse GEMM support to reduce latency.

**Structural pruning** physically removes layers, channels, heads, FFN dimensions, hidden dimensions, Mamba dimensions, or experts. It produces a smaller dense or heterogeneous architecture that ordinary dense kernels can accelerate, but the removed capacity must usually be recovered through continued pretraining or distillation.

## 3.1 Formal operation

For a weight matrix \(W\) and binary mask \(M\), unstructured or semi-structured pruning solves

\[
\min_{M}\;\|XW-X(W\odot M)\|_F^2
\quad\text{s.t.}\quad
\|M\|_0 \le k
\quad\text{or}\quad M\in\mathcal M_{N:M}.
\]

SparseGPT uses an approximate second-order reconstruction update. Wanda scores weights using weight magnitude and activation statistics. OWL changes layer-wise sparsity allocation using outlier distributions. These methods principally optimize masked reconstruction.

Structured pruning instead searches an architecture

\[
a^*=\arg\max_{a\in\mathcal A} \;Q(a)
\quad \text{s.t.}\quad
C(a)\le C_{\max},
\]

where \(a\) may encode layer count, hidden width, FFN width, head count, Mamba dimensions, or expert count; \(C(a)\) can be parameters, active parameters, memory, FLOPs, or measured latency. Minitron uses activation-magnitude ranking with homogeneous slicing. Puzzle/Puzzletron use heterogeneous architecture search, including mixed-integer-programming formulations. DarwinLM makes the search recovery-aware by inserting lightweight training into candidate selection.

## 3.2 Granularity taxonomy

| Granularity | Resulting execution structure |
|---|---|
| Individual weight | Unstructured sparse matrix |
| N:M group | Semi-structured sparse matrix |
| Fixed block | Block-sparse matrix |
| Channel/neuron | Reduced matrix dimension |
| FFN intermediate dimension | Narrower MLP |
| Attention head | Fewer head projections/attention work |
| Hidden dimension | Globally narrower residual stream |
| Transformer layer | Shallower network |
| MoE expert | Fewer total experts |
| MoE expert width | Smaller expert MLP |
| Mamba head/head dimension | Smaller state-space block |
| Rank component | Low-rank matrix |

## 3.3 Evolution, 2023–2026

| Year | Publicly named techniques |
|---|---|
| 2023 | SparseGPT; Wanda; LLM-Pruner; LoRAPrune; Sheared LLaMA; OWL; FLAP |
| 2024 | SliceGPT; ShortGPT; SLEB; Bonsai; BlockPruner; Pruner-Zero; TransAct; AST; Minitron; MaskLLM; Puzzle; LLM-Surgeon |
| 2025 | MultiPruner; 2SSP; DarwinLM; Wanda++; Týr-the-Pruner; SlimLLM; E3-Pruner; DOTResize; Prune&Comp; CoSpaDi |
| 2026: implemented/runtime-visible | Puzzletron; Iterative Puzzle; NAS-based Minitron; MoE/Mamba Minitron; prune-then-QAD; heterogeneous AnyModel export |
| 2026: research frontier | DIET; GPrune-LLM; SparseSwaps; F-WANDA; WIDE; Agent-Guided Pruning; Deterministic Differentiable Structured Pruning; PBO Latency-Aware Structured Pruning |

Primary examples include [SparseGPT](https://arxiv.org/abs/2301.00774), [LLM-Pruner](https://arxiv.org/abs/2305.11627), [Wanda](https://arxiv.org/abs/2306.11695), [SliceGPT](https://arxiv.org/abs/2401.15024), [Minitron](https://arxiv.org/abs/2407.14679), [Puzzle](https://arxiv.org/abs/2411.19146), [DarwinLM](https://arxiv.org/abs/2502.07780), and [SlimLLM](https://arxiv.org/abs/2505.22689).

## 3.4 Current implementation map

### NVIDIA ModelOpt

NVIDIA’s maintained public LLM pruning paths are Minitron and Puzzletron. Minitron supports depth, hidden size, FFN size, attention heads, Mamba heads and head dimension, MoE expert count, expert FFN width, and shared-expert width. Puzzletron uses a heterogeneous MIP/NAS search. Both require recovery training or distillation for serious compression. See the official [ModelOpt pruning documentation](https://github.com/NVIDIA/Model-Optimizer/blob/main/examples/pruning/README.md).

### vLLM and LLM Compressor

SparseGPT and OWL APIs have existed in LLM Compressor, and older examples combined 2:4 sparsity with INT4 or FP8. The current compression guide explicitly states that sparse compression, including 2:4 export, is no longer supported because of limited hardware support and user demand. This is a material status change, not a documentation footnote. vLLM can still serve structurally smaller models when their architecture is supported, but that is different from providing a current general sparse-weight acceleration pipeline. See the [current LLM Compressor notice](https://docs.vllm.ai/projects/llm-compressor/en/latest/guides/compression_schemes/).

### TensorRT-LLM

TensorRT-LLM can serve dense checkpoints produced by structured pruning. NVIDIA’s sparse Tensor Cores can accelerate supported 2:4 patterns, but a zeroed tensor is not automatically converted into the required compressed layout. The exporter, TensorRT build configuration, layer shape, datatype, and hardware generation must align.

### SGLang

SGLang is not a general pruning toolchain. It can serve a compatible compact architecture and has extensive sparse-attention support, but these are separate capabilities.

### llama.cpp

llama.cpp has no general production path in which arbitrary zeroed weights automatically produce sparse GEMM acceleration. Structurally smaller supported models run faster because their tensor dimensions are smaller; unstructured zeros alone generally do not provide the same benefit.

### AMD

ROCm exposes sparse primitives through hipSPARSE and hipSPARSELt. These libraries provide the execution substrate; they do not choose a pruning mask or recover model accuracy. A model-side pruning algorithm and an export format compatible with the sparse kernel are still required.

## 3.5 Evaluation

Pruning evaluation must report:

- nominal sparsity and physically stored nonzero count;
- parameter and active-parameter reduction;
- exact structured dimensions before and after pruning;
- compressed checkpoint size;
- reconstruction error and perplexity delta before recovery;
- recovery tokens, optimizer compute, and final task quality;
- theoretical FLOPs and measured kernel FLOPs;
- TTFT, TPOT, throughput, peak memory, and energy;
- accuracy at equal latency, not only equal parameter count.

### Note

`Nominal sparsity is not speed. A 50%-zero dense tensor can be slower than its dense baseline after metadata and gather overhead. Structured pruning is the most reliable route to portable wall-clock acceleration, but it is closer to architecture redesign plus retraining than to a cheap post-training operation. Comparisons that exclude recovery-training tokens systematically understate its cost.`

---

# 4. Distillation: from static imitation to on-policy transfer

## What changed

Distillation became the bridge connecting nearly every other efficiency technique. It recovers pruned models, trains speculative drafters, transfers reasoning traces to smaller models, and stabilizes quantization-aware training.

The key evolution was a change in the state distribution on which the student receives supervision. Static response distillation trains on teacher-generated sequences. On-policy distillation trains on trajectories generated by the student itself, where its actual errors occur.

## 4.1 Formal objectives

For teacher \(p_T\), student \(p_\theta\), prompt \(x\), and trajectory \(y\), classic forward-KL token distillation is

\[
\mathcal L_{\mathrm{FKL}}
=
\mathbb E_{(x,y_{<t})\sim D}
\left[
D_{\mathrm{KL}}\!\left(
p_T(\cdot|x,y_{<t})\,\|\,p_\theta(\cdot|x,y_{<t})
\right)
\right].
\]

Reverse-KL changes the divergence direction:

\[
\mathcal L_{\mathrm{RKL}}
=
\mathbb E
\left[
D_{\mathrm{KL}}\!\left(
p_\theta(\cdot|s_t)\,\|\,p_T(\cdot|s_t)
\right)
\right],
\]

which is more mode-seeking and can reduce the student’s probability mass on teacher-low-probability tokens.

The decisive on-policy change is

\[
y\sim p_\theta(\cdot|x),
\qquad
\mathcal L_{\mathrm{OPD}}
=
\mathbb E_{x\sim D,\,y\sim p_\theta}
\bigl[\mathcal D(p_T,p_\theta;y)\bigr].
\]

Now the teacher labels states visited by the student. This attacks autoregressive exposure bias directly, but requires repeated teacher inference and makes the training distribution non-stationary.

Black-box response distillation instead optimizes supervised likelihood over filtered teacher outputs:

\[
\mathcal L_{\mathrm{resp}}
=-\sum_t m_t\log p_\theta(y_t^T|x,y_{<t}^T).
\]

It is cheaper to operationalize and works across proprietary APIs, but discards the teacher’s full token distribution and hidden states.

## 4.2 Signal taxonomy

| Axis | Technique families |
|---|---|
| Teacher access | black-box response; white-box logits; white-box features; teacher-free self-distillation |
| State distribution | teacher/off-policy; student/on-policy; mixed-policy; replay-buffer |
| Supervision | hard token; soft logits; hidden state; attention; rationale; process; outcome; verifier; reward |
| Granularity | token; sequence; step/process; trajectory; task/domain |
| Divergence | forward KL; reverse KL; Jensen–Shannon; skew KL; general f-divergence; optimal transport |
| Teacher structure | single teacher; ensemble; multi-teacher; teacher assistant; progressive teacher |
| Coupled optimization | prune-then-distill; QAD; draft-model distillation; RL-aware distillation |

## 4.3 Evolution, 2023–2026

| Year | Publicly named techniques |
|---|---|
| 2023 | Distilling Step-by-Step; MiniLLM; GKD; DistillSpec; sequence-level reasoning distillation; on-policy reverse-KL distillation |
| 2024 | DistiLLM; ULD; Minitron KD; MiniPLM; Mentor-KD; Multi-Level Optimal-Transport Distillation; f-divergence KD; cross-tokenizer distillation |
| 2025 | DeepSeek-R1 Distillation; QAD; MFT; synthetic-CoT distillation; process/verifier distillation; reward distillation; reasoning-policy distillation |
| 2026: implemented/runtime-visible | ModelOpt logit KD; Liger fused JSD KD; Megatron-Bridge KD; VLM QAD; pruning-recovery KD; draft-model distillation through SpecForge/speculators |
| 2026: research frontier | OPSD; ROSD; Veto; OPCD; TGPO; HPD; Self-Distilled RLVR; Bridge-Garden; agent-level on-policy distillation |

Primary examples include [Distilling Step-by-Step](https://arxiv.org/abs/2305.02301), [MiniLLM](https://arxiv.org/abs/2306.08543), [GKD](https://arxiv.org/abs/2306.13649), [DistiLLM](https://arxiv.org/abs/2402.03898), [ULD](https://arxiv.org/abs/2402.12030), and [On-Policy Self-Distillation](https://arxiv.org/abs/2601.18734).

## 4.4 Current implementation map

### NVIDIA

ModelOpt and Megatron-Bridge expose logit-level KD, Jensen–Shannon KD, Liger fused KD loss, prune-then-distill workflows, and QAD. This is the most complete publicly documented vendor path connecting pruning, distillation, quantization, and export. See the [ModelOpt changelog](https://nvidia.github.io/Model-Optimizer/reference/0_changelog.html).

### DeepSeek

DeepSeek-R1 used teacher-generated reasoning data to fine-tune smaller Qwen and Llama students. The released family spans 1.5B through 70B checkpoints. This is response/trajectory distillation through generated samples; the public repository does not expose full teacher logits for those students. See the [DeepSeek-R1 repository](https://github.com/deepseek-ai/deepseek-r1).

### OpenAI

The documented public path is black-box response distillation: optimize a prompt with a larger model, capture and filter outputs, construct a dataset, then supervised-fine-tune a smaller model. See [Distilling from a larger model](https://developers.openai.com/api/docs/guides/supervised-fine-tuning#distilling-from-a-larger-model). Internal frontier-model distillation mechanisms beyond documented products are undisclosed.

### Google DeepMind

GKD formalized on-policy distillation of autoregressive models using student-generated sequences and flexible divergence objectives, including integration with RL fine-tuning.

### Microsoft

MiniLLM introduced reverse-KL on-policy distillation for generative LMs. Microsoft also appears across adjacent numerical-format and deployment work, but a research paper should not be conflated with a single maintained production distillation service.

### vLLM, SGLang, TensorRT-LLM, llama.cpp

These are principally inference runtimes, not general knowledge-distillation trainers. vLLM Speculators and SGLang SpecForge train specialized speculative drafters; NVIDIA’s training path lives in ModelOpt/Megatron rather than TensorRT-LLM itself. llama.cpp consumes distilled checkpoints but does not perform model distillation.

## 4.5 Evaluation

Distillation must measure:

- student quality and teacher–student gap;
- task accuracy, pass@k, calibration, and long-context degradation;
- token NLL, forward KL, reverse KL, JSD, logit cosine, hidden-state similarity, CKA;
- student-generated trajectory failure rate and compounding-error rate;
- teacher inference tokens and cost;
- training tokens, training FLOPs, and wall-clock recovery cost;
- student sequence length and test-time compute;
- safety, refusal, tool-use, and formatting transfer;
- latency, memory, energy, and cost per successful task—not only per generated token.

### Note

`Distillation does not guarantee compression of behavior. A smaller reasoning student can emit more tokens and consume more end-to-end compute. Benchmark gains can come from teacher-data contamination or narrow task transfer. Black-box response distillation is operationally simple but loses distributional information. White-box on-policy distillation is stronger mechanistically but can spend substantial teacher compute. Distillation claims without the teacher, sampling policy, filtering rule, token budget, and student inference budget are not comparable.`

---

# 5. Speculative decoding: from draft-and-verify to proposer architecture

## What changed

The 2023 algorithm used a smaller autoregressive draft model to propose tokens and the target model to verify them in parallel without changing the target distribution. By 2026, speculative decoding had become a design space of proposal mechanisms: external draft models, multi-head predictors, recurrent drafters, feature-level models, native MTP heads, retrieval, suffix matching, Jacobi iteration, and block-diffusion drafters.

The performance bottleneck consequently moved from target-model calls to the entire proposer–verification pipeline.

## 5.1 Lossless acceptance

Let drafter \(q\) propose token \(x_i\) and target \(p\) evaluate it. Standard speculative sampling accepts with

\[
\alpha_i=\min\!\left(1,\frac{p(x_i|x_{<i})}{q(x_i|x_{<i})}\right).
\]

On rejection, sampling uses the residual distribution

\[
p'(x)=
\frac{\max(0,p(x)-q(x))}
{\sum_v\max(0,p(v)-q(v))}.
\]

This correction provides distributional exactness when the implementation follows the acceptance rule. Greedy token matching, Medusa-style tree acceptance, and threshold-based approximate verification have different guarantees and must not all be called lossless speculative sampling.

For draft length \(\gamma\), drafter time \(T_d\), verifier time \(T_v(\gamma)\), and expected accepted-token advance \(\mathbb E[A]+1\), the useful latency approximation is

\[
T_{\mathrm{token}}^{\mathrm{spec}}
\approx
\frac{T_d+T_v(\gamma)+T_{\mathrm{sample}}}
{\mathbb E[A]+1}.
\]

High acceptance is insufficient if \(T_d\) is large, verification scales poorly, the draft consumes excessive memory bandwidth, or continuous batching loses occupancy.

## 5.2 Proposer taxonomy

| Proposer family | Representative techniques |
|---|---|
| Independent small LM | Speculative Sampling; Speculative Decoding; SpecInfer; DistillSpec; standalone draft |
| Multi-head future-token prediction | Medusa; Medusa-2; MTP/NextN |
| Recurrent/feature autoregressive | ReDrafter; EAGLE; EAGLE-2; EAGLE-3; Hydra; Hydra++ |
| Tree and parallel candidate search | Sequoia; SpecInfer; Medusa Tree; PARD; SpecExec |
| Retrieval/history | REST; Prompt Lookup; N-Gram Cache; N-Gram Map; SuffixDecoding |
| Same-model/self-speculative | LayerSkip; Kangaroo; Jacobi/CLLM; Lookahead |
| Block-parallel/diffusion | DFlash; DART; DFlare; Domino; DSpark; DeLS-Spec |
| Adaptive control | Dynamic Speculative Decoding; Adaptive Verification; FR-Spec; confidence scheduling |

## 5.3 Evolution, 2023–2026

| Year | Publicly named techniques |
|---|---|
| 2023 | Speculative Sampling; Speculative Decoding; SpecInfer; DistillSpec; REST; Prompt Lookup Decoding; Lookahead Decoding |
| 2024 | Medusa; Medusa-2; EAGLE; Hydra; Hydra++; Sequoia; ReDrafter; LayerSkip; Kangaroo; EAGLE-2; Amphista; SpecExec; SuffixDecoding; MTP/NextN; Jacobi/CLLM; Clover |
| 2025 | EAGLE-3; FR-Spec; PARD; HASS; AdaSPEC; QSpec; Dynamic Speculative Decoding; Adaptive Speculative Decoding; production MTP |
| 2026: implemented/runtime-visible | DFlash; DSpark; D-PACE; EAGLE-3 disaggregated serving; cross-vocabulary drafting; parallel drafting; adaptive verification |
| 2026: research frontier | DART; DFlare; Domino; DominoTree; DeLS-Spec; JetSpec; Parallel Refinement; Local Uncertainty Repair |

Primary examples include [Speculative Decoding](https://arxiv.org/abs/2302.01318), [SpecInfer](https://arxiv.org/abs/2305.09781), [Medusa](https://arxiv.org/abs/2401.10774), [EAGLE](https://arxiv.org/abs/2401.15077), [EAGLE-2](https://arxiv.org/abs/2406.16858), [EAGLE-3](https://arxiv.org/abs/2503.01840), [DFlash](https://arxiv.org/abs/2602.06036), [Domino](https://arxiv.org/abs/2605.29707), and [DSpark](https://arxiv.org/abs/2607.05147).

## 5.4 Current implementation map

### vLLM

The current public method surface includes draft models, EAGLE/EAGLE-3, MTP, PARD, MLP speculators, N-Gram, suffix decoding, DFlash, DSpark, parallel drafting, dynamic speculative decoding, adaptive verification, and custom proposer backends. vLLM positions these primarily for medium-to-low-QPS, memory-bound workloads; gains under high concurrency are workload-dependent. See [vLLM speculative decoding](https://docs.vllm.ai/en/latest/features/speculative_decoding/).

### SGLang

SGLang exposes EAGLE-2, EAGLE-3, FR-Spec, MTP/NEXTN, DFlash, standalone draft models, N-Gram speculation, adaptive decoding, and an overlap scheduler. SpecForge supplies a training path for EAGLE-family drafters. See [SGLang speculative decoding](https://docs.sglang.io/docs/advanced_features/speculative_decoding).

### TensorRT-LLM

TensorRT-LLM exposes draft-target orchestration, N-Gram, Medusa, ReDrafter, EAGLE-1/2/3, MTP integrations, and Lookahead/Jacobi decoding. Its advantage is tighter fusion of proposal, sampling, beam/tree operations, and acceptance inside the engine. See [TensorRT-LLM speculative decoding](https://nvidia.github.io/TensorRT-LLM/advanced/speculative-decoding.html).

### llama.cpp

Current public proposer names include `draft-simple`, `draft-eagle3`, `draft-mtp`, `draft-dflash`, `draft-dspark`, `ngram-cache`, `ngram-simple`, `ngram-map-k`, `ngram-map-k4v`, and `ngram-mod`. This is the broadest low-dependency CPU/edge-facing speculative surface among the runtimes considered here. See [llama.cpp speculative decoding](https://github.com/ggml-org/llama.cpp/blob/master/docs/speculative.md).

### AMD

AMD supports speculative paths primarily through ROCm-enabled vLLM and SGLang, with official guidance around DeepSeek MTP and AITER-backed execution. AMD is therefore a hardware/backend contributor in this direction rather than the originator of a separate public acceptance algorithm.

### Model producers

DeepSeek-V3 made MTP a native training objective and serving feature. Meta contributed LayerSkip. EAGLE’s public team drove feature-level and later direct-token/multi-layer-fusion drafters. OpenAI and Anthropic do not publicly disclose the corresponding production decoding mechanisms used by their hosted frontier models; no inference should be made from API latency alone.

## 5.5 Evaluation

Speculative evaluation must report:

- draft length and tree width;
- acceptance probability by position;
- accepted tokens per verification step;
- drafter latency and verifier latency separately;
- target forward passes per emitted token;
- sampling/acceptance overhead;
- peak memory and KV duplication;
- greedy and stochastic correctness;
- total-variation or exact distribution test where losslessness is claimed;
- TTFT, TPOT, throughput, and concurrency curves;
- speedup under code, chat, reasoning, summarization, and low-repetition workloads;
- performance with tensor parallelism, prefix caching, continuous batching, and disaggregated prefill/decode.

### Note

`Acceptance rate is not speedup. Speculation can reduce single-request TPOT and reduce server throughput at high load. Reasoning workloads often have lower local predictability than code or document rewriting. A separate draft model consumes memory that might otherwise increase target batch size. Native MTP is attractive because the target already contains the heads, but one-step MTP may provide fewer accepted tokens than a trained EAGLE or diffusion drafter. Runtime scheduling is part of the algorithm.`

---

# 6. Sparsity: from zeros to selective computation and memory movement

## What changed

Sparsity is broader than pruning. Pruning creates a sparse parameterization; sparsity determines which weights, activations, tokens, attention blocks, KV entries, or experts are active for a given execution.

The 2023–2026 frontier moved away from static zero weights toward **dynamic, query-dependent computation selection**. Attention indexers, KV selectors, activation predictors, and MoE routers now make sparsity a scheduling and memory-hierarchy problem.

## 6.1 Formal patterns

For N:M weight sparsity, every group of \(M\) weights contains \(N\) nonzeros:

\[
\forall g,\quad \|W_g\|_0=N,
\qquad
\rho_0=1-\frac{N}{M}.
\]

Thus 2:4, 4:8, 8:16, and 16:32 all represent 50% zeros; 1:4 represents 75% zeros. These patterns are numerically identical in density but not necessarily in kernel support.

Dynamic sparse attention selects a subset of keys or blocks:

\[
s_{t,j}=f_\phi(q_t,k_j),
\qquad
\mathcal I_t=\operatorname{TopK}_j(s_{t,j}),
\]

\[
o_t=\sum_{j\in\mathcal I_t}
\operatorname{softmax}_{j\in\mathcal I_t}
\left(\frac{q_tk_j^\top}{\sqrt d}\right)v_j.
\]

The system wins only if index construction, irregular gather, KV movement, and sparse attention cost less than dense attention:

\[
T_{\mathrm{index}}+T_{\mathrm{gather}}+T_{\mathrm{sparse-attn}}
< T_{\mathrm{dense-attn}}.
\]

MoE sparsity uses routed experts:

\[
\mathcal E_t=\operatorname{TopK}_e r_e(h_t),
\qquad
y_t=\sum_{e\in\mathcal E_t}g_e(h_t)E_e(h_t).
\]

The active-expert ratio \(k/E\) does not equal the full-model compute ratio because attention, embeddings, shared experts, routing, communication, and load imbalance remain.

## 6.2 Sparsity domains

| Domain | Technique classes |
|---|---|
| Weights | unstructured; N:M; block; channel; structural |
| Activations | ReLU/SwiGLU zero skipping; magnitude thresholding; predicted neurons; contextual sparsity |
| Attention | local; sliding; dilated; block; top-k; indexer-based; N:M softmax; skip-softmax |
| KV cache | eviction; compression; selection; merging; hierarchical HBM/DRAM/SSD placement |
| Tokens | token dropping; token merging; early exit |
| Experts | top-1/top-2/top-k MoE; expert pruning; shared experts; conditional expert execution |

## 6.3 Evolution, 2023–2026

| Year | Publicly named techniques |
|---|---|
| 2023 | H2O; StreamingLLM; Scissorhands; Keyformer; Deja Vu; PowerInfer; SparQ |
| 2024 | CATS; TEAL; ShadowLLM; PowerInfer-2; MInference; Quest; SnapKV; PyramidKV; DuoAttention; RazorAttention; SeerAttention; HiP Attention |
| 2025 | NSA; MoBA; FlexPrefill; XAttention; SparsePrefill; SpargeAttn; HiSparse; Native Sparse Attention; SparseServe; activation-aware KV sparsity |
| 2026: implemented/runtime-visible | DeepSeek Sparse Attention/DSA; MiniMax Lightning Attention; MiniMax M3 MSA; NVIDIA Attention Sparsity; N:M Sparse Softmax; Skip-Softmax; AITER Sparse MLA; FlashMLA Sparse |
| 2026: research frontier | SPIN; OBCache; WIDE; VSA; hierarchical sparse-attention memory co-design |

Primary examples include [H2O](https://arxiv.org/abs/2306.14048), [StreamingLLM](https://arxiv.org/abs/2309.17453), [PowerInfer](https://arxiv.org/abs/2312.12456), [MInference](https://arxiv.org/abs/2407.02490), [SnapKV](https://arxiv.org/abs/2404.14469), [NSA](https://arxiv.org/abs/2502.11089), [SparseServe](https://arxiv.org/abs/2509.24626), and [SPIN](https://arxiv.org/abs/2604.26837).

## 6.4 Current implementation map

### vLLM

vLLM exposes model-specific sparse-attention implementations including DSA/sparse MLA and MiniMax M3 block-sparse GQA with a lightning indexer. ROCm includes an AITER sparse-MLA backend. These are not generic switches that make an arbitrary dense-attention model sparse; they execute model architectures trained for the corresponding sparse mechanism. See [vLLM attention backend support](https://docs.vllm.ai/en/latest/design/attention_backends/).

### SGLang

SGLang exposes DSA with separate prefill and decode backends, including FlashMLA Sparse, FP8 sparse prefill, TensorRT-LLM kernels, TileLang, and AITER. HiSparse supplies a hierarchical sparse-attention interface. See [SGLang attention backends](https://docs.sglang.ai/advanced_features/attention_backend.html).

### NVIDIA

ModelOpt exposes calibration-driven attention sparsity, N:M sparse-softmax kernels, skip-softmax execution, and VSA for video diffusion. NVIDIA hardware also supplies 2:4 Sparse Tensor Core execution. These are separate weight- and attention-sparsity paths and should not be merged into a single “sparse model” label. See the [ModelOpt changelog](https://nvidia.github.io/Model-Optimizer/reference/0_changelog.html).

### AMD

AITER supplies sparse MLA/DSA kernels on ROCm; hipSPARSE and hipSPARSELt provide sparse linear-algebra substrates. SGLang’s TileLang/AITER DSA and vLLM’s ROCm AITER sparse MLA are the clearest current public serving integrations.

### llama.cpp

llama.cpp supports sparse-by-architecture mechanisms such as MoE expert routing and sliding-window models where implemented, but it does not provide a universal dynamic sparse-attention or unstructured sparse-weight engine comparable to the model-specific DSA integrations above.

### Model producers

DeepSeek developed NSA and deployed DSA-family architectures. MiniMax deployed lightning-indexer block-sparse attention. MoE model producers including DeepSeek, Qwen, Kimi, MiniMax, Meta, and Mistral use expert sparsity, but their router, shared-expert, capacity, and communication designs differ. OpenAI and Anthropic do not publicly disclose enough of the hosted-model execution stack to assign their production systems to a specific public sparse-attention algorithm.

## 6.5 Evaluation

Sparsity evaluation must report:

- nominal and realized weight sparsity;
- pattern compliance and compressed-layout bytes;
- active-neuron, active-token, active-block, and active-expert ratios;
- attention recall against dense top attention mass;
- KV retention and HBM/DRAM/SSD traffic;
- index construction, gather, transfer, and sparse-kernel time;
- MoE routing entropy, expert load balance, dropped tokens, and all-to-all time;
- quality versus context length and retrieval distance;
- TTFT, TPOT, throughput, batch capacity, and energy;
- dense fallback frequency and crossover context length.

### Note

`Sparse FLOPs are not free FLOPs. Irregular memory access, metadata, index construction, branch divergence, and accelerator underutilization can erase the arithmetic reduction. Dynamic sparse attention becomes valuable only beyond a workload-dependent context-length crossover. KV offloading can increase capacity and still harm TPOT through PCIe or network traffic. MoE reduces active compute but increases parameter memory and communication. The correct metric is end-to-end useful-token throughput under a quality constraint.`

---

# 7. Cross-stack ownership: who is working where

| Organization or stack | Quantization | Pruning | Distillation | Speculative decoding | Sparsity |
|---|---|---|---|---|---|
| vLLM Project / Red Hat–Neural Magic | LLM Compressor; compressed-tensors; Marlin; AWQ; GPTQ; FP8; INT8; INT4; ModelOpt; Quark; TorchAO; GGUF | SparseGPT/OWL legacy APIs; structurally pruned-model serving | Speculators for draft training | EAGLE; MTP; PARD; MLP; N-Gram; Suffix; DFlash; DSpark; dynamic/adaptive verification | DSA; MiniMax M3 MSA; ROCm AITER sparse MLA |
| SGLang / LMSYS | FP8; MXFP4; W8A8; AWQ; GPTQ; Marlin; compressed-tensors; ModelOpt; Quark; Petit; GGUF | compact-model serving, not a pruning pipeline | SpecForge draft training | EAGLE-2/3; FR-Spec; MTP; DFlash; standalone; N-Gram; overlap scheduling | DSA; HiSparse; FlashMLA Sparse; TileLang; AITER |
| NVIDIA | NVFP4; FP8; MXFP4/MXFP8; ModelOpt; TensorRT-LLM; AWQ; GPTQ; SmoothQuant; QAD | Minitron; Puzzletron; 2:4 execution | logit KD; JSD KD; Liger KD; Megatron-Bridge KD; QAD | Draft-Target; Medusa; ReDrafter; EAGLE; MTP; N-Gram; Lookahead; DFlash training | Sparse Tensor Cores; attention sparsity; N:M softmax; skip-softmax; VSA |
| AMD | Quark; AITER; FP8; MXFP4; AWQ; GPTQ; SmoothQuant; rotation; INT4FP8 MoE | hipSPARSE/hipSPARSELt execution substrate | framework-level PyTorch training | ROCm vLLM/SGLang MTP and EAGLE paths | AITER sparse MLA; DSA; hipSPARSE; hipSPARSELt |
| ggml / llama.cpp | GGUF legacy/K/I/T quants; imatrix; MXFP4; NVFP4 | no generic sparse-weight speedup | consumes distilled checkpoints | Draft; EAGLE-3; MTP; DFlash; DSpark; five N-Gram variants | architecture-specific MoE/SWA |
| Intel | AutoRound; Neural Compressor; INT8; INT4; CPU AMX paths | Neural Compressor pruning | Neural Compressor KD | no major native public proposer family | CPU sparse primitives |
| PyTorch / Meta | TorchAO; Float8; INT8/INT4; SpinQuant integrations | TorchAO sparsity; structured model work | training ecosystem | LayerSkip | semi-structured sparsity; FlexAttention substrate |
| Google DeepMind | AQT/TPU quantization research | research/tool-specific | GKD | Speculative Sampling | sparse/mixture research; XLA execution |
| Microsoft | SmoothQuant; Olive; ONNX Runtime; OCP MX; MiniLLM-adjacent numerical work | research and ONNX graph optimization | MiniLLM | runtime integrations through ONNX ecosystem | contextual/serving research |
| Hugging Face / bitsandbytes | NF4; QLoRA; INT8; INT4; Quanto; Optimum integrations | trainer/ecosystem integrations | Trainer and synthetic-data workflows | assisted generation | ecosystem integrations |
| Huawei / Ascend | ModelSlim; W4A4; W8A8; MXFP4; MXFP8 | ModelSlim paths | framework-specific | NEXTN/MTP through SGLang | model-specific sparse attention |
| DeepSeek | FP8 block scaling | model-specific compression research | R1 Distill | MTP; DSpark ecosystem | NSA; DSA; MoE expert sparsity |
| OpenAI | MXFP4 open-weight deployment; hosted precision undisclosed | undisclosed | documented response/SFT distillation | hosted implementation undisclosed | hosted implementation undisclosed |
| Anthropic | hosted implementation undisclosed | undisclosed | undisclosed | undisclosed | undisclosed |

“Undisclosed” is an evidence result, not a missing guess.

---

# 8. Evaluation must follow the causal path

The same benchmark protocol cannot be copied blindly across the five directions.

| Direction | Algorithmic metrics | Model-quality metrics | Systems metrics |
|---|---|---|---|
| Quantization | MSE; cosine; SQNR; saturation; clipping; scale error | perplexity; accuracy; pass@k; calibration; long-context regression | bytes; load time; VRAM; TTFT; TPOT; throughput; energy |
| Pruning | sparsity; nonzeros; dimension reduction; reconstruction loss | pre/post-recovery quality; recovery efficiency | stored bytes; kernel utilization; latency; throughput; training cost |
| Distillation | KL/JSD; logit/feature similarity; exposure-bias error | teacher gap; pass@k; calibration; safety/tool-use transfer | teacher cost; training FLOPs; student latency; output-token cost |
| Speculation | acceptance; accepted tokens/step; target calls/token; exactness | output-distribution equivalence or stated approximation | drafter/verify time; TPOT; throughput; concurrency; memory |
| Sparsity | density; attention recall; KV retention; expert balance | quality versus context/distance/sparsity | index/gather/transfer time; batch capacity; crossover length; throughput |

A minimum shared benchmark suite should include language modeling, knowledge, reasoning, code, long-context retrieval, instruction following, safety, and systems workloads. Useful public components include lm-evaluation-harness, MMLU-Pro, GSM8K, MATH-500, AIME, HumanEval, MBPP, SWE-bench, LongBench, RULER, MT-Bench, Arena-Hard, TruthfulQA, HellaSwag, and ARC-Challenge. No single aggregate score is sufficient.

The systems protocol must lock:

- model and checkpoint revision;
- tokenizer and prompt template;
- precision of non-quantized modules;
- context and output-length distributions;
- batch/concurrency distribution;
- tensor, pipeline, data, and expert parallel configuration;
- kernel/backend versions;
- warmup and CUDA-graph state;
- prefix-cache state;
- speculative configuration;
- power and clock policy; and
- quality tolerance.

Without this ledger, a speedup is not reproducible.

---

# 9. What is state of the art in August 2026?

There is no single winner. The frontier depends on the optimization constraint.

| Objective | Strong current direction | Why |
|---|---|---|
| Hopper production throughput | FP8 W8A8, block/rowwise scaling | native execution, mature kernels, stable quality |
| Blackwell maximum compression | NVFP4 or MXFP4 co-designed checkpoint and kernel | native FP4/microscaling execution |
| Ampere/Ada memory-constrained serving | AWQ-Marlin or GPTQ-Marlin W4A16 | mature weight-only INT4 path |
| CPU/edge portability | GGUF Q4_K/Q5_K/IQ families | broad backend and model ecosystem |
| Portable architectural reduction | structured depth/width pruning plus distillation | dense smaller shapes execute broadly |
| Reasoning-student transfer | filtered response/CoT distillation plus on-policy correction | transfers task behavior while addressing exposure bias |
| Low-QPS autoregressive latency | EAGLE-3, native MTP, DFlash/DSpark where supported | multiple accepted tokens per target verification |
| Repetitive/code workloads | N-Gram, suffix, prompt lookup | very low proposer cost |
| Long-context decode | model-native DSA/NSA/indexer attention plus hierarchical KV management | reduces attended KV working set |
| Sparse weight acceleration | hardware-conforming 2:4 or structural pruning | arbitrary unstructured zeros remain difficult to accelerate |
| MoE efficiency | top-k routing plus optimized expert parallelism/load balance | reduces active MLP compute while managing communication |

This table describes the strongest **directions**, not universal model-independent prescriptions. Every row still requires model- and workload-specific validation.

---

# 10. The deeper pattern

From 2023 to 2026, efficiency research converged on a common principle:

\[
\boxed{
\text{algorithmic reduction}
\neq
\text{system speedup}
}
\]

The equality requires an execution path:

\[
\boxed{
\text{model transformation}
+\text{representation}
+\text{kernel}
+\text{hardware}
+\text{scheduler}
+\text{quality control}
\rightarrow
\text{useful end-to-end efficiency}
}
\]

Quantization exposed this first: bit width without scaling and kernel information is meaningless. Pruning exposed it next: zero weights without sparse execution are not faster. Distillation showed that parameter count is not the same as task cost. Speculative decoding made scheduler behavior part of an inference algorithm. Sparse attention made memory hierarchy and data movement part of model architecture.

The most important 2026 development is therefore not any single acronym. It is the collapse of the boundary between model algorithm and inference system. The strongest methods are designed with their serializer, runtime, kernels, accelerator, and evaluation harness from the beginning.

That is the durable map of the field.

---

## Primary source spine

### Runtimes and vendor toolchains

- [vLLM quantization](https://docs.vllm.ai/en/latest/features/quantization/)
- [vLLM speculative decoding](https://docs.vllm.ai/en/latest/features/speculative_decoding/)
- [vLLM attention backends](https://docs.vllm.ai/en/latest/design/attention_backends/)
- [SGLang quantization](https://docs.sglang.io/docs/advanced_features/quantization)
- [SGLang speculative decoding](https://docs.sglang.io/docs/advanced_features/speculative_decoding)
- [SGLang attention backends](https://docs.sglang.ai/advanced_features/attention_backend.html)
- [TensorRT-LLM quantization](https://nvidia.github.io/TensorRT-LLM/latest/features/quantization.html)
- [TensorRT-LLM speculative decoding](https://nvidia.github.io/TensorRT-LLM/advanced/speculative-decoding.html)
- [NVIDIA Model Optimizer](https://github.com/NVIDIA/Model-Optimizer)
- [NVIDIA ModelOpt pruning](https://github.com/NVIDIA/Model-Optimizer/blob/main/examples/pruning/README.md)
- [NVIDIA ModelOpt changelog](https://nvidia.github.io/Model-Optimizer/reference/0_changelog.html)
- [llama.cpp quantization structures](https://github.com/ggml-org/llama.cpp/blob/master/ggml/src/ggml-common.h)
- [llama.cpp speculative decoding](https://github.com/ggml-org/llama.cpp/blob/master/docs/speculative.md)
- [AMD MXFP4/MXFP6](https://rocm.blogs.amd.com/software-tools-optimization/mxfp4-mxfp6-quantization/README.html)
- [OpenAI larger-to-smaller-model distillation](https://developers.openai.com/api/docs/guides/supervised-fine-tuning#distilling-from-a-larger-model)
- [DeepSeek-R1 distillation](https://github.com/deepseek-ai/deepseek-r1)

### Core research anchors

- [AWQ](https://arxiv.org/abs/2306.00978)
- [OmniQuant](https://arxiv.org/abs/2308.13137)
- [AQLM](https://arxiv.org/abs/2401.06118)
- [QuaRot](https://arxiv.org/abs/2404.00456)
- [SpinQuant](https://arxiv.org/abs/2405.16406)
- [SparseGPT](https://arxiv.org/abs/2301.00774)
- [Wanda](https://arxiv.org/abs/2306.11695)
- [Minitron](https://arxiv.org/abs/2407.14679)
- [DarwinLM](https://arxiv.org/abs/2502.07780)
- [MiniLLM](https://arxiv.org/abs/2306.08543)
- [GKD](https://arxiv.org/abs/2306.13649)
- [DistiLLM](https://arxiv.org/abs/2402.03898)
- [Speculative Decoding](https://arxiv.org/abs/2302.01318)
- [EAGLE](https://arxiv.org/abs/2401.15077)
- [EAGLE-3](https://arxiv.org/abs/2503.01840)
- [DFlash](https://arxiv.org/abs/2602.06036)
- [H2O](https://arxiv.org/abs/2306.14048)
- [PowerInfer](https://arxiv.org/abs/2312.12456)
- [MInference](https://arxiv.org/abs/2407.02490)
- [NSA](https://arxiv.org/abs/2502.11089)
- [SPIN](https://arxiv.org/abs/2604.26837)

---

**Scope limitation.** This registry covers publicly named LLM/VLM efficiency methods with primary technical evidence through August 15, 2026. It excludes undisclosed proprietary methods, pure vision/diffusion-only techniques unless an examined runtime exposes them, abandoned names without an auditable source, and papers whose central contribution is evaluation rather than a new efficiency mechanism.
