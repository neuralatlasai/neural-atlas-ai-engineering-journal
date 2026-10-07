import { node as n, edge as e, view as v, type ModelArchitecture } from "./schema";

const article = "docs/Models/Vision_model/Vision-Model Architecture Reconstruction.md";
const folder = ["models", "vision-model"];
const code = { evidence: "code" as const, references: [0] };

const ocr: ModelArchitecture = {
  id: "deepseek-ocr-2", title: "DeepSeek OCR 2 · DeepEncoder V2", family: "Vision · document encoding", article, folder,
  description: "SAM image features, stride-two compression and causal learned queries produce the document-token interface.",
  scope: "Image/document path from the article's pinned OCR-2 implementation. B=batch; N=compressed image-grid tokens. Learned queries read all image tokens and only preceding query positions. Video processing is not established by this checkpoint.",
  sources: [
    { label: "DeepEncoder V2 implementation", href: "https://huggingface.co/deepseek-ai/DeepSeek-OCR-2/blob/db8cee3a6b6a12ff7237046281a0523579ee74fa/deepencoderv2.py", note: "Article-pinned SAM, Qwen2-as-encoder, masks and learned queries." },
    { label: "OCR-2 processor / model", href: "https://huggingface.co/deepseek-ai/DeepSeek-OCR-2/blob/e6322a289fe5b5218278d276d4e7c58e8103f46a/modeling_deepseekocr2.py", note: "Article version lock; projector and image packing." },
    { label: "DeepSeek OCR 2 paper", href: "https://arxiv.org/abs/2601.20552", note: "Visual causal flow and document understanding." },
  ], views: [
    v("model", "Model", "Image crops to language-interface tokens", "The tower combines spatial image encoding and an ordered learned-query readout.", [
      n("image", "Local / global image views", 0, 1, "RGB image", "K×768² crops +1024² global view", "tile local views; pad global view; normalize to [−1,1]", "Local crop count depends on the processor's aspect-ratio selection.", { ...code, nextView: "patches" }),
      n("sam", "12-layer SAM tower", 1, 1, "[B,3,H,W]", "[B,H/16,W/16,768]", "16×16 patches → local / global ViT attention", "SAM uses spatial image features before query-based causal compression.", { ...code, nextView: "encoder" }),
      n("neck", "Neck + two stride-2 convs", 2, 1, "768-wide spatial states", "[B,H/64,W/64,896]", "768 →256 →512 →896; strides 1,2,2", "The spatial downsampling occurs before the causal-flow Transformer.", code),
      n("queries", "Append learned queries", 3, 1, "[B,N,896] image grid", "[B,2N,896] image + query sequence", "[image tokens; Qlearned]", "N=144 for a 768 view; N=256 for a 1024 view.", code),
      n("flow", "24 causal-flow layers", 4, 1, "[B,2N,896]", "query states [B,N,896]", "image block bidirectional; query block causal", "The output slice retains query positions rather than all image-grid tokens.", { ...code, nextView: "queries" }),
      n("project", "Project to 1280", 5, 1, "[B,N,896]", "[B,N,1280]", "Zinterface = Wp Zquery + bp", "The checkpoint's language interface is 1280-wide; do not substitute DeepSeek V4.1's 5120-wide native vision path.", { ...code, references: [1] }),
    ], [e("image", "sam", "normalized pixels"), e("sam", "neck", "spatial features"), e("neck", "queries", "compressed grid"), e("queries", "flow", "joint sequence"), e("flow", "project", "query slice")]),
    v("patches", "Image geometry", "Patch and compression geometry", "A 16×16 patch grid becomes a 64-pixel-stride token grid.", [
      n("local", "768×768 local view", 0, 0, "[B,3,768,768]", "48×48 patch grid", "768/16 = 48", "Each input crop is normalized and patch-embedded.", { ...code, evidence: "derived" }),
      n("global", "1024×1024 global view", 0, 2, "[B,3,1024,1024]", "64×64 patch grid", "1024/16 = 64", "The global view preserves a complete padded page view.", { ...code, evidence: "derived" }),
      n("convlocal", "Local compression", 1, 0, "48×48×768", "12×12×896", "48 →24 →12; N=144", "Two stride-two convolutions reduce the number of grid tokens sixteenfold.", { ...code, evidence: "derived" }),
      n("convglobal", "Global compression", 1, 2, "64×64×768", "16×16×896", "64 →32 →16; N=256", "Compression changes both channel width and spatial count.", { ...code, evidence: "derived" }),
      n("readout", "One query per grid token", 2, 1, "144 or 256 image-grid tokens", "144 or 256 output tokens", "append matching learned-query table", "There is no invented single CLS-token bottleneck.", code),
    ], [e("local", "convlocal", "local tower features"), e("global", "convglobal", "global tower features"), e("convlocal", "readout", "144 grid tokens"), e("convglobal", "readout", "256 grid tokens")]),
    v("encoder", "SAM layer", "Local windows and global mixing", "SAM's image Transformer precedes the decoder-derived causal-flow encoder.", [
      n("patch", "Conv2D patch embedding", 0, 1, "[B,3,H,W]", "[B,H/16,W/16,768]", "Conv2D(kernel=16,stride=16)", "Interpolated absolute positions accompany the image-grid representation.", code),
      n("norm", "LayerNorm", 1, 1, "768-wide grid", "768-wide normalized grid", "u = LN(x); ε=10⁻⁶", "This tower uses LayerNorm, not the downstream causal-flow RMSNorm.", code),
      n("attn", "12-head image attention", 2, 1, "u [B,N,768]", "[B,N,768]", "Q,K,V: 12×64; window size 14", "Zero-indexed layers 2,5,8,11 use global attention; other blocks use local windows.", code),
      n("residual", "Residual + GELU MLP", 3, 1, "attention output + x", "[B,N,768]", "u=x+Attn(LN(x)); y=u+MLP(LN(u))", "The MLP has width 3072, with GELU activation.", code),
      n("neck", "Spatial neck / compression", 4, 1, "final SAM grid", "896-wide compressed grid", "neck256 → stride2 conv512 → stride2 conv896", "Convolution geometry is shared across local and global views.", code),
    ], [e("patch", "norm", "grid + position"), e("norm", "attn", "normalized tokens"), e("attn", "residual", "attention output"), e("patch", "residual", "residual state"), e("residual", "neck", "after 12 blocks")]),
    v("queries", "Causal queries", "The visual causal-flow mask", "Image positions see all image positions; learned query positions read the image plus their own causal prefix.", [
      n("image", "Image-grid tokens", 0, 0, "compressed SAM features", "[B,N,896]", "token_type = 0", "Image positions attend bidirectionally within the image block.", code),
      n("query", "Learned query table", 0, 2, "N=144 or 256", "[B,N,896]", "token_type = 1", "The checkpoint has separate query tables for the two view sizes.", code),
      n("mask", "Block-structured mask", 1, 1, "image / query token types", "[B,1,2N,2N] mask", "M = [[0,−∞],[0,causal]]", "Rows are queries, columns are keys. Image tokens cannot read query tokens; query tokens can read all image tokens and only current/earlier queries.", code),
      n("gqa", "Qwen2-derived encoder", 2, 1, "[B,2N,896] + mask", "[B,2N,896]", "24 layers; Hq=14, Hkv=2, dh=64; F=4864", "RMSNorm, RoPE and SwiGLU operate with seven query heads per KV group.", code),
      n("slice", "Retain query positions", 3, 1, "[B,2N,896]", "[B,N,896]", "output = hidden[:,N:,:]", "The output is the ordered query readout of the image, not the raw SAM patch grid.", code),
    ], [e("image", "mask", "image block"), e("query", "mask", "query block"), e("mask", "gqa", "attention visibility", "metadata"), e("image", "gqa", "image sequence"), e("query", "gqa", "query sequence"), e("gqa", "slice", "all states")]),
  ],
};

/** These two towers share a broad operator family, but their patch, position and merger semantics differ. */
function denseVision(qwen: boolean): ModelArchitecture {
  const d = qwen ? 1152 : 1280, depth = qwen ? 27 : 32, patch = qwen ? 16 : 14,
    head = qwen ? 72 : 80, f = qwen ? 4304 : 5120, out = qwen ? 2048 : 6144;
  const title = qwen ? "Qwen 3.6 vision encoder" : "MiniMax M3 vision encoder";
  return {
    id: qwen ? "qwen-3-6-vision" : "minimax-m3-vision", title, family: "Vision · image and video encoding", article, folder,
    description: qwen ? "27-layer media-segment attention with temporal patchification, 2D RoPE and a 2×2 spatial merger." : "32-layer CLIP-style dense attention with 3D RoPE and a two-stage language projector.",
    scope: `The article reconstructs the visual tower and its language interface, not the full text backbone. B=batch; N=temporal-spatial patch tokens; D=${d}. Video can mix within a media segment; this is not an autoregressive video encoder. Training recipes are not inferred from the checkpoint.`,
    sources: [
      { label: `${title} configuration`, href: qwen ? "https://huggingface.co/Qwen/Qwen3.6-35B-A3B/blob/995ad96eacd98c81ed38be0c5b274b04031597b0/config.json" : "https://huggingface.co/MiniMaxAI/MiniMax-M3/blob/f0e1c1e04d40177e4673a22097036854f536e9c0/config.json", note: "Pinned public configuration, inspected 2026-10-07." },
      { label: "Visual modeling implementation", href: qwen ? "https://github.com/huggingface/transformers/blob/main/src/transformers/models/qwen3_5_moe/modeling_qwen3_5_moe.py" : "https://github.com/huggingface/transformers/blob/v5.14.0/src/transformers/models/minimax_m3_vl/modeling_minimax_m3_vl.py", note: qwen ? "Main-tracking implementation cited by the source article." : "Versioned implementation cited by the source article." },
      { label: "Image processor", href: qwen ? "https://github.com/huggingface/transformers/blob/main/src/transformers/models/qwen2_vl/image_processing_qwen2_vl.py" : "https://github.com/huggingface/transformers/blob/v5.14.0/src/transformers/models/minimax_m3_vl/image_processing_minimax_m3_vl.py", note: "Resize, temporal padding, normalization and patch order." },
    ], views: [
      v("model", "Model", `${title}: pixels to interface`, "The visual sequence is compressed before insertion into the language model.", [
        n("media", "Image / video processor", 0, 1, "RGB image or frames", "aligned normalized pixels", `resize to multiples of ${patch * 2}; pad temporal pairs`, "Frame sampling and processor defaults are separate from tower attention.", { ...code, references: [2], nextView: "patches" }),
        n("patch", `2×${patch}×${patch} patch embedding`, 1, 1, "[B,3,T′,H,W]", `[B,N,${d}]`, `Conv3D: 3×2×${patch}×${patch} → ${d}`, "Images use duplicated temporal frames when required by the processor.", code),
        n("position", qwen ? "Absolute + 2D rotary position" : "3D rotary position", 2, 1, `[B,N,${d}]`, `[B,N,${d}]`, qwen ? "interpolated grid positions + spatial Q/K RoPE" : "rotate Q/K on time, height and width axes", qwen ? "Spatial position construction is distinct from text-backbone multimodal RoPE." : "78 of each 80 head dimensions rotate: 26 per axis; two dimensions remain unrotated.", { ...code, references: [1] }),
        n("encoder", `${depth} visual Transformer layers`, 3, 1, `[B,N,${d}]`, `[B,N,${d}]`, `16-head attention; head=${head}; FFN=${f}`, "Attention does not reduce token count inside the stack.", { ...code, nextView: "encoder" }),
        n("merge", "2×2 spatial merger", 4, 1, `[B,N,${d}]`, `[B,N/4,${out}]`, qwen ? "LN → concat 4×1152 → MLP →2048" : "token MLP 1280→6144; concat 4×6144; MLP→6144", "Spatial merging divides the token count by four, while preserving the temporal-pair count.", { ...code, references: [1], nextView: "interface" }),
        n("interface", "Language-interface tokens", 5, 1, `[B,N/4,${out}]`, `[B,N/4,${out}]`, "replace corresponding visual token slots", "This endpoint is the visual interface. The language decoder is outside the reconstructed tower.", code),
      ], [e("media", "patch", "pixels"), e("patch", "position", "patch tokens"), e("position", "encoder", "positioned tokens"), e("encoder", "merge", "final grid"), e("merge", "interface", "visual embeddings")]),
      v("patches", "Patch geometry", "Temporal pairs and spatial ordering", "Token ordering places spatial neighbors together for the downstream merger.", [
        n("frames", "Supplied media frames", 0, 1, "Ts RGB frames", "T′ even frames", "T′ = Ts + ((−Ts) mod 2)", "The final frame is repeated when temporal-pair padding is required.", { ...code, references: [2] }),
        n("resize", "Aligned spatial resize", 1, 1, "T′×H₀×W₀ pixels", `T′×H×W; H,W divisible by ${2 * patch}`, "preserve aspect ratio under pixel bounds", qwen ? "Processor pixel budgets and frame sampling belong to the target checkpoint's processor configuration." : "Default image maximum is 672² pixels in the audited processor; video uses its own bounds.", { ...code, references: [2] }),
        n("patch", "Temporal-spatial patches", 2, 1, "aligned media", `[B,N,${3 * 2 * patch * patch}] raw patches`, `N = (T′/2)(H/${patch})(W/${patch})`, "The temporal kernel groups two frames; it is not a learned audio/video tokenizer vocabulary.", { ...code, evidence: "derived" }),
        n("order", "Merger-aligned token order", 3, 1, "temporal / row / column indices", "contiguous groups of four neighbors", "(t,R,C,a,b) → flattened index; a,b∈{0,1}", "The reshape/permute packs each 2×2 spatial group before flattening.", { ...code, references: [2] }),
        n("project", "Embed patch vectors", 4, 1, `[B,N,${3 * 2 * patch * patch}]`, `[B,N,${d}]`, "learned patch projection", "Batch and patch counts are preserved by the embedding operator.", code),
      ], [e("frames", "resize", "padded frames"), e("resize", "patch", "aligned pixels"), e("patch", "order", "patch grid"), e("order", "project", "ordered vectors")]),
      v("encoder", "Encoder block", "Dense visual self-attention", "Both residual additions remain explicit; normalization and FFN are separate operations.", [
        n("input", "Visual residual state", 0, 1, `[B,N,${d}]`, `[B,N,${d}]`, "xₗ", "The tower is non-causal within the permitted media segment.", code),
        n("norm", "LayerNorm + Q/K/V", 1, 1, `[B,N,${d}]`, `[B,16,N,${head}] Q,K,V`, `LN → three projections; ${d}=16×${head}`, "Separate projection tensors are reshaped into attention heads.", { ...code, references: [1] }),
        n("position", qwen ? "Spatial 2D RoPE" : "Temporal-spatial 3D RoPE", 2, 0, `[B,16,N,${head}] Q,K`, "positioned Q,K", qwen ? "rotate spatial Q/K coordinates" : "26 time +26 height +26 width +2 unrotated", "Position modifies Q/K, not the value tensor.", { ...code, references: [1] }),
        n("mask", "Media visibility", 2, 2, "segment / packing boundaries", "attention mask", qwen ? "Mij=0 within media; −∞ across packed segments" : "non-causal MHA over supplied tower sequence", qwen ? "Video tokens within one segment can attend across temporal groups." : "Text-backbone sparse attention is not the vision tower's attention algorithm.", { ...code, references: [1], kind: "metadata" }),
        n("attn", "Attention + first residual", 3, 1, "Q,K,V,mask + xₗ", `[B,N,${d}]`, `u=xₗ+Wo(softmax(QKᵀ/√${head}+M)V)`, "The value aggregation is followed by the output projection and residual addition.", { ...code, references: [1], cost: `Dense attention O(B N² ${d}); this explains increasing cost with image/video patch count.` }),
        n("ffn", "FFN + second residual", 4, 1, `[B,N,${d}]`, `[B,N,${d}]`, `xₗ₊₁=u+W₂ GELU(W₁ LN(u)); F=${f}`, "The visual FFN uses GELU-family activation; do not copy a language-model SwiGLU block into this tower.", { ...code, references: [1] }),
      ], [e("input", "norm", "xₗ"), e("norm", "position", "Q / K"), e("norm", "attn", "V"), e("position", "attn", "Q / K"), e("mask", "attn", "visibility", "metadata"), e("input", "attn", "first residual"), e("attn", "ffn", "u")]),
      v("interface", "Merger", qwen ? "Qwen spatial merger" : "MiniMax two-stage projector", "The ordering of projection and concatenation differs between these two towers.", qwen ? [
        n("tower", "Final visual states", 0, 1, "27-layer output", "[B,N,1152]", "Z = X₂₇", "No token-count reduction occurs in the attention stack.", code),
        n("norm", "Per-token LayerNorm", 1, 1, "[B,N,1152]", "[B,N,1152]", "U = LN(Z)", "Normalize before packing four spatial neighbors.", { ...code, references: [1] }),
        n("pack", "Pack 2×2 neighbors", 2, 1, "[B,N,1152]", "[B,N/4,4608]", "g = concat(u₀,u₁,u₂,u₃)", "4×1152=4608.", { ...code, evidence: "derived", references: [1] }),
        n("mlp", "Merger MLP", 3, 1, "[B,N/4,4608]", "[B,N/4,2048]", "4608 → GELU →4608 →2048", "Both MLP weights are learned; the language-interface width is 2048.", { ...code, references: [1] }),
      ] : [
        n("tower", "Final visual states", 0, 1, "32-layer output", "[B,N,1280]", "Z = X₃₂", "The inspected implementation has no additional final tower normalization.", { ...code, references: [1] }),
        n("token", "Per-token MLP", 1, 1, "[B,N,1280]", "[B,N,6144]", "1280 → GELU →6144 →6144", "Token projection happens before spatial concatenation.", { ...code, references: [1] }),
        n("pack", "Pack 2×2 neighbors", 2, 1, "[B,N,6144]", "[B,N/4,24576]", "g = concat(u₀,u₁,u₂,u₃)", "4×6144=24576.", { ...code, evidence: "derived", references: [1] }),
        n("mlp", "Spatial fusion MLP", 3, 1, "[B,N/4,24576]", "[B,N/4,6144]", "24576 → GELU →6144 →6144", "The output count is N/4, with one 6144-wide interface embedding per merged group.", { ...code, references: [1] }),
      ], qwen ? [e("tower", "norm", "tower states"), e("norm", "pack", "normalized neighbors"), e("pack", "mlp", "packed group")] : [e("tower", "token", "tower states"), e("token", "pack", "projected neighbors"), e("pack", "mlp", "packed group")]),
    ],
  };
}

const kimi: ModelArchitecture = {
  id: "kimi-k3-vision", title: "Kimi K3 · MoonViT V2", family: "Vision · factorized image/video tower", article, folder,
  description: "NaViT patch processing, 27 MoonViT blocks, temporal pooling and a spatially compressed language interface.",
  scope: "Paper/config reconstruction with explicit source gaps. B=batch; N=patch tokens. The public processor closes the image preprocessing path, but the article does not establish the executed patch embedding, exact temporal mask, head width or complete projector implementation. Dashed unknown nodes stay unknown.",
  sources: [
    { label: "Kimi K3 configuration · article version lock", href: "https://huggingface.co/moonshotai/Kimi-K3/blob/c5d1dd4c428bd1ce8b88c5044f3b6ccde9e3b721/config.json", note: "Article-pinned tower widths, depth and interface configuration." },
    { label: "Kimi K3 technical report", href: "https://arxiv.org/abs/2607.24653", note: "Factorized attention, temporal pooling and spatial compression." },
    { label: "Released vision processor", href: "https://huggingface.co/moonshotai/Kimi-K3/blob/c5d1dd4c428bd1ce8b88c5044f3b6ccde9e3b721/kimi_k3_vision_processing.py", note: "NaViT image resizing, alignment padding and patch-vector order." },
  ], views: [
    v("model", "Model", "MoonViT V2 with evidence boundaries", "Source gaps remain visible instead of borrowing an older Kimi implementation.", [
      n("processor", "NaViT image processor", 0, 1, "RGB image", "[B,N,588] patch vectors", "resize → bottom/right pad → normalize →14² patches", "Patch vectors contain 3×14×14=588 values; normalization constants and processor budgets remain source-dependent.", { ...code, references: [2], nextView: "patches" }),
      n("embedding", "Patch embedding · unresolved", 1, 1, "[B,N,588]", "[B,N,1024]", "Tembed = undisclosed in inspected source set", "The declared tower width does not establish whether the executed patch projection is linear, Conv2D or Conv3D.", { evidence: "undisclosed" }),
      n("tower", "27 MoonViT V2 blocks", 2, 1, "[B,N,1024]", "[B,N,1024]", "RMSNorm; bias-free projections; FFN width4096", "Paper/config establish the outer tower structure; exact per-head dimension is not inferred from qkv_hidden_size.", { references: [0, 1], nextView: "encoder" }),
      n("pool", "Temporal pooling", 3, 0, "video tower states", "pooled video states", "pooling operator / ratio not closed", "The paper reports temporal pooling; exact executed pooling semantics remain undisclosed in the inspected target code.", { evidence: "undisclosed", references: [1] }),
      n("spatial", "2×2 spatial compression", 3, 2, "image or pooled video states", "Nspatial/4 token groups", "paper-described pixel shuffle compression", "The paper establishes spatial compression; exact packing permutation is not transferred from Kimi K2.5.", { references: [1] }),
      n("project", "Language projector", 4, 1, "spatially compressed states", "[B,Ninterface,7168]", "MLP projector →7168", "Interface width is configuration-established. Full executed projector equations remain source-incomplete.", { evidence: "undisclosed", references: [0, 1] }),
    ], [e("processor", "embedding", "patch vectors"), e("embedding", "tower", "embedded tokens"), e("tower", "pool", "video path"), e("tower", "spatial", "image path"), e("pool", "spatial", "pooled frames"), e("spatial", "project", "compressed groups")]),
    v("patches", "Image geometry", "The source-complete image preprocessing segment", "Image processor semantics are distinct from the paper's native video capability.", [
      n("resize", "Budgeted NaViT resize", 0, 1, "image H₀×W₀", "resized Hᵣ×Wᵣ", "s=min(1,patch-budget scale,side-limit scales)", "The inspected source defines the scaling rule; exact target deployment budgets are not guessed.", { ...code, references: [2] }),
      n("pad", "Bottom / right padding", 1, 1, "Hᵣ×Wᵣ pixels", "Ha×Wa; both divisible by28", "ΔH=(28−Hᵣ mod28) mod28; same for W", "Top and left padding are zero; alignment supports 14² patches followed by 2×2 merging.", { ...code, references: [2] }),
      n("patch", "14×14 RGB patch vectors", 2, 1, "[B,Ha,Wa,3]", "[B,(Ha/14)(Wa/14),588]", "n=(t Hp+r) Wp+c", "The processor's flatten order is established independently of the unknown tower embedding.", { ...code, references: [2] }),
      n("example", "Aligned image example", 3, 1, "1008×1008 processor-output image", "5184 patches →1296 interface tokens", "72²=5184; (72/2)²=1296", "This is a conditional geometry example, not a claim that raw 1024² input necessarily resizes to 1008².", { evidence: "derived", references: [0, 2] }),
    ], [e("resize", "pad", "resized image"), e("pad", "patch", "aligned pixels"), e("patch", "example", "conditional geometry")]),
    v("encoder", "Factorized attention", "Spatial and temporal mixing", "The paper's factorization is shown without inventing missing projection matrices.", [
      n("states", "Tower state", 0, 1, "[B,Tframe,Nspatial,1024]", "same logical shape", "Xₗ", "27 layers and width1024 are established by paper/config.", code),
      n("spatial", "Within-frame attention", 1, 1, "tower state", "spatially mixed states", "spatial mask blocks cross-frame positions", "The paper describes intra-frame spatial attention.", { references: [1] }),
      n("temporal", "Across-frame attention", 2, 1, "spatially mixed video states", "temporally mixed states", "exact temporal connectivity = undisclosed", "The existence of temporal mixing is reported; a fully specified causal/non-causal mask is not established by the inspected modeling source.", { evidence: "undisclosed", references: [1] }),
      n("ffn", "RMSNorm / feed-forward block", 3, 1, "1024-wide states", "1024-wide states", "declared FFN width4096; GELU-family activation", "Residual ordering and all projection shapes require complete modeling evidence; head width is intentionally not derived from 12 query heads.", { evidence: "undisclosed", references: [0, 1] }),
      n("readout", "Pool / spatial compress / project", 4, 1, "final tower state", "7168-wide language tokens", "TemporalPool →2×2 compression →MLP", "Image processing can be traced; the checkpoint-local raw-video processor path is not established by the article.", { references: [0, 1] }),
    ], [e("states", "spatial", "image / frame states"), e("spatial", "temporal", "video branch"), e("spatial", "ffn", "image branch"), e("temporal", "ffn", "video states"), e("ffn", "readout", "after 27 blocks")]),
  ],
};

export const visionArchitectures: readonly ModelArchitecture[] = [ocr, denseVision(true), denseVision(false), kimi];
