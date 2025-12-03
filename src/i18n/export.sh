#!/bin/bash
rm -rf ./export.xlsx
rm -rf ./export.json

# 提取中文
node src/i18n/i18nExact.cjs --src=src/i18n --apply-scripts --out=src/i18n  

#将中文提交给翻译，生成英文和日文
#node src/i18n/i18nTranslate.cjs --src=src/i18n --out=src/i18n

#将所有json文件导出为export.xlsx 和 export.json
# node src/i18n/i18nExport.cjs --src=src/i18n --out=src/i18n
