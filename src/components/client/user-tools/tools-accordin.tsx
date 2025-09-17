"use client";

import {
  Accordion,
  AccordionContent,
  AccordionHeader,
  AccordionItem,
  Icon,
} from "actify";
import ColorPicker from "./ColorPicker";
import PomodoroTimer from "./Pomodoro";

export default function ToolsAccordin() {
  return (
    <Accordion open={[, true]}>
      <AccordionItem>
        <AccordionHeader asChild>
          {({ active }) => (
            <div
              className={`text-2xl cursor-pointer ${
                active
                  ? "text-error flex items-center justify-between"
                  : "flex items-center justify-between"
              }`}
            >
              <p>取色器 · Material You</p>
              <div
                className={`transition-transform duration-300 ${
                  active ? "rotate-90" : "rotate-0"
                }`}
              >
                <Icon className="[--md-icon-size:36px]">arrow_downward</Icon>
              </div>
            </div>
          )}
        </AccordionHeader>
        <AccordionContent>
          <ColorPicker className="text-on-surface" />
        </AccordionContent>
      </AccordionItem>
      <AccordionItem>
        <AccordionHeader asChild>
          {({ active }) => (
            <div
              className={`text-2xl cursor-pointer ${
                active
                  ? "text-error flex items-center justify-between"
                  : "flex items-center justify-between"
              }`}
            >
              <p>番茄钟</p>
              <div
                className={`transition-transform duration-300 ${
                  active ? "rotate-90" : "rotate-0"
                }`}
              >
                <Icon className="[--md-icon-size:36px]">arrow_downward</Icon>
              </div>
            </div>
          )}
        </AccordionHeader>
        <AccordionContent>
          <PomodoroTimer />
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
