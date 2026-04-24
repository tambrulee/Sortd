"use client";

import { useState } from "react";
import { Task } from "@/lib/types";

type ArchivedTasksProps = {
  tasks: Task[];
};

export default function ArchivedTasks({ tasks }: ArchivedTasksProps) {
  const [isOpen, setIsOpen] = useState(false);

  if (tasks.length === 0) return null;

  return (
    <div className="mt-6 rounded-2xl bg-[#eeeaea]/70 p-4">
      <button
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        className="flex w-full items-center justify-between text-sm font-semibold text-[#1f0825]"
      >
        <span>Completed archive ({tasks.length})</span>
        <span>{isOpen ? "−" : "+"}</span>
      </button>

      <div
        className={`grid transition-all duration-300 ${
          isOpen
            ? "mt-4 grid-rows-[1fr] opacity-100"
            : "grid-rows-[0fr] opacity-0"
        }`}
      >
        <div className="overflow-hidden">
          <div className="space-y-2">
            {tasks.map((task) => (
              <div
                key={task.id}
                className="rounded-xl bg-white/70 px-3 py-2 text-sm text-slate-600 line-through"
              >
                {task.title || "Untitled task"}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}