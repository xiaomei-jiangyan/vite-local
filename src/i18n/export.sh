#!/bin/bash
rm -rf ./export.xlsx
rm -rf ./export.json

# node src/i18n/i18nExact.cjs --src=src/i18n --apply-scripts --out=src/i18n  
# node src/i18n/i18nTranslate.cjs --src=src/i18n --out=src/i18n
# node src/i18n/i18nExport.cjs --src=src/i18n --out=src/i18n

# 提取中文
node src/i18n/i18nExact.cjs --apply-scripts --out=src/locales 
#将中文提交给翻译，生成英文和日文
node src/i18n/i18nTranslate.cjs --src=src/locales --out=src/locales 
#将所有json文件导出为export.xlsx 和 export.json
node src/i18n/i18nExport.cjs --src=src/locales --out=src/locales 

# 如果需要导入翻译json 
# 测试用
# node src/i18n/i18nImport.cjs --src=src/i18n --out=src/i18n
# 正式用
# node src/i18n/i18nImport.cjs --src=src/locales --out=src/locales 
