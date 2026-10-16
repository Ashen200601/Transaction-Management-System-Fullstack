import { useEffect, useId, useState } from 'react';

import { listStakeholderTypes } from '@/lib/api';
import { cn } from '@/lib/utils';

import type { StakeholderType } from '../types';

interface StakeholderTypeCheckboxesProps {
  /** Ids of the ticked types. */
  value: string[];
  onChange: (value: string[]) => void;
  error?: string;
}

/**
 * The stakeholder types (GET /stakeholder-types) as checkboxes; any number can be ticked. The
 * ticked ids keep the list's order.
 */
export function StakeholderTypeCheckboxes({ value, onChange, error }: StakeholderTypeCheckboxesProps) {
  const [types, setTypes] = useState<StakeholderType[] | null>(null);
  const [failed, setFailed] = useState(false);
  const errorId = useId();

  useEffect(() => {
    let cancelled = false;
    listStakeholderTypes()
      .then((result) => !cancelled && setTypes(result))
      .catch(() => !cancelled && setFailed(true));
    return () => {
      cancelled = true;
    };
  }, []);

  function toggle(id: string, checked: boolean) {
    const ticked = new Set(value);
    if (checked) ticked.add(id);
    else ticked.delete(id);
    onChange((types ?? []).map((type) => type.id).filter((typeId) => ticked.has(typeId)));
  }

  return (
    <fieldset aria-describedby={error ? errorId : undefined} aria-invalid={error ? true : undefined} className="grid gap-3">
      <legend className="mb-3 text-base font-medium">Stakeholder type</legend>
      {failed ? (
        <p className="text-sm text-destructive">Couldn't load the stakeholder types.</p>
      ) : types === null ? (
        <p className="text-sm text-muted-foreground">Loading stakeholder types…</p>
      ) : (
        <div className="flex flex-wrap gap-3">
          {types.map((type) => {
            const checked = value.includes(type.id);
            return (
              <label
                key={type.id}
                className={cn(
                  'flex cursor-pointer items-center gap-2.5 rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors',
                  checked ? 'border-primary bg-accent text-accent-foreground' : 'border-border hover:bg-muted',
                )}
              >
                <input
                  type="checkbox"
                  className="size-4 accent-primary"
                  checked={checked}
                  onChange={(event) => toggle(type.id, event.target.checked)}
                />
                {type.stakeholderTypeName}
              </label>
            );
          })}
        </div>
      )}
      {error && (
        <p id={errorId} className="text-xs text-destructive">
          {error}
        </p>
      )}
    </fieldset>
  );
}
