import { useEffect, useRef, useState, type KeyboardEvent, type MouseEvent } from 'react';
import { createPortal } from 'react-dom';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowUpRight, Heart, Printer, X, ZoomIn } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import { fetchProduct, HttpError } from '../api/products';
import type { Product } from '../types/product';
import { formatPrice, thumb } from '../utils/format';
import '../css/Productdetail.css';

const STORE_URL = 'https://www.offcorss.com';
const FAV_KEY = 'offcorss:favorites';

const cleanText = (s: string) => s.replace(/<br\s*\/?>/gi, '\n').trim();
const cleanCategory = (c: string) => c.split('/').filter(Boolean).join(' › ');

const readFavorites = (): string[] => {
  try {
    return JSON.parse(localStorage.getItem(FAV_KEY) || '[]');
  } catch {
    return [];
  }
};

function ProductSkeleton() {
  return (
    <div className="pd-skeleton" aria-hidden="true">
      <div className="pd-skeleton__media shimmer" />
      <div className="pd-skeleton__info">
        <div className="shimmer pd-skeleton__line" style={{ width: '25%' }} />
        <div className="shimmer pd-skeleton__line" style={{ width: '85%', height: 28 }} />
        <div className="shimmer pd-skeleton__line" style={{ width: '35%', height: 22 }} />
        <div className="shimmer pd-skeleton__line" style={{ width: '100%', height: 52 }} />
        <div className="shimmer pd-skeleton__line" style={{ width: '90%' }} />
        <div className="shimmer pd-skeleton__line" style={{ width: '70%' }} />
      </div>
    </div>
  );
}

function BackButton({ onClick }: { onClick: () => void }) {
  return (
    <button type="button" className="pd-back" onClick={onClick}>
      <ArrowLeft size={18} strokeWidth={2.5} aria-hidden="true" />
      <span>Volver atrás</span>
    </button>
  );
}

function AnimatedPrice({ value }: { value: number }) {
  const [shown, setShown] = useState(0);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setShown(value);
      return;
    }
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const p = Math.min((now - start) / 900, 1);
      setShown(Math.round(value * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value]);

  return <span className="pd-price__now">{formatPrice(shown)}</span>;
}

function FavoriteButton({ productId }: { productId: string }) {
  const [active, setActive] = useState(() => readFavorites().includes(productId));

  const toggle = () => {
    const favs = readFavorites();
    const next = active ? favs.filter((f) => f !== productId) : [...favs, productId];
    try {
      localStorage.setItem(FAV_KEY, JSON.stringify(next));
    } catch {
      return;
    }
    setActive(!active);
  };

  return (
    <button
      type="button"
      className={`pd__fav no-print${active ? ' is-active' : ''}`}
      onClick={toggle}
      aria-pressed={active}
      aria-label={active ? 'Quitar de favoritos' : 'Guardar en favoritos'}
    >
      <Heart size={20} strokeWidth={2.4} aria-hidden="true" />
    </button>
  );
}

function ZoomImage({ src, alt }: { src: string; alt: string }) {
  const [loaded, setLoaded] = useState(false);
  const [open, setOpen] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (imgRef.current?.complete) setLoaded(true);
  }, [src]);

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const onMove = (e: MouseEvent<HTMLDivElement>) => {
    const box = e.currentTarget.getBoundingClientRect();
    e.currentTarget.style.setProperty('--zx', `${((e.clientX - box.left) / box.width) * 100}%`);
    e.currentTarget.style.setProperty('--zy', `${((e.clientY - box.top) / box.height) * 100}%`);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      setOpen(true);
    }
  };

  return (
    <>
      <div
        className={`pd-zoom${loaded ? ' is-loaded' : ''}`}
        onMouseMove={onMove}
        onClick={() => setOpen(true)}
        onKeyDown={onKeyDown}
        role="button"
        tabIndex={0}
        aria-label="Ampliar imagen"
      >
        <img
          ref={imgRef}
          src={thumb(src, 800)}
          srcSet={`${thumb(src, 480)} 480w, ${thumb(src, 800)} 800w, ${thumb(src, 1200)} 1200w`}
          sizes="(min-width: 900px) 50vw, 100vw"
          alt={alt}
          width={800}
          height={800}
          decoding="async"
          fetchPriority="high"
          onLoad={() => setLoaded(true)}
        />
        <span className="pd-zoom__hint no-print" aria-hidden="true">
          <ZoomIn size={16} />
          Clic para ampliar
        </span>
      </div>

      {open &&
        createPortal(
          <div
            className="pd-lightbox"
            role="dialog"
            aria-modal="true"
            aria-label={alt}
            onClick={() => setOpen(false)}
          >
            <button
              type="button"
              className="pd-lightbox__close"
              onClick={() => setOpen(false)}
              aria-label="Cerrar"
              autoFocus
            >
              <X size={22} strokeWidth={2.5} aria-hidden="true" />
            </button>
            <img src={thumb(src, 1200)} alt={alt} onClick={(e) => e.stopPropagation()} />
          </div>,
          document.body,
        )}
    </>
  );
}

function BuyButton({ href, compact = false }: { href: string; compact?: boolean }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer noopener"
      className={`buy${compact ? ' buy--compact' : ''}`}
    >
      <span className="buy__label">{compact ? 'Comprar' : 'Comprar en OFFCORSS'}</span>
      <span className="buy__icon">
        <ArrowUpRight size={compact ? 16 : 20} strokeWidth={2.5} aria-hidden="true" />
      </span>
    </a>
  );
}

function SpecsList({ product }: { product: Product }) {
  const specs = [
    { label: 'ID', value: product.productId },
    { label: 'Marca', value: product.brand },
    { label: 'SKU', value: product.items.join(', ') },
  ].filter((s) => s.value);

  return (
    <dl className="detail-list">
      {specs.map((s) => (
        <div key={s.label} className="detail-list__row">
          <dt>{s.label}</dt>
          <dd>{s.value}</dd>
        </div>
      ))}
      {product.categories.length > 0 && (
        <div className="detail-list__row">
          <dt>Categorías</dt>
          <dd className="detail-list__tags">
            {product.categories.map((c) => (
              <span key={c} className="tag tag--soft">
                {cleanCategory(c)}
              </span>
            ))}
          </dd>
        </div>
      )}
    </dl>
  );
}

type TabId = 'desc' | 'specs';

const TABS: { id: TabId; label: string }[] = [
  { id: 'desc', label: 'Descripción' },
  { id: 'specs', label: 'Especificaciones' },
];

function ProductTabs({ product }: { product: Product }) {
  const [active, setActive] = useState<TabId>('desc');

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    const i = TABS.findIndex((t) => t.id === active);
    const step = e.key === 'ArrowRight' ? 1 : TABS.length - 1;
    const next = TABS[(i + step) % TABS.length];
    setActive(next.id);
    document.getElementById(`tab-${next.id}`)?.focus();
  };

  return (
    <div className="pd-tabs">
      <div
        className="pd-tabs__list no-print"
        role="tablist"
        aria-label="Información del producto"
        onKeyDown={onKeyDown}
      >
        {TABS.map((t) => (
          <button
            key={t.id}
            id={`tab-${t.id}`}
            type="button"
            role="tab"
            className="pd-tabs__tab"
            aria-selected={active === t.id}
            aria-controls={`panel-${t.id}`}
            tabIndex={active === t.id ? 0 : -1}
            onClick={() => setActive(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div
        id="panel-desc"
        role="tabpanel"
        aria-labelledby="tab-desc"
        className="pd-tabs__panel"
        data-print-title="Descripción"
        hidden={active !== 'desc'}
      >
        <p className="pd-description">
          {cleanText(product.description) || 'Este producto no tiene descripción.'}
        </p>
      </div>

      <div
        id="panel-specs"
        role="tabpanel"
        aria-labelledby="tab-specs"
        className="pd-tabs__panel"
        data-print-title="Especificaciones"
        hidden={active !== 'specs'}
      >
        <SpecsList product={product} />
      </div>
    </div>
  );
}

export default function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const { logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const ctaRef = useRef<HTMLDivElement>(null);
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showSticky, setShowSticky] = useState(false);

  const goBack = () => {
    if (location.key !== 'default') navigate(-1);
    else navigate('/products');
  };

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    setLoading(true);
    setError('');
    window.scrollTo({ top: 0 });

    fetchProduct(id)
      .then((p) => {
        if (!cancelled) setProduct(p);
      })
      .catch((e) => {
        if (cancelled) return;
        if (e instanceof HttpError && e.status === 401) {
          logout();
          navigate('/login');
        } else if (e instanceof HttpError && e.status === 404) {
          setError('Producto no encontrado');
        } else {
          setError('No se pudo cargar el producto');
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [id, logout, navigate]);

  useEffect(() => {
    if (!product) return;
    const previous = document.title;
    document.title = `${product.productTitle} | ${product.brand}`;
    return () => {
      document.title = previous;
    };
  }, [product]);

  useEffect(() => {
    const node = ctaRef.current;
    if (!node) return;
    const observer = new IntersectionObserver(([entry]) => setShowSticky(!entry.isIntersecting));
    observer.observe(node);
    return () => observer.disconnect();
  }, [product]);

  useEffect(() => {
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      if (document.querySelector('.pd-lightbox')) return;
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      if (location.key !== 'default') navigate(-1);
      else navigate('/products');
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [location.key, navigate]);

  if (loading) {
    return (
      <div className="pd-page" aria-busy="true">
        <div className="pd-topbar no-print">
          <BackButton onClick={goBack} />
        </div>
        <ProductSkeleton />
      </div>
    );
  }

  if (error || !product) {
    return (
      <section className="pd-page">
        <div className="empty-state card">
          <p role="alert" className="empty-state__message">
            {error || 'Producto no disponible'}
          </p>
          <Link to="/products" className="btn btn-primary">
            Volver al listado
          </Link>
        </div>
      </section>
    );
  }

  const buyUrl = product.link || STORE_URL;
  const { listPrice } = product;
  const discount =
    listPrice && listPrice > product.price
      ? Math.round((1 - product.price / listPrice) * 100)
      : 0;

  return (
    <div className="pd-page">
      <div className="pd-topbar no-print">
        <BackButton onClick={goBack} />
      </div>

      <article className="pd" aria-labelledby="product-title">
        <div className="pd__media">
          <div className="pd__stage">
            {discount > 0 && <span className="pd__badge">-{discount}%</span>}
            <FavoriteButton key={product.productId} productId={product.productId} />
            <ZoomImage src={product.image} alt={product.productTitle} />
          </div>
        </div>

        <div className="pd__info">
          <div className="pd__meta">
            <span className="pd__brand">{product.brand}</span>
            <span className="pd__meta-sep" aria-hidden="true" />
            <span className="pd__sku">SKU {product.productId}</span>
          </div>

          <h1 id="product-title" className="pd__title">
            {product.productTitle}
          </h1>

          <div className="pd-price">
            <AnimatedPrice value={product.price} />
            {discount > 0 && listPrice && (
              <>
                <s className="pd-price__was">{formatPrice(listPrice)}</s>
                <span className="pd-price__off">-{discount}%</span>
              </>
            )}
          </div>

          <div className="pd__cta no-print" ref={ctaRef}>
            <BuyButton href={buyUrl} />
            <p className="pd__cta-note">Termina tu compra en offcorss.com.</p>
            <button type="button" className="pd__action" onClick={() => window.print()}>
              <Printer size={16} aria-hidden="true" />
              Imprimir
            </button>
          </div>

          <ProductTabs product={product} />
        </div>
      </article>

      <div
        className={`pd-sticky no-print${showSticky ? ' is-visible' : ''}`}
        role="region"
        aria-label="Comprar"
      >
        <span className="pd-sticky__price">{formatPrice(product.price)}</span>
        <BuyButton href={buyUrl} compact />
      </div>
    </div>
  );
}