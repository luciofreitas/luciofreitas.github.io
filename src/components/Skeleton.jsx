import React from 'react';
import './Skeleton.css';

const Skeleton = ({ 
  width = '100%', 
  height = '1rem', 
  borderRadius = '0.25rem',
  className = '',
  animate = true 
}) => {
  return (
    <div
      className={`skeleton ${animate ? 'skeleton--animate' : ''} ${className}`}
      style={{
        width,
        height,
        borderRadius
      }}
      aria-hidden="true"
    />
  );
};

// Pre-built skeleton components for common use cases
export const SkeletonText = ({ lines = 1, className = '' }) => (
  <div className={`skeleton-text ${className}`}>
    {Array.from({ length: lines }, (_, i) => (
      <Skeleton 
        key={i}
        height="1rem"
        width={i === lines - 1 && lines > 1 ? '75%' : '100%'}
        className="skeleton-text__line"
      />
    ))}
  </div>
);

export const SkeletonAvatar = ({ size = '2.5rem', className = '' }) => (
  <Skeleton
    width={size}
    height={size}
    borderRadius="50%"
    className={`skeleton-avatar ${className}`}
  />
);

export const SkeletonButton = ({ width = '6rem', className = '' }) => (
  <Skeleton
    width={width}
    height="2.25rem"
    borderRadius="0.5rem"
    className={`skeleton-button ${className}`}
  />
);

export const SkeletonCard = ({ className = '' }) => (
  <div className={`skeleton-card ${className}`}>
    <div className="skeleton-card__header">
      <SkeletonAvatar size="3rem" />
      <div className="skeleton-card__header-text">
        <Skeleton width="8rem" height="1.25rem" />
        <Skeleton width="6rem" height="0.875rem" />
      </div>
    </div>
    <div className="skeleton-card__content">
      <SkeletonText lines={3} />
    </div>
    <div className="skeleton-card__actions">
      <SkeletonButton width="5rem" />
      <SkeletonButton width="4rem" />
    </div>
  </div>
);

// User menu skeleton for post-login loading
export const SkeletonUserMenu = ({ className = '' }) => (
  <div className={`skeleton-user-menu ${className}`}>
    <SkeletonAvatar size="2.25rem" />
    <div className="skeleton-user-menu__info">
      <Skeleton width="4rem" height="0.875rem" />
      <Skeleton width="3rem" height="0.75rem" />
    </div>
  </div>
);

export default Skeleton;