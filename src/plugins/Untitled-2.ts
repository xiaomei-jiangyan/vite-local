// vite-plugin-auto-import.ts
import { Plugin } from "vite";
import fs from "fs";
import path from "path";

export default function autoImportComponents(): Plugin {
  const componentsDir = path.resolve(__dirname, "src/components");
  return {
    name: "vite-plugin-auto-import",
    transform(code, id) {
      if (!id.endsWith(".vue")) return null;

      const componentFiles = fs.readdirSync(componentsDir);
      const imports: string[] = [];

      componentFiles.forEach((file) => {
        const name = path.basename(file, ".vue");
        if (new RegExp(`<${name}\\b`).test(code)) {
          imports.push(`import ${name} from './components/${file}'`);
        }
      });

      if (imports.length) {
        return imports.join("\n") + "\n" + code;
      }
      return null;
    },
  };
}

// vite-plugin-bundle-analyze.ts
import { Plugin } from "vite";
import fs from "fs";
import path from "path";

export default function bundleAnalyze(): Plugin {
  return {
    name: "vite-plugin-bundle-analyze",
    generateBundle(_, bundle) {
      const report: Record<string, number> = {};
      for (const [fileName, chunk] of Object.entries(bundle)) {
        if (chunk.type === "chunk") {
          report[fileName] = chunk.code.length;
        }
      }
      fs.writeFileSync(
        path.resolve(__dirname, "bundle-report.json"),
        JSON.stringify(report, null, 2)
      );
      console.log("Bundle analysis report generated.");
    },
  };
}

// vite-plugin-i18n.ts
import { Plugin } from "vite";
import fs from "fs";
import path from "path";

export default function i18nPlugin(): Plugin {
  const localesDir = path.resolve(__dirname, "src/locales");
  return {
    name: "vite-plugin-i18n",
    resolveId(id) {
      if (id === "virtual:i18n") return id;
      return null;
    },
    load(id) {
      if (id === "virtual:i18n") {
        const files = fs.readdirSync(localesDir);
        const imports = files.map((f) => {
          const key = path.basename(f, ".json");
          return `import ${key} from './locales/${f}';`;
        });
        const exportStr = `export default { ${files.map((f) => path.basename(f, ".json")).join(", ")} }`;
        return imports.join("\n") + "\n" + exportStr;
      }
      return null;
    },
  };
}

// vite-plugin-i18n-type.ts
import fs from "fs";
import path from "path";

export default function i18nTypePlugin() {
  const localesDir = path.resolve(__dirname, "src/locales");
  return {
    name: "vite-plugin-i18n-type",
    buildStart() {
      const files = fs.readdirSync(localesDir);
      const keys = Object.keys(
        JSON.parse(fs.readFileSync(path.join(localesDir, files[0]), "utf-8"))
      );
      const typeContent = `export type I18nKey = ${keys.map((k) => `'${k}'`).join(" | ")};`;
      fs.writeFileSync(path.resolve(__dirname, "src/types/i18n.d.ts"), typeContent);
    },
  };
}
