import { products } from './products';

export const MAX_ITEM_QUANTITY = 10;
export const AVAILABLE_SIZES = [35, 36, 37, 38, 39, 40, 41, 42];
export const CART_LIMIT_MESSAGE = `Puedes seleccionar hasta ${MAX_ITEM_QUANTITY} pares por producto y talla.`;
export const CART_RECOVERY_MESSAGE = `Ajustamos tu carrito: descartamos datos inválidos, unificamos productos repetidos y aplicamos el límite de ${MAX_ITEM_QUANTITY} pares por producto y talla.`;

const productIds = new Set(products.map((product) => product.id));
const validSelection = (id, size) => productIds.has(id) && AVAILABLE_SIZES.includes(size);

// Treat persisted values as untrusted input; retain only the cart's own fields.
export function normalizeCart(value) {
  if (!Array.isArray(value)) return { items: [], adjusted: true };
  const lines = new Map();
  let adjusted = false;
  for (const item of value) {
    if (
      !item ||
      Array.isArray(item) ||
      !validSelection(item.id, item.size) ||
      !Number.isSafeInteger(item.qty) ||
      item.qty <= 0
    ) {
      adjusted = true;
      continue;
    }
    const key = `${item.id}:${item.size}`;
    const previous = lines.get(key);
    const qty = Math.min(
      MAX_ITEM_QUANTITY,
      (previous?.qty || 0) + Math.min(item.qty, MAX_ITEM_QUANTITY)
    );
    if (previous || qty !== item.qty || Object.keys(item).length !== 3) adjusted = true;
    lines.set(key, { id: item.id, size: item.size, qty });
  }
  return { items: [...lines.values()], adjusted };
}

export function cartReducer(state, action) {
  if (action.type === 'clear') return { items: [], notice: '', feedback: null };
  if (!['add', 'change'].includes(action.type)) return state;

  const { id, size } = action;
  function reject(message) {
    return { ...state, notice: message, feedback: { id, size, error: true, message } };
  }
  if (!validSelection(id, size)) return reject('El producto o la talla no son válidos.');
  const delta = action.type === 'add' ? 1 : action.delta;
  if (!Number.isSafeInteger(delta))
    return reject('La cantidad debe ser un número entero válido.');
  const existing = state.items.find((item) => item.id === id && item.size === size);
  if (!existing && action.type === 'change') return state;
  const currentQty = existing?.qty || 0;
  if (delta > MAX_ITEM_QUANTITY - currentQty) return reject(CART_LIMIT_MESSAGE);
  const nextQty = Math.max(0, currentQty + delta);
  const items = existing
    ? state.items
        .map((item) =>
          item.id === id && item.size === size ? { ...item, qty: nextQty } : item
        )
        .filter((item) => item.qty > 0)
    : [...state.items, { id, size, qty: nextQty }].filter((item) => item.qty > 0);
  return {
    items,
    notice: '',
    feedback: {
      id,
      size,
      error: false,
      message:
        action.type === 'add' ? 'Producto agregado al carrito.' : 'Cantidad actualizada.',
    },
  };
}
