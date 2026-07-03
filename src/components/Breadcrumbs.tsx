import React from 'react';
import { Link } from 'react-router-dom';

interface Crumb {
  label: string;
  to?: string;
}

interface BreadcrumbsProps {
  crumbs: Crumb[];
}

const Breadcrumbs: React.FC<BreadcrumbsProps> = ({ crumbs }) => {
  return (
    <nav className="flex flex-wrap items-center gap-2 text-sm text-gray-500" aria-label="Breadcrumb">
      {crumbs.map((crumb, index) => {
        const isLast = index === crumbs.length - 1;
        return (
          <React.Fragment key={`${crumb.label}-${index}`}>
            {crumb.to && !isLast ? (
              <Link to={crumb.to} className="text-indigo-600 hover:text-indigo-700">
                {crumb.label}
              </Link>
            ) : (
              <span className={isLast ? 'text-gray-900 font-semibold' : 'text-gray-500'}>
                {crumb.label}
              </span>
            )}
            {!isLast && <span className="text-gray-400">/</span>}
          </React.Fragment>
        );
      })}
    </nav>
  );
};

export default Breadcrumbs;
