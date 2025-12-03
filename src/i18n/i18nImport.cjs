/**
* 导入excel文件，读取内容和旧的进行对比，
* 然后和用户确认新的变更，如果用户决定写入，则替换原来的翻译文件，并删除原来的export文件
测试用
node src/i18n/i18nImport.cjs --src=src/i18n --out=src/i18n
正式用
node src/i18n/i18nImport.cjs --src=src/locales --out=src/locales 
*/

const fs = require("fs");
const path = require("path");
const XLSX = require("xlsx");

const minimist = require("minimist");
const argv = minimist(process.argv.slice(2));

const readline = require("readline");

const SRC_DIR = path.resolve(process.cwd(), argv.src || "src");
const OUT_DIR = path.resolve(process.cwd(), argv.out || "src/locales");

let newMap = {}; // 用于存储新文件，便于用户确认后写入
let langKeys = []; // 用于处理新文件表头所有语言

function compare(oldData, newData) {
  const [oldHeader, ...oldRows] = oldData;
  const [newHeader, ...newRows] = newData;

  langKeys = oldHeader.slice(1); // ["ZH","EN","JP"]

  // 辅助函数：二维数组转对象 {Key -> {ZH,EN,JP}}
  const toMap = (rows, header) => {
    const keys = header.slice(1);
    const map = {};
    rows.forEach((row) => {
      const obj = {};
      keys.forEach((k, idx) => {
        obj[k] = row[idx + 1];
      });
      map[row[0]] = obj;
    });
    return map;
  };

  const oldMap = toMap(oldRows, oldHeader);
  newMap = toMap(newRows, newHeader);

  const added = [];
  const deleted = [];
  const changed = [];

  const allKeys = new Set([...Object.keys(oldMap), ...Object.keys(newMap)]);

  allKeys.forEach((key) => {
    const oldItem = oldMap[key];
    const newItem = newMap[key];

    if (!oldItem && newItem) {
      added.push(key);
    } else if (oldItem && !newItem) {
      deleted.push(key);
    } else if (oldItem && newItem) {
      // 判断基准语言值是否变化
      const changes = { key };
      langKeys.forEach((baseLang) => {
        if (oldItem[baseLang] !== newItem[baseLang]) {
          changes[baseLang + "_old"] = oldItem[baseLang];
          changes[baseLang + "_new"] = newItem[baseLang];
        }
      });
      if (Object.keys(changes).length > 1) {
        changed.push(changes);
      }
    }
  });

  return { added, deleted, changed };
}

function askQuestion(question) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    rl.question(question + " (y/n): ", (answer) => {
      rl.close();
      resolve(answer.toLowerCase() === "y" || answer.toLowerCase() === "yes");
    });
  });
}

function readExcel(importPath) {
  const workbook = XLSX.readFile(importPath);
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
  return data;
}

function reverseObj(key, val = "", obj = {}) {
  const keys = key.split(".");
  let tmp = obj;

  keys.forEach((k, i) => {
    if (i === keys.length - 1) {
      tmp[k] = val; // 最后一级赋值
    } else {
      tmp[k] = tmp[k] || {}; // 中间层必须是对象
      tmp = tmp[k]; // 进入下一层
    }
  });
}

function rewriteJSON(newMap, langs) {
  const rewrite = {};
  const allKeys = Object.keys(newMap);
  langs.forEach((lang) => {
    allKeys.forEach((key) => {
      reverseObj(key, newMap[key]?.[lang], (rewrite[lang] = rewrite[lang] || {}));
    });
  });
  return rewrite;
}

(async function main() {
  const exportPath = path.join(SRC_DIR, "export.json");
  const importPath = path.join(SRC_DIR, "import.xlsx");
  // const importJSON = JSON.parse(fs.readFileSync(importPath, "utf-8"));
  const importJSON = readExcel(importPath);
  fs.writeFileSync(path.join(SRC_DIR, "import.json"), JSON.stringify(importJSON, null, 2), "utf-8");
  let exportFileData = null;
  try {
    const data = fs.readFileSync(exportPath, "utf-8");
    exportFileData = data;
  } catch (e) {
    console.log(e.message);
  }
  const exportJSON = exportFileData ? JSON.parse(exportFileData) : {};
  const res = compare(exportJSON, importJSON);
  confirm = await askQuestion(
    `当前修改项是这些: ${JSON.stringify(res, null, 2)}, 你确定要重写当前翻译文件吗？`
  );
  if (confirm) {
    console.log("用户确认重写✅");
    const rewriteData = rewriteJSON(newMap, langKeys);
    Object.keys(rewriteData).forEach((lang) => {
      const outpath = path.join(OUT_DIR, `${lang.toLowerCase()}.json`);
      fs.writeFileSync(outpath, JSON.stringify(rewriteData[lang], null, 2), "utf-8");
      const jsonPath = path.join(OUT_DIR, "export.json");
      const excelPath = path.join(OUT_DIR, "export.xlsx");
      try {
        fs.unlinkSync(excelPath);
        fs.unlinkSync(jsonPath);
      } catch (e) {
        console.log(`删除export文件失败` + e.message);
      }
    });
  } else {
    console.log("用户取消重写当前翻译文件");
  }
})();
