import { useEffect, useState, type SelectHTMLAttributes } from 'react';

import { NativeSelect } from '@/components/ui/native-select';
import { listUnits } from '@/lib/api';

import { unitLabel, type Unit } from '../types';

interface UnitSelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'children'> {
  /** The first, empty option, e.g. "Choose a unit". */
  placeholder: string;
  /** Whether the empty option can be picked again (a filter's "Any unit") or not (a required field). */
  placeholderSelectable?: boolean;
}

/** A select of the units an item can be given (GET /units). Its value is the unit's id. */
export function UnitSelect({ placeholder, placeholderSelectable = false, ...props }: UnitSelectProps) {
  const [units, setUnits] = useState<Unit[] | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    listUnits()
      .then((result) => !cancelled && setUnits(result))
      .catch(() => !cancelled && setFailed(true));
    return () => {
      cancelled = true;
    };
  }, []);

  const emptyLabel = failed ? "Couldn't load the units" : units === null ? 'Loading units…' : placeholder;

  return (
    <NativeSelect {...props}>
      <option value="" disabled={!placeholderSelectable}>
        {emptyLabel}
      </option>
      {units?.map((unit) => (
        <option key={unit.id} value={unit.id}>
          {unitLabel(unit)}
        </option>
      ))}
    </NativeSelect>
  );
}
