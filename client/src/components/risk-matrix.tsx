import { useState } from "react";
import { cn } from "@/lib/utils";
import { calculateRiskLevel, RISK_LEVELS } from "@/types/report";

interface RiskMatrixProps {
  onCellClick?: (likelihood: number, impact: number) => void;
  selectedCell?: { likelihood: number; impact: number };
  className?: string;
}

export function RiskMatrix({ onCellClick, selectedCell, className }: RiskMatrixProps) {
  const [hoveredCell, setHoveredCell] = useState<{ likelihood: number; impact: number } | null>(null);

  const handleCellClick = (likelihood: number, impact: number) => {
    if (onCellClick) {
      onCellClick(likelihood, impact);
    }
  };

  const getCellColor = (likelihood: number, impact: number) => {
    const riskLevel = calculateRiskLevel(likelihood, impact);
    return RISK_LEVELS[riskLevel].matrixColor;
  };

  const getCellLabel = (likelihood: number, impact: number) => {
    const riskLevel = calculateRiskLevel(likelihood, impact);
    
    switch (riskLevel) {
      case 'very-low': return 'VL';
      case 'low': return 'L';
      case 'medium': return 'M';
      case 'high': return 'H';
      case 'critical': return 'C';
      default: return '';
    }
  };

  const isSelected = (likelihood: number, impact: number) => {
    return selectedCell?.likelihood === likelihood && selectedCell?.impact === impact;
  };

  const isHovered = (likelihood: number, impact: number) => {
    return hoveredCell?.likelihood === likelihood && hoveredCell?.impact === impact;
  };

  return (
    <div className={cn("bg-gray-50 p-4 rounded-lg", className)}>
      <div className="grid grid-cols-6 gap-1 text-xs">
        {/* Headers */}
        <div className="text-center font-medium text-gray-600 p-2"></div>
        <div className="text-center font-medium text-gray-600 p-2">Very Low</div>
        <div className="text-center font-medium text-gray-600 p-2">Low</div>
        <div className="text-center font-medium text-gray-600 p-2">Medium</div>
        <div className="text-center font-medium text-gray-600 p-2">High</div>
        <div className="text-center font-medium text-gray-600 p-2">Very High</div>
        
        {/* Matrix rows (impact levels 5 to 1) */}
        {[5, 4, 3, 2, 1].map((impact) => (
          <>
            <div key={`impact-${impact}`} className="text-center font-medium text-gray-600 p-2 flex items-center justify-center">
              <div className="transform rotate-180" style={{ writingMode: 'vertical-lr' }}>
                {impact === 5 ? 'Very High' : impact === 4 ? 'High' : impact === 3 ? 'Medium' : impact === 2 ? 'Low' : 'Very Low'}
              </div>
            </div>
            {[1, 2, 3, 4, 5].map((likelihood) => (
              <div
                key={`${likelihood}-${impact}`}
                className={cn(
                  "p-2 rounded text-center hover:opacity-80 transition-all cursor-pointer",
                  getCellColor(likelihood, impact),
                  isSelected(likelihood, impact) && "ring-2 ring-primary ring-offset-1",
                  isHovered(likelihood, impact) && "scale-105 shadow-md"
                )}
                onClick={() => handleCellClick(likelihood, impact)}
                onMouseEnter={() => setHoveredCell({ likelihood, impact })}
                onMouseLeave={() => setHoveredCell(null)}
              >
                {getCellLabel(likelihood, impact)}
              </div>
            ))}
          </>
        ))}
      </div>
      
      {/* Legend */}
      <div className="flex items-center justify-center space-x-6 mt-4 text-xs">
        {Object.entries(RISK_LEVELS).map(([level, config]) => (
          <div key={level} className="flex items-center space-x-1">
            <div className={cn("w-3 h-3 rounded", config.matrixColor)} />
            <span className="text-gray-600">{config.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
