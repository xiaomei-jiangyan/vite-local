/**
node src/i18n/i18nTranslate.cjs
// 测试用以下
node src/i18n/i18nTranslate.cjs --src=src/i18n --out=src/i18n
 */

const fs = require("fs");
const path = require("path");
const translateAPI = require("@vitalets/google-translate-api");
const minimist = require("minimist");

const { translate } = require("./translate.js");

// const { translate } = translateAPI;
const proxy = require("https-proxy-agent");
const { HttpsProxyAgent } = proxy;
const agent = new HttpsProxyAgent("http://127.0.0.1:7890"); // clashx 对外暴露地址
const userAgent =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36";

const argv = minimist(process.argv.slice(2));
const PLimit = require("p-limit").default;
// 配置
const SRC_DIR = path.resolve(process.cwd(), argv.src || "src");
const OUT_DIR = path.resolve(process.cwd(), argv.out || "src/locales");
// const FILE_EXTS = /\.(vue|js|ts)$/;
// const CHINESE_REGEX = /[\u4e00-\u9fa5，。！？、：；“”‘’（）《》]+/g;
const LANGS = ["en", "jp"]; // 支持多语言

// 创建输出目录
// if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR);

// const zhResult = {};

// // 遍历目录
// function walkDir(dir) {
//   const files = fs.readdirSync(dir);
//   files.forEach((file) => {
//     const fullPath = path.join(dir, file);
//     const stat = fs.statSync(fullPath);
//     if (stat.isDirectory()) {
//       walkDir(fullPath);
//     } else if (FILE_EXTS.test(file)) {
//       extractChinese(fullPath);
//     }
//   });
// }

// 去掉 JS 注释
// function removeJsComments(code) {
//   return code.replace(/\/\/.*$/gm, "").replace(/\/\*[\s\S]*?\*\//g, "");
// }

// 提取中文
// function extractChinese(filePath) {
//   let content = fs.readFileSync(filePath, "utf-8");

//   if (filePath.endsWith(".vue")) {
//     const templateMatch = content.match(/<template[^>]*>[\s\S]*<\/template>/);
//     if (templateMatch) {
//       let templateContent = templateMatch[0].replace(/<[^>]+>/g, " ");
//       const matches = templateContent.match(CHINESE_REGEX);
//       addMatches(filePath, matches);
//     }

//     const scriptMatch = content.match(/<script[^>]*>[\s\S]*<\/script>/);
//     if (scriptMatch) {
//       let scriptContent = removeJsComments(scriptMatch[0]);
//       const matches = scriptContent.match(CHINESE_REGEX);
//       addMatches(filePath, matches);
//     }
//   } else {
//     content = removeJsComments(content);
//     const matches = content.match(CHINESE_REGEX);
//     addMatches(filePath, matches);
//   }
// }

// 添加匹配到的中文，存成嵌套结构
// function addMatches(filePath, matches) {
//   if (!matches) return;
//   const relativePath = path.relative(SRC_DIR, filePath).replace(/\\/g, "/");
//   const pathParts = relativePath.split("/"); // 文件夹层级
//   const fileName = pathParts.pop().replace(/\.(vue|js|ts)$/, "");

//   matches.forEach((text, index) => {
//     let current = zhResult;
//     // 构建嵌套层级
//     pathParts.forEach((p) => {
//       if (!current[p]) current[p] = {};
//       current = current[p];
//     });

//     if (!current[fileName]) current[fileName] = {};
//     // key: 数字序号
//     const key = `${Object.keys(current[fileName]).length + 1}`;
//     if (!Object.values(current[fileName]).includes(text)) {
//       current[fileName][key] = text;
//     }
//   });
// }

async function delay(time = 500) {
  return new Promise((r) => setTimeout(r, time));
}

const pLimit = PLimit(3);
// 翻译中文到指定语言
async function translateZhToLang(obj, lang) {
  const result = {};
  const promises = [];
  async function traverse(src, target) {
    for (const key in src) {
      if (typeof src[key] === "object") {
        target[key] = {};
        await traverse(src[key], target[key]);
      } else {
        promises.push(
          pLimit(async () => {
            try {
              const res = await translate(src[key], lang, {
                to: lang,
                tld: "cn",
                fetchOptions: {
                  agent,
                  "User-Agent": userAgent,
                  headers: {
                    "User-Agent": userAgent,
                  },
                },
              });
              target[key] = res?.text ?? res;
            } catch (err) {
              target[key] = src[key];
            }
          })
        );
      }
    }
  }
  await traverse(obj, result);
  await Promise.all(promises);
  return result;
}

// 主函数
async function main() {
  console.log("🔍 提取中文...");
  // walkDir(SRC_DIR);

  const zhPath = path.join(SRC_DIR, "zh.json");

  const zhResult = fs.readFileSync(zhPath, "utf-8");
  const result = JSON.parse(zhResult);
  for (const lang of LANGS) {
    console.log(`🌐 翻译成 ${lang} ...`);
    const langResult = await translateZhToLang(result, lang);
    const langPath = path.join(OUT_DIR, `${lang}.json`);
    fs.writeFileSync(langPath, JSON.stringify(langResult, null, 2), "utf-8");
    console.log(`✅ 已生成 ${lang} 文件：${langPath}`);
  }
}

main();
