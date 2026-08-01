# Source-Audited Reconstruction of Training Objectives: DeepSeek, Qwen, and Kimi

**Evidence semantics**

* **[EQUATION-VERIFIED]** exact mathematical objective is published.
* **[CODE-VERIFIED]** released implementation/configuration establishes the mechanism.
* **[REPORTED]** first-party source states the mechanism.
* **[INHERITED]** the current generation explicitly inherits the mechanism.
* **[DERIVED]** follows mathematically from reported mechanisms but is not printed verbatim.
* **[UNDISCLOSED]** public first-party evidence is insufficient.

The object being reconstructed is the stage transition

[
(\theta_s,\mathcal D_s,\pi_s,\mathcal E_s,\xi_s)
\xrightarrow{\mathcal J_s}
(\theta_{s+1},\mathcal D_{s+1},\pi_{s+1},\mathcal E_{s+1},\xi_{s+1}),
]

where (\xi_s) denotes non-gradient training state such as MoE routing biases, rollout state, quantization state, or teacher scheduling state.

There is **no valid global objective**

[
\mathcal L_{\rm pre}+\mathcal L_{\rm SFT}+\mathcal L_{\rm RL}.
]

These are different optimization problems over different distributions and, frequently, different parameter/state spaces.

---

# 1. Executive technical finding

The three lineages have converged on **sequential, distribution-changing optimization programs**, but their current endpoints expose substantially different levels of mathematical detail.

**DeepSeek-V4** has the cleanest separation between foundation optimization and post-training consolidation. Foundation training retains DeepSeekMoE and the sequential MTP mechanism from V3, while combining gradient-based sequence balancing with a separate auxiliary-loss-free expert-load controller. Its training curriculum expands context to one million tokens and transitions from dense to sparse attention. Post-training no longer terminates in a heterogeneous mixed-RL policy: domain specialists are independently SFT-initialized and RL-optimized, then collapsed into one policy through **student-on-policy, full-vocabulary reverse-KL distillation from more than ten teachers**. FP4 QAT is integrated into that post-training trajectory rather than represented as a fictitious additive quantization loss.

**Qwen3.6** is the current open-weight Qwen endpoint, but its released artifacts expose architecture and broad pre/post-training status rather than an auditable scalar training program. It contains a multimodal causal model and trained multi-step MTP, but the current MTP objective, coefficients, MoE balancing objective, SFT masking, RL estimator, reward decomposition, distillation estimator, and speculative-training objective are **UNDISCLOSED**. The last Qwen generation with a substantially reconstructable post-training program is Qwen3: three-stage pretraining; small long-CoT cold start; reasoning GRPO; continual SFT to fuse thinking/non-thinking policies; then general RL. Smaller models instead receive off-policy response transfer followed by on-policy logit distillation. Importantly, the Qwen report names GRPO but does **not** establish equivalence to DeepSeek's exact GRPO estimator.

**Kimi K3** exposes the most structurally integrated pipeline: native text-vision pretraining under a common autoregressive target, auxiliary-loss-free Quantile Balancing, progressively expanded context, SFT that already contains tool and long-horizon trajectories, QAT beginning at SFT, specialization into domain × reasoning-effort RL policies, then **multi-teacher on-policy distillation as token-level RL reward**. Long agent trajectories are supported by partial rollout and persistent execution state. Its speculative drafter is explicitly trained from the pretrained MTP pathway, but unlike ordinary MTP supervision it directly minimizes negative log distribution overlap with the frozen target—therefore optimizing the one-step lossless speculative acceptance probability.

The strongest cross-family distinction is therefore not “which uses SFT/RL/distillation.” It is **what distribution generates the gradient** and **what divergence or policy estimator is applied to that distribution**.

---

# 2. Source/version ledger

| Family   | Model / lineage evidence       | Primary source                                  | Relevant disclosure                                                                                                                                                   |
| -------- | ------------------------------ | ----------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| DeepSeek | **DeepSeek-V4-Pro / V4-Flash** | V4 technical report + official model repository | Current architecture, MTP inheritance, routing, long-context curriculum, specialist SFT/RL, GRM, OPD, QAT, post-training systems.                                     |
| DeepSeek | DeepSeek-V3                    | Technical report                                | Exact MTP equations, routing bias controller, sequence balance loss inherited by V4.                                                                                  |
| DeepSeek | DeepSeek-V3.2                  | Technical report                                | Exact earlier GRPO estimator, off-policy masking, routing/sampling consistency; relevant only where V4 says its infrastructure/pipeline derives from this lineage.    |
| DeepSeek | DSpark / DeepSpec              | Official paper + repository                     | Separately trained speculative drafter, CE + TV + confidence objectives, target frozen, deployment with V4.                                                           |
| Qwen     | **Qwen3.6-35B-A3B**            | Official model repository                       | Current open-weight multimodal checkpoint; pretraining/post-training status and architecture. Detailed training objective not released.                               |
| Qwen     | Qwen3                          | Technical report                                | Last fully documented general-model pretraining/post-training lineage: cold-start SFT, reasoning GRPO, thinking-mode fusion, general RL, strong-to-weak distillation. |
| Kimi     | **Kimi K3**                    | Technical report + official repository          | Current multimodal pretraining, QB routing, SFT, specialist RL, partial rollout, GRM, MOPD, QAT and speculative drafter.                                              |
| Kimi     | Kimi K2.5                      | Technical report                                | Exact policy estimator explicitly inherited by K3 post-training.                                                                                                      |

---

# 3. Global training-stage map

| Optimization stage                 | DeepSeek                                                                                                | Qwen                                                                                                                | Kimi                                                                                   |
| ---------------------------------- | ------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| Tokenizer/data preparation         | Corpus construction reported; exact tokenizer-training objective outside current V4 training disclosure | Qwen3 BBPE; current Qwen3.6 tokenizer-training objective **UNDISCLOSED**                                            | Multimodal corpus construction disclosed; tokenizer-training objective **UNDISCLOSED** |
| Foundation pretraining             | LM + MTP + tiny sequence-balancing term; external routing controller                                    | Current causal multimodal pretraining + MTP reported; exact scalar **UNDISCLOSED**                                  | Native text+vision NTP; one MTP layer present                                          |
| Multimodal pretraining             | No native multimodal V4 stage reported                                                                  | Present in current lineage; exact current loss decomposition **UNDISCLOSED**                                        | Native from initialization under common NTP                                            |
| MoE balance                        | Auxiliary-loss-free routing bias + small differentiable balance term                                    | Current exact mechanism **UNDISCLOSED**; Qwen3 used global-batch balance loss                                       | Quantile Balancing; non-gradient controller                                            |
| Mid-training                       | No separately named generic stage required                                                              | Qwen3 knowledge-intensive second pretraining phase                                                                  | Integrated curriculum rather than separately named mid-training                        |
| Continued/domain pretraining       | Distribution/curriculum changes inside foundation training                                              | Qwen3 knowledge-intensive data stage                                                                                | Domain mixture integrated into foundation training                                     |
| Long-context training              | Context curriculum culminating in million-token sequences                                               | Current native long context; Qwen3 previous detailed lineage performs explicit long-context phase                   | 8K→64K pretraining, then 256K→1M cooldown                                              |
| Reasoning cold start               | Specialist SFT; earlier lineage explicitly uses agentic/reasoning cold start                            | Small long-CoT SFT                                                                                                  | Broad high-quality SFT including reasoning and agent trajectories                      |
| SFT/instruction tuning             | Per-specialist initial SFT                                                                              | Cold start + later thinking-mode fusion SFT                                                                         | One broad SFT before specialist RL                                                     |
| Tool/agent SFT                     | Yes                                                                                                     | General/posttraining capabilities reported; current exact mixture **UNDISCLOSED**                                   | Yes, explicit long-horizon/tool trajectories                                           |
| Rejection/self-generated data      | Earlier V3.2 lineage; current exact specialist mixture **UNDISCLOSED**                                  | Explicit rejection-sampling for fusion SFT                                                                          | Synthetic specialist trajectories + verification/human filtering                       |
| Reasoning RL                       | Specialist GRPO                                                                                         | Qwen3 reasoning GRPO                                                                                                | Domain×effort specialist RL                                                            |
| General RL                         | Specialists; final mixed-RL consolidation replaced by OPD                                               | Qwen3 general-domain RL                                                                                             | General-task specialist policies                                                       |
| Agent/tool/environment RL          | Explicit agent specialists and sandbox infrastructure                                                   | General RL includes agent tasks; current asynchronous agentic training reported but exact objective **UNDISCLOSED** | Explicit general-agent and coding-agent RL                                             |
| Reward model / GRM                 | Rules/test cases + actor-based GRM; avoids conventional scalar RM for hard-to-verify tasks              | Rule reward + LLM evaluator + scalar preference RM in documented Qwen3 lineage                                      | Rule/env reward + GRM tournament evaluation                                            |
| Standalone preference optimization | **No separate disclosed stage**                                                                         | **No separate disclosed DPO-like stage**                                                                            | **No separate disclosed stage**                                                        |
| Offline distillation               | Not final V4 merger                                                                                     | Qwen3 small models: teacher-response transfer                                                                       | Not the final K3 consolidation mechanism                                               |
| Multi-teacher distillation         | **Yes, >10 teachers**                                                                                   | Teacher identity depends on small model; multi-teacher current stage **UNDISCLOSED**                                | **Yes, 9 specialist teachers**                                                         |
| On-policy distillation             | **Exact full-vocab reverse KL**                                                                         | Yes, logits alignment; exact divergence direction **UNDISCLOSED**                                                   | Token-reward MOPD                                                                      |
| Off-policy distillation            | No final V4 stage reported                                                                              | Yes, teacher-generated response distillation                                                                        | No distinct final K3 off-policy stage                                                  |
| QAT                                | FP4 during posttraining                                                                                 | Current details **UNDISCLOSED**                                                                                     | SFT onward through RL/drafter                                                          |
| MTP                                | Inherited sequential MTP, depth 1                                                                       | Current MTP trained for multiple steps; objective **UNDISCLOSED**                                                   | One pretrained MTP layer                                                               |
| Separate speculative drafter       | DSpark                                                                                                  | **UNDISCLOSED** for current model                                                                                   | Yes                                                                                    |
| Acceptance-oriented draft loss     | DSpark uses total-variation component + confidence target                                               | **UNDISCLOSED**                                                                                                     | Exact negative-log overlap                                                             |
| Modern non-legacy stage            | Full-vocab OPD expert merger                                                                            | Thinking/non-thinking fusion; current async agentic training                                                        | Specialist lattice → MOPD; partial rollouts                                            |

---

# 4. DeepSeek reconstruction

## 4.1 Sequential optimization program

At the current endpoint, the publicly reconstructable program is

[
\boxed{
\theta_0
\xrightarrow[\mathcal D_{\rm pre}]{\mathcal L_{\rm LM}+
\mathcal L_{\rm MTP}+\mathcal L_{\rm Bal}}
\theta_{\rm base}
\xrightarrow[\mathcal D_e]{\mathcal L_{\rm SFT}^{(e)}}
\theta_e^{(0)}
\xrightarrow[\pi_e,\mathcal E_e]{\mathrm{GRPO}*e}
\theta_e
\xrightarrow[\substack{y\sim\pi*\theta\{\pi_{E_i}}}]
{\mathcal L_{\rm OPD}}
\theta_{\rm final}
}
]

with FP4 QAT active in post-training.

The first sum is **[DERIVED]**, not a verbatim published single equation: V4 reports the main language-model training regime, the inherited MTP objective and the sequence-balancing term independently. Exact token normalization/masking of the main LM term remains **UNDISCLOSED**.

A separate speculative path is

[
\theta_{\rm final};\text{frozen},
\qquad
\phi_0
\xrightarrow{\mathcal L_{\rm DSpark}}
\phi_{\rm draft}.
]

---

## 4.2 Foundation objective

### 4.2.1 Main autoregressive objective

**[REPORTED]** DeepSeek-V4 is pretrained as a causal language model.

For reconstruction purposes:

[
\mathcal L_{\rm LM}
===================

-\sum_t c_t\log p_\theta(x_t|x_{<t})
]

is only a **generic representation** of the disclosed autoregressive target.

The precise:

[
c_t,\quad
Z,\quad
\text{masking convention},\quad
\text{document-boundary handling}
]

are **UNDISCLOSED**.

They must not be fabricated as (1/T), assistant masks, packed-sequence masks, etc.

---

## 4.3 Multi-token prediction

V4 explicitly retains V3's MTP mechanism **without modification**, and its MTP depth is one.

For prediction depth (k):

[
\mathbf h_i^{\prime k}
======================

M_k
\left[
\operatorname{RMSNorm}(\mathbf h_i^{k-1});
\operatorname{RMSNorm}(\operatorname{Emb}(t_{i+k}))
\right],
]

[
\mathbf h_{1:T-k}^{k}
=====================

\operatorname{TRM}*{k}
(\mathbf h*{1:T-k}^{\prime k}),
]

[
P_{i+k+1}^{k}
=============

\operatorname{OutHead}(\mathbf h_i^k).
]

The embedding and output head are shared with the main model.

**[EQUATION-VERIFIED]**

[
\mathcal L_{\rm MTP}^{k}
========================

-\frac1T
\sum_{i=2+k}^{T+1}
\log P_i^k[t_i],
]

[
\boxed{
\mathcal L_{\rm MTP}
====================

\frac{\lambda}{D}
\sum_{k=1}^{D}
\mathcal L_{\rm MTP}^{k}
}
]

with

[
D=1.
]

V4 sets

[
\lambda =
\begin{cases}
0.3,&\text{most foundation training},\
0.1,&\text{after LR decay begins}.
\end{cases}
]

The modules can be removed from ordinary inference or reused as speculative prediction components.

This is important:

[
\boxed{\text{MTP training}\neq\text{DSpark training}}
]

even though both may participate in speculative inference.

---

## 4.4 MoE routing: differentiable objective versus controller state

V4 retains DeepSeek's auxiliary-loss-free balancing strategy and a small sequence-wise balance loss. It changes the affinity transform and removes the old routing-node constraint. Its earliest MoE blocks use deterministic token-ID Hash routing.

For the inherited controller, V3 defines a per-expert routing bias (b_i):

[
g'_{i,t}
========

\begin{cases}
s_{i,t},&
s_{i,t}+b_i\in
\operatorname{TopK}({s_{j,t}+b_j},K_r),\
0,&\text{otherwise}.
\end{cases}
]

The critical fact is

[
\boxed{b_i\text{ changes routing but not the expert mixture weight}}
]

because the actual gating weight derives from (s_{i,t}), not (s_{i,t}+b_i).

The controller update is external to backpropagation:

[
b_{i,n+1}
=========

\begin{cases}
b_{i,n}-\gamma,&i\text{ overloaded},\
b_{i,n}+\gamma,&i\text{ underloaded}.
\end{cases}
]

Current V4 uses

[
\gamma=10^{-3}.
]

Thus

[
b_{n+1}=F(b_n,\text{observed expert load})
]

must **not** be inserted inside

[
\theta_{n+1}
============

\theta_n-\eta\nabla_\theta \mathcal L.
]

The differentiable complementary loss is inherited:

[
\mathcal L_{\rm Bal}
====================

\alpha\sum_{i=1}^{N_r} f_iP_i,
]

[
f_i
===

\frac{N_r}{K_rT}
\sum_{t=1}^T
\mathbf1
\left[
s_{i,t}\in\operatorname{TopK}
({s_{j,t}},K_r)
\right],
]

[
s'_{i,t}
========

\frac{s_{i,t}}
{\sum_j s_{j,t}},
\qquad
P_i=\frac1T\sum_t s'_{i,t}.
]

Current V4 uses

[
\alpha=10^{-4}.
]

### Why both mechanisms exist

The gradient term penalizes severe within-sequence imbalance, whereas (b_i) controls global dispatch without forcing semantic gating scores to solve a computational load-balancing objective.

Hence

[
\underbrace{\nabla_\theta\mathcal L_{\rm Bal}}*{\text{representation pressure}}
\qquad\neq\qquad
\underbrace{\Delta b_i}*{\text{dispatch controller}}.
]

Calling DeepSeek's routing simply “no auxiliary loss” is therefore technically false: it is **primarily auxiliary-loss-free**, with a deliberately tiny residual differentiable balance objective.

---

## 4.5 Context-extension and sparse-attention curriculum

V4 does not expose a separately named “CPT loss.” The central transformation is curriculum/state change:

[
(\mathcal D,L_{\rm ctx},\text{attention regime})
\rightarrow
(\mathcal D',L_{\rm ctx}',\text{attention regime}').
]

The context schedule is

[
4\text{K}\rightarrow16\text{K}\rightarrow64\text{K}\rightarrow1\text{M}.
]

Sparse attention is not enabled from initialization. Training first uses dense attention; when sparsity is introduced, the CSA indexer receives a short warmup and sparse attention is subsequently trained for the main long-context stage. V4-Pro uses the same basic two-stage introduction strategy.

Therefore:

[
\mathcal L_{\rm long}
\not\equiv
\text{a new semantic prediction loss}.
]

The principal change is the distribution and receptive-field regime.

---

# 4.6 Specialist SFT

Current V4 post-training begins with independent specialists:

[
\theta_{\rm base}
\xrightarrow{\mathcal L_{\rm SFT}^{(e)}}
\theta_e^{(0)},
\qquad
e\in
{\text{math, code, agent, instruction, ...}}.
]

Each specialist receives high-quality domain-specific data before RL.

What is public:

* **[REPORTED]** SFT precedes specialist RL.
* **[REPORTED]** specialists are trained independently.
* **[REPORTED]** agent/tool and reasoning-oriented behavior are represented.
* **[UNDISCLOSED]** exact assistant-only mask.
* **[UNDISCLOSED]** per-token weighting.
* **[UNDISCLOSED]** EOS weighting.
* **[UNDISCLOSED]** exact sequence normalization.
* **[UNDISCLOSED]** exact SFT learning rate/steps for each specialist.
* **[UNDISCLOSED]** one exact scalar SFT equation beyond ordinary supervised autoregressive training.

Thus writing

[
\mathcal L_{\rm SFT}
====================

-\frac1{\sum m_t}\sum_t m_t\log\pi_\theta(y_t|\cdots)
]

as a DeepSeek-specific fact would exceed the evidence.

---

# 4.7 Specialist RL

Current V4 reports GRPO for specialist optimization:

[
\theta_e^{(0)}
\xrightarrow{\mathrm{GRPO},,r_e}
\theta_e.
]

Reasoning-effort variants are trained with different context/length-control regimes. Tool and agent specialists operate through explicit tool-call schemas and interleaved reasoning. For verifiable tasks, reward originates from rules/test cases; harder-to-verify tasks use rubric-conditioned generative evaluation rather than the conventional pipeline “human labels → scalar reward model.”

### Critical evidence boundary

The V4 report says specialist GRPO hyperparameters are closely aligned with earlier work, but does **not** restate the exact current estimator.

Therefore:

[
\boxed{\mathcal J_{\rm GRPO}^{\rm V4}
=\mathrm{UNDISCLOSED}}
]

at equation-level precision.

It would be incorrect to copy V3.2's expression and label it V4.

---

## 4.8 Last exact DeepSeek GRPO estimator in the lineage

The earlier V3.2 implementation gives the strongest equation-level reference.

For prompt (q), group responses (o_i\sim\pi_{\rm old}),

[
\rho_{i,t}
==========

\frac{
\pi_\theta(o_{i,t}|q,o_{i,<t})
}{
\pi_{\rm old}(o_{i,t}|q,o_{i,<t})
}.
]

Group-relative advantage was mean-centered:

[
\hat A_i
========

R_i-\frac1G\sum_{j=1}^GR_j,
]

without division by group standard deviation.

The surrogate was PPO-style token clipping plus reference KL:

[
\mathcal J_{\rm GRPO}
=====================

\mathbb E
\left[
\frac1G
\sum_i
\frac1{|o_i|}
\sum_t
\min
\left(
\rho_{i,t}\hat A_i,
\operatorname{clip}
(\rho_{i,t},1-\epsilon,1+\epsilon)\hat A_i
\right)
-------

\beta D_{\rm KL}
\right].
]

The implementation additionally introduced:

1. **sequence-level off-policy masking** for sufficiently stale negative-advantage trajectories;
2. **Keep Routing**, preserving rollout-time expert routing during learner recomputation;
3. **Keep Sampling Mask**, preserving the rollout top-(p)/top-(k) support when evaluating the learner policy;
4. a corrected importance-weighted token KL estimator.

These are not cosmetic systems choices:

[
\text{rollout/learner mismatch}
\rightarrow
\pi_{\rm behavior}\neq\pi_\theta
\rightarrow
\rho\neq1
\rightarrow
\text{biased or unstable policy gradient}.
]

The routing and sampling masks reduce an otherwise hidden mismatch between the probability measure that created the trajectory and the one reconstructed during training.

Again, this is **lineage evidence**, not proof that every V4 specialist uses the identical estimator.

---

# 4.9 Reward construction

Current V4 separates domains by reward observability.

### Verifiable

[
r(x,y)
======

r_{\rm verifier}(x,y)
]

with rule-based correctness, test cases, executable verification, or equivalent outcome checks where available.

### Hard-to-verify

Instead of requiring a separately trained scalar RM,

[
(x,y,\text{rubric})
\rightarrow
\text{GRM judgement}.
]

The actor can itself function natively as a generative reward model, and the GRM capability itself is subject to RL optimization.

Thus:

[
\boxed{
\text{reward generator}
\neq
\text{policy objective}
}
]

and a GRM judgement must not be conflated with the GRPO loss.

---

# 4.10 Multi-teacher on-policy distillation

This is the defining final consolidation step.

Student trajectories are generated by the student:

[
y\sim\pi_\theta(\cdot|x).
]

Given teachers

[
{\pi_{E_1},\ldots,\pi_{E_N}},
]

**[EQUATION-VERIFIED]**

[
\boxed{
\mathcal L_{\rm OPD}(\theta)
============================

\sum_{i=1}^{N}
w_i
D_{\rm KL}
\left(
\pi_\theta
\parallel
\pi_{E_i}
\right)
}
]

with more than ten teacher models.

This is explicitly **reverse KL**:

[
D_{\rm KL}(\pi_\theta\Vert\pi_E)
================================

\mathbb E_{y\sim\pi_\theta}
\left[
\log\pi_\theta(y)-\log\pi_E(y)
\right].
]

The relevant teacher is selected according to task context; (w_i) encodes teacher importance. Teacher weights remain physically separate during training, while capability is consolidated into one student.

### Why the sampling distribution matters

Because

[
y\sim\pi_\theta,
]

the optimizer penalizes disagreement **where the student actually visits**.

That differs structurally from teacher-forced forward-KL distillation:

[
D_{\rm KL}(\pi_E\Vert\pi_\theta)
================================

\mathbb E_{y\sim\pi_E}
[\log\pi_E-\log\pi_\theta].
]

Reverse KL is student-support weighted and therefore naturally compatible with deployment-policy trajectories.

---

## 4.11 Full vocabulary versus sampled-token distillation

DeepSeek explicitly rejects the cheaper sampled-token approximation as the final V4 mechanism.

A common approximation would insert

[
\operatorname{sg}
\left[
\log
\frac{\pi_E(y_t|s_t)}
{\pi_\theta(y_t|s_t)}
\right]
]

as a per-token policy advantage.

V4 instead computes the full-vocabulary reverse KL because the sampled estimator exhibited excessive variance and instability.

Hence:

[
\boxed{
\text{DeepSeek-V4 OPD}
======================

\text{student-on-policy}
+
\text{full-vocab}
+
\text{reverse KL}
}
]

rather than “RL-form sampled-token distillation.”

---

# 4.12 FP4 QAT

QAT is part of post-training, including teacher/reference participation where required.

Quantized components include:

* MoE expert weights: MXFP4;
* CSA indexer QK path: FP4;
* index scores: reduced from FP32 to BF16.

Optimizer master weights remain FP32. The forward computational path is approximately:

[
W_{\rm FP32}^{\rm master}
\xrightarrow{Q_{\rm FP4}}
W_{\rm FP4}
\xrightarrow{\text{lossless decode}}
W_{\rm FP8}^{\rm compute}.
]

Gradients propagate back to the master weights through the quantized simulation pathway.

There is no evidence for

[
\mathcal L_{\rm total}
======================

\mathcal L_{\rm task}
+
\lambda\mathcal L_{\rm quant}.
]

The objective need not change:

[
\boxed{
\text{QAT changes }F_\theta(x)
\text{ used by the loss, not necessarily the scalar loss itself.}
}
]

---

# 4.13 RL/OPD systems mechanics

The V4 system supports preemptible ultra-long rollouts with token-granular persistence and KV-cache state preservation.

The causal reason is optimization correctness, not merely cluster utilization:

[
\text{interrupt long trajectory}
\rightarrow
\text{regenerate from start}
\rightarrow
\text{completion probability depends on length}
\rightarrow
\mathcal D_{\rm rollout}^{\rm observed}
\neq
\mathcal D_{\pi}.
]

Resuming instead of restarting reduces interruption-induced length bias.

For multi-teacher OPD, teacher parameters are centrally stored/offloaded, sharded when loaded, and selected per batch/task. The system caches teacher hidden representations and reconstructs vocabulary logits through the prediction head, allowing full-vocabulary KL without keeping every teacher resident simultaneously.

---

# 4.14 DSpark speculative drafter

DSpark is a **separate draft-model training program**, not V4 foundation MTP.

Training sequences are generated by the target model; random anchor positions yield (\gamma)-token blocks. The target is frozen. The draft shares frozen target embeddings and LM head, while its backbone, sequential block and confidence head update.

Position weighting:

[
w_k
===

\exp\left(-\frac{k-1}{\gamma}\right).
]

### Ground-truth CE

[
\mathcal L_{\rm ce}
===================

-\sum_{k=1}^{\gamma}
w_k
\log p_k^d(x_k^*).
]

### Target-distribution matching

[
\mathcal L_{\rm tv}
===================

\sum_{k=1}^{\gamma}
w_k
\left|
p_k^d-p_k^t
\right|_1.
]

Because

[
A(p,q)
======

# \sum_v\min[p(v),q(v)]

1-\frac12|p-q|_1,
]

minimizing total variation directly increases one-step lossless speculative acceptance.

### Confidence target

[
c_k^*
=====

1-\frac12
|p_k^d-p_k^t|_1.
]

[
\mathcal L_{\rm conf}
=====================

-\sum_{k=1}^{\gamma}
w_k
\left[
c_k^*\log c_k
+
(1-c_k^*)\log(1-c_k)
\right].
]

### Total objective

[
\boxed{
\mathcal L_{\rm DSpark}
=======================

0.1\mathcal L_{\rm ce}
+
0.9\mathcal L_{\rm tv}
+
1.0\mathcal L_{\rm conf}
}
]

The confidence estimator is then calibrated and used by a hardware-aware prefix scheduler so that serving optimizes not just model-level acceptance but verification compute under batch load. DSpark is co-deployed with V4 variants.

---

# 5. Qwen reconstruction

# 5.1 Evidence boundary: current Qwen3.6 versus documented Qwen3

The current open-weight endpoint is Qwen3.6-35B-A3B. Its official repository describes it as a post-trained multimodal model. The architecture contains a hybrid sequence stack and MoE and reports MTP trained over multiple future steps.

However:

[
\boxed{
\text{Qwen3.6 exact training program}
=====================================

\mathrm{UNDISCLOSED}
}
]

for most scalar-objective details.

No evidence justifies copying Qwen3 training equations into Qwen3.6.

The following detailed reconstruction therefore distinguishes:

[
\text{current Qwen3.6 facts}
\quad\text{from}\quad
\text{last fully documented Qwen3 lineage}.
]

---

# 5.2 Current Qwen3.6 objective status

Publicly supported:

* causal language model;
* native visual input;
* pretraining and post-training;
* MoE;
* MTP trained for multiple future steps;
* long-context model.

Publicly **not** established at required precision:

[
\mathcal L_{\rm NTP}^{3.6},
\quad
\mathcal L_{\rm MTP}^{3.6},
\quad
\lambda_{\rm MTP},
]

[
\mathcal L_{\rm balance}^{3.6},
\quad
\mathcal L_{\rm SFT}^{3.6},
\quad
\mathcal J_{\rm RL}^{3.6},
]

[
r^{3.6},
\quad
\mathcal L_{\rm distill}^{3.6},
\quad
\mathcal L_{\rm draft}^{3.6}.
]

All are **UNDISCLOSED** at exact equation level.

This is a substantive finding, not a missing reconstruction.

---

# 5.3 Last reconstructable Qwen foundation pipeline

The Qwen3 base pipeline is:

[
\theta_0
\xrightarrow[\mathcal D_{\rm general}]{\mathcal L_{\rm pre}}
\theta_1
\xrightarrow[\mathcal D_{\rm knowledge}]{\mathcal L_{\rm pre}}
\theta_2
\xrightarrow[\mathcal D_{\rm long}]{\mathcal L_{\rm pre}}
\theta_{\rm base}.
]

The stages differ primarily by data and context regime rather than by a published new scalar objective. The report describes a large general phase, a knowledge-intensive STEM/code/reasoning phase, then long-context training that expands context from 4K to 32K.

Therefore:

[
\boxed{
\mathcal D_1\neq\mathcal D_2\neq\mathcal D_3
}
]

does not imply

[
\mathcal L_1\neq\mathcal L_2\neq\mathcal L_3.
]

The exact causal-LM mask and normalization are **UNDISCLOSED**.

---

# 5.4 Data-generation pipeline

Qwen3 pretraining includes large amounts of synthetic data. Qwen models specialized for math and coding synthesize domain text, while a Qwen vision-language system performs document text recognition before another Qwen model refines extracted text. The final Qwen3 foundation model itself is not thereby receiving a multimodal objective: multimodal models are used upstream in corpus construction.

This distinction is essential:

[
\boxed{
\text{multimodal corpus generation}
\neq
\text{multimodal model training}.
}
]

Current Qwen3.6 is multimodal; Qwen3's documented base pipeline is not.

---

# 5.5 MoE balancing

Qwen3 MoE uses 128 routed experts and activates eight per token, with no shared expert.

It explicitly uses a **global-batch load-balancing loss**.

But:

[
\boxed{
\mathcal L_{\rm global-balance}
===============================

\mathrm{UNDISCLOSED}
}
]

at equation and coefficient level in the report.

It must not be replaced by DeepSeek's (f_iP_i) expression.

---

# 5.6 Flagship post-training state machine

For the documented flagship Qwen3 models:

[
\boxed{
\theta_{\rm base}
\xrightarrow{\text{Long-CoT SFT}}
\theta_1
\xrightarrow{\text{Reasoning GRPO}}
\theta_2
\xrightarrow{\text{Thinking-Mode Fusion SFT}}
\theta_3
\xrightarrow{\text{General RL}}
\theta_{\rm final}
}
]

This ordering is semantically important.

---

# 5.7 Long-CoT cold start

Training prompts come from math, code, logic and general STEM tasks possessing verifiable reference answers or test cases.

The data-production pipeline is:

[
x
\rightarrow
\text{query filtering}
\rightarrow
{y_1,\ldots,y_N}\sim\pi_{\rm teacher}
\rightarrow
\text{verification/filtering}
\rightarrow
\mathcal D_{\rm cold}.
]

Teacher failures may be inspected by human annotators. Candidate responses are removed for incorrect answers, repetition, guessing, reasoning/summary inconsistency, undesirable language mixing, and likely benchmark overlap.

Only a deliberately small subset and few training steps are used.

Mechanistically:

[
\text{small SFT}
\rightarrow
P_{\theta_1}
(\text{productive long reasoning}|x)>0
]

so subsequent on/off-policy exploration has access to useful reasoning trajectories without overly constraining policy support.

That causal interpretation is explicitly supported by Qwen's stated objective of instilling basic reasoning patterns while preserving room for RL improvement.

Exact SFT mask and normalization:

[
\boxed{\mathrm{UNDISCLOSED}}.
]

---

# 5.8 Reasoning RL

Queries are selected to be:

* absent from cold-start training,
* learnable,
* difficult,
* broadly distributed across subdomains.

The report states GRPO and explicitly reports:

* large batch;
* many rollouts per prompt;
* off-policy training for sample efficiency;
* entropy management to prevent degradation.

Thus:

[
x\sim\mathcal D_{\rm verifier},
\qquad
y_i\sim\pi_{\rm behavior}(\cdot|x)
]

is supported.

But the following remain **UNDISCLOSED**:

[
A_i,
\qquad
\rho_{i,t},
\qquad
\epsilon_{\rm clip},
]

[
\beta_{\rm KL},
\qquad
\pi_{\rm ref},
\qquad
H(\pi),
]

[
\text{token-vs-sequence normalization},
\qquad
\text{off-policy correction}.
]

Consequently,

[
\boxed{
\text{Qwen GRPO}
\not\equiv
\text{DeepSeek GRPO by name alone}.
}
]

---

# 5.9 Thinking-mode fusion SFT

After reasoning RL, Qwen does **not** immediately finalize the policy.

It performs continual SFT:

[
\theta_2
\xrightarrow{
\mathcal D_{\rm think}\cup
\mathcal D_{\rm nonthink}
}
\theta_3.
]

Thinking trajectories are generated by **rejection sampling with the reasoning-RL model itself** over earlier queries.

Thus:

[
y_{\rm think}
\sim
\pi_{\theta_2},
]

followed by filtering.

Non-thinking data cover coding, mathematics, instruction following, multilingual tasks, creative writing, QA and role-playing.

The chat grammar introduces `/think` and `/no_think`; non-thinking examples retain an empty thinking block to maintain format consistency.

The resulting stage is more than “another SFT.”

It solves:

[
\text{reasoning-specialized policy}
+
\text{fast direct-answer policy}
\rightarrow
\text{single conditionally controlled policy}.
]

---

# 5.10 General RL

General RL comes **after** fusion.

Its task set spans instruction following, structured output, preference-oriented behavior, agent interactions with environment feedback, and specialized scenarios including retrieval-oriented tasks.

The documented reward mechanisms include:

[
r=
\begin{cases}
r_{\rm rule},\
r_{\rm judge}(x,y,y^*),\
r_{\rm scalar-RM}(x,y).
\end{cases}
]

The second uses an LLM evaluator supplied with a reference answer; the third is a scalar reward model trained from human preference information.

There is no evidence that these are simply summed into one fixed scalar:

[
r_{\rm total}
=============

r_{\rm rule}
+r_{\rm judge}
+r_{\rm RM}
]

for every sample.

Rather, reward construction is task-dependent.

The exact policy estimator for the general-RL stage remains **UNDISCLOSED**.

---

# 5.11 Strong-to-weak distillation

Small Qwen3 models do not necessarily replay the full four-stage flagship program.

The documented path contains **two fundamentally different distributions**.

### Off-policy response distillation

Teacher responses are generated under both thinking modes:

[
y\sim\pi_T(\cdot|x).
]

The student receives supervised sequence targets.

At the abstraction supported by the source:

[
\mathcal L_{\rm off}
\propto
-\log\pi_S(y|x),
\qquad y\sim\pi_T.
]

Exact sequence/token normalization remains undisclosed.

### On-policy logit distillation

Student generates the trajectory:

[
y\sim\pi_S(\cdot|x),
]

then teacher and student output distributions are aligned at those states.

Reported teachers include flagship Qwen models.

Formally the source establishes:

[
\mathcal L_{\rm on}
===================

D(
\pi_S(\cdot|s),
\pi_T(\cdot|s)
)
]

but does **not** establish enough information to claim:

[
D=D_{\rm KL}(\pi_S\Vert\pi_T)
]

rather than the opposite direction, nor disclose temperature/full-vocabulary approximation with sufficient precision.

Those fields remain **UNDISCLOSED**.

---

# 5.12 Qwen-specific stage audit

**Explicitly established**

* general foundation pretraining;
* domain/knowledge-intensive continuation;
* long-context continuation;
* MoE balance loss in documented Qwen3;
* reasoning cold-start SFT;
* reasoning GRPO;
* off-policy RL use;
* thinking/non-thinking fusion SFT;
* rejection sampling;
* general RL;
* rule/judge/preference reward pathways;
* offline response distillation;
* on-policy logit distillation;
* current multimodal model;
* current MTP.

**Not established at current endpoint**

* exact multimodal scalar;
* exact MTP loss;
* MTP coefficient;
* exact GRPO estimator;
* current SFT masking;
* exact off-policy correction;
* current QAT mechanism;
* dedicated speculative drafter objective;
* acceptance-rate loss;
* standalone DPO-like preference stage.

---

# 6. Kimi reconstruction

# 6.1 Sequential program

The current K3 pipeline can be represented as

[
\boxed{
\theta_0
\xrightarrow[\text{text+vision}]{\mathcal L_{\rm NTP}+[\mathcal L_{\rm MTP}]}
\theta_{\rm base}
\xrightarrow[\mathcal D_{\rm SFT}]{\mathcal L_{\rm SFT},;\mathrm{QAT}}
\theta_{\rm SFT}
\xrightarrow{\mathrm{RL}*{d,e}}
{\theta*{d,e}}*{d,e}
\xrightarrow[;y\sim\pi*\theta;]{\mathrm{MOPD}}
\theta_{\rm final}
}
]

where (d) indexes capability domain and (e) reasoning effort.

A separate draft path is

[
\phi_{\rm MTP}
\rightarrow
\phi_{\rm EAGLE-like}
\xrightarrow{\mathcal L_{\rm LK}}
\phi_{\rm draft},
]

with the target frozen.

---

# 6.2 Native multimodal pretraining

K3 trains language and vision jointly from the start.

The corpus includes text domains such as web, code, mathematics and knowledge, plus captions, interleaved multimodal documents, OCR/perception data, video and visual coding data.

Visual and textual tokens are interleaved and optimized under **one next-token prediction objective** rather than separate contrastive and language losses. MoonViT-V2 is trained from scratch under the autoregressive objective instead of beginning from a separately contrastively trained vision encoder.

Thus the disclosed semantics are

[
z_{1:T}
=======

[\text{text tokens};\text{visual tokens};\ldots]
]

and

[
\boxed{
\mathcal L_{\rm pre}
====================

\mathcal L_{\rm NTP}(z_{1:T})
}
]

up to the additional MTP pathway.

Specifically absent from the disclosed foundation objective:

[
\mathcal L_{\rm CLIP},
\qquad
\mathcal L_{\rm contrastive},
\qquad
\mathcal L_{\rm masked-image}.
]

Exact masking/normalization of NTP remains **UNDISCLOSED**.

---

# 6.3 MTP

K3 contains one MTP layer.

However, the current report does not disclose an equation or coefficient sufficient to reconstruct

[
\mathcal L_{\rm MTP}
]

with the precision available for DeepSeek.

Therefore:

[
D_{\rm MTP}=1
]

is reported, while

[
\lambda_{\rm MTP}
=================

\mathrm{UNDISCLOSED}.
]

This pretrained layer later serves as the initialization source for speculative-draft training, but the two objectives are distinct.

---

# 6.4 Quantile Balancing

Stable LatentMoE activates a small routed subset from a much larger expert pool.

K3 uses **Quantile Balancing**, an auxiliary-loss-free load controller.

Let

[
s_{i,j}
=======

\operatorname{Sigmoid}
((W_rx_i)_j).
]

Routing uses

[
T_i
===

\operatorname{TopK}*j
(s*{i,j}+b_j),
]

while mixture probabilities use the raw semantic scores:

[
p_{i,j}
=======

\frac{s_{i,j}}
{\sum_{r\in T_i}s_{i,r}},
\qquad
j\in T_i.
]

So again:

[
b_j
\text{ controls assignment but does not contaminate expert mixture weights}.
]

For target load

[
q=\frac{mk}{n},
]

the controller estimates a quantile-based bias:

[
\hat b_j^{(t+1)}
================

*

Q_{1-k/n}
\left(
s_{:,j}-\alpha^{(t)}
\right)
]

and recenters:

[
\boxed{
b^{(t+1)}
=========

## \hat b^{(t+1)}

\operatorname{mean}
(\hat b^{(t+1)})\mathbf 1
}
]

where (\alpha_i^{(t)}) is the relevant Top-((k+1)) cutoff.

This is a non-gradient state transition:

[
b_{t+1}=F(s_t,\alpha_t),
]

not

[
b_{t+1}=b_t-\eta\nabla_b\mathcal L.
]

This is conceptually parallel to DeepSeek's routing-bias controller, but the update law is materially different: Kimi estimates the bias through routing-score quantiles rather than fixed-sign increments.

---

# 6.5 Long-context curriculum

K3's context regime changes in two phases:

[
8\text{K}\rightarrow64\text{K}
]

during main pretraining, followed by

[
256\text{K}\rightarrow1\text{M}
]

during cooldown.

Long-data construction includes:

* exact and fuzzy document deduplication;
* perceptual frame deduplication for video;
* structural/quality filtering;
* upweighting long documents;
* synthetic concatenation/permutation requiring integration of dispersed evidence.

This is primarily

[
p_{\mathcal D}(x)
\text{ and }
L_{\rm context}
]

changing under the same autoregressive training semantics, not evidence of a special “long-context loss.”

---

# 6.6 SFT

K3's post-training begins from a broad SFT stage.

Training data are constructed using domain-specialized Kimi models, multi-stage verification and human annotation. The resulting trajectories include:

* adaptive reasoning;
* precise tool calls;
* multimodal interaction;
* long-horizon execution.

The format uses Kimi's structured tool/chat representation.

Thus SFT is simultaneously:

[
\text{behavior initialization}
+
\text{reasoning support initialization}
+
\text{tool grammar acquisition}
+
\text{agent trajectory imitation}.
]

Exact token mask, EOS policy, weighting and normalization are **UNDISCLOSED**.

---

# 6.7 QAT begins at SFT

K3 applies quantization-aware training from the SFT stage onward.

The reported scheme uses:

[
W_{\rm expert}\rightarrow\mathrm{MXFP4},
]

[
A_{\rm expert}\rightarrow\mathrm{MXFP8}.
]

Higher-precision paths include non-expert attention components, LatentMoE projections, shared experts and routers. QAT persists across subsequent post-training rather than being a terminal conversion.

Again:

[
\boxed{
\text{quantized forward operator}
\neq
\text{quantization regularizer}.
}
]

No separate (\mathcal L_{\rm quant}) is disclosed.

---

# 6.8 Specialist RL lattice

Instead of optimizing one monolithic policy directly, K3 builds specialists over

[
\mathcal D_{\rm capability}
===========================

{
\text{general},
\text{general-agent},
\text{coding-agent}
}
]

and

[
\mathcal E_{\rm effort}
=======================

{\text{low},\text{high},\text{max}}.
]

Therefore:

[
3\times3=9
]

domain/effort experts become the teachers for final consolidation.

This is structurally different from ordinary “one SFT → one RL” training:

[
\theta_{\rm SFT}
\rightarrow
{\theta_{d,e}}*{9}
\rightarrow
\theta*{\rm final}.
]

---

# 6.9 Policy estimator inherited from K2.5

K3 states that its policy optimization follows the K2.5 approach.

For

[
x\sim\mathcal D,
\qquad
y_j\sim\pi_{\rm old}(\cdot|x),
\quad j=1,\ldots,K,
]

define

[
N=\sum_j|y_j|,
\qquad
\bar r(x)
=========

\frac1K\sum_jr(x,y_j).
]

The published equation is

[
\boxed{
L_{\rm RL}(\theta)
==================

\mathbb E_x
\left[
\frac1N
\sum_{j=1}^K
\sum_{i=1}^{|y_j|}
\left(
\operatorname{Clip}
\left(
\frac{\pi_\theta(y_j^i|s_{j,i})}
{\pi_{\rm old}(y_j^i|s_{j,i})},
\alpha,\beta
\right)
(r_j-\bar r)
------------

\tau
\left[
\log
\frac{\pi_\theta(y_j^i|s_{j,i})}
{\pi_{\rm old}(y_j^i|s_{j,i})}
\right]^2
\right)
\right]
}
]

with

[
\alpha,\beta,\tau>0.
]

### Two source-level inconsistencies must be preserved

The prose says gradient masking is based on the **log-ratio** being inside ([\alpha,\beta]), whereas the printed equation clips the **probability ratio** itself.

So:

[
\boxed{
\text{exact implemented clipping variable}
==========================================

\mathrm{UNRESOLVED}
}
]

from public prose/equation alone.

Second, the printed expression contains a positive advantage term minus log-ratio penalty, yet the report says the optimizer minimizes the objective. Under the ordinary reward-maximization sign convention, these statements are not mutually consistent.

Therefore the sign must **not** be silently repaired.

This is a primary-source contradiction.

---

# 6.10 Why the squared log-ratio exists

Ignoring the source sign ambiguity, the regularizer has the form

[
R_{\rm drift}
=============

\left(
\log\pi_\theta(y_t|s_t)
-----------------------

\log\pi_{\rm old}(y_t|s_t)
\right)^2.
]

It directly suppresses policy movement on the states actually present in stale rollout data.

For long asynchronous trajectories:

[
\Delta t_{\rm rollout}\uparrow
\Rightarrow
|\theta-\theta_{\rm behavior}|\uparrow
\Rightarrow
\left|
\log\frac{\pi_\theta}{\pi_{\rm behavior}}
\right|\uparrow.
]

Thus token-level drift control is tightly coupled to K3's long-agent systems design.

---

# 6.11 Partial rollout

K3 does not wait for every long completion before allowing the learner to progress.

For (N) prompts and (K) rollouts:

[
NK
]

trajectories are active.

Once a configured fraction completes, remaining slow trajectories are paused. They resume in later iterations, and a prompt enters learning once all required group samples are available.

This changes the systems dependency from

[
T_{\rm iteration}
=================

\max_i T_i
]

toward execution that is less dominated by trajectory stragglers.

But it creates policy staleness:

[
y_{1:a}
\sim\pi_{\theta_{t-r}},
\qquad
y_{a:T}
\text{ resumed after learner advancement}.
]

K3 therefore explicitly couples partial rollout with token-level off-policy control.

---

# 6.12 Reasoning-effort control

A problem receives an initial budget (b_0(x)).

If trajectory usage exceeds a multiplicative budget threshold,

[
T(y)>\tau b_0(x),
]

task reward is overridden by a negative outcome.

For non-agent reasoning, (T(y)) concerns reasoning tokens; for agentic tasks it covers cumulative generated output, including reasoning and tool-call arguments.

Effort levels are generated by beginning with a high-budget policy and annealing the admissible budget regime for lower-effort specialists.

This is not just inference-time truncation:

[
\boxed{
\text{reasoning cost enters the RL reward landscape.}
}
]

---

# 6.13 Reward construction

For verifiable problems:

[
r=r_{\rm outcome}
]

from rule/environment verification.

For resource efficiency:

[
r
\leftarrow
r+r_{\rm budget}
]

where applicable.

For subjective/non-verifiable work, K3 uses a GRM protocol in which candidate responses are compared within groups under a generated rubric; excessive verbosity can itself cause rejection beyond configured limits.

Again:

[
\text{GRM}
\rightarrow r
\rightarrow
L_{\rm RL}
]

rather than

[
\text{GRM loss}
===============

\text{actor loss}.
]

---

# 6.14 Multi-teacher on-policy distillation

Final consolidation uses nine specialist teachers.

Student trajectories are generated on-policy:

[
y_t\sim
\pi_\theta(\cdot|e,x,y_{<t}).
]

For domain (d) and effort (e):

[
\boxed{
r_{\rm OPD}^{d}
(y_t|e,x,y_{<t})
================

\operatorname{clip}
\left(
\operatorname{sg}
\left[
\log
\frac{
\pi_{\rm teacher}^{(d,e)}
(y_t|x,y_{<t})
}{
\pi_\theta
(y_t|e,x,y_{<t})
}
\right],
-R_{\max},
R_{\max}
\right)
}
]

The token reward is inserted into the existing RL framework.

This is fundamentally different from DeepSeek-V4:

[
\begin{array}{c|c}
\text{DeepSeek V4} & \text{Kimi K3}\
\hline
\text{full vocabulary} &
\text{sampled student token}\
D_{\rm KL}(\pi_S\Vert\pi_T)&
\operatorname{sg}[\log\pi_T-\log\pi_S]\
\text{direct divergence loss}&
\text{dense RL reward}\

> 10\text{ teachers}&
> 9\text{ teachers}
> \end{array}
> ]

---

## 6.15 KL interpretation of Kimi MOPD

Ignoring clipping, under student sampling:

[
y\sim\pi_S,
]

[
\mathbb E_{\pi_S}
\left[
\log\pi_T(y)-\log\pi_S(y)
\right]
=======

-D_{\rm KL}
(\pi_S\Vert\pi_T).
]

Therefore the per-token reward is a Monte-Carlo signal aligned with reducing reverse KL.

But this is only **[DERIVED]**:

[
\boxed{
\text{Kimi MOPD is not literally reported as an exact full-vocabulary reverse-KL loss.}
}
]

Clipping and the downstream RL estimator further distinguish its realized gradient from exact KL minimization.

---

# 6.16 Speculative drafter

K3's pretrained single MTP layer is converted into an EAGLE-3-style drafter.

The target model is frozen.

Trainable state:

[
\phi=
{
\text{draft layer},
W_{\rm fusion}
}.
]

Target features are taken from low-, intermediate-, and high-level states:

[
h^{L},\ h^{M},\ h^{H},
]

concatenated and projected.

The projection initializes so that the initial fused state equals the high-level target representation:

[
W_{\rm E3}^{(0)}
================

[0;;0;;I].
]

The drafter is unrolled across multiple future positions and consumes its own previous predictions beyond the first step, matching inference-time exposure rather than receiving unavailable future target states.

---

# 6.17 Acceptance-oriented objective

Let target distribution be (p), draft distribution (q).

The one-step acceptance probability in lossless speculative sampling is

[
A(p,q)
======

\sum_v
\min[p(v),q(v)].
]

K3 optimizes

[
\boxed{
\mathcal L_{\rm LK}
===================

-\log
\sum_v
\min[p(v),q(v)]
}
]

at temperature one.

There is **no auxiliary ground-truth CE term** in this drafter objective.

Because

[
\sum_v\min[p_v,q_v]
===================

1-\frac12\sum_v|p_v-q_v|,
]

[
\boxed{
A(p,q)=1-\operatorname{TV}(p,q)
}
]

and hence

[
\arg\min_q\mathcal L_{\rm LK}
=============================

\arg\max_q A(p,q).
]

This is a much tighter alignment between training loss and serving metric than ordinary token CE:

[
-\log q(x^*)
]

which optimizes probability of the observed target token, not the full draft-target overlap required by lossless speculative sampling.

---

# 7. SFT comparative analysis

| Axis                 | DeepSeek V4                                                                | Qwen documented lineage                                                    | Kimi K3                                                                  |
| -------------------- | -------------------------------------------------------------------------- | -------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| Entry state          | Foundation model                                                           | Foundation model                                                           | Native multimodal foundation model                                       |
| First SFT role       | Initialize each domain specialist                                          | Seed long reasoning with intentionally small dataset                       | Broad reasoning + multimodal + tools + long-horizon agent initialization |
| Synthetic source     | Domain-specific high-quality data; exact generation mix partly undisclosed | QwQ-generated candidates + verification/human filtering                    | Specialized Kimi teachers + verification + human annotation              |
| Rejection sampling   | Earlier lineage explicit; current details incomplete                       | Explicit, especially fusion SFT                                            | Filtering/verification explicit                                          |
| Tool grammar         | Specialist/tool schema                                                     | Integrated later general capability; exact current SFT mixture unavailable | Explicit during SFT                                                      |
| Second SFT           | No final fusion SFT; final merger is OPD                                   | **Yes:** thinking/non-thinking fusion after reasoning RL                   | No analogous second fusion SFT                                           |
| QAT                  | Post-training                                                              | Current public details insufficient                                        | Starts at SFT                                                            |
| Exact SFT token mask | **UNDISCLOSED**                                                            | **UNDISCLOSED**                                                            | **UNDISCLOSED**                                                          |

### Causal placement

DeepSeek:

[
\text{base}
\rightarrow
\text{domain SFT}
\rightarrow
\text{domain RL}
\rightarrow
\text{OPD merge}.
]

SFT constructs viable specialist support; OPD later handles capability integration.

Qwen:

[
\text{small reasoning SFT}
\rightarrow
\text{reasoning RL}
\rightarrow
\text{fusion SFT}
\rightarrow
\text{general RL}.
]

The first SFT deliberately avoids excessive imitation; the second restores a controlled mixture of thinking and non-thinking behavior after the reasoning policy has matured.

Kimi:

[
\text{broad agentic SFT}
\rightarrow
\text{specialist RL lattice}
\rightarrow
\text{MOPD}.
]

Here SFT must establish considerably more structured action support before RL because subsequent policies execute long-horizon tool/environment trajectories.

---

# 8. RL comparative analysis

## 8.1 Common stochastic structure

For all RL systems, the essential object is

[
x\sim\mathcal D,
\qquad
y_i\sim
\pi_{\rm behavior}(\cdot|x),
]

[
r_i=r(x,y_i,\mathcal E),
]

[
A_i=A(r_1,\ldots,r_G),
]

[
\rho_{i,t}
==========

\frac{\pi_\theta(y_{i,t}|s_{i,t})}
{\pi_{\rm behavior}(y_{i,t}|s_{i,t})},
]

followed by an estimator

[
\widehat{\nabla_\theta J}.
]

Algorithm labels are not sufficient to determine the final line.

---

## 8.2 Estimator comparison

| Component                          | DeepSeek                                     | Qwen                                                                        | Kimi                                                                                  |
| ---------------------------------- | -------------------------------------------- | --------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| Current exact specialist estimator | **UNDISCLOSED**                              | **UNDISCLOSED**                                                             | K2.5 estimator explicitly inherited                                                   |
| Last exact lineage estimator       | V3.2 clipped GRPO                            | None published at equivalent detail                                         | Ratio/log-ratio clipping expression                                                   |
| Group advantage                    | V3.2 reward minus group mean                 | GRPO reported; exact definition **UNDISCLOSED**                             | (r_j-\bar r)                                                                          |
| Standard-deviation normalization   | Not in V3.2 estimator                        | **UNDISCLOSED**                                                             | No                                                                                    |
| Importance ratio                   | Explicit V3.2                                | Off-policy reported, equation **UNDISCLOSED**                               | Explicit                                                                              |
| PPO-style sign-sensitive clip      | V3.2 yes                                     | **UNDISCLOSED**                                                             | Report says no; clipping depends on drift rather than advantage sign                  |
| Reference KL                       | V3.2 explicit                                | **UNDISCLOSED**                                                             | Replaced by squared behavior-policy log-ratio regularization in published formulation |
| Stale trajectory control           | sequence mask + keep-routing + keep-sampling | Off-policy + current async infrastructure; exact correction **UNDISCLOSED** | token drift clipping/regularization + partial rollouts                                |
| Long-agent trajectory mechanics    | preemptible persistent rollouts              | Current lineage reports asynchronous RL                                     | partial rollout + persistent environment state                                        |

---

# 8.3 DeepSeek path

[
\text{sample}
\rightarrow
\text{domain verifier/GRM}
\rightarrow
R_i
\rightarrow
A_i
\rightarrow
\rho_{i,t}
\rightarrow
\text{clipped update}
\rightarrow
\nabla_\theta
]

is reconstructable exactly only for the earlier V3.2 estimator.

Current V4 retains specialist GRPO but replaces final mixed RL with OPD.

Therefore final unification does **not** require balancing heterogeneous reward scales inside one giant mixed-RL batch:

[
{\pi_{E_i}}
\rightarrow
\sum_i w_i
D_{\rm KL}(\pi_S\Vert\pi_{E_i}).
]

That converts capability integration from reward-space merging into distribution-space imitation.

---

# 8.4 Qwen path

Reasoning phase:

[
x\in\mathcal D_{\rm verifier}
\rightarrow
{y_i}
\rightarrow
r_{\rm verifier}
\rightarrow
\mathrm{GRPO}
\rightarrow
\theta_{\rm reasoning}.
]

What cannot be reconstructed:

[
A_i,\rho_{i,t},
\operatorname{clip},
D_{\rm KL},
\text{entropy term}
]

as explicit current equations.

General RL instead broadens the reward-generating mechanisms:

[
\text{rules}
\cup
\text{reference judge}
\cup
\text{preference RM}
\cup
\text{environment feedback}.
]

This is a reward-distribution expansion after policy-space fusion.

---

# 8.5 Kimi path

[
x
\rightarrow
K\text{ rollouts}
\rightarrow
r_j
\rightarrow
r_j-\bar r
\rightarrow
\rho_{j,t}
\rightarrow
\text{drift clipping}
+
(\log\rho)^2
\rightarrow
\nabla_\theta.
]

Long agent trajectories make this design especially consequential:

[
\text{partial rollout}
\rightarrow
\text{learner progresses while old rollouts persist}
\rightarrow
\pi_{\rm behavior}\text{ becomes stale}
\rightarrow
|\log\rho|\uparrow
]

so the token-level drift mechanisms are part of the mathematical support for asynchronous systems execution, not independent implementation optimizations.

---

# 8.6 Reward comparison

### DeepSeek

[
r=
\begin{cases}
r_{\rm rule/test}, &\text{verifiable},\
r_{\rm GRM/rubric},&\text{hard to verify}.
\end{cases}
]

### Qwen

[
r=
\begin{cases}
r_{\rm rule},\
r_{\rm judge+reference},\
r_{\rm preference-RM},\
r_{\rm environment}.
\end{cases}
]

### Kimi

[
r=
r_{\rm outcome}
+
r_{\rm resource}
]

where applicable, with GRM-based group judgements for subjective tasks and task-specific environment rewards.

None of these reward definitions is itself the policy loss.

---

# 9. Distillation comparative analysis

## 9.1 Three sampling measures

### Teacher/off-policy

[
y\sim\pi_T.
]

Sequence imitation pushes the student toward teacher-covered modes:

[
-\mathbb E_{\pi_T}\log\pi_S(y).
]

Qwen explicitly uses this form of response transfer.

### Student on-policy, exact vocabulary divergence

[
y\sim\pi_S
]

while computing

[
D_{\rm KL}
(\pi_S(\cdot|s)\Vert\pi_T(\cdot|s))
]

over the vocabulary.

DeepSeek V4.

### Student on-policy, sampled-token reward

[
y\sim\pi_S,
]

[
r_t=
\operatorname{sg}
\left[
\log\pi_T(y_t|s_t)
------------------

\log\pi_S(y_t|s_t)
\right].
]

Kimi K3, with clipping and RL optimization.

---

## 9.2 Gradient consequence

For exact reverse KL:

[
D_{\rm KL}(S\Vert T)
====================

\sum_v
S_v
\log\frac{S_v}{T_v}.
]

Differentiation accounts for the full student distribution.

For the sampled reward:

[
\hat r(y)
=========

\log T_y-\log S_y,
\qquad
y\sim S,
]

one token provides a stochastic sample of the reverse-KL signal.

Thus

[
\text{variance}_{\rm sampled}

>

\text{variance}_{\rm full-vocab}
]

in the ordinary Monte-Carlo sense, which is precisely why DeepSeek reports preferring full-vocabulary OPD at its scale.

Kimi instead retains the sampled reward and clips its magnitude:

[
[-R_{\max},R_{\max}],
]

trading exact dense divergence computation for compatibility with its RL machinery.

---

## 9.3 Comparison

| Axis                           | DeepSeek V4                                    | Qwen                                    | Kimi K3                           |
| ------------------------------ | ---------------------------------------------- | --------------------------------------- | --------------------------------- |
| Final merger                   | Multi-teacher OPD                              | Small-model strong-to-weak distillation | MOPD                              |
| Student sampling               | On-policy                                      | On-policy in second phase               | On-policy                         |
| Teacher-response offline phase | Not final mechanism                            | Yes                                     | No separate final phase           |
| Teacher number                 | >10                                            | Exact current count **UNDISCLOSED**     | 9                                 |
| Divergence direction           | (D_{\rm KL}(S\Vert T))                         | **UNDISCLOSED**                         | Reverse-KL-aligned sampled reward |
| Vocabulary estimator           | Full                                           | **UNDISCLOSED**                         | sampled token                     |
| Stop-gradient                  | Not reduced to sampled SG estimator            | **UNDISCLOSED**                         | Explicit                          |
| Clipping                       | No sampled reward clipping needed for exact KL | **UNDISCLOSED**                         | ([-R_{\max},R_{\max}])            |
| Implemented as RL reward       | No                                             | Not established                         | Yes                               |

---

# 10. Speculative-decoding training

The three concepts that must remain separate are

[
\boxed{
\text{foundation MTP}
\neq
\text{trained drafter}
\neq
\text{serving acceptance algorithm}.
}
]

## DeepSeek

Foundation V4:

[
\mathcal L_{\rm MTP}
]

is a future-token auxiliary objective inherited from V3.

Separately:

[
\mathcal L_{\rm DSpark}
=======================

0.1L_{\rm CE}
+0.9L_{\rm TV}
+L_{\rm conf}
]

trains an external drafter. DSpark's TV term is explicitly acceptance-aligned, and its confidence head further estimates whether draft prefixes survive verification.

## Qwen

Current Qwen3.6 reports trained multi-step MTP.

The exact relationship

[
\mathcal L_{\rm MTP}
\rightarrow
\phi_{\rm speculative}
]

is **UNDISCLOSED**.

No primary evidence justifies assigning DSpark, EAGLE or Kimi's overlap loss to it.

## Kimi

Foundation MTP supplies drafter initialization.

The dedicated drafter then optimizes

[
\mathcal L_{\rm LK}
===================

-\log A(p,q)
]

directly.

---

## 10.1 Objective-to-serving alignment

Let

[
A(p,q)=1-\operatorname{TV}(p,q).
]

### Ground-truth CE

[
-\log q(x^*)
]

optimizes the observed label.

It does not explicitly optimize (A).

### KL distillation

[
D_{\rm KL}(p\Vert q)
]

aligns distributions and can indirectly improve acceptance, but the divergence is not the acceptance functional.

### TV

[
\operatorname{TV}(p,q)
]

satisfies

[
A=1-\operatorname{TV}
]

exactly for one-step lossless sampling.

### Negative log overlap

[
-\log A
]

is a monotone transform of the exact acceptance probability.

Therefore, with respect purely to one-step acceptance-target alignment:

[
\boxed{
-\log A
;\text{and};
\operatorname{TV}

>

\text{generic KL}

>

\text{ground-truth-only CE}
}
]

where “(>)” denotes **directness of objective alignment**, not universal empirical model quality.

But production throughput is

[
\Theta
======

f(
A,
\gamma,
T_{\rm draft},
T_{\rm verify},
B,
\text{concurrency}
),
]

so highest acceptance alone need not maximize serving throughput. DSpark explicitly closes this second loop with confidence-conditioned hardware-aware verification.

---

# 11. Unified optimization graph

[
\boxed{
\begin{array}{lll}
\textbf{DeepSeek:}
&
\theta_0
\xrightarrow{
\mathcal L_{\rm LM}
+\mathcal L_{\rm MTP}
+\mathcal L_{\rm Bal};
;b\leftarrow F_{\rm load}(b)
}
\theta_B
&
[3pt]
&
\theta_B
\xrightarrow{\rm SFT_e}
\theta_e^0
\xrightarrow{\rm GRPO_e}
\theta_e
&
[3pt]
&
{\theta_e}
;;,;;
y\sim\pi_\theta
\xrightarrow{
\sum_iw_iD_{\rm KL}
(\pi_\theta\Vert\pi_{E_i})
}
\theta_F
&
[10pt]
\textbf{Qwen:}
&
\theta_0
\xrightarrow{\mathcal D_{\rm general}}
\theta_1
\xrightarrow{\mathcal D_{\rm knowledge}}
\theta_2
\xrightarrow{\mathcal D_{\rm long}}
\theta_B
&
[3pt]
&
\theta_B
\xrightarrow{\rm cold\ SFT}
\theta_R^0
\xrightarrow{\rm GRPO}
\theta_R
&
[3pt]
&
\theta_R
\xrightarrow{
\rm think/nonthink\ SFT
}
\theta_M
\xrightarrow{\rm general\ RL}
\theta_F
&
[3pt]
&
\text{small model: }
\theta_s
\xrightarrow{\rm offline\ teacher\ responses}
\theta_s'
\xrightarrow[
y\sim\pi_s
]{\rm logit\ distill}
\theta_s^F
&
[10pt]
\textbf{Kimi:}
&
\theta_0
\xrightarrow[
b\leftarrow Q_{\rm route}
]{
\mathcal L_{\rm native\ NTP}
+
\mathcal L_{\rm MTP}
}
\theta_B
&
[3pt]
&
\theta_B
\xrightarrow{
\rm SFT+QAT
}
\theta_S
\xrightarrow{
\rm RL_{domain\times effort}
}
{\theta_{d,e}}*{9}
&
[3pt]
&
{\theta*{d,e}}
\xrightarrow[
y\sim\pi_\theta
]{
r_t=
\operatorname{clip}
\left(
\operatorname{sg}
\log
\frac{\pi_{d,e}}{\pi_\theta}
\right)
}
\theta_F.
&
\end{array}
}
]

Separate draft programs:

[
\boxed{
\begin{aligned}
\text{DeepSeek:}\quad&
\theta_F\text{ frozen}
\rightarrow
\phi_{\rm DSpark},
\
&
L=
0.1L_{\rm CE}
+0.9L_{\rm TV}
+L_{\rm conf};
[4pt]
\text{Qwen:}\quad&
\phi_{\rm current}:
\mathrm{UNDISCLOSED};
[4pt]
\text{Kimi:}\quad&
\theta_F\text{ frozen},
\quad
\phi_{\rm MTP}
\rightarrow
\phi_{\rm draft},
\
&
L_{\rm draft}
=============

-\log\sum_v\min[p_v,q_v].
\end{aligned}}
]

---

# 12. Evidence / unknown matrix

| Item                                  | DeepSeek                                         | Qwen                                                       | Kimi                                                                     |
| ------------------------------------- | ------------------------------------------------ | ---------------------------------------------------------- | ------------------------------------------------------------------------ |
| Current foundation prediction target  | **REPORTED** causal LM                           | **REPORTED** causal multimodal model                       | **EQUATION/MECHANISM-VERIFIED** native multimodal NTP                    |
| Exact main NTP normalization          | **UNDISCLOSED**                                  | **UNDISCLOSED**                                            | **UNDISCLOSED**                                                          |
| Multimodal pretraining scalar         | N/A for V4                                       | **UNDISCLOSED** current decomposition                      | Single NTP reported                                                      |
| MTP present                           | **INHERITED**                                    | **REPORTED** current                                       | **REPORTED**                                                             |
| Exact MTP equation                    | **INHERITED / EQUATION-VERIFIED**                | **UNDISCLOSED** current                                    | **UNDISCLOSED**                                                          |
| MTP depth                             | 1                                                | multiple steps reported; exact current schedule incomplete | 1                                                                        |
| MTP coefficient                       | 0.3→0.1                                          | **UNDISCLOSED**                                            | **UNDISCLOSED**                                                          |
| Differentiable MoE balance            | Small sequence loss                              | Qwen3 global-batch loss; current equation **UNDISCLOSED**  | No QB auxiliary scalar                                                   |
| Non-gradient routing controller       | Bias-step controller                             | **UNDISCLOSED**                                            | Quantile Balancing                                                       |
| Long-context objective change         | No evidence of new prediction target             | No evidence of distinct semantic loss                      | No evidence of distinct semantic loss                                    |
| SFT objective equation                | **UNDISCLOSED**                                  | **UNDISCLOSED**                                            | **UNDISCLOSED**                                                          |
| SFT token mask                        | **UNDISCLOSED**                                  | **UNDISCLOSED**                                            | **UNDISCLOSED**                                                          |
| Reasoning cold start                  | Specialist SFT; earlier exact lineage details    | Explicit small long-CoT SFT                                | Explicit broad cold-start SFT                                            |
| Tool/agent trajectory SFT             | Yes                                              | Current exact mixture **UNDISCLOSED**                      | Yes                                                                      |
| Rejection sampling                    | Lineage mechanism                                | **REPORTED**                                               | Filtering/synthesis reported                                             |
| Current RL algorithm name             | GRPO specialists                                 | Current **UNDISCLOSED**; Qwen3 GRPO                        | K2.5 policy optimizer inherited                                          |
| Exact current RL equation             | **UNDISCLOSED** for V4 specialists               | **UNDISCLOSED**                                            | **INHERITED**, with source contradiction                                 |
| Group advantage exact                 | V3.2 mean-centered                               | **UNDISCLOSED**                                            | Mean-centered                                                            |
| Importance ratio                      | V3.2 explicit                                    | off-policy reported, formula **UNDISCLOSED**               | Explicit                                                                 |
| PPO-style clipping                    | V3.2                                             | **UNDISCLOSED**                                            | No: drift-based mechanism described                                      |
| Reference-policy KL                   | V3.2                                             | **UNDISCLOSED**                                            | No equivalent reference KL disclosed in inherited expression             |
| Squared log-ratio control             | No in V3.2 expression                            | **UNDISCLOSED**                                            | Yes                                                                      |
| Rollout count                         | Current exact **UNDISCLOSED**                    | “high number” only                                         | (K) symbolic; numeric operational value **UNDISCLOSED**                  |
| Partial rollout                       | V4 preemption/resume mechanisms                  | Current asynchronous lineage reported                      | Explicit                                                                 |
| Reward: rule/verifier                 | Yes                                              | Yes                                                        | Yes                                                                      |
| Reward: environment/tools             | Yes                                              | Yes                                                        | Yes                                                                      |
| GRM                                   | Yes                                              | LLM evaluation + scalar RM                                 | Yes                                                                      |
| Conventional scalar preference RM     | V4 explicitly avoids it for hard-to-verify tasks | Present for relevant Qwen3 general-RL tasks                | Not primary disclosed general mechanism                                  |
| Standalone preference stage           | No evidence                                      | No evidence                                                | No evidence                                                              |
| Offline distillation                  | Not final current merge                          | Yes                                                        | No separate final stage                                                  |
| On-policy distillation                | Yes                                              | Yes                                                        | Yes                                                                      |
| Multi-teacher                         | >10                                              | Current count **UNDISCLOSED**                              | 9                                                                        |
| KL direction                          | Reverse                                          | **UNDISCLOSED**                                            | Reverse-KL-aligned sampled reward                                        |
| Full-vocabulary distillation          | Yes                                              | **UNDISCLOSED**                                            | No; sampled token                                                        |
| Distillation stop-gradient reward     | Explicitly rejected as final approximation       | **UNDISCLOSED**                                            | Yes                                                                      |
| QAT                                   | FP4 posttraining                                 | **UNDISCLOSED** current                                    | SFT onward                                                               |
| Additional quantization loss          | No evidence                                      | **UNDISCLOSED**                                            | No evidence                                                              |
| Dedicated speculative drafter         | DSpark                                           | **UNDISCLOSED** current                                    | Yes                                                                      |
| Draft target frozen                   | Yes                                              | **UNDISCLOSED**                                            | Yes                                                                      |
| Acceptance-oriented loss              | TV component                                     | **UNDISCLOSED**                                            | Exact overlap loss                                                       |
| Confidence prediction                 | DSpark yes                                       | **UNDISCLOSED**                                            | Not required by disclosed K3 draft objective                             |
| Serving-aware verification controller | DSpark yes                                       | **UNDISCLOSED**                                            | Standard target verification; separate scheduler objective not disclosed |

---

# 13. Complete stage-presence audit

To avoid mistaking “not discussed” for “absent”:

### DeepSeek

[
\begin{array}{ll}
\text{Tokenizer/data prep} & \text{present; tokenizer-training objective not central/disclosed}\
\text{Foundation pretraining} & \checkmark\
\text{Multimodal pretraining} & \text{not reported for V4}\
\text{MoE balancing} & \checkmark\
\text{Mid-training} & \text{not required as a separately named stage}\
\text{Continued/domain pretraining} & \text{curriculum/data changes, not distinct public loss}\
\text{Long context} & \checkmark\
\text{Reasoning cold start} & \checkmark\text{ through specialist SFT / lineage}\
\text{SFT} & \checkmark\
\text{Instruction tuning} & \checkmark\
\text{Tool/agent SFT} & \checkmark\
\text{Rejection/self-generated} & \text{lineage-supported; current exact recipe incomplete}\
\text{Reasoning RL} & \checkmark\
\text{General RL} & \checkmark\text{ specialists}\
\text{Agent/environment RL} & \checkmark\
\text{RM/GRM} & \checkmark\
\text{Preference optimization} & \text{no distinct public stage}\
\text{Distillation} & \checkmark\
\text{Multi-teacher} & \checkmark\
\text{On-policy distillation} & \checkmark\
\text{Off-policy distillation} & \text{not final V4 merger}\
\text{QAT} & \checkmark\
\text{MTP} & \checkmark\
\text{Speculative drafter} & \checkmark\text{ DSpark}\
\text{Acceptance optimization} & \checkmark\text{ TV}\
\text{Other modern stage} & \checkmark\text{ full-vocab OPD}.
\end{array}
]

### Qwen

[
\begin{array}{ll}
\text{Tokenizer/data prep} & \checkmark\
\text{Foundation pretraining} & \checkmark\
\text{Multimodal pretraining} & \checkmark\text{ current endpoint}\
\text{MoE balancing} & \checkmark\text{ lineage; current exact form unknown}\
\text{Mid-training} & \checkmark\text{ knowledge-intensive continuation in Qwen3}\
\text{Continued/domain pretraining} & \checkmark\
\text{Long context} & \checkmark\
\text{Reasoning cold start} & \checkmark\
\text{SFT} & \checkmark\
\text{Instruction tuning} & \checkmark\
\text{Tool/agent SFT} & \text{current exact stage decomposition unknown}\
\text{Rejection sampling} & \checkmark\
\text{Reasoning RL} & \checkmark\
\text{General RL} & \checkmark\
\text{Agent/environment RL} & \checkmark\text{ within general/current agentic training}\
\text{RM/GRM} & \checkmark\
\text{Preference optimization} & \text{reward mechanism exists; no separate DPO-like stage}\
\text{Distillation} & \checkmark\
\text{Multi-teacher} & \text{current exact form unknown}\
\text{On-policy distillation} & \checkmark\
\text{Off-policy distillation} & \checkmark\
\text{QAT} & \mathrm{UNDISCLOSED}\
\text{MTP} & \checkmark\text{ current}\
\text{Speculative drafter} & \mathrm{UNDISCLOSED}\
\text{Acceptance objective} & \mathrm{UNDISCLOSED}\
\text{Other modern stage} & \checkmark\text{ thinking-mode fusion}.
\end{array}
]

### Kimi

[
\begin{array}{ll}
\text{Tokenizer/data prep} & \checkmark\text{ corpus pipeline; tokenizer optimization unknown}\
\text{Foundation pretraining} & \checkmark\
\text{Multimodal pretraining} & \checkmark\
\text{MoE balancing} & \checkmark\
\text{Mid-training} & \text{not separately necessary}\
\text{Continued/domain pretraining} & \text{domain mixture integrated}\
\text{Long context} & \checkmark\
\text{Reasoning cold start} & \checkmark\
\text{SFT} & \checkmark\
\text{Instruction tuning} & \checkmark\
\text{Tool/agent SFT} & \checkmark\
\text{Rejection/synthetic} & \checkmark\
\text{Reasoning RL} & \checkmark\
\text{General RL} & \checkmark\
\text{Agent/environment RL} & \checkmark\
\text{RM/GRM} & \checkmark\
\text{Preference optimization} & \text{no standalone stage disclosed}\
\text{Distillation} & \checkmark\
\text{Multi-teacher} & \checkmark\
\text{On-policy distillation} & \checkmark\
\text{Off-policy distillation} & \text{no distinct final stage disclosed}\
\text{QAT} & \checkmark\
\text{MTP} & \checkmark\
\text{Speculative drafter} & \checkmark\
\text{Acceptance optimization} & \checkmark\
\text{Other modern stage} & \checkmark\text{ partial-rollout specialist lattice + MOPD}.
\end{array}
]

---

# 14. Final causal interpretation

The three pipelines expose three different solutions to the same late-training problem:

[
\text{How do we acquire heterogeneous capabilities without destroying exploration, specialization, or deployability?}
]

DeepSeek's answer is

[
\boxed{
\text{independent experts}
\rightarrow
\text{full-vocabulary on-policy reverse-KL consolidation}
}
]

which trades teacher-compute cost for low-variance distribution-level supervision.

Qwen's last fully disclosed answer is

[
\boxed{
\text{small reasoning imitation}
\rightarrow
\text{reasoning RL}
\rightarrow
\text{behavioral-mode fusion}
\rightarrow
\text{general RL}
}
]

with smaller students taking a cheaper teacher-transfer path rather than reproducing the flagship optimization program.

Kimi's answer is

[
\boxed{
\text{broad agentic SFT}
\rightarrow
\text{domain}\times\text{effort RL specialists}
\rightarrow
\text{sampled-token on-policy teacher reward}
}
]

which allows specialist training to remain decomposed while the final student learns on the state distribution it will itself occupy.

The same divergence appears in speculative training. Foundation MTP increases future-token predictive structure, but production speculation eventually exposes a different target:

[
\boxed{
\text{maximize target-draft probability overlap}
}
]

rather than simply

[
\text{predict the next ground-truth token}.
]

DeepSeek DSpark reaches this through a heavily weighted total-variation term plus learned survival confidence; Kimi directly minimizes negative log overlap. For current Qwen, the public evidence does not expose an equivalent acceptance-trained drafter.

The decisive architectural trend is therefore a migration from training stages identified by names—pretraining, SFT, RL, distillation—to stages defined by a five-tuple:

[
\boxed{
(
\text{sampling distribution},
\text{target/reward generator},
\text{scalar estimator},
\text{trainable state},
\text{execution semantics}
)
}
]

because two stages both called “GRPO,” “SFT,” “MTP,” or “distillation” can have materially different gradients, stability properties, system requirements and deployment behavior.


[
\boxed{
\begin{array}{c}
\textbf{DEEPSEEK OUTER TRAINING PROGRAM}[2mm]
\mathsf M_\theta:\text{black-box model}[1mm]
\theta:
\theta_{\rm base}
\rightarrow
\theta_{\rm SFT}
\rightarrow
\theta_{\rm RL}
\rightarrow
\theta_{\rm final}
\end{array}}
]

---

[
\boxed{\textbf{Algorithm 1}\qquad \mathsf{PRETRAIN}(\mathsf M_\theta,\mathcal D_{\rm pre})}
]

[
\begin{aligned}
&\mathbf{Input}:\
&\qquad
\mathcal D_{\rm pre}
====================

{d_n}*{n=1}^{N},
\qquad
d_n=(u*{n,1},\ldots,u_{n,L_n})
\
&\qquad
\tau:d_n\mapsto
(x_{n,1},\ldots,x_{n,L_n}),
\qquad
x_{n,t}\in{1,\ldots,V}
\
&\qquad
\theta_0,
\qquad
b_0\in\mathbb R^{N_{\rm expert}},
\qquad
T,
\qquad
B_{\rm global},
\qquad
B_\mu,
\qquad
W_{\rm DP},
\
&\qquad
K_{\rm acc}
===========

\frac{B_{\rm global}}
{W_{\rm DP}B_\mu}
\
&\qquad
\lambda_{\rm MTP}(s),
\qquad
\alpha_{\rm Bal},
\qquad
\eta_s,
\qquad
\gamma_{\rm route}.
\end{aligned}
]

[
\begin{aligned}
&\mathbf{Schema}:\
&
\mathcal S_{\rm pre}
====================

\left{
X\in\mathbb N^{B\times(T+1)}
\right}
\
&
X
=

\begin{bmatrix}
x_{1,1}&\cdots&x_{1,T+1}\
\vdots&&\vdots\
x_{B,1}&\cdots&x_{B,T+1}
\end{bmatrix}
\
&
X^{\rm in}=X_{:,1:T}\in\mathbb N^{B\times T}
\
&
Y^{\rm NTP}=X_{:,2:T+1}\in\mathbb N^{B\times T}
\
&
Y^{(1)}*{\rm MTP}=X*{:,3:T+1}.
\end{aligned}
]

[
\begin{aligned}
&\mathbf{Pack}:\
&
{,\tau(d_n),}*{n=1}^{N}
\xrightarrow{\operatorname{concat+boundary}}
\tilde X
\xrightarrow{\operatorname{chunk}(T+1)}
{X_j}*{j=1}^{N_{\rm seq}}
\
&
X_j\in\mathbb N^{T+1}.
\end{aligned}
]

[
\begin{aligned}
&\mathbf{Shuffle}:\
&
\pi_s\sim\operatorname{Perm}(N_{\rm seq}),
\
&
\mathcal B_s
============

\left{
X_{\pi_s(j)}
\right}*{j=1}^{B*{\rm global}}.
\end{aligned}
]

[
\begin{aligned}
&\mathbf{Shard}:\
&
\mathcal B_s
============

\bigsqcup_{r=1}^{W_{\rm DP}}
\mathcal B_s^{(r)},
\
&
|\mathcal B_s^{(r)}|
====================

\frac{B_{\rm global}}{W_{\rm DP}},
\
&
\mathcal B_s^{(r)}
==================

\bigsqcup_{k=1}^{K_{\rm acc}}
\mathcal B_{s,k}^{(r)},
\
&
|\mathcal B_{s,k}^{(r)}|
========================

B_\mu.
\end{aligned}
]

[
\begin{aligned}
&\mathbf{Initialize}:\
&
\theta\leftarrow\theta_0,
\qquad
b\leftarrow b_0,
\qquad
s\leftarrow0.
\end{aligned}
]

[
\boxed{
\begin{aligned}
&\mathbf{for}\quad s=0,\ldots,S_{\rm pre}-1:
[1mm]
&
g^{(r)}\leftarrow0
\qquad
\forall r\in{1,\ldots,W_{\rm DP}}
[1mm]
&
\mathbf{for}\quad
k=1,\ldots,K_{\rm acc}:
\
&
\qquad
X_{s,k}^{(r)}
\leftarrow
\mathcal B_{s,k}^{(r)}
\
&
\qquad
X_{s,k}^{\rm in}
================

X_{s,k,:,1:T}^{(r)}
\
&
\qquad
Y_{s,k}^{\rm NTP}
=================

X_{s,k,:,2:T+1}^{(r)}
[1mm]
&
\qquad
\left(
Z_{s,k},
Z_{s,k}^{\rm MTP},
\Lambda_{s,k}
\right)
=======

\mathsf M_\theta
\left(
X_{s,k}^{\rm in};
b_s
\right)
\
&
\qquad
Z_{s,k}
\in
\mathbb R^{B_\mu\times T\times V}
\
&
\qquad
P_{s,k}
=======

\operatorname{softmax}
(Z_{s,k})
[1mm]
&
\qquad
\mathcal L_{\rm NTP}^{(s,k)}
============================

-\frac{1}{Z_{\rm NTP}}
\sum_{\beta=1}^{B_\mu}
\sum_{t=1}^{T}
m_{\beta,t}^{\rm pre}
\log
P_{s,k,\beta,t}
!\left[
Y^{\rm NTP}*{s,k,\beta,t}
\right]
\
&
\qquad
m^{\rm pre},
Z*{\rm NTP}
===========

\mathrm{UNDISCLOSED}
[1mm]
&
\qquad
P^{\rm MTP}_{s,k}
=================

\operatorname{softmax}
(Z^{\rm MTP}*{s,k})
\
&
\qquad
\mathcal L*{\rm MTP}^{(s,k)}
============================

-\frac{1}{T}
\sum_{\beta=1}^{B_\mu}
\sum_{t}
\log
P^{\rm MTP}*{s,k,\beta,t}
\left[
x*{\beta,t+2}
\right]
[1mm]
&
\qquad
\mathcal L_{\rm Bal}^{(s,k)}
============================

\alpha_{\rm Bal}
\sum_{e=1}^{N_r}
f_e^{(s,k)}
P_e^{(s,k)}
[1mm]
&
\qquad
\mathcal L_{s,k}^{\rm pre}
==========================

\mathcal L_{\rm NTP}^{(s,k)}
+
\lambda_{\rm MTP}(s)
\mathcal L_{\rm MTP}^{(s,k)}
+
\mathcal L_{\rm Bal}^{(s,k)}
[1mm]
&
\qquad
g_{s,k}^{(r)}
=============

\nabla_\theta
\mathcal L_{s,k}^{\rm pre}
\
&
\qquad
g^{(r)}
\leftarrow
g^{(r)}
+
\frac{1}{K_{\rm acc}}
g_{s,k}^{(r)}
[2mm]
&
\mathbf{end}
[2mm]
&
g_s
===

\frac{1}{W_{\rm DP}}
\sum_{r=1}^{W_{\rm DP}}
g^{(r)}
\
&
\widehat g_s
============

\operatorname{ReduceScatter/AllReduce}
\left(
{g^{(r)}}*{r=1}^{W*{\rm DP}}
\right)
[1mm]
&
\theta_{s+1}
============

\operatorname{OPT}
\left(
\theta_s,
\widehat g_s,
\eta_s
\right)
[2mm]
&
\ell_{e,s}
==========

\sum_{r,k}
\operatorname{Load}
\left(
\Lambda_{s,k}^{(r)},e
\right)
\
&
\bar\ell_s
==========

\frac{1}{N_r}
\sum_{e=1}^{N_r}\ell_{e,s}
\
&
b_{e,s+1}
=========

\begin{cases}
b_{e,s}-\gamma_{\rm route},
&
\ell_{e,s}>\bar\ell_s,
\
b_{e,s}+\gamma_{\rm route},
&
\ell_{e,s}<\bar\ell_s,
\
b_{e,s},
&
\ell_{e,s}=\bar\ell_s,
\end{cases}
[1mm]
&
\boxed{
b_{s+1}
=======

F(b_s,\ell_s)
\not\equiv
b_s-\eta_s\nabla_b\mathcal L_s
}
[2mm]
&
\mathbf{end}
\end{aligned}}
]

[
\boxed{
\theta_{\rm base}
=================

\theta_{S_{\rm pre}}
}
]

---

[
\boxed{\textbf{Algorithm 2}\qquad
\mathsf{SFT}(\mathsf M_{\theta_{\rm base}},\mathcal D_{\rm SFT}^{(e)})}
]

[
\begin{aligned}
&\mathbf{Input}:\
&
\mathcal D_{\rm SFT}^{(e)}
==========================

{
(q_n,a_n)
}_{n=1}^{N_e}
\
&
q_n
===

(q_{n,1},\ldots,q_{n,L_q}),
\qquad
a_n
===

(a_{n,1},\ldots,a_{n,L_a})
\
&
e\in
\mathcal E_{\rm specialist}
\
&
\theta_0^{(e)}
==============

\theta_{\rm base}.
\end{aligned}
]

[
\begin{aligned}
&\mathbf{Serialize}:\
&
S_n
===

\tau
\left(
\langle\mathrm{BOS}\rangle
\Vert
q_n
\Vert
a_n
\Vert
\langle\mathrm{EOS}\rangle
\right)
\
&
S_n
===

(x_{n,1},\ldots,x_{n,L_n}).
\end{aligned}
]

[
\begin{aligned}
&\mathbf{Schema}:\
&
X\in\mathbb N^{B\times T},
\
&
Y\in\mathbb N^{B\times T},
\
&
M^{\rm SFT}
\in
{0,1}^{B\times T},
\
&
X_{\beta,t}
===========

x_{\beta,t},
\
&
Y_{\beta,t}
===========

x_{\beta,t+1},
\
&
M^{\rm SFT}_{\beta,t}
=====================

\mathrm{UNDISCLOSED}.
\end{aligned}
]

[
\begin{aligned}
&\mathbf{Batch}:\
&
\mathcal B_s^{(e)}
==================

\operatorname{PackBatch}
\left(
{S_n},
B_{\rm global},
T
\right)
\
&
\mathcal B_s^{(e)}
==================

\bigsqcup_{r=1}^{W_{\rm DP}}
\bigsqcup_{k=1}^{K_{\rm acc}}
\mathcal B_{s,k}^{(e,r)}.
\end{aligned}
]

[
\boxed{
\begin{aligned}
&\theta^{(e)}
\leftarrow
\theta_{\rm base}
[1mm]
&
\mathbf{for}\quad
s=0,\ldots,S_{\rm SFT}^{(e)}-1:
\
&
\qquad
g^{(r)}\leftarrow0
\
&
\qquad
\mathbf{for}\quad
k=1,\ldots,K_{\rm acc}:
\
&
\qquad\qquad
(X,Y,M)
\leftarrow
\mathcal B_{s,k}^{(e,r)}
\
&
\qquad\qquad
Z
=

\mathsf M_{\theta^{(e)}_s}(X)
\
&
\qquad\qquad
P
=

\operatorname{softmax}(Z)
\
&
\qquad\qquad
\mathcal L_{\rm SFT}^{(e,s,k)}
==============================

*

\frac{1}{Z_{s,k}^{(e)}}
\sum_{\beta,t}
M_{\beta,t}
\log
P_{\beta,t}
[Y_{\beta,t}]
\
&
\qquad\qquad
M_{\beta,t},
Z_{s,k}^{(e)}
=============

\mathrm{UNDISCLOSED}
\
&
\qquad\qquad
g_{s,k}^{(e,r)}
===============

\nabla_\theta
\mathcal L_{\rm SFT}^{(e,s,k)}
\
&
\qquad\qquad
g^{(r)}
\leftarrow
g^{(r)}
+
\frac{1}{K_{\rm acc}}
g_{s,k}^{(e,r)}
\
&
\qquad
\mathbf{end}
[1mm]
&
\qquad
\widehat g_s^{(e)}
==================

\operatorname{Collective}
\left(
{g^{(r)}}*{r=1}^{W*{\rm DP}}
\right)
\
&
\qquad
\theta_{s+1}^{(e)}
==================

\operatorname{OPT}
\left(
\theta_s^{(e)},
\widehat g_s^{(e)},
\eta_s^{(e)}
\right)
\
&
\mathbf{end}
\end{aligned}}
]

[
\boxed{
\theta_{\rm SFT}^{(e)}
======================

\theta_{S_{\rm SFT}^{(e)}}^{(e)}
}
]

[
\boxed{
\theta_{\rm base}
\xrightarrow[\mathcal D_{\rm SFT}^{(e)}]
{\mathcal L_{\rm SFT}^{(e)}}
\theta_{\rm SFT}^{(e)}
}
]

---

[
\boxed{\textbf{Algorithm 3}\qquad
\mathsf{RL\text{-}GRPO}(
\mathsf M_{\theta_{\rm SFT}^{(e)}},
\mathcal D_{\rm prompt}^{(e)},
\mathcal E^{(e)})
}
]

[
\begin{aligned}
&\mathbf{Input}:\
&
\mathcal D_{\rm prompt}^{(e)}
=============================

{q_n}_{n=1}^{N_e},
\
&
\theta_0
========

\theta_{\rm SFT}^{(e)},
\
&
G
=

\text{rollouts per prompt},
\
&
B_q
===

\text{prompts per rollout batch}.
\end{aligned}
]

[
\begin{aligned}
&\mathbf{Prompt\ Schema}:\
&
Q_s
===

{
q_{s,1},\ldots,q_{s,B_q}
}
\
&
X_s^{q}
=======

\operatorname{Pad/Pack}
\left(
\tau(Q_s)
\right)
\in
\mathbb N^{B_q\times T_q}.
\end{aligned}
]

[
\boxed{
\begin{aligned}
&\mathbf{for}\quad
s=0,\ldots,S_{\rm RL}^{(e)}-1:
[1mm]
&
\qquad
Q_s
\sim
\mathcal D_{\rm prompt}^{(e)}
\
&
\qquad
\theta_{\rm beh}
\leftarrow
\operatorname{Snapshot}(\theta_s)
[2mm]
&
\qquad
\mathbf{for}\quad
\beta=1,\ldots,B_q:
\
&
\qquad\qquad
\mathbf{for}\quad
j=1,\ldots,G:
\
&
\qquad\qquad\qquad
Y_{\beta,j}
\sim
\pi_{\theta_{\rm beh}}
\left(
\cdot\mid q_\beta
\right)
\
&
\qquad\qquad\qquad
Y_{\beta,j}
===========

(y_{\beta,j,1},\ldots,
y_{\beta,j,T_{\beta,j}})
\
&
\qquad\qquad\qquad
\tau_{\beta,j}
==============

(q_\beta,Y_{\beta,j})
\
&
\qquad\qquad\qquad
r_{\beta,j}
===========

\mathcal R^{(e)}
\left(
q_\beta,
Y_{\beta,j},
\mathcal E^{(e)}
\right)
\
&
\qquad\qquad
\mathbf{end}
\
&
\qquad
\mathbf{end}
\end{aligned}}
]

[
\begin{aligned}
&
\mathcal T_s
============

{
(q_\beta,Y_{\beta,j},r_{\beta,j})
}_{\beta=1,j=1}^{B_q,G}
\
&
|\mathcal T_s|
==============

B_qG.
\end{aligned}
]

[
\begin{aligned}
&\mathbf{RL\ Training\ Batch}:\
&
\mathcal T_s
============

\bigsqcup_{m=1}^{N_{\rm mb}^{\rm RL}}
\mathcal T_{s,m}
\
&
\mathcal T_{s,m}
\rightarrow
(X_{s,m},Y_{s,m},R_{s,m},M_{s,m})
\
&
X_{s,m}
\in
\mathbb N^{B_{\rm RL}\times T_{\rm RL}},
\
&
Y_{s,m}
\in
\mathbb N^{B_{\rm RL}\times T_{\rm RL}}.
\end{aligned}
]

[
\begin{aligned}
&
\bar r_\beta
============

\frac1G
\sum_{j=1}^{G}
r_{\beta,j}
\
&
A_{\beta,j}^{\rm lineage}
=========================

## r_{\beta,j}

\bar r_\beta.
\end{aligned}
]

[
\begin{aligned}
&
\log p_{\theta_s,\beta,j,t}
===========================

\log
\pi_{\theta_s}
\left(
y_{\beta,j,t}
\mid
q_\beta,y_{\beta,j,<t}
\right)
\
&
\log p_{{\rm beh},\beta,j,t}
============================

\log
\pi_{\theta_{\rm beh}}
\left(
y_{\beta,j,t}
\mid
q_\beta,y_{\beta,j,<t}
\right)
\
&
\rho_{\beta,j,t}
================

\exp
\left(
\log p_{\theta_s,\beta,j,t}
---------------------------

\log p_{{\rm beh},\beta,j,t}
\right).
\end{aligned}
]

[
\boxed{
\mathcal J_{\rm GRPO}^{\rm V4}
==============================

\mathrm{UNDISCLOSED}
}
]

[
\boxed{
\begin{aligned}
&
\mathcal J_{\rm GRPO}^{\rm lineage}
===================================

\frac{1}{B_qG}
\sum_{\beta=1}^{B_q}
\sum_{j=1}^{G}
\frac{1}{T_{\beta,j}}
\sum_{t=1}^{T_{\beta,j}}
\
&
\qquad
\left[
\min
\left(
\rho_{\beta,j,t}A_{\beta,j},
\operatorname{clip}
(
\rho_{\beta,j,t},
1-\epsilon,
1+\epsilon
)
A_{\beta,j}
\right)
-------

\beta_{\rm KL}
D_{{\rm KL},\beta,j,t}
\right].
\end{aligned}}
]

[
\boxed{
\begin{aligned}
&
\mathbf{for}\quad
m=1,\ldots,N_{\rm mb}^{\rm RL}:
\
&
\qquad
\mathcal T_{s,m}
\rightarrow
(X,Y,R,M)
\
&
\qquad
Z_\theta
========

\mathsf M_{\theta_s}(X)
\
&
\qquad
\log P_\theta
=============

\log\operatorname{softmax}(Z_\theta)
\
&
\qquad
\mathcal J_{s,m}^{(e)}
======================

\mathfrak G_{\rm V4}
\left(
P_\theta,
P_{\rm behavior},
R,
M
\right)
\
&
\qquad
\mathfrak G_{\rm V4}
====================

\mathrm{UNDISCLOSED}
\
&
\qquad
g_{s,m}
=======

-\nabla_\theta
\mathcal J_{s,m}^{(e)}
\
&
\mathbf{end}
[2mm]
&
\widehat g_s
============

\operatorname{Aggregate}
\left(
{g_{s,m}}*{m=1}^{N*{\rm mb}^{\rm RL}}
\right)
\
&
\theta_{s+1}
============

\operatorname{OPT}
(
\theta_s,
\widehat g_s,
\eta_s^{\rm RL}
)
[1mm]
&
\mathbf{end}
\end{aligned}}
]

[
\boxed{
\theta_{\rm RL}^{(e)}
=====================

\theta_{S_{\rm RL}}^{(e)}
}
]

[
\boxed{
\theta_{\rm SFT}^{(e)}
\xrightarrow[
\substack{
q\sim\mathcal D_{\rm prompt}^{(e)}\
y\sim\pi_{\rm behavior}\
r=\mathcal R^{(e)}(q,y,\mathcal E)
}
]
{\operatorname{GRPO}}
\theta_{\rm RL}^{(e)}
}
]

---

[
\boxed{\textbf{Algorithm 4}\qquad
\mathsf{MULTI\text{-}TEACHER\ OPD}
(
\mathsf M_{\theta_0},
{\mathsf M_{\phi_i}}_{i=1}^{N_T})
}
]

[
\begin{aligned}
&\mathbf{Input}:\
&
\theta_0
========

\theta_{\rm student}^{(0)},
\
&
\Phi
====

{\phi_1,\ldots,\phi_{N_T}},
\qquad
N_T>10,
\
&
\forall i:
\qquad
\nabla_{\phi_i}=0,
\
&
w_i(x)\ge0,
\qquad
\sum_iw_i(x)=1,
\
&
x\sim\mathcal D_{\rm OPD}.
\end{aligned}
]

[
\begin{aligned}
&\mathbf{Prompt\ Batch}:\
&
Q_s
===

{q_1,\ldots,q_{B_q}}
\sim
\mathcal D_{\rm OPD}^{B_q}
\
&
X_s^q
=====

\operatorname{Pad/Pack}
(\tau(Q_s)).
\end{aligned}
]

[
\boxed{
\begin{aligned}
&\mathbf{for}\quad
s=0,\ldots,S_{\rm OPD}-1:
[1mm]
&
\qquad
Q_s
\sim
\mathcal D_{\rm OPD}
[1mm]
&
\qquad
\mathbf{for}\quad
\beta=1,\ldots,B_q:
\
&
\qquad\qquad
Y_\beta
\sim
\pi_{\theta_s}
(\cdot|q_\beta)
\
&
\qquad\qquad
Y_\beta
=======

(y_{\beta,1},\ldots,y_{\beta,T_\beta})
\
&
\qquad
\mathbf{end}
[2mm]
&
\qquad
\mathcal B_s^{\rm OPD}
======================

{
(q_\beta,Y_\beta)
}_{\beta=1}^{B_q}
\
&
\qquad
X_s
===

\operatorname{Serialize}
(
\mathcal B_s^{\rm OPD}
)
\
&
\qquad
X_s
\in
\mathbb N^{B_q\times T_s}
\
&
\qquad
M_s^{\rm gen}
\in
{0,1}^{B_q\times T_s}
[2mm]
&
\qquad
Z_s^S
=====

\mathsf M_{\theta_s}(X_s)
\
&
\qquad
P_s^S
=====

\operatorname{softmax}(Z_s^S)
\
&
\qquad
P_s^S
\in
[0,1]^{B_q\times T_s\times V}.
\end{aligned}}
]

[
\begin{aligned}
&
\mathbf{Teacher\ Selection}:\
&
I_\beta
=======

\mathcal G(q_\beta)
\subseteq
{1,\ldots,N_T}
\
&
w_{\beta,i}
===========

w_i(q_\beta).
\end{aligned}
]

[
\boxed{
\begin{aligned}
&
\mathbf{for}\quad
i\in
\bigcup_{\beta=1}^{B_q}I_\beta:
\
&
\qquad
Z_s^{T_i}
=========

\mathsf M_{\phi_i}(X_s)
\
&
\qquad
P_s^{T_i}
=========

\operatorname{softmax}
(Z_s^{T_i})
\
&
\qquad
\operatorname{stopgrad}
(P_s^{T_i})
===========

P_s^{T_i}
\
&
\mathbf{end}
\end{aligned}}
]

[
\begin{aligned}
&
D_{\beta,t}^{(i)}
=================

D_{\rm KL}
\left(
P_{\beta,t}^{S}
\Vert
P_{\beta,t}^{T_i}
\right)
\
&
=

\sum_{v=1}^{V}
P_{\beta,t,v}^{S}
\log
\frac{
P_{\beta,t,v}^{S}
}{
P_{\beta,t,v}^{T_i}
}.
\end{aligned}
]

[
\boxed{
\begin{aligned}
&
\mathcal L_{\rm OPD}^{(s)}
==========================

\frac{1}{Z_s^{\rm OPD}}
\sum_{\beta=1}^{B_q}
\sum_{t=1}^{T_s}
M_{\beta,t}^{\rm gen}
\sum_{i\in I_\beta}
w_{\beta,i}
D_{\rm KL}
\left(
P_{\beta,t}^{S}
\Vert
P_{\beta,t}^{T_i}
\right)
\
&
Z_s^{\rm OPD}
=============

\mathrm{UNDISCLOSED}.
\end{aligned}}
]

[
\boxed{
\begin{aligned}
&
g_s
===

\nabla_{\theta_s}
\mathcal L_{\rm OPD}^{(s)}
\
&
\widehat g_s
============

\operatorname{Collective}
\left(
{g_s^{(r)}}*{r=1}^{W*{\rm DP}}
\right)
\
&
\theta_{s+1}
============

\operatorname{OPT}
\left(
\theta_s,
\widehat g_s,
\eta_s^{\rm OPD}
\right)
\
&
\phi_{i,s+1}
============

\phi_{i,s},
\qquad
\forall i
\
&
\mathbf{end}
\end{aligned}}
]

[
\boxed{
\theta_{\rm final}
==================

\theta_{S_{\rm OPD}}
}
]

[
\boxed{
\begin{aligned}
&
Y
\sim
\pi_{\theta_s}(\cdot|Q)
\
&
\Downarrow
\
&
P^S
===

\mathsf M_{\theta_s}(Q,Y)
\
&
P^{T_i}
=======

\mathsf M_{\phi_i}(Q,Y)
\
&
\Downarrow
\
&
\mathcal L_{\rm OPD}
====================

\sum_i
w_i
D_{\rm KL}
\left(
P^S
\Vert
P^{T_i}
\right)
\
&
\Downarrow
\
&
\nabla_{\theta}
\mathcal L_{\rm OPD}
\
&
\Downarrow
\
&
\theta_{s+1}.
\end{aligned}}
]

---

[
\boxed{
\begin{array}{ccccccc}
\mathcal D_{\rm pre}
&
\rightarrow&
\mathsf{Batch}*{\rm token}
&
\rightarrow&
\mathsf M*{\theta}
&
\rightarrow&
\mathcal L_{\rm NTP}
+\lambda_{\rm MTP}\mathcal L_{\rm MTP}
+\mathcal L_{\rm Bal}
\
&&&&&&\downarrow\
&&&&&&\theta_{\rm base}
[5mm]
\mathcal D_{\rm SFT}^{(e)}
&
\rightarrow&
\mathsf{Batch}*{(q,a)}
&
\rightarrow&
\mathsf M*{\theta}
&
\rightarrow&
\mathcal L_{\rm SFT}^{(e)}
\
&&&&&&\downarrow\
&&&&&&\theta_{\rm SFT}^{(e)}
[5mm]
\mathcal D_{\rm prompt}^{(e)}
&
\rightarrow&
q,;
Y_{1:G}\sim\pi_{\rm behavior}
&
\rightarrow&
r_{1:G}
&
\rightarrow&
\mathcal J_{\rm GRPO}
\
&&&&&&\downarrow\
&&&&&&\theta_{\rm RL}^{(e)}
[5mm]
\mathcal D_{\rm OPD}
&
\rightarrow&
Y\sim\pi_\theta
&
\rightarrow&
(P^S,P^{T_1},\ldots,P^{T_N})
&
\rightarrow&
\displaystyle
\sum_iw_iD_{\rm KL}(P^S\Vert P^{T_i})
\
&&&&&&\downarrow\
&&&&&&\theta_{\rm final}
\end{array}}
]

[
\boxed{
\theta_0
\xrightarrow{\mathsf{PRETRAIN}}
\theta_{\rm base}
\xrightarrow{\mathsf{SFT}^{(e)}}
\theta_{\rm SFT}^{(e)}
\xrightarrow{\mathsf{RL}^{(e)}}
\theta_{\rm RL}^{(e)}
\xrightarrow{\mathsf{OPD}}
\theta_{\rm final}
}
]
