import { Switch } from "@headlessui/react";
import { FC, useState } from "react";

interface ToggleProps {
  isEnabled: boolean;
  onToggle: (isEnabled: boolean) => void;
}

export const Toggle: FC<ToggleProps> = ({ isEnabled, onToggle }) => {
  const [enabled, setEnabled] = useState(isEnabled);

  const setEnabledWrapper = (value: boolean) => {
    setEnabled(value);
    onToggle(value);
  };

  return (
    <Switch
      checked={enabled}
      onChange={setEnabledWrapper}
      className={`${
        enabled ? "bg-blue-600" : "bg-gray-200"
      } relative inline-flex h-6 w-11 items-center rounded-full`}
    >
      <span
        className={`${
          enabled ? "translate-x-6" : "translate-x-1"
        } inline-block h-4 w-4 transform rounded-full bg-white`}
      />
    </Switch>
  );
};
