import { Card } from "actify";
import clsx from "clsx";
import Image from "next/image";
import BlogTagContainer from "./client/blog-tag-container";
import { NavItemMetadata } from "@/lib/blog-data/timeline-relation-data";
import Link from "next/link";

interface ContentCardProps extends NavItemMetadata {
  type?: "horizontal" | "vertical";
  className?: string;
}

export default function ContentCard({
  type = "horizontal",
  title,
  preview,
  tags,
  link,
  className,
}: ContentCardProps) {
  return (
    <Card variant="outlined" className={clsx("overflow-hidden", className)}>
      <Link href={"/blog/" + link || "#"}>
        <div
          className={`${clsx(
            type == "horizontal"
              ? "flex-row h-64 max-w-full"
              : "flex-col h-128 max-w-64"
          )} flex gap-2 flex-nowrap`}
        >
          <div
            className={`w-full h-full overflow-hidden ${clsx(
              type == "horizontal" ? "flex-1" : "flex-4"
            )}`}
          >
            <Image
              priority
              src="https://picsum.photos/seed/orange/400/600"
              alt="一张随机图片"
              width={600}
              height={900}
              className="object-cover h-full"
            />
          </div>
          <div
            className={`flex flex-col gap-2 flex-wrap justify-center items-start ${clsx(
              type == "horizontal" ? "flex-2" : "flex-3"
            )}`}
          >
            <h2
              className={`text-2xl p-2 ${clsx(
                type == "vertical" ? "mt-16" : null
              )}`}
            >
              {title}
            </h2>
            <p className="p-2 pt-0">{preview}</p>
            <div className="flex flex-cik gap-4 p-4">
              {tags.length > 0 && <BlogTagContainer tags={tags} />}
            </div>
          </div>
        </div>
      </Link>
    </Card>
  );
}
