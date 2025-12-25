/**
 * 把本地语言 JSON（en.json, zh.json, jp.json）
 * 扁平化成表格（export.xlsx/export.json），并报告缺失项
 * 扁平化嵌套 JSON
 * 
 * 递归扁平化 nested JSON 为 key -> value（例如 home.title）。
 * 合并所有语言键并写成 Excel（XLSX 库）和 export.json，并输出缺失项提示。


 * 目的：将本地语言文件（如 en.json、zh.json、jp.json）
 * 扁平化成行式表格（Excel），便于翻译人员使用或导出差异
 * { test: { 1: 'xxx', 2: 'yyy' } } => { 'test.1': 'xxx', 'test.2': 'yyy' }
 测试
node src/i18n/i18nExport.cjs --src=src/i18n --out=src/i18n
正式用
node src/i18n/i18nExport.cjs --src=src/locales --out=src/locales 
*/

const XLSX = require("xlsx");
const fs = require("fs");
const path = require("path");

const minimist = require("minimist");
const argv = minimist(process.argv.slice(2));

const SRC_DIR = path.resolve(process.cwd(), argv.src || "src");
const OUT_DIR = path.resolve(process.cwd(), argv.out || "src/locales");

function flattenJSON(obj, parentKey = "", result = {}) {
  for (const [key, value] of Object.entries(obj)) {
    const newKey = parentKey ? `${parentKey}.${key}` : key;
    if (typeof value === "object" && value !== null) {
      flattenJSON(value, newKey, result);
    } else {
      result[newKey] = value;
    }
  }
  return result;
}

const enPath = path.join(SRC_DIR, "en.json");
const zhPath = path.join(SRC_DIR, "zh.json");
const jpPath = path.join(SRC_DIR, "jp.json");

// 1. 读取 JSON 文件
const en = flattenJSON(JSON.parse(fs.readFileSync(enPath, "utf-8")));
const zh = flattenJSON(JSON.parse(fs.readFileSync(zhPath, "utf-8")));
const jp = flattenJSON(JSON.parse(fs.readFileSync(jpPath, "utf-8")));

// 2. 获取所有 key（去重并排序）
const allKeys = Array.from(
  new Set([...Object.keys(en), ...Object.keys(zh), ...Object.keys(jp)])
).sort();

// 3. 构建 Excel 数据
const data = [["Key", "ZH", "EN", "JP"]]; // 表头

let diff = "";

for (const key of allKeys) {
  const _zh = zh[key] || "",
    _en = en[key] || "",
    _jp = jp[key] || "";
  if (!_zh) diff += `\n中文${key}导出无值，请补充\n`;
  if (!_en) diff += `\n英文${key}导出无值，请补充\n`;
  if (!_jp) diff += `\n日文${key}导出无值，请补充\n`;
  data.push([key, _zh, _en, _jp]);
}

// 4. 写入 Excel
const worksheet = XLSX.utils.aoa_to_sheet(data);
const workbook = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(workbook, worksheet, "Lang");

const excelPath = path.join(OUT_DIR, "export.xlsx");
XLSX.writeFile(workbook, excelPath);

const jsonPath = path.join(OUT_DIR, "export.json");
fs.writeFileSync(jsonPath, JSON.stringify(data, null, 2), "utf-8");

console.log("导出成功！", diff);
