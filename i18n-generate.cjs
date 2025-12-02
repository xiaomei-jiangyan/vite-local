#!/usr/bin/env node
/**
 * i18n-extract-vue3.js
 *
 * 工程级脚本（Vue3 环境）
 *
 * 功能概览：
 *  1. 遍历 src 下的 .vue/.js/.ts 文件（支持自定义 --src）
 *  2. 基于 AST 精确提取中文（template 文本 / attribute / script 字符串 / template literals）
 *  3. 生成嵌套结构 locales/zh.json（按文件路径分层）
 *  4. 在 .vue 的 <template> 中替换为 {{$t('path.to.key')}}（会先生成 .bak 备份）
 *  5. 对 JS/TS 生成 suggestions.json；可通过 --apply-scripts 自动替换简单场景
 *  6. 格式化写回文件（prettier）
 *
 * 使用：
 *  node scripts/i18n-extract-vue3.js            => 只提取并替换 template
 *  node scripts/i18n-extract-vue3.js --apply-scripts  => 同时对简单 JS/TS 场景做自动替换（有风险，请先 git commit）
 *  node scripts/i18n-extract-vue3.js --src ./client/src --out ./locales
 *
 * 注意：
 *  - 强烈建议在运行前保持工作区干净（git commit）以便回滚
 *  - 脚本尽力安全替换 template；对复杂 script 修改默认仅生成 suggestions
 */

const fs = require("fs");
const path = require("path");
const fg = require("fast-glob");
const prettier = require("prettier");
const pLimit = require("p-limit").default;
const chalk = require("chalk").default;

// Babel + Vue compiler
const { parse: babelParse } = require("@babel/parser");
const traverse = require("@babel/traverse").default;
const generate = require("@babel/generator").default;
const t = require("@babel/types");

const { parse: parseSFC } = require("@vue/compiler-sfc");
const { baseParse: vueBaseParse } = require("@vue/compiler-dom");

// ----------------- 配置 & 选项 -----------------
const argv = require("minimist")(process.argv.slice(2));
const SRC_DIR = path.resolve(process.cwd(), argv.src || "src");
const OUT_DIR = path.resolve(process.cwd(), argv.out || "locales");
const APPLY_SCRIPTS = Boolean(argv["apply-scripts"]);

// 要扫描的文件 glob（排除 node_modules）
const GLOB_PATTERN = `${SRC_DIR.replace(/\\/g, "/")}/utils/**/*.{vue,js,ts,jsx,tsx}`;

// 更宽泛的中文 & 常见中文标点（包含繁简常用区）
const CHINESE_RE = /[\u4e00-\u9fff\u3400-\u4dbf\uff01-\uff5e\u3000-\u303f]+/;

// 用于并发处理文件
console.log(111, "pLimit", typeof pLimit);
const limit = pLimit(8); // 并发控制（可调整）

// 输出文件
const ZH_JSON = path.join(OUT_DIR, "zh.json");
const SUGGESTIONS_JSON = path.join(OUT_DIR, "suggestions.json");

// 内存数据结构
const zhPool = {
  data: {}, // 嵌套结构最终存放处
  indexMap: {}, // 记录每个文件已分配的序号计数，避免冲突
};
const suggestions = []; // JS/TS 的替换建议数组

// ----------------- 工具函数 -----------------
function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}
function readFile(file) {
  return fs.readFileSync(file, "utf-8");
}
function writeFile(file, content) {
  fs.writeFileSync(file, content, "utf-8");
}
function backupFile(file) {
  const bak = `${file}.bak`;
  if (!fs.existsSync(bak)) fs.writeFileSync(bak, fs.readFileSync(file));
}
function relativePathKey(file) {
  // 把 src 相对路径转为 key 层级数组
  const rel = path.relative(SRC_DIR, file).replace(/\\/g, "/");
  const parts = rel.split("/");
  const filename = parts.pop().replace(/\.(vue|js|ts|jsx|tsx)$/, "");
  return { parts, filename };
}
function writeNested(obj, parts, filename, keyIndex, text) {
  let cur = obj;
  for (const p of parts) {
    if (!cur[p]) cur[p] = {};
    cur = cur[p];
  }
  if (!cur[filename]) cur[filename] = {};
  if (!Object.values(cur[filename]).includes(text)) {
    cur[filename][String(keyIndex)] = text;
  }
}

// 按长度降序替换（防止部分字符串被先替换）
function multiReplaceLongFirst(input, replacements) {
  // replacements: [{original, replacement}]
  replacements.sort((a, b) => b.original.length - a.original.length);
  let out = input;
  for (const { original, replacement } of replacements) {
    // 使用 split+join 替代正则，避免特殊字符处理问题
    out = out.split(original).join(replacement);
  }
  return out;
}

// ----------------- Vue template 处理 -----------------
/**
 * 解析并提取 Vue template 的中文文本（基于 @vue/compiler-dom 的 AST）
 * - 把文本节点与部分属性值（简单 string attribute）视为可替换目标
 * - 在 zhPool 中写入嵌套 key（按文件路径）
 * - 返回一个 replacements 列表：[{original, replacement, key}]
 *   生成 replacements 后由调用方把 template 文本整体替换回文件
 */
function extractFromVueTemplate(filePath, templateContent) {
  // 解析 template 字符串成 Vue AST
  const ast = vueBaseParse(templateContent);

  // 确保 indexMap 存在
  if (!zhPool.indexMap[filePath]) zhPool.indexMap[filePath] = { counter: 0, records: [] };

  const replacements = [];

  // 遍历节点的递归函数
  function walk(node) {
    // 文本节点（type=2）
    if (node.type === 2) {
      const raw = node.content; // 注意：content 含原始空白
      if (raw && CHINESE_RE.test(raw)) {
        // 取 trim 但保留原始用于替换位置匹配（保守策略）
        const trimmed = raw.trim();
        if (trimmed) {
          zhPool.indexMap[filePath].counter += 1;
          const idx = zhPool.indexMap[filePath].counter;
          const { parts, filename } = relativePathKey(filePath);
          writeNested(zhPool.data, parts, filename, idx, trimmed);
          const key = [...parts, filename, String(idx)].join(".");
          // replacement 保留插值结构（使用 {{$t('key')}}）
          const replacement = raw.replace(trimmed, `{{$t('${key}')}}`);
          replacements.push({ original: raw, replacement, key, text: trimmed });
        }
      }
    }

    // 属性值（例如 title="中文"）
    if (node.props && node.props.length) {
      node.props.forEach((prop) => {
        // 仅处理静态 attribute（type === 6）
        if (prop.type === 6 && prop.value && prop.value.content) {
          const val = prop.value.content;
          if (val && CHINESE_RE.test(val)) {
            zhPool.indexMap[filePath].counter += 1;
            const idx = zhPool.indexMap[filePath].counter;
            const { parts, filename } = relativePathKey(filePath);
            // 保存 原始 val（不 trim） 以便更精确替换
            writeNested(zhPool.data, parts, filename, idx, val);
            const key = [...parts, filename, String(idx)].join(".");
            // 将静态属性值替换为 Mustache 表达式（开发者需注意：可能需要变为 :attr binding）
            // 这里我们直接把 value 内容替换为 {{$t('key')}}（保守）
            const replacement = val.replace(val, `{{$t('${key}')}}`);
            replacements.push({ original: val, replacement, key, text: val, attrName: prop.name });
          }
        }
      });
    }

    if (node.children && node.children.length) {
      node.children.forEach((ch) => walk(ch));
    }
  }

  walk(ast);

  return replacements;
}

// ----------------- JS/TS 提取（Babel） -----------------
/**
 * 提取 JS / TS / script block 中的中文字符串
 * - 使用 @babel/parser 解析，并 traverse AST
 * - 识别 StringLiteral、TemplateLiteral（含表达式）等
 * - 对于字符串字面量生成 suggestions；在 --apply-scripts 下尝试做保守替换
 */
async function extractFromScript(filePath, sourceCode, applyScripts = false) {
  // parse config - 支持 TS、JSX 等
  let ast;
  try {
    ast = babelParse(sourceCode, {
      sourceType: "module",
      plugins: [
        "typescript",
        "jsx",
        "classProperties",
        "dynamicImport",
        "optionalChaining",
        "nullishCoalescingOperator",
        "decorators-legacy",
      ],
      errorRecovery: true,
      ranges: true,
      tokens: true,
    });
  } catch (e) {
    console.error(chalk.yellow(`[parse error] ${filePath} : ${e.message}`));
    return { changed: false, suggestionsCount: 0 };
  }

  if (!zhPool.indexMap[filePath]) zhPool.indexMap[filePath] = { counter: 0, records: [] };

  let changed = false;
  let localSuggestCount = 0;

  traverse(ast, {
    enter(pathNode) {
      // 1) StringLiteral
      if (pathNode.isStringLiteral()) {
        const val = pathNode.node.value;
        if (CHINESE_RE.test(val)) {
          zhPool.indexMap[filePath].counter += 1;
          const idx = zhPool.indexMap[filePath].counter;
          const { parts, filename } = relativePathKey(filePath);
          writeNested(zhPool.data, parts, filename, idx, val);
          const key = [...parts, filename, String(idx)].join(".");

          // Suggestion
          suggestions.push({
            file: filePath,
            loc: pathNode.node.loc,
            original: val,
            suggestion: `t('${key}')`,
          });
          localSuggestCount++;

          // 如果开启 applyScripts，做极为保守的替换：string -> this.$t('key')
          if (applyScripts) {
            // 仅在简单表达式或赋值/返回/参数位置安全替换
            // 进一步的上下文检查可扩展
            const callExp = t.callExpression(t.identifier("t"), [t.stringLiteral(key)]);
            pathNode.replaceWith(callExp);
            changed = true;
          }
        }
      }

      // 2) TemplateLiteral : 处理含中文的模板字面量，例如 `你好 ${name}`
      if (pathNode.isTemplateLiteral()) {
        const rawStr = pathNode.node.quasis.map((q) => q.value.cooked).join("");
        if (CHINESE_RE.test(rawStr)) {
          // 构造 i18n 模板，使用 {0} 占位方式
          let i18nTemplate = "";
          for (let i = 0; i < pathNode.node.quasis.length; i++) {
            i18nTemplate += pathNode.node.quasis[i].value.cooked;
            if (i < pathNode.node.expressions.length) {
              i18nTemplate += `{${i}}`;
            }
          }

          zhPool.indexMap[filePath].counter += 1;
          const idx = zhPool.indexMap[filePath].counter;
          const { parts, filename } = relativePathKey(filePath);
          writeNested(zhPool.data, parts, filename, idx, i18nTemplate);
          const key = [...parts, filename, String(idx)].join(".");

          // suggestion object showing how to rewrite
          const exprCodes = pathNode.node.expressions.map((e) => generate(e).code);
          suggestions.push({
            file: filePath,
            loc: pathNode.node.loc,
            original: generate(pathNode.node).code,
            suggestion: `t('${key}', { ${exprCodes.map((c, i) => `_${i}: ${c}`).join(", ")} })`,
          });
          localSuggestCount++;

          if (applyScripts) {
            // 构造 this.t('key', { _0: expr0, _1: expr1 })
            const props = pathNode.node.expressions.map((expr, i) =>
              t.objectProperty(t.identifier(`_${i}`), expr)
            );
            const callExp = t.callExpression(t.identifier("t"), [
              t.stringLiteral(key),
              t.objectExpression(props),
            ]);
            pathNode.replaceWith(callExp);
            changed = true;
          }
        }
      }
    },
  });

  if (changed) {
    // 生成代码并格式化（保守选择 parser）
    const out = generate(ast, { retainLines: true }).code;
    const parser = filePath.endsWith(".ts") || filePath.endsWith(".tsx") ? "typescript" : "babel";
    const _formatted = await prettier.format(out, { parser });
    const formatted = _formatted.trim();
    backupFile(filePath);
    writeFile(filePath, formatted + "\n");
  }

  return { changed, suggestionsCount: localSuggestCount };
}

// ----------------- 主流程 -----------------
(async function main() {
  console.log(chalk.cyan("i18n-extract-vue3: starting..."));
  console.log(`Scanning: ${GLOB_PATTERN}`);
  ensureDir(OUT_DIR);

  // 扫描文件
  const files = await fg([GLOB_PATTERN], { ignore: ["**/node_modules/**", `${OUT_DIR}/**`] });

  // 处理任务
  const tasks = files.map((file) =>
    limit(async () => {
      try {
        const ext = path.extname(file).toLowerCase();
        const raw = readFile(file);

        if (ext === ".vue") {
          // 1) parse SFC to get template and script
          const sfc = parseSFC(raw);
          // template
          const templateBlock = sfc.descriptor.template;
          if (templateBlock && templateBlock.content) {
            const templateContent = templateBlock.content;
            const replacements = extractFromVueTemplate(file, templateContent);
            if (replacements.length) {
              // 替换 template 原始内容 -> 新内容（按长串先替换）
              const newTemplate = multiReplaceLongFirst(
                templateContent,
                replacements.map((r) => ({ original: r.original, replacement: r.replacement }))
              );
              // 把整个 <template>...</template> 区块替换为 newTemplate（保持 attributes）
              const fileContent = raw;
              const newFileContent = fileContent.replace(
                /<template([^>]*)>[\s\S]*?<\/template>/,
                (m, p1) => {
                  return `<template${p1}>\n${newTemplate}\n</template>`;
                }
              );

              // 备份并写回（格式化 vue）
              backupFile(file);
              const formatted = await prettier.format(newFileContent, { parser: "vue" });
              writeFile(file, formatted);
              console.log(
                chalk.green(
                  `Template replaced in ${path.relative(process.cwd(), file)} (${replacements.length} items)`
                )
              );
            }
          }

          // 2) extract from <script> or <script setup>
          const scriptBlock = sfc.descriptor.script || sfc.descriptor.scriptSetup;
          if (scriptBlock && scriptBlock.content) {
            const res = await extractFromScript(file, scriptBlock.content, APPLY_SCRIPTS);
            if (res.suggestionsCount) {
              console.log(
                chalk.yellow(
                  `Script suggestions for ${path.relative(process.cwd(), file)}: ${res.suggestionsCount}`
                )
              );
            }
            if (res.changed) {
              // 目前我们只把 script 的修改写入单独 .js/.ts 文件或建议，修改 SFC 内 script 区块复杂度高 -> 如需可增强为替换 SFC script 区块并写回
              console.log(
                chalk.blue(
                  `Script changed for ${path.relative(process.cwd(), file)} (note: script block in .vue was changed only in-memory).`
                )
              );
              // For safety, we currently don't write back complex script replacements into .vue files.
              // Advanced: re-assemble SFC descriptor and write back with updated script content.
            }
          }
        } else {
          // .js/.ts/.jsx/.tsx file
          const res = await extractFromScript(file, raw, APPLY_SCRIPTS);
          if (res.suggestionsCount) {
            console.log(
              chalk.yellow(
                `Suggestions for ${path.relative(process.cwd(), file)} : ${res.suggestionsCount}`
              )
            );
          }
          if (res.changed) {
            console.log(
              chalk.green(`Script auto-applied for ${path.relative(process.cwd(), file)}`)
            );
          }
        }
      } catch (e) {
        console.error(chalk.red(`Error processing ${file}: ${e.message}`));
      }
    })
  );

  await Promise.all(tasks);

  // 写出 zh.json 与 suggestions.json
  writeFile(ZH_JSON, JSON.stringify(zhPool.data, null, 2));
  writeFile(SUGGESTIONS_JSON, JSON.stringify(suggestions, null, 2));
  console.log(chalk.cyan("Done."));
  console.log(chalk.cyan(`zh.json -> ${ZH_JSON}`));
  console.log(chalk.cyan(`suggestions -> ${SUGGESTIONS_JSON}`));
  if (APPLY_SCRIPTS)
    console.log(
      chalk.yellow("Note: --apply-scripts enabled. Please review .bak files / git diff.")
    );
})();
