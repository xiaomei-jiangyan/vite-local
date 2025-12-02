// extract-multi-lang.js
const fs = require("fs");
const path = require("path");
const translateAPI = require("@vitalets/google-translate-api");

const { translate } = translateAPI;
const proxy = require("https-proxy-agent");
const { HttpsProxyAgent } = proxy;
const agent = new HttpsProxyAgent("http://127.0.0.1:7890");
const userAgent =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36";

// 配置
const SRC_DIR = path.join(__dirname, "src");
const OUTPUT_DIR = path.join(__dirname, "locales"); // 输出目录
const FILE_EXTS = /\.(vue|js|ts)$/;
const CHINESE_REGEX = /[\u4e00-\u9fa5，。！？、：；“”‘’（）《》]+/g;
const LANGS = ["en", "jp", "fr"]; // 支持多语言

// 创建输出目录
if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR);

const zhResult = {};

// 遍历目录
function walkDir(dir) {
  const files = fs.readdirSync(dir);
  files.forEach((file) => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      walkDir(fullPath);
    } else if (FILE_EXTS.test(file)) {
      extractChinese(fullPath);
    }
  });
}

// 去掉 JS 注释
function removeJsComments(code) {
  return code.replace(/\/\/.*$/gm, "").replace(/\/\*[\s\S]*?\*\//g, "");
}

// 提取中文
function extractChinese(filePath) {
  let content = fs.readFileSync(filePath, "utf-8");

  if (filePath.endsWith(".vue")) {
    const templateMatch = content.match(/<template[^>]*>[\s\S]*<\/template>/);
    if (templateMatch) {
      let templateContent = templateMatch[0].replace(/<[^>]+>/g, " ");
      const matches = templateContent.match(CHINESE_REGEX);
      addMatches(filePath, matches);
    }

    const scriptMatch = content.match(/<script[^>]*>[\s\S]*<\/script>/);
    if (scriptMatch) {
      let scriptContent = removeJsComments(scriptMatch[0]);
      const matches = scriptContent.match(CHINESE_REGEX);
      addMatches(filePath, matches);
    }
  } else {
    content = removeJsComments(content);
    const matches = content.match(CHINESE_REGEX);
    addMatches(filePath, matches);
  }
}

// 添加匹配到的中文，存成嵌套结构
function addMatches(filePath, matches) {
  if (!matches) return;
  const relativePath = path.relative(SRC_DIR, filePath).replace(/\\/g, "/");
  const pathParts = relativePath.split("/"); // 文件夹层级
  const fileName = pathParts.pop().replace(/\.(vue|js|ts)$/, "");

  matches.forEach((text, index) => {
    let current = zhResult;
    // 构建嵌套层级
    pathParts.forEach((p) => {
      if (!current[p]) current[p] = {};
      current = current[p];
    });

    if (!current[fileName]) current[fileName] = {};
    // key: 数字序号
    const key = `${Object.keys(current[fileName]).length + 1}`;
    if (!Object.values(current[fileName]).includes(text)) {
      current[fileName][key] = text;
    }
  });
}

async function delay(time = 500) {
  return new Promise((r) => setTimeout(r, time));
}

// 翻译中文到指定语言
async function translateZhToLang(obj, lang) {
  const result = {};
  async function traverse(src, target) {
    for (const key in src) {
      if (typeof src[key] === "object") {
        target[key] = {};
        await traverse(src[key], target[key]);
      } else {
        try {
          await delay(2000);
          const res = await translate(src[key], {
            // from: "zh-CN",
            to: lang,
            client: "gtx",
            tld: "cn",
            fetchOptions: {
              agent,
              headers: {
                "User-Agent": userAgent,
              },
            },
          });
          target[key] = res.text;
        } catch (err) {
          console.error(`翻译失败: ${src[key]}`, err);
          target[key] = src[key];
        }
      }
    }
  }
  await traverse(obj, result);
  return result;
}

// 主函数
async function main() {
  console.log("🔍 提取中文...");
  walkDir(SRC_DIR);

  const zhPath = path.join(OUTPUT_DIR, "zh.json");
  fs.writeFileSync(zhPath, JSON.stringify(zhResult, null, 2), "utf-8");
  console.log(`✅ 已生成中文文件：${zhPath}`);

  for (const lang of LANGS) {
    console.log(`🌐 翻译成 ${lang} ...`);
    const langResult = await translateZhToLang(zhResult, lang);
    const langPath = path.join(OUTPUT_DIR, `${lang}.json`);
    fs.writeFileSync(langPath, JSON.stringify(langResult, null, 2), "utf-8");
    console.log(`✅ 已生成 ${lang} 文件：${langPath}`);
  }
}

main();
