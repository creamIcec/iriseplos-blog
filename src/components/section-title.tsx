interface SectionTitleProps {
  title?: string;
  className?: string;
}

export default function SectionTitle({ title, className }: SectionTitleProps) {
  return (
    <h3 className={`text-3xl md:text-4xl text-on-surface ${className}`}>
      {title}
    </h3>
  );
}
