/**
 * 扁平化嵌套 JSON
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
