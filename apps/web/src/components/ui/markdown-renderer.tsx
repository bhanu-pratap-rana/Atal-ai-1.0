"use client";

import React, { ReactNode, InputHTMLAttributes } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeSanitize from "rehype-sanitize";
import rehypeRaw from "rehype-raw";

interface MarkdownRendererProps {
  readonly content: string;
  readonly className?: string;
}

// React Markdown component prop types
interface CodeProps {
  readonly node?: unknown;
  readonly inline?: boolean;
  readonly className?: string;
  readonly children?: ReactNode;
}

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  readonly node?: unknown;
}

interface MarkdownNodeProps {
  readonly node?: unknown;
  readonly children?: ReactNode;
  readonly [key: string]: unknown;
}

/**
 * Markdown component definitions - extracted to prevent inline component violations
 * Each handler properly types its props and renders semantic HTML
 *
 * Note: S6850 is a false positive for heading components.
 * Content is provided via children prop from parsed markdown, spread via ...props.
 *
 * NOTE: Using Record<string, unknown> with eslint-disable because react-markdown's
 * Components type has strict constraints that conflict with our simplified prop types.
 * Each component handler IS properly typed internally via MarkdownNodeProps/CodeProps/InputProps.
 */
const markdownComponents: Record<string, unknown> = {
          // Headings with semantic sizing and primary color
          h1: ({ node: _node, ...props }: MarkdownNodeProps) => (
            <h1 // NOSONAR S6850: Content comes from markdown via children prop
              className="text-3xl font-bold mb-4 text-primary leading-tight"
              {...props}
            />
          ),
          h2: ({ node: _node, ...props }: MarkdownNodeProps) => (
            <h2 // NOSONAR S6850: Content comes from markdown via children prop
              className="text-2xl font-semibold mb-3 text-primary leading-tight mt-6"
              {...props}
            />
          ),
          h3: ({ node: _node, ...props }: MarkdownNodeProps) => (
            <h3 // NOSONAR S6850: Content comes from markdown via children prop
              className="text-xl font-semibold mb-2 text-primary leading-tight mt-4"
              {...props}
            />
          ),
          h4: ({ node: _node, ...props }: MarkdownNodeProps) => (
            <h4 // NOSONAR S6850: Content comes from markdown via children prop
              className="text-lg font-semibold mb-2 leading-tight mt-3"
              {...props}
            />
          ),
          h5: ({ node: _node, ...props }: MarkdownNodeProps) => (
            <h5 // NOSONAR S6850: Content comes from markdown via children prop
              className="text-base font-semibold mb-2 leading-tight mt-2"
              {...props}
            />
          ),
          h6: ({ node: _node, ...props }: MarkdownNodeProps) => (
            <h6 // NOSONAR S6850: Content comes from markdown via children prop
              className="text-sm font-semibold mb-2 text-text-secondary leading-tight mt-2"
              {...props}
            />
          ),

          // Paragraph with proper spacing
          p: ({ node: _node, ...props }: MarkdownNodeProps) => (
            <p className="mb-4 leading-7 text-text-primary" {...props} />
          ),

          // Lists with proper indentation
          ul: ({ node: _node, ...props }: MarkdownNodeProps) => (
            <ul
              className="list-disc list-inside mb-4 space-y-2 text-text-primary"
              {...props}
            />
          ),
          ol: ({ node: _node, ...props }: MarkdownNodeProps) => (
            <ol
              className="list-decimal list-inside mb-4 space-y-2 text-text-primary"
              {...props}
            />
          ),
          li: ({ node: _node, ...props }: MarkdownNodeProps) => (
            <li className="ml-2 leading-7" {...props} />
          ),

          // Code with syntax highlighting background
          code: (props: CodeProps) => {
            const { node: _node, inline, ...rest } = props;
            return inline ? (
              <code
                className="bg-surface px-1.5 py-0.5 rounded text-sm font-mono text-error dark:text-error/80 break-words"
                {...rest}
              />
            ) : (
              <pre className="bg-surface border border-border rounded-lg overflow-x-auto p-4 mb-4">
                <code
                  className="font-mono text-sm text-text-primary block"
                  {...rest}
                />
              </pre>
            );
          },

          // Links with accessible styling
          a: ({ node: _node, ...props }: MarkdownNodeProps) => (
            <a // NOSONAR S6827: Content comes from markdown via children prop
              className="text-primary hover:text-primary/80 underline underline-offset-2 break-words"
              target="_blank"
              rel="noopener noreferrer"
              {...props}
            />
          ),

          // Blockquotes with left border
          blockquote: ({ node: _node, ...props }: MarkdownNodeProps) => (
            <blockquote
              className="border-l-4 border-primary pl-4 italic my-4 text-text-secondary bg-surface/30 py-2 pr-4 rounded-r"
              {...props}
            />
          ),

          // Horizontal rule
          hr: ({ node: _node, ...props }: MarkdownNodeProps) => (
            <hr className="my-6 border-border" {...props} />
          ),

          // Tables (GFM)
          // Note: Markdown tables should include headers (| Header 1 | Header 2 |) for accessibility
          // SonarQube S5256: Tables should have header rows for screen readers
          table: ({ node: _node, children, ...props }: MarkdownNodeProps) => (
            <div className="overflow-x-auto mb-4">
              <table
                className="w-full border-collapse border border-border rounded-lg"
                role="table"
                {...props}
              >
                {children}
              </table>
            </div>
          ),
          thead: ({ node: _node, ...props }: MarkdownNodeProps) => (
            <thead className="bg-surface" {...props} />
          ),
          tbody: ({ node: _node, ...props }: MarkdownNodeProps) => <tbody {...props} />,
          tr: ({ node: _node, ...props }: MarkdownNodeProps) => (
            <tr className="border-b border-border" {...props} />
          ),
          th: ({ node: _node, ...props }: MarkdownNodeProps) => (
            <th
              className="border border-border px-4 py-2 text-left font-semibold text-text-primary bg-surface"
              {...props}
            />
          ),
          td: ({ node: _node, ...props }: MarkdownNodeProps) => (
            <td
              className="border border-border px-4 py-2 text-text-primary"
              {...props}
            />
          ),

          // Task lists (GFM)
          input: ({ type, checked, ...props }: InputProps) =>
            type === "checkbox" ? (
              <input
                type="checkbox"
                checked={checked}
                disabled
                className="mr-2 cursor-not-allowed"
                {...props}
              />
            ) : null,

          // Strikethrough (GFM) - handled by remark-gfm as <del>
          del: ({ node: _node, ...props }: MarkdownNodeProps) => (
            <del className="line-through text-text-secondary" {...props} />
          ),
        };

/**
 * Secure markdown renderer with GitHub Flavored Markdown support
 * - XSS protection via rehype-sanitize
 * - Supports tables, strikethrough, task lists (GFM)
 * - Theming via CSS variables (dark mode support)
 * - Accessibility: semantic HTML maintained
 */
export function MarkdownRenderer({
  content,
  className,
}: MarkdownRendererProps) {
  return (
    <div
      className={className || "prose prose-slate dark:prose-invert max-w-none"}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw, rehypeSanitize]}
        components={markdownComponents}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
