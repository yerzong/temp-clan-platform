import type { ChangeEventHandler } from "react";

/**
 * Accessible toggle switch backed by a visually-hidden checkbox so it submits
 * in a form (uncontrolled: name + defaultChecked) or drives state (controlled:
 * checked + onChange). The track/thumb are styled via the `peer` checkbox.
 */
export function Switch({
  name,
  checked,
  defaultChecked,
  onChange,
  disabled,
  "aria-label": ariaLabel,
}: {
  name?: string;
  checked?: boolean;
  defaultChecked?: boolean;
  onChange?: ChangeEventHandler<HTMLInputElement>;
  disabled?: boolean;
  "aria-label"?: string;
}) {
  return (
    <label className="relative inline-flex shrink-0 cursor-pointer items-center">
      <input
        type="checkbox"
        name={name}
        checked={checked}
        defaultChecked={defaultChecked}
        onChange={onChange}
        disabled={disabled}
        aria-label={ariaLabel}
        className="peer sr-only"
      />
      <span
        className="h-5 w-9 rounded-full bg-tc-surface-2 transition-colors after:absolute after:left-0.5 after:top-0.5 after:h-4 after:w-4 after:rounded-full after:bg-white after:transition-transform after:content-[''] peer-checked:bg-[hsl(var(--tc-accent))] peer-checked:after:translate-x-4 peer-disabled:opacity-50"
      />
    </label>
  );
}
