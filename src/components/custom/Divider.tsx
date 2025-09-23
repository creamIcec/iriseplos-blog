interface DividerProps {
  responsiveHidden?: boolean;
}

export default function Divider({ responsiveHidden = true }: DividerProps) {
  return (
    <div
      className={`${
        responsiveHidden ? "hidden md:block" : "block"
      } w-px bg-outline-variant ml-4 mr-4 self-stretch`}
    />
  );
}
