# Flow Matching for Generative Modeling

In-depth analysis of the Flow Matching training algorithm

### Evidence labels

* **[REPORTED]** Explicitly stated or proved in an allowed paper or supplement.
* **[CODE-VERIFIED]** Directly observed in official or author-released implementation code/documentation.
* **[DERIVED]** Follows algebraically or numerically from reported premises.
* **[UNDISCLOSED]** Not specified or proved in the admissible evidence.

---

# 1. Unified transport formulation

## 1.1 Endpoint distributions and couplings

**[DERIVED]** Let

[
p_0,p_1\in\mathcal P(\mathbb R^d)
]

denote the base and target distributions. A coupling is

[
\pi\in\Pi(p_0,p_1)
==================

\left{
\pi:
\int \pi(dx_0,dx_1)=1,;
\pi(\cdot,\mathbb R^d)=p_0,;
\pi(\mathbb R^d,\cdot)=p_1
\right}.
]

Sample

[
(X_0,X_1)\sim\pi.
]

The independent coupling is

[
\pi_{\mathrm{ind}}(dx_0,dx_1)
=============================

p_0(dx_0)p_1(dx_1).
]

**[REPORTED]** Rectified Flow permits an arbitrary initial coupling between (X_0) and (X_1). The original stochastic-interpolants paper samples its endpoints independently from (\rho_0) and (\rho_1). Flow Matching samples target data and conditional-path noise independently in its standard conditional construction. ([ar5iv][3])

## 1.2 Random interpolation

**[DERIVED]** Let (Z\sim q) collect all latent randomness, commonly

[
Z=(X_0,X_1),\qquad (X_0,X_1)\sim\pi.
]

Define a differentiable interpolant

[
X_t=I_t(Z),\qquad t\in[0,1],
]

with endpoint constraints

[
I_0(Z)=X_0,\qquad I_1(Z)=X_1.
]

Its pathwise velocity is

[
\dot X_t
========

\partial_t I_t(Z).
]

The interpolant induces a marginal density

[
p_t(x)
======

\mathbb E_Z\left[\delta(x-I_t(Z))\right].
]

## 1.3 Probability current and continuity equation

**[DERIVED]** Define the probability current

[
j_t(x)
======

\mathbb E_Z
\left[
\dot X_t,\delta(x-X_t)
\right].
]

For a compactly supported smooth test function (\varphi),

[
\begin{aligned}
\frac{d}{dt}
\int_{\mathbb R^d}\varphi(x)p_t(x),dx
&=
\frac{d}{dt}\mathbb E[\varphi(X_t)]\
&=
\mathbb E[
\nabla\varphi(X_t)^\top \dot X_t
]\
&=
\int\nabla\varphi(x)^\top j_t(x),dx\
&=
-\int\varphi(x)\nabla\cdot j_t(x),dx.
\end{aligned}
]

Therefore, in the distributional sense,

[
\boxed{
\partial_t p_t(x)+\nabla\cdot j_t(x)=0.
}
]

**[REPORTED]** This density/current construction and the associated continuity equation are explicit in the stochastic-interpolants formulation and underlie the conditional-to-marginal construction in Flow Matching. ([arXiv][4])

## 1.4 Marginal velocity field

**[DERIVED]** Wherever (p_t(x)>0), define

[
u_t(x)
======

\frac{j_t(x)}{p_t(x)}.
]

Then

[
\partial_t p_t+\nabla\cdot(p_tu_t)=0.
]

Using regular conditional expectation,

[
\begin{aligned}
j_t(x)
&=
p_t(x)
\mathbb E[
\dot X_t\mid X_t=x
],
\end{aligned}
]

hence

[
\boxed{
u_t(x)
======

\mathbb E[
\dot X_t\mid X_t=x
].
}
]

This is the central identity shared by all three methods.

## 1.5 Simulation-free quadratic regression

**[DERIVED]** Let the neural field be

[
v_\theta:\mathbb R^d\times[0,1]\rightarrow\mathbb R^d.
]

Define

[
\mathcal L_{\mathrm{path}}(\theta)
==================================

\mathbb E_{t,Z}
\left[
\left|
v_\theta(X_t,t)-\dot X_t
\right|_2^2
\right].
]

Conditioning on (X_t),

[
\begin{aligned}
\mathcal L_{\mathrm{path}}
&=
\mathbb E
\left[
\left|
v_\theta(X_t,t)-u_t(X_t)
+
u_t(X_t)-\dot X_t
\right|^2
\right]\
&=
\mathbb E
\left[
\left|
v_\theta(X_t,t)-u_t(X_t)
\right|^2
\right]\
&\quad+
\mathbb E
\left[
\left|
\dot X_t-u_t(X_t)
\right|^2
\right]\
&\quad+
2\mathbb E
\left[
\left(v_\theta-u_t\right)^\top
\left(u_t-\dot X_t\right)
\right].
\end{aligned}
]

The cross-term is zero because

[
\mathbb E[
u_t(X_t)-\dot X_t
\mid X_t
]=0.
]

Therefore,

[
\boxed{
\mathcal L_{\mathrm{path}}(\theta)
==================================

\mathbb E
\left[
|v_\theta(X_t,t)-u_t(X_t)|^2
\right]
+
\mathcal R_{\mathrm{irr}},
}
]

where

[
\mathcal R_{\mathrm{irr}}
=========================

\mathbb E[
\operatorname{Var}(\dot X_t\mid X_t)
]
]

is independent of (\theta).

Consequently,

[
\boxed{
v_{\theta^\star}(x,t)=u_t(x)
}
]

for an unrestricted function class, almost everywhere under (p_t(x),dt).

**[DERIVED]** This is an (L^2)-orthogonal projection:

[
u_t(X_t)
========

\operatorname{Proj}_{\sigma(X_t,t)}
\dot X_t.
]

The irreducible residual measures path-crossing ambiguity: multiple latent endpoint pairs may pass through the same ((x,t)) with different velocities.

## 1.6 Equivalent linear-quadratic functional

**[DERIVED]** Expanding the regression loss gives

[
\mathcal L_{\mathrm{path}}(\theta)
==================================

\mathbb E
\left[
|v_\theta(X_t,t)|^2
-------------------

2\dot X_t^\top v_\theta(X_t,t)
\right]
+
\mathbb E|\dot X_t|^2.
]

Define

[
\mathcal G(\theta)
==================

\mathbb E
\left[
|v_\theta(X_t,t)|^2
-------------------

2\dot X_t^\top v_\theta(X_t,t)
\right].
]

Then

[
\boxed{
\mathcal G(\theta)
==================

## \mathcal L_{\mathrm{path}}(\theta)

\mathbb E|\dot X_t|^2.
}
]

Both objectives have identical minimizers and identical parameter gradients.

**[REPORTED]** The stochastic-interpolants paper uses this linear-quadratic functional and explicitly relates it to the squared regression problem. Flow Matching proves the corresponding equality of conditional and marginal objective gradients. ([arXiv][4])

## 1.7 Parameter-gradient identity

**[DERIVED]** With the path held fixed,

[
\nabla_\theta\mathcal L_{\mathrm{path}}
=======================================

2\mathbb E
\left[
J_\theta v_\theta(X_t,t)^\top
\left(
v_\theta(X_t,t)-\dot X_t
\right)
\right].
]

By conditional expectation,

[
\boxed{
\nabla_\theta\mathcal L_{\mathrm{path}}
=======================================

2\mathbb E
\left[
J_\theta v_\theta(X_t,t)^\top
\left(
v_\theta(X_t,t)-u_t(X_t)
\right)
\right].
}
]

Thus the stochastic pathwise target is an unbiased gradient estimator for marginal-field regression without simulating the transport ODE.

## 1.8 ODE realization

**[DERIVED]** Given an exact marginal velocity (u_t), solve

[
\frac{dY_t}{dt}=u_t(Y_t),\qquad Y_0\sim p_0.
]

If the continuity equation is well posed and the ODE generates a suitable flow map (\Phi_{0\to t}), then

[
Y_t\sim p_t,\qquad
p_t=(\Phi_{0\to t})_#p_0.
]

At inference, replace (u_t) by (v_\theta):

[
\frac{d\widehat Y_t}{dt}
========================

v_\theta(\widehat Y_t,t).
]

## 1.9 Continuous normalizing-flow likelihood

**[DERIVED]** Along a solution trajectory,

[
\frac{d}{dt}\log p_t(Y_t)
=========================

-\nabla_x\cdot u_t(Y_t).
]

Hence

[
\boxed{
\log p_1(Y_1)
=============

## \log p_0(Y_0)

\int_0^1
\nabla_x\cdot u_t(Y_t),dt.
}
]

For a target datum (x_1), reverse integration produces (x_0) and

[
\boxed{
\log p_1(x_1)
=============

## \log p_0(x_0)

\int_0^1
\nabla_x\cdot v_\theta(x_t,t),dt.
}
]

**[REPORTED]** Flow Matching inherits this CNF change-of-variables identity, and the original stochastic-interpolants paper gives the corresponding trajectory-density relation. ([ar5iv][1])

---

# 2. Tensor contract

**[DERIVED]** For an image model,

[
X_0,X_1,X_t,\dot X_t,v_\theta(X_t,t)
\in
\mathbb R^{B\times C\times H\times W}.
]

For flattened analysis,

[
d=CHW,\qquad
X_t\in\mathbb R^{B\times d}.
]

For molecular or graph-node data,

[
X_t\in\mathbb R^{B\times N\times F}.
]

Time samples have shape

[
t\in\mathbb R^B,
]

and are broadcast as

[
\bar t
\in
\mathbb R^{B\times1\times\cdots\times1}.
]

The network satisfies

[
v_\theta(X_t,t)
\equiv
\operatorname{shape}(X_t).
]

**[CODE-VERIFIED]** Meta’s `flow_matching` implementation documents endpoint states with shape `(batch_size, ...)`, time with shape `(batch_size)`, and returns both the sampled state (x_t) and its path derivative (dx_t) with the endpoint-state shape. ([GitHub][5])

**[CODE-VERIFIED]** NVIDIA BioNeMo’s flow-matching interpolant uses data/noise tensors shaped as batch-by-node-by-feature and a batch-shaped time tensor. ([NVIDIA Docs][6])

**[DERIVED]** For fixed interpolation schedules, endpoint samples, path coefficients, (X_t), and (\dot X_t) are stop-gradient quantities:

[
X_t
===

\operatorname{sg}(I_t(Z)),
\qquad
\dot X_t
========

\operatorname{sg}(\partial_tI_t(Z)).
]

Only

[
v_\theta(X_t,t)
]

belongs to the trainable gradient graph.

**[UNDISCLOSED]** The three original theoretical formulations do not prescribe one universal tensor dtype, mixed-precision policy, distributed sharding scheme, activation-checkpointing strategy, or architecture.

---

# 3. Flow Matching

## 3.1 Marginal probability path

**[REPORTED]** Flow Matching begins from a prescribed probability path (p_t) connecting a simple source distribution to a data distribution and trains a CNF vector field by regressing a target vector field that generates that path. ([ar5iv][1])

Let

[
p_t(x\mid x_1)
]

be a conditional probability path indexed by target data

[
X_1\sim q.
]

The marginal path is

[
\boxed{
p_t(x)
======

\int p_t(x\mid x_1)q(x_1),dx_1.
}
]

Suppose each conditional path satisfies

[
\partial_t p_t(x\mid x_1)
+
\nabla\cdot
\left(
p_t(x\mid x_1)u_t(x\mid x_1)
\right)
=0.
]

Then define

[
\boxed{
u_t(x)
======

\frac{
\int
u_t(x\mid x_1)
p_t(x\mid x_1)
q(x_1),dx_1
}{
p_t(x)
}.
}
]

Equivalently,

[
u_t(x)
======

\mathbb E[
u_t(X_t\mid X_1)
\mid X_t=x
].
]

**[REPORTED]** This conditional-to-marginal identity is the central vector-field construction in Flow Matching. ([ar5iv][1])

## 3.2 Marginal FM objective

**[REPORTED]**

[
\boxed{
\mathcal L_{\mathrm{FM}}(\theta)
================================

\mathbb E_{
t\sim U[0,1],
X_t\sim p_t
}
\left[
|v_\theta(X_t,t)-u_t(X_t)|^2
\right].
}
]

The marginal field (u_t(x)) is generally unavailable because it contains a posterior average over all possible conditioning endpoints.

## 3.3 Conditional Flow Matching objective

**[REPORTED]**

[
\boxed{
\mathcal L_{\mathrm{CFM}}(\theta)
=================================

\mathbb E_{
\substack{
t\sim U[0,1],\
X_1\sim q,\
X_t\sim p_t(\cdot\mid X_1)
}
}
\left[
\left|
v_\theta(X_t,t)
---------------

u_t(X_t\mid X_1)
\right|^2
\right].
}
]

The target endpoint (X_1) is used to generate the stochastic training target, but the unconditional neural vector field receives only ((X_t,t)).

**[REPORTED]** Under the paper’s regularity assumptions, FM and CFM differ only by a parameter-independent constant and therefore have identical gradients with respect to (\theta). ([ar5iv][1])

### Proof

**[DERIVED]** Let

[
r_t(x_1\mid x)
==============

\frac{
p_t(x\mid x_1)q(x_1)
}{
p_t(x)
}.
]

Then

[
u_t(x)
======

\mathbb E_{r_t(x_1\mid x)}
[
u_t(x\mid X_1)
].
]

Expanding CFM,

[
\begin{aligned}
\mathcal L_{\mathrm{CFM}}
&=
\mathbb E|v_\theta(X_t,t)|^2
----------------------------

2\mathbb E[
v_\theta(X_t,t)^\top u_t(X_t\mid X_1)
]\
&\quad+
\mathbb E|u_t(X_t\mid X_1)|^2.
\end{aligned}
]

Using conditional expectation,

[
\mathbb E[
u_t(X_t\mid X_1)
\mid X_t
]
=

u_t(X_t),
]

so

[
\begin{aligned}
\mathcal L_{\mathrm{CFM}}
-------------------------

\mathcal L_{\mathrm{FM}}
&=
\mathbb E|u_t(X_t\mid X_1)|^2
-----------------------------

\mathbb E|u_t(X_t)|^2\
&=
\mathbb E
\operatorname{Var}
\left(
u_t(X_t\mid X_1)\mid X_t
\right),
\end{aligned}
]

which is independent of (\theta).

---

## 3.4 Gaussian conditional paths

**[REPORTED]** Flow Matching uses Gaussian conditional paths of the form

[
\boxed{
p_t(x\mid x_1)
==============

\mathcal N
\left(
x;\mu_t(x_1),\sigma_t(x_1)^2I_d
\right).
}
]

A simulation-free sample is

[
\epsilon\sim\mathcal N(0,I_d),
\qquad
X_t
===

\mu_t(X_1)+\sigma_t(X_1)\epsilon.
]

The associated affine conditional flow map is

[
\psi_t(\epsilon\mid x_1)
========================

\mu_t(x_1)+\sigma_t(x_1)\epsilon.
]

Differentiation gives

[
\dot X_t
========

\dot\mu_t(X_1)+\dot\sigma_t(X_1)\epsilon.
]

Eliminating (\epsilon),

[
\boxed{
u_t(x\mid x_1)
==============

\frac{\dot\sigma_t}{\sigma_t}
\left(
x-\mu_t
\right)
+
\dot\mu_t.
}
]

**[REPORTED]** This is the Gaussian-path conditional vector field derived in the Flow Matching paper. ([ar5iv][1])

**[DERIVED]** At training time, the numerically preferable target is often

[
\dot\mu_t+\dot\sigma_t\epsilon
]

rather than

[
\frac{\dot\sigma_t}{\sigma_t}(X_t-\mu_t)+\dot\mu_t,
]

because the former avoids explicit division by a potentially small (\sigma_t).

---

## 3.5 Diffusion probability paths

### Variance-exploding path

**[REPORTED]** The Flow Matching paper constructs a conditional probability path associated with variance-exploding diffusion by reversing the diffusion’s Gaussian perturbation path. Its conditional mean remains centered on the data endpoint while the conditional variance follows the reversed diffusion noise schedule. ([ar5iv][1])

A generic representation is

[
\mu_t(x_1)=x_1,
\qquad
\sigma_t=\sigma_{\mathrm{VE}}(1-t),
]

so

[
X_t=x_1+\sigma_{\mathrm{VE}}(1-t)\epsilon
]

and

[
\dot X_t
========

-\sigma'_{\mathrm{VE}}(1-t)\epsilon.
]

**[DERIVED]** The exact sign depends on whether the schedule derivative is written with respect to diffusion time (s=1-t) or generative time (t). A correct implementation should differentiate (\mu_t,\sigma_t) with respect to the actual model time variable rather than infer signs from schedule names.

### Variance-preserving path

**[REPORTED]** For a variance-preserving diffusion schedule with signal coefficient (\alpha_s), the reverse conditional path has the Gaussian form

[
p_t(x\mid x_1)
==============

\mathcal N
\left(
x;
\alpha_{1-t}x_1,
\left(1-\alpha_{1-t}^2\right)I
\right),
]

with the corresponding Gaussian conditional vector field obtained from the general formula above. ([ar5iv][1])

### Probability-flow interpretation

**[REPORTED]** If a diffusion process satisfies a Fokker–Planck equation with drift (f_t), diffusion coefficient (g_t), and score (\nabla\log p_t), its marginals can also be generated by the deterministic probability-flow field

[
\boxed{
w_t(x)
======

## f_t(x)

\frac{1}{2}g_t^2
\nabla_x\log p_t(x).
}
]

Flow Matching can directly regress the vector field generating the same diffusion probability path without training a score and then converting it into a probability-flow field. ([ar5iv][1])

---

## 3.6 Conditional optimal-transport displacement path

**[REPORTED]** The Flow Matching conditional OT path is

[
\boxed{
\mu_t(x_1)=t x_1,
\qquad
\sigma_t
========

1-(1-\sigma_{\min})t.
}
]

Therefore,

[
X_t
===

tX_1+
\left[
1-(1-\sigma_{\min})t
\right]X_0,
\qquad
X_0\sim\mathcal N(0,I).
]

The pathwise target is

[
\boxed{
\dot X_t
========

X_1-(1-\sigma_{\min})X_0.
}
]

The state-form conditional field is

[
\boxed{
u_t(x\mid x_1)
==============

\frac{
x_1-(1-\sigma_{\min})x
}{
1-(1-\sigma_{\min})t
}.
}
]

The conditional flow map is

[
\psi_t(x_0\mid x_1)
===================

\left[
1-(1-\sigma_{\min})t
\right]x_0
+
tx_1.
]

For every fixed (x_1), this is the Gaussian Wasserstein displacement interpolation from

[
\mathcal N(0,I)
\quad\text{to}\quad
\mathcal N(x_1,\sigma_{\min}^2I),
]

and each conditional particle trajectory is straight with constant velocity. ([ar5iv][1])

**[DERIVED]** The term “optimal transport” here is conditional. It proves optimality between the two Gaussian conditional endpoint distributions for each fixed (x_1); it does not prove that the resulting unconditional endpoint coupling between (p_0) and (p_1) is globally Monge-optimal.

**[REPORTED]** The nonzero (\sigma_{\min}) means the terminal marginal is a Gaussian-smoothed approximation to the data distribution rather than an exact atomic or singular empirical distribution. ([ar5iv][1])

---

## 3.7 Flow Matching training algorithm

### Algorithm FM-CFM

**[DERIVED]**

[
\boxed{
\begin{array}{ll}
\textbf{Input:}
&
q_{\mathrm{data}},;
p_0=\mathcal N(0,I),;
\mu_t,\sigma_t,;
v_\theta,;
B.
[2mm]
\textbf{Sample:}
&
t_b\overset{iid}{\sim}U[0,1],
\quad
x_{1,b}\overset{iid}{\sim}q_{\mathrm{data}},
\quad
\epsilon_b\overset{iid}{\sim}\mathcal N(0,I_d).
[2mm]
\textbf{Path:}
&
x_{t,b}
=======

\mu_{t_b}(x_{1,b})
+
\sigma_{t_b}(x_{1,b})\epsilon_b.
[2mm]
\textbf{Target:}
&
y_b
===

\partial_t\mu_{t_b}(x_{1,b})
+
\partial_t\sigma_{t_b}(x_{1,b})\epsilon_b.
[2mm]
\textbf{Predict:}
&
\widehat y_b
============

v_\theta(x_{t,b},t_b).
[2mm]
\textbf{Loss:}
&
\widehat{\mathcal L}_{\mathrm{CFM}}
===================================

\frac1B
\sum_{b=1}^{B}
|\widehat y_b-\operatorname{sg}(y_b)|*2^2.
[2mm]
\textbf{Update:}
&
\theta
\leftarrow
\operatorname{OptimizerStep}
\left(
\theta,
\nabla*\theta\widehat{\mathcal L}_{\mathrm{CFM}}
\right).
\end{array}
}
]

**[CODE-VERIFIED]** Meta’s official library implements affine probability paths as

[
x_t=\sigma_t x_0+\alpha_t x_1,
\qquad
dx_t=\dot\sigma_t x_0+\dot\alpha_t x_1,
]

and examples train with mean-squared error against `path_sample.dx_t`. ([GitHub][5])

---

## 3.8 Inference and likelihood

### Forward generation

**[DERIVED]**

[
X_0\sim p_0,\qquad
\frac{dX_t}{dt}=v_\theta(X_t,t),\qquad
\widehat X_1=X_{t=1}.
]

### Reverse likelihood

**[DERIVED]**

[
X_1=x_{\mathrm{data}},
\qquad
\frac{dX_t}{dt}=v_\theta(X_t,t)
]

is integrated from (t=1) to (t=0), jointly with

[
\frac{d\ell_t}{dt}
==================

-\nabla\cdot v_\theta(X_t,t).
]

Then

[
\log p_\theta(X_1)
==================

## \log p_0(X_0)

\int_0^1
\nabla\cdot v_\theta(X_t,t),dt.
]

**[CODE-VERIFIED]** Meta’s ODE solver supports fixed-step methods and adaptive `torchdiffeq` methods, including Euler, midpoint, Heun-type integration, and Dormand–Prince integration. Its likelihood path can use exact divergence or a Hutchinson estimator based on a vector–Jacobian product. ([GitHub][7])

---

## 3.9 Reported FM experiment configuration

**[REPORTED]** The original Flow Matching experiments used a CIFAR-10 U-Net with base channels (256), depth (2), channel multipliers ([1,2,2,2]), four attention heads, 64 channels per head, and attention at resolution (16). The reported training used batch size (256), 391,000 iterations, learning rate (5\times10^{-4}), Adam with (\beta_1=0.9,\beta_2=0.999), zero weight decay, and FP32 training. Likelihood evaluation used Dormand–Prince with absolute and relative tolerances (10^{-5}). ([ar5iv][1])

**[REPORTED]** In the paper’s reported experiments, conditional OT paths used fewer ODE function evaluations and improved several FID or likelihood results relative to the tested diffusion paths. For example, the reported CIFAR-10 figures were approximately:

[
\begin{array}{c|ccc}
\text{Path} & \text{NLL} & \text{FID} & \text{NFE}\ \hline
\text{FM diffusion} & 3.10 & 8.06 & 183\
\text{FM conditional OT} & 2.99 & 6.35 & 142.
\end{array}
]

These are empirical results under the paper’s implementation and are not universal ordering guarantees. ([ar5iv][1])

---

# 4. Rectified Flow

## 4.1 Linear stochastic interpolation

**[REPORTED]** Rectified Flow begins with a coupled pair

[
(X_0,X_1)\sim\pi
]

and defines the linear interpolation

[
\boxed{
X_t=(1-t)X_0+tX_1.
}
]

Its pathwise derivative is

[
\boxed{
\dot X_t=X_1-X_0.
}
]

The least-squares objective is

[
\boxed{
\mathcal L_{\mathrm{RF}}(v)
===========================

\int_0^1
\mathbb E
\left[
\left|
(X_1-X_0)-v(X_t,t)
\right|^2
\right]dt.
}
]

The population minimizer is

[
\boxed{
v^\star(x,t)
============

\mathbb E[
X_1-X_0\mid X_t=x
].
}
]

([ar5iv][3])

## 4.2 Rectified ODE

**[REPORTED]** The rectified process (Z_t) is defined by

[
\boxed{
\frac{dZ_t}{dt}
===============

v^\star(Z_t,t),
\qquad
Z_0=X_0.
}
]

Under the paper’s rectifiability and well-posedness assumptions,

[
\boxed{
\operatorname{Law}(Z_t)
=======================

\operatorname{Law}(X_t)
}
]

for all (t\in[0,1]). In particular,

[
Z_0\sim p_0,
\qquad
Z_1\sim p_1.
]

([ar5iv][3])

### Proof mechanism

**[DERIVED]** The linear interpolation has current

[
j_t(x)
======

\mathbb E[
(X_1-X_0)\delta(x-X_t)
].
]

Since

[
v^\star(x,t)
============

\mathbb E[
X_1-X_0\mid X_t=x
],
]

we have

[
j_t(x)
======

p_t(x)v^\star(x,t).
]

Thus the interpolated marginals satisfy

[
\partial_t p_t+\nabla\cdot(p_tv^\star)=0,
]

which is the continuity equation induced by the rectified ODE.

---

## 4.3 Relation to Flow Matching

**[DERIVED]** Under the independent coupling

[
X_0\sim\mathcal N(0,I),\qquad
X_1\sim p_{\mathrm{data}},
]

Rectified Flow uses

[
X_t=(1-t)X_0+tX_1,
\qquad
\dot X_t=X_1-X_0.
]

Flow Matching’s conditional OT path with (\sigma_{\min}=0) has exactly the same sampled interpolation and pathwise target:

[
X_t=(1-t)X_0+tX_1,
\qquad
u_{\mathrm{target}}=X_1-X_0.
]

Therefore,

[
\boxed{
\mathcal L_{\mathrm{RF}}
========================

\mathcal L_{\mathrm{CFM,OT}}
\quad
\text{when }
\sigma_{\min}=0
\text{ and the endpoint coupling is identical}.
}
]

**[DERIVED]** This is an objective-level and interior-time equivalence. It is not automatically a theorem-level equivalence at (t=1), because the exact (\sigma_{\min}=0) Gaussian conditional path becomes degenerate, while the Flow Matching conditional-field theorem assumes positive conditional densities under its stated regularity conditions.

---

## 4.4 Convex transport-cost guarantee

**[REPORTED]** Let ((Z_0,Z_1)) be the endpoint coupling induced by the exact rectified flow. For every convex function

[
c:\mathbb R^d\rightarrow\mathbb R,
]

Rectified Flow proves

[
\boxed{
\mathbb E[c(Z_1-Z_0)]
\le
\mathbb E[c(X_1-X_0)].
}
]

([ar5iv][3])

### Proof

**[DERIVED]** Since

[
Z_1-Z_0
=======

\int_0^1v^\star(Z_t,t),dt,
]

Jensen’s inequality in time gives

[
c(Z_1-Z_0)
\le
\int_0^1c(v^\star(Z_t,t)),dt.
]

Taking expectations and using marginal preservation,

[
\mathbb E[c(Z_1-Z_0)]
\le
\int_0^1
\mathbb E[c(v^\star(X_t,t))],dt.
]

Since

[
v^\star(X_t,t)
==============

\mathbb E[
X_1-X_0\mid X_t
],
]

conditional Jensen gives

[
c(v^\star(X_t,t))
\le
\mathbb E[
c(X_1-X_0)\mid X_t
].
]

Thus

[
\begin{aligned}
\mathbb E[c(Z_1-Z_0)]
&\le
\int_0^1
\mathbb E[c(X_1-X_0)],dt\
&=
\mathbb E[c(X_1-X_0)].
\end{aligned}
]

**[DERIVED]** For (c(z)=|z|_2^2),

[
\mathbb E|Z_1-Z_0|^2
\le
\mathbb E|X_1-X_0|^2.
]

**[DERIVED]** This is a cost-improvement theorem relative to the input coupling. It is not a proof that one rectification produces the globally optimal coupling.

---

## 4.5 Path straightness

**[REPORTED]** Rectified Flow defines a straight coupling as a fixed point of rectification: its conditional expected displacement already agrees with the endpoint displacement along its interpolated trajectories. Equivalent formulations connect straightness, non-intersecting deterministic trajectories, and zero straightness defect. ([ar5iv][3])

A natural defect is

[
\boxed{
V(X_0,X_1)
==========

\int_0^1
\mathbb E
\left[
\left|
(X_1-X_0)
---------

\mathbb E[X_1-X_0\mid X_t]
\right|^2
\right]dt.
}
]

**[DERIVED]** This is precisely the irreducible conditional variance of the RF target:

[
V
=

\int_0^1
\mathbb E
\operatorname{Var}(X_1-X_0\mid X_t),dt.
]

Therefore,

[
V=0
]

if and only if the displacement is a deterministic function of ((X_t,t)), almost everywhere.

**[DERIVED]** Linear endpoint paths can cross even though every raw conditional trajectory is individually straight. At a crossing, least-squares regression averages incompatible endpoint displacements. The learned marginal ODE may consequently curve despite the straight training interpolation.

---

## 4.6 Recursive rectification or reflow

**[REPORTED]** Starting from a coupling ((X_0^{(0)},X_1^{(0)})), one rectification produces a new coupling

[
(X_0^{(1)},X_1^{(1)})
=====================

(Z_0^{(0)},Z_1^{(0)})
]

by solving the learned rectified ODE from (Z_0^{(0)}=X_0^{(0)}). Repeating the procedure defines

[
(X_0^{(k+1)},X_1^{(k+1)})
=========================

\operatorname{Rectify}
\left(
X_0^{(k)},X_1^{(k)}
\right).
]

The paper calls the practical retraining procedure reflow. ([ar5iv][3])

**[REPORTED]** In the exact population setting, the paper derives a telescoping bound implying that the minimum straightness/intersection defect among the first (K) rectifications decreases at an (O(1/K)) rate. ([ar5iv][3])

**[DERIVED]** This rate applies to exact population rectification under the theorem’s assumptions. It does not directly prove convergence for finite data, finite network capacity, stochastic optimization, approximate ODE solves, or teacher-generated reflow pairs.

**[REPORTED]** A straight coupling need not be globally optimal for a chosen convex transport cost in dimensions greater than one. Strictly convex cost-optimal couplings are straight under the paper’s conditions, but the converse fails generally. In one dimension, the relation is stronger because deterministic monotone couplings characterize convex-cost optimal transport. ([ar5iv][3])

---

## 4.7 Single-step Euler sampling

The forward-Euler update is

[
Z_{n+1}
=======

Z_n+h,v_\theta(Z_n,t_n).
]

With one step,

[
\boxed{
\widehat Z_1
============

Z_0+v_\theta(Z_0,0).
}
]

**[DERIVED]** If the learned flow is exact and its trajectory is straight with constant velocity,

[
v^\star(Z_t,t)=Z_1-Z_0
]

for every (t), then

[
Z_1
===

# Z_0+\int_0^1v^\star(Z_t,t),dt

Z_0+v^\star(Z_0,0).
]

Thus one Euler step is exact.

**[DERIVED]** For a general smooth nonautonomous field,

[
Z(t+h)
======

Z(t)+hv(Z(t),t)
+
\frac{h^2}{2}
\left[
\partial_t v+
J_xv,v
\right]_{(Z(t),t)}
+
O(h^3).
]

The local truncation error is controlled by the material acceleration

[
a_v(x,t)
========

\partial_t v(x,t)+J_xv(x,t)v(x,t).
]

Forward Euler has local error (O(h^2)) and global error (O(h)) under conventional bounded-derivative and Lipschitz assumptions. Straight constant-velocity trajectories satisfy

[
a_v(Z_t,t)=0.
]

**[REPORTED]** The Rectified Flow experiments explicitly evaluate one-step Euler generation and show substantial improvement after reflow and distillation, while full adaptive integration can exhibit a different ordering because approximation error in the learned field remains. ([ar5iv][3])

Reported CIFAR-10 results include approximately:

[
\begin{array}{c|cc}
\text{Model} & \text{Undistilled one-step FID} &
\text{Distilled one-step FID}\ \hline
\text{1-Rectified Flow} & 378 & 6.18\
\text{2-Rectified Flow} & 12.21 & 4.85\
\text{3-Rectified Flow} & 8.15 & 5.21.
\end{array}
]

The reported adaptive RK45 FIDs were approximately (2.58), (3.36), and (3.96), respectively, demonstrating that straighter coarse-step behavior does not imply monotonic improvement of the fully integrated learned distribution. ([ar5iv][3])

---

## 4.8 Rectified Flow algorithms

### First rectified flow

**[DERIVED]**

[
\boxed{
\begin{array}{ll}
\textbf{Input:}
&
\pi^{(0)}\in\Pi(p_0,p_1),;
v_{\theta_1},;
B.
[1mm]
\textbf{Sample:}
&
(x_{0,b},x_{1,b})\overset{iid}{\sim}\pi^{(0)},
\quad
t_b\sim U[0,1].
[1mm]
\textbf{Interpolate:}
&
x_{t,b}=(1-t_b)x_{0,b}+t_bx_{1,b}.
[1mm]
\textbf{Target:}
&
y_b=x_{1,b}-x_{0,b}.
[1mm]
\textbf{Loss:}
&
\widehat{\mathcal L}_{\mathrm{RF}}
==================================

\frac1B
\sum_b
|
v_{\theta_1}(x_{t,b},t_b)-\operatorname{sg}(y_b)
|^2.
[1mm]
\textbf{Update:}
&
\theta_1
\leftarrow
\operatorname{OptimizerStep}
\left(
\theta_1,
\nabla_{\theta_1}\widehat{\mathcal L}_{\mathrm{RF}}
\right).
\end{array}
}
]

### Offline reflow

**[DERIVED]**

[
\boxed{
\begin{array}{ll}
\textbf{Teacher generation:}
&
z_{0,m}\sim p_0,
\qquad
\dot z_t=v_{\theta_k}(z_t,t),
\qquad
z_{1,m}=\operatorname{ODESolve}(z_{0,m}).
[1mm]
\textbf{New coupling:}
&
\widehat\pi^{(k)}
=================

\frac1M
\sum_{m=1}^M
\delta_{(z_{0,m},z_{1,m})}.
[1mm]
\textbf{Student path:}
&
z_{t,m}=(1-t)z_{0,m}+tz_{1,m}.
[1mm]
\textbf{Student target:}
&
y_m=z_{1,m}-z_{0,m}.
[1mm]
\textbf{Train:}
&
\theta_{k+1}
\leftarrow
\arg\min_\theta
\mathbb E_{\widehat\pi^{(k)},t}
|
v_\theta(z_t,t)-y
|^2.
\end{array}
}
]

**[CODE-VERIFIED]** The author implementation generates reflow endpoint pairs with a pretrained rectified-flow model, trains the next flow on those pairs, and supports one-step sampling of the form

[
z_1=z_0+v(z_0,0).
]

The repository recommends very large generated-pair sets for CIFAR-scale reflow and notes that online pair generation exchanges storage requirements for additional teacher compute. ([GitHub][8])

---

## 4.9 Likelihood status

**[UNDISCLOSED]** The Rectified Flow paper does not make likelihood evaluation a central algorithmic contribution or specify a dedicated likelihood implementation comparable to the Flow Matching and stochastic-interpolants treatments.

**[DERIVED]** Whenever the learned RF vector field defines an invertible sufficiently regular CNF, the standard divergence integral remains mathematically applicable:

[
\log p_1(x_1)
=============

## \log p_0(x_0)

\int_0^1\nabla\cdot v_\theta(x_t,t),dt.
]

This is a consequence of the shared ODE framework, not a Rectified Flow-specific reported estimator.

---

# 5. Stochastic Interpolants: arXiv:2209.15571

## 5.1 Original construction

**[REPORTED]** The original stochastic-interpolants paper assumes absolutely continuous endpoint densities

[
\rho_0,\rho_1
]

and independently samples

[
X_0\sim\rho_0,\qquad
X_1\sim\rho_1.
]

It defines

[
X_t=I_t(X_0,X_1),
]

where (I_t) is sufficiently regular and satisfies

[
I_0(x_0,x_1)=x_0,
\qquad
I_1(x_0,x_1)=x_1.
]

The paper imposes differentiability, integrability, and surjectivity-type assumptions needed for its density and velocity arguments. ([arXiv][4])

**[DERIVED]** Under the original paper’s sampling law,

[
\pi(dx_0,dx_1)
==============

\rho_0(dx_0)\rho_1(dx_1).
]

The general-coupling version follows by replacing the product law with (\pi) in the density/current derivation, but that generalization is not the stated endpoint law of arXiv:2209.15571.

---

## 5.2 Interpolant density and current

**[REPORTED]**

[
\boxed{
\rho_t(x)
=========

\int
\delta(x-I_t(x_0,x_1))
\rho_0(x_0)\rho_1(x_1)
,dx_0dx_1.
}
]

The probability current is

[
\boxed{
j_t(x)
======

\int
\partial_tI_t(x_0,x_1)
\delta(x-I_t(x_0,x_1))
\rho_0(x_0)\rho_1(x_1)
,dx_0dx_1.
}
]

The current velocity is

[
\boxed{
v_t(x)
======

\frac{j_t(x)}{\rho_t(x)}.
}
]

The induced density satisfies

[
\partial_t\rho_t+\nabla\cdot(\rho_tv_t)=0.
]

([arXiv][4])

**[DERIVED]** Equivalently,

[
\boxed{
v_t(x)
======

\mathbb E[
\partial_tI_t(X_0,X_1)
\mid
I_t(X_0,X_1)=x
].
}
]

---

## 5.3 Variational velocity objective

**[REPORTED]** The paper defines

[
\boxed{
G(\widehat v)
=============

\mathbb E_{
t,X_0,X_1
}
\left[
|\widehat v_t(I_t)|^2
---------------------

2\partial_tI_t^\top
\widehat v_t(I_t)
\right].
}
]

Its unique minimizer in the appropriate function class is the interpolant velocity (v_t). At the optimum,

[
\boxed{
\min_{\widehat v}G(\widehat v)
==============================

*

\int_0^1
\int
|v_t(x)|^2\rho_t(x),dxdt.
}
]

([arXiv][4])

**[REPORTED]** The equivalent positive squared-regression objective is

[
\boxed{
\mathbb E
\left[
\left|
\widehat v_t(I_t)
-----------------

\partial_tI_t
\right|^2
\right].
}
]

It has the same first variation and minimizer, although its minimum is generally nonzero because (\partial_tI_t) is not necessarily determined uniquely by (I_t). ([arXiv][4])

**[DERIVED]** Its irreducible minimum is

[
\mathbb E
\operatorname{Var}
\left(
\partial_tI_t
\mid I_t
\right).
]

---

## 5.4 Trigonometric interpolant

**[REPORTED]** A principal interpolant used in the paper is

[
\boxed{
I_t(x_0,x_1)
============

\cos\left(\frac{\pi t}{2}\right)x_0
+
\sin\left(\frac{\pi t}{2}\right)x_1.
}
]

Its derivative is

[
\boxed{
\partial_tI_t
=============

\frac{\pi}{2}
\left[
-\sin\left(\frac{\pi t}{2}\right)x_0
+
\cos\left(\frac{\pi t}{2}\right)x_1
\right].
}
]

([arXiv][4])

**[DERIVED]** Relative to linear interpolation, the raw target is time-dependent and the conditional trajectories are arcs in the two-dimensional span of ((x_0,x_1)), except in degenerate collinear cases.

---

## 5.5 Training algorithm

### Fixed interpolant

**[DERIVED]**

[
\boxed{
\begin{array}{ll}
\textbf{Input:}
&
\rho_0,\rho_1,;
I_t,;
v_\theta,;
B.
[1mm]
\textbf{Sample:}
&
t_b\sim U[0,1],
\quad
x_{0,b}\sim\rho_0,
\quad
x_{1,b}\sim\rho_1,
\quad
x_{0,b}\perp x_{1,b}.
[1mm]
\textbf{Interpolate:}
&
x_{t,b}=I_{t_b}(x_{0,b},x_{1,b}).
[1mm]
\textbf{Target:}
&
y_b
===

\partial_tI_{t_b}(x_{0,b},x_{1,b}).
[1mm]
\textbf{Loss:}
&
\widehat{\mathcal L}_{\mathrm{SI}}
==================================

\frac1B
\sum_b
|
v_\theta(x_{t,b},t_b)-\operatorname{sg}(y_b)
|^2.
[1mm]
\textbf{Update:}
&
\theta
\leftarrow
\operatorname{OptimizerStep}
\left(
\theta,
\nabla_\theta\widehat{\mathcal L}_{\mathrm{SI}}
\right).
\end{array}
}
]

**[REPORTED]** The paper emphasizes that this training procedure does not backpropagate through a numerical ODE solution. The required training samples are generated directly from endpoint samples and the analytical interpolant. ([arXiv][4])

**[REPORTED]** The supplement gives a finite-sample empirical version based on sampled times and endpoint pairs and notes that the evaluations are parallelizable. ([arXiv][4])

---

## 5.6 Score identity

**[REPORTED]** For the paper’s Gaussian base and trigonometric interpolant, the score of the intermediate density can be recovered from the velocity:

[
\boxed{
\nabla_x\log\rho_t(x)
=====================

## -x

\frac{2}{\pi}
\tan\left(\frac{\pi t}{2}\right)
v_t(x),
\qquad t<1.
}
]

At the endpoint, the paper gives a limiting identity involving the time derivative of the velocity:

[
\boxed{
\nabla_x\log\rho_1(x)
=====================

## -x

\frac{4}{\pi^2}
\left.
\partial_tv_t(x)
\right|_{t=1}.
}
]

([arXiv][4])

**[DERIVED]** The multiplicative coefficient

[
\tan\left(\frac{\pi t}{2}\right)
]

diverges as (t\to1). Even if (v_t) itself remains regular, reconstructing the score from an approximate velocity becomes numerically ill-conditioned near the target endpoint.

---

## 5.7 ODE realization

**[REPORTED]** The primary generative realization in arXiv:2209.15571 is deterministic:

[
\boxed{
\frac{dX_t}{dt}=v_t(X_t),
\qquad
X_0\sim\rho_0.
}
]

The ODE transports (\rho_0) through the interpolant marginals and reaches (\rho_1). ([arXiv][4])

**[REPORTED]** The experiments use an adaptive Dormand–Prince Runge–Kutta (4(5)) method for ODE sampling. ([arXiv][4])

---

## 5.8 SDE status in the original paper

**[REPORTED]** The original paper uses the velocity-derived score to write an artificial-time Langevin process for resampling an intermediate density. In the paper’s notation, Equation 29 is written as

[
\boxed{
dX_\tau
=======

-\widehat s_t(X_\tau),d\tau
+
\sqrt 2,dW_\tau.
}
]

The equation above retains the sign exactly as it appears in the allowed source. ([arXiv][4])

**[UNDISCLOSED]** arXiv:2209.15571 does not provide the later generalized family of forward and backward generative SDEs parameterized jointly by arbitrary interpolant drift, score, and diffusion amplitude. Importing those results from arXiv:2303.08797 would violate the source boundary.

**[UNDISCLOSED]** The allowed source does not establish that every later stochastic-interpolant SDE implementation in the current repository belongs to the 2022 paper.

---

## 5.9 Likelihood evaluation

**[REPORTED]** Along the interpolant flow,

[
\boxed{
\rho_t(X_{t_0,t}(x))
====================

\rho_{t_0}(x)
\exp
\left(
-\int_{t_0}^{t}
\nabla\cdot v_s(X_{t_0,s}(x)),ds
\right).
}
]

Therefore,

[
\boxed{
\log\rho_1(X_1)
===============

## \log\rho_0(X_0)

\int_0^1\nabla\cdot v_t(X_t),dt.
}
]

This gives normalizing-flow likelihood evaluation through reverse ODE integration and divergence accumulation. ([arXiv][4])

---

## 5.10 Interpolant optimization and path length

Define the kinetic action

[
\mathcal A[I]
=============

\int_0^1
\int_{\mathbb R^d}
|v_t(x)|^2\rho_t(x),dxdt.
]

**[REPORTED]** Because

[
\min_vG_I(v)
============

-\mathcal A[I],
]

the paper proposes optimizing the interpolant through the saddle problem

[
\boxed{
\max_I\min_v G_I(v).
}
]

Maximizing the minimum of (G_I) minimizes the induced kinetic action. Under the paper’s explicit existence, interpolability, and classical-solution assumptions, the construction is connected to the Benamou–Brenier dynamic formulation of quadratic optimal transport. ([arXiv][4])

**[DERIVED]** If (I=I_\eta) is parameterized, a practical alternating procedure is

[
\theta
\leftarrow
\theta-\alpha_\theta\nabla_\theta G(\theta,\eta),
]

[
\eta
\leftarrow
\eta+\alpha_\eta\nabla_\eta G(\theta,\eta).
]

The gradient with respect to (\eta) passes through both

[
I_\eta(X_0,X_1)
\quad\text{and}\quad
\partial_tI_\eta(X_0,X_1).
]

The envelope-theorem interpretation is exact only when the inner velocity minimization is solved sufficiently accurately.

**[UNDISCLOSED]** The paper does not prove that a finite neural interpolant family, alternating stochastic gradient method, and finite neural velocity field will recover the global Benamou–Brenier optimum.

---

## 5.11 Reported stability bound

**[REPORTED]** The paper gives an endpoint Wasserstein error bound of the form

[
\boxed{
W_2^2(\rho_1,\widehat\rho_1)
\le
e^{1+2\widehat K}
H(\widehat v),
}
]

where (H(\widehat v)) measures velocity approximation error and (\widehat K) controls a regularity quantity of the approximate field. ([arXiv][4])

**[DERIVED]** The exponential regularity factor means small regression error alone does not guarantee a small endpoint-distribution error when the learned field has large spatial derivatives or poor Lipschitz behavior.

---

# 6. Precise equivalences

## 6.1 Common projection theorem

**[DERIVED]**

[
\boxed{
\begin{array}{c|c|c}
\text{Method} & X_t & \text{Pathwise target}\ \hline
\text{Flow Matching}
&
\mu_t(X_1)+\sigma_t\epsilon
&
\dot\mu_t(X_1)+\dot\sigma_t\epsilon
\
\text{Rectified Flow}
&
(1-t)X_0+tX_1
&
X_1-X_0
\
\text{Stochastic Interpolants}
&
I_t(X_0,X_1)
&
\partial_tI_t(X_0,X_1)
\end{array}
}
]

In every case,

[
\boxed{
v^\star(x,t)
============

\mathbb E[
\text{pathwise target}\mid X_t=x
].
}
]

## 6.2 Linear affine specialization

**[DERIVED]** Let

[
I_t(X_0,X_1)
============

a_tX_0+b_tX_1.
]

Then

[
\dot I_t
========

\dot a_tX_0+\dot b_tX_1.
]

All three methods include such interpolants:

[
\begin{aligned}
\text{RF:}\quad
&a_t=1-t,\qquad b_t=t,\
\text{FM conditional OT:}\quad
&a_t=1-(1-\sigma_{\min})t,\qquad b_t=t,\
\text{SI trigonometric:}\quad
&a_t=\cos(\pi t/2),\qquad b_t=\sin(\pi t/2).
\end{aligned}
]

## 6.3 Exact RF–FM loss equivalence

**[DERIVED]**

[
\boxed{
\text{RF}
\equiv
\text{FM conditional OT}
}
]

at the regression-objective level when

[
\sigma_{\min}=0
]

and both use the same coupling.

## 6.4 SI–FM structural equivalence

**[DERIVED]** A stochastic interpolant with a fixed endpoint law is structurally a simulation-free conditional flow-matching construction:

[
X_t=I_t(Z),
\qquad
u_t(x)=\mathbb E[\partial_tI_t(Z)\mid I_t(Z)=x].
]

The distinction lies primarily in the paper’s presentation, admissible interpolant family, endpoint law, and additional optimization or score identities—not in a different (L^2) projection principle.

## 6.5 Non-equivalence of couplings

**[DERIVED]** Identical marginal endpoints and identical scalar path coefficients do not determine the same learned field. The field depends on

[
\pi(dx_0,dx_1)
]

through

[
\mathbb E[
\dot X_t\mid X_t=x
].
]

Changing the endpoint coupling changes:

[
\begin{aligned}
&\text{conditional target variance},\
&\text{path intersections},\
&\text{marginal current},\
&\text{trajectory curvature},\
&\text{transport cost},\
&\text{coarse-solver error}.
\end{aligned}
]

---

# 7. Differences by technical axis

| Axis                                           | Flow Matching                                                                | Rectified Flow                                                        | Stochastic Interpolants 2209                                                            |
| ---------------------------------------------- | ---------------------------------------------------------------------------- | --------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| **[REPORTED] Endpoint law**                    | Usually data endpoint plus independently sampled Gaussian conditional noise. | Arbitrary supplied coupling (\pi(X_0,X_1)).                           | Product law (\rho_0\rho_1) in the original paper.                                       |
| **[REPORTED] Path**                            | Prescribed conditional probability path, commonly Gaussian.                  | Linear interpolation (X_t=(1-t)X_0+tX_1).                             | General regular interpolant (I_t(X_0,X_1)).                                             |
| **[DERIVED] Target**                           | Conditional Gaussian field or (\dot\mu+\dot\sigma\epsilon).                  | Constant endpoint displacement (X_1-X_0).                             | General (\partial_tI_t).                                                                |
| **[REPORTED] Simulation-free training**        | Yes.                                                                         | Yes.                                                                  | Yes.                                                                                    |
| **[REPORTED] Inference core**                  | Deterministic CNF ODE.                                                       | Deterministic rectified ODE.                                          | Deterministic normalizing-flow ODE.                                                     |
| **[REPORTED] Likelihood**                      | Explicit CNF likelihood treatment.                                           | Not a central reported contribution.                                  | Explicit divergence-integral likelihood.                                                |
| **[REPORTED] OT statement**                    | Conditional Gaussian OT path.                                                | Convex transport cost cannot increase after exact rectification.      | Benamou–Brenier connection through interpolant optimization under explicit assumptions. |
| **[REPORTED] Straightening**                   | No recursive reflow theorem in the original paper.                           | Explicit rectification/reflow and straightness analysis.              | Optimizes kinetic action through interpolant choice.                                    |
| **[DERIVED] Main numerical objective**         | Learn a favorable marginal field from a selected path.                       | Reduce trajectory ambiguity and coarse-step error through recoupling. | Learn and potentially optimize an interpolant-induced current.                          |
| **[UNDISCLOSED] Later generalized SDE family** | Not applicable.                                                              | Not applicable.                                                       | Not contained in arXiv:2209.15571.                                                      |

---

# 8. Stochasticity: exact delimitation

**[DERIVED]** The term “stochastic” can refer to three distinct objects:

[
\boxed{
\text{random training interpolation}
\neq
\text{stochastic differential equation}
\neq
\text{stochastic numerical solver}.
}
]

**[REPORTED]** All three methods sample random endpoint or latent variables during training.

**[REPORTED]** Their principal generative dynamics in the allowed papers are deterministic ODEs.

**[REPORTED]** Flow Matching may use paths whose marginals coincide with diffusion paths, but generation can still use the deterministic probability-flow ODE. ([ar5iv][1])

**[REPORTED]** The original stochastic-interpolants paper additionally discusses an artificial-time Langevin construction derived from the recovered score, but this does not convert its main interpolation-time generator into the later generalized SDE framework. ([arXiv][4])

---

# 9. Curvature and coarse-solver efficiency

## 9.1 Conditional versus marginal straightness

**[DERIVED]** Let every conditional path be linear:

[
X_t=(1-t)X_0+tX_1.
]

Its pathwise acceleration is zero:

[
\ddot X_t=0.
]

The marginal field is

[
u_t(x)
======

\mathbb E[X_1-X_0\mid X_t=x].
]

A generated ODE trajectory (Y_t) obeys

[
\ddot Y_t
=========

\partial_tu_t(Y_t)
+
J_xu_t(Y_t)u_t(Y_t).
]

There is no requirement that this expression vanish. Therefore,

[
\boxed{
\text{straight conditional paths}
\not\Rightarrow
\text{straight marginal ODE trajectories}.
}
]

Path intersections and conditional averaging are the obstruction.

## 9.2 Solver-error functional

**[DERIVED]** Define the material-acceleration energy

[
\mathcal K(v)
=============

\mathbb E
\int_0^1
\left|
\partial_tv(X_t,t)+J_xv(X_t,t)v(X_t,t)
\right|^2dt.
]

For fixed-step Euler, midpoint, or Runge–Kutta integration, lower (\mathcal K) generally reduces truncation error constants, holding field-approximation error fixed.

**[DERIVED]** Kinetic action

[
\mathcal A(v)
=============

\mathbb E
\int_0^1|v(X_t,t)|^2dt
]

and curvature or material acceleration are not identical objectives. A minimum-action path need not minimize the discretization error of a specific finite-step solver under model approximation.

## 9.3 Statistical versus numerical error

**[DERIVED]** Endpoint error can be decomposed conceptually as

[
\boxed{
\mathcal E_{\mathrm{total}}
\lesssim
\mathcal E_{\mathrm{path}}
+
\mathcal E_{\mathrm{regression}}
+
\mathcal E_{\mathrm{generalization}}
+
\mathcal E_{\mathrm{solver}}
+
\mathcal E_{\mathrm{endpoint}}.
}
]

Here:

[
\begin{aligned}
\mathcal E_{\mathrm{path}}
&:\text{ chosen terminal path differs from }p_1,\
\mathcal E_{\mathrm{regression}}
&:\text{ finite-capacity optimization error},\
\mathcal E_{\mathrm{generalization}}
&:\text{ finite-data error},\
\mathcal E_{\mathrm{solver}}
&:\text{ ODE discretization/tolerance error},\
\mathcal E_{\mathrm{endpoint}}
&:\text{ schedule truncation or }\sigma_{\min}>0.
\end{aligned}
]

A straighter path primarily attacks the solver component; it does not automatically eliminate the others.

---

# 10. Computational complexity

Let

[
C_v(B,d)
]

denote the cost of one neural vector-field evaluation and

[
M_v(B,d)
]

its activation-memory cost.

## 10.1 Training

**[DERIVED]** For one paired Monte Carlo sample per batch element, FM, RF, and fixed-path SI require:

[
\text{time}
===========

\Theta(C_v^{\mathrm{forward}}+C_v^{\mathrm{backward}}),
]

[
\text{path arithmetic}
======================

\Theta(Bd),
]

[
\text{additional path memory}
=============================

\Theta(Bd),
]

excluding model parameters, optimizer states, and activations.

**[DERIVED]** Unlike maximum-likelihood CNF training, the velocity-regression objective does not require:

[
\begin{aligned}
&\text{ODE integration during training},\
&\text{divergence estimation during training},\
&\text{backpropagation through solver states}.
\end{aligned}
]

**[REPORTED]** This simulation-free property is explicit in Flow Matching and stochastic interpolants. ([ar5iv][1])

## 10.2 ODE generation

For (N_{\mathrm{FE}}) vector-field evaluations,

[
\boxed{
T_{\mathrm{sample}}
===================

\Theta
\left(
N_{\mathrm{FE}}C_v(B,d)
\right).
}
]

With inference gradients disabled, the state memory is approximately

[
\Theta(Bd)
]

plus model weights and a fixed number of Runge–Kutta stage tensors.

## 10.3 Likelihood

**[DERIVED]** Exact divergence

[
\nabla\cdot v
=============

\sum_{i=1}^{d}
\frac{\partial v_i}{\partial x_i}
]

is expensive in high dimension.

A Hutchinson estimator uses

[
\nabla\cdot v
=============

\mathbb E_\epsilon
\left[
\epsilon^\top J_xv,\epsilon
\right],
]

where

[
\mathbb E[\epsilon\epsilon^\top]=I.
]

One probe requires a vector–Jacobian product rather than (d) separately materialized Jacobian columns.

Thus,

[
T_{\mathrm{likelihood}}
=======================

\Theta
\left(
N_{\mathrm{FE}}
\left[
C_v+C_{\mathrm{VJP}}
\right]
\right)
]

per probe.

**[CODE-VERIFIED]** Meta’s implementation supports exact or Hutchinson divergence, including Rademacher probe vectors. ([GitHub][7])

## 10.4 Reflow

For (M) teacher-generated endpoint pairs,

[
\boxed{
T_{\mathrm{pairgen}}
====================

\Theta
\left(
M,N_{\mathrm{FE,teacher}},C_v
\right).
}
]

Offline storage is

[
\boxed{
M_{\mathrm{pairs}}
==================

\Theta(Md)
}
]

for each stored endpoint tensor, before metadata or compression.

**[CODE-VERIFIED]** The author repository explicitly exposes the storage-versus-online-compute trade-off for reflow pair generation. ([GitHub][8])

## 10.5 Learned-interpolant SI

**[DERIVED]** If the interpolant is learned jointly, training adds:

[
C_I^{\mathrm{forward}}
+
C_I^{\mathrm{backward}}
]

and stores interpolant activations. Exact memory and FLOPs depend on the undisclosed parameterization.

---

# 11. Numerical stability

## 11.1 Small-variance Gaussian paths

**[DERIVED]** The state-form Gaussian target contains

[
\frac{\dot\sigma_t}{\sigma_t}.
]

When

[
\sigma_t\rightarrow0,
]

the coefficient may become large, magnifying floating-point and model errors.

Mitigations consistent with the source constructions are:

[
\begin{aligned}
&\sigma_{\min}>0,\
&\text{endpoint-time truncation},\
&\text{using }\dot\mu_t+\dot\sigma_t\epsilon
\text{ as the sampled target},\
&\text{higher precision for schedule arithmetic}.
\end{aligned}
]

## 11.2 Score conversion singularity

**[REPORTED]** In the SI score identity,

[
\tan(\pi t/2)\rightarrow\infty
\qquad
\text{as }t\to1.
]

The paper separately supplies an endpoint limiting formula. ([arXiv][4])

**[DERIVED]** Evaluating the interior score identity extremely close to (t=1) can amplify velocity approximation error as

[
|\delta s_t|
\approx
\frac{2}{\pi}
\tan\left(\frac{\pi t}{2}\right)
|\delta v_t|.
]

## 11.3 Intersecting paths

**[DERIVED]** Large conditional target variance

[
\operatorname{Var}(\dot X_t\mid X_t=x)
]

produces:

[
\begin{aligned}
&\text{high stochastic-gradient variance},\
&\text{averaged or blurred local direction fields},\
&\text{larger curvature},\
&\text{larger coarse-step integration error}.
\end{aligned}
]

## 11.4 Adaptive solver variability

**[DERIVED]** Adaptive solvers allocate more NFEs to samples or time intervals with larger estimated local error. Under dynamic batching, sample-dependent NFE creates:

[
\begin{aligned}
&\text{latency variance},\
&\text{batch divergence},\
&\text{poor accelerator utilization},\
&\text{hard-to-predict serving cost}.
\end{aligned}
]

Fixed-step flow models avoid this variability but expose discretization error directly.

## 11.5 Time-direction mismatch

**[DERIVED]** Some implementations parameterize noise-to-data time as

[
t:0\to1,
]

while schedulers parameterized by noise level use

[
\sigma:1\to0.
]

Since

[
t=1-\sigma,
\qquad
\frac{dx}{d\sigma}
==================

-\frac{dx}{dt},
]

a sign or schedule-convention mismatch can reverse the learned update.

---

# 12. Official ecosystem implementations

## 12.1 Meta `flow_matching`

**[CODE-VERIFIED]** Meta’s official PyTorch library exposes continuous and discrete flow-matching paths, affine path sampling, ODE solvers, and examples. Its affine path abstraction returns

[
x_t=\sigma_tx_0+\alpha_tx_1,
\qquad
dx_t=\dot\sigma_tx_0+\dot\alpha_tx_1.
]

([GitHub][9])

**[CODE-VERIFIED]** The solver can run with gradients disabled by default for inference and supports fixed or adaptive ODE methods with configurable absolute and relative tolerances. ([GitHub][7])

## 12.2 Hugging Face Diffusers

**[CODE-VERIFIED]** Diffusers provides `FlowMatchEulerDiscreteScheduler`, used in flow-matching-based diffusion pipelines such as Stable Diffusion 3. The scheduler supports shifted schedules and several sigma transformations; these features are pipeline-specific implementation choices, not claims from the original Flow Matching theorem. ([Hugging Face][10])

**[CODE-VERIFIED]** Its forward mixing operation has the form

[
x_\sigma
========

\sigma\epsilon+(1-\sigma)x_{\mathrm{data}}.
]

The deterministic Euler update is implemented as

[
x_{\mathrm{next}}
=================

x+
(\sigma_{\mathrm{next}}-\sigma)
,\widehat v.
]

The scheduler upcasts sample arithmetic to FP32 during the step. ([GitHub][11])

**[DERIVED]** With

[
t=1-\sigma,
]

the interpolation becomes

[
x_t
===

(1-t)\epsilon+tx_{\mathrm{data}},
]

which is the RF/FM linear path. The scheduler evolves from high to low (\sigma), so its derivative convention is the negative of a noise-to-data (t)-derivative.

**[CODE-VERIFIED]** Diffusers also includes a stochastic scheduler branch that reconstructs a predicted clean state and injects new noise. That branch is an implementation-level sampling variant and is not part of the original deterministic Flow Matching derivation. ([GitHub][11])

## 12.3 NVIDIA BioNeMo

**[CODE-VERIFIED]** BioNeMo implements a flow-matching interpolation

[
x_t
===

t,x_{\mathrm{data}}
+
(1-t)x_{\mathrm{noise}},
]

with velocity target

[
v_{\mathrm{target}}
===================

x_{\mathrm{data}}-x_{\mathrm{noise}}.
]

It also exposes optional additive Gaussian perturbation and alternate prediction targets. ([NVIDIA Docs][6])

**[DERIVED]** With optional perturbation disabled, this is precisely the independent-coupling linear path shared by Rectified Flow and zero-terminal-variance conditional OT Flow Matching.

---

# 13. Failure modes

## 13.1 Path-design failures

**[DERIVED]**

[
\begin{array}{ll}
\textbf{High intersection density:}
&
\operatorname{Var}(\dot X_t\mid X_t)\text{ becomes large}.
\
\textbf{Endpoint singularity:}
&
\sigma_t\to0\text{ destabilizes state-form targets}.
\
\textbf{Long curved paths:}
&
\text{large NFE or large fixed-step bias}.
\
\textbf{Poor time sampling:}
&
\text{critical endpoint regions are undertrained}.
\
\textbf{Terminal smoothing:}
&
p_1^{\mathrm{path}}\neq p_{\mathrm{data}}
\text{ when }\sigma_{\min}>0.
\end{array}
]

## 13.2 Coupling failures

**[DERIVED]**

[
\begin{array}{ll}
\textbf{Independent-pair ambiguity:}
&
\text{many incompatible displacements cross}.
\
\textbf{Approximate reflow bias:}
&
\text{teacher errors become the next coupling}.
\
\textbf{Mode contraction:}
&
\text{a biased teacher may underrepresent target modes}.
\
\textbf{Storage pressure:}
&
M\text{ high-dimensional endpoint pairs require }\Theta(Md)\text{ storage}.
\end{array}
]

## 13.3 Neural-field failures

**[DERIVED]**

[
\begin{array}{ll}
\textbf{Insufficient capacity:}
&
v_\theta\not\approx \mathbb E[\dot X_t\mid X_t].
\
\textbf{Non-Lipschitz behavior:}
&
\text{unstable ODE trajectories or large endpoint error}.
\
\textbf{Endpoint extrapolation:}
&
v_\theta(x,0)\text{ or }v_\theta(x,1)
\text{ is weakly constrained by continuous time sampling}.
\
\textbf{Mixed-precision overflow:}
&
\dot\sigma/\sigma\text{ or score conversions exceed dtype range}.
\end{array}
]

## 13.4 Solver failures

**[DERIVED]**

[
\begin{array}{ll}
\textbf{Too few steps:}
&
\text{truncation error dominates}.
\
\textbf{Loose tolerance:}
&
\text{adaptive likelihood or sampling bias}.
\
\textbf{Overly strict tolerance:}
&
\text{unbounded practical latency/NFE growth}.
\
\textbf{Schedule mismatch:}
&
\text{wrong sign, scale, or terminal state}.
\
\textbf{Likelihood noise:}
&
\text{Hutchinson variance contaminates BPD estimates}.
\end{array}
]

## 13.5 OT overclaiming

**[DERIVED]** The following implications are invalid without additional assumptions:

[
\begin{aligned}
\text{FM conditional OT path}
&\not\Rightarrow
\text{globally OT marginal coupling},\
\text{one RF rectification}
&\not\Rightarrow
\text{globally optimal coupling},\
\text{RF straight coupling}
&\not\Rightarrow
\text{cost-optimal coupling in }d>1,\
\text{finite SI saddle training}
&\not\Rightarrow
\text{exact Benamou--Brenier minimizer}.
\end{aligned}
]

---

# 14. Controlled ablations

## 14.1 Path ablation

**[DERIVED]** Fix data, architecture, coupling, optimizer, and solver. Compare:

[
\begin{aligned}
I_t^{\mathrm{linear}}
&=(1-t)X_0+tX_1,\
I_t^{\mathrm{trig}}
&=\cos(\pi t/2)X_0+\sin(\pi t/2)X_1,\
I_t^{\mathrm{VP}}
&=\alpha_{1-t}X_1+\sqrt{1-\alpha_{1-t}^2}X_0,\
I_t^{\mathrm{VE}}
&=X_1+\sigma_{1-t}X_0.
\end{aligned}
]

Measure:

[
\begin{aligned}
&\text{validation velocity MSE},\
&\mathbb E\operatorname{Var}(\dot X_t\mid X_t),\
&\text{material-acceleration energy},\
&\text{FID versus NFE},\
&\text{likelihood versus NFE}.
\end{aligned}
]

## 14.2 Coupling ablation

**[DERIVED]**

[
\pi\in
\left{
\pi_{\mathrm{ind}},
\pi_{\mathrm{minibatch\ OT}},
\pi_{\mathrm{reflow}}^{(1)},
\pi_{\mathrm{reflow}}^{(2)}
\right}.
]

The path must remain fixed to isolate coupling effects.

## 14.3 Endpoint variance ablation

**[DERIVED]**

[
\sigma_{\min}
\in
{0,10^{-3},10^{-2},10^{-1}}.
]

Measure the trade-off between:

[
\begin{aligned}
&\text{target-conditioning stability},\
&\text{terminal smoothing bias},\
&\text{likelihood},\
&\text{sample quality},\
&\text{NFE}.
\end{aligned}
]

## 14.4 Time-sampling ablation

**[DERIVED]** Compare

[
t\sim U[0,1]
]

against endpoint-weighted beta distributions while importance-weighting the loss to preserve the desired integral:

[
\widehat{\mathcal L}
====================

\frac1B
\sum_b
\frac{1}{q(t_b)}
|
v_\theta(X_{t_b},t_b)-\dot X_{t_b}
|^2.
]

Without the (1/q(t)) factor, the training objective itself changes.

## 14.5 Solver ablation

**[DERIVED]** Compare:

[
\begin{array}{c|c}
\text{Solver} & \text{NFE budget}\ \hline
\text{Euler} & 1,2,4,8,16,32,64\
\text{Midpoint} & 2,4,8,16,32,64\
\text{RK4} & 4,8,16,32,64\
\text{DOPRI5} & \mathrm{rtol}=\mathrm{atol}\in{10^{-3},10^{-5},10^{-7}}
\end{array}
]

Report both nominal steps and actual NFEs.

---

# 15. Reproducible benchmark protocol

## 15.1 Objective

**[DERIVED]** Evaluate path, coupling, and rectification effects while holding model capacity, optimizer, data order, numerical precision, and compute budget fixed.

## 15.2 Dataset

**[DERIVED]**

[
\text{Dataset}=\text{CIFAR-10},
\qquad
x\in[-1,1]^{3\times32\times32}.
]

Use one fixed train/validation split and identical augmentation and dequantization code across methods.

## 15.3 Architecture

**[REPORTED]** Use the original FM CIFAR U-Net configuration:

[
\begin{aligned}
&\text{base channels}=256,\
&\text{residual depth}=2,\
&\text{channel multipliers}=[1,2,2,2],\
&\text{attention heads}=4,\
&\text{head channels}=64,\
&\text{attention resolution}=16.
\end{aligned}
]

([ar5iv][1])

**[DERIVED]** Disable method-specific architectural additions. Use identical time embeddings and output parameterization for all methods.

## 15.4 Optimization

**[REPORTED]**

[
\begin{aligned}
&\text{batch}=256,\
&\text{updates}=391{,}000,\
&\text{optimizer}=\operatorname{Adam},\
&\beta_1=0.9,\quad\beta_2=0.999,\
&\epsilon=10^{-8},\
&\text{weight decay}=0,\
&\text{peak learning rate}=5\times10^{-4},\
&\text{dtype}=\mathrm{FP32}.
\end{aligned}
]

These values match the reported FM experimental configuration. ([ar5iv][1])

**[DERIVED]** Use the same warmup and decay schedule for every method. Disable EMA unless it is applied identically to every run and charged to the same memory budget.

## 15.5 Methods

**[DERIVED]**

[
\begin{array}{ll}
M_1:&\text{FM variance-preserving path},\
M_2:&\text{FM conditional OT, }\sigma_{\min}=10^{-3},\
M_3:&\text{RF, independent coupling},\
M_4:&\text{RF after one charged reflow stage},\
M_5:&\text{SI trigonometric interpolant},\
M_6:&\text{SI linear interpolant}.
\end{array}
]

For (M_4), teacher-pair generation must count against the same total accelerator budget.

## 15.6 Hardware and compute

**[DERIVED]**

[
\text{Hardware}
===============

2\times\text{NVIDIA A100 40 GB}.
]

Per method:

[
\begin{aligned}
&\text{same optimizer-step count},\
&\text{same global batch},\
&\text{same number of endpoint samples},\
&\text{maximum total budget}=144\text{ A100 GPU-hours},\
&\text{reflow generation and distillation included}.
\end{aligned}
]

Report:

[
\begin{aligned}
&\text{accelerator-seconds},\
&\text{energy if measurable},\
&\text{peak allocated memory},\
&\text{training samples/second},\
&\text{model evaluations}.
\end{aligned}
]

## 15.7 Solvers

**[DERIVED]** Use a shared implementation for all fields:

[
\begin{aligned}
&\text{Euler: }N_{\mathrm{FE}}\in{1,2,4,8,16,32,64,128},\
&\text{midpoint: matched NFE grid},\
&\text{DOPRI5 reference: }\mathrm{rtol}=\mathrm{atol}=10^{-5}.
\end{aligned}
]

The (10^{-5}) adaptive tolerance matches the original FM likelihood configuration. ([ar5iv][1])

## 15.8 Evaluation

**[DERIVED]** For each method and seed, report:

[
\begin{aligned}
&\text{FID on 50,000 generated samples},\
&\text{bits/dimension with the same divergence estimator},\
&\text{precision and recall},\
&\text{NFE},\
&\text{wall-clock latency at batch sizes }1,16,64,\
&\text{peak inference memory},\
&\text{velocity validation MSE},\
&\text{straightness defect},\
&\text{kinetic action},\
&\text{material-acceleration energy}.
\end{aligned}
]

Use at least five paired random seeds and report:

[
\text{mean},
\quad
\text{standard deviation},
\quad
95%\text{ bootstrap confidence interval}.
]

## 15.9 Fairness constraints

**[DERIVED]**

[
\boxed{
\begin{array}{l}
\text{Same architecture and parameter count},\
\text{same data order and augmentations},\
\text{same optimizer and learning-rate schedule},\
\text{same numerical precision},\
\text{same training endpoint-sample count},\
\text{same ODE implementation},\
\text{same FID implementation and reference statistics},\
\text{same divergence estimator and probe count},\
\text{teacher/reflow compute fully charged}.
\end{array}
}
]

Without these controls, claims about path superiority are confounded by architecture, training budget, solver, or evaluation differences.

---

# 16. Unresolved theoretical limitations

**[UNDISCLOSED]** The three papers do not provide a complete finite-sample, finite-capacity error theorem jointly decomposing:

[
\text{path error}
+
\text{regression error}
+
\text{optimization error}
+
\text{solver error}.
]

**[UNDISCLOSED]** Exact regularity and uniqueness can fail when data distributions are concentrated near lower-dimensional manifolds or when the learned field is non-Lipschitz.

**[UNDISCLOSED]** There is no general theorem in the source set guaranteeing that the path minimizing kinetic action also minimizes finite-NFE sample error for a specified numerical solver.

**[UNDISCLOSED]** The RF (O(1/K)) population straightness result does not characterize convergence under approximate neural retraining and biased teacher-generated couplings.

**[UNDISCLOSED]** The source set does not prove that recursive RF rectification converges to a unique globally optimal transport coupling in dimensions greater than one.

**[UNDISCLOSED]** The SI interpolant saddle problem does not have a general global-convergence guarantee for nonconvex neural parameterizations.

**[UNDISCLOSED]** The source set does not identify a universally optimal interpolation schedule across architectures, datasets, resolutions, or compute budgets.

**[UNDISCLOSED]** Exact one-step generation guarantees under simultaneous neural approximation and distribution shift remain absent.

---

# 17. Unresolved production-engineering limitations

**[DERIVED]** Flow-model deployment requires the checkpoint to retain a strict model–schedule contract:

[
\boxed{
{
\text{time direction},
\text{path coefficients},
\text{target parameterization},
\text{terminal variance},
\text{solver},
\text{prediction scaling}
}.
}
]

A checkpoint without this metadata is not operationally self-describing.

**[UNDISCLOSED]** The original papers do not specify production-grade:

[
\begin{aligned}
&\text{continuous batching semantics},\
&\text{adaptive-NFE admission control},\
&\text{CUDA graph compatibility},\
&\text{distributed tensor-parallel inference},\
&\text{fault recovery during ODE integration},\
&\text{deterministic cross-hardware reproducibility},\
&\text{serving-time likelihood calibration},\
&\text{checkpoint migration across scheduler conventions}.
\end{aligned}
]

**[DERIVED]** Adaptive solvers create request-dependent workloads, making throughput and tail latency less predictable than fixed-step inference.

**[DERIVED]** Reflow moves cost from online numerical integration into offline teacher generation, storage, and retraining. Whether this is favorable depends on the amortization ratio

[
R
=

\frac{
\text{number of production samples}
}{
\text{reflow-training samples}
}.
]

**[DERIVED]** One-step models are especially sensitive to endpoint field calibration because the entire generated displacement is determined by

[
v_\theta(X_0,0).
]

Errors cannot be corrected by subsequent solver evaluations.

**[DERIVED]** Likelihood evaluation remains substantially more expensive than ordinary sample generation because it requires divergence estimation and reverse ODE integration.

---

# 18. Final technical synthesis

**[DERIVED]** The common mathematical core is:

[
\boxed{
\begin{aligned}
Z&\sim q,\
X_t&=I_t(Z),\
Y_t&=\partial_tI_t(Z),\
p_t(x)&=\mathbb E[\delta(x-X_t)],\
u_t(x)&=\mathbb E[Y_t\mid X_t=x],\
\theta^\star
&=
\arg\min_\theta
\mathbb E
|v_\theta(X_t,t)-Y_t|^2,\
\dot{\widehat X}*t
&=
v*{\theta^\star}(\widehat X_t,t).
\end{aligned}
}
]

**[DERIVED]** Flow Matching contributes the conditional-path decomposition that makes arbitrary Gaussian and diffusion probability paths trainable without simulation.

**[DERIVED]** Rectified Flow specializes the interpolant to a linear endpoint path, exposes coupling geometry as the principal source of trajectory ambiguity, and recursively recouples endpoints to improve straightness and coarse-step sampling.

**[DERIVED]** The original stochastic-interpolants paper provides the general current construction for endpoint-defined interpolants, a variational velocity objective, velocity-to-score identities for a particular Gaussian/trigonometric construction, normalizing-flow likelihood, and an interpolant optimization route connected to dynamic quadratic optimal transport.

**[DERIVED]** The decisive distinction is not whether one method uses an MSE velocity objective—all three do. The decisive state variables are

[
\boxed{
\text{endpoint coupling}
+
\text{interpolant geometry}
+
\text{terminal regularization}
+
\text{field approximation}
+
\text{numerical solver}.
}
]

Those five choices jointly determine target variance, transport cost, trajectory curvature, likelihood tractability, NFE, stability, and production cost.

[1]: https://ar5iv.labs.arxiv.org/html/2210.02747 "https://ar5iv.labs.arxiv.org/html/2210.02747"
[2]: https://github.com/malbergo/stochastic-interpolants "https://github.com/malbergo/stochastic-interpolants"
[3]: https://ar5iv.labs.arxiv.org/html/2209.03003 "https://ar5iv.labs.arxiv.org/html/2209.03003"
[4]: https://arxiv.org/pdf/2209.15571 "https://arxiv.org/pdf/2209.15571"
[5]: https://github.com/facebookresearch/flow_matching/blob/main/flow_matching/path/affine.py "https://github.com/facebookresearch/flow_matching/blob/main/flow_matching/path/affine.py"
[6]: https://docs.nvidia.com/bionemo-framework/2.6/API_reference/bionemo/moco/interpolants/continuous_time/continuous/continuous_flow_matching/ "https://docs.nvidia.com/bionemo-framework/2.6/API_reference/bionemo/moco/interpolants/continuous_time/continuous/continuous_flow_matching/"
[7]: https://github.com/facebookresearch/flow_matching/blob/main/flow_matching/solver/ode_solver.py "https://github.com/facebookresearch/flow_matching/blob/main/flow_matching/solver/ode_solver.py"
[8]: https://github.com/gnobitab/RectifiedFlow "https://github.com/gnobitab/RectifiedFlow"
[9]: https://github.com/facebookresearch/flow_matching "https://github.com/facebookresearch/flow_matching"
[10]: https://huggingface.co/docs/diffusers/api/schedulers/flow_match_euler_discrete "https://huggingface.co/docs/diffusers/api/schedulers/flow_match_euler_discrete"
[11]: https://github.com/huggingface/diffusers/blob/v0.39.0/src/diffusers/schedulers/scheduling_flow_match_euler_discrete.py "https://github.com/huggingface/diffusers/blob/v0.39.0/src/diffusers/schedulers/scheduling_flow_match_euler_discrete.py"
