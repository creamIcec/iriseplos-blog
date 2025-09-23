import Calendar from "@/components/client/calendar";
import ContentCard from "@/components/content-card";
import Cover from "@/components/cover";
import Divider from "@/components/custom/Divider";
import Profile from "@/components/profile";
import SectionTitle from "@/components/section-title";
import EasterEggAvatar from "@/components/ux/easter-egg/easter-egg-avatar";
import { getStatistics } from "@/lib/blog-data/statistics";
import { getRecentBlogsMetadata } from "@/lib/blog-data/timeline-relation-data";
import { Card, Icon, Ripple } from "actify";
import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "主页 | Apry的笔记本",
};

// app/page.tsx
export default async function Home() {
  const { articleCount, categoryCount, tagCount } = await getStatistics();

  return (
    <>
      <div className="relative -mt-16 mb-8">
        <Cover>
          <section className="absolute top-0 left-0 w-full h-full flex flex-row flex-wrap gap-8 justify-center items-center">
            <EasterEggAvatar className="mt-16 block md:hidden" />
            <Profile className="pt-16 md:pt-0 hidden md:block" />
            <div className="flex flex-col gap-4 items-center flex-wrap text-white">
              <h1 className="text-3xl md:text-6xl z-1">Apry的笔记本📝</h1>
              <h2 className="text-xl md:text-2xl z-1 text-center md:pt-4">
                AI应用 | Web 开发者 | Wayland 合成器开发者 | 有一个全栈的梦想
              </h2>
            </div>
          </section>
        </Cover>
      </div>

      <main className="p-4 flex flex-row gap-4">
        <aside className="hidden md:flex flex-col flex-wrap flex-1">
          <div className="flex flex-col flex-wrap gap-4">
            <h3 className="text-3xl text-primary pt-4">日历</h3>
            <div className="pt-4 flex flex-col">
              <Calendar className="font-ui" />
            </div>
          </div>
          <Card variant="filled" className="mt-8 p-4 w-80">
            <div className="flex flex-row flex-nowrap min-w-16 w-full max-w-full text-on-primary justify-center items-center text-xl">
              <div className="flex flex-col gap-1 items-center">
                <span>文章</span>
                <span>{articleCount}</span>
              </div>
              <Divider responsiveHidden={false} />

              <Link href="/blog/category">
                <div className="flex flex-col gap-1 items-center">
                  <span>栏目</span>
                  <span>{categoryCount}</span>
                </div>
              </Link>

              <Divider responsiveHidden={false} />

              <div className="flex flex-col gap-1 items-center">
                <span>标签</span>
                <span>{tagCount}</span>
              </div>
            </div>
          </Card>
        </aside>

        <Divider />

        <div className="flex flex-col gap-4 pt-2 pb-4 flex-4 text-on-surface">
          <section className="md:pl-8 flex flex-col flex-wrap gap-4">
            <SectionTitle
              title="最近更新"
              className="text-center md:text-start"
            />
            <div className="flex flex-col flex-wrap gap-4 min-w-64 max-w-192">
              {(await getRecentBlogsMetadata(5)).map((data) => (
                <ContentCard
                  key={data.title + data.tags}
                  title={data.title}
                  preview={data.preview}
                  tags={data.tags}
                  link={data.link}
                  coverUrl={data.coverUrl}
                  coverAlt={data.coverAlt}
                  className="hover:bg-secondary-container"
                ></ContentCard>
              ))}
            </div>
          </section>
          <section className="md:pl-8 flex flex-col flex-wrap gap-2">
            <SectionTitle title="分类" className="text-center md:text-start" />
            <Link href="/blog/category">
              <div
                aria-label="Check categories"
                className="ml-4 pt-4 pb-4 rounded-4xl hover:bg-secondary-container flex flex-row flex-wrap gap-4 relative sm:right-0 md:right-4 min-w-64 max-w-192 cursor-pointer items-center"
              >
                <Ripple />
                <h4 className="pl-4 text-xl">点击查看分类</h4>
                <Icon>Arrow_Forward</Icon>
              </div>
            </Link>
          </section>
        </div>
      </main>
    </>
  );
}
