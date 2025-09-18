import ToolsAccordin from "@/components/client/user-tools/tools-accordin";
import SectionTitle from "@/components/section-title";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "小工具",
};

export default function Tool() {
  return (
    <>
      <main className="flex flex-col gap-4 md:pl-16 md:pr-16 pt-8 pl-4 pr-4 min-h-[83vh] max-w-[100vw]">
        <SectionTitle title="一些自用小工具" />
        <div className="flex flex-row flex-wrap text-on-surface">
          <ToolsAccordin />
        </div>
      </main>
    </>
  );
}
