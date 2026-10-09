import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router';

import { NativeSelect } from '@/components/ui/native-select';

import { useTenant } from '../tenant-context';

export function BusinessSwitcher() {
  const { businesses, activeBusiness, selectBusiness } = useTenant();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [pendingId, setPendingId] = useState<string | null>(null);

  // Switch only once the dashboard has replaced the current page: that page's
  // data belongs to the old business and must not be re-requested under the new one.
  useEffect(() => {
    if (pendingId && pathname === '/') {
      selectBusiness(pendingId);
      setPendingId(null);
    }
  }, [pendingId, pathname, selectBusiness]);

  if (businesses.length <= 1) {
    return activeBusiness ? <span className="truncate text-sm font-medium">{activeBusiness.name}</span> : null;
  }

  return (
    <NativeSelect
      aria-label="Business"
      className="w-full max-w-56"
      value={pendingId ?? activeBusiness?.id ?? ''}
      onChange={(event) => {
        setPendingId(event.target.value);
        navigate('/');
      }}
    >
      {!activeBusiness && <option value="">Choose a business</option>}
      {businesses.map((business) => (
        <option key={business.id} value={business.id}>
          {business.name}
        </option>
      ))}
    </NativeSelect>
  );
}
