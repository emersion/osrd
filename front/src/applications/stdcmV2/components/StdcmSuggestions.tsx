import React, { useEffect, useState } from 'react';

import { Input, type InputProps } from '@osrd-project/ui-core';
import { isEmpty } from 'lodash';

import SelectImprovedSNCF, {
  type SelectOptionObject,
} from 'common/BootstrapSNCF/SelectImprovedSNCF';

export interface StdcmSuggestionsProps<T extends string | SelectOptionObject> extends InputProps {
  options: T[];
  onSelectSuggestion: (option: T) => void;
}

const StdcmSuggestions = <T extends string | SelectOptionObject>({
  options,
  onSelectSuggestion,
  onFocus,
  onBlur,
  disabled,
  ...rest
}: StdcmSuggestionsProps<T>) => {
  const [isSelectVisible, setIsSelectVisible] = useState(!isEmpty(options));

  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    if (isFocused) {
      setIsSelectVisible(!isEmpty(options));
    }
  }, [options, isFocused]);

  return (
    <>
      <Input
        {...rest}
        onFocus={(e) => {
          setIsFocused(true);
          onFocus?.(e);
        }}
        onBlur={(e) => {
          setIsFocused(false);
          onBlur?.(e);
        }}
        disabled={disabled}
      />
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
            disabled={disabled}
            noTogglingHeader
            isOpened
            bgWhite
          />
        </div>
      )}
    </>
  );
};

export default StdcmSuggestions;
