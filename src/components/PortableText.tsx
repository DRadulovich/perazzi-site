import type { PortableTextBlock } from "@/sanity/queries/utils";
import { cn } from "@/lib/utils";

type PortableTextProps = Readonly<{
  blocks?: PortableTextBlock[] | null;
  className?: string;
}>;

type PortableTextChild = {
  text?: string;
};

type PortableTextBlockShape = {
  _type?: string;
  _key?: string;
  style?: string;
  listItem?: string;
  children?: PortableTextChild[];
};

const hashString = (value: string) => {
  let hash = 5381;
  for (const char of value) {
    const codePoint = char.codePointAt(0);
    if (codePoint === undefined) continue;
    hash = (hash * 33) ^ codePoint;
  }
  return (hash >>> 0).toString(36);
};

const getBlockKey = (block: PortableTextBlockShape) => {
  if (typeof block._key === "string" && block._key.length > 0) {
    return block._key;
  }
  try {
    return `block-${hashString(JSON.stringify(block))}`;
  } catch {
    return `block-${hashString(String(block))}`;
  }
};

const getBlockText = (block: PortableTextBlockShape) => {
  const children = Array.isArray(block.children) ? block.children : [];
  return children.map((child) => child?.text ?? "").join("");
};

const renderBlocks = (blocks: PortableTextBlock[]) => {
  const nodes: React.ReactNode[] = [];
  let listType: "bullet" | "number" | null = null;
  let listItems: Array<{ key: string; text: string }> = [];

  const flushList = () => {
    if (!listItems.length || !listType) return;
    const Tag = listType === "number" ? "ol" : "ul";
    const listKey = `list-${hashString(listItems.map((item) => item.key).join("|"))}`;
    nodes.push(
      <Tag key={listKey}>
        {listItems.map((item) => (
          <li key={item.key}>{item.text}</li>
        ))}
      </Tag>,
    );
    listItems = [];
  };

  blocks.forEach((block) => {
    if (!block || typeof block !== "object") return;
    const { _type, style, listItem, children } = block as PortableTextBlockShape;
    if (_type !== "block") return;

    const text = getBlockText({ children });
    const blockKey = getBlockKey(block as PortableTextBlockShape);
    if (listItem) {
      const nextType = listItem === "number" ? "number" : "bullet";
      if (listType && listType !== nextType) {
        flushList();
      }
      listType = nextType;
      if (text) {
        listItems.push({ key: blockKey, text });
      }
      return;
    }

    flushList();
    listType = null;
    if (!text) return;

    if (style === "h2" || style === "h3") {
      const Tag = style;
      nodes.push(<Tag key={blockKey}>{text}</Tag>);
      return;
    }

    nodes.push(<p key={blockKey}>{text}</p>);
  });

  flushList();
  return nodes;
};

export function PortableText({ blocks, className }: PortableTextProps) {
  if (!blocks?.length) return null;
  return <div className={cn(className)}>{renderBlocks(blocks)}</div>;
}
