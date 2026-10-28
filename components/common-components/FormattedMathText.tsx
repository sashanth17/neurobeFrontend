import React, { useEffect, useState } from "react";
import { loadKatex, isKatexAvailable, renderMathInHtml } from "./katexLoader";

export interface FormattedMathTextProps {
  text?: string | null;
  className?: string;
  asBlock?: boolean;
}

export const FormattedMathText: React.FC<FormattedMathTextProps> = ({
  text,
  className = "",
  asBlock = false,
}) => {
  const [katexReady, setKatexReady] = useState(() => isKatexAvailable());

  useEffect(() => {
    loadKatex(() => {
      setKatexReady(true);
    });
  }, []);

  if (!text) return null;

  const processedHtml = renderMathInHtml(text);

  // If text doesn't contain HTML tags and doesn't contain math, render plain text
  const hasHtml = /<[a-z][\s\S]*>/i.test(text);
  const hasMath = /(\$\$[\s\S]*?\$\$|\\\[[\s\S]*?\\\]|\$[^$\n]+?\$|\\\([\s\S]*?\\\))/g.test(text);

  if (!hasHtml && !hasMath) {
    return <span className={className}>{text}</span>;
  }

  const Tag = asBlock ? "div" : "span";

  return (
    <Tag
      className={`rich-text-content katex-rendered ${asBlock ? "block" : "inline"} ${className}`}
      dangerouslySetInnerHTML={{ __html: processedHtml }}
    />
  );
};

export default FormattedMathText;
