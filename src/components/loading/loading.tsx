import React from "react";
import { Progress } from "../ui/progress";
import { cn } from "@/lib/utils";

interface LoadingProps {
  progress: number;
  label: string;
}

export default function Loading(props: LoadingProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="relative flex flex-col justify-center px-4 bg-white rounded-lg shadow-lg w-[240px] h-[100px]">
        <div className="absolute top-[-20px] bg-white rounded-full left-[98px] flex justify-center p-2">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={cn("animate-spin")}
          >
            <path d="M21 12a9 9 0 1 1-6.219-8.56" />
          </svg>
        </div>
        <h2 className="text-[16px] font-semibold text-center">{props.label}</h2>
        <div className="flex justify-between mt-2">
          <span className="text-sm text-muted-foreground">Progresso</span>
          <span className="text-sm text-muted-foreground">
            {props.progress}%
          </span>
        </div>
        <Progress value={props.progress} />
      </div>
    </div>
  );
}
