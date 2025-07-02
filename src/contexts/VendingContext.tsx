import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';

export interface VendingMachine {
  id: number;
  name: string;
  location: string;
  status: 'active' | 'maintenance' | 'inactive';
  created_at?: string;
  updated_at?: string;
}

export interface VendingProduct {
  id: number;
  name: string;
  price: number;
  cost: number;
  category: string;
  barcode?: string;
  created_at?: string;
  updated_at?: string;
}

export interface VendingInventoryItem {
  id: number;
  vending_id: number;
  product_id: number;
  current_stock: number;
  max_capacity: number;
  min_threshold: number;
  last_restocked?: string;
  created_at?: string;
  updated_at?: string;
}

export interface VendingSale {
  id: number;
  vending_id: number;
  product_id: number;
  quantity: number;
  total_amount: number;
  payment_method: 'cash' | 'card';
  timestamp: string;
  created_at?: string;
}

export interface VendingTransaction {
  id: number;
  vending_id: number;
  type: '입금' | '출금' | '매출' | '보충';
  amount: number;
  date: string;
  note: string;
  vending_name?: string;
  product_name?: string;
  quantity?: number;
  created_at?: string;
}

interface VendingContextType {
  vendingMachines: VendingMachine[];
  products: VendingProduct[];
  inventory: VendingInventoryItem[];
  sales: VendingSale[];
  transactions: VendingTransaction[];
  loading: boolean;
  error: string | null;
  
  // CRUD operations
  addSale: (sale: Omit<VendingSale, 'id' | 'created_at'>) => Promise<number | null>;
  addTransaction: (transaction: Omit<VendingTransaction, 'id' | 'created_at'>) => Promise<number | null>;
  addProduct: (product: Omit<VendingProduct, 'id' | 'created_at' | 'updated_at'>) => Promise<number | null>;
  updateProduct: (id: number, updates: Partial<VendingProduct>) => Promise<boolean>;
  deleteProduct: (id: number) => Promise<boolean>;
  updateInventory: (id: number, updates: Partial<VendingInventoryItem>) => Promise<boolean>;
  addInventoryItem: (item: Omit<VendingInventoryItem, 'id' | 'created_at' | 'updated_at'>) => Promise<number | null>;
  
  // Fetch operations
  fetchAllData: () => Promise<void>;
}

const VendingContext = createContext<VendingContextType | undefined>(undefined);

// 초기 자판기 데이터
const INITIAL_VENDING_MACHINES: Omit<VendingMachine, 'id' | 'created_at' | 'updated_at'>[] = [
  { name: '헬스장 자판기', location: '헬스장 1층 로비', status: 'active' },
  { name: '무인테니스장 자판기', location: '무인테니스장 입구', status: 'active' },
  { name: '테니스아카데미 자판기', location: '테니스아카데미 휴게실', status: 'active' }
];

// 초기 상품 데이터
const INITIAL_PRODUCTS: Omit<VendingProduct, 'id' | 'created_at' | 'updated_at'>[] = [
  { name: '콜라', price: 1500, cost: 800, category: '음료', barcode: '8801062636075' },
  { name: '사이다', price: 1500, cost: 800, category: '음료', barcode: '8801062636082' },
  { name: '물', price: 1000, cost: 500, category: '음료', barcode: '8801062636099' },
  { name: '커피', price: 2000, cost: 1000, category: '음료', barcode: '8801062636106' },
  { name: '초콜릿', price: 2500, cost: 1200, category: '과자', barcode: '8801062636113' },
  { name: '과자', price: 2000, cost: 1000, category: '과자', barcode: '8801062636120' }
];

export const VendingProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [vendingMachines, setVendingMachines] = useState<VendingMachine[]>([]);
  const [products, setProducts] = useState<VendingProduct[]>([]);
  const [inventory, setInventory] = useState<VendingInventoryItem[]>([]);
  const [sales, setSales] = useState<VendingSale[]>([]);
  const [transactions, setTransactions] = useState<VendingTransaction[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // 🔄 localStorage 데이터를 Supabase로 마이그레이션
  const migrateLocalStorageData = useCallback(async () => {
    const storageKeys = {
      products: 'vending_products',
      inventory: 'vending_inventory',
      sales: 'vending_sales',
      transactions: 'vending_transactions'
    };
    
    try {
      // Products 마이그레이션
      const savedProducts = localStorage.getItem(storageKeys.products);
      if (savedProducts) {
        const localProducts: VendingProduct[] = JSON.parse(savedProducts);
        console.log(`📦 로컬 스토리지에서 ${localProducts.length}개의 자판기 상품을 발견했습니다.`);
        
        if (localProducts.length > 0) {
          const { data: existingProducts } = await supabase
            .from('vending_products')
            .select('id')
            .limit(1);

          if (!existingProducts || existingProducts.length === 0) {
            let migratedCount = 0;
            for (const product of localProducts) {
              try {
                const { error: insertError } = await supabase
                  .from('vending_products')
                  .insert({
                    name: product.name,
                    price: product.price,
                    cost: product.cost,
                    category: product.category,
                    barcode: product.barcode
                  });

                if (!insertError) migratedCount++;
              } catch (err) {
                console.error(`상품 "${product.name}" 마이그레이션 중 오류:`, err);
              }
            }
            console.log(`✅ ${migratedCount}개의 자판기 상품이 성공적으로 마이그레이션되었습니다.`);
          }
        }
        localStorage.removeItem(storageKeys.products);
      }

      // Sales 마이그레이션
      const savedSales = localStorage.getItem(storageKeys.sales);
      if (savedSales) {
        const localSales: VendingSale[] = JSON.parse(savedSales);
        console.log(`📦 로컬 스토리지에서 ${localSales.length}개의 자판기 매출을 발견했습니다.`);
        
        if (localSales.length > 0) {
          const { data: existingSales } = await supabase
            .from('vending_sales')
            .select('id')
            .limit(1);

          if (!existingSales || existingSales.length === 0) {
            let migratedCount = 0;
            for (const sale of localSales) {
              try {
                const { error: insertError } = await supabase
                  .from('vending_sales')
                  .insert({
                    vending_id: sale.vending_id,
                    product_id: sale.product_id,
                    quantity: sale.quantity,
                    total_amount: sale.total_amount,
                    payment_method: sale.payment_method,
                    timestamp: sale.timestamp
                  });

                if (!insertError) migratedCount++;
              } catch (err) {
                console.error(`매출 기록 마이그레이션 중 오류:`, err);
              }
            }
            console.log(`✅ ${migratedCount}개의 자판기 매출이 성공적으로 마이그레이션되었습니다.`);
          }
        }
        localStorage.removeItem(storageKeys.sales);
      }

      // Transactions 마이그레이션
      const savedTransactions = localStorage.getItem(storageKeys.transactions);
      if (savedTransactions) {
        const localTransactions: VendingTransaction[] = JSON.parse(savedTransactions);
        console.log(`📦 로컬 스토리지에서 ${localTransactions.length}개의 자판기 거래내역을 발견했습니다.`);
        
        if (localTransactions.length > 0) {
          const { data: existingTransactions } = await supabase
            .from('vending_transactions')
            .select('id')
            .limit(1);

          if (!existingTransactions || existingTransactions.length === 0) {
            let migratedCount = 0;
            for (const transaction of localTransactions) {
              try {
                const { error: insertError } = await supabase
                  .from('vending_transactions')
                  .insert({
                    vending_id: transaction.vending_id,
                    type: transaction.type,
                    amount: transaction.amount,
                    date: transaction.date,
                    note: transaction.note,
                    vending_name: transaction.vending_name,
                    product_name: transaction.product_name,
                    quantity: transaction.quantity
                  });

                if (!insertError) migratedCount++;
              } catch (err) {
                console.error(`거래내역 마이그레이션 중 오류:`, err);
              }
            }
            console.log(`✅ ${migratedCount}개의 자판기 거래내역이 성공적으로 마이그레이션되었습니다.`);
          }
        }
        localStorage.removeItem(storageKeys.transactions);
      }

      // Inventory 마이그레이션
      const savedInventory = localStorage.getItem(storageKeys.inventory);
      if (savedInventory) {
        const localInventory: VendingInventoryItem[] = JSON.parse(savedInventory);
        console.log(`📦 로컬 스토리지에서 ${localInventory.length}개의 자판기 재고를 발견했습니다.`);
        
        if (localInventory.length > 0) {
          const { data: existingInventory } = await supabase
            .from('vending_inventory')
            .select('id')
            .limit(1);

          if (!existingInventory || existingInventory.length === 0) {
            let migratedCount = 0;
            for (const item of localInventory) {
              try {
                const { error: insertError } = await supabase
                  .from('vending_inventory')
                  .insert({
                    vending_id: item.vending_id,
                    product_id: item.product_id,
                    current_stock: item.current_stock,
                    max_capacity: item.max_capacity,
                    min_threshold: item.min_threshold,
                    last_restocked: item.last_restocked
                  });

                if (!insertError) migratedCount++;
              } catch (err) {
                console.error(`재고 항목 마이그레이션 중 오류:`, err);
              }
            }
            console.log(`✅ ${migratedCount}개의 자판기 재고가 성공적으로 마이그레이션되었습니다.`);
          }
        }
        localStorage.removeItem(storageKeys.inventory);
      }
      
    } catch (err) {
      console.error('자판기 데이터 마이그레이션 실패:', err);
    }
  }, []);

  // 샘플 데이터 생성
  const generateSampleData = async () => {
    try {
      // Vending machines 생성
      const { data: existingMachines } = await supabase
        .from('vending_machines')
        .select('id')
        .limit(1);

      if (!existingMachines || existingMachines.length === 0) {
        await supabase.from('vending_machines').insert(INITIAL_VENDING_MACHINES);
        console.log('✅ 샘플 자판기가 성공적으로 생성되었습니다.');
      }

      // Products 생성
      const { data: existingProducts } = await supabase
        .from('vending_products')
        .select('id')
        .limit(1);

      if (!existingProducts || existingProducts.length === 0) {
        await supabase.from('vending_products').insert(INITIAL_PRODUCTS);
        console.log('✅ 샘플 상품이 성공적으로 생성되었습니다.');
      }
    } catch (err) {
      console.error('샘플 데이터 생성 실패:', err);
    }
  };

  // 모든 데이터 가져오기
  const fetchAllData = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const [machinesResult, productsResult, inventoryResult, salesResult, transactionsResult] = await Promise.all([
        supabase.from('vending_machines').select('*').order('id'),
        supabase.from('vending_products').select('*').order('name'),
        supabase.from('vending_inventory').select('*').order('vending_id, product_id'),
        supabase.from('vending_sales').select('*').order('timestamp', { ascending: false }).limit(100),
        supabase.from('vending_transactions').select('*').order('date', { ascending: false }).limit(100)
      ]);

      if (machinesResult.error) throw machinesResult.error;
      if (productsResult.error) throw productsResult.error;
      if (inventoryResult.error) throw inventoryResult.error;
      if (salesResult.error) throw salesResult.error;
      if (transactionsResult.error) throw transactionsResult.error;

      setVendingMachines(machinesResult.data || []);
      setProducts(productsResult.data || []);
      setInventory(inventoryResult.data || []);
      setSales(salesResult.data || []);
      setTransactions(transactionsResult.data || []);

      // 데이터가 없으면 샘플 데이터 생성
      if ((!machinesResult.data || machinesResult.data.length === 0) || 
          (!productsResult.data || productsResult.data.length === 0)) {
        await generateSampleData();
        // 다시 가져오기
        await fetchAllData();
      }
      
    } catch (err) {
      console.error('자판기 데이터 가져오기 실패:', err);
      setError('자판기 데이터를 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  }, []);

  // 초기 데이터 로드
  useEffect(() => {
    migrateLocalStorageData().finally(() => {
      fetchAllData();
    });
  }, [migrateLocalStorageData, fetchAllData]);

  // 매출 추가
  const addSale = async (saleData: Omit<VendingSale, 'id' | 'created_at'>): Promise<number | null> => {
    try {
      const { data: newSale, error: insertError } = await supabase
        .from('vending_sales')
        .insert(saleData)
        .select()
        .single();

      if (insertError) {
        console.error('매출 추가 실패:', insertError);
        setError('매출 추가 중 오류가 발생했습니다.');
        return null;
      }

      if (newSale) {
        setSales(prev => [newSale, ...prev]);
        return newSale.id;
      }

      return null;
    } catch (err) {
      console.error('매출 추가 중 오류:', err);
      setError('매출 추가 중 오류가 발생했습니다.');
      return null;
    }
  };

  // 거래내역 추가
  const addTransaction = async (transactionData: Omit<VendingTransaction, 'id' | 'created_at'>): Promise<number | null> => {
    try {
      const { data: newTransaction, error: insertError } = await supabase
        .from('vending_transactions')
        .insert(transactionData)
        .select()
        .single();

      if (insertError) {
        console.error('거래내역 추가 실패:', insertError);
        setError('거래내역 추가 중 오류가 발생했습니다.');
        return null;
      }

      if (newTransaction) {
        setTransactions(prev => [newTransaction, ...prev]);
        return newTransaction.id;
      }

      return null;
    } catch (err) {
      console.error('거래내역 추가 중 오류:', err);
      setError('거래내역 추가 중 오류가 발생했습니다.');
      return null;
    }
  };

  // 상품 추가
  const addProduct = async (productData: Omit<VendingProduct, 'id' | 'created_at' | 'updated_at'>): Promise<number | null> => {
    try {
      const { data: newProduct, error: insertError } = await supabase
        .from('vending_products')
        .insert(productData)
        .select()
        .single();

      if (insertError) {
        console.error('상품 추가 실패:', insertError);
        setError('상품 추가 중 오류가 발생했습니다.');
        return null;
      }

      if (newProduct) {
        setProducts(prev => [...prev, newProduct]);
        return newProduct.id;
      }

      return null;
    } catch (err) {
      console.error('상품 추가 중 오류:', err);
      setError('상품 추가 중 오류가 발생했습니다.');
      return null;
    }
  };

  // 상품 수정
  const updateProduct = async (id: number, updates: Partial<VendingProduct>): Promise<boolean> => {
    try {
      const { error: updateError } = await supabase
        .from('vending_products')
        .update(updates)
        .eq('id', id);

      if (updateError) {
        console.error('상품 수정 실패:', updateError);
        setError('상품 수정 중 오류가 발생했습니다.');
        return false;
      }

      setProducts(prev => prev.map(product => 
        product.id === id ? { ...product, ...updates } : product
      ));
      return true;
    } catch (err) {
      console.error('상품 수정 중 오류:', err);
      setError('상품 수정 중 오류가 발생했습니다.');
      return false;
    }
  };

  // 상품 삭제
  const deleteProduct = async (id: number): Promise<boolean> => {
    try {
      const { error: deleteError } = await supabase
        .from('vending_products')
        .delete()
        .eq('id', id);

      if (deleteError) {
        console.error('상품 삭제 실패:', deleteError);
        setError('상품 삭제 중 오류가 발생했습니다.');
        return false;
      }

      setProducts(prev => prev.filter(product => product.id !== id));
      return true;
    } catch (err) {
      console.error('상품 삭제 중 오류:', err);
      setError('상품 삭제 중 오류가 발생했습니다.');
      return false;
    }
  };

  // 재고 수정
  const updateInventory = async (id: number, updates: Partial<VendingInventoryItem>): Promise<boolean> => {
    try {
      const { error: updateError } = await supabase
        .from('vending_inventory')
        .update(updates)
        .eq('id', id);

      if (updateError) {
        console.error('재고 수정 실패:', updateError);
        setError('재고 수정 중 오류가 발생했습니다.');
        return false;
      }

      setInventory(prev => prev.map(item => 
        item.id === id ? { ...item, ...updates } : item
      ));
      return true;
    } catch (err) {
      console.error('재고 수정 중 오류:', err);
      setError('재고 수정 중 오류가 발생했습니다.');
      return false;
    }
  };

  // 재고 항목 추가
  const addInventoryItem = async (itemData: Omit<VendingInventoryItem, 'id' | 'created_at' | 'updated_at'>): Promise<number | null> => {
    try {
      const { data: newItem, error: insertError } = await supabase
        .from('vending_inventory')
        .insert(itemData)
        .select()
        .single();

      if (insertError) {
        console.error('재고 항목 추가 실패:', insertError);
        setError('재고 항목 추가 중 오류가 발생했습니다.');
        return null;
      }

      if (newItem) {
        setInventory(prev => [...prev, newItem]);
        return newItem.id;
      }

      return null;
    } catch (err) {
      console.error('재고 항목 추가 중 오류:', err);
      setError('재고 항목 추가 중 오류가 발생했습니다.');
      return null;
    }
  };

  const contextValue: VendingContextType = {
    vendingMachines,
    products,
    inventory,
    sales,
    transactions,
    loading,
    error,
    addSale,
    addTransaction,
    addProduct,
    updateProduct,
    deleteProduct,
    updateInventory,
    addInventoryItem,
    fetchAllData
  };

  return (
    <VendingContext.Provider value={contextValue}>
      {children}
    </VendingContext.Provider>
  );
};

export const useVending = () => {
  const context = useContext(VendingContext);
  if (!context) {
    throw new Error('useVending must be used within a VendingProvider');
  }
  return context;
}; 