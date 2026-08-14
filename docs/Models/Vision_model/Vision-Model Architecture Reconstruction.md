[
\boxed{
\begin{aligned}
\mathsf{CV}&=\texttt{[CODE!-!VERIFIED]},&
\mathsf{CFG}&=\texttt{[CONFIG!-!VERIFIED]},\
\mathsf{PR}&=\texttt{[PAPER!-!REPORTED]},&
\mathsf{MC}&=\texttt{[MODEL!-!CARD!-!REPORTED]},\
\mathsf{MD}&=\texttt{[MATHEMATICALLY!-!DERIVED]},&
\bot&=\texttt{[UNDISCLOSED]} .
\end{aligned}}
]

[
\boxed{
\begin{array}{c|c|c}
M & V_M^\star & \text{selection axis}\
\hline
\mathrm{DeepSeek}
&\mathrm{DeepSeek!-!OCR!-!2/DeepEncoder!-!V2}
&\mathrm{OCR/document\ vision}\
\mathrm{Qwen}
&\mathrm{Qwen3.6\ multimodal\ stack}
&\mathrm{latest\ open\ auditable\ general\ multimodal}\
\mathrm{MiniMax}
&\mathrm{MiniMax!-!M3}
&\mathrm{multimodal\ understanding}\
\mathrm{Kimi}
&\mathrm{Kimi!-!K3/MoonViT!-!V2}
&\mathrm{latest\ open\ native\ multimodal}
\end{array}}
]

Qwen3.8-Max exposes hosted vision, whereas the released auditable Qwen3.8 open path is text-only; MiniMax-H3 is a generative multimodal/VAE pathway rather than the encoder→LLM understanding pathway reconstructed here. ([Hugging Face][1])

---

# DS — DeepSeek-OCR-2 / DeepEncoder-V2

## DS.0 — Version Lock

[
\boxed{
\mathcal V_{\rm DS}=
\left(
\begin{array}{l}
\text{DeepSeek-OCR-2},\
\texttt{deepseek-ai/DeepSeek-OCR-2},\
\texttt{e6322a289fe5b5218278d276d4e7c58e8103f46a},\
\text{arXiv:2601.20552},\
\text{checkpoint-local processor/modeling source}
\end{array}
\right)
}
\quad\mathsf{CV/PR}
]

([Hugging Face][2])

---

## DS.1 — Canonical Pipeline

[
\boxed{
\begin{aligned}
I^{u8}
&\rightarrow
{I^{768}*{1},\ldots,I^{768}*{K}}
\oplus I^{1024}*{G}\
&\rightarrow
X*{\rm norm}\
&\rightarrow
\operatorname{SAM}*{12}
\
&\rightarrow
\operatorname{Neck}*{256}
\rightarrow
\operatorname{Conv}*{s=2}^{256\to512}
\rightarrow
\operatorname{Conv}*{s=2}^{512\to896}
\
&\rightarrow
Z_{\rm image-grid}^{896}
\rightarrow
[Z_{\rm image};Q_{\rm learn}]
\
&\rightarrow
\operatorname{CausalFlow}*{24}
\rightarrow
Z*{\rm tower}^{896}
\
&\rightarrow
W_PZ_{\rm tower}+b_P
\rightarrow
Z_{\rm interface}^{1280}.
\end{aligned}}
]

([Hugging Face][3])

---

## DS.2 — Architecture Constants

[
\boxed{
\Theta_{\rm DS}^{\rm SAM}=
\left{
\begin{aligned}
&p_h=p_w=16,\quad D_0=768,\quad L_0=12,\
&H_0=12,\quad d_h=64,\quad D_{f,0}=3072,\
&w_{\rm local}=14,\quad
\mathcal L_G={2,5,8,11},\
&\epsilon_{\rm LN}=10^{-6}.
\end{aligned}
\right.
}
]

[
\boxed{
\Theta_{\rm DS}^{\rm CF}=
\left{
\begin{aligned}
&D=896,\quad L=24,\
&H_Q=14,\quad H_{KV}=2,\quad
g=7,\quad d_h=64,\
&D_f=4864,\
&\epsilon_{\rm RMS}=10^{-6},\
&\theta_{\rm RoPE}=10^6,\
&D_{\rm interface}=1280 .
\end{aligned}
\right.
}
]

([Hugging Face][2])

---

## DS.3 — Raw Image Transformation

For candidate local tilings:

[
\mathcal R=
{(i,j)\in\mathbb N^2:2\le ij\le6}.
]

[
(i^\star,j^\star)
=================

\underset{(i,j)\in\mathcal R}{\arg\min}
\left|
\frac{W_0}{H_0}-\frac{i}{j}
\right|,
]

with the checkpoint-code tie rule based on source-image area. Then

[
W_L=768,i^\star,\qquad
H_L=768,j^\star,
]

[
I_L=
\operatorname{Resize}
(I;H_L,W_L),
]

[
I_{u,v}
=======

I_L[
768u:768(u+1),;
768v:768(v+1)
].
]

The source invokes PIL resize without an explicit resampling argument at this call site:

[
\boxed{\mathcal I_{\rm local}=\bot}.
]

Global branch:

[
I_G=
\operatorname{ImageOps.pad}
(I;(1024,1024),\mathrm{fill}=(127,127,127)).
]

([Hugging Face][3])

RGB tensor normalization:

[
X_{c,h,w}
=========

# \frac{I_{h,w,c}/255-\frac12}{\frac12}

2\frac{I_{h,w,c}}{255}-1.
]

[
\boxed{
\mu=(0.5,0.5,0.5),\qquad
\sigma=(0.5,0.5,0.5)
}
\quad\mathsf{CV}
]

([Hugging Face][3])

---

## DS.4 — Raw Video Transformation

[
\boxed{
\mathcal P_{\rm DS}^{video}=\bot
}
]

The released OCR-2 execution path audited here is image/document-oriented; no source-complete video processor/tower path is established by the target checkpoint.

---

## DS.5 — Patch Tensorization

For each local/global image branch:

[
X\in\mathbb R^{B\times3\times H\times W},
]

[
P_{b,r,c,\chi,a,j}
==================

X_{b,\chi,16r+a,16c+j},
]

[
0\le a,j<16,
]

[
P_{b,r,c}
\in
\mathbb R^{3\times16\times16}.
]

[
H_p=H/16,\qquad
W_p=W/16.
]

---

## DS.6 — Patch Embedding

Executed Conv2D:

[
W_{\rm patch}
\in
\mathbb R^{768\times3\times16\times16},
]

[
E_{b,r,c,d}
===========

b_d+
\sum_{\chi=0}^{2}
\sum_{a=0}^{15}
\sum_{j=0}^{15}
W_{d,\chi,a,j}
X_{b,\chi,16r+a,16c+j}.
]

[
E
\in
\mathbb R^{B\times H_p\times W_p\times768}.
]

([Hugging Face][2])

---

## DS.7 — Flattening / Token Ordering

SAM remains grid-structured:

[
(r,c)\mapsto E_{r,c}.
]

After SAM + convolutional downsampling:

[
Z^{896}\in
\mathbb R^{B\times896\times H_q\times W_q},
]

[
H_q=H_p/4,\qquad
W_q=W_p/4.
]

Causal-flow raster sequence:

[
n=rW_q+c,
]

[
z_n=Z_{:,r,c},
\qquad
N=H_qW_q.
]

([Hugging Face][2])

---

## DS.8 — Positional Construction

### SAM absolute PE

[
P_{\rm base}^{abs}
\in
\mathbb R^{1\times64\times64\times768}.
]

[
P^{abs}_{H_p,W_p}
=================

\operatorname{BicubicInterpolate}
(P_{\rm base}^{abs};H_p,W_p),
]

[
X^{(0)}_{r,c}
=============

E_{r,c}+P^{abs}_{r,c}.
]

([Hugging Face][2])

### SAM decomposed relative position

For head (h):

[
L_{ij}^{h}
==========

\frac{
q_i^h(k_j^h)^\top
}{8}
+
q_i^h!\cdot R^{H}*{r_i,r_j}
+
q_i^h!\cdot R^{W}*{c_i,c_j}.
]

[
d_h=64.
]

([Hugging Face][4])

### Causal-flow 1-D RoPE

[
\omega_j
========

(10^6)^{-2j/64},
\qquad
j=0,\ldots,31,
]

[
R(n,\omega_j)=
\begin{bmatrix}
\cos(n\omega_j)&-\sin(n\omega_j)\
\sin(n\omega_j)&\cos(n\omega_j)
\end{bmatrix}.
]

[
q_{n,2j:2j+2}
\leftarrow
R(n,\omega_j)q_{n,2j:2j+2},
]

[
k_{n,2j:2j+2}
\leftarrow
R(n,\omega_j)k_{n,2j:2j+2}.
]

([Hugging Face][4])

---

## DS.9 — Encoder Layers

### DS.SAM — layers (0,\ldots,11)

[
\widehat X_\ell
===============

\operatorname{LN}*{10^{-6}}(X*\ell).
]

[
[Q,K,V]
=======

\widehat X_\ell W^{(\ell)\top}*{QKV}
+b^{(\ell)}*{QKV},
]

[
W_{QKV}
\in
\mathbb R^{2304\times768}.
]

For (\ell\in\mathcal L_G):

[
M^{(\ell)}_{ij}=0
\qquad\forall i,j.
]

For (\ell\notin\mathcal L_G), window (14\times14):

[
M^{(\ell)}_{ij}
===============

\begin{cases}
0,&i,j\in\mathcal W_m,\
-\infty,&\text{otherwise}.
\end{cases}
]

[
A_\ell^h
========

\operatorname{Softmax}
\left(
\frac{Q_\ell^h(K_\ell^h)^\top}{\sqrt{64}}
+B_{\rm rel}^{h}
+M_\ell
\right).
]

[
O_\ell=
\operatorname{Concat}*{h=1}^{12}
(A*\ell^hV_\ell^h)
W_O^\top+b_O.
]

[
U_\ell=X_\ell+O_\ell.
]

[
X_{\ell+1}
==========

U_\ell+
W_2
\operatorname{GELU}
(W_1\operatorname{LN}(U_\ell)+b_1)+b_2,
]

[
768\rightarrow3072\rightarrow768.
]

([Hugging Face][2])

### DS.Neck

[
Y_0
===

\operatorname{LN2D}
\left(
\operatorname{Conv}*{1\times1}^{768\rightarrow256}
(X*{12})
\right),
]

[
Y_1
===

\operatorname{LN2D}
\left(
\operatorname{Conv}_{3\times3,s=1,p=1}^{256\rightarrow256}
(Y_0)
\right),
]

[
Y_2=
\operatorname{Conv}_{3\times3,s=2,p=1}^{256\rightarrow512}(Y_1),
]

[
Y_3=
\operatorname{Conv}_{3\times3,s=2,p=1}^{512\rightarrow896}(Y_2).
]

[
[H_p,W_p]\rightarrow[H_p/4,W_p/4].
]

([Hugging Face][2])

### DS.CausalFlow — learned queries

[
Z=(z_0,\ldots,z_{N-1})
\in\mathbb R^{N\times896}.
]

[
Q^{learn}
=========

(q_0,\ldots,q_{N-1})
\in\mathbb R^{N\times896}.
]

Checkpoint tables:

[
N=
\begin{cases}
144,&768\times768\text{ crop},\
256,&1024\times1024\text{ global}.
\end{cases}
]

[
X_0^{CF}
========

[z_0,\ldots,z_{N-1},
q_0,\ldots,q_{N-1}]
\in\mathbb R^{2N\times896}.
]

([Hugging Face][2])

### DS.CausalFlow — exact mask

For (0\le i,j<2N):

[
\boxed{
M_{ij}^{CF}
===========

\begin{cases}
0,
&i<N,;j<N,[2mm]
0,
&i=N+a,;j<N,[1mm]
0,
&i=N+a,;N\le j\le N+a,\
-\infty,
&\text{otherwise}.
\end{cases}}
]

Thus

[
\forall i<N:\quad
i\leftrightarrow j<N,
]

while query state (q_a) reads

[
{z_0,\ldots,z_{N-1}}
\cup
{q_0,\ldots,q_a}.
]

([Hugging Face][2])

### DS.CausalFlow — GQA

[
\widehat X_\ell
===============

\operatorname{RMSNorm}*{10^{-6}}(X*\ell).
]

[
Q=\widehat XW_Q^\top+b_Q,
\quad
Q\in\mathbb R^{2N\times14\times64},
]

[
K=\widehat XW_K^\top+b_K,
\quad
K\in\mathbb R^{2N\times2\times64},
]

[
V=\widehat XW_V^\top+b_V,
\quad
V\in\mathbb R^{2N\times2\times64}.
]

[
g=\frac{14}{2}=7,
\qquad
k(h)=\left\lfloor\frac h7\right\rfloor.
]

[
L^h_{ij}
========

\frac{
\langle
R(i)q_i^h,;
R(j)k_j^{k(h)}
\rangle
}{8}
+
M_{ij}^{CF}.
]

[
A^h=\operatorname{Softmax}(L^h),
]

[
O=
\operatorname{Concat}_{h=1}^{14}(A^hV^{k(h)})
W_O^\top+b_O.
]

[
U_\ell=X_\ell+O_\ell.
]

SwiGLU:

[
F_\ell=
W_d
\left[
\operatorname{SiLU}(W_g\widehat U_\ell)
\odot
W_u\widehat U_\ell
\right],
]

[
896\rightarrow4864\rightarrow896,
]

[
X_{\ell+1}=U_\ell+F_\ell,
\qquad
\ell=0,\ldots,23.
]

([Hugging Face][2])

---

## DS.10 — Final Vision Tower State

Only query suffix is retained:

[
Z_{\rm tower}
=============

\operatorname{RMSNorm}
(X_{24})_{N:2N}.
]

[
\boxed{
Z_{\rm tower}^{DS}
\in
\mathbb R^{B\times N\times896}
}
]

([Hugging Face][2])

---

## DS.11 — Merger / Pooler / Projector

[
P(z)=W_Pz+b_P,
]

[
W_P\in\mathbb R^{1280\times896}.
]

For (K) local crops:

[
Z_L=
\operatorname{Concat}
(P(Z^{(1)}),\ldots,P(Z^{(K)})).
]

[
Z_G=P(Z^{global}).
]

With learned separator:

[
s_{\rm view}\in\mathbb R^{1280},
]

[
\boxed{
Z_{\rm interface}
=================

[Z_L;;Z_G;;s_{\rm view}].
}
]

([Hugging Face][2])

---

## DS.12 — Final Multimodal Interface

[
\boxed{
Z_{\rm interface}^{DS}
\in
\mathbb R^{
B\times
(N_{\rm local}+N_{\rm global}+1)
\times1280
}.
}
]

---

## DS.13 — Spatial State Evolution

Per (768^2) local crop:

[
768^2
\rightarrow
48^2
\xrightarrow{\mathrm{SAM}_{12}}
48^2
\rightarrow
24^2
\rightarrow
12^2.
]

Per (1024^2) global view:

[
1024^2
\rightarrow
64^2
\xrightarrow{\mathrm{SAM}_{12}}
64^2
\rightarrow
32^2
\rightarrow
16^2.
]

Therefore

[
s^{pre}*{H,W}=16,
\qquad
s^{CF}*{H,W}=64.
]

---

## DS.14 — Temporal State Evolution

[
\boxed{
T:\quad 1\rightarrow1.
}
]

---

## DS.15 — Representation Bottlenecks

[
\mathcal B_{\rm DS}
===================

\left{
\begin{array}{l}
I\rightarrow\operatorname{Resize/Crops}(I),\
[H,W]\rightarrow[H/16,W/16];\text{patch projection},\
[H/16,W/16]\rightarrow[H/64,W/64];\text{post-SAM stride},\
896\rightarrow1280;\text{projector}.
\end{array}
\right}.
]

Token-resolution compression before causal-flow:

[
\rho_N^{pre-CF}
===============

\frac{H_pW_p}{(H_p/4)(W_p/4)}
=16.
]

---

## DS.16 — Concrete Tensor Example: (1024\times1024)

For a square (1024^2) source, dynamic local tiling selects (2\times2):

[
1024^2
\rightarrow
4\times768^2
\oplus
1\times1024^2.
]

Local branch:

[
[3,768,768]
\rightarrow
[48,48,768]
\rightarrow
[12,12,896]
\rightarrow
[144,896]
\rightarrow
[144,1280].
]

[
4\times144=576.
]

Global:

[
[3,1024,1024]
\rightarrow
[64,64,768]
\rightarrow
[16,16,896]
\rightarrow
[256,896]
\rightarrow
[256,1280].
]

Hence

[
N_{\rm tower}=576+256=832,
]

[
\boxed{
Z_{\rm interface}
\in
\mathbb R^{833\times1280}
}
]

including one view-separator token.

---

## DS.17 — Source Conflicts / Undisclosed

[
\boxed{
\mathcal U_{\rm DS}
===================

\left{
\begin{array}{l}
\mathcal I_{\rm local}=\bot,\
\mathcal P^{video}=\bot,\
\texttt{downsample_channels}_{config}
\neq
\text{executed hard-coded channel path}.
\end{array}
\right}
}
]

The config exposes downsample-channel fields that do not reproduce the executed (256\to512\to896) path; the latter is hard-coded in the target implementation. ([Hugging Face][2])

---

# QW — Qwen3.6 multimodal / Qwen3.5 vision stack

## QW.0 — Version Lock

[
\boxed{
\mathcal V_{\rm QW}
===================

\left(
\begin{array}{l}
\mathrm{Qwen3.6!-!35B!-!A3B},\
\text{initial checkpoint revision }\texttt{7da1103},\
\mathrm{Qwen3.5/Qwen3.5!-!MoE\ vision\ implementation},\
\mathrm{Qwen2VLImageProcessorFast},\
\mathrm{Qwen3VLVideoProcessor}
\end{array}
\right).
}
]

([GitHub][5])

[
\boxed{
\text{exact initial Transformers source SHA}=\bot
}
]

because the checkpoint reports `transformers_version=4.57.1`, while the exact Qwen3.5-MoE implementation path is not present at the corresponding upstream tag inspected; current official implementation is therefore architectural evidence but not silently equated with the initial library revision. 

---

## QW.1 — Canonical Pipeline

[
\boxed{
I/V
\rightarrow
\operatorname{smart_resize}
\rightarrow
\operatorname{normalize}
\rightarrow
\operatorname{merge!-!aware\ patchify}
\rightarrow
\operatorname{Conv3D}*{(2,16,16)}
\rightarrow
P^{abs}*{2D}+{\rm RoPE}*{2D}
\rightarrow
27\times{\rm ViT}
\rightarrow
Z*{\rm tower}
\rightarrow
2\times2\ {\rm merger}
\rightarrow
Z_{\rm interface}.
}
]

([Hugging Face][6])

---

## QW.2 — Architecture Constants

[
\boxed{
\Theta_{\rm QW}=
\left{
\begin{aligned}
&p_t=2,\quad p_h=p_w=16,\
&D=1152,\quad L=27,\
&H_Q=H_K=H_V=16,\
&d_h=72,\quad D_f=4304,\
&m=2,\quad D_{\rm out}=2048,\
&N_{PE}=2304=48^2,\
&\epsilon_{\rm LN}=10^{-6},\
&\theta_{\rm vision-RoPE}=10^4.
\end{aligned}
\right}.
}
]

([Hugging Face][6])

---

## QW.3 — Raw Image Transformation

Let

[
F=p_hm=32.
]

Aspect-ratio admissibility:

[
\frac{\max(H,W)}{\min(H,W)}\le200.
]

First alignment:

[
\bar H=
\max(F,\operatorname{round}(H/F)F),
]

[
\bar W=
\max(F,\operatorname{round}(W/F)F).
]

If

[
\bar H\bar W>P_{\max},
]

[
\beta=
\sqrt{\frac{HW}{P_{\max}}},
]

[
H_r=
\left\lfloor
\frac{H}{\beta F}
\right\rfloor F,
\qquad
W_r=
\left\lfloor
\frac{W}{\beta F}
\right\rfloor F.
]

If

[
\bar H\bar W<P_{\min},
]

[
\beta=
\sqrt{\frac{P_{\min}}{HW}},
]

[
H_r=
\left\lceil
\frac{H\beta}{F}
\right\rceil F,
\qquad
W_r=
\left\lceil
\frac{W\beta}{F}
\right\rceil F.
]

Image checkpoint bounds:

[
P_{\min}=65536,\qquad
P_{\max}=16777216.
]

Interpolation:

[
I_r=\operatorname{Bicubic}(I;H_r,W_r).
]

Normalization:

[
X_{c,h,w}
=========

2\frac{I_{h,w,c}}{255}-1.
]

([Hugging Face][7])

---

## QW.4 — Raw Video Transformation

Checkpoint video pixel constraints:

[
P_{\min}^{vid}=4096,
\qquad
P_{\max}^{vid}=25165824.
]

([Hugging Face][8])

Raw decoder/sampling:

[
V^{u8}*{T_0}
\overset{\mathcal S}{\longrightarrow}
V*{T_s},
]

[
\boxed{
\mathcal S_{\rm raw\ video}
===========================

\bot
}
]

for a single target-checkpoint-local, fully source-locked sampling equation.

Once frames are supplied:

[
T_p=
\left\lceil\frac{T_s}{2}\right\rceil
]

subject to the processor's temporal completion rule; exact Qwen3.6 checkpoint-local odd-frame completion policy remains version-lock-sensitive:

[
\boxed{
\mathcal P_{T,\rm odd}^{QW}=\bot.
}
]

---

## QW.5 — Patch Tensorization

Image path is represented as a temporal pair consumed by the 3-D patch projector:

[
P_{t,r,c,\chi,\tau,a,j}
=======================

X_{\chi,;2t+\tau,;16r+a,;16c+j},
]

[
P_{t,r,c}
\in
\mathbb R^{3\times2\times16\times16},
]

[
D_{\rm rawpatch}
================

# 3\cdot2\cdot16^2

1536.

]

---

## QW.6 — Patch Embedding

[
W_{\rm patch}
\in
\mathbb R^{1152\times3\times2\times16\times16}.
]

[
E_{t,r,c,d}
===========

b_d+
\sum_{\chi,\tau,a,j}
W_{d,\chi,\tau,a,j}
P_{t,r,c,\chi,\tau,a,j}.
]

[
E_{t,r,c}\in\mathbb R^{1152}.
]

Executed operator:

[
\boxed{
\operatorname{Conv3D}
(k=s=(2,16,16),\ \mathrm{bias}=1)
}
\quad\mathsf{CV}
]

([GitHub][9])

---

## QW.7 — Flattening / Token Ordering

Let

[
H_p=H_r/16,\qquad
W_p=W_r/16,
]

[
H_b=H_p/2,\qquad
W_b=W_p/2.
]

For

[
r=2R+a,\quad
c=2C+b,
\quad
a,b\in{0,1},
]

the merger-aware processor ordering is

[
\boxed{
\pi(t,r,c)
==========

\left[
(tH_b+R)W_b+C
\right]4
+
2a+b.
}
]

For images (t=0):

[
\pi(r,c)
========

(RW_b+C)4+2a+b.
]

Thus

[
[\pi^{-1}(4k),\ldots,\pi^{-1}(4k+3)]
]

is one (2\times2) spatial neighborhood.

([GitHub][10])

---

## QW.8 — Positional Construction

### Learned 2-D absolute PE

[
P^{abs}
\in
\mathbb R^{48\times48\times1152}.
]

For variable patch grid:

[
\widetilde P^{abs}_{H_p,W_p}
============================

\mathcal I_{\rm bilinear}
(P^{abs};H_p,W_p),
]

with implementation-established interpolation semantics.

[
X^{(0)}
=======

E+
\widetilde P^{abs}.
]

([GitHub][11])

### Vision 2-D RoPE

[
d_h=72.
]

The vision rotary constructor receives

[
d_R=d_h/2=36.
]

[
\omega_j
========

10000^{-2j/36},
\qquad
j=0,\ldots,17.
]

For token coordinate ((r,c)):

[
f(r,c)
======

[
r\omega_0,\ldots,r\omega_{17},
c\omega_0,\ldots,c\omega_{17}
].
]

[
f(r,c)\in\mathbb R^{36}.
]

Duplicated sine/cosine pairing yields rotation over the (72)-D head:

[
\phi_{2D}(r,c)
==============

[f(r,c),f(r,c)].
]

[
\boxed{
d_r=36,\qquad
d_c=36,\qquad
d_{\rm unrotated}=0.
}
]

([GitHub][9])

[
\boxed{
\text{vision RoPE}_{2D}
\neq
\text{LLM multimodal RoPE}.
}
]

---

## QW.9 — Encoder Layer (0,\ldots,26)

[
\widehat X_\ell
===============

\operatorname{LN}*{10^{-6}}(X*\ell).
]

Fused QKV:

[
[Q;K;V]
=======

\widehat X_\ell W_{QKV}^{\top}+b_{QKV},
]

[
W_{QKV}
\in
\mathbb R^{3456\times1152}.
]

[
Q,K,V
\in
\mathbb R^{N\times16\times72}.
]

2-D rotary:

[
Q\leftarrow R_{2D}(r,c)Q,
\qquad
K\leftarrow R_{2D}(r,c)K.
]

For packed media sequence segment function (s(i)):

[
\boxed{
M_{ij}
======

\begin{cases}
0,&s(i)=s(j),\
-\infty,&s(i)\neq s(j).
\end{cases}}
]

Within one image/video:

[
M_{ij}=0\qquad\forall i,j.
]

Hence video patch groups can attend across time inside the same media segment.

[
L_{ij}^{h}
==========

\frac{\langle q_i^h,k_j^h\rangle}{\sqrt{72}}
+
M_{ij}.
]

[
A^h=\operatorname{Softmax}(L^h).
]

[
O=
\operatorname{Concat}_{h=1}^{16}(A^hV^h)
W_O^\top+b_O.
]

[
U_\ell=X_\ell+O.
]

MLP:

[
F_\ell
======

W_2
\operatorname{GELU}*{\tanh}
(W_1\operatorname{LN}(U*\ell)+b_1)+b_2,
]

[
1152\rightarrow4304\rightarrow1152.
]

[
X_{\ell+1}=U_\ell+F_\ell.
]

([GitHub][9])

---

## QW.10 — Final Vision Tower State

[
\boxed{
Z_{\rm tower}^{QW}
==================

X_{27}
\in
\mathbb R^{B\times T_pH_pW_p\times1152}.
}
]

No additional token-count reduction occurs inside the 27 attention blocks. ([GitHub][9])

---

## QW.11 — Merger / Projector

For each contiguous (2\times2) group:

[
g_{t,R,C}
=========

\operatorname{Concat}*{a,b\in{0,1}}
\operatorname{LN}
\left(
z*{t,2R+a,2C+b}
\right),
]

[
g\in\mathbb R^{4\cdot1152}
==========================

\mathbb R^{4608}.
]

[
h
=

\operatorname{GELU}
(W_1g+b_1),
]

[
W_1\in\mathbb R^{4608\times4608}.
]

[
z'=
W_2h+b_2,
]

[
W_2\in\mathbb R^{2048\times4608}.
]

[
\boxed{
N_{\rm interface}
=================

T_p
\frac{H_p}{2}
\frac{W_p}{2}.
}
]

([GitHub][9])

---

## QW.12 — Final Interface

[
\boxed{
Z_{\rm interface}^{QW}
\in
\mathbb R^{
B\times
\left(T_pH_pW_p/4\right)
\times2048
}.
}
]

---

## QW.13 — Spatial Evolution

[
(H_0,W_0)
\rightarrow
(H_r,W_r)
\rightarrow
(H_r/16,W_r/16)
\rightarrow
(H_r/32,W_r/32).
]

[
s_{\rm pre-attn}=16,
\qquad
s_{\rm interface}=32
]

in resized-image coordinates.

---

## QW.14 — Temporal Evolution

Once (T_s) sampled frames exist:

[
T_s
\rightarrow
T_p=\left\lceil T_s/2\right\rceil
\xrightarrow{27\times\mathrm{cross-time\ MHA}}
T_p
\xrightarrow{\mathrm{spatial\ merge}}
T_p.
]

Thus

[
\rho_T^{pre-attn}\approx2,
\qquad
\rho_T^{post-attn}=1.
]

---

## QW.15 — Bottlenecks

[
\mathcal B_{\rm QW}
===================

\left{
\begin{array}{l}
\text{smart-resize},\
(2,16,16)\text{ strided Conv3D},\
2\times2\text{ post-attention spatial merge},\
4608\rightarrow2048\text{ merger projection}.
\end{array}
\right}.
]

---

## QW.16 — Concrete Tensor Example: (1024^2)

Since

[
1024\equiv0\pmod{32},
]

and its area lies inside the image bounds:

[
1024^2\rightarrow1024^2.
]

[
[3,1024,1024]
\rightarrow
[1,64,64,1152].
]

[
N_{\rm tower}=64^2=4096.
]

After (2\times2) merge:

[
[1,64,64,1152]
\rightarrow
[1,32,32,2048].
]

[
\boxed{
N_{\rm interface}=1024.
}
]

[
\boxed{
\rho_N^{post-attn}=4.
}
]

For already-sampled four-frame video:

[
[4,3,1024,1024]
\rightarrow
[2,64,64,1152]
\rightarrow
[2,32,32,2048].
]

[
N_{\rm tower}=8192,
\qquad
N_{\rm interface}=2048.
]

---

## QW.17 — Source Conflicts / Undisclosed

[
\boxed{
\mathcal U_{\rm QW}
===================

\left{
\begin{array}{l}
\text{initial exact Transformers implementation SHA}=\bot,\
\mathcal S_{\rm raw-video}=\bot,\
\mathcal P_{T,\rm odd}^{target-revision}=\bot.
\end{array}
\right}.
}
]

---

# MM — MiniMax-M3

## MM.0 — Version Lock

[
\boxed{
\mathcal V_{\rm MM}
===================

\left(
\begin{array}{l}
\mathrm{MiniMaxAI/MiniMax!-!M3},\
\texttt{3a41b311ffa5719cef48fed3974ccf2cc03733ea},\
\mathrm{official\ M3\ checkpoint/config},\
\mathrm{MiniMax/HF\ Transformers\ v5.14\ implementation},\
\mathrm{image+video\ processors}
\end{array}
\right).
}
]

No dedicated public M3 architecture paper establishing more detail than the released model/config/code was located:

[
\boxed{\mathrm{paper}_{MM}=\bot.}
]

([Hugging Face][12])

---

## MM.1 — Canonical Pipeline

[
\boxed{
I/V
\rightarrow
\operatorname{smart_resize}
\rightarrow
\operatorname{CLIPNorm}
\rightarrow
\operatorname{merge-aware\ patchify}
\rightarrow
\operatorname{Conv3D}*{(2,14,14)}
\rightarrow
\operatorname{LN}*{pre}
\rightarrow
32\times\operatorname{ViT}*{3D-RoPE}
\rightarrow
Z*{\rm tower}
\rightarrow
P_1
\rightarrow
2\times2\operatorname{Concat}
\rightarrow
P_2
\rightarrow
Z_{\rm interface}.
}
]

([GitHub][13])

---

## MM.2 — Architecture Constants

[
\boxed{
\Theta_{\rm MM}=
\left{
\begin{aligned}
&p_t=2,\quad p_h=p_w=14,\
&D=1280,\quad L=32,\
&H_Q=H_K=H_V=16,\
&d_h=80,\quad D_f=5120,\
&m=2,\quad D_{\rm LLM}=6144,\
&\epsilon_{\rm LN}=10^{-5},\
&\theta_{\rm RoPE}=10^4.
\end{aligned}
\right}.
}
]

([Hugging Face][12])

[
\boxed{
\text{MiniMax MSA}_{text}
\not\equiv
\text{vision attention}.
}
]

The sparse-attention configuration belongs to `text_config`; the vision implementation explicitly instantiates non-causal CLIP-style MHA. ([Hugging Face][12])

---

## MM.3 — Raw Image Transformation

[
F=p_hm=28.
]

[
\frac{\max(H,W)}{\min(H,W)}\le200.
]

[
\bar H=\max(28,\operatorname{round}(H/28)28),
]

[
\bar W=\max(28,\operatorname{round}(W/28)28).
]

Image defaults:

[
P_{\min}=4\cdot28^2=3136,
]

[
P_{\max}=451584=672^2.
]

If area exceeds maximum:

[
\beta=\sqrt{\frac{HW}{451584}},
]

[
H_r=
\left\lfloor\frac{H}{28\beta}\right\rfloor28,
\qquad
W_r=
\left\lfloor\frac{W}{28\beta}\right\rfloor28.
]

If below minimum:

[
\beta=\sqrt{\frac{3136}{HW}},
]

[
H_r=
\left\lceil\frac{H\beta}{28}\right\rceil28,
\qquad
W_r=
\left\lceil\frac{W\beta}{28}\right\rceil28.
]

Interpolation:

[
I_r=\operatorname{Bicubic}(I;H_r,W_r).
]

Normalization:

[
X_c
===

\frac{I_c/255-\mu_c}{\sigma_c},
]

[
\mu=
(0.48145466,;0.4578275,;0.40821073),
]

[
\sigma=
(0.26862954,;0.26130258,;0.27577711).
]

([GitHub][13])

---

## MM.4 — Raw Video Transformation

Default processor declaration:

[
\operatorname{do_sample_frames}=False.
]

[
fps_{\rm metadata}=1.0,\qquad
T_{\min}=4,\qquad
T_{\max}=768,
]

but frame sampling is not executed by the processor by default.

([GitHub][14])

Given supplied (T_s) frames:

[
p=
(-T_s)\bmod2,
]

[
V'=
\begin{cases}
V,&p=0,\
[V_0,\ldots,V_{T_s-1},
\underbrace{V_{T_s-1},\ldots,V_{T_s-1}}_{p}],
&p>0.
\end{cases}
]

[
T' = T_s+p,
\qquad
T_p=T'/2.
]

([GitHub][14])

Video spatial bounds:

[
P_{\min}^{vid}=4\cdot28^2,
]

[
P_{\max}^{vid}=768\cdot28^2,
]

with the same `smart_resize` rule.

---

## MM.5 — Patch Tensorization

[
P_{t,r,c,\chi,\tau,a,j}
=======================

X_{2t+\tau,\chi,14r+a,14c+j}.
]

[
P_{t,r,c}
\in
\mathbb R^{3\times2\times14\times14}.
]

[
D_{\rm rawpatch}
================

# 3\cdot2\cdot14^2

1176.

]

Processor ordering explicitly reshapes into merger blocks before flattening. ([GitHub][13])

---

## MM.6 — Patch Embedding

[
W_{\rm patch}
\in
\mathbb R^{1280\times3\times2\times14\times14}.
]

[
E_{t,r,c,d}
===========

\sum_{\chi,\tau,a,j}
W_{d,\chi,\tau,a,j}
P_{t,r,c,\chi,\tau,a,j}.
]

[
\boxed{
b_{\rm patch}=0
}
]

[
E_{t,r,c}\in\mathbb R^{1280}.
]

([GitHub][15])

---

## MM.7 — Flattening / Token Ordering

Let

[
H_b=H_p/2,\qquad
W_b=W_p/2,
]

[
r=2R+a,\quad
c=2C+b.
]

Then

[
\boxed{
\pi(t,r,c)
==========

[(tH_b+R)W_b+C]4+2a+b.
}
]

This follows directly from the processor's

[
\operatorname{view}
\rightarrow
\operatorname{permute}
\rightarrow
\operatorname{reshape}
]

sequence. ([GitHub][13])

---

## MM.8 — Positional Construction: Exact 3-D RoPE

[
d_h=80.
]

Implementation:

[
d_{\rm rope}
============

2\left\lfloor\frac{80}{2}\right\rfloor=80,
]

[
d_{\rm axis}
============

2\left\lfloor
\frac{
\lfloor80/3\rfloor
}{2}
\right\rfloor
=============

26.

]

Thus

[
\boxed{
d_t=d_h^{coord}=d_w=26,
\qquad
d_{\rm rotated}=78,
\qquad
d_{\rm unrotated}=2.
}
]

Frequencies:

[
\omega_j
========

10000^{-2j/26},
\qquad
j=0,\ldots,12.
]

For coordinate ((t,r,c)):

[
f(t,r,c)
========

[
t\omega_0,\ldots,t\omega_{12},
r\omega_0,\ldots,r\omega_{12},
c\omega_0,\ldots,c\omega_{12}
].
]

[
f\in\mathbb R^{39}.
]

[
\phi=
[f,f]\in\mathbb R^{78}.
]

For the head:

[
q=[q_R;q_U],
\quad
q_R\in\mathbb R^{78},
\quad
q_U\in\mathbb R^2,
]

[
q'_R
====

q_R\odot\cos\phi
+
\operatorname{rotate_half}(q_R)\odot\sin\phi,
]

[
q'=[q'_R;q_U].
]

Identically for (k).

([GitHub][15])

---

## MM.9 — Encoder Layer (0,\ldots,31)

Pre-tower normalization:

[
X_0
===

\operatorname{LN}_{10^{-5}}(E).
]

([GitHub][15])

For every layer:

[
\widehat X_\ell
===============

\operatorname{LN}*{10^{-5}}(X*\ell).
]

Separate projections:

[
Q=\widehat X_\ell W_Q^\top+b_Q,
]

[
K=\widehat X_\ell W_K^\top+b_K,
]

[
V=\widehat X_\ell W_V^\top+b_V,
]

[
W_Q,W_K,W_V
\in
\mathbb R^{1280\times1280}.
]

[
Q,K,V
\in
\mathbb R^{N\times16\times80}.
]

Apply 3-D RoPE to first 78 head dimensions:

[
(Q',K')=\operatorname{RoPE}_{3D}(Q,K).
]

Vision attention is non-causal:

[
\boxed{
M_{ij}=0
}
]

for tokens participating in the same tower call.

[
L_{ij}^{h}
==========

\frac{
\langle q_i^{\prime h},k_j^{\prime h}\rangle
}{\sqrt{80}}.
]

[
A^h=\operatorname{Softmax}(L^h).
]

[
O=
\operatorname{Concat}_{h=1}^{16}(A^hV^h)
W_O^\top+b_O.
]

[
U_\ell=X_\ell+O.
]

MLP:

[
F_\ell=
W_2
\operatorname{GELU}
(W_1\operatorname{LN}(U_\ell)+b_1)+b_2,
]

[
1280\rightarrow5120\rightarrow1280.
]

[
\boxed{
X_{\ell+1}=U_\ell+F_\ell.
}
]

([GitHub][15])

For video, because the tower attention is dense over the supplied video patch sequence:

[
\boxed{
t_i\neq t_j
;\not\Rightarrow;
M_{ij}=-\infty.
}
]

Hence MiniMax M3 performs cross-temporal self-attention after temporal Conv3D patchification.

---

## MM.10 — Final Vision Tower State

No post-encoder final normalization is applied in the inspected vision model:

[
\boxed{
Z_{\rm tower}^{MM}
==================

X_{32}
\in
\mathbb R^{B\times T_pH_pW_p\times1280}.
}
]

([GitHub][15])

---

## MM.11 — Merger / Projector

### Stage 1: each tower token

[
u_i
===

W_2^{(a)}
\operatorname{GELU}
(W_1^{(a)}z_i+b_1^{(a)})
+b_2^{(a)}.
]

[
1280
\xrightarrow{W_1^{(a)}}
6144
\xrightarrow{\rm GELU}
6144
\xrightarrow{W_2^{(a)}}
6144.
]

### Stage 2: contiguous spatial (2\times2)

[
g_k=
[u_{4k};u_{4k+1};u_{4k+2};u_{4k+3}]
\in
\mathbb R^{24576}.
]

[
z'_k
====

W_2^{(b)}
\operatorname{GELU}
(W_1^{(b)}g_k+b_1^{(b)})
+b_2^{(b)}.
]

[
24576
\rightarrow
6144
\rightarrow
6144.
]

[
\boxed{
N_{\rm interface}
=================

\frac{N_{\rm tower}}4.
}
]



---

## MM.12 — Final Multimodal Interface

[
\boxed{
Z_{\rm interface}^{MM}
\in
\mathbb R^{
B\times
(T_pH_pW_p/4)
\times6144
}.
}
]

---

## MM.13 — Spatial Evolution

[
(H_0,W_0)
\rightarrow
(H_r,W_r)
\rightarrow
(H_r/14,W_r/14)
\rightarrow
(H_r/28,W_r/28).
]

[
s_{\rm pre-attn}=14,
\qquad
s_{\rm interface}=28
]

in resized coordinates.

---

## MM.14 — Temporal Evolution

[
T_s
\rightarrow
T_s+p
\rightarrow
\frac{T_s+p}{2}
\xrightarrow{32\times\text{dense attention}}
\frac{T_s+p}{2}
\xrightarrow{\text{spatial merge}}
\frac{T_s+p}{2}.
]

[
\rho_T^{pre-attn}
=================

\frac{T_s}{(T_s+p)/2},
]

[
\rho_T^{post-attn}=1.
]

---

## MM.15 — Representation Bottlenecks

[
\mathcal B_{\rm MM}
===================

\left{
\begin{array}{l}
\operatorname{smart_resize},\
\operatorname{Conv3D}_{(2,14,14)},\
1280\rightarrow6144\text{ token projection},\
4\times6144\rightarrow6144\text{ spatial fusion}.
\end{array}
\right}.
]

---

## MM.16 — Concrete Tensor Example: raw (1024^2)

Since

[
1024^2>672^2,
]

[
\beta
=====

# \sqrt{\frac{1024^2}{672^2}}

\frac{1024}{672}.
]

Therefore

[
H_r=W_r
=======

\left\lfloor
\frac{1024}{(1024/672)\cdot28}
\right\rfloor28
===============

672.

]

Image:

[
[3,1024,1024]
\rightarrow
[3,672,672].
]

Image temporal duplication/padding:

[
T:1\rightarrow2\rightarrow T_p=1.
]

Patch grid:

[
H_p=W_p=672/14=48.
]

[
N_{\rm tower}=48^2=2304.
]

[
Z_{\rm tower}\in\mathbb R^{2304\times1280}.
]

Merger:

[
48\times48
\rightarrow
24\times24.
]

[
N_{\rm interface}=576.
]

[
\boxed{
Z_{\rm interface}
\in
\mathbb R^{576\times6144}.
}
]

---

## MM.17 — Source Conflicts / Undisclosed

Checkpoint metadata says

[
\texttt{transformers_version}=4.52.4,
]

whereas the fully integrated MiniMax/HF model path audited above is the later official Transformers implementation:

[
\boxed{
\mathcal C_{\rm version}
========================

\texttt{[documentation / implementation drift]}.
}
]

The architecture constants remain checkpoint-established; integration-specific execution details above are explicitly tied to official Transformers v5.14 rather than silently attributed to 4.52.4. ([Hugging Face][12])

---

# KM — Kimi-K3 / MoonViT-V2

## KM.0 — Version Lock

[
\boxed{
\mathcal V_{\rm KM}
===================

\left(
\begin{array}{l}
\mathrm{Kimi!-!K3},\
\texttt{moonshotai/Kimi-K3},\
\texttt{c5d1dd4c428bd1ce8b88c5044f3b6ccde9e3b721},\
\mathrm{arXiv:2607.24653v2},\
\mathrm{KimiK3VisionProcessor},\
\mathrm{modeling\ implementation}=\bot
\end{array}
\right).
}
]

([Hugging Face][16])

---

## KM.1 — Canonical Pipeline

Publicly closed segment:

[
\boxed{
I
\rightarrow
\operatorname{NaViTResize}
\rightarrow
\operatorname{bottom/right\ pad}
\rightarrow
\operatorname{normalize}
\rightarrow
\operatorname{patchify}_{14}
\rightarrow
P.
}
]

Paper/config-established continuation:

[
\boxed{
P
\overset{\bot}{\longrightarrow}
E_{1024}
\rightarrow
27\times\operatorname{MoonViT!-!V2}
\rightarrow
Z_{\rm tower}
\rightarrow
\operatorname{TemporalPool}
\rightarrow
\operatorname{PixelShuffle}*{2\times2}
\rightarrow
\operatorname{MLPProjector}
\rightarrow
Z*{\rm interface}^{7168}.
}
]

The first arrow after patch vectors cannot be made implementation-exact because the target public repository's referenced model implementation is not source-complete enough to establish its executed embedding equations. ([Hugging Face][17])

---

## KM.2 — Architecture Constants

[
\boxed{
\Theta_{\rm KM}=
\left{
\begin{aligned}
&p_h=p_w=14,\
&D_v=1024,\
&L_v=27,\
&H_Q=12,\
&D_f=4096,\
&m=2,\
&D_{\rm LLM}=7168,\
&\epsilon_{\rm projector-LN}=10^{-5},\
&\text{activation}=\operatorname{GELU}_{\tanh},\
&\text{norm}=\operatorname{RMSNorm},\
&\text{linear/attention bias}=0.
\end{aligned}
\right}.
}
]

[
\boxed{
d_h=\bot,\qquad
H_{KV}=\bot,\qquad
p_t=\bot.
}
]

`qkv_hidden_size=1536` is **not** converted into a per-head dimension because its runtime semantic partition is not established by executable target modeling source.

The paper independently establishes (27) layers, RMSNorm, bias-free linear/attention projections, factorized spatial/temporal attention, temporal pooling, and (2\times2) pixel-shuffle compression. ([arXiv][18])

---

## KM.3 — Raw Image Transformation

Let

[
p=14,\qquad
m=2,\qquad
F=pm=28.
]

Processor configuration variables:

[
P_{\lim}
========

\texttt{in_patch_limit},
]

[
S_{\lim}
========

\texttt{patch_limit_on_one_side},
]

[
N_{\rm fixed}
=============

\texttt{fixed_output_tokens}.
]

For source ((W,H)):

[
s_1
===

\sqrt{
\frac{
P_{\lim}
}{
\max(1,\lfloor W/p\rfloor)
\max(1,\lfloor H/p\rfloor)
}
},
]

[
s_2=\frac{S_{\lim}p}{W},
\qquad
s_3=\frac{S_{\lim}p}{H},
]

[
s=\min(1,s_1,s_2,s_3).
]

[
W_r=\max(1,\lfloor Ws\rfloor),
\qquad
H_r=\max(1,\lfloor Hs\rfloor).
]

Alignment padding:

[
\Delta W=(F-W_r\bmod F)\bmod F,
]

[
\Delta H=(F-H_r\bmod F)\bmod F.
]

[
I_{\rm pad}
===========

\operatorname{Pad}
(I_r;;0,\Delta H,0,\Delta W),
]

with

[
\boxed{
p_{\rm top}=p_{\rm left}=0,
\qquad
p_{\rm bottom}=\Delta H,
\qquad
p_{\rm right}=\Delta W,
\qquad
v_{\rm pad}=0.
}
]

([Hugging Face][19])

Interpolation family from the media utility:

[
\mathcal I_{\rm resize}
=======================

\operatorname{Bicubic}
\quad\mathsf{CV}.
]

Normalization code executes

[
X=
(I-\mu)\odot\sigma^{-1},
]

but the numerical checkpoint-level values of

[
\boxed{
\mu,\sigma,P_{\lim},S_{\lim},N_{\rm fixed}
}
]

were not established from the smallest public source set inspected:

[
\boxed{
(\mu,\sigma,P_{\lim},S_{\lim},N_{\rm fixed})=\bot.
}
]

---

## KM.4 — Raw Video Transformation

Paper:

[
\boxed{
\text{MoonViT-V2 supports images and videos with shared parameters}
}
\quad\mathsf{PR}.
]

([arXiv][18])

Target public processor:

[
\operatorname{get_resize_config}(x)
===================================

\begin{cases}
\operatorname{NaViTResize}(x),&x.type=\texttt{image},\
\operatorname{raise},&x.type\neq\texttt{image}.
\end{cases}
]

Therefore:

[
\boxed{
\mathcal P_{\rm KM}^{video,;checkpoint}
=======================================

\bot.
}
]

([Hugging Face][19])

---

## KM.5 — Patch Tensorization

After resize and pad:

[
X
\in
\mathbb R^{T\times H_a\times W_a\times3},
]

[
H_a=H_r+\Delta H,
\qquad
W_a=W_r+\Delta W.
]

Public `navit_patchify` semantics:

[
P_{t,r,c,\chi,a,b}
==================

X_{t,;14r+a,;14c+b,;\chi},
]

[
P_{t,r,c}
\in
\mathbb R^{3\times14\times14}.
]

Flatten:

[
p_{t,r,c}
=========

\operatorname{vec}(P_{t,r,c})
\in
\mathbb R^{588}.
]

[
588=3\cdot14^2.
]

([Hugging Face][19])

---

## KM.6 — Patch Embedding

Config/paper establish:

[
D_v=1024.
]

But target executable embedding operator is not publicly closed:

[
\boxed{
p_{t,r,c}\in\mathbb R^{588}
\overset{
T_{\rm embed}=\bot
}{
\longrightarrow}
e_{t,r,c}\in\mathbb R^{1024}.
}
]

Therefore neither

[
W_E\in\mathbb R^{1024\times588}
]

nor a Conv2D/Conv3D equivalent is asserted as code-established.

[
\boxed{
\text{model/class naming}
\neq
\text{executed patch embedding evidence}.
}
]

---

## KM.7 — Flatten / Token Ordering

Processor patch ordering before tower:

[
\boxed{
n=(tH_p+r)W_p+c,
}
]

[
H_p=H_a/14,
\qquad
W_p=W_a/14.
]

([Hugging Face][19])

---

## KM.8 — Positional Construction

Config establishes:

[
\texttt{pos_emb_type}
=====================

\texttt{divided_fixed},
]

[
(T_0^{PE},H_0^{PE},W_0^{PE})
============================

(4,64,64),
]

[
\mathcal I_{\rm pos}
====================

\operatorname{bilinear}.
]

However:

[
\boxed{
P(t,r,c)=\bot
}
]

because the public target checkpoint does not expose the exact executed construction needed to determine:

[
\begin{aligned}
&
\text{axis partition},\
&
\text{additive vs rotary application},\
&
\text{temporal interpolation coordinates},\
&
\text{head-dimension interaction}.
\end{aligned}
]

No RoPE equation is substituted from Kimi K2.5.

---

## KM.9 — Encoder Layer (0,\ldots,26)

Paper-established outer recurrence:

[
\boxed{
X_{\ell+1}
==========

\mathcal B_\ell^{MoonViT-V2}(X_\ell),
\qquad
\ell=0,\ldots,26.
}
]

[
\operatorname{Norm}
===================

\operatorname{RMSNorm}.
]

[
b_{Q,K,V,O}=0,
\qquad
b_{\rm FFN}=0.
]

([arXiv][18])

For images, spatial attention exists:

[
X_\ell
\rightarrow
\operatorname{SpatialAttention}*\ell(X*\ell)
\rightarrow\cdots
]

For video, factorization is paper-established:

[
\boxed{
X_\ell
\rightarrow
\operatorname{IntraFrameSpatialAttn}
\rightarrow
\operatorname{InterFrameTemporalAttn}
\rightarrow\cdots
}
]

([arXiv][18])

Spatial mask at minimum satisfies:

[
M^{S}_{ij}
==========

-\infty
\quad\text{if}\quad
t_i\neq t_j.
]

Exact temporal connectivity:

[
\boxed{
M^{T}_{ij}=\bot.
}
]

Exact QKV projections:

[
\boxed{
W_Q,W_K,W_V,;
d_h,;
H_{KV}
======

\bot.
}
]

Exact FFN recurrence beyond

[
D_v=1024,
\qquad
D_f=4096
]

is likewise not upgraded to (\mathsf{CV}).

---

## KM.10 — Final Vision Tower State

[
\boxed{
Z_{\rm tower}^{KM}
\in
\mathbb R^{
B\times
N_{\rm tower}
\times1024
}
}
\quad
\mathsf{CFG/PR}.
]

For image:

[
N_{\rm tower}=H_pW_p
]

conditional on the source-established fact that the post-tower (2\times2) compression occurs **after** MoonViT-V2 rather than inside the tower. ([arXiv][18])

---

## KM.11 — Temporal Pool / Pixel Shuffle / Projector

Paper:

[
Z_{\rm tower}^{video}
\xrightarrow{\mathcal T_{\rm pool}}
Z_{\rm tp},
]

[
\boxed{
\mathcal T_{\rm pool}=\bot
}
]

at operator level.

It is established only that:

[
T_{\rm tp}<T_{\rm tower}
]

for nontrivial video inputs. ([arXiv][18])

Spatial compression:

[
[T,H_p,W_p,D]
\rightarrow
[T',H_p/2,W_p/2,D_{ps}],
]

[
\boxed{
\frac{N_{\rm pre-shuffle}}
{N_{\rm post-shuffle}}
=4
}
]

for the spatial dimension.

([arXiv][18])

Exact pixel-shuffle channel permutation:

[
\boxed{
\Pi_{\rm pixelshuffle}=\bot,
\qquad
D_{ps}=\bot.
}
]

Projector:

[
Z_{\rm interface}
=================

\mathcal P(Z_{ps}),
]

[
\boxed{
D_{\rm interface}=7168
}
\quad\mathsf{CFG}.
]

Exact matrix sequence:

[
\boxed{
\mathcal P(\cdot)=\bot
}
]

despite config exposing `patchmergerv2`, GELU and normalization fields, because the implementation that fixes the actual composition is absent from the target public code path.

---

## KM.12 — Final Interface

For images:

[
\boxed{
Z_{\rm interface}^{KM}
\in
\mathbb R^{
B\times
(H_pW_p/4)
\times7168
}
}
]

conditional on valid (H_p,W_p) divisible by (2).

For video:

[
\boxed{
N_{\rm interface}^{video}
=========================

T_{\rm pool}
\frac{H_pW_p}{4},
\qquad
T_{\rm pool}=\bot.
}
]

---

## KM.13 — Spatial Evolution

[
(H_0,W_0)
\rightarrow
(H_r,W_r)
\rightarrow
(H_a,W_a)
\rightarrow
(H_a/14,W_a/14)
\rightarrow
(H_a/28,W_a/28).
]

[
s_{\rm pre-attn}=14
]

in aligned-processor coordinates.

[
s_{\rm post-attn}=28.
]

---

## KM.14 — Temporal Evolution

Paper-level:

[
\boxed{
T_0
\rightarrow
T_{\rm sampled}
\rightarrow
T_{\rm tower}
\rightarrow
T_{\rm pooled}
\rightarrow
T_{\rm interface}.
}
]

Target checkpoint:

[
T_{\rm sampled}
===============

# T_{\rm tower}

# T_{\rm pooled}

# T_{\rm interface}

\bot
\qquad\text{for raw video}.
]

---

## KM.15 — Representation Bottlenecks

[
\mathcal B_{\rm KM}
===================

\left{
\begin{array}{l}
\operatorname{NaViTResize},\
14\times14\operatorname{Patchify},\
\operatorname{TemporalPool};(\text{video}),\
2\times2\operatorname{PixelShuffle},\
\operatorname{Projector}\rightarrow7168.
\end{array}
\right}.
]

---

## KM.16 — Concrete Tensor Example

Because target processor limits and normalization constants required for a source-valid raw-(1024^2) execution remain unresolved, no fabricated (1024\rightarrow H_r) transition is inserted.

Choose instead a processor-output-valid aligned geometry:

[
H_a=W_a=1008=72\cdot14=36\cdot28.
]

Patchification:

[
[1,1008,1008,3]
\rightarrow
[1,72,72,588].
]

[
N_{\rm patch}=72^2=5184.
]

Config-conditioned tower:

[
[5184,588]
\xrightarrow{;T_{\rm embed}=\bot;}
[5184,1024]
\xrightarrow{27\ {\rm layers}}
[5184,1024].
]

Paper-established (2\times2) spatial compression:

[
72\times72
\rightarrow
36\times36.
]

[
N_{\rm interface}=1296.
]

[
\boxed{
Z_{\rm interface}
\in
\mathbb R^{1296\times7168}
}
]

for the single-image path, conditional on the unexposed projector implementation preserving the paper/config token-count semantics.

---

## KM.17 — Source Conflicts / Undisclosed

[
\boxed{
\mathcal U_{\rm KM}
===================

\left{
\begin{array}{l}
\mu,\sigma=\bot,\
P_{\lim},S_{\lim},N_{\rm fixed}=\bot,\
p_t=\bot,\
T_{\rm embed}=\bot,\
d_h,H_{KV}=\bot,\
P(t,h,w)=\bot,\
M^T_{ij}=\bot,\
\mathcal T_{\rm pool}=\bot,\
\Pi_{\rm pixelshuffle}=\bot,\
\mathcal P_{\rm projector}=\bot,\
\mathcal P^{video}_{checkpoint}=\bot.
\end{array}
\right}.
}
]

[
\boxed{
\text{paper-native video support}
;\not\Rightarrow;
\text{public checkpoint-local video processor support}.
}
]

([arXiv][18])

---

# Cross-Family Mathematical Synthesis

| (\mathcal F_M)             |                       DeepSeek OCR-2 |                   Qwen3.6 vision |          MiniMax-M3 |                              Kimi K3 |
| -------------------------- | -----------------------------------: | -------------------------------: | ------------------: | -----------------------------------: |
| (p_t)                      |                       (1) / no video |                              (2) |                 (2) |                               (\bot) |
| (p_h\times p_w)            |                         (16\times16) |                     (16\times16) |        (14\times14) |                         (14\times14) |
| (D_v)                      |                          (768\to896) |                           (1152) |              (1280) |                               (1024) |
| (L_v)                      |                              (12+24) |                             (27) |                (32) |                                 (27) |
| (H_Q/H_{KV})               |                        (12/12;;14/2) |                          (16/16) |             (16/16) |                            (12/\bot) |
| (d_h)                      |                             (64;;64) |                             (72) |                (80) |                               (\bot) |
| (D_f)                      |                         (3072;;4864) |                           (4304) |              (5120) |                               (4096) |
| (P_{\rm position})         | learned abs + 2-D rel; then 1-D RoPE |       learned abs 2-D + 2-D RoPE |            3-D RoPE | divided-fixed, exact equation (\bot) |
| (M_{\rm attention})        |          window/global → causal-flow | packed-media dense bidirectional | dense bidirectional |          spatial/temporal factorized |
| cross-time tower attention |                                    — |                              yes |                 yes |                      yes, factorized |
| (m_{\rm spatial})          |                  post-SAM stride (4) |                              (2) |                 (2) |                                  (2) |
| temporal pooling           |                                    — |                             none |                none |                 yes, operator (\bot) |
| (D_{\rm interface})        |                               (1280) |                           (2048) |              (6144) |                               (7168) |

Primary-source support: DeepSeek implementation/config ([Hugging Face][2]); Qwen config/implementation ([Hugging Face][6]); MiniMax checkpoint/code ([Hugging Face][12]); Kimi paper/config ([arXiv][18]).

---

# Architecture-Conditioned Objectives

### Explicit code-verified 3-D positional geometry

[
f_{\rm 3D-explicit}(M)
======================

\mathbf1[
P_M(t,h,w)
\text{ is executable-source verified}
].
]

[
\boxed{
M^\star_{\rm explicit;3D;position}
==================================

\mathrm{MiniMax!-!M3}.
}
]

MiniMax exposes the complete (T/H/W) frequency construction and (78+2) head-dimension split in executable source. ([GitHub][15])

### Explicit OCR/document specialization

[
f_{\rm OCR-specialization}(M)
=============================

\mathbf1[
\text{architecture released specifically for OCR/document compression}
].
]

[
\boxed{
M^\star_{\rm architecture;OCR-specialization}
=============================================

\mathrm{DeepSeek!-!OCR!-!2}.
}
]

This is an architecture-domain classification, **not** an OCR benchmark-performance ranking. ([arXiv][20])

### Finest executed pre-attention spatial patch footprint

[
f_{\rm spatial\ granularity}(M)
===============================

-;p_hp_w.
]

Among fully code-closed paths:

[
14^2<16^2,
]

hence

[
\boxed{
\arg\max f_{\rm spatial\ granularity}
=====================================

{\mathrm{MiniMax!-!M3}}
}
]

with Kimi also configured at (14^2) but lacking the target executable embedding closure needed for the stronger code-verified classification.

### Explicit temporal preservation after patch embedding

[
f_{\rm preserve-T}
==================

\frac{T_{\rm interface}}{T_{\rm patch}}.
]

Qwen:

[
f_{\rm preserve-T}^{QW}=1.
]

MiniMax:

[
f_{\rm preserve-T}^{MM}=1.
]

Kimi:

[
f_{\rm preserve-T}^{KM}<1
]

for nontrivial videos by paper design because explicit temporal pooling occurs before the interface. ([arXiv][18])

---

# Final Compression Ledger

## DeepSeek-OCR-2

For each processed view:

[
\boxed{
\rho_H^{pre-attn}=16,
\qquad
\rho_W^{pre-attn}=16.
}
]

Post-SAM:

[
\boxed{
\rho_H^{post-attn}=4,
\qquad
\rho_W^{post-attn}=4.
}
]

Combined to causal-flow grid:

[
\boxed{
\rho_H^{total}=64,
\qquad
\rho_W^{total}=64.
}
]

[
\boxed{
\rho_N^{post-SAM}
=================

\frac{H_pW_p}
{(H_p/4)(W_p/4)}
=16.
}
]

No video temporal ratio:

[
\rho_T=\bot.
]

---

## Qwen3.6

[
\boxed{
\rho_H^{pre-attn}=16,
\qquad
\rho_W^{pre-attn}=16,
\qquad
\rho_T^{pre-attn}\simeq2.
}
]

Post-attention merger:

[
\boxed{
\rho_H^{post-attn}=2,
\qquad
\rho_W^{post-attn}=2,
\qquad
\rho_T^{post-attn}=1.
}
]

[
\boxed{
\rho_N^{post-attn}=4.
}
]

Total resized-domain spatial stride:

[
\boxed{
s_H^{eff}=s_W^{eff}=32.
}
]

---

## MiniMax-M3

[
\boxed{
\rho_H^{pre-attn}=14,
\qquad
\rho_W^{pre-attn}=14,
\qquad
\rho_T^{pre-attn}\simeq2.
}
]

[
\boxed{
\rho_H^{post-attn}=2,
\qquad
\rho_W^{post-attn}=2,
\qquad
\rho_T^{post-attn}=1.
}
]

[
\boxed{
\rho_N^{post-attn}=4,
\qquad
s_H^{eff}=s_W^{eff}=28.
}
]

---

## Kimi-K3

Processor-aligned image:

[
\boxed{
\rho_H^{pre-attn}=14,
\qquad
\rho_W^{pre-attn}=14.
}
]

Paper-established post-attention spatial compression:

[
\boxed{
\rho_H^{post-attn}=2,
\qquad
\rho_W^{post-attn}=2,
\qquad
\rho_N^{spatial}=4.
}
]

[
\boxed{
s_H^{eff}=s_W^{eff}=28
}
]

in aligned processor coordinates.

Video:

[
\boxed{
\rho_T
======

\frac{T_{\rm tower}}
{T_{\rm pooled}}

> 1,
> \qquad
> \text{exact value}=\bot.
> }
> ]

([arXiv][18])

---

[
\boxed{
\begin{aligned}
\mathrm{DeepSeek:};&
I
\rightarrow
16{\times}16\ {\rm SAM\ patches}
\rightarrow
4{\times}\ {\rm post!-!attention\ spatial\ reduction}
\rightarrow
896
\rightarrow1280,
[1mm]
\mathrm{Qwen:};&
(I/V)
\rightarrow
(2,16,16)\ {\rm patches}
\rightarrow
27{\times}{\rm dense\ ViT}
\rightarrow
2{\times}2\ {\rm spatial\ merge}
\rightarrow2048,
[1mm]
\mathrm{MiniMax:};&
(I/V)
\rightarrow
(2,14,14)\ {\rm patches}
\rightarrow
32{\times}{\rm dense\ 3D!-!RoPE\ ViT}
\rightarrow
2{\times}2\ {\rm spatial\ fusion}
\rightarrow6144,
[1mm]
\mathrm{Kimi:};&
(I/V)
\rightarrow
14{\times}14\ {\rm patches}
\rightarrow
27{\times}{\rm MoonViT!-!V2}
\rightarrow
{\rm temporal\ pooling}
\rightarrow
2{\times}2\ {\rm pixel\ shuffle}
\rightarrow7168,
\
&
\hspace{36mm}
\text{with unexposed target implementation transitions retained as }\bot .
\end{aligned}
}
]

[1]: https://huggingface.co/Qwen/Qwen3.8-2.4T-A95B-FP8 "https://huggingface.co/Qwen/Qwen3.8-2.4T-A95B-FP8"
[2]: https://huggingface.co/deepseek-ai/DeepSeek-OCR-2/commit/e6322a289fe5b5218278d276d4e7c58e8103f46a "https://huggingface.co/deepseek-ai/DeepSeek-OCR-2/commit/e6322a289fe5b5218278d276d4e7c58e8103f46a"
[3]: https://huggingface.co/deepseek-ai/DeepSeek-OCR-2/blob/main/modeling_deepseekocr2.py "https://huggingface.co/deepseek-ai/DeepSeek-OCR-2/blob/main/modeling_deepseekocr2.py"
[4]: https://huggingface.co/deepseek-ai/DeepSeek-OCR-2/blob/db8cee3a6b6a12ff7237046281a0523579ee74fa/deepencoderv2.py "https://huggingface.co/deepseek-ai/DeepSeek-OCR-2/blob/db8cee3a6b6a12ff7237046281a0523579ee74fa/deepencoderv2.py"
[5]: https://github.com/QwenLM/Qwen3.6 "https://github.com/QwenLM/Qwen3.6"
[6]: https://huggingface.co/Qwen/Qwen3.6-35B-A3B/blob/main/config.json "https://huggingface.co/Qwen/Qwen3.6-35B-A3B/blob/main/config.json"
[7]: https://huggingface.co/Qwen/Qwen3.6-35B-A3B/blob/refs%2Fpr%2F41/preprocessor_config.json "https://huggingface.co/Qwen/Qwen3.6-35B-A3B/blob/refs%2Fpr%2F41/preprocessor_config.json"
[8]: https://huggingface.co/Qwen/Qwen3.6-35B-A3B/blob/07be63a9fb84c8b182eb2c231001e21714145872/video_preprocessor_config.json "https://huggingface.co/Qwen/Qwen3.6-35B-A3B/blob/07be63a9fb84c8b182eb2c231001e21714145872/video_preprocessor_config.json"
[9]: https://github.com/huggingface/transformers/blob/main/src/transformers/models/qwen3_5_moe/modeling_qwen3_5_moe.py "https://github.com/huggingface/transformers/blob/main/src/transformers/models/qwen3_5_moe/modeling_qwen3_5_moe.py"
[10]: https://github.com/huggingface/transformers/blob/main/src/transformers/models/qwen2_vl/image_processing_qwen2_vl.py "https://github.com/huggingface/transformers/blob/main/src/transformers/models/qwen2_vl/image_processing_qwen2_vl.py"
[11]: https://github.com/huggingface/transformers/blob/main/src/transformers/models/qwen3_vl/modeling_qwen3_vl.py "https://github.com/huggingface/transformers/blob/main/src/transformers/models/qwen3_vl/modeling_qwen3_vl.py"
[12]: https://huggingface.co/MiniMaxAI/MiniMax-M3/blob/main/config.json "https://huggingface.co/MiniMaxAI/MiniMax-M3/blob/main/config.json"
[13]: https://github.com/huggingface/transformers/blob/v5.14.0/src/transformers/models/minimax_m3_vl/image_processing_minimax_m3_vl.py "https://github.com/huggingface/transformers/blob/v5.14.0/src/transformers/models/minimax_m3_vl/image_processing_minimax_m3_vl.py"
[14]: https://github.com/huggingface/transformers/blob/v5.14.0/src/transformers/models/minimax_m3_vl/video_processing_minimax_m3_vl.py "https://github.com/huggingface/transformers/blob/v5.14.0/src/transformers/models/minimax_m3_vl/video_processing_minimax_m3_vl.py"
[15]: https://github.com/huggingface/transformers/raw/refs/tags/v5.14.0/src/transformers/models/minimax_m3_vl/modeling_minimax_m3_vl.py "https://github.com/huggingface/transformers/raw/refs/tags/v5.14.0/src/transformers/models/minimax_m3_vl/modeling_minimax_m3_vl.py"
[16]: https://huggingface.co/moonshotai/Kimi-K3/commit/c5d1dd4c428bd1ce8b88c5044f3b6ccde9e3b721 "https://huggingface.co/moonshotai/Kimi-K3/commit/c5d1dd4c428bd1ce8b88c5044f3b6ccde9e3b721"
[17]: https://huggingface.co/moonshotai/Kimi-K3/blob/c5d1dd4c428bd1ce8b88c5044f3b6ccde9e3b721/config.json "https://huggingface.co/moonshotai/Kimi-K3/blob/c5d1dd4c428bd1ce8b88c5044f3b6ccde9e3b721/config.json"
[18]: https://arxiv.org/html/2607.24653 "https://arxiv.org/html/2607.24653"
[19]: https://huggingface.co/moonshotai/Kimi-K3/blame/main/kimi_k3_vision_processing.py "https://huggingface.co/moonshotai/Kimi-K3/blame/main/kimi_k3_vision_processing.py"
[20]: https://arxiv.org/abs/2601.20552?utm_source=chatgpt.com "DeepSeek-OCR 2: Visual Causal Flow"
