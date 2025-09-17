import { Heading } from "@/lib/markdown-data";

interface TOCProps {
  headings: Heading[];
  maxDepth?: 4;
}

export default function TOC({ headings, maxDepth = 4 }: TOCProps) {
  return (
    <nav aria-label="Table of contents">
      <ul>
        {headings
          .filter((h) => h.depth <= maxDepth)
          .map((h, idx) => {
            const indent = (h.depth - 1) * 2;
            return (
              <li key={`${h.id}-${idx}`} className={`ml-${indent}`}>
                <a href={`#${h.id}`} className="hover:underline">
                  {h.text}
                </a>
              </li>
            );
          })}
      </ul>
    </nav>
  );
}
