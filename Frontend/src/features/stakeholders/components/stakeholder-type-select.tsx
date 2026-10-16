import { useEffect, useState, type SelectHTMLAttributes } from 'react';

import { NativeSelect } from '@/components/ui/native-select';
import { listStakeholderTypes } from '@/lib/api';

import type { StakeholderType } from '../types';

/** A select of the stakeholder types, for the list's filter. Its value is the type's id; '' is any type. */
export function StakeholderTypeSelect(props: Omit<SelectHTMLAttributes<HTMLSelectElement>, 'children'>) {
  const [types, setTypes] = useState<StakeholderType[] | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    listStakeholderTypes()
      .then((result) => !cancelled && setTypes(result))
      .catch(() => !cancelled && setFailed(true));
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <NativeSelect {...props}>
      <option value="">{failed ? "Couldn't load the types" : types === null ? 'Loading types…' : 'Any type'}</option>
      {types?.map((type) => (
        <option key={type.id} value={type.id}>
          {type.stakeholderTypeName}
        </option>
      ))}
    </NativeSelect>
  );
}
