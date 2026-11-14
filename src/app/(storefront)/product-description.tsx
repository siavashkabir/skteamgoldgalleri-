export default function ProductDescription({
  description,
}: {
  description: string;
}) {
  return (
    <div className="space-y-3 text-sm leading-7 text-[#aaa79b]">
      {description.split(/\r?\n/).map((line, index) => {
        const trimmed = line.trim();
        if (!trimmed) {
          return null;
        }
        const heading = trimmed.match(/^(#{1,3})\s+(.+)$/);
        if (heading) {
          return (
            <h3 className="pt-2 font-semibold text-[#e9e5db]" key={index}>
              {renderInline(heading[2])}
            </h3>
          );
        }
        const listItem = trimmed.match(/^(?:[-*]|\d+\.)\s+(.+)$/);
        if (listItem) {
          return (
            <p className="flex gap-2" key={index}>
              <span className="text-[#d6ad56]">•</span>
              <span>{renderInline(listItem[1])}</span>
            </p>
          );
        }
        return <p key={index}>{renderInline(trimmed)}</p>;
      })}
    </div>
  );
}

function renderInline(text: string) {
  return text.split(/(\*\*[^*]+\*\*|`[^`]+`|\*[^*]+\*)/g).map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={index}>{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith("`") && part.endsWith("`")) {
      return (
        <code
          className="rounded bg-white/[0.06] px-1.5 py-0.5 text-[#e2c16d]"
          key={index}
        >
          {part.slice(1, -1)}
        </code>
      );
    }
    if (part.startsWith("*") && part.endsWith("*")) {
      return <em key={index}>{part.slice(1, -1)}</em>;
    }
    return part;
  });
}
