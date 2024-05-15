import React from 'react';

import type { CellProps, Column } from 'react-datasheet-grid';

const TimeComponent = ({
  rowData,
  setRowData,
  rowIndex,
  columnIndex,
}: CellProps<string | null | undefined, string>) => (
  <input
    id={`time-${rowIndex}-${columnIndex}`}
    type="time"
    value={rowData!}
    onChange={(e) => {
      setRowData(e.target.value);
    }}
    className="dsg-input"
    step="1"
  />
);

const timeColumn: Partial<Column<string | null | undefined, string>> = {
  component: TimeComponent,
};

export default timeColumn;
