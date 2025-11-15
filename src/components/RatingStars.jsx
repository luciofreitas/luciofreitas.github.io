// RatingStars.jsx - Componente para exibir e permitir avaliação por estrelas

import React, { useState } from 'react';
import './RatingStars.css';

function RatingStars({ 
  rating = 0, 
  totalRatings = 0, 
  onRate = null, 
  readOnly = false,
  size = 'medium'
}) {
  const [hoverRating, setHoverRating] = useState(0);
  const [isRating, setIsRating] = useState(false);
  const [confirmedVote, setConfirmedVote] = useState(null);

  const handleStarClick = (starValue) => {
    if (!readOnly && onRate) {
      setIsRating(true);
      onRate(starValue);
      // Persist the user's selection immediately so the UI doesn't revert
      setConfirmedVote(starValue);
      // Reset após um curto delay para feedback visual
      setTimeout(() => setIsRating(false), 300);
    }
  };

  const handleStarHover = (starValue) => {
    if (!readOnly) {
      setHoverRating(starValue);
    }
  };

  const handleMouseLeave = () => {
    if (!readOnly) {
      setHoverRating(0);
    }
  };

  const displayRating = hoverRating || confirmedVote || rating;

  // If the parent prop `rating` updates (e.g. after server/local persistence),
  // clear the temporary confirmedVote so the component reflects canonical value.
  React.useEffect(() => {
    if (confirmedVote !== null && rating && Number(rating) > 0) {
      // clear temporary vote once the official rating updates
      setConfirmedVote(null);
    }
  }, [rating, confirmedVote]);

  return (
    <div className={`rating-stars-container ${size} ${readOnly ? 'read-only' : 'interactive'}`}>
      <div 
        className="stars-wrapper" 
        onMouseLeave={handleMouseLeave}
      >
        {[1, 2, 3, 4, 5].map((starValue) => (
          <button
            key={starValue}
            type="button"
            className={`star-button ${starValue <= displayRating ? 'filled' : 'empty'} ${isRating ? 'animating' : ''}`}
            onClick={() => handleStarClick(starValue)}
            onMouseEnter={() => handleStarHover(starValue)}
            disabled={readOnly}
            aria-label={`${starValue} ${starValue === 1 ? 'estrela' : 'estrelas'}`}
          >
            <svg 
              viewBox="0 0 24 24" 
              fill="currentColor"
            >
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
          </button>
        ))}
      </div>
      
      {totalRatings > 0 && rating > 0 && (
        <div className="rating-info">
          <span className="rating-average">{rating.toFixed(1)}</span>
          <span className="rating-count">({totalRatings} {totalRatings === 1 ? 'avaliação' : 'avaliações'})</span>
        </div>
      )}

      {!readOnly && totalRatings === 0 && (
        <span className="rating-prompt">Seja o primeiro a avaliar</span>
      )}
      
      {readOnly && totalRatings === 0 && (
        <span className="rating-prompt">Sem avaliações ainda</span>
      )}
    </div>
  );
}

export default RatingStars;
