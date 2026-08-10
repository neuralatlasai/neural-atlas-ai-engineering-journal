---
title: Multi-Model Training Systems
---

# (\mathrm{INPUT})

[
\boxed{
A
::
[
\operatorname{shape}(A);
\operatorname{dtype}(A);
\operatorname{placement}(A);
\operatorname{autograd}(A)
]
}
\qquad [\mathrm{DERIVED}]
]

[
\boxed{
\sigma
\in
\left{
\begin{array}{l}
\mathrm{DeepSeek!-!V4!-!Pro},
\mathrm{DeepSeek!-!V4!-!Flash},
\mathrm{DeepSeek!-!V3.2},
\mathrm{DeepSeek!-!R1},
\
\mathrm{Qwen3.6},
\mathrm{Qwen3.5!-!Omni},
\mathrm{Kimi!-!K3},
\mathrm{GLM!-!5.2}
\end{array}
\right}
}
\qquad [\mathrm{DERIVED}]
]

[
\boxed{
\mathcal M
==========

\mathcal P_{\rm DP}
\times
\mathcal P_{\rm TP}
\times
\mathcal P_{\rm PP}
\times
\mathcal P_{\rm EP}
\times
\mathcal P_{\rm CP}
}
\qquad [\mathrm{DERIVED}]
]

[
\boxed{
\mathfrak S_t
=============

\left(
\theta_t,,
\theta_t^{\rm compute},,
\Omega_t,,
G_t,,
b_t^{\rm router},,
q_t,,
\eta_t,,
\xi_t,,
\mathcal D_t,,
\sigma_t
\right)
}
\qquad [\mathrm{DERIVED}]
]

[
\Omega_t
========

\left{
m_t,,
v_t,,
M_t^{\rm Muon},,
\omega_t^{\rm optimizer}
\right}
\qquad [\mathrm{DERIVED}]
]

[
\theta_t
::
[
|\theta|;
\chi_{\rm master};
\mathcal M_\theta;
grad
],
\qquad
\theta_t^{\rm compute}
::
[
|\theta|;
\chi_{\rm compute};
\mathcal M_\theta;
grad
]
\qquad [\mathrm{DERIVED}]
]

[
\chi_{\rm master},
\chi_{\rm compute},
\chi_g,
\chi_{\Omega}
=============

[\mathrm{UNDISCLOSED}]
\quad
\text{unless model branch fixes them.}
]

[
\boxed{
\begin{array}{c|c|c|c|c}
\sigma & N_L & d & \mathrm{attention} & \mathrm{MoE}\
\hline
\mathrm{DS!-!V4!-!Pro}
&61&7168&
2,\mathrm{HCA};\ \mathrm{CSA/HCA\ interleaved}
&
1+384,\ K=6,\ d_E=3072
\
\mathrm{DS!-!V4!-!Flash}
&43&4096&
2,\mathrm{SWA};\ \mathrm{CSA/HCA\ interleaved}
&
1+256,\ K=6,\ d_E=2048
\
\mathrm{Kimi!-!K3}
&93&7168&
69,\mathrm{KDA}+24,\mathrm{GatedMLA}
&
2+896,\ K=16,\ d_E=3072
\
\mathrm{Qwen3.6!-!35B!-!A3B}
&40&2048&
3,\mathrm{linear}:1,\mathrm{full}
&
1+256,\ K=8,\ d_E=512
\
\mathrm{GLM!-!5.2}
&78&6144&
\mathrm{DSA/MLA}
&
1+256,\ K=8,\ d_E=2048
\end{array}}
\qquad [\mathrm{REPORTED/CODE!-!VERIFIED}]
]

DeepSeek-V4 parameters and topology are explicitly reported. ([arXiv][1]) Kimi-K3 reports (2.78\mathrm T) total/(104.2\mathrm B) active parameters, (93) layers, (d=7168), (896) routed experts with (16) active and two shared experts. ([arXiv][2]) Qwen3.6's released configuration exposes the hybrid (3{:}1) linear/full-attention sequence, (40) layers, (d=2048), (256) experts, (K=8), and BF16 model dtype; these are **post-trained checkpoint configuration facts, not disclosure of the original optimizer/training recipe**. ([Hugging Face][3]) GLM-5.2's official configuration exposes (78) layers, (d=6144), (256) routed experts, (K=8), one shared expert, DSA top-(2048), and BF16. ([Hugging Face][4])

[
\boxed{
\begin{aligned}
\mathrm{Qwen3.6}:&
\quad
{\mathrm{optimizer},\mathrm{peak\ LR},
\mathrm{batch\ schedule},
\mathrm{exact\ PT\ reducer}}
=[\mathrm{UNDISCLOSED}]
\
\mathrm{GLM5.2}:&
\quad
{\mathrm{exact\ original\ optimizer\ hyperparameters},
\mathrm{exact\ PT\ reducer}}
=[\mathrm{UNDISCLOSED}]
\end{aligned}}
]

---

# (\downarrow)

# (\mathrm{STATE\ INITIALIZATION})

[
\boxed{
\theta_0
\sim
\mathcal I_\sigma,
\qquad
\Omega_0
========

\mathcal O_\sigma(\theta_0),
\qquad
q_0=0,
\qquad
b_0^{\rm router}=b_\sigma^{(0)},
\qquad
\xi_0=\xi_\sigma^{(0)}
}
\qquad [\mathrm{DERIVED}]
]

[
\mathcal I_\sigma
=================

[\mathrm{UNDISCLOSED}]
\quad
\text{for exact frontier production initialization.}
]

[
\boxed{
\theta_t
========

\theta_t^{\rm trainable}
\cup
\operatorname{sg}
\left(
\theta^{\rm frozen}
\right)
}
\qquad [\mathrm{DERIVED}]
]

[
\boxed{
\pi_{\rm ref}
=============

\pi_{\operatorname{sg}(\theta_{\rm ref})},
\qquad
\pi_{\rm old}
=============

\pi_{\operatorname{sg}(\theta_{\rm old})},
\qquad
\pi_{\rm rollout}
=================

\pi_{\operatorname{sg}(\theta_{\rm rollout})}
}
\qquad [\mathrm{DERIVED}]
]

---

# (\downarrow)

# (\mathrm{RAW\ SAMPLE\ CONSTRUCTION})

[
\boxed{
\mathcal B_t^{\rm raw}
======================

\left{
x_i^{txt},
x_i^{img},
x_i^{aud},
x_i^{vid},
\zeta_i
\right}_{i=1}^{B_t}
}
\qquad [\mathrm{DERIVED}]
]

[
x_i^{txt}
::
[
L_i^{raw};
\mathrm{UTF/bytes};
host;
frozen
]
\qquad [\mathrm{DERIVED}]
]

[
x_i^{img}
::
[
H_i\times W_i\times C;
\chi_{\rm input};
host/device;
frozen
]
\qquad [\mathrm{DERIVED}]
]

[
x_i^{aud}
::
[
T_i^{wav};
fp32;
host/device;
frozen
]
\qquad [\mathrm{DERIVED}]
]

[
x_i^{vid}
::
[
T_i^{frame}\times H_i\times W_i\times C;
\chi_{\rm input};
host/device;
frozen
]
\qquad [\mathrm{DERIVED}]
]

[
\boxed{
x^{txt}
\xrightarrow{\mathcal N_\sigma}
\tilde x^{txt}
\xrightarrow{\mathcal T_\sigma}
z_{1:L}
}
\qquad [\mathrm{DERIVED}]
]

[
z
::
[
L;
int32/int64;
DP{:}sample;
frozen
]
\qquad [\mathrm{DERIVED}]
]

[
\mathcal N_\sigma
=================

[\mathrm{UNDISCLOSED}]
\quad
\text{where tokenizer normalization is unpublished.}
]

[
\boxed{
\mathrm{DeepSeek!-!V4}:
\qquad
\mathcal D
\xrightarrow{\rm tokenize}
\mathcal D_{\rm tok}
\xrightarrow{\rm pack}
\mathcal B_t,
\qquad
M^{attn}_{ij}=0
\iff
\operatorname{sample}(i)=\operatorname{sample}(j)
}
\qquad [\mathrm{REPORTED}]
]

DeepSeek-V4 explicitly changed pretraining to sample-level attention masking for packed samples. ([arXiv][1])

---

# (\downarrow)

# (\mathrm{MULTIMODAL\ TOKENIZATION})

## (\mathrm{TEXT})

[
\boxed{
z_{1:L}^{txt}
=============

\operatorname{Tokenizer}*{\sigma}
\left(
\mathcal N*\sigma(x^{txt})
\right)
}
\qquad [\mathrm{DERIVED}]
]

[
X^{txt}
=======

E_{\theta_E}
\left[z_{1:L}^{txt}\right]
::
[
L\times d;
\chi_{\rm compute};
DP{:}sample,\ CP{:}sequence;
grad
]
\qquad [\mathrm{DERIVED}]
]

---

## (\mathrm{IMAGE})

[
\boxed{
I
\xrightarrow{\mathcal R_\sigma}
\tilde I
\xrightarrow{\operatorname{Patch}*\sigma}
P
\xrightarrow{V*\phi}
H^{vis}
\xrightarrow{P_{img}}
X^{img}
}
\qquad [\mathrm{DERIVED}]
]

[
P
::
[
L_p\times d_p;
\chi_{\rm compute};
DP{:}sample;
grad/frozen_\sigma
]
]

[
X^{img}
::
[
L_v\times d;
\chi_{\rm compute};
DP{:}sample,\ CP{:}sequence;
grad
]
\qquad [\mathrm{DERIVED}]
]

### (\mathrm{Kimi!-!K3})

[
\boxed{
I/V
\rightarrow
\mathrm{MoonViT!-!V2}*{27L}
\rightarrow
\mathrm{factorized}
\left(
\mathcal A*{\rm spatial},
\mathcal A_{\rm temporal}
\right)
\rightarrow
\mathrm{temporal\ pool}
\rightarrow
\operatorname{PixelShuffle}*{2\times2}
\rightarrow
P*{MLP}
\rightarrow
X^{vis}
}
\qquad [\mathrm{REPORTED}]
]

[
\boxed{
\mathcal L_{\rm vision\ encoder}^{K3}
\subset
\mathcal L_{\rm NTP},
\qquad
\mathcal L_{\rm contrastive}^{K3}
\notin
\mathrm{reported\ PT\ objective}
}
\qquad [\mathrm{REPORTED}]
]

Kimi-K3 trains MoonViT-V2 from scratch under next-token prediction rather than initializing it through contrastive vision pretraining; image/video parameters are shared and (2\times2) pixel shuffle reduces visual token count by (4\times). ([arXiv][2])

---

## (\mathrm{AUDIO})

### (\mathrm{Qwen3.5!-!Omni})

[
\boxed{
a[n]
\xrightarrow{\operatorname{Resample}(16{\rm kHz})}
\tilde a[n]
\xrightarrow{
25{\rm ms\ window},,10{\rm ms\ hop}
}
\mathcal F
\xrightarrow{\operatorname{Mel}_{128}}
M
\xrightarrow{4\times\mathrm{Conv2D}}
\tilde M
\xrightarrow{\mathrm{AuT}}
H^{aud}
}
\qquad [\mathrm{REPORTED}]
]

[
M
::
[
T_{\rm mel}\times128;
\chi_{\rm feature};
DP{:}sample;
frozen
]
]

[
H^{aud}
::
[
T_{\rm aud}\times d_A;
\chi_{\rm compute};
DP{:}sample;
grad
],
\qquad
f_{\rm aud}\simeq6.25\ {\rm Hz}
\qquad [\mathrm{REPORTED}]
]

[
\boxed{
X^{aud}
=======

P_{aud}(H^{aud})
::
[
T_{\rm aud}\times d;
\chi_{\rm compute};
DP{:}sample,\ CP{:}sequence;
grad
]
}
\qquad [\mathrm{DERIVED}]
]

Qwen3.5-Omni explicitly resamples to (16) kHz, constructs (128)-channel Mel features with (25) ms windows and (10) ms hops, applies (16\times) downsampling through four Conv2D blocks, and obtains approximately (6.25) Hz AuT representations. ([arXiv][5])

[
\boxed{
\operatorname{window\ function},
\operatorname{FFT\ size},
\operatorname{Mel\ bounds}
==========================

[\mathrm{UNDISCLOSED}]
}
]

[
\boxed{
\mathrm{Qwen3.5!-!Omni\ input}:
\quad
\mathrm{Mel/AuT}
\neq
\mathrm{RVQ\ Talker\ output\ codec}
}
\qquad [\mathrm{REPORTED}]
]

The Thinker input uses AuT while the Talker retains RVQ-based speech representations; these are distinct state machines. ([arXiv][5])

---

## (\mathrm{VIDEO})

[
\boxed{
V
\xrightarrow{\operatorname{FrameSample}*\sigma}
{I*{\tau_j}}*{j=1}^{T_f}
\xrightarrow{\operatorname{Patch}}
P^{vid}
\xrightarrow{V*\phi}
H^{vid}
\xrightarrow{P_v}
X^{vid}
}
\qquad [\mathrm{DERIVED}]
]

### (\mathrm{Qwen3.5!-!Omni})

[
\boxed{
\tau_j
\mapsto
\Pi^{time}*j,
\qquad
\Delta \Pi^{time}
\equiv160{\rm ms},
\qquad
\Pi*{\rm next}
==============

1+\max\Pi_{\rm previous\ modality}
}
\qquad [\mathrm{REPORTED}]
]

Qwen3.5-Omni uses dynamic frame sampling, explicit timestamp text, and temporal IDs whose resolution is aligned to approximately (160) ms. ([arXiv][5])

---

## (\mathrm{UNIFIED\ SEQUENCE})

[
\boxed{
X
=

\operatorname{Serialize}_\sigma
\left(
X^{txt},
X^{img},
X^{aud},
X^{vid},
X^{special}
\right)
}
\qquad [\mathrm{DERIVED}]
]

[
X
::
[
B_d\times L_c\times d;
\chi_{\rm compute};
DP{:}batch,\ CP{:}sequence;
grad
]
\qquad [\mathrm{DERIVED}]
]

[
Y
::
[
B_d\times L_c;
int;
DP{:}batch,\ CP{:}sequence;
frozen
]
]

[
m^{loss}
::
[
B_d\times L_c;
bool/fp32;
DP{:}batch,\ CP{:}sequence;
frozen
]
]

[
\Pi
::
[
B_d\times L_c\times d_\Pi;
int;
DP{:}batch,\ CP{:}sequence;
frozen
]
]

[
m^{mod}
::
[
B_d\times L_c;
enum;
DP{:}batch,\ CP{:}sequence;
frozen
]
\qquad [\mathrm{DERIVED}]
]

---

# (\downarrow)

# (\mathrm{PACKING/MASKS/POSITIONS})

[
\boxed{
M^{causal}_{btij}
=================

\begin{cases}
0,&j\le i,\
-\infty,&j>i
\end{cases}
}
\qquad [\mathrm{DERIVED}]
]

[
\boxed{
M^{packed}_{bij}
================

\begin{cases}
M^{causal}_{ij},
&
\operatorname{sample}(i)=\operatorname{sample}(j),
\
-\infty,
&
\operatorname{sample}(i)\ne\operatorname{sample}(j)
\end{cases}
}
\qquad [\mathrm{DERIVED}]
]

[
M^{attn}
::
[
B_d\times1\times L_c\times L;
bool/additive;
DP{:}batch,\ CP{:}query;
frozen
]
\qquad [\mathrm{DERIVED}]
]

[
\boxed{
m^{valid}_{bt}
==============

\mathbf 1[
Y_{bt}\notin{\mathrm{padding/nonobjective}}
]
}
\qquad [\mathrm{DERIVED}]
]

[
\boxed{
N_{d,\mu}^{valid}
=================

\sum_{b,t}m^{valid}_{d,\mu,b,t}
}
\qquad [\mathrm{DERIVED}]
]

[
\boxed{
\mathrm{Kimi!-!K3}:
\qquad
\Pi^{explicit}
==============

\varnothing
\quad
\mathrm{for\ KDA/NoPE\ pathway}
}
\qquad [\mathrm{REPORTED}]
]

Kimi-K3 reports NoPE and progressively extends context (8\mathrm K\rightarrow64\mathrm K\rightarrow256\mathrm K\rightarrow1\mathrm M). ([arXiv][2])

---

# (\downarrow)

# (\mathrm{PARALLEL\ LAYOUT})

[
\boxed{
B_{\rm global}
==============

D\cdot B_d,
\qquad
L=C\cdot L_c
}
\qquad [\mathrm{DERIVED}]
]

[
H_\ell
::
[
B_d\times L_c\times d;
\chi_{\rm act};
DP{:}batch,\ CP{:}sequence,\ TP{:}\chi_\ell;
grad
]
\qquad [\mathrm{DERIVED}]
]

[
\boxed{
\mathrm{DP}
\neq
\mathrm{ZeRO/FSDP},
\quad
\mathrm{TP}
\neq
\mathrm{EP},
\quad
\mathrm{SP}
\neq
\mathrm{CP}
}
\qquad [\mathrm{DERIVED}]
]

[
\boxed{
\begin{array}{c|c|c|c}
\mathrm{scheme}&\theta&g&\Omega\
\hline
\mathrm{DDP}&replicated&replicated\ after\ AR&replicated\
\mathrm{ZeRO1}&replicated&RS/owner\ shard&sharded\
\mathrm{ZeRO2}&replicated&sharded&sharded\
\mathrm{ZeRO3/FSDP}&sharded&sharded&sharded
\end{array}}
\qquad [\mathrm{REPORTED}]
]

Megatron-FSDP documents exactly this distinction: DDP all-reduces gradients; ZeRO-1 reduce-scatters final gradients; ZeRO-2 shards gradients and optimizer state; ZeRO-3 additionally shards parameters. ([NVIDIA Docs][6])

---

## (\mathrm{COLLECTIVE\ ALGEBRA})

[
x
::
[
D\times s;
\chi;
\mathrm{DP{:}replica};
grad
]
\xrightarrow{\operatorname{AR}_{\Sigma,DP}}
y_r
===

\sum_{j=1}^{D}x_j
::
[
s;
\chi;
\mathrm{DP{:}replicated};
grad
]
\qquad [\mathrm{DERIVED}]
]

[
\boxed{
\operatorname{AR}_{\Sigma}^{*}
==============================

\operatorname{AR}_{\Sigma}
}
\qquad [\mathrm{DERIVED}]
]

[
x_r
::
[
s/D;
\chi;
P{:}shard(s);
grad
]
\xrightarrow{\operatorname{AG}_{P}}
y
=

\operatorname{concat}_{r=1}^{D}(x_r)
::
[
s;
\chi;
P{:}replicated;
grad
]
\qquad [\mathrm{DERIVED}]
]

[
\boxed{
\operatorname{AG}^{*}
=====================

\operatorname{RS}_{\Sigma}
}
\qquad [\mathrm{DERIVED}]
]

[
x_r
::
[
s;
\chi;
P{:}replicated;
grad
]
\xrightarrow{\operatorname{RS}_{\Sigma,P}}
y_r
===

\operatorname{shard}_r
\left(
\sum_jx_j
\right)
::
[
s/D;
\chi;
P{:}shard(s);
grad
]
\qquad [\mathrm{DERIVED}]
]

[
\boxed{
\operatorname{RS}_{\Sigma}^{*}
==============================

\operatorname{AG}
}
\qquad [\mathrm{DERIVED}]
]

[
x
::
[
T_r\times d;
\chi;
EP{:}token\ owner;
grad
]
\xrightarrow{\operatorname{A2A}_{EP}}
x'
::
[
T_e\times d;
\chi;
EP{:}expert\ owner;
grad
]
\qquad [\mathrm{DERIVED}]
]

[
\boxed{
\operatorname{A2A}^{*}
======================

\operatorname{A2A}^{-1}
}
\qquad [\mathrm{DERIVED}]
]

[
\boxed{
\operatorname{P2P}_{p\rightarrow p+1}^{*}
=========================================

\operatorname{P2P}_{p+1\rightarrow p}
}
\qquad [\mathrm{DERIVED}]
]

---

# (\downarrow)

# (\mathrm{FORWARD})

[
\boxed{
H^{(0)}=X
}
\qquad [\mathrm{DERIVED}]
]

[
\boxed{
H^{(0)}
\xrightarrow{\mathcal F_\sigma^{(0)}}
H^{(1)}
\xrightarrow{}
\cdots
\xrightarrow{\mathcal F_\sigma^{(N_L-1)}}
H^{(N_L)}
}
\qquad [\mathrm{DERIVED}]
]

---

## (\mathrm{RMSNorm})

[
r(x)
====

\sqrt{
\frac1d\sum_{j=1}^{d}x_j^2+\epsilon
}
\qquad [\mathrm{DERIVED}]
]

[
\boxed{
\operatorname{RMSNorm}_\gamma(x)
================================

\gamma\odot\frac{x}{r(x)}
}
\qquad [\mathrm{DERIVED}]
]

[
U_\ell
======

\operatorname{RMSNorm}*{\gamma*\ell}(H_\ell)
::
[
B_d\times L_c\times d;
\chi_{\rm act};
\mathcal M_H;
grad
]
\qquad [\mathrm{DERIVED}]
]

---

## (\mathrm{DENSE/GQA/MLA\ SOFTMAX\ CORE})

[
Q
=

U W_Q
::
[
B_d\times L_c\times N_H\times d_h;
\chi_{\rm act};
TP{:}heads;
grad
]
\qquad [\mathrm{DERIVED}]
]

[
K,V
::
[
B_d\times L_{KV}\times N_{KV}\times d_h;
\chi_{\rm act};
TP/CP;
grad
]
\qquad [\mathrm{DERIVED}]
]

[
\tilde Q,\tilde K
=================

\operatorname{PositionTransform}_{\sigma}(Q,K,\Pi)
\qquad [\mathrm{DERIVED}]
]

[
S
=

\frac{\tilde Q\tilde K^\top}{\sqrt{d_h}}
+
M^{attn}
\qquad [\mathrm{DERIVED}]
]

[
P
=

\operatorname{softmax}_{key}(S)
\qquad [\mathrm{DERIVED}]
]

[
O
=

PV
\qquad [\mathrm{DERIVED}]
]

[
R
=

\operatorname{ConcatHeads}(O)W_O
\qquad [\mathrm{DERIVED}]
]

---

## (\mathrm{DEEPSEEK!-!V4\ mHC})

[
X_\ell^{hc}
===========

[\mathbf x_{\ell,1};\ldots;\mathbf x_{\ell,n_{hc}}]^T
\in
\mathbb R^{n_{hc}\times d}
\qquad [\mathrm{REPORTED}]
]

[
\hat X_\ell
===========

\operatorname{RMSNorm}
\left(
\operatorname{vec}X_\ell^{hc}
\right)
\qquad [\mathrm{REPORTED}]
]

[
\tilde A_\ell
=============

\alpha_\ell^{pre}
\hat X_\ell W_\ell^{pre}
+
S_\ell^{pre}
\qquad [\mathrm{REPORTED}]
]

[
\tilde B_\ell
=============

\alpha_\ell^{res}
\operatorname{Mat}
\left(
\hat X_\ell W_\ell^{res}
\right)
+
S_\ell^{res}
\qquad [\mathrm{REPORTED}]
]

[
\tilde C_\ell
=============

\alpha_\ell^{post}
\left(
\hat X_\ell W_\ell^{post}
\right)^T
+
S_\ell^{post}
\qquad [\mathrm{REPORTED}]
]

[
A_\ell=\sigma(\tilde A_\ell),
\qquad
C_\ell=2\sigma(\tilde C_\ell)
\qquad [\mathrm{REPORTED}]
]

[
M^{(0)}_\ell
============

\exp(\tilde B_\ell)
\qquad [\mathrm{REPORTED}]
]

[
M_\ell^{(k)}
============

\mathcal T_r
\left(
\mathcal T_c(M_\ell^{(k-1)})
\right),
\qquad
k=1,\ldots,20
\qquad [\mathrm{REPORTED}]
]

[
B_\ell
======

M_\ell^{(20)}
\in
\left{
B\ge0:
B\mathbf1=\mathbf1,,
\mathbf1^TB=\mathbf1^T
\right}
\qquad [\mathrm{REPORTED}]
]

[
\boxed{
X_{\ell+1}^{hc}
===============

B_\ell X_\ell^{hc}
+
C_\ell,
\mathcal F_\ell
\left(
A_\ell X_\ell^{hc}
\right)
}
\qquad [\mathrm{REPORTED}]
]

Thus the DeepSeek-V4 residual transition is **not** the ordinary (H_{\ell+1}=H_\ell+F(H_\ell)) transition. The equations above are the reported mHC mapping. ([arXiv][1])

---

## (\mathrm{DEEPSEEK!-!V4\ HCA})

[
C
=

HW^{KV},
\qquad
Z
=

HW^Z
\qquad [\mathrm{REPORTED}]
]

[
C,Z
::
[
L\times c;
\chi_{\rm compute};
CP{:}sequence;
grad
]
]

[
S_{m'i:m'(i+1)-1}
=================

\operatorname{Softmax}*{row}
\left(
Z*{m'i:m'(i+1)-1}+B
\right)
\qquad [\mathrm{REPORTED}]
]

[
\boxed{
C_i^{Comp}
==========

\sum_{j=m'i}^{m'(i+1)-1}
S_j\odot C_j
}
\qquad [\mathrm{REPORTED}]
]

[
C^{Comp}
::
[
(L/m')\times c;
\chi_{\rm KV};
CP{:}compressed\ sequence;
grad
]
\qquad [\mathrm{REPORTED}]
]

[
c_t^Q=h_tW^{DQ},
\qquad
q_t=c_t^QW^{UQ}
\qquad [\mathrm{REPORTED}]
]

DeepSeek-V4 HCA compresses groups of (m') KV entries before dense attention; V4-Pro uses (m'=128), while CSA uses (m=4) and sparse top-(1024). ([arXiv][1])

---

## (\mathrm{KIMI!-!K3\ KDA})

[
q_t^h,k_t^h
===========

\operatorname{L2Norm}
\left[
\operatorname{Swish}
\left(
\operatorname{ShortConv}
(W_{q/k}^hx_t)
\right)
\right]
\qquad [\mathrm{REPORTED}]
]

[
v_t^h
=====

\operatorname{Swish}
\left(
\operatorname{ShortConv}
(W_v^hx_t)
\right)
\qquad [\mathrm{REPORTED}]
]

[
\beta_t^h
=========

\sigma(W_\beta^hx_t)
\qquad [\mathrm{REPORTED}]
]

[
\boxed{
S_t^h
=====

\left(
I-\beta_t^h k_t^h{k_t^h}^{T}
\right)
\operatorname{Diag}(\alpha_t^h)
S_{t-1}^h
+
\beta_t^h k_t^h{v_t^h}^{T}
}
\qquad [\mathrm{REPORTED}]
]

[
\boxed{
\tilde o_t^h
============

{S_t^h}^{T}q_t^h
}
\qquad [\mathrm{REPORTED}]
]

Kimi-K3 interleaves three KDA layers with one Gated-MLA layer and uses NoPE for the long-context recurrence. ([arXiv][2])

---

## (\mathrm{GATED\ FFN})

[
a
=

UW_g
\qquad [\mathrm{DERIVED}]
]

[
b
=

UW_u
\qquad [\mathrm{DERIVED}]
]

[
c
=

\operatorname{SiLU}(a)\odot b
\qquad [\mathrm{DERIVED}]
]

[
F
=

cW_d
\qquad [\mathrm{DERIVED}]
]

### (\mathrm{DeepSeek!-!V4\ clamp})

[
\boxed{
b
\leftarrow
\operatorname{clip}(b,-10,10),
\qquad
\operatorname{SiLU\ gate\ preactivation}
\le10
}
\qquad [\mathrm{REPORTED}]
]

DeepSeek-V4 reports SwiGLU clamping throughout training. ([arXiv][1])

---

## (\mathrm{MoE\ ROUTING})

[
r_{t,e}
=======

h_t^TW_{r,e}
\qquad [\mathrm{DERIVED}]
]

### (\mathrm{DeepSeek!-!V4})

[
\boxed{
s_{t,e}
=======

\sqrt{
\operatorname{softplus}(r_{t,e})
}
}
\qquad [\mathrm{REPORTED}]
]

DeepSeek-V4 replaces V3's sigmoid routing affinity with (\sqrt{\operatorname{Softplus}}), retains auxiliary-loss-free routing, and adds a small sequence-balance objective. ([arXiv][1])

### (\mathrm{Kimi!-!K3})

[
s_{t,e}
=======

\sigma(r_{t,e})
\qquad [\mathrm{REPORTED}]
]

[
\mathcal E_t
============

\operatorname{TopK}*e
(s*{t,e}+b_e,K)
\qquad [\mathrm{REPORTED}]
]

[
I_{t,e}
=======

\mathbf1[e\in\mathcal E_t]
\qquad [\mathrm{DERIVED}]
]

[
g_{t,e}
=======

\frac{
I_{t,e}s_{t,e}
}{
\sum_jI_{t,j}s_{t,j}
}
\qquad [\mathrm{REPORTED}]
]

Kimi-K3 uses the routing bias only for expert assignment; the bias is not included in the actual mixture weight. ([arXiv][2])

[
\boxed{
\frac{\partial I_{t,e}}{\partial r_{t,j}}
=========================================

0
\quad
\mathrm{a.e.}
}
\qquad [\mathrm{DERIVED}]
]

[
\boxed{
\frac{\partial g_{t,e}}{\partial s_{t,j}}
=========================================

I_{t,e}I_{t,j}
\frac{
\delta_{ej}S_t-s_{t,e}
}{
S_t^2
},
\qquad
S_t=\sum_kI_{t,k}s_{t,k}
}
\qquad [\mathrm{DERIVED}]
]

[
\boxed{
\operatorname{sg}(\operatorname{TopK\ membership})
\neq
\operatorname{sg}(r)
}
\qquad [\mathrm{DERIVED}]
]

---

## (\mathrm{EXPERT\ DISPATCH})

[
T^{src}
::
[
N_{\rm tok}K\times d;
\chi_{\rm act};
EP{:}token\ owner;
grad
]
]

[
T^{src}
\xrightarrow{
\operatorname{A2A}*{EP}^{dispatch}
}
T^{expert}
::
[
N_e\times d;
\chi*{\rm act};
EP{:}expert\ owner;
grad
]
\qquad [\mathrm{DERIVED}]
]

[
u_{t,e}
=======

E_e(h_t)
\qquad [\mathrm{DERIVED}]
]

[
u^{expert}
\xrightarrow{
\operatorname{A2A}_{EP}^{combine}
}
u^{src}
\qquad [\mathrm{DERIVED}]
]

[
\boxed{
y_t^{MoE}
=========

E_{shared}(h_t)
+
\sum_{e\in\mathcal E_t}
g_{t,e}E_e(h_t)
}
\qquad [\mathrm{DERIVED}]
]

Kimi-K3's shared experts are replicated across EP while routed experts use all-to-all dispatch/combine. ([arXiv][2])

---

## (\mathrm{OUTPUT\ PROJECTION})

[
Z
=

H^{(N)}W_{\rm vocab}
\qquad [\mathrm{DERIVED}]
]

[
Z
::
[
B_d\times L_c\times V;
\chi_{\rm logits};
DP{:}batch,\ CP{:}sequence,\ TP{:}vocab_{\sigma};
grad
]
\qquad [\mathrm{DERIVED}]
]

---

# (\downarrow)

# (\mathrm{MODEL!-!SPECIFIC\ LOSS})

## (\mathrm{CANONICAL\ NTP\ SUM})

[
p_{btv}
=======

\operatorname{softmax}*v(Z*{btv})
\qquad [\mathrm{DERIVED}]
]

[
\boxed{
\mathcal L^{sum}_{NTP}
======================

*

\sum_{b,t}
m^{loss}*{bt}
\log
p*\theta
\left(
Y_{bt}
\mid
X_{b,\le t}
\right)
}
\qquad [\mathrm{DERIVED}]
]

---

## (\mathrm{DEEPSEEK!-!V4})

[
\boxed{
\mathcal L^{DSV4}
=================

\mathcal L_{NTP}
+
\lambda_{MTP}(q)
\mathcal L_{MTP}
+
10^{-4},
\mathcal L_{\rm seq-bal}
}
\qquad [\mathrm{REPORTED}]
]

[
\lambda_{MTP}
=============

\begin{cases}
0.3,&\mathrm{most\ PT},\
0.1,&\mathrm{LR\ decay\ phase}
\end{cases}
\qquad [\mathrm{REPORTED}]
]

[
\gamma_{router-bias}=10^{-3}
\qquad [\mathrm{REPORTED}]
]

DeepSeek-V4 explicitly reports MTP, sequence-wise balance weight (10^{-4}), routing-bias update speed (10^{-3}), and MTP weight (0.3\rightarrow0.1). ([arXiv][1])

[
\boxed{
\operatorname{Reducer}
\left(
\mathcal L_{NTP},
\mathcal L_{MTP},
\mathcal L_{\rm bal}
\right)_{\rm exact\ production}
===============================

[\mathrm{UNDISCLOSED}]
}
]

---

## (\mathrm{KIMI!-!K3})

[
\boxed{
\mathcal L^{K3}_{PT}
====================

\mathcal L_{NTP}^{text+image+video}
+
\mathcal L_{\rm additional}
}
\qquad [\mathrm{REPORTED/UNDISCLOSED}]
]

[
\mathcal L_{\rm additional}
===========================

[\mathrm{UNDISCLOSED}]
]

[
\boxed{
\mathcal L_{\rm contrastive}^{K3}
\ne
\mathcal L_{\rm reported\ native\ vision\ objective}
}
\qquad [\mathrm{REPORTED}]
]

Kimi-K3 states that visual and textual tokens are jointly trained from the start within a single next-token-prediction objective; its vision encoder is not trained with a separate contrastive initialization objective. ([arXiv][2])

---

## (\mathrm{QWEN3.6})

[
\boxed{
\mathcal L_{\rm PT}^{Qwen3.6}
=============================

[\mathrm{UNDISCLOSED}]
}
]

[
\boxed{
\texttt{router_aux_loss_coef}=10^{-3}
\quad
[\mathrm{CODE!-!VERIFIED}]
}
]

[
\boxed{
\mathcal L_{\rm total}^{Qwen3.6}
\stackrel{\large ?}{=}
\mathcal L_{NTP}
+
10^{-3}\mathcal L_{router}
+\lambda_{MTP}\mathcal L_{MTP}
}
\qquad
[\mathrm{UNDISCLOSED}]
]

The released Qwen3.6 config contains `router_aux_loss_coef=0.001` and one MTP layer, but the checkpoint config does **not uniquely prove the exact original pretraining objective or its complete weighting**, so the summed equation cannot be promoted to reported truth. ([Hugging Face][7])

---

## (\mathrm{GLM!-!5.2})

[
\boxed{
\mathcal L_{\rm PT}^{GLM5.2}
============================

[\mathrm{UNDISCLOSED}]
}
]

[
\boxed{
\begin{aligned}
N_L&=78,
&
N_E&=256,
&
K&=8,
\
\mathrm{router}&=\operatorname{sigmoid},
&
\mathrm{router\ dtype}&=fp32,
&
\mathrm{topk}&=\mathrm{noaux_tc}
\end{aligned}
}
\qquad [\mathrm{CODE!-!VERIFIED}]
]

([Hugging Face][4])

---

# (\downarrow)

# (\mathrm{BACKWARD/VJP})

[
\boxed{
\bar Z
\equiv
\frac{\partial\mathcal L}{\partial Z}
}
\qquad [\mathrm{DERIVED}]
]

[
\boxed{
\bar Z_{btv}
============

m^{loss}*{bt}
\left(
p*{btv}
-------

\mathbf1[v=Y_{bt}]
\right)
}
\qquad [\mathrm{DERIVED}]
]

[
\bar H^{(N)}
============

\bar ZW_{\rm vocab}^{T}
\qquad [\mathrm{DERIVED}]
]

[
\bar W_{\rm vocab}
==================

{H^{(N)}}^T\bar Z
\qquad [\mathrm{DERIVED}]
]

---

## (\mathrm{ATTENTION\ VJP})

[
O=PV
]

[
\boxed{
\bar P
======

\bar O V^T,
\qquad
\bar V
======

P^T\bar O
}
\qquad [\mathrm{DERIVED}]
]

[
\boxed{
\bar S
======

P\odot
\left[
\bar P
------

\left(
\sum_jP_j\bar P_j
\right)\mathbf1
\right]
}
\qquad [\mathrm{DERIVED}]
]

[
\boxed{
\bar Q
======

\frac{\bar SK}{\sqrt{d_h}},
\qquad
\bar K
======

\frac{\bar S^TQ}{\sqrt{d_h}}
}
\qquad [\mathrm{DERIVED}]
]

[
\boxed{
\bar W_Q
========

U^T\bar Q,
\qquad
\bar U_Q
========

\bar QW_Q^T
}
\qquad [\mathrm{DERIVED}]
]

[
\boxed{
\bar W_K
========

U^T\bar K,
\qquad
\bar U_K
========

\bar KW_K^T
}
\qquad [\mathrm{DERIVED}]
]

[
\boxed{
\bar W_V
========

U^T\bar V,
\qquad
\bar U_V
========

\bar VW_V^T
}
\qquad [\mathrm{DERIVED}]
]

---

## (\mathrm{SwiGLU\ VJP})

[
F=cW_d,
\qquad
c=\operatorname{SiLU}(a)\odot b
]

[
\bar c
======

\bar FW_d^T,
\qquad
\bar W_d
========

c^T\bar F
\qquad [\mathrm{DERIVED}]
]

[
\boxed{
\bar a
======

\bar c\odot b\odot\operatorname{SiLU}'(a)
}
\qquad [\mathrm{DERIVED}]
]

[
\boxed{
\bar b
======

\bar c\odot\operatorname{SiLU}(a)
}
\qquad [\mathrm{DERIVED}]
]

[
\bar W_g
========

U^T\bar a,
\qquad
\bar W_u
========

U^T\bar b
\qquad [\mathrm{DERIVED}]
]

[
\boxed{
\bar U_{FFN}
============

\bar aW_g^T
+
\bar bW_u^T
}
\qquad [\mathrm{DERIVED}]
]

---

## (\mathrm{RMSNorm\ VJP})

[
q
=

\bar y\odot\gamma
\qquad [\mathrm{DERIVED}]
]

[
\boxed{
\bar x
======

## \frac{q}{r}

\frac{x}{d,r^3}
\sum_{j=1}^{d}q_jx_j
}
\qquad [\mathrm{DERIVED}]
]

[
\boxed{
\bar\gamma
==========

\bar y\odot\frac{x}{r}
}
\qquad [\mathrm{DERIVED}]
]

---

## (\mathrm{RESIDUAL\ VJP})

[
y=x+F(x)
\qquad [\mathrm{DERIVED}]
]

[
\boxed{
\bar x
======

\bar y
+
J_F(x)^T\bar y
}
\qquad [\mathrm{DERIVED}]
]

---

## (\mathrm{mHC\ VJP})

[
X_{\ell+1}
==========

B_\ell X_\ell
+
C_\ell F_\ell(A_\ell X_\ell)
]

[
u_\ell=A_\ell X_\ell,
\qquad
v_\ell=F_\ell(u_\ell)
\qquad [\mathrm{DERIVED}]
]

[
\bar B_\ell
===========

\bar X_{\ell+1}X_\ell^T
\qquad [\mathrm{DERIVED}]
]

[
\bar C_\ell
===========

\bar X_{\ell+1}v_\ell^T
\qquad [\mathrm{DERIVED}]
]

[
\bar v_\ell
===========

C_\ell^T\bar X_{\ell+1}
\qquad [\mathrm{DERIVED}]
]

[
\bar u_\ell
===========

J_{F_\ell}(u_\ell)^T\bar v_\ell
\qquad [\mathrm{DERIVED}]
]

[
\boxed{
\bar X_\ell
===========

B_\ell^T\bar X_{\ell+1}
+
A_\ell^T\bar u_\ell
+
\bar X_\ell^{dynamic(A,B,C)}
}
\qquad [\mathrm{DERIVED}]
]

[
\bar X_\ell^{dynamic(A,B,C)}
============================

\operatorname{VJP}
\left[
\hat X_\ell
\rightarrow
(\tilde A_\ell,\tilde B_\ell,\tilde C_\ell)
\rightarrow
(A_\ell,B_\ell,C_\ell)
\right]
\qquad [\mathrm{DERIVED}]
]

---

## (\mathrm{MoE\ VJP})

[
y_t
===

\sum_e g_{t,e}E_e(h_t)
]

[
\boxed{
\bar g_{t,e}
============

I_{t,e}
\left\langle
\bar y_t,
E_e(h_t)
\right\rangle
}
\qquad [\mathrm{DERIVED}]
]

[
\boxed{
\bar s_{t,j}
============

\sum_e
\bar g_{t,e}
\frac{\partial g_{t,e}}{\partial s_{t,j}}
}
\qquad [\mathrm{DERIVED}]
]

[
\boxed{
\bar r_{t,j}
============

\bar s_{t,j},
\phi'(r_{t,j})
}
\qquad [\mathrm{DERIVED}]
]

[
\boxed{
\bar h_t
========

\sum_{e\in\mathcal E_t}
g_{t,e}J_{E_e}(h_t)^T\bar y_t
+
W_r\bar r_t
}
\qquad [\mathrm{DERIVED}]
]

[
\boxed{
\frac{\partial I_{t,e}}{\partial r_{t,j}}
=0,
\qquad
\frac{\partial s_{t,e}}{\partial r_{t,e}}
\ne0
}
\qquad [\mathrm{DERIVED}]
]

---

## (\mathrm{KDA\ RECURRENCE\ VJP})

[
S_t=A_tS_{t-1}+B_t,
\qquad
o_t=S_t^Tq_t
\qquad [\mathrm{DERIVED}]
]

[
\boxed{
\bar q_t
\mathrel{+}=
S_t\bar o_t
}
\qquad [\mathrm{DERIVED}]
]

[
\bar S_t
\mathrel{+}=
q_t\bar o_t^T
\qquad [\mathrm{DERIVED}]
]

[
\boxed{
\bar S_{t-1}
\mathrel{+}=
A_t^T\bar S_t
}
\qquad [\mathrm{DERIVED}]
]

[
\bar A_t
========

\bar S_tS_{t-1}^T,
\qquad
\bar B_t
========

\bar S_t
\qquad [\mathrm{DERIVED}]
]

[
(\bar\alpha_t,\bar\beta_t,\bar k_t,\bar v_t)
============================================

\operatorname{VJP}_{A_t,B_t}
(\bar A_t,\bar B_t)
\qquad [\mathrm{DERIVED}]
]

---

## (\mathrm{FULL\ REVERSE\ STATE})

[
\boxed{
\bar Z
\rightarrow
\bar H^{N}
\rightarrow
\bar H^{N-1}
\rightarrow
\cdots
\rightarrow
\bar H^{0}
\rightarrow
\nabla_{\theta_t}\mathcal L_t
}
\qquad [\mathrm{DERIVED}]
]

---

# (\downarrow)

# (\mathrm{COMMUNICATION\ ADJOINTS})

[
\boxed{
\begin{array}{ccl}
\mathrm{forward}&\qquad&\mathrm{backward}[2mm]
\operatorname{AG}*{P}&\leftrightarrow&\operatorname{RS}*{\Sigma,P}\
\operatorname{RS}*{\Sigma,P}&\leftrightarrow&\operatorname{AG}*{P}\
\operatorname{AR}*{\Sigma,P}&\leftrightarrow&\operatorname{AR}*{\Sigma,P}\
\operatorname{A2A}*{P}&\leftrightarrow&\operatorname{A2A}*{P}^{-1}\
\operatorname{P2P}*{i\to j}&\leftrightarrow&\operatorname{P2P}*{j\to i}
\end{array}}
\qquad [\mathrm{DERIVED}]
]

[
\boxed{
\bar x
======

\mathcal C^{*}(\bar y)
}
\qquad [\mathrm{DERIVED}]
]

---

## (\mathrm{FSDP/ZeRO})

[
\theta_r^{shard}
\xrightarrow{
\operatorname{AG}_{DP,\theta}
}
\theta^{full}
\xrightarrow{
\mathcal F
}
H
\qquad [\mathrm{DERIVED}]
]

[
\boxed{
\bar\theta^{full}
\xrightarrow{
\operatorname{RS}_{\Sigma,DP,\theta}
}
\bar\theta_r^{shard}
}
\qquad [\mathrm{DERIVED}]
]

Megatron's distributed optimizer explicitly uses DP reduce-scatter after backward, updates FP32 main-weight shards, converts them to BF16 model parameters, and all-gathers updated parameters for the next forward pass. ([NVIDIA Docs][8])

---

## (\mathrm{DEEPSEEK!-!V4\ HYBRID\ ZeRO/MUON})

[
G_W^{local}
\xrightarrow{
\operatorname{RS}*{DP}
}
G*{W,r}^{owner}
\qquad [\mathrm{REPORTED}]
]

[
\boxed{
\text{no logical Muon matrix may be split}
}
\qquad [\mathrm{REPORTED}]
]

[
\boxed{
\mathrm{MoE\ gradient}
\xrightarrow{\operatorname{SR}_{BF16}}
\tilde G^{bf16}
\xrightarrow{\operatorname{DP\ sync}}
G^{sync}
}
\qquad [\mathrm{REPORTED}]
]

DeepSeek-V4 assigns complete logical matrices to Muon ZeRO owners, pads buckets for reduce-scatter, avoids splitting a logical matrix, and stochastic-rounds MoE gradients to BF16 before data-parallel synchronization. ([arXiv][1])

---

# (\downarrow)

# (\mathrm{MICROBATCH\ ACCUMULATION})

[
\boxed{
\mathcal L_{d,\mu}^{sum}
========================

\sum_{(b,t)\in\mathcal V_{d,\mu}}
\ell_{d,\mu,b,t}
}
\qquad [\mathrm{DERIVED}]
]

[
\boxed{
G_{d,t,\mu}^{local}
===================

\nabla_{\theta_t}
\mathcal L_{d,\mu}^{sum}
}
\qquad [\mathrm{DERIVED}]
]

[
\boxed{
G_{d,t}^{acc}
=============

\sum_{\mu=1}^{M}
G_{d,t,\mu}^{local}
}
\qquad [\mathrm{DERIVED}]
]

[
\boxed{
\operatorname{Accumulation}
\neq
\operatorname{Synchronization}
}
\qquad [\mathrm{DERIVED}]
]

---

# (\downarrow)

# (\mathrm{GLOBAL\ NORMALIZATION})

[
\boxed{
N_t
===

\sum_{d=1}^{D}
\sum_{\mu=1}^{M}
N_{d,\mu}^{valid}
}
\qquad [\mathrm{DERIVED}]
]

### (\mathrm{replicated\ parameter})

[
G_t^{distributed}
=================

\operatorname{AR}*{\Sigma,DP}
\left(
G*{d,t}^{acc}
\right)
\qquad [\mathrm{DERIVED}]
]

[
\boxed{
g_t
===

\frac{
G_t^{distributed}
}{
N_t
}
}
\qquad [\mathrm{DERIVED}]
]

### (\mathrm{ZeRO/FSDP\ owner\ shard})

[
G_{t,r}^{distributed}
=====================

\operatorname{RS}*{\Sigma,DP}
\left(
G*{d,t}^{acc}
\right)_r
\qquad [\mathrm{DERIVED}]
]

[
\boxed{
g_{t,r}
=======

\frac{
G_{t,r}^{distributed}
}{
N_t
}
}
\qquad [\mathrm{DERIVED}]
]

[
\boxed{
\frac1D
\frac1{N_t}
\operatorname{AR}*{\Sigma}(G)
\ne
\frac1{N_t}
\operatorname{AR}*{\Sigma}(G)
}
\qquad [\mathrm{DERIVED}]
]

[
\boxed{
\text{DP averaging}
\neq
\text{valid-token normalization}
}
\qquad [\mathrm{DERIVED}]
]

[
\boxed{
\text{local mean}\rightarrow\text{DP mean}
\equiv
\text{global token mean}
\iff
N_{d}^{valid}
=============

N_{d'}^{valid}
\ \forall d,d'
}
\qquad [\mathrm{DERIVED}]
]

[
\boxed{
\operatorname{ExactReducer}_\sigma
==================================

[\mathrm{UNDISCLOSED}]
}
]

---

# (\downarrow)

# (\mathrm{GLOBAL\ CLIPPING})

[
\mathcal P_{\rm logical}
========================

{\text{unique logical parameters}}
\qquad [\mathrm{DERIVED}]
]

[
\boxed{
\nu_t^2
=======

\operatorname{GlobalReduceSum}
\left(
\sum_{p\in\mathcal P_{\rm physical}}
\frac{
|g_{t,p}|_2^2
}{
\rho_p
}
\right)
}
\qquad [\mathrm{DERIVED}]
]

[
\rho_p
======

#{
\text{physical copies of logical }p
\text{ included in reduction}
}
\qquad [\mathrm{DERIVED}]
]

[
\nu_t=\sqrt{\nu_t^2}
\qquad [\mathrm{DERIVED}]
]

[
\boxed{
\kappa_t
========

\min
\left(
1,
\frac{c_\sigma}{\nu_t+\epsilon_c}
\right)
}
\qquad [\mathrm{DERIVED}]
]

[
\boxed{
g_{t,p}^{\star}
===============

\kappa_tg_{t,p}
}
\qquad [\mathrm{DERIVED}]
]

[
c_{\rm DSV4},
c_{\rm K3},
c_{\rm Qwen3.6},
c_{\rm GLM5.2}
==============

[\mathrm{UNDISCLOSED}]
]

---

# (\downarrow)

# (\mathrm{OPTIMIZER})

## (\mathrm{ADAMW\ STATE})

[
m_t
===

\beta_1m_{t-1}
+
(1-\beta_1)g_t^\star
\qquad [\mathrm{DERIVED}]
]

[
v_t
===

\beta_2v_{t-1}
+
(1-\beta_2)(g_t^\star)^2
\qquad [\mathrm{DERIVED}]
]

[
\chi_{\rm bc}
\in{0,1}
\qquad [\mathrm{DERIVED}]
]

[
\tilde m_t
==========

\begin{cases}
m_t/(1-\beta_1^t),&\chi_{\rm bc}=1\
m_t,&\chi_{\rm bc}=0
\end{cases}
\qquad [\mathrm{DERIVED}]
]

[
\tilde v_t
==========

\begin{cases}
v_t/(1-\beta_2^t),&\chi_{\rm bc}=1\
v_t,&\chi_{\rm bc}=0
\end{cases}
\qquad [\mathrm{DERIVED}]
]

[
\boxed{
\theta_{t+1}
============

## (1-\eta_t\lambda)\theta_t

\eta_t
\frac{
\tilde m_t
}{
\sqrt{\tilde v_t}+\epsilon
}
}
\qquad [\mathrm{DERIVED}]
]

[
\boxed{
\mathrm{AdamW}
\neq
\mathrm{Adam}+\mathrm{L2}
}
\qquad [\mathrm{DERIVED}]
]

---

## (\mathrm{DEEPSEEK!-!V4\ PARAMETER\ PARTITION})

[
\boxed{
\mathcal P^{DSV4}_{AdamW}
=========================

\left{
\begin{array}{l}
\mathrm{embedding},
\mathrm{prediction\ head},
\mathrm{RMSNorm},
\
\mathrm{mHC\ static\ biases},
\mathrm{mHC\ gating\ factors}
\end{array}
\right}
}
\qquad [\mathrm{REPORTED}]
]

[
\boxed{
\mathcal P^{DSV4}_{Muon}
========================

\mathcal P
\setminus
\mathcal P^{DSV4}_{AdamW}
}
\qquad [\mathrm{REPORTED}]
]

DeepSeek-V4 explicitly uses this hybrid optimizer partition. ([arXiv][1])

[
\boxed{
\beta_1=0.9,\quad
\beta_2=0.95,\quad
\epsilon=10^{-20},\quad
\lambda=0.1
}
\qquad [\mathrm{REPORTED}]
]

[
\chi_{\rm bc}^{DSV4}
====================

[\mathrm{UNDISCLOSED}]
]

---

## (\mathrm{DEEPSEEK!-!V4\ MUON})

[
G_t
===

\nabla_W\mathcal L_t(W_{t-1})
\qquad [\mathrm{REPORTED}]
]

[
\boxed{
M_t
===

\mu M_{t-1}
+
G_t
}
\qquad [\mathrm{REPORTED}]
]

[
N_t^{Muon}
==========

\mu M_t+G_t
\qquad [\mathrm{REPORTED}]
]

[
M_0^{NS}
========

\frac{N_t^{Muon}}{|N_t^{Muon}|_F}
\qquad [\mathrm{REPORTED}]
]

[
\boxed{
M_k^{NS}
========

a_kM_{k-1}^{NS}
+
b_k
(M_{k-1}^{NS}{M_{k-1}^{NS}}^T)
M_{k-1}^{NS}
+
c_k
(M_{k-1}^{NS}{M_{k-1}^{NS}}^T)^2
M_{k-1}^{NS}
}
\qquad [\mathrm{REPORTED}]
]

[
(a_k,b_k,c_k)
=============

\begin{cases}
(3.4445,-4.7750,2.0315),
&1\le k\le8,
\
(2,-1.5,0.5),
&9\le k\le10
\end{cases}
\qquad [\mathrm{REPORTED}]
]

[
O_t'
====

M_{10}^{NS}
\approx
UV^T,
\qquad
N_t^{Muon}=U\Sigma V^T
\qquad [\mathrm{REPORTED}]
]

[
\boxed{
O_t
===

O_t'
\sqrt{\max(n,m)}
\gamma
}
\qquad [\mathrm{REPORTED}]
]

[
\boxed{
W_t
===

## W_{t-1}(1-\eta_t\lambda)

\eta_tO_t
}
\qquad [\mathrm{REPORTED}]
]

[
\mu=0.95,
\qquad
\lambda=0.1,
\qquad
\gamma=0.18
\qquad [\mathrm{REPORTED}]
]

These are DeepSeek-V4's reported Muon equations and coefficients, including its Nesterov-style (\mu M_t+G_t) input to hybrid Newton–Schulz. ([arXiv][1])

---

## (\mathrm{KIMI!-!K3\ PER!-!HEAD\ MUON})

[
M_{Q}
=====

\operatorname{Concat}_{h=1}^{N_H}
M_Q^{(h)}
\qquad [\mathrm{DERIVED}]
]

[
\boxed{
O_Q^{(h)}
=========

\operatorname{NewtonSchulz}
\left(
M_Q^{(h)}
\right),
\qquad
h=1,\ldots,N_H
}
\qquad [\mathrm{REPORTED}]
]

[
O_Q
===

\operatorname{Concat}_{h}
O_Q^{(h)}
\qquad [\mathrm{DERIVED}]
]

[
\boxed{
\operatorname{NS}(M_Q)
\neq
\operatorname{Concat}_h
\operatorname{NS}(M_Q^{(h)})
}
\qquad [\mathrm{DERIVED}]
]

[
Q,K,V:
\qquad
\mathrm{NS\ independently\ per\ head}
\qquad [\mathrm{REPORTED}]
]

Kimi-K3 applies Muon to matrix parameters and independently orthogonalizes Q/K/V momentum blocks per attention head. ([arXiv][2])

[
\boxed{
\mathrm{K3\ exact\ Newton!-!Schulz\ coefficients}
=================================================

[\mathrm{UNDISCLOSED\ in\ K3\ report}]
}
]

[
\boxed{
\mathrm{K3\ exact\ QK\ clipping\ threshold}
===========================================

[\mathrm{UNDISCLOSED}]
}
]

---

# (\downarrow)

# (\mathrm{ROUTER/CONTROL\ STATE})

## (\mathrm{KIMI!-!K3\ QUANTILE\ BALANCING})

[
\alpha_i^{(t)}
==============

\operatorname{TopKCutoff}
\left(
s_{i,:}+b^{(t)},
K
\right)
\qquad [\mathrm{REPORTED}]
]

[
\boxed{
\hat b_j^{(t+1)}
================

*

\operatorname{quantile}*{1-K/N_E}
\left(
s*{:,j}-\alpha^{(t)}
\right)
}
\qquad [\mathrm{REPORTED}]
]

[
\boxed{
b^{(t+1)}
=========

## \hat b^{(t+1)}

\operatorname{mean}
\left(
\hat b^{(t+1)}
\right)\mathbf1
}
\qquad [\mathrm{REPORTED}]
]

[
\boxed{
\mathcal E_i^{(t)}
==================

\operatorname{TopK}
(s_i+b^{(t)})
,\qquad
b^{(t+1)}
\not\to
\mathcal E_i^{(t)}
}
\qquad [\mathrm{REPORTED}]
]

[
\mathrm{histogram}_{global}
===========================

\operatorname{AR}*{\Sigma}
\left(
\mathrm{histogram}*{rank}
\right)
\qquad [\mathrm{REPORTED}]
]

Kimi-K3's quantile-balancing bias is computed from global-batch histograms and takes effect only on the following step. ([arXiv][2])

---

## (\mathrm{DEEPSEEK!-!V4\ ANTICIPATORY\ ROUTING})

[
\boxed{
\mathcal E_t
============

\operatorname{sg}
\left[
\operatorname{Route}
\left(
\mathcal B_t;
\theta_{t-\Delta_t}
\right)
\right]
}
\qquad [\mathrm{DERIVED\ from\ REPORTED\ mechanism}]
]

[
\xi_t
=====

\left(
\mathcal E_t^{cached},
\Delta_t,
\mathrm{AR\ enabled}_t
\right)
\qquad [\mathrm{DERIVED}]
]

[
\Delta_t
========

[\mathrm{UNDISCLOSED}]
]

DeepSeek-V4 reports pre-computing and caching future routing indices and dynamically enabling this mechanism around detected loss spikes. ([arXiv][1])

---

# (\downarrow)

# (\mathrm{SCHEDULER})

[
\boxed{
q_{t+1}
=======

q_t
+
N_t
}
\qquad [\mathrm{DERIVED}]
]

[
\boxed{
t_{\rm opt}
\neq
q_t
}
\qquad [\mathrm{DERIVED}]
]

---

## (\mathrm{DEEPSEEK!-!V4!-!FLASH})

[
\eta_t
======

\begin{cases}
2.7\times10^{-4}
\dfrac{t}{2000},
&0\le t<2000,
[2mm]
2.7\times10^{-4},
&2000\le t<t_{decay},
[2mm]
\eta_{\cos}(t),
&t_{decay}\le t\le T
\end{cases}
\qquad [\mathrm{REPORTED}]
]

[
\eta_{\cos}(t_{decay})
======================

2.7\times10^{-4},
\qquad
\eta_{\cos}(T)
==============

2.7\times10^{-5}
\qquad [\mathrm{REPORTED}]
]

[
t_{decay}
=========

[\mathrm{UNDISCLOSED}]
]

[
\boxed{
L(q):
4K
\rightarrow
16K
\rightarrow
64K
\rightarrow
1M
}
\qquad [\mathrm{REPORTED}]
]

[
\boxed{
q<1T:
\mathcal A=\mathrm{dense},
\qquad
\mathrm{sparsity\ introduced\ at}\ L=64K
}
\qquad [\mathrm{REPORTED}]
]

DeepSeek-V4-Flash trains on (32)T tokens, warms up for (2000) optimizer steps, reaches (75.5)M-token batches, and progressively extends sequence length to (1)M. ([arXiv][1])

---

## (\mathrm{KIMI!-!K3})

[
\boxed{
\eta(q)
=======

\operatorname{CosineDecay}
\left(
q;
\eta_{\max},
\eta_{\min}
\right),
\qquad
q<0.01Q:
\operatorname{LinearWarmup}
}
\qquad [\mathrm{REPORTED}]
]

[
\eta_{\max},
\eta_{\min},
\operatorname{exact\ independent\ variable}
===========================================

[\mathrm{UNDISCLOSED}]
]

Kimi-K3 reports cosine decay with (1%) linear warmup and weight decay (0.1), but does not disclose enough information to uniquely reconstruct all LR endpoints/indexing details. ([arXiv][2])

---

# (\downarrow)

# (\mathrm{SFT})

[
\rho_t
\in
\left{
\begin{array}{l}
system,\ user,\ assistant_reasoning,\ assistant_final,\
tool_call,\ tool_observation,\ special
\end{array}
\right}
\qquad [\mathrm{DERIVED}]
]

[
\boxed{
m_t^{SFT}
=========

m_t^{valid},
a_\sigma(\rho_t)
}
\qquad [\mathrm{DERIVED}]
]

[
a_\sigma(\rho)
\in{0,1}
\qquad [\mathrm{DERIVED}]
]

[
\boxed{
\mathcal L_{SFT}
================

*

\frac{
\sum_t
m_t^{SFT}
\log
\pi_\theta
(y_t|x,y_{<t})
}{
\sum_t m_t^{SFT}
}
}
\qquad [\mathrm{DERIVED}]
]

[
\boxed{
a_{\rm DeepSeek}(\rho),
a_{\rm Qwen}(\rho),
a_{\rm Kimi}(\rho),
a_{\rm GLM}(\rho)
=================

[\mathrm{UNDISCLOSED}]
}
]

[
\boxed{
\text{chat-template serialization}
\neq
\text{loss-mask disclosure}
}
\qquad [\mathrm{DERIVED}]
]

---

## (\mathrm{KIMI!-!K3})

[
\boxed{
\theta_{PT}
\xrightarrow{
\mathrm{SFT}*{XTML/agent\ trajectories}
}
\theta*{SFT}
}
\qquad [\mathrm{REPORTED}]
]

Kimi-K3 reports a cold-start SFT stage with expanded agentic trajectories and XTML serialization before RL. ([arXiv][2])

---

## (\mathrm{DEEPSEEK!-!V4})

[
\boxed{
\theta_{PT}
\xrightarrow{
\mathrm{SFT}^{domain=d}
}
\theta_{d,0}
\xrightarrow{
\mathrm{GRPO}^{domain=d}
}
\theta_{d}^{expert}
}
\qquad [\mathrm{REPORTED}]
]

DeepSeek-V4 trains each domain specialist with high-quality domain-specific SFT followed by GRPO. ([arXiv][1])

---

## (\mathrm{DEEPSEEK!-!R1})

[
\boxed{
\theta_{V3Base}
\xrightarrow{\mathrm{GRPO}}
\theta_{R1Zero}
}
\qquad [\mathrm{REPORTED}]
]

[
\boxed{
\theta_{V3Base}
\rightarrow
\theta_{\rm cold\ SFT}
\rightarrow
\theta_{\rm reasoning\ RL}
\rightarrow
\theta_{\rm rejection\ SFT}
\rightarrow
\theta_{\rm all\ scenario\ RL}
==============================

\theta_{R1}
}
\qquad [\mathrm{REPORTED}]
]

DeepSeek-R1-Zero starts RL directly from the base model; DeepSeek-R1 instead introduces cold-start SFT, reasoning RL, rejection-sampling SFT, and a final RL stage. ([arXiv][9])

---

# (\downarrow)

# (\mathrm{RL})

## (\mathrm{STOP!-!GRADIENT\ CONTRACT})

[
\boxed{
\tau
====

\operatorname{sg}(\tau),
\qquad
R
=

\operatorname{sg}(R),
\qquad
A
=

\operatorname{sg}(A)
}
\qquad [\mathrm{DERIVED}]
]

[
\boxed{
\pi_{\rm old},
\pi_{\rm ref},
\pi_{\rm rollout},
\pi_T
=====

\operatorname{sg}
\left(
\pi_{\rm old},
\pi_{\rm ref},
\pi_{\rm rollout},
\pi_T
\right)
}
\qquad [\mathrm{DERIVED}]
]

[
\boxed{
\mathcal E^{route},
\mathcal M^{sampling}
=====================

\operatorname{sg}
\left(
\mathcal E^{route},
\mathcal M^{sampling}
\right)
}
\qquad [\mathrm{DERIVED}]
]

---

## (\mathrm{PPO})

[
\tau
====

(s_0,a_0,r_0,\ldots)
\sim
\pi_{\theta_{\rm old}}
\qquad [\mathrm{REPORTED}]
]

[
\delta_t
========

r_t
+
\gamma V_\phi(s_{t+1})
----------------------

V_\phi(s_t)
\qquad [\mathrm{REPORTED}]
]

[
\boxed{
A_t^{GAE}
=========

\sum_{l=0}^{T-t-1}
(\gamma\lambda)^l
\delta_{t+l}
}
\qquad [\mathrm{REPORTED}]
]

[
\rho_t(\theta)
==============

\frac{
\pi_\theta(a_t|s_t)
}{
\pi_{\theta_{\rm old}}(a_t|s_t)
}
\qquad [\mathrm{REPORTED}]
]

[
\boxed{
J_{PPO}
=======

\mathbb E_t
\left[
\min
\left(
\rho_tA_t,
\operatorname{clip}
(\rho_t,1-\epsilon,1+\epsilon)A_t
\right)
\right]
}
\qquad [\mathrm{REPORTED}]
]

[
\boxed{
\mathcal L_V
============

\mathbb E
\left[
(V_\phi(s)-R)^2
\right]
}
\qquad [\mathrm{REPORTED}]
]

The PPO/GAE equations and explicit value model are distinguished in the SAO paper's PPO baseline discussion. ([arXiv][10])

[
\boxed{
\mathrm{PPO}
\neq
\mathrm{GRPO}
}
\qquad [\mathrm{DERIVED}]
]

---

## (\mathrm{DEEPSEEK!-!V3.2\ GRPO})

[
\boxed{
o_i
\sim
\pi_{\rm old}(\cdot|q),
\qquad
i=1,\ldots,G
}
\qquad [\mathrm{REPORTED}]
]

[
\boxed{
\hat A_i
========

## R_i

\frac1G\sum_{j=1}^{G}R_j
}
\qquad [\mathrm{REPORTED}]
]

[
\rho_{i,t}
==========

\frac{
\pi_\theta(o_{i,t}|q,o_{i,<t})
}{
\pi_{\rm old}(o_{i,t}|q,o_{i,<t})
}
\qquad [\mathrm{REPORTED}]
]

[
\boxed{
J_{\rm clip}^{GRPO}
===================

\frac1G
\sum_i
\frac1{|o_i|}
\sum_t
\min
\left(
\rho_{i,t}\hat A_i,
\operatorname{clip}
(\rho_{i,t},1-\epsilon,1+\epsilon)
\hat A_i
\right)
}
\qquad [\mathrm{REPORTED}]
]

[
u_{i,t}
=======

\frac{
\pi_{\rm ref}(o_{i,t})
}{
\pi_\theta(o_{i,t})
}
\qquad [\mathrm{DERIVED}]
]

[
\boxed{
\widehat D^{V3.2}_{KL,t}
========================

\frac{
\pi_\theta(o_t)
}{
\pi_{\rm old}(o_t)
}
\left[
u_t-\log u_t-1
\right]
}
\qquad [\mathrm{REPORTED}]
]

[
\boxed{
\widehat D^{V3.2}*{KL}
\longrightarrow
D*{KL}
\left(
\pi_\theta\Vert\pi_{\rm ref}
\right)
}
\qquad [\mathrm{REPORTED}]
]

[
\boxed{
J_{\rm V3.2}
============

## J_{\rm clip}^{GRPO}

\beta
\widehat D_{KL}^{V3.2}
}
\qquad [\mathrm{REPORTED}]
]

DeepSeek-V3.2 reports GRPO together with explicit off-policy corrections, KL estimation, and mechanisms for preserving rollout/training consistency. ([arXiv][11])

[
\boxed{
M_i^{off}
=========

\begin{cases}
0,
&
A_i<0
\land
\dfrac1{|o_i|}
\sum_t
\log
\frac{\pi_{\rm old}(o_{i,t})}
{\pi_\theta(o_{i,t})}

> \delta,
> \
> 1,&\text{otherwise}
> \end{cases}
> }
> \qquad [\mathrm{REPORTED}]
> ]

[
J_{\rm surrogate}
\leftarrow
M_i^{off}J_{\rm surrogate}
\qquad [\mathrm{REPORTED}]
]

[
\boxed{
\mathcal E^{train}_{i,t}
========================

\operatorname{sg}
\left(
\mathcal E^{rollout}_{i,t}
\right)
}
\qquad [\mathrm{REPORTED}]
]

[
\boxed{
\mathcal M^{sample,train}_{i,t}
===============================

\operatorname{sg}
\left(
\mathcal M^{sample,rollout}_{i,t}
\right)
}
\qquad [\mathrm{REPORTED}]
]

---

## (\mathrm{GLM!-!SAO})

[
\boxed{
a_t
\sim
\pi_{\rm rollout}(\cdot|s_t)
}
\qquad [\mathrm{REPORTED}]
]

[
\boxed{
r_t(\theta)
===========

\exp
\left[
\log\pi_\theta(a_t|s_t)
-----------------------

\operatorname{sg}
\log\pi_{\rm rollout}(a_t|s_t)
\right]
}
\qquad [\mathrm{REPORTED}]
]

[
\boxed{
f(r;\epsilon_l,\epsilon_h)
==========================

\begin{cases}
r,
&
1-\epsilon_l<r<1+\epsilon_h,
\
0,
&
\text{otherwise}
\end{cases}
}
\qquad [\mathrm{REPORTED}]
]

[
\boxed{
L_{SAO}(\theta)
===============

\hat{\mathbb E}*t
\left[
f(r_t;\epsilon_l,\epsilon_h)
\operatorname{sg}(\hat A_t)
\log\pi*\theta(a_t|s_t)
\right]
}
\qquad [\mathrm{REPORTED}]
]

[
\boxed{
r_t\notin
(1-\epsilon_l,1+\epsilon_h)
\Longrightarrow
\nabla_\theta L_t
=================

0
}
\qquad [\mathrm{DERIVED}]
]

[
\boxed{
\pi_{\rm old}
\notin
\mathrm{SAO\ ratio}
}
\qquad [\mathrm{REPORTED}]
]

SAO directly compares the current policy against stored rollout log-probabilities, removes the old-policy model from the ratio, and completely masks token gradients outside the two-sided trust region. ([arXiv][10])

[
\boxed{
\mathrm{SAO}
\neq
\mathrm{PPO\ clipping}
}
\qquad [\mathrm{DERIVED}]
]

### (\mathrm{SAO\ critic})

[
\delta_t
========

r_t+\gamma V_\phi(s_{t+1})-V_\phi(s_t)
\qquad [\mathrm{REPORTED}]
]

[
A_t
===

\sum_l(\gamma\lambda)^l\delta_{t+l}
\qquad [\mathrm{REPORTED}]
]

[
\boxed{
\phi_{\rm attention}
====================

\operatorname{sg}
(\phi_{\rm attention}),
\qquad
\phi_{\rm MoE}
==============

\mathrm{trainable}
}
\qquad [\mathrm{REPORTED}]
]

SAO reports a value model with attention parameters frozen to stabilize critic training. ([arXiv][10])

---

## (\mathrm{KIMI!-!K3\ RL})

[
\boxed{
\mathcal E_{\rm K3}^{expert}
============================

{
(d,e):
d\in
{\mathrm{general},\mathrm{general\ agent},\mathrm{coding}},

e\in{\mathrm{low},\mathrm{high},\mathrm{max}}
}
}
\qquad [\mathrm{REPORTED}]
]

[
|\mathcal E_{\rm K3}^{expert}|=9
\qquad [\mathrm{REPORTED}]
]

[
b_0(x)
======

\operatorname{sg}
\left(
\operatorname{BudgetEstimate}_{cold}(x)
\right)
\qquad [\mathrm{REPORTED}]
]

[
\boxed{
R'(x,y)
=======

\begin{cases}
-1,
&T(y)>\tau b_0(x),
\
R(x,y),
&T(y)\le\tau b_0(x)
\end{cases}
}
\qquad [\mathrm{REPORTED}]
]

[
\boxed{
\tau_{\max}
\rightarrow
\tau_{\rm high}
\rightarrow
\tau_{\rm low}
}
\qquad [\mathrm{REPORTED}]
]

Kimi-K3 applies per-problem reasoning budgets and a stage-wise (\tau) curriculum to create max/high/low effort experts. ([arXiv][2])

[
\boxed{
\mathcal L_{\rm actor}^{K3}
===========================

[\mathrm{UNDISCLOSED\ in\ K3\ report}]
}
]

The K3 report says its partial-rollout policy optimization follows Kimi-K2.5 and uses per-token regularization for stale data, but does not restate enough of the complete actor objective to justify inventing a new K3-specific equation. ([arXiv][2])

---

## (\mathrm{DEEPSEEK!-!V4\ OPD})

[
\tau
\sim
\pi_\theta
\qquad [\mathrm{REPORTED}]
]

[
\boxed{
\mathcal L_{OPD}(\theta)
========================

\sum_{i=1}^{N_E}
w_i
D_{KL}
\left(
\pi_\theta
\Vert
\pi_{E_i}
\right)
}
\qquad [\mathrm{REPORTED}]
]

[
\boxed{
D_{KL}
(\pi_\theta\Vert\pi_E)
======================

\sum_v
\pi_\theta(v|s)
\log
\frac{
\pi_\theta(v|s)
}{
\operatorname{sg}\pi_E(v|s)
}
}
\qquad [\mathrm{DERIVED}]
]

[
\boxed{
D_{KL}
(\pi_\theta\Vert\pi_E)
\neq
D_{KL}
(\pi_E\Vert\pi_\theta)
}
\qquad [\mathrm{DERIVED}]
]

DeepSeek-V4 consolidates more than ten specialist teachers using student-on-policy, full-distribution reverse-KL OPD. ([arXiv][1])

---

## (\mathrm{KIMI!-!K3\ MOPD})

[
(d,e)
\sim
\mathcal D_{\rm domain}\times
{\mathrm{low},\mathrm{high},\mathrm{max}}
\qquad [\mathrm{REPORTED}]
]

[
y_t
\sim
\pi_\theta(\cdot|x,e,y_{<t})
\qquad [\mathrm{REPORTED}]
]

[
\boxed{
r_{OPD}^{d,e}(y_t)
==================

\operatorname{clip}
\left[
\operatorname{sg}
\left(
\log
\frac{
\pi_{teacher}^{d,e}(y_t|x,y_{<t})
}{
\pi_\theta(y_t|e,x,y_{<t})
}
\right),
-R_{\max},R_{\max}
\right]
}
\qquad [\mathrm{REPORTED}]
]

Kimi-K3 reports nine domain/effort teachers and this clipped per-token OPD reward for MOPD. ([arXiv][2])

---

## (\mathrm{RLAIF})

[
x
\sim
\mathcal D
\qquad [\mathrm{REPORTED}]
]

[
y^{(1)},y^{(2)}
\sim
\pi_{\rm SFT}(\cdot|x)
\qquad [\mathrm{REPORTED}]
]

[
\boxed{
c
=

\operatorname{sg}
\left[
\operatorname{AIJudge}
\left(
x,y^{(1)},y^{(2)},\mathcal C
\right)
\right]
}
\qquad [\mathrm{REPORTED}]
]

[
\mathcal D_{\rm pref}^{AI}
==========================

{
(x,y^+,y^-)
}
\qquad [\mathrm{DERIVED}]
]

[
\boxed{
\phi^\star
==========

\arg\min_\phi
\left[
------

\log
\sigma
\left(
r_\phi(x,y^+)
-------------

r_\phi(x,y^-)
\right)
\right]
}
\qquad [\mathrm{DERIVED}]
]

[
R(\tau)
=======

\operatorname{sg}
r_{\phi^\star}(\tau)
\qquad [\mathrm{DERIVED}]
]

[
\boxed{
\theta_{k+1}
============

\operatorname{RLUpdate}
\left(
\theta_k;
R(\tau)
\right)
}
\qquad [\mathrm{REPORTED}]
]

[
\boxed{
\mathrm{AI\ preference\ production}
\neq
\mathrm{reward\ model\ training}
\neq
\mathrm{policy\ optimization}
}
\qquad [\mathrm{DERIVED}]
]

Constitutional AI's RLAIF pipeline explicitly separates AI comparison generation, preference-model construction, and subsequent RL using that preference model as the reward signal. ([arXiv][12])

---

# (\downarrow)

# (\mathrm{OUTPUT})

[
\boxed{
\begin{aligned}
\mathfrak S_t
&=
(
\theta_t,
\Omega_t,
b_t,
q_t,
\eta_t,
\xi_t
)
[1mm]
&\xrightarrow{\mathcal B_t}
(X_t,Y_t,M_t,\Pi_t,m_t)
[1mm]
&\xrightarrow{\mathcal F_{\theta_t}}
Z_t
[1mm]
&\xrightarrow{\mathcal L_{\sigma_t}}
\mathcal L_t
[1mm]
&\xrightarrow{\operatorname{VJP}}
G_t^{local}
[1mm]
&\xrightarrow{\operatorname{Accum}}
G_t^{acc}
[1mm]
&\xrightarrow{\operatorname{DistributedAdjoints}}
G_t^{distributed}
[1mm]
&\xrightarrow{\operatorname{Normalize}*{N_t}}
g_t
[1mm]
&\xrightarrow{\operatorname{Clip}*{c_\sigma}}
g_t^\star
[1mm]
&\xrightarrow{\operatorname{Optimizer}*{\sigma}}
(
\theta*{t+1},
\Omega_{t+1}
)
[1mm]
&\xrightarrow{\operatorname{Control/Schedule}}
(
b_{t+1},
q_{t+1},
\eta_{t+1},
\xi_{t+1}
)
[1mm]
&=
\mathfrak S_{t+1}.
\end{aligned}
}
\qquad [\mathrm{DERIVED}]
]

[
\boxed{
q_{t+1}
=======

q_t+
\sum_{d,\mu}
N_{d,\mu}^{valid}
}
\qquad [\mathrm{DERIVED}]
]

[
\boxed{
\theta_{\rm init}
\xrightarrow{
\prod_t\mathfrak F_{\rm PT}^{(\sigma)}
}
\theta_{\rm pretrained}
\xrightarrow{
\prod_t\mathfrak F_{\rm mid}^{(\sigma)}
}
\theta_{\rm mid}
\xrightarrow{
\prod_t\mathfrak F_{\rm SFT}^{(\sigma)}
}
\theta_{\rm supervised}
\xrightarrow{
\prod_k\mathfrak F_{\rm RL}^{(\sigma)}
}
\theta_{\rm specialist}
\xrightarrow{
\prod_j\mathfrak F_{\rm OPD/MOPD}^{(\sigma)}
}
\theta_{\rm final}
}
\qquad [\mathrm{DERIVED}]
]

[
\mathfrak F_{\rm mid}^{(\sigma)}
================================

\mathrm{Id}
\quad
\text{when no disclosed mid-training stage exists}
\qquad [\mathrm{DERIVED}]
]

[
\boxed{
\mathfrak F_{\rm PT}
\neq
\mathfrak F_{\rm SFT}
\neq
\mathfrak F_{\rm PPO}
\neq
\mathfrak F_{\rm GRPO}
\neq
\mathfrak F_{\rm SAO}
\neq
\mathfrak F_{\rm OPD}
}
\qquad [\mathrm{DERIVED}]
]

[
\boxed{
\begin{aligned}
&\operatorname{AllReduce}
\neq
\operatorname{ReduceScatter}
\neq
\operatorname{AllGather}
\neq
\operatorname{AllToAll},
\
&\operatorname{gradient\ accumulation}
\neq
\operatorname{gradient\ synchronization},
\
&\operatorname{token\ normalization}
\neq
\operatorname{DP\ averaging},
\
&\operatorname{router\ probability}
\neq
\operatorname{TopK\ membership},
\
&\operatorname{MTP}
\neq
\operatorname{NTP},
\
&D_{KL}(\pi_\theta\Vert\pi_{\rm ref})
\neq
D_{KL}(\pi_{\rm ref}\Vert\pi_\theta),
\
&\operatorname{Muon}
\neq
\operatorname{AdamW},
\
&\operatorname{vision\ contrastive\ PT}
\neq
\operatorname{multimodal\ autoregressive\ PT},
\
&[\mathrm{REPORTED}]
\neq
[\mathrm{CODE!-!VERIFIED}]
\neq
[\mathrm{DERIVED}]
\neq
[\mathrm{UNDISCLOSED}].
\end{aligned}
}
\qquad [\mathrm{DERIVED}]
]

[
\boxed{
\begin{aligned}
\mathcal V_{\rm audit}
=&
\mathbf1[
\mathrm{shape\ consistent}]
\mathbf1[
\mathrm{dtype\ consistent}]
\mathbf1[
\mathrm{ownership\ consistent}]
\
&\cdot
\mathbf1[
\mathrm{autograd\ consistent}]
\mathbf1[
\mathrm{collective\ consistent}]
\mathbf1[
\mathrm{objective\ consistent}]
\
&\cdot
\mathbf1[
\mathrm{optimizer\ group\ consistent}]
\mathbf1[
\mathrm{scheduler\ index\ consistent}]
\mathbf1[
\mathrm{policy\ identity\ consistent}]
\end{aligned}
}
\qquad [\mathrm{DERIVED}]
]

[
\boxed{
\mathcal V_{\rm audit}=0
\Longrightarrow
\mathrm{claim}
\leftarrow
[\mathrm{UNDISCLOSED}]
}
\qquad [\mathrm{DERIVED}]
]

[
\boxed{
\text{minimal complete executable mathematical truth}
=====================================================

\left[
\mathfrak S_t
\rightarrow
\mathcal B_t
\rightarrow
\mathcal F_{\theta_t}
\rightarrow
\mathcal L_t
\rightarrow
\operatorname{VJP}
\rightarrow
\mathcal C^\ast
\rightarrow
\operatorname{Accum}
\rightarrow
\operatorname{Normalize}
\rightarrow
\operatorname{Clip}
\rightarrow
\operatorname{Optimizer}
\rightarrow
\mathfrak S_{t+1}
\right]
}
\qquad [\mathrm{DERIVED}]
]

[1]: https://arxiv.org/html/2606.19348v1 "https://arxiv.org/html/2606.19348v1"
[2]: https://arxiv.org/pdf/2607.24653 "https://arxiv.org/pdf/2607.24653"
[3]: https://huggingface.co/Qwen/Qwen3.6-35B-A3B "https://huggingface.co/Qwen/Qwen3.6-35B-A3B"
[4]: https://huggingface.co/zai-org/GLM-5.2/blob/main/config.json "https://huggingface.co/zai-org/GLM-5.2/blob/main/config.json"
[5]: https://arxiv.org/html/2604.15804v2 "https://arxiv.org/html/2604.15804v2"
[6]: https://docs.nvidia.com/megatron-core/developer-guide/0.18.2/user-guide/features/megatron_fsdp.html "https://docs.nvidia.com/megatron-core/developer-guide/0.18.2/user-guide/features/megatron_fsdp.html"
[7]: https://huggingface.co/Qwen/Qwen3.6-35B-A3B/blob/main/config.json "https://huggingface.co/Qwen/Qwen3.6-35B-A3B/blob/main/config.json"
[8]: https://docs.nvidia.com/megatron-core/developer-guide/0.16.0/user-guide/features/dist_optimizer.html "https://docs.nvidia.com/megatron-core/developer-guide/0.16.0/user-guide/features/dist_optimizer.html"
[9]: https://arxiv.org/html/2501.12948v1 "https://arxiv.org/html/2501.12948v1"
[10]: https://arxiv.org/html/2607.07508v1 "https://arxiv.org/html/2607.07508v1"
[11]: https://arxiv.org/abs/2512.02556 "https://arxiv.org/abs/2512.02556"
[12]: https://arxiv.org/abs/2212.08073 "https://arxiv.org/abs/2212.08073"
