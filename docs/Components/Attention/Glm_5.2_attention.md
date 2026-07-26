[
\boxed{
\mathrm{DSA}
\equiv
\mathrm{DeepSeek\ Sparse\ Attention}
}
]

[
\boxed{
\mathrm{GLM\text{-}5.2\ Attention}
==================================

\mathrm{MLA}
+
\mathrm{DSA}
+
\mathrm{cross\text{-}layer\ index\ sharing}
}
]

---

# 1. Source-locked GLM-5.2 dimensions

[
X\in\mathbb{R}^{B\times T\times d}
]

[
Y\in\mathbb{R}^{B\times T\times d}
]

[
\begin{aligned}
d&=d_{\mathrm{model}}=6144,\
h&=64,\
r_q&=2048,\
r_{kv}&=512,\
d_n&=192,\
d_r&=64,\
d_{qk}&=d_n+d_r=256,\
d_v&=256,\
h_I&=32,\
d_I&=128,\
d_I^R&=64,\
d_I^N&=d_I-d_I^R=64,\
k&=2048,\
\theta&=8{,}000{,}000,\
N_L&=78,\
T_{\max}&=1{,}048{,}576.
\end{aligned}
]

[
\boxed{
h,d_{qk}
========

# 64\cdot256

16384
}
]

[
\boxed{
h,d_v
=====

# 64\cdot256

16384
}
]

[
\boxed{
r_{kv}+d_r
==========

# 512+64

576
}
]

[
\boxed{
h_I d_I
=======

# 32\cdot128

4096
}
]

([Hugging Face][1])

---

# 2. Decoder pre-normalization

[
\bar X
======

\operatorname{RMSNorm}_{d}(X)
\in
\mathbb{R}^{B\times T\times d}
]

[
\mu_{\mathrm{RMS}}^2(\bar x)
============================

\frac{1}{d}
\sum_{a=1}^{d}x_a^2
]

[
\operatorname{RMSNorm}_{d}(x)
=============================

\gamma_x
\odot
\frac{x}{
\sqrt{
\frac{1}{d}\sum_{a=1}^{d}x_a^2+\epsilon
}}
]

[
\gamma_x\in\mathbb{R}^{d}
]

---

# 3. MLA query compression

[
W_{DQ}
\in
\mathbb{R}^{d\times r_q}
========================

\mathbb{R}^{6144\times2048}
]

[
C^{Q,\mathrm{raw}}
==================

\bar XW_{DQ}
]

[
(B,T,6144)
@
(6144,2048)
\rightarrow
(B,T,2048)
]

[
C^{Q,\mathrm{raw}}
\in
\mathbb{R}^{B\times T\times r_q}
]

[
C^Q
===

\operatorname{RMSNorm}_{r_q}
\left(
C^{Q,\mathrm{raw}}
\right)
\in
\mathbb{R}^{B\times T\times r_q}
]

[
\boxed{
C^Q
\in
\mathbb{R}^{B\times T\times2048}
}
]

---

# 4. MLA query up-projection

[
W_{UQ}
======

\left[
W_{UQ}^{N}
;;
W_{UQ}^{R}
\right]
]

[
W_{UQ}^{N}
\in
\mathbb{R}^{r_q\times hd_n}
===========================

\mathbb{R}^{2048\times12288}
]

[
W_{UQ}^{R}
\in
\mathbb{R}^{r_q\times hd_r}
===========================

\mathbb{R}^{2048\times4096}
]

[
W_{UQ}
\in
\mathbb{R}^{r_q\times h(d_n+d_r)}
=================================

\mathbb{R}^{2048\times16384}
]

[
Q^{\mathrm{flat}}
=================

C^QW_{UQ}
]

[
(B,T,2048)
@
(2048,16384)
\rightarrow
(B,T,16384)
]

[
Q^{\mathrm{flat}}
\in
\mathbb{R}^{B\times T\times h d_{qk}}
]

[
Q^{\mathrm{flat}}
:
(B,T,16384)
\rightarrow
(B,T,64,256)
\rightarrow
(B,64,T,256)
]

[
Q^{\mathrm{raw}}
\in
\mathbb{R}^{B\times h\times T\times d_{qk}}
]

[
Q^{\mathrm{raw}}
================

\left[
Q^N
;;;
Q^{R,\mathrm{raw}}
\right]
]

[
Q^N
\in
\mathbb{R}^{B\times64\times T\times192}
]

[
Q^{R,\mathrm{raw}}
\in
\mathbb{R}^{B\times64\times T\times64}
]

([GitHub][2])

---

# 5. Joint latent-KV and shared positional-key projection

[
W_{DKV}^{A}
===========

\left[
W_{DKV}^{C}
;;
W_{KR}
\right]
]

[
W_{DKV}^{C}
\in
\mathbb{R}^{d\times r_{kv}}
===========================

\mathbb{R}^{6144\times512}
]

[
W_{KR}
\in
\mathbb{R}^{d\times d_r}
========================

\mathbb{R}^{6144\times64}
]

[
W_{DKV}^{A}
\in
\mathbb{R}^{d\times(r_{kv}+d_r)}
================================

\mathbb{R}^{6144\times576}
]

[
U^{KV}
======

\bar XW_{DKV}^{A}
]

[
(B,T,6144)
@
(6144,576)
\rightarrow
(B,T,576)
]

[
U^{KV}
======

\left[
C^{KV,\mathrm{raw}}
;;;
K^{R,\mathrm{raw}}
\right]
]

[
C^{KV,\mathrm{raw}}
\in
\mathbb{R}^{B\times T\times512}
]

[
K^{R,\mathrm{raw}}
\in
\mathbb{R}^{B\times T\times64}
]

[
C^{KV}
======

\operatorname{RMSNorm}*{r*{kv}}
\left(
C^{KV,\mathrm{raw}}
\right)
]

[
\boxed{
C^{KV}
\in
\mathbb{R}^{B\times T\times512}
}
]

[
\boxed{
K^{R,\mathrm{raw}}
\in
\mathbb{R}^{B\times T\times64}
}
]

---

# 6. Head-specific NoPE-key and value reconstruction

[
W_{UKV}
=======

\left[
W_{UK}
;;
W_{UV}
\right]
]

[
W_{UK}
\in
\mathbb{R}^{r_{kv}\times hd_n}
==============================

\mathbb{R}^{512\times12288}
]

[
W_{UV}
\in
\mathbb{R}^{r_{kv}\times hd_v}
==============================

\mathbb{R}^{512\times16384}
]

[
W_{UKV}
\in
\mathbb{R}^{r_{kv}\times h(d_n+d_v)}
]

[
\boxed{
W_{UKV}
\in
\mathbb{R}^{512\times28672}
}
]

[
U^{N,V}
=======

C^{KV}W_{UKV}
]

[
(B,T,512)
@
(512,28672)
\rightarrow
(B,T,28672)
]

[
U^{N,V}
:
(B,T,28672)
\rightarrow
(B,T,64,448)
\rightarrow
(B,64,T,448)
]

[
U^{N,V}
=======

\left[
K^N
;;;
V
\right]
]

[
\boxed{
K^N
\in
\mathbb{R}^{B\times64\times T\times192}
}
]

[
\boxed{
V
\in
\mathbb{R}^{B\times64\times T\times256}
}
]

[
W_{UK}
======

\left[
W_{UK}^{(1)}
;
\cdots
;
W_{UK}^{(64)}
\right]
]

[
W_{UK}^{(i)}
\in
\mathbb{R}^{512\times192}
]

[
K_i^N
=====

C^{KV}W_{UK}^{(i)}
\in
\mathbb{R}^{B\times T\times192}
]

[
W_{UV}
======

\left[
W_{UV}^{(1)}
;
\cdots
;
W_{UV}^{(64)}
\right]
]

[
W_{UV}^{(i)}
\in
\mathbb{R}^{512\times256}
]

[
V_i
===

C^{KV}W_{UV}^{(i)}
\in
\mathbb{R}^{B\times T\times256}
]

([GitHub][2])

---

# 7. Interleaved RoPE frequencies

[
N_R
===

# \frac{d_r}{2}

32
]

[
m\in{0,\ldots,31}
]

[
\omega_m
========

\theta^{-\frac{2m}{d_r}}
]

[
\boxed{
\omega_m
========

(8{,}000{,}000)^{-\frac{2m}{64}}
}
]

[
\phi_{p,m}
==========

p\omega_m
]

[
c_{p,m}
=======

\cos(p\omega_m)
]

[
s_{p,m}
=======

\sin(p\omega_m)
]

[
R_m(p)
======

\begin{bmatrix}
\cos(p\omega_m)&-\sin(p\omega_m)\
\sin(p\omega_m)&\cos(p\omega_m)
\end{bmatrix}
]

[
\mathcal R_p
============

\operatorname{blockdiag}
\left(
R_0(p),
R_1(p),
\ldots,
R_{31}(p)
\right)
\in
\mathbb{R}^{64\times64}
]

[
\mathcal R_p^\top
=================

\mathcal R_{-p}
]

[
\mathcal R_p^\top\mathcal R_q
=============================

\mathcal R_{q-p}
]

---

# 8. Main-MLA query RoPE

[
Q^R_{b,i,p,:}
=============

\mathcal R_p
Q^{R,\mathrm{raw}}_{b,i,p,:}
]

[
Q^R
\in
\mathbb{R}^{B\times64\times T\times64}
]

For

[
m\in{0,\ldots,31},
]

[
\boxed{
Q^R_{b,i,p,2m}
==============

Q^{R,\mathrm{raw}}_{b,i,p,2m}
\cos(p\omega_m)
---------------

Q^{R,\mathrm{raw}}_{b,i,p,2m+1}
\sin(p\omega_m)
}
]

[
\boxed{
Q^R_{b,i,p,2m+1}
================

Q^{R,\mathrm{raw}}*{b,i,p,2m}
\sin(p\omega_m)
+
Q^{R,\mathrm{raw}}*{b,i,p,2m+1}
\cos(p\omega_m)
}
]

---

# 9. Shared main-MLA key RoPE

[
K^R_{b,q,:}
===========

\mathcal R_q
K^{R,\mathrm{raw}}_{b,q,:}
]

[
K^R
\in
\mathbb{R}^{B\times T\times64}
]

[
K^R:
(B,T,64)
\rightarrow
(B,1,T,64)
]

[
K^R_{b,i,q,:}
=============

K^R_{b,q,:},
\qquad
\forall i\in{0,\ldots,63}
]

[
\boxed{
K^R_{b,q,2m}
============

K^{R,\mathrm{raw}}_{b,q,2m}
\cos(q\omega_m)
---------------

K^{R,\mathrm{raw}}_{b,q,2m+1}
\sin(q\omega_m)
}
]

[
\boxed{
K^R_{b,q,2m+1}
==============

K^{R,\mathrm{raw}}*{b,q,2m}
\sin(q\omega_m)
+
K^{R,\mathrm{raw}}*{b,q,2m+1}
\cos(q\omega_m)
}
]

([Hugging Face][3])

---

# 10. Complete main query, key and value

[
Q
=

\left[
Q^N
;;;
Q^R
\right]
]

[
\boxed{
Q
\in
\mathbb{R}^{B\times64\times T\times256}
}
]

[
K
=

\left[
K^N
;;;
K^R
\right]
]

[
\boxed{
K
\in
\mathbb{R}^{B\times64\times T\times256}
}
]

[
\boxed{
V
\in
\mathbb{R}^{B\times64\times T\times256}
}
]

[
Q_{b,i,p}^{\top}K_{b,i,q}
=========================

(Q^N_{b,i,p})^\top K^N_{b,i,q}
+
(Q^R_{b,i,p})^\top K^R_{b,q}
]

[
\boxed{
Q_{b,i,p}^{\top}K_{b,i,q}
=========================

(Q^N_{b,i,p})^\top K^N_{b,i,q}
+
(Q^{R,\mathrm{raw}}*{b,i,p})^\top
\mathcal R*{q-p}
K^{R,\mathrm{raw}}_{b,q}
}
]

---

# 11. DSA lightning-indexer dimensions

[
h_I=32
]

[
d_I=128
]

[
d_I^R=d_r=64
]

[
d_I^N=d_I-d_I^R=64
]

[
W_{IQ}
\in
\mathbb{R}^{r_q\times h_Id_I}
=============================

\mathbb{R}^{2048\times4096}
]

[
W_{IK}
\in
\mathbb{R}^{d\times d_I}
========================

\mathbb{R}^{6144\times128}
]

[
W_{IW}
\in
\mathbb{R}^{d\times h_I}
========================

\mathbb{R}^{6144\times32}
]

---

# 12. DSA indexer-query path

[
Q^{I,\mathrm{flat}}
===================

C^QW_{IQ}
]

[
(B,T,2048)
@
(2048,4096)
\rightarrow
(B,T,4096)
]

[
Q^{I,\mathrm{flat}}
:
(B,T,4096)
\rightarrow
(B,T,32,128)
]

[
Q^{I,\mathrm{raw}}
\in
\mathbb{R}^{B\times T\times32\times128}
]

[
Q^{I,\mathrm{raw}}
==================

\left[
Q^{I,R,\mathrm{raw}}
;;;
Q^{I,N}
\right]
]

[
Q^{I,R,\mathrm{raw}}
\in
\mathbb{R}^{B\times T\times32\times64}
]

[
Q^{I,N}
\in
\mathbb{R}^{B\times T\times32\times64}
]

[
Q^{I,R}_{b,p,a,:}
=================

\mathcal R_p
Q^{I,R,\mathrm{raw}}_{b,p,a,:}
]

[
Q^I
===

\left[
Q^{I,R}
;;;
Q^{I,N}
\right]
]

[
\boxed{
Q^I
\in
\mathbb{R}^{B\times T\times32\times128}
}
]

---

# 13. DSA indexer-key path

[
K^{I,\mathrm{pre}}
==================

\bar XW_{IK}
]

[
(B,T,6144)
@
(6144,128)
\rightarrow
(B,T,128)
]

[
K^{I,\mathrm{pre}}
\in
\mathbb{R}^{B\times T\times128}
]

[
\mu_{b,q}^{I}
=============

\frac{1}{d_I}
\sum_{r=1}^{d_I}
K^{I,\mathrm{pre}}_{b,q,r}
]

[
(\sigma_{b,q}^{I})^2
====================

\frac{1}{d_I}
\sum_{r=1}^{d_I}
\left(
K^{I,\mathrm{pre}}_{b,q,r}
--------------------------

\mu_{b,q}^{I}
\right)^2
]

[
K^{I,\mathrm{raw}}_{b,q,r}
==========================

\gamma_r^I
\frac{
K^{I,\mathrm{pre}}_{b,q,r}
--------------------------

\mu_{b,q}^{I}
}{
\sqrt{
(\sigma_{b,q}^{I})^2+\epsilon_I
}
}
+
\beta_r^I
]

[
K^{I,\mathrm{raw}}
==================

\operatorname{LayerNorm}_{128}
\left(
K^{I,\mathrm{pre}}
\right)
]

[
K^{I,\mathrm{raw}}
==================

\left[
K^{I,R,\mathrm{raw}}
;;;
K^{I,N}
\right]
]

[
K^{I,R,\mathrm{raw}}
\in
\mathbb{R}^{B\times T\times64}
]

[
K^{I,N}
\in
\mathbb{R}^{B\times T\times64}
]

[
K^{I,R}_{b,q,:}
===============

\mathcal R_q
K^{I,R,\mathrm{raw}}_{b,q,:}
]

[
K^I
===

\left[
K^{I,R}
;;;
K^{I,N}
\right]
]

[
\boxed{
K^I
\in
\mathbb{R}^{B\times T\times128}
}
]

([GitHub][2])

---

# 14. DSA indexer headwise similarity

[
G^I_{b,p,a,q}
=============

\frac{
(Q^I_{b,p,a,:})^\top
K^I_{b,q,:}
}{
\sqrt{d_I}
}
]

[
(B,T,32,128)
@
(B,1,128,T)
\rightarrow
(B,T,32,T)
]

[
\boxed{
G^I
\in
\mathbb{R}^{B\times T\times32\times T}
}
]

[
G^I_{b,p,a,q}
=============

\frac{1}{\sqrt{128}}
\left[
(Q^{I,N}*{b,p,a})^\top K^{I,N}*{b,q}
+
(Q^{I,R,\mathrm{raw}}*{b,p,a})^\top
\mathcal R*{q-p}
K^{I,R,\mathrm{raw}}_{b,q}
\right]
]

[
R^I
===

\operatorname{ReLU}(G^I)
]

[
R^I_{b,p,a,q}
=============

\max
\left(
0,
G^I_{b,p,a,q}
\right)
]

[
R^I
\in
\mathbb{R}^{B\times T\times32\times T}
]

---

# 15. DSA learned index-head weighting

[
\Omega^{I,\mathrm{raw}}
=======================

\bar XW_{IW}
]

[
(B,T,6144)
@
(6144,32)
\rightarrow
(B,T,32)
]

[
\Omega^{I,\mathrm{raw}}
\in
\mathbb{R}^{B\times T\times32}
]

[
\Omega^I
========

\frac{
\Omega^{I,\mathrm{raw}}
}{
\sqrt{h_I}
}
]

[
\boxed{
\Omega^I
========

\frac{
\bar XW_{IW}
}{
\sqrt{32}
}
}
]

---

# 16. Aggregated DSA index score

[
I_{b,p,q}
=========

\sum_{a=1}^{h_I}
\Omega^I_{b,p,a}
R^I_{b,p,a,q}
]

[
\boxed{
I_{b,p,q}
=========

\frac{1}{\sqrt{32}}
\sum_{a=1}^{32}
(\bar XW_{IW})*{b,p,a}
\operatorname{ReLU}
\left[
\frac{
(Q^I*{b,p,a})^\top K^I_{b,q}
}{
\sqrt{128}
}
\right]
}
]

[
(B,T,1,32)
@
(B,T,32,T)
\rightarrow
(B,T,1,T)
]

[
\boxed{
I
\in
\mathbb{R}^{B\times T\times T}
}
]

([GitHub][2])

---

# 17. Causal and padding constraints for the indexer

[
M^{I,\mathrm{causal}}_{p,q}
===========================

\begin{cases}
0,&q\le p,\
-\infty,&q>p
\end{cases}
]

[
M^{I}
=====

M^{I,\mathrm{causal}}
+
M^{I,\mathrm{padding}}
]

[
\widetilde I_{b,p,q}
====================

I_{b,p,q}
+
M^I_{b,p,q}
]

[
\widetilde I
\in
\mathbb{R}^{B\times T\times T}
]

[
k'
==

# \min(k,T)

\min(2048,T)
]

[
\boldsymbol{\tau}_{b,p}
=======================

\operatorname{TopKIndices}*{k'}
\left(
\widetilde I*{b,p,:}
\right)
]

[
\boxed{
\boldsymbol{\tau}
\in
\mathbb{N}^{B\times T\times k'}
}
]

[
\boldsymbol{\tau}_{b,p}
=======================

\left[
\tau_{b,p,1},
\ldots,
\tau_{b,p,k'}
\right]
]

[
\mathcal T_{b,p}
================

\left{
\tau_{b,p,u}
:
1\le u\le k',
;
\tau_{b,p,u}\le p
\right}
]

[
|\mathcal T_{b,p}|
\le
\min(2048,p+1)
]

---

# 18. GLM-5.2 cross-layer IndexShare pattern

[
\ell
\in
{0,\ldots,77}
]

[
\mathcal F
==========

{0,1,2}
\cup
{4m+2:m=1,\ldots,18}
]

[
\boxed{
\mathcal F
==========

{
0,1,2,6,10,14,\ldots,74
}
}
]

[
|\mathcal F|=21
]

[
\mathcal S
==========

{0,\ldots,77}\setminus\mathcal F
]

[
|\mathcal S|
============

# 78-21

57
]

[
f(\ell)
=======

\max
\left{
j\in\mathcal F:j<\ell
\right}
]

[
\boxed{
\boldsymbol{\tau}^{(\ell)}_{b,p}
================================

\begin{cases}
\operatorname{TopKIndices}*{k'}
\left(
\widetilde I^{(\ell)}*{b,p,:}
\right),
&
\ell\in\mathcal F,
[2mm]
\boldsymbol{\tau}^{(f(\ell))}_{b,p},
&
\ell\in\mathcal S.
\end{cases}
}
]

[
\begin{aligned}
\boldsymbol{\tau}^{(2)}
&\rightarrow
\boldsymbol{\tau}^{(3)},
\boldsymbol{\tau}^{(4)},
\boldsymbol{\tau}^{(5)},\
\boldsymbol{\tau}^{(6)}
&\rightarrow
\boldsymbol{\tau}^{(7)},
\boldsymbol{\tau}^{(8)},
\boldsymbol{\tau}^{(9)},\
\boldsymbol{\tau}^{(10)}
&\rightarrow
\boldsymbol{\tau}^{(11)},
\boldsymbol{\tau}^{(12)},
\boldsymbol{\tau}^{(13)},\
&\vdots\
\boldsymbol{\tau}^{(74)}
&\rightarrow
\boldsymbol{\tau}^{(75)},
\boldsymbol{\tau}^{(76)},
\boldsymbol{\tau}^{(77)}.
\end{aligned}
]

([Hugging Face][1])

---

# 19. Sparse-attention additive mask

[
M^{\mathrm{DSA},(\ell)}_{b,p,q}
===============================

\begin{cases}
0,
&
q\in\mathcal T^{(\ell)}_{b,p}
\land
q\le p,
\
-\infty,
&
\text{otherwise}.
\end{cases}
]

[
M^{\mathrm{DSA},(\ell)}
\in
\mathbb{R}^{B\times1\times T\times T}
]

[
M^{\mathrm{DSA},(\ell)}
\longrightarrow
\operatorname{broadcast}
\left(
B,64,T,T
\right)
]

---

# 20. Dense-mask-equivalent main MLA score

[
S^{(\ell)}_{b,i,p,q}
====================

\frac{
(Q^N_{b,i,p})^\top K^N_{b,i,q}
+
(Q^R_{b,i,p})^\top K^R_{b,q}
}{
\sqrt{d_{qk}}
}
+
M^{\mathrm{DSA},(\ell)}_{b,p,q}
]

[
\boxed{
S^{(\ell)}_{b,i,p,q}
====================

\frac{
(Q^N_{b,i,p})^\top K^N_{b,i,q}
+
(Q^{R,\mathrm{raw}}*{b,i,p})^\top
\mathcal R*{q-p}
K^{R,\mathrm{raw}}*{b,q}
}{
\sqrt{256}
}
+
M^{\mathrm{DSA},(\ell)}*{b,p,q}
}
]

[
S^{(\ell)}
\in
\mathbb{R}^{B\times64\times T\times T}
]

[
A^{(\ell)}
==========

\operatorname{softmax}_{q}
\left(
S^{(\ell)}
\right)
]

[
A^{(\ell)}
\in
\mathbb{R}^{B\times64\times T\times T}
]

[
H^{(\ell)}
==========

A^{(\ell)}V
]

[
(B,64,T,T)
@
(B,64,T,256)
\rightarrow
(B,64,T,256)
]

[
H^{(\ell)}
\in
\mathbb{R}^{B\times64\times T\times256}
]

---

# 21. Explicit sparse-gather form

[
\bar K^N_{b,i,p,u,:}
====================

K^N_{b,i,\tau_{b,p,u},:}
]

[
\bar K^N
\in
\mathbb{R}^{B\times64\times T\times k'\times192}
]

[
\bar K^R_{b,p,u,:}
==================

K^R_{b,\tau_{b,p,u},:}
]

[
\bar K^R
\in
\mathbb{R}^{B\times1\times T\times k'\times64}
]

[
\bar V_{b,i,p,u,:}
==================

V_{b,i,\tau_{b,p,u},:}
]

[
\bar V
\in
\mathbb{R}^{B\times64\times T\times k'\times256}
]

[
S^{\mathrm{sparse}}_{b,i,p,u}
=============================

\frac{
(Q^N_{b,i,p})^\top
\bar K^N_{b,i,p,u}
+
(Q^R_{b,i,p})^\top
\bar K^R_{b,p,u}
}{
\sqrt{256}
}
]

[
S^{\mathrm{sparse}}
\in
\mathbb{R}^{B\times64\times T\times k'}
]

[
A^{\mathrm{sparse}}_{b,i,p,u}
=============================

\frac{
\exp
\left(
S^{\mathrm{sparse}}*{b,i,p,u}
\right)
}{
\displaystyle
\sum*{v:\tau_{b,p,v}\le p}
\exp
\left(
S^{\mathrm{sparse}}_{b,i,p,v}
\right)
}
]

[
A^{\mathrm{sparse}}
\in
\mathbb{R}^{B\times64\times T\times k'}
]

[
\boxed{
H_{b,i,p,r}
===========

\sum_{\substack{u=1\\tau_{b,p,u}\le p}}^{k'}
A^{\mathrm{sparse}}*{b,i,p,u}
\bar V*{b,i,p,u,r}
}
]

[
(B,64,T,k')
@
(B,64,T,k',256)
\rightarrow
(B,64,T,256)
]

([GitHub][2])

---

# 22. NoPE key-projection absorption

For head (i),

[
K_i^N
=====

C^{KV}W_{UK}^{(i)}
]

[
Q_i^N(K_i^N)^\top
=================

Q_i^N
\left(
C^{KV}W_{UK}^{(i)}
\right)^\top
]

# [

Q_i^N
\left(
W_{UK}^{(i)}
\right)^\top
(C^{KV})^\top
]

[
\widehat Q_i^N
==============

Q_i^N
\left(
W_{UK}^{(i)}
\right)^\top
]

[
(B,T,192)
@
(192,512)
\rightarrow
(B,T,512)
]

[
\boxed{
\widehat Q^N
\in
\mathbb{R}^{B\times64\times T\times512}
}
]

[
\boxed{
Q_i^N(K_i^N)^\top
=================

\widehat Q_i^N(C^{KV})^\top
}
]

---

# 23. Sparse latent gather

[
\bar C^{KV}_{b,p,u,c}
=====================

C^{KV}*{b,\tau*{b,p,u},c}
]

[
\bar C^{KV}
\in
\mathbb{R}^{B\times T\times k'\times512}
]

[
\bar K^{R,\mathrm{raw}}_{b,p,u,r}
=================================

K^{R,\mathrm{raw}}*{b,\tau*{b,p,u},r}
]

[
\bar K^{R,\mathrm{raw}}
\in
\mathbb{R}^{B\times T\times k'\times64}
]

---

# 24. Optimized sparse MLA score

[
\boxed{
S^{\mathrm{latent}}_{b,i,p,u}
=============================

\frac{
\displaystyle
\sum_{c=1}^{512}
\widehat Q^N_{b,i,p,c}
\bar C^{KV}*{b,p,u,c}
+
\displaystyle
\sum*{r=1}^{64}
Q^{R,\mathrm{raw}}*{b,i,p,r}
\left[
\mathcal R*{\tau_{b,p,u}-p}
\bar K^{R,\mathrm{raw}}_{b,p,u}
\right]_r
}{
\sqrt{256}
}
}
]

[
\widehat Q^N
:
(B,64,T,512)
]

[
\bar C^{KV}
:
(B,1,T,k',512)
]

[
\widehat Q^N
@
(\bar C^{KV})^\top
\rightarrow
(B,64,T,k')
]

[
Q^R
:
(B,64,T,64)
]

[
\bar K^R
:
(B,1,T,k',64)
]

[
Q^R
@
(\bar K^R)^\top
\rightarrow
(B,64,T,k')
]

[
\boxed{
S^{\mathrm{latent}}
\in
\mathbb{R}^{B\times64\times T\times k'}
}
]

---

# 25. Sparse latent-value aggregation

[
Z_{b,i,p,c}
===========

\sum_{\substack{u=1\\tau_{b,p,u}\le p}}^{k'}
A^{\mathrm{sparse}}*{b,i,p,u}
\bar C^{KV}*{b,p,u,c}
]

[
A^{\mathrm{sparse}}
:
(B,64,T,k')
]

[
\bar C^{KV}
:
(B,1,T,k',512)
]

[
\boxed{
Z
=

A^{\mathrm{sparse}}
\bar C^{KV}
\in
\mathbb{R}^{B\times64\times T\times512}
}
]

[
H_i
===

Z_iW_{UV}^{(i)}
]

[
(B,T,512)
@
(512,256)
\rightarrow
(B,T,256)
]

[
\boxed{
H
\in
\mathbb{R}^{B\times64\times T\times256}
}
]

[
\boxed{
A_i
\left(
C^{KV}W_{UV}^{(i)}
\right)
=======

\left(
A_iC^{KV}
\right)
W_{UV}^{(i)}
}
]

---

# 26. Head merge and output projection

[
H:
(B,64,T,256)
\rightarrow
(B,T,64,256)
]

[
H^{\mathrm{concat}}
===================

\operatorname{reshape}(H)
]

[
H^{\mathrm{concat}}
\in
\mathbb{R}^{B\times T\times(64\cdot256)}
]

[
\boxed{
H^{\mathrm{concat}}
\in
\mathbb{R}^{B\times T\times16384}
}
]

[
H^{\mathrm{concat}}_{b,p,256i+r}
================================

H_{b,i,p,r}
]

[
i\in{0,\ldots,63}
]

[
r\in{0,\ldots,255}
]

[
W_O
\in
\mathbb{R}^{hd_v\times d}
=========================

\mathbb{R}^{16384\times6144}
]

[
Y_{\mathrm{attn}}
=================

H^{\mathrm{concat}}W_O
]

[
(B,T,16384)
@
(16384,6144)
\rightarrow
(B,T,6144)
]

[
\boxed{
Y_{\mathrm{attn}}
\in
\mathbb{R}^{B\times T\times6144}
}
]

[
\boxed{
Y
=

X+Y_{\mathrm{attn}}
\in
\mathbb{R}^{B\times T\times6144}
}
]

([GitHub][2])

---

# 27. Autoregressive decode state

[
T_q=1
]

[
T_k=L
]

[
C_{\mathrm{cache}}^{KV}
\in
\mathbb{R}^{B\times L\times512}
]

[
K_{\mathrm{cache}}^R
\in
\mathbb{R}^{B\times L\times64}
]

For

[
\ell\in\mathcal F,
]

[
K_{\mathrm{cache}}^{I,(\ell)}
\in
\mathbb{R}^{B\times L\times128}
]

[
Q_p^N
\in
\mathbb{R}^{B\times64\times1\times192}
]

[
Q_p^R
\in
\mathbb{R}^{B\times64\times1\times64}
]

[
\widehat Q_p^N
\in
\mathbb{R}^{B\times64\times1\times512}
]

---

# 28. Decode-time DSA indexer

[
Q_p^I
\in
\mathbb{R}^{B\times1\times32\times128}
]

[
K_{\mathrm{cache}}^I
\in
\mathbb{R}^{B\times L\times128}
]

[
G_p^I
=====

\frac{
Q_p^I
(K_{\mathrm{cache}}^I)^\top
}{
\sqrt{128}
}
]

[
(B,1,32,128)
@
(B,1,128,L)
\rightarrow
(B,1,32,L)
]

[
I_{p,q}
=======

\frac{1}{\sqrt{32}}
\sum_{a=1}^{32}
(\bar X_pW_{IW})*a
\operatorname{ReLU}
\left(
G*{p,a,q}^I
\right)
]

[
I_p
\in
\mathbb{R}^{B\times1\times L}
]

[
\boldsymbol{\tau}_p
===================

\operatorname{TopKIndices}_{\min(2048,L)}
(I_p)
]

[
\boldsymbol{\tau}_p
\in
\mathbb{N}^{B\times1\times\min(2048,L)}
]

---

# 29. Decode-time sparse MLA

[
\bar C_{\mathrm{cache}}^{KV}
============================

\operatorname{Gather}
\left(
C_{\mathrm{cache}}^{KV},
\boldsymbol{\tau}_p
\right)
]

[
\bar C_{\mathrm{cache}}^{KV}
\in
\mathbb{R}^{B\times1\times k'\times512}
]

[
\bar K_{\mathrm{cache}}^R
=========================

\operatorname{Gather}
\left(
K_{\mathrm{cache}}^R,
\boldsymbol{\tau}_p
\right)
]

[
\bar K_{\mathrm{cache}}^R
\in
\mathbb{R}^{B\times1\times k'\times64}
]

[
S_p^N
=====

\widehat Q_p^N
\left(
\bar C_{\mathrm{cache}}^{KV}
\right)^\top
]

[
(B,64,1,512)
@
(B,1,512,k')
\rightarrow
(B,64,1,k')
]

[
S_p^R
=====

Q_p^R
\left(
\bar K_{\mathrm{cache}}^R
\right)^\top
]

[
(B,64,1,64)
@
(B,1,64,k')
\rightarrow
(B,64,1,k')
]

[
S_p
===

\frac{
S_p^N+S_p^R
}{
\sqrt{256}
}
]

[
A_p
===

\operatorname{softmax}_{k'}(S_p)
]

[
A_p
\in
\mathbb{R}^{B\times64\times1\times k'}
]

[
Z_p
===

A_p
\bar C_{\mathrm{cache}}^{KV}
]

[
(B,64,1,k')
@
(B,1,k',512)
\rightarrow
(B,64,1,512)
]

[
H_{p,i}
=======

Z_{p,i}W_{UV}^{(i)}
\in
\mathbb{R}^{B\times1\times256}
]

[
Y_p
===

\operatorname{Concat}
\left(
H_{p,0},
\ldots,
H_{p,63}
\right)
W_O
]

[
\boxed{
Y_p
\in
\mathbb{R}^{B\times1\times6144}
}
]

---

# 30. Architectural cache dimensions

[
\mathcal C_{\mathrm{MLA}}^{(\ell)}
==================================

\left{
C_{\mathrm{cache}}^{KV,(\ell)},
K_{\mathrm{cache}}^{R,(\ell)}
\right}
]

[
N_{\mathrm{MLA\ cache/token/layer}}
===================================

r_{kv}+d_r
]

[
\boxed{
N_{\mathrm{MLA\ cache/token/layer}}
===================================

# 512+64

576
}
]

For a Full-indexer layer,

[
\mathcal C_{\mathrm{Full}}^{(\ell)}
===================================

\left{
C_{\mathrm{cache}}^{KV,(\ell)},
K_{\mathrm{cache}}^{R,(\ell)},
K_{\mathrm{cache}}^{I,(\ell)}
\right}
]

[
\boxed{
N_{\mathrm{cache/token/Full\ layer}}
====================================

# 512+64+128

704
}
]

For a Shared-indexer layer,

[
\boxed{
N_{\mathrm{cache/token/Shared\ layer}}
======================================

# 512+64

576
}
]

Across all (78) layers:

[
N_{\mathrm{cache/token}}
========================

78(576)+21(128)
]

[
\boxed{
N_{\mathrm{cache/token}}
========================

47{,}616
\text{ elements}
}
]

At BF16:

[
s=2\text{ bytes}
]

[
\boxed{
M_{\mathrm{cache/token}}
========================

# 47{,}616\cdot2

# 95{,}232\text{ bytes}

93\text{ KiB}
}
]

([GitHub][2])

---

# 31. Main-attention parameter count

[
N_{DQ}
======

# d,r_q

# 6144\cdot2048

12{,}582{,}912
]

[
N_{UQ}
======

# r_qh(d_n+d_r)

# 2048\cdot64\cdot256

33{,}554{,}432
]

[
N_{DKV}
=======

# d(r_{kv}+d_r)

# 6144\cdot576

3{,}538{,}944
]

[
N_{UKV}
=======

r_{kv}h(d_n+d_v)
]

# [

# 512\cdot64\cdot448

14{,}680{,}064
]

[
N_O
===

# hd_vd

# 64\cdot256\cdot6144

100{,}663{,}296
]

[
N_{\mathrm{MLA,linear}}
=======================

N_{DQ}+N_{UQ}+N_{DKV}+N_{UKV}+N_O
]

[
\boxed{
N_{\mathrm{MLA,linear}}
=======================

165{,}019{,}648
}
]

[
N_{\mathrm{MLA,norm}}
=====================

# r_q+r_{kv}

2560
]

[
\boxed{
N_{\mathrm{MLA}}
================

165{,}022{,}208
\text{ parameters/layer}
}
]

---

# 32. Full DSA-indexer parameter count

[
N_{IQ}
======

# r_qh_Id_I

# 2048\cdot32\cdot128

8{,}388{,}608
]

[
N_{IK}
======

# dd_I

# 6144\cdot128

786{,}432
]

[
N_{IW}
======

# dh_I

# 6144\cdot32

196{,}608
]

[
N_{\mathrm{LN}}
===============

# 2d_I

256
]

[
\boxed{
N_{\mathrm{Indexer}}
====================

8{,}388{,}608
+
786{,}432
+
196{,}608
+
256
===

9{,}371{,}904
}
]

[
\boxed{
N_{\mathrm{attention,total}}
============================

78N_{\mathrm{MLA}}
+
21N_{\mathrm{Indexer}}
}
]

[
\boxed{
N_{\mathrm{attention,total}}
============================

13{,}068{,}542{,}208
}
]

---

# 33. Compute-order equations

[
C_{\mathrm{indexer,prefill}}
============================

\Theta
\left(
B,h_I,T^2d_I
\right)
]

[
\boxed{
C_{\mathrm{indexer,prefill}}
============================

\Theta
\left(
B\cdot32\cdot T^2\cdot128
\right)
}
]

[
C_{\mathrm{sparse\ QK}}
=======================

\Theta
\left(
BhTk'd_{qk}
\right)
]

[
C_{\mathrm{sparse\ AV}}
=======================

\Theta
\left(
BhTk'd_v
\right)
]

[
\boxed{
C_{\mathrm{sparse\ core}}
=========================

\Theta
\left[
BhTk'(d_{qk}+d_v)
\right]
}
]

[
\boxed{
C_{\mathrm{sparse\ core}}
=========================

\Theta
\left(
B\cdot64\cdot T\cdot k'\cdot512
\right)
}
]

[
C_{\mathrm{dense\ core}}
========================

\Theta
\left[
BhT^2(d_{qk}+d_v)
\right]
]

[
\boxed{
\frac{
C_{\mathrm{sparse\ core}}
}{
C_{\mathrm{dense\ core}}
}
\approx
\frac{k'}{T}
}
]

For all layers without IndexShare:

[
C_I^{\mathrm{all}}
==================

78C_I
]

For GLM-5.2:

[
C_I^{\mathrm{IndexShare}}
=========================

21C_I
]

[
\boxed{
\frac{
C_I^{\mathrm{IndexShare}}
}{
C_I^{\mathrm{all}}
}
=

\frac{21}{78}
\approx
0.26923
}
]

[
\boxed{
1-
\frac{21}{78}
=============

\frac{57}{78}
\approx
73.08%
}
]

([arXiv][4])

---

# 34. Complete GLM-5.2 MLA–DSA transformation

[
\boxed{
\begin{aligned}
X
&:
(B,T,6144)
\
&\xrightarrow{\operatorname{RMSNorm}}
\bar X:
(B,T,6144)
\
&\xrightarrow{W_{DQ}}
C^Q:
(B,T,2048)
\
&\xrightarrow{W_{UQ}}
Q^N:
(B,64,T,192),
\quad
Q^R:
(B,64,T,64)
\
&\xrightarrow{W_{DKV}^{A}}
C^{KV}:
(B,T,512),
\quad
K^R:
(B,T,64)
\
&\xrightarrow{\mathrm{DSA\ indexer}}
\boldsymbol{\tau}:
(B,T,\min(2048,T))
\
&\xrightarrow{\mathrm{sparse\ gather}}
\bar C^{KV}:
(B,T,k',512),
\quad
\bar K^R:
(B,T,k',64)
\
&\xrightarrow{
\widehat Q^N(\bar C^{KV})^\top
+
Q^R(\bar K^R)^\top
}
S:
(B,64,T,k')
\
&\xrightarrow{\operatorname{softmax}}
A:
(B,64,T,k')
\
&\xrightarrow{A\bar C^{KV}}
Z:
(B,64,T,512)
\
&\xrightarrow{W_{UV}^{(i)}}
H:
(B,64,T,256)
\
&\xrightarrow{\operatorname{transpose+reshape}}
H^{\mathrm{concat}}:
(B,T,16384)
\
&\xrightarrow{W_O}
Y_{\mathrm{attn}}:
(B,T,6144)
\
&\xrightarrow{+X}
Y:
(B,T,6144).
\end{aligned}
}
]

[
\boxed{
\operatorname{GLM5.2Attn}(X)
============================

\operatorname{Concat}*{i=1}^{64}
\left[
\operatorname{softmax}*{u}
\left(
\frac{
\widehat Q_i^N
(\bar C^{KV})^\top
+
Q_i^R
(\bar K^R)^\top
}{
\sqrt{256}
}
\right)
\bar C^{KV}
W_{UV}^{(i)}
\right]
W_O
}
]

[
\boxed{
Y
=

X+
\operatorname{GLM5.2Attn}
\left(
\operatorname{RMSNorm}(X)
\right)
\in
\mathbb{R}^{B\times T\times6144}
}
]

[1]: https://huggingface.co/zai-org/GLM-5.2/blob/main/config.json "config.json · zai-org/GLM-5.2 at main"
[2]: https://raw.githubusercontent.com/huggingface/transformers/main/src/transformers/models/glm_moe_dsa/modeling_glm_moe_dsa.py "raw.githubusercontent.com"
[3]: https://huggingface.co/zai-org/GLM-5.2/blob/main/config.json?utm_source=chatgpt.com "config.json · zai-org/GLM-5.2 at main"
[4]: https://arxiv.org/pdf/2603.12201 "IndexCache: Accelerating Sparse Attention via Cross-Layer Index Reuse"
