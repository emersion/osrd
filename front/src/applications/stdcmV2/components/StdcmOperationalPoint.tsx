import React from 'react';

import { Input } from '@osrd-project/ui-core';

export default function StdcmOperationalPoint() {
  return (
    <div className="flex">
      <Input id="ci" label="CI" />
      <Input id="ch" label="CH" />
    </div>
  );
}
