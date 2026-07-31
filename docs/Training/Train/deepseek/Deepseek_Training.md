[
\boxed{
\begin{array}{c}
\textbf{DEEPSEEK-V4 PRETRAINING — OUTER OPTIMIZATION PROGRAM}[2mm]
\mathsf M_{\theta}:\text{BLACK-BOX CAUSAL MODEL}[1mm]
\mathcal D_{\rm raw}
\rightarrow
\mathcal D_{\rm curated}
\rightarrow
\mathcal D_{\rm transformed}
\rightarrow
\mathcal D_{\rm token}
\rightarrow
\mathcal D_{\rm packed}
\rightarrow
\mathcal B_t
\rightarrow
\mathsf M_{\theta_t}
\rightarrow
\mathcal L_t
\rightarrow
\nabla_{\theta_t}\mathcal L_t
\rightarrow
\theta_{t+1}
\end{array}}
]

[
\boxed{
\mathcal E
\in
{
\mathrm{REPORTED},
\mathrm{EQUATION!-!VERIFIED},
\mathrm{CODE!-!VERIFIED},
\mathrm{INHERITED},
\mathrm{DERIVED},
\mathrm{UNDISCLOSED}
}
}
]

[
\boxed{
z\notin\mathcal E_{\rm primary}
\Longrightarrow
z:=\mathrm{UNDISCLOSED}
}
]



---

# (\boxed{\textbf{Algorithm 1: }\mathsf{DEEPSEEK_V4_PRETRAIN}})

## (\boxed{\mathbf{0.\ INPUT}})

[
\begin{aligned}
\mathbf{Input}:\quad
&
\mathcal D_{\rm raw}
====================

\left{
d_i
\right}_{i=1}^{N},
\
&
d_i
===

\left(
c_i,;
s_i,;
\ell_i,;
\mu_i
\right),
\
&
c_i\in\Sigma^{*},
\
&
s_i
\in
\mathcal S
==========

{
\mathrm{web},
\mathrm{math},
\mathrm{code},
\mathrm{long!-!document},
\mathrm{multilingual},
\mathrm{agentic},
\ldots
},
\
&
\ell_i
======

|c_i|_{\rm raw},
\
&
\mu_i
=====

\mathrm{metadata}(d_i),
\
&
\theta_0,
\qquad
b_0,
\qquad
\mathsf M_{\theta},
\
&
\mathcal T_{\rm Flash}=32\times10^{12},
\
&
\mathcal T_{\rm Pro}=33\times10^{12}.
\end{aligned}
]

([arXiv][1])

---

## (\boxed{\mathbf{1.\ CORPUS\ CONSTRUCTION}})

[
\begin{aligned}
\mathcal D_{\rm raw}
&=
\mathcal D_{\rm V3}
\cup
\mathcal D_{\rm new},
\
\mathcal D_{\rm new}
&=
\mathcal D_{\rm web}
\cup
\mathcal D_{\rm math}
\cup
\mathcal D_{\rm code}
\cup
\mathcal D_{\rm multilingual}
\cup
\mathcal D_{\rm long}
\cup
\mathcal D_{\rm agentic}
\cup
\cdots .
\end{aligned}
]

[
\boxed{
\mathcal D_{\rm web}
\xrightarrow{
\mathsf F_{\rm auto/template}
}
\mathcal D_{\rm web}^{*}
}
]

[
\mathsf F_{\rm auto/template}(d)
================================

\begin{cases}
0,
&
d\in
\mathcal C_{\rm batched\ auto!-!generated}
\cup
\mathcal C_{\rm templated},
\
1,
&
\text{otherwise}.
\end{cases}
]

[
\boxed{
\mathcal D_{\rm long}
\supset
\mathcal D_{\rm scientific\ papers}
\cup
\mathcal D_{\rm technical\ reports}
\cup
\mathcal D_{\rm academic\text{-}value}
}
]

[
\boxed{
\mathcal D_{\rm mid}
\supset
\mathcal D_{\rm agentic}
}
]

[
\boxed{
p_{\rm mixture}(s),
\quad
p_{\rm source}(s),
\quad
p_{\rm language},
\quad
p_{\rm domain},
\quad
\text{quality thresholds},
\quad
\text{dedup thresholds}
=======================

\mathrm{UNDISCLOSED}
}
]

([arXiv][1])

---

## (\boxed{\mathbf{2.\ DOCUMENT\ TRANSFORMATION}})

[
\boxed{
d_i
\xrightarrow{\mathsf{Transform}}
\tilde d_i
}
]

[
\mathsf{Transform}
==================

\mathsf{TokenSplit}
\circ
\mathsf{FIM}
]

[
\boxed{
\mathsf{TokenSplit}_{\rm V4}
============================

\mathsf{TokenSplit}_{\rm V3}
\qquad[\mathrm{INHERITED}]
}
]

([arXiv][1])

---

# (\boxed{\mathbf{2.1\ FIM\ DECISION}})

[
u_i\sim\operatorname{Uniform}(0,1)
]

[
z_i^{\rm FIM}
=============

\mathbf 1[u_i<0.1]
]

[
\boxed{
\Pr(z_i^{\rm FIM}=1)=0.1
}
]

[
z_i^{\rm FIM}=1
\Longrightarrow
c_i
===

f_{i,\rm pre}
\Vert
f_{i,\rm middle}
\Vert
f_{i,\rm suf}
]

[
\boxed{
\mathsf{PSM}(c_i)
=================

F_{\rm begin}
\Vert
f_{i,\rm pre}
\Vert
F_{\rm hole}
\Vert
f_{i,\rm suf}
\Vert
F_{\rm end}
\Vert
f_{i,\rm middle}
\Vert
E
}
]

[
\begin{aligned}
F_{\rm begin}&=\texttt{<|fim_begin|>},
\
F_{\rm hole}&=\texttt{<|fim_hole|>},
\
F_{\rm end}&=\texttt{<|fim_end|>},
\
E&=\texttt{<|eos_token|>}.
\end{aligned}
]

[
z_i^{\rm FIM}=0
\Longrightarrow
\mathsf{PSM}(c_i)=c_i
]

[
\boxed{
\mathsf{FIM}
\prec
\mathsf{DocumentPacking}
}
]

[
\boxed{
\begin{array}{c}
\text{split-point sampling law}\
\text{minimum prefix length}\
\text{minimum suffix length}\
\text{minimum middle length}\
\text{language-conditioned FIM probability}
\end{array}
===========

\mathrm{UNDISCLOSED}
}
]

([arXiv][2])

---

# (\boxed{\mathbf{2.2\ RANDOM\ TOKEN\ SPLITTING}})

[
\tau_{\rm pre}
:
\Sigma^*
\rightarrow
V^*
]

[
\mathcal C_{\rm comb}
=====================

{
v\in V:
v
\text{ combines punctuation and line breaks}
}.
]

[
x_i^{(0)}
=========

\tau_{\rm pre}
(
\mathsf{PSM}(c_i)
)
]

[
x_i^{(0)}
=========

(x_{i,1},\ldots,x_{i,n_i}).
]

[
\forall x_{i,j}\in\mathcal C_{\rm comb}:
\qquad
r_{i,j}\sim\operatorname{Bernoulli}(p_{\rm split})
]

[
x_{i,j}
\xrightarrow{r_{i,j}=1}
\operatorname{Decompose}
(x_{i,j})
]

[
x_{i,j}
\xrightarrow{r_{i,j}=0}
x_{i,j}.
]

[
\boxed{
p_{\rm split}
=============

\mathrm{UNDISCLOSED}
}
]

[
\boxed{
\operatorname{Decompose}(\cdot)
===============================

\mathrm{UNDISCLOSED}
}
]

([arXiv][2])

---

# (\boxed{\mathbf{3.\ TOKENIZER}})

[
\boxed{
\tau_{\rm V4}
=============

\tau_{\rm V3}
+
\mathcal V_{\rm context}
}
]

[
\boxed{
\tau_{\rm V3}
=============

\mathrm{ByteLevelBPE}
}
]

[
|V|_{\rm report}
================

128\mathrm K
]

[
|V|_{\rm released\ config}
==========================

129280
]

[
\boxed{
|V|*{\rm report}
\neq
|V|*{\rm released\ config}
}
]

[
\boxed{
|V|_{\mathsf M}=129280
\qquad[\mathrm{CODE!-!VERIFIED}]
}
]

[
\operatorname{BOS_id}=0,
\qquad
\operatorname{EOS_id}=1
]

[
\operatorname{max_position_embeddings}
======================================

1048576.

]

([arxiv.org][1])

[
\boxed{
\begin{array}{c}
\text{ordinary pretraining-document BOS insertion}\
\text{ordinary pretraining-document EOS insertion}\
\text{separator token between packed documents}\
\text{special context-token identities}\
\text{context-token sampling rules}
\end{array}
===========

\mathrm{UNDISCLOSED}
}
]

[
\boxed{
\text{released chat encoding}
\not\Rightarrow
\text{pretraining serialization}
}
]

[
\boxed{
\mathsf{ChatTemplate}
\notin
\mathsf{PRETRAIN}_{\rm established}
}
]

---

# (\boxed{\mathbf{4.\ TOKENIZED\ DOCUMENT\ RECORD}})

[
\tilde d_i
\xrightarrow{\tau_{\rm V4}}
X_i
]

[
X_i
===

(x_{i,1},\ldots,x_{i,L_i})
]

[
x_{i,j}
\in
{0,\ldots,129279}.
]

[
\boxed{
R_i
===

(
X_i,;
L_i,;
s_i,;
\mu_i,;
z_i^{\rm FIM}
)
}
]

[
\mathcal R
==========

{R_i}_{i=1}^{N}.
]

---

# (\boxed{\mathbf{5.\ SOURCE\text{-}AWARE\ DOCUMENT\ PACKING}})

[
L_t
\in
{
4096,;
16384,;
65536,;
1048576
}.
]

[
\boxed{
\Pi_t
=====

\mathsf{Pack}
(
\mathcal R,
L_t,
{s_i}
)
}
]

[
\Pi_t
=====

{
P_{t,1},\ldots,P_{t,K_t}
}.
]

[
P_{t,k}
=======

(i_{k,1},\ldots,i_{k,n_k}).
]

[
\boxed{
\sum_{j=1}^{n_k}
L_{i_{k,j}}
\le
L_t
}
]

[
\boxed{
\mathsf{Pack}
:
\arg\min_{\Pi}
\operatorname{Truncation}(\Pi)
\qquad[\mathrm{INTENT;REPORTED}]
}
]

[
\boxed{
\operatorname{TruncationObjective}_{\rm exact}
==============================================

\mathrm{UNDISCLOSED}
}
]

[
\boxed{
\begin{array}{c}
\mathrm{FirstFit}\
\mathrm{BestFit}\
\mathrm{BestFitDecreasing}\
\mathrm{Knapsack}\
\mathrm{LengthBucket}\
\mathrm{SourceBucket}\
\mathrm{OnlinePacking}
\end{array}
\not\equiv
\mathsf{Pack}_{\rm V4}
\quad
\text{without evidence}.
}
]

([arXiv][1])

---

# (\boxed{\mathbf{5.1\ PACKED\ TOKEN\ STREAM}})

[
P_{t,k}
=======

(i_1,\ldots,i_m)
]

[
\boxed{
\bar X_{t,k}
============

X_{i_1}
\Vert
X_{i_2}
\Vert
\cdots
\Vert
X_{i_m}
}
]

[
|\bar X_{t,k}|
==============

\sum_{r=1}^{m}L_{i_r}
\le
L_t.
]

[
C_{t,k}
=======

\left(
\underbrace{i_1,\ldots,i_1}*{L*{i_1}},
\underbrace{i_2,\ldots,i_2}*{L*{i_2}},
\ldots,
\underbrace{i_m,\ldots,i_m}*{L*{i_m}}
\right)
]

[
C_{t,k,j}
=========

\operatorname{SampleID}
(
\bar X_{t,k,j}
).
]

[
O_{t,k,j}
=========

j-
\min
{
q:
C_{t,k,q}=C_{t,k,j}
}
]

[
O_{t,k,j}
=========

\text{within-sample position}.
]

---

# (\boxed{\mathbf{5.2\ SAMPLE\text{-}LEVEL\ ATTENTION\ ISOLATION}})

[
\boxed{
A_{t,k}[p,q]
============

\mathbf 1[q\le p]
\mathbf 1[
C_{t,k,q}=C_{t,k,p}
]
}
]

[
A_{t,k}
\in
{0,1}^{L_t\times L_t}
\qquad[\mathrm{SEMANTIC;REPRESENTATION}]
]

[
\boxed{
C_{t,k,p}\neq C_{t,k,q}
\Longrightarrow
A_{t,k}[p,q]=0
}
]

[
\boxed{
C_{t,k,p}=C_{t,k,q}
\land
q\le p
\Longrightarrow
A_{t,k}[p,q]=1
}
]

[
\boxed{
\text{V4}:
\mathsf{SampleMask}=1
}
]

[
\boxed{
\text{V3}:
\mathsf{CrossSampleMask}=0
}
]

([arXiv][1])

[
\boxed{
\text{physical mask representation}
\in
{
\text{dense mask},
\text{segment IDs},
\text{cu-seqlens},
\text{block metadata},
\ldots
}
=

\mathrm{UNDISCLOSED}
}
]

---

# (\boxed{\mathbf{5.3\ PACKED\ SEQUENCE\ COMPLETION}})

[
R_{t,k}^{\rm free}
==================

L_t-
|\bar X_{t,k}|.
]

[
R_{t,k}^{\rm free}>0
\Longrightarrow
\mathsf{Complete}
(
\bar X_{t,k},
R_{t,k}^{\rm free}
).
]

[
\boxed{
\mathsf{Complete}
\in
{
\text{additional document},
\text{fragment},
\text{padding}
}
=

\mathrm{UNDISCLOSED}
}
]

[
X_{t,k}
\in
\mathbb N^{L_t}
]

[
C_{t,k}
\in
\mathbb Z^{L_t}.
]

---

# (\boxed{\mathbf{6.\ LABEL\ CONSTRUCTION}})

## (\boxed{\mathbf{6.1\ NEXT\ TOKEN}})

[
X_{t,k}^{\rm in}
================

X_{t,k,1:L_t-1}
]

[
Y_{t,k}^{(0)}
=============

X_{t,k,2:L_t}.
]

[
M_{t,k}^{(0)}
\in
{0,1}^{L_t-1}.
]

[
\boxed{
M_{t,k,j}^{(0)}
===============

\mathrm{UNDISCLOSED}
}
]

[
\boxed{
C_{t,k,j}\neq C_{t,k,j+1}
\Longrightarrow
M_{t,k,j}^{(0)}
===============

\mathrm{UNDISCLOSED}
}
]

[
\boxed{
\text{cross-document next-token target treatment}
=================================================

\mathrm{UNDISCLOSED}
}
]

[
\boxed{
\text{padding-loss mask}
========================

\mathrm{UNDISCLOSED}
}
]

---

# (\boxed{\mathbf{6.2\ MTP\ TARGET}})

[
D_{\rm MTP}=1.
]

[
\boxed{
Y_{t,k,j}^{(1)}
===============

X_{t,k,j+2}
}
]

[
M_{t,k,j}^{(1)}
\in
{0,1}.
]

[
\boxed{
\text{MTP boundary masking under V4 packing}
============================================

\mathrm{UNDISCLOSED}
}
]

[
\boxed{
\mathsf S_{t,k}
===============

\left(
X_{t,k},
C_{t,k},
A_{t,k},
Y_{t,k}^{(0)},
M_{t,k}^{(0)},
Y_{t,k}^{(1)},
M_{t,k}^{(1)}
\right)
}
]

([arXiv][1])

---

# (\boxed{\mathbf{7.\ SEQUENCE\ LENGTH\ CURRICULUM}})

[
\boxed{
L:
4096
\rightarrow
16384
\rightarrow
65536
\rightarrow
1048576
}
]

[
\chi_t^{\rm sparse}
===================

\begin{cases}
0,&t\in\mathcal P_{\rm dense},\
1,&t\in\mathcal P_{\rm sparse}.
\end{cases}
]

### (\mathsf{Flash})

[
\boxed{
N_{\rm dense}^{\rm Flash}
=========================

10^{12}\ \mathrm{tokens}
}
]

[
N_{\rm consumed}<10^{12}
\Longrightarrow
\chi_t^{\rm sparse}=0.
]

[
L_t=65536
\Longrightarrow
\text{sparsity introduction becomes eligible}.
]

[
\boxed{
\text{dense}
\rightarrow
\text{CSA-indexer warmup}
\rightarrow
\text{sparse main training}
}
]

[
N_{\rm indexer\ warmup}
=======================

\mathrm{UNDISCLOSED}.
]

### (\mathsf{Pro})

[
\boxed{
N_{\rm dense}^{\rm Pro}

>

N_{\rm dense}^{\rm Flash}
}
]

[
N_{\rm dense}^{\rm Pro}
=======================

\mathrm{UNDISCLOSED}.
]

([arXiv][1])

---

# (\boxed{\mathbf{8.\ TOKEN\text{-}BATCH\ SCHEDULING}})

[
\mathcal B_t^{\rm tok}
======================

\bigcup_{k\in I_t}
\mathsf S_{t,k}.
]

[
B_t^{\rm tok}
=============

\sum_{k\in I_t}
L_{t,k}^{\rm effective}.
]

### (\mathsf{Flash})

[
B_t^{\rm tok}:
B_{\rm init}^{\rm Flash}
\uparrow
75.5\times10^{6}
]

[
B_{\rm init}^{\rm Flash}
========================

\mathrm{UNDISCLOSED}.
]

[
\boxed{
B_t^{\rm tok}
=============

75.5\mathrm M
\quad
\text{for most training}
}
]

### (\mathsf{Pro})

[
B_t^{\rm tok}:
B_{\rm init}^{\rm Pro}
\uparrow
94.4\times10^{6}
]

[
B_{\rm init}^{\rm Pro}
======================

\mathrm{UNDISCLOSED}.
]

[
\boxed{
B_{\max}^{\rm Pro}
==================

94.4\mathrm M
}
]

([arXiv][1])

---

# (\boxed{\mathbf{8.1\ NUMBER\ OF\ PACKED\ SEQUENCES}})

[
B_t^{\rm seq}
\approx
\frac{B_t^{\rm tok}}{L_t}
\qquad[\mathrm{DERIVED}]
]

### (\mathsf{Flash})

[
\begin{array}{c|c}
L_t & 75.5\times10^6/L_t\
\hline
4096 & \approx18432\
16384&\approx4608\
65536&\approx1152\
1048576&\approx72
\end{array}
]

### (\mathsf{Pro})

[
\begin{array}{c|c}
L_t &94.4\times10^6/L_t\
\hline
4096&\approx23047\
16384&\approx5762\
65536&\approx1440\
1048576&\approx90
\end{array}
]

[
\boxed{
B_t^{\rm seq}
\text{ above}
=============

\mathrm{DERIVED}
\neq
\mathrm{reported\ batch\ cardinality}
}
]

---

# (\boxed{\mathbf{9.\ GLOBAL\ BATCH\ SCHEMA}})

[
\boxed{
\mathcal B_t
============

(
X_t,
C_t,
A_t,
Y_t^{(0)},
M_t^{(0)},
Y_t^{(1)},
M_t^{(1)}
)
}
]

[
X_t
\in
\mathbb N^{B_t^{\rm seq}\times L_t}
]

[
C_t
\in
\mathbb Z^{B_t^{\rm seq}\times L_t}
]

[
Y_t^{(0)}
\in
\mathbb N^{B_t^{\rm seq}\times(L_t-1)}
]

[
Y_t^{(1)}
\in
\mathbb N^{B_t^{\rm seq}\times(L_t-2)}.
]

[
A_t:
\left(
C_t,,
\mathrm{causal}
\right)
\mapsto
\mathsf{SampleLevelCausalMask}.
]

---

# (\boxed{\mathbf{10.\ DISTRIBUTED\ PARTITION}})

[
\mathcal B_t
\xrightarrow{\mathsf{DP}}
{
\mathcal B_t^{(r)}
}*{r=1}^{N*{\rm DP}}
]

[
\mathcal B_t^{(r)}
\xrightarrow{\mathsf{PP}}
\mathcal P_{t,1:R_{\rm PP}}^{(r)}
]

[
\mathcal B_t^{(r)}
\xrightarrow[\ L_t\gg1\ ]{\mathsf{CP}}
{
\mathcal B_{t,c}^{(r)}
}*{c=1}^{N*{\rm CP}}.
]

[
\boxed{
N_{\rm DP},
\quad
N_{\rm PP},
\quad
N_{\rm EP},
\quad
N_{\rm CP}
==========

\mathrm{UNDISCLOSED}
}
]

[
\boxed{
\text{V4 training framework}
============================

\text{V3 foundation}
+
\text{hybrid ZeRO}
+
\text{DualPipe-1F1B}
+
\text{long-context CP}
}
]

([arXiv][1])

---

# (\boxed{\mathbf{10.1\ CONTEXT\ PARTITION}})

[
X
=

[
X^{(1)};
X^{(2)};
\ldots;
X^{(N_{\rm CP})}
]
]

[
|X^{(c)}|
=========

s.
]

[
\boxed{
L_t=N_{\rm CP}s
}
]

[
\mathcal B_{t,c}
================

X_{:,cs:(c+1)s}.
]

[
\boxed{
\text{sample boundaries}
\not\equiv
\text{CP boundaries}
}
]

[
\boxed{
\text{document boundaries}
\not\equiv
\text{CP boundaries}
}
]

([arXiv][1])

---

# (\boxed{\mathbf{11.\ ANTICIPATORY\ ROUTING\ DATA\ PREFETCH}})

[
\boxed{
\theta_t
\neq
\theta_{t-\Delta t}
}
]

[
\boxed{
\mathcal B_t
\text{ fetched at }
t-\Delta t
}
]

[
R_t
===

\operatorname{RouteIndex}
(
\mathcal B_t;
\theta_{t-\Delta t},
b_{t-\Delta t}
)
]

[
\operatorname{Cache}(R_t).
]

[
\boxed{
\text{at step }t:
\qquad
H_t
===

\mathsf M_{\theta_t}
(
\mathcal B_t;
R_t
)
}
]

[
\boxed{
\begin{array}{c}
\text{feature parameters}=\theta_t\
\text{routing indices}=R(\theta_{t-\Delta t})
\end{array}
}
]

[
\boxed{
\Delta t
========

\mathrm{UNDISCLOSED}
}
]

([arXiv][1])

---

# (\boxed{\mathbf{12.\ MICRO\text{-}BATCH\ FORMATION}})

[
\mathcal B_t
============

\bigsqcup_{a=1}^{G_t}
\mathcal B_{t,a}^{\mu}.
]

[
B_{t,\mu}^{\rm tok}
===================

|\mathcal B_{t,a}^{\mu}|_{\rm token}.
]

[
\sum_{a=1}^{G_t}
B_{t,\mu,a}^{\rm tok}
=====================

B_t^{\rm tok}.
]

[
\boxed{
B_{\mu}^{\rm seq},
\quad
B_{\mu}^{\rm tok},
\quad
G_t
===

\mathrm{UNDISCLOSED}
}
]

[
\boxed{
\mathcal B_{t,a}^{\mu}
\rightarrow
\text{DualPipe-1F1B schedule}
}
]

([arXiv][1])

---

# (\boxed{\mathbf{13.\ FORWARD\ CONTRACT}})

[
\boxed{
\left(
Z_{t,a}^{(0)},
P_{t,a}^{(1)},
S_{t,a},
R_{t,a}
\right)
=======

\mathsf M_{\theta_t}
\left(
X_{t,a},
A_{t,a};
R_t
\right)
}
]

[
Z_{t,a}^{(0)}
\in
\mathbb R^{
B_{\mu}\times L_t\times|V|
}
]

[
P_{t,a}^{(0)}
=============

\operatorname{Softmax}
(
Z_{t,a}^{(0)}
)
]

[
P_{t,a}^{(1)}
\in
[0,1]^{
B_{\mu}\times(L_t-2)\times|V|
}
]

[
S_{t,a}
=======

{s_{e,j}}
]

[
R_{t,a}
=======

{\operatorname{expertID}_{j,k}}.
]

[
\boxed{
\text{no internal architecture expansion}
}
]

---

# (\boxed{\mathbf{14.\ MAIN\ LANGUAGE\ MODEL\ LOSS}})

[
\boxed{
\mathcal L_{\rm LM}^{(t,a)}
===========================

*

\frac{1}{Z_{t,a}^{(0)}}
\sum_{b}
\sum_{j}
M_{t,a,b,j}^{(0)}
\log
P_{t,a,b,j}^{(0)}
\left[
Y_{t,a,b,j}^{(0)}
\right]
}
]

[
\boxed{
M^{(0)},
\quad
Z^{(0)}
=======

\mathrm{UNDISCLOSED}
}
]

[
\boxed{
\mathcal L_{\rm LM}
\text{ above}
=============

\mathrm{DERIVED\ AUTOREGRESSIVE\ REPRESENTATION}
}
]

---

# (\boxed{\mathbf{15.\ MTP\ LOSS}})

[
D=1.
]

[
\boxed{
\mathcal L_{\rm MTP}^{1}
========================

-\frac{1}{T}
\sum_{i=3}^{T+1}
\log
P_i^{1}[t_i]
}
]

[
\boxed{
\mathcal L_{\rm MTP}
====================

\frac{\lambda_t}{D}
\sum_{k=1}^{D}
\mathcal L_{\rm MTP}^{k}
}
]

[
D=1
\Longrightarrow
\mathcal L_{\rm MTP}
====================

\lambda_t
\mathcal L_{\rm MTP}^{1}.
]

[
\lambda_t
=========

\begin{cases}
0.3,
&
t<t_{\rm LR-decay},
\
0.1,
&
t\ge t_{\rm LR-decay}.
\end{cases}
]

([arXiv][1])

---

# (\boxed{\mathbf{16.\ SEQUENCE\text{-}WISE\ BALANCE\ LOSS}})

[
\boxed{
\mathcal L_{\rm Bal}
====================

\alpha
\sum_{e=1}^{N_r}
f_eP_e
}
]

[
f_e
===

\frac{N_r}{K_rT}
\sum_{j=1}^{T}
\mathbf1
\left[
s_{e,j}
\in
\operatorname{TopK}
(
{s_{q,j}}_{q=1}^{N_r},
K_r
)
\right]
]

[
s'_{e,j}
========

\frac{s_{e,j}}
{\sum_{q=1}^{N_r}s_{q,j}}
]

[
P_e
===

\frac1T
\sum_{j=1}^{T}
s'_{e,j}.
]

[
\boxed{
\alpha=10^{-4}
}
]

([arXiv][2])

---

# (\boxed{\mathbf{17.\ PRETRAINING\ OBJECTIVE}})

[
\boxed{
\mathcal L_{t,a}
================

\mathcal L_{\rm LM}^{(t,a)}
+
\mathcal L_{\rm MTP}^{(t,a)}
+
\mathcal L_{\rm Bal}^{(t,a)}
}
]

[
\boxed{
\mathcal L_{\rm pre}
====================

\mathcal L_{\rm LM}
+
\lambda_t\mathcal L_{\rm MTP}^{1}
+
10^{-4}
\sum_{e=1}^{N_r}f_eP_e
}
]

[
\boxed{
\text{composite equality}
=========================

\mathrm{DERIVED\ FROM\ REPORTED\ TERMS}
}
]

---

# (\boxed{\mathbf{18.\ GRADIENT\ ACCUMULATION}})

[
g_{t,a}^{(r)}
=============

\nabla_{\theta}
\mathcal L_{t,a}^{(r)}.
]

[
g_t^{(r)}
=========

\sum_{a=1}^{G_t}
\omega_{t,a}
g_{t,a}^{(r)}.
]

[
\boxed{
\omega_{t,a}
============

\mathrm{UNDISCLOSED}
}
]

[
\boxed{
\text{loss-token weighted accumulation}
\neq
\text{microbatch mean}
\quad
\text{unless disclosed}
}
]

---

# (\boxed{\mathbf{19.\ MOE\ GRADIENT\ SYNCHRONIZATION}})

[
g_{\rm MoE}^{\rm local}
\xrightarrow{
Q_{\rm BF16}^{\rm stochastic}
}
\tilde g_{\rm MoE}^{\rm local}.
]

[
\boxed{
\tilde g_{\rm MoE}
==================

Q_{\rm BF16}^{\rm stochastic}(g_{\rm MoE})
}
]

[
{\tilde g_r}*{r=1}^{N*{\rm DP}}
\xrightarrow{\rm AllToAll}
{
\tilde g_{r\rightarrow j}
}.
]

[
\boxed{
\widehat g_j
============

\sum_{r=1}^{N_{\rm DP}}
\operatorname{FP32}
(
\tilde g_{r\rightarrow j}
)
}
]

[
\boxed{
\text{AllToAll}
+
\text{local FP32 accumulation}
}
]

[
\boxed{
\neq
\text{ordinary low-precision ring/tree reduce-scatter}
}
]

([arXiv][1])

---

# (\boxed{\mathbf{20.\ OPTIMIZER\ PARAMETER\ PARTITION}})

[
\theta
======

\theta_{\rm AdamW}
\dot\cup
\theta_{\rm Muon}.
]

[
\boxed{
\theta_{\rm AdamW}
==================

\theta_{\rm Emb}
\cup
\theta_{\rm Head}
\cup
\theta_{\rm RMSNorm}
\cup
\theta_{\rm mHC-static-bias}
\cup
\theta_{\rm mHC-gating}
}
]

[
\boxed{
\theta_{\rm Muon}
=================

\theta
\setminus
\theta_{\rm AdamW}
}
]

([arXiv][1])

---

# (\boxed{\mathbf{21.\ ADAMW\ UPDATE}})

[
\beta_1=0.9,
\qquad
\beta_2=0.95,
\qquad
\epsilon=10^{-20},
\qquad
\lambda_{\rm wd}=0.1.
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
(1-\beta_2)g_t^2
]

[
\hat m_t
========

\frac{m_t}{1-\beta_1^t}
]

[
\hat v_t
========

\frac{v_t}{1-\beta_2^t}
]

[
\boxed{
w_{t+1}
=======

## (1-\eta_t\lambda_{\rm wd})w_t

\eta_t
\frac{\hat m_t}
{\sqrt{\hat v_t}+\epsilon}
}
\qquad
w\in\theta_{\rm AdamW}.
]

[
\boxed{
\text{AdamW algebra above}
==========================

\mathrm{algorithmic\ expansion};
\quad
{\beta_1,\beta_2,\epsilon,\lambda}
==================================

\mathrm{REPORTED}.
}
]

([arXiv][1])

---

# (\boxed{\mathbf{22.\ MUON\ UPDATE}})

[
\mu=0.95,
\qquad
\lambda_{\rm wd}=0.1,
\qquad
\gamma_{\rm RMS}=0.18.
]

[
G_t
===

\nabla_W
\mathcal L_t(W_{t-1})
]

[
M_t
===

\mu M_{t-1}+G_t
]

[
Q_t
===

\mu M_t+G_t.
]

[
Q_t^{(0)}
=========

\frac{Q_t}{|Q_t|_F}.
]

[
Q_t^{(k)}
=========

a_kQ_t^{(k-1)}
+
b_k
(Q_t^{(k-1)}Q_t^{(k-1)T})
Q_t^{(k-1)}
+
c_k
(Q_t^{(k-1)}Q_t^{(k-1)T})^2
Q_t^{(k-1)}.
]

[
(a_k,b_k,c_k)
=============

\begin{cases}
(3.4445,-4.7750,2.0315),
&
1\le k\le8,
\
(2,-1.5,0.5),
&
9\le k\le10.
\end{cases}
]

[
O_t'
====

Q_t^{(10)}
]

[
O_t
===

O_t'
\sqrt{\max(n,m)}
\gamma_{\rm RMS}.
]

[
\boxed{
W_t
===

W_{t-1}
(1-\eta_t\lambda_{\rm wd})
--------------------------

\eta_tO_t
}
]

[
W\in\theta_{\rm Muon}.
]

([arXiv][1])

---

# (\boxed{\mathbf{23.\ MUON\ ZeRO\ OWNERSHIP}})

## (\boxed{\mathbf{23.1\ DENSE}})

[
\mathcal W_{\rm dense}
======================

{
W_1,\ldots,W_M
}.
]

[
\boxed{
\mathcal A
==========

\mathsf{KnapsackAssign}
(
\mathcal W_{\rm dense},
N_{\rm ZeRO}
)
}
]

[
\mathcal A_r
\cap
\mathcal A_q
============

\varnothing
\qquad
(r\neq q).
]

[
\left|
\sum_{W\in\mathcal A_r}|W|
--------------------------

\sum_{W\in\mathcal A_q}|W|
\right|
\rightarrow
\min.
]

[
|\mathcal A_r|
\le5
\qquad
[\mathrm{REPORTED\ SETUP}].
]

[
B_r
===

\operatorname{Flatten}
(
\mathcal A_r
)
]

[
|B_r|
\xrightarrow{\rm pad}
\max_q|B_q|.
]

[
\boxed{
\mathrm{padding\ overhead}<10%
}
]

([arXiv][1])

---

## (\boxed{\mathbf{23.2\ MoE}})

[
\mathcal W_{\rm MoE}
====================

{
W_{\rm down},
W_{\rm up},
W_{\rm gate}
}_{\rm all\ experts,\ all\ layers}
]

[
V_{\rm down}
============

\operatorname{Flatten}
(
{W_{\rm down}}
)
]

[
V_{\rm up}
==========

\operatorname{Flatten}
(
{W_{\rm up}}
)
]

[
V_{\rm gate}
============

\operatorname{Flatten}
(
{W_{\rm gate}}
)
]

[
V_{\rm MoE}
===========

V_{\rm down}
\Vert
V_{\rm up}
\Vert
V_{\rm gate}.
]

[
\boxed{
\text{partition boundary}
\notin
\operatorname{Interior}(W)
}
]

[
\boxed{
\text{no logically independent matrix is split}
}
]

([arXiv][1])

---

# (\boxed{\mathbf{24.\ EXTERNAL\ ROUTING\ BIAS\ UPDATE}})

[
b_{e,t}
\notin
\theta_{\rm gradient}.
]

[
\ell_{e,t}
==========

\sum_{\text{all batch tokens}}
\mathbf1[e\in R_{t,j}].
]

[
\bar\ell_t
==========

\frac1{N_r}
\sum_{e=1}^{N_r}
\ell_{e,t}.
]

[
b_{e,t+1}
=========

\begin{cases}
b_{e,t}-\gamma_b,
&
\ell_{e,t}>\bar\ell_t,
\
b_{e,t}+\gamma_b,
&
\ell_{e,t}<\bar\ell_t,
\
b_{e,t},
&
\ell_{e,t}=\bar\ell_t.
\end{cases}
]

[
\boxed{
\gamma_b=0.001
}
]

[
\boxed{
b_{t+1}
=======

F(b_t,\ell_t)
\neq
b_t-\eta\nabla_b\mathcal L_t
}
]

([arXiv][2])

---

# (\boxed{\mathbf{25.\ LEARNING\ RATE\ SCHEDULE}})

## (\boxed{\mathsf{Flash}})

[
\eta_t
======

\begin{cases}
\displaystyle
2.7\times10^{-4}
\frac{t}{2000},
&
0\le t<2000,
[3mm]
2.7\times10^{-4},
&
2000\le t<t_{\rm decay},
[2mm]
\mathsf{Cosine}
\left(
2.7\times10^{-4},
2.7\times10^{-5}
\right),
&
t\ge t_{\rm decay}.
\end{cases}
]

[
t_{\rm decay}
=============

\mathrm{UNDISCLOSED}.
]

## (\boxed{\mathsf{Pro}})

[
\eta_{\max}
===========

2.0\times10^{-4}
]

[
\eta_{\rm final}
================

2.0\times10^{-5}.
]

[
\boxed{
\text{schedule shape}
\approx
\mathsf{Flash}
}
]

([arXiv][1])

---

# (\boxed{\mathbf{26.\ LOSS\ WEIGHT\ SCHEDULE}})

[
\boxed{
\alpha_{\rm Bal}
================

10^{-4}
\quad
\forall t
}
]

[
\boxed{
\lambda_{\rm MTP}(t)
====================

\begin{cases}
0.3,&t<t_{\rm decay},\
0.1,&t\ge t_{\rm decay}.
\end{cases}
}
]

[
\boxed{
\gamma_{\rm routing}=10^{-3}
}
]

([arXiv][1])

---

# (\boxed{\mathbf{27.\ ONE\ COMPLETE\ TRAINING\ STEP}})

[
\boxed{
\begin{aligned}
&\mathbf{for}\quad t=0,\ldots,T_{\rm train}-1
[1mm]
&
\quad
L_t
\leftarrow
\mathsf{ContextSchedule}(N_{\rm consumed})
\
&
\quad
B_t^{\rm tok}
\leftarrow
\mathsf{BatchSchedule}(N_{\rm consumed})
\
&
\quad
\lambda_t
\leftarrow
\mathsf{MTPSchedule}(N_{\rm consumed})
\
&
\quad
\eta_t
\leftarrow
\mathsf{LRSchedule}(t,N_{\rm consumed})
[2mm]
&
\quad
\mathcal D_t
\sim
p_t(
\mathcal D_{\rm web},
\mathcal D_{\rm math},
\mathcal D_{\rm code},
\mathcal D_{\rm multilingual},
\mathcal D_{\rm long},
\mathcal D_{\rm agentic},
\ldots
)
\
&
\quad
p_t
===

\mathrm{UNDISCLOSED}
[2mm]
&
\quad
{d_i}
\leftarrow
\mathsf{SampleDocuments}
(
\mathcal D_t
)
[1mm]
&
\quad
\mathbf{for}\ d_i:
\
&
\qquad
u_i\sim U(0,1)
\
&
\qquad
\tilde d_i
==========

\begin{cases}
\mathsf{PSM}(d_i),
&
u_i<0.1,
\
d_i,
&
u_i\ge0.1
\end{cases}
\
&
\qquad
X_i
===

\mathsf{TokenSplit}
\left(
\tau_{\rm V4}(\tilde d_i)
\right)
\
&
\quad
\mathbf{end}
[2mm]
&
\quad
\Pi_t
=====

\mathsf{Pack}
(
{X_i},
L_t,
{s_i}
)
\
&
\quad
\mathcal B_t
============

\mathsf{MaterializePackedBatch}
(
\Pi_t,
B_t^{\rm tok}
)
\
&
\quad
C_t
===

\mathsf{SampleIDs}
(
\mathcal B_t
)
\
&
\quad
A_t[p,q]
========

\mathbf1[q\le p]
\mathbf1[C_t[p]=C_t[q]]
[1mm]
&
\quad
(Y_t^{(0)},M_t^{(0)})
=====================

\mathsf{NextTokenTargets}(X_t,C_t)
\
&
\quad
(Y_t^{(1)},M_t^{(1)})
=====================

\mathsf{MTP1Targets}(X_t,C_t)
\
&
\quad
M_t^{(0)},M_t^{(1)}
===================

\mathrm{UNDISCLOSED}
[2mm]
&
\quad
R_t
===

\mathsf{CachedRoute}
(
\mathcal B_t;
\theta_{t-\Delta t}
)
[2mm]
&
\quad
\mathcal B_t
============

\bigsqcup_{a=1}^{G_t}
\mathcal B_{t,a}^{\mu}
[2mm]
&
\quad
g_t
\leftarrow0
[1mm]
&
\quad
\mathbf{for}\ a=1,\ldots,G_t:
\
&
\qquad
(
Z^{(0)}*{t,a},
P^{(1)}*{t,a},
S_{t,a},
R_{t,a}
)
=

\mathsf M_{\theta_t}
(
X_{t,a},
A_{t,a};
R_t
)
\
&
\qquad
P^{(0)}_{t,a}
=============

\operatorname{softmax}
(
Z^{(0)}*{t,a}
)
\
&
\qquad
\mathcal L*{\rm LM}^{t,a}
=========================

-\frac1{Z^{(0)}*{t,a}}
\sum*{b,j}
M_{b,j}^{(0)}
\log
P_{b,j}^{(0)}
[
Y_{b,j}^{(0)}
]
\
&
\qquad
\mathcal L_{\rm MTP}^{t,a}
==========================

-\frac{\lambda_t}{T}
\sum_i
\log
P_i^{(1)}[t_i]
\
&
\qquad
\mathcal L_{\rm Bal}^{t,a}
==========================

10^{-4}
\sum_e
f_eP_e
\
&
\qquad
\mathcal L_{t,a}
================

\mathcal L_{\rm LM}^{t,a}
+
\mathcal L_{\rm MTP}^{t,a}
+
\mathcal L_{\rm Bal}^{t,a}
\
&
\qquad
g_{t,a}
=======

\nabla_{\theta_t}
\mathcal L_{t,a}
\
&
\qquad
g_t
\leftarrow
g_t+\omega_{t,a}g_{t,a}
\
&
\quad
\mathbf{end}
[2mm]
&
\quad
\widehat g_t
============

\mathsf{DistributedGradientSync}
(
g_t
)
[1mm]
&
\quad
\theta^{\rm AdamW}_{t+1}
========================

\mathsf{AdamW}
(
\theta^{\rm AdamW}*{t},
\widehat g_t,
\eta_t
)
\
&
\quad
\theta^{\rm Muon}*{t+1}
=======================

\mathsf{Muon}
(
\theta^{\rm Muon}*{t},
\widehat g_t,
\eta_t
)
\
&
\quad
b*{t+1}
=======

F_{\rm load}
(
b_t,
\ell_t;
10^{-3}
)
\
&
\quad
N_{\rm consumed}
\leftarrow
N_{\rm consumed}
+
B_t^{\rm tok}
[1mm]
&
\mathbf{end}
\end{aligned}}
]

([arXiv][1])

---

# (\boxed{\mathbf{28.\ PRETRAINING\ STATE\ TRANSITION}})

[
\boxed{
\begin{aligned}
&
(
\theta_t,
b_t,
\mathcal D_t,
L_t,
B_t^{\rm tok},
\eta_t,
\lambda_t,
\chi_t^{\rm sparse}
)
\
&
\qquad
\xrightarrow{
\mathsf{sample}
}
{d_i}
\
&
\qquad
\xrightarrow{
\mathsf{FIM}*{0.1}
}
{\tilde d_i}
\
&
\qquad
\xrightarrow{
\mathsf{ByteBPE}
+
\mathsf{TokenSplit}
}
{X_i}
\
&
\qquad
\xrightarrow{
\mathsf{SourceAwarePack}
}
(X,C)
\
&
\qquad
\xrightarrow{
\mathsf{SampleLevelMask}
}
(X,C,A)
\
&
\qquad
\xrightarrow{
\mathsf{TargetConstruction}
}
(X,A,Y^{(0)},Y^{(1)},M^{(0)},M^{(1)})
\
&
\qquad
\xrightarrow{
\mathsf{TokenBatch}
}
\mathcal B_t
\
&
\qquad
\xrightarrow{
\mathsf{DistributedMicrobatch}
}
{\mathcal B*{t,a}^{(r)}}
\
&
\qquad
\xrightarrow{
\mathsf M_{\theta_t}
}
(P^{(0)},P^{(1)},S,R)
\
&
\qquad
\xrightarrow{
\mathcal L_{\rm LM}
+
\lambda_t\mathcal L_{\rm MTP}
+
10^{-4}\mathcal L_{\rm balance}
}
g_t
\
&
\qquad
\xrightarrow{
\mathsf{AdamW}\oplus\mathsf{Muon}
}
\theta_{t+1}
\
&
\qquad
\xrightarrow{
F_{\rm load}
}
b_{t+1}.
\end{aligned}}
]

---

# (\boxed{\mathbf{29.\ DISCLOSED\ /\ UNDISCLOSED\ BOUNDARY}})

[
\boxed{
\begin{array}{c|c}
\text{Field} & \text{State}\
\hline
\text{corpus}>32\mathrm T & \mathrm{REPORTED}\
\text{Flash token budget}=32\mathrm T & \mathrm{REPORTED}\
\text{Pro token budget}=33\mathrm T & \mathrm{REPORTED}\
\text{web auto/template filtering} & \mathrm{REPORTED}\
\text{math/code core corpus} & \mathrm{REPORTED}\
\text{agentic mid-training data} & \mathrm{REPORTED}\
\text{long-document emphasis} & \mathrm{REPORTED}\
\text{Byte-level BPE inheritance} & \mathrm{INHERITED}\
\text{report vocabulary}=128\mathrm K & \mathrm{REPORTED}\
\text{model vocabulary}=129280 & \mathrm{CODE!-!VERIFIED}\
\text{FIM PSM} & \mathrm{INHERITED/EQUATION!-!VERIFIED}\
p_{\rm FIM}=0.1 & \mathrm{INHERITED}\
\text{token splitting} & \mathrm{INHERITED}\
p_{\rm split} & \mathrm{UNDISCLOSED}\
\text{document packing} & \mathrm{REPORTED}\
\text{packing optimizer/heuristic} & \mathrm{UNDISCLOSED}\
\text{sample-level attention masking} & \mathrm{REPORTED}\
\text{physical mask representation} & \mathrm{UNDISCLOSED}\
\text{cross-document target masking} & \mathrm{UNDISCLOSED}\
\text{ordinary document separator} & \mathrm{UNDISCLOSED}\
L:4K\rightarrow16K\rightarrow64K\rightarrow1M & \mathrm{REPORTED}\
B_{\max}^{Flash}=75.5M & \mathrm{REPORTED}\
B_{\max}^{Pro}=94.4M & \mathrm{REPORTED}\
B_{\rm initial} & \mathrm{UNDISCLOSED}\
D_{\rm MTP}=1 & \mathrm{REPORTED}\
\lambda_{\rm MTP}:0.3\rightarrow0.1 & \mathrm{REPORTED}\
\alpha_{\rm Bal}=10^{-4} & \mathrm{REPORTED}\
\gamma_{\rm route}=10^{-3} & \mathrm{REPORTED}\
\text{microbatch size} & \mathrm{UNDISCLOSED}\
\text{gradient accumulation count} & \mathrm{UNDISCLOSED}\
\text{DP/PP/EP/CP degrees} & \mathrm{UNDISCLOSED}\
\text{Muon/AdamW parameter partition} & \mathrm{REPORTED}\
\text{Muon update} & \mathrm{EQUATION!-!VERIFIED}\
\text{anticipatory routing} & \mathrm{REPORTED}\
\Delta t_{\rm routing} & \mathrm{UNDISCLOSED}
\end{array}}
]

[
\boxed{
\mathcal D_{\rm raw}
\overset{\rm curate}{\longrightarrow}
d
\overset{\rm FIM}{\longrightarrow}
\tilde d
\overset{\rm tokenize}{\longrightarrow}
X_i
\overset{\rm pack}{\longrightarrow}
(X,C)
\overset{\rm sample-mask}{\longrightarrow}
(X,A)
\overset{\rm labels}{\longrightarrow}
(X,A,Y^{0},Y^{1})
\overset{\rm batch}{\longrightarrow}
\mathcal B
\overset{\rm shard}{\longrightarrow}
\mathcal B^{\mu,r}
\overset{\mathsf M_\theta}{\longrightarrow}
\mathcal L_{\rm pre}
\overset{\nabla}{\longrightarrow}
g
\overset{\rm AdamW\oplus Muon}{\longrightarrow}
\theta^{+}
}
]

([arXiv][1])

[1]: https://arxiv.org/html/2606.19348 "DeepSeek-V4: Towards Highly Efficient Million-Token Context Intelligence"
[2]: https://arxiv.org/html/2412.19437 "DeepSeek-V3 Technical Report"

[
\boxed{
\begin{array}{c}
\textbf{DEEPSEEK-V4 PRETRAINING — OUTER OPTIMIZATION PROGRAM}[2mm]
\mathsf M_{\theta}:\text{BLACK-BOX CAUSAL MODEL}[1mm]
\mathcal D_{\rm raw}
\rightarrow
\mathcal D_{\rm curated}
\rightarrow
\mathcal D_{\rm transformed}
\rightarrow
\mathcal D_{\rm token}
\rightarrow
\mathcal D_{\rm packed}
\rightarrow
\mathcal B_t
\rightarrow
\mathsf M_{\theta_t}
\rightarrow
\mathcal L_t
\rightarrow
\nabla_{\theta_t}\mathcal L_t
\rightarrow
\theta_{t+1}
\end{array}}
]

[
\boxed{
\mathcal E
\in
{
\mathrm{REPORTED},
\mathrm{EQUATION!-!VERIFIED},
\mathrm{CODE!-!VERIFIED},
\mathrm{INHERITED},
\mathrm{DERIVED},
\mathrm{UNDISCLOSED}
}
}
]

[
\boxed{
z\notin\mathcal E_{\rm primary}
\Longrightarrow
z:=\mathrm{UNDISCLOSED}
}
]



---

# (\boxed{\textbf{Algorithm 1: }\mathsf{DEEPSEEK_V4_PRETRAIN}})

## (\boxed{\mathbf{0.\ INPUT}})

[
\begin{aligned}
\mathbf{Input}:\quad
&
\mathcal D_{\rm raw}
====================

\left{
d_i
\right}_{i=1}^{N},
\
&
d_i
===

\left(
c_i,;
s_i,;
\ell_i,;
\mu_i
\right),
\
&
c_i\in\Sigma^{*},
\
&
s_i
\in
\mathcal S
==========

{
\mathrm{web},
\mathrm{math},
\mathrm{code},
\mathrm{long!-!document},
\mathrm{multilingual},
\mathrm{agentic},
\ldots
},
\
&
\ell_i
======

|c_i|_{\rm raw},
\
&
\mu_i
=====

\mathrm{metadata}(d_i),
\
&
\theta_0,
\qquad
b_0,
\qquad
\mathsf M_{\theta},
\
&
\mathcal T_{\rm Flash}=32\times10^{12},
\
&
\mathcal T_{\rm Pro}=33\times10^{12}.
\end{aligned}
]

([arXiv][1])

---

## (\boxed{\mathbf{1.\ CORPUS\ CONSTRUCTION}})

[
\begin{aligned}
\mathcal D_{\rm raw}
&=
\mathcal D_{\rm V3}
\cup
\mathcal D_{\rm new},
\
\mathcal D_{\rm new}
&=
\mathcal D_{\rm web}
\cup
\mathcal D_{\rm math}
\cup
\mathcal D_{\rm code}
\cup
\mathcal D_{\rm multilingual}
\cup
\mathcal D_{\rm long}
\cup
\mathcal D_{\rm agentic}
\cup
\cdots .
\end{aligned}
]

[
\boxed{
\mathcal D_{\rm web}
\xrightarrow{
\mathsf F_{\rm auto/template}
}
\mathcal D_{\rm web}^{*}
}
]

[
\mathsf F_{\rm auto/template}(d)
================================

\begin{cases}
0,
&
d\in
\mathcal C_{\rm batched\ auto!-!generated}
\cup
\mathcal C_{\rm templated},
\
1,
&
\text{otherwise}.
\end{cases}
]

[
\boxed{
\mathcal D_{\rm long}
\supset
\mathcal D_{\rm scientific\ papers}
\cup
\mathcal D_{\rm technical\ reports}
\cup
\mathcal D_{\rm academic\text{-}value}
}
]

[
\boxed{
\mathcal D_{\rm mid}
\supset
\mathcal D_{\rm agentic}
}
]

[
\boxed{
p_{\rm mixture}(s),
\quad
p_{\rm source}(s),
\quad
p_{\rm language},
\quad
p_{\rm domain},
\quad
\text{quality thresholds},
\quad
\text{dedup thresholds}
=======================

\mathrm{UNDISCLOSED}
}
]

([arXiv][1])

---

## (\boxed{\mathbf{2.\ DOCUMENT\ TRANSFORMATION}})

[
\boxed{
d_i
\xrightarrow{\mathsf{Transform}}
\tilde d_i
}
]

[
\mathsf{Transform}
==================

\mathsf{TokenSplit}
\circ
\mathsf{FIM}
]

[
\boxed{
\mathsf{TokenSplit}_{\rm V4}
============================

\mathsf{TokenSplit}_{\rm V3}
\qquad[\mathrm{INHERITED}]
}
]

([arXiv][1])

---

# (\boxed{\mathbf{2.1\ FIM\ DECISION}})

[
u_i\sim\operatorname{Uniform}(0,1)
]

[
z_i^{\rm FIM}
=============

\mathbf 1[u_i<0.1]
]

[
\boxed{
\Pr(z_i^{\rm FIM}=1)=0.1
}
]

[
z_i^{\rm FIM}=1
\Longrightarrow
c_i
===

f_{i,\rm pre}
\Vert
f_{i,\rm middle}
\Vert
f_{i,\rm suf}
]

[
\boxed{
\mathsf{PSM}(c_i)
=================

F_{\rm begin}
\Vert
f_{i,\rm pre}
\Vert
F_{\rm hole}
\Vert
f_{i,\rm suf}
\Vert
F_{\rm end}
\Vert
f_{i,\rm middle}
\Vert
E
}
]

[
\begin{aligned}
F_{\rm begin}&=\texttt{<|fim_begin|>},
\
F_{\rm hole}&=\texttt{<|fim_hole|>},
\
F_{\rm end}&=\texttt{<|fim_end|>},
\
E&=\texttt{<|eos_token|>}.
\end{aligned}
]

[
z_i^{\rm FIM}=0
\Longrightarrow
\mathsf{PSM}(c_i)=c_i
]

[
\boxed{
\mathsf{FIM}
\prec
\mathsf{DocumentPacking}
}
]

[
\boxed{
\begin{array}{c}
\text{split-point sampling law}\
\text{minimum prefix length}\
\text{minimum suffix length}\
\text{minimum middle length}\
\text{language-conditioned FIM probability}
\end{array}
===========

\mathrm{UNDISCLOSED}
}
]

([arXiv][2])

---

# (\boxed{\mathbf{2.2\ RANDOM\ TOKEN\ SPLITTING}})

[
\tau_{\rm pre}
:
\Sigma^*
\rightarrow
V^*
]

[
\mathcal C_{\rm comb}
=====================

{
v\in V:
v
\text{ combines punctuation and line breaks}
}.
]

[
x_i^{(0)}
=========

\tau_{\rm pre}
(
\mathsf{PSM}(c_i)
)
]

[
x_i^{(0)}
=========

(x_{i,1},\ldots,x_{i,n_i}).
]

[
\forall x_{i,j}\in\mathcal C_{\rm comb}:
\qquad
r_{i,j}\sim\operatorname{Bernoulli}(p_{\rm split})
]

[
x_{i,j}
\xrightarrow{r_{i,j}=1}
\operatorname{Decompose}
(x_{i,j})
]

[
x_{i,j}
\xrightarrow{r_{i,j}=0}
x_{i,j}.
]

[
\boxed{
p_{\rm split}
=============

\mathrm{UNDISCLOSED}
}
]

[
\boxed{
\operatorname{Decompose}(\cdot)
===============================

\mathrm{UNDISCLOSED}
}
]

([arXiv][2])

---

# (\boxed{\mathbf{3.\ TOKENIZER}})

[
\boxed{
\tau_{\rm V4}
=============

\tau_{\rm V3}
+
\mathcal V_{\rm context}
}
]

[
\boxed{
\tau_{\rm V3}
=============

\mathrm{ByteLevelBPE}
}
]

[
|V|_{\rm report}
================

128\mathrm K
]

[
|V|_{\rm released\ config}
==========================

129280
]

[
\boxed{
|V|*{\rm report}
\neq
|V|*{\rm released\ config}
}
]

[
\boxed{
|V|_{\mathsf M}=129280
\qquad[\mathrm{CODE!-!VERIFIED}]
}
]

[
\operatorname{BOS_id}=0,
\qquad
\operatorname{EOS_id}=1
]

[
\operatorname{max_position_embeddings}
======================================

1048576.

]

([arxiv.org][1])

[
\boxed{
\begin{array}{c}
\text{ordinary pretraining-document BOS insertion}\
\text{ordinary pretraining-document EOS insertion}\
\text{separator token between packed documents}\
\text{special context-token identities}\
\text{context-token sampling rules}
\end{array}
===========

\mathrm{UNDISCLOSED}
}
]

[
\boxed{
\text{released chat encoding}
\not\Rightarrow
\text{pretraining serialization}
}
]

[
\boxed{
\mathsf{ChatTemplate}
\notin
\mathsf{PRETRAIN}_{\rm established}
}
]

---

# (\boxed{\mathbf{4.\ TOKENIZED\ DOCUMENT\ RECORD}})

[
\tilde d_i
\xrightarrow{\tau_{\rm V4}}
X_i
]

[
X_i
===

(x_{i,1},\ldots,x_{i,L_i})
]

[
x_{i,j}
\in
{0,\ldots,129279}.
]

[
\boxed{
R_i
===

(
X_i,;
L_i,;
s_i,;
\mu_i,;
z_i^{\rm FIM}
)
}
]

[
\mathcal R
==========

{R_i}_{i=1}^{N}.
]

---

# (\boxed{\mathbf{5.\ SOURCE\text{-}AWARE\ DOCUMENT\ PACKING}})

[
L_t
\in
{
4096,;
16384,;
65536,;
1048576
}.
]

[
\boxed{
\Pi_t
=====

\mathsf{Pack}
(
\mathcal R,
L_t,
{s_i}
)
}
]

[
\Pi_t
=====

{
P_{t,1},\ldots,P_{t,K_t}
}.
]

[
P_{t,k}
=======

(i_{k,1},\ldots,i_{k,n_k}).
]

[
\boxed{
\sum_{j=1}^{n_k}
L_{i_{k,j}}
\le
L_t
}
]

[
\boxed{
\mathsf{Pack}
:
\arg\min_{\Pi}
\operatorname{Truncation}(\Pi)
\qquad[\mathrm{INTENT;REPORTED}]
}
]

[
\boxed{
\operatorname{TruncationObjective}_{\rm exact}
==============================================

\mathrm{UNDISCLOSED}
}
]

[
\boxed{
\begin{array}{c}
\mathrm{FirstFit}\
\mathrm{BestFit}\
\mathrm{BestFitDecreasing}\
\mathrm{Knapsack}\
\mathrm{LengthBucket}\
\mathrm{SourceBucket}\
\mathrm{OnlinePacking}
\end{array}
\not\equiv
\mathsf{Pack}_{\rm V4}
\quad
\text{without evidence}.
}
]

([arXiv][1])

---

# (\boxed{\mathbf{5.1\ PACKED\ TOKEN\ STREAM}})

[
P_{t,k}
=======

(i_1,\ldots,i_m)
]

[
\boxed{
\bar X_{t,k}
============

X_{i_1}
\Vert
X_{i_2}
\Vert
\cdots
\Vert
X_{i_m}
}
]

[
|\bar X_{t,k}|
==============

\sum_{r=1}^{m}L_{i_r}
\le
L_t.
]

[
C_{t,k}
=======

\left(
\underbrace{i_1,\ldots,i_1}*{L*{i_1}},
\underbrace{i_2,\ldots,i_2}*{L*{i_2}},
\ldots,
\underbrace{i_m,\ldots,i_m}*{L*{i_m}}
\right)
]

[
C_{t,k,j}
=========

\operatorname{SampleID}
(
\bar X_{t,k,j}
).
]

[
O_{t,k,j}
=========

j-
\min
{
q:
C_{t,k,q}=C_{t,k,j}
}
]

[
O_{t,k,j}
=========

\text{within-sample position}.
]

---

# (\boxed{\mathbf{5.2\ SAMPLE\text{-}LEVEL\ ATTENTION\ ISOLATION}})

[
\boxed{
A_{t,k}[p,q]
============

\mathbf 1[q\le p]
\mathbf 1[
C_{t,k,q}=C_{t,k,p}
]
}
]

[
A_{t,k}
\in
{0,1}^{L_t\times L_t}
\qquad[\mathrm{SEMANTIC;REPRESENTATION}]
]

[
\boxed{
C_{t,k,p}\neq C_{t,k,q}
\Longrightarrow
A_{t,k}[p,q]=0
}
]

[
\boxed{
C_{t,k,p}=C_{t,k,q}
\land
q\le p
\Longrightarrow
A_{t,k}[p,q]=1
}
]

[
\boxed{
\text{V4}:
\mathsf{SampleMask}=1
}
]

[
\boxed{
\text{V3}:
\mathsf{CrossSampleMask}=0
}
]

([arXiv][1])

[
\boxed{
\text{physical mask representation}
\in
{
\text{dense mask},
\text{segment IDs},
\text{cu-seqlens},
\text{block metadata},
\ldots
}
=

\mathrm{UNDISCLOSED}
}
]

---

# (\boxed{\mathbf{5.3\ PACKED\ SEQUENCE\ COMPLETION}})

[
R_{t,k}^{\rm free}
==================

L_t-
|\bar X_{t,k}|.
]

[
R_{t,k}^{\rm free}>0
\Longrightarrow
\mathsf{Complete}
(
\bar X_{t,k},
R_{t,k}^{\rm free}
).
]

[
\boxed{
\mathsf{Complete}
\in
{
\text{additional document},
\text{fragment},
\text{padding}
}
=

\mathrm{UNDISCLOSED}
}
]

[
X_{t,k}
\in
\mathbb N^{L_t}
]

[
C_{t,k}
\in
\mathbb Z^{L_t}.
]

---

# (\boxed{\mathbf{6.\ LABEL\ CONSTRUCTION}})

## (\boxed{\mathbf{6.1\ NEXT\ TOKEN}})

[
X_{t,k}^{\rm in}
================

X_{t,k,1:L_t-1}
]

[
Y_{t,k}^{(0)}
=============

X_{t,k,2:L_t}.
]

[
M_{t,k}^{(0)}
\in
{0,1}^{L_t-1}.
]

[
\boxed{
M_{t,k,j}^{(0)}
===============

\mathrm{UNDISCLOSED}
}
]

[
\boxed{
C_{t,k,j}\neq C_{t,k,j+1}
\Longrightarrow
M_{t,k,j}^{(0)}
===============

\mathrm{UNDISCLOSED}
}
]

[
\boxed{
\text{cross-document next-token target treatment}
=================================================

\mathrm{UNDISCLOSED}
}
]

[
\boxed{
\text{padding-loss mask}
========================

\mathrm{UNDISCLOSED}
}
]

---

# (\boxed{\mathbf{6.2\ MTP\ TARGET}})

[
D_{\rm MTP}=1.
]

[
\boxed{
Y_{t,k,j}^{(1)}
===============

X_{t,k,j+2}
}
]

[
M_{t,k,j}^{(1)}
\in
{0,1}.
]

[
\boxed{
\text{MTP boundary masking under V4 packing}
============================================

\mathrm{UNDISCLOSED}
}
]

[
\boxed{
\mathsf S_{t,k}
===============

\left(
X_{t,k},
C_{t,k},
A_{t,k},
Y_{t,k}^{(0)},
M_{t,k}^{(0)},
Y_{t,k}^{(1)},
M_{t,k}^{(1)}
\right)
}
]

([arXiv][1])

---

# (\boxed{\mathbf{7.\ SEQUENCE\ LENGTH\ CURRICULUM}})

[
\boxed{
L:
4096
\rightarrow
16384
\rightarrow
65536
\rightarrow
1048576
}
]

[
\chi_t^{\rm sparse}
===================

\begin{cases}
0,&t\in\mathcal P_{\rm dense},\
1,&t\in\mathcal P_{\rm sparse}.
\end{cases}
]

### (\mathsf{Flash})

[
\boxed{
N_{\rm dense}^{\rm Flash}
=========================

10^{12}\ \mathrm{tokens}
}
]

[
N_{\rm consumed}<10^{12}
\Longrightarrow
\chi_t^{\rm sparse}=0.
]

[
L_t=65536
\Longrightarrow
\text{sparsity introduction becomes eligible}.
]

[
\boxed{
\text{dense}
\rightarrow
\text{CSA-indexer warmup}
\rightarrow
\text{sparse main training}
}
]

[
N_{\rm indexer\ warmup}
=======================

\mathrm{UNDISCLOSED}.
]

### (\mathsf{Pro})

[
\boxed{
N_{\rm dense}^{\rm Pro}

>

N_{\rm dense}^{\rm Flash}
}
]

[
N_{\rm dense}^{\rm Pro}
=======================

\mathrm{UNDISCLOSED}.
]

([arXiv][1])

---

# (\boxed{\mathbf{8.\ TOKEN\text{-}BATCH\ SCHEDULING}})

[
\mathcal B_t^{\rm tok}
======================

\bigcup_{k\in I_t}
\mathsf S_{t,k}.
]

[
B_t^{\rm tok}
=============

\sum_{k\in I_t}
L_{t,k}^{\rm effective}.
]

### (\mathsf{Flash})

[
B_t^{\rm tok}:
B_{\rm init}^{\rm Flash}
\uparrow
75.5\times10^{6}
]

[
B_{\rm init}^{\rm Flash}
========================

\mathrm{UNDISCLOSED}.
]

[
\boxed{
B_t^{\rm tok}
=============

75.5\mathrm M
\quad
\text{for most training}
}
]

### (\mathsf{Pro})

[
B_t^{\rm tok}:
B_{\rm init}^{\rm Pro}
\uparrow
94.4\times10^{6}
]

[
B_{\rm init}^{\rm Pro}
======================

\mathrm{UNDISCLOSED}.
]

[
\boxed{
B_{\max}^{\rm Pro}
==================

94.4\mathrm M
}
]

([arXiv][1])

---

# (\boxed{\mathbf{8.1\ NUMBER\ OF\ PACKED\ SEQUENCES}})

[
B_t^{\rm seq}
\approx
\frac{B_t^{\rm tok}}{L_t}
\qquad[\mathrm{DERIVED}]
]

### (\mathsf{Flash})

[
\begin{array}{c|c}
L_t & 75.5\times10^6/L_t\
\hline
4096 & \approx18432\
16384&\approx4608\
65536&\approx1152\
1048576&\approx72
\end{array}
]

### (\mathsf{Pro})

[
\begin{array}{c|c}
L_t &94.4\times10^6/L_t\
\hline
4096&\approx23047\
16384&\approx5762\
65536&\approx1440\
1048576&\approx90
\end{array}
]

[
\boxed{
B_t^{\rm seq}
\text{ above}
=============

\mathrm{DERIVED}
\neq
\mathrm{reported\ batch\ cardinality}
}
]

---

# (\boxed{\mathbf{9.\ GLOBAL\ BATCH\ SCHEMA}})

[
\boxed{
\mathcal B_t
============

(
X_t,
C_t,
A_t,
Y_t^{(0)},
M_t^{(0)},
Y_t^{(1)},
M_t^{(1)}
)
}
]

[
X_t
\in
\mathbb N^{B_t^{\rm seq}\times L_t}
]

[
C_t
\in
\mathbb Z^{B_t^{\rm seq}\times L_t}
]

[
Y_t^{(0)}
\in
\mathbb N^{B_t^{\rm seq}\times(L_t-1)}
]

[
Y_t^{(1)}
\in
\mathbb N^{B_t^{\rm seq}\times(L_t-2)}.
]

[
A_t:
\left(
C_t,,
\mathrm{causal}
\right)
\mapsto
\mathsf{SampleLevelCausalMask}.
]

---

# (\boxed{\mathbf{10.\ DISTRIBUTED\ PARTITION}})

[
\mathcal B_t
\xrightarrow{\mathsf{DP}}
{
\mathcal B_t^{(r)}
}*{r=1}^{N*{\rm DP}}
]

[
\mathcal B_t^{(r)}
\xrightarrow{\mathsf{PP}}
\mathcal P_{t,1:R_{\rm PP}}^{(r)}
]

[
\mathcal B_t^{(r)}
\xrightarrow[\ L_t\gg1\ ]{\mathsf{CP}}
{
\mathcal B_{t,c}^{(r)}
}*{c=1}^{N*{\rm CP}}.
]

[
\boxed{
N_{\rm DP},
\quad
N_{\rm PP},
\quad
N_{\rm EP},
\quad
N_{\rm CP}
==========

\mathrm{UNDISCLOSED}
}
]

[
\boxed{
\text{V4 training framework}
============================

\text{V3 foundation}
+
\text{hybrid ZeRO}
+
\text{DualPipe-1F1B}
+
\text{long-context CP}
}
]

([arXiv][1])

---

# (\boxed{\mathbf{10.1\ CONTEXT\ PARTITION}})

[
X
=

[
X^{(1)};
X^{(2)};
\ldots;
X^{(N_{\rm CP})}
]
]

[
|X^{(c)}|
=========

s.
]

[
\boxed{
L_t=N_{\rm CP}s
}
]

[
\mathcal B_{t,c}
================

X_{:,cs:(c+1)s}.
]

[
\boxed{
\text{sample boundaries}
\not\equiv
\text{CP boundaries}
}
]

[
\boxed{
\text{document boundaries}
\not\equiv
\text{CP boundaries}
}
]

([arXiv][1])

---

# (\boxed{\mathbf{11.\ ANTICIPATORY\ ROUTING\ DATA\ PREFETCH}})

[
\boxed{
\theta_t
\neq
\theta_{t-\Delta t}
}
]

[
\boxed{
\mathcal B_t
\text{ fetched at }
t-\Delta t
}
]

[
R_t
===

\operatorname{RouteIndex}
(
\mathcal B_t;
\theta_{t-\Delta t},
b_{t-\Delta t}
)
]

[
\operatorname{Cache}(R_t).
]

[
\boxed{
\text{at step }t:
\qquad
H_t
===

\mathsf M_{\theta_t}
(
\mathcal B_t;
R_t
)
}
]

[
\boxed{
\begin{array}{c}
\text{feature parameters}=\theta_t\
\text{routing indices}=R(\theta_{t-\Delta t})
\end{array}
}
]

[
\boxed{
\Delta t
========

\mathrm{UNDISCLOSED}
}
]

([arXiv][1])

---

# (\boxed{\mathbf{12.\ MICRO\text{-}BATCH\ FORMATION}})

[
\mathcal B_t
============

\bigsqcup_{a=1}^{G_t}
\mathcal B_{t,a}^{\mu}.
]

[
B_{t,\mu}^{\rm tok}
===================

|\mathcal B_{t,a}^{\mu}|_{\rm token}.
]

[
\sum_{a=1}^{G_t}
B_{t,\mu,a}^{\rm tok}
=====================

B_t^{\rm tok}.
]

[
\boxed{
B_{\mu}^{\rm seq},
\quad
B_{\mu}^{\rm tok},
\quad
G_t
===

\mathrm{UNDISCLOSED}
}
]

[
\boxed{
\mathcal B_{t,a}^{\mu}
\rightarrow
\text{DualPipe-1F1B schedule}
}
]

([arXiv][1])

---

# (\boxed{\mathbf{13.\ FORWARD\ CONTRACT}})

[
\boxed{
\left(
Z_{t,a}^{(0)},
P_{t,a}^{(1)},
S_{t,a},
R_{t,a}
\right)
=======

\mathsf M_{\theta_t}
\left(
X_{t,a},
A_{t,a};
R_t
\right)
}
]

[
Z_{t,a}^{(0)}
\in
\mathbb R^{
B_{\mu}\times L_t\times|V|
}
]

[
P_{t,a}^{(0)}
=============

\operatorname{Softmax}
(
Z_{t,a}^{(0)}
)
]

[
P_{t,a}^{(1)}
\in
[0,1]^{
B_{\mu}\times(L_t-2)\times|V|
}
]

[
S_{t,a}
=======

{s_{e,j}}
]

[
R_{t,a}
=======

{\operatorname{expertID}_{j,k}}.
]

[
\boxed{
\text{no internal architecture expansion}
}
]

---

# (\boxed{\mathbf{14.\ MAIN\ LANGUAGE\ MODEL\ LOSS}})

[
\boxed{
\mathcal L_{\rm LM}^{(t,a)}
===========================

*

\frac{1}{Z_{t,a}^{(0)}}
\sum_{b}
\sum_{j}
M_{t,a,b,j}^{(0)}
\log
P_{t,a,b,j}^{(0)}
\left[
Y_{t,a,b,j}^{(0)}
\right]
}
]

[
\boxed{
M^{(0)},
\quad
Z^{(0)}
=======

\mathrm{UNDISCLOSED}
}
]

[
\boxed{
\mathcal L_{\rm LM}
\text{ above}
=============

\mathrm{DERIVED\ AUTOREGRESSIVE\ REPRESENTATION}
}
]

---

# (\boxed{\mathbf{15.\ MTP\ LOSS}})

[
D=1.
]

[
\boxed{
\mathcal L_{\rm MTP}^{1}
========================

-\frac{1}{T}
\sum_{i=3}^{T+1}
\log
P_i^{1}[t_i]
}
]

[
\boxed{
\mathcal L_{\rm MTP}
====================

\frac{\lambda_t}{D}
\sum_{k=1}^{D}
\mathcal L_{\rm MTP}^{k}
}
]

[
D=1
\Longrightarrow
\mathcal L_{\rm MTP}
====================

\lambda_t
\mathcal L_{\rm MTP}^{1}.
]

[
\lambda_t
=========

\begin{cases}
0.3,
&
t<t_{\rm LR-decay},
\
0.1,
&
t\ge t_{\rm LR-decay}.
\end{cases}
]

([arXiv][1])

---

# (\boxed{\mathbf{16.\ SEQUENCE\text{-}WISE\ BALANCE\ LOSS}})

[
\boxed{
\mathcal L_{\rm Bal}
====================

\alpha
\sum_{e=1}^{N_r}
f_eP_e
}
]

[
f_e
===

\frac{N_r}{K_rT}
\sum_{j=1}^{T}
\mathbf1
\left[
s_{e,j}
\in
\operatorname{TopK}
(
{s_{q,j}}_{q=1}^{N_r},
K_r
)
\right]
]

[
s'_{e,j}
========

\frac{s_{e,j}}
{\sum_{q=1}^{N_r}s_{q,j}}
]

[
P_e
===

\frac1T
\sum_{j=1}^{T}
s'_{e,j}.
]

[
\boxed{
\alpha=10^{-4}
}
]

([arXiv][2])

---

# (\boxed{\mathbf{17.\ PRETRAINING\ OBJECTIVE}})

[
\boxed{
\mathcal L_{t,a}
================

\mathcal L_{\rm LM}^{(t,a)}
+
\mathcal L_{\rm MTP}^{(t,a)}
+
\mathcal L_{\rm Bal}^{(t,a)}
}
]

[
\boxed{
\mathcal L_{\rm pre}
====================

\mathcal L_{\rm LM}
+
\lambda_t\mathcal L_{\rm MTP}^{1}
+
10^{-4}
\sum_{e=1}^{N_r}f_eP_e
}
]

[
\boxed{
\text{composite equality}
=========================

\mathrm{DERIVED\ FROM\ REPORTED\ TERMS}
}
]

---

# (\boxed{\mathbf{18.\ GRADIENT\ ACCUMULATION}})

[
g_{t,a}^{(r)}
=============

\nabla_{\theta}
\mathcal L_{t,a}^{(r)}.
]

[
g_t^{(r)}
=========

\sum_{a=1}^{G_t}
\omega_{t,a}
g_{t,a}^{(r)}.
]

[
\boxed{
\omega_{t,a}
============

\mathrm{UNDISCLOSED}
}
]

[
\boxed{
\text{loss-token weighted accumulation}
\neq
\text{microbatch mean}
\quad
\text{unless disclosed}
}
]

---

# (\boxed{\mathbf{19.\ MOE\ GRADIENT\ SYNCHRONIZATION}})

[
g_{\rm MoE}^{\rm local}
\xrightarrow{
Q_{\rm BF16}^{\rm stochastic}
}
\tilde g_{\rm MoE}^{\rm local}.
]

[
\boxed{
\tilde g_{\rm MoE}
==================

Q_{\rm BF16}^{\rm stochastic}(g_{\rm MoE})
}
]

[
{\tilde g_r}*{r=1}^{N*{\rm DP}}
\xrightarrow{\rm AllToAll}
{
\tilde g_{r\rightarrow j}
}.
]

[
\boxed{
\widehat g_j
============

\sum_{r=1}^{N_{\rm DP}}
\operatorname{FP32}
(
\tilde g_{r\rightarrow j}
)
}
]

[
\boxed{
\text{AllToAll}
+
\text{local FP32 accumulation}
}
]

[
\boxed{
\neq
\text{ordinary low-precision ring/tree reduce-scatter}
}
]

([arXiv][1])

---

# (\boxed{\mathbf{20.\ OPTIMIZER\ PARAMETER\ PARTITION}})

[
\theta
======

\theta_{\rm AdamW}
\dot\cup
\theta_{\rm Muon}.
]

[
\boxed{
\theta_{\rm AdamW}
==================

\theta_{\rm Emb}
\cup
\theta_{\rm Head}
\cup
\theta_{\rm RMSNorm}
\cup
\theta_{\rm mHC-static-bias}
\cup
\theta_{\rm mHC-gating}
}
]

[
\boxed{
\theta_{\rm Muon}
=================

\theta
\setminus
\theta_{\rm AdamW}
}
]

([arXiv][1])

---

# (\boxed{\mathbf{21.\ ADAMW\ UPDATE}})

[
\beta_1=0.9,
\qquad
\beta_2=0.95,
\qquad
\epsilon=10^{-20},
\qquad
\lambda_{\rm wd}=0.1.
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
(1-\beta_2)g_t^2
]

[
\hat m_t
========

\frac{m_t}{1-\beta_1^t}
]

[
\hat v_t
========

\frac{v_t}{1-\beta_2^t}
]

[
\boxed{
w_{t+1}
=======

## (1-\eta_t\lambda_{\rm wd})w_t

\eta_t
\frac{\hat m_t}
{\sqrt{\hat v_t}+\epsilon}
}
\qquad
w\in\theta_{\rm AdamW}.
]

[
\boxed{
\text{AdamW algebra above}
==========================

\mathrm{algorithmic\ expansion};
\quad
{\beta_1,\beta_2,\epsilon,\lambda}
==================================

\mathrm{REPORTED}.
}
]

([arXiv][1])

---

# (\boxed{\mathbf{22.\ MUON\ UPDATE}})

[
\mu=0.95,
\qquad
\lambda_{\rm wd}=0.1,
\qquad
\gamma_{\rm RMS}=0.18.
]

[
G_t
===

\nabla_W
\mathcal L_t(W_{t-1})
]

[
M_t
===

\mu M_{t-1}+G_t
]

[
Q_t
===

\mu M_t+G_t.
]

[
Q_t^{(0)}
=========

\frac{Q_t}{|Q_t|_F}.
]

[
Q_t^{(k)}
=========

a_kQ_t^{(k-1)}
+
b_k
(Q_t^{(k-1)}Q_t^{(k-1)T})
Q_t^{(k-1)}
+
c_k
(Q_t^{(k-1)}Q_t^{(k-1)T})^2
Q_t^{(k-1)}.
]

[
(a_k,b_k,c_k)
=============

\begin{cases}
(3.4445,-4.7750,2.0315),
&
1\le k\le8,
\
(2,-1.5,0.5),
&
9\le k\le10.
\end{cases}
]

[
O_t'
====

Q_t^{(10)}
]

[
O_t
===

O_t'
\sqrt{\max(n,m)}
\gamma_{\rm RMS}.
]

[
\boxed{
W_t
===

W_{t-1}
(1-\eta_t\lambda_{\rm wd})
--------------------------

\eta_tO_t
}
]

[
W\in\theta_{\rm Muon}.
]

([arXiv][1])

---

# (\boxed{\mathbf{23.\ MUON\ ZeRO\ OWNERSHIP}})

## (\boxed{\mathbf{23.1\ DENSE}})

[
\mathcal W_{\rm dense}
======================

{
W_1,\ldots,W_M
}.
]

[
\boxed{
\mathcal A
==========

\mathsf{KnapsackAssign}
(
\mathcal W_{\rm dense},
N_{\rm ZeRO}
)
}
]

[
\mathcal A_r
\cap
\mathcal A_q
============

\varnothing
\qquad
(r\neq q).
]

[
\left|
\sum_{W\in\mathcal A_r}|W|
--------------------------

\sum_{W\in\mathcal A_q}|W|
\right|
\rightarrow
\min.
]

[
|\mathcal A_r|
\le5
\qquad
[\mathrm{REPORTED\ SETUP}].
]

[
B_r
===

\operatorname{Flatten}
(
\mathcal A_r
)
]

[
|B_r|
\xrightarrow{\rm pad}
\max_q|B_q|.
]

[
\boxed{
\mathrm{padding\ overhead}<10%
}
]

([arXiv][1])

---

## (\boxed{\mathbf{23.2\ MoE}})

[
\mathcal W_{\rm MoE}
====================

{
W_{\rm down},
W_{\rm up},
W_{\rm gate}
}_{\rm all\ experts,\ all\ layers}
]

[
V_{\rm down}
============

\operatorname{Flatten}
(
{W_{\rm down}}
)
]

[
V_{\rm up}
==========

\operatorname{Flatten}
(
{W_{\rm up}}
)
]

[
V_{\rm gate}
============

\operatorname{Flatten}
(
{W_{\rm gate}}
)
]

[
V_{\rm MoE}
===========

V_{\rm down}
\Vert
V_{\rm up}
\Vert
V_{\rm gate}.
]

[
\boxed{
\text{partition boundary}
\notin
\operatorname{Interior}(W)
}
]

[
\boxed{
\text{no logically independent matrix is split}
}
]

([arXiv][1])

---

# (\boxed{\mathbf{24.\ EXTERNAL\ ROUTING\ BIAS\ UPDATE}})

[
b_{e,t}
\notin
\theta_{\rm gradient}.
]

[
\ell_{e,t}
==========

\sum_{\text{all batch tokens}}
\mathbf1[e\in R_{t,j}].
]

[
\bar\ell_t
==========

\frac1{N_r}
\sum_{e=1}^{N_r}
\ell_{e,t}.
]

[
b_{e,t+1}
=========

\begin{cases}
b_{e,t}-\gamma_b,
&
\ell_{e,t}>\bar\ell_t,
\
b_{e,t}+\gamma_b,
&
\ell_{e,t}<\bar\ell_t,
\
b_{e,t},
&
\ell_{e,t}=\bar\ell_t.
\end{cases}
]

[
\boxed{
\gamma_b=0.001
}
]

[
\boxed{
b_{t+1}
=======

F(b_t,\ell_t)
\neq
b_t-\eta\nabla_b\mathcal L_t
}
]

([arXiv][2])

---

# (\boxed{\mathbf{25.\ LEARNING\ RATE\ SCHEDULE}})

## (\boxed{\mathsf{Flash}})

[
\eta_t
======

\begin{cases}
\displaystyle
2.7\times10^{-4}
\frac{t}{2000},
&
0\le t<2000,
[3mm]
2.7\times10^{-4},
&
2000\le t<t_{\rm decay},
[2mm]
\mathsf{Cosine}
\left(
2.7\times10^{-4},
2.7\times10^{-5}
\right),
&
t\ge t_{\rm decay}.
\end{cases}
]

[
t_{\rm decay}
=============

\mathrm{UNDISCLOSED}.
]

## (\boxed{\mathsf{Pro}})

[
\eta_{\max}
===========

2.0\times10^{-4}
]

[
\eta_{\rm final}
================

2.0\times10^{-5}.
]

[
\boxed{
\text{schedule shape}
\approx
\mathsf{Flash}
}
]

([arXiv][1])

---

# (\boxed{\mathbf{26.\ LOSS\ WEIGHT\ SCHEDULE}})

[
\boxed{
\alpha_{\rm Bal}
================

10^{-4}
\quad
\forall t
}
]

[
\boxed{
\lambda_{\rm MTP}(t)
====================

\begin{cases}
0.3,&t<t_{\rm decay},\
0.1,&t\ge t_{\rm decay}.
\end{cases}
}
]

[
\boxed{
\gamma_{\rm routing}=10^{-3}
}
]

([arXiv][1])

---

# (\boxed{\mathbf{27.\ ONE\ COMPLETE\ TRAINING\ STEP}})

[
\boxed{
\begin{aligned}
&\mathbf{for}\quad t=0,\ldots,T_{\rm train}-1
[1mm]
&
\quad
L_t
\leftarrow
\mathsf{ContextSchedule}(N_{\rm consumed})
\
&
\quad
B_t^{\rm tok}
\leftarrow
\mathsf{BatchSchedule}(N_{\rm consumed})
\
&
\quad
\lambda_t
\leftarrow
\mathsf{MTPSchedule}(N_{\rm consumed})
\
&
\quad
\eta_t
\leftarrow
\mathsf{LRSchedule}(t,N_{\rm consumed})
[2mm]
&
\quad
\mathcal D_t
\sim
p_t(
\mathcal D_{\rm web},
\mathcal D_{\rm math},
\mathcal D_{\rm code},
\mathcal D_{\rm multilingual},
\mathcal D_{\rm long},
\mathcal D_{\rm agentic},
\ldots
)
\
&
\quad
p_t
===

\mathrm{UNDISCLOSED}
[2mm]
&
\quad
{d_i}
\leftarrow
\mathsf{SampleDocuments}
(
\mathcal D_t
)
[1mm]
&
\quad
\mathbf{for}\ d_i:
\
&
\qquad
u_i\sim U(0,1)
\
&
\qquad
\tilde d_i
==========

\begin{cases}
\mathsf{PSM}(d_i),
&
u_i<0.1,
\
d_i,
&
u_i\ge0.1
\end{cases}
\
&
\qquad
X_i
===

\mathsf{TokenSplit}
\left(
\tau_{\rm V4}(\tilde d_i)
\right)
\
&
\quad
\mathbf{end}
[2mm]
&
\quad
\Pi_t
=====

\mathsf{Pack}
(
{X_i},
L_t,
{s_i}
)
\
&
\quad
\mathcal B_t
============

\mathsf{MaterializePackedBatch}
(
\Pi_t,
B_t^{\rm tok}
)
\
&
\quad
C_t
===

\mathsf{SampleIDs}
(
\mathcal B_t
)
\
&
\quad
A_t[p,q]
========

\mathbf1[q\le p]
\mathbf1[C_t[p]=C_t[q]]
[1mm]
&
\quad
(Y_t^{(0)},M_t^{(0)})
=====================

\mathsf{NextTokenTargets}(X_t,C_t)
\
&
\quad
(Y_t^{(1)},M_t^{(1)})
=====================

\mathsf{MTP1Targets}(X_t,C_t)
\
&
\quad
M_t^{(0)},M_t^{(1)}
===================

\mathrm{UNDISCLOSED}
[2mm]
&
\quad
R_t
===

\mathsf{CachedRoute}
(
\mathcal B_t;
\theta_{t-\Delta t}
)
[2mm]
&
\quad
\mathcal B_t
============

\bigsqcup_{a=1}^{G_t}
\mathcal B_{t,a}^{\mu}
[2mm]
&
\quad
g_t
\leftarrow0
[1mm]
&
\quad
\mathbf{for}\ a=1,\ldots,G_t:
\
&
\qquad
(
Z^{(0)}*{t,a},
P^{(1)}*{t,a},
S_{t,a},
R_{t,a}
)
=

\mathsf M_{\theta_t}
(
X_{t,a},
A_{t,a};
R_t
)
\
&
\qquad
P^{(0)}_{t,a}
=============

\operatorname{softmax}
(
Z^{(0)}*{t,a}
)
\
&
\qquad
\mathcal L*{\rm LM}^{t,a}
=========================

-\frac1{Z^{(0)}*{t,a}}
\sum*{b,j}
M_{b,j}^{(0)}
\log
P_{b,j}^{(0)}
[
Y_{b,j}^{(0)}
]
\
&
\qquad
\mathcal L_{\rm MTP}^{t,a}
==========================

-\frac{\lambda_t}{T}
\sum_i
\log
P_i^{(1)}[t_i]
\
&
\qquad
\mathcal L_{\rm Bal}^{t,a}
==========================

10^{-4}
\sum_e
f_eP_e
\
&
\qquad
\mathcal L_{t,a}
================

\mathcal L_{\rm LM}^{t,a}
+
\mathcal L_{\rm MTP}^{t,a}
+
\mathcal L_{\rm Bal}^{t,a}
\
&
\qquad
g_{t,a}
=======

\nabla_{\theta_t}
\mathcal L_{t,a}
\
&
\qquad
g_t
\leftarrow
g_t+\omega_{t,a}g_{t,a}
\
&
\quad
\mathbf{end}
[2mm]
&
\quad
\widehat g_t
============

\mathsf{DistributedGradientSync}
(
g_t
)
[1mm]
&
\quad
\theta^{\rm AdamW}_{t+1}
========================

\mathsf{AdamW}
(
\theta^{\rm AdamW}*{t},
\widehat g_t,
\eta_t
)
\
&
\quad
\theta^{\rm Muon}*{t+1}
=======================

\mathsf{Muon}
(
\theta^{\rm Muon}*{t},
\widehat g_t,
\eta_t
)
\
&
\quad
b*{t+1}
=======

F_{\rm load}
(
b_t,
\ell_t;
10^{-3}
)
\
&
\quad
N_{\rm consumed}
\leftarrow
N_{\rm consumed}
+
B_t^{\rm tok}
[1mm]
&
\mathbf{end}
\end{aligned}}
]

([arXiv][1])

---

# (\boxed{\mathbf{28.\ PRETRAINING\ STATE\ TRANSITION}})

[
\boxed{
\begin{aligned}
&
(
\theta_t,
b_t,
\mathcal D_t,
L_t,
B_t^{\rm tok},
\eta_t,
\lambda_t,
\chi_t^{\rm sparse}
)
\
&
\qquad
\xrightarrow{
\mathsf{sample}
}
{d_i}
\
&
\qquad
\xrightarrow{
\mathsf{FIM}*{0.1}
}
{\tilde d_i}
\
&
\qquad
\xrightarrow{
\mathsf{ByteBPE}
+
\mathsf{TokenSplit}
}
{X_i}
\
&
\qquad
\xrightarrow{
\mathsf{SourceAwarePack}
}
(X,C)
\
&
\qquad
\xrightarrow{
\mathsf{SampleLevelMask}
}
(X,C,A)
\
&
\qquad
\xrightarrow{
\mathsf{TargetConstruction}
}
(X,A,Y^{(0)},Y^{(1)},M^{(0)},M^{(1)})
\
&
\qquad
\xrightarrow{
\mathsf{TokenBatch}
}
\mathcal B_t
\
&
\qquad
\xrightarrow{
\mathsf{DistributedMicrobatch}
}
{\mathcal B*{t,a}^{(r)}}
\
&
\qquad
\xrightarrow{
\mathsf M_{\theta_t}
}
(P^{(0)},P^{(1)},S,R)
\
&
\qquad
\xrightarrow{
\mathcal L_{\rm LM}
+
\lambda_t\mathcal L_{\rm MTP}
+
10^{-4}\mathcal L_{\rm balance}
}
g_t
\
&
\qquad
\xrightarrow{
\mathsf{AdamW}\oplus\mathsf{Muon}
}
\theta_{t+1}
\
&
\qquad
\xrightarrow{
F_{\rm load}
}
b_{t+1}.
\end{aligned}}
]

---

# (\boxed{\mathbf{29.\ DISCLOSED\ /\ UNDISCLOSED\ BOUNDARY}})

[
\boxed{
\begin{array}{c|c}
\text{Field} & \text{State}\
\hline
\text{corpus}>32\mathrm T & \mathrm{REPORTED}\
\text{Flash token budget}=32\mathrm T & \mathrm{REPORTED}\
\text{Pro token budget}=33\mathrm T & \mathrm{REPORTED}\
\text{web auto/template filtering} & \mathrm{REPORTED}\
\text{math/code core corpus} & \mathrm{REPORTED}\
\text{agentic mid-training data} & \mathrm{REPORTED}\
\text{long-document emphasis} & \mathrm{REPORTED}\
\text{Byte-level BPE inheritance} & \mathrm{INHERITED}\
\text{report vocabulary}=128\mathrm K & \mathrm{REPORTED}\
\text{model vocabulary}=129280 & \mathrm{CODE!-!VERIFIED}\
\text{FIM PSM} & \mathrm{INHERITED/EQUATION!-!VERIFIED}\
p_{\rm FIM}=0.1 & \mathrm{INHERITED}\
\text{token splitting} & \mathrm{INHERITED}\
p_{\rm split} & \mathrm{UNDISCLOSED}\
\text{document packing} & \mathrm{REPORTED}\
\text{packing optimizer/heuristic} & \mathrm{UNDISCLOSED}\
\text{sample-level attention masking} & \mathrm{REPORTED}\
\text{physical mask representation} & \mathrm{UNDISCLOSED}\
\text{cross-document target masking} & \mathrm{UNDISCLOSED}\
\text{ordinary document separator} & \mathrm{UNDISCLOSED}\
L:4K\rightarrow16K\rightarrow64K\rightarrow1M & \mathrm{REPORTED}\
B_{\max}^{Flash}=75.5M & \mathrm{REPORTED}\
B_{\max}^{Pro}=94.4M & \mathrm{REPORTED}\
B_{\rm initial} & \mathrm{UNDISCLOSED}\
D_{\rm MTP}=1 & \mathrm{REPORTED}\
\lambda_{\rm MTP}:0.3\rightarrow0.1 & \mathrm{REPORTED}\
\alpha_{\rm Bal}=10^{-4} & \mathrm{REPORTED}\
\gamma_{\rm route}=10^{-3} & \mathrm{REPORTED}\
\text{microbatch size} & \mathrm{UNDISCLOSED}\
\text{gradient accumulation count} & \mathrm{UNDISCLOSED}\
\text{DP/PP/EP/CP degrees} & \mathrm{UNDISCLOSED}\
\text{Muon/AdamW parameter partition} & \mathrm{REPORTED}\
\text{Muon update} & \mathrm{EQUATION!-!VERIFIED}\
\text{anticipatory routing} & \mathrm{REPORTED}\
\Delta t_{\rm routing} & \mathrm{UNDISCLOSED}
\end{array}}
]

[
\boxed{
\mathcal D_{\rm raw}
\overset{\rm curate}{\longrightarrow}
d
\overset{\rm FIM}{\longrightarrow}
\tilde d
\overset{\rm tokenize}{\longrightarrow}
X_i
\overset{\rm pack}{\longrightarrow}
(X,C)
\overset{\rm sample-mask}{\longrightarrow}
(X,A)
\overset{\rm labels}{\longrightarrow}
(X,A,Y^{0},Y^{1})
\overset{\rm batch}{\longrightarrow}
\mathcal B
\overset{\rm shard}{\longrightarrow}
\mathcal B^{\mu,r}
\overset{\mathsf M_\theta}{\longrightarrow}
\mathcal L_{\rm pre}
\overset{\nabla}{\longrightarrow}
g
\overset{\rm AdamW\oplus Muon}{\longrightarrow}
\theta^{+}
}
]

[
\boxed{
\begin{gathered}
\textbf{DEEPSEEK-V4 SPECIALIST REINFORCEMENT LEARNING}[2mm]
\mathsf M_{\theta}:\text{BLACK-BOX POLICY MODEL}[1mm]
\mathcal D_{\rm RL}
\rightarrow
\mathcal Q
\rightarrow
\pi_{\rm old}
\rightarrow
{\tau_i}*{i=1}^{G}
\rightarrow
\mathcal E
\rightarrow
{R_i}*{i=1}^{G}
\rightarrow
{\hat A_i}*{i=1}^{G}
\rightarrow
\mathcal B*{\rm RL}
\rightarrow
\mathsf M_{\theta}
\rightarrow
\mathcal J_{\rm GRPO}
\rightarrow
\nabla_\theta
\rightarrow
\theta^{+}
\end{gathered}}
]

[
\boxed{
x\notin
{
\mathrm{REPORTED},
\mathrm{CODE!-!VERIFIED},
\mathrm{EQUATION!-!VERIFIED},
\mathrm{INHERITED},
\mathrm{DERIVED}
}
\Longrightarrow
x=\mathrm{UNDISCLOSED}
}
]



---

# [

\boxed{\textbf{Algorithm 1}\qquad
\mathsf{DSV4_SPECIALIST_RL}}
]

## [

\boxed{\mathbf{0.\ RL\ POSITION\ IN\ THE\ TRAINING\ PROGRAM}}
]

[
\forall e\in\mathcal E_{\rm domain}:
]

[
\boxed{
\theta_{\rm Base}
\xrightarrow{\mathsf{SFT}^{(e)}}
\theta_{\rm SFT}^{(e)}
\xrightarrow{\mathsf{GRPO}^{(e)}}
\theta_{\rm RL}^{(e)}
}
]

[
\mathcal E_{\rm domain}
\supseteq
{
\mathrm{mathematics},
\mathrm{coding},
\mathrm{agent},
\mathrm{instruction}
}
]

[
\boxed{
\mathsf{MixedRL}_{\rm final}^{\rm V4}
=====================================

\varnothing
}
]

[
\boxed{
\mathsf{SpecialistRL}_{\rm V4}
\neq
\varnothing
}
]

[
\boxed{
{\theta_{\rm RL}^{(e)}}*{e}
\xrightarrow{\rm OPD}
\theta*{\rm final}
}
]

[
\boxed{
\mathsf{OPD}
\notin
\mathsf{RL\ stage\ reconstructed\ below}
}
]

([arXiv][1])

---

# [

\boxed{\mathbf{1.\ RL\ INITIAL\ STATE}}
]

[
e\in\mathcal E_{\rm domain}
]

[
\rho
\in
\mathcal E_{\rm effort}
=======================

{
\mathrm{NonThink},
\mathrm{High},
\mathrm{Max}
}
]

[
\boxed{
\theta_0^{(e,\rho)}
\leftarrow
\theta_{\rm SFT}^{(e,\rho)}
}
]

[
\boxed{
\theta_{\rm SFT}^{(e,\rho)}
===========================

\theta_{\rm SFT}^{(e)}
}
]

[
\boxed{\mathrm{UNDISCLOSED}}
]

[
\boxed{
\text{whether effort branches share exactly one SFT checkpoint}
===============================================================

\mathrm{UNDISCLOSED}
}
]

[
\boxed{
\theta_{\rm RL}^{(e,\rho)}
==========================

\mathsf{GRPO}
\left(
\theta_{\rm SFT}^{(e,\rho)};
\mathcal D_e,
\mathcal R_{e,\rho},
L_{e,\rho}^{\max},
\lambda_{e,\rho}^{\rm len}
\right)
}
]

[
\boxed{
L_{e,\rho}^{\max},
\lambda_{e,\rho}^{\rm len}
\text{ differ across effort modes}
}
]

[
\boxed{
L_{e,\rho}^{\max},
\lambda_{e,\rho}^{\rm len}
==========================

\mathrm{UNDISCLOSED}
}
]

([arXiv][1])

---

# [

\boxed{\mathbf{2.\ CURRENT\ V4\ OBJECTIVE\ BOUNDARY}}
]

[
\boxed{
\operatorname{Algorithm}_{\rm V4}
=================================

\mathrm{GRPO}
}
]

[
\boxed{
\operatorname{HyperParams}*{\rm V4}
\approx
\operatorname{HyperParams}*{\rm prior}
}
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
\mathcal J_{\rm GRPO}^{\rm V4}
\stackrel{\large ?}{=}
\mathcal J_{\rm GRPO}^{\rm V3.2}
}
]

[
\boxed{
\text{NOT ESTABLISHED}
}
]

[
\boxed{
\varepsilon_{\rm V4},
\beta_{\rm V4},
\delta_{\rm V4},
G_{\rm V4},
K_{\rm epoch},
N_{\rm rollout},
N_{\rm mini}
============

\mathrm{UNDISCLOSED}
}
]

([arxiv.org][1])

---

# [

\boxed{\mathbf{3.\ RAW\ RL\ SAMPLE\ SCHEMA}}
]

[
z_n^{(e,\rho)}
==============

\left(
q_n,
s_n,
\Gamma_n,
\mathcal E_n,
\mathcal V_n,
\mathcal U_n,
\rho_n,
\lambda_{{\rm len},n},
\mu_n
\right)
]

[
q_n
===

\text{task/prompt}
]

[
s_n
===

\text{system context}
]

[
\Gamma_n
========

\text{tool schema}
]

[
\mathcal E_n
============

\text{execution environment}
]

[
\mathcal V_n
============

\text{rule/test/verifier}
]

[
\mathcal U_n
============

\text{rubric}
]

[
\rho_n
\in
{
\mathrm{NonThink},
\mathrm{High},
\mathrm{Max}
}
]

[
\lambda_{{\rm len},n}
=====================

\text{effort-dependent length-control state}
]

[
\mu_n
=====

\text{metadata}
]

[
\boxed{
\mathcal D_{\rm RL}^{(e,\rho)}
==============================

\left{
z_n^{(e,\rho)}
\right}*{n=1}^{N*{e,\rho}}
}
]

[
\boxed{
N_{e,\rho},
\quad
p(e),
\quad
p(\rho|e),
\quad
\text{prompt mixture}
=====================

\mathrm{UNDISCLOSED}
}
]

---

# [

\boxed{\mathbf{4.\ PROMPT\ SOURCE}}
]

[
q\sim
P_{e,\rho}(Q)
]

[
\boxed{
P_{e,\rho}(Q)
=============

\mathrm{UNDISCLOSED}
}
]

[
\boxed{
q
\in
\mathcal D_{\rm verifiable}
\cup
\mathcal D_{\rm rubric}
\cup
\mathcal D_{\rm agent}
}
]

[
\mathcal D_{\rm verifiable}
===========================

{
q:
\exists\mathcal V(q,o)
}
]

[
\mathcal D_{\rm rubric}
=======================

{
q:
\exists\mathcal U_q
}
]

[
\mathcal D_{\rm agent}
======================

{
q:
\exists\Gamma_q,\mathcal E_q
}
]

[
\boxed{
\text{exact current task counts}
================================

\mathrm{UNDISCLOSED}
}
]

([arXiv][1])

---

# [

\boxed{\mathbf{5.\ V3.2\ AGENT\ DATA\ LINEAGE}}
]

[
\boxed{
\mathcal D_{\rm V3.2}^{\rm agent}
=================================

\mathcal D_{\rm code}
\cup
\mathcal D_{\rm search}
\cup
\mathcal D_{\rm interpreter}
\cup
\mathcal D_{\rm general}
}
]

[
\begin{array}{c|c|c}
e&|\mathcal D_e|&\mathcal E_e\
\hline
\mathrm{code}&24667&\mathrm{real}\
\mathrm{search}&50275&\mathrm{real}\
\mathrm{general}&4417&\mathrm{synthetic}\
\mathrm{interpreter}&5908&\mathrm{real}
\end{array}
]

[
\boxed{
\mathcal D_{\rm V4}^{\rm agent}
===============================

\mathcal D_{\rm V3.2}^{\rm agent}
}
]

[
\boxed{\mathrm{NOT\ PROVEN}}
]

[
\boxed{
\mathsf{Pipeline}_{\rm V4}
==========================

\mathsf{Adapt}
(
\mathsf{Pipeline}_{\rm V3.2}
)
}
]

([arXiv][2])

---

# [

\boxed{\mathbf{6.\ RL\ PROMPT\ SERIALIZATION\ CONSTANTS}}
]

[
B=\mathtt{<｜begin▁of▁sentence｜>}
]

[
E=\mathtt{<｜end▁of▁sentence｜>}
]

[
U=\mathtt{<｜User｜>}
]

[
A=\mathtt{<｜Assistant｜>}
]

[
H_B=\mathtt{<think>}
]

[
H_E=\mathtt{</think>}
]

[
D=\mathtt{｜DSML｜}
]

[
\boxed{
\mathsf{RLPrompt}
=================

\mathsf{EncodeMessages}_{\rm V4}
(
\mathcal C,\rho,\Gamma
)
}
]

[
\boxed{
\text{V4 has no Jinja chat-template dependency}
}
]

[
\boxed{
\mathsf{EncodeMessages}*{\rm V4}
:
\mathcal C
\rightarrow
S
\rightarrow
\tau*{\rm V4}(S)
}
]

([Hugging Face][3])

---

# [

\boxed{\mathbf{7.\ NON\text{-}THINK\ RL\ PREFIX}}
]

[
\rho=\mathrm{NonThink}
]

[
\boxed{
S(q)
====

B
\Vert
s
\Vert
U
\Vert
q
\Vert
A
\Vert
H_E
}
]

[
\boxed{
o
=

a
\Vert
E
}
]

[
\boxed{
\text{generated reasoning span}
===============================

\varnothing
}
]

([arXiv][1])

---

# [

\boxed{\mathbf{8.\ THINK\ HIGH\ RL\ PREFIX}}
]

[
\rho=\mathrm{High}
]

[
\boxed{
S(q)
====

B
\Vert
s
\Vert
U
\Vert
q
\Vert
A
\Vert
H_B
}
]

[
o
=

h
\Vert
H_E
\Vert
a
\Vert
E
]

[
\boxed{
h
=

\text{generated reasoning token sequence}
}
]

([arXiv][1])

---

# [

\boxed{\mathbf{9.\ THINK\ MAX\ RL\ PREFIX}}
]

[
\rho=\mathrm{Max}
]

[
P_{\max}
========

\text{official maximum-reasoning instruction}
]

[
\boxed{
S(q)
====

P_{\max}
\Vert
B
\Vert
s
\Vert
U
\Vert
q
\Vert
A
\Vert
H_B
}
]

[
o
=

h_{\max}
\Vert
H_E
\Vert
a
\Vert
E
]

[
\boxed{
P_{\max}
\prec
B
}
]

([arXiv][1])

---

# [

\boxed{\mathbf{10.\ TRAINING\ CONTEXT\ WINDOW\ BOUNDARY}}
]

[
L_{\rm RL}^{\rm NonThink}
\neq
L_{\rm RL}^{\rm High}
\neq
L_{\rm RL}^{\rm Max}
\quad
[\mathrm{REPORTED\ DIFFERENT\ CONFIGURATIONS}]
]

[
\boxed{
L_{\rm RL}^{\rm NonThink},
L_{\rm RL}^{\rm High},
L_{\rm RL}^{\rm Max}
====================

\mathrm{UNDISCLOSED}
}
]

[
\boxed{
L_{\rm eval}
\not\Rightarrow
L_{\rm RL}
}
]

[
\boxed{
\text{evaluation context windows}
\neq
\text{evidence for training context windows}
}
]

([arXiv][1])

---

# [

\boxed{\mathbf{11.\ TOOL\ CALL\ SERIALIZATION}}
]

[
g
=

\left(
n,
{(p_j,v_j,\tau_j)}_{j=1}^{J}
\right)
]

[
\boxed{
\Psi(g)
=======

D_{\rm calls}^{B}
\Vert
D_{\rm invoke}^{B}(n)
\Vert
\big\Vert_{j=1}^{J}
\left[
D_{\rm parameter}^{B}(p_j,\tau_j)
\Vert
v_j
\Vert
D_{\rm parameter}^{E}
\right]
\Vert
D_{\rm invoke}^{E}
\Vert
D_{\rm calls}^{E}
}
]

[
D_{\rm calls}^{B}
=================

\mathtt{<｜DSML｜tool_calls>}
]

[
D_{\rm calls}^{E}
=================

\mathtt{</｜DSML｜tool_calls>}
]

[
\boxed{
\text{tool invocations use DSML/XML-style structure}
}
]

([arXiv][1])

---

# [

\boxed{\mathbf{12.\ TOOL\ RESULT\ SERIALIZATION}}
]

[
r_j
===

\text{environment/tool result}
]

[
\boxed{
\Omega(r_j)
===========

\mathtt{<tool_result>}
\Vert
r_j
\Vert
\mathtt{</tool_result>}
}
]

[
\boxed{
\mathsf{ToolResultTurn}
=======================

U
\Vert
\Omega(r_1)
\Vert\cdots\Vert
\Omega(r_K)
}
]

[
\boxed{
(r_1,\ldots,r_K)
================

\operatorname{SortByPreviousCallOrder}
(
{r_j}
)
}
]

([Hugging Face][3])

---

# [

\boxed{\mathbf{13.\ V4\ INTERLEAVED\ THINKING}}
]

[
\mathcal H_t
============

(h_1,\ldots,h_t)
]

[
\mathcal G_t
============

(g_1,o_1,\ldots,g_t,o_t)
]

## [

\boxed{\mathbf{13.1\ TOOL\ CALLING}}
]

[
\boxed{
\mathcal C_{t+1}^{\rm tool}
===========================

\mathcal C_t
\Vert
h_t
\Vert
g_t
\Vert
o_t
}
]

[
\boxed{
\mathcal H_{1:t}
\subset
\mathcal C_{t+1}^{\rm tool}
}
]

[
\boxed{
\text{reasoning survives tool-result rounds}
}
]

[
\boxed{
\text{reasoning also survives new user boundaries in V4 tool mode}
}
]

## [

\boxed{\mathbf{13.2\ GENERAL\ CHAT}}
]

[
u_{t+1}^{\rm new}
\Longrightarrow
\boxed{
\mathcal H_{<t+1}
\mapsto
\varnothing
}
]

[
\boxed{
\mathcal G_{<t+1}
\text{ context behavior}
========================

\text{serialization-dependent}
}
]

([arXiv][1])

---

# [

\boxed{\mathbf{14.\ ROLLOUT\ POLICY\ SNAPSHOT}}
]

[
t
=

\text{learner iteration}
]

[
\boxed{
\theta_t^{\rm old}
\leftarrow
\mathsf{Snapshot}
(
\theta_t
)
}
]

[
\pi_{\rm old}
=============

\pi_{\theta_t^{\rm old}}
]

[
\boxed{
\theta_t^{\rm rollout}
\neq
\theta_t^{\rm learner}
\quad
\text{after learner updates}
}
]

[
\boxed{
\pi_{\rm old}
=============

\text{sampling probabilities directly returned by inference}
}
]

[
\boxed{
\text{exact weight-refresh cadence}
===================================

\mathrm{UNDISCLOSED}
}
]

([arXiv][2])

---

# [

\boxed{\mathbf{15.\ FP4\ ROLLOUT\ POLICY}}
]

[
\theta_{\rm master}
\in
\mathrm{FP32}
]

[
\theta_{\rm learner}^{\rm MoE}
:
\mathrm{FP32}
\xrightarrow{\rm QAT}
\mathrm{FP4}
\xrightarrow{\rm dequant}
\mathrm{FP8\ compute}
]

[
\boxed{
\theta_{\rm rollout}^{\rm MoE}
==============================

Q_{\rm FP4}
(
\theta_{\rm old}
)
}
]

[
\boxed{
\text{rollout uses native FP4 weights}
}
]

[
\boxed{
\text{rollout}
\approx
\text{deployment numerical pathway}
}
]

[
\boxed{
\text{CSA indexer QK rollout path}
==================================

\mathrm{FP4}
}
]

[
\boxed{
\text{index scores}
===================

\mathrm{BF16}
}
]

([arXiv][1])

---

# [

\boxed{\mathbf{16.\ GROUPED\ ROLLOUT\ SAMPLING}}
]

[
q_b
\sim
P_{e,\rho}(Q),
\qquad
b=1,\ldots,B_Q
]

[
\boxed{
o_{b,i}
\sim
\pi_{\rm old}
(
\cdot|q_b
)
\qquad
i=1,\ldots,G
}
]

[
o_{b,i}
=======

(
a_{b,i,1},
\ldots,
a_{b,i,T_{b,i}}
)
]

[
\boxed{
|\mathcal G_b|=G
}
]

[
\boxed{
G_{\rm V4}
==========

\mathrm{UNDISCLOSED}
}
]

[
\boxed{
B_Q^{\rm V4}
============

\mathrm{UNDISCLOSED}
}
]

---

# [

\boxed{\mathbf{17.\ SAMPLING\ DISTRIBUTION}}
]

[
\pi_{\rm old}^{\rm sampler}
(
a_t|s_t
)
=

\mathsf S
\left[
\pi_{\rm old}(a_t|s_t);
T,p,k,\ldots
\right]
]

[
\boxed{
T_{\rm RL},
p_{\rm RL},
k_{\rm RL}
==========

\mathrm{UNDISCLOSED}
}
]

[
\boxed{
\text{inference/evaluation sampling recommendations}
\not\Rightarrow
\text{RL sampler settings}
}
]

---

# [

\boxed{\mathbf{18.\ TOP\text{-}p/k\ SAMPLING\ SUPPORT}}
]

[
\Omega_{b,i,t}^{\rm old}
========================

\left{
v:
v
\text{ survives rollout truncation}
\right}
]

[
m_{b,i,t,v}^{\rm samp}
======================

\mathbf1[
v\in\Omega_{b,i,t}^{\rm old}
]
]

[
\boxed{
m^{\rm samp}
\text{ is persisted during rollout}
}
]

[
\boxed{
\Omega_{\rm old}
\rightarrow
\text{learner}
}
]

[
\boxed{
\text{Keep Sampling Mask}
}
]

([arXiv][2])

---

# [

\boxed{\mathbf{19.\ ROUTING\ TRACE}}
]

[
\mathcal R_{b,i,t,l}^{\rm old}
==============================

{
e_{1},\ldots,e_{K_l}
}
]

[
\boxed{
\mathcal R^{\rm old}
====================

\text{expert routing path during rollout}
}
]

[
\boxed{
\mathcal R^{\rm old}
\rightarrow
\text{learner recomputation}
}
]

[
\boxed{
\mathcal R_{\rm learner}
:=
\mathcal R_{\rm old}
}
]

[
\boxed{
\text{Keep Routing}
}
]

([arXiv][2])

---

# [

\boxed{\mathbf{20.\ AUTOREGRESSIVE\ AGENT\ ROLLOUT}}
]

[
s_0
===

\mathsf{Encode}
(
q,s,\Gamma,\rho
)
]

[
\boxed{
a_t
\sim
\pi_{\rm old}
(
\cdot|s_t
)
}
]

[
a_t
\in
{
\text{text token},
\text{reasoning token},
\text{DSML token},
\text{EOS}
}
]

[
\boxed{
s_{t+1}
=======

F(s_t,a_t,\mathcal E_t)
}
]

[
a_t=\mathrm{toolcall}
\Longrightarrow
]

[
u_t
===

\mathsf{ParseDSML}(a_{\le t})
]

[
e_t
===

\mathcal E
(
u_t
)
]

[
s_{t+1}
=======

s_t
\Vert
u_t
\Vert
\Omega(e_t)
]

[
\boxed{
a_t\neq\mathrm{toolcall}
\Longrightarrow
s_{t+1}=s_t\Vert a_t
}
]

---

# [

\boxed{\mathbf{21.\ AGENT\ TRAJECTORY}}
]

[
\tau_{b,i}
==========

(
s_0,
a_1,
s_1,
a_2,
\ldots,
s_{T-1},
a_T
)
]

[
\boxed{
\tau
====

(q,h_1,g_1,o_1,h_2,g_2,o_2,\ldots,h_K,y)
}
]

[
\boxed{
T
=

\text{generated-token + environment interaction horizon}
}
]

[
\boxed{
T_{\max}^{\rm RL}
=================

\mathrm{UNDISCLOSED}
}
]

---

# [

\boxed{\mathbf{22.\ SANDBOX\ EXECUTION\ SUBSTRATES}}
]

[
\boxed{
\mathcal E_{\rm DSec}
=====================

{
\mathrm{FunctionCall},
\mathrm{Container},
\mathrm{microVM},
\mathrm{fullVM}
}
}
]

[
\boxed{
\mathsf{API}_{\rm DSec}
=======================

{
\mathrm{exec},
\mathrm{file\ transfer},
\mathrm{TTY}
}
}
]

[
\boxed{
\mathcal E(q)
\in
\mathcal E_{\rm DSec}
}
]

[
\boxed{
\text{substrate selection rule}
===============================

\mathrm{UNDISCLOSED}
}
]

([arXiv][1])

---

# [

\boxed{\mathbf{23.\ SANDBOX\ TRAJECTORY\ LOG}}
]

[
\mathcal L_{\rm env}^{(n)}
==========================

[
(c_1,r_1),
(c_2,r_2),
\ldots,
(c_n,r_n)
]
]

[
\boxed{
(c_t,r_t)
\prec
(c_{t+1},r_{t+1})
}
]

[
\boxed{
\mathcal L_{\rm env}
====================

\text{globally ordered persistent trajectory log}
}
]

[
\boxed{
\operatorname{Resume}
\Longrightarrow
\operatorname{ReplayCachedResults}
(
\mathcal L_{\rm env}
)
}
]

[
\boxed{
\text{non-idempotent commands}
\not\Rightarrow
\text{re-execution}
}
]

([arXiv][1])

---

# [

\boxed{\mathbf{24.\ TOKEN\ WRITE\text{-}AHEAD\ LOG}}
]

[
W_{b,i}^{(0)}
=============

\varnothing
]

[
a_t
\sim
\pi_{\rm old}
]

[
\boxed{
W_{b,i}^{(t)}
=============

W_{b,i}^{(t-1)}
\Vert
a_t
}
]

[
\boxed{
\forall a_t:
\qquad
a_t
\rightarrow
\operatorname{PersistImmediately}
(
W_{b,i}
)
}
]

[
\boxed{
\text{WAL granularity}
======================

1\ \mathrm{generated\ token}
}
]

([arXiv][1])

---

# [

\boxed{\mathbf{25.\ PREEMPTION}}
]

[
\mathsf{Preempt}
(
\tau_{b,i}^{(t)}
)
]

[
\Longrightarrow
]

[
\boxed{
\operatorname{Pause}
(
\mathsf{InferenceEngine}
)
}
]

[
\boxed{
\operatorname{Persist}
(
W_{b,i}^{(t)},
KV_{b,i}^{(t)}
)
}
]

[
\boxed{
\operatorname{Resume}
\left(
W_{b,i}^{(t)},
KV_{b,i}^{(t)}
\right)
\rightarrow
a_{t+1}
}
]

([arXiv][1])

---

# [

\boxed{\mathbf{26.\ FATAL\ ROLLOUT\ FAILURE}}
]

[
KV_{b,i}^{(t)}
\mapsto
\varnothing
]

[
W_{b,i}^{(t)}
\neq
\varnothing
]

[
\boxed{
KV_{b,i}^{(t)}
==============

\mathsf{Prefill}
(
W_{b,i}^{(t)}
)
}
]

[
\boxed{
\tau^{(t)}
\rightarrow
\tau^{(t+1)}
}
]

[
\boxed{
\text{trajectory prefix is preserved}
}
]

([arXiv][1])

---

# [

\boxed{\mathbf{27.\ WHY\ RESTART\ IS\ INVALID}}
]

[
I
=

\mathbf1[
\text{trajectory interrupted}
]
]

[
P(I=1|T)
\uparrow
\quad
\text{with }T
]

[
\operatorname{RestartFromPrompt}
\Longrightarrow
]

[
P_{\rm retained}(T)
\propto
P(T)
P(I=0|T)
]

[
\boxed{
P_{\rm retained}(T)
\neq
P(T)
}
]

[
\boxed{
P_{\rm retained}(T)
\text{ biased toward shorter }T
}
]

[
\boxed{
\mathsf{WAL+Resume}
\rightarrow
\text{avoid interruption-induced length censoring}
}
]

([arXiv][1])

---

# [

\boxed{\mathbf{28.\ TERMINATION}}
]

[
\operatorname{done}_{b,i}
=========================

\mathbf1
\left[
\begin{array}{c}
E\text{ generated}
\
\lor\ \mathcal E\text{ terminal}
\
\lor\ T=T_{\max}
\
\lor\ \text{other stopping condition}
\end{array}
\right]
]

[
\boxed{
\text{exact RL stopping rules}
==============================

\mathrm{UNDISCLOSED}
}
]

---

# [

\boxed{\mathbf{29.\ COMPLETED\ TRAJECTORY\ RECORD}}
]

[
\boxed{
\mathsf T_{b,i}
===============

(
q_b,
X_{b,i},
Y_{b,i},
T_{b,i},
R_{b,i},
\ell^{\rm old}*{b,i,1:T},
\mathcal R^{\rm old}*{b,i,1:T},
m^{\rm samp}*{b,i,1:T},
\mu*{b,i}
)
}
]

[
X_{b,i}
=======

\text{prompt/context tokens}
]

[
Y_{b,i}
=======

\text{sampled action tokens}
]

[
\ell^{\rm old}_{b,i,t}
======================

\log
\pi_{\rm old}
(
a_{b,i,t}|s_{b,i,t}
)
]

[
\boxed{
\text{exact V4 persisted field set}
===================================

\mathrm{UNDISCLOSED}
}
]

[
\boxed{
\mathsf T
\text{ above}
=============

\text{minimal lineage-consistent sufficient schema}
}
]

---

# [

\boxed{\mathbf{30.\ REWARD\ ROUTER}}
]

[
\boxed{
R_{b,i}
=======

\mathcal R_{e,\rho}
(
q_b,\tau_{b,i},\mathcal E_b
)
}
]

[
\mathcal R_{e,\rho}
===================

\begin{cases}
\mathcal R_{\rm verify},
&
q\in\mathcal D_{\rm verifiable},
\
\mathcal R_{\rm GRM},
&
q\in\mathcal D_{\rm hard},
\
\mathcal R_{\rm env},
&
q\in\mathcal D_{\rm agent}.
\end{cases}
]

[
\boxed{
\text{fixed global additive reward formula}
===========================================

\mathrm{UNDISCLOSED}
}
]

([arXiv][1])

---

# [

\boxed{\mathbf{31.\ VERIFIABLE\ REWARD}}
]

[
\boxed{
R_{\rm verify}
==============

\mathcal V
(
q,\tau
)
}
]

[
\mathcal V
\in
{
\mathrm{rule},
\mathrm{test\ suite},
\mathrm{task\ verifier},
\mathrm{environment\ state}
}
]

[
\boxed{
\mathcal V:
(q,\tau)
\rightarrow
R
}
]

[
\boxed{
\operatorname{range}(R_{\rm verify})
====================================

\mathrm{UNDISCLOSED}
}
]

[
\boxed{
R_{\rm verify}\in{0,1}
}
]

[
\boxed{\text{NOT GENERALLY ESTABLISHED}}
]

([arXiv][1])

---

# [

\boxed{\mathbf{32.\ LENGTH\ REWARD}}
]

[
\boxed{
R_{b,i}^{(\rho)}
================

R_{{\rm task},b,i}
+
\mathcal P_{\rm len}^{(\rho)}
(
T_{b,i}
)
+\cdots
}
]

[
\boxed{
\mathcal P_{\rm len}^{(\rho_1)}
\neq
\mathcal P_{\rm len}^{(\rho_2)}
}
]

[
\rho_1\neq\rho_2
]

[
\boxed{
\mathcal P_{\rm len}^{(\rho)}
=============================

\mathrm{UNDISCLOSED}
}
]

[
\boxed{
\text{coefficient},
\text{threshold},
\text{shape},
\text{normalization}
====================

\mathrm{UNDISCLOSED}
}
]

([arXiv][1])

---

# [

\boxed{\mathbf{33.\ V3.2\ REWARD\ LINEAGE}}
]

[
\boxed{
R_{\rm V3.2}^{\rm reason/agent}
===============================

R_{\rm outcome}
+
R_{\rm length}
+
R_{\rm language}
\qquad
[\mathrm{REPORTED\ COMPONENTS}]
}
]

[
\boxed{
R_{\rm V4}
==========

R_{\rm outcome}
+
R_{\rm length}
+
R_{\rm language}
}
]

[
\boxed{\mathrm{NOT\ PROVEN}}
]

[
\boxed{
\text{V4 explicitly establishes domain-specific rewards and length control;}
\quad
R_{\rm language}^{\rm V4}
=========================

\mathrm{UNDISCLOSED}
}
]

([arXiv][2])

---

# [

\boxed{\mathbf{34.\ GENERATIVE\ REWARD\ MODEL}}
]

[
q\in\mathcal D_{\rm hard}
]

[
\mathcal U_q
============

\text{prompt-specific rubric}
]

[
\boxed{
J
=

\mathsf M_{\theta}^{\rm judge}
(
q,\tau,\mathcal U_q
)
}
]

[
\boxed{
R_{\rm GRM}
===========

\mathsf{ScoreParse}(J,\mathcal U_q)
}
]

[
\boxed{
\mathsf M_{\theta}^{\rm judge}
\equiv
\mathsf M_{\theta}^{\rm actor}
\quad
\text{at model-role level}
}
]

[
\boxed{
\text{no conventional dedicated scalar RM is required}
}
]

[
\boxed{
\mathsf{ScoreParse},
\operatorname{range}(R),
\text{judge decoding},
\text{rubric schema}
====================

\mathrm{UNDISCLOSED}
}
]

([arXiv][1])

---

# [

\boxed{\mathbf{35.\ GRM\ ITSELF\ UNDER\ RL}}
]

[
\boxed{
\theta
\rightarrow
\begin{cases}
\pi_{\theta}^{\rm actor}\
\pi_{\theta}^{\rm judge}
\end{cases}
}
]

[
\boxed{
\theta_{\rm judge}
\text{ is also RL-optimized}
}
]

[
\boxed{
\mathcal J_{\rm GRM}^{\rm train}
================================

\mathrm{UNDISCLOSED}
}
]

[
\boxed{
\text{actor-RL update scheduling vs GRM-RL update scheduling}
=============================================================

\mathrm{UNDISCLOSED}
}
]

([arXiv][1])

---

# [

\boxed{\mathbf{36.\ AGENT\ OUTCOME\ REWARD}}
]

[
\tau
\xrightarrow{\mathcal E}
s_{\rm final}^{\rm env}
]

[
\boxed{
R_{\rm env}
===========

\mathcal V_{\rm env}
(
s_{\rm final}^{\rm env},
\tau
)
}
]

[
\boxed{
\mathcal V_{\rm env}
\text{ may use executable/task-specific success criteria}
}
]

[
\boxed{
\mathcal V_{\rm env}^{\rm V4}
=============================

\mathrm{UNDISCLOSED\ per\ domain}
}
]

---

# [

\boxed{\mathbf{37.\ V3.2\ CODE\ AGENT\ VERIFIER\ LINEAGE}}
]

[
\mathrm{Issue}
+
\mathrm{GoldPatch}
+
\mathrm{TestPatch}
\rightarrow
\mathcal E_{\rm repo}
]

[
\operatorname{ValidEnvironment}
===============================

\mathbf1[
F2P>0
]
\mathbf1[
P2F=0
]
]

[
\boxed{
R_{\rm code}
\leftarrow
\mathsf{TestSuite}
(
\mathrm{candidate\ patch}
)
}
]

[
\boxed{
\text{current V4 exact code-agent reward}
=========================================

\mathrm{UNDISCLOSED}
}
]

([arXiv][2])

---

# [

\boxed{\mathbf{38.\ V3.2\ GENERAL\ AGENT\ VERIFIER\ LINEAGE}}
]

[
\boxed{
z=
\langle
\mathcal E,
\Gamma,
q,
\mathcal V
\rangle
}
]

[
\mathsf{Solution}
(
q,\Gamma
)
\rightarrow
y
]

[
\boxed{
\mathcal V(y)=1
}
]

[
\boxed{
\mathsf{Solution}
\not\rightarrow
\text{direct database access}
}
]

[
\boxed{
\mathsf{Solution}
\rightarrow
\text{tool interface only}
}
]

[
\boxed{
\text{current V4 agent-data generator}
======================================

\mathrm{UNDISCLOSED}
}
]

([arXiv][2])

---

# [

\boxed{\mathbf{39.\ GROUP\ REWARD\ VECTOR}}
]

[
\boxed{
\mathbf R_b
===========

(
R_{b,1},
\ldots,
R_{b,G}
)
}
]

[
\bar R_b
========

\frac1G
\sum_{i=1}^{G}
R_{b,i}
]

[
\boxed{
\sigma_R
\text{ normalization}
=====================

\varnothing
\quad
[\mathrm{V3.2\ EQUATION}]
}
]

[
\boxed{
\hat A_{b,i,t}^{\rm V3.2}
=========================

## R_{b,i}

\bar R_b
}
]

[
\boxed{
\forall t\le T_{b,i}:
\hat A_{b,i,t}
==============

\hat A_{b,i}
}
]

[
\boxed{
\hat A_{b,i,t}^{\rm V4}
=======================

\mathrm{UNDISCLOSED}
}
]

([arXiv][2])

---

# [

\boxed{\mathbf{40.\ ROLLOUT\ BATCH}}
]

[
\mathcal T_t^{\rm rollout}
==========================

{
\mathsf T_{b,i}
}_{b=1,i=1}^{B_Q,G}
]

[
\boxed{
|\mathcal T_t^{\rm rollout}|
============================

B_QG
}
]

[
N_{\rm token}^{\rm rollout}
===========================

\sum_{b=1}^{B_Q}
\sum_{i=1}^{G}
T_{b,i}
]

[
\boxed{
B_Q,
G,
N_{\rm token}^{\rm rollout}
===========================

\mathrm{UNDISCLOSED}
}
]

---

# [

\boxed{\mathbf{41.\ ROLLOUT\ DATA\ DECOMPOSITION}}
]

[
\boxed{
\mathsf T_i
===========

(
\mu_i,\chi_i
)
}
]

[
\mu_i
=====

\text{lightweight metadata}
]

[
\chi_i
======

\text{heavy per-token fields}
]

[
\boxed{
|\mu_i|
\ll
|\chi_i|
}
]

[
\boxed{
\mathcal M
==========

{\mu_i}_{i=1}^{N}
}
]

[
\boxed{
\mathcal X
==========

{\chi_i}_{i=1}^{N}
}
]

([arXiv][1])

---

# [

\boxed{\mathbf{42.\ METADATA\ RESIDENCY}}
]

[
\boxed{
\mathcal M
\xrightarrow{\rm load}
\mathrm{host\ memory}
}
]

[
\boxed{
\mathcal X
\not\xrightarrow{\rm load\ all}
\mathrm{host/GPU}
}
]

[
\sigma
\sim
\operatorname{Permutation}
(
|\mathcal M|
)
]

[
\boxed{
\tilde{\mathcal M}
==================

\sigma(\mathcal M)
}
]

[
\boxed{
\text{global shuffle is computed from metadata}
}
]

([arXiv][1])

---

# [

\boxed{\mathbf{43.\ GLOBAL\ PACKING\ LAYOUT}}
]

[
\boxed{
\Lambda
=======

\mathsf{PackLayout}
(
\tilde{\mathcal M}
)
}
]

[
\Lambda
=======

{
\Lambda_1,\ldots,\Lambda_K
}
]

[
\Lambda_k
=========

{
(i_j,o_j,l_j)
}_{j=1}^{n_k}
]

[
\boxed{
\mathsf{PackLayout}_{\rm exact}
===============================

\mathrm{UNDISCLOSED}
}
]

[
\boxed{
\text{bin-packing heuristic}
============================

\mathrm{UNDISCLOSED}
}
]

[
\boxed{
\text{packing objective}
========================

\mathrm{UNDISCLOSED}
}
]

([arXiv][1])

---

# [

\boxed{\mathbf{44.\ LAZY\ TOKEN\ FIELD\ MATERIALIZATION}}
]

[
I_k
===

\operatorname{TrajectoryIDs}
(
\Lambda_k
)
]

[
\boxed{
\chi_{I_k}
\xleftarrow{\rm shared\ memory\ loader}
\mathcal X
}
]

[
\boxed{
\mathcal B_k
============

\mathsf{Materialize}
(
\Lambda_k,
\chi_{I_k}
)
}
]

[
\boxed{
\mathsf{Consume}(\mathcal B_k)
\Longrightarrow
\mathsf{Release}(\chi_{I_k})
}
]

[
\boxed{
\operatorname{lifetime}
(
\chi_{I_k}
)
=

\text{mini-batch}
}
]

([arXiv][1])

---

# [

\boxed{\mathbf{45.\ DYNAMIC\ MINI\text{-}BATCHING}}
]

[
K_{\rm device}
==============

F
(
\mathrm{workload},
\mathrm{memory},
\mathrm{I/O},
\mathrm{compute}
)
]

[
\boxed{
K_{\rm device}
\text{ dynamically selected}
}
]

[
\boxed{
F
=

\mathrm{UNDISCLOSED}
}
]

[
\boxed{
B_\mu
=====

\mathrm{UNDISCLOSED}
}
]

[
\boxed{
L_\mu
=====

\mathrm{variable}
}
]

([arXiv][1])

---

# [

\boxed{\mathbf{46.\ RL\ LEARNER\ MINI\text{-}BATCH\ SCHEMA}}
]

[
\boxed{
\mathcal B_{t,k}^{\rm RL}
=========================

(
X,
Y,
M_{\rm gen},
R,
A,
\ell_{\rm old},
\mathcal R_{\rm old},
m_{\rm samp},
\mu
)
}
]

[
X
\in
\mathbb N^{B_\mu\times L_\mu}
]

[
Y
\in
\mathbb N^{B_\mu\times L_\mu}
]

[
M_{\rm gen}
\in
{0,1}^{B_\mu\times L_\mu}
]

[
R
\in
\mathbb R^{B_\mu}
]

[
A
\in
\mathbb R^{B_\mu}
]

[
\ell_{\rm old}
\in
\mathbb R^{B_\mu\times L_\mu}
]

[
\boxed{
\text{exact current batch field schema}
=======================================

\mathrm{UNDISCLOSED}
}
]

---

# [

\boxed{\mathbf{47.\ PROMPT\ VS\ GENERATED\ TOKEN\ MASK}}
]

[
M_{b,t}^{\rm gen}
=================

\mathbf1[
t\in\mathcal I_b^{\rm generated}
]
]

[
\boxed{
M_{\rm prompt}=0
}
]

[
\boxed{
M_{\rm generated}=1
}
]

[
\boxed{
\text{structurally required by lineage GRPO response-token summation}
}
]

[
\boxed{
\text{exact V4 tensor implementation}
=====================================

\mathrm{UNDISCLOSED}
}
]

---

# [

\boxed{\mathbf{48.\ MULTIPLE\ LEARNER\ UPDATES\ FROM\ ONE\ ROLLOUT\ BATCH}}
]

[
\mathcal T^{\rm rollout}
========================

\bigsqcup_{k=1}^{K}
\mathcal B_k
]

[
\theta^{(0)}
============

\theta_{\rm old}
]

[
\theta^{(1)}
============

\mathsf{Update}
(
\theta^{(0)},\mathcal B_1
)
]

[
\theta^{(2)}
============

\mathsf{Update}
(
\theta^{(1)},\mathcal B_2
)
]

[
\cdots
]

[
\theta^{(K)}
============

\mathsf{Update}
(
\theta^{(K-1)},\mathcal B_K
)
]

[
\boxed{
\pi_{\theta^{(k)}}
\neq
\pi_{\rm old}
\quad
(k>0)
}
]

[
\boxed{
\text{off-policy divergence grows as learner advances}
}
]

([arXiv][2])

---

# [

\boxed{\mathbf{49.\ KEEP\ SAMPLING\ MASK\ — LEARNER\ POLICY}}
]

[
\Omega_{i,t}
============

\Omega_{i,t}^{\rm old}
]

[
\tilde\pi_{\theta}
(
v|s_{i,t}
)
=

\frac{
\pi_\theta(v|s_{i,t})
\mathbf1[v\in\Omega_{i,t}]
}{
\sum_{u\in\Omega_{i,t}}
\pi_\theta(u|s_{i,t})
}
]

[
\boxed{
\operatorname{supp}
(
\tilde\pi_\theta
)
=

\operatorname{supp}
(
\pi_{\rm old}^{\rm sampler}
)
}
]

[
\boxed{
a_{i,t}\notin\Omega_{i,t}
\Longrightarrow
\tilde\pi_\theta(a_{i,t}|s)=0
}
]

[
\boxed{
\text{formula is a derived normalization representation of Keep Sampling Mask}
}
]

([arXiv][2])

---

# [

\boxed{\mathbf{50.\ KEEP\ ROUTING\ — LEARNER\ POLICY}}
]

[
\mathcal R_{i,t,l}^{\rm old}
============================

\mathrm{TopKExpert}*{\rm rollout}
(
s*{i,t},l
)
]

[
\boxed{
\mathcal R_{i,t,l}^{\rm learner}
:=
\mathcal R_{i,t,l}^{\rm old}
}
]

[
\boxed{
\pi_\theta^{\rm learner}
(
a_t|s_t;
\mathcal R^{\rm old}
)
}
]

[
\boxed{
\text{learner is prevented from switching active expert paths for sampled trajectories}
}
]

([arXiv][2])

---

# [

\boxed{\mathbf{51.\ CURRENT\ TOKEN\ LOG\ PROBABILITY}}
]

[
\boxed{
\ell_{\theta,i,t}
=================

\log
\tilde\pi_\theta
\left(
a_{i,t}
\mid
q,a_{i,<t};
\mathcal R_{i,t}^{\rm old}
\right)
}
]

[
\ell_{{\rm old},i,t}
====================

\log
\pi_{\rm old}
(
a_{i,t}|q,a_{i,<t}
)
]

---

# [

\boxed{\mathbf{52.\ IMPORTANCE\ RATIO}}
]

[
\boxed{
r_{i,t}(\theta)
===============

\frac{
\pi_{\theta}
(
a_{i,t}|q,a_{i,<t}
)
}{
\pi_{\rm old}
(
a_{i,t}|q,a_{i,<t}
)
}
}
]

[
\boxed{
r_{i,t}
=======

\exp
(
\ell_{\theta,i,t}
-----------------

\ell_{{\rm old},i,t}
)
}
]

[
r_{i,t}=1
\Longleftrightarrow
\pi_\theta(a_{i,t}|s)
=====================

\pi_{\rm old}(a_{i,t}|s)
]

([arXiv][2])

---

# [

\boxed{\mathbf{53.\ REFERENCE\ POLICY}}
]

[
\pi_{\rm ref}
=============

\text{frozen reference policy}
]

[
\boxed{
\theta_{\rm ref}
\text{ initialization/current V4 identity}
==========================================

\mathrm{UNDISCLOSED}
}
]

[
\boxed{
\nabla_{\theta_{\rm ref}}
=========================

0
}
]

[
\boxed{
\beta^{(e)}
\text{ domain-dependent in lineage}
}
]

[
\boxed{
\text{mathematics may use weak or zero KL in lineage}
}
]

[
\boxed{
\beta_{\rm V4}^{(e)}
====================

\mathrm{UNDISCLOSED}
}
]

([arXiv][2])

---

# [

\boxed{\mathbf{54.\ CORRECTED\ UNBIASED\ KL\ ESTIMATOR}}
]

[
p
=

\pi_\theta(a_{i,t}|s_{i,t})
]

[
q
=

\pi_{\rm ref}(a_{i,t}|s_{i,t})
]

[
b
=

\pi_{\rm old}(a_{i,t}|s_{i,t})
]

[
r=\frac{p}{b}
]

[
c=\frac{q}{p}
]

[
\boxed{
\widehat D_{{\rm KL},i,t}
=========================

\frac{p}{b}
\left(
\frac{q}{p}
-----------

\log
\frac{q}{p}
-----------

1
\right)
}
]

[
\boxed{
\widehat D_{{\rm KL},i,t}
=========================

r_{i,t}
\left(
\frac{\pi_{\rm ref}}{\pi_\theta}
--------------------------------

\log
\frac{\pi_{\rm ref}}{\pi_\theta}
--------------------------------

1
\right)
}
]

[
\boxed{
\mathbb E_{a\sim\pi_{\rm old}}
[
\widehat D_{\rm KL}
]
=

D_{\rm KL}
(
\pi_\theta\Vert\pi_{\rm ref}
)
}
]

[
\boxed{
\text{V3.2 equation-verified}
}
]

[
\boxed{
\text{V4 exact use}
===================

\mathrm{UNDISCLOSED}
}
]

([arXiv][2])

---

# [

\boxed{\mathbf{55.\ GROUP\ ADVANTAGE}}
]

[
\mathbf R
=========

(R_1,\ldots,R_G)
]

[
\bar R
======

\frac1G
\sum_{j=1}^{G}
R_j
]

[
\boxed{
\hat A_{i,t}
============

R_i-\bar R
}
]

[
\boxed{
\hat A_{i,t}
============

\hat A_i
\quad
\forall t
}
]

[
\boxed{
\hat A_i
\neq
\frac{R_i-\bar R}{\operatorname{std}(R)}
}
]

[
\boxed{
\text{for the published V3.2 estimator}
}
]

([arXiv][2])

---

# [

\boxed{\mathbf{56.\ SEQUENCE\ OFF\text{-}POLICY\ DIVERGENCE}}
]

[
\boxed{
D_i^{\rm old\rightarrow current}
================================

\frac1{T_i}
\sum_{t=1}^{T_i}
\log
\frac{
\pi_{\rm old}(a_{i,t}|s_{i,t})
}{
\pi_\theta(a_{i,t}|s_{i,t})
}
}
]

[
\boxed{
D_i
===

-\frac1{T_i}
\sum_t
\log r_{i,t}
}
]

[
\delta
======

\text{off-policy divergence threshold}
]

[
\boxed{
\delta_{\rm V4}
===============

\mathrm{UNDISCLOSED}
}
]

---

# [

\boxed{\mathbf{57.\ OFF\text{-}POLICY\ SEQUENCE\ MASK}}
]

[
\boxed{
M_{i,t}^{\rm off}
=================

\begin{cases}
0,
&
\hat A_{i,t}<0
\land
D_i>\delta,
\
1,
&
\text{otherwise}.
\end{cases}
}
]

[
\boxed{
M_{i,1}^{\rm off}
=================

# \cdots

M_{i,T_i}^{\rm off}
}
]

[
\boxed{
\hat A_i>0
\Longrightarrow
M_i^{\rm off}=1
\quad
\forall D_i
}
]

[
\boxed{
\hat A_i<0
\land
D_i>\delta
\Longrightarrow
\text{entire policy-gradient contribution of sequence }i
\mapsto0
}
]

[
\boxed{
\text{KL penalty remains outside }M\text{ in the published equation}
}
]

([arXiv][2])

---

# [

\boxed{\mathbf{58.\ PPO\text{-}STYLE\ CLIPPED\ SURROGATE}}
]

[
u_{i,t}
=======

r_{i,t}\hat A_i
]

[
v_{i,t}
=======

\operatorname{clip}
(
r_{i,t},
1-\varepsilon,
1+\varepsilon
)
\hat A_i
]

[
\boxed{
S_{i,t}
=======

\min
(
u_{i,t},
v_{i,t}
)
}
]

[
\boxed{
S_{i,t}^{\rm masked}
====================

S_{i,t}
M_{i,t}^{\rm off}
}
]

[
\boxed{
\varepsilon_{\rm V4}
====================

\mathrm{UNDISCLOSED}
}
]

---

# [

\boxed{\mathbf{59.\ EXACT\ LAST\ LINEAGE\ GRPO\ OBJECTIVE}}
]

[
\boxed{
\begin{aligned}
\mathcal J_{\rm GRPO}^{\rm V3.2}(\theta)
========================================

\mathbb E_{
\substack{
q\sim P(Q)\
{o_i}*{i=1}^{G}
\sim
\pi*{\rm old}(\cdot|q)
}
}
\Bigg[
&
\frac1G
\sum_{i=1}^{G}
\frac1{|o_i|}
\sum_{t=1}^{|o_i|}
\
&
\left{
\min
\left[
r_{i,t}\hat A_i,
\operatorname{clip}
(r_{i,t},1-\varepsilon,1+\varepsilon)
\hat A_i
\right]
M_{i,t}^{\rm off}
\right.
\
&
\left.
------

\beta
\widehat D_{{\rm KL},i,t}
\right}
\Bigg]
\end{aligned}
}
]

[
\boxed{
\max_{\theta}
\mathcal J_{\rm GRPO}^{\rm V3.2}(\theta)
}
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
\mathcal J_{\rm GRPO}^{\rm V4}
\not:=
\mathcal J_{\rm GRPO}^{\rm V3.2}
}
]

([arXiv][2])

---

# [

\boxed{\mathbf{60.\ LOSS\ SIGN\ FOR\ OPTIMIZER}}
]

[
\boxed{
\mathcal L_{\rm policy}
=======================

-\mathcal J_{\rm GRPO}
}
]

[
\boxed{
g
=

\nabla_\theta
\mathcal L_{\rm policy}
=======================

-\nabla_\theta
\mathcal J_{\rm GRPO}
}
]

[
\boxed{
\theta^{+}
==========

\mathsf{OPT}
(
\theta,g
)
}
]

---

# [

\boxed{\mathbf{61.\ TOKEN\ NORMALIZATION}}
]

[
\boxed{
\frac1G
\sum_{i=1}^{G}
\frac1{|o_i|}
\sum_{t=1}^{|o_i|}
}
]

[
\boxed{
\text{published lineage normalization}
======================================

\text{per-response token average}
\rightarrow
\text{group average}
}
]

[
\boxed{
\text{V4 normalization}
=======================

\mathrm{UNDISCLOSED}
}
]

---

# [

\boxed{\mathbf{62.\ ROLLOUT\ STALENESS}}
]

[
\theta^{(0)}
============

\theta_{\rm old}
]

[
\theta^{(k)}
\neq
\theta_{\rm old}
]

[
\boxed{
r_{i,t}^{(k)}
=============

\frac{
\pi_{\theta^{(k)}}(a_{i,t}|s_{i,t})
}{
\pi_{\rm old}(a_{i,t}|s_{i,t})
}
}
]

[
k\uparrow
\Longrightarrow
|r_{i,t}^{(k)}-1|
\text{ may increase}
]

[
\boxed{
\text{large rollout batch}
\rightarrow
\text{multiple mini-batch updates}
\rightarrow
\text{policy staleness}
}
]

([arXiv][2])

---

# [

\boxed{\mathbf{63.\ TWO\ OFF\text{-}POLICY\ SOURCES}}
]

[
\boxed{
\Delta_{\rm off}
================

\Delta_{\rm update}
+
\Delta_{\rm framework}
}
]

[
\Delta_{\rm update}
:
\pi_{\theta^{(k)}}
\neq
\pi_{\rm old}
]

[
\Delta_{\rm framework}
:
\mathsf{Inference}
\neq
\mathsf{Training}
]

[
\boxed{
\text{Keep Routing}
+
\text{Keep Sampling Mask}
\rightarrow
\Delta_{\rm framework}\downarrow
}
]

[
\boxed{
\text{importance ratio}
+
\text{clip}
+
\text{sequence mask}
\rightarrow
\text{control }\Delta_{\rm update}
}
]

([arXiv][2])

---

# [

\boxed{\mathbf{64.\ TRAINING\ FORWARD\ RECOMPUTATION}}
]

[
\boxed{
Z_{\theta}
==========

\mathsf M_{\theta}
\left(
X;
\mathcal R_{\rm old},
m_{\rm samp}
\right)
}
]

[
\boxed{
P_{\theta}
==========

\operatorname{SoftmaxMasked}
(
Z_\theta,
m_{\rm samp}
)
}
]

[
\boxed{
\ell_{\theta,t}
===============

\log
P_{\theta,t}
[
a_t
]
}
]

[
\boxed{
r_t
===

\exp
(
\ell_{\theta,t}-\ell_{{\rm old},t}
)
}
]

[
\boxed{
\text{current V4 tensor-level implementation}
=============================================

\mathrm{UNDISCLOSED}
}
]

---

# [

\boxed{\mathbf{65.\ REFERENCE\ FORWARD}}
]

[
\boxed{
Z_{\rm ref}
===========

\mathsf M_{\theta_{\rm ref}}
(
X
)
}
]

[
P_{\rm ref}
===========

\operatorname{Softmax}(Z_{\rm ref})
]

[
\ell_{{\rm ref},t}
==================

\log
P_{{\rm ref},t}
[a_t]
]

[
\boxed{
\nabla_{\theta_{\rm ref}}=0
}
]

[
\boxed{
\text{QAT applies to reference models during post-training}
}
]

([arXiv][1])

---

# [

\boxed{\mathbf{66.\ CURRENT\ V4\ KL\ UNKNOWN}}
]

[
\boxed{
\widehat D_{\rm KL}^{\rm V3.2}
\text{ explicitly published}
}
]

[
\boxed{
\widehat D_{\rm KL}^{\rm V4}
============================

\mathrm{UNDISCLOSED}
}
]

[
\boxed{
\beta_{\rm V4}=0
\text{ for math}
}
]

[
\boxed{\text{NOT ESTABLISHED}}
]

[
\boxed{
\beta_{\rm prior}^{\rm math}
\text{ can be weak or zero}
}
]

([arXiv][2])

---

# [

\boxed{\mathbf{67.\ POLICY\ MICRO\text{-}BATCH\ OBJECTIVE}}
]

[
\mathcal B_k
============

{
\tau_i
}_{i\in I_k}
]

[
\boxed{
\mathcal J_k(\theta)
====================

\frac1{|I_k|}
\sum_{i\in I_k}
\frac1{T_i}
\sum_{t=1}^{T_i}
\left[
S_{i,t}M_{i,t}^{\rm off}
------------------------

\beta\widehat D_{{\rm KL},i,t}
\right]
}
]

[
\boxed{
g_k
===

-\nabla_\theta
\mathcal J_k(\theta)
}
]

[
\boxed{
\mathcal J_k^{\rm V4}
=====================

\mathrm{UNDISCLOSED}
}
]

---

# [

\boxed{\mathbf{68.\ GRADIENT\ ACCUMULATION}}
]

[
g^{(r)}
=======

\sum_{k=1}^{K_r}
\omega_k g_k^{(r)}
]

[
\boxed{
\omega_k^{\rm V4}
=================

\mathrm{UNDISCLOSED}
}
]

[
\boxed{
K_r
===

\text{dynamic on-device mini-batch count}
}
]

[
\boxed{
K_r
===

F(\mathrm{workload})
}
]

([arXiv][1])

---

# [

\boxed{\mathbf{69.\ DISTRIBUTED\ POLICY\ GRADIENT}}
]

[
\boxed{
\hat g
======

\mathsf{DistributedSync}
\left(
{g^{(r)}}*{r=1}^{N*{\rm worker}}
\right)
}
]

[
\boxed{
\theta^{+}
==========

\mathsf{Optimizer}_{\rm RL}
(
\theta,\hat g
)
}
]

[
\boxed{
\mathsf{Optimizer}_{\rm RL}^{\rm V4}
====================================

\mathrm{UNDISCLOSED}
}
]

[
\boxed{
\eta_{\rm RL},
\beta_{1,\rm RL},
\beta_{2,\rm RL},
\lambda_{\rm wd,RL},
|\nabla|_{\max}
===============

\mathrm{UNDISCLOSED}
}
]

---

# [

\boxed{\mathbf{70.\ QAT\ BACKWARD\ DURING\ RL}}
]

[
W_{\rm master}^{\rm FP32}
\xrightarrow{Q}
W_{\rm FP4}
\xrightarrow{D}
W_{\rm FP8}
\xrightarrow{\mathsf M}
\mathcal J
]

[
\boxed{
g_{\rm FP8}
===========

\frac{\partial\mathcal L}{\partial W_{\rm FP8}}
}
]

[
\boxed{
g_{\rm master}
\approx
g_{\rm FP8}
}
]

[
\boxed{
\frac{\partial Q}{\partial W}
\approx1
}
]

[
\boxed{
\text{STE}
}
]

[
\boxed{
W_{\rm master}^{+}
==================

\mathsf{OPT}
(
W_{\rm master},
g_{\rm master}
)
}
]

([arXiv][1])

---

# [

\boxed{\mathbf{71.\ POLICY\ VERSION\ REFRESH}}
]

[
\theta_{t+1}
\leftarrow
\mathsf{LearnerUpdate}
(
\theta_t
)
]

[
\boxed{
\pi_{\rm rollout}
\leftarrow
Q_{\rm FP4}
(
\theta_{t+1}
)
}
]

[
\boxed{
\text{refresh frequency}
========================

\mathrm{UNDISCLOSED}
}
]

[
\boxed{
\text{synchronous vs asynchronous weight publication}
=====================================================

\mathrm{UNDISCLOSED}
}
]

---

# [

\boxed{\mathbf{72.\ COMPLETE\ V4\ RL\ ITERATION}}
]

[
\boxed{
\begin{aligned}
&\mathbf{for}\quad
n=0,\ldots,N_{\rm RL}^{(e,\rho)}-1:
[1mm]
&
\quad
\theta_{\rm old}
\leftarrow
\mathsf{RolloutPolicySnapshot}
(
\theta_n
)
\
&
\quad
\pi_{\rm old}
=============

Q_{\rm FP4}
(
\pi_{\theta_{\rm old}}
)
[2mm]
&
\quad
Q_n
\sim
P_{e,\rho}(Q)
\
&
\quad
P_{e,\rho}(Q)
=============

\mathrm{UNDISCLOSED}
[2mm]
&
\quad
\mathbf{for}\quad
q_b\in Q_n:
\
&
\qquad
S_b
===

\mathsf{Serialize}_{\rm V4}
(
q_b,s_b,\Gamma_b,\rho
)
\
&
\qquad
X_b
===

\tau_{\rm V4}(S_b)
[1mm]
&
\qquad
\mathbf{for}\quad
i=1,\ldots,G:
\
&
\qquad\qquad
W_{b,i}^{(0)}
\leftarrow
\varnothing
\
&
\qquad\qquad
KV_{b,i}^{(0)}
\leftarrow
\mathsf{Prefill}(X_b)
\
&
\qquad\qquad
s_{b,i,0}
\leftarrow
X_b
[1mm]
&
\qquad\qquad
\mathbf{for}\quad
t=1,\ldots,T_{b,i}:
\
&
\qquad\qquad\qquad
\Omega_{b,i,t}
==============

\mathsf{SamplingSupport}
(
\pi_{\rm old},s_{b,i,t}
)
\
&
\qquad\qquad\qquad
a_{b,i,t}
\sim
\pi_{\rm old}
(
\cdot|s_{b,i,t};
\Omega_{b,i,t}
)
\
&
\qquad\qquad\qquad
\ell_{{\rm old},b,i,t}
======================

\log
\pi_{\rm old}
(
a_{b,i,t}|s_{b,i,t}
)
\
&
\qquad\qquad\qquad
\mathcal R_{b,i,t}^{\rm old}
============================

\mathsf{RoutingTrace}
(
s_{b,i,t}
)
\
&
\qquad\qquad\qquad
W_{b,i}^{(t)}
=============

W_{b,i}^{(t-1)}
\Vert
a_{b,i,t}
\
&
\qquad\qquad\qquad
\mathsf{Persist}
(
W_{b,i}^{(t)}
)
\
&
\qquad\qquad\qquad
a_{b,i,t}
=========

\mathrm{toolcall}
\
&
\qquad\qquad\qquad
\Longrightarrow
\
&
\qquad\qquad\qquad
u_{b,i,t}
=========

\mathsf{ParseDSML}
(
W_{b,i}^{(t)}
)
\
&
\qquad\qquad\qquad
e_{b,i,t}
=========

\mathcal E_b
(
u_{b,i,t}
)
\
&
\qquad\qquad\qquad
\mathsf{EnvLog}
\leftarrow
\mathsf{EnvLog}
\Vert
(u_{b,i,t},e_{b,i,t})
\
&
\qquad\qquad\qquad
s_{b,i,t+1}
===========

s_{b,i,t}
\Vert
u_{b,i,t}
\Vert
\Omega(e_{b,i,t})
\
&
\qquad\qquad\qquad
\mathsf{Preempt}
\Longrightarrow
\mathsf{Persist}
(
W_{b,i}^{(t)},KV_{b,i}^{(t)}
)
\
&
\qquad\qquad\qquad
\mathsf{Resume}
\Longrightarrow
\mathsf{Continue}
(
W_{b,i}^{(t)},KV_{b,i}^{(t)}
)
\
&
\qquad\qquad
\mathbf{end}
[1mm]
&
\qquad\qquad
\tau_{b,i}
==========

\mathsf{FinalizeTrajectory}
(
q_b,W_{b,i},
\ell_{\rm old},
\mathcal R_{\rm old},
m_{\rm samp},
\mathsf{EnvLog}
)
\
&
\qquad\qquad
R_{b,i}
=======

\mathcal R_{e,\rho}
(
q_b,\tau_{b,i}
)
\
&
\qquad
\mathbf{end}
[1mm]
&
\qquad
\bar R_b
========

\frac1G
\sum_{i=1}^{G}
R_{b,i}
\
&
\qquad
\hat A_{b,i}^{\rm lineage}
==========================

R_{b,i}-\bar R_b
\
&
\quad
\mathbf{end}
[2mm]
&
\quad
\mathcal T_n
============

{
\tau_{b,i}
}_{b,i}
\
&
\quad
\mathcal T_n
============

(
\mathcal M_n,\mathcal X_n
)
\
&
\quad
\tilde{\mathcal M}_n
====================

\mathsf{GlobalShuffle}
(
\mathcal M_n
)
\
&
\quad
\Lambda_n
=========

\mathsf{PackLayout}
(
\tilde{\mathcal M}_n
)
\
&
\quad
K_n
===

\mathsf{DynamicMiniBatchCount}
(
\Lambda_n
)
[2mm]
&
\quad
\mathbf{for}\quad
k=1,\ldots,K_n:
\
&
\qquad
\chi_{I_k}
==========

\mathsf{SharedMemoryLoad}
(
I_k
)
\
&
\qquad
\mathcal B_{n,k}
================

\mathsf{Materialize}
(
\Lambda_{n,k},
\chi_{I_k}
)
\
&
\qquad
Z_{\theta}
==========

\mathsf M_{\theta_n}
\left(
X_{n,k};
\mathcal R_{\rm old},
m_{\rm samp}
\right)
\
&
\qquad
\ell_{\theta,i,t}
=================

\log
\pi_{\theta_n}
(
a_{i,t}|s_{i,t}
)
\
&
\qquad
r_{i,t}
=======

\exp
(
\ell_{\theta,i,t}
-----------------

\ell_{{\rm old},i,t}
)
\
&
\qquad
D_i
===

-\frac1{T_i}
\sum_t
\log r_{i,t}
\
&
\qquad
M_i^{\rm off}
=============

\begin{cases}
0,
&
\hat A_i<0\land D_i>\delta,
\
1,
&
\mathrm{otherwise}
\end{cases}
\
&
\qquad
\widehat D_{{\rm KL},i,t}
=========================

r_{i,t}
\left[
\frac{\pi_{\rm ref}}{\pi_{\theta}}
----------------------------------

## \log\frac{\pi_{\rm ref}}{\pi_{\theta}}

1
\right]
\
&
\qquad
\mathcal J_{n,k}^{\rm lineage}
==============================

\frac1{|\mathcal B_{n,k}|}
\sum_i
\frac1{T_i}
\sum_t
\left[
\min
\left(
r_{i,t}\hat A_i,
\operatorname{clip}
(r_{i,t},1-\varepsilon,1+\varepsilon)
\hat A_i
\right)
M_i^{\rm off}
-------------

\beta
\widehat D_{{\rm KL},i,t}
\right]
\
&
\qquad
\mathcal J_{n,k}^{\rm V4}
=========================

\mathrm{UNDISCLOSED}
\
&
\qquad
g_{n,k}
=======

-\nabla_{\theta_n}
\mathcal J_{n,k}^{\rm V4}
\
&
\qquad
\theta_n
\leftarrow
\mathsf{OPT}*{\rm RL}
(
\theta_n,g*{n,k}
)
\
&
\qquad
\mathsf{Release}
(
\chi_{I_k}
)
\
&
\quad
\mathbf{end}
[2mm]
&
\quad
\theta_{n+1}
\leftarrow
\theta_n
\
&
\mathbf{end}
\end{aligned}
}
]

([arXiv][1])

---

# [

\boxed{\mathbf{73.\ RL\ CAUSAL\ SYSTEM\ GRAPH}}
]

[
\boxed{
\begin{aligned}
q
&\sim
P_{e,\rho}(Q)
\
&\xrightarrow{\mathsf{V4\ Serializer}}
X_q
\
&\xrightarrow{\pi_{\rm old}^{\rm FP4}}
{o_i}*{i=1}^{G}
\
&\xrightarrow{\mathcal E}
{\tau_i}*{i=1}^{G}
\
&\xrightarrow{
\mathcal V/\mathsf{GRM}/\mathcal E
}
{R_i}*{i=1}^{G}
\
&\xrightarrow{
R_i-\bar R
}
{\hat A_i}
\
&\xrightarrow{
\rm WAL+metadata+heavy\ fields
}
\mathcal T
\
&\xrightarrow{
\rm shuffle+pack+lazy\ materialize
}
\mathcal B_k
\
&\xrightarrow{
\rm KeepRouting+KeepSamplingMask
}
\pi*{\theta}
\
&\xrightarrow{
\pi_{\theta}/\pi_{\rm old}
}
r_{i,t}
\
&\xrightarrow{
\rm corrected\ KL
}
\widehat D_{{\rm KL},i,t}
\
&\xrightarrow{
\rm off!-!policy\ negative\ sequence\ mask
}
M_i
\
&\xrightarrow{
\rm clipped\ GRPO
}
\mathcal J
\
&\xrightarrow{
-\nabla_{\theta}\mathcal J
}
g
\
&\xrightarrow{
\mathsf{OPT}_{\rm RL}
}
\theta^{+}
\end{aligned}}
]

---

# [

\boxed{\mathbf{74.\ THREE\ REASONING\ EFFORT\ BRANCHES}}
]

[
\boxed{
\theta_{\rm SFT}^{(e)}
\longrightarrow
\begin{cases}
\theta_{\rm RL}^{(e,\rm NonThink)}
&
\mathcal P_{\rm len}^{NT},
L_{\rm ctx}^{NT},
H_E,
[1mm]
\theta_{\rm RL}^{(e,\rm High)}
&
\mathcal P_{\rm len}^{H},
L_{\rm ctx}^{H},
H_B,h,H_E,
[1mm]
\theta_{\rm RL}^{(e,\rm Max)}
&
\mathcal P_{\rm len}^{M},
L_{\rm ctx}^{M},
P_{\max}\Vert H_B,h,H_E
\end{cases}
}
]

[
\boxed{
\left(
\mathcal P_{\rm len}^{NT},
\mathcal P_{\rm len}^{H},
\mathcal P_{\rm len}^{M},
L_{\rm ctx}^{NT},
L_{\rm ctx}^{H},
L_{\rm ctx}^{M}
\right)
=======

\mathrm{UNDISCLOSED}
}
]

([arXiv][1])

---

# [

\boxed{\mathbf{75.\ DOMAIN\ SPECIALIZATION\ GRAPH}}
]

[
\boxed{
\begin{array}{ccccccc}
\theta_{\rm SFT}^{\rm math}
&
\xrightarrow{
P_{\rm math},
R_{\rm math},
\mathrm{GRPO}
}
&
\theta_{\rm RL}^{\rm math}
[2mm]
\theta_{\rm SFT}^{\rm code}
&
\xrightarrow{
P_{\rm code},
R_{\rm code},
\mathrm{GRPO}
}
&
\theta_{\rm RL}^{\rm code}
[2mm]
\theta_{\rm SFT}^{\rm agent}
&
\xrightarrow{
P_{\rm agent},
R_{\rm env/GRM},
\mathrm{GRPO}
}
&
\theta_{\rm RL}^{\rm agent}
[2mm]
\theta_{\rm SFT}^{\rm instruction}
&
\xrightarrow{
P_{\rm inst},
R_{\rm GRM},
\mathrm{GRPO}
}
&
\theta_{\rm RL}^{\rm instruction}
\end{array}}
]

[
\boxed{
P_e,
R_e
\text{ are domain-specific}
}
]

([arXiv][1])

---

# [

\boxed{\mathbf{76.\ CURRENT\ V4\ VS\ LINEAGE\ EVIDENCE}}
]

[
\boxed{
\begin{array}{c|c}
\text{RL quantity}&\mathcal E\
\hline
\text{specialist RL exists}&\mathrm{REPORTED}\
\text{GRPO algorithm}&\mathrm{REPORTED}\
\text{domain-specific prompts}&\mathrm{REPORTED}\
\text{domain-specific rewards}&\mathrm{REPORTED}\
\text{NonThink/High/Max RL configurations}&\mathrm{REPORTED}\
\text{different context windows}&\mathrm{REPORTED}\
\text{different length penalties}&\mathrm{REPORTED}\
\text{exact context windows}&\mathrm{UNDISCLOSED}\
\text{exact length penalty}&\mathrm{UNDISCLOSED}\
G&\mathrm{UNDISCLOSED}\
B_Q&\mathrm{UNDISCLOSED}\
T_{\rm sampler}&\mathrm{UNDISCLOSED}\
p_{\rm sampler}&\mathrm{UNDISCLOSED}\
k_{\rm sampler}&\mathrm{UNDISCLOSED}\
\varepsilon&\mathrm{UNDISCLOSED\ current}\
\beta&\mathrm{UNDISCLOSED\ current}\
\delta&\mathrm{UNDISCLOSED\ current}\
\hat A^{\rm V4}&\mathrm{UNDISCLOSED}\
\text{exact V4 GRPO scalar}&\mathrm{UNDISCLOSED}\
R_{\rm easy}:\text{rules/tests}&\mathrm{REPORTED}\
R_{\rm hard}:\text{GRM}&\mathrm{REPORTED}\
\text{conventional scalar RM}&\mathrm{EXPLICITLY\ NOT\ USED}\
\text{actor acts as GRM}&\mathrm{REPORTED}\
\text{GRM itself RL-trained}&\mathrm{REPORTED}\
\text{DSML tool schema}&\mathrm{CODE/REPORT\ VERIFIED}\
\text{full tool reasoning persistence}&\mathrm{REPORTED}\
\text{native FP4 rollout}&\mathrm{REPORTED}\
\text{token WAL}&\mathrm{REPORTED}\
\text{KV-cache preemption persistence}&\mathrm{REPORTED}\
\text{fatal recovery from WAL prefill}&\mathrm{REPORTED}\
\text{metadata/heavy-field decomposition}&\mathrm{REPORTED}\
\text{global metadata shuffle}&\mathrm{REPORTED}\
\text{packing-layout computation}&\mathrm{REPORTED}\
\text{exact packing algorithm}&\mathrm{UNDISCLOSED}\
\text{shared-memory heavy-field loader}&\mathrm{REPORTED}\
\text{mini-batch-granular release}&\mathrm{REPORTED}\
\text{dynamic on-device mini-batches}&\mathrm{REPORTED}\
\text{dynamic mini-batch function}&\mathrm{UNDISCLOSED}\
\text{DSec four substrates}&\mathrm{REPORTED}\
\text{ordered environment trajectory log}&\mathrm{REPORTED}\
\text{current optimizer}&\mathrm{UNDISCLOSED}\
\text{current learning rate}&\mathrm{UNDISCLOSED}\
\text{current number of RL steps}&\mathrm{UNDISCLOSED}\
\text{current rollout/learner sync cadence}&\mathrm{UNDISCLOSED}\
\text{V3.2 mean-centered advantage}&\mathrm{EQUATION!-!VERIFIED\ LINEAGE}\
\text{V3.2 importance ratio}&\mathrm{EQUATION!-!VERIFIED\ LINEAGE}\
\text{V3.2 corrected KL}&\mathrm{EQUATION!-!VERIFIED\ LINEAGE}\
\text{V3.2 negative off-policy mask}&\mathrm{EQUATION!-!VERIFIED\ LINEAGE}\
\text{Keep Routing}&\mathrm{REPORTED\ LINEAGE}\
\text{Keep Sampling Mask}&\mathrm{REPORTED\ LINEAGE}
\end{array}}
]

---

[
\boxed{
\begin{aligned}
&
(\theta_{\rm SFT}^{(e,\rho)},P_{e,\rho},\mathcal E_e,\mathcal R_{e,\rho})
\
&\xrightarrow{
q\sim P_{e,\rho}
}
q
\
&\xrightarrow{
\mathsf{V4Encode}
}
X_q
\
&\xrightarrow{
\pi_{\rm old}^{\rm native\ FP4}
}
{\tau_i}*{i=1}^{G}
\
&\xrightarrow{
\mathcal E_e+\mathsf{WAL}+\mathsf{DSec}
}
{\tau_i^{\rm complete}}
\
&\xrightarrow{
\mathcal V_e\ \lor\ \mathsf{GRM}*{\theta}
}
{R_i}
\
&\xrightarrow{
\rm group\ relative
}
{\hat A_i}
\
&\xrightarrow{
\rm metadata/heavy\ split
}
(\mathcal M,\mathcal X)
\
&\xrightarrow{
\rm global\ shuffle
}
\tilde{\mathcal M}
\
&\xrightarrow{
\rm packing
}
\Lambda
\
&\xrightarrow{
\rm lazy\ materialization
}
\mathcal B_k
\
&\xrightarrow{
\rm KeepRouting+KeepSamplingMask
}
(\pi_\theta,\pi_{\rm old})
\
&\xrightarrow{
r=\pi_\theta/\pi_{\rm old}
}
r
\
&\xrightarrow{
\rm KL+offpolicy\ control+clip
}
\mathcal J_{\rm GRPO}
\
&\xrightarrow{
-\nabla_\theta
}
g
\
&\xrightarrow{
\mathsf{OPT}*{\rm RL}
}
\boxed{
\theta*{\rm RL}^{(e,\rho)}
}.
\end{aligned}}
]

([arXiv][1])

[1]: https://arxiv.org/html/2606.19348 "DeepSeek-V4: Towards Highly Efficient Million-Token Context Intelligence"
[2]: https://arxiv.org/html/2512.02556 "DeepSeek-V3.2: Pushing the Frontier of Open Large Language Models"
[3]: https://huggingface.co/deepseek-ai/DeepSeek-V4-Pro/blob/main/encoding/README.md?utm_source=chatgpt.com "encoding/README.md · deepseek-ai/DeepSeek-V4-Pro at main"

([arXiv][1])

[1]: https://arxiv.org/html/2606.19348 "DeepSeek-V4: Towards Highly Efficient Million-Token Context Intelligence"
[2]: https://arxiv.org/html/2412.19437 "DeepSeek-V3 Technical Report"
