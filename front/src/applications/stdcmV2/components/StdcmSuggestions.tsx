import React, { useEffect, useState } from 'react';

import { Input, type InputProps } from '@osrd-project/ui-core';
import { isEmpty } from 'lodash';

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

  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    if (isFocused) {
      setIsSelectVisible(!isEmpty(options));
    }
  }, [options, isFocused]);

  return (
    <>
      <Input {...rest} onFocus={() => setIsFocused(true)} onBlur={() => setIsFocused(false)} />
      {isSelectVisible && (
        <div className="selector-select">
          <SelectImprovedSNCF
            options={options}
            onChange={(option) => {
              onSelectSuggestion(option);
              setIsSelectVisible(false);
            }}
            setSelectVisibility={setIsSelectVisible}
            withSearch={false}
            noTogglingHeader
            isOpened
            bgWhite
          />
        </div>
      )}
    </>
  );
}
