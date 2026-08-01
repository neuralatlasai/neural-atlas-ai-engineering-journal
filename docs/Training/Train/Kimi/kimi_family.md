#  Kimi Family

[
\boxed{
\begin{array}{c}
\textsc{KIMI FAMILY: OPAQUE-MODEL TRAINING PROGRAM}[2mm]
M_{\theta}\equiv\text{externally callable trainable model}\
\operatorname{Int}(M_{\theta})\equiv\varnothing
\end{array}}
]

[
\mathfrak S_t
=============

\left(
\theta_t,\Omega_t,\mathcal D_t,\mathcal B_t,
\pi_t,\pi_{\mathrm{old},t},
\Pi_T,\mathcal E_t,\mathcal Q_t,\xi_t
\right),
\qquad
\mathfrak S_t
\xrightarrow{\mathcal J_t}
\mathfrak S_{t+1}.
\tag{0.1}
]

[
\boxed{
\theta^{(0)}
\xrightarrow{\mathcal L_{\mathrm{PRE}}}
\theta^{(\mathrm{B})}
\xrightarrow{\mathcal L_{\mathrm{SFT}}}
\theta^{(\mathrm{S})}
\xrightarrow{{\mathcal L_{\mathrm{RL}}^{d,e}}*{d,e}}
\left{\theta^{(d,e)}\right}*{d,e}
\xrightarrow{\mathcal L_{\mathrm{MOPD}}}
\theta^{(\mathrm{K3})}}
\tag{0.2}
]

[
d\in
\mathbb D
=========

\left{
\mathsf{general},
\mathsf{general_agent},
\mathsf{coding_agent}
\right},
\qquad
e\in
\mathbb E
=========

\left{
\mathsf{low},
\mathsf{high},
\mathsf{max}
\right},
\qquad
|\mathbb D\times\mathbb E|=9.
\tag{0.3}
]

 

---

[
\boxed{\textsc{GLOBAL EXTERNAL TENSOR CONTRACT}}
]

[
M_{\theta}:
\left(
\mathbf X,\mathbf P,\mathbf V,\mathbf A,\mathbf C
\right)
\longmapsto
\left(
\mathbf Z^{(0)},
\mathbf Z^{(\mathrm{mtp})},
\mathbf U
\right).
\tag{0.4}
]

[
\begin{aligned}
\mathbf X
&\in
\mathbb Z_{\ge0}^{B_{\mu}\times L},
&
\operatorname{dtype}(\mathbf X)
&=
\mathsf{INT}_{\mathrm{tok}}
===========================

\mathrm{UNDISCLOSED},
&
\nabla\mathbf X&=0,
\
\mathbf P_i
&\in
\bigsqcup_{H,W}
\mathbb R^{3\times H\times W},
&
\operatorname{dtype}(\mathbf P)
&=
\mathsf{PIXEL}_{\mathrm{in}}
============================

\mathrm{UNDISCLOSED},
&
\nabla\mathbf P&=0,
\
\mathbf V_i
&\in
\bigsqcup_{F,H,W}
\mathbb R^{F\times3\times H\times W},
&
\operatorname{dtype}(\mathbf V)
&=
\mathsf{VIDEO}_{\mathrm{in}}
============================

\mathrm{UNDISCLOSED},
&
\nabla\mathbf V&=0,
\
\mathbf A
&\in
{0,1}^{B_{\mu}\times L},
&
\operatorname{dtype}(\mathbf A)
&=
\mathsf{BOOL},
&
\nabla\mathbf A&=0,
\
\mathbf C
&\in
\mathbb R^{B_{\mu}\times N_c\times d_c},
&
\operatorname{dtype}(\mathbf C)
&=
\mathrm{UNDISCLOSED},
&
\nabla\mathbf C&=0,
\
\mathbf Z^{(0)}
&\in
\mathbb R^{B_{\mu}\times L\times|\mathcal V|},
&
\operatorname{dtype}(\mathbf Z^{(0)})
&=
\mathrm{UNDISCLOSED},
&
\nabla\mathbf Z^{(0)}&=1,
\
\mathbf Z^{(\mathrm{mtp})}
&\in
\mathbb R^{B_{\mu}\times L'\times|\mathcal V|},
&
\operatorname{dtype}(\mathbf Z^{(\mathrm{mtp})})
&=
\mathrm{UNDISCLOSED},
&
\nabla\mathbf Z^{(\mathrm{mtp})}&=1.
\end{aligned}
\tag{0.5}
]

[
\operatorname{Owner}(\theta)
============================

\mathsf{PP}
\times
\mathsf{VP}
\times
\mathsf{EP}
\times
\mathsf{ZeRO},
\qquad
\operatorname{Owner}(\mathbf X,\mathbf P,\mathbf V)
===================================================

\mathsf{DP}
\times
\mathsf{CP}.
\tag{0.6}
]

[
R_{\mathrm{DP}}
===============

\text{data-parallel ranks},
\qquad
A_t
===

\text{gradient-accumulation microsteps},
\qquad
B_{\mu,t}
=========

\text{microbatch cardinality}.
\tag{0.7}
]

[
\mathcal B_t^{\mathrm{global}}
==============================

\biguplus_{r=1}^{R_{\mathrm{DP}}}
\biguplus_{a=1}^{A_t}
\mathcal B_{t,r,a}^{\mu}.
\tag{0.8}
]

[
T_t^{\mathrm{global}}
=====================

\sum_{r=1}^{R_{\mathrm{DP}}}
\sum_{a=1}^{A_t}
\sum_{i\in\mathcal B_{t,r,a}^{\mu}}
L_i.
\tag{0.9}
]

[
B_{\mu,t},
\quad
A_t,
\quad
T_t^{\mathrm{global}},
\quad
R_{\mathrm{DP}}
===============

\mathrm{UNDISCLOSED}.
\tag{0.10}
]

([arXiv][1])

---

[
\boxed{\textsc{ALGORITHM 1: NATIVE MULTIMODAL PRE-TRAINING LOOP}}
]

[
\textsc{INPUT}
]

[
\mathcal D_{\mathrm{PRE}}
=========================

\mathcal D_{\mathrm{web}}
\cup
\mathcal D_{\mathrm{code}}
\cup
\mathcal D_{\mathrm{math}}
\cup
\mathcal D_{\mathrm{knowledge}}
\cup
\mathcal D_{\mathrm{vision}}.
\tag{1.1}
]

[
\mathcal D_{\mathrm{vision}}
============================

\mathcal D_{\mathrm{caption}}
\cup
\mathcal D_{\mathrm{interleaved}}
\cup
\mathcal D_{\mathrm{OCR}}
\cup
\mathcal D_{\mathrm{perception}}
\cup
\mathcal D_{\mathrm{video}}
\cup
\mathcal D_{\mathrm{visual_code}}.
\tag{1.2}
]

[
p_t
===

\left(
p_t^{\mathrm{web}},
p_t^{\mathrm{code}},
p_t^{\mathrm{math}},
p_t^{\mathrm{knowledge}},
p_t^{\mathrm{vision}}
\right),
\qquad
\sum_qp_t^q=1,
\qquad
p_t^q=\mathrm{UNDISCLOSED}.
\tag{1.3}
]

[
u_i^{\mathrm{pre}}
==================

\left(
q_i,
s_i^{\mathrm{text}},
\mathcal I_i,
\mathcal V_i,
\mathcal C_i,
\mu_i^{\mathrm{source}}
\right),
\qquad
q_i\sim\operatorname{Categorical}(p_t).
\tag{1.4}
]

[
\mathcal I_i
============

{I_{i,j}}_{j=1}^{N_i^{I}},
\qquad
\mathcal V_i
============

{V_{i,j}}_{j=1}^{N_i^{V}},
\qquad
\mathcal C_i
============

\left{
c_{i,j}^{\mathrm{absolute}},
c_{i,j}^{[0,1]}
\right}_{j=1}^{N_i^{C}}.
\tag{1.5}
]

[
\left(
\mathbf X_i,
\mathbf P_i,
\mathbf V_i,
\mathbf A_i,
\mathbf Y_i,
\mathbf W_i^{\mathrm{pre}}
\right)
=======

\operatorname{Serialize}_{\mathrm{PRE}}
\left(
u_i^{\mathrm{pre}}
\right).
\tag{1.6}
]

[
\mathbf Y_{i,t}
===============

\mathbf X_{i,t+1},
\qquad
\mathbf W_{i,t}^{\mathrm{pre}}
\in{0,1},
\qquad
\operatorname{Policy}
\left(
\mathbf W^{\mathrm{pre}}
\right)
=======

\mathrm{UNDISCLOSED}.
\tag{1.7}
]

([arXiv][1])

[
\textsc{CONTEXT CURRICULUM}
]

[
L_t
\in
\left{
2^{13},
2^{16},
2^{18},
2^{20}
\right}
=======

\left{
8192,
65536,
262144,
1048576
\right}.
\tag{1.8}
]

[
L_t
===

\begin{cases}
8192,
&
t\in\mathcal T_1,
\
65536,
&
t\in\mathcal T_2,
\
262144,
&
t\in\mathcal T_3,
\
1048576,
&
t\in\mathcal T_4,
\end{cases}
\qquad
|\mathcal T_1|,\ldots,|\mathcal T_4|
====================================

\mathrm{UNDISCLOSED}.
\tag{1.9}
]

([arXiv][1])

[
\textsc{BATCH}
]

[
\mathcal S_{t,r,a}
\sim
\operatorname{Sample}
\left(
\mathcal D_{\mathrm{PRE}};
p_t
\right).
\tag{1.10}
]

[
\mathcal B_{t,r,a}^{\mu}
========================

\operatorname{Pack}*{\mathrm{PRE}}
\left(
\mathcal S*{t,r,a};
L_t,
T_{\mu,t}^{\mathrm{PRE}}
\right).
\tag{1.11}
]

[
\sum_{i\in\mathcal B_{t,r,a}^{\mu}}
L_i
\le
T_{\mu,t}^{\mathrm{PRE}},
\qquad
\operatorname{Pack}_{\mathrm{PRE}}
==================================

\mathrm{UNDISCLOSED}.
\tag{1.12}
]

[
\mathcal B_t^{\mathrm{PRE}}
===========================

\biguplus_{r=1}^{R_{\mathrm{DP}}}
\biguplus_{a=1}^{A_t}
\mathcal B_{t,r,a}^{\mu}.
\tag{1.13}
]

[
\textsc{FORWARD}
]

[
\left(
\mathbf Z_{t,r,a}^{(0)},
\mathbf Z_{t,r,a}^{(\mathrm{mtp})},
\mathbf U_{t,r,a}^{\mathrm{QB}}
\right)
=======

M_{\theta_t,b_t}
\left(
\mathbf X_{t,r,a},
\mathbf P_{t,r,a},
\mathbf V_{t,r,a},
\mathbf A_{t,r,a},
\mathbf C_{t,r,a}
\right).
\tag{1.14}
]

[
\pi_{\theta_t}^{(0)}
====================

\operatorname{Softmax}
\left(
\mathbf Z_{t,r,a}^{(0)}
\right).
\tag{1.15}
]

[
\textsc{LOSS}
]

[
\mathcal L_{\mathrm{NTP}}^{t,r,a}
=================================

*

\frac{1}{
Z_{\mathrm{PRE}}^{t,r,a}
}
\sum_{i\in\mathcal B_{t,r,a}^{\mu}}
\sum_{\ell=1}^{L_i-1}
W_{i,\ell}^{\mathrm{pre}}
\log
\pi_{\theta_t}^{(0)}
\left(
Y_{i,\ell}
\mid
X_{i,\le\ell},
P_i,
V_i
\right).
\tag{1.16}
]

[
Z_{\mathrm{PRE}}^{t,r,a}
========================

\operatorname{Norm}_{\mathrm{PRE}}
\left(
\mathbf W^{\mathrm{pre}}
\right)
=======

\mathrm{UNDISCLOSED}.
\tag{1.17}
]

[
\mathcal L_{\mathrm{MTP}}^{t,r,a}
=================================

\operatorname{MTPObjective}
\left(
\mathbf Z_{t,r,a}^{(\mathrm{mtp})},
\mathbf Y_{t,r,a}
\right),
\tag{1.18}
]

[
\operatorname{MTPObjective}
===========================

\mathrm{UNDISCLOSED},
\qquad
\lambda_{\mathrm{MTP}}
======================

\mathrm{UNDISCLOSED},
\qquad
D_{\mathrm{MTP}}=1.
\tag{1.19}
]

[
\boxed{
\mathcal L_{\mathrm{PRE}}^{t,r,a}
=================================

\mathcal L_{\mathrm{NTP}}^{t,r,a}
+
\lambda_{\mathrm{MTP}}
\mathcal L_{\mathrm{MTP}}^{t,r,a}}
\qquad
\textsf{[DERIVED COMPOSITION]}.
\tag{1.20}
]

([arXiv][1])

[
\textsc{BACKWARD}
]

[
\mathbf g_{t,r,a}
=================

\nabla_{\theta_t}
\mathcal L_{\mathrm{PRE}}^{t,r,a}.
\tag{1.21}
]

[
\mathbf g_t
===========

\operatorname{ReduceScatter}
\left[
\sum_{a=1}^{A_t}
\mathbf g_{t,r,a}
\right]*{r=1}^{R*{\mathrm{DP}}}.
\tag{1.22}
]

[
\operatorname{GradNorm}
\left(
\mathbf g_t
\right)
=======

\mathrm{UNDISCLOSED},
\qquad
\operatorname{GradClip}
=======================

\mathrm{UNDISCLOSED}.
\tag{1.23}
]

[
\textsc{NON-GRADIENT ROUTING STATE}
]

[
\mathbf H_{t,r,a}
=================

\operatorname{Histogram}
\left(
\mathbf U_{t,r,a}^{\mathrm{QB}}
\right).
\tag{1.24}
]

[
\mathbf H_t^{\mathrm{global}}
=============================

\operatorname{AllReduce}
\left(
\sum_{a=1}^{A_t}
\mathbf H_{t,r,a}
\right)*{r=1}^{R*{\mathrm{DP}}}.
\tag{1.25}
]

[
b_{t+1}
=======

\operatorname{QB}
\left(
\mathbf H_t^{\mathrm{global}},
b_t
\right),
\qquad
\nabla_{\theta}b_{t+1}=0.
\tag{1.26}
]

[
M_{\theta_t,b_t}
;\text{processes};
\mathcal B_t,
\qquad
b_{t+1}
;\text{first processes};
\mathcal B_{t+1}.
\tag{1.27}
]

([arXiv][1])

[
\textsc{LEARNING-RATE STATE}
]

[
w
=

\left\lceil0.01T_{\mathrm{PRE}}\right\rceil.
\tag{1.28}
]

[
\eta_t
======

\begin{cases}
\eta_{\max}\dfrac{t}{w},
&
0\le t<w,
[3mm]
\dfrac{\eta_{\max}}{2}
\left[
1+
\cos
\left(
\pi
\dfrac{t-w}{T_{\mathrm{PRE}}-w}
\right)
\right],
&
w\le t\le T_{\mathrm{PRE}},
\end{cases}
\tag{1.29}
]

[
\eta_{\max}
===========

\mathrm{UNDISCLOSED},
\qquad
\lambda_{\mathrm{wd}}=0.1.
\tag{1.30}
]

[
\textsc{UPDATE}
]

[
\theta_t
========

\theta_t^{\mathrm{matrix}}
\sqcup
\theta_t^{\mathrm{other}}.
\tag{1.31}
]

[
\left(
\theta_{t+1}^{\mathrm{matrix}},
\Omega_{t+1}^{\mathrm{matrix}}
\right)
=======

\operatorname{PerHeadMuonStep}
\left(
\theta_t^{\mathrm{matrix}},
\Omega_t^{\mathrm{matrix}},
\mathbf g_t^{\mathrm{matrix}},
\eta_t,
\lambda_{\mathrm{wd}}
\right).
\tag{1.32}
]

[
\left(
\theta_{t+1}^{\mathrm{other}},
\Omega_{t+1}^{\mathrm{other}}
\right)
=======

\operatorname{Optimizer}_{\mathrm{other}}
\left(
\theta_t^{\mathrm{other}},
\Omega_t^{\mathrm{other}},
\mathbf g_t^{\mathrm{other}}
\right),
\tag{1.33}
]

[
\operatorname{Optimizer}_{\mathrm{other}}
=========================================

\mathrm{UNDISCLOSED}.
\tag{1.34}
]

[
\theta_{t+1}
\leftarrow
\operatorname{WeightClip}*{\mathrm{Kimi}}
\left(
\theta*{t+1}
\right),
\qquad
\operatorname{WeightClip}_{\mathrm{Kimi}}
\text{ exact state}
===================

\mathrm{UNDISCLOSED}.
\tag{1.35}
]

[
\textsc{OUTPUT}
]

[
\boxed{
\left(
\theta_{T_{\mathrm{PRE}}},
\Omega_{T_{\mathrm{PRE}}},
b_{T_{\mathrm{PRE}}}
\right)
=======

\left(
\theta^{(\mathrm B)},
\Omega^{(\mathrm B)},
b^{(\mathrm B)}
\right)}
\tag{1.36}
]

([arXiv][1])

---

[
\boxed{\textsc{ALGORITHM 2: XTML SUPERVISED FINE-TUNING LOOP}}
]

[
\textsc{INPUT}
]

[
\mathcal D_{\mathrm{SFT}}
=========================

\operatorname{Verify}*{1:J}
\left[
\operatorname{HumanAnnotate}
\left[
\operatorname{Generate}
\left(
\Pi*{\mathrm{prior\ Kimi}},
\mathcal X_{\mathrm{instruction}}
\right)
\right]
\right].
\tag{2.1}
]

[
u_i^{\mathrm{SFT}}
==================

\left(
\mathcal G_i,
\mathcal H_i,
\mathcal O_i,
\mathcal Y_i,
\mathcal I_i,
\mathcal V_i,
\rho_i
\right).
\tag{2.2}
]

[
\mathcal G_i
============

\left(
g_i^{\mathrm{tool\mbox{-}declare}},
g_i^{\mathrm{thinking\mbox{-}effort}}
\right).
\tag{2.3}
]

[
\mathcal H_i
============

\left(
m_{i,1},\ldots,m_{i,J_i}
\right),
\qquad
\operatorname{role}(m_{i,j})
\in
\left{
\mathsf{system},
\mathsf{user},
\mathsf{assistant},
\mathsf{tool}
\right}.
\tag{2.4}
]

[
\mathcal O_i
============

\left(
o_i^{\mathrm{tool\mbox{-}choice}},
o_i^{\mathrm{response\mbox{-}format}}
\right).
\tag{2.5}
]

[
\mathcal Y_i
============

\left(
y_i^{\mathrm{think}},
y_i^{\mathrm{response}},
y_i^{\mathrm{tools}},
y_i^{\mathrm{end_of_msg}}
\right).
\tag{2.6}
]

[
\mathsf{XTML}
=============

\left{
[\mathrm{open}],
[\mathrm{sep}],
[\mathrm{close}],
[\mathrm{end_of_msg}]
\right}.
\tag{2.7}
]

[
s_i
===

\operatorname{XTMLSerialize}
\left(
\mathcal G_i
\Vert
\mathcal H_i
\Vert
\mathcal O_i
\Vert
\mathcal Y_i
\right).
\tag{2.8}
]

[
\left(
\mathbf X_i,
\mathbf Y_i,
\mathbf W_i^{\mathrm{SFT}},
\mathbf P_i,
\mathbf V_i,
\mathbf A_i
\right)
=======

\operatorname{Tokenize}
\left(
s_i,
\mathcal I_i,
\mathcal V_i
\right).
\tag{2.9}
]

[
W_{i,t}^{\mathrm{SFT}}
======================

0
\qquad
\forall t\in
\mathcal T_i^{\mathrm{pure\mbox{-}JSON\ fallback\ input}}.
\tag{2.10}
]

[
W_{i,t}^{\mathrm{SFT}}
======================

\operatorname{UNDISCLOSED}
\qquad
\forall
t\notin
\mathcal T_i^{\mathrm{pure\mbox{-}JSON\ fallback\ input}}.
\tag{2.11}
]

([arXiv][1])

[
\textsc{STATE}
]

[
\theta_0^{\mathrm{SFT}}
=======================

\theta^{(\mathrm B)}.
\tag{2.12}
]

[
\widetilde M_{\theta}
=====================

Q_{\mathrm{post}}
\left(
M_{\theta}
\right).
\tag{2.13}
]

[
Q_{\mathrm{post}}
:
\begin{cases}
W_{\mathrm{MoE\ expert}}
\mapsto
\mathrm{MXFP4},
\
A_{\mathrm{MoE\ expert}}
\mapsto
\mathrm{MXFP8},
\
\theta_{\mathrm{nonexpert}}
\mapsto
\mathrm{higher\ precision}.
\end{cases}
\tag{2.14}
]

[
\mathcal L_{\mathrm{quant}}
\equiv0
\qquad
\textsf{[NO DISCLOSED ADDITIVE QUANTIZATION LOSS]}.
\tag{2.15}
]

([arXiv][1])

[
\textsc{BATCH}
]

[
\mathcal S_{t,r,a}^{\mathrm{SFT}}
\sim
\mathcal D_{\mathrm{SFT}}.
\tag{2.16}
]

[
\mathcal B_{t,r,a}^{\mathrm{SFT}}
=================================

\operatorname{Pack}*{\mathrm{SFT}}
\left(
\mathcal S*{t,r,a}^{\mathrm{SFT}};
T_{\mu,t}^{\mathrm{SFT}}
\right).
\tag{2.17}
]

[
\sum_{i\in\mathcal B_{t,r,a}^{\mathrm{SFT}}}
L_i
\le
T_{\mu,t}^{\mathrm{SFT}},
\qquad
\operatorname{Pack}_{\mathrm{SFT}}
==================================

\mathrm{UNDISCLOSED}.
\tag{2.18}
]

[
\mathcal B_t^{\mathrm{SFT}}
===========================

\biguplus_{r=1}^{R_{\mathrm{DP}}}
\biguplus_{a=1}^{A_t^{\mathrm{SFT}}}
\mathcal B_{t,r,a}^{\mathrm{SFT}}.
\tag{2.19}
]

[
\textsc{FORWARD}
]

[
\mathbf Z_{t,r,a}^{\mathrm{SFT}}
================================

\widetilde M_{\theta_t^{\mathrm{SFT}}}
\left(
\mathbf X_{t,r,a},
\mathbf P_{t,r,a},
\mathbf V_{t,r,a},
\mathbf A_{t,r,a}
\right).
\tag{2.20}
]

[
\pi_{\theta_t}^{\mathrm{SFT}}
=============================

\operatorname{Softmax}
\left(
\mathbf Z_{t,r,a}^{\mathrm{SFT}}
\right).
\tag{2.21}
]

[
\textsc{LOSS}
]

[
\boxed{
\mathcal L_{\mathrm{SFT}}^{t,r,a}
=================================

*

\frac{1}{
Z_{\mathrm{SFT}}^{t,r,a}
}
\sum_{i\in\mathcal B_{t,r,a}^{\mathrm{SFT}}}
\sum_{\ell=1}^{L_i-1}
W_{i,\ell}^{\mathrm{SFT}}
\log
\pi_{\theta_t}^{\mathrm{SFT}}
\left(
Y_{i,\ell}
\mid
X_{i,\le\ell},
P_i,
V_i
\right)}
\tag{2.22}
]

[
Z_{\mathrm{SFT}}^{t,r,a}
========================

\operatorname{Norm}_{\mathrm{SFT}}
\left(
\mathbf W^{\mathrm{SFT}}
\right)
=======

\mathrm{UNDISCLOSED}.
\tag{2.23}
]

[
\textsc{BACKWARD}
]

[
\mathbf g_{t,r,a}^{\mathrm{SFT}}
================================

\nabla_{\theta_t^{\mathrm{SFT}}}
\mathcal L_{\mathrm{SFT}}^{t,r,a}.
\tag{2.24}
]

[
\mathbf g_t^{\mathrm{SFT}}
==========================

\operatorname{ReduceScatter}
\left[
\sum_{a=1}^{A_t^{\mathrm{SFT}}}
\mathbf g_{t,r,a}^{\mathrm{SFT}}
\right]*{r=1}^{R*{\mathrm{DP}}}.
\tag{2.25}
]

[
\textsc{UPDATE}
]

[
\left(
\theta_{t+1}^{\mathrm{SFT}},
\Omega_{t+1}^{\mathrm{SFT}}
\right)
=======

\operatorname{Opt}_{\mathrm{SFT}}
\left(
\theta_t^{\mathrm{SFT}},
\Omega_t^{\mathrm{SFT}},
\mathbf g_t^{\mathrm{SFT}}
\right).
\tag{2.26}
]

[
\operatorname{Opt}*{\mathrm{SFT}},
\quad
\eta_t^{\mathrm{SFT}},
\quad
\lambda*{\mathrm{wd}}^{\mathrm{SFT}},
\quad
A_t^{\mathrm{SFT}},
\quad
T_{\mu,t}^{\mathrm{SFT}}
========================

\mathrm{UNDISCLOSED}.
\tag{2.27}
]

[
\textsc{OUTPUT}
]

[
\boxed{
\theta^{(\mathrm S)}
====================

\theta_{T_{\mathrm{SFT}}}^{\mathrm{SFT}}}
\tag{2.28}
]

---

[
\boxed{\textsc{ALGORITHM 3: DOMAIN}\times\textsc{EFFORT REINFORCEMENT-LEARNING LOOP}}
]

[
\textsc{INITIALIZATION}
]

[
\forall(d,e)\in\mathbb D\times\mathbb E:
\qquad
\theta_0^{d,e}
\leftarrow
\theta^{(\mathrm S)}.
\tag{3.1}
]

[
\pi_{\mathrm{old},0}^{d,e}
==========================

\operatorname{sg}
\left(
\pi_{\theta_0^{d,e}}
\right).
\tag{3.2}
]

[
\mathfrak R_t^{d,e}
===================

\left(
\theta_t^{d,e},
\Omega_t^{d,e},
\pi_{\mathrm{old},t}^{d,e},
\mathcal Q_t^{d,e},
\mathcal C_t^{d,e},
\mathcal E_t^d
\right).
\tag{3.3}
]

[
\textsc{PROMPT SCHEMA}
]

[
x_i^{d,e}
=========

\left(
\mathcal G_i^e,
\mathcal H_i,
\mathcal O_i,
\mathcal I_i,
\mathcal V_i,
\mathcal T_i^d,
\mathcal E_i^d,
b_0(x_i),
\ell_0(x_i)
\right).
\tag{3.4}
]

[
\mathcal G_i^e
==============

\left(
\mathsf{tool\mbox{-}declare},
\mathsf{thinking\mbox{-}effort}=e
\right).
\tag{3.5}
]

[
\mathcal T_i^d
==============

\left{
\text{available tool schemas}
\right},
\qquad
\mathcal E_i^d
==============

\left(
s_{i,0}^{\mathrm{env}},
\operatorname{Sandbox}_i,
\operatorname{Verifier}_i
\right).
\tag{3.6}
]

[
\textsc{PROMPT BATCH}
]

[
\mathcal X_t^{d,e}
==================

\left{
x_{t,1}^{d,e},
\ldots,
x_{t,N}^{d,e}
\right}
\sim
\mathcal D_{\mathrm{RL}}^{d,e}.
\tag{3.7}
]

[
N,
\quad
K,
\quad
\lambda
\in(0,1)
\quad
\text{with numerical values}
============================

\mathrm{UNDISCLOSED}.
\tag{3.8}
]

[
\textsc{TRAJECTORY SCHEMA}
]

[
\tau_{i,j}
==========

\left(
x_i,
\left{
y_{i,j,t},
\ell_{i,j,t}^{\mathrm{old}},
a_{i,j,t}^{\mathrm{tool}},
o_{i,j,t}^{\mathrm{env}},
s_{i,j,t}^{\mathrm{env}}
\right}*{t=1}^{T*{i,j}},
\nu_{i,j},
r_{i,j}
\right).
\tag{3.9}
]

[
y_{i,j,t}
\sim
\pi_{\mathrm{old},t}^{d,e}
\left(
\cdot
\mid
x_i,
y_{i,j,<t},
o_{i,j,<t}^{\mathrm{env}}
\right).
\tag{3.10}
]

[
\ell_{i,j,t}^{\mathrm{old}}
===========================

\log
\pi_{\mathrm{old},t}^{d,e}
\left(
y_{i,j,t}
\mid
x_i,
y_{i,j,<t},
o_{i,j,<t}^{\mathrm{env}}
\right).
\tag{3.11}
]

[
\nabla
\ell_{i,j,t}^{\mathrm{old}}
===========================

0.

\tag{3.12}
]

[
\textsc{PARTIAL ROLLOUT}
]

[
\mathcal A_t^{(0)}
==================

\operatorname{Resume}
\left(
\mathcal Q_t^{d,e}
\right)
\cup
\left{
(x_i,j)
:
1\le i\le N,;
1\le j\le K
\right}.
\tag{3.13}
]

[
\mathcal C_t^{(0)}
==================

\varnothing.
\tag{3.14}
]

[
\left(
\mathcal A_t^{(s+1)},
\mathcal C_t^{(s+1)}
\right)
=======

\operatorname{AgentRolloutStep}
\left(
\widetilde M_{\theta_{\mathrm{old},t}^{d,e}},
\mathcal E_t^d,
\mathcal A_t^{(s)},
\mathcal C_t^{(s)}
\right).
\tag{3.15}
]

[
s_t^{\star}
===========

\inf
\left{
s:
\left|
\mathcal C_t^{(s)}
\right|
\ge
\left\lceil
\lambda NK
\right\rceil
\right}.
\tag{3.16}
]

[
\mathcal Q_{t+1}^{d,e}
======================

\operatorname{PriorityQueue}
\left(
\mathcal A_t^{(s_t^{\star})}
\setminus
\mathcal C_t^{(s_t^{\star})}
\right).
\tag{3.17}
]

[
\mathcal G_t^{d,e}
==================

\left{
i:
\bigwedge_{j=1}^{K}
\nu_{i,j}
=========

\mathsf{complete}
\right}.
\tag{3.18}
]

[
\mathcal B_t^{\mathrm{RL},d,e}
==============================

\left{
\tau_{i,1:K}
:
i\in\mathcal G_t^{d,e}
\right}.
\tag{3.19}
]

([arXiv][1])

[
\textsc{REWARD}
]

[
r_{i,j}^{\mathrm{task}}
=======================

\begin{cases}
R_{\mathrm{verifier}}
\left(
x_i,\tau_{i,j},s_{i,j,T}^{\mathrm{env}}
\right),
&
\mathcal E_i^d
\in
\mathsf{verifiable},
[2mm]
R_{\mathrm{GRM}}
\left(
x_i,
{\tau_{i,k}}_{k=1}^{K},
\mathcal R_i
\right),
&
\mathcal E_i^d
\in
\mathsf{nonverifiable}.
\end{cases}
\tag{3.20}
]

[
T_d(\tau_{i,j})
===============

\begin{cases}
#\mathsf{thinking\ tokens},
&
d=\mathsf{general},
\
#\mathsf{generated\ tokens}
+
#\mathsf{tool\mbox{-}argument\ tokens},
&
d\in
\left{
\mathsf{general_agent},
\mathsf{coding_agent}
\right}.
\end{cases}
\tag{3.21}
]

[
r_{i,j}
=======

\begin{cases}
-1,
&
T_d(\tau_{i,j})

>

\tau_{d,e}b_0(x_i),
\
r_{i,j}^{\mathrm{task}},
&
T_d(\tau_{i,j})
\le
\tau_{d,e}b_0(x_i).
\end{cases}
\tag{3.22}
]

[
\tau_{d,\mathrm{max}}

>

\tau_{d,\mathrm{high}}

>

\tau_{d,\mathrm{low}},
\qquad
{\tau_{d,e}}
============

\mathrm{UNDISCLOSED}.
\tag{3.23}
]

[
R_{\mathrm{GRM}}
================

\operatorname{BinaryTournament}
\left[
\operatorname{Score}
\left(
\operatorname{Rubric}
\left(
{\tau_{i,j}}*{j=1}^{K}
\right),
\tau*{i,j}
\right)
\right].
\tag{3.24}
]

[
\operatorname{length}
\left(
\tau_{i,j}^{\mathrm{output}}
\right)

>

\sigma\ell_0(x_i)
\Longrightarrow
R_{\mathrm{GRM}}(\tau_{i,j})
============================

\mathsf{loss}.
\tag{3.25}
]

([arXiv][1])

[
\textsc{GROUP ADVANTAGE}
]

[
\bar r_i
========

\frac1K
\sum_{j=1}^{K}
r_{i,j}.
\tag{3.26}
]

[
A_{i,j}
=======

## r_{i,j}

\bar r_i.
\tag{3.27}
]

[
N_{\mathrm{tok}}
================

\sum_{i\in\mathcal G_t^{d,e}}
\sum_{j=1}^{K}
T_{i,j}.
\tag{3.28}
]

[
\textsc{LEARNER FORWARD}
]

[
\ell_{i,j,t}^{\theta}
=====================

\log
\pi_{\theta_t^{d,e}}
\left(
y_{i,j,t}
\mid
x_i,
y_{i,j,<t},
o_{i,j,<t}^{\mathrm{env}}
\right).
\tag{3.29}
]

[
\rho_{i,j,t}
============

\exp
\left(
\ell_{i,j,t}^{\theta}
---------------------

\ell_{i,j,t}^{\mathrm{old}}
\right).
\tag{3.30}
]

[
\Delta_{i,j,t}
==============

# \log\rho_{i,j,t}

## \ell_{i,j,t}^{\theta}

\ell_{i,j,t}^{\mathrm{old}}.
\tag{3.31}
]

[
\textsc{PUBLISHED POLICY OBJECTIVE}
]

[
\boxed{
\widehat{\mathcal L}_{\mathrm{RL}}^{d,e}
========================================

\frac1{N_{\mathrm{tok}}}
\sum_{i\in\mathcal G_t^{d,e}}
\sum_{j=1}^{K}
\sum_{t=1}^{T_{i,j}}
\left[
\operatorname{Clip}
\left(
\rho_{i,j,t},
\alpha,
\beta
\right)
A_{i,j}
-------

\kappa
\Delta_{i,j,t}^{,2}
\right]}
\tag{3.32}
]

[
\alpha>0,
\qquad
\beta>0,
\qquad
\kappa>0,
\qquad
(\alpha,\beta,\kappa)
=====================

\mathrm{UNDISCLOSED}.
\tag{3.33}
]

[
\operatorname{ClipOperand}
==========================

\begin{cases}
\rho_{i,j,t},
&
\textsf{[PRINTED EQUATION]},
\
\Delta_{i,j,t},
&
\textsf{[DESCRIBED GRADIENT MASK]}.
\end{cases}
\tag{3.34}
]

[
\boxed{
\operatorname{ClipOperand}_{\mathrm{implemented}}
=================================================

\mathrm{UNRESOLVED}}
\tag{3.35}
]

[
\boxed{
\operatorname{OptimizationDirection}
\left(
\widehat{\mathcal L}_{\mathrm{RL}}
\right)
=======

\mathrm{SOURCE\mbox{-}INCONSISTENT}}
\tag{3.36}
]

[
\operatorname{NoSilentRepair}
\left(
\widehat{\mathcal L}_{\mathrm{RL}}
\right)
=======

1.

\tag{3.37}
]

([arXiv][2])

[
\textsc{BACKWARD}
]

[
\mathbf g_t^{d,e}
=================

\nabla_{\theta_t^{d,e}}
\widehat{\mathcal L}_{\mathrm{RL}}^{d,e}.
\tag{3.38}
]

[
\mathbf g_t^{d,e}
=================

\operatorname{ReduceScatter}
\left[
\sum_{a=1}^{A_t^{\mathrm{RL}}}
\mathbf g_{t,r,a}^{d,e}
\right]*{r=1}^{R*{\mathrm{DP}}}.
\tag{3.39}
]

[
\textsc{UPDATE}
]

[
\left(
\theta_{t+1}^{d,e},
\Omega_{t+1}^{d,e}
\right)
=======

\operatorname{MuonClipStep}*{\operatorname{Dir}*{\mathrm{source}}}
\left(
\theta_t^{d,e},
\Omega_t^{d,e},
\mathbf g_t^{d,e}
\right).
\tag{3.40}
]

[
\pi_{\mathrm{old},t+1}^{d,e}
============================

\begin{cases}
\operatorname{sg}
\left(
\pi_{\theta_{t+1}^{d,e}}
\right),
&
t+1\in\mathcal U_{\mathrm{refresh}},
\
\pi_{\mathrm{old},t}^{d,e},
&
t+1\notin\mathcal U_{\mathrm{refresh}},
\end{cases}
\tag{3.41}
]

[
\mathcal U_{\mathrm{refresh}}
=============================

\mathrm{UNDISCLOSED}.
\tag{3.42}
]

[
Q_{\mathrm{rollout}}
====================

# Q_{\mathrm{learner}}

Q_{\mathrm{post}}.
\tag{3.43}
]

[
\textsc{OUTPUT}
]

[
\boxed{
\Pi_T
=====

\left{
\pi_{\theta^{d,e}}
:
(d,e)\in\mathbb D\times\mathbb E
\right},
\qquad
|\Pi_T|=9}
\tag{3.44}
]

([arXiv][1])

---

[
\boxed{\textsc{ALGORITHM 4: MULTI-TEACHER ON-POLICY DISTILLATION LOOP}}
]

[
\textsc{INPUT}
]

[
\Pi_T
=====

\left{
\pi_T^{d,e}
\right}_{(d,e)\in\mathbb D\times\mathbb E},
\qquad
|\Pi_T|=9.
\tag{4.1}
]

[
\nabla\theta_T^{d,e}
====================

0,
\qquad
\forall(d,e)\in\mathbb D\times\mathbb E.
\tag{4.2}
]

[
\theta_0^{\mathrm D}
====================

\operatorname{InitStudent}
\left(
\theta^{(\mathrm S)},
{\theta^{d,e}}_{d,e}
\right),
\tag{4.3}
]

[
\operatorname{InitStudent}
==========================

\mathrm{UNDISCLOSED}.
\tag{4.4}
]

[
u_i^{\mathrm D}
===============

\left(
d_i,
e_i,
x_i,
\mathcal I_i,
\mathcal V_i,
\mathcal T_i,
\mathcal E_i
\right).
\tag{4.5}
]

[
(d_i,e_i)
\sim
p_{\mathrm D}(d,e),
\qquad
p_{\mathrm D}(d,e)
==================

\mathrm{UNDISCLOSED}.
\tag{4.6}
]

[
\mathcal B_t^{\mathrm D}
========================

\operatorname{Batch}*{\mathrm D}
\left(
{u_i^{\mathrm D}}*{i=1}^{N_D}
\right).
\tag{4.7}
]

[
\operatorname{TeacherBatching}
\in
\left{
\mathsf{teacher\mbox{-}homogeneous},
\mathsf{teacher\mbox{-}mixed}
\right}
=======

\mathrm{UNDISCLOSED}.
\tag{4.8}
]

[
\textsc{STUDENT ON-POLICY ROLLOUT}
]

[
y_{i,j,t}
\sim
\pi_{\theta_t^{\mathrm D}}
\left(
\cdot
\mid
e_i,
x_i,
y_{i,j,<t},
o_{i,j,<t}^{\mathrm{env}}
\right).
\tag{4.9}
]

[
\tau_{i,j}^{\mathrm D}
======================

\left(
x_i,d_i,e_i,
{y_{i,j,t},o_{i,j,t}^{\mathrm{env}}}*{t=1}^{T*{i,j}}
\right).
\tag{4.10}
]

[
\mathcal Q_{t+1}^{\mathrm D},
\mathcal C_t^{\mathrm D}
========================

\operatorname{PartialRollout}
\left(
\widetilde M_{\theta_t^{\mathrm D}},
\mathcal Q_t^{\mathrm D},
\mathcal E_t
\right).
\tag{4.11}
]

[
\textsc{STUDENT FORWARD}
]

[
\ell_{i,j,t}^{S}
================

\log
\pi_{\theta_t^{\mathrm D}}
\left(
y_{i,j,t}
\mid
e_i,
x_i,
y_{i,j,<t}
\right).
\tag{4.12}
]

[
\nabla_{\theta_t^{\mathrm D}}
\ell_{i,j,t}^{S}
\neq0.
\tag{4.13}
]

[
\textsc{TEACHER FORWARD}
]

[
\ell_{i,j,t}^{T}
================

\log
\pi_T^{d_i,e_i}
\left(
y_{i,j,t}
\mid
x_i,
y_{i,j,<t}
\right).
\tag{4.14}
]

[
\nabla_{\theta_t^{\mathrm D}}
\ell_{i,j,t}^{T}
================

0,
\qquad
\nabla_{\theta_T^{d_i,e_i}}
\ell_{i,j,t}^{T}
================

0.

\tag{4.15}
]

[
\textsc{PER-TOKEN OPD REWARD}
]

[
\boxed{
r_{i,j,t}^{\mathrm{OPD}}
========================

\operatorname{clip}
\left(
\operatorname{sg}
\left[
\ell_{i,j,t}^{T}
----------------

\ell_{i,j,t}^{S}
\right],
-R_{\max},
R_{\max}
\right)}
\tag{4.16}
]

[
R_{\max}>0,
\qquad
R_{\max}
========

\mathrm{UNDISCLOSED}.
\tag{4.17}
]

[
r_{i,j,t}^{\mathrm{OPD}}
========================

\operatorname{clip}
\left(
\operatorname{sg}
\left[
\log
\frac{
\pi_T^{d_i,e_i}
\left(
y_{i,j,t}\mid x_i,y_{i,j,<t}
\right)
}{
\pi_{\theta_t^{\mathrm D}}
\left(
y_{i,j,t}\mid e_i,x_i,y_{i,j,<t}
\right)
}
\right],
-R_{\max},
R_{\max}
\right).
\tag{4.18}
]

([arXiv][1])

[
\textsc{DENSE-REWARD AGGREGATION}
]

[
\mathbf r_{i,j}^{\mathrm{OPD}}
==============================

\left(
r_{i,j,1}^{\mathrm{OPD}},
\ldots,
r_{i,j,T_{i,j}}^{\mathrm{OPD}}
\right).
\tag{4.19}
]

[
\mathbf A_{i,j}^{\mathrm D}
===========================

\operatorname{DenseRewardToAdvantage}
\left(
\mathbf r_{i,j}^{\mathrm{OPD}},
{\mathbf r_{i,k}^{\mathrm{OPD}}}_{k=1}^{K_D}
\right).
\tag{4.20}
]

[
\boxed{
\operatorname{DenseRewardToAdvantage}
=====================================

\mathrm{UNDISCLOSED}}
\tag{4.21}
]

[
\textsc{MOPD POLICY OBJECTIVE}
]

[
\rho_{i,j,t}^{\mathrm D}
========================

\frac{
\pi_{\theta_t^{\mathrm D}}
\left(
y_{i,j,t}
\mid
e_i,x_i,y_{i,j,<t}
\right)
}{
\pi_{\mathrm{old},t}^{\mathrm D}
\left(
y_{i,j,t}
\mid
e_i,x_i,y_{i,j,<t}
\right)
}.
\tag{4.22}
]

[
\Delta_{i,j,t}^{\mathrm D}
==========================

\log
\rho_{i,j,t}^{\mathrm D}.
\tag{4.23}
]

[
\boxed{
\mathcal L_{\mathrm{MOPD}}
==========================

\operatorname{K2.5PolicyObjective}
\left(
{\rho_{i,j,t}^{\mathrm D}},
{\mathbf A_{i,j}^{\mathrm D}},
{\Delta_{i,j,t}^{\mathrm D}};
\alpha_D,\beta_D,\kappa_D
\right)}
\tag{4.24}
]

[
\operatorname{K2.5PolicyObjective}
\left(
\rho,A,\Delta
\right)
\overset{\mathrm{reported\ framework}}{\sim}
\frac1{N_{\mathrm{tok}}^{D}}
\sum_{i,j,t}
\left[
\operatorname{Clip}
\left(
\rho_{i,j,t}^{D},
\alpha_D,\beta_D
\right)
A_{i,j,t}^{D}
-------------

\kappa_D
\left(
\Delta_{i,j,t}^{D}
\right)^2
\right].
\tag{4.25}
]

[
\boxed{
\text{exact }
r_{i,j,t}^{\mathrm{OPD}}
\longrightarrow
A_{i,j,t}^{D}
\longrightarrow
\mathcal L_{\mathrm{MOPD}}
\text{ mapping}
===============

\mathrm{UNDISCLOSED}}
\tag{4.26}
]

[
\mathcal L_{\mathrm{MOPD}}
\neq
D_{\mathrm{KL}}^{\mathrm{full\mbox{-}vocabulary}}
\left(
\pi_S\Vert\pi_T
\right)
\qquad
\textsf{[NOT REPORTED AS SUCH]}.
\tag{4.27}
]

[
\mathbb E_{y\sim\pi_S}
\left[
\log\pi_T(y|s)
--------------

\log\pi_S(y|s)
\right]
=======

*

D_{\mathrm{KL}}
\left(
\pi_S(\cdot|s)
\Vert
\pi_T(\cdot|s)
\right)
\qquad
\textsf{[DERIVED, UNCLIPPED]}.
\tag{4.28}
]

[
\textsc{BACKWARD}
]

[
\mathbf g_t^{\mathrm D}
=======================

\nabla_{\theta_t^{\mathrm D}}
\mathcal L_{\mathrm{MOPD}}.
\tag{4.29}
]

[
\mathbf g_t^{\mathrm D}
=======================

\operatorname{ReduceScatter}
\left[
\sum_{a=1}^{A_t^{\mathrm D}}
\mathbf g_{t,r,a}^{\mathrm D}
\right]*{r=1}^{R*{\mathrm{DP}}}.
\tag{4.30}
]

[
\textsc{UPDATE}
]

[
\left(
\theta_{t+1}^{\mathrm D},
\Omega_{t+1}^{\mathrm D}
\right)
=======

\operatorname{RLStep}
\left(
\theta_t^{\mathrm D},
\Omega_t^{\mathrm D},
\mathbf g_t^{\mathrm D}
\right).
\tag{4.31}
]

[
\pi_{\mathrm{old},t+1}^{\mathrm D}
==================================

\operatorname{Refresh}
\left(
\operatorname{sg}
\pi_{\theta_{t+1}^{\mathrm D}}
\right).
\tag{4.32}
]

[
\nabla\theta_T^{d,e}
====================

0,
\qquad
\forall t,d,e.
\tag{4.33}
]

[
\textsc{OUTPUT}
]

[
\boxed{
\theta^{(\mathrm{K3})}
======================

\theta_{T_{\mathrm D}}^{\mathrm D}}
\tag{4.34}
]

---

[
\boxed{\textsc{END-TO-END EXTERNAL TRAINING STATE TRANSITION}}
]

[
\begin{aligned}
&
\left(
\theta_0,
\Omega_0,
b_0,
\mathcal D_{\mathrm{PRE}}
\right)
\
&\xrightarrow[
\substack{
\text{multimodal packed batches}\
L:8\mathrm K\rightarrow64\mathrm K
\rightarrow256\mathrm K\rightarrow1\mathrm M
}
]{
\mathcal L_{\mathrm{NTP}}
+
\lambda_{\mathrm{MTP}}
\mathcal L_{\mathrm{MTP}}
}
\left(
\theta^{(\mathrm B)},
\Omega^{(\mathrm B)},
b^{(\mathrm B)}
\right)
\
&\xrightarrow[
\substack{
\text{XTML instruction trajectories}\
\text{QAT forward}
}
]{
\mathcal L_{\mathrm{SFT}}
}
\theta^{(\mathrm S)}
\
&\xrightarrow[
\substack{
x\sim\mathcal D_{\mathrm{RL}}^{d,e}\
K\text{ partial rollouts per prompt}\
r_{\mathrm{verifier/GRM/budget}}
}
]{
\mathcal L_{\mathrm{RL}}^{d,e}
}
\left{
\theta^{d,e}
\right}*{d,e}
\
&\xrightarrow[
\substack{
y\sim\pi*{\theta}\
\pi_T^{d,e}\text{ frozen}\
r_t^{\mathrm{OPD}}
==================

\operatorname{clip}
\operatorname{sg}
\log
\frac{\pi_T^{d,e}}{\pi_\theta}
}
]{
\mathcal L_{\mathrm{MOPD}}
}
\boxed{
\theta^{(\mathrm{K3})}
}.
\end{aligned}
\tag{5.1}
]

[1]: https://arxiv.org/pdf/2607.24653 "Kimi K3: Open Frontier Intelligence"
[2]: https://arxiv.org/pdf/2602.02276 "Kimi K2.5: Visual Agentic Intelligence"


[
\boxed{
\begin{array}{c}
\textsc{Algorithm 1}[1mm]
\textsc{Kimi-K3 Native-Multimodal Pre-Training}[1mm]
M_{\theta}\equiv\text{opaque trainable model}
\end{array}}
]

[
\mathfrak S_t
=============

\left(
\theta_t,\Omega_t,b_t,
\mathcal D_t,\mathcal B_t,
\eta_t,\mathfrak P_t
\right),
\qquad
\mathfrak S_t
\xrightarrow{\mathcal L_{\mathrm{pre},t}}
\mathfrak S_{t+1}.
\tag{0.1}
]



---

[
\boxed{\textsc{I. Pre-Processing}}
]

[
\textsc{Input}
]

[
\mathcal R_{\mathrm{text}}
==========================

\mathcal R_{\mathrm{web}}
\sqcup
\mathcal R_{\mathrm{code}}
\sqcup
\mathcal R_{\mathrm{math}}
\sqcup
\mathcal R_{\mathrm{knowledge}}.
\tag{1.1}
]

[
\mathcal R_{\mathrm{vision}}
============================

\mathcal R_{\mathrm{caption}}
\sqcup
\mathcal R_{\mathrm{interleaved}}
\sqcup
\mathcal R_{\mathrm{OCR}}
\sqcup
\mathcal R_{\mathrm{perception}}
\sqcup
\mathcal R_{\mathrm{video}}
\sqcup
\mathcal R_{\mathrm{visual\mbox{-}code}}.
\tag{1.2}
]

[
\mathcal R_{\mathrm{raw}}
=========================

\mathcal R_{\mathrm{text}}
\sqcup
\mathcal R_{\mathrm{vision}}.
\tag{1.3}
]

[
\textsc{Text-Transform}
]

[
\forall d
\in
\left{
\mathrm{web},
\mathrm{code},
\mathrm{math},
\mathrm{knowledge}
\right}:
]

[
\mathcal R_d^{(1)}
==================

\operatorname{RuleFilter}_d
\left(
\mathcal R_d
\right),
\tag{1.4}
]

[
\mathcal R_d^{(2)}
==================

\operatorname{ClassifierFilter}_d
\left(
\mathcal R_d^{(1)};
q_d^{\min}
\right),
\qquad
q_d^{\min}
==========

\mathrm{UNDISCLOSED},
\tag{1.5}
]

[
\mathcal R_d^{(3)}
==================

\operatorname{Deduplicate}_d
\left(
\mathcal R_d^{(2)}
\right),
\tag{1.6}
]

[
\mathcal D_d
============

\operatorname{Accept}
\left(
\mathcal R_d^{(3)}
\right).
\tag{1.7}
]

[
\mathcal D_{\mathrm{math}}^{\mathrm{aug}}
=========================================

\operatorname{VerifyFidelity}
\left[
\operatorname{ChunkARGenerate}
\left(
\operatorname{StylePerspectivePrompt}
\left(
\mathcal D_{\mathrm{math}}
\right)
\right);
\mathcal D_{\mathrm{math}}
\right],
\tag{1.8}
]

[
\mathcal D_{\mathrm{knowledge}}^{\mathrm{aug}}
==============================================

\operatorname{VerifyFidelity}
\left[
\operatorname{ChunkARGenerate}
\left(
\operatorname{StylePerspectivePrompt}
\left(
\mathcal D_{\mathrm{knowledge}}
\right)
\right);
\mathcal D_{\mathrm{knowledge}}
\right].
\tag{1.9}
]

[
\textsc{Vision-Transform}
]

[
\mathcal R_{\mathrm{vision}}^{(1)}
==================================

\operatorname{Filter}
\left(
\mathcal R_{\mathrm{vision}}
\right),
\tag{1.10}
]

[
\mathcal R_{\mathrm{vision}}^{(2)}
==================================

\operatorname{Synthesize}
\left(
\mathcal R_{\mathrm{vision}}^{(1)}
\right),
\tag{1.11}
]

[
\mathcal R_{\mathrm{vision}}^{(3)}
==================================

\operatorname{Deduplicate}
\left(
\mathcal R_{\mathrm{vision}}^{(2)}
\right).
\tag{1.12}
]

[
c^{\mathrm{abs}}
================

(x_1,y_1,x_2,y_2),
\qquad
c^{\mathrm{norm}}
=================

\left(
\frac{x_1}{W},
\frac{y_1}{H},
\frac{x_2}{W},
\frac{y_2}{H}
\right)
\in[0,1]^4.
\tag{1.13}
]

[
\mathcal D_{\mathrm{coordinate}}
================================

\left{
\left(
I,c^{\mathrm{abs}},c^{\mathrm{norm}}
\right)
\right}.
\tag{1.14}
]

[
\mathcal D_{\mathrm{render}}
============================

\bigcup_{\rho\in\mathcal F_{\mathrm{render}}}
\left{
\left(
\operatorname{code}*{\rho},
\operatorname{Render}*{\rho}
(
\operatorname{code}_{\rho}
)
\right)
\right},
\tag{1.15}
]

[
\mathcal F_{\mathrm{render}}
============================

\left{
\mathrm{SVG},
\mathrm{3D},
\mathrm{Web},
\mathrm{Game},
\mathrm{CAD}
\right}.
\tag{1.16}
]

[
\mathcal D_{\mathrm{vision}}
============================

\mathcal R_{\mathrm{vision}}^{(3)}
\cup
\mathcal D_{\mathrm{coordinate}}
\cup
\mathcal D_{\mathrm{render}}.
\tag{1.17}
]



[
\textsc{Long-Context-Transform}
]

[
\mathcal R_{\mathrm{long}}^{(1)}
================================

\operatorname{ExactDedup}
\left(
\mathcal R_{\mathrm{long}}
\right),
\tag{1.18}
]

[
\mathcal R_{\mathrm{long}}^{(2)}
================================

\operatorname{FuzzyDedup}
\left(
\mathcal R_{\mathrm{long}}^{(1)}
\right),
\tag{1.19}
]

[
\mathcal R_{\mathrm{video,long}}^{(3)}
======================================

\operatorname{FramePerceptualHashDedup}
\left(
\mathcal R_{\mathrm{video,long}}^{(2)}
\right),
\tag{1.20}
]

[
\mathcal R_{\mathrm{long}}^{(4)}
================================

\operatorname{Remove}
\left(
\mathcal R_{\mathrm{long}}^{(3)};
\left{
\mathrm{binary\ blobs},
\mathrm{truncation},
\mathrm{invalid\ logs},
\mathrm{structural\ corruption}
\right}
\right),
\tag{1.21}
]

[
\mathcal D_{\mathrm{long,natural}}
==================================

\operatorname{StructuralValidate}
\circ
\operatorname{ClassifierFilter}
\circ
\operatorname{HeuristicFilter}
\left(
\mathcal R_{\mathrm{long}}^{(4)}
\right),
\tag{1.22}
]

[
\mathcal D_{\mathrm{long,natural}}'
===================================

\operatorname{Upsample}
\left(
\mathcal D_{\mathrm{long,natural}};
u_{\mathrm{long}}
\right),
\qquad
u_{\mathrm{long}}
=================

\mathrm{UNDISCLOSED}.
\tag{1.23}
]

[
\mathcal D_{\mathrm{long,syn}}
==============================

\left{
\operatorname{PermuteConcat}
\left(
d_1,\ldots,d_J,
\tau_1,\ldots,\tau_K
\right)
:
d_j\sim\mathcal D_{\mathrm{long,natural}}
\right}.
\tag{1.24}
]

[
\mathcal D_{\mathrm{long}}
==========================

\mathcal D_{\mathrm{long,natural}}'
\cup
\mathcal D_{\mathrm{long,syn}}.
\tag{1.25}
]



[
\textsc{Corpus}
]

[
\mathcal D_{\mathrm{pre}}
=========================

\mathcal D_{\mathrm{web}}
\cup
\mathcal D_{\mathrm{code}}
\cup
\mathcal D_{\mathrm{math}}^{\mathrm{aug}}
\cup
\mathcal D_{\mathrm{knowledge}}^{\mathrm{aug}}
\cup
\mathcal D_{\mathrm{vision}}
\cup
\mathcal D_{\mathrm{long}}.
\tag{1.26}
]

[
\omega^{(s)}
============

\left(
\omega_{\mathrm{web}}^{(s)},
\omega_{\mathrm{code}}^{(s)},
\omega_{\mathrm{math}}^{(s)},
\omega_{\mathrm{knowledge}}^{(s)},
\omega_{\mathrm{vision}}^{(s)},
\omega_{\mathrm{long}}^{(s)}
\right)
\in\Delta^5,
\tag{1.27}
]

[
\sum_d\omega_d^{(s)}=1,
\qquad
\boxed{
\omega_d^{(s)}
==============

\mathrm{UNDISCLOSED}}.
\tag{1.28}
]

[
d_i
\sim
\operatorname{Categorical}
\left(
\omega^{(s)}
\right),
\qquad
r_i\sim\mathcal D_{d_i}.
\tag{1.29}
]

[
|\mathcal V|=160000,
\qquad
\operatorname{TokenizerTraining}
================================

\mathrm{UNDISCLOSED}.
\tag{1.30}
]

[
u_i
===

\left(
x_i^{\mathrm{text}},
\mathcal I_i,
\mathcal V_i,
\mathcal C_i,
d_i,
\mu_i
\right).
\tag{1.31}
]

[
\left(
\mathbf X_i,
\mathbf P_i,
\mathbf V_i,
\mathbf A_i,
\mathbf Y_i,
\mathbf W_i
\right)
=======

\operatorname{SerializeMultimodal}
\left(
u_i
\right).
\tag{1.32}
]

[
\mathbf X_i\in\mathbb N^{L_i},
\qquad
\mathbf A_i\in{0,1}^{L_i},
\qquad
\mathbf W_i\in{0,1}^{L_i}.
\tag{1.33}
]

[
\mathbf Y_{i,t}
===============

\operatorname{NextTarget}
\left(
\mathbf X_i,\mathbf P_i,\mathbf V_i,t
\right).
\tag{1.34}
]

[
\boxed{
\operatorname{SerializeMultimodal},
;
\operatorname{NextTarget},
;
\mathbf W_i,
;
\operatorname{visual\mbox{-}position\ loss\ mask}
=================================================

\mathrm{UNDISCLOSED}}.
\tag{1.35}
]

---

[
\boxed{\textsc{II. Distributed Pre-Training Loop}}
]

[
\textsc{Initialize}
]

[
\theta_0
\sim
\operatorname{Init}_{\mathrm{K3}},
\qquad
\Omega_0
========

\operatorname{InitOptimizerState}
\left(
\theta_0
\right),
\tag{2.1}
]

[
b_0
===

\mathbf0,
\qquad
\nabla_{\theta}b_t=0.
\tag{2.2}
]

[
\mathfrak P
===========

\mathsf{PP}
\times
\mathsf{VP}
\times
\mathsf{EP}
\times
\mathsf{DP}_{\mathrm{ZeRO\mbox{-}1}}
\times
\mathsf{PipelineZeRO\mbox{-}2}
\times
\mathsf{CP}.
\tag{2.3}
]

[
\boxed{
\deg(\mathsf{PP}),
\deg(\mathsf{VP}),
\deg(\mathsf{EP}),
\deg(\mathsf{DP}),
\deg(\mathsf{CP})
=================

\mathrm{UNDISCLOSED}}.
\tag{2.4}
]

([arXiv][1])

[
\mathcal S
==========

\left(
\mathsf{PT}*{8\mathrm K},
\mathsf{PT}*{64\mathrm K},
\mathsf{CD}*{256\mathrm K},
\mathsf{CD}*{1\mathrm M}
\right),
\tag{2.5}
]

[
L_{\max}^{(s)}
==============

\begin{cases}
8192,
&
s=\mathsf{PT}*{8\mathrm K},
\
65536,
&
s=\mathsf{PT}*{64\mathrm K},
\
262144,
&
s=\mathsf{CD}*{256\mathrm K},
\
1048576,
&
s=\mathsf{CD}*{1\mathrm M}.
\end{cases}
\tag{2.6}
]

[
\boxed{
T_s,
;
N_s^{\mathrm{tokens}},
;
B_s,
;
\omega^{(s)}
============

\mathrm{UNDISCLOSED}}.
\tag{2.7}
]



[
\textsc{For }
s\in\mathcal S
]

[
\textsc{For }
t=0,\ldots,T_s-1
]

[
\textsc{Sample}
]

[
\mathcal U_{t}^{(s)}
====================

\left{
u_i:
d_i\sim\operatorname{Categorical}
\left(
\omega^{(s)}
\right),
;
u_i\sim\mathcal D_{d_i}
\right}_{i=1}^{B_t}.
\tag{2.8}
]

[
\mathcal B_t^{(s)}
==================

\operatorname{Batch}
\left(
\mathcal U_t^{(s)};
L_{\max}^{(s)},
T_{\mathrm{batch}}^{(s)}
\right).
\tag{2.9}
]

[
\max_{u_i\in\mathcal B_t^{(s)}}L_i
\le
L_{\max}^{(s)}.
\tag{2.10}
]

[
\boxed{
\operatorname{Batch},
;
\operatorname{packing},
;
B_t,
;
T_{\mathrm{batch}}^{(s)}
========================

\mathrm{UNDISCLOSED}}.
\tag{2.11}
]

[
\mathcal B_t^{(s)}
==================

\biguplus_{r=1}^{R_{\mathrm{DP}}}
\biguplus_{a=1}^{A_t}
\mathcal B_{t,r,a}^{(s)}.
\tag{2.12}
]

[
m_t
===

\sum_{r=1}^{R_{\mathrm{DP}}}
\sum_{a=1}^{A_t}
\sum_{u_i\in\mathcal B_{t,r,a}^{(s)}}
L_i.
\tag{2.13}
]

[
\textsc{Forward}
]

[
\left(
\mathbf Z_{t,r,a}^{\mathrm{NTP}},
\mathbf Z_{t,r,a}^{\mathrm{MTP}},
\mathbf S_{t,r,a},
\boldsymbol\alpha_{t,r,a},
\mathbf S_{t,r,a}^{\max}
\right)
=======

M_{\theta_t,b_t}
\left(
\mathbf X_{t,r,a},
\mathbf P_{t,r,a},
\mathbf V_{t,r,a},
\mathbf A_{t,r,a}
\right).
\tag{2.14}
]

[
\mathbf Z_{t,r,a}^{\mathrm{NTP}}
\in
\mathbb R^{
B_{t,r,a}
\times
L_{t,r,a}
\times
|\mathcal V|
}.
\tag{2.15}
]

[
\pi_{\theta_t}
==============

\operatorname{Softmax}
\left(
\mathbf Z_{t,r,a}^{\mathrm{NTP}}
\right).
\tag{2.16}
]

[
\textsc{Loss}
]

[
Z_{t,r,a}^{\mathrm{NTP}}
========================

\operatorname{Normalize}
\left(
\mathbf W_{t,r,a}
\right),
\qquad
\boxed{
\operatorname{Normalize}
========================

\mathrm{UNDISCLOSED}}.
\tag{2.17}
]

[
\mathcal L_{t,r,a}^{\mathrm{NTP}}
=================================

*

\frac{1}{
Z_{t,r,a}^{\mathrm{NTP}}
}
\sum_{i\in\mathcal B_{t,r,a}^{(s)}}
\sum_{\ell=1}^{L_i-1}
W_{i,\ell}
\log
\pi_{\theta_t}
\left(
Y_{i,\ell}
\mid
X_{i,\le\ell},
\mathcal I_i,
\mathcal V_i
\right).
\tag{2.18}
]

[
\mathsf{MTPDepth}=1.
\tag{2.19}
]

[
\mathcal L_{t,r,a}^{\mathrm{MTP}}
=================================

\operatorname{MTPObjective}
\left(
\mathbf Z_{t,r,a}^{\mathrm{MTP}},
\mathbf Y_{t,r,a}
\right),
\tag{2.20}
]

[
\boxed{
\operatorname{MTPObjective},
;
\lambda_{\mathrm{MTP}},
;
\text{MTP target offset},
;
\text{MTP normalization}
========================

\mathrm{UNDISCLOSED}}.
\tag{2.21}
]

[
\boxed{
\mathcal L_{\mathrm{pre}}^{\mathrm{exact}}
==========================================

\mathrm{UNDISCLOSED}}
\tag{2.22}
]

[
\mathcal L_{\mathrm{NTP}}
\subseteq
\mathcal L_{\mathrm{pre}}^{\mathrm{exact}},
\qquad
\mathsf{MTPLayerPretrained}=1.
\tag{2.23}
]

[
\mathcal L_{\mathrm{pre}}^{\mathrm{derived}}
============================================

\mathcal L_{\mathrm{NTP}}
+
\lambda_{\mathrm{MTP}}
\mathcal L_{\mathrm{MTP}}
\qquad
\textsf{[DERIVED; NOT AN EQUATION-VERIFIED TOTAL]}.
\tag{2.24}
]

([arXiv][1])

[
\textsc{Backward}
]

[
g_{t,r,a}
=========

\nabla_{\theta_t}
\mathcal L_{t,r,a}^{\mathrm{pre}}.
\tag{2.25}
]

[
g_{t,r}
=======

\sum_{a=1}^{A_t}
g_{t,r,a}.
\tag{2.26}
]

[
g_t
===

\operatorname{DistributedReduce}
\left(
{g_{t,r}}*{r=1}^{R*{\mathrm{DP}}};
\mathfrak P
\right).
\tag{2.27}
]

[
\boxed{
A_t,
;
\operatorname{gradient\ clipping},
;
\operatorname{loss\ scaling},
;
\operatorname{gradient\ dtype}
==============================

\mathrm{UNDISCLOSED}}.
\tag{2.28}
]

[
\textsc{Quantile-Balancing State}
]

[
n=896,
\qquad
k=16,
\qquad
q_t
===

\frac{m_tk}{n}.
\tag{2.29}
]

[
s_{i,j}^{(t)}
=============

\operatorname{Sigmoid}
\left(
[W_r x_i]_j
\right).
\tag{2.30}
]

[
\left(
\mathcal T_i^{(t)},
\alpha_i^{(t)}
\right)
=======

\operatorname{Top}_{k+1}
\left(
s_i^{(t)}+b_t
\right),
\tag{2.31}
]

[
\mathcal T_i^{(t)}
==================

\operatorname{Top}_{k}
\left(
s_i^{(t)}+b_t
\right).
\tag{2.32}
]

[
p_{i,j}^{(t)}
=============

\frac{
s_{i,j}^{(t)}
}{
\sum_{r\in\mathcal T_i^{(t)}}
s_{i,r}^{(t)}
},
\qquad
j\in\mathcal T_i^{(t)}.
\tag{2.33}
]

[
b_t
\notin
p_{i,j}^{(t)}.
\tag{2.34}
]

[
\delta_{i,j}^{(t)}
==================

## s_{i,j}^{(t)}

\alpha_i^{(t)}.
\tag{2.35}
]

[
H_{t,r,a,j}
===========

\operatorname{Histogram}
\left(
\left{
\delta_{i,j}^{(t)}
\right}*{i\in\mathcal B*{t,r,a}^{(s)}}
\right).
\tag{2.36}
]

[
H_{t,j}^{\mathrm{global}}
=========================

\operatorname{AllReduce}
\left(
\sum_{r,a}H_{t,r,a,j}
\right).
\tag{2.37}
]

[
\widehat b_{t+1,j}
==================

*

\operatorname{Quantile}*{1-k/n}
\left(
H*{t,j}^{\mathrm{global}}
\right),
\tag{2.38}
]

[
b_{t+1}
=======

## \widehat b_{t+1}

\operatorname{mean}
\left(
\widehat b_{t+1}
\right)\mathbf1.
\tag{2.39}
]

[
\nabla_{\theta_t}b_{t+1}
========================

0.

\tag{2.40}
]

[
M_{\theta_t,b_t}
\longrightarrow
\mathcal B_t,
\qquad
M_{\theta_{t+1},b_{t+1}}
\longrightarrow
\mathcal B_{t+1}.
\tag{2.41}
]

[
\boxed{
\mathcal L_{\mathrm{MoE\mbox{-}balance}}
========================================

0}
\qquad
\textsf{[AUXILIARY-LOSS-FREE ROUTING]}.
\tag{2.42}
]



[
\textsc{Optimize}
]

[
\theta_t
========

\theta_t^{\mathrm{matrix}}
\sqcup
\theta_t^{\mathrm{nonmatrix}}.
\tag{2.43}
]

[
\eta_t
======

\operatorname{CosineSchedule}*{1%\ \mathrm{warmup}}
\left(
t;
\eta*{\max},
\eta_{\min},
T
\right),
\tag{2.44}
]

[
\eta_t
======

\begin{cases}
\eta_{\max}
\dfrac{t}{0.01T},
&
0\le t<0.01T,
[3mm]
\eta_{\min}
+
\dfrac{\eta_{\max}-\eta_{\min}}{2}
\left[
1+
\cos
\left(
\pi
\dfrac{t-0.01T}{0.99T}
\right)
\right],
&
0.01T\le t\le T,
\end{cases}
\tag{2.45}
]

[
\boxed{
\eta_{\max},
\eta_{\min},
T
=

\mathrm{UNDISCLOSED}},
\qquad
\lambda_{\mathrm{wd}}=0.1.
\tag{2.46}
]



[
\forall
W_t\in\theta_t^{\mathrm{matrix}}:
]

[
G_t^W
=====

\nabla_{W_t}
\mathcal L_{\mathrm{pre},t}.
\tag{2.47}
]

[
M_t^W
=====

\mu M_{t-1}^W
+
G_t^W,
\qquad
M_0^W=0.
\tag{2.48}
]

[
\forall
W_t
\in
\theta_t^{Q,K,V}:
\qquad
M_t^W
=====

\operatorname{ConcatHeads}
\left(
M_{t,1}^W,\ldots,M_{t,H}^W
\right).
\tag{2.49}
]

[
O_{t,h}^W
=========

\operatorname{NewtonSchulz}
\left(
M_{t,h}^W
\right)
\cdot
0.2
\sqrt{
\max
\left(
n_h,m_h
\right)
}.
\tag{2.50}
]

[
O_t^W
=====

\operatorname{ConcatHeads}
\left(
O_{t,1}^W,\ldots,O_{t,H}^W
\right).
\tag{2.51}
]

[
W_{t+\frac12}
=============

## W_t

\eta_t
\left(
O_t^W
+
\lambda_{\mathrm{wd}}W_t
\right).
\tag{2.52}
]

[
\boxed{
\mu,
;
\operatorname{NewtonSchulz\ iterations},
;
\operatorname{NewtonSchulz\ coefficients}
=========================================

\mathrm{UNDISCLOSED\ for\ K3}}.
\tag{2.53}
]

[
\forall
\vartheta_t
\in
\theta_t^{\mathrm{nonmatrix}}:
]

[
\left(
\vartheta_{t+\frac12},
\Omega_{t+1}^{\vartheta}
\right)
=======

\operatorname{Optimizer}*{\mathrm{nonmatrix}}
\left(
\vartheta_t,
\Omega_t^{\vartheta},
\nabla*{\vartheta_t}
\mathcal L_{\mathrm{pre},t}
\right),
\tag{2.54}
]

[
\boxed{
\operatorname{Optimizer}_{\mathrm{nonmatrix}}
=============================================

\mathrm{UNDISCLOSED}}.
\tag{2.55}
]



[
\textsc{Post-Update Weight Clipping}
]

[
S_{\max,t}^{h}
==============

\frac1{\sqrt{d_h}}
\max_{\mathbf X\in\mathcal B_t}
\max_{i,j}
\left(
Q_{i,t}^{h}
K_{j,t}^{h\top}
\right).
\tag{2.56}
]

[
\gamma_t^h
==========

\min
\left(
1,
\frac{\tau}{S_{\max,t}^{h}}
\right).
\tag{2.57}
]

[
\theta_{t+1}
============

\operatorname{WeightClip}*{\mathrm{K3}}
\left(
\theta*{t+\frac12},
{\gamma_t^h}_{h}
\right).
\tag{2.58}
]

[
\boxed{
\operatorname{WeightClip}_{\mathrm{K3}}
\text{ exact parameter-component map},
;
\tau
====

\mathrm{UNDISCLOSED}}.
\tag{2.59}
]

[
\operatorname{WeightClip}*{\mathrm{K2}}
:
\begin{cases}
W*{qc}^{h}
\leftarrow
\sqrt{\gamma_t^h},W_{qc}^{h},
\
W_{kc}^{h}
\leftarrow
\sqrt{\gamma_t^h},W_{kc}^{h},
\
W_{qr}^{h}
\leftarrow
\gamma_t^h,W_{qr}^{h},
\
W_{kr}
\leftarrow
W_{kr},
\end{cases}
\qquad
\textsf{[INHERITED MECHANISM; K3 MAP NOT RESTATED]}.
\tag{2.60}
]

([arXiv][2])

[
\textsc{Checkpoint}
]

[
\mathfrak S_{t+1}
=================

\left(
\theta_{t+1},
\Omega_{t+1},
b_{t+1},
\mathcal D^{(s)},
\eta_{t+1},
\mathfrak P
\right).
\tag{2.61}
]

[
\textsc{End For}
]

[
\textsc{End For}
]

---

[
\boxed{\textsc{III. Distribution-Level Objective and Final Optimization Program}}
]

[
P_{\mathrm{pre}}^{(s)}
\left(
u
\right)
=======

\sum_{d}
\omega_d^{(s)}
P_d^{(s)}
\left(
u
\right).
\tag{3.1}
]

[
u
\sim
P_{\mathrm{pre}}^{(s)},
\qquad
s
\in
\left{
8\mathrm K,
64\mathrm K,
256\mathrm K,
1\mathrm M
\right}.
\tag{3.2}
]

[
P_{\mathrm{pre}}^{(8\mathrm K)}
\neq
P_{\mathrm{pre}}^{(64\mathrm K)}
\neq
P_{\mathrm{pre}}^{(256\mathrm K)}
\neq
P_{\mathrm{pre}}^{(1\mathrm M)}
\tag{3.3}
]

[
\boxed{
\textsf{[DERIVED FROM CONTEXT/DATA CURRICULUM]}}
]

[
\mathcal J_{\mathrm{NTP}}^{(s)}
\left(
\theta
\right)
=======

\mathbb E_{
u\sim
P_{\mathrm{pre}}^{(s)}
}
\left[
------

\frac1{Z(u)}
\sum_{t=1}^{L(u)-1}
W_t(u)
\log
P_{\theta}
\left(
Y_t(u)
\mid
u_{\le t}
\right)
\right].
\tag{3.4}
]

[
\boxed{
Z(u),
;
W_t(u),
;
\text{visual-token supervision mask}
====================================

\mathrm{UNDISCLOSED}}.
\tag{3.5}
]

[
\boxed{
\mathcal L_{\mathrm{contrastive}}
\notin
\mathcal L_{\mathrm{pre}}}
\tag{3.6}
]

[
\boxed{
\mathcal L_{\mathrm{alignment}}
\notin
\mathcal L_{\mathrm{pre}}}
\tag{3.7}
]

[
\boxed{
\text{text pathway}
+
\text{vision pathway}
\xrightarrow{\text{joint from-scratch optimization}}
\mathcal L_{\mathrm{NTP}}}
\tag{3.8}
]

([arXiv][1])

[
\mathcal J_{\mathrm{MTP}}
\left(
\theta
\right)
=======

\mathbb E_{
u\sim P_{\mathrm{pre}}
}
\left[
\operatorname{MTPObjective}
\left(
M_{\theta}^{\mathrm{MTP}}(u),
u
\right)
\right],
\tag{3.9}
]

[
\boxed{
\mathcal J_{\mathrm{MTP}},
;
\lambda_{\mathrm{MTP}}
======================

\mathrm{UNDISCLOSED}}.
\tag{3.10}
]

[
\boxed{
\mathcal J_{\mathrm{pre}}^{\mathrm{exact}}
==========================================

\mathrm{UNDISCLOSED}}
\tag{3.11}
]

[
\boxed{
\mathcal J_{\mathrm{pre}}^{\mathrm{supported}}
\supseteq
\mathcal J_{\mathrm{NTP}},
\qquad
\mathsf{MTPLayerPretrained}=1}
\tag{3.12}
]

[
b_{t+1}
=======

F_{\mathrm{QB}}
\left(
P_{S_t-\alpha_t}^{\mathrm{global}}
\right),
\qquad
\nabla_{\theta}b_{t+1}=0,
\tag{3.13}
]

[
\theta_{t+1}
============

\operatorname{WeightClip}*{\mathrm{K3}}
\left[
\operatorname{PerHeadMuon}
\left(
\theta_t,
\nabla*{\theta_t}
\mathcal J_{\mathrm{pre}}^{(s)},
\Omega_t,
\eta_t,
\lambda_{\mathrm{wd}}=0.1
\right)
\right].
\tag{3.14}
]

[
\boxed{
\begin{aligned}
&
\left(
\theta_0,
\Omega_0,
b_0,
P_{\mathrm{pre}}^{(8\mathrm K)}
\right)
\
&\xrightarrow[
\substack{
\text{native text--vision distribution}\
\text{QB global-batch controller}\
\text{Per-Head Muon}\
\text{weight clipping}
}
]{
\mathcal J_{\mathrm{pre}}^{(8\mathrm K)}
}
\left(
\theta_1,
\Omega_1,
b_1
\right)
\
&\xrightarrow{
\mathcal J_{\mathrm{pre}}^{(64\mathrm K)}
}
\left(
\theta_2,
\Omega_2,
b_2
\right)
\
&\xrightarrow{
\mathcal J_{\mathrm{pre}}^{(256\mathrm K)}
}
\left(
\theta_3,
\Omega_3,
b_3
\right)
\
&\xrightarrow{
\mathcal J_{\mathrm{pre}}^{(1\mathrm M)}
}
\boxed{
\left(
\theta_{\mathrm{K3\mbox{-}Base}},
\Omega_{\mathrm{final}},
b_{\mathrm{final}}
\right)}.
\end{aligned}}
\tag{3.15}
]

[1]: https://arxiv.org/pdf/2607.24653 "Kimi K3: Open Frontier Intelligence"
[2]: https://arxiv.org/pdf/2507.20534 "Kimi K2: Open Agentic Intelligence"
[
\boxed{
\begin{array}{c}
\textsc{Algorithm: Kimi-K3 Supervised Fine-Tuning}[1mm]
M_{\theta}\equiv\text{opaque native-multimodal conditional model}\
\operatorname{Int}(M_{\theta})\equiv\varnothing
\end{array}}
]

[
\boxed{
\theta_{\mathrm{Base}}
\xrightarrow[
\mathcal D_{\mathrm{SFT}}
]{
\mathcal L_{\mathrm{SFT}}
}
\theta_{\mathrm{SFT}}
\xrightarrow{\mathrm{RL}}
\cdots
}
\tag{0.1}
]

[
\mathfrak S_t^{\mathrm{SFT}}
============================

\left(
\theta_t,
\widetilde\theta_t,
\Omega_t,
b_t,
\mathcal D_{\mathrm{SFT}},
\mathcal B_t,
\mathfrak Q_t,
\mathfrak P_t
\right).
\tag{0.2}
]

[
\mathfrak S_t^{\mathrm{SFT}}
\xrightarrow{\mathcal L_{\mathrm{SFT},t}}
\mathfrak S_{t+1}^{\mathrm{SFT}}.
\tag{0.3}
]

[
\theta_0
========

\theta_{\mathrm{Base}},
\qquad
\theta_{T_{\mathrm{SFT}}}
=========================

\theta_{\mathrm{SFT}}.
\tag{0.4}
]



---

[
\boxed{\textsc{I. SFT Data Pre-Processing}}
]

[
\textsc{Input}
]

[
\mathcal X_{\mathrm{seed}}
==========================

\left{
x_i
\right}*{i=1}^{N*{\mathrm{seed}}},
\qquad
x_i
\sim
P_{\mathrm{seed}}.
\tag{1.1}
]

[
\boxed{
P_{\mathrm{seed}},
\quad
N_{\mathrm{seed}},
\quad
\operatorname{DomainMix}(P_{\mathrm{seed}})
===========================================

\mathrm{UNDISCLOSED}}
\tag{1.2}
]

[
\Pi_{\mathrm{prior}}
====================

\left{
\pi_{\phi_1},
\ldots,
\pi_{\phi_K}
\right},
\qquad
\nabla\phi_k=0.
\tag{1.3}
]

[
\pi_{\phi_k}
\equiv
\text{domain-specialized prior-Kimi model}.
\tag{1.4}
]

[
\boxed{
K,
\quad
{\phi_k}_{k=1}^{K},
\quad
k(x),
\quad
P(k\mid x)
==========

\mathrm{UNDISCLOSED}}
\tag{1.5}
]

[
\textsc{Trajectory-Synthesis}
]

[
\tau_{i,j}
\sim
\pi_{\phi_{k_i}}
\left(
\cdot\mid x_i
\right),
\qquad
j\in{1,\ldots,G_i}.
\tag{1.6}
]

[
\tau_{i,j}
==========

\left(
g_{i,j},
\mathcal H_{i,j},
\mathcal O_{i,j},
\mathcal Y_{i,j},
\mathcal M_{i,j},
\zeta_{i,j}
\right).
\tag{1.7}
]

[
g_{i,j}
=======

\left(
g_{i,j}^{\mathrm{tool\mbox{-}declare}},
g_{i,j}^{\mathrm{thinking\mbox{-}effort}}
\right).
\tag{1.8}
]

[
\mathcal H_{i,j}
================

\left(
m_{i,j,1},
\ldots,
m_{i,j,R_{i,j}}
\right).
\tag{1.9}
]

[
\operatorname{role}(m)
\in
\mathbb R_{\mathrm{role}}
=========================

\left{
\mathsf{system},
\mathsf{user},
\mathsf{assistant},
\mathsf{tool}
\right}.
\tag{1.10}
]

[
\mathcal O_{i,j}
================

\left(
o_{i,j}^{\mathrm{tool\mbox{-}choice}},
o_{i,j}^{\mathrm{response\mbox{-}format}}
\right).
\tag{1.11}
]

[
\mathcal Y_{i,j}
================

\left(
y_{i,j}^{\mathrm{think}},
y_{i,j}^{\mathrm{response}},
y_{i,j}^{\mathrm{tools}}
\right).
\tag{1.12}
]

[
\mathcal M_{i,j}
================

\left(
\mathcal I_{i,j},
\mathcal V_{i,j}
\right),
\qquad
\mathcal M_{i,j}
\in
\left{
\varnothing,
\text{media payload}
\right}.
\tag{1.13}
]

[
\boxed{
P_{\mathrm{SFT}}
\left(
\mathcal M\neq\varnothing
\right)
=======

\mathrm{UNDISCLOSED}}
\tag{1.14}
]

[
\zeta_{i,j}
===========

\left(
\text{source-model identifier},
\text{verification state},
\text{annotation state}
\right).
\tag{1.15}
]

[
\textsc{Multi-Stage-Verification}
]

[
v_{i,j}^{(0)}
=============

\tau_{i,j}.
\tag{1.16}
]

[
v_{i,j}^{(q)}
=============

\mathcal V_q
\left(
x_i,
v_{i,j}^{(q-1)}
\right),
\qquad
q\in{1,\ldots,Q}.
\tag{1.17}
]

[
a_{i,j}^{(q)}
\in
{0,1},
\qquad
a_{i,j}^{(q)}
=============

\operatorname{Accept}*q
\left(
v*{i,j}^{(q)}
\right).
\tag{1.18}
]

[
a_{i,j}^{\mathrm{machine}}
==========================

\prod_{q=1}^{Q}
a_{i,j}^{(q)}.
\tag{1.19}
]

[
\boxed{
Q,
\quad
{\mathcal V_q},
\quad
{\operatorname{Accept}_q},
\quad
\text{verification thresholds}
==============================

\mathrm{UNDISCLOSED}}
\tag{1.20}
]

[
\textsc{Human-in-the-Loop}
]

[
\left(
\widehat\tau_{i,j},
a_{i,j}^{\mathrm{human}}
\right)
=======

\mathcal H
\left(
x_i,
v_{i,j}^{(Q)}
\right).
\tag{1.21}
]

[
a_{i,j}^{\mathrm{human}}
\in
{0,1}.
\tag{1.22}
]

[
a_{i,j}
=======

a_{i,j}^{\mathrm{machine}}
a_{i,j}^{\mathrm{human}}.
\tag{1.23}
]

[
\mathcal D_{\mathrm{SFT}}^{\mathrm{raw}}
========================================

\left{
\left(
x_i,\widehat\tau_{i,j}
\right):
a_{i,j}=1
\right}.
\tag{1.24}
]

[
\boxed{
\text{annotation rubric},
\quad
\text{human-edit policy},
\quad
\text{acceptance rate},
\quad
|\mathcal D_{\mathrm{SFT}}^{\mathrm{raw}}|
==========================================

\mathrm{UNDISCLOSED}}
\tag{1.25}
]

[
P_{\mathrm{SFT}}^{\mathrm{raw}}
\left(
x,\tau
\right)
\propto
P_{\mathrm{seed}}(x)
\sum_{k=1}^{K}
P(k\mid x)
\pi_{\phi_k}(\tau\mid x)
A(x,\tau).
\tag{1.26}
]

[
A(x,\tau)
=========

\prod_{q=1}^{Q}
a^{(q)}(x,\tau)
\cdot
a^{\mathrm{human}}(x,\tau).
\tag{1.27}
]

[
\textsf{[DERIVED DISTRIBUTION FACTORIZATION]}
]

([arXiv][1])

---

[
\boxed{\textsc{XTML Canonicalization}}
]

[
\mathbb T_{\mathrm{ctrl}}
=========================

\left{
\langle\mathrm{open}\rangle,
\langle\mathrm{sep}\rangle,
\langle\mathrm{close}\rangle,
\langle\mathrm{end_of_msg}\rangle
\right}.
\tag{1.28}
]

[
\operatorname{XTML}
\left(
\mathrm{tag},
\mathrm{attr},
c
\right)
=======

\langle\mathrm{open}\rangle
\Vert
\mathrm{tag}
\Vert
\mathrm{attr}
\Vert
\langle\mathrm{sep}\rangle
\Vert
c
\Vert
\langle\mathrm{close}\rangle
\Vert
\mathrm{tag}
\Vert
\langle\mathrm{sep}\rangle.
\tag{1.29}
]

[
\textsc{Context-Ordering}
]

[
C_i
===

G_i
\Vert
H_i
\Vert
O_i
\Vert
P_i.
\tag{1.30}
]

[
G_i
===

g_i^{\mathrm{tool\mbox{-}declare}}
\Vert
g_i^{\mathrm{thinking\mbox{-}effort}}.
\tag{1.31}
]

[
H_i
===

m_{i,1}
\Vert
m_{i,2}
\Vert
\cdots
\Vert
m_{i,R_i}.
\tag{1.32}
]

[
O_i
===

o_i^{\mathrm{tool\mbox{-}choice}}
\Vert
o_i^{\mathrm{response\mbox{-}format}}.
\tag{1.33}
]

[
G_i
\prec
H_i
\prec
O_i.
\tag{1.34}
]

[
g^{\mathrm{dynamic\mbox{-}tool\mbox{-}declare}}
\in
H_i.
\tag{1.35}
]

[
P_i
===

\begin{cases}
\langle\mathrm{open}\rangle
\Vert
\mathrm{think}
\Vert
\langle\mathrm{sep}\rangle,
&
z_i=\mathsf{thinking},
[1mm]
\langle\mathrm{open}\rangle
\Vert
\mathrm{response}
\Vert
\langle\mathrm{sep}\rangle,
&
z_i=\mathsf{instruct}.
\end{cases}
\tag{1.36}
]

[
\textsc{Assistant-Message}
]

[
m_i^{\mathrm{assistant}}
========================

\operatorname{Open}
\left(
\mathrm{message};
\mathrm{role}=\mathsf{assistant}
\right)
\Vert
\chi_i^{\mathrm{think}}
\Vert
\chi_i^{\mathrm{response}}
\Vert
\chi_i^{\mathrm{tools}}
\Vert
\operatorname{Close}
\left(
\mathrm{message}
\right)
\Vert
\langle\mathrm{end_of_msg}\rangle.
\tag{1.37}
]

[
\chi_i^{\mathrm{think}}
=======================

\begin{cases}
\operatorname{XTML}
\left(
\mathrm{think},
\varnothing,
y_i^{\mathrm{think}}
\right),
&
z_i=\mathsf{thinking},
\
\varnothing,
&
z_i=\mathsf{instruct}.
\end{cases}
\tag{1.38}
]

[
\chi_i^{\mathrm{response}}
==========================

\operatorname{XTML}
\left(
\mathrm{response},
\varnothing,
y_i^{\mathrm{response}}
\right).
\tag{1.39}
]

[
\chi_i^{\mathrm{tools}}
=======================

\begin{cases}
\operatorname{XTML}
\left(
\mathrm{tools},
\varnothing,
\displaystyle
\big\Vert_{c=1}^{C_i}
\operatorname{Call}_{i,c}
\right),
&
C_i>0,
\
\varnothing,
&
C_i=0.
\end{cases}
\tag{1.40}
]

[
\operatorname{Call}_{i,c}
=========================

\operatorname{Open}
\left(
\mathrm{call};
\mathrm{tool}=f_{i,c},
\mathrm{index}=c
\right)
\Vert
\left(
\big\Vert_{a=1}^{A_{i,c}}
\operatorname{Argument}_{i,c,a}
\right)
\Vert
\operatorname{Close}
\left(
\mathrm{call}
\right).
\tag{1.41}
]

[
\operatorname{Argument}_{i,c,a}
===============================

\operatorname{XTML}
\left(
\mathrm{argument},
\left{
\mathrm{key}=k_{i,c,a},
\mathrm{type}=\tau_{i,c,a}
\right},
v_{i,c,a}
\right).
\tag{1.42}
]

[
\tau_{i,c,a}
\in
\left{
\mathsf{string},
\mathsf{number},
\mathsf{boolean},
\mathsf{null},
\mathsf{object},
\mathsf{array}
\right}.
\tag{1.43}
]

[
\operatorname{ToolResult}*{i,c}
\leftrightarrow
\left(
f*{i,c},
c
\right).
\tag{1.44}
]

[
\mathbb E_{\mathrm{K3}}^{\mathrm{code}}
=======================================

\left{
\mathsf{low},
\mathsf{high},
\mathsf{max}
\right}.
\tag{1.45}
]

[
g_i^{\mathrm{thinking\mbox{-}effort}}
=====================================

\operatorname{XTML}
\left(
\mathrm{message},
\left{
\mathrm{role}=\mathsf{system},
\mathrm{type}=\mathsf{thinking\mbox{-}effort}
\right},
\operatorname{NaturalLanguage}(e_i)
\right).
\tag{1.46}
]

[
e_i
\in
\mathbb E_{\mathrm{K3}}^{\mathrm{code}}.
\tag{1.47}
]

[
\textsc{Preserved-Thinking}
]

[
z_i=\mathsf{thinking}
\Longrightarrow
\forall
m_r^{\mathrm{assistant}}\in H_i:
\quad
\chi_r^{\mathrm{think}}
\neq
\varnothing.
\tag{1.48}
]

[
y_r^{\mathrm{think}}
====================

\varnothing
\Longrightarrow
\chi_r^{\mathrm{think}}
=======================

\operatorname{XTML}
\left(
\mathrm{think},
\varnothing,
\varnothing
\right).
\tag{1.49}
]

[
z_i=\mathsf{instruct}
\Longrightarrow
\forall
m_r^{\mathrm{assistant}}\in H_i:
\quad
\chi_r^{\mathrm{think}}
=======================

\varnothing.
\tag{1.50}
]

([arXiv][1])

---

[
\boxed{\textsc{Normalization}}
]

[
\operatorname{NormalizeToolArguments}(a)
========================================

\begin{cases}
a,
&
a\in\mathsf{Dict},
\
\operatorname{JSONParse}(a),
&
a\in\mathsf{String}
\land
\operatorname{JSONParse}(a)\in\mathsf{Dict},
\
\operatorname{PureJSONFallback}(a),
&
a\in\mathsf{String}
\land
\operatorname{JSONParse}(a)=\bot.
\end{cases}
\tag{1.51}
]

[
\operatorname{PureJSONFallback}(a)
==================================

\operatorname{XTML}
\left(
\mathrm{json},
{\mathrm{type}=\mathsf{object}},
a
\right).
\tag{1.52}
]

[
\operatorname{PureJSONFallback}
\subseteq
\mathsf{InputTokens}.
\tag{1.53}
]

[
\operatorname{PureJSONFallback}
\cap
\mathsf{ModelOutputTokens}
==========================

\varnothing.
\tag{1.54}
]

[
\forall t
\in
\mathcal J_i^{\mathrm{fallback}}:
\qquad
m_{i,t}=0.
\tag{1.55}
]

[
\operatorname{NormalizeConversation}
\left(
m_{1:R}
\right)
=======

\operatorname{ReorderToolResults}
\left(
m_{1:R};
\operatorname{tool_call_id}
\right).
\tag{1.56}
]

[
\operatorname{Order}
\left(
\operatorname{ToolResult}_{i,1:C_i}
\right)
=======

\operatorname{Order}
\left(
\operatorname{Call}_{i,1:C_i}
\right).
\tag{1.57}
]

[
\operatorname{DeepSort}
\left(
g_i^{\mathrm{tool\mbox{-}declare}}
\right)
=======

g_i^{\mathrm{tool\mbox{-}declare,norm}}.
\tag{1.58}
]

([arXiv][1])

---

[
\boxed{\textsc{Tokenization and Label Construction}}
]

[
s_i
===

\operatorname{XTMLSerialize}
\left(
G_i,
H_i,
O_i,
\mathcal Y_i
\right).
\tag{1.59}
]

[
s_i
===

\left(
e_{i,1},
\ldots,
e_{i,R_i^{\mathrm{seg}}}
\right).
\tag{1.60}
]

[
e_{i,r}
=======

\left(
u_{i,r},
a_{i,r}^{\mathrm{special}}
\right).
\tag{1.61}
]

[
a_{i,r}^{\mathrm{special}}
==========================

\begin{cases}
1,
&
u_{i,r}
\in
\mathbb T_{\mathrm{ctrl}}
\cup
\mathbb T_{\mathrm{media}},
\
0,
&
u_{i,r}
\in
\mathbb T_{\mathrm{text}}.
\end{cases}
\tag{1.62}
]

[
\mathbf x_i
===========

\operatorname{Encode}
\left(
s_i
\right)
\in
{0,\ldots,|\mathcal V|-1}^{L_i}.
\tag{1.63}
]

[
|\mathcal V|
============

163840
\qquad
\textsf{[CODE-VERIFIED RELEASE CONFIGURATION]}.
\tag{1.64}
]

[
v_{\mathrm{ignore}}
===================

-100
\qquad
\textsf{[CODE-VERIFIED RELEASE CONFIGURATION]}.
\tag{1.65}
]

[
v_{\mathrm{media}}
==================

163605
\qquad
\textsf{[CODE-VERIFIED RELEASE CONFIGURATION]}.
\tag{1.66}
]

[
\mathbf a_i
\in
{0,1}^{L_i},
\qquad
\mathbf p_i
\in
\mathbb R^{N_i^{\mathrm{media}}\times C\times H\times W},
\qquad
\mathbf g_i^{\mathrm{thw}}
\in
\mathbb N^{N_i^{\mathrm{media}}\times3}.
\tag{1.67}
]

[
\mathbf l_i
\in
\left(
{0,\ldots,|\mathcal V|-1}
\cup
{v_{\mathrm{ignore}}}
\right)^{L_i}.
\tag{1.68}
]

[
m_{i,t}
=======

\mathbf1
\left[
l_{i,t}
\neq
v_{\mathrm{ignore}}
\right].
\tag{1.69}
]

[
\forall t
\in
\mathcal J_i^{\mathrm{fallback}}:
\quad
l_{i,t}
=======

v_{\mathrm{ignore}}.
\tag{1.70}
]

[
\boxed{
\begin{aligned}
&
l_{i,t}
\quad
\forall t\in
\mathcal T_i^{\mathrm{system}},
\
&
l_{i,t}
\quad
\forall t\in
\mathcal T_i^{\mathrm{user}},
\
&
l_{i,t}
\quad
\forall t\in
\mathcal T_i^{\mathrm{tool\mbox{-}result}},
\
&
l_{i,t}
\quad
\forall t\in
\mathcal T_i^{\mathrm{assistant\mbox{-}think}},
\
&
l_{i,t}
\quad
\forall t\in
\mathcal T_i^{\mathrm{assistant\mbox{-}response}},
\
&
l_{i,t}
\quad
\forall t\in
\mathcal T_i^{\mathrm{assistant\mbox{-}tools}},
\
&
l_{i,t}
\quad
\forall t\in
\mathcal T_i^{\mathrm{XTML\mbox{-}control}}
\end{aligned}
=============

\mathrm{UNDISCLOSED}}
\tag{1.71}
]

[
\boxed{
\text{assistant-only masking}
=============================

\mathrm{UNDISCLOSED}}
\tag{1.72}
]

[
\boxed{
\text{reasoning-token supervision}
==================================

\mathrm{UNDISCLOSED}}
\tag{1.73}
]

[
\boxed{
\text{tool-call token weighting}
================================

\mathrm{UNDISCLOSED}}
\tag{1.74}
]

[
\boxed{
\text{EOS/end-of-message weighting}
===================================

\mathrm{UNDISCLOSED}}
\tag{1.75}
]

[
\boxed{
\text{multi-turn loss masking}
==============================

\mathrm{UNDISCLOSED}}
\tag{1.76}
]

([Hugging Face][2])

---

[
\boxed{\textsc{Dataset Finalization}}
]

[
d_i^{\mathrm{SFT}}
==================

\left(
\mathbf x_i,
\mathbf a_i,
\mathbf p_i,
\mathbf g_i^{\mathrm{thw}},
\mathbf l_i,
\mathbf m_i,
\zeta_i
\right).
\tag{1.77}
]

[
\mathcal D_{\mathrm{SFT}}
=========================

\left{
d_i^{\mathrm{SFT}}
\right}*{i=1}^{N*{\mathrm{SFT}}}.
\tag{1.78}
]

[
P_{\mathrm{SFT}}
================

\sum_{c\in\mathcal C_{\mathrm{SFT}}}
\omega_c
P_c.
\tag{1.79}
]

[
\operatorname{supp}
\left(
P_{\mathrm{SFT}}
\right)
\supseteq
\left{
\mathsf{adaptive\ reasoning},
\mathsf{tool\ calling},
\mathsf{long\mbox{-}horizon\ agentic\ execution}
\right}.
\tag{1.80}
]

[
\boxed{
\mathcal C_{\mathrm{SFT}},
\quad
\omega_c,
\quad
N_{\mathrm{SFT}},
\quad
\text{token count},
\quad
\text{deduplication rule},
\quad
\text{train/validation split}
=============================

\mathrm{UNDISCLOSED}}
\tag{1.81}
]

([arXiv][1])

---

[
\boxed{\textsc{II. SFT Training Loop}}
]

[
\textsc{Initialize}
]

[
\theta_0
========

\theta_{\mathrm{Base}}.
\tag{2.1}
]

[
\Theta_{\mathrm{train}}
\subseteq
\theta_0,
\qquad
\Theta_{\mathrm{frozen}}
========================

\theta_0
\setminus
\Theta_{\mathrm{train}}.
\tag{2.2}
]

[
\Theta_{\mathrm{train}}
\neq
\varnothing.
\tag{2.3}
]

[
\boxed{
\Theta_{\mathrm{train}},
\quad
\Theta_{\mathrm{frozen}}
========================

\mathrm{UNDISCLOSED}}
\tag{2.4}
]

[
\Omega_0
========

\operatorname{InitOptimizerState}
\left(
\Theta_{\mathrm{train}}
\right).
\tag{2.5}
]

[
b_0
===

b_{\mathrm{Base}}.
\tag{2.6}
]

[
\boxed{
\operatorname{SFTUpdate}(b_t)
=============================

\mathrm{UNDISCLOSED}}
\tag{2.7}
]

[
\boxed{
\mathcal L_{\mathrm{balance}}^{\mathrm{SFT}}
============================================

\mathrm{UNDISCLOSED}}
\tag{2.8}
]

[
\textsc{QAT-State}
]

[
\theta_t
========

\theta_t^{\mathrm{expert}}
\sqcup
\theta_t^{\mathrm{nonexpert}}.
\tag{2.9}
]

[
\theta_t^{\mathrm{nonexpert}}
=============================

\theta_t^{\mathrm{attention}}
\sqcup
\theta_t^{\mathrm{latent\mbox{-}MoE}}
\sqcup
\theta_t^{\mathrm{shared\mbox{-}expert}}
\sqcup
\theta_t^{\mathrm{router}}
\sqcup
\theta_t^{\mathrm{other}}.
\tag{2.10}
]

[
\widetilde\theta_t^{\mathrm{expert}}
====================================

\mathfrak Q_{\mathrm{MXFP4}}
\left(
\theta_t^{\mathrm{expert}}
\right).
\tag{2.11}
]

[
\widetilde a_t^{\mathrm{expert}}
================================

\mathfrak Q_{\mathrm{MXFP8}}
\left(
a_t^{\mathrm{expert}}
\right).
\tag{2.12}
]

[
\widetilde\theta_t^{\mathrm{nonexpert}}
=======================================

\theta_t^{\mathrm{nonexpert}}
\quad
\text{in higher precision}.
\tag{2.13}
]

[
\widetilde M_{\theta_t}
=======================

M_{
\widetilde\theta_t^{\mathrm{expert}}
\sqcup
\widetilde\theta_t^{\mathrm{nonexpert}}
}.
\tag{2.14}
]

[
\boxed{
\begin{aligned}
&
\text{MXFP4 scaling granularity},
\
&
\text{MXFP8 scaling granularity},
\
&
\text{rounding rule},
\
&
\text{saturation rule},
\
&
\text{observer/calibration rule},
\
&
\text{master-weight precision},
\
&
\text{straight-through estimator},
\
&
\frac{\partial\mathfrak Q}{\partial\theta}
\end{aligned}
=============

\mathrm{UNDISCLOSED}}
\tag{2.15}
]

[
\mathfrak Q_t
=============

\left(
\mathfrak Q_{\mathrm{MXFP4}},
\mathfrak Q_{\mathrm{MXFP8}},
\mathfrak Q_{\mathrm{higher}}
\right).
\tag{2.16}
]

([arXiv][1])

---

[
\textsc{For }
t=0,\ldots,T_{\mathrm{SFT}}-1
]

[
\textsc{Sample}
]

[
\mathcal S_t
============

\left{
d_{t,i}^{\mathrm{SFT}}
\right}*{i=1}^{B_t}
\overset{\mathrm{iid/non\mbox{-}iid}}{\sim}
P*{\mathrm{SFT}}.
\tag{2.17}
]

[
\boxed{
\text{sampling with/without replacement},
\quad
\text{curriculum},
\quad
\text{domain balancing},
\quad
\text{difficulty weighting}
===========================

\mathrm{UNDISCLOSED}}
\tag{2.18}
]

[
\textsc{Batch}
]

[
\mathcal B_t
============

\operatorname{BatchConstruct}
\left(
\mathcal S_t;
L_{\max,t},
T_{\mu,t},
\chi_t
\right).
\tag{2.19}
]

[
\chi_t
\in
\left{
\mathsf{padding},
\mathsf{sequence\ packing},
\mathsf{length\ bucketing},
\mathsf{modality\ bucketing}
\right}.
\tag{2.20}
]

[
\boxed{
B_t,
\quad
L_{\max,t},
\quad
T_{\mu,t},
\quad
\chi_t,
\quad
\text{packing boundaries},
\quad
\text{cross-example attention mask}
===================================

\mathrm{UNDISCLOSED}}
\tag{2.21}
]

[
\mathcal B_t
============

\biguplus_{r=1}^{R_{\mathrm{DP}}}
\biguplus_{a=1}^{A_t}
\mathcal B_{t,r,a}^{\mu}.
\tag{2.22}
]

[
\mathcal B_{t,r,a}^{\mu}
========================

\left(
\mathbf X_{t,r,a},
\mathbf A_{t,r,a},
\mathbf P_{t,r,a},
\mathbf G_{t,r,a}^{\mathrm{thw}},
\mathbf L_{t,r,a}
\right).
\tag{2.23}
]

[
\mathbf X_{t,r,a}
\in
\mathbb N^{
B_{t,r,a}^{\mu}
\times
L_{t,r,a}
}.
\tag{2.24}
]

[
\mathbf A_{t,r,a}
\in
{0,1}^{
B_{t,r,a}^{\mu}
\times
L_{t,r,a}
}.
\tag{2.25}
]

[
\mathbf L_{t,r,a}
\in
\left(
{0,\ldots,|\mathcal V|-1}
\cup
{-100}
\right)^{
B_{t,r,a}^{\mu}
\times
L_{t,r,a}
}.
\tag{2.26}
]

[
\mathbf P_{t,r,a}
\in
\mathbb R^{
N_{t,r,a}^{\mathrm{media}}
\times
C
\times
H
\times
W
}.
\tag{2.27}
]

[
\mathbf G_{t,r,a}^{\mathrm{thw}}
\in
\mathbb N^{
N_{t,r,a}^{\mathrm{media}}
\times3
}.
\tag{2.28}
]

[
\boxed{
R_{\mathrm{DP}},
\quad
A_t,
\quad
B_{t,r,a}^{\mu},
\quad
\mathfrak P_{\mathrm{SFT}}
==========================

\mathrm{UNDISCLOSED}}
\tag{2.29}
]

[
\textsc{Media-Label Expansion}
]

[
n_{i}^{\mathrm{expanded}}
=========================

\sum_{t=1}^{L_i}
\left[
\mathbf1(x_{i,t}\neq v_{\mathrm{media}})
+
\mathbf1(x_{i,t}=v_{\mathrm{media}})
n_{i,t}^{\mathrm{visual}}
\right].
\tag{2.30}
]

[
\mathbf X_i
\xrightarrow{\operatorname{MediaMerge}}
\mathbf E_i
\in
\mathbb R^{
n_i^{\mathrm{expanded}}
\times d
}.
\tag{2.31}
]

[
\forall u
\in
\mathcal T_i^{\mathrm{inserted\ visual\ embedding}}:
\qquad
L_{i,u}^{\mathrm{expanded}}
===========================

-100
\quad
\textsf{[CODE-VERIFIED RELEASED INTERFACE]}.
\tag{2.32}
]

[
A_{i,u}^{\mathrm{expanded}}
===========================

1
\qquad
\forall u
\in
\mathcal T_i^{\mathrm{inserted\ visual\ embedding}}.
\tag{2.33}
]

[
\boxed{
\text{production-SFT media-label implementation}
================================================

\mathrm{UNDISCLOSED}}
\tag{2.34}
]

([Hugging Face][3])

---

[
\textsc{Forward}
]

[
\mathbf Z_{t,r,a}
=================

\widetilde M_{\theta_t}
\left(
\mathbf X_{t,r,a},
\mathbf A_{t,r,a},
\mathbf P_{t,r,a},
\mathbf G_{t,r,a}^{\mathrm{thw}}
\right).
\tag{2.35}
]

[
\mathbf Z_{t,r,a}
\in
\mathbb R^{
B_{t,r,a}^{\mu}
\times
L_{t,r,a}^{\mathrm{expanded}}
\times
|\mathcal V|
}.
\tag{2.36}
]

[
p_{t,r,a,i,u,v}
===============

\frac{
\exp
\left(
Z_{t,r,a,i,u,v}
\right)
}{
\sum_{v'=1}^{|\mathcal V|}
\exp
\left(
Z_{t,r,a,i,u,v'}
\right)
}.
\tag{2.37}
]

[
\textsc{Shift}
]

[
\widehat{\mathbf Z}_{i,u}
=========================

\mathbf Z_{i,u-1},
\qquad
\widehat L_{i,u}
================

L_{i,u},
\qquad
u\in{2,\ldots,L_i}.
\tag{2.38}
]

[
\mathcal I_{t,r,a}^{\mathrm{valid}}
===================================

\left{
(i,u):
A_{i,u}=1
\land
L_{i,u}\neq-100
\right}.
\tag{2.39}
]

[
N_{t,r,a}^{\mathrm{valid}}
==========================

\left|
\mathcal I_{t,r,a}^{\mathrm{valid}}
\right|.
\tag{2.40}
]

[
\textsc{Loss}
]

[
\mathcal L_{t,r,a}^{\mathrm{CE}}
================================

*

\frac{
1
}{
N_{t,r,a}^{\mathrm{valid}}
}
\sum_{
(i,u)\in
\mathcal I_{t,r,a}^{\mathrm{valid}}
}
\log
p_{t,r,a,i,u-1,L_{i,u}}.
\tag{2.41}
]

[
\textsf{[CODE-VERIFIED RELEASED MODEL LOSS INTERFACE]}
]

[
\mathcal L_{t,r,a}^{\mathrm{prod}}
==================================

\operatorname{SFTObjective}*{\mathrm{K3}}
\left(
\mathbf Z*{t,r,a},
\mathbf L_{t,r,a},
\mathbf A_{t,r,a}
\right).
\tag{2.42}
]

[
\boxed{
\operatorname{SFTObjective}_{\mathrm{K3}}
=========================================

\mathrm{UNDISCLOSED}}
\tag{2.43}
]

[
\boxed{
\mathcal L_{t,r,a}^{\mathrm{prod}}
\stackrel{?}{=}
\mathcal L_{t,r,a}^{\mathrm{CE}}
}
\tag{2.44}
]

[
\boxed{
\text{equality in (2.44)}
=========================

\mathrm{NOT\ PROVEN}}
\tag{2.45}
]

([Hugging Face][3])

---

[
\textsc{Backward}
]

[
g_{t,r,a}
=========

\nabla_{\Theta_{\mathrm{train}}}
\mathcal L_{t,r,a}^{\mathrm{prod}}.
\tag{2.46}
]

[
g_{t,r}
=======

\sum_{a=1}^{A_t}
w_{t,r,a}^{\mathrm{acc}}
g_{t,r,a}.
\tag{2.47}
]

[
\boxed{
w_{t,r,a}^{\mathrm{acc}},
\quad
\text{microbatch-loss normalization}
====================================

\mathrm{UNDISCLOSED}}
\tag{2.48}
]

[
g_t^{\mathrm{global}}
=====================

\operatorname{DistributedGradientReduce}
\left(
\left{
g_{t,r}
\right}*{r=1}^{R*{\mathrm{DP}}};
\mathfrak P_{\mathrm{SFT}}
\right).
\tag{2.49}
]

[
\widetilde\theta_t
==================

\mathfrak Q_t
\left(
\theta_t
\right).
\tag{2.50}
]

[
g_t^{\mathrm{global}}
=====================

J_{\mathfrak Q_t}
\left(
\theta_t
\right)^{\top}
\nabla_{\widetilde\theta_t}
\mathcal L_t.
\tag{2.51}
]

[
\boxed{
J_{\mathfrak Q_t}
=================

\mathrm{UNDISCLOSED}}
\tag{2.52}
]

[
\widehat g_t
============

\operatorname{GradientTransform}_{\mathrm{SFT}}
\left(
g_t^{\mathrm{global}}
\right).
\tag{2.53}
]

[
\boxed{
\begin{aligned}
&
\text{gradient clipping},
\
&
\text{gradient scaling},
\
&
\text{gradient dtype},
\
&
\text{NaN/Inf handling},
\
&
\text{MoE expert-gradient normalization},
\
&
\text{vision-gradient scaling}
\end{aligned}
=============

\mathrm{UNDISCLOSED}}
\tag{2.54}
]

[
\textsc{Update}
]

[
\left(
\theta_{t+1},
\Omega_{t+1}
\right)
=======

\operatorname{Optimizer}_{\mathrm{SFT}}
\left(
\theta_t,
\Omega_t,
\widehat g_t;
\eta_t,
\lambda_t
\right).
\tag{2.55}
]

[
\boxed{
\operatorname{Optimizer}_{\mathrm{SFT}},
\quad
\eta_t,
\quad
\lambda_t,
\quad
\text{moment coefficients},
\quad
\text{epsilon},
\quad
\text{parameter-group rules}
============================

\mathrm{UNDISCLOSED}}
\tag{2.56}
]

[
\boxed{
\text{Per-Head Muon in K3 SFT}
==============================

\mathrm{NOT\ ESTABLISHED}}
\tag{2.57}
]

[
\boxed{
\text{AdamW in K3 SFT}
======================

\mathrm{NOT\ ESTABLISHED}}
\tag{2.58}
]

[
\boxed{
\text{weight decay in K3 SFT}
=============================

\mathrm{UNDISCLOSED}}
\tag{2.59}
]

[
\boxed{
\text{learning-rate schedule in K3 SFT}
=======================================

\mathrm{UNDISCLOSED}}
\tag{2.60}
]

[
\boxed{
\text{number of epochs/steps}
=============================

\mathrm{UNDISCLOSED}}
\tag{2.61}
]

[
b_{t+1}
=======

\operatorname{RoutingStateUpdate}_{\mathrm{SFT}}
\left(
b_t,
\mathcal B_t
\right).
\tag{2.62}
]

[
\boxed{
\operatorname{RoutingStateUpdate}_{\mathrm{SFT}}
================================================

\mathrm{UNDISCLOSED}}
\tag{2.63}
]

[
\mathfrak S_{t+1}^{\mathrm{SFT}}
================================

\left(
\theta_{t+1},
\mathfrak Q_{t+1}(\theta_{t+1}),
\Omega_{t+1},
b_{t+1},
\mathcal D_{\mathrm{SFT}},
\mathcal B_{t+1},
\mathfrak Q_{t+1},
\mathfrak P_{t+1}
\right).
\tag{2.64}
]

[
\textsc{End For}
]

[
\boxed{
\theta_{\mathrm{SFT}}
=====================

\theta_{T_{\mathrm{SFT}}}}
\tag{2.65}
]

---

[
\boxed{\textsc{III. Distribution-Level Objective and Total Optimization}}
]

[
(x,\tau)
\sim
P_{\mathrm{SFT}}.
\tag{3.1}
]

[
s
=

\operatorname{XTMLSerialize}
\left(
x,\tau
\right).
\tag{3.2}
]

[
\left(
\mathbf X,
\mathbf A,
\mathbf P,
\mathbf G^{\mathrm{thw}},
\mathbf L
\right)
=======

\operatorname{EncodeAndLabel}
\left(
s
\right).
\tag{3.3}
]

[
\widetilde\theta
================

\mathfrak Q_{\mathrm{post}}
\left(
\theta
\right).
\tag{3.4}
]

[
\mathbf Z
=========

M_{\widetilde\theta}
\left(
\mathbf X,
\mathbf A,
\mathbf P,
\mathbf G^{\mathrm{thw}}
\right).
\tag{3.5}
]

[
\mathcal I_{\mathrm{valid}}
===========================

\left{
t:
A_t=1
\land
L_t\neq-100
\right}.
\tag{3.6}
]

[
\mathcal L_{\mathrm{CE}}
\left(
\theta;x,\tau
\right)
=======

*

\frac1{
|\mathcal I_{\mathrm{valid}}|
}
\sum_{
t\in\mathcal I_{\mathrm{valid}}
}
\log
\operatorname{Softmax}
\left(
Z_{t-1}
\right)_{L_t}.
\tag{3.7}
]

[
\textsf{[CODE-VERIFIED RELEASE-COMPATIBLE OBJECTIVE]}
]

[
\mathcal J_{\mathrm{CE}}
\left(
\theta
\right)
=======

\mathbb E_{
(x,\tau)\sim P_{\mathrm{SFT}}
}
\left[
\mathcal L_{\mathrm{CE}}
\left(
\mathfrak Q_{\mathrm{post}}(\theta);
x,\tau
\right)
\right].
\tag{3.8}
]

[
\mathcal J_{\mathrm{SFT}}^{\mathrm{K3}}
\left(
\theta
\right)
=======

\mathbb E_{
(x,\tau)\sim P_{\mathrm{SFT}}
}
\left[
\operatorname{SFTObjective}*{\mathrm{K3}}
\left(
M*{\mathfrak Q_{\mathrm{post}}(\theta)},
x,
\tau
\right)
\right].
\tag{3.9}
]

[
\boxed{
\mathcal J_{\mathrm{SFT}}^{\mathrm{K3}}
=======================================

\mathrm{UNDISCLOSED}
\quad
\text{at exact scalar-objective level}}
\tag{3.10}
]

[
\boxed{
\mathcal J_{\mathrm{SFT}}^{\mathrm{K3}}
\stackrel{?}{=}
\mathcal J_{\mathrm{CE}}
}
\tag{3.11}
]

[
\boxed{
\text{equality in (3.11)}
=========================

\mathrm{NOT\ PROVEN}}
\tag{3.12}
]

[
\boxed{
\mathcal L_{\mathrm{MTP}}^{\mathrm{SFT}}
========================================

\mathrm{UNDISCLOSED}}
\tag{3.13}
]

[
\boxed{
\mathcal L_{\mathrm{router}}^{\mathrm{SFT}}
===========================================

\mathrm{UNDISCLOSED}}
\tag{3.14}
]

[
\boxed{
\mathcal L_{\mathrm{balance}}^{\mathrm{SFT}}
============================================

\mathrm{UNDISCLOSED}}
\tag{3.15}
]

[
\boxed{
\mathcal L_{\mathrm{vision\mbox{-}aux}}^{\mathrm{SFT}}
======================================================

\mathrm{UNDISCLOSED}}
\tag{3.16}
]

[
\boxed{
\mathcal L_{\mathrm{format}}^{\mathrm{SFT}}
===========================================

\mathrm{UNDISCLOSED}}
\tag{3.17}
]

[
\boxed{
\mathcal L_{\mathrm{tool}}^{\mathrm{SFT}}
=========================================

\mathrm{UNDISCLOSED}}
\tag{3.18}
]

[
\boxed{
\mathcal L_{\mathrm{reasoning}}^{\mathrm{SFT}}
==============================================

\mathrm{UNDISCLOSED}}
\tag{3.19}
]

[
\boxed{
\mathcal L_{\mathrm{quant}}^{\mathrm{additive}}
===============================================

\mathrm{NOT\ REPORTED}}
\tag{3.20}
]

[
\boxed{
\mathcal J_{\mathrm{SFT}}(\theta)
=================================

\mathcal J_{\mathrm{task}}
\left(
\mathfrak Q_{\mathrm{post}}(\theta)
\right)
}
\qquad
\textsf{[DERIVED QAT FORM]}.
\tag{3.21}
]

[
\boxed{
\mathcal J_{\mathrm{SFT}}
\neq
\mathcal J_{\mathrm{task}}
+
\lambda_q
\mathcal L_{\mathrm{quant}}
}
\qquad
\textsf{[NO PRIMARY-SOURCE SUPPORT]}.
\tag{3.22}
]

([arXiv][1])

---

[
\boxed{\textsc{Optimization}}
]

[
\theta^\star_{\mathrm{SFT}}
\in
\arg\min_{
\theta:
\theta_{\Theta_{\mathrm{frozen}}}
=================================

\theta_{\mathrm{Base},\Theta_{\mathrm{frozen}}}
}
\mathcal J_{\mathrm{SFT}}^{\mathrm{K3}}
\left(
\theta
\right).
\tag{3.23}
]

[
g_t
===

\nabla_{\Theta_{\mathrm{train}}}
\mathcal J_{\mathrm{SFT}}^{\mathrm{K3}}
\left(
\theta_t
\right).
\tag{3.24}
]

[
\left(
\theta_{t+1},
\Omega_{t+1}
\right)
=======

\operatorname{Optimizer}_{\mathrm{SFT}}
\left(
\theta_t,
\Omega_t,
g_t
\right).
\tag{3.25}
]

[
\theta_{t+1,\Theta_{\mathrm{frozen}}}
=====================================

\theta_{t,\Theta_{\mathrm{frozen}}}.
\tag{3.26}
]

[
\theta_{t+1,\Theta_{\mathrm{train}}}
\neq
\theta_{t,\Theta_{\mathrm{train}}}
\quad
\text{when }
g_t\neq0.
\tag{3.27}
]

[
\boxed{
\begin{aligned}
&
\left(
\theta_{\mathrm{Base}},
\Omega_0,
b_{\mathrm{Base}}
\right)
\
&\xrightarrow[
\substack{
x\sim P_{\mathrm{seed}}
\
\tau\sim\pi_{\phi_{k(x)}}(\cdot\mid x)
\
\text{multi-stage verification}
\
\text{human-in-the-loop annotation}
}
]{
\operatorname{Construct}
\left(
\mathcal D_{\mathrm{SFT}}
\right)
}
\left(
\theta_{\mathrm{Base}},
\Omega_0,
b_{\mathrm{Base}},
\mathcal D_{\mathrm{SFT}}
\right)
\
&\xrightarrow[
\substack{
\text{XTML serialization}
\
\text{masked token labels}
\
\text{MXFP4 expert-weight forward}
\
\text{MXFP8 expert-activation forward}
\
\text{higher-precision non-experts}
}
]{
\mathcal J_{\mathrm{SFT}}^{\mathrm{K3}}
}
\boxed{
\left(
\theta_{\mathrm{SFT}},
\Omega_{\mathrm{SFT}},
b_{\mathrm{SFT}}
\right)
}.
\end{aligned}}
\tag{3.28}
]

---

[
\boxed{\textsc{Public-Evidence Boundary}}
]

[
\begin{array}{c|c}
\text{SFT component}
&
\text{status}
\
\hline
\text{prior-Kimi specialist trajectory synthesis}
&
\textsf{[REPORTED]}
\
\text{multi-stage verification}
&
\textsf{[REPORTED]}
\
\text{human-in-the-loop annotation}
&
\textsf{[REPORTED]}
\
\text{XTML serialization}
&
\textsf{[REPORTED/CODE-VERIFIED]}
\
\text{system/user/assistant/tool roles}
&
\textsf{[CODE-VERIFIED]}
\
\text{think/response/tools channels}
&
\textsf{[REPORTED/CODE-VERIFIED]}
\
\text{typed indexed tool calls}
&
\textsf{[REPORTED/CODE-VERIFIED]}
\
\text{pure-JSON input fallback masking}
&
\textsf{[REPORTED]}
\
\text{SFT-stage MXFP4/MXFP8 QAT}
&
\textsf{[REPORTED]}
\
\text{released shifted CE interface}
&
\textsf{[CODE-VERIFIED]}
\
\text{production SFT token mask}
&
\textsf{[UNDISCLOSED]}
\
\text{production total scalar objective}
&
\textsf{[UNDISCLOSED]}
\
\text{optimizer}
&
\textsf{[UNDISCLOSED]}
\
\text{learning-rate schedule}
&
\textsf{[UNDISCLOSED]}
\
\text{batch size and packing}
&
\textsf{[UNDISCLOSED]}
\
\text{trainable/frozen partition}
&
\textsf{[UNDISCLOSED]}
\
\text{QAT gradient estimator}
&
\textsf{[UNDISCLOSED]}
\
\text{SFT MTP objective}
&
\textsf{[UNDISCLOSED]}
\
\text{SFT routing-state update}
&
\textsf{[UNDISCLOSED]}
\end{array}
\tag{3.29}
]

[1]: https://arxiv.org/pdf/2607.24653 "Kimi K3: Open Frontier Intelligence"
[2]: https://huggingface.co/moonshotai/Kimi-K3/blob/main/config.json?utm_source=chatgpt.com "config.json · moonshotai/Kimi-K3 at main"
[3]: https://huggingface.co/moonshotai/Kimi-K3/blob/main/modeling_kimi_k3.py "modeling_kimi_k3.py · moonshotai/Kimi-K3 at main"
[
\boxed{
\begin{array}{c}
\textsc{Algorithm 3}[1mm]
\textsc{Kimi-K3 Domain}\times\textsc{Effort Reinforcement-Learning Program}[1mm]
M_{\theta}\equiv\text{opaque trainable policy model}\
\operatorname{Int}(M_{\theta})\equiv\varnothing
\end{array}}
]

[
\boxed{
\theta_{\mathrm{SFT}}
\xrightarrow[
\substack{
d\in\mathbb D\
e\in\mathbb E
}
]{
\mathcal J_{\mathrm{RL}}^{d,e}
}
\left{
\theta_{\mathrm{RL}}^{d,e}
\right}_{(d,e)\in\mathbb D\times\mathbb E}}
\tag{0.1}
]

[
\mathbb D
=========

\left{
\mathsf{general},
\mathsf{general\mbox{-}agent},
\mathsf{coding\mbox{-}agent}
\right},
\qquad
\mathbb E
=========

\left{
\mathsf{low},
\mathsf{high},
\mathsf{max}
\right}.
\tag{0.2}
]

[
\left|
\mathbb D\times\mathbb E
\right|
=======

# 3\times3

9.

\tag{0.3}
]

[
\mathfrak S_n^{d,e}
===================

\left(
\theta_n^{d,e},
\widetilde\theta_n^{d,e},
\Omega_n^{d,e},
\pi_{\mathrm{beh}},
\mathcal Q_n^{d,e},
\mathcal K_n^{d,e},
\mathcal E_n^{d},
\mathcal R_n^{d,e},
\mathcal B_n^{d,e}
\right).
\tag{0.4}
]

[
\mathfrak S_n^{d,e}
\xrightarrow{
\mathcal J_{\mathrm{RL}}^{d,e}
}
\mathfrak S_{n+1}^{d,e}.
\tag{0.5}
]

 

---

[
\boxed{\textsc{I. RL Task and Trajectory Pre-Processing}}
]

[
\textsc{Domain Partition}
]

[
\mathcal D_{\mathrm{RL}}
========================

\mathcal D_{\mathrm{general}}
\sqcup
\mathcal D_{\mathrm{general\mbox{-}agent}}
\sqcup
\mathcal D_{\mathrm{coding\mbox{-}agent}}.
\tag{1.1}
]

[
\mathcal D_{\mathrm{general}}
\supseteq
\left{
\mathsf{general\ experience},
\mathsf{vision},
\mathsf{reasoning},
\mathsf{faithfulness},
\mathsf{search},
\mathsf{knowledge\ work}
\right}.
\tag{1.2}
]

[
\mathcal D_{\mathrm{general\mbox{-}agent}}
\supseteq
\left{
\mathsf{long\mbox{-}horizon\ assistant},
\mathsf{deep\ research},
\mathsf{professional\ writing}
\right}.
\tag{1.3}
]

[
\mathcal D_{\mathrm{coding\mbox{-}agent}}
\supseteq
\left{
\mathsf{SWE},
\mathsf{coding\ experience},
\mathsf{kernel\ optimization},
\mathsf{web\ development}
\right}.
\tag{1.4}
]

[
P_{\mathrm{RL}}
===============

\sum_{d\in\mathbb D}
\omega_d
P_d,
\qquad
\omega_d\ge0,
\qquad
\sum_{d\in\mathbb D}\omega_d=1.
\tag{1.5}
]

[
\boxed{
\omega_d,
\quad
|\mathcal D_d|,
\quad
\text{domain-token mixture},
\quad
\text{prompt-frequency mixture}
===============================

\mathrm{UNDISCLOSED}}
\tag{1.6}
]

([arXiv][1])

---

[
\textsc{Harness Construction}
]

[
\mathfrak H
===========

\left(
\mathfrak T,
\mathfrak G,
\mathfrak C,
\mathfrak S,
\mathfrak M,
\mathfrak A
\right).
\tag{1.7}
]

[
\begin{aligned}
\mathfrak T&=\text{tool-interface configuration},\
\mathfrak G&=\text{system-prompt configuration},\
\mathfrak C&=\text{context-management configuration},\
\mathfrak S&=\text{skill configuration},\
\mathfrak M&=\text{memory configuration},\
\mathfrak A&=\text{subagent configuration}.
\end{aligned}
\tag{1.8}
]

[
h_i
\sim
P_{\mathfrak H}
\left(
\mathfrak T,
\mathfrak G,
\mathfrak C,
\mathfrak S,
\mathfrak M,
\mathfrak A
\mid d_i
\right).
\tag{1.9}
]

[
\boxed{
P_{\mathfrak H},
\quad
\text{module-selection probabilities},
\quad
\text{harness-specific sampling weights}
========================================

\mathrm{UNDISCLOSED}}
\tag{1.10}
]

[
h_i
\in
\left{
\mathsf{KimiCode},
\mathsf{ClaudeCode},
\mathsf{Codex},
\mathsf{OpenClaw},
\mathsf{Hermes},
\mathsf{novel\ composition}
\right}.
\tag{1.11}
]

[
\operatorname{HarnessDiversity}
\left(
\mathcal D_{\mathrm{RL}}
\right)
=======

\left{
h_i
\right}*{i=1}^{N*{\mathrm{RL}}}.
\tag{1.12}
]

([arXiv][1])

---

[
\textsc{Knowledge-Graph-Guided Task Synthesis}
]

[
\mathcal G_{\mathrm{KG}}
========================

\left(
\mathcal V_{\mathrm{KG}},
\mathcal E_{\mathrm{KG}}
\right),
\qquad
\mathcal G_{\mathrm{KG}}
\text{ is a directed acyclic graph}.
\tag{1.13}
]

[
\mathcal V_{\mathrm{KG}}^{(0)}
==============================

\mathcal V_{\mathrm{seed}}.
\tag{1.14}
]

[
\forall v\in\mathcal V_{\mathrm{KG}}:
]

[
\mathcal W_v
============

\operatorname{WebExplore}
\left(
v
\right).
\tag{1.15}
]

[
\mathcal N_v
============

\operatorname{ExtractConcepts}
\left(
\mathcal W_v
\right).
\tag{1.16}
]

[
u\in\mathcal N_v
\Longrightarrow
\begin{cases}
u\equiv v'
&
\Rightarrow
\operatorname{Reuse}(v'),
\
u\not\equiv v'
&
\Rightarrow
(v,u)\in\mathcal E_{\mathrm{KG}}.
\end{cases}
\tag{1.17}
]

[
\operatorname{granularity}(v)
<
\operatorname{granularity}(u)
\qquad
\forall(v,u)\in\mathcal E_{\mathrm{KG}}.
\tag{1.18}
]

[
\operatorname{Atomic}(v)=1
\Longrightarrow
\operatorname{Expand}(v)=0.
\tag{1.19}
]

[
\mathcal U_i
\sim
P_{\mathrm{node}}
\left(
\mathcal V_{\mathrm{KG}}
\right).
\tag{1.20}
]

[
k_i
===

\operatorname{Keywords}
\left(
\mathcal U_i,
\operatorname{Ancestors}
\left(
\mathcal U_i
\right)
\right).
\tag{1.21}
]

[
\mathcal M_i
============

\operatorname{RetrievePublicMaterials}
\left(
k_i
\right).
\tag{1.22}
]

[
c_i
\sim
P_{\mathrm{task\mbox{-}type}}
\left(
\cdot\mid
\mathcal U_i,
\mathcal M_i
\right).
\tag{1.23}
]

[
x_i
===

\operatorname{SynthesizeTask}
\left(
\mathcal U_i,
\mathcal M_i,
c_i
\right).
\tag{1.24}
]

[
\boxed{
P_{\mathrm{node}},
\quad
P_{\mathrm{task\mbox{-}type}},
\quad
\text{synthesis-model identities},
\quad
\text{synthesis-filter thresholds}
==================================

\mathrm{UNDISCLOSED}}
\tag{1.25}
]

([arXiv][1])

---

[
\textsc{RL Problem Schema}
]

[
x_i^{d,e}
=========

\left(
q_i,
d_i,
e_i,
\mathcal I_i,
\mathcal V_i,
h_i,
s_{i,0}^{\mathrm{env}},
\mathcal A_i,
\mathcal C_i,
\mathcal T_i,
\mathcal V_i^{\mathrm{public}},
\mathcal V_i^{\mathrm{hidden}},
b_0(x_i),
\ell_0(x_i)
\right).
\tag{1.26}
]

[
\begin{aligned}
q_i&=\text{objective/instruction},\
d_i&\in\mathbb D,\
e_i&\in\mathbb E,\
\mathcal I_i,\mathcal V_i&=\text{image/video inputs},\
h_i&=\text{agent-harness configuration},\
s_{i,0}^{\mathrm{env}}&=\text{initial environment state},\
\mathcal A_i&=\text{tool/action space},\
\mathcal C_i&=\text{constraints and execution budgets},\
\mathcal T_i&=\text{termination conditions},\
\mathcal V_i^{\mathrm{public}}&=\text{diagnostic verifier},\
\mathcal V_i^{\mathrm{hidden}}&=\text{held-out verifier},\
b_0(x_i)&=\text{cold-start token-budget estimate},\
\ell_0(x_i)&=\text{cold-start verbosity estimate}.
\end{aligned}
\tag{1.27}
]

[
e_i
===

\operatorname{GlobalOption}
\left(
\mathsf{reasoning_effort}
\right)
\in
\left{
\mathsf{low},
\mathsf{high},
\mathsf{max}
\right}.
\tag{1.28}
]

[
\operatorname{History}_i
========================

\left[
m_{i,1},
\ldots,
m_{i,R_i}
\right],
\tag{1.29}
]

[
m_{i,r}^{\mathrm{assistant}}
============================

\left(
y_{i,r}^{\mathrm{reasoning}},
y_{i,r}^{\mathrm{content}},
y_{i,r}^{\mathrm{tool\mbox{-}calls}}
\right).
\tag{1.30}
]

[
\operatorname{PreservedThinking}
\Longrightarrow
m_{i,r}^{\mathrm{assistant}}
\text{ is retained without deleting }
y_{i,r}^{\mathrm{reasoning}}.
\tag{1.31}
]

[
\operatorname{Serialize}_{\mathrm{RL}}
\left(
x_i^{d,e}
\right)
=======

\mathbf X_i^{d,e}.
\tag{1.32}
]

[
\boxed{
\operatorname{Serialize}_{\mathrm{RL}}
\text{ exact training implementation}
=====================================

\mathrm{UNDISCLOSED}}
\tag{1.33}
]

([arXiv][1])

---

[
\textsc{Environment Class}
]

[
\mathcal E_i
============

\left(
\operatorname{Reset}_i,
\operatorname{Step}_i,
\operatorname{Observe}_i,
\operatorname{Terminal}_i,
\operatorname{Verify}_i
\right).
\tag{1.34}
]

[
s_{i,t+1}^{\mathrm{env}},
o_{i,t+1},
\delta_{i,t+1}
==============

\operatorname{Step}*i
\left(
s*{i,t}^{\mathrm{env}},
a_{i,t}
\right).
\tag{1.35}
]

[
\delta_{i,t+1}
\in
{0,1}.
\tag{1.36}
]

[
\delta_{i,t+1}=1
\Longleftrightarrow
\operatorname{Terminal}*i
\left(
s*{i,t+1}^{\mathrm{env}}
\right)=1.
\tag{1.37}
]

[
\mathcal E_i
\in
\left{
\mathsf{white\mbox{-}box},
\mathsf{black\mbox{-}box},
\mathsf{container},
\mathsf{GPU\ sandbox},
\mathsf{microVM}
\right}.
\tag{1.38}
]

[
\operatorname{AgentTask}_i
\equiv
\operatorname{AsyncCoroutine}
\left(
x_i,\mathcal E_i
\right).
\tag{1.39}
]



---

[
\textsc{Reasoning-Effort Curriculum}
]

[
b_0(x)
======

\operatorname{TokenBudgetEstimate}
\left(
\pi_{\mathrm{SFT}},
x
\right).
\tag{1.40}
]

[
\tau_{d,\mathrm{max}}

>

\tau_{d,\mathrm{high}}

>

\tau_{d,\mathrm{low}}.
\tag{1.41}
]

[
\operatorname{Curriculum}*{d}
:
\quad
\tau*{d,\mathrm{max}}
\longrightarrow
\tau_{d,\mathrm{high}}
\longrightarrow
\tau_{d,\mathrm{low}}.
\tag{1.42}
]

[
\boxed{
\tau_{d,e},
\quad
b_0(x)\text{ estimator},
\quad
\text{annealing duration},
\quad
\text{checkpoint transfer between effort levels}
================================================

\mathrm{UNDISCLOSED}}
\tag{1.43}
]

[
\theta_{0}^{d,\mathrm{max}}
===========================

\theta_{\mathrm{SFT}}.
\tag{1.44}
]

[
\boxed{
\theta_{0}^{d,\mathrm{high}},
\quad
\theta_{0}^{d,\mathrm{low}}
===========================

\mathrm{UNDISCLOSED}}
\tag{1.45}
]

([arXiv][1])

---

[
\boxed{\textsc{II. Rollout and Policy-Training Loop}}
]

[
\textsc{Initialize Expert}
]

[
\forall(d,e)\in\mathbb D\times\mathbb E:
]

[
\theta_{0}^{d,e}
\leftarrow
\operatorname{Initialize}*{d,e}
\left(
\theta*{\mathrm{SFT}}
\right).
\tag{2.1}
]

[
\Omega_0^{d,e}
==============

\operatorname{InitMuonClipState}
\left(
\theta_0^{d,e}
\right).
\tag{2.2}
]

[
\pi_{\mathrm{beh},0}^{d,e}
==========================

\operatorname{sg}
\left[
\pi_{\theta_0^{d,e}}
\right].
\tag{2.3}
]

[
\mathcal Q_0^{d,e}
==================

\varnothing.
\tag{2.4}
]

[
\textsc{QAT Forward State}
]

[
\theta_n
========

\theta_n^{\mathrm{expert}}
\sqcup
\theta_n^{\mathrm{nonexpert}}.
\tag{2.5}
]

[
\widetilde\theta_n^{\mathrm{expert}}
====================================

Q_{\mathrm{MXFP4}}
\left(
\theta_n^{\mathrm{expert}}
\right).
\tag{2.6}
]

[
\widetilde a_n^{\mathrm{expert}}
================================

Q_{\mathrm{MXFP8}}
\left(
a_n^{\mathrm{expert}}
\right).
\tag{2.7}
]

[
\widetilde\theta_n^{\mathrm{nonexpert}}
=======================================

\theta_n^{\mathrm{nonexpert}}
\quad
\text{in higher precision}.
\tag{2.8}
]

[
\widetilde M_{\theta_n}
=======================

M_{
\widetilde\theta_n^{\mathrm{expert}}
\sqcup
\widetilde\theta_n^{\mathrm{nonexpert}}
}.
\tag{2.9}
]

[
Q_{\mathrm{rollout}}
====================

# Q_{\mathrm{learner}}

Q_{\mathrm{post}}.
\tag{2.10}
]

[
\boxed{
\text{QAT scaling granularity},
\quad
\text{rounding},
\quad
\text{saturation},
\quad
\frac{\partial Q}{\partial\theta}
=================================

\mathrm{UNDISCLOSED}}
\tag{2.11}
]

([arXiv][1])

---

[
\textsc{For }
n=0,\ldots,N_{\mathrm{RL}}-1
]

[
\textsc{Prompt Batch}
]

[
\mathcal X_n^{d,e}
==================

\left{
x_{n,1}^{d,e},
\ldots,
x_{n,N}^{d,e}
\right}
\sim
P_d^{\otimes N}.
\tag{2.12}
]

[
\boxed{
N,
\quad
K,
\quad
P_d,
\quad
\text{prompt-reuse policy}
==========================

\mathrm{UNDISCLOSED}}
\tag{2.13}
]

[
\mathcal W_n^{(0)}
==================

\operatorname{Resume}
\left(
\mathcal Q_n^{d,e}
\right)
\cup
\left{
(i,j):
1\le i\le N,;
1\le j\le K
\right}.
\tag{2.14}
]

[
\left|
\mathcal W_n^{(0)}
\right|
\le
NK+
\left|
\mathcal Q_n^{d,e}
\right|.
\tag{2.15}
]

---

[
\textsc{Trajectory State}
]

[
\Xi_{i,j,t}
===========

\left(
x_i,
y_{i,j,<t},
o_{i,j,<t},
s_{i,j,t}^{\mathrm{env}},
\mathcal K_{i,j,t}^{\mathrm{MLA}},
\mathcal S_{i,j,t}^{\mathrm{KDA}},
\mathcal Z_{i,j,t}^{\mathrm{sandbox}},
\nu_{i,j,t},
\ell_{i,j,<t}^{\mathrm{beh}},
t
\right).
\tag{2.16}
]

[
\begin{aligned}
\mathcal K_{i,j,t}^{\mathrm{MLA}}
&=\text{MLA prefix KV-cache state},\
\mathcal S_{i,j,t}^{\mathrm{KDA}}
&=\text{KDA recurrent prefix state},\
\mathcal Z_{i,j,t}^{\mathrm{sandbox}}
&=\text{persistent environment snapshot},\
\nu_{i,j,t}
&=\text{behavior-policy version identifier}.
\end{aligned}
\tag{2.17}
]

[
\nabla
\Xi_{i,j,t}
===========

0
\qquad
\text{during rollout}.
\tag{2.18}
]

[
\boxed{
\text{policy-version continuity across resumed trajectories}
============================================================

\mathrm{UNDISCLOSED}}
\tag{2.19}
]

([arXiv][1])

---

[
\textsc{Restore}
]

[
\left(
\mathcal K_{i,j,t}^{\mathrm{MLA}},
\mathcal S_{i,j,t}^{\mathrm{KDA}}
\right)
=======

\operatorname{PrefetchPrefix}
\left(
\operatorname{ExternalCache}
\left(
\Xi_{i,j,t}
\right)
\right).
\tag{2.20}
]

[
\mathcal Z_{i,j,t}^{\mathrm{sandbox}}
=====================================

\operatorname{ResumeMicroVM}
\left(
\operatorname{CheckpointID}_{i,j,t}
\right).
\tag{2.21}
]

[
\operatorname{Lifecycle}
\left(
\mathcal Z_{i,j,t}^{\mathrm{sandbox}}
\right)
\in
\left{
\operatorname{Pause},
\operatorname{Resume},
\operatorname{Fork},
\operatorname{Snapshot}
\right}.
\tag{2.22}
]

[
\operatorname{Fork}
\left(
\mathcal Z
\right)
=======

\left(
\mathcal Z_{\mathrm{original}},
\mathcal Z_{\mathrm{judge}}
\right).
\tag{2.23}
]

[
\mathcal Z_{\mathrm{judge}}
\perp
\mathcal Z_{\mathrm{original}}
\quad
\text{with respect to subsequent side effects}.
\tag{2.24}
]

([arXiv][1])

---

[
\textsc{Token-by-Token Response Generation}
]

[
c_{i,j,t}
=========

\operatorname{Context}
\left(
x_i,
y_{i,j,<t},
o_{i,j,<t}
\right).
\tag{2.25}
]

[
\mathbf z_{i,j,t}^{\mathrm{beh}}
================================

\widetilde M_{
\theta_{\nu_{i,j,t}}^{d,e}
}
\left(
c_{i,j,t};
\mathcal K_{i,j,t}^{\mathrm{MLA}},
\mathcal S_{i,j,t}^{\mathrm{KDA}}
\right).
\tag{2.26}
]

[
\mathbf z_{i,j,t}^{\mathrm{beh}}
\in
\mathbb R^{|\mathcal V|}.
\tag{2.27}
]

[
\mathbf p_{i,j,t}^{\mathrm{beh}}
================================

\operatorname{SamplingDistribution}
\left(
\mathbf z_{i,j,t}^{\mathrm{beh}};
\xi_{i,j,t}
\right).
\tag{2.28}
]

[
\boxed{
\xi_{i,j,t}
===========

\left(
\text{temperature},
\text{top-}p,
\text{top-}k,
\text{sampling mask}
\right)
=======

\mathrm{UNDISCLOSED\ for\ RL}}
\tag{2.29}
]

[
y_{i,j,t}
\sim
\operatorname{Categorical}
\left(
\mathbf p_{i,j,t}^{\mathrm{beh}}
\right).
\tag{2.30}
]

[
\ell_{i,j,t}^{\mathrm{beh}}
===========================

\log
p_{i,j,t,y_{i,j,t}}^{\mathrm{beh}}.
\tag{2.31}
]

[
\nabla_{\theta}
\ell_{i,j,t}^{\mathrm{beh}}
===========================

0.

\tag{2.32}
]

[
\operatorname{Store}
\left(
y_{i,j,t},
\ell_{i,j,t}^{\mathrm{beh}},
\nu_{i,j,t}
\right).
\tag{2.33}
]

[
\left(
\mathcal K_{i,j,t+1}^{\mathrm{MLA}},
\mathcal S_{i,j,t+1}^{\mathrm{KDA}}
\right)
=======

\operatorname{AdvanceCache}
\left(
\mathcal K_{i,j,t}^{\mathrm{MLA}},
\mathcal S_{i,j,t}^{\mathrm{KDA}},
y_{i,j,t}
\right).
\tag{2.34}
]

[
\textsc{[TOKEN-IN/TOKEN-OUT WITH STORED BEHAVIOR LOG-PROBABILITY]}
]



---

[
\textsc{Action Boundary}
]

[
\operatorname{Parse}
\left(
y_{i,j,1:t}
\right)
=======

\begin{cases}
a_{i,j,t}^{\mathrm{tool}},
&
\operatorname{ToolCallComplete}=1,
\
y_{i,j,t}^{\mathrm{text}},
&
\operatorname{ToolCallComplete}=0.
\end{cases}
\tag{2.35}
]

[
a_{i,j,t}^{\mathrm{tool}}\neq\varnothing
\Longrightarrow
\left(
s_{i,j,t+1}^{\mathrm{env}},
o_{i,j,t+1},
\delta_{i,j,t+1}
\right)
=======

\operatorname{Step}*{\mathcal E_i}
\left(
s*{i,j,t}^{\mathrm{env}},
a_{i,j,t}^{\mathrm{tool}}
\right).
\tag{2.36}
]

[
c_{i,j,t+1}
===========

c_{i,j,t}
\Vert
a_{i,j,t}^{\mathrm{tool}}
\Vert
o_{i,j,t+1}.
\tag{2.37}
]

[
\delta_{i,j,t+1}=0
\Longrightarrow
\operatorname{ContinueRollout}
\left(
\Xi_{i,j,t+1}
\right).
\tag{2.38}
]

[
\delta_{i,j,t+1}=1
\Longrightarrow
\nu_{i,j}
=========

\mathsf{complete}.
\tag{2.39}
]

[
\boxed{
\text{tool-call delimiter},
\quad
\text{maximum turns},
\quad
\text{maximum tool calls},
\quad
\text{termination precedence}
=============================

\mathrm{UNDISCLOSED}}
\tag{2.40}
]

---

[
\textsc{Auto-Throttling}
]

[
u_n
===

\operatorname{KVUtilization}_n,
\qquad
a_n
===

\operatorname{ActiveRequests}_n,
\qquad
q_n
===

\operatorname{QueuedRequests}_n.
\tag{2.41}
]

[
c_n^{\mathrm{admit}}
====================

F_{\mathrm{throttle}}
\left(
u_n,
a_n,
q_n
\right).
\tag{2.42}
]

[
u_n\uparrow
\Longrightarrow
c_n^{\mathrm{admit}}\downarrow.
\tag{2.43}
]

[
\boxed{
F_{\mathrm{throttle}}
=====================

\mathrm{UNDISCLOSED}}
\tag{2.44}
]

([arXiv][1])

---

[
\textsc{Partial-Rollout Barrier}
]

[
\mathcal C_n(s)
===============

\left{
(i,j)\in\mathcal W_n^{(0)}
:
\nu_{i,j}(s)=\mathsf{complete}
\right}.
\tag{2.45}
]

[
s_n^\star
=========

\inf
\left{
s:
\left|
\mathcal C_n(s)
\right|
\ge
\left\lceil
\lambda NK
\right\rceil
\right},
\qquad
\lambda\in(0,1).
\tag{2.46}
]

[
\mathcal P_n
============

\mathcal W_n^{(0)}
\setminus
\mathcal C_n(s_n^\star).
\tag{2.47}
]

[
\forall(i,j)\in\mathcal P_n:
]

[
\operatorname{WriteBack}
\left(
\mathcal K_{i,j}^{\mathrm{MLA}},
\mathcal S_{i,j}^{\mathrm{KDA}}
\right)
\rightarrow
\operatorname{CPU\mbox{-}DRAM}.
\tag{2.48}
]

[
\operatorname{Checkpoint}
\left(
\mathcal Z_{i,j}^{\mathrm{sandbox}}
\right)
\rightarrow
\operatorname{PersistentState}.
\tag{2.49}
]

[
\mathcal Q_{n+1}^{d,e}
======================

\operatorname{PriorityQueue}
\left(
\mathcal P_n
\right).
\tag{2.50}
]

[
\mathcal G_n
============

\left{
i:
\bigwedge_{j=1}^{K}
\nu_{i,j}
=========

\mathsf{complete}
\right}.
\tag{2.51}
]

[
i\notin\mathcal G_n
\Longrightarrow
\operatorname{NoLearnerDispatch}
\left(
i
\right).
\tag{2.52}
]

[
i\in\mathcal G_n
\Longrightarrow
\operatorname{Dispatch}
\left(
\tau_{i,1:K}
\right)
\rightarrow
\operatorname{RewardAndLearner}.
\tag{2.53}
]

[
\boxed{
\lambda,
\quad
\text{queue priority function},
\quad
\text{maximum rollout age}
==========================

\mathrm{UNDISCLOSED}}
\tag{2.54}
]

([arXiv][1])

---

[
\textsc{Completed Trajectory Schema}
]

[
\tau_{i,j}
==========

\left(
x_i,
y_{i,j,1:T_{i,j}},
o_{i,j,1:U_{i,j}},
a_{i,j,1:U_{i,j}},
s_{i,j,T}^{\mathrm{env}},
\ell_{i,j,1:T_{i,j}}^{\mathrm{beh}},
\nu_{i,j,1:T_{i,j}},
\mathcal M_{i,j}^{\mathrm{gen}},
r_{i,j}
\right).
\tag{2.55}
]

[
\mathcal M_{i,j,t}^{\mathrm{gen}}
=================================

\mathbf1
\left[
y_{i,j,t}
\text{ was emitted by }
\pi_{\mathrm{beh}}
\right].
\tag{2.56}
]

[
\mathcal M_{i,j,t}^{\mathrm{obs}}
=================================

\mathbf1
\left[
o_{i,j,t}
\text{ was emitted by }
\mathcal E_i
\right].
\tag{2.57}
]

[
\mathcal M_{i,j,t}^{\mathrm{gen}}
\mathcal M_{i,j,t}^{\mathrm{obs}}
=================================

0.

\tag{2.58}
]

[
N_i
===

\sum_{j=1}^{K}
\sum_{t=1}^{T_{i,j}}
\mathcal M_{i,j,t}^{\mathrm{gen}}.
\tag{2.59}
]

[
\boxed{
\text{whether all assistant channels enter }N_i,
\quad
\text{tool-argument token inclusion},
\quad
\text{special-token inclusion}
==============================

\mathrm{UNDISCLOSED}}
\tag{2.60}
]

---

[
\boxed{\textsc{Reward Evaluation}}
]

[
r_{i,j}^{\mathrm{base}}
=======================

R_{d_i}
\left(
x_i,
\tau_{i,j},
s_{i,j,T}^{\mathrm{env}}
\right).
\tag{2.61}
]

[
R_{d}
=====

\begin{cases}
R_{\mathrm{deterministic}},
&
\mathsf{verifiable},
\
R_{\mathrm{GRM}},
&
\mathsf{nonverifiable}.
\end{cases}
\tag{2.62}
]

---

[
\textsc{Verifiable Final-State Reward}
]

[
r_{i,j}^{\mathrm{ver}}
======================

\operatorname{Verify}
\left(
\mathcal V_i^{\mathrm{hidden}},
s_{i,j,T}^{\mathrm{env}},
\tau_{i,j}
\right).
\tag{2.63}
]

[
\operatorname{SelfReportedCompletion}
\not\Rightarrow
r_{i,j}^{\mathrm{ver}}>0.
\tag{2.64}
]

[
r_{i,j}^{\mathrm{ver}}
======================

R
\left(
\text{final environment state}
\right).
\tag{2.65}
]

[
\operatorname{PublicVerifier}
\rightarrow
\text{diagnostic feedback},
\tag{2.66}
]

[
\operatorname{HiddenVerifier}
\rightarrow
\text{held-out reward}.
\tag{2.67}
]

([arXiv][1])

---

[
\textsc{Kernel Reward}
]

[
\epsilon_{i,j}
==============

\operatorname{NumericalError}
\left(
\operatorname{Kernel}_{i,j},
\operatorname{Reference}_i
\right).
\tag{2.68}
]

[
\epsilon_{i,j}

>

\epsilon_i^{\max}
\Longrightarrow
r_{i,j}^{\mathrm{kernel}}=0.
\tag{2.69}
]

[
\epsilon_{i,j}
\le
\epsilon_i^{\max}
\Longrightarrow
r_{i,j}^{\mathrm{kernel}}
=========================

F_{\mathrm{perf}}
\left(
P_{i,j},
P_i^{\mathrm{expert}},
P_i^{\mathrm{roofline}}
\right).
\tag{2.70}
]

[
P_{i,j}
=======

P_i^{\mathrm{expert}}
\Longrightarrow
r_{i,j}^{\mathrm{kernel}}
=========================

0.5.
\tag{2.71}
]

[
P_{i,j}
\rightarrow
P_i^{\mathrm{roofline}}
\Longrightarrow
r_{i,j}^{\mathrm{kernel}}
\rightarrow
1.
\tag{2.72}
]

[
\operatorname{Hack}
\left(
\tau_{i,j}
\right)
\in
\left{
\mathsf{CUDA\ graph\ replay},
\mathsf{input\ caching},
\mathsf{precision\ reduction}
\right}
\Longrightarrow
r_{i,j}^{\mathrm{kernel}}
\leftarrow
\operatorname{Penalty}
\left(
r_{i,j}^{\mathrm{kernel}}
\right).
\tag{2.73}
]

[
\boxed{
F_{\mathrm{perf}},
\quad
\epsilon_i^{\max},
\quad
\operatorname{Penalty}
======================

\mathrm{UNDISCLOSED}}
\tag{2.74}
]

([arXiv][1])

---

[
\textsc{Web-Development Reward}
]

[
r_{i,j}^{\mathrm{web}}
======================

R_{\mathrm{det}}
\left(
\tau_{i,j}
\right)
\oplus
R_{\mathrm{judge}}
\left(
\tau_{i,j}
\right).
\tag{2.75}
]

[
\boxed{
\oplus
======

\mathrm{UNDISCLOSED}}
\tag{2.76}
]

[
\operatorname{BuildFailure}
\lor
\operatorname{RuntimeError}
\lor
\operatorname{FakeArtifact}
\Longrightarrow
r_{i,j}^{\mathrm{web}}
======================

0.

\tag{2.77}
]

[
R_{\mathrm{det}}
\supseteq
\left{
\mathsf{functional\ checks},
\mathsf{structural\ similarity},
\mathsf{pixel\mbox{-}level\ similarity}
\right}.
\tag{2.78}
]

[
R_{\mathrm{judge}}
\supseteq
\left{
\mathsf{source\ inspection},
\mathsf{visual\ inspection},
\mathsf{artifact\ interaction}
\right}.
\tag{2.79}
]

([arXiv][1])

---

[
\textsc{Agentic GRM Tournament}
]

[
\mathcal O_i
============

\left{
\tau_{i,1},
\ldots,
\tau_{i,K}
\right}.
\tag{2.80}
]

[
\mathcal R_i
============

\operatorname{GenerateRubric}
\left(
x_i,
\mathcal O_i
\right).
\tag{2.81}
]

[
s_{i,j}^{\mathrm{GRM}}
======================

\operatorname{Score}
\left(
\mathcal R_i,
\tau_{i,j}
\right).
\tag{2.82}
]

[
\operatorname{Scorepad}_i
=========================

\left{
s_{i,1}^{\mathrm{GRM}},
\ldots,
s_{i,K}^{\mathrm{GRM}}
\right}.
\tag{2.83}
]

[
r_{i,j}^{\mathrm{GRM}}
======================

\operatorname{BinaryTournament}
\left(
s_{i,j}^{\mathrm{GRM}},
\operatorname{Scorepad}_i
\right).
\tag{2.84}
]

[
r_{i,j}^{\mathrm{GRM}}
\in
\left{
r_{\mathrm{win}},
r_{\mathrm{loss}}
\right}.
\tag{2.85}
]

[
L_{\mathrm{output}}
\left(
\tau_{i,j}
\right)

>

\sigma_i\ell_0(x_i)
\Longrightarrow
r_{i,j}^{\mathrm{GRM}}
======================

r_{\mathrm{loss}}.
\tag{2.86}
]

[
\boxed{
r_{\mathrm{win}},
\quad
r_{\mathrm{loss}},
\quad
\sigma_i,
\quad
\text{tournament pairing},
\quad
\text{tie handling}
===================

\mathrm{UNDISCLOSED}}
\tag{2.87}
]

([arXiv][1])

---

[
\textsc{Reasoning-Budget Override}
]

[
T_d
\left(
\tau_{i,j}
\right)
=======

\begin{cases}
\displaystyle
\sum_t
\mathbf1
\left[
y_{i,j,t}
\in
\mathsf{thinking}
\right],
&
d=\mathsf{general},
[4mm]
\displaystyle
\sum_t
\mathbf1
\left[
y_{i,j,t}
\in
\mathsf{reasoning}
\cup
\mathsf{tool\mbox{-}arguments}
\right],
&
d\in
\left{
\mathsf{general\mbox{-}agent},
\mathsf{coding\mbox{-}agent}
\right}.
\end{cases}
\tag{2.88}
]

[
r_{i,j}
=======

\begin{cases}
-1,
&
T_d(\tau_{i,j})

>

\tau_{d,e}b_0(x_i),
\
r_{i,j}^{\mathrm{base}},
&
T_d(\tau_{i,j})
\le
\tau_{d,e}b_0(x_i).
\end{cases}
\tag{2.89}
]

[
\nabla_{\theta}r_{i,j}
======================

0.

\tag{2.90}
]

([arXiv][1])

---

[
\textsc{Group-Relative Advantage}
]

[
\bar r_i
========

\frac1K
\sum_{j=1}^{K}
r_{i,j}.
\tag{2.91}
]

[
A_{i,j}
=======

## r_{i,j}

\bar r_i.
\tag{2.92}
]

[
\sum_{j=1}^{K}
A_{i,j}
=======

0.

\tag{2.93}
]

[
\nabla_{\theta}A_{i,j}
======================

0.

\tag{2.94}
]

[
\boxed{
\text{standard-deviation normalization}
=======================================

\mathrm{NOT\ PRESENT\ IN\ THE\ PUBLISHED\ EQUATION}}
\tag{2.95}
]

([arXiv][2])

---

[
\boxed{\textsc{Learner Batch Construction}}
]

[
\mathcal B_n^{d,e}
==================

\left{
\left(
x_i,
y_{i,j},
\ell_{i,j,1:T_{i,j}}^{\mathrm{beh}},
A_{i,j},
r_{i,j},
\mathcal M_{i,j}^{\mathrm{gen}},
\nu_{i,j,1:T_{i,j}}
\right)
:
i\in\mathcal G_n,;
1\le j\le K
\right}.
\tag{2.96}
]

[
N_n^{\mathrm{tok}}
==================

\sum_{i\in\mathcal G_n}
\sum_{j=1}^{K}
\sum_{t=1}^{T_{i,j}}
\mathcal M_{i,j,t}^{\mathrm{gen}}.
\tag{2.97}
]

[
\mathcal B_n^{d,e}
==================

\biguplus_{r=1}^{R_{\mathrm{DP}}}
\biguplus_{a=1}^{A_n}
\mathcal B_{n,r,a}^{d,e}.
\tag{2.98}
]

[
\boxed{
R_{\mathrm{DP}},
\quad
A_n,
\quad
\text{microbatch token cap},
\quad
\text{length bucketing},
\quad
\text{trajectory packing},
\quad
\text{prompt-group colocation}
==============================

\mathrm{UNDISCLOSED}}
\tag{2.99}
]

---

[
\textsc{Rollout-to-Training Memory Transition}
]

[
\operatorname{FinishRolloutIteration}
\Longrightarrow
\operatorname{Release}
\left(
\operatorname{ExternalKVPool}
\right).
\tag{2.100}
]

[
\operatorname{Restore}
\left(
\theta_n,
\Omega_n
\right)
:
\operatorname{NVMe}
\rightarrow
\operatorname{CPU/GPU}.
\tag{2.101}
]

[
\operatorname{FinishTrainingIteration}
\Longrightarrow
\left(
\theta_{n+1},
\Omega_{n+1}
\right)
:
\operatorname{CPU}
\rightarrow
\operatorname{NVMe}.
\tag{2.102}
]

[
\operatorname{ExternalKVPool}
:
\operatorname{CPU\ DRAM}
\leftarrow
\operatorname{released\ training\ state\ memory}.
\tag{2.103}
]

([arXiv][1])

---

[
\boxed{\textsc{Learner Forward Pass}}
]

[
c_{i,j,t}^{\mathrm{learn}}
==========================

\operatorname{TeacherForceContext}
\left(
x_i,
y_{i,j,<t},
o_{i,j,<t}
\right).
\tag{2.104}
]

[
\mathbf z_{i,j,t}^{\theta_n}
============================

\widetilde M_{\theta_n^{d,e}}
\left(
c_{i,j,t}^{\mathrm{learn}}
\right).
\tag{2.105}
]

[
\mathbf z_{i,j,t}^{\theta_n}
\in
\mathbb R^{|\mathcal V|}.
\tag{2.106}
]

[
p_{i,j,t,v}^{\theta_n}
======================

\frac{
\exp
\left(
z_{i,j,t,v}^{\theta_n}
\right)
}{
\sum_{v'=1}^{|\mathcal V|}
\exp
\left(
z_{i,j,t,v'}^{\theta_n}
\right)
}.
\tag{2.107}
]

[
\ell_{i,j,t}^{\theta_n}
=======================

\log
p_{i,j,t,y_{i,j,t}}^{\theta_n}.
\tag{2.108}
]

[
\nabla_{\theta_n}
\ell_{i,j,t}^{\theta_n}
\neq0.
\tag{2.109}
]

[
\ell_{i,j,t}^{\mathrm{beh}}
===========================

\operatorname{StoredRolloutLogProbability}
\left(
y_{i,j,t}
\right).
\tag{2.110}
]

[
\nabla_{\theta_n}
\ell_{i,j,t}^{\mathrm{beh}}
===========================

0.

\tag{2.111}
]

[
\rho_{i,j,t}
============

\frac{
\pi_{\theta_n}
\left(
y_{i,j,t}\mid c_{i,j,t}^{\mathrm{learn}}
\right)
}{
\pi_{\mathrm{beh}}
\left(
y_{i,j,t}\mid c_{i,j,t}^{\mathrm{rollout}}
\right)
}
=

\exp
\left(
\ell_{i,j,t}^{\theta_n}
-----------------------

\ell_{i,j,t}^{\mathrm{beh}}
\right).
\tag{2.112}
]

[
\Delta_{i,j,t}
==============

# \log\rho_{i,j,t}

## \ell_{i,j,t}^{\theta_n}

\ell_{i,j,t}^{\mathrm{beh}}.
\tag{2.113}
]

[
\left|
\Delta_{i,j,t}
\right|
\uparrow
\Longleftrightarrow
\text{rollout/learner policy drift}\uparrow.
\tag{2.114}
]

[
\operatorname{Age}_{i,j,t}
==========================

n-\nu_{i,j,t}.
\tag{2.115}
]

[
\operatorname{Age}*{i,j,t}\uparrow
\centernot\Longrightarrow
\Delta*{i,j,t}\uparrow
\quad
\text{deterministically}.
\tag{2.116}
]

[
\operatorname{Age}*{i,j,t}\uparrow
\Longrightarrow
P
\left(
|\Delta*{i,j,t}|\text{ large}
\right)
\text{ may increase}.
\tag{2.117}
]

[
\textsf{[DERIVED OFF-POLICY RELATION]}
]

---

[
\boxed{\textsc{III. Objective, Error Signal, Backward Pass, and Optimization}}
]

[
\textsc{Published K2.5 Objective Inherited by K3 RL}
]

[
\boxed{
\mathcal L_{\mathrm{RL}}^{\mathrm{printed}}
\left(
\theta
\right)
=======

\mathbb E_{x\sim\mathcal D}
\left[
\frac1{N_x}
\sum_{j=1}^{K}
\sum_{t=1}^{|y_j|}
\left(
\operatorname{Clip}
\left(
\rho_{j,t},
\alpha,
\beta
\right)
A_j
---

\kappa
\Delta_{j,t}^{,2}
\right)
\right]}
\tag{3.1}
]

[
N_x
===

\sum_{j=1}^{K}
|y_j|.
\tag{3.2}
]

[
A_j
===

## r(x,y_j)

\frac1K
\sum_{q=1}^{K}
r(x,y_q).
\tag{3.3}
]

[
\rho_{j,t}
==========

\frac{
\pi_\theta
\left(
y_{j,t}\mid x,y_{j,<t}
\right)
}{
\pi_{\mathrm{old}}
\left(
y_{j,t}\mid x,y_{j,<t}
\right)
}.
\tag{3.4}
]

[
\Delta_{j,t}
============

\log\rho_{j,t}.
\tag{3.5}
]

[
\alpha>0,
\qquad
\beta>0,
\qquad
\kappa>0.
\tag{3.6}
]

[
\boxed{
\alpha,
\quad
\beta,
\quad
\kappa
======

\mathrm{UNDISCLOSED}}
\tag{3.7}
]

([arXiv][2])

---

[
\boxed{\textsc{Source-Level Clipping Contradiction}}
]

[
\operatorname{EquationClipArgument}
===================================

\rho_{j,t}.
\tag{3.8}
]

[
\operatorname{ProseMaskArgument}
================================

# \Delta_{j,t}

\log\rho_{j,t}.
\tag{3.9}
]

[
\operatorname{EquationRule}
:
\quad
\operatorname{Clip}
\left(
\rho,
\alpha,
\beta
\right).
\tag{3.10}
]

[
\operatorname{ProseRule}
:
\quad
m_{j,t}^{\log}
==============

\mathbf1
\left[
\alpha
\le
\Delta_{j,t}
\le
\beta
\right].
\tag{3.11}
]

[
\operatorname{ProseGradient}
:
\quad
m_{j,t}^{\log}=0
\Longrightarrow
\nabla_{\theta}
\phi_{j,t}
==========

0.

\tag{3.12}
]

[
\boxed{
\operatorname{ImplementedClippingRule}
======================================

\mathrm{UNRESOLVED}}
\tag{3.13}
]

[
\boxed{
\operatorname{Clip}(\rho,\alpha,\beta)
\neq
\mathbf1[\Delta\in[\alpha,\beta]]
\text{ in general}}
\tag{3.14}
]

([arXiv][2])

---

[
\boxed{\textsc{Source-Level Optimization-Sign Contradiction}}
]

[
\phi_{j,t}^{\mathrm{printed}}
=============================

\operatorname{Clip}
\left(
\rho_{j,t},
\alpha,
\beta
\right)
A_j
---

\kappa
\Delta_{j,t}^{,2}.
\tag{3.15}
]

[
\operatorname{RewardTermSign}
=============================

+.
\tag{3.16}
]

[
\operatorname{DriftPenaltySign}
===============================

-.
\tag{3.17}
]

[
\operatorname{ConventionalDirection}
\left(
\phi_{j,t}^{\mathrm{printed}}
\right)
=======

\max_{\theta}.
\tag{3.18}
]

[
\operatorname{PaperDeclaredDirection}
=====================================

\min_{\theta}.
\tag{3.19}
]

[
\boxed{
\operatorname{ActualOptimizationDirection}
==========================================

\mathrm{SOURCE\mbox{-}INCONSISTENT}}
\tag{3.20}
]

[
\boxed{
\operatorname{NoSilentSignRepair}
=================================

1}
\tag{3.21}
]

([arXiv][2])

---

[
\textsc{Token Objective}
]

[
\phi_{i,j,t}
============

\mathcal M_{i,j,t}^{\mathrm{gen}}
\left[
\operatorname{Clip}
\left(
\rho_{i,j,t},
\alpha,
\beta
\right)
A_{i,j}
-------

\kappa
\Delta_{i,j,t}^{,2}
\right].
\tag{3.22}
]

[
\widehat{\mathcal L}_{n}^{d,e}
==============================

\frac1{
N_n^{\mathrm{tok}}
}
\sum_{i\in\mathcal G_n}
\sum_{j=1}^{K}
\sum_{t=1}^{T_{i,j}}
\phi_{i,j,t}.
\tag{3.23}
]

[
\mathcal M_{i,j,t}^{\mathrm{gen}}=0
\Longrightarrow
\nabla_{\theta_n}
\phi_{i,j,t}=0.
\tag{3.24}
]

[
\nabla_{\theta_n}A_{i,j}
========================

0,
\qquad
\nabla_{\theta_n}\ell_{i,j,t}^{\mathrm{beh}}
============================================

0.

\tag{3.25}
]

---

[
\boxed{\textsc{Printed-Equation Error Derivative}}
]

[
c(\rho)
=======

\operatorname{Clip}
\left(
\rho,
\alpha,
\beta
\right)
=======

\begin{cases}
\alpha,
&
\rho<\alpha,
\
\rho,
&
\alpha\le\rho\le\beta,
\
\beta,
&
\rho>\beta.
\end{cases}
\tag{3.26}
]

[
\frac{\partial\rho}{\partial\ell^\theta}
========================================

\rho.
\tag{3.27}
]

[
\frac{\partial\Delta}{\partial\ell^\theta}
==========================================

1.

\tag{3.28}
]

[
\frac{\partial c(\rho)}
{\partial\ell^\theta}
=====================

\rho
\mathbf1
\left[
\alpha<\rho<\beta
\right],
\tag{3.29}
]

[
\text{excluding boundary subgradients}.
]

[
\frac{
\partial
\phi_{i,j,t}^{\mathrm{printed}}
}{
\partial
\ell_{i,j,t}^{\theta}
}
=

\mathcal M_{i,j,t}^{\mathrm{gen}}
\left[
A_{i,j}
\rho_{i,j,t}
\mathbf1
\left[
\alpha<\rho_{i,j,t}<\beta
\right]
-------

2\kappa
\Delta_{i,j,t}
\right].
\tag{3.30}
]

[
\boxed{
\rho\notin(\alpha,\beta)
\Longrightarrow
\frac{\partial\phi^{\mathrm{printed}}}
{\partial\ell^\theta}
=====================

-2\kappa\Delta
\neq0
\quad
\text{when }\Delta\neq0}
\tag{3.31}
]

[
\boxed{
\text{Equation derivative does not zero the complete token gradient outside the clip interval}}
\tag{3.32}
]

[
\textsf{[DERIVED FROM THE PRINTED EQUATION]}
]

---

[
\boxed{\textsc{Prose-Defined Gradient-Mask Candidate}}
]

[
m_{i,j,t}^{\log}
================

\mathbf1
\left[
\alpha
\le
\Delta_{i,j,t}
\le
\beta
\right].
\tag{3.33}
]

[
\phi_{i,j,t}^{\mathrm{unmasked}}
================================

## \rho_{i,j,t}A_{i,j}

\kappa
\Delta_{i,j,t}^{,2}.
\tag{3.34}
]

[
\frac{
\partial
\phi_{i,j,t}^{\mathrm{unmasked}}
}{
\partial
\ell_{i,j,t}^{\theta}
}
=

## A_{i,j}\rho_{i,j,t}

2\kappa\Delta_{i,j,t}.
\tag{3.35}
]

[
\frac{
\partial
\phi_{i,j,t}^{\mathrm{prose}}
}{
\partial
\ell_{i,j,t}^{\theta}
}
=

m_{i,j,t}^{\log}
\left[
A_{i,j}\rho_{i,j,t}
-------------------

2\kappa\Delta_{i,j,t}
\right].
\tag{3.36}
]

[
m_{i,j,t}^{\log}=0
\Longrightarrow
\frac{
\partial
\phi_{i,j,t}^{\mathrm{prose}}
}{
\partial
\ell_{i,j,t}^{\theta}
}
=

0.

\tag{3.37}
]

[
\boxed{
\text{whether the mask applies to the advantage term only or the complete token term}
=====================================================================================

\mathrm{UNDISCLOSED}}
\tag{3.38}
]

[
\boxed{
\text{boundary-subgradient convention}
======================================

\mathrm{UNDISCLOSED}}
\tag{3.39}
]

---

[
\boxed{\textsc{Logit-Level Error Signal}}
]

[
\ell_{i,j,t}^{\theta}
=====================

## z_{i,j,t,y_{i,j,t}}^{\theta}

\log
\sum_{v\in\mathcal V}
\exp
\left(
z_{i,j,t,v}^{\theta}
\right).
\tag{3.40}
]

[
\frac{
\partial
\ell_{i,j,t}^{\theta}
}{
\partial
z_{i,j,t,v}^{\theta}
}
=

\mathbf1
\left[
v=y_{i,j,t}
\right]
-------

p_{i,j,t,v}^{\theta}.
\tag{3.41}
]

[
\chi_{i,j,t}
============

\frac{
\partial
\phi_{i,j,t}
}{
\partial
\ell_{i,j,t}^{\theta}
}.
\tag{3.42}
]

[
\frac{
\partial
\phi_{i,j,t}
}{
\partial
z_{i,j,t,v}^{\theta}
}
=

\chi_{i,j,t}
\left[
\mathbf1
\left[
v=y_{i,j,t}
\right]
-------

p_{i,j,t,v}^{\theta}
\right].
\tag{3.43}
]

[
\mathbf e_{i,j,t}^{\mathrm{logit}}
==================================

\chi_{i,j,t}
\left[
\operatorname{OneHot}
\left(
y_{i,j,t}
\right)
-------

\mathbf p_{i,j,t}^{\theta}
\right]
\in
\mathbb R^{|\mathcal V|}.
\tag{3.44}
]

[
\sum_{v\in\mathcal V}
e_{i,j,t,v}^{\mathrm{logit}}
============================

0.

\tag{3.45}
]

[
\chi_{i,j,t}=0
\Longrightarrow
\mathbf e_{i,j,t}^{\mathrm{logit}}
==================================

\mathbf0.
\tag{3.46}
]

[
\chi_{i,j,t}>0
\Longrightarrow
\text{raw ascent direction increases }
\ell_{i,j,t}^{\theta}.
\tag{3.47}
]

[
\chi_{i,j,t}<0
\Longrightarrow
\text{raw ascent direction decreases }
\ell_{i,j,t}^{\theta}.
\tag{3.48}
]

---

[
\boxed{\textsc{Parameter-Level Backward Pass}}
]

[
J_{i,j,t}^{\theta}
==================

\frac{
\partial
\mathbf z_{i,j,t}^{\theta}
}{
\partial
\theta
}.
\tag{3.49}
]

[
g_{i,j,t}^{\theta}
==================

\left(
J_{i,j,t}^{\theta}
\right)^{\top}
\mathbf e_{i,j,t}^{\mathrm{logit}}.
\tag{3.50}
]

[
g_{n,r,a}^{d,e}
===============

\frac1{
N_{n,r,a}^{\mathrm{tok}}
}
\sum_{
(i,j,t)
\in
\mathcal B_{n,r,a}^{d,e}
}
g_{i,j,t}^{\theta}.
\tag{3.51}
]

[
g_{n,r}^{d,e}
=============

\sum_{a=1}^{A_n}
w_{n,r,a}
g_{n,r,a}^{d,e}.
\tag{3.52}
]

[
\boxed{
w_{n,r,a},
\quad
\text{microbatch normalization}
===============================

\mathrm{UNDISCLOSED}}
\tag{3.53}
]

[
g_n^{d,e}
=========

\operatorname{DistributedReduceScatter}
\left(
\left{
g_{n,r}^{d,e}
\right}*{r=1}^{R*{\mathrm{DP}}}
\right).
\tag{3.54}
]

[
g_n^{d,e}
=========

J_Q
\left(
\theta_n^{d,e}
\right)^\top
\nabla_{\widetilde\theta_n^{d,e}}
\widehat{\mathcal L}_n^{d,e}.
\tag{3.55}
]

[
\boxed{
J_Q,
\quad
\text{QAT backward estimator},
\quad
\text{gradient dtype},
\quad
\text{loss scaling}
===================

\mathrm{UNDISCLOSED}}
\tag{3.56}
]

---

[
\textsc{ZeRO/VPP Gradient State}
]

[
\operatorname{GradientOwner}
\left(
g_n^{d,e}
\right)
=======

\mathsf{ZeRO\mbox{-}2\ shard}.
\tag{3.57}
]

[
\operatorname{ResidentGradientBuffersPerGPU}
============================================

2
\quad
\text{VPP chunks}.
\tag{3.58}
]

[
\operatorname{ReferenceForwardSlot}_0
=====================================

\text{current non-policy-model chunk},
\tag{3.59}
]

[
\operatorname{ReferenceForwardSlot}_1
=====================================

\text{prefetched next chunk}.
\tag{3.60}
]

[
\operatorname{ReferenceWeights}
:
\operatorname{CPU}
\rightarrow
\operatorname{PolicyFP32GradientBuffer}.
\tag{3.61}
]

[
\operatorname{PolicyBackward}
\Longrightarrow
\operatorname{Overwrite}
\left(
\operatorname{TemporaryReferenceWeights}
\right)
\text{ with true gradients}.
\tag{3.62}
]

[
\boxed{
\text{exact non-policy model used in ordinary expert RL loss}
=============================================================

\mathrm{UNDISCLOSED}}
\tag{3.63}
]

([arXiv][1])

---

[
\boxed{\textsc{Gradient Post-Processing}}
]

[
\widehat g_n^{d,e}
==================

\operatorname{GradientTransform}
\left(
g_n^{d,e}
\right).
\tag{3.64}
]

[
\boxed{
\begin{aligned}
&
\text{global gradient-norm clipping},
\
&
\text{per-parameter clipping},
\
&
\text{NaN/Inf rejection},
\
&
\text{expert-gradient normalization},
\
&
\text{vision-gradient scaling},
\
&
\text{gradient accumulation count}
\end{aligned}
=============

\mathrm{UNDISCLOSED}}
\tag{3.65}
]

---

[
\boxed{\textsc{MuonClip Parameter Update}}
]

[
\left(
\theta_{n+1}^{d,e},
\Omega_{n+1}^{d,e}
\right)
=======

\operatorname{MuonClip}
\left(
\theta_n^{d,e},
\Omega_n^{d,e},
\widehat g_n^{d,e};
\eta_n,
\Lambda_n,
\operatorname{Dir}_{\mathrm{RL}}
\right).
\tag{3.66}
]

[
\operatorname{Optimizer}_{\mathrm{RL}}
======================================

\mathsf{MuonClip}
\qquad
\textsf{[INHERITED FROM THE SPECIFIED K2.5 POLICY ALGORITHM]}.
\tag{3.67}
]

[
\boxed{
\eta_n,
\quad
\Lambda_n,
\quad
\text{momentum coefficients},
\quad
\text{weight decay},
\quad
\text{QK-clip threshold},
\quad
\operatorname{Dir}_{\mathrm{RL}}
================================

\mathrm{UNDISCLOSED/UNRESOLVED}}
\tag{3.68}
]

[
\operatorname{Dir}_{\mathrm{RL}}
================================

\begin{cases}
-1,
&
\text{gradient descent},
\
+1,
&
\text{gradient ascent}.
\end{cases}
\tag{3.69}
]

[
\boxed{
\operatorname{Dir}_{\mathrm{RL}}
\text{ cannot be resolved consistently from the published sign and prose}}
\tag{3.70}
]

([arXiv][2])

---

[
\textsc{Behavior-Policy Refresh}
]

[
\pi_{\mathrm{beh},n+1}^{d,e}
============================

\operatorname{Snapshot}
\left(
\pi_{\theta_{n+1}^{d,e}}
\right).
\tag{3.71}
]

[
\nabla
\pi_{\mathrm{beh},n+1}^{d,e}
============================

0.

\tag{3.72}
]

[
\boxed{
\text{refresh frequency},
\quad
\text{weight-synchronization granularity},
\quad
\text{rollout-worker refresh barrier}
=====================================

\mathrm{UNDISCLOSED}}
\tag{3.73}
]

[
\textsc{End For}
]

---

[
\boxed{\textsc{Distribution-Level RL Objective}}
]

[
d
\sim
\operatorname{Categorical}
\left(
\omega
\right).
\tag{3.74}
]

[
e
\in
\left{
\mathsf{low},
\mathsf{high},
\mathsf{max}
\right}
\quad
\text{fixed for one expert-training process}.
\tag{3.75}
]

[
x
\sim
P_d.
\tag{3.76}
]

[
y_{1:K}
\sim
\prod_{j=1}^{K}
\pi_{\mathrm{beh}}
\left(
y_j\mid
x,\mathcal E_x,h_x,e
\right).
\tag{3.77}
]

[
r_j
===

R_{d,e}
\left(
x,
y_j,
\mathcal E_x
\right).
\tag{3.78}
]

[
A_j
===

## r_j

\frac1K
\sum_{q=1}^{K}
r_q.
\tag{3.79}
]

[
\rho_{j,t}
==========

\frac{
\pi_\theta
\left(
y_{j,t}\mid
x,y_{j,<t},o_{j,<t},e
\right)
}{
\pi_{\mathrm{beh}}
\left(
y_{j,t}\mid
x,y_{j,<t},o_{j,<t},e
\right)
}.
\tag{3.80}
]

[
\Delta_{j,t}
============

\log\rho_{j,t}.
\tag{3.81}
]

[
\boxed{
\mathcal J_{\mathrm{RL}}^{d,e}
==============================

\mathbb E_{
\substack{
x\sim P_d\
y_{1:K}\sim\pi_{\mathrm{beh}}\
\mathcal E_x\sim P_{\mathcal E|d}
}
}
\left[
\frac1{\sum_{j}|y_j|}
\sum_{j=1}^{K}
\sum_{t=1}^{|y_j|}
\left(
\operatorname{Clip}
\left(
\rho_{j,t},
\alpha,
\beta
\right)
A_j
---

\kappa
\Delta_{j,t}^{,2}
\right)
\right]}
\tag{3.82}
]

[
\textsf{[PUBLISHED FORM, WITH PRESERVED SOURCE CONTRADICTIONS]}
]

---

[
\boxed{\textsc{Explicitly Absent from the Published Estimator}}
]

[
V_{\psi}
========

\mathrm{NOT\ REPORTED}.
\tag{3.83}
]

[
\mathcal L_{\mathrm{value}}
===========================

\mathrm{NOT\ REPORTED}.
\tag{3.84}
]

[
\operatorname{GAE}
\left(
\gamma,\lambda_{\mathrm{GAE}}
\right)
=======

\mathrm{NOT\ REPORTED}.
\tag{3.85}
]

[
D_{\mathrm{KL}}
\left(
\pi_\theta
\Vert
\pi_{\mathrm{ref}}
\right)
=======

\mathrm{NOT\ PRESENT\ IN\ THE\ PUBLISHED\ EQUATION}.
\tag{3.86}
]

[
\mathcal H
\left(
\pi_\theta
\right)
=======

\mathrm{NOT\ PRESENT\ IN\ THE\ PUBLISHED\ EQUATION}.
\tag{3.87}
]

[
\pi_{\mathrm{ref}}
==================

\mathrm{NOT\ REQUIRED\ BY\ THE\ PUBLISHED\ EQUATION}.
\tag{3.88}
]

[
\operatorname{PPOAdvantageSignClip}
===================================

\mathrm{EXPLICITLY\ DISTINGUISHED\ FROM\ THE\ REPORTED\ METHOD}.
\tag{3.89}
]

[
\boxed{
\mathcal J_{\mathrm{RL}}^{d,e}
\neq
\mathcal J_{\mathrm{PPO}}
\quad
\text{by algorithm-name substitution}}
\tag{3.90}
]

([arXiv][2])

---

[
\boxed{\textsc{Final RL State Transition}}
]

[
\begin{aligned}
&
\left(
\theta_{\mathrm{SFT}},
\Omega_0,
\mathcal D_{\mathrm{RL}},
\mathcal Q_0=\varnothing
\right)
\
&\xrightarrow[
\substack{
\text{KG-guided task synthesis}\
\text{dynamic harness composition}\
\text{persistent agent environments}\
\text{reasoning-effort assignment}
}
]{
\operatorname{Preprocess}*{\mathrm{RL}}
}
\left(
\theta*{\mathrm{SFT}},
\Omega_0,
{P_d}*{d\in\mathbb D},
{\mathcal E_d}*{d\in\mathbb D}
\right)
\
&\xrightarrow[
\substack{
K\text{ responses per prompt}\
y_t\sim\pi_{\mathrm{beh}}\
\text{stored behavior log probabilities}\
\text{partial rollouts}\
\text{external MLA KV + KDA-state retention}\
\text{resumable sandbox state}
}
]{
\operatorname{Rollout}
}
\left{
\tau_{i,1:K}
\right}
\
&\xrightarrow[
\substack{
r_{\mathrm{verifier/GRM}}\
r=-1\text{ on effort-budget violation}\
A_j=r_j-\bar r
}
]{
\operatorname{Reward}
}
\left{
\tau_{i,1:K},
r_{i,1:K},
A_{i,1:K}
\right}
\
&\xrightarrow[
\substack{
\ell^\theta=\log\pi_\theta(y_t|s_t)\
\ell^{\mathrm{beh}}\text{ stored}\
\rho=\exp(\ell^\theta-\ell^{\mathrm{beh}})\
\Delta=\log\rho\
\text{token-level drift control}\
\text{QAT-matched learner forward}\
\text{distributed backward}\
\text{MuonClip update}
}
]{
\mathcal J_{\mathrm{RL}}^{d,e}
}
\boxed{
\left{
\theta_{\mathrm{RL}}^{d,e}
\right}_{(d,e)\in\mathbb D\times\mathbb E}
}.
\end{aligned}
\tag{3.91}
]

[
\boxed{
\left|
\left{
\theta_{\mathrm{RL}}^{d,e}
\right}
\right|
=======

9}
\tag{3.92}
]

[
\boxed{
\begin{array}{c|c}
\textsc{RL Mechanism}
&
\textsc{Evidence State}
\
\hline
3\text{ domains}\times3\text{ effort levels}
&
\textsf{[REPORTED]}
\
\text{dynamic white-box harness composition}
&
\textsf{[REPORTED]}
\
\text{knowledge-graph task synthesis}
&
\textsf{[REPORTED]}
\
K\text{ rollouts per prompt}
&
\textsf{[REPORTED]}
\
\lambda NK\text{ partial-rollout barrier}
&
\textsf{[REPORTED]}
\
\text{paused-rollout priority queue}
&
\textsf{[REPORTED]}
\
\text{persistent external KV/KDA state}
&
\textsf{[REPORTED]}
\
\text{resumable microVM state}
&
\textsf{[REPORTED]}
\
\text{behavior log-probability recording}
&
\textsf{[INHERITED/REPORTED]}
\
\text{group-mean reward advantage}
&
\textsf{[EQUATION-VERIFIED]}
\
\text{squared log-ratio regularization}
&
\textsf{[EQUATION-VERIFIED]}
\
\text{ratio-vs-log-ratio clipping semantics}
&
\textsf{[UNRESOLVED]}
\
\text{objective optimization sign}
&
\textsf{[SOURCE-INCONSISTENT]}
\
\text{QAT-matched rollout and learner}
&
\textsf{[REPORTED]}
\
\text{MuonClip optimizer}
&
\textsf{[INHERITED]}
\
\text{RL learning rate}
&
\textsf{[UNDISCLOSED]}
\
\text{batch size}
&
\textsf{[UNDISCLOSED]}
\
\text{rollout count }K
&
\textsf{[UNDISCLOSED]}
\
\text{partial fraction }\lambda
&
\textsf{[UNDISCLOSED]}
\
\text{clipping parameters}
&
\textsf{[UNDISCLOSED]}
\
\text{gradient-clipping rule}
&
\textsf{[UNDISCLOSED]}
\
\text{policy-refresh frequency}
&
\textsf{[UNDISCLOSED]}
\end{array}}
\tag{3.93}
]

[1]: https://arxiv.org/pdf/2607.24653 "Kimi K3: Open Frontier Intelligence"
[2]: https://arxiv.org/pdf/2602.02276 "Kimi K2.5: Visual Agentic Intelligence"


[
\boxed{
\begin{array}{c}
\textsc{Algorithm 4}[1mm]
\textsc{Kimi-K3 Multi-Teacher On-Policy Distillation}[1mm]
M_{\theta}\equiv\text{opaque trainable student policy}\
\Pi_{\Phi}\equiv{\pi_{\phi_{d,e}}^{T}}_{(d,e)\in\mathbb D\times\mathbb E}
\end{array}}
]

[
\mathbb D
=========

\left{
\mathsf{general},
\mathsf{general\mbox{-}agent},
\mathsf{coding\mbox{-}agent}
\right},
\qquad
\mathbb E
=========

\left{
\mathsf{low},
\mathsf{high},
\mathsf{max}
\right},
\tag{0.1}
]

[
|\Pi_{\Phi}|
============

# |\mathbb D\times\mathbb E|

# 3\times3

9.

\tag{0.2}
]

[
\boxed{
\left{
\theta_{\mathrm{RL}}^{d,e}
\right}*{(d,e)\in\mathbb D\times\mathbb E}
\xrightarrow[
y\sim\pi*{\theta}
]{
\mathcal J_{\mathrm{MOPD}}
}
\theta_{\mathrm{K3}}}
\tag{0.3}
]

[
\mathfrak S_n^{\mathrm D}
=========================

\left(
\theta_n,
\widetilde\theta_n,
\Omega_n,
\pi_{\mathrm{beh},n},
\Pi_{\Phi},
\mathcal Q_n,
\mathcal E_n,
\mathcal B_n,
\mathfrak Q_n
\right),
\tag{0.4}
]

[
\mathfrak S_n^{\mathrm D}
\xrightarrow{\mathcal J_{\mathrm{MOPD},n}}
\mathfrak S_{n+1}^{\mathrm D}.
\tag{0.5}
]

 ([arXiv][1])

---

[
\boxed{\textsc{I. Distillation Pre-Processing}}
]

[
\textsc{Teacher-Bank Construction}
]

[
\forall(d,e)\in\mathbb D\times\mathbb E:
\qquad
\phi_{d,e}
\leftarrow
\theta_{\mathrm{RL}}^{d,e}.
\tag{1.1}
]

[
\Pi_{\Phi}
==========

\left{
\pi_{\phi_{\mathsf{general},\mathsf{low}}}^{T},
\pi_{\phi_{\mathsf{general},\mathsf{high}}}^{T},
\pi_{\phi_{\mathsf{general},\mathsf{max}}}^{T},
\ldots,
\pi_{\phi_{\mathsf{coding\mbox{-}agent},\mathsf{max}}}^{T}
\right}.
\tag{1.2}
]

[
\operatorname{TeacherIndex}
:
(d,e)
\longmapsto
\phi_{d,e}.
\tag{1.3}
]

[
\nabla_{\phi_{d,e}}
\operatorname{sg}
\left[
\log
\pi_{\phi_{d,e}}^{T}
\right]
=======

0.

\tag{1.4}
]

[
\boxed{
\operatorname{OptimizerState}
\left(
\phi_{d,e}
\right)
=======

\varnothing
\quad
\textsf{[DISTILLATION-TEACHER PARTITION]}}
\tag{1.5}
]

[
\boxed{
\text{teacher checkpoint precision},
\quad
\text{teacher sharding},
\quad
\text{teacher residency},
\quad
\text{teacher offloading},
\quad
\text{teacher-loading schedule}
===============================

\mathrm{UNDISCLOSED}}
\tag{1.6}
]

([arXiv][1])

---

[
\textsc{Student Initialization}
]

[
\theta_0
========

\operatorname{InitStudent}
\left(
\theta_{\mathrm{SFT}},
\left{
\theta_{\mathrm{RL}}^{d,e}
\right}_{d,e}
\right).
\tag{1.7}
]

[
\boxed{
\operatorname{InitStudent}
==========================

\mathrm{UNDISCLOSED}}
\tag{1.8}
]

[
\boxed{
\theta_0
\stackrel{?}{=}
\theta_{\mathrm{SFT}}
=====================

\mathrm{NOT\ ESTABLISHED}}
\tag{1.9}
]

[
\boxed{
\theta_0
\stackrel{?}{=}
\theta_{\mathrm{RL}}^{d^\star,e^\star}
======================================

\mathrm{NOT\ ESTABLISHED}}
\tag{1.10}
]

[
\boxed{
\theta_0
\stackrel{?}{=}
\operatorname{Merge}
\left(
{\theta_{\mathrm{RL}}^{d,e}}_{d,e}
\right)
=======

\mathrm{NOT\ ESTABLISHED}}
\tag{1.11}
]

[
\Omega_0
========

\operatorname{InitOptimizerState}
\left(
\theta_0
\right).
\tag{1.12}
]

[
\boxed{
\operatorname{InitOptimizerState},
\quad
\text{optimizer-state inheritance}
==================================

\mathrm{UNDISCLOSED}}
\tag{1.13}
]

---

[
\textsc{Prompt Distribution}
]

[
\mathcal D_{\mathrm D}
======================

\mathcal D_{\mathsf{general}}
\sqcup
\mathcal D_{\mathsf{general\mbox{-}agent}}
\sqcup
\mathcal D_{\mathsf{coding\mbox{-}agent}}.
\tag{1.14}
]

[
d_i
\sim
P_{\mathrm D}(d),
\qquad
e_i
\sim
P_{\mathrm E}(e\mid d_i).
\tag{1.15}
]

[
x_i
\sim
P_{\mathrm X}
\left(
x\mid d_i,e_i
\right).
\tag{1.16}
]

[
P_{\mathrm{MOPD}}
\left(
d,e,x
\right)
=======

P_{\mathrm D}(d)
P_{\mathrm E}(e\mid d)
P_{\mathrm X}(x\mid d,e).
\tag{1.17}
]

[
\boxed{
P_{\mathrm D},
\quad
P_{\mathrm E},
\quad
P_{\mathrm X},
\quad
\text{domain mixture weights},
\quad
\text{effort mixture weights}
=============================

\mathrm{UNDISCLOSED}}
\tag{1.18}
]

[
\operatorname{Teacher}(x_i,d_i,e_i)
===================================

\pi_{\phi_{d_i,e_i}}^{T}.
\tag{1.19}
]

[
\boxed{
\text{one teacher per }(d,e)\text{ sample}}
\tag{1.20}
]

([arXiv][1])

---

[
\textsc{Distillation Input Schema}
]

[
u_i^{\mathrm D}
===============

\left(
d_i,
e_i,
q_i,
\mathcal H_i,
\mathcal I_i,
\mathcal V_i,
\mathcal T_i,
\mathcal E_i,
\mathcal C_i
\right).
\tag{1.21}
]

[
\begin{aligned}
q_i
&=\text{query/instruction},
\
\mathcal H_i
&=\text{preserved interaction history},
\
\mathcal I_i,\mathcal V_i
&=\text{optional image/video inputs},
\
\mathcal T_i
&=\text{available tool schemas},
\
\mathcal E_i
&=\text{execution environment},
\
\mathcal C_i
&=\text{context and resource constraints}.
\end{aligned}
\tag{1.22}
]

[
s_i^{(0)}
=========

\operatorname{XTMLSerialize}
\left(
u_i^{\mathrm D}
\right).
\tag{1.23}
]

[
\mathbf X_i^{(0)}
=================

\operatorname{Tokenize}
\left(
s_i^{(0)}
\right).
\tag{1.24}
]

[
\boxed{
\operatorname{XTMLSerialize}_{\mathrm{MOPD}},
\quad
\text{input masking},
\quad
\text{tool-observation masking},
\quad
\text{media-token layout}
=========================

\mathrm{UNDISCLOSED}}
\tag{1.25}
]

---

[
\textsc{Logical Teacher Partition}
]

[
\mathcal U_n
============

\left{
u_{n,i}^{\mathrm D}
\right}_{i=1}^{N_n}.
\tag{1.26}
]

[
\mathcal U_n^{d,e}
==================

\left{
u_{n,i}^{\mathrm D}
:
d_i=d,;
e_i=e
\right}.
\tag{1.27}
]

[
\mathcal U_n
============

\biguplus_{(d,e)\in\mathbb D\times\mathbb E}
\mathcal U_n^{d,e}.
\tag{1.28}
]

[
\boxed{
\text{logical teacher partition}
\neq
\text{proof of physical teacher-homogeneous batching}}
\tag{1.29}
]

[
\boxed{
\text{physical teacher batching}
================================

\mathrm{UNDISCLOSED}}
\tag{1.30}
]

---

[
\textsc{QAT State}
]

[
\theta_n
========

\theta_n^{\mathrm{expert}}
\sqcup
\theta_n^{\mathrm{nonexpert}}.
\tag{1.31}
]

[
\widetilde\theta_n^{\mathrm{expert}}
====================================

Q_{\mathrm{MXFP4}}
\left(
\theta_n^{\mathrm{expert}}
\right).
\tag{1.32}
]

[
\widetilde a_n^{\mathrm{expert}}
================================

Q_{\mathrm{MXFP8}}
\left(
a_n^{\mathrm{expert}}
\right).
\tag{1.33}
]

[
\widetilde\theta_n^{\mathrm{nonexpert}}
=======================================

\theta_n^{\mathrm{nonexpert}}
\quad
\text{in higher precision}.
\tag{1.34}
]

[
\widetilde M_{\theta_n}
=======================

M_{
\widetilde\theta_n^{\mathrm{expert}}
\sqcup
\widetilde\theta_n^{\mathrm{nonexpert}}
}.
\tag{1.35}
]

[
Q_{\mathrm{rollout}}
====================

Q_{\mathrm{learner}}.
\tag{1.36}
]

[
\boxed{
Q_{\mathrm{teacher}}
====================

\mathrm{UNDISCLOSED}}
\tag{1.37}
]

[
\boxed{
\mathcal L_{\mathrm{quant}}^{\mathrm{additive}}
===============================================

\mathrm{NOT\ REPORTED}}
\tag{1.38}
]



---

[
\boxed{\textsc{II. On-Policy Distillation Training Loop}}
]

[
\textsc{For }
n=0,\ldots,N_{\mathrm{MOPD}}-1
]

[
\textsc{Sample Prompt Batch}
]

[
\mathcal X_n
============

\left{
(d_i,e_i,x_i)
\right}*{i=1}^{N_n}
\sim
P*{\mathrm{MOPD}}^{\otimes N_n}.
\tag{2.1}
]

[
\boxed{
N_n,
\quad
N_{\mathrm{MOPD}},
\quad
\text{sampling replacement rule}
================================

\mathrm{UNDISCLOSED}}
\tag{2.2}
]

---

[
\textsc{Behavior-Policy Snapshot}
]

[
\theta_n^{\mathrm{beh}}
=======================

\operatorname{Snapshot}
\left(
\theta_n
\right).
\tag{2.3}
]

[
\pi_{\mathrm{beh},n}
====================

\operatorname{sg}
\left[
\pi_{\widetilde\theta_n^{\mathrm{beh}}}
\right].
\tag{2.4}
]

[
\nabla_{\theta_n}
\pi_{\mathrm{beh},n}
====================

0.

\tag{2.5}
]

[
\textsc{Ideal On-Policy State}
]

[
\theta_n^{\mathrm{beh}}
=======================

# \theta_n^{\mathrm{score}}

\theta_n^{\mathrm{learn}}.
\tag{2.6}
]

[
\textsc{Partial-Rollout State}
]

[
\theta_{i,j,t}^{\mathrm{beh}}
\neq
\theta_n^{\mathrm{learn}}
\quad
\text{may occur}.
\tag{2.7}
]

[
\boxed{
\theta^{\mathrm{beh}}
\leftrightarrow
\theta^{\mathrm{score}}
\leftrightarrow
\theta^{\mathrm{learn}}
\text{ versioning policy}
=========================

\mathrm{UNDISCLOSED}}
\tag{2.8}
]

---

[
\textsc{Student On-Policy Rollout}
]

[
\forall i\in{1,\ldots,N_n},
\quad
\forall j\in{1,\ldots,K_n}:
]

[
y_{i,j,0}
=========

\varnothing.
\tag{2.9}
]

[
s_{i,j,t}
=========

\left(
e_i,
x_i,
y_{i,j,<t},
o_{i,j,<t}
\right).
\tag{2.10}
]

[
\mathbf z_{i,j,t}^{\mathrm{beh}}
================================

\widetilde M_{\theta_{i,j,t}^{\mathrm{beh}}}
\left(
s_{i,j,t}
\right)
\in
\mathbb R^{|\mathcal V|}.
\tag{2.11}
]

[
\mathbf p_{i,j,t}^{\mathrm{beh}}
================================

\operatorname{SampleTransform}
\left(
\mathbf z_{i,j,t}^{\mathrm{beh}};
\xi_{i,j,t}
\right).
\tag{2.12}
]

[
y_{i,j,t}
\sim
\operatorname{Categorical}
\left(
\mathbf p_{i,j,t}^{\mathrm{beh}}
\right).
\tag{2.13}
]

[
\ell_{i,j,t}^{\mathrm{beh}}
===========================

\log
\pi_{\mathrm{beh},n}
\left(
y_{i,j,t}
\mid
e_i,x_i,y_{i,j,<t}
\right).
\tag{2.14}
]

[
\nabla_{\theta_n}
\ell_{i,j,t}^{\mathrm{beh}}
===========================

0.

\tag{2.15}
]

[
\operatorname{Store}
\left(
y_{i,j,t},
\ell_{i,j,t}^{\mathrm{beh}},
\operatorname{Version}_{i,j,t}
\right).
\tag{2.16}
]

[
\boxed{
K_n,
\quad
\xi_{i,j,t},
\quad
\text{temperature},
\quad
\text{top-}p,
\quad
\text{top-}k
============

\mathrm{UNDISCLOSED}}
\tag{2.17}
]

---

[
\textsc{Environment Transition}
]

[
\operatorname{Parse}
\left(
y_{i,j,1:t}
\right)
=======

a_{i,j,t}^{\mathrm{tool}}
\Longrightarrow
\left(
s_{i,j,t+1}^{\mathrm{env}},
o_{i,j,t+1},
\delta_{i,j,t+1}
\right)
=======

\operatorname{Step}*{\mathcal E_i}
\left(
s*{i,j,t}^{\mathrm{env}},
a_{i,j,t}^{\mathrm{tool}}
\right).
\tag{2.18}
]

[
s_{i,j,t+1}
===========

\left(
e_i,
x_i,
y_{i,j,\le t},
o_{i,j,\le t}
\right).
\tag{2.19}
]

[
\delta_{i,j,t+1}=1
\Longrightarrow
T_{i,j}=t.
\tag{2.20}
]

[
m_{i,j,t}^{\mathrm{gen}}
========================

\mathbf1
\left[
y_{i,j,t}
\text{ generated by student}
\right].
\tag{2.21}
]

[
m_{i,j,t}^{\mathrm{obs}}
========================

\mathbf1
\left[
o_{i,j,t}
\text{ generated by environment}
\right].
\tag{2.22}
]

[
m_{i,j,t}^{\mathrm{gen}}
m_{i,j,t}^{\mathrm{obs}}
========================

0.

\tag{2.23}
]

[
r_{i,j,t}^{\mathrm{OPD}}
\text{ is defined only for }
m_{i,j,t}^{\mathrm{gen}}=1.
\tag{2.24}
]

---

[
\textsc{Partial-Rollout Barrier}
]

[
\mathcal W_n^{(0)}
==================

\operatorname{Resume}
\left(
\mathcal Q_n
\right)
\cup
\left{
(i,j):
1\le i\le N_n,;
1\le j\le K_n
\right}.
\tag{2.25}
]

[
s_n^\star
=========

\inf
\left{
s:
\left|
\mathcal C_n(s)
\right|
\ge
\left\lceil
\lambda_nN_nK_n
\right\rceil
\right}.
\tag{2.26}
]

[
\mathcal Q_{n+1}
================

\operatorname{PriorityQueue}
\left(
\mathcal W_n^{(0)}
\setminus
\mathcal C_n(s_n^\star)
\right).
\tag{2.27}
]

[
\boxed{
\lambda_n,
\quad
\text{priority function},
\quad
\text{maximum trajectory staleness}
===================================

\mathrm{UNDISCLOSED}}
\tag{2.28}
]

[
\mathcal G_n
============

\left{
i:
\bigwedge_{j=1}^{K_n}
\nu_{i,j}
=========

\mathsf{complete}
\right}.
\tag{2.29}
]

[
i\notin\mathcal G_n
\Longrightarrow
\operatorname{NoLearnerDispatch}
\left(
i
\right).
\tag{2.30}
]

[
i\in\mathcal G_n
\Longrightarrow
\operatorname{Dispatch}
\left(
\tau_{i,1:K_n}
\right).
\tag{2.31}
]

([arXiv][1])

---

[
\boxed{\textsc{Teacher Forward}}
]

[
\forall
(i,j,t)
\text{ with }
i\in\mathcal G_n
\land
m_{i,j,t}^{\mathrm{gen}}=1:
]

[
\mathbf z_{i,j,t}^{T}
=====================

\pi_{\phi_{d_i,e_i}}^{T}
\left(
\cdot
\mid
x_i,
y_{i,j,<t}
\right)
\quad
\text{before normalization}.
\tag{2.32}
]

[
\mathbf p_{i,j,t}^{T}
=====================

\operatorname{Softmax}
\left(
\mathbf z_{i,j,t}^{T}
\right).
\tag{2.33}
]

[
\ell_{i,j,t}^{T}
================

\log
p_{i,j,t,y_{i,j,t}}^{T}.
\tag{2.34}
]

[
\nabla_{\theta_n}
\ell_{i,j,t}^{T}
================

0.

\tag{2.35}
]

[
\nabla_{\phi_{d_i,e_i}}
\operatorname{sg}
\left(
\ell_{i,j,t}^{T}
\right)
=======

0.

\tag{2.36}
]

[
\operatorname{TeacherCondition}
===============================

\left(
x_i,
y_{i,j,<t}
\right).
\tag{2.37}
]

[
\operatorname{TeacherIdentity}
==============================

(d_i,e_i).
\tag{2.38}
]

[
e_i
\notin
\operatorname{ExplicitCondition}
\left(
\pi_{\phi_{d_i,e_i}}^{T}
\right)
\quad
\text{because }
e_i
\text{ selects the teacher}.
\tag{2.39}
]

[
\boxed{
\text{whether full-vocabulary teacher logits are retained}
==========================================================

\mathrm{UNDISCLOSED}}
\tag{2.40}
]

[
\boxed{
\text{minimum statistic required by Eq.,(15)}
=============================================

\ell_{i,j,t}^{T}}
\tag{2.41}
]

---

[
\boxed{\textsc{Student Reward-Scoring Forward}}
]

[
\mathbf z_{i,j,t}^{S,\mathrm{score}}
====================================

\widetilde M_{\theta_n^{\mathrm{score}}}
\left(
e_i,
x_i,
y_{i,j,<t}
\right).
\tag{2.42}
]

[
\mathbf p_{i,j,t}^{S,\mathrm{score}}
====================================

\operatorname{Softmax}
\left(
\mathbf z_{i,j,t}^{S,\mathrm{score}}
\right).
\tag{2.43}
]

[
\ell_{i,j,t}^{S,\mathrm{score}}
===============================

\log
p_{i,j,t,y_{i,j,t}}^{S,\mathrm{score}}.
\tag{2.44}
]

[
\Delta_{i,j,t}^{T/S}
====================

## \ell_{i,j,t}^{T}

\ell_{i,j,t}^{S,\mathrm{score}}.
\tag{2.45}
]

[
\Delta_{i,j,t}^{T/S}
====================

\log
\frac{
\pi_{\phi_{d_i,e_i}}^{T}
\left(
y_{i,j,t}
\mid
x_i,y_{i,j,<t}
\right)
}{
\pi_{\theta_n^{\mathrm{score}}}
\left(
y_{i,j,t}
\mid
e_i,x_i,y_{i,j,<t}
\right)
}.
\tag{2.46}
]

---

[
\boxed{\textsc{Per-Token OPD Reward}}
]

[
\boxed{
r_{i,j,t}^{\mathrm{OPD}}
========================

\operatorname{clip}
\left(
\operatorname{sg}
\left[
\Delta_{i,j,t}^{T/S}
\right],
-R_{\max},
R_{\max}
\right)}
\tag{2.47}
]

[
R_{\max}>0.
\tag{2.48}
]

[
\boxed{
R_{\max}
========

\mathrm{UNDISCLOSED}}
\tag{2.49}
]

[
\nabla_{\theta_n}
r_{i,j,t}^{\mathrm{OPD}}
========================

0.

\tag{2.50}
]

[
\nabla_{\phi_{d_i,e_i}}
r_{i,j,t}^{\mathrm{OPD}}
========================

0.

\tag{2.51}
]

[
\left|
r_{i,j,t}^{\mathrm{OPD}}
\right|
\le
R_{\max}.
\tag{2.52}
]

[
r_{i,j,t}^{\mathrm{OPD}}
========================

\begin{cases}
-R_{\max},
&
\Delta_{i,j,t}^{T/S}<-R_{\max},
\
\Delta_{i,j,t}^{T/S},
&
-R_{\max}\le
\Delta_{i,j,t}^{T/S}
\le R_{\max},
\
R_{\max},
&
\Delta_{i,j,t}^{T/S}>R_{\max}.
\end{cases}
\tag{2.53}
]

[
\Delta_{i,j,t}^{T/S}>0
\Longleftrightarrow
\pi_T(y_{i,j,t}\mid s_{i,j,t})

>

\pi_S(y_{i,j,t}\mid s_{i,j,t}).
\tag{2.54}
]

[
\Delta_{i,j,t}^{T/S}<0
\Longleftrightarrow
\pi_T(y_{i,j,t}\mid s_{i,j,t})
<
\pi_S(y_{i,j,t}\mid s_{i,j,t}).
\tag{2.55}
]

[
\boxed{
\text{teacher-student log-probability gap}
\neq
\text{direct differentiable loss}}
\tag{2.56}
]

[
\boxed{
r_{i,j,t}^{\mathrm{OPD}}
\text{ is a stopped dense RL reward}}
\tag{2.57}
]

([arXiv][1])

---

[
\textsc{Rejected Fine-Grained Alternative}
]

[
\mathcal L_{\mathrm{top}\mbox{-}k}
==================================

\operatorname{DistillTopK}
\left(
\pi_T,
\pi_S
\right).
\tag{2.58}
]

[
\operatorname{Advantage}
\left(
\mathcal L_{\mathrm{top}\mbox{-}k}
\right)
=======

\mathrm{NO\ CLEAR\ ADVANTAGE}
\tag{2.59}
]

[
\text{in}
\quad
\left{
\text{convergence speed},
\text{final performance}
\right}.
\tag{2.60}
]

[
\boxed{
\text{released K3 MOPD signal}
==============================

\text{sampled-token log-ratio reward}}
\tag{2.61}
]



---

[
\boxed{\textsc{Dense Reward Tensor}}
]

[
\mathbf r_{i,j}^{\mathrm{OPD}}
==============================

\left(
r_{i,j,1}^{\mathrm{OPD}},
\ldots,
r_{i,j,T_{i,j}}^{\mathrm{OPD}}
\right).
\tag{2.62}
]

[
\mathbf m_{i,j}^{\mathrm{gen}}
==============================

\left(
m_{i,j,1}^{\mathrm{gen}},
\ldots,
m_{i,j,T_{i,j}}^{\mathrm{gen}}
\right).
\tag{2.63}
]

[
\widetilde{\mathbf r}_{i,j}^{\mathrm{OPD}}
==========================================

\mathbf m_{i,j}^{\mathrm{gen}}
\odot
\mathbf r_{i,j}^{\mathrm{OPD}}.
\tag{2.64}
]

[
\mathbf A_{i,j}^{\mathrm{OPD}}
==============================

\mathfrak A_{\mathrm{K3}}
\left(
\widetilde{\mathbf r}*{i,j}^{\mathrm{OPD}},
\left{
\widetilde{\mathbf r}*{i,k}^{\mathrm{OPD}}
\right}_{k=1}^{K_n}
\right).
\tag{2.65}
]

[
\boxed{
\mathfrak A_{\mathrm{K3}}
=========================

\mathrm{UNDISCLOSED}}
\tag{2.66}
]

[
\boxed{
A_{i,j,t}^{\mathrm{OPD}}
\stackrel{?}{=}
r_{i,j,t}^{\mathrm{OPD}}
========================

\mathrm{NOT\ ESTABLISHED}}
\tag{2.67}
]

[
\boxed{
A_{i,j,t}^{\mathrm{OPD}}
\stackrel{?}{=}
\sum_{u=t}^{T_{i,j}}
r_{i,j,u}^{\mathrm{OPD}}
========================

\mathrm{NOT\ ESTABLISHED}}
\tag{2.68}
]

[
\boxed{
A_{i,j,t}^{\mathrm{OPD}}
\stackrel{?}{=}
r_{i,j,t}^{\mathrm{OPD}}
------------------------

\frac1{K_n}
\sum_{k=1}^{K_n}
r_{i,k,t}^{\mathrm{OPD}}
========================

\mathrm{NOT\ ESTABLISHED}}
\tag{2.69}
]

[
\boxed{
\text{discount factor},
\quad
\text{return-to-go},
\quad
\text{group centering},
\quad
\text{variance normalization}
=============================

\mathrm{UNDISCLOSED}}
\tag{2.70}
]

---

[
\boxed{\textsc{Learner Batch Construction}}
]

[
\mathcal B_n^{\mathrm D}
========================

\left{
\begin{array}{l}
d_i,e_i,x_i,
y_{i,j,1:T_{i,j}},
\
\ell_{i,j,1:T_{i,j}}^{\mathrm{beh}},
\mathbf r_{i,j}^{\mathrm{OPD}},
\mathbf A_{i,j}^{\mathrm{OPD}},
\mathbf m_{i,j}^{\mathrm{gen}},
\operatorname{Version}*{i,j,1:T*{i,j}}
\end{array}
\right}.
\tag{2.71}
]

[
N_n^{\mathrm{tok}}
==================

\sum_{i\in\mathcal G_n}
\sum_{j=1}^{K_n}
\sum_{t=1}^{T_{i,j}}
m_{i,j,t}^{\mathrm{gen}}.
\tag{2.72}
]

[
\mathcal B_n^{\mathrm D}
========================

\biguplus_{r=1}^{R_{\mathrm{DP}}}
\biguplus_{a=1}^{A_n}
\mathcal B_{n,r,a}^{\mu}.
\tag{2.73}
]

[
\boxed{
R_{\mathrm{DP}},
\quad
A_n,
\quad
\text{microbatch token cap},
\quad
\text{trajectory packing},
\quad
\text{teacher-group colocation}
===============================

\mathrm{UNDISCLOSED}}
\tag{2.74}
]

---

[
\boxed{\textsc{Learner Forward}}
]

[
\mathbf z_{i,j,t}^{\mathrm{learn}}
==================================

\widetilde M_{\theta_n^{\mathrm{learn}}}
\left(
e_i,
x_i,
y_{i,j,<t}
\right).
\tag{2.75}
]

[
\mathbf p_{i,j,t}^{\mathrm{learn}}
==================================

\operatorname{Softmax}
\left(
\mathbf z_{i,j,t}^{\mathrm{learn}}
\right).
\tag{2.76}
]

[
\ell_{i,j,t}^{\mathrm{learn}}
=============================

\log
p_{i,j,t,y_{i,j,t}}^{\mathrm{learn}}.
\tag{2.77}
]

[
\nabla_{\theta_n}
\ell_{i,j,t}^{\mathrm{learn}}
\neq0.
\tag{2.78}
]

[
\rho_{i,j,t}
============

\frac{
\pi_{\theta_n^{\mathrm{learn}}}
\left(
y_{i,j,t}
\mid
e_i,x_i,y_{i,j,<t}
\right)
}{
\pi_{\mathrm{beh}}
\left(
y_{i,j,t}
\mid
e_i,x_i,y_{i,j,<t}
\right)
}.
\tag{2.79}
]

[
\rho_{i,j,t}
============

\exp
\left(
\ell_{i,j,t}^{\mathrm{learn}}
-----------------------------

\ell_{i,j,t}^{\mathrm{beh}}
\right).
\tag{2.80}
]

[
\Delta_{i,j,t}^{\mathrm{off}}
=============================

# \log\rho_{i,j,t}

## \ell_{i,j,t}^{\mathrm{learn}}

\ell_{i,j,t}^{\mathrm{beh}}.
\tag{2.81}
]

[
\boxed{
\Delta_{i,j,t}^{T/S}
\neq
\Delta_{i,j,t}^{\mathrm{off}}}
\tag{2.82}
]

[
\Delta_{i,j,t}^{T/S}
====================

## \log\pi_T

\log\pi_S^{\mathrm{score}},
\tag{2.83}
]

[
\Delta_{i,j,t}^{\mathrm{off}}
=============================

## \log\pi_S^{\mathrm{learn}}

\log\pi_{\mathrm{beh}}.
\tag{2.84}
]

[
\boxed{
\text{teacher-student discrepancy}
\neq
\text{behavior-learner staleness}}
\tag{2.85}
]

---

[
\boxed{\textsc{III. Objective, Backward Pass, and Optimization}}
]

[
\textsc{Exact Published Local Objective}
]

[
\boxed{
r_{\mathrm{OPD}}^{d}
\left(
y_t\mid e,x,y_{<t}
\right)
=======

\operatorname{clip}
\left(
\operatorname{sg}
\left[
\log
\frac{
\pi_{\phi_{d,e}}^{T}
\left(
y_t\mid x,y_{<t}
\right)
}{
\pi_{\theta}^{S}
\left(
y_t\mid e,x,y_{<t}
\right)
}
\right],
-R_{\max},
R_{\max}
\right)}
\tag{3.1}
]

[
\textsf{[EQUATION-VERIFIED]}
]

([arXiv][1])

---

[
\textsc{Exact Published Total MOPD Objective}
]

[
\boxed{
\mathcal J_{\mathrm{MOPD}}^{\mathrm{exact}}
===========================================

\mathrm{UNDISCLOSED}}
\tag{3.2}
]

[
\boxed{
\mathcal J_{\mathrm{MOPD}}^{\mathrm{supported}}
===============================================

\mathfrak J_{\mathrm{K2.5\mbox{-}RL}}
\left(
\left{
r_{i,j,t}^{\mathrm{OPD}}
\right}
\right)}
\tag{3.3}
]

[
\boxed{
\text{dense-reward}\rightarrow
\text{advantage}\rightarrow
\text{scalar-loss mapping}
==========================

\mathrm{UNDISCLOSED}}
\tag{3.4}
]

[
\textsf{[K3 REPORT: DENSE REWARD INTEGRATES INTO RL FRAMEWORK]}
]

([arXiv][1])

---

[
\textsc{Inherited K2.5 Policy Wrapper}
]

[
\mathcal L_{\mathrm{RL}}^{\mathrm{K2.5}}
========================================

\mathbb E_{x\sim\mathcal D}
\left[
\frac1N
\sum_{j=1}^{K}
\sum_{t=1}^{|y_j|}
\left(
\operatorname{Clip}
\left(
\rho_{j,t},
\alpha,
\beta
\right)
A_j
---

\tau
\left(
\log\rho_{j,t}
\right)^2
\right)
\right].
\tag{3.5}
]

[
N
=

\sum_{j=1}^{K}|y_j|.
\tag{3.6}
]

[
A_j
===

## r_j

\frac1K
\sum_{q=1}^{K}r_q.
\tag{3.7}
]

[
\alpha>0,
\qquad
\beta>0,
\qquad
\tau>0.
\tag{3.8}
]

[
\boxed{
\alpha,\beta,\tau
=================

\mathrm{UNDISCLOSED}}
\tag{3.9}
]

([arXiv][2])

---

[
\textsc{MOPD-Compatible Derived Interface}
]

[
\boxed{
\widehat{\mathcal J}_{\mathrm{MOPD}}^{\mathrm{interface}}
=========================================================

\frac1{N_n^{\mathrm{tok}}}
\sum_{i,j,t}
m_{i,j,t}^{\mathrm{gen}}
\left[
\operatorname{Clip}
\left(
\rho_{i,j,t},
\alpha,
\beta
\right)
A_{i,j,t}^{\mathrm{OPD}}
------------------------

\tau
\left(
\Delta_{i,j,t}^{\mathrm{off}}
\right)^2
\right]}
\tag{3.10}
]

[
\boxed{
\textsf{[DERIVED INTERFACE; NOT AN EQUATION-VERIFIED K3 TOTAL]}}
\tag{3.11}
]

[
A_{i,j,t}^{\mathrm{OPD}}
========================

\mathfrak A_{\mathrm{K3}}
\left(
\mathbf r^{\mathrm{OPD}}
\right),
\qquad
\mathfrak A_{\mathrm{K3}}
=========================

\mathrm{UNDISCLOSED}.
\tag{3.12}
]

---

[
\boxed{\textsc{K2.5 Source Contradiction: Clipping}}
]

[
\operatorname{PrintedEquationArgument}
======================================

\rho_{i,j,t}.
\tag{3.13}
]

[
\operatorname{ProseMaskArgument}
================================

\log\rho_{i,j,t}.
\tag{3.14}
]

[
\operatorname{PrintedRule}
==========================

\operatorname{Clip}
\left(
\rho,\alpha,\beta
\right).
\tag{3.15}
]

[
\operatorname{ProseRule}
========================

\mathbf1
\left[
\alpha
\le
\log\rho
\le
\beta
\right].
\tag{3.16}
]

[
\boxed{
\operatorname{ImplementedRule}
==============================

\mathrm{UNRESOLVED}}
\tag{3.17}
]

([arXiv][2])

---

[
\boxed{\textsc{K2.5 Source Contradiction: Optimization Sign}}
]

[
\phi_{i,j,t}
============

\operatorname{Clip}
\left(
\rho_{i,j,t},
\alpha,\beta
\right)
A_{i,j,t}^{\mathrm{OPD}}
------------------------

\tau
\left(
\log\rho_{i,j,t}
\right)^2.
\tag{3.18}
]

[
\operatorname{RewardTermSign}
=============================

+,
\qquad
\operatorname{RegularizerSign}
==============================

-.
\tag{3.19}
]

[
\operatorname{ConventionalDirection}
====================================

\max_{\theta}.
\tag{3.20}
]

[
\operatorname{PaperDeclaredDirection}
=====================================

\min_{\theta}.
\tag{3.21}
]

[
\boxed{
\operatorname{ActualUpdateDirection}
====================================

\mathrm{SOURCE\mbox{-}INCONSISTENT}}
\tag{3.22}
]

[
\boxed{
\operatorname{NoSilentRepair}
=============================

1}
\tag{3.23}
]

([arXiv][2])

---

[
\boxed{\textsc{Stopped Reward Boundary}}
]

[
r_{i,j,t}^{\mathrm{OPD}}
========================

\operatorname{sg}
\left[
f_{i,j,t}
\left(
\phi_{d_i,e_i},
\theta_n^{\mathrm{score}}
\right)
\right].
\tag{3.24}
]

[
\frac{
\partial
r_{i,j,t}^{\mathrm{OPD}}
}{
\partial
\theta_n^{\mathrm{score}}
}
=

0.

\tag{3.25}
]

[
\frac{
\partial
r_{i,j,t}^{\mathrm{OPD}}
}{
\partial
\phi_{d_i,e_i}
}
=

0.

\tag{3.26}
]

[
\frac{
\partial
\mathcal J_{\mathrm{MOPD}}
}{
\partial
\theta_n^{\mathrm{learn}}
}
\neq0
\tag{3.27}
]

[
\text{only through}
\quad
\log
\pi_{\theta_n^{\mathrm{learn}}}
\left(
y_{i,j,t}\mid s_{i,j,t}
\right).
\tag{3.28}
]

[
\boxed{
\text{reward denominator contains }\pi_{\theta}
\text{ but does not backpropagate through that occurrence}}
\tag{3.29}
]

---

[
\boxed{\textsc{Unclipped On-Policy Reverse-KL Derivation}}
]

[
s
=

\left(
e,x,y_{<t}
\right).
\tag{3.30}
]

[
S_v
===

\pi_{\theta}^{S}
\left(
v\mid s
\right),
\qquad
T_v
===

\pi_{\phi_{d,e}}^{T}
\left(
v\mid x,y_{<t}
\right).
\tag{3.31}
]

[
y\sim S.
\tag{3.32}
]

[
r(y)
====

\operatorname{sg}
\left[
\log T_y-\log S_y
\right].
\tag{3.33}
]

[
g_{\mathrm{PG}}
===============

\mathbb E_{y\sim S}
\left[
r(y)
\nabla_{\theta}
\log S_y
\right].
\tag{3.34}
]

[
D_{\mathrm{KL}}
\left(
S\Vert T
\right)
=======

\sum_{v\in\mathcal V}
S_v
\log
\frac{S_v}{T_v}.
\tag{3.35}
]

[
\nabla_{\theta}
D_{\mathrm{KL}}
\left(
S\Vert T
\right)
=======

\sum_v
\nabla_{\theta}S_v
\left(
\log S_v-\log T_v+1
\right).
\tag{3.36}
]

[
\sum_v\nabla_{\theta}S_v
========================

\nabla_{\theta}
\sum_vS_v
=========

0.

\tag{3.37}
]

[
\nabla_{\theta}
D_{\mathrm{KL}}
\left(
S\Vert T
\right)
=======

\mathbb E_{y\sim S}
\left[
\left(
\log S_y-\log T_y
\right)
\nabla_{\theta}\log S_y
\right].
\tag{3.38}
]

[
\boxed{
g_{\mathrm{PG}}
===============

*

\nabla_{\theta}
D_{\mathrm{KL}}
\left(
S\Vert T
\right)}
\tag{3.39}
]

[
\textsf{[DERIVED: UNCLIPPED, EXACTLY ON-POLICY, SINGLE-STATE]}
]

---

[
\boxed{\textsc{Effect of Reward Clipping}}
]

[
r_R(y)
======

\operatorname{clip}
\left(
\log T_y-\log S_y,
-R_{\max},
R_{\max}
\right).
\tag{3.40}
]

[
g_R
===

\mathbb E_{y\sim S}
\left[
r_R(y)
\nabla_{\theta}\log S_y
\right].
\tag{3.41}
]

[
\boxed{
g_R
\neq
----

\nabla_{\theta}
D_{\mathrm{KL}}
\left(
S\Vert T
\right)
\quad
\text{in general}}
\tag{3.42}
]

[
R_{\max}\rightarrow\infty
\Longrightarrow
g_R
\rightarrow
-----------

\nabla_{\theta}
D_{\mathrm{KL}}
\left(
S\Vert T
\right).
\tag{3.43}
]

[
\boxed{
\text{K3 MOPD}
\neq
\text{exact full-vocabulary reverse-KL minimization}}
\tag{3.44}
]

[
\boxed{
\text{K3 MOPD}
==============

\text{clipped sampled-token reverse-KL-aligned RL signal}}
\tag{3.45}
]

---

[
\boxed{\textsc{Off-Policy Correction under Partial Rollout}}
]

[
y
\sim
\mu
\equiv
\pi_{\mathrm{beh}}.
\tag{3.46}
]

[
\rho_{\theta}(y\mid s)
======================

\frac{
\pi_{\theta}(y\mid s)
}{
\mu(y\mid s)
}.
\tag{3.47}
]

[
\mathbb E_{y\sim\mu}
\left[
\rho_{\theta}(y\mid s)
r(y)
\nabla_{\theta}
\log\pi_{\theta}(y\mid s)
\right]
=======

\mathbb E_{y\sim\pi_{\theta}}
\left[
r(y)
\nabla_{\theta}
\log\pi_{\theta}(y\mid s)
\right]
\tag{3.48}
]

[
\text{iff}
\quad
\operatorname{supp}
\left(
\pi_{\theta}
\right)
\subseteq
\operatorname{supp}
\left(
\mu
\right)
\tag{3.49}
]

[
\text{and}
\quad
\rho
\text{ is exact and untruncated}.
\tag{3.50}
]

[
\operatorname{Clip}
\left(
\rho,\alpha,\beta
\right)
\Longrightarrow
\operatorname{Bias}
\left(
\widehat g
\right)
\neq0
\quad
\text{in general}.
\tag{3.51}
]

[
-\tau
\left(
\log\rho
\right)^2
\Longrightarrow
\text{explicit behavior-policy proximity pressure}.
\tag{3.52}
]

[
\boxed{
\text{teacher alignment control}
================================

r^{\mathrm{OPD}}}
\tag{3.53}
]

[
\boxed{
\text{off-policy staleness control}
===================================

## \operatorname{Clip}(\rho,\alpha,\beta)

\tau(\log\rho)^2}
\tag{3.54}
]

[
\boxed{
r^{\mathrm{OPD}}
\neq
-\tau(\log\rho)^2}
\tag{3.55}
]

---

[
\boxed{\textsc{Printed-Equation Token Error}}
]

[
c(\rho)
=======

\operatorname{Clip}
\left(
\rho,\alpha,\beta
\right)
=======

\begin{cases}
\alpha,
&
\rho<\alpha,
\
\rho,
&
\alpha\le\rho\le\beta,
\
\beta,
&
\rho>\beta.
\end{cases}
\tag{3.56}
]

[
\phi_{i,j,t}
============

m_{i,j,t}^{\mathrm{gen}}
\left[
c(\rho_{i,j,t})
A_{i,j,t}^{\mathrm{OPD}}
------------------------

\tau
\left(
\Delta_{i,j,t}^{\mathrm{off}}
\right)^2
\right].
\tag{3.57}
]

[
\frac{
\partial\rho_{i,j,t}
}{
\partial\ell_{i,j,t}^{\mathrm{learn}}
}
=

\rho_{i,j,t}.
\tag{3.58}
]

[
\frac{
\partial\Delta_{i,j,t}^{\mathrm{off}}
}{
\partial\ell_{i,j,t}^{\mathrm{learn}}
}
=

1.

\tag{3.59}
]

[
\frac{
\partial c(\rho_{i,j,t})
}{
\partial\ell_{i,j,t}^{\mathrm{learn}}
}
=

\rho_{i,j,t}
\mathbf1
\left[
\alpha<\rho_{i,j,t}<\beta
\right].
\tag{3.60}
]

[
\boxed{
\chi_{i,j,t}^{\mathrm{printed}}
===============================

\frac{
\partial\phi_{i,j,t}
}{
\partial\ell_{i,j,t}^{\mathrm{learn}}
}
=

m_{i,j,t}^{\mathrm{gen}}
\left[
A_{i,j,t}^{\mathrm{OPD}}
\rho_{i,j,t}
\mathbf1
\left[
\alpha<\rho_{i,j,t}<\beta
\right]
-------

2\tau
\Delta_{i,j,t}^{\mathrm{off}}
\right]}
\tag{3.61}
]

[
\textsf{[DERIVED FROM PRINTED K2.5 EQUATION]}
]

[
\rho\notin(\alpha,\beta)
\land
\Delta^{\mathrm{off}}\neq0
\Longrightarrow
\chi^{\mathrm{printed}}
=======================

-2\tau\Delta^{\mathrm{off}}
\neq0.
\tag{3.62}
]

[
\boxed{
\text{printed equation does not fully zero the token gradient outside the ratio interval}}
\tag{3.63}
]

---

[
\boxed{\textsc{Prose-Mask Candidate Error}}
]

[
m_{i,j,t}^{\log}
================

\mathbf1
\left[
\alpha
\le
\Delta_{i,j,t}^{\mathrm{off}}
\le
\beta
\right].
\tag{3.64}
]

[
\boxed{
\chi_{i,j,t}^{\mathrm{prose}}
=============================

m_{i,j,t}^{\mathrm{gen}}
m_{i,j,t}^{\log}
\left[
A_{i,j,t}^{\mathrm{OPD}}
\rho_{i,j,t}
------------

2\tau
\Delta_{i,j,t}^{\mathrm{off}}
\right]}
\tag{3.65}
]

[
m_{i,j,t}^{\log}=0
\Longrightarrow
\chi_{i,j,t}^{\mathrm{prose}}
=============================

0.

\tag{3.66}
]

[
\boxed{
\chi^{\mathrm{implemented}}
\in
\left{
\chi^{\mathrm{printed}},
\chi^{\mathrm{prose}}
\right}
=======

\mathrm{UNRESOLVED}}
\tag{3.67}
]

---

[
\boxed{\textsc{Logit-Level Backward Signal}}
]

[
\ell_{i,j,t}^{\mathrm{learn}}
=============================

## z_{i,j,t,y_{i,j,t}}

\log
\sum_{v\in\mathcal V}
\exp
\left(
z_{i,j,t,v}
\right).
\tag{3.68}
]

[
\frac{
\partial
\ell_{i,j,t}^{\mathrm{learn}}
}{
\partial
z_{i,j,t,v}
}
=

\mathbf1
\left[
v=y_{i,j,t}
\right]
-------

p_{i,j,t,v}^{\mathrm{learn}}.
\tag{3.69}
]

[
\mathbf e_{i,j,t}^{\mathrm{logit}}
==================================

\chi_{i,j,t}
\left[
\operatorname{OneHot}
\left(
y_{i,j,t}
\right)
-------

\mathbf p_{i,j,t}^{\mathrm{learn}}
\right].
\tag{3.70}
]

[
\mathbf e_{i,j,t}^{\mathrm{logit}}
\in
\mathbb R^{|\mathcal V|}.
\tag{3.71}
]

[
\sum_{v\in\mathcal V}
e_{i,j,t,v}^{\mathrm{logit}}
============================

0.

\tag{3.72}
]

[
m_{i,j,t}^{\mathrm{gen}}=0
\Longrightarrow
\mathbf e_{i,j,t}^{\mathrm{logit}}
==================================

\mathbf0.
\tag{3.73}
]

[
\chi_{i,j,t}=0
\Longrightarrow
\mathbf e_{i,j,t}^{\mathrm{logit}}
==================================

\mathbf0.
\tag{3.74}
]

---

[
\boxed{\textsc{Parameter-Level Backward Pass}}
]

[
J_{i,j,t}^{\theta}
==================

\frac{
\partial
\mathbf z_{i,j,t}^{\mathrm{learn}}
}{
\partial
\widetilde\theta_n
}.
\tag{3.75}
]

[
g_{i,j,t}^{\widetilde\theta}
============================

\left(
J_{i,j,t}^{\theta}
\right)^{\top}
\mathbf e_{i,j,t}^{\mathrm{logit}}.
\tag{3.76}
]

[
g_{n,r,a}^{\widetilde\theta}
============================

\frac1{
N_{n,r,a}^{\mathrm{tok}}
}
\sum_{
(i,j,t)
\in
\mathcal B_{n,r,a}^{\mu}
}
g_{i,j,t}^{\widetilde\theta}.
\tag{3.77}
]

[
g_{n,r}^{\widetilde\theta}
==========================

\sum_{a=1}^{A_n}
w_{n,r,a}
g_{n,r,a}^{\widetilde\theta}.
\tag{3.78}
]

[
\boxed{
w_{n,r,a},
\quad
\text{microbatch normalization}
===============================

\mathrm{UNDISCLOSED}}
\tag{3.79}
]

[
g_n^{\widetilde\theta}
======================

\operatorname{DistributedReduce}
\left(
\left{
g_{n,r}^{\widetilde\theta}
\right}*{r=1}^{R*{\mathrm{DP}}}
\right).
\tag{3.80}
]

[
g_n^{\theta}
============

J_{Q}
\left(
\theta_n
\right)^{\top}
g_n^{\widetilde\theta}.
\tag{3.81}
]

[
\boxed{
J_Q,
\quad
\text{MXFP4/MXFP8 backward estimator},
\quad
\text{STE rule}
===============

\mathrm{UNDISCLOSED}}
\tag{3.82}
]

[
\nabla_{\Phi}
\mathcal J_{\mathrm{MOPD}}
==========================

\mathbf0.
\tag{3.83}
]

[
\nabla_{\theta_n}
\mathcal J_{\mathrm{MOPD}}
==========================

g_n^{\theta}.
\tag{3.84}
]

---

[
\boxed{\textsc{Gradient Post-Processing}}
]

[
\widehat g_n
============

\operatorname{GradientTransform}_{\mathrm{MOPD}}
\left(
g_n^\theta
\right).
\tag{3.85}
]

[
\boxed{
\begin{aligned}
&
\text{global gradient clipping},
\
&
\text{per-parameter clipping},
\
&
\text{loss scaling},
\
&
\text{gradient dtype},
\
&
\text{NaN/Inf policy},
\
&
\text{expert-gradient normalization}
\end{aligned}
=============

\mathrm{UNDISCLOSED}}
\tag{3.86}
]

---

[
\boxed{\textsc{Student Update}}
]

[
\left(
\theta_{n+1},
\Omega_{n+1}
\right)
=======

\operatorname{Optimizer}_{\mathrm{MOPD}}
\left(
\theta_n,
\Omega_n,
\widehat g_n;
\eta_n,
\Lambda_n,
\operatorname{Dir}
\right).
\tag{3.87}
]

[
\boxed{
\operatorname{Optimizer}_{\mathrm{MOPD}}
\stackrel{?}{=}
\mathsf{MuonClip}
=================

\mathrm{NOT\ EXPLICITLY\ RESTATED\ FOR\ K3\ MOPD}}
\tag{3.88}
]

[
\boxed{
\text{K2.5 RL framework uses MuonClip}}
\tag{3.89}
]

[
\boxed{
\eta_n,
\quad
\Lambda_n,
\quad
\text{optimizer moments},
\quad
\text{weight decay},
\quad
\operatorname{Dir}
==================

\mathrm{UNDISCLOSED/UNRESOLVED}}
\tag{3.90}
]

[
\phi_{d,e,n+1}
==============

\phi_{d,e,n}
\qquad
\forall(d,e).
\tag{3.91}
]

[
\pi_{\mathrm{beh},n+1}
======================

\operatorname{Snapshot}
\left(
\pi_{\theta_{n+1}}
\right).
\tag{3.92}
]

[
\boxed{
\text{behavior-policy refresh interval}
=======================================

\mathrm{UNDISCLOSED}}
\tag{3.93}
]

[
\mathfrak S_{n+1}^{\mathrm D}
=============================

\left(
\theta_{n+1},
Q(\theta_{n+1}),
\Omega_{n+1},
\pi_{\mathrm{beh},n+1},
\Pi_{\Phi},
\mathcal Q_{n+1},
\mathcal E_{n+1},
\mathcal B_{n+1},
\mathfrak Q_{n+1}
\right).
\tag{3.94}
]

[
\textsc{End For}
]

---

[
\boxed{\textsc{Distribution-Level MOPD Program}}
]

[
(d,e,x)
\sim
P_{\mathrm{MOPD}}
\left(
d,e,x
\right).
\tag{3.95}
]

[
y
\sim
\pi_{\mathrm{beh}}
\left(
\cdot
\mid
e,x,\mathcal E_x
\right).
\tag{3.96}
]

[
r_t^{\mathrm{OPD}}
==================

\operatorname{clip}
\left(
\operatorname{sg}
\left[
\log
\pi_{\phi_{d,e}}^{T}
\left(
y_t\mid x,y_{<t}
\right)
-------

\log
\pi_{\theta}^{S}
\left(
y_t\mid e,x,y_{<t}
\right)
\right],
-R_{\max},
R_{\max}
\right).
\tag{3.97}
]

[
\mathbf A^{\mathrm{OPD}}
========================

\mathfrak A_{\mathrm{K3}}
\left(
\mathbf r^{\mathrm{OPD}}
\right).
\tag{3.98}
]

[
\rho_t
======

\frac{
\pi_{\theta}^{S}
\left(
y_t\mid e,x,y_{<t}
\right)
}{
\pi_{\mathrm{beh}}
\left(
y_t\mid e,x,y_{<t}
\right)
}.
\tag{3.99}
]

[
\boxed{
\mathcal J_{\mathrm{MOPD}}^{\mathrm{K3}}
========================================

\mathbb E_{
\substack{
(d,e,x)\sim P_{\mathrm{MOPD}}
\
y\sim\pi_{\mathrm{beh}}
}
}
\left[
\mathfrak J_{\mathrm{K2.5\mbox{-}RL}}
\left(
{\rho_t},
{\mathfrak A_{\mathrm{K3}}(\mathbf r^{\mathrm{OPD}})_t}
\right)
\right]}
\tag{3.100}
]

[
\boxed{
\mathfrak A_{\mathrm{K3}},
\quad
\mathfrak J_{\mathrm{K2.5\mbox{-}RL}}
\text{ exact MOPD composition}
==============================

\mathrm{UNDISCLOSED}}
\tag{3.101}
]

---

[
\boxed{\textsc{Final State Transition}}
]

[
\begin{aligned}
&
\left{
\theta_{\mathrm{RL}}^{d,e}
\right}*{d,e}
\
&\xrightarrow[
\substack{
3\text{ domains}
\
3\text{ reasoning-effort levels}
}
]{
\operatorname{TeacherBank}
}
\Pi*{\Phi}
==========

\left{
\pi_{\phi_{d,e}}^{T}
\right}*{d,e}
[2mm]
&\xrightarrow[
\substack{
(d,e,x)\sim P*{\mathrm{MOPD}}
\
y\sim\pi_{\theta}
}
]{
\operatorname{StudentOnPolicyRollout}
}
\left{
x,d,e,y_{1:T}
\right}
[2mm]
&\xrightarrow[
\substack{
\ell_t^T
========

\log\pi_{\phi_{d,e}}^T(y_t|x,y_{<t})
\
\ell_t^S
========

\log\pi_{\theta}(y_t|e,x,y_{<t})
}
]{
\operatorname{TeacherStudentScoring}
}
\left{
\ell_t^T,
\ell_t^S
\right}*{t=1}^{T}
[2mm]
&\xrightarrow[
\substack{
\operatorname{sg}
\
[-R*{\max},R_{\max}]
}
]{
r_t^{\mathrm{OPD}}
==================

\operatorname{clip}
\left(
\operatorname{sg}
[
\ell_t^T-\ell_t^S
]
\right)
}
\mathbf r^{\mathrm{OPD}}
[2mm]
&\xrightarrow[
\substack{
\text{dense-reward integration}
\
\text{partial rollout}
\
\text{off-policy correction}
\
\text{QAT-matched rollout/learner}
}
]{
\mathcal J_{\mathrm{MOPD}}
}
\boxed{
\theta_{\mathrm{K3}}
}.
\end{aligned}
\tag{3.102}
]

---

[
\boxed{\textsc{Evidence Boundary}}
]

[
\begin{array}{c|c}
\textsc{MOPD Component}
&
\textsc{Evidence State}
\
\hline
3\text{ domains}\times3\text{ efforts}
&
\textsf{[REPORTED]}
\
9\text{ corresponding expert teachers}
&
\textsf{[REPORTED]}
\
\text{student on-policy trajectories}
&
\textsf{[REPORTED]}
\
\text{teacher selected by }(d,e)
&
\textsf{[REPORTED]}
\
\text{per-token teacher/student log ratio}
&
\textsf{[EQUATION-VERIFIED]}
\
\operatorname{sg}(\cdot)
&
\textsf{[EQUATION-VERIFIED]}
\
[-R_{\max},R_{\max}]\text{ reward clipping}
&
\textsf{[EQUATION-VERIFIED]}
\
R_{\max}\text{ numerical value}
&
\textsf{[UNDISCLOSED]}
\
\text{top-}k\text{ distillation tested}
&
\textsf{[REPORTED]}
\
\text{top-}k\text{ improvement}
&
\textsf{[NO CLEAR ADVANTAGE REPORTED]}
\
\text{partial-rollout compatibility}
&
\textsf{[REPORTED]}
\
\text{QAT throughout post-training}
&
\textsf{[REPORTED]}
\
\text{student initialization}
&
\textsf{[UNDISCLOSED]}
\
\text{prompt/domain mixture}
&
\textsf{[UNDISCLOSED]}
\
\text{teacher execution precision}
&
\textsf{[UNDISCLOSED]}
\
\text{teacher batching/offloading}
&
\textsf{[UNDISCLOSED]}
\
\text{dense reward}\rightarrow\text{advantage}
&
\textsf{[UNDISCLOSED]}
\
\text{exact total MOPD scalar}
&
\textsf{[UNDISCLOSED]}
\
\text{full-vocabulary KL}
&
\textsf{[NOT THE REPORTED K3 OBJECTIVE]}
\
\text{sampled reward reverse-KL relation}
&
\textsf{[DERIVED]}
\
\text{K2.5 ratio-vs-log-ratio clipping}
&
\textsf{[SOURCE-INCONSISTENT]}
\
\text{K2.5 minimization sign}
&
\textsf{[SOURCE-INCONSISTENT]}
\
\text{MOPD optimizer}
&
\textsf{[UNDISCLOSED]}
\
\text{learning rate and schedule}
&
\textsf{[UNDISCLOSED]}
\
\text{batch size and rollout count}
&
\textsf{[UNDISCLOSED]}
\
\text{gradient clipping}
&
\textsf{[UNDISCLOSED]}
\
\text{policy-refresh cadence}
&
\textsf{[UNDISCLOSED]}
\end{array}
\tag{3.103}
]

[1]: https://arxiv.org/pdf/2607.24653 "Kimi K3: Open Frontier Intelligence"
[2]: https://arxiv.org/pdf/2602.02276 "Kimi K2.5: Visual Agentic Intelligence"
