import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import type { DollFact, DollProfile, DollSection, ProfileCollection } from "./types";

type MarkdownNode = {
  type: string;
  depth?: number;
  value?: string;
  url?: string;
  alt?: string;
  children?: MarkdownNode[];
  position?: {
    start?: { offset?: number };
    end?: { offset?: number };
  };
};

const reservedFields = new Set([
  "id",
  "名称",
  "小名",
  "中文名",
  "pageColor",
  "accentColor",
  "heroImage",
  "gallery",
  "tags",
]);

const parser = unified().use(remarkParse).use(remarkGfm);

export function parseDollsMarkdown(source: string): ProfileCollection {
  const tree = parser.parse(source) as MarkdownNode;
  const children = tree.children ?? [];
  const title = children.find((node) => node.type === "heading" && node.depth === 1);
  const profiles = collectProfileRanges(children).map((range) =>
    parseProfile(source, range.heading, range.nodes),
  );

  return {
    title: title ? textFromNode(title) : "Yoshi Profile",
    profiles,
  };
}

function collectProfileRanges(children: MarkdownNode[]) {
  const ranges: Array<{ heading: MarkdownNode; nodes: MarkdownNode[] }> = [];
  let current: { heading: MarkdownNode; nodes: MarkdownNode[] } | null = null;

  for (const node of children) {
    if (node.type === "heading" && node.depth === 2) {
      if (current) {
        ranges.push(current);
      }
      current = { heading: node, nodes: [] };
      continue;
    }

    if (current) {
      current.nodes.push(node);
    }
  }

  if (current) {
    ranges.push(current);
  }

  return ranges;
}

function parseProfile(source: string, heading: MarkdownNode, nodes: MarkdownNode[]): DollProfile {
  const headingName = textFromNode(heading);
  const fields = extractFields(nodes);
  const id = fields.get("id") ?? slugify(headingName);
  const displayName = fields.get("小名") ?? fields.get("中文名") ?? headingName;
  const name = fields.get("名称") ?? headingName;

  return {
    id,
    name,
    displayName,
    pageColor: fields.get("pageColor") ?? "#BDF6D8",
    accentColor: fields.get("accentColor") ?? "#20D7D2",
    heroImage: fields.get("heroImage") ?? "mochi.png",
    gallery: splitList(fields.get("gallery") ?? fields.get("heroImage") ?? "mochi.png"),
    tags: splitList(fields.get("tags") ?? ""),
    facts: buildFacts(fields),
    sections: extractSections(source, nodes),
  };
}

function extractFields(nodes: MarkdownNode[]) {
  const table = nodes.find((node) => node.type === "table");
  const fields = new Map<string, string>();

  for (const row of table?.children ?? []) {
    const cells = row.children ?? [];
    if (cells.length < 2) {
      continue;
    }

    const key = textFromNode(cells[0]).trim();
    const value = textFromNode(cells[1]).trim();

    if (!key || key === "字段") {
      continue;
    }

    fields.set(key, value);
  }

  return fields;
}

function buildFacts(fields: Map<string, string>): DollFact[] {
  return Array.from(fields.entries())
    .filter(([label, value]) => value && !reservedFields.has(label))
    .map(([label, value]) => ({ label, value }));
}

function extractSections(source: string, nodes: MarkdownNode[]): DollSection[] {
  const headings = nodes.filter((node) => node.type === "heading" && node.depth === 3);

  return headings.map((heading, index) => {
    const title = textFromNode(heading);
    const start = heading.position?.end?.offset ?? 0;
    const end = headings[index + 1]?.position?.start?.offset ?? nodes[nodes.length - 1]?.position?.end?.offset;
    const markdown = source.slice(start, end).trim();

    return { title, markdown };
  });
}

export function splitList(value: string): string[] {
  return value
    .split(/[,，]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function textFromNode(node: MarkdownNode): string {
  if (node.value) {
    return node.value;
  }

  if (node.url) {
    return node.url;
  }

  return (node.children ?? []).map(textFromNode).join("");
}
