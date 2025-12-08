// function formatArgv(args){
//   const _slice = args.slice(2);
//   const result = {};
//   for(let i =0; i<=_slice.length; i++) {
//     const current = _slice[i];
//     if(!current) return result;
//     if(current.includes("=")) {
//       const obj = current.split('=')
//       result[obj[0]?.slice(2)] = obj[1]
//     } else {
//       const key = current.slice(2);
//       let value = true;
//       if(!_slice[i+1].startsWith('--')) {
//         value = _slice[i+1];
//         result[key] = value;
//         i+=1;
//         continue;
//       } else {
//         result[key] = value;
//       }
//     }
//   }
//   return result
// }
// formatArgv([
//   '/usr/local/bin/node',
//   '/path/to/index.js',
//   '--name=chen',
//   '--age',
//   '25'
// ])

/**
 * 提取所有文件（vue,js,ts,tsx,jsx）
 * 如果是vue 文件将运用vue-sfc先执行一遍，然后将js bable parse.
 *
 */
/*
运行以下命令
将在src/i18n文件夹下运行成功;
测试用
node src/i18n/i18nExact.cjs --src=src/i18n --apply-scripts --out=src/i18n  
正式用
node src/i18n/i18nExact.cjs --apply-scripts --out=src/locales 
*/
function scanFiles(dir, pattern, filelist = []) {
  const files = fs.readdirSync(dir);
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (excludes.some((pattern) => filePath.includes(pattern))) continue;
    if (stat.isDirectory()) {
      scanFiles(filePath, pattern, filelist);
    } else if (stat.isFile() && pattern.test(filePath)) {
      filelist.push(filePath);
    }
  }
  return filelist;
}

const minimist = require("minimist");
const fs = require("fs");
const path = require("path");
const prettier = require("prettier");

const { parse: SFCParse } = require("@vue/compiler-sfc");
const { baseParse: vueBaseParse } = require("@vue/compiler-dom");
const { parse: babelParse } = require("@babel/parser");

const traverse = require("@babel/traverse").default;
const t = require("@babel/types");
const generate = require("@babel/generator").default;

const argv = minimist(process.argv.slice(2));

const SRC_DIR = path.resolve(process.cwd(), argv.src || "src");
const OUT_DIR = path.resolve(process.cwd(), argv.out || "src/locales");

const ZH_JSON = path.join(OUT_DIR, "zh.json");

const APPLY_SCRIPTS = Boolean(argv["apply-scripts"]);
const pattern = /\.(vue|ts|tsx|js|jsx)$/;

const CHINESE_RE = /[\u4e00-\u9fff\u3400-\u4dbf\uff01-\uff5e\u3000-\u303f]+/;
const JAPANESE_RE = /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FFF\u3000-\u303F]+/g; // 日文正则

const excludes = SRC_DIR.includes("src/i18n")
  ? [
      // 测试用
      "node_modules",
      ".git",
      "main.js",
      "src/locales/",
      "src/i18n/index.ts",
      "src/i18n/translate.js",
    ]
  : ["node_modules", ".git", "main.js", "src/i18n/", "src/locales/"]; // 正式用

const relativePathKey = (file) => {
  const rel = path.relative(SRC_DIR, file).replace(/\\/g, "/");
  const parts = rel.split("/");
  const filename = parts.pop().replace(/\.(vue|js|ts|jsx|tsx)$/, "");
  return {
    filename: filename,
    parts,
  };
};

const zhPool = {
  indexMap: {},
  data: {},
};
const writeNested = (original, parts, filename, idx, text) => {
  let current = original;
  for (let key of parts) {
    if (!current[key]) current[key] = {};
    current = current[key];
  }
  if (!current[filename]) current[filename] = {};
  if (!Object.values(current[filename]).includes(text)) {
    current[filename][String(idx)] = text;
  }
};

const exactVueTemplate = async (path, templateContent) => {
  const ast = await vueBaseParse(templateContent);
  const replacements = [];

  if (!zhPool.indexMap[path]) zhPool.indexMap[path] = { counter: 0, records: [] };

  function walk(node) {
    // 5 变量节点
    if (node.type === 2) {
      const text = node.content.trim();
      if (text && CHINESE_RE.test(text)) {
        const idx = (zhPool.indexMap[path].counter += 1);
        const { parts, filename } = relativePathKey(path);
        writeNested(zhPool.data, parts, filename, idx, text);
        const key = [...parts, filename, String(idx)].join(".");
        const replacement = node.content.replace(text, `{{$t('${key}')}}`);
        replacements.push({ original: node.content, replacement, key, text });
      }
    }
    if (node.props && node.props.length) {
      node.props.forEach((prop) => {
        if (prop.type === 6 && prop.value && prop.value.content) {
          const val = prop.value.content;
          if (val && CHINESE_RE.test(val)) {
            const idx = (zhPool.indexMap[path].counter += 1);
            const { parts, filename } = relativePathKey(path);
            // 保存 原始 val（不 trim） 以便更精确替换
            writeNested(zhPool.data, parts, filename, idx, val);
            const key = [...parts, filename, String(idx)].join(".");
            // 将静态属性值替换为 Mustache 表达式（开发者需注意：可能需要变为 :attr binding）
            // 这里我们直接把 value 内容替换为 {{$t('key')}}（保守）
            const replaceText = prop.loc?.source || val;
            const replacement = replaceText.replace(val, `$t('${key}')`);
            replacements.push({
              original: replaceText,
              replacement: ":" + replacement,
              key,
              text: val,
              attrName: prop.name,
            });
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
};

const replaceAfterAST = (input, replaces) => {
  replaces.sort((a, b) => b.original.length - a.original.length);
  let out = input;
  for (const { original, replacement } of replaces) {
    // 使用 split+join 替代正则，避免特殊字符处理问题
    out = out.split(original).join(replacement);
  }
  return out;
};

const exactJSTemplate = async (path, templateContent, applyScripts, lang) => {
  let ast;
  try {
    ast = babelParse(templateContent, {
      sourceType: "module",
      plugins: [
        "typescript",
        "jsx",
        "javascript",
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
    consoel.log(e);
    return { changed: false, suggestionsCount: 0 };
  }
  let changed = false;
  let localSuggestCount = 0;
  const replacements = [];

  if (!zhPool.indexMap[path]) zhPool.indexMap[path] = { counter: 0, records: [] };
  traverse(ast, {
    enter(pathNode) {
      if (pathNode.isStringLiteral()) {
        const val = pathNode.node.value;
        if (CHINESE_RE.test(val)) {
          zhPool.indexMap[path].counter += 1;
          const idx = zhPool.indexMap[path].counter;
          const { parts, filename } = relativePathKey(path);
          writeNested(zhPool.data, parts, filename, idx, val);
          const key = [...parts, filename, String(idx)].join(".");

          // 如果开启 applyScripts，做极为保守的替换：string -> this.$t('key')
          if (applyScripts) {
            // 仅在简单表达式或赋值/返回/参数位置安全替换
            // 进一步的上下文检查可扩展
            const callExp = t.callExpression(t.identifier("i18n.global.t"), [t.stringLiteral(key)]);
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
              i18nTemplate += `{_${i}}`;
            }
          }

          zhPool.indexMap[path].counter += 1;
          const idx = zhPool.indexMap[path].counter;
          const { parts, filename } = relativePathKey(path);
          writeNested(zhPool.data, parts, filename, idx, i18nTemplate);
          const key = [...parts, filename, String(idx)].join(".");

          // const exprCodes = pathNode.node.expressions.map((e) => generate(e).code);
          if (applyScripts) {
            // 构造 this.t('key', { _0: expr0, _1: expr1 })
            const props = pathNode.node.expressions.map((expr, i) =>
              t.objectProperty(t.identifier(`_${i}`), expr)
            );
            const callExp = t.callExpression(t.identifier("i18n.global.t"), [
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

  // if (changed) {
  // 生成代码并格式化（保守选择 parser）
  const out = generate(ast, { retainLines: true }).code;
  const parser = path.endsWith(".ts") || path.endsWith(".tsx") ? "typescript" : "babel";
  let _formatted;
  try {
    _formatted = await prettier.format(out, {
      parser: lang === "ts" ? "typescript" : parser,
    });
  } catch (e) {
    console.warn("格式化失败，使用 fallback html parser", e.message.slice(30));
    _formatted = await prettier.format(out, {
      parser: "html",
    });
  }
  const formatted = _formatted.trim();
  return `import { i18n } from "@/i18n/index";\n` + formatted + "\n";
};

function replaceBlock(content, block, newBlock) {
  const start = block.loc.start.offset;
  const end = block.loc.end.offset;

  return content.slice(0, start) + newBlock + content.slice(end);
}

function insertLineInScript(scriptContent, newLine) {
  const lines = scriptContent.split("\n");
  // 在原内容第二行插入（index=1）
  lines.splice(1, 0, newLine);

  return lines.join("\n");
}

const readAllFile = async (files) => {
  for (const file of files) {
    const ext = path.extname(file).toLowerCase();
    const content = fs.readFileSync(file, "utf-8");
    if (ext === ".vue") {
      const sfc = await SFCParse(content);
      const templateBlock = sfc.descriptor.template;
      const scriptBlock = sfc.descriptor.script || sfc.descriptor.scriptSetup;
      let finalScript = null;
      let finalTemplate = null;

      if (scriptBlock && scriptBlock.content) {
        const lang = scriptBlock.lang;

        // const scriptCode = insertLineInScript(scriptBlock.content, `console.log("1111 injected");`);

        const newScript = await exactJSTemplate(file, scriptBlock.content, APPLY_SCRIPTS, lang);
        // preserve script attributes like setup, src, lang, scoped, etc.
        const attrs = scriptBlock.attrs || {};
        const attrsStr = Object.keys(attrs)
          .map((k) => {
            const v = attrs[k];
            return v === true ? `${k}` : `${k}="${v}"`;
          })
          .join(" ");

        // finalScript = `<script${attrsStr ? ` ${attrsStr}` : ""}>\n${newScript}\n</script>`;
        finalScript = `\n${newScript}\n`;
      } else if (sfc.descriptor.script) {
        finalScript = content.slice(
          sfc.descriptor.script.loc.start.offset,
          sfc.descriptor.script.loc.end.offset
        );
      }
      if (templateBlock && templateBlock.content) {
        const replacements = await exactVueTemplate(file, templateBlock.content);
        const newTemplate = await replaceAfterAST(
          templateBlock.content,
          replacements.map((r) => ({ original: r.original, replacement: r.replacement }))
        );
        // include the <template> wrapper so we replace the whole block
        // const tLang = templateBlock.lang ? ` lang="${templateBlock.lang}"` : "";
        // finalTemplate = `<template${tLang}>\n${newTemplate}\n</template>`;
        finalTemplate = `\n${newTemplate}\n`;
      } else if (sfc.descriptor.template) {
        finalTemplate = content.slice(
          sfc.descriptor.template.loc.start.offset,
          sfc.descriptor.template.loc.end.offset
        );
      }

      // let result = "";
      // // Build list of blocks to replace; use the actual blocks we inspected earlier
      // const replaceBlocks = [];
      // if (templateBlock)
      //   replaceBlocks.push({ block: templateBlock, newBlock: finalTemplate, offset: 11 });
      // if (scriptBlock) replaceBlocks.push({ block: scriptBlock, newBlock: finalScript, offset: 9 });

      // replaceBlocks.sort((a, b) => a.block.loc.start.offset - b.block.loc.start.offset);
      // const endBlock = replaceBlocks[replaceBlocks.length - 1];
      // const end = endBlock ? content.slice(endBlock.block.loc.end.offset + endBlock.offset) : "";
      // for (const { block, newBlock } of replaceBlocks) {
      //   result += newBlock;
      // }
      // result += end;

      let result = content;
      const blocks = [];
      if (templateBlock)
        blocks.push({ block: templateBlock, newCode: finalTemplate, endOffset: 11 });
      if (scriptBlock) blocks.push({ block: scriptBlock, newCode: finalScript, endOffset: 9 });

      blocks
        .sort((a, b) => b.block.loc.start.offset - a.block.loc.start.offset)
        .forEach(({ block, newCode }) => {
          result = replaceBlock(result, block, newCode);
        });

      let formatted;
      try {
        formatted = await prettier.format(result, { parser: "vue" });
      } catch (e) {
        console.warn("格式化失败，使用 fallback html parser", e.message.slice(30));
        formatted = await prettier.format(result, { parser: "html" });
      }
      fs.writeFileSync(file, formatted, "utf-8");
    } else {
      const newTemplate = await exactJSTemplate(file, content, APPLY_SCRIPTS);
      fs.writeFileSync(file, newTemplate, "utf-8");
    }
  }
  fs.writeFileSync(ZH_JSON, JSON.stringify(zhPool.data, null, 2));
};

const All_Files = scanFiles(SRC_DIR, pattern);
readAllFile(All_Files);
