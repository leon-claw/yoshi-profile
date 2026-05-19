import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

type MarkdownBlockProps = {
  markdown: string;
};

export function MarkdownBlock({ markdown }: MarkdownBlockProps) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        p: ({ children }) => <p className="markdown-copy">{children}</p>,
        strong: ({ children }) => <strong className="markdown-strong">{children}</strong>,
        ul: ({ children }) => <ul className="markdown-list">{children}</ul>,
        li: ({ children }) => <li>{children}</li>,
      }}
    >
      {markdown}
    </ReactMarkdown>
  );
}
