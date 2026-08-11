[
\boxed{\mathsf A_0:;\text{EVIDENCE / TRAINING STATE}}
]

// Source and evidence contract: OpenAI primary sources + original PPO/GAE only; unsupported implementation details remain (\mathrm{UNDISCLOSED}). 

[
\boxed{
\mathsf E(q)\in
{
[\mathrm{REPORTED}],
[\mathrm{DERIVED}],
[\mathrm{CODE!-!VERIFIED}],
[\mathrm{UNDISCLOSED}]
}
}
]

[
\begin{aligned}
\pi_{\theta_k}(a_t|s_t)
&:\quad
\theta_k;\text{trainable},
&
\nabla_{\theta_k}\neq0,
[2mm]
\pi_{\theta_{\mathrm{old},k}}(a_t|s_t)
&:\quad
\theta_{\mathrm{old},k}
=======================

\operatorname{sg}(\theta_k)
;\text{at rollout start},
&
\nabla_{\theta_{\mathrm{old},k}}=0,
[2mm]
\pi_{\theta_{\mathrm{ref}}}(a_t|s_t)
&:\quad
\theta_{\mathrm{ref}};\text{fixed SFT/reference},
&
\nabla_{\theta_{\mathrm{ref}}}=0,
[2mm]
V_{\psi_k}(s_t)
&:\quad
\psi_k;\text{trainable critic},
&
\nabla_{\psi_k}\neq0,
[2mm]
r_{\omega^\star}(x,y)
&:\quad
\omega^\star;\text{pretrained preference RM},
&
\nabla_{\omega^\star}=0
\quad\text{during PPO}.
\end{aligned}
]

[
\boxed{
\pi_{\theta_{\mathrm{old},k}}
\neq
\pi_{\theta_{\mathrm{ref}}}
\quad\text{in general}
}
]

[
\begin{aligned}
\theta_{\mathrm{old},k}
&\leftarrow
\operatorname{sg}(\theta_k),
\
\psi_{\mathrm{old},k}
&\leftarrow
\operatorname{sg}(\psi_k)
\quad
\text{or equivalently store }
V_{\psi_k}(s_t)
\text{ on rollout}.
\end{aligned}
\tag{[DERIVED]}
]

[
\boxed{
\mathcal S_k=
\left{
\theta_k,\theta_{\mathrm{old},k},
\theta_{\mathrm{ref}},
\psi_k,\psi_{\mathrm{old},k},
\omega^\star,
m_k^\theta,v_k^\theta,
m_k^\psi,v_k^\psi,
\mathcal B_k,
\beta,\gamma,\lambda,\epsilon,
\eta_k^\theta,\eta_k^\psi
\right}
}
]

[
\begin{array}{c|c|c|c|c}
\text{model} & \text{input} & \text{output} & \text{gradient owner} & \text{refresh}\
\hline
\pi_\theta&s_t&(z_t,\pi_\theta)&\theta&\text{minibatch step}\
\pi_{\mathrm{old}}&s_t&\log\pi_{\mathrm{old}}(a_t|s_t)&\varnothing&\text{rollout iteration}\
\pi_{\mathrm{ref}}&s_t&\log\pi_{\mathrm{ref}}(a_t|s_t)&\varnothing&\text{never}\
V_\psi&s_t&v_t\in\mathbb R&\psi&\text{minibatch step}\
r_\omega&(x,y)&r\in\mathbb R&\omega;\text{only pre-PPO}&\text{frozen in PPO}
\end{array}
]

// OpenAI's released summarization repository exposes trained SFT/RM/PPO model execution/evaluation, but not the complete PPO training implementation; therefore hidden trainer mechanics cannot be promoted to ([\mathrm{CODE!-!VERIFIED}]). ([GitHub][1])

[
\boxed{\mathsf A_1:;\text{REWARD-MODEL TRAINING}}
]

[
\mathcal D_{\mathrm{pref}}
==========================

{(x_i,y_i^{w},y_i^{l})}_{i=1}^{N}.
]

[
\begin{aligned}
r_\omega(x,y)
&\in\mathbb R,
\
\Delta_\omega(x,y^w,y^l)
&=
r_\omega(x,y^w)-r_\omega(x,y^l),
\
P_\omega(y^w\succ y^l|x)
&=
\sigma(\Delta_\omega)
=====================

\frac{1}{1+\exp(-\Delta_\omega)}.
\end{aligned}
\tag{[REPORTED]}
]

[
\boxed{
\mathcal L_{\mathrm{RM}}(\omega)
================================

*

\mathbb E_{(x,y^w,y^l)\sim\mathcal D_{\mathrm{pref}}}
\log
\sigma
\left(
r_\omega(x,y^w)-r_\omega(x,y^l)
\right)
}
]

// Summarization explicitly uses this pairwise logistic preference objective and subsequently centers reference-summary rewards to mean zero. ([arXiv][2])

[
\begin{aligned}
p
&=\sigma(\Delta_\omega),
\
\frac{\partial\mathcal L}{\partial\Delta_\omega}
&=
p-1,
\
\nabla_\omega\mathcal L
&=
(p-1)
\left[
\nabla_\omega r_\omega(x,y^w)
-----------------------------

\nabla_\omega r_\omega(x,y^l)
\right].
\end{aligned}
\tag{[DERIVED]}
]

[
\boxed{
\omega_q
\xrightarrow{\mathrm{forward}}
(r_w,r_l,\Delta,p)
\xrightarrow{\mathcal L_{\mathrm{RM}}}
g_q^\omega
==========

\nabla_{\omega_q}\mathcal L_{\mathrm{RM}}
\xrightarrow{\mathrm{Optimizer}}
\omega_{q+1}
}
]

[
\omega^\star
============

\omega_{Q_{\mathrm{RM}}},
\qquad
\boxed{
\omega_{\mathrm{PPO}}
\leftarrow
\operatorname{sg}(\omega^\star)
},
\qquad
\nabla_{\omega^\star}\mathcal L_{\mathrm{PPO}}=0.
]

[
\begin{aligned}
b_{\mathrm{RM}}
&=
\mathbb E_{y\sim\mathcal D_{\mathrm{center}}}
[r_{\omega^\star}(x,y)],
\
\bar r_{\omega^\star}(x,y)
&=
r_{\omega^\star}(x,y)-b_{\mathrm{RM}},
\
\mathbb E_{\mathcal D_{\mathrm{center}}}
[\bar r_{\omega^\star}]
&=0.
\end{aligned}
\tag{[REPORTED]}
]

[
\mathcal D_{\mathrm{center}}
============================

\begin{cases}
\text{reference summaries},&\text{Summarization},\
\text{labeler demonstrations},&\text{InstructGPT}.
\end{cases}
]

// InstructGPT ranks (K=4,\ldots,9) responses and optimizes all induced pairs as one prompt-level batch element; it also explicitly centers demonstration scores before RL. ([arXiv][3])

[
\boxed{
\mathcal L_{\mathrm{RM}}^{(K)}
==============================

-\frac{1}{\binom K2}
\sum_{(w,l)\in\mathcal P_K}
\log
\sigma(r_w-r_l)
}
\tag{[REPORTED:;InstructGPT]}
]

[
\boxed{\mathsf A_2:;\text{LLM-AS-MDP}}
]

[
\boxed{
\mathcal M=(\mathcal S,\mathcal A,P,\tilde r,\gamma)
}
]

[
\begin{aligned}
s_t
&=(x,y_{<t}),
\
a_t
&=y_t\in\mathcal V,
\
s_{t+1}
&=(x,y_{\le t}),
\
P!\left(
(x,y_{\le t})
\mid
(x,y_{<t}),y_t
\right)
&=1,
\
\tau
&=
(s_1,a_1,\tilde r_1,\ldots,
s_T,a_T,\tilde r_T).
\end{aligned}
\tag{[DERIVED]}
]

[
\boxed{
\text{RL timestep}
\equiv
\text{one generated BPE token}
}
\tag{[REPORTED:;Summarization]}
]

[
d_t^{\mathrm{EOS}}
==================

\mathbf1[a_t=\mathrm{EOS}].
]

[
d_t
===

\begin{cases}
1,&\text{true terminal},\
0,&\text{nonterminal}.
\end{cases}
]

[
V(s_{T+1})=0
\quad
\text{for a true terminal}.
]

[
\boxed{
\text{Summarization episode termination}
:
a_T=\mathrm{EOS},
\qquad
\gamma=1
}
\tag{[REPORTED]}
]

// OpenAI explicitly states that reward-model reward applies to the entire summary, BPE tokens are RL timesteps, and the episode ends on EOS with (\gamma=1). ([arXiv][2])

[
\boxed{
\underbrace{x\rightarrow y\rightarrow r_\omega(x,y)}*{\text{InstructGPT macro bandit}}
;\equiv*{\mathrm{token;unrolling}};
s_1\rightarrow a_1\rightarrow
\cdots
\rightarrow
s_T\rightarrow a_T
}
\tag{[REPORTED]+[DERIVED]}
]

// InstructGPT describes the macro environment as a bandit that samples a prompt, receives one response, produces RM reward and terminates; it separately states that the KL penalty is applied per token. ([arXiv][3])

[
\boxed{
\text{exact bootstrap semantics at forced maximum-length truncation}
====================================================================

[\mathrm{UNDISCLOSED}]
}
]

[
\boxed{
\text{InstructGPT: response length}\le1000
\quad\land\quad
\text{context length}=2000
}
\tag{[REPORTED]}
]

// The maximum response length is disclosed, but the paper does not specify whether a length-cap transition is treated as terminal or bootstrapped for value estimation. ([arXiv][3])

[
\boxed{\mathsf A_3:;\text{ROLLOUT / TRAJECTORY CONSTRUCTION}}
]

[
\theta_{\mathrm{old},k}
\leftarrow
\operatorname{sg}(\theta_k).
]

[
x_n\sim\mathcal D_{\mathrm{prompt}},
\qquad n=1,\ldots,B_k.
]

[
s_{n,1}=(x_n,\varnothing).
]

[
\begin{aligned}
h_{n,t}^{\mathrm{old}}
&=
f_{\theta_{\mathrm{old},k}}
(x_n,y_{n,<t})
\in\mathbb R^{d_{\mathrm{model}}},
\
z_{n,t}^{\mathrm{old}}
&=
W_Uh_{n,t}^{\mathrm{old}}+b_U
\in\mathbb R^{|\mathcal V|},
\
\pi_{\mathrm{old},k}(\cdot|s_{n,t})
&=
\operatorname{softmax}(z_{n,t}^{\mathrm{old}}),
\
a_{n,t}
&\sim
\pi_{\mathrm{old},k}(\cdot|s_{n,t}),
\
\ell_{n,t}^{\mathrm{old}}
&=
\log
\pi_{\mathrm{old},k}(a_{n,t}|s_{n,t}),
\
\ell_{n,t}^{\mathrm{ref}}
&=
\log
\pi_{\mathrm{ref}}(a_{n,t}|s_{n,t}),
\
v_{n,t}^{\mathrm{old}}
&=
V_{\psi_{\mathrm{old},k}}(s_{n,t}).
\end{aligned}
\tag{[DERIVED]}
]

[
y_n=(a_{n,1},\ldots,a_{n,T_n}).
]

[
r_n^{\mathrm{RM}}
=================

\operatorname{sg}
\left(
\bar r_{\omega^\star}(x_n,y_n)
\right).
]

[
\boxed{
\tau_n=
\left{
x_n,
a_{n,1:T_n},
\ell_{n,1:T_n}^{\mathrm{old}},
\ell_{n,1:T_n}^{\mathrm{ref}},
v_{n,1:T_n}^{\mathrm{old}},
r_n^{\mathrm{RM}},
d_{n,1:T_n}
\right}
}
]

[
\boxed{
\mathcal B_k
============

{\tau_n}_{n=1}^{B_k}
}
]

[
\begin{aligned}
X&\in\mathbb N^{B\times L_x},
&
Y&\in\mathbb N^{B\times T},
\
H&\in\mathbb R^{B\times T\times d_{\mathrm{model}}},
&
Z&\in\mathbb R^{B\times T\times|\mathcal V|},
\
L_{\mathrm{old}}
&\in\mathbb R^{B\times T},
&
L_{\mathrm{ref}}
&\in\mathbb R^{B\times T},
\
V_{\mathrm{old}}
&\in\mathbb R^{B\times T},
&
R_{\mathrm{RM}}
&\in\mathbb R^B.
\end{aligned}
\tag{[DERIVED]}
]

[
\boxed{\mathsf A_4:;\text{REWARD + KL CONSTRUCTION}}
]

[
\boxed{
R_{\mathrm{RLHF},\theta}(x,y)
=============================

## r_{\omega^\star}(x,y)

\beta
\log
\frac{\pi_\theta(y|x)}
{\pi_{\mathrm{ref}}(y|x)}
}
\tag{[REPORTED]}
]

// This sequence-level objective is explicitly reported in both OpenAI summarization and InstructGPT. ([arXiv][2])

[
\pi_\theta(y|x)
===============

\prod_{t=1}^{T}
\pi_\theta(y_t|x,y_{<t}).
]

[
\begin{aligned}
\log
\frac{\pi_\theta(y|x)}
{\pi_{\mathrm{ref}}(y|x)}
&=
\log
\frac{
\prod_{t=1}^{T}\pi_\theta(a_t|s_t)
}{
\prod_{t=1}^{T}\pi_{\mathrm{ref}}(a_t|s_t)
}
\
&=
\sum_{t=1}^{T}
\log
\frac{\pi_\theta(a_t|s_t)}
{\pi_{\mathrm{ref}}(a_t|s_t)}
\
&=
\sum_{t=1}^{T}
\left[
\log\pi_\theta(a_t|s_t)
-----------------------

\log\pi_{\mathrm{ref}}(a_t|s_t)
\right].
\end{aligned}
\tag{[DERIVED]}
]

[
\boxed{
\mathbb E_{y\sim\pi_\theta(\cdot|x)}
\left[
\log
\frac{\pi_\theta(y|x)}
{\pi_{\mathrm{ref}}(y|x)}
\right]
=======

D_{\mathrm{KL}}
\left(
\pi_\theta(\cdot|x)
\Vert
\pi_{\mathrm{ref}}(\cdot|x)
\right)
}
\tag{[DERIVED]}
]

[
r_{n,t}^{\mathrm{KL}}
=====================

-\beta
\left(
\ell_{n,t}^{\mathrm{old}}
-------------------------

\ell_{n,t}^{\mathrm{ref}}
\right).
\tag{[DERIVED:;rollout;time]}
]

[
r_{n,t}^{\mathrm{terminal}}
===========================

\mathbf1[t=T_n],
r_n^{\mathrm{RM}}.
]

[
\boxed{
\tilde r_{n,t}
==============

r_{n,t}^{\mathrm{KL}}
+
r_{n,t}^{\mathrm{terminal}}
}
\tag{[DERIVED]}
]

[
\sum_{t=1}^{T_n}\tilde r_{n,t}
==============================

## r_n^{\mathrm{RM}}

\beta
\log
\frac{
\pi_{\mathrm{old},k}(y_n|x_n)
}{
\pi_{\mathrm{ref}}(y_n|x_n)
}.
]

[
\boxed{
\underbrace{
\frac{\pi_\theta(a_t|s_t)}
{\pi_{\mathrm{old}}(a_t|s_t)}
}*{\rho_t^{\mathrm{PPO}}}
\neq
\underbrace{
\frac{\pi*{\mathrm{RL}}(a_t|s_t)}
{\pi_{\mathrm{ref}}(a_t|s_t)}
}_{\rho_t^{\mathrm{KL}}}
}
]

[
\begin{aligned}
\rho_t^{\mathrm{PPO}}
&\rightarrow
\text{proximal update/sample reuse},
\
\rho_t^{\mathrm{KL}}
&\rightarrow
\text{reference-policy regularization}.
\end{aligned}
]

[
\boxed{\mathsf A_5:;\text{VALUE / Q / ADVANTAGE DERIVATION}}
]

[
G_t
===

\sum_{l=0}^{T-t}
\gamma^l\tilde r_{t+l}.
]

[
\boxed{
V^\pi(s_t)
==========

\mathbb E_\pi[G_t|s_t]
}
]

[
\boxed{
Q^\pi(s_t,a_t)
==============

\mathbb E_\pi[G_t|s_t,a_t]
}
]

[
\boxed{
A^\pi(s_t,a_t)
==============

Q^\pi(s_t,a_t)-V^\pi(s_t)
}
]

[
\begin{aligned}
Q^\pi(s_t,a_t)
&=
\mathbb E_\pi
\left[
\tilde r_t+
\gamma
\sum_{l=0}^{T-t-1}
\gamma^l\tilde r_{t+1+l}
\mid
s_t,a_t
\right]
\
&=
\mathbb E
\left[
\tilde r_t+
\gamma V^\pi(s_{t+1})
\mid s_t,a_t
\right].
\end{aligned}
\tag{[DERIVED]}
]

[
\boxed{
A^\pi(s_t,a_t)
==============

\mathbb E
\left[
\tilde r_t+
\gamma V^\pi(s_{t+1})
---------------------

V^\pi(s_t)
\mid s_t,a_t
\right]
}
\tag{[DERIVED]}
]

[
\boxed{\mathsf A_6:;\text{BASELINE VARIANCE REDUCTION}}
]

[
J(\theta)
=========

\mathbb E_{\tau\sim\pi_\theta}[R(\tau)].
]

[
g_t
===

\nabla_\theta
\log\pi_\theta(a_t|s_t)
G_t.
]

[
u_t
:=
\nabla_\theta
\log\pi_\theta(a_t|s_t).
]

[
\begin{aligned}
\mathbb E_{a_t\sim\pi_\theta}
[u_tb(s_t)|s_t]
&=
b(s_t)
\sum_a
\pi_\theta(a|s_t)
\nabla_\theta\log\pi_\theta(a|s_t)
\
&=
b(s_t)
\sum_a
\nabla_\theta\pi_\theta(a|s_t)
\
&=
b(s_t)
\nabla_\theta
\sum_a\pi_\theta(a|s_t)
\
&=
b(s_t)\nabla_\theta1
\
&=0.
\end{aligned}
\tag{[DERIVED]}
]

[
\boxed{
\mathbb E[u_tG_t]
=================

\mathbb E[u_t(G_t-b(s_t))]
}
]

[
\mathcal V_s(b)
===============

\mathbb E
\left[
|u_t|_2^2(G_t-b)^2
\mid s_t=s
\right].
]

[
\frac{\partial\mathcal V_s}{\partial b}
=======================================

-2
\mathbb E
[
|u_t|_2^2(G_t-b)
|s
].
]

[
\boxed{
b^\star(s)
==========

\frac{
\mathbb E[
|u_t|_2^2G_t|s_t=s]
}{
\mathbb E[
|u_t|_2^2|s_t=s]
}
}
\tag{[DERIVED]}
]

[
|u_t|*2^2
\perp*{\mathrm{approx}}
G_t
\mid s_t
\quad\Longrightarrow\quad
b^\star(s)
\approx
\mathbb E[G_t|s_t=s]
====================

V^\pi(s).
]

[
\boxed{
V^\pi(s)
;\text{is not universally the exact minimum-variance policy-gradient baseline;}
\quad
b^\star(s);\text{above is exact}.
}
\tag{[DERIVED]}
]

[
\boxed{\mathsf A_7:;\text{TD RESIDUAL}}
]

[
\boxed{
\delta_t^{V}
============

\tilde r_t
+
\gamma(1-d_t)V(s_{t+1})
-----------------------

V(s_t)
}
]

[
V=V^\pi
\quad\Longrightarrow\quad
\begin{aligned}
\mathbb E[
\delta_t^{V^\pi}|s_t,a_t]
&=
\mathbb E[
\tilde r_t+
\gamma V^\pi(s_{t+1})
|s_t,a_t]
---------

V^\pi(s_t)
\
&=
Q^\pi(s_t,a_t)-V^\pi(s_t)
\
&=
\boxed{
A^\pi(s_t,a_t)
}.
\end{aligned}
\tag{[DERIVED]}
]

// This TD-residual-to-advantage identity is the starting point of GAE. ([arXiv][4])

[
\boxed{\mathsf A_8:;k\text{-STEP ADVANTAGE}}
]

[
\hat A_t^{(1)}
==============

\delta_t.
]

[
\begin{aligned}
\hat A_t^{(2)}
&=
\delta_t+\gamma\delta_{t+1}
\
&=
-V(s_t)
+
\tilde r_t
+
\gamma\tilde r_{t+1}
+
\gamma^2V(s_{t+2}).
\end{aligned}
]

[
\begin{aligned}
\hat A_t^{(3)}
&=
\delta_t+\gamma\delta_{t+1}
+\gamma^2\delta_{t+2}
\
&=
-V(s_t)
+
\tilde r_t
+\gamma\tilde r_{t+1}
+\gamma^2\tilde r_{t+2}
+\gamma^3V(s_{t+3}).
\end{aligned}
]

[
\boxed{
\hat A_t^{(k)}
==============

\sum_{l=0}^{k-1}
\gamma^l\delta_{t+l}
====================

-V(s_t)
+
\sum_{l=0}^{k-1}
\gamma^l\tilde r_{t+l}
+
\gamma^kV(s_{t+k})
}
\tag{[DERIVED]}
]

[
\boxed{\mathsf A_9:;\text{GAE DERIVATION}}
]

[
\hat A_t^{\mathrm{GAE}(\gamma,\lambda)}
=======================================

(1-\lambda)
\sum_{k=1}^{\infty}
\lambda^{k-1}
\hat A_t^{(k)}.
]

[
\begin{aligned}
\hat A_t^{\mathrm{GAE}}
&=
(1-\lambda)
\sum_{k=1}^\infty
\lambda^{k-1}
\sum_{l=0}^{k-1}\gamma^l\delta_{t+l}
\
&=
(1-\lambda)
\sum_{l=0}^\infty
\gamma^l\delta_{t+l}
\sum_{k=l+1}^\infty
\lambda^{k-1}
\
&=
(1-\lambda)
\sum_{l=0}^\infty
\gamma^l\delta_{t+l}
\frac{\lambda^l}{1-\lambda}
\
&=
\boxed{
\sum_{l=0}^\infty
(\gamma\lambda)^l
\delta_{t+l}
}.
\end{aligned}
\tag{[REPORTED]+[DERIVED]}
]

// Original GAE derivation. ([arXiv][4])

[
\boxed{
\hat A_t
========

\delta_t
+
\gamma\lambda(1-d_t)\hat A_{t+1}
}
\tag{[DERIVED]}
]

[
\hat A_T=\delta_T.
]

[
\lambda=0
\quad\Longrightarrow\quad
\boxed{
\hat A_t=\delta_t
}
]

[
0<\lambda<1
\quad\Longrightarrow\quad
\boxed{
\hat A_t=
\delta_t+
\gamma\lambda\delta_{t+1}
+
(\gamma\lambda)^2\delta_{t+2}
+\cdots
}
]

[
\lambda=1
\quad\Longrightarrow\quad
\boxed{
\hat A_t
========

## \sum_{l=0}^{T-t}\gamma^l\tilde r_{t+l}

V(s_t)
}
]

[
\boxed{
\lambda=0:;\text{maximum bootstrap},
\qquad
\lambda=1:;\text{Monte-Carlo return minus baseline}
}
\tag{[REPORTED]}
]

[
\boxed{\mathsf A_{10}:;\text{BIAS--VARIANCE ANALYSIS}}
]

[
V(s)
====

V^\pi(s)+e(s).
]

[
\begin{aligned}
\delta_t^V
&=
\tilde r_t+
\gamma V^\pi(s_{t+1})-V^\pi(s_t)
\
&\quad
+
\gamma e(s_{t+1})-e(s_t).
\end{aligned}
]

[
\boxed{
\mathbb E[
\delta_t^V|s_t,a_t]
-------------------

# A^\pi(s_t,a_t)

\gamma
\mathbb E[e(s_{t+1})|s_t,a_t]
-----------------------------

e(s_t)
}
\tag{[DERIVED]}
]

[
\boxed{
\mathbb E[
\hat A_t^{(k)}|s_t,a_t]
-----------------------

# A^\pi(s_t,a_t)

\gamma^k
\mathbb E[e(s_{t+k})|s_t,a_t]
-----------------------------

e(s_t)
}
\tag{[DERIVED]}
]

[
\begin{aligned}
B_{\mathrm{GAE}}(s_t,a_t)
&=
\mathbb E[\hat A_t^{\mathrm{GAE}}|s_t,a_t]
------------------------------------------

A^\pi(s_t,a_t)
\
&=
-e(s_t)
\
&\quad+
(1-\lambda)
\sum_{k=1}^{\infty}
\lambda^{k-1}
\gamma^k
\mathbb E[e(s_{t+k})|s_t,a_t].
\end{aligned}
\tag{[DERIVED]}
]

[
\mathbb E[
u_t,e(s_t)
]
=0.
]

[
\boxed{
B_{\nabla J}^{\mathrm{GAE}}
\propto
(1-\lambda)
\sum_{k=1}^{\infty}
\lambda^{k-1}\gamma^k
\mathbb E
\left[
u_t
,e(s_{t+k})
\right]
}
\tag{[DERIVED]}
]

[
\lambda\uparrow1
\quad\Longrightarrow\quad
\text{bootstrap-error contribution}\downarrow
]

[
\lambda\downarrow0
\quad\Longrightarrow\quad
\text{bootstrap-error contribution}\uparrow.
]

[
G_t^{(k)}
=========

\sum_{l=0}^{k-1}\gamma^l\tilde r_{t+l}
+
\gamma^kV(s_{t+k}).
]

[
\begin{aligned}
\operatorname{Var}[G_t^{(k)}|s_t,a_t]
&=
\sum_{l=0}^{k-1}
\gamma^{2l}
\operatorname{Var}[\tilde r_{t+l}]
\
&\quad+
2
\sum_{0\le i<j<k}
\gamma^{i+j}
\operatorname{Cov}(\tilde r_{t+i},\tilde r_{t+j})
\
&\quad+
\gamma^{2k}\operatorname{Var}[V(s_{t+k})]
\
&\quad+
2\gamma^k
\sum_{l=0}^{k-1}
\gamma^l
\operatorname{Cov}
(\tilde r_{t+l},V(s_{t+k})).
\end{aligned}
\tag{[DERIVED]}
]

[
\boxed{
\text{weak/nonnegative covariance regime}
\Longrightarrow
k\uparrow
\Rightarrow
\text{more sampled reward noise}
\Rightarrow
\operatorname{Var}\uparrow
}
]

[
\boxed{
\lambda=0
:
\text{low variance / bootstrap-bias sensitive}
}
]

[
\boxed{
\lambda=1
:
\text{no }\lambda\text{-bootstrap bias in policy gradient}
/\text{high sampling variance}
}
]

// The original GAE paper explicitly states that (\lambda=0) has lower variance but bias under inaccurate (V), while (\lambda=1) is (\gamma)-just regardless of (V) and has higher variance. ([arXiv][4])

[
\boxed{\mathsf A_{11}:;\text{CRITIC TARGET / CRITIC UPDATE}}
]

[
v_{n,t}^{\mathrm{old}}
======================

\operatorname{sg}
\left(
V_{\psi_{\mathrm{old}}}(s_{n,t})
\right).
]

[
\boxed{
\hat V_{n,t}^{\mathrm{target}}
==============================

\operatorname{sg}
\left(
v_{n,t}^{\mathrm{old}}
+
\hat A_{n,t}
\right)
}
\tag{[DERIVED]}
]

[
\mathcal L_V(\psi)
==================

\frac{1}{|\mathcal M|}
\sum_{(n,t)\in\mathcal M}
\left[
V_\psi(s_{n,t})
---------------

\hat V_{n,t}^{\mathrm{target}}
\right]^2.
]

[
\boxed{
\nabla_\psi\mathcal L_V
=======================

\frac{2}{|\mathcal M|}
\sum_{(n,t)\in\mathcal M}
\left[
V_\psi(s_{n,t})-\hat V_{n,t}^{\mathrm{target}}
\right]
\nabla_\psi V_\psi(s_{n,t})
}
\tag{[DERIVED]}
]

[
\nabla_\psi
\hat V_{n,t}^{\mathrm{target}}
=0.
]

[
\boxed{
(\psi_q,m_q^\psi,v_q^\psi)
\xrightarrow{g_q^\psi}
(\psi_{q+1},m_{q+1}^\psi,v_{q+1}^\psi)
}
]

[
\boxed{
\text{OpenAI RLHF-specific value clipping}
==========================================

[\mathrm{UNDISCLOSED}]
}
]

[
\boxed{
\text{OpenAI RLHF-specific exact }V^{\mathrm{target}}
\text{ implementation}
======================

[\mathrm{UNDISCLOSED}]
}
]

// PPO's original actor-critic formulation specifies squared value error, but the OpenAI RLHF papers/released summarization repository do not disclose a value-clipped trainer implementation. ([arXiv][5])

[
\boxed{\mathsf A_{12}:;\text{POLICY-GRADIENT DERIVATION}}
]

[
J(\theta)
=========

\sum_\tau
p_\theta(\tau)R(\tau).
]

[
\begin{aligned}
\nabla_\theta J
&=
\sum_\tau
\nabla_\theta p_\theta(\tau)R(\tau)
\
&=
\sum_\tau
p_\theta(\tau)
\nabla_\theta\log p_\theta(\tau)
R(\tau)
\
&=
\mathbb E_{\tau\sim\pi_\theta}
[
R(\tau)
\nabla_\theta\log p_\theta(\tau)
].
\end{aligned}
]

[
p_\theta(\tau)
==============

p(s_1)
\prod_t
\pi_\theta(a_t|s_t)
P(s_{t+1}|s_t,a_t).
]

[
\nabla_\theta
\log p_\theta(\tau)
===================

\sum_t
\nabla_\theta
\log\pi_\theta(a_t|s_t).
]

[
\boxed{
\nabla_\theta J
===============

\mathbb E
\left[
\sum_t
\nabla_\theta\log\pi_\theta(a_t|s_t)
A^\pi(s_t,a_t)
\right]
}
\tag{[DERIVED]}
]

[
\boxed{
\nabla_\theta\pi_\theta(a|s)
============================

\pi_\theta(a|s)
\nabla_\theta\log\pi_\theta(a|s)
}
]

[
\hat g_{\mathrm{PG}}
====================

\frac{1}{M}
\sum_{i=1}^{M}
\nabla_\theta
\log\pi_\theta(a_i|s_i)
\operatorname{sg}(\hat A_i).
]

[
\boxed{\mathsf A_{13}:;\text{OLD/NEW IMPORTANCE RATIO}}
]

[
\boxed{
\rho_t(\theta)
==============

\frac{
\pi_\theta(a_t|s_t)
}{
\pi_{\theta_{\mathrm{old}}}(a_t|s_t)
}
}
\tag{[REPORTED:;PPO]}
]

[
\boxed{
\rho_t(\theta)
==============

\exp
\left[
\log\pi_\theta(a_t|s_t)
-----------------------

\operatorname{sg}
\left(
\log\pi_{\theta_{\mathrm{old}}}(a_t|s_t)
\right)
\right]
}
]

[
\nabla_\theta\rho_t
===================

\rho_t
\nabla_\theta
\log\pi_\theta(a_t|s_t).
]

[
\nabla_\theta
\log\pi_{\theta_{\mathrm{old}}}(a_t|s_t)
=0.
]

[
\theta_{\mathrm{old}}
;\text{fixed}
\quad\forall
(e,j)
\in
\text{epochs}\times\text{minibatches of }\mathcal B_k.
]

[
\boxed{
\mathcal B_k
\sim
\pi_{\theta_{\mathrm{old},k}}
\quad\land\quad
\theta_{\mathrm{old},k}\text{ fixed}
\quad\Longrightarrow\quad
\mathcal B_k
\text{ reusable for }K_{\mathrm{PPO}}\text{ optimization epochs}
}
\tag{[DERIVED]}
]

// PPO explicitly collects data with (\pi_{\theta_{\rm old}}), performs minibatch optimization for (K) epochs, and only then refreshes (\theta_{\rm old}\leftarrow\theta). ([arXiv][5])

[
\boxed{\mathsf A_{14}:;\text{PPO CLIPPING}}
]

[
L^{\mathrm{CPI}}(\theta)
========================

\mathbb E_t[
\rho_t(\theta)\hat A_t
].
]

[
\boxed{
L^{\mathrm{CLIP}}(\theta)
=========================

\mathbb E_t
\left[
\min
\left(
\rho_t\hat A_t,;
\operatorname{clip}
(\rho_t,1-\epsilon,1+\epsilon)
\hat A_t
\right)
\right]
}
\tag{[REPORTED:;PPO]}
]

// Original PPO clipped surrogate. ([arXiv][5])

[
\hat A_t>0:
\qquad
L_t^{\mathrm{CLIP}}
===================

\begin{cases}
\rho_t\hat A_t,
&
\rho_t\le1+\epsilon,
[1mm]
(1+\epsilon)\hat A_t,
&
\rho_t>1+\epsilon.
\end{cases}
]

[
\boxed{
\hat A_t>0,;\rho_t>1+\epsilon
\Longrightarrow
\frac{\partial L_t^{\mathrm{CLIP}}}{\partial\rho_t}=0
}
]

[
\hat A_t<0:
\qquad
L_t^{\mathrm{CLIP}}
===================

\begin{cases}
(1-\epsilon)\hat A_t,
&
\rho_t<1-\epsilon,
[1mm]
\rho_t\hat A_t,
&
\rho_t\ge1-\epsilon.
\end{cases}
]

[
\boxed{
\hat A_t<0,;\rho_t<1-\epsilon
\Longrightarrow
\frac{\partial L_t^{\mathrm{CLIP}}}{\partial\rho_t}=0
}
]

[
I_t^{\mathrm{active}}
=====================

\mathbf1
\left[
(\hat A_t\ge0\land\rho_t<1+\epsilon)
\lor
(\hat A_t<0\land\rho_t>1-\epsilon)
\right].
]

[
\boxed{
\nabla_\theta
L_t^{\mathrm{CLIP}}
===================

I_t^{\mathrm{active}}
\hat A_t
\rho_t
\nabla_\theta
\log\pi_\theta(a_t|s_t)
}
\quad
\text{away from clip boundaries}.
]

[
\boxed{
\mathcal L_\pi(\theta)
======================

*

L^{\mathrm{CLIP}}(\theta)
}
]

[
\boxed{
\nabla_\theta\mathcal L_\pi
===========================

*

\mathbb E_t
\left[
I_t^{\mathrm{active}}
\hat A_t\rho_t
\nabla_\theta\log\pi_\theta(a_t|s_t)
\right]
}
]

[
\boxed{
\underbrace{\epsilon_{\mathrm{PPO}}}*{\text{proximal optimization}}
\neq
\underbrace{\beta*{\mathrm{KL}}}_{\text{SFT/reference regularization}}
}
]

[
\boxed{\mathsf A_{15}:;\text{ACTOR BACKWARD / UPDATE}}
]

[
\mathcal L_{\pi}
\rightarrow
g_q^\theta
==========

\nabla_{\theta_q}\mathcal L_{\pi}.
]

[
\begin{aligned}
m_{q+1}^\theta
&=
\beta_1m_q^\theta
+
(1-\beta_1)g_q^\theta,
\
v_{q+1}^\theta
&=
\beta_2v_q^\theta
+
(1-\beta_2)
(g_q^\theta)^{\odot2},
\
\hat m_{q+1}^\theta
&=
\frac{m_{q+1}^\theta}
{1-\beta_1^{q+1}},
\
\hat v_{q+1}^\theta
&=
\frac{v_{q+1}^\theta}
{1-\beta_2^{q+1}},
\
\theta_{q+1}
&=
\theta_q
--------

\eta_q^\theta
\frac{\hat m_{q+1}^\theta}
{\sqrt{\hat v_{q+1}^\theta}+\epsilon_{\mathrm{opt}}}.
\end{aligned}
\tag{[DERIVED:;Adam;transition]}
]

[
\begin{aligned}
m_{q+1}^\psi
&=
\beta_1m_q^\psi+(1-\beta_1)g_q^\psi,
\
v_{q+1}^\psi
&=
\beta_2v_q^\psi+(1-\beta_2)(g_q^\psi)^{\odot2},
\
\psi_{q+1}
&=
\operatorname{Adam}
(
\psi_q,g_q^\psi,m_q^\psi,v_q^\psi
).
\end{aligned}
]

[
\boxed{
(m^\theta,v^\theta)
\neq
(m^\psi,v^\psi)
}
]

[
\boxed{
\nabla_{\theta_{\mathrm{old}}}=0,\quad
\nabla_{\theta_{\mathrm{ref}}}=0,\quad
\nabla_{\omega^\star}=0,\quad
\nabla_{\hat A}=0,\quad
\nabla_{\hat V^{\mathrm{target}}}=0.
}
]

[
\boxed{
\text{OpenAI RLHF gradient-norm clipping}
=========================================

[\mathrm{UNDISCLOSED}]
}
]

[
\boxed{
\text{OpenAI RLHF advantage whitening/normalization}
====================================================

[\mathrm{UNDISCLOSED}]
}
]

[
\boxed{
\text{OpenAI RLHF actor entropy coefficient}
============================================

[\mathrm{UNDISCLOSED}]
}
]

// PPO permits entropy augmentation, but that does not establish its use in the OpenAI RLHF experiments. ([arXiv][5])

[
\boxed{\mathsf A_{16}:;\text{PPO EPOCH / MINIBATCH EXECUTION}}
]

[
\boxed{
t
\subset
n
\subset
\mathcal B_k
\subset
k
}
]

[
\boxed{
\mathcal B_k
\rightarrow
{
\mathcal M_{k,e,j}
}
*{e=1,\ldots,K*{\mathrm{PPO}};
,j=1,\ldots,J}
}
]

[
\begin{aligned}
k&=\text{outer rollout/update iteration},
\
n&=\text{trajectory/episode index},
\
t&=\text{generated-token index},
\
e&=\text{PPO epoch},
\
j&=\text{minibatch index}.
\end{aligned}
]

[
\boxed{
\forall(e,j):
\quad
\theta_{\mathrm{old},k},
\theta_{\mathrm{ref}},
\omega^\star,
\hat A_k,
\hat V_k^{\mathrm{target}}
;\text{constant}
}
]

[
\begin{aligned}
\theta_{k,0,0}
&=\theta_k,
\
\theta_{k,e,j+1}
&=
\operatorname{Optimizer}*\theta
(
\theta*{k,e,j},
\nabla_\theta\mathcal L_{\pi,k,e,j}
),
\
\psi_{k,e,j+1}
&=
\operatorname{Optimizer}*\psi
(
\psi*{k,e,j},
\nabla_\psi\mathcal L_{V,k,e,j}
),
\
(\theta_{k+1},\psi_{k+1})
&=
(\theta_{k,K,J},\psi_{k,K,J}),
\
\theta_{\mathrm{old},k+1}
&\leftarrow
\operatorname{sg}(\theta_{k+1}).
\end{aligned}
]

[
\boxed{\mathsf A_{17}:;\text{OPENAI SUMMARIZATION INSTANCE}}
]

// All quantities in this block are experiment-specific to *Learning to Summarize from Human Feedback*. ([arXiv][2])

[
\boxed{
\begin{aligned}
|\theta|
&\in{1.3\mathrm B,;6.7\mathrm B},
\
|\omega|
&=|\theta|,
\
|\psi|
&=|\theta|,
\
\theta_0
&\leftarrow\theta_{\mathrm{SFT}},
\
\psi_0
&\leftarrow\omega^\star,
\
\theta_{\mathrm{ref}}
&=\theta_{\mathrm{SFT}},
\
\gamma&=1,
\
\lambda&=0.95,
\
\beta_{\mathrm{KL}}&=0.05,
\
K_{\mathrm{PPO}}&=4,
\
N_{\mathrm{episodes}}&=10^6.
\end{aligned}
}
\tag{[REPORTED]}
]

[
B_{\mathrm{PPO}}
================

\begin{cases}
512,&1.3\mathrm B,\
256,&6.7\mathrm B.
\end{cases}
\tag{[REPORTED]}
]

[
\eta_{\mathrm{PPO},0}
=====================

\begin{cases}
1.5\times10^{-5},&1.3\mathrm B,\
7\times10^{-6},&6.7\mathrm B,
\end{cases}
\qquad
\eta_{\mathrm{PPO}};\text{linear decay}.
\tag{[REPORTED]}
]

[
\boxed{
\text{paper does not separately attribute }
\eta_{\pi}
\text{ versus }
\eta_V
======

[\mathrm{UNDISCLOSED}]
}
]

[
\epsilon_{\mathrm{clip}}
========================

[\mathrm{UNDISCLOSED}].
]

[
B_{\mathrm{minibatch}}
======================

[\mathrm{UNDISCLOSED}].
]

[
\begin{aligned}
\omega_0
&\leftarrow
\theta_{\mathrm{SFT}}
+
\text{scalar reward head},
\
w_{\mathrm{head}}
&\sim
\mathcal N
\left(
0,\frac{1}{d_{\mathrm{model}}+1}
\right),
\
E_{\mathrm{RM}}
&=1,
\
B_{\mathrm{RM}}
&=64,
\
\eta_{\mathrm{RM}}
&=
\begin{cases}
1.5\times10^{-5},&1.3\mathrm B,\
5\times10^{-6},&6.7\mathrm B.
\end{cases}
\end{aligned}
\tag{[REPORTED]}
]

[
\boxed{
\mathbb E_{\text{reference summaries}}
[
\bar r_{\omega^\star}(x,y)
]
=0
}
\tag{[REPORTED]}
]

[
\boxed{
\tilde r_t
==========

-;0.05
\log
\frac{
\pi_{\mathrm{old}}(a_t|s_t)
}{
\pi_{\mathrm{SFT}}(a_t|s_t)
}
+
\mathbf1[t=T],r_{\omega^\star}(x,y)
}
\tag{[REPORTED]+[DERIVED]}
]

[
\boxed{
a_T=\mathrm{EOS},
\qquad
r_{\omega^\star}
\text{ occurs only for complete summary},
\qquad
\gamma=1.
}
\tag{[REPORTED]}
]

[
\boxed{
\text{Optimizer family}=\mathrm{Adam},
\qquad
(\beta_1,\beta_2,\epsilon_{\mathrm{opt}})
=========================================

[\mathrm{UNDISCLOSED;in;paper}]
}
]

// Summarization reports fp16 activations and predominantly fp32 weights for RL/RM models, but these numerical-storage choices do not determine undisclosed PPO optimizer internals. ([arXiv][2])

[
\boxed{\mathsf A_{18}:;\text{OPENAI INSTRUCTGPT INSTANCE}}
]

// All quantities in this block are experiment-specific to *Training Language Models to Follow Instructions with Human Feedback*. ([arXiv][3])

[
\boxed{
|\theta|
\in
{1.3\mathrm B,;6\mathrm B,;175\mathrm B}
}
\tag{[REPORTED]}
]

[
\boxed{
|\omega|=6\mathrm B,
\qquad
|\psi|=6\mathrm B
\quad
\forall |\theta|\in{1.3B,6B,175B}.
}
\tag{[REPORTED]}
]

[
\begin{aligned}
\theta_0
&\leftarrow
\theta_{\mathrm{SFT+PTX;init}},
\
\theta_{\mathrm{ref}}
&=
\theta_{\mathrm{SFT+PTX;init}},
\
\psi_0
&\leftarrow
\omega^\star.
\end{aligned}
\tag{[REPORTED]}
]

[
\boxed{
\beta_{\mathrm{KL}}=0.02
}
\tag{[REPORTED]}
]

[
\boxed{
N_{\mathrm{episodes}}=256000
}
\tag{[REPORTED]}
]

[
\boxed{
B_{\mathrm{rollout}}=512,
\qquad
B_{\mathrm{minibatch}}=64,
\qquad
J=8,
\qquad
K_{\mathrm{PPO}}=1.
}
\tag{[REPORTED]}
]

[
\boxed{
\gamma_{\mathrm{GAE}}=1
}
\tag{[REPORTED]}
]

[
\boxed{
\lambda_{\mathrm{GAE}}
======================

[\mathrm{UNDISCLOSED}]
}
]

[
\boxed{
\epsilon_{\mathrm{clip}}=0.2
}
\tag{[REPORTED]}
]

[
T_{\mathrm{rollout}}=1
\tag{[REPORTED:;sampling;temperature]}
]

[
\boxed{
\alpha_{\mathrm{EMA}}=0.992
}
\tag{[REPORTED]}
]

[
\bar\theta_{q+1}
================

0.992,\bar\theta_q
+
0.008,\theta_{q+1}.
\tag{[DERIVED]}
]

[
\eta_V
======

\begin{cases}
9\times10^{-6},
&
|\theta|\in{1.3B,6B},
\
5\times10^{-6},
&
|\theta|=175B.
\end{cases}
\tag{[REPORTED]}
]

[
\boxed{
\eta_\pi^{\mathrm{final}}
=========================

[\mathrm{UNDISCLOSED;textually}]
}
]

[
\eta_\pi^{\mathrm{sweep}}
\in
[2.55\times10^{-6},2.55\times10^{-5}]
\quad
\text{for }1.3B,6B.
\tag{[REPORTED]}
]

// The paper reports the LR sweep and states that final checkpoints were selected by human Likert score, but does not textually map a unique final policy LR to every released experiment. ([arXiv][3])

[
\begin{aligned}
|\omega|
&=6B,
\
E_{\mathrm{RM}}
&=1,
\
B_{\mathrm{RM}}
&=64,
\
\eta_{\mathrm{RM},0}
&=9\times10^{-6},
\
\eta_{\mathrm{RM,end}}
&=0.1,\eta_{\mathrm{RM},0}.
\end{aligned}
\tag{[REPORTED]}
]

[
\boxed{
\mathbb E_{\text{labeler demonstrations}}
[
\bar r_{\omega^\star}
]=0
}
\tag{[REPORTED]}
]

[
\boxed{
(\beta_1,\beta_2)_{\mathrm{Adam}}
=================================

(0.9,0.95)
}
\tag{[REPORTED]}
]

// InstructGPT states fp16 weights/activations with fp32 master weights and Adam with ((0.9,0.95)). ([arXiv][3])

[
\epsilon_{\mathrm{Adam}}
========================

[\mathrm{UNDISCLOSED}].
]

[
\boxed{
\tilde r_t
==========

-0.02
\log
\frac{
\pi_{\mathrm{old}}(a_t|s_t)
}{
\pi_{\mathrm{ref}}(a_t|s_t)
}
+
\mathbf1[t=T],
\bar r_{\omega^\star}(x,y)
}
\tag{[REPORTED]+[DERIVED]}
]

[
\boxed{
\text{value clipping}
=====================

# \text{entropy coefficient}

# \text{advantage normalization}

# \text{gradient clipping}

[\mathrm{UNDISCLOSED}]
}
]

[
\boxed{\mathsf A_{19}:;\text{PPO-PTX}}
]

[
\boxed{
J_{\mathrm{PPO\text{-}ptx}}(\theta)
===================================

J_{\mathrm{RLHF}}(\theta)
+
\gamma_{\mathrm{ptx}}
J_{\mathrm{pretrain}}(\theta)
}
\tag{[REPORTED]}
]

[
\begin{aligned}
J_{\mathrm{RLHF}}
&=
\mathbb E_{(x,y)\sim\pi_\theta}
\left[
r_{\omega^\star}(x,y)
---------------------

\beta
\log
\frac{\pi_\theta(y|x)}
{\pi_{\mathrm{ref}}(y|x)}
\right],
\
J_{\mathrm{pretrain}}
&=
\mathbb E_{u\sim\mathcal D_{\mathrm{pretrain}}}
[
\log\pi_\theta(u)
].
\end{aligned}
]

// This objective is directly reported in InstructGPT Equation 2. ([arXiv][3])

[
\boxed{
\gamma_{\mathrm{ptx}}=27.8
}
\tag{[REPORTED]}
]

[
\boxed{
N_{\mathrm{PTX\ examples}}
==========================

8,
N_{\mathrm{RL\ episodes}}
}
\tag{[REPORTED]}
]

[
\mathcal L_{\mathrm{PTX}}
=========================

*

\mathbb E_{u\sim\mathcal D_{\mathrm{pretrain}}}
\log\pi_\theta(u).
]

[
\begin{aligned}
g_{\mathrm{PPO}}
&=
\nabla_\theta\mathcal L_\pi,
\
g_{\mathrm{PTX}}
&=
\nabla_\theta\mathcal L_{\mathrm{PTX}},
\
\boxed{
g_{\mathrm{total}}
==================

g_{\mathrm{PPO}}
+
27.8,g_{\mathrm{PTX}}
}.
\end{aligned}
\tag{[REPORTED]+[DERIVED]}
]

[
\boxed{
\text{PPO gradient}
\neq
\text{pretraining LM gradient}
}
]

[
\begin{aligned}
g_{\mathrm{buffer}}
&\leftarrow0,
\
g_{\mathrm{buffer}}
&\leftarrow
g_{\mathrm{buffer}}
+
g_{\mathrm{PPO}},
\
g_{\mathrm{buffer}}
&\leftarrow
g_{\mathrm{buffer}}
+
27.8g_{\mathrm{PTX}},
\
\theta'
&\leftarrow
\operatorname{Optimizer}
(\theta,g_{\mathrm{buffer}}).
\end{aligned}
\tag{[REPORTED]+[DERIVED]}
]

// InstructGPT explicitly reports computing PPO and pretraining gradients consecutively for each minibatch and accumulating both into the gradient buffers. ([arXiv][3])

[
\boxed{\mathsf A_{20}:;\text{COMPLETE EXECUTABLE TRAINING LOOP}}
]

[
\boxed{
\begin{aligned}
&\texttt{INPUT:}\quad
\mathcal D_{\mathrm{prompt}},
\mathcal D_{\mathrm{pref}},
\theta_{\mathrm{SFT}},
\beta,\gamma,\lambda,\epsilon
[1mm]
&\texttt{RM-TRAIN:}
\
&\qquad
\omega_0
\leftarrow
\operatorname{InitRM}(\theta_{\mathrm{SFT}})
\
&\qquad
\texttt{for RM update }q:
\
&\qquad\qquad
(x,y^w,y^l)\sim\mathcal D_{\mathrm{pref}}
\
&\qquad\qquad
\Delta_q
\leftarrow
r_{\omega_q}(x,y^w)
-------------------

r_{\omega_q}(x,y^l)
\
&\qquad\qquad
\mathcal L_{\mathrm{RM}}
\leftarrow
-\log\sigma(\Delta_q)
\
&\qquad\qquad
g_q^\omega
\leftarrow
\nabla_{\omega_q}\mathcal L_{\mathrm{RM}}
\
&\qquad\qquad
\omega_{q+1}
\leftarrow
\operatorname{Optimizer}*\omega
(\omega_q,g_q^\omega)
\
&\qquad
\texttt{end}
[1mm]
&\qquad
\omega^\star
\leftarrow
\operatorname{sg}
(
\operatorname{CenterRM}(\omega_Q)
)
[2mm]
&\texttt{INITIALIZE-PPO:}
\
&\qquad
\theta_0
\leftarrow
\theta*{\mathrm{RL\ init}}
\
&\qquad
\theta_{\mathrm{ref}}
\leftarrow
\operatorname{sg}(\theta_{\mathrm{RL\ init}})
\
&\qquad
\psi_0
\leftarrow
\operatorname{InitValue}(\omega^\star)
\
&\qquad
m_0^\theta=v_0^\theta=m_0^\psi=v_0^\psi=0
[2mm]
&\texttt{for outer PPO iteration }k=0,\ldots,K-1:
\
&\qquad
\theta_{\mathrm{old},k}
\leftarrow
\operatorname{sg}(\theta_k)
\
&\qquad
\psi_{\mathrm{old},k}
\leftarrow
\operatorname{sg}(\psi_k)
[1mm]
&\qquad
\texttt{ROLLOUT:}
\
&\qquad
\texttt{for episode }n=1,\ldots,B_k:
\
&\qquad\qquad
x_n\sim\mathcal D_{\mathrm{prompt}}
\
&\qquad\qquad
s_{n,1}\leftarrow(x_n,\varnothing)
\
&\qquad\qquad
\texttt{for token }t=1,\ldots,T_n:
\
&\qquad\qquad\qquad
h_{n,t}
\leftarrow
f_{\theta_{\mathrm{old},k}}(s_{n,t})
\
&\qquad\qquad\qquad
z_{n,t}
\leftarrow
W_Uh_{n,t}+b_U
\
&\qquad\qquad\qquad
a_{n,t}
\sim
\operatorname{softmax}(z_{n,t})
\
&\qquad\qquad\qquad
\ell^{\mathrm{old}}*{n,t}
\leftarrow
\log\pi*{\mathrm{old},k}(a_{n,t}|s_{n,t})
\
&\qquad\qquad\qquad
\ell^{\mathrm{ref}}*{n,t}
\leftarrow
\log\pi*{\mathrm{ref}}(a_{n,t}|s_{n,t})
\
&\qquad\qquad\qquad
v^{\mathrm{old}}*{n,t}
\leftarrow
V*{\psi_{\mathrm{old},k}}(s_{n,t})
\
&\qquad\qquad\qquad
s_{n,t+1}
\leftarrow
(x_n,y_{n,\le t})
\
&\qquad\qquad
\texttt{end}
\
&\qquad\qquad
r_n^{\mathrm{RM}}
\leftarrow
\operatorname{sg}
\left(
r_{\omega^\star}(x_n,y_n)
\right)
\
&\qquad
\texttt{end}
[1mm]
&\qquad
\texttt{REWARD:}
\
&\qquad
\tilde r_{n,t}
\leftarrow
-\beta
\left(
\ell^{\mathrm{old}}_{n,t}
-------------------------

\ell^{\mathrm{ref}}*{n,t}
\right)
+
\mathbf1[t=T_n]r_n^{\mathrm{RM}}
[1mm]
&\qquad
\texttt{GAE-REVERSE:}
\
&\qquad
\hat A*{n,T_n+1}\leftarrow0
\
&\qquad
\texttt{for }t=T_n,\ldots,1:
\
&\qquad\qquad
\delta_{n,t}
\leftarrow
\tilde r_{n,t}
+
\gamma(1-d_{n,t})
v_{n,t+1}^{\mathrm{old}}
------------------------

v_{n,t}^{\mathrm{old}}
\
&\qquad\qquad
\hat A_{n,t}
\leftarrow
\delta_{n,t}
+
\gamma\lambda(1-d_{n,t})
\hat A_{n,t+1}
\
&\qquad\qquad
\hat V_{n,t}^{\mathrm{target}}
\leftarrow
\operatorname{sg}
\left(
v_{n,t}^{\mathrm{old}}+\hat A_{n,t}
\right)
\
&\qquad
\texttt{end}
[1mm]
&\qquad
\mathcal B_k
\leftarrow
{
s,a,\ell^{\mathrm{old}},\ell^{\mathrm{ref}},
\hat A,\hat V^{\mathrm{target}}
}
[2mm]
&\qquad
\texttt{for PPO epoch }e=1,\ldots,K_{\mathrm{PPO}}:
\
&\qquad\qquad
\operatorname{Shuffle}(\mathcal B_k)
\
&\qquad\qquad
\texttt{for minibatch }\mathcal M_{e,j}\subset\mathcal B_k:
\
&\qquad\qquad\qquad
\ell^\theta_{n,t}
\leftarrow
\log\pi_\theta(a_{n,t}|s_{n,t})
\
&\qquad\qquad\qquad
\rho_{n,t}
\leftarrow
\exp(
\ell^\theta_{n,t}
-----------------

\operatorname{sg}(\ell^{\mathrm{old}}*{n,t})
)
\
&\qquad\qquad\qquad
L*{n,t}^{\mathrm{clip}}
\leftarrow
\min
\left[
\rho_{n,t}\hat A_{n,t},
\operatorname{clip}
(\rho_{n,t},1-\epsilon,1+\epsilon)
\hat A_{n,t}
\right]
\
&\qquad\qquad\qquad
\mathcal L_\pi
\leftarrow
-\frac1{|\mathcal M|}
\sum_{(n,t)\in\mathcal M}
L_{n,t}^{\mathrm{clip}}
\
&\qquad\qquad\qquad
\mathcal L_V
\leftarrow
\frac1{|\mathcal M|}
\sum_{(n,t)\in\mathcal M}
\left(
V_\psi(s_{n,t})
---------------

\hat V_{n,t}^{\mathrm{target}}
\right)^2
\
&\qquad\qquad\qquad
g^\theta
\leftarrow
\nabla_\theta\mathcal L_\pi
\
&\qquad\qquad\qquad
g^\psi
\leftarrow
\nabla_\psi\mathcal L_V
\
&\qquad\qquad\qquad
\texttt{if PPO-ptx:}
\
&\qquad\qquad\qquad\qquad
u\sim\mathcal D_{\mathrm{pretrain}}
\
&\qquad\qquad\qquad\qquad
g^{\mathrm{ptx}}
\leftarrow
\nabla_\theta
\left[
-\log\pi_\theta(u)
\right]
\
&\qquad\qquad\qquad\qquad
g^\theta
\leftarrow
g^\theta
+
\gamma_{\mathrm{ptx}}g^{\mathrm{ptx}}
\
&\qquad\qquad\qquad
(\theta,m^\theta,v^\theta)
\leftarrow
\operatorname{Optimizer}*\theta
(\theta,m^\theta,v^\theta,g^\theta)
\
&\qquad\qquad\qquad
(\psi,m^\psi,v^\psi)
\leftarrow
\operatorname{Optimizer}*\psi
(\psi,m^\psi,v^\psi,g^\psi)
\
&\qquad\qquad
\texttt{end}
\
&\qquad
\texttt{end}
[1mm]
&\qquad
\theta_{k+1}
\leftarrow\theta
,\qquad
\psi_{k+1}\leftarrow\psi
\
&\texttt{end}
\end{aligned}
}
]

[
\boxed{
\mathcal S_k
\xrightarrow{\mathrm{snapshot}}
(\theta_{\mathrm{old}},\psi_{\mathrm{old}})
\xrightarrow{\mathrm{rollout}}
\mathcal B_k
\xrightarrow{\mathrm{RM+KL}}
\tilde r
\xrightarrow{\mathrm{TD}}
\delta
\xrightarrow{\mathrm{GAE}}
\hat A
\xrightarrow{\mathrm{target}}
\hat V
\xrightarrow{\mathrm{PPO}}
(g_\theta,g_\psi)
\xrightarrow{\mathrm{optimizer}}
\mathcal S_{k+1}
}
]

[
\boxed{\mathsf A_{21}:;\text{FORWARD}\rightarrow\text{BACKWARD STATE TRANSITION}}
]

[
\boxed{
\begin{aligned}
s_t
&\rightarrow
h_t^\theta
\in\mathbb R^{d_{\mathrm{model}}}
\
&\rightarrow
z_t^\theta
\in\mathbb R^{|\mathcal V|}
\
&\rightarrow
\pi_\theta(\cdot|s_t)
\
&\rightarrow
\ell_t^\theta
=============

\log\pi_\theta(a_t|s_t)
\
&\rightarrow
\rho_t
======

e^{\ell_t^\theta-\ell_t^{\mathrm{old}}}
\
&\rightarrow
L_t^{\mathrm{CLIP}}
\
&\rightarrow
\mathcal L_\pi
\
&\rightarrow
\nabla_\theta\mathcal L_\pi
\
&\rightarrow
(m^\theta,v^\theta)
\
&\rightarrow
\theta^+
\end{aligned}
}
]

[
\boxed{
\begin{aligned}
s_t
&\rightarrow
h_t^\psi
\
&\rightarrow
V_\psi(s_t)
\
&\rightarrow
\left(
V_\psi(s_t)
-----------

\operatorname{sg}
[
V_{\psi_{\mathrm{old}}}(s_t)+\hat A_t
]
\right)^2
\
&\rightarrow
\mathcal L_V
\
&\rightarrow
\nabla_\psi\mathcal L_V
\
&\rightarrow
(m^\psi,v^\psi)
\
&\rightarrow
\psi^+
\end{aligned}
}
]

[
\boxed{
\begin{aligned}
(x,y)
&\rightarrow
r_{\omega^\star}(x,y)
\
s_t
&\rightarrow
\ell_t^{\mathrm{old}},
\ell_t^{\mathrm{ref}}
\
&\rightarrow
\tilde r_t
\
&\rightarrow
\delta_t
\
&\rightarrow
\hat A_t
\
&\rightarrow
\hat V_t^{\mathrm{target}}
\end{aligned}
}
]

[
\boxed{
\begin{array}{c|c}
\text{quantity} & \text{gradient during PPO}\
\hline
\ell_t^\theta & \checkmark\
V_\psi(s_t)&\checkmark\
\ell_t^{\mathrm{old}}&0\
\ell_t^{\mathrm{ref}}&0\
r_{\omega^\star}&0\
\tilde r_t&0\
\hat A_t&0\
\hat V_t^{\mathrm{target}}&0
\end{array}
}
]

[
\boxed{\mathsf A_{22}:;\text{BIAS / VARIANCE / STABILITY SUMMARY}}
]

[
\boxed{
\begin{array}{c|c|c}
\text{mechanism}
&
\text{mathematical control}
&
\text{failure if conflated/removed}
\
\hline
\pi_{\mathrm{ref}}
&
-\beta\log(\pi_{\mathrm{RL}}/\pi_{\mathrm{ref}})
&
\text{reference drift}
\
\pi_{\mathrm{old}}
&
\rho=\pi_\theta/\pi_{\mathrm{old}}
&
\text{invalid sample-reuse geometry}
\
\epsilon
&
\rho\in[1-\epsilon,1+\epsilon]
\text{ favorable-update saturation}
&
\text{oversized PPO update incentive}
\
V_\psi
&
G_t-V_\psi(s_t)
&
\text{high-gradient variance}
\
\lambda
&
\sum_l(\gamma\lambda)^l\delta_{t+l}
&
\text{bootstrap-bias / return-variance tradeoff}
\
\gamma
&
\text{temporal discount}
&
\text{credit-horizon modification}
\
\mathrm{RM}
&
r_{\omega^\star}(x,y)
&
\text{learned preference objective absent}
\
\mathrm{PPO!-!PTX}
&
g_{\mathrm{PPO}}+\gamma_{\mathrm{ptx}}g_{\mathrm{PTX}}
&
\text{pretraining-capability regression mitigation}
\end{array}
}
]

[
\boxed{
\pi_{\mathrm{old}}
\neq
\pi_{\mathrm{ref}}
}
]

[
\boxed{
\epsilon_{\mathrm{PPO}}
\neq
\beta_{\mathrm{KL}}
}
]

[
\boxed{
\text{PPO clipping}
\neq
\text{reference KL regularization}
}
]

[
\boxed{
\text{RM terminal reward}
\neq
\text{tokenwise KL shaping}
}
]

[
\boxed{
\text{actor gradient}
\neq
\text{critic gradient}
\neq
\text{PTX gradient}
}
]

[
\boxed{
\lambda_{\mathrm{Summarization}}=0.95
\qquad\neq\qquad
\lambda_{\mathrm{InstructGPT}}
==============================

[\mathrm{UNDISCLOSED}]
}
]

[
\boxed{
\epsilon_{\mathrm{Summarization}}
=================================

[\mathrm{UNDISCLOSED}]
\qquad\neq\qquad
\epsilon_{\mathrm{InstructGPT}}=0.2
}
]

[
\boxed{
\beta_{\mathrm{Summarization}}=0.05
\qquad\neq\qquad
\beta_{\mathrm{InstructGPT}}=0.02
}
]

[
\boxed{
K_{\mathrm{Summarization}}=4
\qquad\neq\qquad
K_{\mathrm{InstructGPT}}=1
}
]

[
\boxed{
N_{\mathrm{episodes}}^{\mathrm{Summarization}}
=10^6
\qquad\neq\qquad
N_{\mathrm{episodes}}^{\mathrm{InstructGPT}}
=256000
}
]

// Experiment-specific values above are reported independently and must not be transferred across the two OpenAI training runs. ([arXiv][2])

[
\boxed{
\begin{aligned}
C_1&:\nabla_\theta\mathcal L_\pi;\checkmark,
&
C_2&:\nabla_\psi\mathcal L_V;\checkmark,
\
C_3&:\nabla_{\theta_{\mathrm{old}}}=0;\checkmark,
&
C_4&:\nabla_{\theta_{\mathrm{ref}}}=0;\checkmark,
\
C_5&:\nabla_{\omega^\star}=0;\checkmark,
&
C_6&:\tilde r\rightarrow\delta\rightarrow\hat A;\checkmark,
\
C_7&:\hat A\rightarrow\mathcal L_\pi;\checkmark,
&
C_8&:\hat V\rightarrow\mathcal L_V;\checkmark,
\
C_9&:\mathcal L\rightarrow g\rightarrow\mathrm{Optimizer};\checkmark,
&
C_{10}&:\pi_{\mathrm{old}}\neq\pi_{\mathrm{ref}};\checkmark,
\
C_{11}&:
\mathcal S_k\rightarrow\mathcal S_{k+1};\checkmark,
&
C_{12}&:
\operatorname{Evidence}(x)=\varnothing
\Rightarrow x=[\mathrm{UNDISCLOSED}]
;\checkmark.
\end{aligned}
}
]

[1]: https://github.com/openai/summarize-from-feedback "https://github.com/openai/summarize-from-feedback"
[2]: https://arxiv.org/pdf/2009.01325 "https://arxiv.org/pdf/2009.01325"
[3]: https://arxiv.org/pdf/2203.02155 "https://arxiv.org/pdf/2203.02155"
[4]: https://arxiv.org/pdf/1506.02438 "https://arxiv.org/pdf/1506.02438"
[5]: https://arxiv.org/pdf/1707.06347 "https://arxiv.org/pdf/1707.06347"
