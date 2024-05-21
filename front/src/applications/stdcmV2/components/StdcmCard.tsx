import React from 'react';

import cx from 'classnames';

export type StdcmCardProps = {
  name?: string;
  hasTip?: boolean;
  disabled?: boolean;
  title?: React.ReactNode;
  children: React.ReactNode;
};

export default function StdcmCard({
  name,
  hasTip = false,
  disabled = false,
  title,
  children,
}: StdcmCardProps) {
  return (
    <div className={cx('stdcm-v2-card', { 'has-tip': hasTip, disabled })}>
      {name && (
        <div
          className={cx(
            'stdcm-v2-card__header',
            'd-flex',
            'justify-content-between',
            'align-items-center'
          )}
        >
          <span>{name}</span>
          {title && title}
        </div>
      )}
      <div className="stdcm-v2-card__body">{children}</div>
    </div>
  );
}
