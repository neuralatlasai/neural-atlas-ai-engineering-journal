import { node as n, edge as e, view as v, type ModelArchitecture, type ArchitectureView } from "./schema";

const deepseekFolder = ["models", "autoregressive-language-model", "deepseek"];
const proConfig = "https://huggingface.co/deepseek-ai/DeepSeek-V4-Pro/blob/b5968e9190ef611bbf34a7229255be88a0e937c1/config.json";
const flashConfig = "https://huggingface.co/deepseek-ai/DeepSeek-V4.1-Flash/blob/2cba9e42aa026125f3ed06c6d98c1db82f7ca027/config.json";
const glmConfig = "https://huggingface.co/zai-org/GLM-5.2/blob/cf457fa734ab149ffef225f80893eb38c6ff5cdc/config.json";
const code = { evidence: "code" as const, references: [1, 2] };

/** These shared operators have checkpoint-specific dimensions, routing and references. */
function moe(width: number, intermediate: number, experts: number, active: number, scoring: string, hash: boolean, scale = 2.5): ArchitectureView {
  const h = `[B,T,${width}]`;
  return v("moe", "Experts", "Sparse expert routing", "Selection, expert computation and mixture weights are separate operations.", [
    n("hidden", "Normalized state", 0, 1, h, h, "u = RMSNorm(h)", "One token state enters the router and shared expert.", code),
    n("router", "Router scores", 1, 0, h, `[B,T,${experts}]`, `s = ${scoring}(u Wᵣ)`, width === 5120 ? "Text and image tokens use separate load-correction biases for selection; uncorrected scores determine mixture weights." : "Correction biases affect selection; mixture weights use the uncorrected scores.", { ...code, cost: `Router projection: O(B T ${width} ${experts}).` }),
    n("shared", "Shared expert", 1, 2, h, h, `SwiGLU: ${width} → ${intermediate} → ${width}`, "The shared expert is evaluated for every token.", code),
    n("select", `Top-${active} of ${experts}`, 2, 0, `[B,T,${experts}]`, `[B,T,${active}] expert IDs`, hash ? "Layers 0–2: token-ID table; later: TopK(s + b)" : `I = TopK(s + b); w = ${scale} s[I] / Σ s[I]`, hash ? "The first three layers use hash-selected IDs, while their mixture weights still depend on the current hidden state." : `Selection uses corrected ${scoring} scores; selected mixture weights are normalized and scaled by ${scale}.`, code),
    n("experts", `${active} routed experts`, 3, 0, h, `[B,T,${active},${width}]`, "Expertᵢ(u) = Wdownᵢ(SiLU(Wgateᵢ u) ⊙ Wupᵢ u)", "Only the selected experts execute for a token. Dispatch/scatter is logical; production communication topology is outside this graph.", { ...code, cost: `Selected expert matrix work: O(B T ${active} ${width} ${intermediate}); three dense matrices per expert.` }),
    n("combine", "Weighted mixture", 4, 1, `routed outputs + shared output`, h, "y = shared(u) + Σᵢ wᵢ Expertᵢ(u)", "Scatter the weighted expert outputs back into token order; the residual connection belongs to the enclosing block.", code),
  ], [e("hidden", "router", "router input"), e("hidden", "shared", "shared input"), e("router", "select", "scores"), e("select", "experts", "dispatch IDs"), e("hidden", "experts", "token states"), e("experts", "combine", "weighted outputs"), e("shared", "combine", "shared output")]);
}

function mhc(width: number, singlePass = false): ArchitectureView {
  return v("mhc", "Residuals", singlePass ? "Single-pass manifold hyper-connections" : "Manifold-constrained hyper-connections", "Four residual streams are transported around each attention or expert sublayer.", [
    n("streams", "Four residual streams", 0, 1, `[B,T,4,${width}]`, `[B,T,4,${width}]`, "X ∈ ℝᴮˣᵀˣ⁴ˣᴰ", "Expansion factor four is distinct from attention head count.", code),
    n("gates", "State-dependent maps", 1, 0, `[B,T,4,${width}]`, "A:[B,T,1,4]; C:[B,T,4,1]", "A = sigmoid(a); C = 2 sigmoid(c)", "Bounded pre-aggregation and post-injection gates are conditioned on normalized stream state.", code),
    n("sinkhorn", "Residual transport", 1, 2, "residual-map logits [B,T,4,4]", "R [B,T,4,4]", "R = Sinkhorn₂₀(exp(logits))", "Twenty alternating normalizations approximate a doubly stochastic matrix; finite iteration and finite precision do not guarantee exact unit sums.", code),
    ...(singlePass ? [n("previous", "Previous input-mixing map", 1, 1, "map carried from block l−1", "Aₗ₋₁ [B,T,1,4]", "Aₗ₋₁ is available before current stream traversal", "The current block's map prediction prepares Aₗ for the next block. Current input aggregation instead consumes Aₗ₋₁.", { references: [0, 2] })] : []),
    n("aggregate", "Aggregate to one state", 2, 0, singlePass ? "previous Aₗ₋₁ and current Xₗ" : "A and X", `[B,T,${width}]`, singlePass ? "uₗ = Aₗ₋₁ Xₗ" : "u = A X", singlePass ? "Single-pass mHC uses the previous block's input-mixing coefficients, which already exist when the current streams are traversed." : "The learned sublayer operates on one D-wide state, not four independent D-wide sublayers.", code),
    n("sublayer", "Attention or MoE", 3, 0, `[B,T,${width}]`, `[B,T,${width}]`, "y = F(RMSNorm(u))", "Attention and experts use their own enclosing hyper-connection operations.", code),
    n("inject", "Transport and inject", 4, 1, `R, X, C, y`, `[B,T,4,${width}]`, singlePass ? "Xₗ₊₁ = Rₗ Xₗ + Cₗ Fₗ(Aₗ₋₁ Xₗ)" : "X⁺ = R X + C y", singlePass ? "Input mixing is shifted one block backward; transport and output injection use the current maps. This changed dependency enables a single traversal." : "Residual transport and the sublayer result meet here; this is not an ordinary h + F(h) residual.", { ...code, cost: singlePass ? "Reported activation traffic: (2n+2)D for n=4 streams, versus (4n+4)D in the earlier implementation; this is a traffic model, not measured latency." : "Mixing work O(B T 4² D); the sublayer remains the dominant matrix computation." }),
  ], [e("streams", "gates", "stream state"), e("streams", "sinkhorn", "map logits"), e("streams", "aggregate", "X"), e(singlePass ? "previous" : "gates", "aggregate", singlePass ? "A from block l−1" : "A"), e("aggregate", "sublayer", "u"), e("sinkhorn", "inject", "R"), e("streams", "inject", "residual X"), e("gates", "inject", "C"), e("sublayer", "inject", "y")]);
}

const deepseekPro: ModelArchitecture = {
  id: "deepseek-v4-pro", title: "DeepSeek V4 Pro", family: "Language · sparse MoE", article: "docs/Models/autoregressive_language_model/deepseek/deepseek-v4-pro.md", folder: deepseekFolder,
  description: "61 decoder blocks, compressed sparse attention, four residual streams and six routed experts per token.",
  scope: "Checkpoint-specific V4 Pro reconstruction. B=batch, T=sequence length, D=7168. Reported scale and derived costs are distinguished from executable configuration. No benchmark or production kernel is reproduced here.",
  sources: [
    { label: "DeepSeek V4 technical report", href: "https://arxiv.org/abs/2606.19348", note: "Architecture report cited by the article; use the checkpoint for exact configuration." },
    { label: "V4 Pro configuration · b5968e9", href: proConfig, note: "Pinned release configuration; inspected 2026-10-07." },
    { label: "Released inference implementation", href: "https://huggingface.co/deepseek-ai/DeepSeek-V4-Pro/blob/b5968e9190ef611bbf34a7229255be88a0e937c1/inference/model.py", note: "Reference implementation, not a specification of the deployed serving cluster." },
  ], views: [
    v("model", "Model", "The V4 Pro forward graph", "A decoder-only model with a hybrid attention schedule and expanded residual stream.", [
      n("ids", "Text token IDs", 0, 0, "text", "[B,T]", "IDs = tokenizer(text)", "Vocabulary has 129280 entries.", code),
      n("embedding", "Token embedding", 1, 0, "[B,T]", "[B,T,7168]", "h₀ = E[IDs]", "Input embeddings and output head are untied.", code),
      n("expand", "Expand residual stream", 2, 1, "[B,T,7168]", "[B,T,4,7168]", "X₀ = repeat(h₀, 4)", "Four streams participate in mHC transport and injection.", { ...code, nextView: "mhc" }),
      n("attention", "Hybrid attention", 3, 0, "[B,T,4,7168]", "[B,T,4,7168]", "mHC(CSA / HCA / local attention)", "Compression ratios: first two blocks 128; then alternating 4 and 128; final block ratio 0 uses only the local window.", { ...code, nextView: "attention" }),
      n("experts", "Sparse MoE", 3, 2, "attention state", "[B,T,4,7168]", "mHC(MoE₆₊₁)", "Each block has 384 routed experts and one shared expert; six routed experts execute per token.", { ...code, nextView: "moe" }),
      n("stack", "Repeat × 61 blocks", 4, 1, "[B,T,4,7168]", "[B,T,4,7168]", "Xₗ₊₁ = Blockₗ(Xₗ), l=0…60", "Attention precedes MoE in each block; the side-by-side sublayer cards above indicate the block's constituents.", code),
      n("head", "Collapse, norm, LM head", 5, 1, "[B,T,4,7168]", "[B,T,129280]", "logits = Whead RMSNorm(HCHead(X₆₁))", "The final learned collapse restores D-wide states before vocabulary projection.", { ...code, nextView: "inference" }),
    ], [e("ids", "embedding", "IDs"), e("embedding", "expand", "h₀"), e("expand", "attention", "block input"), e("attention", "experts", "sublayer state"), e("experts", "stack", "block output"), e("stack", "head", "final streams")]),
    v("attention", "Attention", "Shared KV, CSA and HCA", "A 512-wide vector serves as both key and value; compression controls global history length.", [
      n("state", "Normalized sublayer input", 0, 1, "[B,T,7168]", "[B,T,7168]", "u = RMSNorm(h)", "This view begins after mHC pre-aggregation.", code),
      n("query", "Low-rank query", 1, 0, "[B,T,7168]", "[B,T,128,512]", "7168 → 1536 → 128×512; RoPE on 64 dimensions", "Query projection is compressed first, expanded into 128 heads, then normalized/positioned.", code),
      n("kv", "Shared key / value", 1, 2, "[B,T,7168]", "[B,T,512]", "c = RMSNorm(u Wkv)", "A single shared KV head is used; do not substitute conventional separate K/V caches.", code),
      n("compression", "Global compressor", 2, 2, "[B,T,512]", "[B,⌊T/r⌋,512]", "r = 4 (CSA) or 128 (HCA)", "CSA uses overlapping weighted compression; HCA uses heavy block compression. Local-only final block has no global compressed bank.", code),
      n("index", "CSA sparse selection", 3, 0, "index Q/K, causal history", "≤1024 selected indices", "I = Top1024(index scores)", "CSA retrieves compressed entries. HCA reads its compressed history without this learned selector.", { ...code, cost: "CSA index search still depends on compressed context length; sparse main attention alone is not constant-cost prefill." }),
      n("local", "128-token local ring", 3, 2, "current shared KV", "[B,≤128,512]", "append cₜ; evict positions outside window", "Every layer retains its own local context.", { ...code, kind: "kv-state" }),
      n("attend", "Attention with sink", 4, 1, "Q + selected global + local KV", "[B,T,128,512]", "O = softmax([Q Cᵀ/√512, sink]) C", "The learned sink contributes to normalization but has no value vector; cached-entry weights need not sum to one.", code),
      n("output", "Grouped output projection", 5, 1, "[B,T,128,512]", "[B,T,7168]", "16 groups → 1024 per group → 7168", "The output projection is grouped and low-rank, not a single standard dense head merge.", code),
    ], [e("state", "query", "query input"), e("state", "kv", "KV input"), e("kv", "compression", "global candidates"), e("query", "index", "index query"), e("compression", "index", "compressed keys"), e("kv", "local", "local KV", "kv-state"), e("query", "attend", "main Q"), e("index", "attend", "selected global KV"), e("local", "attend", "local KV", "kv-state"), e("attend", "output", "head outputs")]),
    moe(7168, 3072, 384, 6, "sqrtsoftplus", true), mhc(7168),
    v("inference", "Generation", "Prefill, cached decode and MTP", "Prompt processing and one-token decode share weights but consume different state.", [
      n("prompt", "Prompt prefill", 0, 1, "[B,T] IDs", "per-layer local / global state", "forward all prompt positions with causal visibility", "Compressed caches and compressor state are initialized per layer.", { ...code, nextView: "attention" }),
      n("cache", "Cache banks", 1, 2, "prefill state", "local ring + compressed history", "store local KV; append compressed entries", "Quantization scales, workspaces and allocator overhead are separate from architectural payload.", { ...code, kind: "kv-state" }),
      n("decode", "Decode one new token", 2, 1, "[B,1] + cache", "[B,1,129280] logits", "logitsₜ = model(tokenₜ, cacheₜ₋₁)", "The new position attends only to causally available state.", code),
      n("mtp", "One MTP prediction layer", 3, 0, "backbone state + token embedding", "draft token logits", "predict additional future-token candidate", "The checkpoint supplies one parameterized MTP layer; deployed speculation length and acceptance rate are not inferred from that count.", code),
      n("sample", "Verify / choose token", 4, 1, "target logits + optional drafts", "[B,1] token ID", "sample target distribution; verify speculative candidates", "Exact serving verification policy is implementation-dependent. Sampling is not part of pretraining backpropagation."),
    ], [e("prompt", "cache", "persist state", "kv-state"), e("cache", "decode", "read / append", "kv-state"), e("decode", "mtp", "target state"), e("decode", "sample", "target logits"), e("mtp", "sample", "draft candidates"), e("sample", "decode", "next ID", "metadata")]),
    v("training", "Training", "Autoregressive training and precision", "The report's optimizer and checkpoint precision have different roles.", [
      n("batch", "Shifted text batch", 0, 1, "token sequence [B,T+1]", "inputs / next-token targets", "x = IDs[:,:-1]; y = IDs[:,1:]", "Teacher forcing aligns each prediction with the next token."),
      n("forward", "61-block forward", 1, 1, "[B,T]", "[B,T,129280]", "Z = model(x; θ)", "The training forward uses causal attention; persistent serving caches are a separate runtime mechanism.", { ...code, nextView: "model" }),
      n("loss", "Language + MTP losses", 2, 1, "logits / labels", "scalar objective", "L = CE(Z,y) + auxiliary MTP objective", "Loss coefficients and all reproduction settings must come from the report; they are not guessed here."),
      n("muon", "Muon matrix updates", 3, 0, "matrix gradients / momentum", "updated matrix parameters", "momentum → orthogonalization → scaled update", "Most model matrices use the reported Muon optimizer."),
      n("adam", "AdamW parameter group", 3, 2, "other parameter gradients", "updated embeddings / norms / gates", "AdamW update with separate parameter grouping", "Embeddings, heads, RMSNorm and static mHC biases/gates retain AdamW."),
      n("precision", "Quantization-aware training", 4, 1, "weights / index activations", "quantized inference artifact", "routed experts: FP4; most other weights: FP8", "Storage dtype is configuration-verified. It does not establish that every training tensor or optimizer state used that dtype.", code),
    ], [e("batch", "forward", "input IDs"), e("forward", "loss", "logits"), e("batch", "loss", "labels"), e("loss", "muon", "matrix gradients", "gradient"), e("loss", "adam", "other gradients", "gradient"), e("muon", "precision", "trained matrices"), e("adam", "precision", "trained parameters")]),
  ],
};

const deepseekFlash: ModelArchitecture = {
  id: "deepseek-v4-1-flash", title: "DeepSeek V4.1 Flash", family: "Multimodal · causal encoder–decoder", article: "docs/Models/autoregressive_language_model/deepseek/DeepSeek-V4.1-Flash.md", folder: deepseekFolder,
  description: "Trace the asymmetric 20+20-layer backbone, CSA2 reuse, native vision, Engram memory and DSpark drafts.",
  scope: "V4.1 Flash has a causal encoder followed by a decoder. Its decoder global KV is projected from the final encoder state; this is not a conventional bidirectional encoder plus cross-attention. B=batch, T=tokens, D=5120; N=prompt length, w=replay suffix.",
  sources: [
    { label: "Official V4.1 Flash release / report", href: "https://www.deepseek.com/en/news/deepseek-v4-1-flash/", note: "Official paper and model links; source article supplies the detailed report reconstruction." },
    { label: "V4.1 Flash configuration · 2cba9e4", href: flashConfig, note: "Pinned public configuration; inspected 2026-10-07." },
    { label: "Official V4.1 Flash model card", href: "https://huggingface.co/deepseek-ai/DeepSeek-V4.1-Flash", note: "Backbone, native vision, conditional memory and serving mechanism evidence." },
  ], views: [
    v("model", "Model", "The asymmetric multimodal backbone", "Text and visual embeddings meet before a 20-layer causal encoder and 20-layer decoder.", [
      n("text", "Text embeddings", 0, 0, "text → IDs", "[B,Ttext,5120]", "Et = Embedding(IDs)", "The language path preserves token order.", code),
      n("vision", "Native visual embeddings", 0, 2, "images", "[B,Tvision,5120]", "ViT → 3×3 unshuffle → projector", "Vision embeddings enter the same causal sequence as text.", { ...code, nextView: "vision" }),
      n("join", "Interleaved sequence", 1, 1, "Et / Ev + positions", "[B,T,5120]", "h₀ = interleave(Et,Ev)", "Multimodal placement follows the processor's token sequence.", code),
      n("encoder", "20-layer causal encoder", 2, 1, "[B,T,5120]", "H₂₀ [B,T,5120]", "SWA ×2; CSA2 ×18; MoE in every block", "Encoder attention is causal. Prompt tokens need their complete transformations through this lower half.", { ...code, nextView: "ced" }),
      n("engram", "Conditional Engram memory", 2, 0, "token n-grams / hidden state", "memory contribution", "deterministic n-gram addressing → gated memory", "The report places memory modules at zero-indexed backbone layers 1 and 14. Additional memory capacity is not an activated dense FFN."),
      n("decoder", "20-layer decoder", 3, 1, "H₂₀ + local decoder state", "[B,Tdecode,5120]", "decoder global KV ← H₂₀ projections", "Local SWA remains layer-specific; upper-layer global context is derived from the final encoder state.", { ...code, nextView: "attention" }),
      n("head", "Text vocabulary head", 4, 1, "decoder state", "text logits [B,Tdecode,V]", "logits = LMHead(final state)", "Native visual understanding still emits text tokens, not generated pixels.", { nextView: "inference" }),
    ], [e("text", "join", "text positions"), e("vision", "join", "visual positions"), e("join", "encoder", "causal input"), e("join", "engram", "n-grams"), e("engram", "encoder", "layer 1 / 14 memory"), e("encoder", "decoder", "H₂₀"), e("decoder", "head", "decoder output")]),
    v("ced", "Encoder / decoder", "Prefill and bounded replay", "Global context construction and layer-specific local context have different dependencies.", [
      n("prompt", "All prompt tokens", 0, 1, "[B,N]", "[B,N,5120]", "embed prompt", "N denotes the complete prompt length."),
      n("lower", "Run lower 20 layers", 1, 1, "[B,N,5120]", "H₂₀ [B,N,5120]", "H₂₀ = Encoder₂₀(prompt)", "Every prompt token passes through the causal encoder.", code),
      n("global", "Project decoder global KV", 2, 2, "H₂₀", "global KV / compression weights", "Cₗ = H₂₀ Wkv,ₗ; Zₗ = H₂₀ Wz,ₗ", "The upper layers do not need every prompt token's upper hidden state to construct global KV.", { ...code, kind: "kv-state" }),
      n("suffix", "Replay bounded suffix", 2, 0, "last w encoder outputs", "layer-specific local decoder KV", "run decoder on prompt suffix", "Replay reconstructs missing local SWA state. The replay window and dependency depth are separate from the global cache.", { kind: "kv-state" }),
      n("decode", "Full-depth generation", 3, 1, "new token + both cache types", "next-token logits", "lower encoder → upper decoder → head", "New generated tokens traverse the full backbone.", { nextView: "inference", cost: "Reported prefill layer work: O(20N + 20w), excluding per-layer attention, projection and expert costs." }),
    ], [e("prompt", "lower", "all N tokens"), e("lower", "global", "H₂₀ projections", "kv-state"), e("lower", "suffix", "last w tokens"), e("global", "decode", "global context", "kv-state"), e("suffix", "decode", "local context", "kv-state")]),
    v("attention", "CSA2", "Cross-layer KV and index reuse", "Full, Reindex and Reuse modes preserve separate main queries and local attention.", [
      n("full", "Full producer layer", 0, 1, "hidden state / H₂₀ for decoder KV", "global KV + index keys + indices", "KV=fKV(H); KI=fI(KV); I=TopK(QI KIᵀ)", "Encoder: three six-layer groups begin with Full. Decoder: the first four-layer group begins with Full."),
      n("kv", "Shared global KV bank", 1, 2, "producer KV / index keys", "reused KV / KI", "KVₗ = KVproducer; KIₗ = KIproducer", "Representation reuse is independent of index reuse. Main KV uses the reported FP4 format.", { kind: "kv-state" }),
      n("candidates", "Hierarchical candidates", 1, 0, "first decoder index scores", "≤16384 candidates", "2048 blocks ×8 positions; Top512 main entries", "The first decoder selector scans history; later Reindex layers search only the retained candidate set."),
      n("reindex", "Reindex layer", 2, 0, "fresh QI + reused KI + candidates", "fresh Top512 indices", "Iₗ = Top512(QIₗ KIproducerᵀ | candidates)", "Four subsequent decoder groups begin with Reindex; the global representation remains shared."),
      n("reuse", "Reuse layers", 2, 2, "global KV + prior index set", "same global selection", "Iₗ = Iprevious; KVₗ = KVproducer", "No new global KV or index search is required in these layers."),
      n("local", "Per-layer Q and SWA", 3, 0, "current layer state", "64×512 query; 128 local entries", "Qmain,ₗ = fQ(Hₗ); local KVₗ = fSWA(Hₗ)", "All three modes still compute their own main query and local SWA state.", code),
      n("attention", "Sparse + local attention", 4, 1, "Qmain + Top512 global + local", "[B,T,5120]", "attend to selected causal entries; project output", "Encoder compression ratio 2; decoder ratio 1. Main query count is 64, head width 512.", { ...code, cost: "Later decoder reindex search is bounded by 16384 candidates; the first selector still depends on history length." }),
    ], [e("full", "kv", "global state", "kv-state"), e("full", "candidates", "index scores"), e("candidates", "reindex", "candidate IDs"), e("kv", "reindex", "shared keys", "kv-state"), e("kv", "reuse", "shared KV", "kv-state"), e("reindex", "reuse", "fresh indices"), e("local", "attention", "Q / local KV"), e("reuse", "attention", "selected global KV", "kv-state")]),
    moe(5120, 2304, 384, 6, "sqrtsoftplus", false, 1.5), mhc(5120, true),
    v("vision", "Vision", "DeepSeek ViT to language embeddings", "A 3×3 spatial unshuffle reduces the visual sequence by a factor of nine.", [
      n("image", "Image / resolution handling", 0, 1, "RGB image", "[B,3,H,W]", "processor resize / normalize", "The article reports support up to approximately 1344×1344; runtime processor constraints govern actual shapes."),
      n("patch", "14×14 linear patches", 1, 1, "[B,3,H,W]", "[B,Nv,1024]", "Nv = (H/14)(W/14)", "The native ViT uses linear patch projection, not OCR-2's SAM tower.", code),
      n("tower", "32 ViT blocks", 2, 1, "[B,Nv,1024]", "[B,Nv,1024]", "RMSNorm + 2D RoPE + attention + SwiGLU", "16 attention heads; the architecture is distinct from the document encoder in the vision comparison.", code),
      n("unshuffle", "3×3 pixel unshuffle", 3, 1, "[B,H′,W′,1024]", "[B,H′/3,W′/3,9216]", "3×3 spatial neighborhood → channel concatenation", "Token count becomes Nv/9. Divisibility/alignment must be satisfied by the processor.", { ...code, evidence: "derived" }),
      n("project", "Language projector", 4, 1, "[B,Nv/9,9216]", "[B,Nv/9,5120]", "Ev = MLP(unshuffled features)", "Projected visual tokens join the language sequence; projector hidden widths are left symbolic when not established.", { nextView: "model" }),
    ], [e("image", "patch", "pixels"), e("patch", "tower", "patch tokens"), e("tower", "unshuffle", "spatial features"), e("unshuffle", "project", "compressed tokens")]),
    v("inference", "DSpark", "Confidence-adaptive speculative decoding", "The drafter predicts multiple positions; the target model verifies candidates.", [
      n("target", "Target backbone state", 0, 1, "current prefix + caches", "target state / logits", "full-depth target computation", "CED prefill and bounded replay establish the initial serving state.", { nextView: "ced" }),
      n("drafter", "Three-block DSpark", 1, 1, "backbone state / token context", "five-position base logits", "3 Transformer blocks; 128-token window", "A single draft pass proposes base logits for five future positions."),
      n("markov", "Markov token head", 2, 0, "draft base logits", "dependent candidate tokens", "condition proposals on draft-token dependencies", "The lightweight head models dependencies among the parallel positions."),
      n("confidence", "Confidence head", 2, 2, "draft hidden states", "conditional acceptance estimates pᵢ", "P(prefix survives m) ≈ ∏ᵢ₌₁ᵐ pᵢ", "The product is a survival estimate, not a measured acceptance guarantee.", { evidence: "derived" }),
      n("schedule", "Choose verification length", 3, 2, "confidence + measured engine profile", "verification length m", "maximize expected system token throughput", "The serving scheduler uses load-dependent runtime profiles; this page does not fabricate throughput measurements."),
      n("verify", "Target verification", 4, 1, "draft tokens + target distribution", "accepted prefix / corrected token", "verify selected candidate prefix", "Accepted IDs and cache updates feed the next generation cycle."),
    ], [e("target", "drafter", "backbone context"), e("drafter", "markov", "draft logits"), e("drafter", "confidence", "draft states"), e("confidence", "schedule", "survival estimates"), e("markov", "verify", "candidate sequence"), e("schedule", "verify", "m", "metadata"), e("target", "verify", "target distribution"), e("verify", "target", "next prefix", "metadata")]),
    v("training", "Training", "Backbone, vision and drafter training", "Training stages have distinct parameter updates and gradient boundaries.", [
      n("vision", "Vision pretraining", 0, 0, "image / text pairs", "initialized native ViT", "contrastive stage → autoregressive visual refinement", "The article reports two vision training stages; no unsupported batch or optimizer configuration is inserted."),
      n("backbone", "Multimodal pretraining", 1, 1, "text + visual embeddings", "backbone parameters", "causal LM objective; modality-specific expert balancing", "Text and visual token populations maintain separate load-correction biases.", { nextView: "moe" }),
      n("post", "Post-training", 2, 1, "instruction / reasoning / agent data", "post-trained policy", "supervised and RL / on-policy distillation stages", "The report's task synthesis, rollouts and training stages are distinct from one model forward."),
      n("freeze", "Drafter gradient boundary", 3, 0, "backbone states", "stop-gradient context", "sg(backbone states)", "DSpark is trained after backbone pretraining, rather than jointly from the start.", { kind: "gradient" }),
      n("draft", "DSpark optimization", 4, 0, "frozen context / target supervision", "drafter / Markov / confidence parameters", "update drafter; no DSpark gradient to backbone", "During post-training the drafter can continue aligning to the evolving target policy without backpropagating its objective into the backbone.", { nextView: "inference", kind: "gradient" }),
      n("qat", "Main-KV QAT", 4, 2, "512-wide global KV", "FP4 KV + scales", "E2M1 values; E4M3 scale per 16 channels", "Quantization reduces per-entry storage. Global-cache payload, SWA payload and persistent replay storage are distinct quantities."),
    ], [e("vision", "backbone", "visual initialization"), e("backbone", "post", "pretrained weights"), e("post", "freeze", "target state"), e("freeze", "draft", "detached features", "gradient"), e("backbone", "qat", "global KV path")]),
  ],
};

const glm: ModelArchitecture = {
  id: "glm-5-2", title: "GLM 5.2", family: "Language · MLA + DSA", article: "docs/Models/autoregressive_language_model/glm/GLM_5.2.md", folder: ["models", "autoregressive-language-model", "glm"],
  description: "78 blocks with latent KV, IndexShare, three dense FFNs, 75 sparse MoE blocks and shared-parameter MTP.",
  scope: "Exact dimensions refer to the pinned GLM-5.2 configuration. B=batch, T=tokens; D=6144. Index sharing reduces selector work, not the number of per-layer MLA caches. Training lineage is labeled separately from checkpoint facts.",
  sources: [
    { label: "Official GLM 5.2 release", href: "https://z.ai/blog/glm-5.2", note: "IndexShare, context extension and MTP release evidence." },
    { label: "GLM 5.2 configuration · cf457fa", href: glmConfig, note: "Pinned dimensions, layer types and indexer schedule; inspected 2026-10-07." },
    { label: "Transformers GLM-MoE-DSA implementation", href: "https://github.com/huggingface/transformers/blob/main/src/transformers/models/glm_moe_dsa/modeling_glm_moe_dsa.py", note: "MLA projection, sparse selector and router topology; this link tracks main." },
    { label: "GLM-5 technical report", href: "https://arxiv.org/abs/2602.15763", note: "Lineage evidence only; do not transfer unspecified training settings to 5.2." },
  ], views: [
    v("model", "Model", "Dense prefix, sparse backbone", "Each of the 78 blocks has MLA/DSA attention; FFN topology changes after block three.", [
      n("embed", "Token embeddings", 0, 1, "[B,T] IDs", "[B,T,6144]", "E[IDs]; V=154880", "The output projection is untied from the input table.", code),
      n("dense", "First 3 blocks", 1, 1, "[B,T,6144]", "[B,T,6144]", "pre-norm MLA/DSA + dense SwiGLU(12288)", "Zero-indexed blocks 0–2 use dense FFNs; they still have attention.", { ...code, nextView: "attention" }),
      n("sparse", "Next 75 blocks", 2, 1, "[B,T,6144]", "[B,T,6144]", "pre-norm MLA/DSA + sparse MoE", "256 routed experts, eight active, one shared; expert width 2048.", { ...code, nextView: "moe" }),
      n("indices", "IndexShare schedule", 2, 2, "full-layer index results", "reused index sets", "21 full indexers; 57 shared-index layers", "The exact indexer_types array establishes the schedule, not a uniform 'every fourth layer' guess at the prefix.", { ...code, nextView: "index", kind: "metadata" }),
      n("norm", "Final RMSNorm", 3, 1, "[B,T,6144]", "[B,T,6144]", "ε=10⁻⁵", "The residual width remains 6144 throughout the backbone.", code),
      n("logits", "Vocabulary logits", 4, 1, "[B,T,6144]", "[B,T,154880]", "Z = h Wheadᵀ", "Training uses next-token targets; generation reads the appropriate final position.", { ...code, nextView: "inference" }),
    ], [e("embed", "dense", "h₀"), e("dense", "sparse", "h₃"), e("indices", "sparse", "shared selections", "metadata"), e("sparse", "indices", "producer selections", "metadata"), e("sparse", "norm", "h₇₈"), e("norm", "logits", "normalized state")]),
    v("attention", "MLA", "Multi-head latent attention", "Query and KV low-rank paths use different ranks; RoPE occupies a separate 64-wide component.", [
      n("hidden", "Normalized state", 0, 1, "[B,T,6144]", "[B,T,6144]", "u = RMSNorm(h)", "Attention is a causal sublayer within an ordinary residual block.", code),
      n("query", "Query rank 2048", 1, 0, "[B,T,6144]", "[B,T,64,256]", "u → 2048 → 64×(192+64)", "192 non-positional and 64 rotary dimensions make the actual Q/K head width 256.", code),
      n("latent", "KV rank 512 + RoPE", 1, 2, "[B,T,6144]", "latent:[B,T,512]; rotary:[B,T,64]", "u → cKV ⊕ kRoPE", "The 512-wide latent and 64-wide position component are the ideal cache payload.", { ...code, kind: "kv-state" }),
      n("expand", "Logical K / V expansion", 2, 2, "latent + rotary component", "K:[B,T,64,256]; V:[B,T,64,256]", "Knope,V = up(cKV); K = concat(Knope,kRoPE)", "Absorbed inference kernels may avoid materializing expanded K/V. Logical tensors describe the computation, not required cache storage.", code),
      n("select", "Sparse causal indices", 2, 0, "indexer state / reused indices", "≤2048 positions per query", "I = DSA(u) or shared I", "The selector is distinct from the main 64-head attention.", { ...code, nextView: "index" }),
      n("attend", "Gather and attend", 3, 1, "Q + selected K/V", "[B,T,64,256]", "O = softmax(Q K[I]ᵀ / √256) V[I]", "All selected positions must be causally visible; short contexts contain fewer than 2048 positions.", { ...code, cost: "Main attention per query O(64 k 256), k≤2048, excluding indexer and projection work." }),
      n("project", "Output projection", 4, 1, "[B,T,64×256]", "[B,T,6144]", "merge heads → Wo", "The result returns to the residual width.", code),
    ], [e("hidden", "query", "Q path"), e("hidden", "latent", "KV path"), e("latent", "expand", "compressed latent"), e("hidden", "select", "indexer input"), e("query", "attend", "positioned Q"), e("expand", "attend", "logical K / V"), e("select", "attend", "gather IDs", "metadata"), e("attend", "project", "head outputs")]),
    v("index", "IndexShare", "Full indexers and consumer layers", "A lightweight 32-head selector provides positions reused by later layers.", [
      n("producer", "Full indexer layer", 0, 1, "current hidden / index-key history", "index scores", "32 index heads ×128 dimensions", "The configured indexer_types array contains 21 full layers and 57 consumers.", code),
      n("topk", "Top-2048 selection", 1, 1, "causally masked index scores", "I [B,T,≤2048]", "I = TopK(scores, 2048)", "Top-k is bounded by the available history length.", code),
      n("first", "Producer MLA", 2, 0, "I + producer-layer KV", "attention output", "Attentionₗ(Qₗ,KVₗ[I])", "This layer has its own latent KV state.", { ...code, nextView: "attention" }),
      n("consumer", "Shared-index MLA layers", 2, 2, "same I + each layer's KV", "consumer attention outputs", "Attentionⱼ(Qⱼ,KVⱼ[I])", "Reusing the index set does not share the main MLA values or eliminate per-layer KV storage.", code),
      n("next", "Next full producer", 3, 1, "later hidden state", "new index set", "recompute at next configured full layer", "Layers 0,1,2 are full; after that producers recur at 6,10,…,74.", { ...code, cost: "Index reuse reduces repeated selector work. Full selectors still scan history; total model cost is not O(1) in context length." }),
    ], [e("producer", "topk", "scores"), e("topk", "first", "I", "metadata"), e("topk", "consumer", "reuse I", "metadata"), e("first", "next", "updated hidden"), e("consumer", "next", "updated hidden")]),
    moe(6144, 2048, 256, 8, "sigmoid", false),
    v("inference", "Cache / MTP", "Latent-cache cost and speculation", "Memory accounting is explicitly tied to precision and excludes serving overhead.", [
      n("prefill", "Prompt prefill", 0, 1, "[B,T] IDs", "78 MLA caches + index state", "run causal backbone; initialize state", "Maximum configured context is 1048576 tokens.", code),
      n("cache", "576 values / token / layer", 1, 2, "512 latent +64 rotary", "[B,T,576] per layer", "ideal BF16 bytes = B T ×78×576×2", "At B=1 and T=2²⁰ this is 87.75 GiB, excluding index state, scales, workspaces and allocator overhead.", { ...code, evidence: "derived", cost: "Latent-cache memory grows linearly with context and layer count.", kind: "kv-state" }),
      n("decode", "Target next-token pass", 2, 1, "current ID + caches", "[B,1,154880]", "target logits and updated per-layer state", "Index sharing follows the checkpoint schedule during target computation.", { ...code, nextView: "model" }),
      n("mtp", "Shared MTP parameters", 3, 0, "target hidden / candidate embeddings", "draft logits", "one parameterized MTP layer, reused across iterations", "IndexShare/KVShare during MTP are reported release features; one parameterized layer does not imply one proposed token only."),
      n("verify", "Reject / accept drafts", 4, 1, "target / draft distributions", "verified next-token prefix", "target-policy rejection sampling", "Acceptance length depends on the distributions and serving policy; no fixed speedup is promised."),
    ], [e("prefill", "cache", "persist latent state", "kv-state"), e("cache", "decode", "read / append", "kv-state"), e("decode", "mtp", "target context"), e("mtp", "verify", "candidates"), e("decode", "verify", "target probabilities"), e("verify", "decode", "next prefix", "metadata")]),
    v("training", "Training", "Backbone and MTP objectives", "Checkpoint topology is exact; unspecified 5.2 training settings stay unspecified.", [
      n("tokens", "Teacher-forced batch", 0, 1, "text token stream", "shifted x / y [B,T]", "x=IDs[:-1]; y=IDs[1:]", "Causal next-token prediction is the language-model learning path."),
      n("forward", "GLM backbone", 1, 1, "[B,T]", "[B,T,154880]", "78 blocks → final norm → logits", "The three dense and 75 sparse blocks use the configured topology.", { ...code, nextView: "model" }),
      n("lm", "Language objective", 2, 0, "logits / labels", "scalar next-token loss", "Llm = −Σ log pθ(yₜ | x≤ₜ)", "This equation describes the standard autoregressive objective, not an undisclosed full recipe.", { evidence: "derived" }),
      n("mtp", "MTP / TV alignment", 2, 2, "target / draft distributions", "auxiliary loss", "TV(p,q) = ½ Σᵥ |pᵥ−qᵥ|", "The release reports TV-based draft alignment; exact coefficients and schedules require the versioned training source."),
      n("update", "Parameter optimization", 3, 1, "backbone / auxiliary gradients", "updated parameters", "θ ← OptimizerStep(θ,∇L)", "Complete target-version optimizer state, data mixture and batch schedule are not reconstructed from lineage alone.", { evidence: "undisclosed", kind: "gradient" }),
    ], [e("tokens", "forward", "inputs"), e("tokens", "lm", "labels"), e("forward", "lm", "target logits"), e("forward", "mtp", "target state"), e("lm", "update", "gradients", "gradient"), e("mtp", "update", "auxiliary gradients", "gradient")]),
  ],
};

export const languageArchitectures: readonly ModelArchitecture[] = [deepseekPro, deepseekFlash, glm];
