import ToolsAccordin from "@/components/client/user-tools/tools-accordin";
import SectionTitle from "@/components/section-title";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "小工具",
};

export default function Tool() {
  return (
    <>
      <main className="flex flex-col gap-4 md:pl-16 md:pr-16 pt-8 min-h-[83vh]">
        <SectionTitle title="一些自用小工具" />
        <div className="flex flex-row flex-wrap min-w-128 max-w-512 text-on-surface">
          <ToolsAccordin />
        </div>
      </main>
    </>
  );
}
