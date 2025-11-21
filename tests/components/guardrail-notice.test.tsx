import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { GuardrailNotice } from "@/components/concierge/GuardrailNotice";

describe("GuardrailNotice", () => {
  it("renders low confidence note", () => {
    const html = renderToStaticMarkup(<GuardrailNotice status="low_confidence" />);
    expect(html).toContain("based on limited information");
  });

  it("renders blocked note", () => {
    const html = renderToStaticMarkup(<GuardrailNotice status="blocked" />);
    expect(html).toContain("Policy-limited");
  });

  it("renders nothing for ok", () => {
    const html = renderToStaticMarkup(<GuardrailNotice status="ok" />);
    expect(html).toBe("");
  });
});
