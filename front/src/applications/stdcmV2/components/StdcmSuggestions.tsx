import React, { useEffect, useState } from 'react';

import { Input, type InputProps } from '@osrd-project/ui-core';
import { isEmpty } from 'lodash';

import { type SearchResultItemOperationalPoint } from 'common/api/osrdEditoastApi';
import SelectImprovedSNCF, {
  type SelectOptionObject,
} from 'common/BootstrapSNCF/SelectImprovedSNCF';

interface SuggestionsProps<T extends string | SelectOptionObject> extends InputProps {
  options: T[];
  onSelectSuggestion: (option: T) => void;
}

export default function StdcmSuggestions<T extends string | SelectOptionObject>({
  options,
  onSelectSuggestion,
  ...rest
}: SuggestionsProps<T>) {
  const [isSelectVisible, setIsSelectVisible] = useState(!isEmpty(options));

  useEffect(() => {
    setIsSelectVisible(!isEmpty(options));
  }, [options]);

  return (
    <div>
      <Input {...rest} />
      {isSelectVisible && (
        <div className="selector-select">
          <SelectImprovedSNCF
            options={options}
            onChange={onSelectSuggestion}
            setSelectVisibility={setIsSelectVisible}
            withSearch={false}
            noTogglingHeader
            isOpened
            bgWhite
          />
        </div>
      )}
    </div>
  );
}
