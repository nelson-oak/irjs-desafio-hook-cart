import { createContext, ReactNode, useContext, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product, Stock } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem('@RocketShoes:cart');

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  const addProduct = async (productId: number) => {
    try {
      const { data: stock } = await api.get(`stock/${productId}`)
      
      if (stock.amount < 1) {
        throw new Error('Product out of stock!')
      }

      const { data: product } = await api.get(`products/${productId}`)

      const productCartIndex = cart.findIndex(productCart => productCart.id === product.id)

      if (productCartIndex < 0) {
        setCart([
          ...cart,
          {
            id: product.id,
            title: product.title,
            price: product.price,
            image: product.image,
            amount: 1
          }
        ])
      } else {
        const newCart = [...cart]
        newCart[productCartIndex].amount += 1
        setCart(newCart)
      }

      localStorage.setItem('@RocketShoes:cart', JSON.stringify(cart))

      await api.put(`stock/${stock.id}`, {
        amount: stock.amount - 1
      })
    } catch {
      toast.error('Erro na adição do produto');
    }
  };

  const removeProduct = (productId: number) => {
    try {
      // TODO
    } catch {
      // TODO
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      // TODO
    } catch {
      // TODO
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
