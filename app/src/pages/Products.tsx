import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { fetchProducts, HttpError } from '../api/products';
import type { Product } from '../types/product';
import { formatPrice, thumb } from '../utils/format';
import '../css/Products.css';

//Cantidad de Skus a mostrar
const PAGE_SIZE = 12;

const csvCell = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`;

function exportCsv(products: Product[]) {
  const header = ['ID', 'Nombre', 'Marca', 'Items', 'Precio', 'Categorías', 'Link', 'Imagen'];
  const rows = products.map((p) => [  
    p.productId, p.productTitle, p.brand, p.items.join(' | '),
    p.price ?? '', p.categories.join(' | '), p.link, p.image,
  ]);
  const csv = [header, ...rows].map((r) => r.map(csvCell).join(',')).join('\n');
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'productos-seleccionados.csv';
  a.click();
  URL.revokeObjectURL(url);
}

function pageWindow(page: number, total: number): (number | '…')[] {
  const set = new Set([1, total, page - 1, page, page + 1]);
  const nums = [...set].filter((n) => n >= 1 && n <= total).sort((a, b) => a - b);
  const out: (number | '…')[] = [];
  nums.forEach((n, i) => {
    if (i > 0 && n - nums[i - 1] > 1) out.push('…');
    out.push(n);
  });
  return out;
}

export default function Products() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const page = Math.max(1, Number(params.get('page')) || 1);
  const q = params.get('q') ?? '';

  const [input, setInput] = useState(q);
  const [products, setProducts] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);
  const [selected, setSelected] = useState<Map<string, Product>>(new Map());

  useEffect(() => {
    const t = setTimeout(() => {
      const clean = input.trim();
      if (clean === q) return;
      setParams(clean ? { q: clean } : {}, { replace: true });
    }, 400);
    return () => clearTimeout(t);
  }, [input, q, setParams]);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError('');
    fetchProducts(page, q, PAGE_SIZE, controller.signal)
      .then((res) => {
        setProducts(res.data);
        setTotal(res.total);
      })
      .catch((e) => {
        if (e.name === 'AbortError') return;
        if (e instanceof HttpError && e.status === 401) {
          logout();
          navigate('/login');
          return;
        }
        setProducts([]);
        setError('No se pudieron cargar los productos');
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [page, q, reloadKey, logout, navigate]);

  const goToPage = (n: number) => {
    setParams({ ...(q ? { q } : {}), page: String(n) });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const clearSearch = () => {
    setInput('');
    setParams({}, { replace: true });
  };

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const allOnPageSelected =
    products.length > 0 && products.every((p) => selected.has(p.productId));

  const toggle = (p: Product) =>
    setSelected((prev) => {
      const next = new Map(prev);
      if (next.has(p.productId)) next.delete(p.productId);
      else next.set(p.productId, p);
      return next;
    });

  const toggleAll = () =>
    setSelected((prev) => {
      const next = new Map(prev);
      products.forEach((p) =>
        allOnPageSelected ? next.delete(p.productId) : next.set(p.productId, p)
      );
      return next;
    });

  const showSkeleton = loading && products.length === 0;
  const showEmpty = !loading && !error && products.length === 0;

  return (
    <section className="products">
  
      <header className="products__head">
        <div>
          <h1 className="products__title">Productos</h1>
          <p className="products__count" aria-live="polite">
            {loading
              ? 'Buscando...'
              : `${total.toLocaleString('es-CO')} productos${q ? ` para “${q}”` : ' en el catálogo'}`}
          </p>
        </div>

        {products.length > 0 && (
          <button type="button" className="btn btn-ghost" onClick={toggleAll}>
            {allOnPageSelected ? 'Quitar selección de la página' : 'Seleccionar todo'}
          </button>
        )}
      </header>

      <div className="search">
        <svg className="search__icon" viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
          <circle cx="11" cy="11" r="7" fill="none" stroke="currentColor" strokeWidth="2" />
          <path d="m20 20-3.5-3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
        <input
          type="search"
          aria-label="Buscar productos"
          placeholder="Buscar por nombre, marca o ID..."
          className="search__input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
        {input && (
          <button type="button" className="search__clear" aria-label="Borrar búsqueda" onClick={clearSearch}>
            ×
          </button>
        )}
      </div>

      <div className="progress" aria-hidden="true" style={{ visibility: loading ? 'visible' : 'hidden' }} />

      <ul className="grid-products" style={{ opacity: loading && products.length > 0 ? 0.5 : 1 }}>
        {products.map((p) => {
          const isSelected = selected.has(p.productId);
          return (
            <li key={p.productId} className={`pcard${isSelected ? ' is-selected' : ''}`}>
              <input
                type="checkbox"
                className="pcard__check"
                aria-label={`Seleccionar ${p.productTitle}`}
                checked={isSelected}
                onChange={() => toggle(p)}
              />

              <Link to={`/products/${p.productId}`} className="pcard__media" tabIndex={-1} aria-hidden="true">
                <img src={thumb(p.image)} alt="" loading="lazy" width={240} height={240} />
              </Link>

              <div className="pcard__body">
                <span className="pcard__brand">{p.brand}</span>
                <Link to={`/products/${p.productId}`} className="pcard__title">
                  {p.productTitle}
                </Link>
                <span className="pcard__meta">
                  ID {p.productId} · {p.items.length} {p.items.length === 1 ? 'SKU' : 'SKUs'}
                </span>
                <span className="pcard__price">{formatPrice(p.price)}</span>
              </div>
            </li>
          );
        })}

        {showSkeleton &&
          Array.from({ length: PAGE_SIZE }).map((_, i) => (
            <li key={i} className="pcard pcard--skeleton" aria-hidden="true">
              <div className="pcard__media skeleton" />
              <div className="pcard__body">
                <span className="skeleton skeleton--line" style={{ width: '40%' }} />
                <span className="skeleton skeleton--line" style={{ width: '90%' }} />
                <span className="skeleton skeleton--line" style={{ width: '60%' }} />
              </div>
            </li>
          ))}
      </ul>

      {!loading && error && (
        <div className="empty-state">
          <p role="alert" className="empty-state__message" style={{ color: '#c62828' }}>{error}</p>
          <button className="btn btn-accent" onClick={() => setReloadKey((k) => k + 1)}>
            Reintentar
          </button>
        </div>
      )}

      {showEmpty && (
        <div className="empty-state">
          <p className="empty-state__message">Sin resultados{q ? ` para “${q}”` : ''}</p>
          {q && <button className="btn btn-accent" onClick={clearSearch}>Limpiar búsqueda</button>}
        </div>
      )}

      {total > PAGE_SIZE && (
        <nav aria-label="Paginación" className="pager">
          <button onClick={() => goToPage(page - 1)} disabled={page <= 1 || loading} className="pager__btn">
            ← Anterior
          </button>

          <div className="pager__pages">
            {pageWindow(page, totalPages).map((n, i) =>
              n === '…' ? (
                <span key={`dots-${i}`} className="pager__dots">…</span>
              ) : (
                <button
                  key={n}
                  onClick={() => goToPage(n)}
                  disabled={loading}
                  className={`pager__num${n === page ? ' is-active' : ''}`}
                  aria-current={n === page ? 'page' : undefined}
                >
                  {n}
                </button>
              )
            )}
          </div>

          <button onClick={() => goToPage(page + 1)} disabled={page >= totalPages || loading} className="pager__btn">
            Siguiente →
          </button>
        </nav>
      )}


      {selected.size > 0 && (
        <div className="selection-bar no-print" role="region" aria-label="Productos seleccionados">
          <span className="selection-bar__count">
            <strong>{selected.size}</strong> {selected.size === 1 ? 'seleccionado' : 'seleccionados'}
          </span>
          <button type="button" className="selection-bar__clear" onClick={() => setSelected(new Map())}>
            Limpiar
          </button>
          <button type="button" className="btn btn-accent" onClick={() => exportCsv([...selected.values()])}>
            Exportar CSV
          </button>
        </div>
      )}
    </section>
  );
}