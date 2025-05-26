import { Upload, Save, History, Database } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProgressIndicator } from "@/components/progress-indicator";
import type { FormStep } from "@/types/report";

interface SidebarProps {
  steps: FormStep[];
  onQuickAction?: (action: string) => void;
}

export function Sidebar({ steps, onQuickAction }: SidebarProps) {
  const handleQuickAction = (action: string) => {
    if (onQuickAction) {
      onQuickAction(action);
    }
  };

  return (
    <aside className="w-80 bg-white dark:bg-slate-800 border-r border-gray-200 dark:border-slate-700 min-h-screen">
      <div className="p-6">
        <ProgressIndicator steps={steps} />
        
        <div className="border-t dark:border-slate-700 pt-6 mt-8">
          <h3 className="text-sm font-medium text-gray-900 dark:text-slate-100 mb-4">Quick Actions</h3>
          <div className="space-y-2">
            <Button
              variant="ghost"
              className="w-full justify-start text-sm text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700"
              onClick={() => handleQuickAction('import-csv')}
            >
              <Upload className="w-4 h-4 mr-2 text-gray-400 dark:text-slate-500" />
              Import CSV Data
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start text-sm text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700"
              onClick={() => handleQuickAction('save')}
            >
              <Save className="w-4 h-4 mr-2 text-gray-400 dark:text-slate-500" />
              Save Progress
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start text-sm text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700"
              onClick={() => handleQuickAction('load-previous')}
            >
              <History className="w-4 h-4 mr-2 text-gray-400 dark:text-slate-500" />
              Load Previous
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start text-sm text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700"
              onClick={() => handleQuickAction('sample-data')}
            >
              <Database className="w-4 h-4 mr-2 text-gray-400 dark:text-slate-500" />
              Sample Data
            </Button>
          </div>
        </div>
      </div>
    </aside>
  );
}
