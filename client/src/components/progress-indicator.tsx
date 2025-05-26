import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import type { FormStep } from "@/types/report";

interface ProgressIndicatorProps {
  steps: FormStep[];
}

export function ProgressIndicator({ steps }: ProgressIndicatorProps) {
  return (
    <div className="mb-8">
      <h3 className="text-sm font-medium text-gray-900 mb-4">Report Creation Progress</h3>
      <div className="space-y-4">
        {steps.map((step, index) => (
          <div key={step.id} className="flex items-center">
            <div
              className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium",
                step.completed
                  ? "bg-primary text-white"
                  : step.current
                  ? "bg-primary text-white"
                  : "bg-gray-200 text-gray-600"
              )}
            >
              {step.completed ? (
                <Check className="w-4 h-4" />
              ) : (
                index + 1
              )}
            </div>
            <div className="ml-3 flex-1">
              <p
                className={cn(
                  "text-sm font-medium",
                  step.completed || step.current ? "text-primary" : "text-gray-600"
                )}
              >
                {step.title}
              </p>
              <p className="text-xs text-gray-500">{step.description}</p>
            </div>
            {step.completed && (
              <Check className="text-primary w-4 h-4" />
            )}
            {step.current && !step.completed && (
              <div className="w-2 h-2 bg-primary rounded-full" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
