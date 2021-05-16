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
      const { data: product } = await api.get(`products/${productId}`)

      if(!product) {
        throw new Error()
      }

      const { data: stock } = await api.get(`stock/${productId}`)

      const productCartIndex = cart.findIndex(productCart => productCart.id === product.id)

      let newCart = [...cart]

      if (productCartIndex < 0) {
        newCart.push({
          id: product.id,
          amount: 1,
          title: product.title,
          price: product.price,
          image: product.image,
        })
      } else {
        if (stock.amount - newCart[productCartIndex].amount <= 0) {
          throw new Error('fora de estoque')
        }
        newCart[productCartIndex].amount += 1
      }
      
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart))
      setCart(newCart)
    } catch(err) {
      if(err.message.includes('fora de estoque')) {
        toast.error('Quantidade solicitada fora de estoque');
      } else {
        toast.error('Erro na adição do produto');
      }
    }
  };

  const removeProduct = async (productId: number) => {
    try {
      const productCartIndex = cart.findIndex(productCart => productCart.id === productId)

      if(productCartIndex < 0) {
        throw new Error()
      }

      const newCart = [...cart]
      newCart.splice(productCartIndex, 1)
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart))

      setCart(newCart)
    } catch(err) {
      toast.error('Erro na remoção do produto');
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      if(amount === 0 ) {
        amount = 1
      }

      const { data: stock } = await api.get(`stock/${productId}`)

      const productCartIndex = cart.findIndex(productCart => productCart.id === productId)

      if (stock.amount - amount <= 0) {
        throw new Error()
      }

      const newCart = [...cart]
      newCart[productCartIndex].amount = amount
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart))

      setCart(newCart)
    } catch(err) {
      if(err.message.includes('404')) {
        toast.error('Erro na alteração de quantidade do produto');
      } else {
        toast.error('Quantidade solicitada fora de estoque');
      }
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
