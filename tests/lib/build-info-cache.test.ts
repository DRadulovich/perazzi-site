import { describe, it, expect } from "vitest";
import { mergeOptionResults } from "@/lib/build-info-cache";

describe("mergeOptionResults", () => {
  it("builds a map and flat list from option results", () => {
    const input = [
      { option: "A", items: [{ id: "1" }, { id: "2" }] },
      { option: "B", items: [{ id: "3" }] },
    ];

    const { map, flat } = mergeOptionResults(input);

    expect(map.A).toHaveLength(2);
    expect(map.B).toHaveLength(1);
    expect(flat.map((i) => i.id)).toEqual(["1", "2", "3"]);
  });

  it("handles empty input", () => {
    const { map, flat } = mergeOptionResults([]);
    expect(map).toEqual({});
    expect(flat).toEqual([]);
  });
});
