---
title: Multi-Model Trainer
---

[
\boxed{
\mathrm{INPUT}
\rightarrow
\mathrm{INITIALIZE}
\rightarrow
\mathrm{PREPROCESS}
\rightarrow
\mathrm{FORWARD}
\rightarrow
\mathrm{LOSS}
\rightarrow
\mathrm{BACKWARD}
\rightarrow
\mathrm{DISTRIBUTE}
\rightarrow
\mathrm{OPTIMIZE}
\rightarrow
\mathrm{SCHEDULE}
\rightarrow
\mathrm{RL}
\rightarrow
\mathrm{OUTPUT}
}
]

[
\mathfrak E
\equiv
{
[\mathrm{REPORTED}],
[\mathrm{CODE!-!VERIFIED}],
[\mathrm{DERIVED}],
[\mathrm{UNDISCLOSED}]
}
]

[
A
::
[
\operatorname{shape}(A);
\operatorname{dtype}(A);
\operatorname{placement}(A);
\operatorname{autograd}(A)
]
]

[
\bar A
\equiv
\frac{\partial\mathcal L}{\partial A}
]

---

# [

\boxed{\mathrm{INPUT}}
]

[
\mathcal B_t
============

\left{
x_i
===

(
x_i^{txt},
x_i^{img},
x_i^{aud},
x_i^{vid}
)
\right}_{i=1}^{B_t}
]

[
x_i^{txt}
::[
L_i^{char};
\mathrm{UTF8};
\mathrm{CPU};
\mathrm{frozen}
]
]

[
x_i^{img}
::[
H_i\times W_i\times C;
u8/fp32;
\mathrm{CPU/GPU};
\mathrm{frozen}
]
]

[
x_i^{aud}
::[
N_i^{sample};
fp32;
\mathrm{CPU/GPU};
\mathrm{frozen}
]
]

[
x_i^{vid}
::[
N_i^{frame}\times H_i\times W_i\times C;
u8;
\mathrm{CPU/GPU};
\mathrm{frozen}
]
]

[
\mathfrak S_t
=============

\left(
\theta_t^{master},
\theta_t^{compute},
\Omega_t^{opt},
b_t^{router},
\xi_t^{rng},
q_t,
s_t^{loss},
\eta_t,
\sigma_t
\right)
]

[
\sigma_t
\in
{
\mathrm{PT},
\mathrm{SFT},
\mathrm{RL}
}
]

[
q_t
===

\sum_{u=0}^{t-1}N_u^{valid}
]

[
\theta_t
========

{
\theta_{\rm emb},
\theta_{\rm vision},
\theta_{\rm audio},
\theta_{\rm projector},
\theta_{\rm attn},
\theta_{\rm ffn},
\theta_{\rm router},
\theta_{\rm expert},
\theta_{\rm head}
}
]

---

# [

\boxed{\mathrm{INITIALIZE}}
]

[
\mathscr G
==========

{
G_{\rm DP},
G_{\rm TP},
G_{\rm PP},
G_{\rm EP},
G_{\rm CP}
}
]

[
|G_{\rm DP}|=D,\qquad
|G_{\rm TP}|=T,\qquad
|G_{\rm PP}|=P,\qquad
|G_{\rm EP}|=E,\qquad
|G_{\rm CP}|=C
]

[
G_{\rm SP}
\equiv
G_{\rm TP}
\qquad
[\mathrm{REPORTED}]
]

[
|\mathscr W|
\neq
DTP EC
\quad
\text{unless mesh axes disjoint}
\qquad
[\mathrm{DERIVED}]
]

[
\operatorname{AR}^{\Sigma}*{G}
({x_r}*{r\in G})
================

\left{
\sum_{j\in G}x_j
\right}_{r\in G}
]

[
\operatorname{AR}^{mean}_{G}
({x_r})
=======

\frac{1}{|G|}
\operatorname{AR}^{\Sigma}_{G}
({x_r})
]

[
\operatorname{AG}_{G}
({x_r})
=======

\left{
\operatorname{Concat}*{r\in G}x_r
\right}*{j\in G}
]

[
\operatorname{RS}^{\Sigma}_{G}
({x_r})_j
=========

\operatorname{Shard}*j
\left(
\sum*{r\in G}x_r
\right)
]

[
x_r
===

[
x_{r\rightarrow0},
\ldots,
x_{r\rightarrow |G|-1}
]
]

[
\operatorname{A2A}_{G}({x_r})_j
===============================

\operatorname{Concat}*{r\in G}
x*{r\rightarrow j}
]

[
\mathsf C_G:x\mapsto(x,\ldots,x),
\qquad
\mathsf C_G^{!\ast}
================

\operatorname{AR}^{\Sigma}_{G}
]

[
\mathsf R_G:
(x_1,\ldots,x_{|G|})
\mapsto
\sum_r x_r,
\qquad
\mathsf R_G^{!\ast}
================

\mathsf C_G
]

[
\operatorname{AG}_{G}^{!\ast}
==========================

\operatorname{RS}^{\Sigma}_{G}
]

[
(\operatorname{RS}^{\Sigma}_{G})^{!\ast}
=====================================

\operatorname{AG}_{G}
]

[
\operatorname{A2A}_{G}^{!\ast}
===========================

\operatorname{A2A}_{G}^{-1}
]

[
\operatorname{Send}_{p\rightarrow p+1}^{!\ast}
===========================================

\operatorname{Recv}_{p+1\rightarrow p}
]

[
\operatorname{Recv}_{p\rightarrow p+1}^{!\ast}
===========================================

\operatorname{Send}_{p+1\rightarrow p}
]

[
\texttt{// Collectives preserve autograd direction.}
\quad
[\mathrm{REPORTED}]
]
([NVIDIA Docs][1])

[
\theta_t^{master}
::[
|\theta|;
fp32;
\mathrm{logical\ parameter\ shards};
\mathrm{trainable}
]
]

[
\theta_t^{compute}
==================

Q_{\tau_{\rm compute}}
(\theta_t^{master})
]

[
\tau_{\rm compute}
\in
{
bf16,fp16,fp8
}
]

[
\theta_{\rm DS-V3}^{master}
::[
|\theta|;
fp32;
PP\times EP\times DP_{\rm ZeRO1};
\mathrm{trainable}
]
]

[
(m_t,v_t)*{\rm DS-V3}
::[
2|\theta|/D;
bf16;
DP*{\rm ZeRO1};
\mathrm{optimizer\ state}
]
]

[
G_t^{acc,DS-V3}
::[
|\theta_{\rm local}|;
fp32;
PP\times EP;
\mathrm{gradient}
]
]

[
\texttt{// DeepSeek stores accumulation FP32.}
\quad
[\mathrm{REPORTED}]
]
([arXiv][2])

---

# [

\boxed{\mathrm{PREPROCESS}}
]

## [

\boxed{\mathrm{TEXT}}
]

[
\mathbf z_i^{txt}
=================

\mathcal T_{\rm BPE}
(x_i^{txt})
===========

(z_{i,1},\ldots,z_{i,L_i^{txt}})
]

[
\mathbf z_i^{txt}
::[
L_i^{txt};
int32/int64;
\mathrm{CPU/GPU};
\mathrm{frozen}
]
]

[
|\mathcal V|_{\rm DeepSeek-V3}
==============================

128,000
]

[
\mathcal T_{\rm DeepSeek-V3}
============================

\operatorname{ByteBPE}_{128K}
\qquad
[\mathrm{REPORTED}]
]

[
|\mathcal V|_{\rm Qwen3.5}
==========================

250,000
]

[
\mathcal T_{\rm Qwen3.5}
========================

\operatorname{ByteBPE}_{250K}
\qquad
[\mathrm{REPORTED}]
]

[
\texttt{// Tokenizers are model-specific operators.}
]
([arXiv][2])

[
X_i^{txt}
=========

E_{\rm tok}
[\mathbf z_i^{txt}]
]

[
X_i^{txt}
::[
L_i^{txt}\times d;
bf16/fp32;
TP_{\rm embedding};
\mathrm{grad}
]
]

---

## [

\boxed{\mathrm{IMAGE}}
]

[
n_i^h
=====

\left\lceil
\frac{H_i}{p_h}
\right\rceil,
\qquad
n_i^w
=====

\left\lceil
\frac{W_i}{p_w}
\right\rceil
]

[
N_i^{patch}
===========

n_i^hn_i^w
]

[
P_{i,(a,b)}
===========

\operatorname{vec}
\left(
x_i^{img}
[
ap_h:(a+1)p_h,,
bp_w:(b+1)p_w,,
:
]
\right)
]

[
P_i
::[
N_i^{patch}\times(p_hp_wC);
bf16/fp16;
\mathrm{vision\ rank};
\mathrm{frozen}
]
]

[
p_h,p_w
=======

[\mathrm{UNDISCLOSED}]_{\rm Kimi!-!VL}
]

[
\widetilde P_i
==============

\operatorname{NaViTPack}
(P_i)
]

[
V_i
===

\operatorname{MoonViT}_{\phi}
(
\widetilde P_i,
\Pi_i^{2D}
)
]

[
V_i
::[
N_i^{patch}\times d_v;
bf16;
\mathrm{vision\ shard};
\mathrm{grad}
]
]

[
\Pi_i^{2D}
==========

{
(h_j,w_j)
}_{j=1}^{N_i^{patch}}
]

[
V_i'
====

\operatorname{PixelShuffle}_{2\times2}
(V_i)
]

[
V_i'
::[
(N_i^{patch}/4)\times4d_v;
bf16;
\mathrm{vision\ shard};
\mathrm{grad}
]
]

[
X_i^{img}
=========

W_2^{img}
,
\phi
\left(
W_1^{img}V_i'
+b_1
\right)
+b_2
]

[
X_i^{img}
::[
L_i^{img}\times d;
bf16;
\mathrm{vision/LLM\ boundary};
\mathrm{grad}
]
]

[
L_i^{img}
\simeq
N_i^{patch}/4
]

[
\texttt{// MoonViT preserves native image resolution.}
\quad
[\mathrm{REPORTED}]
]
([arXiv][3])

---

## [

\boxed{\mathrm{AUDIO}}
]

[
a_i
===

\operatorname{Resample}
(x_i^{aud},16,000)
]

[
f_s=16000\ \mathrm{Hz}
]

[
N_w
===

# 0.025f_s

400
]

[
N_h
===

# 0.010f_s

160
]

[
S_i[m,k]
========

\sum_{n=0}^{N_w-1}
a_i[n+mN_h],
w[n],
e^{-j2\pi kn/N_{\rm FFT}}
\qquad
[\mathrm{DERIVED}]
]

[
M_i[m,c]
========

\log
\left(
\epsilon+
\sum_k
F^{mel}_{c,k}|S_i[m,k]|^2
\right)
]

[
M_i
::[
N_i^{mel}\times128;
fp32;
\mathrm{audio\ rank};
\mathrm{frozen}
]
]

[
N_i^{mel}
=========

1+
\left\lfloor
\frac{N_i^{sample}-400}{160}
\right\rfloor
]

[
M_i^{(4)}
=========

\operatorname{Conv2D}_4
\circ
\operatorname{Conv2D}_3
\circ
\operatorname{Conv2D}_2
\circ
\operatorname{Conv2D}_1
(M_i)
]

[
\frac{N_i^{mel}}
{N_i^{aud}}
\approx
16
]

[
A_i
===

\operatorname{AuT}_{\phi_a}
(M_i^{(4)})
]

[
f_{\rm token}^{aud}
===================

6.25\ {\rm Hz}
]

[
\Delta t_{\rm token}^{aud}
\approx
160\ {\rm ms}
]

[
A_i
::[
L_i^{aud}\times d_a;
bf16;
\mathrm{audio\ shard};
\mathrm{grad}
]
]

[
X_i^{aud}
=========

\mathcal P_a(A_i)
\in
\mathbb R^{L_i^{aud}\times d}
]

[
\mathcal P_a
============

[\mathrm{UNDISCLOSED}]_{\rm Qwen3.5!-!Omni}
]

[
\texttt{// Qwen audio preprocessing reported exactly.}
\quad
[\mathrm{REPORTED}]
]
([arXiv][4])

---

## [

\boxed{\mathrm{VIDEO}}
]

[
{
(\tau_{i,j},F_{i,j})
}_{j=1}^{N_i^f}
===============

\operatorname{DynamicFrameSample}
(x_i^{vid})
]

[
F_{i,j}
::[
H_{ij}\times W_{ij}\times C;
u8;
\mathrm{vision\ rank};
\mathrm{frozen}
]
]

[
V_{i,j}^{vid}
=============

\operatorname{VisionEncoder}
(F_{i,j})
]

[
p_{i,j}^{time}
==============

\left\lfloor
\frac{\tau_{i,j}}
{0.160\ {\rm s}}
\right\rfloor
]

[
p_{i,k}^{aud}
=============

\left\lfloor
\frac{\tau_{i,k}^{aud}}
{0.160\ {\rm s}}
\right\rfloor
]

[
\Pi_i^{AV}
==========

{
p^{time},
p^{height},
p^{width}
}
]

[
X_i^{vid}
=========

\operatorname{Serialize}
\left(
{
\mathcal P_v(V_{i,j}^{vid})
}_{j}
\right)
]

[
X_i^{vid}
::[
L_i^{vid}\times d;
bf16;
\mathrm{vision/LLM\ boundary};
\mathrm{grad}
]
]

[
\texttt{// Audio-video clocks share 160ms IDs.}
\quad
[\mathrm{REPORTED}]
]
([arXiv][4])

---

## [

\boxed{\mathrm{UNIFIED\ SEQUENCE}}
]

[
\mathscr U_i
============

\operatorname{Serialize}*{template}
\left(
X_i^{txt},
X_i^{img},
X_i^{aud},
X_i^{vid},
E*{\rm special}
\right)
]

[
\mathscr U_i
::[
L_i\times d;
bf16;
\mathrm{LLM\ input};
\mathrm{grad}
]
]

[
m^{mod}_{i,p}
\in
{
txt,img,aud,vid,special
}
]

[
E_{mod}[m^{mod}_{i,p}]
======================

[\mathrm{UNDISCLOSED}]
]

[
X_i
===

\mathscr U_i
]

[
\Pi_i
=====

{
\pi_{i,p}^{seq},
\pi_{i,p}^{time},
\pi_{i,p}^{height},
\pi_{i,p}^{width}
}_{p=1}^{L_i}
]

[
X
=

\operatorname{PackPad}
(X_1,\ldots,X_B)
]

[
X
::[
B\times L\times d;
bf16;
DP\times CP;
\mathrm{grad}
]
]

[
Y
::[
B\times L;
int32/int64;
DP\times CP;
\mathrm{frozen}
]
]

[
Y_{i,p}
=======

z_{i,p+1}
\quad
\text{for autoregressive targets}
]

[
M_{i,pq}^{causal}
=================

\begin{cases}
0,&q\le p\
-\infty,&q>p
\end{cases}
]

[
M_{i,pq}^{DS!-!V3}
==================

M_{i,pq}^{causal}
]

[
\mathbf1[
\operatorname{doc}(p)
=====================

\operatorname{doc}(q)
]
\notin
M_{i,pq}^{DS!-!V3}
\qquad
[\mathrm{REPORTED}]
]

[
\texttt{// DeepSeek permits cross-document packed attention.}
]
([arXiv][2])

---

# [

\boxed{\mathrm{FORWARD}}
]

[
H^{(0)}
=======

X
]

[
H^{(0)}
::[
B\times L\times d;
bf16;
DP\times CP\times SP;
\mathrm{grad}
]
]

---

## [

\boxed{\mathrm{TP\ LINEAR\ CONTRACT}}
]

[
W
=

[
W^{(0)}
|
W^{(1)}
|
\cdots
|
W^{(T-1)}
]
]

[
Y_r^{col}
=========

XW^{(r)}
]

[
Y_r^{col}
::[
B\times L\times d_{out}/T;
bf16/fp8;
TP_r;
\mathrm{grad}
]
]

[
\bar X_r^{partial}
==================

\bar Y_rW_r^\top
]

[
\boxed{
\bar X
======

\operatorname{AR}^{\Sigma}_{TP}
(
{\bar X_r^{partial}}
)
}
]

[
W
=

\begin{bmatrix}
W^{(0)}\
W^{(1)}\
\vdots\
W^{(T-1)}
\end{bmatrix},
\qquad
X
=

[
X^{(0)}
|
\cdots
|
X^{(T-1)}
]
]

[
U_r^{row}
=========

X^{(r)}W^{(r)}
]

[
\boxed{
Y^{row}
=======

\operatorname{AR}^{\Sigma}_{TP}
(
{U_r^{row}}
)
}
]

[
\boxed{
Y_{\rm SP}^{row}
================

\operatorname{RS}^{\Sigma}_{TP}
(
{U_r^{row}}
)
}
]

[
\boxed{
\bar U_r^{row}
==============

\operatorname{AG}*{TP}
(\bar Y*{\rm SP})_r
}
]

[
X_{\rm full}
============

\operatorname{AG}*{TP}
(X*{\rm SP})
]

[
\bar X_{\rm SP}
===============

\operatorname{RS}^{\Sigma}*{TP}
(\bar X*{\rm full})
]

[
\texttt{// SP collectives are adjoint pairs.}
\quad
[\mathrm{REPORTED}]
]
([NVIDIA Docs][5])

---

## [

\boxed{\mathrm{TRANSFORMER\ BLOCK}}
]

[
U_\ell
======

\operatorname{RMSNorm}_{\ell,1}
(H^{(\ell)})
]

[
A_\ell
======

\operatorname{ATTN}*\ell
(U*\ell,\Pi,M)
]

[
R_\ell
======

H^{(\ell)}
+
A_\ell
]

[
V_\ell
======

\operatorname{RMSNorm}*{\ell,2}
(R*\ell)
]

[
F_\ell
======

\operatorname{FFN/MoE}*\ell
(V*\ell)
]

[
H^{(\ell+1)}
============

R_\ell
+
F_\ell
]

[
\ell=0,\ldots,N-1
]

---

## [

\boxed{\mathrm{RMSNORM}}
]

[
r(x)
====

\sqrt{
\frac1d
\sum_{j=1}^{d}x_j^2+\epsilon
}
]

[
\operatorname{RMSNorm}(x)
=========================

g\odot\frac{x}{r(x)}
]

---

## [

\boxed{\mathrm{MHA/GQA}}
]

[
Q=UW_Q,\qquad
K=UW_K,\qquad
V=UW_V
]

[
Q
::[
B\times n_q\times L\times d_h;
bf16/fp8;
TP\times CP;
\mathrm{grad}
]
]

[
K,V
::[
B\times n_{kv}\times L\times d_h;
bf16/fp8;
TP\times CP;
\mathrm{grad}
]
]

[
(\widehat Q,\widehat K)
=======================

\operatorname{RoPE/TM!-!RoPE}
(Q,K;\Pi)
]

[
K_c^{full}
==========

\operatorname{AG}_{CP}
({K_c})
]

[
V_c^{full}
==========

\operatorname{AG}_{CP}
({V_c})
]

[
S_c
===

\frac{
\widehat Q_c
(\widehat K^{full})^\top
}{
\sqrt{d_h}
}
+
M_c
]

[
P_c
===

\operatorname{Softmax}_{key}(S_c)
]

[
O_c
===

P_cV^{full}
]

[
A_c
===

O_cW_O
]

[
(\operatorname{AG}_{CP})^{!\ast}
=============================

\operatorname{RS}^{\Sigma}_{CP}
]

[
\operatorname{AG/RS}*{CP}
\equiv
\operatorname{RingP2P}*{KV}
\quad
\text{semantically}
\qquad
[\mathrm{REPORTED}]
]

[
\texttt{// CP exchanges key-value sequence blocks.}
]
([NVIDIA Docs][6])

---

## [

\boxed{\mathrm{DEEPSEEK\ MLA}}
]

[
h_t
\in
\mathbb R^{d}
]

[
c_t^{KV}
========

W^{DKV}h_t
\in
\mathbb R^{d_c}
]

[
[k_{t,1}^{C};\cdots;k_{t,n_h}^{C}]
==================================

W^{UK}c_t^{KV}
]

[
[v_{t,1}^{C};\cdots;v_{t,n_h}^{C}]
==================================

W^{UV}c_t^{KV}
]

[
k_t^{R}
=======

\operatorname{RoPE}
(W^{KR}h_t)
]

[
k_{t,i}
=======

[k_{t,i}^{C};k_t^R]
]

[
c_t^{Q}
=======

W^{DQ}h_t
\in
\mathbb R^{d_c'}
]

[
[q_{t,1}^{C};\cdots;q_{t,n_h}^{C}]
==================================

W^{UQ}c_t^{Q}
]

[
[q_{t,1}^{R};\cdots;q_{t,n_h}^{R}]
==================================

\operatorname{RoPE}
(W^{QR}c_t^Q)
]

[
q_{t,i}
=======

[q_{t,i}^{C};q_{t,i}^{R}]
]

[
\alpha_{tji}
============

\operatorname{Softmax}*{j\le t}
\left(
\frac{
q*{t,i}^{\top}k_{j,i}
}{
\sqrt{d_h+d_h^R}
}
\right)
]

[
o_{t,i}
=======

\sum_{j=1}^{t}
\alpha_{tji}
v_{j,i}^{C}
]

[
u_t
===

W^O
[o_{t,1};\ldots;o_{t,n_h}]
]

[
d=7168,\quad
n_h=128,\quad
d_h=128,\quad
d_c=512,\quad
d_c'=1536,\quad
d_h^R=64
\qquad
[\mathrm{REPORTED}]
]

[
\texttt{// MLA equations follow DeepSeek-V3 exactly.}
]
([arXiv][2])

---

## [

\boxed{\mathrm{DENSE\ SWIGLU}}
]

[
a
=

VW_g
]

[
b
=

VW_u
]

[
s
=

\operatorname{SiLU}(a)
]

[
c
=

s\odot b
]

[
F
=

cW_d
]

---

## [

\boxed{\mathrm{DEEPSEEK\ MoE}}
]

[
u_t
\equiv
V_{\ell,t}
]

[
r_{e,t}
=======

u_t^\top e_e
]

[
s_{e,t}
=======

\sigma(r_{e,t})
]

[
I_{e,t}
=======

\operatorname{sg}
\left[
\mathbf1
\left(
s_{e,t}+b_e
\in
\operatorname{TopK}
(
{s_{j,t}+b_j}_{j=1}^{N_r},
K_r
)
\right)
\right]
]

[
g'_{e,t}
========

I_{e,t}s_{e,t}
]

[
g_{e,t}
=======

\frac{
g'*{e,t}
}{
\sum*{j=1}^{N_r}g'_{j,t}
}
]

[
\mathcal E_t
============

\{
e:I_{e,t}=1
\}
]

[
|\mathcal E_t|
==============

K_r
]

[
K_r^{DS-V3}
===========

8
]

[
N_r^{DS-V3}
===========

256
]

[
N_s^{DS-V3}
===========

1
\qquad
[\mathrm{REPORTED}]
]

[
\operatorname{nodecount}
(\mathcal E_t)
\le4
\qquad
[\mathrm{REPORTED}]
]

[
S_{r\rightarrow q}
==================

\operatorname{Pack}
{
(u_t,g_{e,t},t,e):
\operatorname{owner}(e)=q
}
]

[
D_q
===

\operatorname{A2A}*{EP}
(
{S*{r\rightarrow q}}_r
)
]

[
y_{t,e}
=======

\operatorname{Expert}_e(u_t)
]

[
y_{t,e}
=======

\left[
\operatorname{SiLU}(u_tW_{g,e})
\odot
(u_tW_{u,e})
\right]
W_{d,e}
]

[
C_r
===

\operatorname{A2A}*{EP}^{-1}
(
{y*{t,e}}
)
]

[
F_t^{routed}
============

\sum_{e\in\mathcal E_t}
g_{e,t}y_{t,e}
]

[
F_t^{shared}
============

\sum_{e=1}^{N_s}
\operatorname{Expert}^{shared}_e(u_t)
]

[
h_t'
====

u_t
+
F_t^{shared}
+
F_t^{routed}
]

[
\operatorname{DropToken}(t)
===========================

0
\qquad
[\mathrm{REPORTED}]
]

[
\texttt{// EP dispatch uses cross-node all-to-all.}
]
([arXiv][2])

---

## [

\boxed{\mathrm{PIPELINE}}
]

[
\mathcal L_p
============

{
\ell_p^{start},
\ldots,
\ell_p^{end}
}
]

[
H_{p+1}^{in,\mu}
================

\operatorname{Recv}*{p\rightarrow p+1}
\left[
\operatorname{Send}*{p\rightarrow p+1}
(
H_p^{out,\mu}
)
\right]
]

[
\bar H_p^{out,\mu}
==================

\operatorname{Recv}*{p+1\rightarrow p}
(
\bar H*{p+1}^{in,\mu}
)
]

[
P_{\rm DS-V3}=16,
\qquad
E_{\rm DS-V3}=64,
\qquad
T_{\rm DS-V3}=1
\qquad
[\mathrm{REPORTED}]
]

[
\texttt{// DeepSeek-V3 deliberately avoids tensor parallelism.}
]
([arXiv][2])

---

## [

\boxed{\mathrm{OUTPUT\ HEAD}}
]

[
H^N
===

H^{(N)}
]

[
H^{out}
=======

\operatorname{RMSNorm}_{out}
(H^N)
]

[
Z
=

H^{out}W_{\rm vocab}^{\top}
+b_{\rm vocab}
]

[
Z
::[
B\times L\times|\mathcal V|;
bf16/fp32;
TP_{\rm vocab};
\mathrm{grad}
]
]

[
P_{i,p,v}
=========

\frac{
e^{Z_{i,p,v}}
}{
\sum_{u\in\mathcal V}e^{Z_{i,p,u}}
}
]

---

# [

\boxed{\mathrm{LOSS}}
]

## [

\boxed{\mathrm{NTP}}
]

[
\ell_{i,p}^{NTP}
================

-\log
P_{i,p,Y_{i,p}}
]

[
n_t
===

\sum_{i,p}
m_{i,p}^{PT}
]

[
\mathcal L_{\rm NTP}^{\Sigma}
=============================

\sum_{i,p}
m_{i,p}^{PT}
\ell_{i,p}^{NTP}
]

[
\mathcal L_{\rm NTP}
====================

\frac{
\mathcal L_{\rm NTP}^{\Sigma}
}{
n_t
}
]

---

## [

\boxed{\mathrm{DEEPSEEK\ MTP}}
]

[
h_i^{0}
=======

H_i^{N}
]

[
h_i^{\prime k}
==============

M_k
[
\operatorname{RMSNorm}(h_i^{k-1});
\operatorname{RMSNorm}
(
\operatorname{Emb}(z_{i+k})
)
]
]

[
h_{1:T-k}^{k}
=============

\operatorname{TRM}*k
(
h*{1:T-k}^{\prime k}
)
]

[
P_{i+k+1}^{k}
=============

\operatorname{OutHead}(h_i^k)
]

[
\mathcal L_{\rm MTP}^{k}
========================

-\frac1T
\sum_{i=2+k}^{T+1}
\log
P_i^k[z_i]
]

[
\mathcal L_{\rm MTP}
====================

\frac{\lambda_{\rm MTP}}{D_{\rm MTP}}
\sum_{k=1}^{D_{\rm MTP}}
\mathcal L_{\rm MTP}^{k}
]

[
D_{\rm MTP}^{DS-V3}=1
]

[
\lambda_{\rm MTP}(q)
====================

\begin{cases}
0.3,&q<10T\
0.1,&10T\le q\le14.8T
\end{cases}
\qquad
[\mathrm{REPORTED}]
]

[
\texttt{// MTP preserves sequential causal dependency.}
]
([arXiv][2])

---

## [

\boxed{\mathrm{DEEPSEEK\ SEQUENCE\ BALANCE}}
]

[
f_e
===

\frac{N_r}{K_rT}
\sum_{t=1}^{T}
\mathbf1
\left[
s_{e,t}
\in
\operatorname{TopK}
(
{s_{j,t}},
K_r
)
\right]
]

[
s_{e,t}'
========

\frac{s_{e,t}}
{\sum_{j=1}^{N_r}s_{j,t}}
]

[
P_e
===

\frac1T
\sum_{t=1}^{T}
s_{e,t}'
]

[
\mathcal L_{\rm Bal}^{DS-V3}
============================

\alpha
\sum_{e=1}^{N_r}
f_eP_e
]

[
\alpha=10^{-4}
\qquad
[\mathrm{REPORTED}]
]

[
\boxed{
\mathcal L_{\rm PT}^{DS-V3}
===========================

\mathcal L_{\rm NTP}
+
\mathcal L_{\rm MTP}
+
\mathcal L_{\rm Bal}^{DS-V3}
}
]

[
\mathcal L_z^{DS-V3}
====================

0
]

[
\texttt{// DeepSeek does not use router z-loss.}
\quad
[\mathrm{DERIVED}]
]
([arXiv][2])

---

## [

\boxed{\mathrm{ST!-!MoE\ Z\ BRANCH}}
]

[
z_t^{router}
============

\log
\sum_{e=1}^{N_E}
e^{r_{t,e}}
]

[
\mathcal L_z
============

\frac1T
\sum_{t=1}^{T}
(z_t^{router})^2
\qquad
[\mathrm{REPORTED}]
]

[
\mathcal L_{\rm PT}^{ST-MoE}
============================

\mathcal L_{\rm NTP}
+
\lambda_{bal}\mathcal L_{bal}
+
\lambda_z\mathcal L_z
]

[
\texttt{// Z-loss belongs separate router family.}
]
([arXiv][7])

---

## [

\boxed{\mathrm{KIMI!-!VL\ VISION\ PRETRAIN}}
]

[
\hat v_i
========

\frac{v_i}{|v_i|_2},
\qquad
\hat t_j
========

\frac{t_j}{|t_j|_2}
]

[
l_{ij}
======

e^{\tau}
\hat v_i^\top\hat t_j+b
]

[
y_{ij}
======

2\mathbf1[i=j]-1
]

[
\mathcal L_{\rm SigLIP}
=======================

-\frac1B
\sum_{i=1}^{B}
\sum_{j=1}^{B}
\log
\sigma
(y_{ij}l_{ij})
\qquad
[\mathrm{REPORTED}]
]

[
\mathcal L_{\rm caption}
========================

*

\frac1{N_{cap}}
\sum_{i,p}
m_{i,p}^{cap}
\log
p_\theta
(
y_{i,p}
\mid
y_{i,<p},X_i^{img}
)
]

[
\boxed{
\mathcal L_{\rm ViT}^{Kimi-VL}
==============================

\mathcal L_{\rm SigLIP}
+
2\mathcal L_{\rm caption}
}
\qquad
[\mathrm{REPORTED}]
]

[
\texttt{// Kimi vision pretraining uses dual objectives.}
]
([arXiv][3])

[
\mathcal L_{\rm joint}^{Kimi-VL}
================================

[\mathrm{UNDISCLOSED}]
]

[
\mathcal L_{\rm PT}^{Qwen3.5-Omni}
==================================

[\mathrm{UNDISCLOSED}]
]

---

## [

\boxed{\mathrm{SFT\ MASK}}
]

[
\rho_{i,p}
\in
{
system,
user,
assistant_reasoning,
assistant_final,
assistant_tool,
tool_observation,
special
}
]

[
a^{Kimi-VL}(system)=0
]

[
a^{Kimi-VL}(user)=0
]

[
a^{Kimi-VL}(answer)=1
]

[
a^{Kimi-VL}(special)=1
\qquad
[\mathrm{REPORTED}]
]

[
a(assistant_reasoning),
a(assistant_tool),
a(tool_observation)
===================

[\mathrm{UNDISCLOSED}]
]

[
m_{i,p}^{SFT}
=============

m_{i,p}^{valid}
,
a(\rho_{i,p+1})
]

[
N_{\rm SFT}
===========

\sum_{i,p}
m_{i,p}^{SFT}
]

[
\boxed{
\mathcal L_{\rm SFT}
====================

-\frac1{N_{\rm SFT}}
\sum_{i,p}
m_{i,p}^{SFT}
\log
p_\theta
(
y_{i,p+1}
\mid
y_{i,\le p},x_i
)
}
]

[
\chi_j^{stage}
\in
{0,1}
]

[
g_j
\leftarrow
\chi_j^{stage}g_j
]

[
\chi_{\rm LLM}^{KimiAlign}=0,
\qquad
\chi_{\rm MoonViT}^{KimiAlign}=1,
\qquad
\chi_{\rm projector}^{KimiAlign}=1
]

[
\chi_{\rm LLM}^{KimiSFT}
========================

# \chi_{\rm MoonViT}^{KimiSFT}

# \chi_{\rm projector}^{KimiSFT}

1
\qquad
[\mathrm{REPORTED}]
]

[
\texttt{// Kimi masks system-user SFT targets.}
]
([arXiv][3])

---

# [

\boxed{\mathrm{BACKWARD}}
]

[
\mathcal L_t
============

\mathcal L
(
\mathfrak S_t,
\mathcal B_t
)
]

[
\bar{\mathcal L}
================

1
]

---

## [

\boxed{\mathrm{CROSS\ ENTROPY\ VJP}}
]

[
\bar Z_{i,p,v}
==============

\frac{m_{i,p}}
{N_{\rm valid}}
\left[
P_{i,p,v}
---------

\mathbf1(v=Y_{i,p})
\right]
]

[
\bar W_{\rm vocab}
==================

\bar Z^\top H^{out}
]

[
\bar H^{out}
============

\bar ZW_{\rm vocab}
]

---

## [

\boxed{\mathrm{RMSNORM\ VJP}}
]

[
y
=

g\odot\frac{x}{r}
]

[
r
=

\sqrt{
d^{-1}x^\top x+\epsilon
}
]

[
a
=

\bar y\odot g
]

[
\boxed{
\bar x
======

## \frac{a}{r}

\frac{x}{dr^3}
(a^\top x)
}
]

[
\boxed{
\bar g
======

\sum_{\rm tokens}
\bar y\odot\frac{x}{r}
}
]

---

## [

\boxed{\mathrm{ATTENTION\ VJP}}
]

[
O
=

PV
]

[
\bar P
======

\bar OV^\top
]

[
\bar V
======

P^\top\bar O
]

[
P_i
===

\operatorname{Softmax}(S_i)
]

[
c_i
===

\sum_j
\bar P_{ij}P_{ij}
]

[
\boxed{
\bar S_{ij}
===========

P_{ij}
(
\bar P_{ij}-c_i
)
}
]

[
S
=

\frac{QK^\top}{\sqrt{d_h}}
+M
]

[
\boxed{
\bar Q
======

\frac{\bar SK}{\sqrt{d_h}}
}
]

[
\boxed{
\bar K
======

\frac{\bar S^\top Q}{\sqrt{d_h}}
}
]

[
\bar M=0
]

[
\widehat Q
==========

R(\Pi)Q
]

[
\widehat K
==========

R(\Pi)K
]

[
\bar Q
======

R(\Pi)^\top\bar{\widehat Q}
]

[
\bar K
======

R(\Pi)^\top\bar{\widehat K}
]

[
R(\Pi)^\top R(\Pi)=I
]

---

## [

\boxed{\mathrm{QKV\ LINEAR\ VJP}}
]

[
Q=UW_Q
\Rightarrow
\begin{cases}
\bar W_Q=U^\top\bar Q\
\bar U_Q=\bar QW_Q^\top
\end{cases}
]

[
K=UW_K
\Rightarrow
\begin{cases}
\bar W_K=U^\top\bar K\
\bar U_K=\bar KW_K^\top
\end{cases}
]

[
V=UW_V
\Rightarrow
\begin{cases}
\bar W_V=U^\top\bar V\
\bar U_V=\bar VW_V^\top
\end{cases}
]

[
\bar U
======

\bar U_Q+\bar U_K+\bar U_V
]

---

## [

\boxed{\mathrm{MLA\ VJP}}
]

[
\bar c_t^Q
==========

(W^{UQ})^\top\bar q_t^C
+
(W^{QR})^\top
R_t^\top
\bar q_t^R
]

[
\bar W^{UQ}
===========

\sum_t
\bar q_t^C(c_t^Q)^\top
]

[
\bar W^{QR}
===========

\sum_t
R_t^\top\bar q_t^R(c_t^Q)^\top
]

[
\bar h_t^{Q}
============

(W^{DQ})^\top
\bar c_t^Q
]

[
\bar W^{DQ}
===========

\sum_t
\bar c_t^Qh_t^\top
]

[
\bar c_t^{KV}
=============

(W^{UK})^\top\bar k_t^C
+
(W^{UV})^\top\bar v_t^C
]

[
\bar W^{UK}
===========

\sum_t
\bar k_t^C(c_t^{KV})^\top
]

[
\bar W^{UV}
===========

\sum_t
\bar v_t^C(c_t^{KV})^\top
]

[
\bar h_t^{KV}
=============

(W^{DKV})^\top
\bar c_t^{KV}
]

[
\bar h_t^{KR}
=============

(W^{KR})^\top
R_t^\top
\bar k_t^R
]

[
\bar W^{DKV}
============

\sum_t
\bar c_t^{KV}h_t^\top
]

[
\bar W^{KR}
===========

\sum_t
R_t^\top\bar k_t^Rh_t^\top
]

[
\boxed{
\bar h_t^{MLA}
==============

\bar h_t^{Q}
+
\bar h_t^{KV}
+
\bar h_t^{KR}
}
\qquad
[\mathrm{DERIVED}]
]

---

## [

\boxed{\mathrm{SWIGLU\ VJP}}
]

[
F=cW_d
]

[
\bar c
======

\bar FW_d^\top
]

[
\bar W_d
========

c^\top\bar F
]

[
c
=

\operatorname{SiLU}(a)\odot b
]

[
\bar a
======

(\bar c\odot b)
\odot
\operatorname{SiLU}'(a)
]

[
\bar b
======

\bar c
\odot
\operatorname{SiLU}(a)
]

[
\bar W_g
========

V^\top\bar a
]

[
\bar W_u
========

V^\top\bar b
]

[
\boxed{
\bar V
======

\bar aW_g^\top
+
\bar bW_u^\top
}
]

---

## [

\boxed{\mathrm{MoE\ VJP}}
]

[
F_t
===

\sum_{e\in\mathcal E_t}
g_{e,t}y_{t,e}
]

[
\boxed{
\bar y_{t,e}
============

g_{e,t}\bar F_t
}
]

[
\boxed{
\bar g_{e,t}
============

\langle
\bar F_t,
y_{t,e}
\rangle
}
]

[
\bar Y^{expert}
===============

\operatorname{A2A}*{EP}
(
{\bar y*{t,e}}
)
]

[
\bar u_{t,e}^{expert}
=====================

J_{\operatorname{Expert}*e}(u_t)^\top
\bar y*{t,e}
]

[
\bar u_t^{expert}
=================

\operatorname{A2A}*{EP}^{-1}
(
{\bar u*{t,e}^{expert}}
)
]

[
S_t
===

\sum_jI_{j,t}s_{j,t}
]

[
g_{e,t}
=======

\frac{I_{e,t}s_{e,t}}{S_t}
]

[
\boxed{
\bar s_{e,t}
============

\frac{I_{e,t}}{S_t}
\left(
\bar g_{e,t}
------------

\sum_j
g_{j,t}\bar g_{j,t}
\right)
}
]

[
s_{e,t}
=======

\sigma(r_{e,t})
]

[
\bar r_{e,t}
============

\bar s_{e,t}
s_{e,t}
(1-s_{e,t})
]

[
r_{e,t}
=======

u_t^\top e_e
]

[
\bar e_e
========

\sum_t
u_t\bar r_{e,t}
]

[
\bar u_t^{router}
=================

\sum_e
e_e\bar r_{e,t}
]

[
\boxed{
\frac{\partial I_{e,t}}
{\partial r_{j,t}}
==================

0
}
]

[
\boxed{
\frac{\partial b_e}
{\partial\mathcal L}
====================

0
}
]

[
\texttt{// Top-k membership receives no gradient.}
\quad
[\mathrm{DERIVED}]
]

---

## [

\boxed{\mathrm{RESIDUAL\ REVERSE}}
]

[
H^{\ell+1}
==========

R_\ell+F_\ell
]

[
\bar R_\ell
===========

\bar H^{\ell+1}
+
J_{\operatorname{RMSNorm}*{2}}^\top
J*{\operatorname{FFN/MoE}}^\top
\bar H^{\ell+1}
]

[
R_\ell
======

H^\ell+A_\ell
]

[
\boxed{
\bar H^\ell
===========

\bar R_\ell
+
J_{\operatorname{RMSNorm}*{1}}^\top
J*{\operatorname{ATTN}}^\top
\bar R_\ell
}
]

[
\ell=N-1,\ldots,0
]

[
\boxed{
\nabla_{\theta_t}\mathcal L_t
=============================

\operatorname{VJP}
\left(
\mathcal L_t
\leftarrow
Z
\leftarrow
H^N
\leftarrow\cdots\leftarrow
H^0
\leftarrow
X
\right)
}
]

---

## [

\boxed{\mathrm{MICROBATCH\ ACCUMULATION}}
]

[
\mathcal B_{d}
==============

\bigsqcup_{\mu=1}^{M}
\mathcal B_{d,\mu}
]

[
\mathcal L_{d,\mu}^{\Sigma}
===========================

\sum_{j\in\mathcal B_{d,\mu}}
m_j\ell_j
]

[
n_{d,\mu}
=========

\sum_{j\in\mathcal B_{d,\mu}}
m_j
]

[
\widetilde{\mathcal L}_{d,\mu}^{\Sigma}
=======================================

s_t^{loss}
\mathcal L_{d,\mu}^{\Sigma}
]

[
\widetilde G_{d,t}
==================

\sum_{\mu=1}^{M}
\nabla_{\theta}
\widetilde{\mathcal L}_{d,\mu}^{\Sigma}
]

[
G_{d,t}
=======

\frac{
\widetilde G_{d,t}
}{
s_t^{loss}
}
]

[
n_{d,t}
=======

\sum_{\mu=1}^{M}
n_{d,\mu}
]

[
N_t^{global}
============

\operatorname{AR}*{DP}^{\Sigma}
(
{n*{d,t}}_d
)
]

[
\boxed{
g_t^{global}
============

\frac{
\operatorname{AR}*{DP}^{\Sigma}
(
{G*{d,t}}
)
}{
N_t^{global}
}
}
\qquad
\text{DDP}
]

[
\boxed{
g_{t,r}^{ZeRO1}
===============

\frac{
\operatorname{RS}*{DP}^{\Sigma}
(
{G*{d,t}}
)_r
}{
N_t^{global}
}
}
\qquad
\text{ZeRO-1}
]

[
\texttt{// Token normalization occurs exactly once.}
\quad
[\mathrm{DERIVED}]
]

[
\operatorname{finite}_t
=======================

\prod_j
\mathbf1[
|g_{t,j}|<\infty
]
]

[
\operatorname{finite}*t=0
\Longrightarrow
\theta*{t+1}=\theta_t
]

---

# [

\boxed{\mathrm{DISTRIBUTE}}
]

## [

\boxed{\mathrm{TP/SP\ BACKWARD}}
]

[
X^{full}
========

\operatorname{AG}_{TP}(X^{SP})
]

[
\boxed{
\bar X^{SP}
===========

\operatorname{RS}^{\Sigma}_{TP}
(\bar X^{full})
}
]

[
Y^{SP}
======

\operatorname{RS}^{\Sigma}_{TP}
(U)
]

[
\boxed{
\bar U
======

\operatorname{AG}_{TP}
(\bar Y^{SP})
}
]

[
\texttt{// TP-SP communication is not averaging.}
]
([NVIDIA Docs][5])

---

## [

\boxed{\mathrm{CP\ BACKWARD}}
]

[
K^{full}
========

\operatorname{AG}_{CP}(K^{local})
]

[
V^{full}
========

\operatorname{AG}_{CP}(V^{local})
]

[
\boxed{
\bar K^{local}
==============

\operatorname{RS}^{\Sigma}_{CP}
(\bar K^{full})
}
]

[
\boxed{
\bar V^{local}
==============

\operatorname{RS}^{\Sigma}_{CP}
(\bar V^{full})
}
]

[
\texttt{// Ring exchange implements same semantics.}
]
([NVIDIA Docs][6])

---

## [

\boxed{\mathrm{EP\ BACKWARD}}
]

[
D
=

\operatorname{A2A}_{EP}(S)
]

[
C
=

\operatorname{A2A}_{EP}^{-1}(Y)
]

[
\boxed{
\bar Y
======

\operatorname{A2A}_{EP}(\bar C)
}
]

[
\boxed{
\bar S
======

\operatorname{A2A}_{EP}^{-1}(\bar D)
}
]

---

## [

\boxed{\mathrm{PP\ BACKWARD}}
]

[
H_{p+1}^{in}
============

\operatorname{P2P}_{p\rightarrow p+1}
(H_p^{out})
]

[
\boxed{
\bar H_p^{out}
==============

\operatorname{P2P}*{p+1\rightarrow p}
(\bar H*{p+1}^{in})
}
]

---

## [

\boxed{\mathrm{FSDP/ZeRO3\ CONTRACT}}
]

[
\theta^{full}
=============

\operatorname{AG}_{DP}
(
{\theta_r^{shard}}
)
]

[
H
=

F(X;\theta^{full})
]

[
\boxed{
\bar\theta_r^{shard}
====================

\operatorname{RS}^{\Sigma}_{DP}
(
\bar\theta^{full}
)
_r
}
]

[
\texttt{// FSDP gather precedes layer computation.}
\quad
[\mathrm{REPORTED}]
]
([PyTorch Documentation][8])

---

## [

\boxed{\mathrm{GLOBAL\ GRADIENT\ NORM}}
]

[
\mathcal O(j)
=============

\{
r:
g_{t,j}
\text{ physically stored on }r
\}
]

[
\rho_j
======

|\mathcal O(j)|
]

[
\nu_t^2
=======

\operatorname{AR}^{\Sigma}*{G*{\rm norm}}
\left[
\sum_{j\in\mathcal P_r}
\frac{
|g_{t,j}|_2^2
}{
\rho_j
}
\right]
]

[
\nu_t
=====

\sqrt{\nu_t^2}
]

[
\kappa_t
========

\min
\left(
1,
\frac{c_{\max}}
{\nu_t+\epsilon}
\right)
]

[
\boxed{
g_t^{clip}
==========

\kappa_tg_t
}
]

[
c_{\max}^{DS-V3}
================

1.0
\qquad
[\mathrm{REPORTED}]
]
([arXiv][2])

---

# [

\boxed{\mathrm{OPTIMIZE}}
]

## [

\boxed{\mathrm{ADAMW}}
]

[
g_t
\equiv
g_t^{clip}
]

[
m_t
===

\beta_1m_{t-1}
+
(1-\beta_1)g_t
]

[
v_t
===

\beta_2v_{t-1}
+
(1-\beta_2)
(g_t\odot g_t)
]

[
\widehat m_t
============

\frac{m_t}{1-\beta_1^t}
]

[
\widehat v_t
============

\frac{v_t}{1-\beta_2^t}
]

[
u_t^{Adam}
==========

\frac{
\widehat m_t
}{
\sqrt{\widehat v_t}+\epsilon
}
]

[
\boxed{
\theta_{t+1}^{master}
=====================

(1-\eta_t\lambda_{wd})
\theta_t^{master}
-----------------

\eta_tu_t^{Adam}
}
\qquad
[\mathrm{REPORTED}]
]

[
\texttt{// AdamW decouples parameter weight decay.}
]
([arXiv][9])

[
\beta_1^{DS-V3}=0.9
]

[
\beta_2^{DS-V3}=0.95
]

[
\lambda_{wd}^{DS-V3}=0.1
\qquad
[\mathrm{REPORTED}]
]

[
m_t^{DS-V3},v_t^{DS-V3}
\in BF16
]

[
g_t^{DS-V3},
\theta_t^{master,DS-V3}
\in FP32
\qquad
[\mathrm{REPORTED}]
]

[
\operatorname{BiasCorrection}_{DS-V3}
=====================================

[\mathrm{UNDISCLOSED}]
]
([arXiv][2])

---

## [

\boxed{\mathrm{MUON}}
]

[
W_t
::[
A\times B;
bf16/fp32;
\mathrm{parameter\ matrix};
\mathrm{trainable}
]
]

[
G_t
===

\nabla_{W_{t-1}}
\mathcal L_t
]

[
M_t
===

\mu M_{t-1}
+
G_t
]

[
M_0=0
]

[
X_0
===

\frac{
M_t
}{
|M_t|_F
}
]

[
X_k
===

aX_{k-1}
+
b
(X_{k-1}X_{k-1}^{\top})
X_{k-1}
+
c
(X_{k-1}X_{k-1}^{\top})^2
X_{k-1}
]

[
(a,b,c)
=======

(
3.4445,
-4.7750,
2.0315
)
]

[
k=1,\ldots,N_{NS}
]

[
N_{NS}=5
]

[
\mu=0.95
]

[
O_t
===

X_{N_{NS}}
\approx
(M_tM_t^\top)^{-1/2}M_t
]

[
M_t
===

U\Sigma V^\top
\Longrightarrow
O_t
\approx
UV^\top
]

[
\operatorname{RMS}(O_t)
\simeq
\frac1{\sqrt{\max(A,B)}}
]

[
\widetilde O_t
==============

0.2
\sqrt{\max(A,B)}
O_t
]

[
\boxed{
W_t
===

## W_{t-1}

\eta_t
(
\widetilde O_t
+
\lambda W_{t-1}
)
}
\qquad
[\mathrm{REPORTED}]
]

[
\texttt{// Muon orthogonalizes momentum matrix updates.}
]
([arXiv][10])

[
\Theta_{\rm Muon}
=================

{
W\in\theta:
\operatorname{ndim}(W)=2,
W\ {\rm eligible\ matrix}
}
]

[
\Theta_{\rm AdamW}
\supset
{
\theta_{\rm RMSNorm},
\theta_{\rm embedding},
\theta_{\rm LMhead},
\theta_{\rm nonmatrix}
}
\qquad
[\mathrm{REPORTED}]
]

[
\Theta_{\rm Muon}
\cap
\Theta_{\rm AdamW}
==================

\varnothing
]

[
\Theta_{\rm Muon}
\cup
\Theta_{\rm AdamW}
==================

\Theta
]

[
\texttt{// Generic Muon pairs with AdamW.}
]
([arXiv][10])

[
\Theta_{\rm Muon}^{Kimi-VL}
===========================

\Theta_{\rm vision}
\cup
\Theta_{\rm projector}
\cup
\Theta_{\rm LLM}
\qquad
[\mathrm{REPORTED}]
]

[
\operatorname{exact\ nonmatrix\ transformation}^{Kimi-VL}
=========================================================

[\mathrm{UNDISCLOSED}]
]
([arXiv][3])

---

## [

\boxed{\mathrm{DISTRIBUTED\ MUON}}
]

[
G_t^{full}
==========

\sum_{\mu}
G_{t,\mu}
]

[
g_{t,r}^{shard}
===============

\operatorname{RS}^{\Sigma}_{DP}
(
G_t^{full}
)_r
]

[
m_{t,r}
=======

\mu m_{t-1,r}
+
g_{t,r}^{shard}
]

[
M_t^{full}
==========

\operatorname{AG}*{DP}
(
{m*{t,r}}
)
]

[
U_t^{full}
==========

\operatorname{NewtonSchulz}
(
M_t^{full}
)
]

[
u_{t,r}
=======

\operatorname{Shard}_r
(
U_t^{full}
)
]

[
p'_{t,r}
========

## p_{t-1,r}

\eta_t
\left(
0.2\sqrt{\max(A,B)}u_{t,r}
+
\lambda p_{t-1,r}
\right)
]

[
\boxed{
W_t
===

\operatorname{AG}*{DP}
(
{p'*{t,r}}
)
}
]

[
T>1
\Longrightarrow
M_t^{full}
\leftarrow
\operatorname{AG}_{TP}
(M_t^{full})
\qquad
[\mathrm{REPORTED}]
]

[
\texttt{// Muon requires full matrix orthogonalization.}
]
([arXiv][10])

---

## [

\boxed{\mathrm{KIMI\ MUONCLIP}}
]

[
S_{\max}^{h}
============

\max_{X\in\mathcal B_t}
\max_{i,j}
\left|
\frac{
(Q_i^h)^\top K_j^h
}{
\sqrt{d_h}
}
\right|
]

[
\gamma_h
========

\min
\left(
1,
\frac{\tau}{S_{\max}^{h}}
\right)
]

[
W_{qc}^{h}
\leftarrow
\sqrt{\gamma_h}
W_{qc}^{h}
]

[
W_{kc}^{h}
\leftarrow
\sqrt{\gamma_h}
W_{kc}^{h}
]

[
W_{qr}^{h}
\leftarrow
\gamma_h
W_{qr}^{h}
]

[
W_{kr}
\leftarrow
W_{kr}
]

[
\tau_{\rm Kimi-K2}
==================

100
\qquad
[\mathrm{REPORTED}]
]

[
\boxed{
W_t
\xrightarrow{\rm Muon}
W_t'
\xrightarrow{\rm QKClip(S_{\max,t})}
W_t''
}
]

[
\texttt{// QK-Clip executes after Muon update.}
]
([arXiv][11])

---

## [

\boxed{\mathrm{ROUTER\ CONTROLLER}}
]

[
L_{e,t}
=======

\sum_{u\in\mathcal B_t}
I_{e,u}
]

[
\bar L_t
========

\frac1{N_r}
\sum_eL_{e,t}
]

[
b_{e,t+1}
=========

b_{e,t}
+
\gamma_t
\begin{cases}
+1,&L_{e,t}<\bar L_t\
-1,&L_{e,t}>\bar L_t\
0,&L_{e,t}=\bar L_t
\end{cases}
]

[
\nabla_\theta b_{e,t}
=====================

0
]

[
\gamma_t^{DS-V3}
================

\begin{cases}
10^{-3},&q_t<14.3T\
0,&q_t\ge14.3T
\end{cases}
\qquad
[\mathrm{REPORTED}]
]

[
\texttt{// Router bias uses feedback control.}
]
([arXiv][2])

---

# [

\boxed{\mathrm{SCHEDULE}}
]

[
\eta_t
======

f(t,q_t)
]

[
q_{t+1}
=======

q_t
+
N_t^{global}
]

[
t_{next}
========

t+1
]

---

## [

\boxed{\mathrm{WARMUP}}
]

[
\eta(t)
=======

\eta_{\max}
\frac{t}{T_w},
\qquad
0\le t<T_w
]

---

## [

\boxed{\mathrm{CONSTANT}}
]

[
\eta(q)
=======

\eta_{\max},
\qquad
Q_a\le q<Q_b
]

---

## [

\boxed{\mathrm{COSINE}}
]

[
u(q)
====

\frac{q-Q_s}{Q_e-Q_s}
]

[
\eta(q)
=======

\eta_{\min}
+
\frac{\eta_{\max}-\eta_{\min}}2
\left[
1+\cos(\pi u(q))
\right]
]

---

## [

\boxed{\mathrm{LINEAR}}
]

[
\eta(q)
=======

\eta_s
+
(\eta_e-\eta_s)
\frac{q-Q_s}{Q_e-Q_s}
]

---

## [

\boxed{\mathrm{WSD}}
]

[
\eta(q)
=======

\begin{cases}
\eta_{\max}\dfrac{q}{Q_w},
&0\le q<Q_w
[2mm]
\eta_{\max},
&Q_w\le q<Q_s
[2mm]
\eta_{\min}
+
(\eta_{\max}-\eta_{\min})
D
\left(
\dfrac{q-Q_s}{Q_e-Q_s}
\right),
&Q_s\le q\le Q_e
\end{cases}
]

[
D(0)=1,
\qquad
D(1)=0
]

---

## [

\boxed{\mathrm{DEEPSEEK!-!V3\ SCHEDULE}}
]

[
\eta^{DS-V3}(t,q)
=================

\begin{cases}
2.2\times10^{-4}\dfrac{t}{2000},
&t<2000
[2mm]
2.2\times10^{-4},
&q<10T
[2mm]
2.2\times10^{-5}
+
\dfrac{
2.2\times10^{-4}-2.2\times10^{-5}
}{2}
\left[
1+
\cos
\left(
\pi\dfrac{q-10T}{4.3T}
\right)
\right],
&10T\le q<14.3T
[3mm]
2.2\times10^{-5},
&14.3T\le q<14.633T
[2mm]
7.3\times10^{-6},
&14.633T\le q\le14.8T
\end{cases}
]

[
c_{\max}=1.0,
\qquad
\lambda_{wd}=0.1
\qquad
[\mathrm{REPORTED}]
]

[
\texttt{// DeepSeek schedule is token-phase dependent.}
]
([arXiv][2])

---

# [

\boxed{\mathrm{RL}}
]

[
\boxed{
\theta^{PT}
\rightarrow
\theta^{SFT}
\rightarrow
\theta^{RL}
}
]

[
\boxed{
\pi_{\theta_k}
\rightarrow
\mathcal R_k
\rightarrow
\tau_k
\rightarrow
R_k
\rightarrow
A_k
\rightarrow
\mathcal L_k^{RL}
\rightarrow
\nabla_\theta
\rightarrow
\theta_{k+1}
}
]

---

## [

\boxed{\mathrm{RLHF\ REWARD\ MODEL}}
]

[
\mathcal D_{\rm pref}
=====================

{
(x,y_w,y_l)
}
]

[
\boxed{
\mathcal L_{\rm RM}(\omega)
===========================

*

\mathbb E_{\mathcal D_{\rm pref}}
\log
\sigma
\left(
r_\omega(x,y_w)
---------------

r_\omega(x,y_l)
\right)
}
\qquad
[\mathrm{REPORTED}]
]

[
\omega^\star
============

\arg\min_\omega
\mathcal L_{\rm RM}
]

[
r_{\omega^\star}
================

\operatorname{sg}
(r_{\omega^\star})
]

[
\texttt{// Human comparisons train scalar reward.}
]
([arXiv][12])

---

## [

\boxed{\mathrm{RLAIF}}
]

[
y_1,y_2
\overset{iid}{\sim}
\pi_{\theta_{SFT}}
(\cdot|x)
]

[
c
=

\operatorname{sg}
\left[
\operatorname{AIJudge}_{\mathcal C}
(x,y_1,y_2)
\right]
]

[
(y_w,y_l)
=========

\operatorname{Order}(y_1,y_2;c)
]

[
\mathcal D_{\rm AIpref}
=======================

{
(x,y_w,y_l)
}
]

[
\mathcal L_{\rm RM}^{AI}
========================

*

\mathbb E
\log
\sigma
\left(
r_\omega(x,y_w)
---------------

r_\omega(x,y_l)
\right)
]

[
\omega_{AI}^{\star}
===================

\arg\min_\omega
\mathcal L_{\rm RM}^{AI}
]

[
R_{AI}(x,y)
===========

\operatorname{sg}
(r_{\omega^\star_{AI}}(x,y))
]

[
\pi_{\theta_{SFT}}
\xrightarrow{\rm RL(R_{AI})}
\pi_{\theta_{RLAIF}}
\qquad
[\mathrm{REPORTED}]
]

[
\texttt{// AI preferences replace human comparisons.}
]
([arXiv][13])

---

## [

\boxed{\mathrm{PPO}}
]

[
s_t
===

(x,y_{<t})
]

[
a_t
===

y_t
]

[
y
\sim
\pi_{\theta_{\rm old}}
(\cdot|x)
]

[
\theta_{\rm old}
================

\operatorname{sg}
(\theta_{\rm old})
]

[
\theta_{\rm ref}
================

\operatorname{sg}
(\theta_{\rm ref})
]

[
\delta_t
========

r_t
+
\gamma
V_\phi(s_{t+1})
---------------

V_\phi(s_t)
]

[
\widehat A_t^{GAE}
==================

\sum_{l=0}^{T-t-1}
(\gamma\lambda)^l
\delta_{t+l}
]

[
\widehat A_t
============

\operatorname{sg}
(\widehat A_t^{GAE})
]

[
\rho_t(\theta)
==============

\frac{
\pi_\theta(a_t|s_t)
}{
\pi_{\theta_{\rm old}}(a_t|s_t)
}
]

[
J_{\rm PPO}^{clip}
==================

\mathbb E_t
\left[
\min
\left(
\rho_t\widehat A_t,
\operatorname{clip}
(
\rho_t,
1-\epsilon,
1+\epsilon
)
\widehat A_t
\right)
\right]
]

[
\mathcal L_V
============

\frac12
\mathbb E_t
\left(
V_\phi(s_t)
-----------

\widehat R_t
\right)^2
]

[
\mathcal H(\pi_\theta)
======================

*

\mathbb E_t
\sum_a
\pi_\theta(a|s_t)
\log
\pi_\theta(a|s_t)
]

[
\boxed{
J_{\rm PPO}
===========

J_{\rm PPO}^{clip}
-c_V\mathcal L_V
+c_H\mathcal H
}
\qquad
[\mathrm{REPORTED}]
]

[
\mathcal L_{\rm PPO}
====================

-J_{\rm PPO}
]

[
\texttt{// PPO reuses rollout minibatches safely.}
]
([arXiv][14])

---

## [

\boxed{\mathrm{INSTRUCTGPT\ KL\ OBJECTIVE}}
]

[
J_{\rm RLHF}(\theta)
====================

\mathbb E_{(x,y)\sim\pi_\theta}
\left[
r_\omega(x,y)
-------------

\beta
\log
\frac{
\pi_\theta(y|x)
}{
\pi_{\rm SFT}(y|x)
}
\right]
+
\gamma
\mathbb E_{x\sim\mathcal D_{PT}}
\log\pi_\theta(x)
]

[
\gamma=0
\Longrightarrow
\operatorname{PPO}
]

[
\gamma>0
\Longrightarrow
\operatorname{PPO!-!ptx}
\qquad
[\mathrm{REPORTED}]
]

[
\texttt{// KL anchors policy to SFT.}
]
([arXiv][12])

---

## [

\boxed{\mathrm{DEEPSEEK!-!V3.2\ STABLE\ GRPO}}
]

[
q
\sim
P(Q)
]

[
{
o_i
}*{i=1}^{G}
\overset{iid}{\sim}
\pi*{\rm old}
(\cdot|q)
]

[
R_i
===

R(q,o_i)
]

[
\bar R
======

\frac1G
\sum_{j=1}^{G}R_j
]

[
\boxed{
\widehat A_{i,t}
================

\operatorname{sg}
(
R_i-\bar R
)
}
\qquad
[\mathrm{REPORTED}]
]

[
r_{i,t}(\theta)
===============

\frac{
\pi_\theta
(o_{i,t}|q,o_{i,<t})
}{
\operatorname{sg}
\left[
\pi_{\rm old}
(o_{i,t}|q,o_{i,<t})
\right]
}
]

[
u_{i,t}
=======

\frac{
\pi_{\rm ref}
(o_{i,t}|q,o_{i,<t})
}{
\pi_\theta
(o_{i,t}|q,o_{i,<t})
}
]

[
\boxed{
K_{i,t}^{unbiased}
==================

r_{i,t}(\theta)
\left(
u_{i,t}
-------

## \log u_{i,t}

1
\right)
}
\qquad
[\mathrm{REPORTED}]
]

[
D_i^{off}
=========

\frac1{|o_i|}
\sum_{t=1}^{|o_i|}
\log
\frac{
\pi_{\rm old}
(o_{i,t}|q,o_{i,<t})
}{
\pi_\theta
(o_{i,t}|q,o_{i,<t})
}
]

[
M_i^{off}
=========

\begin{cases}
0,
&
\widehat A_i<0
\land
D_i^{off}>\delta
\
1,
&
\mathrm{otherwise}
\end{cases}
]

[
M_{i,t}^{off}
=============

M_i^{off}
]

[
J_{\rm clip}^{i,t}
==================

\min
\left(
r_{i,t}\widehat A_{i,t},
\operatorname{clip}
(
r_{i,t},
1-\epsilon,
1+\epsilon
)
\widehat A_{i,t}
\right)
]

[
\boxed{
J_{\rm GRPO}^{DS-V3.2}
======================

\mathbb E
\left[
\frac1G
\sum_{i=1}^{G}
\frac1{|o_i|}
\sum_t
\left(
M_{i,t}^{off}
J_{\rm clip}^{i,t}
------------------

\beta K_{i,t}^{unbiased}
\right)
\right]
}
]

[
\mathcal L_{\rm GRPO}^{DS-V3.2}
===============================

*

J_{\rm GRPO}^{DS-V3.2}
\qquad
[\mathrm{REPORTED}]
]

[
\texttt{// V3.2 uses unbiased KL correction.}
]
([arXiv][15])

---

## [

\boxed{\mathrm{KEEP\ ROUTING}}
]

[
\mathcal R_{i,t}^{rollout}
==========================

\operatorname{TopKExperts}
(
o_{i,\le t};
\theta_{\rm rollout}
)
]

[
\mathcal R_{i,t}^{train}
========================

\operatorname{sg}
(
\mathcal R_{i,t}^{rollout}
)
]

[
\boxed{
\operatorname{TopKExperts}*{train}
\equiv
\mathcal R*{i,t}^{train}
}
]

[
\texttt{// Rollout and training routes match.}
\quad
[\mathrm{REPORTED}]
]
([arXiv][15])

---

## [

\boxed{\mathrm{KEEP\ SAMPLING\ MASK}}
]

[
\mathcal A_{i,t}^{old}
======================

\operatorname{TopPTopKSupport}
(
\pi_{\rm old}(\cdot|s_{i,t})
)
]

[
m_{i,t,v}^{sample}
==================

\mathbf1[
v\in\mathcal A_{i,t}^{old}
]
]

[
\widetilde\pi_\theta(v|s)
=========================

\frac{
m_v^{sample}\pi_\theta(v|s)
}{
\sum_u
m_u^{sample}\pi_\theta(u|s)
}
]

[
\widetilde\pi_{\rm old}(v|s)
============================

\frac{
m_v^{sample}\pi_{\rm old}(v|s)
}{
\sum_u
m_u^{sample}\pi_{\rm old}(u|s)
}
]

[
r_{i,t}
=======

\frac{
\widetilde\pi_\theta(o_{i,t}|s_{i,t})
}{
\widetilde\pi_{\rm old}(o_{i,t}|s_{i,t})
}
]

[
\texttt{// Policies share identical sampled support.}
\quad
[\mathrm{REPORTED}]
]
([arXiv][15])

---

## [

\boxed{\mathrm{GLM!-!5.2\ SAO}}
]

[
\tau
\sim
\pi_{\rm rollout}
]

[
\ell_t^{rollout}
================

\operatorname{sg}
\left[
\log
\pi_{\rm rollout}
(a_t|s_t)
\right]
]

[
r_t(\theta)
===========

\exp
\left[
\log\pi_\theta(a_t|s_t)
-----------------------

\ell_t^{rollout}
\right]
]

[
f(r;\epsilon_\ell,\epsilon_h)
=============================

\begin{cases}
r,
&
1-\epsilon_\ell<r<1+\epsilon_h
\
0,
&
\mathrm{otherwise}
\end{cases}
]

[
\boxed{
J_{\rm SAO}(\theta)
===================

\widehat{\mathbb E}*t
\left[
f(
r_t(\theta);
\epsilon*\ell,\epsilon_h
)
,
\operatorname{sg}(\widehat A_t)
,
\log\pi_\theta(a_t|s_t)
\right]
}
]

[
\mathcal L_{\rm SAO}
====================

-J_{\rm SAO}
\qquad
[\mathrm{REPORTED}]
]

[
\pi_{\rm old}
\notin
\mathfrak S_{\rm SAO}
]

[
\texttt{// SAO removes historical old policy.}
]
([arXiv][16])

---

## [

\boxed{\mathrm{SAO\ VALUE\ LOOP}}
]

[
\mathcal L_V(\phi)
==================

\mathbb E_t
\left[
V_\phi(s_t)-\widehat R_t
\right]^2
]

[
K_V=2
]

[
\phi
\leftarrow
\operatorname{OPT}*V^K
(
\phi,
\nabla*\phi\mathcal L_V
)
]

[
\nabla_{\phi_{attn}}
\mathcal L_V
============

0
]

[
\nabla_{\phi_{MoE}}
\mathcal L_V
\neq
0
\qquad
[\mathrm{REPORTED}]
]

[
\texttt{// SAO updates critic more frequently.}
]
([arXiv][16])

---

## [

\boxed{\mathrm{SKIP!-!OBSERVATION\ GAE}}
]

[
\mathcal T
==========

[
a_0,
o_0,
a_1,
o_1,
\ldots,
a_K
]
]

[
m_t^{actor}
===========

\mathbf1[
t\in a_i
]
]

[
m_t^{actor}
===========

0
\qquad
t\in o_i
]

[
\delta_{i,N}
============

r_{i,N}
+
\gamma
V_\phi(a_{i+1,0})
-----------------

V_\phi(a_{i,N})
]

[
\boxed{
\widehat A(a_{i,N})
===================

\delta_{i,N}
+
\gamma\lambda
\widehat A(a_{i+1,0})
}
\qquad
[\mathrm{REPORTED}]
]

[
\texttt{// Environment observations bypass GAE recursion.}
]
([arXiv][16])

---

## [

\boxed{\mathrm{RL\ STOP\ GRADIENTS}}
]

[
\operatorname{sg}
(
\theta_{\rm rollout}
)
=

\theta_{\rm rollout}
]

[
\nabla_\theta
\theta_{\rm rollout}
====================

0
]

[
\nabla_\theta
\theta_{\rm ref}
================

0
]

[
\nabla_\theta
R
=

0
]

[
\nabla_\theta
\widehat A
==========

0
]

[
\nabla_\theta
\mathcal R^{rollout}
====================

0
]

[
\nabla_\theta
m^{sample}
==========

0
]

[
\boxed{
g_k^{RL}
========

\nabla_{\theta_k}
\mathcal L_{\rm RL}
}
]

[
g_k^{RL}
\xrightarrow{
TP^{*},CP^{*},EP^{*},PP^{*}
}
G_{k,d}^{RL}
]

[
G_{k,d}^{RL}
\xrightarrow{
RS_{DP}/AR_{DP}
}
g_k^{RL,global}
]

[
g_k^{RL,global}
\xrightarrow{\rm GlobalNormClip}
g_k^{RL,clip}
]

[
\boxed{
\theta_{k+1}^{RL}
=================

\operatorname{OPT}
(
\theta_k^{RL},
g_k^{RL,clip},
\Omega_k^{opt},
\eta_k
)
}
]

---

# [

\boxed{\mathrm{OUTPUT}}
]

[
\boxed{
\begin{aligned}
\mathfrak S_t
&=
(
\theta_t,
\Omega_t^{opt},
b_t,
q_t,
\eta_t,
\xi_t
)
[1mm]
&\xrightarrow{\rm sample}
\mathcal B_t
\
&\xrightarrow{\rm tokenize/encode/project}
(
X_t,\Pi_t,M_t,Y_t,m_t
)
\
&\xrightarrow{\rm PP/TP/CP/EP\ forward}
H_t^{0}
\rightarrow
H_t^{1}
\rightarrow
\cdots
\rightarrow
H_t^{N}
\
&\xrightarrow{\rm output\ head}
Z_t
\
&\xrightarrow{\rm objective}
\mathcal L_t
\
&\xrightarrow{\rm exact\ VJP}
G_{d,t}^{local}
\
&\xrightarrow{\rm microbatch\ sum}
G_{d,t}^{acc}
\
&\xrightarrow{\rm unscale}
G_{d,t}
\
&\xrightarrow{
TP^{*}/CP^{*}/EP^{*}/PP^{*}
}
G_{d,t}^{model}
\
&\xrightarrow{
AR^{\Sigma}*{DP}/RS^{\Sigma}*{DP}
}
g_t^{global}
\
&\xrightarrow{/N_t^{global}}
\bar g_t
\
&\xrightarrow{\rm global\ norm\ clip}
g_t^\star
\
&\xrightarrow{
AdamW\ \lor\ Muon\ \lor\ MuonClip
}
\theta_{t+1}
\
&\xrightarrow{\rm router\ controller}
b_{t+1}
\
&\xrightarrow{\rm scheduler}
(
q_{t+1},
\eta_{t+1}
)
\
&=
\mathfrak S_{t+1}.
\end{aligned}
}
]

[
\boxed{
\theta_{\rm init}
\xrightarrow{
\displaystyle
\prod_{t=0}^{T_{PT}-1}
\mathfrak F_{\rm PT}
}
\theta_{\rm foundation}
\xrightarrow{
\displaystyle
\prod_{t=0}^{T_{SFT}-1}
\mathfrak F_{\rm SFT}
}
\theta_{\rm instruction}
\xrightarrow{
\displaystyle
\prod_{k=0}^{T_{RL}-1}
\mathfrak F_{\rm RL}
}
\theta_{\rm final}
}
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
}
]

[
\boxed{
\mathcal L_{\rm DS-V3}
\neq
\mathcal L_{\rm ST-MoE}
\neq
\mathcal L_{\rm Kimi-VL}
\neq
\mathcal L_{\rm Qwen3.5-Omni}
}
]

[
\boxed{
\mathrm{AllReduce}
\neq
\mathrm{ReduceScatter}
\neq
\mathrm{AllGather}
\neq
\mathrm{AllToAll}
}
]

[
\boxed{
\operatorname{Collective}_{forward}^{!\ast}
========================================

\operatorname{Collective}_{backward}
}
\qquad
[\mathrm{DERIVED}]
]

[
\boxed{
\theta_{t+1}
============

\theta_t
+
\Delta\theta_t
}
]

[
\boxed{
\Delta\theta_t
==============

-\eta_t,
\mathcal O
\left[
\operatorname{Clip}
\left(
\frac{
\operatorname{Synchronize}
\left(
\sum_{\mu}
\nabla_{\theta_t}
\mathcal L_{t,\mu}^{\Sigma}
\right)
}{
N_t^{global}
}
\right)
\right]
}
]

[
\boxed{
\mathfrak S_{t+1}
=================

\mathfrak F
\left(
\mathfrak S_t,
\mathcal B_t;
\mathcal T,
\mathcal M,
\mathcal P,
\mathcal L,
\mathscr G,
\mathcal O,
f_\eta
\right)
}
\qquad
[\mathrm{DERIVED}]
]

[1]: https://docs.nvidia.com/megatron-core/developer-guide/0.17.0/apidocs/core/core.tensor_parallel.mappings.html?utm_source=chatgpt.com "core.tensor_parallel.mappings — Megatron Core"
[2]: https://arxiv.org/html/2412.19437v2 "DeepSeek-V3 Technical Report"
[3]: https://arxiv.org/html/2504.07491v1 "Kimi-VL Technical Report"
[4]: https://arxiv.org/html/2604.15804v2 "Qwen3.5-Omni Technical Report"
[5]: https://docs.nvidia.com/megatron-core/developer-guide/latest/apidocs/core/core.tensor_parallel.layers.html?utm_source=chatgpt.com "core.tensor_parallel.layers — Megatron Core"
[6]: https://docs.nvidia.com/megatron-core/developer-guide/0.16.0/user-guide/features/context_parallel.html?utm_source=chatgpt.com "context_parallel package — Megatron Core"
[7]: https://arxiv.org/pdf/2202.08906?utm_source=chatgpt.com "st-moe: designing stable and transferable sparse expert ..."
[8]: https://docs.pytorch.org/docs/stable/distributed.fsdp.fully_shard.html?utm_source=chatgpt.com "torch.distributed.fsdp.fully_shard"
[9]: https://arxiv.org/abs/1711.05101?utm_source=chatgpt.com "Decoupled Weight Decay Regularization"
[10]: https://arxiv.org/html/2502.16982v1 "Muon is Scalable for LLM Training"
[11]: https://arxiv.org/html/2507.20534v1 "Kimi K2: Open Agentic Intelligence"
[12]: https://arxiv.org/abs/2203.02155?utm_source=chatgpt.com "Training language models to follow instructions with human feedback"
[13]: https://arxiv.org/abs/2212.08073?utm_source=chatgpt.com "Constitutional AI: Harmlessness from AI Feedback"
[14]: https://arxiv.org/abs/1707.06347?utm_source=chatgpt.com "Proximal Policy Optimization Algorithms"
[15]: https://arxiv.org/html/2512.02556v1 "DeepSeek-V3.2: Pushing the Frontier of Open Large Language Models"
[16]: https://arxiv.org/html/2607.07508v1 "Single-Rollout Asynchronous Optimization for Agentic Reinforcement Learning"
