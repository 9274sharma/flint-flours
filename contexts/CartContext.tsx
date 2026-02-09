"use client";

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  ReactNode,
} from "react";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";
import { logger } from "@/lib/logger";

export type CartItem = {
  productId: string;
  productName: string;
  productSlug: string;
  variantId: string;
  variantName: string;
  price: number;
  discountPercent: number;
  imageUrl: string | null;
  quantity: number;
  stock?: number; // Optional: stock info from API
  isActive?: boolean; // Optional: variant active status from API
};

type CartContextType = {
  items: CartItem[];
  addItem: (item: Omit<CartItem, "quantity">) => void;
  removeItem: (productId: string, variantId: string) => void;
  updateQuantity: (productId: string, variantId: string, quantity: number) => void;
  getItemQuantity: (productId: string, variantId: string) => number;
  getTotalItems: () => number;
  clearCart: () => void;
  refreshCart: () => Promise<void>;
  isLoading: boolean;
};

const CartContext = createContext<CartContextType | undefined>(undefined);

const STORAGE_KEY = "flint_flours_cart";

// Helper to save to localStorage
function saveToLocalStorage(items: CartItem[]) {
  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }
}

// Helper to load from localStorage
function loadFromLocalStorage(): CartItem[] {
  if (typeof window !== "undefined") {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (e) {
        logger.error("Error parsing cart from localStorage", { error: String(e) });
      }
    }
  }
  return [];
}

// Helper to merge carts (localStorage + database)
function mergeCarts(localItems: CartItem[], dbItems: CartItem[]): CartItem[] {
  const merged = new Map<string, CartItem>();

  // Add database items first (they're more authoritative)
  dbItems.forEach((item) => {
    const key = `${item.productId}-${item.variantId}`;
    merged.set(key, item);
  });

  // Add local items, but don't override if DB item exists
  localItems.forEach((item) => {
    const key = `${item.productId}-${item.variantId}`;
    if (!merged.has(key)) {
      merged.set(key, item);
    } else {
      // If exists in DB, use DB quantity (or merge if needed)
      const existing = merged.get(key)!;
      merged.set(key, existing);
    }
  });

  return Array.from(merged.values());
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const loadingRef = React.useRef(false); // Prevent multiple simultaneous loads
  const loadCartRef = React.useRef<(() => Promise<void>) | null>(null);
  const pendingRequestsRef = React.useRef<Set<string>>(new Set()); // Track pending API requests

  // Sync cart to database (only sync differences, don't fetch again)
  const syncCartToDatabase = useCallback(async (itemsToSync: CartItem[], currentDbItems: CartItem[]) => {
    if (!user) return;

    try {
      const syncKeys = new Set(
        itemsToSync.map((i) => `${i.productId}-${i.variantId}`)
      );
      const dbKeys = new Set(
        currentDbItems.map((i) => `${i.productId}-${i.variantId}`)
      );

      // Add new items with POST, update existing with PUT
      for (const item of itemsToSync) {
        const dbItem = currentDbItems.find(
          (i) => i.productId === item.productId && i.variantId === item.variantId
        );

        if (!dbItem) {
          const res = await fetch("/api/cart", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              productId: item.productId,
              variantId: item.variantId,
              quantity: item.quantity,
            }),
          });
          if (!res.ok) logger.warn("Cart sync: failed to add item", { productId: item.productId, variantId: item.variantId });
        } else if (dbItem.quantity !== item.quantity) {
          const res = await fetch("/api/cart", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              productId: item.productId,
              variantId: item.variantId,
              quantity: item.quantity,
            }),
          });
          if (!res.ok) logger.warn("Cart sync: failed to update item", { productId: item.productId, variantId: item.variantId });
        }
      }

      // Remove items from DB that aren't in local cart
      for (const dbItem of currentDbItems) {
        const key = `${dbItem.productId}-${dbItem.variantId}`;
        if (!syncKeys.has(key)) {
          const res = await fetch(
            `/api/cart?productId=${dbItem.productId}&variantId=${dbItem.variantId}`,
            { method: "DELETE" }
          );
          if (!res.ok) logger.warn("Cart sync: failed to remove item", { productId: dbItem.productId, variantId: dbItem.variantId });
        }
      }
    } catch (error) {
      logger.error("Cart sync failed", { error: String(error) });
    }
  }, [user]);

  // Load cart from database (only called once per auth state change)
  const loadCartFromDatabase = useCallback(async () => {
    if (loadingRef.current) return; // Prevent concurrent loads
    
    const currentUser = user; // Capture current user
    if (!currentUser) return;

    loadingRef.current = true;
    try {
      setIsLoading(true);
      const response = await fetch("/api/cart");
      if (response.ok) {
        const data = await response.json();
        const dbItems = data.items || [];

        // Merge with localStorage items (as backup)
        const localItems = loadFromLocalStorage();
        const merged = mergeCarts(localItems, dbItems);

        setItems(merged);
        saveToLocalStorage(merged);

        // Only sync if there are differences (don't cause another fetch)
        const hasDifferences = merged.length !== dbItems.length || 
            merged.some((item) => {
              const dbItem = dbItems.find(
                (dbi: CartItem) => dbi.productId === item.productId && dbi.variantId === item.variantId
              );
              return !dbItem || dbItem.quantity !== item.quantity;
            });
        
        if (hasDifferences && currentUser) {
          await syncCartToDatabase(merged, dbItems);
        }
      } else {
        // If API fails, try localStorage as fallback
        const localItems = loadFromLocalStorage();
        setItems(localItems);
      }
    } catch (error) {
      logger.error("Error loading cart from database", { error: String(error) });
      // Fallback to localStorage if logged in
      const localItems = loadFromLocalStorage();
      setItems(localItems);
    } finally {
      setIsLoading(false);
      loadingRef.current = false;
    }
  }, [user, syncCartToDatabase]);

  // Keep ref updated with latest function
  React.useEffect(() => {
    loadCartRef.current = loadCartFromDatabase;
  }, [loadCartFromDatabase]);

  // Load user and sync cart on mount
  useEffect(() => {
    const supabase = createClient();
    let wasLoggedIn = false;
    
    // Get initial user
    supabase.auth.getUser().then(({ data: { user: u } }) => {
      setUser(u);
      wasLoggedIn = !!u;
      if (u && !loadingRef.current && loadCartRef.current) {
        loadCartRef.current();
      } else {
        // Not logged in - start with empty cart
        setItems([]);
        setIsLoading(false);
      }
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      const currentUser = session?.user ?? null;
      const hadPreviousUser = wasLoggedIn;
      
      setUser(currentUser);
      wasLoggedIn = !!currentUser;

      if (currentUser) {
        // User logged in - sync with database (only once, prevent concurrent loads)
        if (!loadingRef.current && loadCartRef.current) {
          await loadCartRef.current();
        }
      } else {
        // User logged out - clear cart and localStorage
        loadingRef.current = false; // Reset loading flag
        if (hadPreviousUser) {
          setItems([]);
          saveToLocalStorage([]);
        } else {
          setItems([]);
        }
        setIsLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []); // Empty deps - only run on mount, use ref for function

  const addItem = useCallback(
    async (item: Omit<CartItem, "quantity">) => {
      const requestKey = `${item.productId}-${item.variantId}`;
      
      // Prevent duplicate requests for the same item
      if (pendingRequestsRef.current.has(requestKey)) {
        return;
      }

      let updated: CartItem[];
      let isNewItem: boolean;
      
      setItems((prev) => {
        const existingIndex = prev.findIndex(
          (i) => i.productId === item.productId && i.variantId === item.variantId
        );

        if (existingIndex >= 0) {
          // Update quantity if item already exists
          updated = [...prev];
          updated[existingIndex] = {
            ...updated[existingIndex],
            quantity: updated[existingIndex].quantity + 1,
          };
          isNewItem = false;
        } else {
          // Add new item
          updated = [...prev, { ...item, quantity: 1 }];
          isNewItem = true;
        }

        // Only save to localStorage if logged in (for backup/sync)
        // Unauthenticated users' carts are not persisted
        if (user) {
          saveToLocalStorage(updated);
        }

        return updated;
      });

      // Sync to database if logged in (outside of setItems callback to prevent duplicate calls)
      if (user) {
        pendingRequestsRef.current.add(requestKey);
        try {
          await fetch("/api/cart", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              productId: item.productId,
              variantId: item.variantId,
              quantity: 1,
            }),
          });
        } catch (error) {
          logger.error("Error syncing cart item", { error: String(error) });
        } finally {
          pendingRequestsRef.current.delete(requestKey);
        }
      }
    },
    [user]
  );

  const removeItem = useCallback(
    async (productId: string, variantId: string) => {
      const requestKey = `delete-${productId}-${variantId}`;
      
      // Prevent duplicate requests
      if (pendingRequestsRef.current.has(requestKey)) {
        return;
      }

      setItems((prev) => {
        const updated = prev.filter(
          (i) => !(i.productId === productId && i.variantId === variantId)
        );
        
        // Only save to localStorage if logged in
        if (user) {
          saveToLocalStorage(updated);
        }

        return updated;
      });

      // Remove from database if logged in (outside of setItems callback)
      if (user) {
        pendingRequestsRef.current.add(requestKey);
        try {
          await fetch(
            `/api/cart?productId=${productId}&variantId=${variantId}`,
            { method: "DELETE" }
          );
        } catch (error) {
          logger.error("Error removing cart item", { error: String(error) });
        } finally {
          pendingRequestsRef.current.delete(requestKey);
        }
      }
    },
    [user]
  );

  const updateQuantity = useCallback(
    async (productId: string, variantId: string, quantity: number) => {
      if (quantity <= 0) {
        removeItem(productId, variantId);
        return;
      }

      const requestKey = `update-${productId}-${variantId}`;
      
      // Prevent duplicate requests
      if (pendingRequestsRef.current.has(requestKey)) {
        return;
      }

      setItems((prev) => {
        const updated = prev.map((i) =>
          i.productId === productId && i.variantId === variantId
            ? { ...i, quantity }
            : i
        );
        
        // Only save to localStorage if logged in
        if (user) {
          saveToLocalStorage(updated);
        }

        return updated;
      });

      // Update in database if logged in (outside of setItems callback)
      if (user) {
        pendingRequestsRef.current.add(requestKey);
        try {
          await fetch("/api/cart", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              productId,
              variantId,
              quantity,
            }),
          });
        } catch (error) {
          logger.error("Error updating cart item", { error: String(error) });
        } finally {
          pendingRequestsRef.current.delete(requestKey);
        }
      }
    },
    [user, removeItem]
  );

  const getItemQuantity = useCallback(
    (productId: string, variantId: string) => {
      const item = items.find(
        (i) => i.productId === productId && i.variantId === variantId
      );
      return item?.quantity || 0;
    },
    [items]
  );

  const getTotalItems = useCallback(() => {
    return items.reduce((sum, item) => sum + item.quantity, 0);
  }, [items]);

  const clearCart = useCallback(async () => {
    setItems([]);
    saveToLocalStorage([]);

    // Clear database cart if logged in
    if (user) {
      try {
        const response = await fetch("/api/cart");
        if (response.ok) {
          const data = await response.json();
          const dbItems = data.items || [];
          for (const item of dbItems) {
            await fetch(
              `/api/cart?productId=${item.productId}&variantId=${item.variantId}`,
              { method: "DELETE" }
            );
          }
        }
      } catch (error) {
        logger.error("Error clearing cart", { error: String(error) });
      }
    }
  }, [user]);

  // Fetch fresh cart data from backend (use when visiting cart page)
  const refreshCart = useCallback(async () => {
    if (!user) return;

    try {
      const response = await fetch("/api/cart");
      if (response.ok) {
        const data = await response.json();
        const dbItems = (data.items || []) as CartItem[];
        setItems(dbItems);
        saveToLocalStorage(dbItems);
      }
    } catch (error) {
      logger.error("Error refreshing cart", { error: String(error) });
    }
  }, [user]);

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateQuantity,
        getItemQuantity,
        getTotalItems,
        clearCart,
        refreshCart,
        isLoading,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
