import React from 'react';

import { useTranslation } from 'react-i18next';

import CheckboxRadioSNCF from 'common/BootstrapSNCF/CheckboxRadioSNCF';
import EyeToggle from 'common/EyeToggle';

type RouteListProps = {
  switchesRouteCandidates: string[];
  onRouteHighlight: (routeId: string) => Promise<void>;
  selectedRoutes: string[];
  onRouteSelect: (routeId: string) => Promise<void>;
  highlightedRoutes: string[];
};

function RouteList({
  switchesRouteCandidates,
  onRouteSelect,
  selectedRoutes,
  onRouteHighlight,
  highlightedRoutes,
}: RouteListProps) {
  const { t } = useTranslation();

  const handleRouteSelected = (route: string) => () => {
    onRouteSelect(route);
  };
  const handleRouteHighlighted = (route: string) => () => {
    onRouteHighlight(route);
  };
  return (
    <div className="my-3 w-100">
      <label htmlFor="route-select">{t('Editor.tools.speed-edition.select-route')}</label>
      {switchesRouteCandidates.map((route) => (
        <div key={route} className="d-flex align-items-center justify-content-between w-75">
          {route}
          <div className="d-flex">
            <CheckboxRadioSNCF
              label=""
              id={`route-checkbox-${route}`}
              type="checkbox"
              checked={selectedRoutes.includes(route)}
              onClick={handleRouteSelected(route)}
            />
            <EyeToggle
              checked={highlightedRoutes.includes(route)}
              onClick={handleRouteHighlighted(route)}
            />
          </div>
        </div>
      ))}

      {/* <select
        name="route-select"
        className="bg-white"
        onChange={(e) => {
          onRouteSelected(e.target.value);
        }}
      >
        {switchesRouteCandidates.map((route) => (
          <option key={route} value={route}>
            {route}
          </option>
        ))}
      </select> */}
    </div>
  );
}

export default RouteList;
