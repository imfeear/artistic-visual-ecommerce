import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { FiArrowRight, FiBox, FiX, FiAlertCircle, FiCheckCircle } from 'react-icons/fi';
import { imageUrl } from '../lib/format';

export function Button({
  children,
  variant = 'primary',
  className = '',
  to,
  href,
  busy,
  disabled,
  ...props
}) {
  const Component = to ? Link : href ? 'a' : 'button';
  return (
    <Component
      {...props}
      {...(to
        ? { to }
        : href
          ? { href }
          : { type: props.type || 'button', disabled: disabled || busy })}
      aria-busy={busy || undefined}
      className={`btn btn-${variant} ${className}`}
    >
      {busy && <span className="spinner" aria-hidden="true" />}
      {children}
    </Component>
  );
}
export function Badge({ children, tone = 'neutral' }) {
  return <span className={`badge badge-${tone}`}>{children}</span>;
}
export function ProductImage({ src, alt = '', className = '', ...props }) {
  return (
    <img
      src={imageUrl(src) || '/frevo.svg'}
      alt={alt}
      {...props}
      className={className}
      onError={(e) => {
        if (e.currentTarget.getAttribute('src') !== '/frevo.svg')
          e.currentTarget.src = '/frevo.svg';
      }}
    />
  );
}
export function EmptyState({ title = 'Nada por aqui ainda', description, action, error = false }) {
  return (
    <div className={`empty-state ${error ? 'is-error' : ''}`} role={error ? 'alert' : undefined}>
      <span className="state-icon">{error ? <FiAlertCircle /> : <FiBox />}</span>
      <h3>{title}</h3>
      <p>{description}</p>
      {action}
    </div>
  );
}
export function ProductSkeletons({ count = 4 }) {
  return (
    <div className="product-grid" aria-label="Carregando produtos" aria-busy="true">
      {Array.from({ length: count }, (_, i) => (
        <div className="product-skeleton" key={i}>
          <div className="skeleton skeleton-image" />
          <div className="skeleton skeleton-title" />
          <div className="skeleton skeleton-text" />
          <div className="skeleton skeleton-price" />
        </div>
      ))}
    </div>
  );
}
export function Notice({ notice, onClose }) {
  useEffect(() => {
    if (!notice || notice.tone === 'error') return;
    const timer = setTimeout(onClose, 5000);
    return () => clearTimeout(timer);
  }, [notice, onClose]);
  if (!notice) return null;
  return (
    <div
      className={`notice notice-${notice.tone || 'success'}`}
      role={notice.tone === 'error' ? 'alert' : 'status'}
    >
      {notice.tone === 'error' ? <FiAlertCircle /> : <FiCheckCircle />}
      <span>{notice.text}</span>
      <button className="icon-btn" onClick={onClose} aria-label="Fechar mensagem">
        <FiX />
      </button>
    </div>
  );
}
export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  className = '',
  busy = false,
}) {
  const ref = useRef(null);
  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement;
    const dialog = ref.current;
    dialog?.showModal();
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      dialog?.close();
      document.body.style.overflow = overflow;
      previous?.focus();
    };
  }, [open]);
  if (!open) return null;
  return (
    <dialog
      ref={ref}
      className={`dialog ${className}`}
      aria-labelledby="dialog-heading"
      onCancel={(e) => {
        e.preventDefault();
        if (!busy) onClose();
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget && !busy) onClose();
      }}
    >
      <div className="dialog-content">
        <header className="dialog-header">
          <div>
            <h2 id="dialog-heading">{title}</h2>
            {description && <p>{description}</p>}
          </div>
          <button
            type="button"
            className="icon-btn"
            disabled={busy}
            onClick={onClose}
            aria-label="Fechar"
          >
            <FiX />
          </button>
        </header>
        {children}
      </div>
    </dialog>
  );
}
export function SectionTitle({ eyebrow, title, description, to, action = 'Ver todas as peças' }) {
  return (
    <div className="section-title">
      <div>
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h2>{title}</h2>
        {description && <p>{description}</p>}
      </div>
      {to && (
        <Link className="text-link" to={to}>
          {action}
          <FiArrowRight />
        </Link>
      )}
    </div>
  );
}
