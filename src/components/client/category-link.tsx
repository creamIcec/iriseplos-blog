"use client"; // Actify的ChipGroup使用

import { ChipGroup, ChipItem } from "actify";
import Link from "next/link";

interface CategoryLinkProps {
  category?: string;
  datetime?: string;
  tags?: string[];
}

export default function CategoryLink({
  category = "杂项",
  datetime,
  tags,
}: CategoryLinkProps) {
  if (!tags) {
    tags = [];
  }

  return (
    <div className="grid-cols-2 grid-rows-2  grid text-on-secondary">
      <div className="border-r border-b border-outline p-2">
        <ChipGroup label="收录于">
          <ChipItem textValue={category}>
            <Link href="/" className="text-on-secondary underline">
              {category}
            </Link>
          </ChipItem>
        </ChipGroup>
      </div>
      <div className="flex flex-col gap-2 border-b border-outline p-2">
        <span>日期</span>
        <p className="text-on-secondary">{datetime}</p>
      </div>
      <div className="flex flex-col gap-2 border-r border-outline p-2">
        <div className="text-on-secondary">
          <ChipGroup label="标签">
            {tags?.map((item) => (
              <ChipItem key={item} textValue={item}>
                <p className="text-on-secondary">{item}</p>
              </ChipItem>
            ))}
          </ChipGroup>
        </div>
      </div>
      <div className="flex flex-col gap-2 p-2">
        <span>其他</span>
        <p className="text-on-secondary">好像没有了...?</p>
      </div>
    </div>
  );
}
