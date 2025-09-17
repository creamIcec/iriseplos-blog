"use client";

import {
  Button,
  Accordion,
  AccordionItem,
  AccordionHeader,
  AccordionContent,
  IconButton,
  Icon,
  Ripple,
} from "actify";
import SectionTitle from "../section-title";
import { ArticleLink } from "@/lib/blog-data/category-relation-data";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

interface CategoryEntry {
  categoryEntries?: Map<string, ArticleLink[]>;
}

interface CategoryAccordin extends CategoryEntry {
  categories?: string[];
}

export default function CategoryAccordin({
  categories = [],
  categoryEntries = new Map(),
}: CategoryAccordin) {
  const [allOpened, setAllOpened] = useState(false);

  const handleToggleOpenAll = () => setAllOpened((v) => !v);

  const openArray = useMemo(
    () => Array.from({ length: categories.length }, () => allOpened),
    [categories.length, allOpened]
  );

  return (
    <>
      <section className="flex flex-row gap-4 pl-16 pr-16 justify-between w-full">
        <SectionTitle title="点击栏目展开" />
        <div className="flex flex-row flex-wrap pr-4">
          <Button variant="elevated" onPress={handleToggleOpenAll}>
            切换全部
          </Button>
        </div>
      </section>
      <section className="flex flex-col gap-2 pl-16 pr-16 pb-16 items-center w-full">
        <Accordion
          className="w-full pt-8"
          open={openArray}
          multiple
          key={`${allOpened}-${categories.length}`}
        >
          {categories.map((category) => (
            <AccordionItem key={category}>
              <AccordionHeader className="text-lg" asChild>
                {({ active }) => (
                  <div className="flex justify-between text-lg">
                    <h3
                      className={`font-semibold ${
                        active ? "text-primary" : null
                      }`}
                    >
                      {category}
                    </h3>
                    <div
                      className={`w-8 h-8 flex justify-center items-center rounded-full relative cursor-pointer transition-transform duration-300 ${
                        active ? "-rotate-90" : "rotate-0"
                      }`}
                      role="button"
                    >
                      <Ripple />
                      <Icon>Keyboard_Arrow_Left</Icon>
                    </div>
                  </div>
                )}
              </AccordionHeader>
              <AccordionContent>
                <div className="flex flex-col gap-4">
                  {categoryEntries.get(category)?.map((item) => (
                    <h4
                      key={item.link + item.title}
                      className="text-tertiary text-lg"
                    >
                      <Link href={item.link}>{item.title}</Link>
                    </h4>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </section>
    </>
  );
}
