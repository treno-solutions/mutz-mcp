import { readFile, writeFile, mkdir } from "node:fs/promises";
import { dirname } from "node:path";

interface RawNode {
  level: number;
  identification: string;
  typ: number;
  modification: string;
  descriptions: Record<string, string>;
  childrens: RawNode[];
  accountInformation?: {
    accountNumber: number;
    classificationarea: string;
    iso: string;
    unit: string;
    generalledgerreference: number;
    accounttype: number;
    showbalance: boolean;
    inactive: boolean;
    tax: boolean;
    taxcode: string;
    taxfixed: boolean;
    category: string;
    creation: string;
    allownegativebalance: boolean;
    allowmanualentry: boolean;
    quantitymandatory: boolean;
    blockeduntil: string;
  };
  collectiveAccount?: boolean;
}

interface TransformedAccount {
  nr: string;
  name: { de: string; fr: string };
  area: string;
  group: { de: string[]; fr: string[] };
  currency: string;
  isIncome: boolean;
  hasTax: boolean;
}

interface GroupPath {
  de: string;
  fr: string;
}

function flatten(
  node: RawNode,
  path: GroupPath[],
): TransformedAccount[] {
  const results: TransformedAccount[] = [];

  const currentPath: GroupPath = {
    de: node.descriptions.de ?? "",
    fr: node.descriptions.fr ?? "",
  };

  const nextPath = [...path, currentPath];

  if (node.accountInformation) {
    const info = node.accountInformation;
    results.push({
      nr: String(info.accountNumber),
      name: {
        de: node.descriptions.de ?? "",
        fr: node.descriptions.fr ?? "",
      },
      area: info.classificationarea,
      group: {
        de: nextPath.slice(0, -1).map((p) => p.de),
        fr: nextPath.slice(0, -1).map((p) => p.fr),
      },
      currency: info.iso,
      isIncome: info.accounttype === 1,
      hasTax: info.tax,
    });
  }

  for (const child of node.childrens ?? []) {
    results.push(...flatten(child, nextPath));
  }

  return results;
}

async function main(): Promise<void> {
  const inputPath = process.argv[2];
  const outputPath = process.argv[3];

  if (!inputPath || !outputPath) {
    console.error("Usage: tsx transform-kontenplan.ts <input.json> <output.json>");
    process.exit(1);
  }

  console.log(`Reading: ${inputPath}`);
  const rawBuf = await readFile(inputPath);
  const raw = rawBuf.toString("utf-8").replace(/\uFFFD/g, "e");
  const source: { root: RawNode } = JSON.parse(raw);

  console.log("Flattening hierarchy...");
  const accounts = flatten(source.root, []);

  console.log(`Transformed ${accounts.length} accounts`);

  const output = { accounts };

  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, JSON.stringify(output, null, 2), "utf-8");
  console.log(`Written to: ${outputPath}`);
}

main().catch((error: unknown) => {
  console.error("Error:", error);
  process.exit(1);
});