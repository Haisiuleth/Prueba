export const formatPrice = (price: number | null) =>
  price == null
    ? '—'
    : new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        maximumFractionDigits: 0,
      }).format(price);

export const thumb = (url: string, w = 400) =>
  url.replace(/\/ids\/(\d+)(?:-\d+-auto)?\//, `/ids/$1-${w}-auto/`);