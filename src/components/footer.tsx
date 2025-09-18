import { Icon } from "actify";
import Image from "next/image";

export default function Footer() {
  return (
    <footer className="bg-on-primary text-sm md:text-base">
      <div className="p-4 flex flex-row gap-4 items-center justify-around">
        <div className="flex flex-row items-center gap-2 text-secondary">
          Copyright © 2025 Iriseplosc. Some rights reserved. <br /> 本站内容采用
          CC BY 4.0 许可协议进行许可
        </div>
        <div className="flex flex-row items-center gap-2 justify-around">
          <span className="text-secondary text-start">
            遵循 <span className="whitespace-nowrap">Material You</span>{" "}
            设计规范
          </span>
          <div className="w-px bg-outline-variant ml-4 mr-4 self-stretch" />
          <div className="text-secondary flex flex-row flex-wrap items-center gap-1">
            <div>
              使用
              <a href="https://nextjs.org" className="underline inline">
                Next.js
                <Image
                  src="/nextjs-icon-light-background.svg"
                  alt="next-logo"
                  width={24}
                  height={24}
                  className="inline"
                />
              </a>
              用❤️构建
            </div>
            <div className="w-px bg-outline-variant ml-4 mr-4 self-stretch" />
            <a
              className="underline"
              href="https://github.com/creamIcec/iriseplos-blog"
            >
              <div className="flex items-center gap-2">
                <span>源代码仓库</span>
                <Icon>Link</Icon>
              </div>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
