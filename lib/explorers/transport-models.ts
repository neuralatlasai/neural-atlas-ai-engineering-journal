import { node as n, edge as e, view as v, type ModelArchitecture } from "./schema";

const folder = ["models", "diffusion", "flow-matching"];
const article = "docs/Models/Diffusion/Flow_matching/flow_matching.md";

function transport(method: "fm" | "rf" | "si"): ModelArchitecture {
  const fm = method === "fm", rf = method === "rf";
  const id = fm ? "flow-matching" : rf ? "rectified-flow" : "stochastic-interpolants";
  const title = fm ? "Flow Matching" : rf ? "Rectified Flow" : "Stochastic Interpolants";
  const path = fm ? "xₜ = t x₁ + [1−(1−σmin)t] x₀" : rf ? "xₜ = (1−t)x₀ + t x₁" : "xₜ = Iₜ(x₀,x₁)";
  const velocity = fm ? "uₜ = x₁ − (1−σmin)x₀" : rf ? "uₜ = x₁ − x₀" : "uₜ = ∂ₜ Iₜ(x₀,x₁)";
  return {
    id, title, family: "Generative transport · algorithm", article, folder,
    description: fm ? "Simulation-free conditional vector-field regression followed by neural ODE generation." : rf ? "Straight endpoint interpolation, learned marginal velocity and optional reflow coupling." : "A differentiable stochastic endpoint interpolant defines density, current and learned transport.",
    scope: `This is the ${title} algorithm, not a fixed Transformer or U-Net checkpoint. B=batch; d=data/latent dimension; t∈[0,1]. In this explorer generation runs base/noise at t=0 →target at t=1. Neural-field topology, solver and conditional inputs are instantiation choices.`,
    sources: [
      { label: `${title} paper`, href: fm ? "https://arxiv.org/abs/2210.02747" : rf ? "https://arxiv.org/abs/2209.03003" : "https://arxiv.org/abs/2209.15571", note: "Original algorithm; equations and distinctions are also developed in the source article." },
      { label: "Author implementation", href: fm ? "https://github.com/facebookresearch/flow_matching" : rf ? "https://github.com/gnobitab/RectifiedFlow" : "https://github.com/malbergo/stochastic-interpolants", note: "Architecture and numerical solver vary by experiment; no universal layer count." },
    ], views: [
      v("model", "Algorithm", "The transport learning interface", "A conditional path supplies training targets; the learned marginal field drives generation.", [
        n("base", "Base endpoint x₀", 0, 0, "base distribution p₀", "[B,d]", "x₀ ∼ p₀", "Commonly Gaussian noise, but the algorithm permits other base distributions."),
        n("data", "Target endpoint x₁", 0, 2, "dataset / target distribution p₁", "[B,d]", "x₁ ∼ p₁", rf ? "The initial endpoint coupling can be arbitrary; reflow changes that coupling." : "The standard construction samples independent base and data endpoints."),
        n("interpolate", "Sample time and path", 1, 1, "x₀,x₁,t", "xₜ [B,d]", path, fm ? "The conditional Gaussian path retains σmin noise at t=1. Setting σmin=0 gives the straight affine specialization." : rf ? "Each conditional sample follows a straight segment; the marginal learned field need not itself have straight trajectories." : "Endpoint randomness induces a stochastic family of paths; the learned ODE is deterministic conditional on its initial state.", { nextView: "training" }),
        n("target", "Pathwise velocity target", 2, 0, "endpoint pair + time", "uₜ [B,d]", velocity, "This target is available without numerically simulating the current neural field."),
        n("network", "Neural vector field", 2, 2, "xₜ,t,optional conditioning", "vθ [B,d]", "vθ(xₜ,t | c)", "Output shape equals the state shape. A U-Net, DiT or another differentiable field can instantiate this interface.", { evidence: "derived" }),
        n("objective", "Velocity regression", 3, 1, "predicted / target velocities", "scalar loss", "L = E ||vθ(xₜ,t) − uₜ||²", "The conditional-to-marginal projection learns E[uₜ | xₜ], rather than recovering every endpoint pair at intersections."),
        n("ode", "Generate with learned ODE", 4, 1, "new x₀ + learned field", "generated x₁ [B,d]", "dx/dt = vθ(x,t); integrate0→1", "An ODE solver appears at sampling time, not inside each standard training example.", { nextView: "inference" }),
      ], [e("base", "interpolate", "x₀"), e("data", "interpolate", "x₁"), e("interpolate", "target", "path derivative"), e("interpolate", "network", "xₜ / t"), e("target", "objective", "uₜ"), e("network", "objective", "vθ"), e("objective", "ode", "learned field")]),
      v("training", "Training", fm ? "Conditional flow-matching training" : rf ? "Rectified-flow regression and reflow" : "Interpolant regression and probability current", "Training targets derive from the selected path and endpoint coupling.", [
        n("pair", "Sample endpoint coupling", 0, 1, "p₀,p₁ / coupling π", "(x₀,x₁) [B,d] each", "(x₀,x₁) ∼ π", rf ? "The coupling matters: independent, minibatch OT and reflow couplings are different training distributions." : "The original construction's endpoint sampling assumptions must be retained."),
        n("time", "Draw time", 1, 1, "training time distribution", "t [B,1]", "t ∼ q(t), commonly Uniform[0,1]", "Time sampling and loss weighting can change an implementation; neither implies a different fixed network architecture."),
        n("path", "Construct state / derivative", 2, 1, "endpoints + t", "xₜ,uₜ [B,d]", path + "\n" + velocity, "Broadcast t across state dimensions; retain one consistent time direction."),
        n("predict", "Vector-field forward", 3, 1, "xₜ,t,c", "[B,d]", "v = vθ(xₜ,t | c)", "The neural network is evaluated once per standard regression batch."),
        n("loss", "Squared velocity error", 4, 1, "v,uₜ", "scalar objective", "L = mean(||v−uₜ||²)", "Backpropagation follows the field evaluation; no training ODE rollout is needed for this objective.", { cost: "Ordinary training batch: one field forward/backward plus O(Bd) path construction; field internals determine the dominant cost." }),
        n("special", rf ? "Optional reflow" : fm ? "Marginal field identity" : "Density / current identity", 5, 1, rf ? "trained flow / sampled x₀" : "conditional velocity samples", rf ? "new coupled endpoints" : "marginal transport relation", rf ? "x₁′ = ODESolve(vθ,x₀); refit on (x₀,x₁′)" : fm ? "v*(x,t) = E[uₜ | xₜ=x]" : "jₜ(x)=E[∂ₜIₜ δ(x−Iₜ)]; v*=jₜ/pₜ", rf ? "Reflow is an additional data-generation/training phase with solver cost, not part of every initial training step." : "The marginal relation is mathematical structure, not an extra network head.", { evidence: rf ? "reported" : "derived", cost: rf ? "Reflow requires additional neural ODE solves to form the next coupling." : undefined }),
      ], [e("pair", "time", "endpoint batch"), e("pair", "path", "x₀ / x₁"), e("time", "path", "t"), e("path", "predict", "xₜ / t"), e("path", "loss", "uₜ"), e("predict", "loss", "v"), e("loss", "special", rf ? "trained field" : "regression optimum")]),
      v("inference", "ODE sampling", "Integrate from the base distribution", "A fixed trained vector field is repeatedly evaluated by the numerical solver.", [
        n("initial", "Fresh base sample", 0, 1, "p₀", "x(0) [B,d]", "x(0) ∼ p₀", "Sampling starts from a new initial state; training endpoint x₁ is unavailable."),
        n("field", "Field evaluation", 1, 1, "x(t),t,c", "velocity [B,d]", "v = vθ(x(t),t | c)", "Network parameters remain fixed during generation."),
        n("solver", "Numerical integration", 2, 1, "state / velocity / timestep", "updated state [B,d]", "Euler example: xₖ₊₁=xₖ+Δt vθ(xₖ,tₖ)", "Euler is one solver option; adaptive and higher-order solvers use different evaluation counts.", { evidence: "derived", cost: "Sampling cost O(M × field-forward cost), M=number of function evaluations. M is not always the number of displayed solver steps." }),
        n("terminal", "Terminal sample", 3, 1, "x(t=1)", "[B,d] generated sample", fm ? "endpoint distribution approaches data convolved with σmin noise" : "pushforward of p₀ under learned flow", "Approximation error includes learned-field error and numerical integration error."),
        n("decode", "Optional observation decoder", 4, 1, "generated latent or data", "image / audio / other observation", "latent decoder if the field was trained in latent space", "A VAE decoder is an instantiation choice, not part of the original abstract algorithm.", { evidence: "derived" }),
      ], [e("initial", "field", "x(0)"), e("field", "solver", "v"), e("solver", "field", "next x / t", "metadata"), e("solver", "terminal", "terminal state"), e("terminal", "decode", "sample")]),
    ],
  };
}

const mmArticle = "docs/Models/Diffusion/Flow_matching/MM_DiT.md";
const mmdit: ModelArchitecture = {
  id: "mmdit-editing", title: "MM-DiT · attention-guided editing", family: "Diffusion · training-free editing", article: mmArticle, folder,
  description: "Inspect dual-stream attention, source image Q/K injection and synchronized source/target latent evolution.",
  scope: "The editing paper uses frozen SD3, SD3.5 and Flux.1 generators; it does not train a new MM-DiT. B=batch, Ni=image tokens, Nt=text tokens, h=heads, dh=head width. Here t=1 is noise and t=0 is data, matching the article's editing convention.",
  sources: [
    { label: "MM-DiT editing paper", href: "https://arxiv.org/html/2508.07519v1", note: "Four attention blocks, image-Q/K injection and local blending." },
    { label: "Author implementation", href: "https://github.com/SNU-VGILab/exploring-mmdit", note: "Current refactored implementation; not assumed byte-identical to the original experiments." },
    { label: "SD3.5 Large model card", href: "https://huggingface.co/stabilityai/stable-diffusion-3.5-large", note: "Underlying frozen generator; detailed architecture has a separate explorer." },
    { label: "Flux.1 official implementation", href: "https://github.com/black-forest-labs/flux", note: "Double-stream then single-stream architecture; no SD3.5 dimensions are transferred." },
  ], views: [
    v("model", "Editor", "Two synchronized frozen-generator branches", "Source and target prompts start from the same Gaussian latent.", [
      n("source", "Source prompt", 0, 0, "source text", "Csrc text conditioning", "Csrc = TextEncoders(Psrc)", "The source branch establishes the content/layout to preserve."),
      n("target", "Target prompt", 0, 2, "edited text", "Ctgt text conditioning", "Ctgt = TextEncoders(Ptgt)", "Changed text specifies the edit while retaining the source latent trajectory."),
      n("noise", "Shared initial noise", 1, 1, "ε∼N(0,I)", "Zsrc₁ = Ztgt₁ = ε", "copy the same initial latent to both branches", "This diagram shows synthetic editing; real-image use requires an inversion or another source-trajectory construction."),
      n("srcmodel", "Frozen source MM-DiT", 2, 0, "Zsrcₜ,t,Csrc", "vsrc,Qimage,Kimage,attention maps", "source generator forward", "Image Q/K from selected layers/timesteps provide the editing intervention.", { nextView: "attention" }),
      n("tgtmodel", "Frozen target MM-DiT", 2, 2, "Ztgtₜ,t,Ctgt + source image Q/K", "edited target velocity", "Qimage,tgt ← Qimage,src; Kimage,tgt ← Kimage,src", "Text projections and target values remain target-conditioned.", { nextView: "injection" }),
      n("step", "Reverse-time solver step", 3, 1, "source / target velocities", "Zsrcₜ₋Δ, Ztgtₜ₋Δ", "Zₜ₋Δ = Zₜ − Δt v(Zₜ,t)", "The minus sign follows this article's data0/noise1 convention."),
      n("blend", "Optional local latent blend", 4, 1, "new source / target latents + mask", "blended target latent", "Ztgt = M⊙Ztgt +(1−M)⊙Zsrc", "Outside the edit mask the source latent is copied back.", { nextView: "blending" }),
      n("decode", "VAE decode at t=0", 5, 1, "terminal target latent", "edited image", "Iedited = VAE.decode(Ztgt₀)", "No generator parameter update occurs in this editing loop."),
    ], [e("source", "srcmodel", "Csrc"), e("target", "tgtmodel", "Ctgt"), e("noise", "srcmodel", "Zsrc₁"), e("noise", "tgtmodel", "Ztgt₁"), e("srcmodel", "tgtmodel", "source image Q/K"), e("srcmodel", "step", "source velocity"), e("tgtmodel", "step", "target velocity"), e("step", "blend", "next latents"), e("blend", "decode", "after final step"), e("blend", "tgtmodel", "next target latent", "metadata")]),
    v("attention", "Joint attention", "The four multimodal attention blocks", "A single row-wise softmax spans concatenated image and text keys.", [
      n("image", "Image token stream", 0, 0, "[B,Ni,D]", "Qi,Ki,Vi [B,h,Ni,dh]", "separate image projections", "The image and text streams have distinct learned projections."),
      n("text", "Text token stream", 0, 2, "[B,Nt,D]", "Qt,Kt,Vt [B,h,Nt,dh]", "separate text projections", "The joint attention interface does not imply shared image/text FFN weights."),
      n("scores", "Joint score matrix", 1, 1, "Qi,Qt,Ki,Kt", "[B,h,Ni+Nt,Ni+Nt]", "S = [[QiKiᵀ, QiKtᵀ],[QtKiᵀ, QtKtᵀ]] /√dh", "Rows are query modality; columns are key modality. Block meanings are explicit to avoid ambiguous I2T naming."),
      n("softmax", "One softmax per joint row", 2, 1, "joint scores", "joint attention probabilities", "A = softmax(S, over all image+text keys)", "Four independent block softmaxes would implement a different operation.", { cost: "Joint dense attention O(B h (Ni+Nt)² dh). Selected attention-map extraction can reduce retained diagnostics, not the underlying dense operator." }),
      n("outimage", "Image-query output", 3, 0, "image rows of A; Vi,Vt", "[B,h,Ni,dh]", "Oi = Aii Vi + Ait Vt", "Image queries aggregate information from both image and text values."),
      n("outtext", "Text-query output", 3, 2, "text rows of A; Vi,Vt", "[B,h,Nt,dh]", "Ot = Ati Vi + Att Vt", "Text queries aggregate image and text values; text output can be omitted in a context-pre-only final block."),
    ], [e("image", "scores", "Qi / Ki"), e("text", "scores", "Qt / Kt"), e("scores", "softmax", "S"), e("softmax", "outimage", "image-query rows"), e("softmax", "outtext", "text-query rows"), e("image", "outimage", "Vi"), e("text", "outimage", "Vt"), e("image", "outtext", "Vi"), e("text", "outtext", "Vt")]),
    v("injection", "Q/K intervention", "Preserve source geometry, keep target values", "Replacing image queries and keys affects three score blocks, while target text-to-text scores remain target-defined.", [
      n("src", "Source image Q / K", 0, 0, "source forward state", "Qi,src / Ki,src", "capture selected layer/timestep projections", "The source and target branches evolve synchronously."),
      n("target", "Target text and values", 0, 2, "target forward state", "Qt,tgt,Kt,tgt,Vi,tgt,Vt,tgt", "retain target projections / value tensors", "Replacing all Q/K modalities would constrain the edit differently."),
      n("matrix", "Edited score blocks", 1, 1, "source image Q/K + target text Q/K", "joint target scores", "S̃ = [[Qi,s Ki,sᵀ, Qi,s Kt,tᵀ],[Qt,t Ki,sᵀ, Qt,t Kt,tᵀ]]/√dh", "The image-image block is source-derived; both cross-modal blocks are mixed-source; text-text remains target-derived."),
      n("values", "Target value aggregation", 2, 1, "softmax(S̃), target Vi/Vt", "edited attention output", "Õ = softmax(S̃) [Vi,tgt; Vt,tgt]", "The method changes attention routing while retaining target value content."),
      n("velocity", "Edited target vector field", 3, 1, "modified attention / rest of frozen network", "ṽtgt", "continue target Transformer forward", "Injection schedules and selected layers are experiment settings, not a universal constant."),
    ], [e("src", "matrix", "image Q/K"), e("target", "matrix", "text Q/K"), e("matrix", "values", "joint probabilities"), e("target", "values", "target V"), e("values", "velocity", "attention output")]),
    v("blending", "Local blending", "Restrict edits in latent space", "Text-conditioned attention maps define a spatial edit mask, then source latents restore the exterior.", [
      n("maps", "Selected text/image maps", 0, 1, "source attention + selected edit tokens", "spatial relevance maps", "aggregate selected heads / layers / token maps", "Only selected diagnostic maps need be retained for this operation."),
      n("mask", "Smooth and threshold", 1, 1, "relevance maps", "edit mask M", "smooth → normalize → threshold →resize to latent grid", "Zero-maximum normalization needs a defined empty-map behavior; the article identifies this failure mode."),
      n("source", "Source solver latent", 2, 0, "source branch velocity", "Zsrcₜ₋Δ", "advance frozen source trajectory", "Source state supplies the preserved exterior."),
      n("target", "Edited target solver latent", 2, 2, "Q/K-modified target velocity", "Z̃tgtₜ₋Δ", "advance target trajectory", "The target branch proposes the edit before projection."),
      n("project", "Mask projection", 3, 1, "M,Zsrc,Z̃tgt", "Ztgtₜ₋Δ", "Ztgt = M⊙Z̃tgt +(1−M)⊙Zsrc", "This is a post-solver latent intervention, distinct from attention injection."),
    ], [e("maps", "mask", "relevance"), e("mask", "project", "M", "metadata"), e("source", "project", "preserved exterior"), e("target", "project", "edited interior")]),
    v("variants", "Generator variants", "Shared editing interface, distinct generators", "SD3/SD3.5 and Flux.1 expose multimodal projections but have different block schedules and conditioning.", [
      n("sd3", "SD3 / SD3.5 family", 0, 0, "text + latent + time", "joint image/text features", "dual-stream MM-DiT blocks", "Image and text streams use separate modulation/projection paths, coupled by joint attention.", { references: [0, 2] }),
      n("flux", "Flux.1 family", 0, 2, "text + packed latent + time/guidance", "double-stream then single-stream states", "dual-stream blocks →concatenated single-stream blocks", "Do not reuse SD3.5's38-layer configuration as a Flux fact.", { references: [0, 3] }),
      n("hooks", "Model-specific attention hooks", 1, 1, "generator-specific Q/K tensors", "source image Q/K for target injection", "map the intervention to each model's token slices", "The editing mechanism must respect each model's image/text packing and projection layout.", { references: [0, 1] }),
      n("schedule", "Frozen reverse-time trajectories", 2, 1, "intervened source / target forwards", "edited terminal latent", "generator-specific scheduler + shared-noise coupling", "Few-step variants are not assumed to share the exact pretraining/distillation recipe of their parent.", { references: [0, 1] }),
    ], [e("sd3", "hooks", "SD3-family hooks"), e("flux", "hooks", "Flux hooks"), e("hooks", "schedule", "edited field")]),
  ],
};

const sd35: ModelArchitecture = {
  id: "sd-3-5-large", title: "Stable Diffusion 3.5 Large", family: "Image generation · MM-DiT", article: mmArticle, folder,
  description: "Three text encoders condition38 multimodal Transformer blocks operating on16-channel image latents.",
  scope: "The article's SD3.5 Large configuration:38 blocks,38 heads,dh=64,D=2432. Example1024² image:128² latent,2² latent patches,4096 image tokens. Default conditioning example uses77 CLIP positions +256 T5 positions; T5 length is configurable, so333 text tokens is an example rather than a universal invariant.",
  sources: [
    { label: "SD3.5 Large model repository", href: "https://huggingface.co/stabilityai/stable-diffusion-3.5-large", note: "Generator configuration and released pipeline artifacts cited by the article." },
    { label: "Diffusers SD3 Transformer", href: "https://github.com/huggingface/diffusers/blob/main/src/diffusers/models/transformers/transformer_sd3.py", note: "JointTransformerBlock, modulation, Q/K normalization and final patch projection." },
    { label: "Diffusers SD3 pipeline", href: "https://github.com/huggingface/diffusers/blob/main/src/diffusers/pipelines/stable_diffusion_3/pipeline_stable_diffusion_3.py", note: "CLIP/T5 conditioning assembly, latent scaling and scheduler integration." },
  ], views: [
    v("model", "Model", "Text-conditioned latent image generation", "A learned velocity field repeatedly transforms a noisy latent before VAE decoding.", [
      n("text", "Three text encoders", 0, 0, "prompt", "joint tokens / pooled CLIP condition", "CLIP-L +CLIP-G +T5-XXL", "The image-generator Transformer is distinct from these pretrained text encoders.", { nextView: "conditioning" }),
      n("noise", "16-channel Gaussian latent", 0, 2, "random seed / image size", "[B,16,H/8,W/8]", "z ∼ N(0,I)", "1024² output uses a128×128 latent grid in the article's example."),
      n("patch", "2×2 latent patches", 1, 2, "[B,16,128,128] example", "[B,4096,2432] image tokens", "patch64 values →D=2432", "16 channels ×2×2 values per latent patch.", { evidence: "derived" }),
      n("time", "Time + pooled condition", 1, 0, "timestep / pooled2048-D CLIP vector", "modulation vector", "time embedding + pooled-text projection", "Time modulation and token-level text attention provide different conditioning channels."),
      n("stack", "38 joint Transformer blocks", 2, 1, "image tokens / text tokens / condition", "updated image/text states", "38 heads ×64 =2432 hidden width", "The article's Large configuration uses Q/K RMSNorm and no extra dual-attention layers.", { nextView: "block" }),
      n("velocity", "Final norm / unpatchify", 3, 1, "[B,4096,2432]", "[B,16,128,128] velocity", "adaptive final norm →64 values per patch →unpatchify", "The output has the same latent shape as the noisy state, not a vocabulary axis."),
      n("solver", "Scheduler / guidance loop", 4, 1, "velocity + current latent", "updated latent", "flow scheduler update; repeat until terminal time", "The pipeline's sigma/time transformations define the actual numerical schedule.", { nextView: "sampling" }),
      n("vae", "VAE decode", 5, 1, "terminal latent", "RGB image", "undo latent shift/scale →VAE.decode", "Use the checkpoint's latent normalization parameters; do not assume another VAE's scaling constant."),
    ], [e("text", "time", "pooled condition"), e("noise", "patch", "latent grid"), e("text", "stack", "token conditioning"), e("time", "stack", "modulation"), e("patch", "stack", "image tokens"), e("stack", "velocity", "final image state"), e("velocity", "solver", "latent field"), e("solver", "stack", "next noisy state", "metadata"), e("solver", "vae", "terminal latent")]),
    v("conditioning", "Text encoders", "CLIP and T5 conditioning assembly", "CLIP features are concatenated by channel; T5 features are appended by token position.", [
      n("clip-l", "CLIP-L text encoder", 0, 0, "[B,77] IDs", "[B,77,768] + pooled[B,768]", "12 layers;12 heads; FFN3072; QuickGELU", "The pipeline uses token hidden states and the projected pooled vector through different paths."),
      n("clip-g", "CLIP-G text encoder", 0, 2, "[B,77] IDs", "[B,77,1280] + pooled[B,1280]", "32 layers;20 heads; FFN5120; GELU", "CLIP encoders use causal text attention, unlike the T5 encoder."),
      n("clip", "CLIP feature concatenation", 1, 1, "two77-position hidden-state streams", "[B,77,2048]; pooled[B,2048]", "concat CLIP-L/G on feature axis; pad token features to4096", "768+1280=2048. The pooled vector is not padded into a text-token sequence.", { evidence: "derived" }),
      n("t5", "T5-XXL encoder", 2, 0, "[B,Lt5] IDs", "[B,Lt5,4096]", "24 layers;64 heads; FFN10240; relative-position bias", "Lt5=256 in the article's example. The encoder is bidirectional and differs from CLIP's causal mask."),
      n("join", "Append text-token streams", 3, 1, "padded CLIP + T5 hidden states", "[B,77+Lt5,4096]", "C = concat(CLIPpadded,T5, token axis)", "For Lt5=256 there are333 joint text positions.", { evidence: "derived" }),
      n("project", "MM-DiT text projection", 4, 1, "[B,77+Lt5,4096]", "[B,77+Lt5,2432]", "context_embedder:4096→2432", "This projected stream joins image tokens only inside attention; the pooled vector modulates the blocks separately."),
    ], [e("clip-l", "clip", "CLIP-L features"), e("clip-g", "clip", "CLIP-G features"), e("clip", "join", "padded CLIP tokens"), e("t5", "join", "T5 tokens"), e("join", "project", "joint context")]),
    v("block", "MM-DiT block", "Dual streams coupled by joint attention", "Separate modulation and FFNs preserve image/text paths around shared attention.", [
      n("image", "Image stream", 0, 0, "[B,Ni,2432]", "modulated image states", "adaptive normalization from time/pooled condition", "Ni=4096 in the1024² example."),
      n("text", "Text stream", 0, 2, "[B,Nt,2432]", "modulated text states", "separate adaptive normalization", "The final context-pre-only block can omit context output updates."),
      n("qkv", "Separate Q/K/V projections", 1, 1, "image / text states", "[B,38,Ni+Nt,64] Q,K,V", "project each modality; Q/K RMSNorm; concatenate tokens", "Q/K normalization acts per head and differs from residual-stream LayerNorm."),
      n("attn", "Joint non-causal attention", 2, 1, "joint Q,K,V", "joint image/text attention output", "softmax(QKᵀ/8)V", "All image and text keys share one row-wise softmax. No autoregressive image mask is used.", { cost: "Dense attention score count per head: (Ni+Nt)². At Ni4096,Nt333:4429²=19616041 entries if materialized." }),
      n("imageffn", "Image residual + FFN", 3, 0, "image attention slice / residual", "[B,Ni,2432]", "gated attention residual →modulated FFN9728 →residual", "Image and text feed-forward parameters are separate."),
      n("textffn", "Text residual + FFN", 3, 2, "text attention slice / residual", "[B,Nt,2432]", "text-specific residual and feed-forward update", "Context-pre-only final-block behavior follows the implementation rather than an unconditional text FFN claim."),
    ], [e("image", "qkv", "image projections"), e("text", "qkv", "text projections"), e("qkv", "attn", "normalized Q/K + V"), e("attn", "imageffn", "image output slice"), e("attn", "textffn", "text output slice"), e("image", "imageffn", "image residual"), e("text", "textffn", "text residual")]),
    v("sampling", "Sampling", "Guidance, scheduler and VAE decode", "Inference iterates the velocity field with frozen parameters.", [
      n("condition", "Positive / negative conditioning", 0, 0, "prompts", "conditioning batches", "encode text; optional classifier-free guidance", "Guidance configuration belongs to the pipeline and can change field evaluation count."),
      n("state", "Current latent / sigma", 0, 2, "zₖ / σₖ", "model input latent / timestep", "scheduler prepares the current step", "The exact sigma-to-timestep mapping comes from the selected scheduler."),
      n("field", "SD3.5 field forward", 1, 1, "latent,t,conditioning", "predicted latent velocity", "MM-DiT₃₈ forward", "Text encodings can be computed once and reused across all solver steps.", { nextView: "model" }),
      n("guidance", "Combine guided predictions", 2, 1, "positive / negative predictions", "guided velocity", "vguide = vuncond + g(vcond−vuncond)", "This formula describes classifier-free guidance when enabled, not a universal required branch.", { evidence: "derived" }),
      n("step", "Flow scheduler update", 3, 1, "guided velocity / latent / sigmas", "zₖ₊₁", "Euler example: zₖ₊₁=zₖ+(σₖ₊₁−σₖ)vguide", "The sign follows the scheduler's descending sigma sequence.", { cost: "Total runtime depends on network evaluations, guidance batching and numerical steps; it is not inferred from38 layers alone." }),
      n("decode", "Latent normalization / VAE", 4, 1, "terminal latent", "RGB image", "zvae=z/scale+shift; image=VAE.decode(zvae)", "Scale/shift are checkpoint configuration, distinct from solver sigma values."),
    ], [e("condition", "field", "text / pooled conditions"), e("state", "field", "latent / timestep"), e("field", "guidance", "predictions"), e("guidance", "step", "guided velocity"), e("step", "state", "next z / sigma", "metadata"), e("step", "decode", "terminal state")]),
  ],
};

export const transportArchitectures: readonly ModelArchitecture[] = [transport("fm"), transport("rf"), transport("si"), mmdit, sd35];
