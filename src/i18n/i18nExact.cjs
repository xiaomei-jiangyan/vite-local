/**
 * 提取所有文件（vue,js,ts,tsx,jsx）
 * 如果是vue 文件将运用vue-sfc先执行一遍，然后将js bable parse.
 *
 */
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

//node src/i18n/i18nExact.cjs --src=src/i18n --apply-scripts 将在src/i18n文件夹下运行成功

// node src/i18n/i18nExact.cjs --apply-scripts --out=src/locales
function scanFiles(dir, pattern, filelist = []) {
  const files = fs.readdirSync(dir);
  files.forEach((file) => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      scanFiles(filePath, pattern, filelist);
    } else if (stat.isFile() && pattern.test(filePath)) {
      filelist.push(filePath);
    }
  });
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
const OUT_DIR = path.resolve(process.cwd(), argv.out || "locales");

const ZH_JSON = path.join(OUT_DIR, "zh.json");

const APPLY_SCRIPTS = Boolean(argv["apply-scripts"]);
const pattern = /\.(vue|ts|tsx|js|jsx)$/;

const CHINESE_RE = /[\u4e00-\u9fff\u3400-\u4dbf\uff01-\uff5e\u3000-\u303f]+/;

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
  for (let key in parts) {
    if (!current[key]) current[key] = {};
    current = current[key];
  }
  if (!current[filename]) current[filename] = {};
  if (!Object.values(current[filename]).includes(text)) {
    current[filename][String(idx)] = text;
  }
  return original;
};

const exactVueTemplate = (path, templateContent) => {
  const ast = vueBaseParse(templateContent);
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

const exactJSTemplate = async (path, templateContent, applyScripts) => {
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

          const exprCodes = pathNode.node.expressions.map((e) => generate(e).code);
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
  const _formatted = await prettier.format(out, { parser });
  const formatted = _formatted.trim();
  // backupFile(path);
  return `import { i18n } from "@/i18n/index";\n` + formatted + "\n";
  // fs.writeFileSync(path, formatted + "\n", "utf-8");
  // }
};

const readAllFile = (files) => {
  files.forEach(async (file) => {
    const ext = path.extname(file).toLowerCase();
    const content = fs.readFileSync(file, "utf-8");
    if (ext === ".vue") {
      const sfc = SFCParse(content);
      const templateBlock = sfc.descriptor.template;
      const scriptBlock = sfc.descriptor.script || sfc.descriptor.scriptSetup;
      let newFileContent = content;
      if (scriptBlock && scriptBlock.content) {
        const newTemplate = await exactJSTemplate(file, scriptBlock.content, APPLY_SCRIPTS);
        newFileContent = newFileContent.replace(/<script([^>]*)>[\s\S]*?<\/script>/, (m, p1) => {
          return `<script${p1}>${newTemplate}\n</script>`;
        });
      }
      if (templateBlock && templateBlock.content) {
        const replacements = exactVueTemplate(file, templateBlock.content);
        const newTemplate = replaceAfterAST(
          templateBlock.content,
          replacements.map((r) => ({ original: r.original, replacement: r.replacement }))
        );
        newFileContent = newFileContent.replace(
          /<template([^>]*)>[\s\S]*?<\/template>/,
          (m, p1) => {
            return `<template${p1}>\n${newTemplate}\n</template>`;
          }
        );
      }
      const formatted = await prettier.format(newFileContent, { parser: "vue" });
      // console.log(111, formatted);
      fs.writeFileSync(file, formatted, "utf-8");
    } else {
      const newTemplate = await exactJSTemplate(file, content, APPLY_SCRIPTS);
      fs.writeFileSync(file, newTemplate, "utf-8");
    }
  });
  fs.writeFileSync(ZH_JSON, JSON.stringify(zhPool.data, null, 2));
};

const All_Files = scanFiles(SRC_DIR, pattern);
readAllFile(All_Files);
