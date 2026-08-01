# (\textsc{Qwen-Family External Training Programs})

[
\boxed{
\mathsf{M}_{\theta}
\equiv
\text{opaque trainable model};
\qquad
\text{no internal layer expansion}
}
]

[
\boxed{
\mathsf{EvidenceBase}
=====================

\mathsf{Qwen3};
\qquad
\mathsf{TransferToOtherQwenGenerations}
=======================================

\operatorname{UNDISCLOSED}
}
]

[
\mathfrak S_s
=============

\left(
\theta_s,
\omega_s,
\mathcal D_s,
\pi_s,
\mathcal E_s,
\xi_s
\right)
\xrightarrow{\mathcal J_s}
\mathfrak S_{s+1}.
]

---

## (\textsc{Algorithm 0: Global External Interface})

### (\textbf{INPUT})

[
\mathcal V
==========

{0,\ldots,V-1},
\qquad
V=151,669.
]

[
\mathsf T:
\mathcal U
\rightarrow
\mathcal V^{*}.
]

[
X
\in
\mathbb N^{B\times L},
\qquad
A
\in
{0,1}^{B\times L},
\qquad
P
\in
\mathbb N^{B\times L}.
]

[
\mathsf M_{\theta}:
(X,A,P)
\mapsto
Z_{\theta},
\qquad
Z_{\theta}
\in
\mathbb R^{B\times L\times V}.
]

[
\Pi_{\theta,b,t,v}
==================

\frac{
\exp Z_{\theta,b,t,v}
}{
\sum_{u=1}^{V}
\exp Z_{\theta,b,t,u}
}.
]

### (\textbf{STATE})

[
\mathfrak S_t
=============

\left(
\theta_t,
\omega_t,
\eta_t,
\nu_t,
\zeta_t
\right).
]

[
\theta_t
========

\text{trainable model parameters},
\qquad
\omega_t
========

\text{optimizer state},
]

[
\nu_t
=====

\text{data-sampler state},
\qquad
\zeta_t
=======

\text{random-number-generator state}.
]

[
\mathsf{OptimizerType}
======================

\operatorname{UNDISCLOSED}.
]

[
\mathsf{GradientClip}
=====================

\operatorname{UNDISCLOSED}.
]

[
\mathsf{WeightDecay}
====================

\operatorname{UNDISCLOSED}.
]

[
\mathsf{OptimizerPrecision}
===========================

\operatorname{UNDISCLOSED}.
]

### (\textbf{DISTRIBUTED BATCH})

[
R
=

\text{number of data-parallel ranks},
]

[
B_{\mu}
=======

\text{microbatch size per rank},
\qquad
G
=

\text{gradient-accumulation count}.
]

[
B_{\mathrm{global}}
===================

R,G,B_{\mu}.
]

[
R,\ B_{\mu},\ G
===============

\operatorname{UNDISCLOSED}.
]

[
\mathcal B_{t,r,g}
==================

\mathsf{Collate}
\left(
{s_i}*{i=1}^{B*{\mu}}
\right),
\qquad
r\in{1,\ldots,R},
\qquad
g\in{1,\ldots,G}.
]

[
\mathsf{PaddingPolicy}
======================

\operatorname{UNDISCLOSED},
]

[
\mathsf{PackingPolicy}
======================

\operatorname{UNDISCLOSED},
]

[
\mathsf{DocumentBoundaryPolicy}
===============================

\operatorname{UNDISCLOSED}.
]

### (\textbf{BACKWARD})

[
g_{t,r,g}
=========

\nabla_{\theta_t}
\mathcal L_{t,r,g}.
]

[
\bar g_t
========

\mathsf{ReduceGrad}
\left(
\left{
g_{t,r,g}
\right}_{r=1,g=1}^{R,G}
\right).
]

[
\mathsf{ReduceGradTopology}
===========================

\operatorname{UNDISCLOSED}.
]

### (\textbf{UPDATE})

[
\left(
\theta_{t+1},
\omega_{t+1}
\right)
=======

\mathsf{OPT}
\left(
\theta_t,
\omega_t,
\bar g_t,
\eta_t
\right).
]

---

# (\textsc{Algorithm 1: Qwen Pretraining Loop})

## (\textbf{STAGE STATE})

[
s
\in
{\mathrm{S1},\mathrm{S2},\mathrm{S3}}.
]

[
L_s
===

\begin{cases}
4096,
&
s=\mathrm{S1},
[2mm]
4096,
&
s=\mathrm{S2},
[2mm]
32768,
&
s=\mathrm{S3}.
\end{cases}
]

[
\mathcal D_s
============

\begin{cases}
\mathcal D_{\mathrm{general,119-lang}},
&
s=\mathrm{S1},
[1mm]
\mathcal D_{\mathrm{STEM+code+reasoning+synthetic}},
&
s=\mathrm{S2},
[1mm]
\mathcal D_{\mathrm{long}},
&
s=\mathrm{S3}.
\end{cases}
]

[
N_s
===

\begin{cases}

> 30\times10^{12}\ \text{tokens},
> &
> s=\mathrm{S1},
> [1mm]
> \approx5\times10^{12}\ \text{tokens},
> &
> s=\mathrm{S2},
> [1mm]
> \text{hundreds of billions of tokens},
> &
> s=\mathrm{S3}.
> \end{cases}
> ]

[
\Pr_{\mathcal D_{\mathrm{S3}}}
\left(
16384\le |x|\le32768
\right)
=======

0.75,
]

[
\Pr_{\mathcal D_{\mathrm{S3}}}
\left(
4096\le |x|<16384
\right)
=======

0.25.
]

---

## (\textbf{RAW INPUT SCHEMA})

[
d_i
===

\left(
u_i,
\ell_i,
c_i,
q_i,
e_i,
f_i,
\sigma_i
\right).
]

[
u_i
===

\text{raw textual instance},
]

[
\ell_i
\in
\mathcal L_{\mathrm{119}},
\qquad
c_i
===

\text{domain label},
]

[
q_i
===

\text{quality/educational-value annotation},
]

[
e_i
===

\text{safety annotation},
]

[
f_i
===

\text{field/task annotation},
]

[
\sigma_i
\in
{
\text{natural},
\text{PDF-extracted},
\text{synthetic},
\text{multilingual}
}.
]

[
d_i
\sim
\mathcal D_s.
]

---

## (\textbf{TOKENIZATION})

[
x_i
===

# \mathsf T(u_i)

(x_{i,1},\ldots,x_{i,n_i}),
\qquad
x_{i,j}\in\mathcal V.
]

[
\tilde x_i
==========

\mathsf{SequenceTransform}_{s}
(x_i;L_s).
]

[
\mathsf{SequenceTransform}_{s}
\in
{
\text{truncate},
\text{pad},
\text{pack},
\text{split}
}
=

\operatorname{UNDISCLOSED}.
]

---

## (\textbf{MICROBATCH CONSTRUCTION})

[
\left{
\tilde x_i
\right}*{i=1}^{B*{\mu}}
\xrightarrow{\mathsf{Collate}^{\mathrm{pre}}_s}
\left(
X,
Y,
A,
P,
M
\right).
]

[
X
\in
\mathbb N^{B_{\mu}\times(L_s-1)},
]

[
Y
\in
\mathbb N^{B_{\mu}\times(L_s-1)},
]

[
X_{b,t}
=======

\tilde x_{b,t},
\qquad
Y_{b,t}
=======

\tilde x_{b,t+1}.
]

[
A,M
\in
{0,1}^{B_{\mu}\times(L_s-1)}.
]

[
M_{b,t}
=======

\begin{cases}
1,
&
Y_{b,t}\text{ contributes to prediction loss},
\
0,
&
Y_{b,t}\text{ is padding/ignored/boundary}.
\end{cases}
]

[
\mathsf{ExactConstruction}(A,P,M)
=================================

\operatorname{UNDISCLOSED}.
]

---

## (\textbf{FORWARD})

[
Z_{t,r,g}
=========

\mathsf M_{\theta_t}
\left(
X_{t,r,g},
A_{t,r,g},
P_{t,r,g}
\right).
]

[
\Pi_{t,r,g}
===========

\operatorname{Softmax}
\left(
Z_{t,r,g}
\right).
]

---

## (\textbf{NEXT-TOKEN OBJECTIVE})

[
\widehat{\mathcal L}_{\mathrm{NTP}}
===================================

*

\frac{
\displaystyle
\sum_{b=1}^{B_{\mu}}
\sum_{\tau=1}^{L_s-1}
M_{b,\tau}
\log
\Pi_{\theta,b,\tau,Y_{b,\tau}}
}{
\displaystyle
Z_{\mathrm{pre}}
}.
]

[
Z_{\mathrm{pre}}
\in
\left{
\sum_{b,\tau}M_{b,\tau},
\ B_{\mu},
\ B_{\mu}L_s,
\ \text{other}
\right}.
]

[
Z_{\mathrm{pre}}
================

\operatorname{UNDISCLOSED}.
]

[
\mathcal L_{\mathrm{NTP}}^{\mathrm{Qwen}}
=========================================

\operatorname{UNDISCLOSED}
\quad
\text{at exact mask/normalization precision}.
]

---

## (\textbf{MoE GLOBAL-BATCH BALANCE})

[
\iota_{\mathrm{MoE}}
====================

\begin{cases}
1,&\mathsf M\text{ is Qwen MoE},\
0,&\mathsf M\text{ is Qwen dense}.
\end{cases}
]

[
\mathcal L_{\mathrm{GBLB}}
==========================

\mathsf{GlobalBatchLoadBalance}
\left(
\text{router statistics across }
R,G,B_{\mu}L_s
\text{ token positions}
\right).
]

[
\mathsf{Equation}
\left(
\mathcal L_{\mathrm{GBLB}}
\right)
=======

\operatorname{UNDISCLOSED}.
]

[
\lambda_{\mathrm{GBLB}}
=======================

\operatorname{UNDISCLOSED}.
]

[
\boxed{
\mathcal L_{t,r,g}^{\mathrm{pre}}
=================================

\widehat{\mathcal L}*{\mathrm{NTP}}
+
\iota*{\mathrm{MoE}}
\lambda_{\mathrm{GBLB}}
\mathcal L_{\mathrm{GBLB}}
}
\qquad
[\mathrm{DERIVED}].
]

---

## (\textbf{ACCUMULATION})

[
g_{t,r,g}^{\mathrm{pre}}
========================

\nabla_{\theta_t}
\mathcal L_{t,r,g}^{\mathrm{pre}}.
]

[
g_{t,r}^{\mathrm{acc}}
======================

\sum_{g=1}^{G}
w_{t,r,g}
g_{t,r,g}^{\mathrm{pre}}.
]

[
w_{t,r,g}
=========

\operatorname{UNDISCLOSED}.
]

[
\bar g_t^{\mathrm{pre}}
=======================

\mathsf{ReduceGrad}
\left(
{
g_{t,r}^{\mathrm{acc}}
}_{r=1}^{R}
\right).
]

---

## (\textbf{UPDATE})

[
\left(
\theta_{t+1},
\omega_{t+1}
\right)
=======

\mathsf{OPT}*{s}
\left(
\theta_t,
\omega_t,
\bar g_t^{\mathrm{pre}},
\eta*{s,t}
\right).
]

[
\eta_{\mathrm{S2},t}
\Rightarrow
\text{accelerated decay}.
]

[
\eta_{s,t},
\quad
B_{\mathrm{global},s},
\quad
G_s
===

\operatorname{UNDISCLOSED}.
]

---

## (\textbf{STAGE TRANSITION})

[
\theta_0
\xrightarrow[
L=4096,\ \mathcal D_{\mathrm{S1}}
]{
\mathcal L_{\mathrm{pre}}^{\mathrm{S1}}
}
\theta_{\mathrm{S1}},
]

[
\theta_{\mathrm{S1}}
\xrightarrow[
L=4096,\ \mathcal D_{\mathrm{S2}}
]{
\mathcal L_{\mathrm{pre}}^{\mathrm{S2}}
}
\theta_{\mathrm{S2}},
]

[
\theta_{\mathrm{S2}}
\xrightarrow[
L=32768,\ \mathcal D_{\mathrm{S3}}
]{
\mathcal L_{\mathrm{pre}}^{\mathrm{S3}}
}
\theta_{\mathrm{base}}.
]

---

# (\textsc{Algorithm 2: Qwen SFT Loop})

[
u
\in
{
\mathrm{ColdCoT},
\mathrm{Fusion}
}.
]

[
\theta_{\mathrm{init}}^{(u)}
============================

\begin{cases}
\theta_{\mathrm{base}},
&
u=\mathrm{ColdCoT},
\
\theta_{\mathrm{ReasoningRL}},
&
u=\mathrm{Fusion}.
\end{cases}
]

---

## (\textbf{A. COLD-CoT DATA SCHEMA})

[
r_i^{\mathrm{cold}}
===================

\left(
q_i,
a_i^{\mathrm{ref}},
v_i,
d_i,
{y_{i,n}^{T}}_{n=1}^{N}
\right).
]

[
q_i
===

\text{math/code/logic/STEM query},
]

[
a_i^{\mathrm{ref}}
==================

\text{verified reference answer},
]

[
v_i
===

\text{answer verifier or code test cases},
]

[
d_i
===

\text{domain annotation}.
]

[
y_{i,n}^{T}
\sim
\pi_{\mathrm{QwQ\text{-}32B}}
(\cdot|q_i).
]

[
\mathcal F_q(q_i)
=================

\mathbf 1
\left[
\begin{array}{l}
q_i\text{ is verifiable},\
q_i\text{ requires nontrivial reasoning},\
q_i\text{ is retained after domain balancing}
\end{array}
\right].
]

[
\mathcal F_y(y_{i,n}^{T})
=========================

\mathbf 1
\left[
\begin{array}{l}
v_i(y_{i,n}^{T})=1,\
\operatorname{Repetition}(y_{i,n}^{T})=0,\
\operatorname{Guessing}(y_{i,n}^{T})=0,\
\operatorname{ThinkAnswerConflict}(y_{i,n}^{T})=0,\
\operatorname{LanguageShift}(y_{i,n}^{T})=0,\
\operatorname{ValidationSimilarity}(y_{i,n}^{T})=0
\end{array}
\right].
]

[
\mathcal D_{\mathrm{cold}}
==========================

\operatorname{Subset}
\left{
(q_i,y_{i,n}^{T})
:
\mathcal F_q(q_i)\mathcal F_y(y_{i,n}^{T})=1
\right}.
]

[
|\mathcal D_{\mathrm{cold}}|
============================

\text{deliberately small},
\qquad
T_{\mathrm{cold}}
=================

\text{deliberately small}.
]

---

## (\textbf{B. FUSION DATA SCHEMA})

[
r_i^{\mathrm{fusion}}
=====================

\left(
q_i,
m_i,
c_i,
a_i,
h_i
\right).
]

[
m_i
\in
{
\mathrm{think},
\mathrm{no_think}
}.
]

[
r_i^{\mathrm{think}}
:
\quad
y_i
\sim
\pi_{\theta_{\mathrm{ReasoningRL}}}
(\cdot|q_i),
]

[
v_i(y_i)=1
\quad
\Longrightarrow
\quad
(q_i,y_i)
\in
\mathcal D_{\mathrm{think}}.
]

[
r_i^{\mathrm{no_think}}
\sim
\mathcal D_{\mathrm{code}}
\cup
\mathcal D_{\mathrm{math}}
\cup
\mathcal D_{\mathrm{instruction}}
\cup
\mathcal D_{\mathrm{multilingual}}
\cup
\mathcal D_{\mathrm{creative}}
\cup
\mathcal D_{\mathrm{QA}}
\cup
\mathcal D_{\mathrm{roleplay}}.
]

[
\mathcal D_{\mathrm{fusion}}
============================

\mathcal D_{\mathrm{think}}
\cup
\mathcal D_{\mathrm{no_think}}.
]

---

## (\textbf{SERIALIZATION})

[
\chi_{\mathrm{think}}
(q,c,a)
=======

\left[
\begin{array}{c}
\langle\mathrm{user}\rangle,
q,
\sigma_{\mathrm{think}},
\langle/\mathrm{user}\rangle,
\
\langle\mathrm{assistant}\rangle,
\langle\mathrm{think}\rangle,
c,
\langle/\mathrm{think}\rangle,
a,
\langle/\mathrm{assistant}\rangle
\end{array}
\right].
]

[
\chi_{\mathrm{no_think}}
(q,a)
=====

\left[
\begin{array}{c}
\langle\mathrm{user}\rangle,
q,
\sigma_{\mathrm{no_think}},
\langle/\mathrm{user}\rangle,
\
\langle\mathrm{assistant}\rangle,
\langle\mathrm{think}\rangle,
\langle/\mathrm{think}\rangle,
a,
\langle/\mathrm{assistant}\rangle
\end{array}
\right].
]

[
\sigma_{\mathrm{think}}
=======================

\texttt{/think},
\qquad
\sigma_{\mathrm{no_think}}
==========================

\texttt{/no_think}.
]

[
\chi_i
======

\begin{cases}
\chi_{\mathrm{think}}(q_i,c_i,a_i),
&
m_i=\mathrm{think},
\
\chi_{\mathrm{no_think}}(q_i,a_i),
&
m_i=\mathrm{no_think}.
\end{cases}
]

[
x_i
===

\mathsf T(\chi_i).
]

---

## (\textbf{SFT LOSS-MASK SCHEMA})

[
\Gamma_i
\in
{0,1}^{|x_i|-1}.
]

[
\Gamma_{i,t}
============

\mathsf{SFTMask}
\left(
x_i,t
\right).
]

[
\mathsf{SFTMask}
\in
\left{
\begin{array}{l}
\text{all-token},\
\text{assistant-only},\
\text{reasoning+answer},\
\text{answer-only},\
\text{weighted segment mask}
\end{array}
\right}
=======

\operatorname{UNDISCLOSED}.
]

[
\mathsf{ToolTokenWeight}
========================

\operatorname{UNDISCLOSED},
]

[
\mathsf{ReasoningTokenWeight}
=============================

\operatorname{UNDISCLOSED},
]

[
\mathsf{EOSTokenWeight}
=======================

\operatorname{UNDISCLOSED}.
]

---

## (\textbf{BATCH})

[
\mathcal B_{t,r,g}^{\mathrm{SFT}}
=================================

\mathsf{Collate}^{\mathrm{SFT}}
\left(
{
(x_i,\Gamma_i)
}*{i=1}^{B*{\mu}}
\right).
]

[
\mathcal B_{t,r,g}^{\mathrm{SFT}}
=================================

\left(
X,
Y,
A,
P,
\Gamma
\right).
]

[
X_{b,\tau}
==========

x_{b,\tau},
\qquad
Y_{b,\tau}
==========

x_{b,\tau+1}.
]

---

## (\textbf{FORWARD})

[
Z_{t,r,g}
=========

\mathsf M_{\theta_t}
(X,A,P).
]

[
\Pi_{t,r,g}
===========

\operatorname{Softmax}
(Z_{t,r,g}).
]

---

## (\textbf{LOSS})

[
\widehat{\mathcal L}_{\mathrm{SFT}}
===================================

*

\frac{
\displaystyle
\sum_{b=1}^{B_{\mu}}
\sum_{\tau=1}^{L_b-1}
\Gamma_{b,\tau}
w_{b,\tau}
\log
\Pi_{\theta,b,\tau,Y_{b,\tau}}
}{
Z_{\mathrm{SFT}}
}.
]

[
w_{b,\tau}
==========

\operatorname{UNDISCLOSED}.
]

[
Z_{\mathrm{SFT}}
================

\operatorname{UNDISCLOSED}.
]

[
\boxed{
\mathcal L_{\mathrm{SFT}}^{\mathrm{Qwen}}
=========================================

\operatorname{UNDISCLOSED}
\quad
\text{at exact mask/weight/normalization precision}
}.
]

---

## (\textbf{BACKWARD})

[
g_{t,r,g}^{\mathrm{SFT}}
========================

\nabla_{\theta_t}
\widehat{\mathcal L}_{\mathrm{SFT}}.
]

[
\bar g_t^{\mathrm{SFT}}
=======================

\mathsf{ReduceGrad}
\left(
\left{
\sum_{g=1}^{G}
g_{t,r,g}^{\mathrm{SFT}}
\right}_{r=1}^{R}
\right).
]

---

## (\textbf{UPDATE})

[
(\theta_{t+1},\omega_{t+1})
===========================

\mathsf{OPT}_{\mathrm{SFT}}
\left(
\theta_t,
\omega_t,
\bar g_t^{\mathrm{SFT}},
\eta_t^{\mathrm{SFT}}
\right).
]

[
\eta_t^{\mathrm{SFT}},
\quad
B_{\mathrm{global}}^{\mathrm{SFT}},
\quad
G_{\mathrm{SFT}},
\quad
T_{\mathrm{fusion}}
===================

\operatorname{UNDISCLOSED}.
]

---

## (\textbf{OUTPUT})

[
\theta_{\mathrm{base}}
\xrightarrow[
\mathcal D_{\mathrm{cold}}
]{
\mathcal L_{\mathrm{SFT}}^{\mathrm{cold}}
}
\theta_{\mathrm{cold}}.
]

[
\theta_{\mathrm{ReasoningRL}}
\xrightarrow[
\mathcal D_{\mathrm{fusion}}
]{
\mathcal L_{\mathrm{SFT}}^{\mathrm{fusion}}
}
\theta_{\mathrm{fusion}}.
]

---

# (\textsc{Algorithm 3: Qwen RL Loop})

[
h
\in
{
\mathrm{ReasoningRL},
\mathrm{GeneralRL}
}.
]

---

## (\textbf{A. REASONING-RL INPUT SCHEMA})

[
e_i^{\mathrm{reason}}
=====================

\left(
q_i,
v_i,
a_i^{\mathrm{ref}},
d_i
\right).
]

[
\left|
\mathcal D_{\mathrm{ReasoningRL}}
\right|
=======

3995.

]

[
e_i^{\mathrm{reason}}
\in
\mathcal D_{\mathrm{ReasoningRL}}
\Longleftrightarrow
\begin{cases}
e_i\notin\mathcal D_{\mathrm{cold}},\
e_i\text{ is learnable by }\theta_{\mathrm{cold}},\
e_i\text{ is maximally challenging under filtering},\
e_i\text{ contributes to subdomain coverage}.
\end{cases}
]

---

## (\textbf{B. GENERAL-RL INPUT SCHEMA})

[
e_i^{\mathrm{general}}
======================

\left(
q_i,
c_i,
a_i^{\mathrm{ref}},
v_i,
\mathcal E_i,
\mathcal T_i
\right).
]

[
c_i
\in
\left{
\begin{array}{l}
\mathrm{instruction},\
\mathrm{format},\
\mathrm{preference},\
\mathrm{agent},\
\mathrm{RAG},\
\mathrm{specialized}
\end{array}
\right}.
]

[
\mathcal T_i
============

\text{tool/interface specification},
]

[
\mathcal E_i
============

\text{executable environment}.
]

[
\left|
\mathcal C_{\mathrm{general}}
\right|

>

20.

]

---

## (\textbf{PROMPT BATCH})

[
\mathcal Q_t
============

\left{
e_i
\right}_{i=1}^{B_q}.
]

[
B_q
===

\text{large},
\qquad
B_q^{\mathrm{exact}}
====================

\operatorname{UNDISCLOSED}.
]

[
K
=

\text{rollouts per query},
\qquad
K
=

\text{high},
\qquad
K^{\mathrm{exact}}
==================

\operatorname{UNDISCLOSED}.
]

---

## (\textbf{BEHAVIOR POLICY})

[
\pi_{\beta_t}
=============

\pi_{\theta_{\beta(t)}},
\qquad
\beta(t)\le t.
]

[
\beta(t)=t
\Longrightarrow
\text{on-policy rollout},
]

[
\beta(t)<t
\Longrightarrow
\text{off-policy rollout}.
]

[
\Pr[\beta(t)<t]>0.
]

---

## (\textbf{ROLLOUT})

[
\tau_{i,k}
\sim
\operatorname{Rollout}
\left(
\pi_{\beta_t},
e_i,
\mathcal E_i,
\mathcal T_i
\right).
]

### (\textbf{SINGLE-TURN TRAJECTORY})

[
\tau_{i,k}^{\mathrm{single}}
============================

\left(
q_i,
y_{i,k,1:T_{i,k}},
\ell_{i,k,1:T_{i,k}}^{\beta},
m_{i,k,1:T_{i,k}}^{\pi}
\right).
]

[
\ell_{i,k,\tau}^{\beta}
=======================

\log
\pi_{\beta_t}
\left(
y_{i,k,\tau}
\mid
q_i,
y_{i,k,<\tau}
\right).
]

### (\textbf{AGENT TRAJECTORY})

[
\tau_{i,k}^{\mathrm{agent}}
===========================

\left(
q_i,
\left{
y_{i,k}^{(j)},
a_{i,k}^{(j)},
o_{i,k}^{(j)}
\right}*{j=1}^{J*{i,k}},
\ell_{i,k}^{\beta},
m_{i,k}^{\pi}
\right).
]

[
a_{i,k}^{(j)}
=============

\text{tool call},
]

[
o_{i,k}^{(j)}
=============

\mathcal E_i
\left(
a_{i,k}^{(j)}
\right).
]

[
s_{i,k,\tau}
============

\left(
q_i,
y_{i,k,<\tau},
a_{i,k,<\tau},
o_{i,k,<\tau}
\right).
]

---

## (\textbf{REWARD})

### (\textbf{REASONING})

[
r_{i,k}^{\mathrm{reason}}
=========================

v_i
\left(
q_i,
y_{i,k},
a_i^{\mathrm{ref}}
\right).
]

### (\textbf{GENERAL})

[
c_i^{r}
\in
{
\mathrm{rule},
\mathrm{judge\text{-}reference},
\mathrm{reward\ model},
\mathrm{environment}
}.
]

[
r_{i,k}^{\mathrm{general}}
==========================

\begin{cases}
r_{\mathrm{rule}}
(q_i,\tau_{i,k}),
&
c_i^{r}=\mathrm{rule},
[1mm]
r_{\mathrm{judge}}
(q_i,\tau_{i,k},a_i^{\mathrm{ref}}),
&
c_i^{r}=\mathrm{judge\text{-}reference},
[1mm]
r_{\psi}
(q_i,\tau_{i,k}),
&
c_i^{r}=\mathrm{reward\ model},
[1mm]
r_{\mathcal E_i}
(\tau_{i,k}),
&
c_i^{r}=\mathrm{environment}.
\end{cases}
]

[
\psi
====

\text{frozen reward-model parameters during policy update}.
]

[
\mathsf{RewardCombinationRule}
==============================

\operatorname{UNDISCLOSED}.
]

---

## (\textbf{ROLLOUT BATCH})

[
\mathcal R_t
============

\left{
\left(
q_i,
{\tau_{i,k},r_{i,k}}*{k=1}^{K}
\right)
\right}*{i=1}^{B_q}.
]

[
\mathsf{TrajectoryCollate}
(\mathcal R_t)
==============

\left(
X^{\pi},
Y^{\pi},
A^{\pi},
P^{\pi},
M^{\pi},
L^{\beta},
R,
G_{\mathrm{prompt}}
\right).
]

[
G_{\mathrm{prompt}}(i)
======================

{
(i,1),\ldots,(i,K)
}.
]

[
M_{i,k,\tau}^{\pi}
==================

\begin{cases}
1,
&
y_{i,k,\tau}\text{ is policy-generated},
\
0,
&
\text{prompt/tool-observation/padding position}.
\end{cases}
]

[
\mathsf{ExactRLMask}
====================

\operatorname{UNDISCLOSED}.
]

---

## (\textbf{LEARNER FORWARD})

[
Z_{i,k,\tau}^{\theta}
=====================

\mathsf M_{\theta_t}
\left(
X_{i,k}^{\pi},
A_{i,k}^{\pi},
P_{i,k}^{\pi}
\right).
]

[
\ell_{i,k,\tau}^{\theta}
========================

\log
\pi_{\theta_t}
\left(
Y_{i,k,\tau}^{\pi}
\mid
s_{i,k,\tau}
\right).
]

[
\rho_{i,k,\tau}
===============

\exp
\left(
\ell_{i,k,\tau}^{\theta}
------------------------

\ell_{i,k,\tau}^{\beta}
\right).
]

---

## (\textbf{GRPO STATE})

[
A_{i,k}
=======

\mathsf{Advantage}^{\mathrm{Qwen}}
\left(
{r_{i,j}}_{j=1}^{K}
\right).
]

[
\mathsf{Advantage}^{\mathrm{Qwen}}
==================================

\operatorname{UNDISCLOSED}.
]

[
\mathsf{RatioTransform}^{\mathrm{Qwen}}
(\rho)
======

\operatorname{UNDISCLOSED}.
]

[
\mathsf{ClipBounds}^{\mathrm{Qwen}}
===================================

\operatorname{UNDISCLOSED}.
]

[
\mathsf{ReferencePolicy}
========================

\operatorname{UNDISCLOSED}.
]

[
\mathsf{KLDirection}
====================

\operatorname{UNDISCLOSED}.
]

[
\mathsf{EntropyController}
==========================

\operatorname{UNDISCLOSED}.
]

[
\mathsf{OffPolicyCorrection}
============================

\operatorname{UNDISCLOSED}.
]

---

## (\textbf{POLICY OBJECTIVE})

[
\boxed{
\widehat{\mathcal J}_{\mathrm{GRPO}}^{\mathrm{Qwen}}
====================================================

\mathsf{GRPO}*{\mathrm{Qwen}}
\left(
\left{
\rho*{i,k,\tau},
A_{i,k},
M_{i,k,\tau}^{\pi},
r_{i,k}
\right}
\right)
}
]

[
\boxed{
\mathsf{ExactEquation}
\left(
\widehat{\mathcal J}_{\mathrm{GRPO}}^{\mathrm{Qwen}}
\right)
=======

\operatorname{UNDISCLOSED}
}
]

[
\mathcal L_{\mathrm{RL}}
========================

*

\widehat{\mathcal J}_{\mathrm{GRPO}}^{\mathrm{Qwen}}
]

[
\text{or}
]

[
\mathcal L_{\mathrm{RL}}
========================

\widehat{\mathcal L}_{\mathrm{GRPO}}^{\mathrm{Qwen}}
]

[
\Longrightarrow
\quad
\mathsf{PublishedSignConvention}
================================

\operatorname{UNDISCLOSED}.
]

---

## (\textbf{BACKWARD})

[
g_{t,r,g}^{\mathrm{RL}}
=======================

\nabla_{\theta_t}
\mathcal L_{t,r,g}^{\mathrm{RL}}.
]

[
\bar g_t^{\mathrm{RL}}
======================

\mathsf{ReduceGrad}
\left(
\left{
\sum_{g=1}^{G}
g_{t,r,g}^{\mathrm{RL}}
\right}_{r=1}^{R}
\right).
]

---

## (\textbf{UPDATE})

[
(\theta_{t+1},\omega_{t+1})
===========================

\mathsf{OPT}_{\mathrm{RL}}
\left(
\theta_t,
\omega_t,
\bar g_t^{\mathrm{RL}},
\eta_t^{\mathrm{RL}}
\right).
]

[
\pi_{\beta_{t+1}}
\leftarrow
\mathsf{RefreshBehaviorPolicy}
(\theta_{t+1}).
]

[
\mathsf{RefreshFrequency}
=========================

\operatorname{UNDISCLOSED}.
]

[
\mathsf{TrajectoryReuseCount}
=============================

\operatorname{UNDISCLOSED}.
]

[
\mathsf{ReplayBufferCapacity}
=============================

\operatorname{UNDISCLOSED}.
]

---

## (\textbf{OUTPUT})

[
\theta_{\mathrm{cold}}
\xrightarrow[
\mathcal D_{\mathrm{ReasoningRL}},
;r_{\mathrm{verifier}}
]{
\mathsf{GRPO}*{\mathrm{Qwen}}
}
\theta*{\mathrm{ReasoningRL}}.
]

[
\theta_{\mathrm{fusion}}
\xrightarrow[
\mathcal D_{\mathrm{GeneralRL}},
;r_{\mathrm{rule/judge/RM/env}}
]{
\mathsf{RL}*{\mathrm{general}}
}
\theta*{\mathrm{flagship}}.
]

[
\mathsf{ExactGeneralRLAlgorithm}
================================

\operatorname{UNDISCLOSED}.
]

---

# (\textsc{Algorithm 4: Qwen Strong-to-Weak Distillation Loop})

[
\theta_T
========

\text{frozen teacher parameters},
]

[
\theta_S
========

\text{trainable lightweight-student parameters}.
]

[
\operatorname{sg}
(\theta_T)
==========

\theta_T.
]

[
\theta_T
\in
{
\theta_{\mathrm{Qwen3\text{-}32B}},
\theta_{\mathrm{Qwen3\text{-}235B\text{-}A22B}}
}
]

[
\text{for the disclosed on-policy phase}.
]

---

## (\textsc{Algorithm 4A: Off-Policy Response Distillation})

### (\textbf{INPUT SCHEMA})

[
d_i^{\mathrm{off}}
==================

\left(
q_i,
m_i,
y_i^{T}
\right).
]

[
m_i
\in
{
\mathrm{think},
\mathrm{no_think}
}.
]

[
y_i^{T}
\sim
\pi_T
\left(
\cdot
\mid
q_i,m_i
\right).
]

[
\mathcal D_{\mathrm{off}}
=========================

\left{
(q_i,m_i,y_i^{T})
\right}.
]

[
\mathsf{OffPolicyTeacherIdentity}
=================================

\operatorname{UNDISCLOSED}.
]

---

### (\textbf{SERIALIZATION})

[
\chi_i^{T}
==========

\chi_{m_i}
(q_i,y_i^{T}).
]

[
x_i^{T}
=======

\mathsf T
\left(
\chi_i^{T}
\right).
]

[
\Gamma_i^{\mathrm{off}}
=======================

\mathsf{ResponseDistillationMask}
(x_i^{T}).
]

[
\mathsf{ResponseDistillationMask}
=================================

\operatorname{UNDISCLOSED}.
]

---

### (\textbf{BATCH})

[
\mathcal B_{t,r,g}^{\mathrm{off}}
=================================

\mathsf{Collate}^{\mathrm{off}}
\left(
{
x_i^{T},
\Gamma_i^{\mathrm{off}}
}*{i=1}^{B*{\mu}}
\right).
]

[
\mathcal B_{t,r,g}^{\mathrm{off}}
=================================

\left(
X^{T},
Y^{T},
A^{T},
P^{T},
\Gamma^{T}
\right).
]

---

### (\textbf{STUDENT FORWARD})

[
Z^{S}
=====

\mathsf M_{\theta_S}
\left(
X^{T},
A^{T},
P^{T}
\right).
]

[
\Pi^{S}
=======

\operatorname{Softmax}
(Z^{S}).
]

---

### (\textbf{OFF-POLICY LOSS})

[
\widehat{\mathcal L}_{\mathrm{off}}
===================================

*

\frac{
\displaystyle
\sum_{b,\tau}
\Gamma_{b,\tau}^{T}
\log
\Pi_{b,\tau,Y_{b,\tau}^{T}}^{S}
}{
Z_{\mathrm{off}}
}.
]

[
Z_{\mathrm{off}}
================

\operatorname{UNDISCLOSED}.
]

[
\boxed{
\widehat{\mathcal L}_{\mathrm{off}}
\propto
-------

\mathbb E_{
q,m,;
y^{T}\sim\pi_T
}
\log
\pi_S
(y^{T}|q,m)
}
\qquad
[\mathrm{DERIVED}].
]

[
\mathsf{ExactOffPolicyObjective}
================================

\operatorname{UNDISCLOSED}.
]

---

### (\textbf{UPDATE})

[
g_t^{\mathrm{off}}
==================

\nabla_{\theta_S}
\widehat{\mathcal L}_{\mathrm{off}}.
]

[
\nabla_{\theta_T}
\widehat{\mathcal L}_{\mathrm{off}}
===================================

0.

]

[
(\theta_{S,t+1},\omega_{S,t+1})
===============================

\mathsf{OPT}*{\mathrm{off}}
\left(
\theta*{S,t},
\omega_{S,t},
g_t^{\mathrm{off}},
\eta_t^{\mathrm{off}}
\right).
]

---

## (\textsc{Algorithm 4B: On-Policy Logit Distillation})

### (\textbf{PROMPT SCHEMA})

[
d_i^{\mathrm{on}}
=================

\left(
q_i,
m_i
\right).
]

[
q_i
\sim
\mathcal D_{\mathrm{prompt}}^{\mathrm{distill}},
]

[
m_i
\sim
{
\mathrm{think},
\mathrm{no_think}
}.
]

[
\mathsf{PromptDistribution}
===========================

\operatorname{UNDISCLOSED}.
]

---

### (\textbf{STUDENT ON-POLICY GENERATION})

[
y_i^{S}
\sim
\pi_{\theta_S}
\left(
\cdot
\mid
q_i,m_i
\right).
]

[
\tau_i^{S}
==========

\left(
q_i,m_i,y_{i,1:T_i}^{S}
\right).
]

[
\mathcal R_t^{S}
================

\left{
\tau_i^{S}
\right}_{i=1}^{B_q}.
]

---

### (\textbf{ON-POLICY BATCH})

[
\mathsf{Collate}^{\mathrm{on}}
\left(
\mathcal R_t^{S}
\right)
=======

\left(
X^{S},
Y^{S},
A^{S},
P^{S},
M^{S}
\right).
]

[
X_{i,\tau}^{S}
==============

\left[
q_i,
m_i,
y_{i,<\tau}^{S}
\right].
]

[
Y_{i,\tau}^{S}
==============

y_{i,\tau}^{S}.
]

[
M_{i,\tau}^{S}
==============

\mathbf 1
\left[
Y_{i,\tau}^{S}
\text{ is student-generated}
\right].
]

[
\mathsf{ExactOnPolicyMask}
==========================

\operatorname{UNDISCLOSED}.
]

---

### (\textbf{STUDENT LOGITS})

[
Z_{i,\tau}^{S}
==============

\mathsf M_{\theta_S}
\left(
X_{i}^{S},
A_i^{S},
P_i^{S}
\right).
]

[
p_{i,\tau}^{S}(v)
=================

\operatorname{Softmax}
\left(
Z_{i,\tau}^{S}/T_D
\right)_v.
]

---

### (\textbf{TEACHER LOGITS})

[
Z_{i,\tau}^{T}
==============

\mathsf M_{\operatorname{sg}(\theta_T)}
\left(
X_i^{S},
A_i^{S},
P_i^{S}
\right).
]

[
p_{i,\tau}^{T}(v)
=================

\operatorname{Softmax}
\left(
Z_{i,\tau}^{T}/T_D
\right)_v.
]

[
\nabla_{\theta_T}
Z_{i,\tau}^{T}
==============

0.

]

[
T_D
===

\operatorname{UNDISCLOSED}.
]

---

### (\textbf{KL-DIRECTION STATE})

[
\delta_{\mathrm{KL}}
\in
\left{
T\Vert S,
S\Vert T
\right}.
]

[
\delta_{\mathrm{KL}}
====================

\operatorname{UNDISCLOSED}.
]

[
\mathcal V_D
\subseteq
\mathcal V.
]

[
\mathcal V_D
\in
\left{
\mathcal V,
\text{top-}k,
\text{sampled support},
\text{other}
\right}
=======

\operatorname{UNDISCLOSED}.
]

---

### (\textbf{ON-POLICY KL LOSS})

[
D_{T\Vert S}^{i,\tau}
=====================

\sum_{v\in\mathcal V_D}
p_{i,\tau}^{T}(v)
\log
\frac{
p_{i,\tau}^{T}(v)
}{
p_{i,\tau}^{S}(v)
}.
]

[
D_{S\Vert T}^{i,\tau}
=====================

\sum_{v\in\mathcal V_D}
p_{i,\tau}^{S}(v)
\log
\frac{
p_{i,\tau}^{S}(v)
}{
p_{i,\tau}^{T}(v)
}.
]

[
D_{\delta_{\mathrm{KL}}}^{i,\tau}
=================================

\begin{cases}
D_{T\Vert S}^{i,\tau},
&
\delta_{\mathrm{KL}}=T\Vert S,
\
D_{S\Vert T}^{i,\tau},
&
\delta_{\mathrm{KL}}=S\Vert T.
\end{cases}
]

[
\boxed{
\widehat{\mathcal L}_{\mathrm{on}}
==================================

\frac{
\displaystyle
\sum_{i=1}^{B_q}
\sum_{\tau=1}^{T_i}
M_{i,\tau}^{S}
D_{\delta_{\mathrm{KL}}}^{i,\tau}
}{
Z_{\mathrm{on}}
}
}
]

[
Z_{\mathrm{on}}
===============

\operatorname{UNDISCLOSED}.
]

[
\boxed{
y^{S}\sim\pi_S,
\qquad
\min_{\theta_S}
D_{\mathrm{KL}}
\left(
\pi_T,
\pi_S
\right)
\text{ with direction undisclosed}
}
]

---

### (\textbf{BACKWARD})

[
g_t^{\mathrm{on}}
=================

\nabla_{\theta_S}
\widehat{\mathcal L}_{\mathrm{on}}.
]

[
\nabla_{\theta_T}
\widehat{\mathcal L}_{\mathrm{on}}
==================================

0.

]

---

### (\textbf{UPDATE})

[
(\theta_{S,t+1},\omega_{S,t+1})
===============================

\mathsf{OPT}*{\mathrm{on}}
\left(
\theta*{S,t},
\omega_{S,t},
g_t^{\mathrm{on}},
\eta_t^{\mathrm{on}}
\right).
]

[
\eta_t^{\mathrm{on}},
\quad
B_q^{\mathrm{on}},
\quad
T_D,
\quad
\delta_{\mathrm{KL}},
\quad
\mathcal V_D
============

\operatorname{UNDISCLOSED}.
]

---

## (\textbf{DISTILLATION OUTPUT})

[
\theta_{\mathrm{small,base}}
\xrightarrow[
y^{T}\sim\pi_T
]{
\mathcal L_{\mathrm{off}}
}
\theta_{\mathrm{small,off}}
]

[
\xrightarrow[
y^{S}\sim\pi_S
]{
\mathcal L_{\mathrm{on}}
}
\theta_{\mathrm{small,final}}.
]

---

# (\textsc{Algorithm 5: Unified Qwen External Training Graph})

## (\textbf{FLAGSHIP PATH})

[
\boxed{
\theta_0
\xrightarrow[
\mathcal D_{\mathrm{S1}},
,L=4096
]{
\mathcal L_{\mathrm{pre}}^{\mathrm{S1}}
}
\theta_{\mathrm{S1}}
\xrightarrow[
\mathcal D_{\mathrm{S2}},
,L=4096
]{
\mathcal L_{\mathrm{pre}}^{\mathrm{S2}}
}
\theta_{\mathrm{S2}}
}
]

[
\boxed{
\theta_{\mathrm{S2}}
\xrightarrow[
\mathcal D_{\mathrm{S3}},
,L=32768
]{
\mathcal L_{\mathrm{pre}}^{\mathrm{S3}}
}
\theta_{\mathrm{base}}
\xrightarrow[
\mathcal D_{\mathrm{cold}}
]{
\mathcal L_{\mathrm{SFT}}^{\mathrm{cold}}
}
\theta_{\mathrm{cold}}
}
]

[
\boxed{
\theta_{\mathrm{cold}}
\xrightarrow[
\mathcal D_{\mathrm{reason}},
,r_{\mathrm{verifier}}
]{
\mathsf{GRPO}*{\mathrm{Qwen}}
}
\theta*{\mathrm{ReasoningRL}}
\xrightarrow[
\mathcal D_{\mathrm{think}}
\cup
\mathcal D_{\mathrm{no_think}}
]{
\mathcal L_{\mathrm{SFT}}^{\mathrm{fusion}}
}
\theta_{\mathrm{fusion}}
}
]

[
\boxed{
\theta_{\mathrm{fusion}}
\xrightarrow[
\mathcal D_{\mathrm{general}},
,
r_{\mathrm{rule/judge/RM/env}}
]{
\mathcal J_{\mathrm{GeneralRL}}
}
\theta_{\mathrm{flagship}}
}
]

---

## (\textbf{LIGHTWEIGHT PATH})

[
\boxed{
\theta_{\mathrm{small,base}}
\xrightarrow[
m\in{\mathrm{think},\mathrm{no_think}},
,
y^T\sim\pi_T
]{
\mathcal L_{\mathrm{off}}
}
\theta_{\mathrm{small,off}}
}
]

[
\boxed{
\theta_{\mathrm{small,off}}
\xrightarrow[
m\in{\mathrm{think},\mathrm{no_think}},
,
y^S\sim\pi_S,
,
\operatorname{sg}(\pi_T)
]{
\mathcal L_{\mathrm{on\text{-}KL}}
}
\theta_{\mathrm{small,final}}
}
]

---

# (\textsc{Algorithm 6: Per-Step State Transition})

[
\boxed{
\begin{array}{rcl}
\mathcal B_t
&\leftarrow&
\mathsf{Batch}
\left(
\mathcal D_t,
\nu_t
\right),
[2mm]
Z_t
&\leftarrow&
\mathsf M_{\theta_t}
\left(
X_t,A_t,P_t
\right),
[2mm]
\mathcal L_t
&\leftarrow&
\mathsf{StageLoss}
\left(
Z_t,
Y_t,
M_t,
R_t,
Z_t^{T}
\right),
[2mm]
g_t
&\leftarrow&
\nabla_{\theta_t}
\mathcal L_t,
[2mm]
\bar g_t
&\leftarrow&
\mathsf{ReduceGrad}
\left(
{g_{t,r,g}}
\right),
[2mm]
(\theta_{t+1},\omega_{t+1})
&\leftarrow&
\mathsf{OPT}
\left(
\theta_t,
\omega_t,
\bar g_t,
\eta_t
\right),
[2mm]
\nu_{t+1}
&\leftarrow&
\mathsf{AdvanceSampler}
(\nu_t),
[2mm]
\mathfrak S_{t+1}
&\leftarrow&
\left(
\theta_{t+1},
\omega_{t+1},
\nu_{t+1},
\zeta_{t+1}
\right).
\end{array}
}
]

[
\mathsf{StageLoss}
==================

\begin{cases}
\mathcal L_{\mathrm{NTP}}
+
\iota_{\mathrm{MoE}}
\lambda_{\mathrm{GBLB}}
\mathcal L_{\mathrm{GBLB}},
&
\mathrm{Pretraining},
[2mm]
\mathcal L_{\mathrm{masked\ token\ CE}},
&
\mathrm{SFT},
[2mm]
-\mathcal J_{\mathrm{GRPO/GeneralRL}},
&
\mathrm{RL},
[2mm]
\mathcal L_{\mathrm{response\ CE}},
&
\mathrm{OffPolicyDistillation},
[2mm]
\mathcal L_{\mathrm{KL}},
&
\mathrm{OnPolicyDistillation}.
\end{cases}
]

[
\boxed{
\begin{array}{c}
\mathsf{ExactOptimizer}
=======================

# \mathsf{ExactPacking}

# \mathsf{ExactSFTMask}

\mathsf{ExactGRPO}
[1mm]
=====

# \mathsf{ExactOffPolicyCorrection}

# \mathsf{ExactKLDivergenceDirection}

\operatorname{UNDISCLOSED}.
\end{array}
}
]

[
\boxed{\textsc{Qwen Pretraining Preprocessing}}
]

[
\texttt{/SCOPE}
]

[
\mathsf Q
\equiv
\mathsf{Qwen3},
\qquad
\mathsf F
\equiv
\left{
\mathsf{Qwen2.5},
\mathsf{Qwen2},
\mathsf{Qwen}
\right}.
]

[
\mathsf E(x)
\in
\left{
\mathsf{R}*{3},
\mathsf{R}*{2.5},
\mathsf{R}*{2},
\mathsf{L}*{1},
\mathsf{D},
\mathsf{U}
\right},
]

[
\begin{aligned}
\mathsf{R}*{k}
&\equiv
\operatorname{REPORTED}*{\mathsf{Qwen}k},
\
\mathsf{L}*{1}
&\equiv
\operatorname{LINEAGE\text{-}ONLY}*{\mathsf{Qwen}},
\
\mathsf{D}
&\equiv
\operatorname{DERIVED},
\
\mathsf{U}
&\equiv
\operatorname{UNDISCLOSED}.
\end{aligned}
]

[
\mathsf{Evidence}
\subseteq
\left{
\mathsf{Paper},
\mathsf{Repository},
\mathsf{Configuration},
\mathsf{ModelCard}
\right}.
]



---

[
\texttt{/FREEZE}
]

[
\Theta_{\mathrm{prep}}
======================

\left{
\theta_{\mathrm{Qwen2.5\text{-}VL}},
\theta_{\mathrm{Qwen2.5}},
\theta_{\mathrm{Qwen2.5\text{-}Math}},
\theta_{\mathrm{Qwen2.5\text{-}Coder}},
\theta_{\mathrm{Qwen2\text{-}Instruct}},
\theta_{\mathrm{RM}}
\right},
]

[
\forall\vartheta\in\Theta_{\mathrm{prep}}:
\qquad
\nabla_{\vartheta}\mathcal J_{\mathrm{prep}}
============================================

\mathbf 0.
]

[
\theta_{\mathsf M}
\notin
\Theta_{\mathrm{prep}},
\qquad
\theta_{\mathsf M}^{\mathrm{out}}
=================================

\theta_{\mathsf M}^{\mathrm{in}}.
]

---

[
\texttt{/INPUT}
]

[
r_i^{(0)}
=========

\left(
b_i,
f_i,
s_i,
m_i
\right),
\qquad
i\in{1,\ldots,N_0},
]

[
b_i\in\mathbb B^{*},
\qquad
f_i
\in
\left{
\mathrm{HTML},
\mathrm{PDF},
\mathrm{TEXT},
\mathrm{BOOK},
\mathrm{ENCYCLOPEDIA},
\mathrm{CODE},
\mathrm{SYNTHETIC}
\right},
]

[
s_i
\in
\left{
\mathrm{web},
\mathrm{book},
\mathrm{encyclopedia},
\mathrm{code},
\mathrm{STEM},
\mathrm{reasoning},
\mathrm{multilingual},
\mathrm{instruction},
\mathrm{PDF},
\mathrm{synthetic}
\right},
]

[
m_i
===

\left(
\mathrm{source}_i,
\mathrm{URI}_i,
\mathrm{format}_i,
\mathrm{language}_i^{?},
\mathrm{domain}_i^{?}
\right).
]

[
\mathcal D_{\mathrm{raw}}
=========================

\biguplus_{d\in\mathfrak D}
\mathcal D_{\mathrm{raw}}^{(d)},
]

[
\mathfrak D
\supseteq
\left{
\mathrm{coding},
\mathrm{STEM},
\mathrm{reasoning},
\mathrm{books},
\mathrm{multilingual},
\mathrm{synthetic}
\right}.
]

[
\left|
\operatorname{Tok}
\left(
\mathcal D_{\mathrm{final}}
\right)
\right|
\approx
36\times10^{12},
\qquad
\left|
\mathfrak L
\right|
=======

119.

]



---

[
\texttt{/EXTRACT}
]

[
u_i^{(0)}
=========

\begin{cases}
\operatorname{HTMLText}(b_i),
&
f_i=\mathrm{HTML},
[2mm]
\operatorname{DecodeText}(b_i),
&
f_i\in
{
\mathrm{TEXT},
\mathrm{BOOK},
\mathrm{ENCYCLOPEDIA},
\mathrm{CODE}
},
[2mm]
\operatorname{UNDISCLOSED},
&
\text{otherwise}.
\end{cases}
]

[
\operatorname{HTMLText}
=======================

\operatorname{UNDISCLOSED}
\quad
\text{at parser-rule precision}.
]

[
\ell_i
======

\operatorname{LangID}
\left(
u_i^{(0)}
\right),
\qquad
\ell_i\in\mathfrak L\cup{\bot}.
]

[
\operatorname{LangIDModel}
==========================

\operatorname{UNDISCLOSED},
\qquad
\tau_{\mathrm{lang}}
====================

\operatorname{UNDISCLOSED}.
]



---

[
\texttt{/PDF}
]

[
p_i
\in
\mathcal D_{\mathrm{raw}}^{(\mathrm{PDF})},
]

[
\tilde u_i^{\mathrm{PDF}}
=========================

\mathsf M_{\theta_{\mathrm{Qwen2.5\text{-}VL}}}
\left(
p_i
\right),
]

[
u_i^{\mathrm{PDF}}
==================

\mathsf M_{\theta_{\mathrm{Qwen2.5}}}
\left(
\tilde u_i^{\mathrm{PDF}}
\right).
]

[
\mathcal D_{\mathrm{PDF}}
=========================

\left{
u_i^{\mathrm{PDF}}
\right}*{i=1}^{N*{\mathrm{PDF}}}.
]

[
\left|
\operatorname{Tok}
\left(
\mathcal D_{\mathrm{PDF}}
\right)
\right|
=======

\Theta
\left(
10^{12}
\right).
]

[
\begin{aligned}
\operatorname{PDFPrompt}
&=
\mathsf U,
\
\operatorname{OCRResolution}
&=
\mathsf U,
\
\operatorname{PageMerge}
&=
\mathsf U,
\
\operatorname{LayoutRecovery}
&=
\mathsf U,
\
\operatorname{RefinementPrompt}
&=
\mathsf U,
\
\operatorname{PDFAcceptance}
&=
\mathsf U.
\end{aligned}
]



---

[
\texttt{/SYNTHESIZE}
]

[
\mathfrak G
===========

\left{
\mathsf M_{\theta_{\mathrm{Qwen2.5}}},
\mathsf M_{\theta_{\mathrm{Qwen2.5\text{-}Math}}},
\mathsf M_{\theta_{\mathrm{Qwen2.5\text{-}Coder}}}
\right},
]

[
\mathfrak F_{\mathrm{syn}}
==========================

\left{
\mathrm{textbook},
\mathrm{question\text{-}answering},
\mathrm{instruction},
\mathrm{code\ snippet}
\right},
]

[
g_i\sim\mathfrak G,
\qquad
d_i\sim\mathfrak D_{\mathrm{syn}},
\qquad
z_i\sim\mathfrak F_{\mathrm{syn}},
]

[
u_i^{\mathrm{syn}}
\sim
p_{g_i}
\left(
,\cdot\mid
\varphi_{d_i,z_i}
\right).
]

[
\mathcal D_{\mathrm{syn}}
=========================

\left{
\left(
u_i^{\mathrm{syn}},
d_i,
z_i,
g_i
\right)
\right}*{i=1}^{N*{\mathrm{syn}}}.
]

[
\left|
\operatorname{Tok}
\left(
\mathcal D_{\mathrm{syn}}
\right)
\right|
=======

\Theta
\left(
10^{12}
\right).
]

[
\begin{aligned}
\varphi_{d,z}
&=
\mathsf U,
\
T_{\mathrm{sample}}
&=
\mathsf U,
\
p_{\mathrm{top}}
&=
\mathsf U,
\
k_{\mathrm{top}}
&=
\mathsf U,
\
N_{\mathrm{candidate}}
&=
\mathsf U.
\end{aligned}
]

([arXiv][1])

---

[
\texttt{/MERGE}
]

[
\mathcal D_{\mathrm{text}}
==========================

\mathcal D_{\mathrm{native}}
\uplus
\mathcal D_{\mathrm{PDF}}
\uplus
\mathcal D_{\mathrm{syn}}.
]

[
r_i^{(1)}
=========

\left(
u_i,
s_i,
\ell_i^{?},
d_i^{?},
z_i^{?},
g_i^{?},
m_i
\right).
]

---

[
\texttt{/NORMALIZE}
]

[
\bar u_i
========

\mathcal N
\left(
u_i
\right).
]

[
\mathcal N
:
\mathcal U
\rightarrow
\mathcal U.
]

[
\mathcal N_{\mathrm{exact}}
===========================

\mathsf U.
]

[
r_i^{(2)}
=========

\left(
\bar u_i,
s_i,
m_i
\right).
]

[
\mathsf E
\left(
\mathcal N
\right)
=======

\mathsf L_1.
]



---

[
\texttt{/EXACT\ DEDUP}
]

[
h_i
===

H
\left(
\bar u_i
\right).
]

[
\mathcal C_h
============

\left{
i:
H(\bar u_i)=h
\right}.
]

[
j_h
\in
\operatorname{SelectRepresentative}
\left(
\mathcal C_h
\right).
]

[
\mathcal D_{\mathrm{exact}}
===========================

\left{
r_{j_h}^{(2)}
:
h\in
H(\mathcal D_{\mathrm{text}})
\right}.
]

[
\operatorname{SelectRepresentative}
===================================

\mathsf U.
]

[
\mathsf E
\left(
\mathcal D_{\mathrm{exact}}
\right)
=======

\mathsf L_1,
]

[
\operatorname{Retained}_{\mathsf{Qwen3}}
\left(
\mathrm{ExactDedup}
\right)
=======

\mathsf U.
]



---

[
\texttt{/FUZZY\ DEDUP}
]

[
\mathcal G_k(\bar u_i)
======================

\left{
\bar u_{i,t:t+k-1}
\right}_{t=1}^{|\bar u_i|-k+1}.
]

[
k
=

\mathsf U.
]

[
\mu_j(i)
========

\min_{g\in\mathcal G_k(\bar u_i)}
h_j(g),
\qquad
j\in{1,\ldots,H}.
]

[
\boldsymbol\mu(i)
=================

\left(
\mu_1(i),
\ldots,
\mu_H(i)
\right).
]

[
H
=

bq,
\qquad
\boldsymbol\mu(i)
=================

\left[
\boldsymbol\mu_{i}^{(1)};
\ldots;
\boldsymbol\mu_{i}^{(b)}
\right].
]

[
(i,j)
\in
\mathcal P_{\mathrm{LSH}}
\iff
\exists a\in{1,\ldots,b}:
\boldsymbol\mu_i^{(a)}
======================

\boldsymbol\mu_j^{(a)}.
]

[
J_{ij}
======

\frac{
\left|
\mathcal G_k(\bar u_i)
\cap
\mathcal G_k(\bar u_j)
\right|
}{
\left|
\mathcal G_k(\bar u_i)
\cup
\mathcal G_k(\bar u_j)
\right|
}.
]

[
(i,j)
\in
\mathcal P_{\mathrm{dup}}
\iff
(i,j)\in\mathcal P_{\mathrm{LSH}}
\land
J_{ij}\ge\tau_{\mathrm{dup}}.
]

[
\mathcal D_{\mathrm{fuzzy}}
===========================

\operatorname{RepresentativeSet}
\left(
\mathcal D_{\mathrm{exact}},
\mathcal P_{\mathrm{dup}}
\right).
]

[
\left(
k,
H,
b,
q,
\tau_{\mathrm{dup}},
\operatorname{RepresentativeSet}
\right)
=======

\mathsf U.
]

[
\mathsf E
\left(
\mathcal D_{\mathrm{fuzzy}}
\right)
=======

\mathsf L_1,
]

[
\operatorname{Retained}_{\mathsf{Qwen3}}
\left(
\mathrm{MinHash},
\mathrm{LSH}
\right)
=======

\mathsf U.
]



---

[
\texttt{/HEURISTICS}
]

[
\mathbf h_i
===========

\left(
h_{i,1},
\ldots,
h_{i,K_h}
\right)
=======

\operatorname{HeuristicFeatures}
\left(
\bar u_i,
m_i
\right).
]

[
a_i^{\mathrm{heur}}
===================

\mathbf 1
\left[
\mathbf h_i
\in
\mathcal A_{\mathrm{heur}}
\right].
]

[
K_h
===

\mathsf U,
\qquad
\mathcal A_{\mathrm{heur}}
==========================

\mathsf U.
]

[
\mathsf E
\left(
a_i^{\mathrm{heur}}
\right)
\in
\left{
\mathsf R_2,
\mathsf R_{2.5}
\right}.
]



---

[
\texttt{/MODEL\ SCORES}
]

[
s_i^{\mathrm{LM}}
=================

\mathsf M_{\theta_{\mathrm{LM\text{-}filter}}}
\left(
\bar u_i
\right),
]

[
s_i^{\mathrm{quality}}
======================

\mathsf M_{\theta_{\mathrm{text\text{-}quality}}}
\left(
\bar u_i
\right),
]

[
s_i^{\mathrm{safety}}
=====================

\mathsf M_{\theta_{\mathrm{offensive}}}
\left(
\bar u_i
\right).
]

[
\mathbf s_i^{\mathrm{Q2I}}
==========================

\mathsf M_{\theta_{\mathrm{Qwen2\text{-}Instruct}}}
\left(
\bar u_i
\right)
\in
\mathbb R^{K_q}.
]

[
K_q
===

\mathsf U.
]

[
a_i^{\mathrm{model}}
====================

\mathbf 1
\left[
\begin{aligned}
s_i^{\mathrm{LM}}
&\ge\tau_{\mathrm{LM}},
\
s_i^{\mathrm{quality}}
&\ge\tau_{\mathrm{quality}},
\
s_i^{\mathrm{safety}}
&\ge\tau_{\mathrm{safety}},
\
\mathbf s_i^{\mathrm{Q2I}}
&\in\mathcal A_{\mathrm{Q2I}}
\end{aligned}
\right].
]

[
\left(
\tau_{\mathrm{LM}},
\tau_{\mathrm{quality}},
\tau_{\mathrm{safety}},
\mathcal A_{\mathrm{Q2I}}
\right)
=======

\mathsf U.
]



---

[
\texttt{/SYNTHETIC\ FILTER}
]

[
s_i^{\mathrm{GRM}}
==================

\mathsf M_{\theta_{\mathrm{general\text{-}RM}}}
\left(
u_i^{\mathrm{syn}}
\right),
]

[
s_i^{\mathrm{MathRM}}
=====================

\mathsf M_{\theta_{\mathrm{Qwen2\text{-}Math\text{-}RM\text{-}72B}}}
\left(
u_i^{\mathrm{syn}}
\right).
]

[
a_i^{\mathrm{syn}}
==================

\mathbf 1
\left[
s_i^{\mathrm{GRM}}
\ge\tau_{\mathrm{GRM}}
\right]
\cdot
\mathbf 1
\left[
d_i\in\mathfrak D_{\mathrm{math}}
\Rightarrow
s_i^{\mathrm{MathRM}}
\ge\tau_{\mathrm{MathRM}}
\right].
]

[
\left(
\tau_{\mathrm{GRM}},
\tau_{\mathrm{MathRM}}
\right)
=======

\mathsf U.
]

[
\mathsf E
\left(
a_i^{\mathrm{syn}}
\right)
=======

\mathsf R_{2.5},
]

[
\operatorname{Retained}_{\mathsf{Qwen3}}
\left(
a_i^{\mathrm{syn}}
\right)
=======

\mathsf U.
]



---

[
\texttt{/ANNOTATE}
]

[
\mathbf a_i
===========

\mathcal A_{\mathrm{multi}}
\left(
\bar u_i
\right)
=======

\left(
e_i,
f_i,
d_i,
s_i
\right),
]

[
e_i
\in
\mathfrak E_{\mathrm{education}},
\qquad
f_i
\in
\mathfrak F_{\mathrm{field}},
]

[
d_i
\in
\mathfrak D_{\mathrm{domain}},
\qquad
s_i
\in
\mathfrak S_{\mathrm{safety}}.
]

[
\left|
\operatorname{Tok}
\left(
\left{
\bar u_i:
\mathbf a_i\neq\bot
\right}
\right)
\right|

>

30\times10^{12}.
]

[
\left(
\mathfrak E_{\mathrm{education}},
\mathfrak F_{\mathrm{field}},
\mathfrak D_{\mathrm{domain}},
\mathfrak S_{\mathrm{safety}},
\mathcal A_{\mathrm{multi}}
\right)_{\mathrm{exact}}
========================

\mathsf U.
]

([arXiv][1])

---

[
\texttt{/ACCEPT}
]

[
a_i^{\mathrm{Qwen3}}
====================

\mathcal F_{\mathrm{Qwen3}}
\left(
\bar u_i,
\ell_i,
\mathbf a_i,
\mathbf h_i,
\mathbf s_i,
m_i
\right).
]

[
\mathcal F_{\mathrm{Qwen3}}
===========================

\mathsf U
\quad
\text{at exact composition}.
]

[
\tilde a_i^{\mathrm{lineage}}
=============================

a_i^{\mathrm{lang}}
a_i^{\mathrm{heur}}
a_i^{\mathrm{model}}
a_i^{\mathrm{syn}}.
]

[
\boxed{
a_i^{\mathrm{Qwen3}}
\neq
\tilde a_i^{\mathrm{lineage}}
\quad
\text{unless explicitly established}
}
]

[
\mathcal D_{\mathrm{filtered}}
==============================

\left{
r_i^{(2)}
:
a_i^{\mathrm{Qwen3}}=1
\right}.
]

---

[
\texttt{/MANUAL\ AUDIT}
]

[
\mathcal S_j
\sim
\operatorname{Sample}
\left(
\mathcal D_{\mathrm{filtered}}^{(j)}
\right),
]

[
q_j^{\mathrm{human}}
====================

\operatorname{Review}
\left(
\mathcal S_j
\right),
]

[
\mathsf E
\left(
q_j^{\mathrm{human}}
\right)
=======

\mathsf L_1,
]

[
\operatorname{Retained}_{\mathsf{Qwen3}}
\left(
\mathrm{ManualAudit}
\right)
=======

\mathsf U.
]



---

[
\texttt{/DECONTAMINATE}
]

[
\mathcal G_{13}(u)
==================

\left{
u_{t:t+12}
\right}_{t=1}^{|u|-12}.
]

[
a_i^{\mathrm{decontam}}
=======================

\prod_{e\in\mathcal E_{\mathrm{reported}}}
\mathbf 1
\left[
\mathcal G_{13}(\bar u_i)
\cap
\mathcal G_{13}(e)
==================

\varnothing
\right].
]

[
\mathcal D_{\mathrm{decontam}}^{\mathrm{Qwen}}
==============================================

\left{
r_i:
a_i^{\mathrm{decontam}}=1
\right}.
]

[
\mathsf E
\left(
a_i^{\mathrm{decontam}}
\right)
=======

\mathsf L_1,
]

[
\operatorname{Decontam}_{\mathsf{Qwen3}}
========================================

\mathsf U,
]

[
n_{\mathrm{gram}}^{\mathsf{Qwen3}}
==================================

\mathsf U,
\qquad
\mathcal E_{\mathrm{Qwen3}}
===========================

\mathsf U.
]



---

[
\texttt{/DOMAIN\ LABEL}
]

[
c_i
===

\mathsf M_{\theta_{\mathrm{Qwen2\text{-}Instruct}}}
\left(
\bar u_i
\right)
\in
\mathfrak D_{\mathrm{mix}}.
]

[
\mathfrak D_{\mathrm{over}}
\supseteq
\left{
\mathrm{e\text{-}commerce},
\mathrm{social\ media},
\mathrm{entertainment}
\right},
]

[
\mathfrak D_{\mathrm{under}}
\supseteq
\left{
\mathrm{technology},
\mathrm{science},
\mathrm{academic}
\right}.
]

[
c_i\in\mathfrak D_{\mathrm{over}}
\Rightarrow
w_i^{(2.5)}
\downarrow,
]

[
c_i\in\mathfrak D_{\mathrm{under}}
\Rightarrow
w_i^{(2.5)}
\uparrow.
]

[
w_i^{(2.5)}
===========

\mathcal W_{2.5}
\left(
c_i,
s_i,
\mathbf a_i
\right),
\qquad
\mathcal W_{2.5}
================

\mathsf U.
]



---

[
\texttt{/INSTANCE\ MIX}
]

[
\mathbf z_i
===========

\left[
\operatorname{onehot}(\ell_i);
\operatorname{onehot}(d_i);
\operatorname{onehot}(f_i);
e_i;
s_i;
\operatorname{onehot}(s_i^{\mathrm{source}})
\right].
]

[
w_i
===

\mathcal W_{\psi}
\left(
\mathbf z_i
\right),
\qquad
w_i\ge0,
\qquad
\sum_{i=1}^{N}w_i=1.
]

[
\mathcal W
==========

\left{
\mathbf w^{(1)},
\ldots,
\mathbf w^{(K_{\mathrm{abl}})}
\right}.
]

[
\theta_{\mathrm{proxy}}^{(k)}
=============================

\operatorname{TrainProxy}
\left(
\theta_{\mathrm{proxy}}^{(0)},
\operatorname{Sample}
\left(
\mathcal D_{\mathrm{filtered}},
\mathbf w^{(k)}
\right)
\right).
]

[
J_{\mathrm{proxy}}^{(k)}
========================

\operatorname{Eval}*{\mathrm{proxy}}
\left(
\theta*{\mathrm{proxy}}^{(k)}
\right).
]

[
k^{\star}
\in
\underset{k\in{1,\ldots,K_{\mathrm{abl}}}}
{\arg\max}
;
J_{\mathrm{proxy}}^{(k)}.
]

[
\mathbf w^{\star}
=================

\mathbf w^{(k^\star)}.
]

[
\boxed{
w_i^{\star}
===========

w^{\star}
\left(
\mathbf z_i
\right)
\neq
w^{\star}
\left(
d_i
\right)
}
]

[
\left(
\mathcal W_{\psi},
K_{\mathrm{abl}},
J_{\mathrm{proxy}},
\operatorname{Eval}*{\mathrm{proxy}},
\operatorname{TrainProxy}
\right)*{\mathrm{exact}}
========================

\mathsf U.
]

([arXiv][1])

---

[
\texttt{/PREP\ OBJECTIVE}
]

[
\boxed{
\mathbf w^{\star}
\in
\underset{\mathbf w\in\mathcal W}
{\arg\max}
;
J_{\mathrm{proxy}}^{\mathsf U}
\left(
\mathbf w
\mid
\left{
\mathbf a_i
\right}_{i=1}^{N}
\right)
}
]

[
\mathcal J_{\mathrm{prep}}
\equiv
J_{\mathrm{proxy}}^{\mathsf U},
]

[
\boxed{
\mathcal J_{\mathrm{prep}}
\neq
\mathcal L_{\mathrm{NTP}}
}
]

[
\boxed{
\nabla_{\theta_{\mathsf M}}
\mathcal J_{\mathrm{prep}}
==========================

\mathbf 0
}
]

[
\lambda_{\mathrm{quality}},
\lambda_{\mathrm{safety}},
\lambda_{\mathrm{diversity}},
\lambda_{\mathrm{domain}}
=========================

\mathsf U.
]

---

[
\texttt{/SAMPLE}
]

[
I_n
\sim
\operatorname{Categorical}
\left(
w_1^\star,\ldots,w_N^\star
\right),
]

[
\mathcal D_{\mathrm{mixed}}
===========================

\left{
r_{I_n}
\right}*{n=1}^{N*{\mathrm{mixed}}}.
]

[
N_{\mathrm{mixed}}
==================

\mathsf U
\quad
\text{before tokenization}.
]

---

[
\texttt{/TOKENIZER}
]

[
\mathcal T_{\mathrm{Qwen3}}
===========================

\operatorname{BBPE}_{\mathrm{Qwen}}.
]

[
\left|
\mathcal V_{\mathrm{logical}}
\right|
=======

151,669.
]

[
\left|
\mathcal V_{\mathrm{model}}
\right|
=======

151,936.
]

[
\mathcal V_{\mathrm{logical}}
\subset
\mathcal V_{\mathrm{model}}.
]

[
\left|
\mathcal V_{\mathrm{padding}}
\right|
=======

# 151,936-151,669

267.

]

[
e_{\mathrm{EOD}}
================

# 151,643

\operatorname{id}
\left(
\texttt{<|endoftext|>}
\right).
]

[
e_{\mathrm{EOS}}
================

# e_{\mathrm{PAD}}

# e_{\mathrm{BOS}}

151,643
\quad
\text{in base configuration},
]

[
\operatorname{add_bos}
======================

0,
\qquad
\operatorname{prefix_space}
===========================

0.

]



---

[
\texttt{/TOKENIZER\ LINEAGE}
]

[
\mathcal V_{0}
==============

\mathcal V_{\mathrm{cl100k_base}},
]

[
\mathcal V_{1}
==============

\mathcal V_{0}
\cup
\mathcal V_{\mathrm{Chinese}}
\cup
\mathcal V_{\mathrm{multilingual}},
]

[
\operatorname{Digits}
\left(
n_1n_2\cdots n_k
\right)
=======

\left(
n_1,n_2,\ldots,n_k
\right).
]

[
\mathcal T_{\mathrm{Qwen}}
==========================

\operatorname{BPETrain}
\left(
\mathcal V_1,
\operatorname{Digits}
\right).
]

[
\mathsf E
\left(
\mathcal T_{\mathrm{Qwen}}
\right)
=======

\mathsf L_1,
]

[
\mathsf E
\left(
\mathcal T_{\mathrm{Qwen3}}
===========================

\operatorname{BBPE}_{\mathrm{Qwen}}
\right)
=======

\mathsf R_3.
]



---

[
\texttt{/ENCODE}
]

[
\mathbf x_i
===========

\mathcal T_{\mathrm{Qwen3}}
\left(
\bar u_i
\right)
=======

\left(
x_{i,1},
\ldots,
x_{i,n_i}
\right),
]

[
x_{i,t}
\in
\mathcal V_{\mathrm{logical}},
\qquad
n_i
===

\left|
\mathcal T_{\mathrm{Qwen3}}
(\bar u_i)
\right|.
]

[
r_i^{\mathrm{tok}}
==================

\left(
\mathbf x_i,
n_i,
\ell_i,
\mathbf a_i,
s_i,
m_i,
w_i^{\star}
\right).
]

---

[
\texttt{/DOCUMENT\ END}
]

[
\operatorname{Serialize}_{\mathsf{Qwen}}
\left(
\mathbf x_1,\ldots,\mathbf x_m
\right)
=======

\mathbf x_1
\Vert
[e_{\mathrm{EOD}}]
\Vert
\cdots
\Vert
\mathbf x_m
\Vert
[e_{\mathrm{EOD}}].
]

[
\mathsf E
\left(
\operatorname{Serialize}_{\mathsf{Qwen}}
\right)
=======

\mathsf L_1.
]

[
\operatorname{Serialize}_{\mathsf{Qwen3}}
=========================================

\mathsf U.
]

[
\begin{aligned}
\operatorname{MaskAcrossEOD}*{\mathsf{Qwen3}}
&=
\mathsf U,
\
\operatorname{LossOnEOD}*{\mathsf{Qwen3}}
&=
\mathsf U,
\
\operatorname{ResetPosition}*{\mathsf{Qwen3}}
&=
\mathsf U,
\
\operatorname{DocumentPacking}*{\mathsf{Qwen3}}
&=
\mathsf U.
\end{aligned}
]

([GitHub][2])

---

[
\texttt{/STAGE\ ONE}
]

[
L_1
===

4096.

]

[
\mathcal D_{1}
\sim
p_{1}^{\star}
\left(
\mathrm{general},
119\ \mathrm{languages}
\right).
]

[
\left|
\operatorname{Tok}
\left(
\mathcal D_{1}
\right)
\right|

>

30\times10^{12}.
]

[
\mathcal C_1
============

\Psi_{4096}^{(1)}
\left(
\operatorname{Sample}
\left(
\mathcal D_{\mathrm{mixed}},
p_1^\star
\right)
\right).
]

[
\Psi_{4096}^{(1)}
\in
\left{
\operatorname{pack},
\operatorname{split},
\operatorname{truncate},
\operatorname{pad},
\operatorname{combination}
\right}
=======

\mathsf U.
]

([arXiv][1])

---

[
\texttt{/STAGE\ TWO}
]

[
L_2
===

4096.

]

[
\mathfrak D_{2}^{+}
===================

\left{
\mathrm{STEM},
\mathrm{coding},
\mathrm{reasoning},
\mathrm{synthetic}
\right}.
]

[
\forall d\in\mathfrak D_{2}^{+}:
\qquad
p_2^\star(d)

>

p_1^\star(d).
]

[
\mathcal D_2
\sim
p_2^\star
\left(
,\cdot\mid
a_i^{\mathrm{Qwen3}}=1
\right).
]

[
\left|
\operatorname{Tok}
\left(
\mathcal D_2
\right)
\right|
\approx
5\times10^{12}.
]

[
\mathcal C_2
============

\Psi_{4096}^{(2)}
\left(
\operatorname{Sample}
\left(
\mathcal D_{\mathrm{mixed}},
p_2^\star
\right)
\right).
]

[
p_2^\star
=========

\mathsf U
\quad
\text{at numeric mixture precision}.
]

([arXiv][1])

---

[
\texttt{/STAGE\ THREE}
]

[
L_3
===

32768.

]

[
\mathcal D_{\mathrm{long}}
==========================

\left{
r_i^{\mathrm{tok}}
:
4096
\le
n_i
\le
32768
\right}.
]

[
\Pr_{\mathcal D_3}
\left[
16384
\le
n_i
\le
32768
\right]
=======

0.75,
]

[
\Pr_{\mathcal D_3}
\left[
4096
\le
n_i
<
16384
\right]
=======

0.25.
]

[
\left|
\operatorname{Tok}
\left(
\mathcal D_3
\right)
\right|
=======

\Theta
\left(
10^{11}
\right).
]

[
\mathcal C_3
============

\Psi_{32768}^{(3)}
\left(
\operatorname{Sample}
\left(
\mathcal D_{\mathrm{long}},
p_3^\star
\right)
\right).
]

[
\Psi_{32768}^{(3)}
==================

\mathsf U
\quad
\text{at packing precision}.
]

([arXiv][1])

---

[
\texttt{/VALIDATE}
]

[
\forall s\in{1,2,3},
\quad
\forall\mathbf x\in\mathcal C_s:
\qquad
\mathbf x
\in
\mathcal V_{\mathrm{logical}}^{\le L_s}.
]

[
\forall x_t\in\mathbf x:
\qquad
0
\le
x_t
<
151,669.
]

[
\sum_{\mathbf x\in\mathcal C_1}
|\mathbf x|

>

30\times10^{12},
]

[
\sum_{\mathbf x\in\mathcal C_2}
|\mathbf x|
\approx
5\times10^{12},
]

[
\sum_{\mathbf x\in\mathcal C_3}
|\mathbf x|
===========

\Theta
\left(
10^{11}
\right).
]

[
\operatorname{LanguageSupport}
\left(
\mathcal C_1\cup\mathcal C_2\cup\mathcal C_3
\right)
=======

119.

]

---

[
\texttt{/OUTPUT}
]

[
\boxed{
\mathfrak C_{\mathrm{Qwen3}}
============================

\left(
\mathcal C_1,
\mathcal C_2,
\mathcal C_3
\right)
}
]

[
\boxed{
\mathcal D_{\mathrm{raw}}
\xrightarrow{\mathrm{extract}}
\mathcal D_{\mathrm{text}}
\xrightarrow{\mathrm{normalize}}
\mathcal D_{\mathrm{norm}}
\xrightarrow{\mathrm{dedup}}
\mathcal D_{\mathrm{dedup}}
\xrightarrow{\mathrm{filter}}
\mathcal D_{\mathrm{filtered}}
\xrightarrow{\mathrm{annotate}}
\mathcal D_{\mathrm{annotated}}
}
]

[
\boxed{
\mathcal D_{\mathrm{annotated}}
\xrightarrow{\mathrm{instance\ mix}}
\mathcal D_{\mathrm{mixed}}
\xrightarrow{\mathrm{BBPE}}
\mathcal D_{\mathrm{tokenized}}
\xrightarrow{\mathrm{stage\ partition}}
\left(
\mathcal C_1,
\mathcal C_2,
\mathcal C_3
\right)
}
]

---

[
\texttt{/UNKNOWN}
]

[
\boxed{
\begin{aligned}
&
\mathcal N_{\mathrm{exact}},
;
\operatorname{LangIDModel},
;
\tau_{\mathrm{lang}},
;
\mathcal F_{\mathrm{Qwen3}},
\
&
\operatorname{ExactDedupRetention}*{\mathsf{Qwen3}},
;
\operatorname{FuzzyDedupRetention}*{\mathsf{Qwen3}},
\
&
k_{\mathrm{shingle}},
;
H_{\mathrm{MinHash}},
;
b_{\mathrm{LSH}},
;
\tau_{\mathrm{dup}},
\
&
\operatorname{QualityThresholds},
;
\operatorname{SafetyThresholds},
;
\operatorname{SyntheticThresholds},
\
&
\mathcal W_{\psi},
;
J_{\mathrm{proxy}},
;
K_{\mathrm{abl}},
;
\mathbf w^\star,
\
&
\operatorname{Decontam}*{\mathsf{Qwen3}},
;
\operatorname{DocumentPacking}*{\mathsf{Qwen3}},
\
&
\operatorname{MaskAcrossEOD}*{\mathsf{Qwen3}},
;
\operatorname{LossOnEOD}*{\mathsf{Qwen3}},
;
\Psi_{L}^{(s)}
\end{aligned}
=============

\operatorname{UNDISCLOSED}
}
]

[1]: https://arxiv.org/abs/2505.09388 "Qwen3 Technical Report"
[2]: https://github.com/QwenLM/Qwen/issues/394 "Data format for continuous pre-training · Issue #394 · QwenLM/Qwen · GitHub"

[
\boxed{
\textsc{Qwen3 Flagship Supervised Fine-Tuning}
}
]

[
\texttt{/SCOPE}
]

[
\mathfrak M_{\mathrm{flagship}}
===============================

\left{
\mathsf{Qwen3\text{-}235B\text{-}A22B},
\mathsf{Qwen3\text{-}32B},
\mathsf{Qwen3\text{-}30B\text{-}A3B}
\right}.
]

[
\theta_{\mathrm B}
\xrightarrow{\mathcal L_{\mathrm{ColdSFT}}}
\theta_{\mathrm C}
\xrightarrow{\mathcal J_{\mathrm{ReasoningRL}}}
\theta_{\mathrm R}
\xrightarrow{\mathcal L_{\mathrm{FusionSFT}}}
\theta_{\mathrm F}.
]

[
\boxed{
\mathsf{SFT}
============

\left{
\mathsf{LongCoTColdStart},
\mathsf{ThinkingModeFusion}
\right}
}
]

[
\mathsf M_{\theta}
:
\left(
X,A,P
\right)
\longmapsto
Z_{\theta},
\qquad
Z_{\theta}
\in
\mathbb R^{B\times L\times V_{\mathrm M}}.
]

[
V_{\mathrm M}
=============

151,936,
\qquad
V_{\mathrm T}
=============

151,669.
]

[
\mathsf{Inside}
\left(
\mathsf M_{\theta}
\right)
=======

\varnothing.
]



[
\texttt{/EVIDENCE}
]

[
\mathsf E(z)
\in
\left{
\mathsf R,
\mathsf C,
\mathsf D,
\mathsf U
\right},
]

[
\begin{aligned}
\mathsf R
&\equiv
\operatorname{REPORTED},
\
\mathsf C
&\equiv
\operatorname{CODE\text{-}VERIFIED},
\
\mathsf D
&\equiv
\operatorname{DERIVED},
\
\mathsf U
&\equiv
\operatorname{UNDISCLOSED}.
\end{aligned}
]

[
\boxed{
\mathsf{ExactSFTMask}
=====================

# \mathsf{ExactNormalization}

# \mathsf{ExactOptimizer}

# \mathsf{ExactBatching}

\mathsf U
}
]



---

[
\boxed{
\textsc{Algorithm I: Long-CoT Cold-Start Preprocessing}
}
]

[
\texttt{/RAW SCHEMA}
]

[
r_i^{(0)}
=========

\left(
q_i,
d_i^{?},
a_i^{\star},
\mathcal V_i,
\mathcal T_i,
m_i
\right),
]

[
q_i\in\mathcal U,
\qquad
d_i^{?}
\in
\mathfrak D_{\mathrm{cold}}\cup{\bot},
]

[
\mathfrak D_{\mathrm{cold}}
\supseteq
\left{
\mathrm{mathematics},
\mathrm{code},
\mathrm{logic},
\mathrm{STEM}
\right},
]

[
a_i^{\star}
===========

\text{verified reference answer},
]

[
\mathcal V_i
:
\mathcal U
\rightarrow
{0,1,\bot},
]

[
\mathcal T_i
============

\text{code-based test cases}
\quad\lor\quad
\varnothing.
]

[
\mathcal Q_0
============

\left{
r_i^{(0)}
\right}_{i=1}^{N_0}.
]



---

[
\texttt{/FREEZE FILTER}
]

[
\phi_{\mathrm Q}
================

\theta_{\mathsf{Qwen2.5\text{-}72B\text{-}Instruct}},
]

[
\nabla_{\phi_{\mathrm Q}}
\mathcal J_{\mathrm{SFT}}
=========================

\mathbf 0.
]

[
\phi_{\mathrm T}
================

\theta_{\mathsf{QwQ\text{-}32B}},
\qquad
\nabla_{\phi_{\mathrm T}}
\mathcal J_{\mathrm{SFT}}
=========================

\mathbf 0.
]

[
\phi_{\mathrm Q},
\phi_{\mathrm T}
\notin
\theta_{\mathsf M}.
]

---

[
\texttt{/QUERY ANALYZE}
]

[
\left(
\hat v_i,
\hat s_i,
\hat g_i,
\hat d_i
\right)
=======

\mathsf M_{\phi_{\mathrm Q}}
\left(
q_i;
\rho_{\mathrm{query}}
\right),
]

[
\hat v_i
\in
{0,1},
\qquad
\hat s_i
\in
{0,1},
\qquad
\hat g_i
\in
{0,1},
]

[
\begin{aligned}
\hat v_i=1
&\iff
q_i
\text{ is readily verifiable},
\
\hat s_i=1
&\iff
q_i
\text{ contains multiple sub-questions},
\
\hat g_i=1
&\iff
q_i
\text{ requests general text generation},
\
\hat d_i
&\in
\mathfrak D_{\mathrm{cold}}.
\end{aligned}
]

[
\rho_{\mathrm{query}}
=====================

\mathsf U.
]

[
\mathsf{QueryClassifierThresholds}
==================================

\mathsf U.
]



---

[
\texttt{/DIRECT SOLVE}
]

[
\tilde a_i^{\mathrm{direct}}
\sim
\pi_{\phi_{\mathrm Q}}^{\mathrm{no\text{-}CoT}}
\left(
,\cdot\mid q_i
\right).
]

[
c_i^{\mathrm{direct}}
=====================

\mathcal V_i
\left(
\tilde a_i^{\mathrm{direct}}
\right).
]

[
\alpha_i^{\mathrm{query}}
=========================

\mathbf 1[\hat v_i=1]
\mathbf 1[\hat s_i=0]
\mathbf 1[\hat g_i=0]
\mathbf 1[c_i^{\mathrm{direct}}\neq1].
]

[
\boxed{
\mathcal Q_{\mathrm{filtered}}
==============================

\left{
r_i^{(0)}
:
\alpha_i^{\mathrm{query}}=1
\right}
}
]

[
\underbrace{
c_i^{\mathrm{direct}}\neq1
}_{\texttt{/* require deeper reasoning */}}
]



---

[
\texttt{/DOMAIN BALANCE}
]

[
d_i
\leftarrow
\hat d_i.
]

[
n_d
===

\sum_{i}
\mathbf 1[d_i=d],
\qquad
d\in\mathfrak D_{\mathrm{cold}}.
]

[
\mathcal Q_{\mathrm{balanced}}
==============================

\operatorname{Balance}
\left(
\mathcal Q_{\mathrm{filtered}};
{d_i}
\right).
]

[
\pi_{\mathrm{domain}}^{\mathrm{cold}}
=====================================

\operatorname{UNDISCLOSED}.
]

[
\operatorname{Balance}
======================

\operatorname{UNDISCLOSED}.
]

[
\pi_{\mathrm{domain}}^{\mathrm{cold}}
\neq
\operatorname{Uniform}
\quad
\text{unless established}.
]



---

[
\texttt{/VALIDATION SPLIT}
]

[
\mathcal Q_{\mathrm{balanced}}
==============================

\mathcal Q_{\mathrm{train}}
;\dot\cup;
\mathcal Q_{\mathrm{val}},
]

[
\mathcal Q_{\mathrm{train}}
\cap
\mathcal Q_{\mathrm{val}}
=========================

\varnothing.
]

[
\operatorname{SplitRatio}
=========================

\mathsf U,
\qquad
\operatorname{SplitSeed}
========================

\mathsf U.
]

---

[
\texttt{/GENERATE N}
]

[
N_{\mathrm{cand}}
=================

# N

\mathsf U.
]

[
y_{i,n}^{\mathrm T}
\sim
\pi_{\phi_{\mathrm T}}
\left(
,\cdot\mid
q_i;
\tau_{\mathrm T},
p_{\mathrm T},
k_{\mathrm T},
\ell_{\mathrm T}^{\max}
\right),
]

[
i\in\mathcal Q_{\mathrm{train}},
\qquad
n\in{1,\ldots,N}.
]

[
\left(
\tau_{\mathrm T},
p_{\mathrm T},
k_{\mathrm T},
\ell_{\mathrm T}^{\max}
\right)
=======

\mathsf U.
]

[
\boxed{
\mathcal Y_i
============

\left{
y_{i,1}^{\mathrm T},
\ldots,
y_{i,N}^{\mathrm T}
\right}
}
]



---

[
\texttt{/PARSE RESPONSE}
]

[
y_{i,n}^{\mathrm T}
===================

\langle\mathrm{think}\rangle
;c_{i,n};
\langle/\mathrm{think}\rangle
;a_{i,n}.
]

[
\left(
c_{i,n},
a_{i,n}
\right)
=======

\operatorname{Split}*{\langle/\mathrm{think}\rangle}
\left(
y*{i,n}^{\mathrm T}
\right).
]

[
c_{i,n}
=======

\text{reasoning trajectory},
\qquad
a_{i,n}
=======

\text{final response}.
]

[
\operatorname{Malformed}_{i,n}
==============================

\mathbf 1
\left[
\operatorname{Split}
\left(
y_{i,n}^{\mathrm T}
\right)
=======

\bot
\right].
]

([Hugging Face][1])

---

[
\texttt{/VERIFY RESPONSE}
]

[
v_{i,n}^{\mathrm{auto}}
=======================

\begin{cases}
\mathcal V_i
\left(
a_{i,n}
\right),
&
\mathcal V_i\neq\varnothing,
[2mm]
\operatorname{Execute}
\left(
\mathcal T_i,
a_{i,n}
\right),
&
\mathcal T_i\neq\varnothing,
[2mm]
\bot,
&
\text{otherwise}.
\end{cases}
]

[
\chi_i^{\mathrm{persistent}}
============================

\operatorname{PersistentFailure}
\left(
\left{
v_{i,n}^{\mathrm{auto}}
\right}_{n=1}^{N}
\right).
]

[
\chi_i^{\mathrm{persistent}}=1
\Longrightarrow
\left{
v_{i,n}^{\mathrm{human}}
\right}_{n=1}^{N}
=================

\operatorname{HumanReview}
\left(
q_i,
\mathcal Y_i,
a_i^{\star},
\mathcal T_i
\right).
]

[
v_{i,n}
=======

\begin{cases}
v_{i,n}^{\mathrm{human}},
&
v_{i,n}^{\mathrm{human}}\neq\bot,
\
v_{i,n}^{\mathrm{auto}},
&
\text{otherwise}.
\end{cases}
]

[
\operatorname{PersistentFailure}
================================

\mathsf U.
]



---

[
\texttt{/PASS AT N}
]

[
\operatorname{Pass@N}(q_i)
==========================

\mathbf 1
\left[
\max_{1\le n\le N}
v_{i,n}
=======

1
\right].
]

[
\mathcal Q_{+}
==============

\left{
q_i\in\mathcal Q_{\mathrm{train}}
:
\operatorname{Pass@N}(q_i)=1
\right}.
]

[
\underbrace{
\max_n v_{i,n}=1
}_{\texttt{/* positive Pass@N */}}
]



---

[
\texttt{/QUALITY FLAGS}
]

[
\mathbf f_{i,n}
===============

\left(
f_{i,n}^{\mathrm{wrong}},
f_{i,n}^{\mathrm{repeat}},
f_{i,n}^{\mathrm{guess}},
f_{i,n}^{\mathrm{conflict}},
f_{i,n}^{\mathrm{language}},
f_{i,n}^{\mathrm{leak}},
f_{i,n}^{\mathrm{malformed}}
\right),
]

[
f_{i,n}^{\mathrm{wrong}}
========================

\mathbf 1
\left[
v_{i,n}\neq1
\right],
]

[
f_{i,n}^{\mathrm{repeat}}
=========================

\operatorname{SubstantialRepetition}
\left(
c_{i,n},a_{i,n}
\right),
]

[
f_{i,n}^{\mathrm{guess}}
========================

\operatorname{UnsupportedGuessing}
\left(
c_{i,n},a_{i,n}
\right),
]

[
f_{i,n}^{\mathrm{conflict}}
===========================

\operatorname{ReasoningSummaryConflict}
\left(
c_{i,n},a_{i,n}
\right),
]

[
f_{i,n}^{\mathrm{language}}
===========================

\operatorname{ImproperLanguageShift}
\left(
c_{i,n},a_{i,n}
\right)
\lor
\operatorname{ImproperStyleShift}
\left(
c_{i,n},a_{i,n}
\right),
]

[
f_{i,n}^{\mathrm{leak}}
=======================

\operatorname{ValidationSimilarity}
\left(
y_{i,n}^{\mathrm T},
\mathcal Q_{\mathrm{val}}
\right),
]

[
f_{i,n}^{\mathrm{malformed}}
============================

\operatorname{Malformed}_{i,n}.
]

[
\alpha_{i,n}^{\mathrm{response}}
================================

\prod_{j=1}^{7}
\mathbf 1
\left[
f_{i,n}^{(j)}=0
\right].
]

[
\boxed{
\mathcal D_{\mathrm{refined}}
=============================

\left{
\left(
q_i,c_{i,n},a_{i,n},d_i
\right):
q_i\in\mathcal Q_{+},
;
\alpha_{i,n}^{\mathrm{response}}=1
\right}
}
]

[
\begin{aligned}
\operatorname{SubstantialRepetition}
&=
\mathsf U,
\
\operatorname{UnsupportedGuessing}
&=
\mathsf U,
\
\operatorname{ReasoningSummaryConflict}
&=
\mathsf U,
\
\operatorname{ImproperLanguageShift}
&=
\mathsf U,
\
\operatorname{ValidationSimilarity}
&=
\mathsf U.
\end{aligned}
]



---

[
\texttt{/SMALL SUBSET}
]

[
\mathcal D_{\mathrm{cold}}
==========================

\operatorname{SelectSmall}
\left(
\mathcal D_{\mathrm{refined}}
\right).
]

[
N_{\mathrm{cold}}
=================

\left|
\mathcal D_{\mathrm{cold}}
\right|,
\qquad
N_{\mathrm{cold}}
=================

\mathsf U.
]

[
T_{\mathrm{cold}}
=================

\text{cold-SFT optimizer steps},
\qquad
T_{\mathrm{cold}}
=================

\mathsf U.
]

[
\boxed{
N_{\mathrm{cold}}
\ll
\left|
\mathcal D_{\mathrm{refined}}
\right|,
\qquad
T_{\mathrm{cold}}
\text{ deliberately limited}
}
]

[
\operatorname{SelectSmall}
==========================

\mathsf U.
]

[
\underbrace{
\min
\left(
N_{\mathrm{cold}},
T_{\mathrm{cold}}
\right)
}_{\texttt{/* preserve RL exploration */}}
]



---

[
\boxed{
\textsc{Algorithm II: Thinking-Mode-Fusion Preprocessing}
}
]

[
\texttt{/INITIAL STATE}
]

[
\theta_{\mathrm R}
==================

\theta_{\mathrm{ReasoningRL}},
]

[
\theta_{\mathrm F}^{(0)}
\leftarrow
\theta_{\mathrm R}.
]

[
\mathcal Q_{\mathrm{S1}}
========================

\text{Stage-1 query set}.
]

[
\nabla_{\theta_{\mathrm R}}
\mathcal J_{\mathrm{data\ generation}}
======================================

\mathbf 0.
]



---

[
\texttt{/THINKING DATA}
]

[
q_i^{\mathrm{think}}
\sim
\mathcal Q_{\mathrm{S1}}.
]

[
y_{i,n}^{\mathrm R}
\sim
\pi_{\theta_{\mathrm R}}
\left(
,\cdot\mid q_i^{\mathrm{think}};
\tau_{\mathrm R},
p_{\mathrm R},
k_{\mathrm R},
\ell_{\mathrm R}^{\max}
\right).
]

[
\left(
c_{i,n}^{\mathrm R},
a_{i,n}^{\mathrm R}
\right)
=======

\operatorname{Split}*{\langle/\mathrm{think}\rangle}
\left(
y*{i,n}^{\mathrm R}
\right).
]

[
u_{i,n}^{\mathrm{think}}
========================

\operatorname{AcceptThink}
\left(
q_i^{\mathrm{think}},
c_{i,n}^{\mathrm R},
a_{i,n}^{\mathrm R}
\right).
]

[
\boxed{
\mathcal D_{\mathrm{think}}
===========================

\left{
\left(
q_i^{\mathrm{think}},
c_{i,n}^{\mathrm R},
a_{i,n}^{\mathrm R},
\mathrm{think}
\right)
:
u_{i,n}^{\mathrm{think}}=1
\right}
}
]

[
\operatorname{AcceptThink}
==========================

\mathsf U,
]

[
\left(
\tau_{\mathrm R},
p_{\mathrm R},
k_{\mathrm R},
\ell_{\mathrm R}^{\max},
N_{\mathrm R}
\right)
=======

\mathsf U.
]

[
\underbrace{
y^{\mathrm R}\sim\pi_{\theta_{\mathrm R}}
}_{\texttt{/* Stage-2 rejection sampling */}}
]



---

[
\texttt{/NONTHINK RAW}
]

[
r_j^{\mathrm{nt},0}
===================

\left(
q_j,
a_j,
d_j,
\ell_j,
m_j
\right),
]

[
d_j
\in
\mathfrak D_{\mathrm{nt}},
]

[
\mathfrak D_{\mathrm{nt}}
=========================

\left{
\begin{array}{l}
\mathrm{coding},
\mathrm{mathematics},
\mathrm{instruction\ following},
\mathrm{multilingual},
\
\mathrm{creative\ writing},
\mathrm{question\ answering},
\mathrm{role\ playing},
\mathrm{translation}
\end{array}
\right}.
]

[
\mathcal D_{\mathrm{nt},0}
==========================

\left{
r_j^{\mathrm{nt},0}
\right}*{j=1}^{N*{\mathrm{nt},0}}.
]



---

[
\texttt{/GENERATE CHECKLIST}
]

[
\kappa_j
========

\operatorname{ChecklistGen}
\left(
q_j,
d_j
\right),
]

[
\kappa_j
========

\left(
\kappa_{j,1},
\ldots,
\kappa_{j,K_j}
\right).
]

[
s_{j,k}^{\mathrm{check}}
========================

\operatorname{Check}
\left(
\kappa_{j,k},
q_j,
a_j
\right)
\in
{0,1,\bot}.
]

[
S_j^{\mathrm{check}}
====================

\operatorname{Aggregate}
\left(
\left{
s_{j,k}^{\mathrm{check}}
\right}_{k=1}^{K_j}
\right).
]

[
u_j^{\mathrm{nt}}
=================

\mathbf 1
\left[
S_j^{\mathrm{check}}
\in
\mathcal A_{\mathrm{check}}
\right].
]

[
\boxed{
\mathcal D_{\mathrm{nt},1}
==========================

\left{
r_j^{\mathrm{nt},0}
:
u_j^{\mathrm{nt}}=1
\right}
}
]

[
\left(
\operatorname{ChecklistGen},
\operatorname{Check},
\operatorname{Aggregate},
\mathcal A_{\mathrm{check}}
\right)
=======

\mathsf U.
]



---

[
\texttt{/TRANSLATION UPWEIGHT}
]

[
\mathfrak L_{\mathrm{low}}
==========================

\text{low-resource language set}.
]

[
w_j^{\mathrm{nt}}
=================

\mathcal W_{\mathrm{nt}}
\left(
d_j,\ell_j,S_j^{\mathrm{check}}
\right).
]

[
d_j=\mathrm{translation}
\land
\ell_j\in\mathfrak L_{\mathrm{low}}
\Longrightarrow
w_j^{\mathrm{nt}}
\uparrow.
]

[
\mathfrak L_{\mathrm{low}}
==========================

\mathsf U,
\qquad
\mathcal W_{\mathrm{nt}}
========================

\mathsf U.
]

[
\mathcal D_{\mathrm{nonthink}}
\sim
\operatorname{Categorical}
\left(
\left{
w_j^{\mathrm{nt}}
\right}
\right).
]



---

[
\texttt{/FUSION MIX}
]

[
\mathcal D_{\mathrm{fusion}}
============================

\mathcal D_{\mathrm{think}}
\uplus
\mathcal D_{\mathrm{nonthink}}.
]

[
\lambda_{\mathrm{think}}
+
\lambda_{\mathrm{nonthink}}
===========================

1.

]

[
\Pr
\left[
r\sim\mathcal D_{\mathrm{fusion}}
\right]
=======

\begin{cases}
\lambda_{\mathrm{think}},
&
r\in\mathcal D_{\mathrm{think}},
\
\lambda_{\mathrm{nonthink}},
&
r\in\mathcal D_{\mathrm{nonthink}}.
\end{cases}
]

[
\left(
\lambda_{\mathrm{think}},
\lambda_{\mathrm{nonthink}}
\right)
=======

\mathsf U.
]

[
\operatorname{DomainWeights}_{\mathrm{fusion}}
==============================================

\mathsf U.
]

---

[
\boxed{
\textsc{Algorithm III: Mode-Control Serialization}
}
]

[
\texttt{/SPECIAL TOKENS}
]

[
e_{\mathrm{EOT}}
================

# 151,643

\operatorname{id}
\left(
\texttt{<|endoftext|>}
\right),
]

[
e_{\mathrm{IS}}
===============

# 151,644

\operatorname{id}
\left(
\texttt{<|im_start|>}
\right),
]

[
e_{\mathrm{IE}}
===============

# 151,645

\operatorname{id}
\left(
\texttt{<|im_end|>}
\right),
]

[
e_{\mathrm{TH}}
===============

# 151,667

\operatorname{id}
\left(
\texttt{<think>}
\right),
]

[
e_{\mathrm{TE}}
===============

# 151,668

\operatorname{id}
\left(
\texttt{</think>}
\right).
]

[
e_{\mathrm{EOS}}
================

e_{\mathrm{IE}},
\qquad
e_{\mathrm{PAD}}
================

e_{\mathrm{EOT}}.
]

([Hugging Face][2])

---

[
\texttt{/MODE FLAGS}
]

[
f
\in
\left{
\epsilon,
\texttt{/think},
\texttt{/no_think}
\right}.
]

[
m_0
===

\mathrm{think}.
]

[
m_j
===

\begin{cases}
\mathrm{think},
&
f_j=\texttt{/think},
\
\mathrm{nonthink},
&
f_j=\texttt{/no_think},
\
m_{j-1},
&
f_j=\epsilon.
\end{cases}
]

[
\boxed{
m_j
===

\operatorname{Mode}
\left(
\operatorname{LastFlag}
\left(
f_1,\ldots,f_j
\right)
\right)
}
]

[
\operatorname{LastFlag}(\varnothing)
====================================

\mathrm{think}.
]

[
f_j
\text{ may occur in }
\left{
\mathrm{system},
\mathrm{user}
\right}.
]

[
\Pr[f_j=\texttt{/think}],
\quad
\Pr[f_j=\texttt{/no_think}]
===========================

\mathsf U.
]



---

[
\texttt{/THINK SAMPLE}
]

[
\chi_i^{\mathrm{think}}
=======================

\left[
\begin{array}{c}
\texttt{<|im_start|>user}\backslash n
\
q_i
;\Vert;
f_i^{\mathrm{think}}
\
\texttt{<|im_end|>}\backslash n
\
\texttt{<|im_start|>assistant}\backslash n
\
\texttt{<think>}\backslash n
\
c_i
\
\texttt{</think>}\backslash n\backslash n
\
a_i
\
\texttt{<|im_end|>}
\end{array}
\right].
]

[
f_i^{\mathrm{think}}
\in
\left{
\epsilon,
\texttt{/think}
\right}.
]

[
\Pr
\left[
f_i^{\mathrm{think}}=\epsilon
\right]

>

0.

]

[
\underbrace{
f_i^{\mathrm{think}}=\epsilon
}_{\texttt{/* thinking is default */}}
]



---

[
\texttt{/NONTHINK SAMPLE}
]

[
\chi_i^{\mathrm{nonthink}}
==========================

\left[
\begin{array}{c}
\texttt{<|im_start|>user}\backslash n
\
q_i
;\Vert;
\texttt{/no_think}
\
\texttt{<|im_end|>}\backslash n
\
\texttt{<|im_start|>assistant}\backslash n
\
\texttt{<think>}\backslash n
\
\epsilon
\
\texttt{</think>}\backslash n\backslash n
\
a_i
\
\texttt{<|im_end|>}
\end{array}
\right].
]

[
\boxed{
c_i^{\mathrm{nonthink}}
=======================

\epsilon
}
]

[
\underbrace{
\texttt{<think>}\epsilon\texttt{</think>}
}_{\texttt{/* preserve format consistency */}}
]



---

[
\texttt{/MULTITURN}
]

[
\mathcal C_i
============

\left(
m_{i,1},
\ldots,
m_{i,J_i}
\right),
]

[
m_{i,j}
=======

\left(
r_{i,j},
u_{i,j},
c_{i,j},
a_{i,j},
f_{i,j}
\right),
]

[
r_{i,j}
\in
\left{
\mathrm{system},
\mathrm{user},
\mathrm{assistant}
\right}.
]

[
\chi_i^{\mathrm{multi}}
=======================

\operatorname{ChatML}
\left(
\mathcal C_i
\right).
]

[
\operatorname{Mode}
\left(
a_{i,j}
\right)
=======

\operatorname{Mode}
\left(
\operatorname{LastFlag}
\left(
f_{i,1:j}
\right)
\right).
]

[
f_{i,j}
\sim
\operatorname{RandomInsert}
\left(
\texttt{/think},
\texttt{/no_think},
\epsilon
\right).
]

[
\operatorname{RandomInsert}
===========================

\mathsf U.
]



---

[
\texttt{/HF VERIFY}
]

[
\operatorname{HFTemplate}
\left(
\mathcal C;
\operatorname{enable_thinking}=0
\right)
\supset
\texttt{<think>}\backslash n\backslash n
\texttt{</think>}\backslash n\backslash n.
]

[
\operatorname{HFTemplate}
\left(
\mathcal C;
\operatorname{enable_thinking}=1
\right)
\Rightarrow
\text{thinking-enabled generation}.
]

[
\mathsf E
\left(
\operatorname{HFTemplate}
\right)
=======

\mathsf C.
]

[
\boxed{
\operatorname{HFInferenceTemplate}
\neq
\operatorname{Proof}
\left(
\operatorname{ExactProductionSFTMask}
\right)
}
]

([Hugging Face][2])

---

[
\texttt{/BUDGET BOUNDARY}
]

[
\mathsf{ExplicitBudgetSupervision}_{\mathrm{FusionSFT}}
=======================================================

0.

]

[
\mathsf{StopThinkingAbility}
============================

\operatorname{Emergent}
\left(
\mathsf{ThinkingModeFusion}
\right).
]

[
\boxed{
\mathsf{StopThinkingInstruction}
\not\Rightarrow
\mathsf{ExplicitSFTTarget}
}
]



---

[
\boxed{
\textsc{Algorithm IV: Tokenization and Label State}
}
]

[
\texttt{/TOKENIZE}
]

[
x_i
===

\mathsf T_{\mathrm{Qwen}}
\left(
\chi_i
\right)
=======

\left(
x_{i,1},
\ldots,
x_{i,L_i}
\right).
]

[
x_{i,t}
\in
\left{
0,\ldots,V_{\mathrm M}-1
\right}.
]

[
\mathsf T_{\mathrm{Qwen}}
=========================

\operatorname{BBPE}.
]

[
\operatorname{add_bos}
======================

0,
\qquad
\operatorname{add_prefix_space}
===============================

0.

]

[
x_i
===

\left[
x_i^{\mathrm{system}};
x_i^{\mathrm{user}};
x_i^{\mathrm{think}};
x_i^{\mathrm{answer}};
x_i^{\mathrm{eos}}
\right].
]



---

[
\texttt{/SPAN MAP}
]

[
\rho_{i,t}
\in
\left{
\mathrm{system},
\mathrm{user},
\mathrm{think},
\mathrm{answer},
\mathrm{eos},
\mathrm{padding}
\right}.
]

[
I_{i,t}^{(r)}
=============

\mathbf 1
\left[
\rho_{i,t}=r
\right].
]

[
\sum_r
I_{i,t}^{(r)}
=============

1.

]

[
\begin{aligned}
I_{i,t}^{\mathrm{prompt}}
&=
I_{i,t}^{\mathrm{system}}
+
I_{i,t}^{\mathrm{user}},
\
I_{i,t}^{\mathrm{assistant}}
&=
I_{i,t}^{\mathrm{think}}
+
I_{i,t}^{\mathrm{answer}}
+
I_{i,t}^{\mathrm{eos}}.
\end{aligned}
]

---

[
\texttt{/TURN MAP}
]

[
j_{i,t}
\in
\left{
0,\ldots,J_i
\right}.
]

[
\mu_{i,j}^{\mathrm{turn}}
\in
{0,1}.
]

[
\mu_{i,j}^{\mathrm{turn}}=1
\iff
\text{assistant turn }j
\text{ contributes to SFT loss}.
]

[
\left{
\mu_{i,j}^{\mathrm{turn}}
\right}
=======

\mathsf U.
]

[
\boxed{
\mathsf{AllAssistantTurns}
\quad\lor\quad
\mathsf{LastAssistantTurn}
\quad\lor\quad
\mathsf{CustomTurns}
====================

\mathsf U
}
]

---

[
\texttt{/LOSS WEIGHTS}
]

[
\alpha_{\mathrm{system}},
\alpha_{\mathrm{user}},
\alpha_{\mathrm{think}},
\alpha_{\mathrm{answer}},
\alpha_{\mathrm{eos}}
\in
\mathbb R_{\ge0}.
]

[
w_{i,t}
=======

\mu_{i,j_{i,t}}^{\mathrm{turn}}
\left[
\alpha_{\mathrm{system}}
I_{i,t}^{\mathrm{system}}
+
\alpha_{\mathrm{user}}
I_{i,t}^{\mathrm{user}}
+
\alpha_{\mathrm{think}}
I_{i,t}^{\mathrm{think}}
+
\alpha_{\mathrm{answer}}
I_{i,t}^{\mathrm{answer}}
+
\alpha_{\mathrm{eos}}
I_{i,t}^{\mathrm{eos}}
\right].
]

[
w_{i,t}
=======

0
\qquad
\text{if }
\rho_{i,t}=\mathrm{padding}.
]

[
\boxed{
\left(
\alpha_{\mathrm{system}},
\alpha_{\mathrm{user}},
\alpha_{\mathrm{think}},
\alpha_{\mathrm{answer}},
\alpha_{\mathrm{eos}},
\mu_{i,j}^{\mathrm{turn}}
\right)
=======

\mathsf U
}
]

[
\boxed{
\alpha_{\mathrm{prompt}}=0
}
]

[
\text{is not established as a Qwen3-production fact}.
]

---

[
\texttt{/SHIFT LABELS}
]

[
X_i
===

\left(
x_{i,1},
\ldots,
x_{i,L_i-1}
\right),
]

[
Y_i
===

\left(
x_{i,2},
\ldots,
x_{i,L_i}
\right).
]

[
W_i
===

\left(
w_{i,2},
\ldots,
w_{i,L_i}
\right).
]

[
Y_{i,t}
=======

x_{i,t+1}.
]

---

[
\texttt{/LENGTH POLICY}
]

[
L_{\mathrm{cold}}^{\max}
========================

\mathsf U,
\qquad
L_{\mathrm{fusion}}^{\max}
==========================

\mathsf U.
]

[
\Psi_L
\in
\left{
\operatorname{truncate},
\operatorname{split},
\operatorname{reject},
\operatorname{pack}
\right}.
]

[
\Psi_L^{\mathrm{cold}}
======================

\mathsf U,
\qquad
\Psi_L^{\mathrm{fusion}}
========================

\mathsf U.
]

[
\tilde x_i
==========

\Psi_L(x_i).
]

---

[
\boxed{
\textsc{Algorithm V: SFT Batch Construction}
}
]

[
\texttt{/DISTRIBUTED STATE}
]

[
R
=

\text{data-parallel ranks},
]

[
B_{\mu}
=======

\text{sequences per microbatch},
]

[
G
=

\text{gradient-accumulation steps}.
]

[
B_{\mathrm{global}}
===================

R,B_{\mu},G.
]

[
\left(
R,
B_{\mu},
G,
B_{\mathrm{global}}
\right)_{\mathrm{cold}}
=======================

\mathsf U,
]

[
\left(
R,
B_{\mu},
G,
B_{\mathrm{global}}
\right)_{\mathrm{fusion}}
=========================

\mathsf U.
]

---

[
\texttt{/BATCH MODE}
]

[
\beta_{\mathrm{batch}}
\in
\left{
\mathrm{padding},
\mathrm{packing},
\mathrm{padding\text{-}free}
\right}.
]

[
\boxed{
\beta_{\mathrm{batch}}^{\mathrm{production}}
============================================

\mathsf U
}
]

---

[
\texttt{/PAD BATCH}
]

[
L_{\mathcal B}
==============

\max_{i\in\mathcal B}
L_i.
]

[
X_{b,t}^{\mathrm{pad}}
======================

\begin{cases}
x_{i_b,t},
&
t\le L_{i_b},
\
e_{\mathrm{PAD}},
&
t>L_{i_b},
\end{cases}
]

[
A_{b,t}^{\mathrm{pad}}
======================

\mathbf 1
\left[
t\le L_{i_b}
\right],
]

[
W_{b,t}^{\mathrm{pad}}
======================

\begin{cases}
w_{i_b,t},
&
t\le L_{i_b},
\
0,
&
t>L_{i_b}.
\end{cases}
]

[
X^{\mathrm{pad}}
\in
\mathbb N^{B_{\mu}\times L_{\mathcal B}}.
]

---

[
\texttt{/PACK BATCH}
]

[
\bar X
======

X_{i_1}
\Vert
X_{i_2}
\Vert
\cdots
\Vert
X_{i_K}.
]

[
s_0=0,
\qquad
s_k
===

\sum_{j=1}^{k}
L_{i_j}.
]

[
\operatorname{seg}(t)
=====================

k
\iff
s_{k-1}<t\le s_k.
]

[
A_{t,u}^{\mathrm{pack}}
=======================

\mathbf 1[u\le t]
\mathbf 1
\left[
\operatorname{seg}(u)
=====================

\operatorname{seg}(t)
\right].
]

[
P_t^{\mathrm{pack}}
===================

t-s_{\operatorname{seg}(t)-1}-1.
]

[
W_t^{\mathrm{pack}}
===================

w_{\operatorname{seg}(t),P_t^{\mathrm{pack}}}.
]

[
\boxed{
A_{t,u}^{\mathrm{pack}}=0
\quad
\text{across distinct samples}
}
]

[
\operatorname{ProductionPackingMask}
====================================

\mathsf U.
]

---

[
\texttt{/BATCH SAMPLER}
]

[
\mathcal B_{t,r,g}^{(s)}
========================

\operatorname{BatchSampler}^{(s)}
\left(
\mathcal D_s,
\nu_{t,r,g}
\right),
]

[
s
\in
\left{
\mathrm{cold},
\mathrm{fusion}
\right}.
]

[
\operatorname{BatchSampler}^{(s)}
=================================

\mathsf U.
]

[
\operatorname{LengthBucketing}^{(s)}
====================================

\mathsf U.
]

[
\operatorname{ShuffleSeed}^{(s)}
================================

\mathsf U.
]

---

[
\boxed{
\textsc{Algorithm VI: Black-Box SFT Forward}
}
]

[
\texttt{/FORWARD}
]

[
Z_{t,r,g}^{(s)}
===============

\mathsf M_{\theta_t^{(s)}}
\left(
X_{t,r,g}^{(s)},
A_{t,r,g}^{(s)},
P_{t,r,g}^{(s)}
\right).
]

[
Z_{t,r,g}^{(s)}
\in
\mathbb R^{
B_{\mu}
\times
L
\times
V_{\mathrm M}
}.
]

[
p_{\theta_t}^{(s)}
\left(
v
\mid
X_{\le \tau}
\right)
=======

\frac{
\exp
Z_{t,r,g,\tau,v}^{(s)}
}{
\sum_{u=1}^{V_{\mathrm M}}
\exp
Z_{t,r,g,\tau,u}^{(s)}
}.
]

[
\sum_{v=1}^{V_{\mathrm M}}
p_{\theta_t}^{(s)}
\left(
v\mid X_{\le\tau}
\right)
=======

1.

]

---

[
\texttt{/TOKEN NLL}
]

[
\ell_{b,\tau}^{(s)}
===================

*

\log
p_{\theta_t}^{(s)}
\left(
Y_{b,\tau}^{(s)}
\mid
X_{b,\le\tau}^{(s)}
\right).
]

[
\ell_{b,\tau}^{(s)}
===================

*

Z_{b,\tau,Y_{b,\tau}}^{(s)}
+
\log
\sum_{v=1}^{V_{\mathrm M}}
\exp
Z_{b,\tau,v}^{(s)}.
]

---

[
\texttt{/MASKED NLL}
]

[
\mathcal N_{t,r,g}^{(s)}
========================

\sum_{b=1}^{B_{\mu}}
\sum_{\tau=1}^{L-1}
W_{b,\tau}^{(s)}
\ell_{b,\tau}^{(s)}.
]

[
Z_{t,r,g}^{(s)}
===============

\mathsf{Normalize}^{(s)}
\left(
W^{(s)},
L,
B_{\mu}
\right).
]

[
\widehat{\mathcal L}_{\mathrm{token},t,r,g}^{(s)}
=================================================

\frac{
\mathcal N_{t,r,g}^{(s)}
}{
Z_{t,r,g}^{(s)}
}.
]

[
\mathsf{Normalize}^{(s)}
\in
\left{
\sum_{b,\tau}W_{b,\tau},
B_{\mu},
B_{\mu}L,
\sum_b
\frac{\sum_\tau W_{b,\tau}\ell_{b,\tau}}
{\sum_\tau W_{b,\tau}}
\right}.
]

[
\boxed{
\mathsf{Normalize}^{(s)}
========================

\mathsf U
}
]

---

[
\texttt{/COLD OBJECTIVE}
]

[
\widehat{\mathcal L}_{\mathrm{ColdSFT}}
\left(
\theta
\right)
=======

*

\frac{
\displaystyle
\sum_{(q,c,a)\in\mathcal B_{\mathrm{cold}}}
\sum_{\tau}
W_{\tau}^{\mathrm{cold}}
\log
p_{\theta}
\left(
x_{\tau+1}
\mid
x_{\le\tau}
\right)
}{
Z_{\mathrm{cold}}
}.
]

[
\boxed{
\mathcal L_{\mathrm{ColdSFT}}^{\mathrm{exact}}
==============================================

\mathsf U
}
]

[
\boxed{
W_{\tau}^{\mathrm{cold}},
;
Z_{\mathrm{cold}},
;
\operatorname{EOSLoss}*{\mathrm{cold}},
;
\operatorname{ReasoningWeight}*{\mathrm{cold}},
;
\operatorname{AnswerWeight}_{\mathrm{cold}}
===========================================

\mathsf U
}
]

---

[
\texttt{/FUSION OBJECTIVE}
]

[
\widehat{\mathcal L}_{\mathrm{FusionSFT}}
\left(
\theta
\right)
=======

*

\frac{
\displaystyle
\sum_{r\in\mathcal B_{\mathrm{fusion}}}
\sum_{\tau}
W_{\tau}^{\mathrm{fusion}}
\log
p_{\theta}
\left(
x_{\tau+1}
\mid
x_{\le\tau}
\right)
}{
Z_{\mathrm{fusion}}
}.
]

[
\mathcal B_{\mathrm{fusion}}
\sim
\lambda_{\mathrm{think}}
\mathcal D_{\mathrm{think}}
+
\lambda_{\mathrm{nonthink}}
\mathcal D_{\mathrm{nonthink}}.
]

[
\boxed{
\mathcal L_{\mathrm{FusionSFT}}^{\mathrm{exact}}
================================================

\mathsf U
}
]

[
\boxed{
W_{\tau}^{\mathrm{fusion}},
;
Z_{\mathrm{fusion}},
;
\operatorname{EOSLoss}_{\mathrm{fusion}},
;
\operatorname{EmptyThinkLoss},
;
\operatorname{ModeFlagLoss}
===========================

\mathsf U
}
]

---

[
\texttt{/TOTAL OBJECTIVE}
]

[
\delta_{\mathrm{GBLB}}^{(s)}
\in
{0,1},
]

[
\mathcal L_{\mathrm{audit}}^{(s)}
=================================

\mathcal L_{\mathrm{token}}^{(s)}
+
\delta_{\mathrm{GBLB}}^{(s)}
\lambda_{\mathrm{GBLB}}^{(s)}
\mathcal L_{\mathrm{GBLB}}^{(s)}
+
\mathcal R_{\mathrm{other}}^{(s)}.
]

[
\boxed{
\left(
\delta_{\mathrm{GBLB}}^{(s)},
\lambda_{\mathrm{GBLB}}^{(s)},
\mathcal L_{\mathrm{GBLB}}^{(s)},
\mathcal R_{\mathrm{other}}^{(s)}
\right)_{\mathrm{SFT}}
======================

\mathsf U
}
]

[
\boxed{
\mathcal L_{\mathrm{total,Qwen3}}^{(s)}
=======================================

\operatorname{UNDISCLOSED}
}
]

[
\boxed{
\mathcal L_{\mathrm{total,Qwen3}}^{(s)}
\neq
\mathcal L_{\mathrm{token}}^{(s)}
\quad
\text{unless explicitly established}
}
]

[
\underbrace{
\mathcal L_{\mathrm{GBLB}}
}_{\texttt{/* architecture-level reported */}}
]

[
\underbrace{
\delta_{\mathrm{GBLB}}^{\mathrm{SFT}}
}_{\texttt{/* stage retention undisclosed */}}
]



---

[
\boxed{
\textsc{Algorithm VII: Gradient and Optimizer Loop}
}
]

[
\texttt{/INITIALIZE COLD}
]

[
\theta_{0}^{\mathrm{cold}}
\leftarrow
\theta_{\mathrm B}.
]

[
\omega_{0}^{\mathrm{cold}}
\leftarrow
\operatorname{InitOptimizer}
\left(
\theta_{\mathrm B}
\right).
]

[
\nu_{0}^{\mathrm{cold}}
\leftarrow
\operatorname{InitSampler}
\left(
\mathcal D_{\mathrm{cold}}
\right).
]

---

[
\texttt{/INITIALIZE FUSION}
]

[
\theta_{0}^{\mathrm{fusion}}
\leftarrow
\theta_{\mathrm R}.
]

[
\omega_{0}^{\mathrm{fusion}}
\leftarrow
\operatorname{InitOptimizer}
\left(
\theta_{\mathrm R}
\right).
]

[
\nu_{0}^{\mathrm{fusion}}
\leftarrow
\operatorname{InitSampler}
\left(
\mathcal D_{\mathrm{fusion}}
\right).
]

[
\underbrace{
\theta_{0}^{\mathrm{fusion}}
============================

\theta_{\mathrm R}
}_{\texttt{/* continual SFT */}}
]



---

[
\texttt{/ZERO GRAD}
]

[
g_{t,r}^{(s,0)}
===============

\mathbf 0.
]

---

[
\texttt{/MICROBATCH LOOP}
]

[
\forall g\in{1,\ldots,G}:
]

[
\mathcal B_{t,r,g}^{(s)}
\leftarrow
\operatorname{BatchSampler}^{(s)}
\left(
\mathcal D_s,
\nu_{t,r,g}^{(s)}
\right),
]

[
\left(
X_{t,r,g}^{(s)},
Y_{t,r,g}^{(s)},
A_{t,r,g}^{(s)},
P_{t,r,g}^{(s)},
W_{t,r,g}^{(s)}
\right)
\leftarrow
\operatorname{Collate}^{(s)}
\left(
\mathcal B_{t,r,g}^{(s)}
\right),
]

[
Z_{t,r,g}^{(s)}
\leftarrow
\mathsf M_{\theta_t^{(s)}}
\left(
X_{t,r,g}^{(s)},
A_{t,r,g}^{(s)},
P_{t,r,g}^{(s)}
\right),
]

[
\widehat{\mathcal L}*{t,r,g}^{(s)}
\leftarrow
\operatorname{StageLoss}^{(s)}
\left(
Z*{t,r,g}^{(s)},
Y_{t,r,g}^{(s)},
W_{t,r,g}^{(s)}
\right),
]

[
g_{t,r,g}^{(s)}
===============

\nabla_{\theta_t^{(s)}}
\widehat{\mathcal L}_{t,r,g}^{(s)}.
]

---

[
\texttt{/ACCUMULATE}
]

[
g_{t,r}^{(s)}
=============

\sum_{g=1}^{G}
\gamma_{t,r,g}^{(s)}
g_{t,r,g}^{(s)}.
]

[
\gamma_{t,r,g}^{(s)}
====================

\begin{cases}
G^{-1},
&
\text{microbatch mean},
[1mm]
\displaystyle
\frac{
\sum_{b,\tau}
W_{t,r,g,b,\tau}^{(s)}
}{
\sum_{g',b,\tau}
W_{t,r,g',b,\tau}^{(s)}
},
&
\text{token-weighted mean},
[4mm]
\operatorname{other},
&
\mathsf U.
\end{cases}
]

[
\boxed{
\gamma_{t,r,g}^{(s)}
====================

\mathsf U
}
]

---

[
\texttt{/REDUCE}
]

[
\bar g_t^{(s)}
==============

\operatorname{ReduceGrad}
\left(
\left{
g_{t,r}^{(s)}
\right}_{r=1}^{R}
\right).
]

[
\operatorname{ReduceGrad}
\in
\left{
\operatorname{AllReduceMean},
\operatorname{ReduceScatter},
\operatorname{ShardedReduce}
\right}.
]

[
\operatorname{ReduceGrad}_{\mathrm{production}}
===============================================

\mathsf U.
]

---

[
\texttt{/CLIP}
]

[
\tilde g_t^{(s)}
================

\begin{cases}
\bar g_t^{(s)}
\min
\left(
1,
\frac{
c_{\mathrm{grad}}^{(s)}
}{
\left|
\bar g_t^{(s)}
\right|*2
}
\right),
&
c*{\mathrm{grad}}^{(s)}<\infty,
[4mm]
\bar g_t^{(s)},
&
c_{\mathrm{grad}}^{(s)}=\infty.
\end{cases}
]

[
c_{\mathrm{grad}}^{(s)}
=======================

\mathsf U.
]

---

[
\texttt{/UPDATE}
]

[
\left(
\theta_{t+1}^{(s)},
\omega_{t+1}^{(s)}
\right)
=======

\operatorname{OPT}^{(s)}
\left(
\theta_t^{(s)},
\omega_t^{(s)},
\tilde g_t^{(s)},
\eta_t^{(s)}
\right).
]

[
\eta_t^{(s)}
============

\operatorname{Schedule}^{(s)}
\left(
t
\right).
]

[
\boxed{
\operatorname{OPT}^{(s)}
========================

# \operatorname{Schedule}^{(s)}

# \eta_t^{(s)}

\mathsf U
}
]

[
\boxed{
\operatorname{WeightDecay}^{(s)}
================================

# \operatorname{Betas}^{(s)}

# \operatorname{Epsilon}^{(s)}

# \operatorname{Warmup}^{(s)}

\mathsf U
}
]

---

[
\texttt{/ADVANCE}
]

[
\nu_{t+1}^{(s)}
===============

\operatorname{AdvanceSampler}
\left(
\nu_t^{(s)}
\right).
]

[
\zeta_{t+1}^{(s)}
=================

\operatorname{AdvanceRNG}
\left(
\zeta_t^{(s)}
\right).
]

[
\mathfrak S_{t+1}^{(s)}
=======================

\left(
\theta_{t+1}^{(s)},
\omega_{t+1}^{(s)},
\nu_{t+1}^{(s)},
\zeta_{t+1}^{(s)}
\right).
]

---

[
\texttt{/STOP COLD}
]

[
t
=

T_{\mathrm{cold}}
\Longrightarrow
\theta_{\mathrm C}
==================

\theta_{T_{\mathrm{cold}}}^{\mathrm{cold}}.
]

[
T_{\mathrm{cold}}
=================

\mathsf U.
]

[
\boxed{
T_{\mathrm{cold}}
\text{ is intentionally limited}
}
]



---

[
\texttt{/STOP FUSION}
]

[
t
=

T_{\mathrm{fusion}}
\Longrightarrow
\theta_{\mathrm F}
==================

\theta_{T_{\mathrm{fusion}}}^{\mathrm{fusion}}.
]

[
T_{\mathrm{fusion}}
===================

\mathsf U.
]

[
\operatorname{EpochCount}_{\mathrm{fusion}}
===========================================

\mathsf U.
]

---

[
\boxed{
\textsc{Algorithm VIII: Complete External SFT Program}
}
]

[
\boxed{
\begin{aligned}
\mathcal Q_0
&\xrightarrow{
\mathsf M_{\mathsf{Qwen2.5\text{-}72B}}
}
\mathcal Q_{\mathrm{filtered}}
\
&\xrightarrow{
\operatorname{DomainBalance}
}
\mathcal Q_{\mathrm{balanced}}
\
&\xrightarrow{
\operatorname{TrainValSplit}
}
\left(
\mathcal Q_{\mathrm{train}},
\mathcal Q_{\mathrm{val}}
\right)
\
&\xrightarrow{
y_{i,n}\sim
\pi_{\mathsf{QwQ\text{-}32B}
}
}
\mathcal D_{\mathrm{candidate}}
\
&\xrightarrow{
\operatorname{Verify}
+
\operatorname{SixFilters}
}
\mathcal D_{\mathrm{refined}}
\
&\xrightarrow{
\operatorname{SelectSmall}
}
\mathcal D_{\mathrm{cold}}.
\end{aligned}
}
]

[
\boxed{
\theta_{\mathrm B}
\xrightarrow[
\mathcal D_{\mathrm{cold}}
]{
\widehat{\mathcal L}*{\mathrm{ColdSFT}}
}
\theta*{\mathrm C}
}
]

[
\boxed{
\theta_{\mathrm C}
\xrightarrow{
\mathcal J_{\mathrm{ReasoningRL}}
}
\theta_{\mathrm R}
}
]

[
\boxed{
\begin{aligned}
\mathcal Q_{\mathrm{S1}}
&\xrightarrow{
y\sim\pi_{\theta_{\mathrm R}}
}
\mathcal D_{\mathrm{think}},
\
\mathcal D_{\mathrm{nt},0}
&\xrightarrow{
\operatorname{ChecklistFilter}
+
\operatorname{TranslationUpweight}
}
\mathcal D_{\mathrm{nonthink}},
\
\mathcal D_{\mathrm{fusion}}
&=
\mathcal D_{\mathrm{think}}
\uplus
\mathcal D_{\mathrm{nonthink}}.
\end{aligned}
}
]

[
\boxed{
\theta_{\mathrm R}
\xrightarrow[
\mathcal D_{\mathrm{fusion}}
]{
\widehat{\mathcal L}*{\mathrm{FusionSFT}}
}
\theta*{\mathrm F}
}
]

---

[
\texttt{/FINAL AUDIT}
]

[
\boxed{
\begin{aligned}
&
N_{\mathrm{cand}},
;
N_{\mathrm{cold}},
;
T_{\mathrm{cold}},
;
T_{\mathrm{fusion}},
\
&
L_{\mathrm{cold}}^{\max},
;
L_{\mathrm{fusion}}^{\max},
;
B_{\mu},
;
G,
;
R,
\
&
\lambda_{\mathrm{think}},
;
\lambda_{\mathrm{nonthink}},
;
\pi_{\mathrm{domain}},
\
&
\alpha_{\mathrm{system}},
;
\alpha_{\mathrm{user}},
;
\alpha_{\mathrm{think}},
;
\alpha_{\mathrm{answer}},
;
\alpha_{\mathrm{eos}},
\
&
\mu_{i,j}^{\mathrm{turn}},
;
Z_{\mathrm{cold}},
;
Z_{\mathrm{fusion}},
\
&
\operatorname{Packing},
;
\operatorname{Truncation},
;
\operatorname{SequenceNormalization},
\
&
\operatorname{OPT},
;
\eta_t,
;
\operatorname{Warmup},
;
\operatorname{WeightDecay},
;
\operatorname{GradientClip},
\
&
\delta_{\mathrm{GBLB}}^{\mathrm{cold}},
;
\delta_{\mathrm{GBLB}}^{\mathrm{fusion}},
;
\lambda_{\mathrm{GBLB}}^{\mathrm{SFT}},
\
&
\mathcal L_{\mathrm{ColdSFT}}^{\mathrm{exact}},
;
\mathcal L_{\mathrm{FusionSFT}}^{\mathrm{exact}},
;
\mathcal L_{\mathrm{total,Qwen3}}^{\mathrm{SFT}}
\end{aligned}
=============

\operatorname{UNDISCLOSED}
}
]

[
\boxed{
\textsc{Reported Pipeline}
\neq
\textsc{Fully Released Training Implementation}
}
]

[1]: https://huggingface.co/Qwen/QwQ-32B?utm_source=chatgpt.com "Qwen/QwQ-32B · Hugging Face"
[2]: https://huggingface.co/Qwen/Qwen3-32B/blob/main/tokenizer_config.json "tokenizer_config.json · Qwen/Qwen3-32B at main"

[
\boxed{
\textsc{Qwen3 Flagship Reinforcement-Learning Program}
}
]

[
\texttt{/SCOPE}
]

[
\mathfrak M_{\mathrm{flagship}}
===============================

\left{
\mathsf{Qwen3\text{-}235B\text{-}A22B},
\mathsf{Qwen3\text{-}32B},
\mathsf{Qwen3\text{-}30B\text{-}A3B}
\right}.
]

[
\boxed{
\theta_{\mathrm C}
\xrightarrow{\mathcal J_{\mathrm{ReasoningRL}}}
\theta_{\mathrm R}
\xrightarrow{\mathcal L_{\mathrm{FusionSFT}}}
\theta_{\mathrm F}
\xrightarrow{\mathcal J_{\mathrm{GeneralRL}}}
\theta_{\mathrm G}
}
]

[
\mathsf M_{\theta}
:
(X,A,P)
\longmapsto
Z_{\theta},
\qquad
Z_{\theta}
\in
\mathbb R^{B\times L\times V}.
]

[
\mathsf{Inside}
\left(
\mathsf M_{\theta}
\right)
=======

\varnothing.
]

[
\mathfrak S_t
=============

\left(
\theta_t,
\omega_t,
\beta_t,
\nu_t,
\xi_t,
\zeta_t
\right),
]

[
\mathfrak S_t
\xrightarrow{\mathcal J_t}
\mathfrak S_{t+1}.
]

(\mathsf{SequentialOptimizationState}.) 

---

[
\texttt{/EVIDENCE}
]

[
\mathsf E(z)
\in
\left{
\mathsf R,
\mathsf C,
\mathsf D,
\mathsf U
\right},
]

[
\begin{aligned}
\mathsf R
&\equiv
\operatorname{REPORTED},
\
\mathsf C
&\equiv
\operatorname{CODE\text{-}VERIFIED},
\
\mathsf D
&\equiv
\operatorname{DERIVED},
\
\mathsf U
&\equiv
\operatorname{UNDISCLOSED}.
\end{aligned}
]

[
\boxed{
\mathsf{AlgorithmName}_{\mathrm{ReasoningRL}}
=============================================

\mathsf{GRPO}
}
]

[
\boxed{
\mathsf{ExactGRPOEquation}_{\mathrm{Qwen3}}
===========================================

\mathsf U
}
]

[
\boxed{
\mathcal J_{\mathrm{GRPO}}^{\mathrm{Qwen3}}
\not\stackrel{\mathsf E}{=}
\mathcal J_{\mathrm{GRPO}}^{\mathrm{DeepSeekMath}}
}
]

[
\boxed{
\mathsf{AlgorithmName}_{\mathrm{GeneralRL}}
===========================================

\mathsf U
}
]

[
\boxed{
\mathsf{ReleasedProductionRLTrainer}
====================================

# \mathsf{ReleasedProductionRLConfiguration}

\mathsf U
}
]

(\mathsf{Qwen3ReportAndRepositoryBoundary}.) ([arXiv][1])

---

[
\boxed{
\textsc{Algorithm I: Reasoning-RL Query Preprocessing}
}
]

[
\texttt{/RAW SCHEMA}
]

[
r_i^{(0)}
=========

\left(
q_i,
v_i,
a_i^{\star},
\mathcal T_i,
d_i,
m_i
\right),
\qquad
i\in{1,\ldots,N_0},
]

[
q_i\in\mathcal U,
]

[
v_i:
\left(
q_i,
y_i,
a_i^{\star},
\mathcal T_i
\right)
\longmapsto
r_i\in\mathbb R,
]

[
a_i^{\star}
===========

\text{verified reference answer},
]

[
\mathcal T_i
============

\text{code-based test cases}
\quad\lor\quad
\varnothing,
]

[
d_i
\in
\mathfrak D_{\mathrm{reason}},
]

[
\mathfrak D_{\mathrm{reason}}
\supseteq
\left{
\mathrm{mathematics},
\mathrm{code},
\mathrm{logic},
\mathrm{STEM}
\right}.
]

[
\mathcal Q_0^{\mathrm R}
========================

\left{
r_i^{(0)}
\right}_{i=1}^{N_0}.
]

(\mathsf{QueryVerifierSchema}.) ([arXiv][1])

---

[
\texttt{/DISJOINT COLD}
]

[
\mathcal Q_{\mathrm{cold}}
==========================

\left{
q:
q
\text{ used by Cold-SFT}
\right}.
]

[
c_i^{\mathrm{novel}}
====================

\mathbf 1
\left[
q_i\notin\mathcal Q_{\mathrm{cold}}
\right].
]

[
\boxed{
\mathcal Q_{\mathrm R}
\cap
\mathcal Q_{\mathrm{cold}}
==========================

\varnothing
}
]

[
\underbrace{
q_i\notin\mathcal Q_{\mathrm{cold}}
}_{\texttt{/* exclude Cold-SFT queries */}}
]

(\mathsf{ReportedCriterionOne}.) ([arXiv][1])

---

[
\texttt{/LEARNABILITY}
]

[
y_{i,n}^{\mathrm C}
\sim
\pi_{\theta_{\mathrm C}}
\left(
,\cdot\mid q_i;
\gamma_{\mathrm{eval}}
\right),
\qquad
n\in{1,\ldots,N_{\mathrm{eval}}}.
]

[
r_{i,n}^{\mathrm C}
===================

v_i
\left(
q_i,
y_{i,n}^{\mathrm C},
a_i^{\star},
\mathcal T_i
\right).
]

[
\widehat p_i^{\mathrm C}
========================

\frac{1}{N_{\mathrm{eval}}}
\sum_{n=1}^{N_{\mathrm{eval}}}
\mathbf 1
\left[
r_{i,n}^{\mathrm C}
\in
\mathcal A_i^{+}
\right].
]

[
c_i^{\mathrm{learn}}
====================

\mathsf{Learnable}_{\mathrm{Qwen3}}
\left(
\widehat p_i^{\mathrm C}
\right).
]

[
\boxed{
\mathsf{Learnable}_{\mathrm{Qwen3}}
===================================

\mathsf U
}
]

[
\boxed{
N_{\mathrm{eval}},
\gamma_{\mathrm{eval}},
\mathcal A_i^{+},
\tau_{\mathrm{learn}}^{-},
\tau_{\mathrm{learn}}^{+}
=========================

\mathsf U
}
]

[
\mathsf{Learnable}_{\mathrm{Qwen3}}
\not\stackrel{\mathsf E}{=}
\mathbf 1
\left[
0<
\widehat p_i^{\mathrm C}
<
1
\right].
]

(\mathsf{ReportedLearnabilityCriterion}.) ([arXiv][1])

---

[
\texttt{/CHALLENGE SCORE}
]

[
h_i
===

\mathsf{Difficulty}*{\mathrm{Qwen3}}
\left(
q_i,
v_i,
\pi*{\theta_{\mathrm C}}
\right).
]

[
c_i^{\mathrm{hard}}
===================

\mathbf 1
\left[
h_i
\in
\mathcal H_{\mathrm{selected}}
\right].
]

[
\boxed{
\mathsf{Difficulty}*{\mathrm{Qwen3}},
\mathcal H*{\mathrm{selected}}
==============================

\mathsf U
}
]

[
\underbrace{
h_i\uparrow
}_{\texttt{/* select maximal challenge */}}
]

(\mathsf{ReportedCriterionThree}.) ([arXiv][1])

---

[
\texttt{/DOMAIN COVERAGE}
]

[
n_d
===

\sum_{i=1}^{N_0}
\mathbf 1
\left[
d_i=d
\right],
\qquad
d\in\mathfrak D_{\mathrm{reason}}.
]

[
\operatorname{Cov}
\left(
\mathcal S
\right)
=======

\left|
\left{
d:
\exists r_i\in\mathcal S,\ d_i=d
\right}
\right|.
]

[
\mathcal S_{\mathrm{coverage}}
\in
\underset{
\mathcal S\subseteq\mathcal Q_0^{\mathrm R}
}{
\arg\max
}
;
\operatorname{Cov}
\left(
\mathcal S
\right)
]

[
\text{s.t.}
]

[
\forall r_i\in\mathcal S:
\qquad
c_i^{\mathrm{novel}}
c_i^{\mathrm{learn}}
c_i^{\mathrm{hard}}
===================

1.

]

[
\boxed{
\operatorname{DomainQuota},
\operatorname{DomainWeights},
\operatorname{CoverageObjective}
================================

\mathsf U
}
]

(\mathsf{BroadSubdomainCoverage}.) ([arXiv][1])

---

[
\texttt{/SELECT 3995}
]

[
\boxed{
\mathcal D_{\mathrm{ReasoningRL}}
=================================

\operatorname{Select}_{3995}
\left{
r_i^{(0)}:
c_i^{\mathrm{novel}}
c_i^{\mathrm{learn}}
c_i^{\mathrm{hard}}
=1
\right}
}
]

[
\boxed{
\left|
\mathcal D_{\mathrm{ReasoningRL}}
\right|
=======

3995
}
]

[
\operatorname{Select}_{3995}
============================

\mathsf U.
]

[
\underbrace{
3995
}_{\texttt{/* verified query-verifier pairs */}}
]

(\mathsf{ReportedCardinality}.) ([arXiv][1])

---

[
\boxed{
\textsc{Algorithm II: Reasoning-RL Rollout State}
}
]

[
\texttt{/INITIALIZE}
]

[
\theta_0^{\mathrm R}
\leftarrow
\theta_{\mathrm C}.
]

[
\omega_0^{\mathrm R}
\leftarrow
\operatorname{InitOptimizer}
\left(
\theta_{\mathrm C}
\right).
]

[
\beta_0
\leftarrow
\theta_0^{\mathrm R}.
]

[
\nu_0^{\mathrm R}
\leftarrow
\operatorname{InitPromptSampler}
\left(
\mathcal D_{\mathrm{ReasoningRL}}
\right).
]

[
\xi_0^{\mathrm H}
\leftarrow
\operatorname{InitEntropyController}.
]

[
\zeta_0
\leftarrow
\operatorname{InitRNG}.
]

---

[
\texttt{/PROMPT BATCH}
]

[
\mathcal Q_t
============

\left{
r_{i_b}^{(0)}
\right}_{b=1}^{B_q},
]

[
r_{i_b}^{(0)}
\sim
p_{\nu_t}^{\mathrm R}
\left(
r\mid\mathcal D_{\mathrm{ReasoningRL}}
\right).
]

[
B_q
===

\text{large},
\qquad
B_q^{\mathrm{exact}}
====================

\mathsf U.
]

[
K
=

\text{rollouts per query},
\qquad
K
=

\text{high},
\qquad
K^{\mathrm{exact}}
==================

\mathsf U.
]

[
B_{\mathrm{trajectory}}
=======================

B_qK.
]

(\mathsf{LargeBatchAndManyRollouts}.) ([arXiv][1])

---

[
\texttt{/BEHAVIOR POLICY}
]

[
\beta(t)
\le
t,
]

[
\pi_{\mathrm b,t}
=================

\pi_{\theta_{\beta(t)}}.
]

[
\beta(t)=t
\iff
\text{on-policy},
]

[
\beta(t)<t
\iff
\text{off-policy}.
]

[
\boxed{
\Pr
\left[
\beta(t)<t
\right]

>

0
}
]

[
\Delta_{t}
==========

t-\beta(t).
]

[
\boxed{
\Delta_t^{\max},
\mathbb E[\Delta_t],
\operatorname{RefreshFrequency}
===============================

\mathsf U
}
]

[
\underbrace{
\beta(t)<t
}_{\texttt{/* off-policy sample reuse */}}
]

(\mathsf{OffPolicyTrainingReported}.) 

---

[
\texttt{/ROLLOUT CONFIG}
]

[
\gamma_t^{\mathrm R}
====================

\left(
T_t,
p_t,
k_t,
m_t,
L_t^{\max},
e_{\mathrm{stop}},
\xi_t^{\mathrm H}
\right).
]

[
\boxed{
T_t,
p_t,
k_t,
m_t,
L_t^{\max}
==========

\mathsf U
}
]

[
\gamma_t^{\mathrm R}
\neq
\gamma_{\mathrm{HF\ inference}}
\quad
\text{unless established}.
]

---

[
\texttt{/SERIALIZE}
]

[
\chi_i^{\mathrm R}
==================

\operatorname{ChatML}_{\mathrm{think}}
\left(
q_i
\right).
]

[
x_i
===

\mathsf T_{\mathrm{Qwen3}}
\left(
\chi_i^{\mathrm R}
\right).
]

[
x_i
===

\left(
x_{i,1},
\ldots,
x_{i,L_i^{\mathrm p}}
\right).
]

[
\operatorname{ExactRLPromptTemplate}
====================================

\mathsf U.
]

---

[
\texttt{/SAMPLE RESPONSE}
]

[
y_{i,k}
=======

\left(
y_{i,k,1},
\ldots,
y_{i,k,T_{i,k}}
\right)
\sim
\pi_{\mathrm b,t}
\left(
,\cdot\mid x_i;
\gamma_t^{\mathrm R}
\right).
]

[
T_{i,k}
=======

\min
\left{
\tau:
y_{i,k,\tau}
\in
\mathcal E_{\mathrm{terminal}}
\right}
\wedge
L_t^{\max}.
]

[
\mathcal E_{\mathrm{terminal}}
==============================

\mathsf U.
]

[
s_{i,k,\tau}
============

\left(
x_i,
y_{i,k,<\tau}
\right).
]

[
\ell_{i,k,\tau}^{\mathrm b}
===========================

\log
\pi_{\mathrm b,t}
\left(
y_{i,k,\tau}
\mid
s_{i,k,\tau}
\right).
]

[
\boxed{
\operatorname{StoredBehaviorLogProb}
====================================

\mathsf U
}
]

---

[
\texttt{/TRAJECTORY}
]

[
\tau_{i,k}^{\mathrm R}
======================

\left(
q_i,
x_i,
y_{i,k},
T_{i,k},
v_i,
a_i^{\star},
\mathcal T_i,
\beta(t),
\left{
\ell_{i,k,\tau}^{\mathrm b}
\right}*{\tau=1}^{T*{i,k}}
\right).
]

[
\mathcal R_t^{\mathrm R}
========================

\left{
\tau_{i,k}^{\mathrm R}
:
i\in{1,\ldots,B_q},
k\in{1,\ldots,K}
\right}.
]

---

[
\boxed{
\textsc{Algorithm III: Reasoning Reward}
}
]

[
\texttt{/PARSE}
]

[
y_{i,k}
=======

\langle\mathrm{think}\rangle
c_{i,k}
\langle/\mathrm{think}\rangle
a_{i,k}.
]

[
\left(
c_{i,k},
a_{i,k}
\right)
=======

\operatorname{ParseResponse}
\left(
y_{i,k}
\right).
]

[
\operatorname{ParseResponse}_{\mathrm{RL}}
==========================================

\mathsf U.
]

---

[
\texttt{/VERIFY}
]

[
r_{i,k}^{\mathrm R}
===================

v_i
\left(
q_i,
a_{i,k},
a_i^{\star},
\mathcal T_i
\right).
]

[
r_{i,k}^{\mathrm R}
\in
\mathcal R_i.
]

[
\boxed{
\mathcal R_i,
\operatorname{RewardScale},
\operatorname{RewardClip},
\operatorname{PartialCredit},
\operatorname{FormatReward}
===========================

\mathsf U
}
]

[
r_{i,k}^{\mathrm R}
===================

r_{i,k}^{\mathrm{correct}}
+
r_{i,k}^{\mathrm{format}}
+
r_{i,k}^{\mathrm{length}}
]

[
\text{is not established}.
]

[
\boxed{
r_{i,k}^{\mathrm R}
\neq
\mathcal J_{\mathrm{GRPO}}^{\mathrm{Qwen3}}
}
]

(\mathsf{RewardObjectiveSeparation}.) 

---

[
\texttt{/GROUP REWARD}
]

[
\mathbf r_i
===========

\left(
r_{i,1}^{\mathrm R},
\ldots,
r_{i,K}^{\mathrm R}
\right)
\in
\mathbb R^{K}.
]

[
\overline r_i
=============

\frac{1}{K}
\sum_{k=1}^{K}
r_{i,k}^{\mathrm R}.
]

[
\sigma_i^{r}
============

\sqrt{
\frac{1}{K}
\sum_{k=1}^{K}
\left(
r_{i,k}^{\mathrm R}
-------------------

\overline r_i
\right)^2
}.
]

[
A_{i,k}^{\mathrm R}
===================

\mathsf{GroupAdvantage}_{\mathrm{Qwen3}}
\left(
\mathbf r_i,k
\right).
]

[
\boxed{
\mathsf{GroupAdvantage}_{\mathrm{Qwen3}}
========================================

\mathsf U
}
]

[
A_{i,k}^{\mathrm R}
\not\stackrel{\mathsf E}{=}
r_{i,k}^{\mathrm R}
-------------------

\overline r_i,
]

[
A_{i,k}^{\mathrm R}
\not\stackrel{\mathsf E}{=}
\frac{
r_{i,k}^{\mathrm R}
-------------------

\overline r_i
}{
\sigma_i^{r}+\epsilon
}.
]

[
\boxed{
\operatorname{MeanCentering},
\operatorname{StdNormalization},
\operatorname{ZeroVarianceHandling}
===================================

\mathsf U
}
]

---

[
\boxed{
\textsc{Algorithm IV: Reasoning Learner Batch}
}
]

[
\texttt{/FLATTEN GROUPS}
]

[
g(i,k)
======

i,
]

[
\mathcal I_t
============

\left{
(i,k):
1\le i\le B_q,
1\le k\le K
\right}.
]

[
\left|
\mathcal I_t
\right|
=======

B_qK.
]

[
\boxed{
g(i,1)=\cdots=g(i,K)=i
}
]

---

[
\texttt{/TOKENIZE TRAJECTORY}
]

[
u_{i,k}
=======

x_i
\Vert
y_{i,k}.
]

[
u_{i,k}
=======

\left(
u_{i,k,1},
\ldots,
u_{i,k,L_{i,k}}
\right).
]

[
L_{i,k}
=======

L_i^{\mathrm p}
+
T_{i,k}.
]

[
X_{i,k,\tau}
============

u_{i,k,\tau},
]

[
Y_{i,k,\tau}
============

u_{i,k,\tau+1}.
]

---

[
\texttt{/POLICY MASK}
]

[
M_{i,k,\tau}^{\pi}
==================

\mathbf 1
\left[
\tau

>

L_i^{\mathrm p}
\right]
\mathbf 1
\left[
\tau
<
L_{i,k}
\right].
]

[
M_{i,k,\tau}^{\mathrm{prompt}}
==============================

1-
M_{i,k,\tau}^{\pi}.
]

[
\boxed{
\mathsf{ExactPolicyMask}_{\mathrm{Qwen3}}
=========================================

\mathsf U
}
]

[
\operatorname{EOSIncludedInPolicyMask}
======================================

\mathsf U.
]

---

[
\texttt{/COLLATE}
]

[
\mathcal B_{t,r,g}^{\mathrm R}
==============================

\operatorname{CollateRL}
\left(
\left{
u_{i,k},
M_{i,k}^{\pi},
A_{i,k}^{\mathrm R},
\ell_{i,k}^{\mathrm b},
g(i,k)
\right}
\right).
]

[
\mathcal B_{t,r,g}^{\mathrm R}
==============================

\left(
X,
Y,
A,
P,
M^{\pi},
A^{\mathrm R},
L^{\mathrm b},
G_{\mathrm{prompt}},
\beta
\right).
]

[
\operatorname{Packing}_{\mathrm{RL}}
====================================

# \operatorname{Padding}_{\mathrm{RL}}

# \operatorname{LengthBucketing}_{\mathrm{RL}}

\mathsf U.
]

---

[
\boxed{
\textsc{Algorithm V: Black-Box Policy Evaluation}
}
]

[
\texttt{/FORWARD}
]

[
Z_{t,r,g}^{\theta}
==================

\mathsf M_{\theta_t^{\mathrm R}}
\left(
X_{t,r,g},
A_{t,r,g},
P_{t,r,g}
\right).
]

[
p_{\theta_t}
\left(
v\mid s_{i,k,\tau}
\right)
=======

\operatorname{Softmax}
\left(
Z_{i,k,\tau,:}^{\theta}
\right)_v.
]

[
\ell_{i,k,\tau}^{\theta}
========================

\log
p_{\theta_t}
\left(
Y_{i,k,\tau}
\mid
s_{i,k,\tau}
\right).
]

---

[
\texttt{/RATIO DIAGNOSTIC}
]

[
\rho_{i,k,\tau}
===============

\exp
\left(
\ell_{i,k,\tau}^{\theta}
------------------------

\ell_{i,k,\tau}^{\mathrm b}
\right).
]

[
\rho_{i,k,\tau}
===============

\frac{
\pi_{\theta_t}
\left(
Y_{i,k,\tau}\mid s_{i,k,\tau}
\right)
}{
\pi_{\mathrm b,t}
\left(
Y_{i,k,\tau}\mid s_{i,k,\tau}
\right)
}.
]

[
\boxed{
\mathsf{RatioDefinition}
========================

\mathsf D
}
]

[
\boxed{
\mathsf{RatioUsedByQwen3GRPO}
=============================

\mathsf U
}
]

[
\operatorname{RatioClipBounds}
==============================

# \operatorname{AsymmetricClip}

# \operatorname{SequenceMask}

\mathsf U.
]

---

[
\texttt{/REFERENCE STATE}
]

[
\pi_{\mathrm{ref}}
==================

\mathsf U.
]

[
D_{\mathrm{KL}}
\left(
\pi_{\theta_t},
\pi_{\mathrm{ref}}
\right)
=======

\mathsf U.
]

[
\beta_{\mathrm{KL}}
===================

\mathsf U.
]

[
\boxed{
\mathsf{ReferenceKLPresent}
===========================

\mathsf U
}
]

---

[
\texttt{/TOKEN AGGREGATION}
]

[
\mathcal Z_{i,k}^{\pi}
======================

\sum_{\tau}
M_{i,k,\tau}^{\pi}.
]

[
\mathsf{TokenAggregate}*{\mathrm{Qwen3}}
\in
\left{
\begin{array}{l}
\displaystyle
\frac{1}{\mathcal Z*{i,k}^{\pi}}
\sum_{\tau}
M_{i,k,\tau}^{\pi}
(\cdot),
[4mm]
\displaystyle
\sum_{\tau}
M_{i,k,\tau}^{\pi}
(\cdot),
[4mm]
\displaystyle
\frac{
\sum_{i,k,\tau}
M_{i,k,\tau}^{\pi}
(\cdot)
}{
\sum_{i,k,\tau}
M_{i,k,\tau}^{\pi}
},
[4mm]
\operatorname{other}
\end{array}
\right}.
]

[
\boxed{
\mathsf{TokenAggregate}_{\mathrm{Qwen3}}
========================================

\mathsf U
}
]

---

[
\boxed{
\textsc{Algorithm VI: Entropy-Control State}
}
]

[
\texttt{/TOKEN ENTROPY}
]

[
H_{i,k,\tau}
\left(
\theta_t
\right)
=======

*

\sum_{v\in\mathcal V}
p_{\theta_t}
\left(
v\mid s_{i,k,\tau}
\right)
\log
p_{\theta_t}
\left(
v\mid s_{i,k,\tau}
\right).
]

[
\overline H_t
=============

\frac{
\displaystyle
\sum_{i,k,\tau}
M_{i,k,\tau}^{\pi}
H_{i,k,\tau}
\left(
\theta_t
\right)
}{
\displaystyle
\sum_{i,k,\tau}
M_{i,k,\tau}^{\pi}
}.
]

---

[
\texttt{/CONTROL TARGET}
]

[
\overline H_{t+1}
\ge
\overline H_t
]

[
\lor
]

[
\left|
\overline H_{t+1}
-----------------

\overline H_t
\right|
\le
\epsilon_{\mathrm H}.
]

[
\boxed{
\text{entropy increases steadily}
\quad\lor\quad
\text{remains stable}
}
]

[
\xi_{t+1}^{\mathrm H}
=====================

\mathsf{EntropyController}*{\mathrm{Qwen3}}
\left(
\xi_t^{\mathrm H},
\overline H_t,
\overline H*{t-1}
\right).
]

[
\boxed{
\mathsf{EntropyController}_{\mathrm{Qwen3}}
===========================================

\mathsf U
}
]

[
\boxed{
\epsilon_{\mathrm H},
H_t^{\star},
\operatorname{UpdateFrequency}_{\mathrm H}
==========================================

\mathsf U
}
]

(\mathsf{ReportedEntropyControlProperty}.) ([arXiv][1])

---

[
\texttt{/CONTROL MECHANISM}
]

[
\mathsf{EntropyController}_{\mathrm{Qwen3}}
\in
\left{
\begin{array}{l}
\text{sampling-temperature control},
\
\text{entropy bonus},
\
\text{adaptive clipping},
\
\text{prompt-distribution control},
\
\text{reward shaping},
\
\text{other}
\end{array}
\right}
=======

\mathsf U.
]

[
\boxed{
\mathcal J
+
\lambda_{\mathrm H}H
}
]

[
\text{is not established}.
]

[
\lambda_{\mathrm H}
===================

\mathsf U.
]

---

[
\boxed{
\textsc{Algorithm VII: Reasoning-RL Objective}
}
]

[
\texttt{/GRPO OPERATOR}
]

[
\widehat{\mathcal J}_{t}^{\mathrm R}
====================================

\mathsf{GRPO}*{\mathrm{Qwen3}}
\left(
\left{
\ell*{i,k,\tau}^{\theta},
\ell_{i,k,\tau}^{\mathrm b},
r_{i,k}^{\mathrm R},
A_{i,k}^{\mathrm R},
M_{i,k,\tau}^{\pi},
g(i,k)
\right};
\xi_t^{\mathrm H}
\right).
]

[
\boxed{
\mathsf{GRPO}_{\mathrm{Qwen3}}
:
\mathcal B_t^{\mathrm R}
\longmapsto
\mathbb R
}
]

[
\boxed{
\mathsf{ExactScalarForm}
\left(
\widehat{\mathcal J}_{t}^{\mathrm R}
\right)
=======

\mathsf U
}
]

---

[
\texttt{/UNKNOWN COMPONENTS}
]

[
\begin{aligned}
\delta_{\rho}
&=
\mathbf 1
\left[
\rho
\text{ enters }
\mathcal J
\right],
\
\delta_{\mathrm{clip}}
&=
\mathbf 1
\left[
\operatorname{clip}(\rho)
\text{ enters }
\mathcal J
\right],
\
\delta_{\mathrm{KL}}
&=
\mathbf 1
\left[
D_{\mathrm{KL}}
\text{ enters }
\mathcal J
\right],
\
\delta_{\mathrm H}
&=
\mathbf 1
\left[
H
\text{ enters }
\mathcal J
\right],
\
\delta_{\mathrm{length}}
&=
\mathbf 1
\left[
T_{i,k}
\text{ enters }
\mathcal J
\right].
\end{aligned}
]

[
\boxed{
\delta_{\rho},
\delta_{\mathrm{clip}},
\delta_{\mathrm{KL}},
\delta_{\mathrm H},
\delta_{\mathrm{length}}
========================

\mathsf U
}
]

[
\boxed{
\epsilon_{\mathrm{low}},
\epsilon_{\mathrm{high}},
\beta_{\mathrm{KL}},
\lambda_{\mathrm H},
\lambda_{\mathrm{length}}
=========================

\mathsf U
}
]

---

[
\texttt{/MAXIMIZE}
]

[
\theta_{t+1}^{\mathrm R}
\in
\arg\max_{\theta}
\widehat{\mathcal J}_{t}^{\mathrm R}
\left(
\theta
\right)
]

[
\lor
]

[
\theta_{t+1}^{\mathrm R}
\in
\arg\min_{\theta}
\widehat{\mathcal L}*{t}^{\mathrm R}
\left(
\theta
\right),
\qquad
\widehat{\mathcal L}*{t}^{\mathrm R}
====================================

*

\widehat{\mathcal J}_{t}^{\mathrm R}.
]

[
\boxed{
\mathsf{PublishedSignConvention}
================================

\mathsf U
}
]

---

[
\texttt{/TOTAL OBJECTIVE}
]

[
\boxed{
\mathcal J_{\mathrm{ReasoningRL}}^{\mathrm{Qwen3}}
==================================================

\mathsf{GRPO}*{\mathrm{Qwen3}}
\left(
\mathcal D*{\mathrm{ReasoningRL}},
\pi_{\mathrm b},
v,
\xi^{\mathrm H}
\right)
}
]

[
\boxed{
\mathcal J_{\mathrm{ReasoningRL}}^{\mathrm{Qwen3}}
\text{ exact equation}
======================

\operatorname{UNDISCLOSED}
}
]

[
\boxed{
\mathcal J_{\mathrm{ReasoningRL}}^{\mathrm{Qwen3}}
\neq
\mathcal J_{\mathrm{canonical\ GRPO}}
\quad
\text{unless independently established}
}
]

---

[
\boxed{
\textsc{Algorithm VIII: Reasoning-RL Optimizer Loop}
}
]

[
\texttt{/DISTRIBUTED STATE}
]

[
R_{\mathrm p}
=============

\text{prompt-sampler ranks},
]

[
R_{\mathrm r}
=============

\text{rollout-worker ranks},
]

[
R_{\mathrm v}
=============

\text{verifier ranks},
]

[
R_{\mathrm l}
=============

\text{learner ranks}.
]

[
\boxed{
R_{\mathrm p},
R_{\mathrm r},
R_{\mathrm v},
R_{\mathrm l},
\operatorname{PlacementTopology}
================================

\mathsf U
}
]

---

[
\texttt{/ROLLOUT PHASE}
]

[
\mathcal Q_t
\leftarrow
\operatorname{SamplePrompts}
\left(
\mathcal D_{\mathrm{ReasoningRL}},
B_q,
\nu_t
\right),
]

[
\mathcal R_t^{\mathrm R}
\leftarrow
\operatorname{Rollout}
\left(
\pi_{\mathrm b,t},
\mathcal Q_t,
K,
\gamma_t^{\mathrm R}
\right),
]

[
\mathbf r_t^{\mathrm R}
\leftarrow
\operatorname{Verify}
\left(
\mathcal R_t^{\mathrm R}
\right),
]

[
\mathcal B_t^{\mathrm R}
\leftarrow
\operatorname{BuildLearnerBatch}
\left(
\mathcal R_t^{\mathrm R},
\mathbf r_t^{\mathrm R}
\right).
]

---

[
\texttt{/MICROBATCH}
]

[
\mathcal B_t^{\mathrm R}
========================

\biguplus_{r=1}^{R_{\mathrm l}}
\biguplus_{g=1}^{G}
\mathcal B_{t,r,g}^{\mathrm R}.
]

[
B_{\mathrm{global}}^{\mathrm R}
===============================

R_{\mathrm l}GB_{\mu}.
]

[
R_{\mathrm l},
G,
B_{\mu},
B_{\mathrm{global}}^{\mathrm R}
===============================

\mathsf U.
]

---

[
\texttt{/FORWARD BACKWARD}
]

[
Z_{t,r,g}
=========

\mathsf M_{\theta_t^{\mathrm R}}
\left(
X_{t,r,g},
A_{t,r,g},
P_{t,r,g}
\right),
]

[
\widehat{\mathcal J}_{t,r,g}^{\mathrm R}
========================================

\mathsf{GRPO}*{\mathrm{Qwen3}}
\left(
Z*{t,r,g},
\mathcal B_{t,r,g}^{\mathrm R},
\xi_t^{\mathrm H}
\right),
]

[
\widehat{\mathcal L}_{t,r,g}^{\mathrm R}
========================================

*

\widehat{\mathcal J}_{t,r,g}^{\mathrm R},
]

[
g_{t,r,g}^{\mathrm R}
=====================

\nabla_{\theta_t^{\mathrm R}}
\widehat{\mathcal L}_{t,r,g}^{\mathrm R}.
]

---

[
\texttt{/ACCUMULATE}
]

[
g_{t,r}^{\mathrm R}
===================

\sum_{g=1}^{G}
\alpha_{t,r,g}^{\mathrm R}
g_{t,r,g}^{\mathrm R}.
]

[
\alpha_{t,r,g}^{\mathrm R}
==========================

\mathsf U.
]

[
\bar g_t^{\mathrm R}
====================

\operatorname{ReduceGrad}
\left(
\left{
g_{t,r}^{\mathrm R}
\right}*{r=1}^{R*{\mathrm l}}
\right).
]

[
\operatorname{ReduceGrad}
=========================

\mathsf U.
]

---

[
\texttt{/CLIP GRAD}
]

[
\tilde g_t^{\mathrm R}
======================

\bar g_t^{\mathrm R}
\min
\left(
1,
\frac{
c_{\mathrm{grad}}^{\mathrm R}
}{
\left|
\bar g_t^{\mathrm R}
\right|_2
}
\right).
]

[
c_{\mathrm{grad}}^{\mathrm R}
=============================

\mathsf U.
]

---

[
\texttt{/UPDATE POLICY}
]

[
\left(
\theta_{t+1}^{\mathrm R},
\omega_{t+1}^{\mathrm R}
\right)
=======

\operatorname{OPT}^{\mathrm R}
\left(
\theta_t^{\mathrm R},
\omega_t^{\mathrm R},
\tilde g_t^{\mathrm R},
\eta_t^{\mathrm R}
\right).
]

[
\boxed{
\operatorname{OPT}^{\mathrm R},
\eta_t^{\mathrm R},
\operatorname{Warmup}^{\mathrm R},
\operatorname{WeightDecay}^{\mathrm R},
\operatorname{Betas}^{\mathrm R}
================================

\mathsf U
}
]

---

[
\texttt{/REFRESH BEHAVIOR}
]

[
\beta_{t+1}
===========

\mathsf{Refresh}*{\mathrm{Qwen3}}
\left(
\beta_t,
\theta*{t+1}^{\mathrm R},
t+1
\right).
]

[
\pi_{\mathrm b,t+1}
===================

\pi_{\theta_{\beta_{t+1}}}.
]

[
\mathsf{Refresh}_{\mathrm{Qwen3}}
=================================

\mathsf U.
]

[
\operatorname{TrajectoryReuseCount}
===================================

# \operatorname{ReplayCapacity}

# \operatorname{StalenessLimit}

\mathsf U.
]

---

[
\texttt{/ADVANCE STATE}
]

[
\nu_{t+1}
=========

\operatorname{AdvancePromptSampler}
\left(
\nu_t
\right),
]

[
\zeta_{t+1}
===========

\operatorname{AdvanceRNG}
\left(
\zeta_t
\right),
]

[
\mathfrak S_{t+1}^{\mathrm R}
=============================

\left(
\theta_{t+1}^{\mathrm R},
\omega_{t+1}^{\mathrm R},
\beta_{t+1},
\nu_{t+1},
\xi_{t+1}^{\mathrm H},
\zeta_{t+1}
\right).
]

---

[
\texttt{/STOP REASONING}
]

[
\theta_{\mathrm R}
==================

\theta_{T_{\mathrm R}}^{\mathrm R}.
]

[
T_{\mathrm R}
=============

170
\qquad
\text{for }
\mathsf{Qwen3\text{-}235B\text{-}A22B}.
]

[
\boxed{
T_{\mathrm R}^{\mathrm{other\ models}}
======================================

\mathsf U
}
]

[
\underbrace{
T_{\mathrm R}=170
}_{\texttt{/* single reported RL run */}}
]

(\mathsf{ReportedOptimizationSteps}.) ([arXiv][1])

---

[
\boxed{
\textsc{Algorithm IX: General-RL Task Preprocessing}
}
]

[
\texttt{/INITIAL STATE}
]

[
\theta_0^{\mathrm G}
\leftarrow
\theta_{\mathrm F}.
]

[
\omega_0^{\mathrm G}
\leftarrow
\operatorname{InitOptimizer}
\left(
\theta_{\mathrm F}
\right).
]

[
\beta_0^{\mathrm G}
\leftarrow
\theta_0^{\mathrm G}.
]

---

[
\texttt{/TASK SCHEMA}
]

[
e_i^{\mathrm G}
===============

\left(
q_i,
c_i,
m_i,
a_i^{\star?},
\mathcal C_i,
\mathcal T_i,
\mathcal E_i,
\varrho_i,
\psi_i,
\mu_i
\right).
]

[
c_i
\in
\mathfrak C_{\mathrm G},
]

[
\mathfrak C_{\mathrm G}
\supseteq
\left{
\begin{array}{l}
\mathrm{instruction\ following},
\
\mathrm{format\ following},
\
\mathrm{preference\ alignment},
\
\mathrm{agent\ ability},
\
\mathrm{specialized\ scenarios}
\end{array}
\right}.
]

[
\left|
\mathfrak T_{\mathrm G}
\right|

>

20.

]

[
m_i
\in
\left{
\mathrm{think},
\mathrm{no_think}
\right}.
]

[
\varrho_i
\in
\left{
\mathrm{rule},
\mathrm{model\text{-}reference},
\mathrm{model\text{-}preference}
\right}.
]

[
\underbrace{
\left|
\mathfrak T_{\mathrm G}
\right|>20
}_{\texttt{/* customized task rewards */}}
]

(\mathsf{GeneralRLTaskFamilies}.) 

---

[
\texttt{/INSTRUCTION TASK}
]

[
e_i^{\mathrm{instruction}}
==========================

\left(
q_i,
\mathcal C_i^{\mathrm{content}},
\mathcal C_i^{\mathrm{format}},
\mathcal C_i^{\mathrm{length}},
\mathcal C_i^{\mathrm{structure}}
\right).
]

[
r_i
===

\mathsf{ScoreInstruction}
\left(
q_i,
y_i,
\mathcal C_i
\right).
]

[
\mathsf{ScoreInstruction}
=========================

\mathsf U.
]

---

[
\texttt{/FORMAT TASK}
]

[
\mathcal C_i^{\mathrm{mode}}
\in
\left{
\texttt{/think},
\texttt{/no_think}
\right}.
]

[
\mathcal C_i^{\mathrm{separator}}
=================================

\left(
\texttt{<think>},
\texttt{</think>}
\right).
]

[
r_i^{\mathrm{format}}
=====================

\mathsf{ScoreFormat}
\left(
y_i,
\mathcal C_i^{\mathrm{mode}},
\mathcal C_i^{\mathrm{separator}}
\right).
]

[
\mathsf{ScoreFormat}
====================

\mathsf U.
]

(\mathsf{ModeAndFormatFollowing}.) 

---

[
\texttt{/PREFERENCE TASK}
]

[
e_i^{\mathrm{preference}}
=========================

\left(
q_i,
\mu_i^{\mathrm{human}}
\right).
]

[
\psi_{\mathrm{RM}}
==================

\operatorname{TrainRewardModel}
\left(
\mathcal D_{\mathrm{human\ preference}}
\right).
]

[
\nabla_{\psi_{\mathrm{RM}}}
\mathcal J_{\mathrm{policy}}
============================

\mathbf 0.
]

[
r_i^{\mathrm{preference}}
=========================

R_{\psi_{\mathrm{RM}}}
\left(
q_i,
y_i
\right).
]

[
\boxed{
\mathcal L_{\mathrm{RM}},
\operatorname{PreferenceSchema},
\operatorname{RMArchitecture},
\operatorname{RMCalibration}
============================

\mathsf U
}
]

(\mathsf{ScalarRewardWithoutReference}.) 

---

[
\texttt{/AGENT TASK}
]

[
e_i^{\mathrm{agent}}
====================

\left(
q_i,
\mathcal T_i,
\mathcal E_i,
g_i^{\star}
\right).
]

[
s_{i,k,0}
=========

q_i.
]

[
a_{i,k,j}
\sim
\pi_{\mathrm b,t}^{\mathrm G}
\left(
,\cdot\mid s_{i,k,j}
\right).
]

[
o_{i,k,j}
=========

\mathcal E_i
\left(
a_{i,k,j}
\right).
]

[
s_{i,k,j+1}
===========

\operatorname{Append}
\left(
s_{i,k,j},
a_{i,k,j},
o_{i,k,j}
\right).
]

[
\tau_{i,k}^{\mathrm{agent}}
===========================

\left(
q_i,
\left{
a_{i,k,j},
o_{i,k,j}
\right}*{j=1}^{J*{i,k}},
y_{i,k}^{\mathrm{final}}
\right).
]

[
r_{i,k}^{\mathrm{agent}}
========================

\mathsf{AgentReward}
\left(
\tau_{i,k}^{\mathrm{agent}},
g_i^{\star},
\mathcal E_i
\right).
]

[
\boxed{
\mathsf{AgentReward},
J_{i,k}^{\max},
\operatorname{ToolTimeout},
\operatorname{EnvironmentReset},
\operatorname{StatePersistence}
===============================

\mathsf U
}
]

(\mathsf{MultiturnEnvironmentFeedback}.) 

---

[
\texttt{/SPECIALIZED TASK}
]

[
e_i^{\mathrm{special}}
======================

\left(
q_i,
c_i,
\mathcal E_i,
a_i^{\star?}
\right).
]

[
c_i
\supseteq
\mathrm{RAG}.
]

[
r_{i,k}^{\mathrm{RAG}}
======================

\mathsf{RAGReward}
\left(
q_i,
y_{i,k},
\mathcal E_i,
a_i^{\star?}
\right).
]

[
\mathsf{RAGReward}
==================

\mathsf U.
]

(\mathsf{SpecializedScenarioReward}.) 

---

[
\boxed{
\textsc{Algorithm X: General-RL Reward Routing}
}
]

[
\texttt{/RULE REWARD}
]

[
r_{i,k}^{\mathrm{rule}}
=======================

R_i^{\mathrm{rule}}
\left(
q_i,
\tau_{i,k},
\mathcal C_i,
\mathcal E_i
\right).
]

[
R_i^{\mathrm{rule}}
:
\mathcal U\times\mathcal Y
\longmapsto
\mathbb R.
]

[
\boxed{
\operatorname{RulePrecision}
\uparrow
\quad\land\quad
\operatorname{RewardHackingRisk}
\downarrow
}
]

[
\operatorname{RuleDefinitions}
==============================

# \operatorname{RuleWeights}

# \operatorname{RuleScale}

\mathsf U.
]

(\mathsf{RuleBasedReward}.) 

---

[
\texttt{/REFERENCE JUDGE}
]

[
\phi_{\mathrm J}
================

\theta_{\mathsf{Qwen2.5\text{-}72B\text{-}Instruct}}.
]

[
\nabla_{\phi_{\mathrm J}}
\mathcal J_{\mathrm{GeneralRL}}
===============================

\mathbf 0.
]

[
r_{i,k}^{\mathrm{ref}}
======================

J_{\phi_{\mathrm J}}
\left(
q_i,
\tau_{i,k},
a_i^{\star};
\rho_i^{\mathrm J}
\right).
]

[
\boxed{
\rho_i^{\mathrm J},
\operatorname{JudgeScale},
\operatorname{JudgeTemperature},
\operatorname{JudgeAggregation}
===============================

\mathsf U
}
]

[
\underbrace{
a_i^{\star}
\rightarrow
J_{\phi_{\mathrm J}}
}_{\texttt{/* reference-conditioned judge */}}
]

(\mathsf{ModelRewardWithReference}.) 

---

[
\texttt{/PREFERENCE REWARD}
]

[
r_{i,k}^{\mathrm{pref}}
=======================

R_{\psi_{\mathrm{RM}}}
\left(
q_i,
\tau_{i,k}
\right).
]

[
a_i^{\star}
===========

\varnothing.
]

[
\boxed{
R_{\psi_{\mathrm{RM}}}
:
(q,\tau)
\longmapsto
\mathbb R
}
]

[
\operatorname{RMScale},
\operatorname{RMClip},
\operatorname{RMBiasCorrection}
===============================

\mathsf U.
]

(\mathsf{ModelRewardWithoutReference}.) 

---

[
\texttt{/ROUTE REWARD}
]

[
r_{i,k}^{\mathrm G}
===================

\begin{cases}
r_{i,k}^{\mathrm{rule}},
&
\varrho_i=\mathrm{rule},
[2mm]
r_{i,k}^{\mathrm{ref}},
&
\varrho_i=\mathrm{model\text{-}reference},
[2mm]
r_{i,k}^{\mathrm{pref}},
&
\varrho_i=\mathrm{model\text{-}preference}.
\end{cases}
]

[
\boxed{
\varrho_i
=========

\mathsf{RewardRouter}_{\mathrm{Qwen3}}
\left(
c_i,q_i,\mathcal E_i,a_i^{\star?}
\right)
}
]

[
\mathsf{RewardRouter}_{\mathrm{Qwen3}}
======================================

\mathsf U.
]

---

[
\texttt{/NO FALSE SUM}
]

[
\boxed{
r_{i,k}^{\mathrm G}
\not\stackrel{\mathsf E}{=}
r_{i,k}^{\mathrm{rule}}
+
r_{i,k}^{\mathrm{ref}}
+
r_{i,k}^{\mathrm{pref}}
}
]

[
\boxed{
\operatorname{MultiRewardCombination}
=====================================

# \operatorname{RewardNormalization}

# \operatorname{CrossTaskCalibration}

\mathsf U
}
]

---

[
\boxed{
\textsc{Algorithm XI: General-RL Rollout}
}
]

[
\texttt{/PROMPT SAMPLE}
]

[
e_i^{\mathrm G}
\sim
p_{\nu_t}^{\mathrm G}
\left(
e\mid\mathcal D_{\mathrm{GeneralRL}}
\right).
]

[
\mathcal Q_t^{\mathrm G}
========================

\left{
e_i^{\mathrm G}
\right}_{i=1}^{B_q^{\mathrm G}}.
]

[
p_{\nu_t}^{\mathrm G}
=====================

\sum_{c\in\mathfrak C_{\mathrm G}}
w_c^{\mathrm G}
p_c.
]

[
\sum_c
w_c^{\mathrm G}
===============

1,
\qquad
w_c^{\mathrm G}\ge0.
]

[
\boxed{
\left{
w_c^{\mathrm G}
\right},
B_q^{\mathrm G}
===============

\mathsf U
}
]

---

[
\texttt{/MODE SERIALIZE}
]

[
\chi_i^{\mathrm G}
==================

\operatorname{ChatML}
\left(
q_i,
m_i,
\mathcal T_i
\right).
]

[
m_i=\mathrm{think}
\Longrightarrow
\chi_i^{\mathrm G}
\supseteq
\texttt{/think}
\quad\lor\quad
\epsilon,
]

[
m_i=\mathrm{no_think}
\Longrightarrow
\chi_i^{\mathrm G}
\supseteq
\texttt{/no_think}.
]

[
x_i^{\mathrm G}
===============

\mathsf T_{\mathrm{Qwen3}}
\left(
\chi_i^{\mathrm G}
\right).
]

[
\operatorname{ExactGeneralRLTemplate}
=====================================

\mathsf U.
]

(\mathsf{ModeFollowingCapability}.) 

---

[
\texttt{/ROLLOUT}
]

[
\tau_{i,k}^{\mathrm G}
\sim
\operatorname{Rollout}
\left(
\pi_{\mathrm b,t}^{\mathrm G},
x_i^{\mathrm G},
\mathcal T_i,
\mathcal E_i;
\gamma_t^{\mathrm G}
\right).
]

[
k\in{1,\ldots,K_{\mathrm G}}.
]

[
K_{\mathrm G},
\gamma_t^{\mathrm G},
\operatorname{OffPolicy}_{\mathrm G}
====================================

\mathsf U.
]

[
r_{i,k}^{\mathrm G}
===================

\mathsf{RewardRouter}*{\mathrm{Qwen3}}
\left(
e_i^{\mathrm G},
\tau*{i,k}^{\mathrm G}
\right).
]

[
\mathcal R_t^{\mathrm G}
========================

\left{
e_i^{\mathrm G},
\tau_{i,k}^{\mathrm G},
r_{i,k}^{\mathrm G}
\right}_{i,k}.
]

---

[
\boxed{
\textsc{Algorithm XII: General-RL Objective}
}
]

[
\texttt{/POLICY EVALUATE}
]

[
Z_{t,r,g}^{\mathrm G}
=====================

\mathsf M_{\theta_t^{\mathrm G}}
\left(
X_{t,r,g}^{\mathrm G},
A_{t,r,g}^{\mathrm G},
P_{t,r,g}^{\mathrm G}
\right).
]

[
\ell_{i,k,\tau}^{\theta,\mathrm G}
==================================

\log
\pi_{\theta_t^{\mathrm G}}
\left(
y_{i,k,\tau}
\mid
s_{i,k,\tau}
\right).
]

---

[
\texttt{/OBJECTIVE OPERATOR}
]

[
\widehat{\mathcal J}_{t}^{\mathrm G}
====================================

\mathsf{PolicyObjective}*{\mathrm{GeneralRL,Qwen3}}
\left(
\left{
\ell*{i,k,\tau}^{\theta,\mathrm G},
r_{i,k}^{\mathrm G},
M_{i,k,\tau}^{\pi},
c_i,
m_i
\right}
\right).
]

[
\boxed{
\mathsf{PolicyObjective}_{\mathrm{GeneralRL,Qwen3}}
===================================================

\mathsf U
}
]

[
\boxed{
\widehat{\mathcal J}_{t}^{\mathrm G}
\not\stackrel{\mathsf E}{=}
\mathsf{GRPO}
}
]

[
\boxed{
\widehat{\mathcal J}_{t}^{\mathrm G}
\not\stackrel{\mathsf E}{=}
\mathsf{PPO}
}
]

[
\boxed{
\widehat{\mathcal J}_{t}^{\mathrm G}
\not\stackrel{\mathsf E}{=}
\mathsf{DPO}
}
]

---

[
\texttt{/TOTAL OBJECTIVE}
]

[
\boxed{
\mathcal J_{\mathrm{GeneralRL}}^{\mathrm{Qwen3}}
================================================

\mathsf{PolicyObjective}*{\mathrm{GeneralRL,Qwen3}}
\left(
\mathcal D*{\mathrm{GeneralRL}},
\mathsf{RewardRouter}*{\mathrm{Qwen3}},
\pi*{\mathrm b}^{\mathrm G},
\mathcal E,
\mathcal T
\right)
}
]

[
\boxed{
\mathcal J_{\mathrm{GeneralRL}}^{\mathrm{Qwen3}}
\text{ exact equation}
======================

\operatorname{UNDISCLOSED}
}
]

[
\boxed{
\operatorname{Advantage}*{\mathrm G},
\operatorname{ImportanceRatio}*{\mathrm G},
\operatorname{Clip}*{\mathrm G},
D*{\mathrm{KL},\mathrm G},
H_{\mathrm G},
\operatorname{LengthPenalty}_{\mathrm G}
========================================

\mathsf U
}
]

---

[
\texttt{/MOE AUDIT}
]

[
\mathcal L_{\mathrm{GBLB}}
==========================

\text{global-batch load-balancing loss}.
]

[
\delta_{\mathrm{GBLB}}^{\mathrm R}
==================================

\mathbf 1
\left[
\mathcal L_{\mathrm{GBLB}}
\text{ retained in Reasoning-RL}
\right],
]

[
\delta_{\mathrm{GBLB}}^{\mathrm G}
==================================

\mathbf 1
\left[
\mathcal L_{\mathrm{GBLB}}
\text{ retained in General-RL}
\right].
]

[
\boxed{
\delta_{\mathrm{GBLB}}^{\mathrm R},
\delta_{\mathrm{GBLB}}^{\mathrm G},
\lambda_{\mathrm{GBLB}}^{\mathrm R},
\lambda_{\mathrm{GBLB}}^{\mathrm G}
===================================

\mathsf U
}
]

[
\boxed{
\mathcal J_{\mathrm{RL}}
\pm
\lambda_{\mathrm{GBLB}}
\mathcal L_{\mathrm{GBLB}}
}
]

[
\text{is not established}.
]

---

[
\boxed{
\textsc{Algorithm XIII: General-RL Optimizer Loop}
}
]

[
\texttt{/MICROBATCH LOOP}
]

[
\forall g\in{1,\ldots,G_{\mathrm G}}:
]

[
\mathcal B_{t,r,g}^{\mathrm G}
\leftarrow
\operatorname{BuildGeneralRLBatch}
\left(
\mathcal R_t^{\mathrm G}
\right),
]

[
Z_{t,r,g}^{\mathrm G}
\leftarrow
\mathsf M_{\theta_t^{\mathrm G}}
\left(
X_{t,r,g}^{\mathrm G},
A_{t,r,g}^{\mathrm G},
P_{t,r,g}^{\mathrm G}
\right),
]

[
\widehat{\mathcal J}*{t,r,g}^{\mathrm G}
\leftarrow
\mathsf{PolicyObjective}*{\mathrm{GeneralRL,Qwen3}}
\left(
Z_{t,r,g}^{\mathrm G},
\mathcal B_{t,r,g}^{\mathrm G}
\right),
]

[
\widehat{\mathcal L}_{t,r,g}^{\mathrm G}
========================================

*

\widehat{\mathcal J}_{t,r,g}^{\mathrm G},
]

[
g_{t,r,g}^{\mathrm G}
=====================

\nabla_{\theta_t^{\mathrm G}}
\widehat{\mathcal L}_{t,r,g}^{\mathrm G}.
]

---

[
\texttt{/ACCUMULATE}
]

[
g_{t,r}^{\mathrm G}
===================

\sum_{g=1}^{G_{\mathrm G}}
\alpha_{t,r,g}^{\mathrm G}
g_{t,r,g}^{\mathrm G}.
]

[
\alpha_{t,r,g}^{\mathrm G}
==========================

\mathsf U.
]

[
\bar g_t^{\mathrm G}
====================

\operatorname{ReduceGrad}
\left(
\left{
g_{t,r}^{\mathrm G}
\right}*{r=1}^{R*{\mathrm l}^{\mathrm G}}
\right).
]

---

[
\texttt{/UPDATE}
]

[
\left(
\theta_{t+1}^{\mathrm G},
\omega_{t+1}^{\mathrm G}
\right)
=======

\operatorname{OPT}^{\mathrm G}
\left(
\theta_t^{\mathrm G},
\omega_t^{\mathrm G},
\bar g_t^{\mathrm G},
\eta_t^{\mathrm G}
\right).
]

[
\boxed{
\operatorname{OPT}^{\mathrm G},
\eta_t^{\mathrm G},
G_{\mathrm G},
R_{\mathrm l}^{\mathrm G},
B_{\mu}^{\mathrm G},
\operatorname{GradientClip}^{\mathrm G}
=======================================

\mathsf U
}
]

---

[
\texttt{/STOP GENERAL}
]

[
\theta_{\mathrm G}
==================

\theta_{T_{\mathrm G}}^{\mathrm G}.
]

[
\boxed{
T_{\mathrm G}
=============

\mathsf U
}
]

---

[
\boxed{
\textsc{Algorithm XIV: End-to-End Qwen3 RL Graph}
}
]

[
\boxed{
\begin{aligned}
\mathcal Q_0^{\mathrm R}
&\xrightarrow{
q\notin\mathcal Q_{\mathrm{cold}}
}
\mathcal Q_1^{\mathrm R}
\
&\xrightarrow{
\mathsf{Learnable}
}
\mathcal Q_2^{\mathrm R}
\
&\xrightarrow{
\mathsf{MaxChallenge}
}
\mathcal Q_3^{\mathrm R}
\
&\xrightarrow{
\mathsf{BroadCoverage}
}
\mathcal D_{\mathrm{ReasoningRL}},
\
&
\left|
\mathcal D_{\mathrm{ReasoningRL}}
\right|
=======

3995.

\end{aligned}
}
]

[
\boxed{
\begin{aligned}
\theta_{\mathrm C}
&\xrightarrow[
\substack{
B_q\text{ large}\
K\text{ high}\
\Pr[\beta(t)<t]>0\
H_{t+1}\uparrow\ \lor\ H_{t+1}\approx H_t
}
]{
\mathsf{GRPO}*{\mathrm{Qwen3}}
}
\theta*{\mathrm R}.
\end{aligned}
}
]

[
\boxed{
\theta_{\mathrm R}
\xrightarrow[
\mathcal D_{\mathrm{think}}
\cup
\mathcal D_{\mathrm{no_think}}
]{
\mathcal L_{\mathrm{FusionSFT}}
}
\theta_{\mathrm F}.
}
]

[
\boxed{
\begin{aligned}
\mathcal D_{\mathrm{GeneralRL}}
&=
\mathcal D_{\mathrm{instruction}}
\uplus
\mathcal D_{\mathrm{format}}
\uplus
\mathcal D_{\mathrm{preference}}
\uplus
\mathcal D_{\mathrm{agent}}
\uplus
\mathcal D_{\mathrm{specialized}},
\
\left|
\mathfrak T_{\mathrm G}
\right|
&>
20.
\end{aligned}
}
]

[
\boxed{
r^{\mathrm G}
=============

\begin{cases}
R^{\mathrm{rule}},
\
J_{\mathsf{Qwen2.5\text{-}72B}}
(,\cdot\mid a^{\star}),
\
R_{\psi_{\mathrm{RM}}}
(,\cdot\mid\mathcal D_{\mathrm{human\ preference}})
\end{cases}
}
]

[
\boxed{
\theta_{\mathrm F}
\xrightarrow[
\substack{
r^{\mathrm{rule}}\
r^{\mathrm{reference\ judge}}\
r^{\mathrm{preference\ RM}}\
\mathcal E_{\mathrm{agent}}
}
]{
\mathsf{PolicyObjective}*{\mathrm{GeneralRL,Qwen3}}
}
\theta*{\mathrm G}.
}
]

(\mathsf{FourStageFlagshipPipeline}.) 

---

[
\boxed{
\textsc{Algorithm XV: State-Transition Summary}
}
]

[
\boxed{
\begin{array}{rcl}
\mathcal Q_t
&\leftarrow&
\operatorname{SamplePrompts}
\left(
\mathcal D,
\nu_t
\right),
[2mm]
\mathcal R_t
&\leftarrow&
\operatorname{Rollout}
\left(
\pi_{\theta_{\beta(t)}},
\mathcal Q_t,
K,
\mathcal E,
\mathcal T
\right),
[2mm]
\mathbf r_t
&\leftarrow&
\operatorname{Reward}
\left(
\mathcal R_t,
v,
R^{\mathrm{rule}},
J_{\phi_{\mathrm J}},
R_{\psi_{\mathrm{RM}}}
\right),
[2mm]
\mathcal B_t
&\leftarrow&
\operatorname{Collate}
\left(
\mathcal R_t,
\mathbf r_t
\right),
[2mm]
Z_t
&\leftarrow&
\mathsf M_{\theta_t}
\left(
X_t,A_t,P_t
\right),
[2mm]
\widehat{\mathcal J}*t
&\leftarrow&
\mathsf{QwenPolicyObjective}
\left(
Z_t,
\mathcal B_t,
\xi_t
\right),
[2mm]
g_t
&\leftarrow&
-\nabla*{\theta_t}
\widehat{\mathcal J}*t,
[2mm]
\bar g_t
&\leftarrow&
\operatorname{ReduceGrad}
\left(
{g*{t,r,g}}
\right),
[2mm]
(\theta_{t+1},\omega_{t+1})
&\leftarrow&
\operatorname{OPT}
\left(
\theta_t,
\omega_t,
\bar g_t,
\eta_t
\right),
[2mm]
\beta_{t+1}
&\leftarrow&
\operatorname{RefreshBehavior}
\left(
\beta_t,\theta_{t+1}
\right),
[2mm]
\xi_{t+1}
&\leftarrow&
\operatorname{UpdateController}
\left(
\xi_t,
\mathcal R_t,
\mathbf r_t
\right).
\end{array}
}
]

---

[
\texttt{/FINAL AUDIT}
]

[
\boxed{
\begin{aligned}
&
B_q,
K,
B_{\mu},
G,
R_{\mathrm p},
R_{\mathrm r},
R_{\mathrm v},
R_{\mathrm l},
\
&
\operatorname{PromptWeights},
\operatorname{PromptSampler},
\operatorname{RolloutTemperature},
\operatorname{TopP},
\operatorname{TopK},
\
&
\operatorname{MaximumCompletionLength},
\operatorname{StopTokens},
\operatorname{TrajectoryPacking},
\
&
\mathsf{GroupAdvantage}*{\mathrm{Qwen3}},
\operatorname{MeanCentering},
\operatorname{StdNormalization},
\
&
\operatorname{ImportanceCorrection},
\operatorname{RatioClip},
\operatorname{ClipBounds},
\
&
\operatorname{ReferencePolicy},
\operatorname{KLDirection},
\beta*{\mathrm{KL}},
\
&
\operatorname{EntropyController},
\lambda_{\mathrm H},
H^{\star},
\
&
\operatorname{OffPolicyBuffer},
\operatorname{ReuseCount},
\operatorname{StalenessLimit},
\
&
\operatorname{RewardScale}*{\mathrm R},
\operatorname{PartialCredit}*{\mathrm R},
\operatorname{FormatReward}*{\mathrm R},
\
&
\operatorname{GeneralTaskMixture},
\operatorname{RewardRouter},
\operatorname{CrossTaskCalibration},
\
&
\mathcal L*{\mathrm{RM}},
\operatorname{RMArchitecture},
\operatorname{JudgePrompt},
\
&
\mathsf{PolicyObjective}*{\mathrm{GeneralRL,Qwen3}},
\operatorname{GeneralRLOffPolicy},
\
&
\delta*{\mathrm{GBLB}}^{\mathrm R},
\delta_{\mathrm{GBLB}}^{\mathrm G},
\lambda_{\mathrm{GBLB}}^{\mathrm R},
\lambda_{\mathrm{GBLB}}^{\mathrm G},
\
&
\operatorname{Optimizer},
\eta_t,
\operatorname{Warmup},
\operatorname{WeightDecay},
\operatorname{GradientClip},
\
&
\mathcal J_{\mathrm{ReasoningRL}}^{\mathrm{exact}},
\mathcal J_{\mathrm{GeneralRL}}^{\mathrm{exact}}
\end{aligned}
=============

\operatorname{UNDISCLOSED}
}
]

[
\boxed{
\mathsf{AlgorithmLabel}
\neq
\mathsf{ExactGradientEstimator}
}
]

[
\boxed{
\mathsf{RewardFunction}
\neq
\mathsf{PolicyObjective}
}
]

[
\boxed{
\mathsf{OffPolicyReported}
\not\Rightarrow
\mathsf{OffPolicyCorrectionDisclosed}
}
]

[
\boxed{
\mathsf{EntropyControlled}
\not\Rightarrow
\mathsf{EntropyBonusDisclosed}
}
]

[
\boxed{
\mathsf{GeneralRLReported}
\not\Rightarrow
\mathsf{GRPOReported}
}
]

[1]: https://arxiv.org/html/2505.09388 "Qwen3 Technical Report"
