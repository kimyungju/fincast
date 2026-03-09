import { AlertTriangle } from "lucide-react";

const RiskChainDisplay = ({ riskChain }: { riskChain: string }) => {
  if (!riskChain) return null;

  return (
    <div className="p-4 border-4 border-orange-1/30 bg-orange-1/5">
      <div className="flex items-center gap-2 mb-2">
        <AlertTriangle className="w-4 h-4 text-orange-1" />
        <span className="text-12 font-bold uppercase tracking-wider text-orange-1">
          Risk Implication
        </span>
      </div>
      <p className="text-14 text-white-1 font-medium">
        {riskChain}
      </p>
    </div>
  );
};

export default RiskChainDisplay;
