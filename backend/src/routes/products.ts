import { Router } from 'express';
import { requireAuth } from '../auth';

const VTEX = 'https://offcorss.myvtex.com/api/catalog_system/pub/products/search/';
const STORE = 'https://www.offcorss.com';
const TIMEOUT_MS = 8000;

interface VtexProduct {
  productId: string;
  productName: string;
  brand: string;
  description?: string;
  linkText?: string;
  categories?: string[];
  items?: {
    itemId: string;
    images?: { imageUrl: string }[];
    sellers?: { commertialOffer?: { Price?: number; ListPrice?: number } }[];
  }[];
}

const router = Router();

const mapProduct = (p: VtexProduct) => {
  const item = p.items?.[0];
  const offer = item?.sellers?.[0]?.commertialOffer;

  return {
    productId: p.productId,
    brand: p.brand,
    productTitle: p.productName,
    items: (p.items ?? []).map((i) => i.itemId),
    image: item?.images?.[0]?.imageUrl ?? '',
    description: p.description ?? '',
    link: p.linkText ? `${STORE}/${p.linkText}/p` : STORE,
    categories: p.categories ?? [],
    price: offer?.Price ?? 0,
    listPrice: offer?.ListPrice ?? 0,
  };
};

const fetchVtex = (url: URL) => fetch(url, { signal: AbortSignal.timeout(TIMEOUT_MS) });

// GET /api/products?page=1&pageSize=12&q=texto
router.get('/', requireAuth, async (req, res) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const pageSize = Math.min(50, Math.max(1, Number(req.query.pageSize) || 12));
    const q = String(req.query.q ?? '').trim().slice(0, 80);
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const url = new URL(VTEX);
    url.searchParams.set('_from', String(from));
    url.searchParams.set('_to', String(to));
    if (q) url.searchParams.set('ft', q);

    const r = await fetchVtex(url);
    if (!r.ok) return res.status(502).json({ error: 'Error consultando VTEX' });

    const total = Number(r.headers.get('resources')?.split('/')[1]) || 0;
    const data = (await r.json()) as VtexProduct[];

    res.json({ page, pageSize, total, data: data.map(mapProduct) });
  } catch {
    res.status(500).json({ error: 'Error interno' });
  }
});

router.get('/:id', requireAuth, async (req, res) => {
  if (!/^\d+$/.test(req.params.id)) {
    return res.status(400).json({ error: 'Id inválido' });
  }
  try {
    const url = new URL(VTEX);
    url.searchParams.set('fq', `productId:${req.params.id}`);

    const r = await fetchVtex(url);
    if (!r.ok) return res.status(502).json({ error: 'Error consultando VTEX' });

    const data = (await r.json()) as VtexProduct[];
    if (!data.length) return res.status(404).json({ error: 'No encontrado' });

    res.json(mapProduct(data[0]));
  } catch {
    res.status(500).json({ error: 'Error interno' });
  }
});

export default router;