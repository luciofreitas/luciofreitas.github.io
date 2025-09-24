import React, { useEffect, useRef } from 'react';
import useFocusTrap from './hooks/useFocusTrap';

export default function CompatibilityModal({ show, onClose, title, titleIcon, children }) {
	const modalRef = useRef(null);

	useFocusTrap(show, modalRef);

	useEffect(() => {
		if (show) {
			// Lock background scroll when modal is open
			const prev = document.body.style.overflow;
			document.body.style.overflow = 'hidden';
			return () => { document.body.style.overflow = prev; };
		}
		return undefined;
	}, [show]);

	if (!show) return null;

	const handleOverlayClick = (e) => {
		if (e.target.classList.contains('modal-overlay')) {
			onClose();
		}
	};

	return (
		<div className="modal-overlay" onClick={handleOverlayClick}>
			<div ref={modalRef} className="compat-modal" role="dialog" aria-modal="true" aria-label={title || 'Modal'}>
				<div className="app-compat-header">
					<div className="app-compat-title-wrapper">
						{titleIcon && <img src={titleIcon} alt="Ícone" className="app-compat-title-icon" />}
						<span className="app-compat-title">{title}</span>
					</div>
					<button className="app-compat-close" aria-label="Fechar" onClick={onClose}>✕</button>
				</div>
				<div className="app-compat-body">
					{children}
				</div>
			</div>
		</div>
	);
}