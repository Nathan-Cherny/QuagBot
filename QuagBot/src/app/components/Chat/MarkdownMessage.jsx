import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

// Tailwind's reset strips the default look of headings, lists, etc., so every
// element QuagBot's replies can contain is styled here. Sizes are in em so they
// follow the font size chosen in ChatSettings, and `node` is pulled out of the
// props so it never reaches the DOM.
const components = {
  p: ({ node, ...props }) => <p className="my-2 first:mt-0 last:mb-0" {...props} />,
  h1: ({ node, ...props }) => <h1 className="mt-3 mb-2 text-[1.4em] font-semibold first:mt-0" {...props} />,
  h2: ({ node, ...props }) => <h2 className="mt-3 mb-2 text-[1.25em] font-semibold first:mt-0" {...props} />,
  h3: ({ node, ...props }) => <h3 className="mt-3 mb-2 text-[1.1em] font-semibold first:mt-0" {...props} />,
  h4: ({ node, ...props }) => <h4 className="mt-2 mb-1 font-semibold first:mt-0" {...props} />,
  h5: ({ node, ...props }) => <h5 className="mt-2 mb-1 font-semibold first:mt-0" {...props} />,
  h6: ({ node, ...props }) => <h6 className="mt-2 mb-1 font-semibold first:mt-0" {...props} />,
  ul: ({ node, ...props }) => <ul className="my-2 list-disc pl-6 first:mt-0 last:mb-0" {...props} />,
  ol: ({ node, ...props }) => <ol className="my-2 list-decimal pl-6 first:mt-0 last:mb-0" {...props} />,
  li: ({ node, ...props }) => <li className="my-1" {...props} />,
  a: ({ node, ...props }) => (
    <a className="text-accent underline" target="_blank" rel="noopener noreferrer" {...props} />
  ),
  blockquote: ({ node, ...props }) => (
    <blockquote className="my-2 border-l-4 border-border pl-space-3 text-text-muted" {...props} />
  ),
  hr: ({ node, ...props }) => <hr className="my-3 border-border" {...props} />,
  // Inline code. Code inside a fenced block resets these styles via `pre`.
  code: ({ node, ...props }) => (
    <code className="rounded-[4px] bg-black/10 px-[0.35em] py-[0.1em] font-mono text-[0.9em]" {...props} />
  ),
  pre: ({ node, ...props }) => (
    <pre
      className="my-2 overflow-x-auto rounded-card bg-black/10 p-space-3 whitespace-pre [&>code]:bg-transparent [&>code]:p-0"
      {...props}
    />
  ),
  table: ({ node, ...props }) => (
    <div className="my-2 overflow-x-auto">
      <table className="border-collapse text-left" {...props} />
    </div>
  ),
  th: ({ node, ...props }) => <th className="border border-border px-space-2 py-1 font-semibold" {...props} />,
  td: ({ node, ...props }) => <td className="border border-border px-space-2 py-1" {...props} />,
};

// Renders the bot's reply as markdown. Raw HTML in the text is not rendered.
function MarkdownMessage({ text }) {
  return (
    <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
      {text}
    </ReactMarkdown>
  );
}

export default MarkdownMessage;
