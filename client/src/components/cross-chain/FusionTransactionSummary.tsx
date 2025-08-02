import { SUPPORTED_NETWORKS } from "@/config/blockchains";
import { Token } from "@/types/blockchain";

interface Props {
  fromAmount: string;
  toAmount: string;
  fromToken: Token | null;
  toToken: Token | null;
  fromChain: number;
  toChain: number;
  customTimelock: number;
}

export function FusionTransactionSummary({
  fromAmount,
  toAmount,
  fromToken,
  toToken,
  fromChain,
  toChain,
  customTimelock,
}: Props) {
  if (!fromAmount || !toAmount) return null;
  return (
    <div className="p-4 bg-gray-700/30 rounded-lg space-y-2">
      <div className="flex justify-between text-sm">
        <span className="text-gray-400">Exchange Rate</span>
        <span className="text-white">
          1 {fromToken?.symbol} ={" "}
          {(parseFloat(toAmount) / parseFloat(fromAmount)).toFixed(6)}{" "}
          {toToken?.symbol}
        </span>
      </div>
      <div className="flex justify-between text-sm">
        <span className="text-gray-400">Cross-chain Fee</span>
        <span className="text-white">~$5.00</span>
      </div>
      <div className="flex justify-between text-sm">
        <span className="text-gray-400">Estimated Time</span>
        <span className="text-white">
          {SUPPORTED_NETWORKS[fromChain]?.type ===
            SUPPORTED_NETWORKS[toChain]?.type
            ? "~2-5 minutes"
            : "~5-15 minutes"}
        </span>
      </div>
      {SUPPORTED_NETWORKS[fromChain]?.hashlockSupport &&
        SUPPORTED_NETWORKS[toChain]?.hashlockSupport && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Expiry Time</span>
            <span className="text-white">
              {Math.floor(customTimelock / 60)} minutes
            </span>
          </div>
        )}
    </div>
  );
}