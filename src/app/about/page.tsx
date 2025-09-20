import BlogActivitySection from "@/components/client/activity/blog-activity-section";
import Cover from "@/components/cover";
import Profile from "@/components/profile";
import SectionTitle from "@/components/section-title";
import EasterEggAvatar from "@/components/ux/easter-egg/easter-egg-avatar";
import { Metadata } from "next";

export const revalidate = 0;
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "关于",
};

export default function About() {
  return (
    <>
      <div className="relative -mt-16 mb-8">
        <Cover>
          <section className="absolute top-0 left-0 w-full h-full flex flex-row flex-wrap gap-8 justify-center items-center">
            <EasterEggAvatar className="mt-16 block md:hidden" />
            <Profile className="pt-16 md:pt-0 hidden md:block" />
            <div className="flex flex-col gap-4 items-center flex-wrap">
              <h1 className="text-3xl md:text-4xl text-center text-white mb-8 md:mb-0">
                这里是Apry的笔记本, 一个记录每天的新发现的地方✨
              </h1>
            </div>
          </section>
        </Cover>
      </div>
      <main>
        <section className="flex flex-col gap-4 pl-16 pr-16">
          <SectionTitle title="关于这个博客" />
          <p className="text-on-surface text-lg">
            Apry目前是快要毕业的大学生,
            喜欢钻研捣(zhe)鼓(teng)各种计算机和数学问题, 也会画画旅行这些。
            这个博客的建立初衷是为了分享对网络上很难找到答案的问题的,
            自己提出的相对成熟的解决方案, 顺便放一些自己的随笔啦,
            也是便于自己平时使用。
          </p>
          <p className="text-on-surface text-lg">
            Apry很喜欢Material You, 同时经常用Next.js写web app,
            就在博客上愉快地结合了它们俩~
          </p>
        </section>
        <section className="flex flex-col gap-4 mt-8 pl-16 pr-16">
          <SectionTitle title="发现问题了吗?" />
          <p className="text-on-surface text-lg">
            这是我第一次写非web app的网站, 所以可能有经验不足。此外,
            博客非常注重可访问性和无障碍! <br />
            如果遇到了问题或者有任何建议, 欢迎前往博客的Github仓库提出。大胆来!
            随时来! 快点来! (很难拒绝别人)
          </p>
        </section>
        <BlogActivitySection className="pl-16 mt-8 mb-8" />
      </main>
    </>
  );
}
