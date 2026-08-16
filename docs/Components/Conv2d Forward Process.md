# Conv2d as a Spatial Representation Operator

## A Source-Audited Reconstruction from PyTorch 2.13 Semantics to cuDNN GPU Execution

### Abstract

A `Conv2d` layer is not adequately described as “a kernel sliding over an image.” At the model-architecture level, it is a structured transformation

[
\boxed{
\mathcal X:
\mathbb R^{N\times C\times H\times W}
\rightarrow
\mathcal Y:
\mathbb R^{N\times K\times P\times Q}
}
]

that simultaneously changes

[
\boxed{
\text{spatial resolution}
;+;
\text{spatial receptive field}
;+;
\text{channel basis}
;+;
\text{sampling lattice}
}
]

while preserving a strong locality constraint and sharing the same learned transformation across spatial positions.

PyTorch 2.13 specifies this operator as **2-D cross-correlation**, not mathematically flipped convolution. Its CUDA path passes through ATen backend selection into cuDNN, where tensor and convolution descriptors define the mathematical operation, an operation graph separates that specification from its implementation, heuristics or benchmarking select an execution plan, and the selected cuDNN engine can realize the contraction through implicit-GEMM or another supported convolution implementation. PyTorch's source explicitly uses `CUDNN_CROSS_CORRELATION`, and NVIDIA's convolution documentation describes implicit GEMM as constructing the equivalent matrix multiplication *on the fly*, without materializing an `im2col` matrix.

The analysis below separates three layers rigorously:

[
\boxed{
\text{Operator Semantics}
\neq
\text{Mathematical Lowering}
\neq
\text{Physical GPU Schedule}
}
]

The first is fixed by PyTorch/cuDNN. The second can be derived exactly. The third is selected dynamically by cuDNN and must not be fabricated from the high-level `Conv2d` definition.

---

# 1. Operator Contract

Let

[
X\in
\mathbb R^{N\times C\times H\times W}
]

denote the input tensor, where

[
N=\text{batch size},
\qquad
C=C_{\mathrm{in}},
\qquad
H=H_{\mathrm{in}},
\qquad
W=W_{\mathrm{in}}.
]

Let

[
K=C_{\mathrm{out}}
]

denote the number of learned output channels.

For a kernel

[
(R,S)
=====

(K_h,K_w),
]

stride

[
(U,V),
]

padding

[
(P_h,P_w),
]

dilation

[
(D_h,D_w),
]

and group count

[
G,
]

the learned weight tensor is

[
\boxed{
W
\in
\mathbb R^{
K\times(C/G)\times R\times S
}
}
]

and, when enabled,

[
\boxed{
b\in\mathbb R^K.
}
]

PyTorch requires the channel topology to satisfy

[
\boxed{
C\bmod G=0,
\qquad
K\bmod G=0.
}
]

The resulting tensor is

[
\boxed{
Y
\in
\mathbb R^{N\times K\times P\times Q}.
}
]

The weight shape, grouped connectivity, input/output tensor forms, padding modes and output-size equations are explicitly specified by PyTorch 2.13.

The transformation should therefore be read as

[
\boxed{
(N,C,H,W)
\xrightarrow{\operatorname{Conv2d}}
(N,K,P,Q),
}
]

not merely

[
(H,W)\rightarrow(P,Q).
]

The spatial basis and the channel basis are transformed simultaneously.

---

# 2. The Exact Mathematical Primitive Is Cross-Correlation

PyTorch defines

[
\boxed{
Y_{n,k}
=======

b_k+
\sum_c
W_{k,c}\star X_{n,c}
}
]

where

[
\star
]

is explicitly the valid two-dimensional **cross-correlation** operator.

At the cuDNN descriptor level PyTorch again makes this unambiguous:

[
\boxed{
\operatorname{MathMode}
=======================

\operatorname{CUDNN_CROSS_CORRELATION}.
}
]

There is therefore no cross-attention operation and no attention matrix:

[
\boxed{
QK^\top,\quad
\operatorname{softmax},\quad
V
\quad
\notin
\operatorname{Conv2d}.
}
]

There is also no kernel reversal in the forward operator.

True mathematical convolution would use

[
W^{\mathrm{flip}}_{k,c,r,s}
===========================

W_{k,c,R-1-r,S-1-s},
]

whereas PyTorch uses

[
\boxed{
W_{k,c,r,s}
}
]

directly.

Thus

[
\boxed{
Y_{n,k,p,q}
===========

b_k+
\sum_{c,r,s}
X_{\phi(n,k,p,q,c,r,s)}
W_{k,c,r,s}.
}
]

### Why can neural networks use cross-correlation?

PyTorch and cuDNN specify the semantics; they do **not** document a normative design rationale for choosing correlation rather than flipped convolution. A mathematically valid architectural explanation follows from learnable parameters.

Define the bijection

[
\Psi:
W_{r,s}
\mapsto
W'_{r,s}
========

W_{R-1-r,S-1-s}.
]

Because every (W) has exactly one corresponding (W'),

[
\boxed{
{X*W:W\in\Theta}
================

{X\star W':W'\in\Theta}.
}
]

Therefore, for freely learned kernels, flipping the parameter coordinates does not change the representable function class; it only changes parameter indexing.

This equivalence does **not** hold conceptually when (W) is a fixed externally defined filter whose orientation has semantic meaning.

---

# 3. Conv2d Is a Coordinate Transformation Before It Is an Arithmetic Reduction

The core spatial transformation is defined by the mapping

[
\boxed{
(p,q,r,s)
\mapsto
(h,w).
}
]

For output location

[
(p,q),
]

and kernel coordinate

[
(r,s),
]

the corresponding input coordinate is

[
\boxed{
h(p,r)
======

pU-P_h+rD_h
}
]

[
\boxed{
w(q,s)
======

qV-P_w+sD_w.
}
]

This mapping contains essentially the entire spatial geometry of `Conv2d`.

It decomposes into

[
\boxed{
\underbrace{pU,qV}_{\text{output-lattice displacement}}
-------------------------------------------------------

\underbrace{P_h,P_w}*{\text{coordinate origin shift}}
+
\underbrace{rD_h,sD_w}*{\text{kernel-internal sampling}}
}
]

and should be understood before the multiply-accumulate operation.

For each output coordinate,

[
\boxed{
\Omega_{p,q}
============

\left{
\left(
pU-P_h+rD_h,
qV-P_w+sD_w
\right)
:
0\le r<R,;
0\le s<S
\right}.
}
]

(\Omega_{p,q}) is the **actual discrete receptive-field sampling lattice** for one output location.

---

# 4. Effective Kernel Resolution Versus Number of Kernel Parameters

Dilation modifies the spatial support without modifying the number of learned spatial coefficients.

The effective kernel height is

[
\boxed{
R_{\mathrm{eff}}
================

D_h(R-1)+1
}
]

and the effective kernel width is

[
\boxed{
S_{\mathrm{eff}}
================

D_w(S-1)+1.
}
]

Yet the number of learned coefficients per input-output channel pair remains

[
\boxed{
RS.
}
]

For

[
R=3,\qquad D_h=2,
]

the kernel samples

[
{0,2,4}
]

rather than

[
{0,1,2}.
]

Hence

[
R_{\mathrm{eff}}=5
]

but only three vertical coefficients are learned.

The distinction is

[
\boxed{
\text{sample cardinality}
=========================

RS
}
]

versus

[
\boxed{
\text{spatial support envelope}
===============================

R_{\mathrm{eff}}\times S_{\mathrm{eff}}.
}
]

PyTorch explicitly defines dilation as spacing between kernel elements.

---

# 5. Resolution Transformation

The output height is

[
\boxed{
P=
\left\lfloor
\frac{
H+2P_h-D_h(R-1)-1
}{
U
}
+1
\right\rfloor
}
]

and the output width is

[
\boxed{
Q=
\left\lfloor
\frac{
W+2P_w-D_w(S-1)-1
}{
V
}
+1
\right\rfloor.
}
]

These are the exact PyTorch 2.13 output-shape equations.

Equivalently,

[
\boxed{
P=
\left\lfloor
\frac{
H+2P_h-R_{\mathrm{eff}}
}{U}
\right\rfloor+1
}
]

[
\boxed{
Q=
\left\lfloor
\frac{
W+2P_w-S_{\mathrm{eff}}
}{V}
\right\rfloor+1.
}
]

This equation exposes three distinct mechanisms.

Padding increases available coordinate extent:

[
H\rightarrow H+2P_h.
]

Effective kernel size consumes spatial extent:

[
H+2P_h
\rightarrow
H+2P_h-R_{\mathrm{eff}}.
]

Stride subsamples the valid receptive-field origins:

[
\boxed{
\text{origin spacing}=U.
}
]

Therefore stride is not merely “kernel movement.” Architecturally,

[
\boxed{
U>1
\Rightarrow
\text{lower output sampling density}.
}
]

For stride one and appropriate `"same"` padding,

[
\boxed{
P=H,\qquad Q=W.
}
]

PyTorch 2.13 explicitly restricts `padding="same"` to stride (1).

---

# 6. The Receptive Field Has Two Different Meanings

A precise analysis must distinguish the **support envelope** from the **actually sampled coordinates**.

The support-envelope height is

[
R_{\mathrm{eff}}
================

D_h(R-1)+1.
]

But the discrete sampled set is

[
\mathcal H_p
============

{
pU-P_h+rD_h
}_{r=0}^{R-1}.
]

Similarly,

[
\mathcal W_q
============

{
qV-P_w+sD_w
}_{s=0}^{S-1}.
]

Thus

[
\boxed{
\Omega_{p,q}
============

\mathcal H_p\times\mathcal W_q.
}
]

For ordinary dilation,

[
D_h=D_w=1,
]

every integer coordinate inside the receptive-field rectangle is sampled.

For

[
D>1,
]

the receptive field is sparse:

[
\boxed{
|\Omega_{p,q}|=RS
<
R_{\mathrm{eff}}S_{\mathrm{eff}}
}
]

in general.

This distinction matters because saying “a dilated (3\times3) kernel has a (5\times5) receptive field” means its **bounding support** is (5\times5), not that 25 spatial input points are read.

---

# 7. Exact Overlap Between Neighboring Receptive Fields

Consider one spatial dimension.

For output (p),

[
\mathcal H_p
============

{
pU-P_h+rD_h
\mid
r=0,\ldots,R-1
}.
]

For the neighboring output,

[
\mathcal H_{p+1}
================

{
pU-P_h+U+r'D_h
}.
]

An exact sampled coordinate is shared when

[
rD_h
====

U+r'D_h.
]

Therefore

[
\boxed{
(r-r')D_h=U.
}
]

Hence exact sampled-point overlap requires

[
\boxed{
D_h\mid U.
}
]

If

[
m=\frac{U}{D_h}\in\mathbb Z,
]

then the number of common vertical sampled coordinates is

[
\boxed{
O_h^{\mathrm{sample}}
=====================

\max(0,R-m).
}
]

If

[
D_h\nmid U,
]

then

[
\boxed{
O_h^{\mathrm{sample}}=0,
}
]

even though their spatial bounding rectangles may overlap.

The support-envelope overlap is instead

[
\boxed{
O_h^{\mathrm{envelope}}
=======================

\max(0,R_{\mathrm{eff}}-U).
}
]

These quantities must not be conflated.

---

# 8. Boundary Positions Do Not Observe the Same Number of Real Input Samples

With zero padding, the mathematical receptive field remains the same size, but positions outside the original tensor contribute zero.

Define

[
\bar X_{n,c,h,w}
================

\begin{cases}
X_{n,c,h,w},
&
0\le h<H,;
0\le w<W,
\
0,
&
\text{otherwise}.
\end{cases}
]

For output row (p), the number of vertically valid kernel coordinates is

[
\boxed{
\nu_h(p)
========

\left|
\left{
r:
0\le
pU-P_h+rD_h
<H
\right}
\right|.
}
]

Likewise,

[
\boxed{
\nu_w(q)
========

\left|
\left{
s:
0\le
qV-P_w+sD_w
<W
\right}
\right|.
}
]

Therefore the number of real, non-padding spatial-channel samples contributing to one grouped output scalar is

[
\boxed{
N_{\mathrm{valid}}(p,q)
=======================

\frac CG
,\nu_h(p)\nu_w(q).
}
]

Interior activations may use the complete set

[
\frac CGRS,
]

while border activations may depend partly on padding.

Hence padding preserves or enlarges output resolution, but it does not manufacture new signal information.

---

# 9. Channel Transformation

Spatial locality alone does not define convolution.

For group (g),

[
C_g=\frac CG,
\qquad
K_g=\frac KG.
]

For output channel (k),

[
\boxed{
g(k)
====

\left\lfloor
\frac{k}{K_g}
\right\rfloor.
}
]

Its connected global input channels are

[
\boxed{
\mathcal C_k
============

{
g(k)C_g,\ldots,(g(k)+1)C_g-1
}.
}
]

The local tensor observed by output position ((p,q)) is

[
\boxed{
\mathcal X^{(g)}_{n,p,q}
\in
\mathbb R^{C_g\times R\times S}
}
]

with

[
\boxed{
\mathcal X^{(g)}_{n,p,q}[c,r,s]
===============================

\bar X_{
n,,
gC_g+c,,
pU-P_h+rD_h,,
qV-P_w+sD_w
}.
}
]

One filter is

[
\boxed{
W_k
\in
\mathbb R^{C_g\times R\times S}.
}
]

The output scalar becomes the Frobenius inner product

[
\boxed{
Y^{\mathrm{conv}}_{n,k,p,q}
===========================

\left\langle
\mathcal X^{(g(k))}_{n,p,q},
W_k
\right\rangle_F.
}
]

Therefore

[
\boxed{
C_g\times R\times S
\rightarrow
1
}
]

for one filter, whereas all (K_g) filters in the group perform

[
\boxed{
\mathbb R^{C_gRS}
\rightarrow
\mathbb R^{K_g}.
}
]

This is the essential representation transformation:

[
\boxed{
\text{local spatial-channel neighborhood}
\rightarrow
\text{new learned channel basis}.
}
]

---

# 10. The Complete Forward Scalar Equation

Combining grouping, stride, padding, dilation and cross-correlation gives

[
\boxed{
\begin{aligned}
Y^{\mathrm{conv}}_{n,k,p,q}
===========================

\sum_{c=0}^{C_g-1}
\sum_{r=0}^{R-1}
\sum_{s=0}^{S-1}
&
W_{k,c,r,s}
[-1mm]
&\cdot
\bar X_{
n,,
g(k)C_g+c,,
pU-P_h+rD_h,,
qV-P_w+sD_w
}.
\end{aligned}
}
\tag{1}
]

The PyTorch bias transition is then

[
\boxed{
Y_{n,k,p,q}
===========

Y^{\mathrm{conv}}_{n,k,p,q}
+
b_k.
}
\tag{2}
]

On the ordinary PyTorch cuDNN path, ATen calls `cudnn_convolution` without a bias argument and subsequently adds the reshaped bias to the returned tensor. PyTorch's shared cuDNN source explicitly states that cuDNN convolution in this path does not handle bias and that bias is handled externally.

This distinction separates

[
\boxed{
\operatorname{Conv}
}
]

from specialized fused operations such as

[
\operatorname{Conv}+\operatorname{Bias}+\operatorname{Activation},
]

for which PyTorch contains separate cuDNN fused graph construction.

---

# 11. The Semantic Transformation Loop

The scalar equation can be expressed as a state transition over the reduction space.

Define

[
L=C_gRS.
]

Flatten

[
(c,r,s)
]

into

[
\boxed{
\ell=(cR+r)S+s.
}
]

Then

[
c(\ell)
=======

\left\lfloor
\frac{\ell}{RS}
\right\rfloor,
]

[
r(\ell)
=======

\left\lfloor
\frac{
\ell-c(\ell)RS
}{S}
\right\rfloor,
]

[
s(\ell)
=======

\ell-c(\ell)RS-r(\ell)S.
]

For every

[
(n,k,p,q),
]

initialize

[
\boxed{
a^{(0)}_{n,k,p,q}=0.
}
]

The complete semantic reduction is

[
\boxed{
\begin{aligned}
a^{(\ell+1)}_{n,k,p,q}
======================

a^{(\ell)}*{n,k,p,q}
+
&
W*{k,c(\ell),r(\ell),s(\ell)}
\
&\cdot
\bar X_{
n,,
g(k)C_g+c(\ell),,
pU-P_h+r(\ell)D_h,,
qV-P_w+s(\ell)D_w
},
\end{aligned}
}
\tag{3}
]

for

[
\ell=0,\ldots,L-1.
]

Then

[
\boxed{
Y^{\mathrm{conv}}_{n,k,p,q}
===========================

a^{(L)}_{n,k,p,q}
}
]

and

[
\boxed{
Y_{n,k,p,q}
===========

a^{(L)}_{n,k,p,q}+b_k.
}
\tag{4}
]

Equation (3) defines the exact **mathematical dependency graph**.

It does **not** assert that cuDNN physically executes a serial loop

[
c\rightarrow r\rightarrow s.
]

The execution engine is free to parallelize, vectorize, tile, transform or reorder this reduction subject to the required numerical semantics.

---

# 12. Weight Sharing Is the Fundamental Spatial Architectural Prior

For fixed output channel (k),

[
\boxed{
W_k
\text{ does not depend on }
(p,q).
}
]

Therefore

[
Y_{n,k,p,q}
===========

\left\langle
W_k,
\mathcal X_{n,p,q}
\right\rangle+b_k
]

and

[
Y_{n,k,p,q+1}
=============

\left\langle
W_k,
\mathcal X_{n,p,q+1}
\right\rangle+b_k.
]

The same operator is reused over the complete output lattice.

The parameter count is consequently

[
\boxed{
N_{\theta}
==========

K\frac CGRS
+
\mathbf 1_{\mathrm{bias}}K,
}
]

not

[
KPQ\frac CGRS.
]

This weight sharing produces the defining convolutional inductive bias:

[
\boxed{
\text{same local detector}
;;
\text{evaluated at many spatial coordinates}.
}
]

For stride one, away from boundary effects, shifting an input pattern shifts the corresponding response rather than requiring a new set of parameters.

For stride (U,V>1), exact translation equivariance is restricted to translations aligned with the output sampling lattice.

Padding further changes behavior at the boundary because padded positions are not equivalent to interior signal positions.

---

# 13. `1×1`, Dense, Grouped and Depthwise Conv Are One Operator Family

For

[
R=S=1,
]

[
D_h=D_w=1,
]

the spatial support collapses:

[
\Omega_{p,q}
============

{
(pU-P_h,qV-P_w)
}.
]

For dense convolution (G=1),

[
\boxed{
Y_{n,:,p,q}
===========

W_{\mathrm{1\times1}}
X_{n,:,p,q}
+b,
}
]

where

[
W_{\mathrm{1\times1}}
\in\mathbb R^{K\times C}.
]

Thus (1\times1) convolution performs a shared per-location channel projection.

For

[
G>1,
]

the channel transformation becomes block structured.

For depthwise convolution,

[
\boxed{
G=C,
}
]

so

[
C_g=1.
]

Each group observes only one input channel. PyTorch defines the depthwise case as `groups == in_channels` with output channels an integer multiple of the input-channel count.

Hence ordinary dense convolution couples

[
\boxed{
\text{spatial mixing}
+
\text{channel mixing}
}
]

inside one tensor contraction, whereas depthwise convolution largely removes cross-channel mixing from that operator.

---

# 14. Stacked Convolution and Growth of Receptive Field

For a stack of convolutional layers, define

[
J_\ell
]

as the spacing, measured in original-input coordinates, between neighboring activations at layer (\ell).

Initialize

[
\boxed{
J_0=1,
\qquad
RF_0=1.
}
]

For layer (\ell) with stride (U_\ell) and effective kernel size

[
R_{\mathrm{eff},\ell}
=====================

D_\ell(R_\ell-1)+1,
]

the output lattice spacing becomes

[
\boxed{
J_\ell
======

J_{\ell-1}U_\ell.
}
\tag{5}
]

The receptive-field envelope becomes

[
\boxed{
RF_\ell
=======

RF_{\ell-1}
+
(R_{\mathrm{eff},\ell}-1)J_{\ell-1}.
}
\tag{6}
]

Thus deeper convolutions transform spatial representations in two simultaneous ways:

[
\boxed{
\text{resolution decreases according to accumulated stride}
}
]

while

[
\boxed{
\text{each activation summarizes progressively larger input regions}.
}
]

Equations (5)–(6) are mathematically derived from the source-defined coordinate transformation; they are not additional PyTorch API semantics.

---

# 15. PyTorch Forward Dispatch Is a State Machine

At the Python module layer,

[
\boxed{
X
\xrightarrow{\texttt{Conv2d.forward}}
\texttt{_conv_forward}
\xrightarrow{}
F.\operatorname{conv2d}.
}
]

For non-zero padding modes, PyTorch explicitly performs a padding operation first and then invokes `conv2d` with zero convolution padding:

[
\boxed{
X
\xrightarrow{\operatorname{pad}_{\mathrm{reflect/replicate/circular}}}
\widetilde X
\xrightarrow{\operatorname{conv2d}(P=0)}
Y.
}
]

For `"zeros"` mode it passes the configured padding directly to `F.conv2d`.

ATen then normalizes the operation into the generic convolution path.

For ordinary real-valued `conv2d`,

[
\boxed{
\operatorname{conv2d}
\rightarrow
\operatorname{convolution}
\rightarrow
\operatorname{_convolution}.
}
]

The source validates dimensional consistency, group count, channel compatibility, bias shape and parameter values before backend selection.

The backend state transition is

[
\boxed{
\mathcal B^\star
================

\operatorname{SelectBackend}
(
X,W,b,
S,P,D,G,
\text{device},
\text{dtype},
\text{layout},
\text{grad-state}
).
}
]

For a supported CUDA/cuDNN case,

[
\boxed{
\mathcal B^\star
================

\operatorname{CUDNN}.
}
]

PyTorch's backend-selection code checks CUDA/cuDNN availability and additional conditions including data type, dilation support and large-indexing cases before selecting cuDNN.

---

# 16. PyTorch Does Not Promise That Every CUDA Conv2d Is cuDNN

The correct execution model is conditional:

[
\boxed{
\operatorname{Conv2d}
\not\equiv
\operatorname{cuDNN}
\quad
\text{unconditionally}.
}
]

Instead,

[
\boxed{
\operatorname{Conv2d}
\rightarrow
\operatorname{backend\ selector}
\rightarrow
{
\operatorname{cuDNN},
\operatorname{native\ CUDA},
\operatorname{MIOpen},
\operatorname{MKLDNN},
\ldots
}.
}
]

For eligible CUDA input, PyTorch can select the cuDNN backend; for depthwise or unsupported configurations other branches may be selected.

The analysis that follows therefore describes

[
\boxed{
\operatorname{Conv2d}
;\middle|;
\mathcal B^\star=\operatorname{cuDNN}.
}
]

---

# 17. Output Allocation Happens Before Raw cuDNN Execution

PyTorch's shared cuDNN convolution path computes

[
\boxed{
\operatorname{shape}(Y)
=======================

\operatorname{conv_output_size}
(
\operatorname{shape}(X),
\operatorname{shape}(W),
P,S,D
)
}
]

and allocates the CUDA output tensor using the memory format selected for the operation.

Thus, conceptually,

[
\boxed{
(X,W,\theta_{\mathrm{conv}})
\rightarrow
\operatorname{shape}(Y)
\rightarrow
\operatorname{allocate}(Y)
\rightarrow
\operatorname{cuDNNExecute}.
}
]

The output tensor does not emerge from an unknown-size CUDA kernel; its geometry is established before execution.

---

# 18. Logical Tensor Shape Is Not Physical Memory Layout

For tensor

[
X[n,c,h,w],
]

define physical strides

[
\boldsymbol\sigma_X
===================

(\sigma_N,\sigma_C,\sigma_H,\sigma_W).
]

The memory location is

[
\boxed{
\operatorname{offset}_X(n,c,h,w)
================================

n\sigma_N
+
c\sigma_C
+
h\sigma_H
+
w\sigma_W.
}
\tag{7}
]

For contiguous NCHW,

[
\boxed{
\boldsymbol\sigma_X
===================

(CHW,HW,W,1).
}
]

For a channels-last physical representation of the same logical axes,

[
\boxed{
\boldsymbol\sigma_X
===================

(HWC,1,WC,C).
}
]

PyTorch's cuDNN tensor descriptor is explicitly built from actual tensor dimensions, strides, alignment, datatype and the selected memory format.

Therefore

[
\boxed{
\text{logical dimension order}
\neq
\text{physical contiguity order}.
}
]

NVIDIA documents NCHW and NHWC layouts and notes that layout can significantly affect Tensor Core convolution performance.

---

# 19. The cuDNN Convolution Descriptor Is the Mathematical Contract

PyTorch constructs a cuDNN convolution descriptor containing

[
\boxed{
\mathcal D_{\mathrm{conv}}
==========================

(
\tau_{\mathrm{compute}},
\operatorname{CROSS_CORRELATION},
P,
S,
D
).
}
]

More explicitly,

[
\boxed{
\mathcal D_{\mathrm{conv}}
==========================

\left[
\begin{array}{c}
\operatorname{DataType}\
\operatorname{CUDNN_CROSS_CORRELATION}\
\operatorname{NDims}=2\
(U,V)\
(P_h,P_w)*{\mathrm{pre}}\
(P_h,P_w)*{\mathrm{post}}\
(D_h,D_w)
\end{array}
\right].
}
]

PyTorch 2.13's cuDNN-v8 source sets these fields directly.

For FP16 or BF16 inputs, that path changes the convolution descriptor compute type to FP32:

[
\boxed{
\tau_X\in{\mathrm{FP16},\mathrm{BF16}}
\Rightarrow
\tau_{\mathrm{compute}}=\mathrm{FP32}.
}
]

Storage precision and accumulation/compute precision are therefore separate architectural dimensions.

---

# 20. cuDNN Separates Mathematical Specification from Engine Selection

PyTorch constructs a cuDNN operation

[
\boxed{
\mathcal O_{\mathrm{conv}}
==========================

\operatorname{ConvFwd}
(
\mathcal D_X,
\mathcal D_W,
\mathcal D_Y,
\mathcal D_{\mathrm{conv}}
).
}
]

It then creates an operation graph

[
\boxed{
\mathcal G
==========

{\mathcal O_{\mathrm{conv}}}.
}
]

PyTorch 2.13's v8 implementation explicitly creates one convolution-forward operation and places it into a cuDNN operation graph.

NVIDIA defines an operation graph as the mathematical specification of a dataflow graph and explicitly separates it from the engines capable of implementing that graph.

Therefore

[
\boxed{
\mathcal G_{\mathrm{Conv2d}}
\neq
\text{specific CUDA kernel}.
}
]

Instead,

[
\boxed{
\mathcal G
\xrightarrow{\operatorname{engine\ selection}}
E^\star.
}
]

This separation is fundamental to understanding modern GPU libraries.

---

# 21. Heuristic Path Versus Benchmark Path

PyTorch constructs a cache key containing the operation and convolution state, including tensor geometry, padding, stride, dilation, groups, determinism and TF32 policy. It first checks its execution-plan cache.

Thus

[
\boxed{
\kappa
======

\operatorname{Key}
(
X,W,Y,
P,S,D,G,
\mathrm{deterministic},
\mathrm{allowTF32},
\ldots
).
}
]

If

[
\operatorname{Cache}[\kappa]
============================

\Pi^\star,
]

then

[
\boxed{
\Pi^\star
\rightarrow
\operatorname{execute}
}
]

without repeating full plan discovery.

When benchmarking is disabled, PyTorch requests heuristic engine configurations and then fallback configurations if necessary. When benchmarking is enabled, it constructs valid execution plans, times candidates and sorts them by measured performance before attempting them.

The control flow is therefore

[
\boxed{
\operatorname{CacheHit}
?
\begin{cases}
\Pi_{\mathrm{cached}},
[1mm]
\operatorname{Heuristic/Fallback},
&\mathrm{benchmark}=0,
[1mm]
\operatorname{MeasuredPlanSearch},
&\mathrm{benchmark}=1.
\end{cases}
}
]

cuDNN itself defines operation graphs independently from engines and provides heuristics/autotuning mechanisms for selecting engine configurations.

---

# 22. Numerical Constraints Participate in Engine Filtering

PyTorch filters candidate cuDNN engine configurations according to numerical requirements.

If deterministic execution is requested,

[
\boxed{
E:
\operatorname{NONDETERMINISTIC}(E)
\Rightarrow
E\notin\mathcal E_{\mathrm{valid}}.
}
]

Engines marked as down-converting input precision are also filtered.

For FP32 convolutions with TF32 disallowed,

[
\boxed{
\operatorname{TensorCoreNote}(E)
\land
\neg\mathrm{allowTF32}
\Rightarrow
E\notin\mathcal E_{\mathrm{valid}}.
}
]

This filtering is explicit in PyTorch's cuDNN-v8 source.

Hence backend selection is not purely

[
\arg\min_E \operatorname{latency}(E).
]

It is more accurately

[
\boxed{
E^\star
=======

\arg\min_{E\in\mathcal E_{\mathrm{valid}}}
\operatorname{latency}(E)
}
]

subject to numerical and support constraints.

---

# 23. Runtime Binding and Execution

For the ordinary convolution graph, PyTorch creates a cuDNN variant pack binding

[
\boxed{
'x'\rightarrow\operatorname{ptr}(X),
}
]

[
\boxed{
'w'\rightarrow\operatorname{ptr}(W),
}
]

[
\boxed{
'y'\rightarrow\operatorname{ptr}(Y),
}
]

plus

[
\boxed{
\Omega_{\mathrm{workspace}}.
}
]

PyTorch then invokes

[
\boxed{
\operatorname{cudnnBackendExecute}
(
\Pi^\star,
\mathcal V
).
}
]

The three runtime tensor pointers and workspace binding are visible directly in the PyTorch 2.13 cuDNN-v8 implementation.

The high-level forward state is therefore

[
\boxed{
(X,W,\theta)
\rightarrow
\mathcal G
\rightarrow
\Pi^\star
\rightarrow
\mathcal V
\rightarrow
Y^{\mathrm{conv}}.
}
]

ATen then applies

[
\boxed{
Y
=

Y^{\mathrm{conv}}
+
b_{[1,K,1,1]}.
}
]

---

# 24. The Central cuDNN Lowering: Convolution as a Virtual GEMM

For dense convolution

[
G=1,
]

NVIDIA maps forward convolution to GEMM dimensions

[
\boxed{
M_{\mathrm{GEMM}}
=================

NPQ,
}
]

[
\boxed{
N_{\mathrm{GEMM}}
=================

K,
}
]

[
\boxed{
K_{\mathrm{GEMM}}
=================

CRS.
}
]

This mapping is explicitly documented by NVIDIA.

Define flattened output coordinate

[
\boxed{
m
=

(nP+p)Q+q.
}
]

Define reduction coordinate

[
\boxed{
\ell
====

(cR+r)S+s.
}
]

Now define a conceptual activation matrix

[
\boxed{
A_{\mathrm{virt}}
\in
\mathbb R^{NPQ\times CRS}.
}
]

Its elements are not arbitrary:

[
\boxed{
A_{\mathrm{virt}}[m,\ell]
=========================

\bar X_{
n,c,
pU-P_h+rD_h,
qV-P_w+sD_w
}.
}
\tag{8}
]

Define

[
\boxed{
B_{\mathrm{virt}}
\in
\mathbb R^{CRS\times K}
}
]

with

[
\boxed{
B_{\mathrm{virt}}[\ell,k]
=========================

W_{k,c,r,s}.
}
\tag{9}
]

Then

[
\boxed{
C_{\mathrm{virt}}
=================

A_{\mathrm{virt}}
B_{\mathrm{virt}}
}
]

where

[
\boxed{
C_{\mathrm{virt}}
\in
\mathbb R^{NPQ\times K}.
}
]

Specifically,

[
\boxed{
C_{\mathrm{virt}}[m,k]
======================

\sum_{\ell=0}^{CRS-1}
A_{\mathrm{virt}}[m,\ell]
B_{\mathrm{virt}}[\ell,k].
}
\tag{10}
]

Finally,

[
\boxed{
C_{\mathrm{virt}}
[((nP+p)Q+q),k]
\longleftrightarrow
Y^{\mathrm{conv}}_{n,k,p,q}.
}
\tag{11}
]

This equation exposes the exact relationship

[
\boxed{
\text{local spatial sampling}
\rightarrow
\text{matrix reduction space}
\rightarrow
\text{new channel representation}.
}
]

---

# 25. `A_virtual` Is Not `im2col` Materialized in Global Memory

This distinction is critical.

An explicit lowering would produce

[
A_{\mathrm{im2col}}
===================

\operatorname{MaterializePatches}(X)
]

followed by

[
C
=

A_{\mathrm{im2col}}B.
]

That would physically store a tensor of size

[
NPQ\times CRS.
]

NVIDIA's implicit-GEMM convolution instead operates directly on the original activation and weight tensors and forms the corresponding matrix interpretation on the fly; NVIDIA explicitly states that these virtual matrices are not created in memory.

Therefore

[
\boxed{
A_{\mathrm{virt}}
\text{ is an index-space abstraction, not a required allocated tensor.}
}
]

Conceptually,

[
\boxed{
X
\xrightarrow{\operatorname{address\ generation}}
A_{\mathrm{virt}}\text{-tile}
\xrightarrow{\operatorname{GEMM}}
C_{\mathrm{tile}}.
}
]

The global memory expansion

[
NCHW
\rightarrow
NPQCRS
]

is avoided.

---

# 26. Physical GPU Execution Must Be Described as a Tiled Reduction, Not a Seven-Level Scalar Loop

The mathematical operation is

[
\boxed{
C_{m,k}
=======

\sum_{\ell=0}^{CRS-1}
A_{m,\ell}B_{\ell,k}.
}
]

A generic tiled realization partitions

[
m
]

into tiles of width (T_M),

[
k
]

into tiles of width (T_N),

and the reduction axis

[
\ell
]

into tiles of width (T_K).

For one output tile,

[
\boxed{
C^{(t+1)}_{\mathcal M,\mathcal N}
=================================

C^{(t)}*{\mathcal M,\mathcal N}
+
A*{\mathcal M,\mathcal K_t}
B_{\mathcal K_t,\mathcal N}.
}
\tag{12}
]

with

[
\mathcal K_t
============

[tT_K,(t+1)T_K).
]

After all reduction tiles,

[
\boxed{
C_{\mathcal M,\mathcal N}
=========================

\sum_t
A_{\mathcal M,\mathcal K_t}
B_{\mathcal K_t,\mathcal N}.
}
]

NVIDIA documents that implicit GEMM divides its equivalent output matrix into tiles distributed across GPU multiprocessors.

What cannot truthfully be fixed from `torch.nn.Conv2d` is

[
\boxed{
(T_M,T_N,T_K),
}
]

the exact threadblock shape,

[
\boxed{
\text{warp mapping},
}
]

pipeline depth,

[
\boxed{
\text{shared-memory staging},
}
]

or exact Tensor Core instruction.

Those belong to

[
\boxed{
\Pi^\star
=========

\text{selected cuDNN execution plan}
}
]

and may change with device, cuDNN version, dtype, tensor shape, layout and convolution parameters.

---

# 27. cuDNN Is Not Restricted to Implicit GEMM

NVIDIA states that cuDNN convolution implementations include two broad classes:

[
\boxed{
\text{implicit-GEMM based}
}
]

and

[
\boxed{
\text{transform based}.
}
]

Transform-based implementations can include Winograd- or FFT-style transformations for supported cases.

Consequently,

[
\boxed{
\operatorname{Conv2d}
\not\Rightarrow
\operatorname{ImplicitGEMM}
\text{ for every configuration}.
}
]

The invariant is equation (1).

The engine realization is variable:

[
\boxed{
\mathcal A^\star
================

\operatorname{EngineSelect}
(
N,C,H,W,K,R,S,
P,U,D,G,
\tau,
\text{layout},
\text{GPU}
).
}
]

This is exactly why the cuDNN operation graph is intentionally separated from the implementing engine.

---

# 28. Compute Complexity

For each output scalar,

[
\boxed{
C_gRS
}
]

multiplications participate in the contraction.

The complete convolution therefore contains

[
\boxed{
N_{\mathrm{MAC}}
================

NKPQ
\frac CG
RS.
}
\tag{13}
]

For dense convolution,

[
\boxed{
N_{\mathrm{MAC}}
================

NKPQCRS.
}
]

NVIDIA gives the same dense forward-convolution MAC structure when describing implicit GEMM.

Under the common convention

[
1;\mathrm{MAC}
==============

1;\mathrm{multiply}
+
1;\mathrm{add}
==============

2;\mathrm{FLOPs},
]

the approximate arithmetic work is

[
\boxed{
\mathrm{FLOPs}
\approx
2NKPQ\frac CGRS.
}
]

Bias addition contributes an additional

[
\boxed{
NKPQ
}
]

scalar additions when enabled.

---

# 29. Convolution Has Two Independent Scaling Axes

The implicit-GEMM mapping exposes an important model-architecture property:

[
\boxed{
M=NPQ
}
]

measures the number of spatial/batch positions processed,

while

[
\boxed{
K=C_{\mathrm{out}}
}
]

measures output feature width,

and

[
\boxed{
K_{\mathrm{red}}
================

\frac CGRS
}
]

measures local feature-reduction width.

Thus architectural changes act differently:

Increasing image resolution primarily increases

[
NPQ.
]

Increasing output channels increases

[
K.
]

Increasing input channels or kernel area increases

[
K_{\mathrm{red}}.
]

Increasing stride commonly decreases

[
PQ.
]

Increasing dilation can increase geometric receptive field while leaving

[
RS
]

and therefore the reduction length unchanged.

This explains a non-obvious property:

[
\boxed{
\text{larger geometric receptive field via dilation}
\not\Rightarrow
\text{proportionally larger arithmetic reduction}.
}
]

---

# 30. Representation-Level Interpretation

For a fixed output coordinate ((p,q)),

[
\mathcal X_{n,p,q}
\in
\mathbb R^{C_g\times R\times S}
]

is a localized structured measurement of the previous representation.

Flattening only for algebraic interpretation,

[
x_{n,p,q}
=========

\operatorname{vec}(\mathcal X_{n,p,q})
\in
\mathbb R^{C_gRS}.
]

The filters of group (g) form

[
\boxed{
\mathbf W_g
\in
\mathbb R^{K_g\times C_gRS}.
}
]

Therefore

[
\boxed{
y_{n,p,q}^{(g)}
===============

\mathbf W_gx_{n,p,q}^{(g)}
+b_g.
}
\tag{14}
]

Conv2d is consequently a spatially shared family of affine projections

[
\boxed{
f_\theta:
\mathbb R^{C_gRS}
\rightarrow
\mathbb R^{K_g}.
}
]

The key restriction relative to a fully connected layer is not the local computation itself; it is the structural constraint

[
\boxed{
f_{\theta,p,q}=f_\theta
\quad
\forall(p,q).
}
]

The same parameterized local transformation is reused throughout space.

---

# 31. What Information Is Preserved and What Is Discarded?

A single output activation

[
Y_{n,k,p,q}
]

compresses

[
C_gRS
]

input values into one scalar.

Thus

[
\boxed{
\mathbb R^{C_gRS}
\rightarrow
\mathbb R
}
]

for each filter.

With (K_g) filters,

[
\boxed{
\mathbb R^{C_gRS}
\rightarrow
\mathbb R^{K_g}.
}
]

Whether this transformation expands or contracts representation dimension depends on

[
K_g
\quad\text{versus}\quad
C_gRS.
]

But locality and stride introduce additional spatial information constraints.

If

[
U>1
\quad\text{or}\quad
V>1,
]

not every potential receptive-field origin is represented in the output lattice.

If a downstream inversion problem is considered, ordinary strided convolution is generally not bijective without additional structural assumptions.

Thus “feature extraction” mathematically means

[
\boxed{
\text{local linear projection}
+
\text{shared spatial application}
+
\text{possibly reduced spatial sampling}.
}
]

---

# 32. Padding, Stride and Dilation Control Different Geometric Degrees of Freedom

Their roles can be separated exactly:

[
\boxed{
P
:
\text{changes accessible coordinate domain / origin alignment}
}
]

[
\boxed{
U,V
:
\text{change spacing between receptive-field origins}
}
]

[
\boxed{
D_h,D_w
:
\text{change spacing between samples inside each receptive field}
}
]

[
\boxed{
R,S
:
\text{change number of learned spatial coefficients}
}
]

[
\boxed{
G
:
\text{changes channel connectivity}
}
]

[
\boxed{
K
:
\text{changes dimensionality of the learned output feature basis}.
}
]

These parameters therefore act on different axes of the representation geometry and should not be treated as interchangeable “convolution settings.”

---

# 33. Source-Accurate End-to-End Forward Pseudo-Algorithm

[
\boxed{
\begin{aligned}
\mathbf{Input}\quad
&
X\in
\mathbb R^{N\times C\times H\times W}
[1mm]
\mathbf{Weights}\quad
&
W\in
\mathbb R^{K\times(C/G)\times R\times S}
\
&
b\in\mathbb R^K
[2mm]
\mathbf{Validate}\quad
&
G>0,
\quad
C\bmod G=0,
\quad
K\bmod G=0
[2mm]
\mathbf{Geometry}\quad
&
R_{\mathrm{eff}}
================

D_h(R-1)+1
\
&
S_{\mathrm{eff}}
================

D_w(S-1)+1
[1mm]
&
P=
\left\lfloor
\frac{H+2P_h-R_{\mathrm{eff}}}{U}
\right\rfloor+1
\
&
Q=
\left\lfloor
\frac{W+2P_w-S_{\mathrm{eff}}}{V}
\right\rfloor+1
[3mm]
\mathbf{SpatialMap}\quad
&
h=pU-P_h+rD_h
\
&
w=qV-P_w+sD_w
[3mm]
\mathbf{GroupMap}\quad
&
C_g=C/G,
\qquad
K_g=K/G
\
&
g(k)=
\left\lfloor
k/K_g
\right\rfloor
[3mm]
\mathbf{SemanticReduction}\quad
&
Y^{\mathrm{conv}}_{n,k,p,q}
===========================

\sum_{c=0}^{C_g-1}
\sum_{r=0}^{R-1}
\sum_{s=0}^{S-1}
W_{k,c,r,s}
[-1mm]
&
\hspace{32mm}\cdot
\bar X_{
n,,
g(k)C_g+c,,
pU-P_h+rD_h,,
qV-P_w+sD_w
}
[3mm]
\mathbf{ATenDispatch}\quad
&
\mathcal B^\star
================

\operatorname{SelectBackend}
(X,W,\theta)
[2mm]
\mathbf{if}\quad
&
\mathcal B^\star=\operatorname{cuDNN}
[1mm]
\mathbf{Descriptors}\quad
&
\mathcal D_X,\mathcal D_W,\mathcal D_Y
\leftarrow
(\mathrm{shape,strides,dtype,alignment})
\
&
\mathcal D_{\mathrm{conv}}
\leftarrow
(
P,U,D,
\operatorname{CROSS_CORRELATION},
\tau_{\mathrm{compute}}
)
[3mm]
\mathbf{Graph}\quad
&
\mathcal G
==========

\operatorname{ConvFwd}
(
\mathcal D_X,\mathcal D_W,
\mathcal D_Y,\mathcal D_{\mathrm{conv}}
)
[3mm]
\mathbf{Plan}\quad
&
\Pi^\star
=========

\operatorname{PlanSelect}
(
\mathcal G,
\mathrm{benchmark},
\mathrm{deterministic},
\mathrm{allowTF32}
)
[3mm]
\mathbf{RuntimeBind}\quad
&
\mathcal V
==========

{
X\mapsto p_X,
W\mapsto p_W,
Y\mapsto p_Y,
\Omega_{\mathrm{ws}}
}
[3mm]
\mathbf{Execute}\quad
&
Y^{\mathrm{conv}}
=================

\operatorname{cudnnBackendExecute}
(
\Pi^\star,\mathcal V
)
[3mm]
\mathbf{Bias}\quad
&
Y_{n,k,p,q}
===========

Y^{\mathrm{conv}}_{n,k,p,q}
+b_k
[3mm]
\mathbf{Output}\quad
&
\boxed{
Y\in
\mathbb R^{N\times K\times P\times Q}.
}
\end{aligned}
}
\tag{15}
]

The PyTorch dispatch, separate bias handling, cuDNN tensor/conv descriptors, operation graph, plan discovery/cache, variant pack and backend execution in this state machine are directly represented in the PyTorch 2.13 source.

---

# 34. Final Architectural Compression

The complete operator can be reduced to four coupled mappings.

### Spatial-coordinate mapping

[
\boxed{
(p,q,r,s)
\mapsto
(
pU-P_h+rD_h,,
qV-P_w+sD_w
).
}
]

### Local representation extraction

[
\boxed{
X_{NCHW}
\rightarrow
\mathcal X_{NPQ\times(C/G)RS}.
}
]

### Learned channel projection

[
\boxed{
\mathbb R^{(C/G)RS}
\xrightarrow{W}
\mathbb R^{K/G}.
}
]

### GPU lowering

[
\boxed{
\underbrace{
[NPQ\times(C/G)RS]
}*{A*{\mathrm{virtual}}}
;
\underbrace{
[(C/G)RS\times K/G]
}*{B*{\mathrm{virtual}}}
\rightarrow
\underbrace{
[NPQ\times K/G]
}*{C*{\mathrm{virtual}}}
}
]

for each group, with the implicit matrices not necessarily materialized.

NVIDIA documents the dense forward mapping as

[
\boxed{
(NPQ\times CRS)
(CRS\times K)
\rightarrow
(NPQ\times K)
}
]

and explicitly states that implicit GEMM forms this matrix-multiplication interpretation on the fly rather than allocating the expanded matrices.

Therefore, at principal model-architecture resolution,

[
\boxed{
\begin{aligned}
X_{NCHW}
&\xrightarrow{
\text{spatial coordinate transform}
}
\text{local receptive-field lattice}
\
&\xrightarrow{
\text{channel + spatial contraction}
}
Y_{NKPQ}
\
&\xrightarrow{
\text{representation hierarchy}
}
\text{new spatial feature field}.
\end{aligned}
}
]

And at the systems level,

[
\boxed{
\begin{aligned}
\operatorname{Conv2d}
&\rightarrow
F.\operatorname{conv2d}
\
&\rightarrow
\operatorname{ATen\ convolution}
\
&\rightarrow
\operatorname{backend\ selection}
\
&\rightarrow
\operatorname{cuDNN\ descriptors}
\
&\rightarrow
\operatorname{operation\ graph}
\
&\rightarrow
\operatorname{engine\ configuration}
\
&\rightarrow
\operatorname{execution\ plan}
\
&\rightarrow
\operatorname{virtual/tiled\ contraction}
\
&\rightarrow
Y^{\mathrm{conv}}
\
&\rightarrow
+b
\
&\rightarrow
Y.
\end{aligned}
}
]

That is the complete architectural interpretation: **`Conv2d` is a shared, locally connected linear representation operator whose spatial coordinate system is controlled by padding, stride and dilation; whose channel connectivity is controlled by groups; whose output resolution follows an exact discrete geometry; and whose GPU realization is selected dynamically beneath a mathematical operation graph rather than being defined by the Python-layer convolution abstraction.**
