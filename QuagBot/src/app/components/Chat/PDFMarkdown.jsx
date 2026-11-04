import React, { Children, cloneElement, isValidElement } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Link, StyleSheet, Text, View } from '@react-pdf/renderer';

// Renders markdown inside a @react-pdf/renderer <Document>.
//
// MarkdownMessage can't be used here: it maps markdown to DOM elements (<p>,
// <strong>, ...) styled with Tailwind classes. react-pdf has its own renderer
// that only understands its primitives (View, Text, Link, ...) and has no CSS,
// so it rejects those elements and drops the text. This file reuses the same
// parser (react-markdown + remark-gfm) but maps every markdown element to
// react-pdf primitives and plain style objects instead.

const styles = StyleSheet.create({
  p: { fontSize: 12, lineHeight: 1.5, color: '#333333', marginBottom: 8 },
  h1: { fontSize: 20, fontWeight: 'bold', color: '#111111', marginTop: 12, marginBottom: 6 },
  h2: { fontSize: 17, fontWeight: 'bold', color: '#111111', marginTop: 10, marginBottom: 5 },
  h3: { fontSize: 14.5, fontWeight: 'bold', color: '#111111', marginTop: 8, marginBottom: 4 },
  h4: { fontSize: 12.5, fontWeight: 'bold', color: '#111111', marginTop: 6, marginBottom: 3 },
  strong: { fontWeight: 'bold' },
  em: { fontStyle: 'italic' },
  del: { textDecoration: 'line-through' },
  code: { fontFamily: 'Courier', backgroundColor: '#eeeeee' },
  link: { color: '#1a56db', textDecoration: 'underline' },
  list: { marginBottom: 8 },
  li: { flexDirection: 'row', marginBottom: 3 },
  marker: { width: 18, fontSize: 12, lineHeight: 1.5, color: '#333333' },
  liBody: { flex: 1 },
  liText: { fontSize: 12, lineHeight: 1.5, color: '#333333' },
  blockquote: { borderLeftWidth: 3, borderLeftColor: '#bbbbbb', paddingLeft: 10, marginBottom: 8 },
  pre: { backgroundColor: '#f3f3f3', padding: 8, marginBottom: 8 },
  preText: { fontFamily: 'Courier', fontSize: 10.5, lineHeight: 1.4, color: '#222222' },
  hr: { borderBottomWidth: 1, borderBottomColor: '#cccccc', marginVertical: 10 },
  table: { borderTopWidth: 1, borderLeftWidth: 1, borderColor: '#bbbbbb', marginBottom: 8 },
  tr: { flexDirection: 'row' },
  cell: { flex: 1, padding: 4, borderRightWidth: 1, borderBottomWidth: 1, borderColor: '#bbbbbb' },
  cellText: { fontSize: 11, lineHeight: 1.4, color: '#333333' },
  th: { fontWeight: 'bold' },
});

// react-pdf rejects any string that isn't inside <Text>. react-markdown puts
// "\n" text nodes between block elements, and block-level raw HTML arrives as
// a bare text node, so in containers that only hold blocks we drop the blank
// strings and wrap any real text in a paragraph. Inline containers (p, li, td,
// ...) are left alone because their spaces matter.
const BLOCK_PARENTS = new Set(['root', 'section', 'ul', 'ol', 'blockquote', 'table', 'thead', 'tbody', 'tr']);

function rehypeBlockTextOnly() {
  return (tree) => {
    const walk = (node) => {
      if (!node.children) return;
      const name = node.type === 'root' ? 'root' : node.tagName;
      if (BLOCK_PARENTS.has(name)) {
        // "raw" is HTML that react-markdown turns into plain text after plugins run.
        const isText = (child) => child.type === 'text' || child.type === 'raw';
        node.children = node.children
          .filter((child) => !(isText(child) && !child.value.trim()))
          .map((child) =>
            isText(child) ? { type: 'element', tagName: 'p', properties: {}, children: [child] } : child
          );
      }
      node.children.forEach(walk);
    };
    walk(tree);
  };
}

const hastText = (node) => (node.type === 'text' ? node.value : (node.children ?? []).map(hastText).join(''));
const isBlank = (child) => typeof child === 'string' && !child.trim();

const heading = (style) =>
  function Heading({ children }) {
    // Keep a heading from being stranded at the bottom of a page.
    return <Text style={style} minPresenceAhead={40}>{children}</Text>;
  };

function Paragraph({ children }) {
  return <Text style={styles.p}>{children}</Text>;
}

function List({ ordered, start = 1, children }) {
  return (
    <View style={styles.list}>
      {Children.toArray(children).map((item, i) =>
        isValidElement(item) ? cloneElement(item, { marker: ordered ? `${start + i}.` : '•' }) : item
      )}
    </View>
  );
}

// A list item holds a mix of inline text and block elements (nested lists,
// paragraphs in "loose" lists). Runs of inline content go into one <Text>;
// blocks are kept as they are.
function ListItem({ marker, children }) {
  const out = [];
  let run = [];
  const flush = () => {
    while (run.length && isBlank(run[0])) run.shift();
    while (run.length && isBlank(run[run.length - 1])) run.pop();
    if (run.length) out.push(<Text key={`run-${out.length}`} style={styles.liText}>{run}</Text>);
    run = [];
  };
  Children.toArray(children).forEach((child) => {
    if (isValidElement(child) && BLOCK_TYPES.has(child.type)) {
      flush();
      out.push(child);
    } else {
      run.push(child);
    }
  });
  flush();

  return (
    <View style={styles.li}>
      <Text style={styles.marker}>{marker}</Text>
      <View style={styles.liBody}>{out}</View>
    </View>
  );
}

function CodeBlock({ node }) {
  return (
    <View style={styles.pre}>
      <Text style={styles.preText}>{hastText(node).replace(/\n$/, '')}</Text>
    </View>
  );
}

const components = {
  p: Paragraph,
  h1: heading(styles.h1),
  h2: heading(styles.h2),
  h3: heading(styles.h3),
  h4: heading(styles.h4),
  h5: heading(styles.h4),
  h6: heading(styles.h4),
  ul: ({ children }) => <List>{children}</List>,
  ol: ({ start, children }) => <List ordered start={start}>{children}</List>,
  li: ListItem,
  blockquote: ({ children }) => <View style={styles.blockquote}>{children}</View>,
  pre: CodeBlock,
  hr: () => <View style={styles.hr} />,
  table: ({ children }) => <View style={styles.table}>{children}</View>,
  thead: ({ children }) => <View>{children}</View>,
  tbody: ({ children }) => <View>{children}</View>,
  tr: ({ children }) => <View style={styles.tr} wrap={false}>{children}</View>,
  th: ({ children }) => (
    <View style={styles.cell}>
      <Text style={[styles.cellText, styles.th]}>{children}</Text>
    </View>
  ),
  td: ({ children }) => (
    <View style={styles.cell}>
      <Text style={styles.cellText}>{children}</Text>
    </View>
  ),
  // Inline elements: nested <Text> inherits the parent's size and color.
  strong: ({ children }) => <Text style={styles.strong}>{children}</Text>,
  em: ({ children }) => <Text style={styles.em}>{children}</Text>,
  del: ({ children }) => <Text style={styles.del}>{children}</Text>,
  code: ({ children }) => <Text style={styles.code}>{children}</Text>,
  a: ({ href, children }) => <Link src={href} style={styles.link}>{children}</Link>,
  // The parser already emits a "\n" text node after every <br>, which react-pdf
  // renders as a line break, so the <br> itself must add nothing.
  br: () => null,
  input: ({ checked }) => <Text>{checked ? '[x] ' : '[ ] '}</Text>, // GFM task list checkbox
};

const BLOCK_TAGS = ['p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'blockquote', 'pre', 'hr', 'table'];
const BLOCK_TYPES = new Set(BLOCK_TAGS.map((tag) => components[tag]));

// Anything not listed (images, footnotes, raw HTML) is unwrapped to its text
// instead of reaching react-pdf as an element it can't render.
const ALLOWED_ELEMENTS = Object.keys(components);

function PDFMarkdown({ text }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      rehypePlugins={[rehypeBlockTextOnly]}
      components={components}
      allowedElements={ALLOWED_ELEMENTS}
      unwrapDisallowed
    >
      {String(text ?? '')}
    </ReactMarkdown>
  );
}

export default PDFMarkdown;
