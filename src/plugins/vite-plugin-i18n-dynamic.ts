// import { Plugin } from "vite";
// import fs from "fs";
// import path from "path";
// import { fileURLToPath } from "url";

// export default function dynamicI18nPlugin(): Plugin {
//   const __filename = fileURLToPath(import.meta.url);
//   const __dirname = path.dirname(__filename);
//   const localesDir = path.resolve(__dirname, "src/locales");
//   return {
//     name: "vite-plugin-i18n-dynamic",
//     resolveId(id) {
//       if (id === "virtual:i18n-dynamic") return id;
//       return null;
//     },
//     load(id) {
//       if (id === "virtual:i18n-dynamic") {
//         const files = fs.readdirSync(localesDir);
//         const imports = files
//           .map((file: any) => {
//             const name = fs.basename(file, ".json");
//             return `'${name}': () => import('@/locales/${file}')`;
//           })
//           .join("\n");
//         return `export default { ${imports} }`;
//       }
//       return null;
//     },
//   };
// }
// vite-plugin-i18n-dynamic.ts
import { Plugin } from "vite";
import fs from "fs";
import path from "path";

export default function i18nDynamicPlugin(localesDir: string): Plugin {
  return {
    name: "vite-plugin-i18n-dynamic",

    resolveId(id) {
      if (id === "virtual:i18n-dynamic") return id;
      if (id === "virtual:i18n-keys") return id;
      return null;
    },

    load(id) {
      if (id === "virtual:i18n-dynamic") {
        const files = fs.readdirSync(localesDir).filter((f: any) => f.endsWith(".json"));
        const imports = files
          .map((f: any) => {
            const locale = path.basename(f, ".json");
            const filePath = "/" + path.posix.join(localesDir, f);
            return `'${locale}': () => import('${filePath}')`;
          })
          .join(",\n");
        return `export default { ${imports} };`;
      }
      if (id === "virtual:i18n-keys") {
        // 取第一个语言文件作为 key 基准
        const files = fs.readdirSync(localesDir).filter((f) => f.endsWith(".json"));
        if (!files.length) return `export type I18nKey = string;`;

        const json = JSON.parse(fs.readFileSync(path.join(localesDir, files[0]), "utf-8"));

        // 扁平化 key
        const flattenKeys = (obj: Record<string, any>, prefix = ""): string[] => {
          return Object.entries(obj).flatMap(([k, v]) => {
            const key = prefix ? `${prefix}.${k}` : k;
            if (typeof v === "object") return flattenKeys(v, key);
            return [key];
          });
        };
        const keys = flattenKeys(json)
          .map((k) => `'${k}'`)
          .join(" | ");
        console.log(111, "keys", keys);
        return `export type I18nKey = ${keys};`;
      }
      return null;
    },
    generateBundle() {},
  };
}
