import { Shield } from "lucide-react";
import { SUPPORTED_NETWORKS } from "@/config/blockchains";

interface Props {
  fromChain: number;
  toChain: number;
}

export function FusionSecurityFeatures({ fromChain, toChain }: Props) {
  return (
    <div className="space-y-4 p-4 bg-gray-700/50 rounded-lg">
      <div className="flex items-center space-x-2">
        <Shield className="w-4 h-4 text-green-400" />
        <span className="text-sm font-medium text-gray-300">
          Enhanced Security Features
        </span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {SUPPORTED_NETWORKS[fromChain]?.hashlockSupport &&
          SUPPORTED_NETWORKS[toChain]?.hashlockSupport && (
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 rounded-full bg-green-400"></div>
              <div>
                <span className="text-sm text-gray-300">
                  Hashlock Protection
                </span>
                <p className="text-xs text-gray-400">
                  Cryptographic swap security
                </p>
              </div>
            </div>
          )}
        {SUPPORTED_NETWORKS[fromChain]?.timelockSupport &&
          SUPPORTED_NETWORKS[toChain]?.timelockSupport && (
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 rounded-full bg-green-400"></div>
              <div>
                <span className="text-sm text-gray-300">
                  Timelock Protection
                </span>
                <p className="text-xs text-gray-400">
                  Automatic refund mechanism
                </p>
              </div>
            </div>
          )}
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 rounded-full bg-green-400"></div>
          <div>
            <span className="text-sm text-gray-300">MEV Protection</span>
            <p className="text-xs text-gray-400">Built-in MEV resistance</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 rounded-full bg-green-400"></div>
          <div>
            <span className="text-sm text-gray-300">
              Bidirectional Swaps
            </span>
            <p className="text-xs text-gray-400">
              Two-way chain compatibility
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}