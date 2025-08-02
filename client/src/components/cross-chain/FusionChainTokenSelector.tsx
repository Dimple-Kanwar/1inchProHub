import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { SUPPORTED_NETWORKS, POPULAR_TOKENS } from "@/config/blockchains";
import { Token } from "@/types/blockchain";

interface Props {
  label: string;
  chain: number;
  setChain: (chainId: number) => void;
  token: Token | null;
  setToken: (token: Token | null) => void;
  availableTokens: Token[];
  amount: string;
  setAmount?: (amount: string) => void;
  readOnlyAmount?: boolean;
  isLoading?: boolean;
  balance?: string;
}

export function FusionChainTokenSelector({
  label,
  chain,
  setChain,
  token,
  setToken,
  availableTokens,
  amount,
  setAmount,
  readOnlyAmount = false,
  isLoading = false,
  balance,
}: Props) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <Label className="text-gray-300">{label}</Label>
        <div className="text-xs text-gray-400">
          Balance: {balance || token?.balance || "0"} {token?.symbol}
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
        <Select
          value={chain.toString()}
          onValueChange={(value) => {
            const chainId = parseInt(value);
            setChain(chainId);
            setToken(POPULAR_TOKENS[chainId]?.[0] || null);
          }}
        >
          <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-gray-700 border-gray-600">
            {Object.values(SUPPORTED_NETWORKS).map((chain) => (
              <SelectItem
                key={chain.id}
                value={chain.id.toString()}
                className="text-white hover:bg-gray-600"
              >
                <div className="flex items-center space-x-2">
                  <span>{chain.name}</span>
                  <Badge
                    variant="outline"
                    className={
                      chain.type === "EVM"
                        ? "text-blue-400"
                        : "text-purple-400"
                    }
                  >
                    {chain.type}
                  </Badge>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={token?.address || ""}
          onValueChange={(value) => {
            const t = availableTokens.find((tk) => tk.address === value);
            setToken(t || null);
          }}
        >
          <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
            <SelectValue placeholder="Select token" />
          </SelectTrigger>
          <SelectContent className="bg-gray-700 border-gray-600">
            {availableTokens.map((tk) => (
              <SelectItem
                key={tk.address}
                value={tk.address}
                className="text-white hover:bg-gray-600"
              >
                {tk.symbol}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input
          type="number"
          value={amount}
          onChange={setAmount ? (e) => setAmount(e.target.value) : undefined}
          placeholder={readOnlyAmount ? (isLoading ? "Calculating..." : "0.0") : "0.0"}
          className="bg-gray-700 border-gray-600 text-white"
          readOnly={readOnlyAmount}
        />
      </div>
    </div>
  );
}