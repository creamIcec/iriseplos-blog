export default function Divider({
  orientation = "horizontal",
  className = "",
}) {
  if (orientation === "vertical") {
    return <div className={`w-px bg-outline-variant ${className}`} />;
  }
  return <div className={`h-px bg-outline-variant ${className}`} />;
}
