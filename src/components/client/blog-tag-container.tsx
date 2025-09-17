"use client";

import { ChipGroup, ChipItem } from "actify";

interface BlogTagContainerProps {
  tags?: string[];
}

export default function BlogTagContainer({ tags = [] }: BlogTagContainerProps) {
  return (
    <ChipGroup label="标签">
      {tags.map((tag) => (
        <ChipItem key={tag}>{tag}</ChipItem>
      ))}
    </ChipGroup>
  );
}
