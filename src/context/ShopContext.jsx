import { createContext, useContext, useEffect, useReducer, useState } from 'react';
import { products } from '../data/products';
import { cartReducer, normalizeCart, CART_RECOVERY_MESSAGE } from '../data/cart';
const ShopContext = createContext(null);
function read(key, validate) {
  try {
    const value = JSON.parse(localStorage.getItem(key) || '[]');
    return Array.isArray(value) ? value.filter(validate) : [];
  } catch {
    return [];
  }
}
const exists = (id) => products.some((product) => product.id === id);
function loadCart() {
  try {
    const { items, adjusted } = normalizeCart(
      JSON.parse(localStorage.getItem('tenis-carrito') || '[]')
    );
    return { items, notice: adjusted ? CART_RECOVERY_MESSAGE : '', feedback: null };
  } catch {
    return {
      items: [],
      notice:
        'No pudimos recuperar el carrito guardado. Puedes crear una nueva selección.',
      feedback: null,
    };
  }
}
export function ShopProvider({ children }) {
  const [favorites, setFavorites] = useState(() => read('tenis-favoritos', exists));
  const [cartState, dispatchCart] = useReducer(cartReducer, undefined, loadCart);
  const cart = cartState.items;
  useEffect(() => {
    try {
      localStorage.setItem('tenis-favoritos', JSON.stringify(favorites));
      localStorage.setItem('tenis-carrito', JSON.stringify(cart));
    } catch {
      /* Funciona también sin almacenamiento. */
    }
  }, [favorites, cart]);
  function toggleFavorite(id) {
    setFavorites((current) =>
      current.includes(id) ? current.filter((value) => value !== id) : [...current, id]
    );
  }
  function addToCart(id, size) {
    dispatchCart({ type: 'add', id, size });
  }
  function changeQuantity(id, size, delta) {
    dispatchCart({ type: 'change', id, size, delta });
  }
  function clearCart() {
    dispatchCart({ type: 'clear' });
  }
  return (
    <ShopContext.Provider
      value={{
        favorites,
        cart,
        toggleFavorite,
        addToCart,
        changeQuantity,
        clearCart,
        cartNotice: cartState.notice,
        cartFeedback: cartState.feedback,
      }}
    >
      {children}
    </ShopContext.Provider>
  );
}
export const useShop = () => useContext(ShopContext);
