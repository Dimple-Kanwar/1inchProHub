import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Settings } from "lucide-react";

interface Props {
  enablePartialFills: boolean;
  setEnablePartialFills: (val: boolean) => void;
  customTimelock: number;
  setCustomTimelock: (val: number) => void;
  slippage: number;
  setSlippage: (val: number) => void;
}

export function FusionAdvancedOptions({
  enablePartialFills,
  setEnablePartialFills,
  customTimelock,
  setCustomTimelock,
  slippage,
  setSlippage,
}: Props) {
  return (
    <div className="space-y-4 p-4 bg-gray-700/30 rounded-lg">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-300">
          Advanced Options
        </span>
        <Settings className="w-4 h-4 text-gray-400" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="flex items-center space-x-2">
          <Switch
            checked={enablePartialFills}
            onCheckedChange={setEnablePartialFills}
          />
          <div>
            <span className="text-sm text-gray-300">
              Enable Partial Fills
            </span>
            <p className="text-xs text-gray-400">
              Allow order to be partially executed
            </p>
          </div>
        </div>
        <div className="space-y-2">
          <Label className="text-gray-300">
            Timelock Duration (seconds)
          </Label>
          <Input
            type="number"
            value={customTimelock}
            onChange={(e) =>
              setCustomTimelock(parseInt(e.target.value) || 3600)
            }
            className="bg-gray-600 border-gray-500 text-white"
          />
        </div>
      </div>
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-300">Slippage Tolerance</span>
          <span className="text-sm text-gray-400">{slippage}%</span>
        </div>
        <Slider
          value={[slippage]}
          onValueChange={(value) => setSlippage(value[0])}
          max={5}
          min={0.1}
          step={0.1}
          className="w-full"
        />
      </div>
    </div>
  );
}