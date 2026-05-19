import { describe, expect, it } from "vitest";
import { parseDollsMarkdown, splitList } from "../lib/markdownProfile";

const sample = `# Test Profiles

## Momo

| 字段 | 值 |
| --- | --- |
| id | momo |
| 名称 | Momo |
| 小名 | 桃桃 |
| 生日 | 1月1日 |
| 描述 | 桃子色云朵玩偶。 |
| 个性 | 温柔、慢热 |
| 出生地 | 云朵街 |
| pageColor | #FFD2B8 |
| accentColor | #FF8A4B |
| heroImage | momo.png |
| gallery | momo.png, kiki.png |
| tags | 温柔, 午睡 |

### 性格

很慢，也很可靠。

## No Field Doll

### 小故事

没有表格也可以 fallback。
`;

describe("parseDollsMarkdown", () => {
  it("parses heading, fields, tags, gallery and sections", () => {
    const collection = parseDollsMarkdown(sample);

    expect(collection.title).toBe("Test Profiles");
    expect(collection.profiles).toHaveLength(2);
    expect(collection.profiles[0]).toMatchObject({
      id: "momo",
      name: "Momo",
      displayName: "桃桃",
      pageColor: "#FFD2B8",
      accentColor: "#FF8A4B",
      heroImage: "momo.png",
      gallery: ["momo.png", "kiki.png"],
      tags: ["温柔", "午睡"],
    });
    expect(collection.profiles[0].facts).toContainEqual({ label: "生日", value: "1月1日" });
    expect(collection.profiles[0].facts).toContainEqual({ label: "描述", value: "桃子色云朵玩偶。" });
    expect(collection.profiles[0].facts).toContainEqual({ label: "个性", value: "温柔、慢热" });
    expect(collection.profiles[0].facts).toContainEqual({ label: "出生地", value: "云朵街" });
    expect(collection.profiles[0].facts).not.toContainEqual({ label: "小名", value: "桃桃" });
    expect(collection.profiles[0].sections[0]).toMatchObject({
      title: "性格",
      markdown: "很慢，也很可靠。",
    });
  });

  it("falls back when optional fields are missing", () => {
    const profile = parseDollsMarkdown(sample).profiles[1];

    expect(profile.id).toBe("no-field-doll");
    expect(profile.name).toBe("No Field Doll");
    expect(profile.gallery).toEqual(["mochi.png"]);
    expect(profile.sections[0].title).toBe("小故事");
  });
});

describe("splitList", () => {
  it("supports English and Chinese commas", () => {
    expect(splitList("a, b，c")).toEqual(["a", "b", "c"]);
  });
});
