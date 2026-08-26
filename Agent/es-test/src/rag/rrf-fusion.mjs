/**
 * RRF（Reciprocal Rank Fusion，倒数排名融合）
 *
 * 用于把多路检索结果（ES 关键词 / Milvus 向量 / HyDE 假设文档 / ...）融合成一路。
 * 不依赖各源分数量纲，只看每路内部的排名，天然适合跨源融合。
 *
 * 公式：RRF(d) = Σ_i  1 / (k + rank_i(d))
 *  - k 常数默认 60（经典取值）
 *  - rank 从 1 开始
 *
 * 输入：多路 [{ id, ... }] 列表（各路内部已是按相关性排好序的）
 * 输出：[{ ...doc, rrf_score, ranks: { source: rank } }] 按 rrf_score 降序
 */

const DEFAULT_K = 60;

/**
 * 对多路检索结果做 RRF 融合
 * @param {Object[]} rankedLists - 多路结果，例如：
 *   [
 *     { source: "es",     docs: [{ id: "a", ... }, { id: "b", ... }] },
 *     { source: "milvus", docs: [{ id: "b", ... }, { id: "c", ... }] },
 *     { source: "hyde",   docs: [{ id: "a", ... }, { id: "d", ... }] },
 *   ]
 * @param {Object} [opts]
 * @param {number} [opts.k=60] - RRF 常数
 * @param {string} [opts.idKey="id"] - 文档唯一标识字段
 * @param {boolean} [opts.dedupe=true] - 是否按 id 合并同一文档（保留各路信息）
 * @returns {Object[]} 融合后按 rrf_score 降序的文档列表
 */
export function rrfFusion(rankedLists, opts = {}) {
  const { k = DEFAULT_K, idKey = "id", dedupe = true } = opts;

  // 聚合每个文档在所有路中的排名
  // map: id -> { doc, rrf, ranks: { source: rank } }
  const agg = new Map();

  for (const { source, docs } of rankedLists) {
    if (!docs) continue;
    docs.forEach((doc, i) => {
      const rank = i + 1; // 从 1 开始
      const id = doc?.[idKey] ?? doc?.metadata?.[idKey];
      if (id == null) return; // 无 id 的文档跳过（无法融合）

      if (!agg.has(id)) {
        agg.set(id, {
          doc: { ...doc, metadata: { ...(doc.metadata ?? {}), [idKey]: id } },
          rrf: 0,
          ranks: {},
        });
      }
      const entry = agg.get(id);
      entry.rrf += 1 / (k + rank);
      entry.ranks[source] = rank;
    });
  }

  // 按 rrf_score 降序，并列时按"被多少路命中"降序（更稳）
  return Array.from(agg.values())
    .map(({ doc, rrf, ranks }) => ({
      ...doc,
      rrf_score: rrf,
      rrf_ranks: ranks,
      rrf_sources: Object.keys(ranks).length,
    }))
    .sort((a, b) => b.rrf_score - a.rrf_score || b.rrf_sources - a.rrf_sources);
}

/**
 * 调试辅助：打印融合结果及每路的排名明细
 */
export function printFusionResults(fused) {
  console.log(`\n=== RRF 融合结果（共 ${fused.length} 条）===`);
  fused.forEach((d, i) => {
    const ranksStr = Object.entries(d.rrf_ranks ?? {})
      .map(([s, r]) => `${s}#${r}`)
      .join(" ");
    console.log(
      `[${i + 1}] rrf=${d.rrf_score.toFixed(4)} 命中${d.rrf_sources}路  (${ranksStr})`,
    );
    const preview = (d.pageContent ?? d.content ?? "")
      .slice(0, 80)
      .replace(/\n/g, " ");
    console.log(`     ${preview}`);
  });
}
