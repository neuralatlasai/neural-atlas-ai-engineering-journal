# ALGORITHM (\Omega): RAW AUDIO (\rightarrow) LOG-MEL (\rightarrow) CEPSTRUM (\rightarrow) MFCC (\rightarrow) MODERN AUDIO REPRESENTATIONS

[
\boxed{
\texttt{OUTPUT_MODE}
====================

\text{mathematical pseudo-algorithm}
}
]

[
\boxed{
\texttt{EVIDENCE}
\in
{
[\mathrm{CODE!-!VERIFIED}],
[\mathrm{CONFIG!-!VERIFIED}],
[\mathrm{PAPER!-!REPORTED}],
[\mathrm{DOC!-!REPORTED}],
[\mathrm{MATHEMATICALLY!-!DERIVED}],
[\mathrm{STANDARD!-!DEFINITION}],
[\mathrm{REASONABLY!-!INFERRED}],
[\mathrm{UNDISCLOSED}],
[\mathrm{UNKNOWN}]
}
}
]

// Execution contract: no hidden waveform(\rightarrow)Mel jump; every state transition carries shape/rate/physical semantics. 

---

## (\boxed{\text{ALGORITHM 0 — MASTER STATE}})

[
\begin{aligned}
\mathcal A_0
============

\Big(
&p_{\mathrm{ac}}(t),
f_s^{\mathrm{src}},
C,
B_{\mathrm{sample}},
T_{\mathrm{sec}}
\Big)
\end{aligned}
]

[
\begin{array}{ll}
p_{\mathrm{ac}}(t) &:\mathbb R\rightarrow\mathbb R,\quad [\mathrm{Pa}]
\
f_s^{\mathrm{src}} &:[\mathrm{samples/s}]
\
C &:\text{channel count}
\
B_{\mathrm{sample}} &:\text{PCM/float representation}
\
T_{\mathrm{sec}} &:[\mathrm{s}]
\end{array}
]

[
\boxed{
\mathcal A_0
\rightarrow
\mathcal A_1
\rightarrow
\cdots
\rightarrow
\mathcal A_K
}
]

[
\mathcal A_k
============

(
X_k,;
\operatorname{shape}X_k,;
\operatorname{dtype}X_k,;
\operatorname{axes}X_k,;
\operatorname{units}X_k,;
r_k,;
\operatorname{semantics}X_k
)
]

---

# (\boxed{\text{ALGORITHM 1 — PHYSICAL SPEECH GENERATION}})

[
\textbf{Input:}\quad
p_{\mathrm{exc}}(t),g(t),v(t),r(t)
]

// (p_{\mathrm{exc}}) denotes excitation; (p_{\mathrm{ac}}) denotes acoustic pressure.

### 1.1 Source-filter decomposition

[
\boxed{
s(t)=e(t)*h(t)
}
\qquad
[\mathrm{STANDARD!-!DEFINITION}]
]

or

[
\boxed{
s(t)
====

p_{\mathrm{exc}}(t)
*
g(t)
*
v(t)
*
r(t)
}
]

[
\begin{array}{ll}
p_{\mathrm{exc}}(t)&:\text{vocal-fold excitation periodicity}
\
g(t)&:\text{glottal pulse response}
\
v(t)&:\text{vocal-tract filter}
\
r(t)&:\text{lip-radiation response}
\end{array}
]

### 1.2 Voiced excitation

[
\boxed{
p_{\mathrm{exc}}(t)
===================

\sum_{\ell=-\infty}^{\infty}
a_\ell\delta(t-\ell T_0)
}
]

[
\boxed{
F_0=\frac{1}{T_0}
}
]

[
F_0
\longleftrightarrow
\text{fundamental/glottal periodicity}
]

[
F_1,F_2,F_3,\ldots
\longleftrightarrow
\text{vocal-tract resonances}
]

[
\boxed{
F_0\neq F_1,F_2,F_3,\ldots
}
]

### 1.3 Frequency-domain source-filter relation

[
s(t)=e(t)*h(t)
]

[
\Downarrow\mathcal F
]

[
\boxed{
S(\omega)=E(\omega)H(\omega)
}
]

[
|S(\omega)|
===========

|E(\omega)|,|H(\omega)|
]

[
\boxed{
\log|S(\omega)|
===============

\log|E(\omega)|
+
\log|H(\omega)|
}
]

---

# (\boxed{\text{ALGORITHM 2 — ANALOG \rightarrow DIGITAL}})

### 2.1 Anti-alias condition

[
p_{\mathrm{aa}}(t)
==================

p_{\mathrm{ac}}(t)*h_{\mathrm{aa}}(t)
]

[
H_{\mathrm{aa}}(f)\approx0
\qquad
|f|\ge\frac{f_s}{2}
]

[
\boxed{
f_{\mathrm{Nyquist}}
====================

\frac{f_s}{2}
}
]

### 2.2 Sampling

[
\boxed{
x[n]
====

p_{\mathrm{aa}}
\left(
\frac{n}{f_s}
\right)
}
]

[
n=0,\ldots,N-1
]

[
\boxed{
N\approx
\left\lfloor
T_{\mathrm{sec}}f_s
\right\rfloor
}
]

[
x
\in
\mathbb R^N
]

### 2.3 Aliasing

For

[
f_a>f_s/2
]

[
\boxed{
f_{\mathrm{alias}}
==================

\left|
f_a-kf_s
\right|,
\qquad
k=\arg\min_{j\in\mathbb Z}|f_a-jf_s|
}
]

### 2.4 Conditional PCM conversion

If

[
q[n]\in
[-2^{B-1},2^{B-1}-1]
]

and the implementation chooses full-scale normalization,

[
\boxed{
x[n]
====

\frac{q[n]}{2^{B-1}}
}
\qquad
[\mathrm{STANDARD!-!DEFINITION}]
]

// Do not impose this mapping when the decoder/library uses another PCM convention.

### 2.5 Rational resampling

For

[
f_s^{\mathrm{dst}}
==================

\frac{P}{Q}
f_s^{\mathrm{src}}
]

[
x_\uparrow[n]
=============

\begin{cases}
x[n/P],&n\bmod P=0
\
0,&\text{otherwise}
\end{cases}
]

[
u[n]
====

(x_\uparrow*h_{\mathrm{LP}})[n]
]

[
\boxed{
y[m]=u[mQ]
}
]

[
r_y=f_s^{\mathrm{dst}}
]

### 2.6 Model-specific preprocessing state

[
\boxed{
x
=

T_{\mathrm{amp}}
\circ
T_{\mathrm{resample}}
\circ
T_{\mathrm{channel}}
\circ
T_{\mathrm{decode}}
(\mathrm{bytes})
}
]

[
{
T_{\mathrm{dither}},
T_{\mathrm{DC}},
T_{\mathrm{preemphasis}},
T_{\mathrm{clip}}
}
=

[\mathrm{UNDISCLOSED}]
]

unless explicitly established.

---

# (\boxed{\text{ALGORITHM 3 — FRAME CONSTRUCTION}})

[
\textbf{Input:}\quad
x[n]\in\mathbb R^N
]

[
L:=\text{frame length [samples]}
]

[
H:=\text{hop [samples]}
]

[
\boxed{
x_m[r]=x[mH+r]
}
]

[
r=0,\ldots,L-1
]

[
m=0,\ldots,T-1
]

For no boundary padding,

[
\boxed{
T
=

1+
\left\lfloor
\frac{N-L}{H}
\right\rfloor
}
]

### 3.1 Temporal geometry

[
\boxed{
T_{\mathrm{win}}
================

\frac{L}{f_s}
}
]

[
\boxed{
T_{\mathrm{hop}}
================

\frac{H}{f_s}
}
]

[
\boxed{
O=L-H
}
]

[
\boxed{
T_{\mathrm{overlap}}
====================

\frac{L-H}{f_s}
}
]

[
\boxed{
\rho_{\mathrm{overlap}}
=======================

\frac{L-H}{L}
}
]

[
\boxed{
H\neq O
}
]

### 3.2 Exact (16\rm,kHz,;400,;160) case

[
f_s=16000
]

[
L=400
]

[
H=160
]

[
T_{\mathrm{win}}
================

# 400/16000

25\mathrm{ms}
]

[
T_{\mathrm{hop}}
================

# 160/16000

10\mathrm{ms}
]

[
\boxed{
O=400-160=240
}
]

[
T_{\mathrm{overlap}}
====================

# 240/16000

15\mathrm{ms}
]

[
\rho
====

# 240/400

0.6
]

### 3.3 Explicit frame indices

[
F_0
===

{x[0],\ldots,x[399]}
]

[
F_1
===

{x[160],\ldots,x[559]}
]

[
F_2
===

{x[320],\ldots,x[719]}
]

[
F_0\cap F_1
===========

{x[160],\ldots,x[399]}
]

[
\boxed{
|F_0\cap F_1|
=============

# 399-160+1

240
}
]

[
F_1\setminus F_0
================

{x[400],\ldots,x[559]}
]

[
\boxed{
|F_1\setminus F_0|=160
}
]

// (160) samples are newly advanced; (240) samples are reused.

---

# (\boxed{\text{ALGORITHM 4 — WINDOWING}})

[
\tilde x_m[r]
=============

x_m[r],w[r]
]

### 4.1 Symmetric Hann

[
\boxed{
w_{\mathrm{sym}}[r]
===================

\frac12
\left[
1-\cos
\left(
\frac{2\pi r}{L-1}
\right)
\right]
}
]

### 4.2 Periodic Hann

[
\boxed{
w_{\mathrm{per}}[r]
===================

\frac12
\left[
1-\cos
\left(
\frac{2\pi r}{L}
\right)
\right]
}
]

[
w_{\mathrm{sym}}
\neq
w_{\mathrm{per}}
]

### 4.3 Leakage operator

[
\tilde x[n]=x[n]w[n]
]

[
\Downarrow\mathcal F
]

[
\boxed{
\tilde X(\omega)
================

\frac{1}{2\pi}
X(\omega)*W(\omega)
}
]

[
\text{main-lobe width}
\uparrow
\Longleftrightarrow
\text{frequency smearing}
\uparrow
]

[
\text{side-lobe level}
\uparrow
\Longleftrightarrow
\text{spectral leakage}
\uparrow
]

---

# (\boxed{\text{ALGORITHM 5 — ZERO PAD + STFT}})

### 5.1 FFT-frame construction

For

[
N_{\mathrm{FFT}}\ge L
]

define

[
\bar x_m[r]
===========

\begin{cases}
x[mH+r]w[r],
&
0\le r<L
\
0,
&
L\le r<N_{\mathrm{FFT}}
\end{cases}
]

### 5.2 DFT

[
\boxed{
X_m[k]
======

\sum_{r=0}^{N_{\mathrm{FFT}}-1}
\bar x_m[r],
e^{-j2\pi kr/N_{\mathrm{FFT}}}
}
]

[
k=0,\ldots,N_{\mathrm{FFT}}-1
]

[
X
\in
\mathbb C^{N_{\mathrm{FFT}}\times T}
]

### 5.3 Frequency coordinates

[
\boxed{
f_k
===

\frac{k f_s}{N_{\mathrm{FFT}}}
}
]

[
\boxed{
\Delta f
========

\frac{f_s}{N_{\mathrm{FFT}}}
}
]

### 5.4 Real-signal symmetry

For

[
x[n]\in\mathbb R
]

[
\boxed{
X_m[N_{\mathrm{FFT}}-k]
=======================

X_m[k]^*
}
]

Therefore,

[
K
=

\left\lfloor
\frac{N_{\mathrm{FFT}}}{2}
\right\rfloor+1
]

[
X^+_m
\in
\mathbb C^K
]

### 5.5 (16\rm,kHz,;N_{FFT}=400)

[
\Delta f
========

# 16000/400

\boxed{40\mathrm{Hz}}
]

[
K
=

# 400/2+1

\boxed{201}
]

[
f_k
===

40k;\mathrm{Hz}
]

[
f_{200}=8000\mathrm{Hz}
]

---

# (\boxed{\text{ALGORITHM 6 — COMPLEX STFT \rightarrow MAGNITUDE/POWER}})

[
X_m[k]
======

a_m[k]+jb_m[k]
]

### 6.1 Magnitude

[
\boxed{
A_m[k]
======

# |X_m[k]|

\sqrt{
a_m[k]^2+b_m[k]^2
}
}
]

### 6.2 Power

[
\boxed{
P_m[k]
======

# |X_m[k]|^2

a_m[k]^2+b_m[k]^2
}
]

or implementation-normalized

[
P_m[k]
======

\alpha
|X_m[k]|^2
]

[
\boxed{
A_m[k]\neq P_m[k]
}
]

[
\mathbb C^K
\rightarrow
\mathbb R_+^K
]

### 6.3 Information destruction

[
X_m[k]
======

A_m[k]e^{j\phi_m[k]}
]

[
P_m[k]
======

A_m[k]^2
]

[
\boxed{
P_m
\not\ni
\phi_m
}
]

---

# (\boxed{\text{ALGORITHM 7 — LINEAR FREQUENCY \rightarrow MEL COORDINATE}})

## 7.1 HTK mapping

[
\boxed{
\mu_{\mathrm{HTK}}(f)
=====================

2595\log_{10}
\left(
1+\frac{f}{700}
\right)
}
]

[
\boxed{
f_{\mathrm{HTK}}(\mu)
=====================

700
\left(
10^{\mu/2595}-1
\right)
}
]

## 7.2 Slaney mapping

Define

[
f_{\mathrm{sp}}
===============

\frac{200}{3}
]

[
f_{\log}=1000
]

[
\mu_{\log}
==========

# \frac{1000}{f_{\mathrm{sp}}}

15
]

[
\lambda
=======

\frac{\ln(6.4)}{27}
]

Then

[
\boxed{
\mu_{\mathrm{Slaney}}(f)
========================

\begin{cases}
\dfrac{f}{f_{\mathrm{sp}}},
&
f<1000
[6pt]
15+
\dfrac{\ln(f/1000)}{\lambda},
&
f\ge1000
\end{cases}
}
\qquad
[\mathrm{STANDARD!-!DEFINITION}]
]

Inverse:

[
\boxed{
f(\mu)
======

\begin{cases}
f_{\mathrm{sp}}\mu,
&
\mu<15
[6pt]
1000
\exp\left[
\lambda(\mu-15)
\right],
&
\mu\ge15
\end{cases}
}
]

[
\boxed{
\mu_{\mathrm{HTK}}
\neq
\mu_{\mathrm{Slaney}}
}
]

---

# (\boxed{\text{ALGORITHM 8 — MEL FILTER-BANK CONSTRUCTION}})

[
M:=N_{\mathrm{Mel}}
]

[
K:=N_{\mathrm{FFT}}/2+1
]

### 8.1 Mel-space boundary points

[
\mu_{\min}
==========

\mu(f_{\min})
]

[
\mu_{\max}
==========

\mu(f_{\max})
]

[
\boxed{
\mu_i
=====

\mu_{\min}
+
\frac{i}{M+1}
(\mu_{\max}-\mu_{\min})
}
]

[
i=0,\ldots,M+1
]

### 8.2 Convert boundaries back to Hz

[
\boxed{
f_i
===

\mu^{-1}(\mu_i)
}
]

### 8.3 FFT-bin frequencies

[
f_k
===

\frac{k f_s}{N_{\mathrm{FFT}}}
]

### 8.4 Continuous triangular filters

For Mel filter (b),

[
b=0,\ldots,M-1
]

[
\boxed{
H_{b,k}
=======

\begin{cases}
0,
&
f_k<f_b
[4pt]
\dfrac{f_k-f_b}{f_{b+1}-f_b},
&
f_b\le f_k\le f_{b+1}
[8pt]
\dfrac{f_{b+2}-f_k}{f_{b+2}-f_{b+1}},
&
f_{b+1}<f_k\le f_{b+2}
[8pt]
0,
&
f_k>f_{b+2}
\end{cases}
}
]

[
\boxed{
H_{\mathrm{Mel}}
\in
\mathbb R^{M\times K}
}
]

### 8.5 Slaney-area normalization when enabled

[
\eta_b
======

\frac{2}
{f_{b+2}-f_b}
]

[
\boxed{
H_{b,k}^{(\mathrm{SlaneyNorm})}
===============================

\eta_bH_{b,k}
}
]

### 8.6 Optional discrete-bin implementation

[
\kappa_i
========

\frac{N_{\mathrm{FFT}}f_i}{f_s}
]

[
k_i
===

Q_{\mathrm{bin}}(\kappa_i)
]

[
Q_{\mathrm{bin}}
================

[\mathrm{IMPLEMENTATION!-!SPECIFIC}]
]

// Do not silently assume floor/round when the implementation evaluates filters at continuous FFT-center frequencies.

---

# (\boxed{\text{ALGORITHM 9 — POWER SPECTRUM \rightarrow MEL ENERGY}})

For every frame (m),

[
\boxed{
E_m[b]
======

\sum_{k=0}^{K-1}
H_{b,k}P_m[k]
}
]

Matrix form:

[
\boxed{
\mathbf E
=========

\mathbf H_{\mathrm{Mel}}
\mathbf P
}
]

[
\mathbf P
\in
\mathbb R_+^{K\times T}
]

[
\mathbf H_{\mathrm{Mel}}
\in
\mathbb R_+^{M\times K}
]

[
\boxed{
\mathbf E
\in
\mathbb R_+^{M\times T}
}
]

Example:

[
[128,201]
[201,T]
\rightarrow
\boxed{[128,T]}
]

[
\boxed{
\text{FFT bins }K
\neq
\text{Mel bands }M
}
]

// Mel filtering = weighted band-energy integration; no Fourier transform occurs here.

---

# (\boxed{\text{ALGORITHM 10 — MEL ENERGY \rightarrow LOG-MEL}})

### 10.1 Floor

[
\boxed{
E'_m[b]
=======

\max(E_m[b],\epsilon)
}
]

### 10.2 Possible compression operators

[
L_m[b]
======

\ln E'_m[b]
]

or

[
L_m[b]
======

\log_{10}E'_m[b]
]

or, for power expressed in dB,

[
L_m[b]
======

10\log_{10}E'_m[b]
]

or, for amplitude,

[
L_m[b]
======

20\log_{10}A_m[b]
]

[
\boxed{
10\log_{10}P
============

20\log_{10}\sqrt P
}
]

### 10.3 Dynamic-range floor

If enabled,

[
L_{\max}
========

\max_{m,b}L_m[b]
]

[
\boxed{
\tilde L_m[b]
=============

\max
\left(
L_m[b],
L_{\max}-D
\right)
}
]

### 10.4 Affine normalization

[
\boxed{
\hat L_m[b]
===========

a\tilde L_m[b]+c
}
]

[
\hat{\mathbf L}
\in
\mathbb R^{M\times T}
]

---

# (\boxed{\text{ALGORITHM 11 — COMPLETE RAW \rightarrow LOG-MEL EXPANSION}})

[
\boxed{
x[n]
\rightarrow
x_m[r]
\rightarrow
\tilde x_m[r]
\rightarrow
X_m[k]
\rightarrow
P_m[k]
\rightarrow
E_m[b]
\rightarrow
L_m[b]
}
]

with primitive expansion

[
x_m[r]
======

x[mH+r]
]

[
\tilde x_m[r]
=============

w[r]x[mH+r]
]

[
X_m[k]
======

\sum_{r=0}^{N_{\mathrm{FFT}}-1}
\bar x_m[r]
e^{-j2\pi kr/N_{\mathrm{FFT}}}
]

[
P_m[k]
======

|X_m[k]|^p,
\qquad
p\in{1,2}
]

[
E_m[b]
======

\sum_kH_{b,k}P_m[k]
]

[
\boxed{
L_m[b]
======

\mathcal N
\left[
\mathcal C
\left(
\max
\left[
\sum_k
H_{b,k}
\left|
\sum_r
w[r]x[mH+r]
e^{-j2\pi kr/N_{\mathrm{FFT}}}
\right|^p,
\epsilon
\right]
\right)
\right]
}
]

where

[
\mathcal C
\in
{
\ln,\log_{10},10\log_{10},\ldots
}
]

[
\mathcal N
==========

\text{source-specific dynamic-range/affine operator}
]

---

# (\boxed{\text{ALGORITHM 12 — CLASSICAL REAL CEPSTRUM}})

[
s[n]
====

e[n]*h[n]
]

[
S[k]
====

E[k]H[k]
]

[
|S[k]|
======

|E[k]||H[k]|
]

[
\ell_S[k]
=========

\log|S[k]|
]

[
\boxed{
\ell_S[k]
=========

\ell_E[k]+\ell_H[k]
}
]

### 12.1 Inverse Fourier transform

[
\boxed{
c_s[q]
======

\frac1N
\sum_{k=0}^{N-1}
\log|S[k]|
e^{j2\pi kq/N}
}
]

[
\boxed{
c_s[q]
======

c_e[q]+c_h[q]
}
]

[
\boxed{
\text{spectral multiplication}
\xrightarrow{\log}
\text{spectral addition}
\xrightarrow{\mathrm{IDFT}}
\text{cepstral addition}
}
]

---

# (\boxed{\text{ALGORITHM 13 — QUEFRENCY / PITCH}})

Let

[
q_{\mathrm{sec}}
================

\frac{q}{f_s}
]

### 13.1 Smooth spectral envelope

[
\left|
\frac{\partial \log|H(\omega)|}{\partial\omega}
\right|
;\text{small}
]

[
\Downarrow
]

[
\boxed{
c_h[q]
;\text{concentrated at low }q
}
]

### 13.2 Harmonic excitation

[
E(\omega)
\approx
\sum_{\ell}
A_\ell
\delta
(
\omega-\ell\omega_0
)
]

[
\omega_0
========

2\pi F_0
]

[
\Downarrow
]

[
c_e(q)
\text{ contains periodic structure near }
T_0,2T_0,\ldots
]

[
\boxed{
T_0
===

\frac1{F_0}
}
]

[
\boxed{
F_0
===

\frac1{q_{\mathrm{pitch,sec}}}
}
]

Discrete form:

[
q_{\mathrm{pitch,index}}
========================

# f_sT_0

\frac{f_s}{F_0}
]

[
\boxed{
F_0
===

\frac{f_s}{q_{\mathrm{pitch,index}}}
}
]

### 13.3 (100\rm,Hz) example

[
F_0=100\mathrm{Hz}
]

[
T_0
===

# 1/100

# 0.01\mathrm{s}

\boxed{10\mathrm{ms}}
]

At

[
f_s=16000
]

[
q_{\mathrm{pitch,index}}
========================

# 16000/100

\boxed{160}
]

---

# (\boxed{\text{ALGORITHM 14 — VOCAL TRACT POLES / FORMANTS}})

All-pole model:

[
\boxed{
H(z)
====

\frac{G}
{
1-\sum_{p=1}^{P}a_pz^{-p}
}
}
]

Let pole (i) be

[
z_i
===

r_ie^{j\theta_i}
]

Then

[
\boxed{
F_i
===

\frac{f_s}{2\pi}\theta_i
}
]

and approximately

[
\boxed{
B_i
===

-\frac{f_s}{\pi}\ln r_i
}
]

[
r_i\rightarrow1
\Longrightarrow
B_i\downarrow
]

[
\boxed{
{F_1,F_2,F_3,\ldots}
\rightarrow
\text{smooth vocal-tract spectral envelope}
}
]

[
\boxed{
F_0
\rightarrow
\text{harmonic spacing}
}
]

[
\boxed{
F_i\neq iF_0
}
]

---

# (\boxed{\text{ALGORITHM 15 — CEPSTRAL LIFTERING}})

### 15.1 Low-quefrency lifter

[
L_{\mathrm{low}}[q]
===================

\begin{cases}
1,&q\le q_c
\
0,&q>q_c
\end{cases}
]

[
\boxed{
\hat c_h[q]
===========

L_{\mathrm{low}}[q]c_s[q]
}
]

[
\widehat{\log|H[k]|}
====================

\mathrm{DFT}
{
\hat c_h[q]
}
]

[
\boxed{
|\hat H[k]|
===========

\exp
\left(
\widehat{\log|H[k]|}
\right)
}
]

### 15.2 High-quefrency lifter

[
L_{\mathrm{high}}[q]
====================

1-L_{\mathrm{low}}[q]
]

[
\hat c_e[q]
===========

L_{\mathrm{high}}[q]c_s[q]
]

[
\boxed{
\hat c_e
\rightarrow
\text{pitch/source-dominant structure}
}
]

---

# (\boxed{\text{ALGORITHM 16 — LOG-MEL \rightarrow MFCC}})

[
\textbf{Input:}\quad
L_m[b],\qquad b=0,\ldots,M-1
]

### 16.1 DCT-II

[
\boxed{
c_m[q]
======

\alpha_q
\sum_{b=0}^{M-1}
L_m[b]
\cos
\left[
\frac{\pi q}{M}
\left(
b+\frac12
\right)
\right]
}
]

[
q=0,\ldots,C-1
]

For an orthonormal convention,

[
\alpha_q
========

\begin{cases}
\sqrt{\dfrac1M},
&q=0
[6pt]
\sqrt{\dfrac2M},
&q>0
\end{cases}
]

// DCT scaling is convention-specific.

Matrix form:

[
\boxed{
\mathbf c_m
===========

\mathbf D_{\mathrm{DCT-II}}
\mathbf L_m
}
]

[
D
\in
\mathbb R^{C\times M}
]

[
L
\in
\mathbb R^{M\times T}
]

[
\boxed{
C_{\mathrm{MFCC}}
=================

DL
\in
\mathbb R^{C\times T}
}
]

---

# (\boxed{\text{ALGORITHM 17 — IDFT \leftrightarrow DCT DERIVATION}})

## 17.1 Classical real cepstrum

Let

[
Y[k]=\log|X[k]|
]

For real (x[n]),

[
Y[k]=Y[N-k]
]

Then

[
c[n]
====

\frac1N
\sum_{k=0}^{N-1}
Y[k]
e^{j2\pi kn/N}
]

Pair (k) and (N-k):

[
Y[k]
\left[
e^{j2\pi kn/N}
+
e^{-j2\pi kn/N}
\right]
]

Using

[
e^{j\theta}+e^{-j\theta}
========================

2\cos\theta
]

[
\boxed{
c[n]
====

\text{real cosine expansion of even }Y[k]
}
]

// Sine terms cancel because the log-magnitude spectrum is even.

---

## 17.2 DCT-II from a (2M)-point even extension

Given

[
L[0],\ldots,L[M-1]
]

construct

[
\tilde L[n]
===========

\begin{cases}
L[n],
&
0\le n<M
\
L[2M-1-n],
&
M\le n<2M
\end{cases}
]

thus

[
\boxed{
\tilde L[n]
===========

\tilde L[2M-1-n]
}
]

Compute

[
Y[q]
====

\sum_{n=0}^{2M-1}
\tilde L[n]
e^{-j2\pi qn/(2M)}
]

Pair samples (b) and (2M-1-b):

[
Y[q]
====

\sum_{b=0}^{M-1}
L[b]
\left[
e^{-j\pi qb/M}
+
e^{-j\pi q(2M-1-b)/M}
\right]
]

Since

[
e^{-j2\pi q}=1
]

[
Y[q]
====

\sum_b
L[b]
\left[
e^{-j\pi qb/M}
+
e^{j\pi q(b+1)/M}
\right]
]

factor

[
e^{j\pi q/(2M)}
]

to obtain

[
\boxed{
Y[q]
====

2e^{j\pi q/(2M)}
\sum_{b=0}^{M-1}
L[b]
\cos
\left[
\frac{\pi q}{M}
\left(
b+\frac12
\right)
\right]
}
]

Therefore

[
\boxed{
\frac12
e^{-j\pi q/(2M)}
Y[q]
====

\operatorname{DCT-II}{L}[q]
}
]

up to normalization convention.

Hence

[
\boxed{
\mathrm{DCT-II}
\equiv
\text{phase-corrected Fourier transform of an even extension}
}
]

but

[
\boxed{
\underbrace{
\mathrm{IDFT}
{
\log|X[k]|
}
}*{\text{classical real cepstrum}}
\neq
\underbrace{
\mathrm{DCT-II}
{
\log[
H*{\mathrm{Mel}}|X|^2
]
}
}_{\text{MFCC}}
}
]

because

[
\boxed{
\text{uniform Fourier bins}
\neq
\text{Mel-integrated bands}
}
]

and

[
\boxed{
|X|
\neq
H_{\mathrm{Mel}}|X|^2
}
]

and

[
\boxed{
q_{\mathrm{MFCC}}
\neq
q_{\mathrm{physical;quefrency}}
}
]

---

# (\boxed{\text{ALGORITHM 18 — 13-D STATIC MFCC}})

[
\boxed{
\mathbf c_t
===========

[
c_t^{(0)},
c_t^{(1)},
\dots,
c_t^{(12)}
]^\top
\in
\mathbb R^{13}
}
]

Possible conventions:

[
c_0
\in
{
\text{retain},
\text{replace with log-energy},
\text{omit}
}
]

[
\boxed{
\text{specific convention}
==========================

[\mathrm{IMPLEMENTATION!-!SPECIFIC}]
}
]

### 18.1 Low-DCT-order truncation

Full DCT:

[
c=D_ML
]

Retain:

[
\boxed{
c_C
===

S_C D_ML,
\qquad C<M
}
]

where

[
S_C
===

[I_C;0]
]

Hence

[
\boxed{
C<M
\Longrightarrow
\text{lossy compression along Mel-frequency structure}
}
]

[
q\downarrow
\Longleftrightarrow
\text{slow variation across Mel bands}
]

[
q\uparrow
\Longleftrightarrow
\text{rapid Mel-band variation}
]

---

# (\boxed{\text{ALGORITHM 19 — DELTA MFCC}})

Let

[
N_\Delta
========

\text{regression half-width}
]

For coefficient (q),

[
\boxed{
\Delta c_t^{(q)}
================

\frac{
\sum_{n=1}^{N_\Delta}
n
\left[
c_{t+n}^{(q)}
-------------

c_{t-n}^{(q)}
\right]
}
{
2\sum_{n=1}^{N_\Delta}n^2
}
}
]

For

[
N_\Delta=2
]

denominator:

[
2(1^2+2^2)
==========

10
]

thus

[
\boxed{
\Delta c_t^{(q)}
================

\frac{
c_{t+1}^{(q)}
-------------

c_{t-1}^{(q)}
+
2c_{t+2}^{(q)}
--------------

2c_{t-2}^{(q)}
}{10}
}
]

[
\boxed{
\Delta\mathbf c_t
\in
\mathbb R^{13}
}
]

Boundary policy:

[
\mathcal B_\Delta
\in
{
\text{replicate},
\text{reflect},
\text{truncate},
\text{other}
}
]

[
\mathcal B_\Delta
=================

[\mathrm{IMPLEMENTATION!-!SPECIFIC}]
]

---

# (\boxed{\text{ALGORITHM 20 — DELTA-DELTA MFCC}})

[
\boxed{
\Delta^2 c_t^{(q)}
==================

\frac{
\sum_{n=1}^{N_\Delta}
n
\left[
\Delta c_{t+n}^{(q)}
--------------------

\Delta c_{t-n}^{(q)}
\right]
}
{
2\sum_{n=1}^{N_\Delta}n^2
}
}
]

[
\boxed{
\Delta^2\mathbf c_t
\in
\mathbb R^{13}
}
]

Construct

[
\boxed{
\mathbf f_t
===========

\begin{bmatrix}
\mathbf c_t
\
\Delta\mathbf c_t
\
\Delta^2\mathbf c_t
\end{bmatrix}
\in
\mathbb R^{39}
}
]

[
\boxed{
39
==

13_{\mathrm{static}}
+
13_{\Delta}
+
13_{\Delta^2}
}
]

[
\mathbf c_t
\leftrightarrow
\text{local spectral envelope}
]

[
\Delta\mathbf c_t
\leftrightarrow
\partial_t\mathbf c_t
]

[
\Delta^2\mathbf c_t
\leftrightarrow
\partial_t^2\mathbf c_t
]

---

# (\boxed{\text{ALGORITHM 21 — INFORMATION RETAINED / DESTROYED BY MFCC}})

Start

[
X[k]
====

|X[k]|e^{j\phi[k]}
]

### Stage A — power

[
X
\rightarrow
|X|^2
]

[
\boxed{
\phi[k];\text{discarded}
}
]

### Stage B — Mel projection

[
P
\rightarrow
H_{\mathrm{Mel}}P
]

If

[
M<K
]

then

[
\operatorname{rank}
(H_{\mathrm{Mel}})
\le M<K
]

therefore

[
\boxed{
P
\mapsto E
;\text{is generally many-to-one}
}
]

### Stage C — log compression

[
E
\mapsto
\log E
]

[
\frac{\partial \log E}{\partial E}
==================================

\frac1E
]

[
E\uparrow
\Longrightarrow
\text{relative amplitude compression}
]

### Stage D — truncated DCT

[
L
\mapsto
S_CD_ML
]

[
C<M
\Longrightarrow
\text{high DCT orders removed}
]

Thus

[
\boxed{
\text{MFCC}
\approx
\text{compressed smooth spectral-envelope coordinates}
}
]

### Speaker-information path

[
\text{vocal-tract geometry}
\rightarrow
{F_i,B_i}
\rightarrow
|H(\omega)|
\rightarrow
\text{spectral envelope}
\rightarrow
\text{low-order MFCC}
]

### Phonetic-information path

[
\text{articulator state}
\rightarrow
H_t(\omega)
\rightarrow
{F_{1,t},F_{2,t},\ldots}
\rightarrow
\mathbf c_t
]

### Precise pitch path

[
F_0
\rightarrow
\text{harmonic spacing}
\rightarrow
\text{fine spectral structure}
]

[
\text{Mel smoothing}
+
\text{low-order DCT}
\rightarrow
\text{fine harmonic structure attenuation}
]

Thus

[
\boxed{
\mathrm{MFCC}
:
\text{timbre/envelope}
\gg
\text{precise pitch/harmonic phase}
}
]

For music,

[
\mathrm{MFCC}
\rightarrow
\text{timbre-sensitive local descriptor}
]

but

[
\boxed{
\mathrm{MFCC}
\not\equiv
{
\text{pitch trajectory},
\text{harmony},
\text{rhythm},
\text{long-range form}
}
}
]

---

# (\boxed{\text{ALGORITHM 22 — MODERN REPRESENTATION TAXONOMY}})

[
\boxed{
\mathcal R_{\mathrm{modern}}
============================

{
R_{\mathrm{wave}},
R_{\mathrm{linear-spec}},
R_{\mathrm{logMel}},
R_{\mathrm{learned-cont}},
R_{\mathrm{codec-discrete}},
R_{\mathrm{SSL-latent}}
}
}
]

### Path A

[
x[n]
\rightarrow
\text{STFT}
\rightarrow
\text{Mel}
\rightarrow
\text{log-Mel}
\rightarrow
\text{audio encoder}
]

### Path B

[
x[n]
\rightarrow
\operatorname{Conv1D}_{\theta}
\rightarrow
z_t
\rightarrow
\text{learned encoder}
]

### Path C

[
x[n]
\rightarrow
E_{\mathrm{codec}}
\rightarrow
z_t
\rightarrow
Q
\rightarrow
c_{t,q}
]

[
\boxed{
\text{log-Mel frame}
\neq
\text{continuous encoder state}
\neq
\text{codec index}
}
]

---

# (\boxed{\text{ALGORITHM 23 — EXACT QWEN3-ASR FRONTEND AUDIT}})

[
\mathcal M_{\mathrm{Q3ASR}}
===========================

(
f_s,
M,
H,
N_{\mathrm{FFT}},
f_{\min},
f_{\max},
\text{MelScale},
\text{MelNorm}
)
]

[
\boxed{
=======

(
16000,
128,
160,
400,
0,
8000,
\mathrm{Slaney},
\mathrm{Slaney}
)
}
\quad
[\mathrm{CODE!-!VERIFIED}]
]

The current Transformers feature extractor exposes these values directly, requires mono audio, uses a Hann window, power STFT, Slaney-normalized filters, base-10 logarithm, an 8-log-unit dynamic floor and affine normalization. ([GitHub][1])

### 23.1 Input

[
x
\in
\mathbb R^N
]

[
\operatorname{dtype}
\rightarrow
\mathrm{float32}
]

[
f_s=16000
]

[
C=1
]

### 23.2 Minimum input length

[
N_{\min}=8000
]

[
N<8000
\Longrightarrow
x'
==

\operatorname{RightPad}(x,8000-N,0)
]

[
[\mathrm{CODE!-!VERIFIED}]
]

### 23.3 Filterbank

[
K
=

# 1+400/2

201
]

[
H_{\mathrm{Q3ASR}}
\in
\mathbb R^{201\times128}
]

[
\boxed{
H_{\mathrm{Q3ASR}}
==================

\operatorname{MelFBank}
(
201,
128,
0,
8000,
16000,
\mathrm{Slaney},
\mathrm{norm=Slaney}
)
}
]

### 23.4 Window + STFT

[
w
=

\operatorname{HannWindow}(400)
]

[
S
=

\operatorname{TorchSTFT}
(
x;
N_{\mathrm{FFT}}=400,
H=160,
w,
\operatorname{return_complex}=1
)
]

// Remaining Torch-STFT arguments follow framework defaults; they are not overwritten in this call.

### 23.5 Explicit implementation slice

[
S'
==

S[\ldots,0:T_S-1]
]

[
\boxed{
P
=

|S'|^2
}
]

### 23.6 Mel projection

[
H_{\mathrm{Q3ASR}}^\top
\in
\mathbb R^{128\times201}
]

[
P
\in
\mathbb R^{201\times T'}
]

[
\boxed{
E
=

H_{\mathrm{Q3ASR}}^\top P
\in
\mathbb R^{128\times T'}
}
]

### 23.7 Base-10 log

[
\boxed{
L
=

\log_{10}
\left[
\max(E,10^{-10})
\right]
}
]

### 23.8 Dynamic-range clipping

[
L_{\max}
========

\max_{b,t}L_{b,t}
]

[
\boxed{
L'_{b,t}
========

\max
(
L_{b,t},
L_{\max}-8
)
}
]

### 23.9 Affine transform

[
\boxed{
\hat L
======

\frac{L'+4}{4}
}
]

### 23.10 Mel-time padding

With default

[
n_{\mathrm{window}}=50
]

[
G
=

# 2n_{\mathrm{window}}

100
]

[
T_{\mathrm{pad}}
================

G
\left\lceil
\frac{T'}{G}
\right\rceil
]

[
\boxed{
\hat L_{\mathrm{pad}}
=====================

\operatorname{RightPad}
(
\hat L,
T_{\mathrm{pad}}-T'
)
}
]

[
\boxed{
\hat L_{\mathrm{pad}}
\in
\mathbb R^{128\times T_{\mathrm{pad}}}
}
]

---

# (\boxed{\text{ALGORITHM 24 — QWEN3-OMNI PERCEPTION PATH}})

Primary report:

[
f_s
===

16000
]

[
M=128
]

[
T_{\mathrm{win}}
================

25\mathrm{ms}
]

[
T_{\mathrm{hop}}
================

10\mathrm{ms}
]

[
[\mathrm{PAPER!-!REPORTED}]
\quad
([arXiv][2])
]

Therefore

[
L
=

# 0.025(16000)

\boxed{400}
\quad
[\mathrm{MATHEMATICALLY!-!DERIVED}]
]

[
H
=

# 0.010(16000)

\boxed{160}
]

[
r_{\mathrm{Mel}}
================

# \frac{16000}{160}

\boxed{100\mathrm{Hz}}
]

### 24.1 Frontend

[
x
\rightarrow
F_{\mathrm{Mel}}
]

[
F_{\mathrm{Mel}}
\in
\mathbb R^{128\times T}
]

[
N_{\mathrm{FFT}}
================

[\mathrm{UNDISCLOSED}]
]

[
\text{Mel scale}
================

[\mathrm{UNDISCLOSED}]
]

[
\text{log base/compression}
===========================

[\mathrm{UNDISCLOSED}]
]

// The report states a 128-channel Mel spectrogram; do not substitute Qwen3-ASR’s exact log-Mel implementation.

### 24.2 AuT subsampling

[
F_{\mathrm{Mel}}
\rightarrow
\operatorname{Conv2D}_{1:J}
\rightarrow
Z
]

[
\boxed{
R_t=8
}
\quad
[\mathrm{PAPER!-!REPORTED}]
\quad
([arXiv][2])
]

[
r_{\mathrm{AuT}}
================

# \frac{100}{8}

\boxed{12.5\mathrm{Hz}}
]

[
\Delta t_{\mathrm{AuT}}
=======================

# \frac1{12.5}

\boxed{80\mathrm{ms}}
]

[
(K_j,S_j,P_j,D_j)_{j=1}^{J}
===========================

[\mathrm{UNDISCLOSED}]
]

### 24.3 Attention

[
Z
\rightarrow
\operatorname{AuT}*{\mathrm{self-attn}}
\rightarrow
H*{\mathrm{audio}}
]

[
\boxed{
W_{\mathrm{attention}}
\in
[1\mathrm{s},8\mathrm{s}]
}
\quad
[\mathrm{PAPER!-!REPORTED}]
\quad
([arXiv][2])
]

[
H_{\mathrm{audio}}
\in
\mathbb R^{B\times T/8\times d_{\mathrm{AuT}}}
]

[
d_{\mathrm{AuT}}
================

[\mathrm{UNDISCLOSED;HERE}]
]

---

# (\boxed{\text{ALGORITHM 25 — QWEN3.5-OMNI PERCEPTION PATH}})

[
f_s=16000
]

[
M=128
]

[
T_{\mathrm{win}}=25\mathrm{ms}
]

[
T_{\mathrm{hop}}=10\mathrm{ms}
]

[
[\mathrm{PAPER!-!REPORTED}]
\quad
([arXiv][3])
]

Therefore

[
L=400
]

[
H=160
]

[
r_0
===

100\mathrm{Hz}
]

### 25.1 Four Conv2D blocks

[
Z^{(0)}
=======

F_{\mathrm{Mel}}
]

For

[
j=1,2,3,4
]

[
\boxed{
Z^{(j)}
=======

\phi_j
\left[
\operatorname{Conv2D}_j
(
Z^{(j-1)}
)
\right]
}
]

Total temporal reduction:

[
\boxed{
\prod_{j=1}^4
R_j
===

16
}
\quad
[\mathrm{PAPER!-!REPORTED}]
\quad
([arXiv][3])
]

[
r_{\mathrm{AuT}}
================

# \frac{100}{16}

\boxed{6.25\mathrm{Hz}}
]

[
\Delta t
========

160\mathrm{ms}
]

[
\boxed{
Z^{(4)}
\rightarrow
\mathrm{SelfAttention}*{\mathrm{AuT}}
\rightarrow
H*{\mathrm{audio}}
}
]

Per-block

[
(K_j,S_j,P_j,D_j,C_j)
=====================

[\mathrm{UNDISCLOSED}]
]

// Only the total (16\times) reduction and four Conv2D blocks are source-established. ([arXiv][3])

### 25.2 Temporal IDs

[
\boxed{
\Delta t_{\mathrm{position}}
============================

160\mathrm{ms}
}
]

[
p_t
===

\left\lfloor
\frac{t}{160\mathrm{ms}}
\right\rfloor
]

for audio temporal positioning, with multimodal temporal alignment at this granularity. ([arXiv][3])

---

# (\boxed{\text{ALGORITHM 26 — GENERIC MEL \rightarrow CONV2D SUBSAMPLER}})

[
F^{(0)}
\in
\mathbb R^{B\times1\times M_0\times T_0}
]

For convolution block (\ell),

[
Z^{(\ell)}
==========

\phi_\ell
\left[
\operatorname{Conv2D}_{\ell}
(
Z^{(\ell-1)}
)
\right]
]

Temporal output:

[
\boxed{
T_\ell
======

\left\lfloor
\frac{
T_{\ell-1}
+
P_{\ell,t}^{L}
+
P_{\ell,t}^{R}
--------------

D_{\ell,t}(K_{\ell,t}-1)
-1
}
{
S_{\ell,t}
}
+1
\right\rfloor
}
]

Frequency output:

[
\boxed{
F_\ell
======

\left\lfloor
\frac{
F_{\ell-1}
+
P_{\ell,f}^{L}
+
P_{\ell,f}^{R}
--------------

D_{\ell,f}(K_{\ell,f}-1)
-1
}
{
S_{\ell,f}
}
+1
\right\rfloor
}
]

Final

[
Z^{(L_c)}
\in
\mathbb R^{B\times C'\times F'\times T'}
]

Permute:

[
Z_p
===

\operatorname{Permute}
(
Z^{(L_c)};
B,T',C',F'
)
]

[
Z_p
\in
\mathbb R^{B\times T'\times C'\times F'}
]

Flatten:

[
Z_f
===

\operatorname{Flatten}_{C',F'}(Z_p)
]

[
Z_f
\in
\mathbb R^{B\times T'\times C'F'}
]

Project:

[
\boxed{
H^{(0)}
=======

Z_fW_{\mathrm{in}}+b_{\mathrm{in}}
}
]

[
W_{\mathrm{in}}
\in
\mathbb R^{C'F'\times d_{\mathrm{model}}}
]

[
\boxed{
H^{(0)}
\in
\mathbb R^{B\times T'\times d_{\mathrm{model}}}
}
]

---

# (\boxed{\text{ALGORITHM 27 — AUDIO TRANSFORMER}})

For layer

[
\ell=1,\ldots,L_{\mathrm{Tr}}
]

and head (h),

[
Q_h
===

H_{\ell-1}W_{Q,h}^{(\ell)}
]

[
K_h
===

H_{\ell-1}W_{K,h}^{(\ell)}
]

[
V_h
===

H_{\ell-1}W_{V,h}^{(\ell)}
]

[
Q_h,K_h,V_h
\in
\mathbb R^{B\times T'\times d_h}
]

### 27.1 Attention logits

[
\boxed{
S_h
===

\frac{
Q_hK_h^\top
}{
\sqrt{d_h}
}
+
M_{\mathrm{attn}}
}
]

### 27.2 Mask families

Bidirectional:

[
M_{ij}=0
]

Causal:

[
M_{ij}
======

\begin{cases}
0,&j\le i
\
-\infty,&j>i
\end{cases}
]

Sliding causal (W):

[
M_{ij}
======

\begin{cases}
0,&i-W+1\le j\le i
\
-\infty,&\text{otherwise}
\end{cases}
]

// Select only the mask established for the audited model.

### 27.3 Attention probability

[
A_h
===

\operatorname{softmax}(S_h)
]

[
O_h
===

A_hV_h
]

[
O
=

\operatorname{Concat}
(
O_1,\ldots,O_{N_h}
)
W_O
]

### 27.4 Generic pre-normalized block

[
U_\ell
======

H_{\ell-1}
+
\operatorname{MHA}
(
\operatorname{Norm}*1(H*{\ell-1})
)
]

[
\boxed{
H_\ell
======

U_\ell
+
\operatorname{FFN}
(
\operatorname{Norm}*2(U*\ell)
)
}
]

[
H_{\mathrm{audio}}
==================

H_{L_{\mathrm{Tr}}}
]

---

# (\boxed{\text{ALGORITHM 28 — VOXTRAL REALTIME EXACT RATE PATH}})

The published frontend is:

[
x[n]
\rightarrow
\operatorname{LogMel}*{128}
\rightarrow
\operatorname{CausalConvStem}
\rightarrow
\operatorname{CausalTransformer}
\rightarrow
\operatorname{Adapter}*{4\times}
\rightarrow
\operatorname{TextDecoder}
]

with

[
f_s=16000
]

[
M=128
]

[
H=160
]

[
r_{\mathrm{Mel}}
================

100\mathrm{Hz}
]

[
[\mathrm{PAPER!-!REPORTED}]
\quad
([arXiv][4])
]

### 28.1 Causal Conv stem

Two kernel-3 convolutions, including temporal striding:

[
F_{100\mathrm{Hz}}
\rightarrow
\operatorname{CausalConvStem}*{2\times}
\rightarrow
Z*{50\mathrm{Hz}}
]

[
\boxed{
r_{\mathrm{enc}}
================

50\mathrm{Hz}
}
]

[
\Delta t_{\mathrm{enc}}
=======================

20\mathrm{ms}
]

Streaming state:

[
\boxed{
\mathcal B_t
============

{
F_{t-4},F_{t-3},F_{t-2},F_{t-1}
}
}
]

// Four input frames of history are retained for exact causal stem computation. ([arXiv][4])

### 28.2 Encoder Transformer

[
L_{\mathrm{enc}}=32
]

[
d_{\mathrm{enc}}=1280
]

[
N_h=32
]

[
W_{\mathrm{enc}}=750\text{ frames}
]

[
750(20\mathrm{ms})
==================

\boxed{15\mathrm{s}}
]

[
\mathrm{Norm}
=============

\mathrm{RMSNorm}
]

[
\mathrm{FFN}
============

\mathrm{SwiGLU}
]

[
\mathrm{Pos}
============

\mathrm{RoPE}
]

[
\mathrm{Attn}
=============

\mathrm{causal;sliding;window}
]

[
[\mathrm{PAPER!-!REPORTED}]
\quad
([arXiv][4])
]

### 28.3 Adapter

Pack every four encoder frames:

[
U_j
===

\operatorname{Pack}
(
h_{4j},
h_{4j+1},
h_{4j+2},
h_{4j+3}
)
]

[
U_j
\in
\mathbb R^{4(1280)}
===================

\mathbb R^{5120}
]

[
\boxed{
A_j
===

\operatorname{MLP}_{5120\rightarrow3072}(U_j)
}
]

[
r_A
===

# 50/4

\boxed{12.5\mathrm{Hz}}
]

[
\Delta t_A
==========

\boxed{80\mathrm{ms}}
]

The factor-(4) adapter and (1280\times4\to3072) dimensional map are reported directly. ([arXiv][4])

### 28.4 Decoder synchronization

For adapter frame (j),

[
A_j
+
E(y_{j-1})
\rightarrow
D_{\mathrm{text}}
\rightarrow
p(y_j)
]

[
y_j
\in
V_{\mathrm{text}}
\cup
{[\mathrm P],[\mathrm W]}
]

[
\boxed{
1\text{ decoder step}
\Longleftrightarrow
80\mathrm{ms}
}
]

[
[\mathrm{PAPER!-!REPORTED}]
\quad
([arXiv][4])
]

---

# (\boxed{\text{ALGORITHM 29 — TOKEN-RATE ACCOUNTING}})

General input frame rate:

[
\boxed{
r_{\mathrm{frame}}
==================

\frac{f_s}{H}
}
]

Total temporal reduction

[
R
=

\prod_{\ell}S_{\ell,t}
]

therefore

[
\boxed{
r_{\mathrm{encoder}}
====================

\frac{f_s/H}{R}
}
]

[
\boxed{
\Delta t_{\mathrm{encoder}}
===========================

\frac{1}{r_{\mathrm{encoder}}}
}
]

### Qwen3-Omni

[
r_0=100
]

[
R=8
]

[
\boxed{
r=12.5\mathrm{Hz},
\qquad
\Delta t=80\mathrm{ms}
}
]

([arXiv][2])

### Qwen3.5-Omni

[
r_0=100
]

[
R=16
]

[
\boxed{
r=6.25\mathrm{Hz},
\qquad
\Delta t=160\mathrm{ms}
}
]

([arXiv][3])

### Voxtral Realtime

[
100
\xrightarrow{/2}
50
\xrightarrow{/4}
12.5
]

[
\boxed{
10\mathrm{ms}
\rightarrow
20\mathrm{ms}
\rightarrow
80\mathrm{ms}
}
]

([arXiv][4])

### Receptive-field invariant

[
\boxed{
\Delta t_{\mathrm{token}}
\neq
R_{\mathrm{effective}}
}
]

For an attention token (i),

[
R_{\mathrm{effective},i}
========================

\bigcup_{j:M_{ij}=0}
R_{\mathrm{input},j}
]

Thus

[
\Delta t_{\mathrm{token}}=160\mathrm{ms}
\not\Rightarrow
R_{\mathrm{effective}}=160\mathrm{ms}
]

---

# (\boxed{\text{ALGORITHM 30 — CONTINUOUS AUDIO TOKEN PATH}})

[
L
\in
\mathbb R^{B\times M\times T}
]

[
\Downarrow
\operatorname{Conv/Subsample}
]

[
H^{(0)}
\in
\mathbb R^{B\times T'\times d}
]

[
\Downarrow
\operatorname{AudioTransformer}
]

[
\boxed{
H_{\mathrm{audio}}
==================

[h_0,\ldots,h_{T'-1}]
\in
\mathbb R^{B\times T'\times d}
}
]

[
h_t\in\mathbb R^d
]

[
\boxed{
h_t
\text{ is continuous}
}
]

[
\boxed{
h_t
\notin
{0,\ldots,K-1}
}
]

// “audio token” can denote a continuous encoder vector; it must not be conflated with a codec code index.

---

# (\boxed{\text{ALGORITHM 31 — NEURAL AUDIO CODEC / RVQ}})

### 31.1 Encoder

[
x[n]
\rightarrow
E_{\mathrm{codec}}
\rightarrow
z_t
]

[
z_t
\in
\mathbb R^{d_z}
]

### 31.2 Initialize residual

[
\boxed{
r_{t,0}=z_t
}
]

### 31.3 Residual quantizers

For

[
q=0,\ldots,Q-1
]

[
c_{t,q}
=======

Q_q(r_{t,q})
]

[
c_{t,q}
\in
{0,\ldots,K_q-1}
]

[
e_{t,q}
=======

E_q[c_{t,q}]
\in
\mathbb R^{d_q}
]

[
\boxed{
r_{t,q+1}
=========

r_{t,q}-e_{t,q}
}
]

### 31.4 Reconstruction

[
\boxed{
\hat z_t
========

\sum_{q=0}^{Q-1}
e_{t,q}
}
]

[
\epsilon_t
==========

# z_t-\hat z_t

r_{t,Q}
]

### 31.5 Standard nearest-neighbour VQ when applicable

[
\boxed{
c_{t,q}
=======

\arg\min_{j}
\left|
r_{t,q}-E_q[j]
\right|_2^2
}
\qquad
[\mathrm{STANDARD!-!DEFINITION}]
]

// Do not attribute Euclidean lookup to a specific codec unless disclosed.

### 31.6 Decoder

[
{c_{t,q}}
\rightarrow
\hat z_t
\rightarrow
D_{\mathrm{codec}}
\rightarrow
\boxed{\hat x[n]}
]

### 31.7 Parameter distinction

[
\boxed{
Q
=

\text{number of residual quantizers}
}
]

[
\boxed{
K_q
===

\text{codebook cardinality}
}
]

[
\boxed{
d_q
===

\text{code embedding dimension}
}
]

[
Q\neq K_q\neq d_q
]

---

# (\boxed{\text{ALGORITHM 32 — QWEN3-OMNI SPEECH GENERATION}})

Qwen3-Omni reports a multi-codebook autoregressive Talker: the Talker predicts the first codec codebook/frame component and MTP generates the remaining residual codebooks; Code2Wav is a causal ConvNet. ([arXiv][2])

At speech step (t),

[
h_t^{\mathrm{Talker}}
\rightarrow
p(c_{t,0})
]

[
\boxed{
c_{t,0}
=======

\operatorname{Decode}
[
p(c_{t,0}\mid\mathcal C_t)
]
}
]

Then

[
(c_{t,0},h_t,\mathcal C_t)
\rightarrow
\mathrm{MTP}
]

[
\boxed{
\mathrm{MTP}
\rightarrow
(c_{t,1},\ldots,c_{t,Q-1})
}
]

Then

[
\mathbf c_t
===========

(c_{t,0},c_{t,1},\ldots,c_{t,Q-1})
]

[
\mathbf c_{\le t}
\rightarrow
\operatorname{Code2Wav}_{\mathrm{causal}}
\rightarrow
\hat x_t
]

[
\boxed{
\mathbf c_t
\rightarrow
80\mathrm{ms;audio}
}
]

at the reported (12.5\rm,Hz) Talker rate. ([arXiv][2])

[
Q
=

[\mathrm{UNDISCLOSED;IN;CITED;REPORT;PASSAGE}]
]

[
K_q
===

[\mathrm{UNDISCLOSED}]
]

[
d_q
===

[\mathrm{UNDISCLOSED}]
]

### Left-context streaming constraint

[
p(c_t)
======

p(c_t\mid c_{<t},\mathcal C_{\le t})
]

[
\boxed{
\frac{\partial c_t}
{\partial c_{>t}}
=================

0
}
]

// Waveform decoding can start after each generated codec frame rather than waiting for future block context. ([arXiv][2])

---

# (\boxed{\text{ALGORITHM 33 — QWEN3.5-OMNI CODEC PATH}})

[
\boxed{
\text{speech representation}
============================

\mathrm{RVQ!-!based}
}
\quad
[\mathrm{PAPER!-!REPORTED}]
\quad
([arXiv][3])
]

[
\mathcal C_{\mathrm{Thinker}}
+
\text{text stream}
\rightarrow
\operatorname{Talker}
]

Qwen3.5 replaces fixed dual-channel alignment with ARIA. ([arXiv][3])

Let prefix (1:j) contain

[
N_s(j)
======

\text{speech units}
]

[
N_x(j)
======

\text{text units}
]

Let item-level global target ratio be

[
\rho_{\mathrm{item}}
====================

\frac{N_s^{\mathrm{item}}}
{N_x^{\mathrm{item}}}
]

ARIA constraint:

[
\boxed{
\forall j:
\qquad
\frac{N_s(j)}
{\max(N_x(j),1)}
\le
\rho_{\mathrm{item}}
}
]

[
\operatorname{Interleave}
(
x_{1:N_x},
c_{1:N_s};
\rho_{\mathrm{item}}
)
\rightarrow
y_{1:N_x+N_s}
]

[
\boxed{
y
\rightarrow
\mathrm{MTP/Code2wav}
\rightarrow
\hat x
}
]

[
Q,K_q,d_q,\text{exact VQ metric}
================================

[\mathrm{UNDISCLOSED}]
]

---

# (\boxed{\text{ALGORITHM 34 — REPRESENTATION INFORMATION MATRIX}})

Define

[
\mathfrak R
===========

(
\text{phase},
\text{spectral resolution},
\text{pitch},
\text{timbre},
\text{speaker},
\text{invertibility},
\text{rate},
\text{storage}
)
]

### Raw waveform

[
R_{\mathrm{wave}}
=================

x[n]
]

[
\text{phase/time structure}
===========================

\mathrm{retained}
]

[
r=f_s
]

[
\operatorname{storage/s}
========================

f_sB_{\mathrm{sample}}
]

### Complex STFT

[
R_{\mathrm{STFT}}
=================

X_{k,t}
]

[
\text{phase}
============

\mathrm{retained}
]

[
\text{conditional invertibility}
================================

1
]

given a valid analysis/synthesis window-hop pair.

### Power spectrum

[
R_P=|X|^2
]

[
\boxed{
\text{phase}=0;\text{information retained}
}
]

### Mel

[
R_{\mathrm{Mel}}
================

H_{\mathrm{Mel}}P
]

[
M<K
\Longrightarrow
\text{frequency compression}
]

### Log-Mel

[
R_{\log\mathrm{Mel}}
====================

\log(H_{\mathrm{Mel}}P)
]

[
\text{same Mel rank}
+
\text{dynamic-range compression}
]

### Full MFCC

If

[
C=M
]

and DCT is full rank,

[
D^{-1}D=I
]

therefore

[
\text{MFCC}
\leftrightarrow
\text{log-Mel}
]

up to numerical/scaling conventions.

If

[
C<M
]

[
\boxed{
\text{MFCC}_{C}
\text{ is lossy}
}
]

### Codec

For frame rate (r_c),

[
\boxed{
R_{\mathrm{codec}}
==================

r_c
\sum_{q=0}^{Q-1}
\log_2K_q
\quad
[\mathrm{bits/s}]
}
]

### Continuous encoder

For

[
H\in\mathbb R^{r_h\times d}
]

stored with (b)-bit elements,

[
\boxed{
R_{\mathrm{continuous}}
=======================

r_hd b
\quad
[\mathrm{bits/s}]
}
]

---

# (\boxed{\text{ALGORITHM 35 — STREAMABILITY TEST}})

For transformation

[
Y_t
===

T(X)
]

define dependency set

[
\mathcal D_t
============

{
j:
\partial Y_t/\partial X_j\neq0
}
]

Strict causal:

[
\boxed{
\mathcal D_t
\subseteq
(-\infty,t]
}
]

Look-ahead (L_a):

[
\mathcal D_t
\subseteq
(-\infty,t+L_a]
]

Offline/bidirectional:

[
\exists j>t:
j\in\mathcal D_t
]

Streaming memory for causal window (W):

[
\boxed{
\mathcal M_{\mathrm{KV}}
========================

O(L,W,d_{\mathrm{KV}})
}
]

rather than

[
O(L,T,d_{\mathrm{KV}})
]

for unbounded full-history KV retention.

Voxtral Realtime satisfies finite causal convolutional history and finite attention windows. ([arXiv][4])

---

# (\boxed{\text{ALGORITHM 36 — DISCERNMENT LOOP}})

For every claim (C_i),

[
\boxed{
\Xi(C_i)
========

(
s_i,
v_i,
r_i,
m_i
)
}
]

where

[
s_i
===

\text{source authority}
]

[
v_i
===

\text{version compatibility}
]

[
r_i
===

\text{reproducibility}
]

[
m_i
===

\text{mathematical consistency}
]

Accept iff

[
\boxed{
\operatorname{Accept}(C_i)
==========================

\mathbb 1
[
s_i\ge s_{\min}
\land
v_i=1
\land
r_i=1
\land
m_i=1
]
}
]

Source precedence:

[
\boxed{
\mathrm{Code}

>

\mathrm{Checkpoint/Config}

>

\mathrm{Paper}

>

\mathrm{OfficialDocs}

>

\mathrm{Inference}
}
]

For predecessor/new-model pair

[
M_{t-1},M_t
]

[
\boxed{
\theta(M_{t-1})
\not\Rightarrow
\theta(M_t)
}
]

unless

[
\operatorname{InheritanceEvidence}
(
\theta,M_{t-1},M_t
)=1
]

---

# (\boxed{\text{ALGORITHM 37 — DIMENSIONAL DILIGENCE}})

### Sampling

[
N
\stackrel{?}{=}
f_sT
]

### Frame

[
L
\stackrel{?}{=}
f_sT_{\mathrm{win}}
]

### Hop

[
H
\stackrel{?}{=}
f_sT_{\mathrm{hop}}
]

### Overlap

[
O
\stackrel{?}{=}
L-H
]

### FFT

[
\Delta f
\stackrel{?}{=}
f_s/N_{\mathrm{FFT}}
]

### Real FFT

For even (N_{\mathrm{FFT}}),

[
K
\stackrel{?}{=}
N_{\mathrm{FFT}}/2+1
]

### Mel

[
[M,K][K,T]
\stackrel{?}{\rightarrow}
[M,T]
]

### MFCC

[
[C,M][M,T]
\stackrel{?}{\rightarrow}
[C,T]
]

### Dynamic MFCC

[
3C
\stackrel{C=13}{=}
39
]

### Token rate

[
r_{\mathrm{encoder}}
\stackrel{?}{=}
\frac{f_s}{HR}
]

### Qwen3

[
16000/(160\cdot8)
=================

12.5
]

### Qwen3.5

[
16000/(160\cdot16)
==================

6.25
]

### Voxtral

[
16000/(160\cdot2\cdot4)
=======================

12.5
]

---

# (\boxed{\text{ALGORITHM 38 — FAILURE ASSERTIONS}})

[
\operatorname{ASSERT}
(
H\neq L-H
)
]

[
\operatorname{ASSERT}
(
160\neq240
)
\qquad
[L=400,H=160]
]

[
\operatorname{ASSERT}
(
|X|\neq|X|^2
)
]

[
\operatorname{ASSERT}
(
K_{\mathrm{FFT}}\neq M_{\mathrm{Mel}}
)
]

[
\operatorname{ASSERT}
(
\mathrm{HTK}\neq\mathrm{Slaney}
)
]

[
\operatorname{ASSERT}
(
\mathrm{MFCC}
\neq
\mathrm{IDFT}
{\log|X|}
)
]

[
\operatorname{ASSERT}
(
F_0\neq F_1,F_2,\ldots
)
]

[
\operatorname{ASSERT}
(
\text{glottal excitation}
\neq
\text{vocal-tract filter}
)
]

[
\operatorname{ASSERT}
(
q_{\mathrm{MFCC}}
\neq
q_{\mathrm{cepstral,time}}
)
]

[
\operatorname{ASSERT}
(
\text{log-Mel}
\neq
H_{\mathrm{audio}}
\neq
c_{t,q}
)
]

[
\operatorname{ASSERT}
(
\text{token spacing}
\neq
\text{effective receptive field}
)
]

[
\operatorname{ASSERT}
(
[\mathrm{UNDISCLOSED}]
\not\rightarrow
\text{textbook default}
)
]

---

# (\boxed{\text{ALGORITHM 39 — FINAL CONNECTED MATHEMATICAL PROGRAM}})

[
\boxed{
\begin{aligned}
p_{\mathrm{exc}}(t)
&\xrightarrow{*,g*v*r}
p_{\mathrm{ac}}(t)
[3pt]
&\xrightarrow[\text{anti-alias}]{\text{sampling }f_s}
x[n]
[3pt]
&\xrightarrow{x_m[r]=x[mH+r]}
x_m[r]
[3pt]
&\xrightarrow{\times,w[r]}
\tilde x_m[r]
[3pt]
&\xrightarrow{
\sum_r(\cdot)e^{-j2\pi kr/N_{\mathrm{FFT}}}
}
X_m[k]
[3pt]
&\xrightarrow{|\cdot|}
A_m[k]
[3pt]
&\xrightarrow{|\cdot|^2}
P_m[k]
[3pt]
&\xrightarrow{\mathbf H_{\mathrm{Mel}}}
E_m[b]
[3pt]
&\xrightarrow{\max(\cdot,\epsilon)}
E'*m[b]
[3pt]
&\xrightarrow{\log}
L_m[b]
[3pt]
&\xrightarrow{\mathrm{DCT-II}}
c_m[q]
[3pt]
&\xrightarrow{\mathcal R*{\Delta}}
\Delta c_m[q]
[3pt]
&\xrightarrow{\mathcal R_{\Delta}}
\Delta^2c_m[q]
\end{aligned}
}
]

The required terminal chain in the specification is thereby preserved without an opaque STFT/Mel/MFCC transition. 

---

## (\boxed{\text{MODERN PERCEPTION BRANCH}})

[
\boxed{
\begin{aligned}
x[n]
&\rightarrow
F_{\mathrm{Mel/logMel}}
\
&\rightarrow
\operatorname{Conv/Subsample}
\
&\rightarrow
H^{(0)}
\
&\rightarrow
\operatorname{AudioTransformer}
\
&\rightarrow
H_{\mathrm{audio}}
\
&\rightarrow
\operatorname{Project/Interleave}
\
&\rightarrow
\operatorname{LLM/Thinker}
\end{aligned}
}
]

with verified rate instances

[
\boxed{
\begin{array}{rcl}
\mathrm{Qwen3!-!Omni}
&:&
100\mathrm{Hz}\rightarrow12.5\mathrm{Hz}
\
\mathrm{Qwen3.5!-!Omni}
&:&
100\mathrm{Hz}\rightarrow6.25\mathrm{Hz}
\
\mathrm{Voxtral\ Realtime}
&:&
100\mathrm{Hz}\rightarrow50\mathrm{Hz}\rightarrow12.5\mathrm{Hz}.
\end{array}
}
]

([arXiv][2])

---

## (\boxed{\text{MODERN SPEECH-GENERATION BRANCH}})

[
\boxed{
\begin{aligned}
x[n]
&\rightarrow
E_{\mathrm{codec}}
\
&\rightarrow
z_t
\
&\rightarrow
\mathrm{RVQ}
\
&\rightarrow
(c_{t,0},\ldots,c_{t,Q-1})
\
&\rightarrow
D_{\mathrm{codec}}
\
&\rightarrow
\hat x[n]
\end{aligned}
}
]

For generative prediction,

[
\boxed{
\begin{aligned}
\mathcal C_t
&\rightarrow
\mathrm{Talker}
\rightarrow
c_{t,0}
\
(c_{t,0},\mathcal C_t)
&\rightarrow
\mathrm{MTP}
\rightarrow
c_{t,1:Q-1}
\
c_{\le t,0:Q-1}
&\rightarrow
\mathrm{Code2Wav}
\rightarrow
\hat x_t
\end{aligned}
}
]

Qwen3-Omni publicly reports this multi-codebook/MTP/causal-Code2Wav structure, while Qwen3.5-Omni retains an RVQ-based representation and changes text–speech alignment through ARIA. ([arXiv][2])

---

[
\boxed{
\begin{aligned}
\mathrm{STFT}
&:
\text{local time waveform}
\rightarrow
\text{complex linear-frequency spectrum}
[3pt]
\mathrm{Mel}
&:
|X|^2
\rightarrow
\text{warped integrated band energies}
[3pt]
\log
&:
\text{multiplicative spectral factors}
\rightarrow
\text{additive log factors}
[3pt]
\mathrm{RealCepstrum}
&:
\operatorname{IDFT}
{
\log|X|
}
[3pt]
\mathrm{MFCC}
&:
\operatorname{DCT-II}
\left{
\log
\left(
H_{\mathrm{Mel}}|X|^2
\right)
\right}
[3pt]
\mathrm{MFCC}
&\neq
\mathrm{RealCepstrum}
[3pt]
\mathrm{low;cepstral/DCT;order}
&\leftrightarrow
\text{smooth spectral envelope}
[3pt]
q_{\mathrm{pitch}}
&\leftrightarrow
F_0^{-1}
[3pt]
39
&=
13+13_{\Delta}+13_{\Delta^2}
[3pt]
\mathrm{logMel}
&\neq
\mathrm{continuous;AuT;state}
\neq
\mathrm{discrete;RVQ;index}.
\end{aligned}
}
]

[1]: https://github.com/huggingface/transformers/blob/main/src/transformers/models/qwen3_asr/feature_extraction_qwen3_asr.py "transformers/src/transformers/models/qwen3_asr/feature_extraction_qwen3_asr.py at main · huggingface/transformers · GitHub"
[2]: https://arxiv.org/html/2509.17765v1 "Qwen3-Omni Technical Report"
[3]: https://arxiv.org/html/2604.15804v2 "Qwen3.5-Omni Technical Report"
[4]: https://arxiv.org/html/2602.11298v3 "Voxtral Realtime"


