import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { SUPPORTED_NETWORKS } from "@/config/blockchains";
import { CrossChainOrder } from "@/types/blockchain";

interface Props {
  activeOrders: CrossChainOrder[];
}

export function FusionActiveOrders({ activeOrders }: Props) {
  if (!activeOrders.length) return null;
  return (
    <div className="space-y-3">
      <h4 className="text-sm font-medium text-gray-300">
        Active Cross-chain Orders
      </h4>
      {activeOrders.slice(0, 3).map((order) => (
        <div key={order.id} className="p-3 bg-gray-700/40 rounded-lg">
          <div className="flex justify-between items-center">
            <div className="text-sm text-white">
              {order.fromAmount} {order.fromToken.symbol} →{" "}
              {order.toAmount} {order.toToken.symbol}
            </div>
            <Badge
              variant={
                order.status === "completed" ? "default" : "secondary"
              }
            >
              {order.status}
            </Badge>
          </div>
          <div className="text-xs text-gray-400 mt-1">
            {SUPPORTED_NETWORKS[order.fromChain]?.name} →{" "}
            {SUPPORTED_NETWORKS[order.toChain]?.name}
          </div>
          {order.status === "pending" && order.timelock && (
            <div className="mt-2">
              <div className="flex justify-between text-xs text-gray-400 mb-1">
                <span>Time remaining</span>
                <span>
                  {Math.max(
                    0,
                    Math.floor((order.expiresAt - Date.now()) / 60000),
                  )}{" "}
                  min
                </span>
              </div>
              <Progress
                value={Math.max(
                  0,
                  (order.expiresAt - Date.now()) / (order.timelock * 10),
                )}
                className="h-1"
              />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}