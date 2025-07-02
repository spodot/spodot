import { useState, useRef, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format, subWeeks, subMonths, isWithinInterval, parseISO } from 'date-fns';
import { useReactToPrint } from 'react-to-print';
import { 
  Plus, 
  Package, 
  ShoppingCart, 
  TrendingUp, 
  AlertTriangle, 
  Edit3, 
  Trash2, 
  BarChart3,
  Coffee,
  Search,
  Filter,
  Download,
  RefreshCw,
  X,
  Check,
  MinusCircle,
  PlusCircle,
  Save,
  DollarSign
} from 'lucide-react';
import clsx from 'clsx';

interface VendingMachine {
  id: number;
  name: string;
  location: string;
  status: 'active' | 'maintenance' | 'inactive';
}

interface Product {
  id: number;
  name: string;
  price: number;
  cost: number;
  category: string;
  barcode?: string;
}

interface InventoryItem {
  id: number;
  vendingId: number;
  productId: number;
  currentStock: number;
  maxCapacity: number;
  minThreshold: number;
  lastRestocked?: string;
}

interface Sale {
  id: number;
  vendingId: number;
  productId: number;
  quantity: number;
  totalAmount: number;
  timestamp: string;
  paymentMethod: 'cash' | 'card';
}

interface Transaction {
  id: number;
  vendingId: number;
  type: '입금' | '출금' | '매출' | '보충';
  amount: number;
  date: string;
  note: string;
  vendingName?: string;
  productName?: string;
  quantity?: number;
}

const VENDING_MACHINES: VendingMachine[] = [
  { id: 1, name: '헬스장 자판기', location: '헬스장 1층 로비', status: 'active' },
  { id: 2, name: '무인테니스장 자판기', location: '무인테니스장 휴게실', status: 'active' },
  { id: 3, name: '테니스아카데미 자판기', location: '테니스아카데미 라운지', status: 'active' },
];

const INITIAL_PRODUCTS: Product[] = [
  { id: 1, name: '콜라', price: 1500, cost: 800, category: '음료', barcode: '8801062636075' },
  { id: 2, name: '사이다', price: 1500, cost: 800, category: '음료', barcode: '8801062636082' },
  { id: 3, name: '물', price: 1000, cost: 500, category: '음료', barcode: '8801062636099' },
  { id: 4, name: '커피', price: 2000, cost: 1000, category: '음료', barcode: '8801062636106' },
  { id: 5, name: '초콜릿', price: 2500, cost: 1200, category: '과자', barcode: '8801062636113' },
  { id: 6, name: '과자', price: 2000, cost: 1000, category: '과자', barcode: '8801062636120' },
];

// localStorage 키들
const STORAGE_KEYS = {
  products: 'vending_products',
  inventory: 'vending_inventory', 
  sales: 'vending_sales',
  transactions: 'vending_transactions'
};

export default function VendingSales() {
  // 탭 상태
  const [activeTab, setActiveTab] = useState<'dashboard' | 'sales' | 'inventory' | 'products'>('dashboard');
  
  // 기본 데이터
  const [products, setProducts] = useState<Product[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  
  // 초기 재고 데이터
  const INITIAL_INVENTORY: InventoryItem[] = [
    // 헬스장 자판기 (ID: 1) - 운동 후 필요한 상품들
    { id: 1, vendingId: 1, productId: 1, currentStock: 15, maxCapacity: 20, minThreshold: 5, lastRestocked: '2025-01-01' }, // 콜라
    { id: 2, vendingId: 1, productId: 2, currentStock: 12, maxCapacity: 20, minThreshold: 5, lastRestocked: '2025-01-01' }, // 사이다
    { id: 3, vendingId: 1, productId: 3, currentStock: 25, maxCapacity: 30, minThreshold: 10, lastRestocked: '2025-01-01' }, // 물
    { id: 4, vendingId: 1, productId: 4, currentStock: 18, maxCapacity: 20, minThreshold: 5, lastRestocked: '2025-01-01' }, // 커피
    { id: 5, vendingId: 1, productId: 6, currentStock: 10, maxCapacity: 15, minThreshold: 3, lastRestocked: '2024-12-30' }, // 과자
    
    // 무인테니스장 자판기 (ID: 2) - 간단한 음료와 간식
    { id: 6, vendingId: 2, productId: 1, currentStock: 8, maxCapacity: 15, minThreshold: 5, lastRestocked: '2024-12-30' }, // 콜라
    { id: 7, vendingId: 2, productId: 3, currentStock: 20, maxCapacity: 25, minThreshold: 8, lastRestocked: '2025-01-01' }, // 물
    { id: 8, vendingId: 2, productId: 4, currentStock: 12, maxCapacity: 15, minThreshold: 5, lastRestocked: '2024-12-31' }, // 커피
    { id: 9, vendingId: 2, productId: 5, currentStock: 5, maxCapacity: 10, minThreshold: 3, lastRestocked: '2024-12-28' }, // 초콜릿
    
    // 테니스아카데미 자판기 (ID: 3) - 다양한 상품 구성
    { id: 10, vendingId: 3, productId: 2, currentStock: 14, maxCapacity: 18, minThreshold: 5, lastRestocked: '2025-01-01' }, // 사이다
    { id: 11, vendingId: 3, productId: 3, currentStock: 22, maxCapacity: 25, minThreshold: 8, lastRestocked: '2025-01-01' }, // 물
    { id: 12, vendingId: 3, productId: 4, currentStock: 16, maxCapacity: 20, minThreshold: 5, lastRestocked: '2024-12-31' }, // 커피
    { id: 13, vendingId: 3, productId: 5, currentStock: 8, maxCapacity: 12, minThreshold: 3, lastRestocked: '2024-12-29' }, // 초콜릿
    { id: 14, vendingId: 3, productId: 6, currentStock: 12, maxCapacity: 15, minThreshold: 4, lastRestocked: '2024-12-30' }, // 과자
  ];

  // localStorage에서 데이터 로드
  useEffect(() => {
    const savedProducts = localStorage.getItem(STORAGE_KEYS.products);
    const savedInventory = localStorage.getItem(STORAGE_KEYS.inventory);
    const savedSales = localStorage.getItem(STORAGE_KEYS.sales);
    const savedTransactions = localStorage.getItem(STORAGE_KEYS.transactions);

    if (savedProducts) {
      try {
        setProducts(JSON.parse(savedProducts));
      } catch (error) {
        console.error('Failed to load products:', error);
        setProducts(INITIAL_PRODUCTS);
      }
    } else {
      setProducts(INITIAL_PRODUCTS);
    }

    if (savedInventory) {
      try {
        setInventory(JSON.parse(savedInventory));
      } catch (error) {
        console.error('Failed to load inventory:', error);
        setInventory(INITIAL_INVENTORY);
      }
    } else {
      setInventory(INITIAL_INVENTORY);
    }

    if (savedSales) {
      try {
        setSales(JSON.parse(savedSales));
      } catch (error) {
        console.error('Failed to load sales:', error);
        setSales([]);
      }
    }

    if (savedTransactions) {
      try {
        setTransactions(JSON.parse(savedTransactions));
      } catch (error) {
        console.error('Failed to load transactions:', error);
        setTransactions([]);
      }
    }
  }, []);

  // 데이터 변경 시 localStorage에 저장
  useEffect(() => {
    if (products.length > 0) {
      localStorage.setItem(STORAGE_KEYS.products, JSON.stringify(products));
    }
  }, [products]);

  useEffect(() => {
    if (inventory.length > 0) {
      localStorage.setItem(STORAGE_KEYS.inventory, JSON.stringify(inventory));
    }
  }, [inventory]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.sales, JSON.stringify(sales));
  }, [sales]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.transactions, JSON.stringify(transactions));
  }, [transactions]);
  
  // 폼 상태들
  const [saleForm, setSaleForm] = useState({
    vendingId: '',
    productId: '',
    quantity: 1,
    customAmount: '',
    useCustomAmount: false,
    paymentMethod: 'cash' as 'cash' | 'card'
  });
  
  const [transactionForm, setTransactionForm] = useState({
    vendingId: '',
    type: '입금' as '입금' | '출금',
    amount: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    note: '',
  });
  
  const [productForm, setProductForm] = useState({
    name: '',
    price: '',
    cost: '',
    category: '음료',
    barcode: ''
  });
  
  const [inventoryForm, setInventoryForm] = useState({
    vendingId: '',
    productId: '',
    quantity: '',
    action: 'restock' as 'restock' | 'adjust'
  });
  
  // UI 상태들
  const [period, setPeriod] = useState<'day'|'week'|'month'>('day');
  const [selectedVending, setSelectedVending] = useState<number | null>(null);
  const [showSaleModal, setShowSaleModal] = useState(false);
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [showProductModal, setShowProductModal] = useState(false);
  const [showInventoryModal, setShowInventoryModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  
  const printRef = useRef<HTMLDivElement>(null);
  const handlePrint = useReactToPrint({ contentRef: printRef });

  // 매출 등록
  const handleSaleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!saleForm.vendingId || !saleForm.productId || !saleForm.quantity) return;
    
    const product = products.find(p => p.id === Number(saleForm.productId));
    if (!product) return;
    
    // 커스텀 금액 사용 여부에 따라 총 금액 계산
    let totalAmount: number;
    if (saleForm.useCustomAmount && saleForm.customAmount) {
      totalAmount = Number(saleForm.customAmount);
    } else {
      totalAmount = product.price * saleForm.quantity;
    }
    
    const newSale: Sale = {
      id: Date.now(),
      vendingId: Number(saleForm.vendingId),
      productId: Number(saleForm.productId),
      quantity: saleForm.quantity,
      totalAmount: totalAmount,
      timestamp: new Date().toISOString(),
      paymentMethod: saleForm.paymentMethod
    };
    
    setSales(prev => [newSale, ...prev]);
    
    // 재고 감소
    setInventory(prev => prev.map(item => 
      item.vendingId === newSale.vendingId && item.productId === newSale.productId
        ? { ...item, currentStock: Math.max(0, item.currentStock - newSale.quantity) }
        : item
    ));
    
    // 매출 거래 기록
    const vendingName = VENDING_MACHINES.find(v => v.id === newSale.vendingId)?.name || '';
    const newTransaction: Transaction = {
      id: Date.now() + 1,
      vendingId: newSale.vendingId,
      type: '매출',
      amount: newSale.totalAmount,
      date: format(new Date(), 'yyyy-MM-dd'),
      note: `${product.name} ${newSale.quantity}개 판매`,
      vendingName,
      productName: product.name,
      quantity: newSale.quantity
    };
    
    setTransactions(prev => [newTransaction, ...prev]);
    setSaleForm({ vendingId: '', productId: '', quantity: 1, customAmount: '', useCustomAmount: false, paymentMethod: 'cash' });
    setShowSaleModal(false);
    alert('매출이 등록되었습니다.');
  };

  // 거래 등록 (입금/출금)
  const handleTransactionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!transactionForm.vendingId || !transactionForm.amount || !transactionForm.date) return;
    
    const vendingName = VENDING_MACHINES.find(v => v.id === Number(transactionForm.vendingId))?.name || '';
    const newTransaction: Transaction = {
      ...transactionForm,
      id: Date.now(),
      vendingId: Number(transactionForm.vendingId),
      amount: Number(transactionForm.amount),
      vendingName
    };
    
    setTransactions(prev => [newTransaction, ...prev]);
    setTransactionForm(prev => ({ ...prev, amount: '', note: '' }));
    setShowTransactionModal(false);
    alert(`${transactionForm.type}이 등록되었습니다.`);
  };

  // 상품 등록/수정
  const handleProductSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!productForm.name || !productForm.price || !productForm.cost) return;
    
    if (editingProduct) {
      setProducts(prev => prev.map(p => p.id === editingProduct.id ? {
        ...editingProduct,
        name: productForm.name,
        price: Number(productForm.price),
        cost: Number(productForm.cost),
        category: productForm.category,
        barcode: productForm.barcode
      } : p));
    } else {
      const newProduct: Product = {
        id: Date.now(),
        name: productForm.name,
        price: Number(productForm.price),
        cost: Number(productForm.cost),
        category: productForm.category,
        barcode: productForm.barcode
      };
      setProducts(prev => [...prev, newProduct]);
    }
    
    resetProductForm();
  };

  // 재고 관리
  const handleInventorySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inventoryForm.vendingId || !inventoryForm.productId || !inventoryForm.quantity) return;
    
    const quantity = Number(inventoryForm.quantity);
    const vendingId = Number(inventoryForm.vendingId);
    const productId = Number(inventoryForm.productId);
    
    setInventory(prev => {
      const existingItem = prev.find(item => 
        item.vendingId === vendingId && item.productId === productId
      );
      
      if (existingItem) {
        return prev.map(item => 
          item.id === existingItem.id 
            ? {
                ...item,
                currentStock: inventoryForm.action === 'restock' 
                  ? item.currentStock + quantity 
                  : quantity,
                lastRestocked: inventoryForm.action === 'restock' 
                  ? format(new Date(), 'yyyy-MM-dd')
                  : item.lastRestocked
              }
            : item
        );
      } else {
        const newItem: InventoryItem = {
          id: Date.now(),
          vendingId,
          productId,
          currentStock: quantity,
          maxCapacity: 20,
          minThreshold: 5,
          lastRestocked: format(new Date(), 'yyyy-MM-dd')
        };
        return [...prev, newItem];
      }
    });
    
    setInventoryForm({ vendingId: '', productId: '', quantity: '', action: 'restock' });
    setShowInventoryModal(false);
  };

  const resetProductForm = () => {
    setProductForm({ name: '', price: '', cost: '', category: '음료', barcode: '' });
    setEditingProduct(null);
    setShowProductModal(false);
  };

  // 통계 계산
  const now = new Date();
  let startDate = now;
  if (period === 'week') startDate = subWeeks(now, 1);
  else if (period === 'month') startDate = subMonths(now, 1);

  const filteredTransactions = transactions.filter(t => {
    const d = parseISO(t.date);
    const isInPeriod = isWithinInterval(d, { start: startDate, end: now });
    const isInVending = selectedVending ? t.vendingId === selectedVending : true;
    return isInPeriod && isInVending;
  });

  const totalRevenue = filteredTransactions
    .filter(t => t.type === '매출')
    .reduce((sum, t) => sum + t.amount, 0);
  
  const totalDeposits = filteredTransactions
    .filter(t => t.type === '입금')
    .reduce((sum, t) => sum + t.amount, 0);
  
  const totalWithdrawals = filteredTransactions
    .filter(t => t.type === '출금')
    .reduce((sum, t) => sum + t.amount, 0);

  const netBalance = totalRevenue + totalDeposits - totalWithdrawals;

  // 재고 알림
  const lowStockItems = inventory.filter(item => item.currentStock <= item.minThreshold);
  const outOfStockItems = inventory.filter(item => item.currentStock === 0);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-slate-50 p-6"
    >
      <div className="max-w-7xl mx-auto">
        {/* 헤더 */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 flex items-center">
                <Coffee className="mr-3 text-blue-600" size={32} />
                자판기 관리
              </h1>
              <p className="text-slate-600 mt-2">자판기 매출, 재고, 상품을 통합 관리하세요</p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowSaleModal(true)}
                className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2.5 px-4 rounded-lg flex items-center space-x-2 transition-colors"
              >
                <ShoppingCart size={18} />
                <span>매출 등록</span>
              </button>
              <button
                onClick={() => setShowTransactionModal(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 px-4 rounded-lg flex items-center space-x-2 transition-colors"
              >
                <Plus size={18} />
                <span>입출금 등록</span>
              </button>
            </div>
          </div>
        </div>

        {/* 탭 네비게이션 */}
        <div className="mb-6">
          <div className="border-b border-slate-200">
            <nav className="-mb-px flex space-x-8">
              {[
                { id: 'dashboard', name: '대시보드', icon: BarChart3 },
                { id: 'sales', name: '매출 관리', icon: TrendingUp },
                { id: 'inventory', name: '재고 관리', icon: Package },
                { id: 'products', name: '상품 관리', icon: Coffee }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={clsx(
                    'py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 transition-colors',
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                  )}
                >
                  <tab.icon size={16} />
                  <span>{tab.name}</span>
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* 대시보드 탭 */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            {/* 기간 및 필터 */}
            <div className="flex flex-wrap gap-4 items-center justify-between">
              <div className="flex gap-2">
                <button 
                  className={clsx(
                    'px-4 py-2 rounded-lg font-semibold transition border',
                    period === 'day' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-blue-700 border-blue-300 hover:bg-blue-50'
                  )} 
                  onClick={() => setPeriod('day')}
                >
                  1일
                </button>
                <button 
                  className={clsx(
                    'px-4 py-2 rounded-lg font-semibold transition border',
                    period === 'week' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-blue-700 border-blue-300 hover:bg-blue-50'
                  )} 
                  onClick={() => setPeriod('week')}
                >
                  1주
                </button>
                <button 
                  className={clsx(
                    'px-4 py-2 rounded-lg font-semibold transition border',
                    period === 'month' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-blue-700 border-blue-300 hover:bg-blue-50'
                  )} 
                  onClick={() => setPeriod('month')}
                >
                  1달
                </button>
              </div>
              
              <select 
                className="form-select border rounded px-3 py-2"
                value={selectedVending || ''}
                onChange={e => setSelectedVending(e.target.value ? Number(e.target.value) : null)}
              >
                <option value="">전체 자판기</option>
                {VENDING_MACHINES.map(v => (
                  <option key={v.id} value={v.id}>{v.name}</option>
                ))}
              </select>
            </div>

            {/* 통계 카드 */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-xl shadow-sm border border-slate-200 p-6"
              >
                <div className="flex items-center">
                  <div className="p-3 bg-green-100 rounded-lg">
                    <TrendingUp className="text-green-600" size={24} />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-slate-600">매출</p>
                    <p className="text-2xl font-bold text-slate-900">{totalRevenue.toLocaleString()}원</p>
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white rounded-xl shadow-sm border border-slate-200 p-6"
              >
                <div className="flex items-center">
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <Plus className="text-blue-600" size={24} />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-slate-600">입금</p>
                    <p className="text-2xl font-bold text-slate-900">{totalDeposits.toLocaleString()}원</p>
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white rounded-xl shadow-sm border border-slate-200 p-6"
              >
                <div className="flex items-center">
                  <div className="p-3 bg-red-100 rounded-lg">
                    <MinusCircle className="text-red-600" size={24} />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-slate-600">출금</p>
                    <p className="text-2xl font-bold text-slate-900">{totalWithdrawals.toLocaleString()}원</p>
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-white rounded-xl shadow-sm border border-slate-200 p-6"
              >
                <div className="flex items-center">
                  <div className="p-3 bg-purple-100 rounded-lg">
                    <BarChart3 className="text-purple-600" size={24} />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-slate-600">순 잔액</p>
                    <p className={clsx(
                      'text-2xl font-bold',
                      netBalance >= 0 ? 'text-slate-900' : 'text-red-600'
                    )}>
                      {netBalance.toLocaleString()}원
                    </p>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* 재고 알림 */}
            {(lowStockItems.length > 0 || outOfStockItems.length > 0) && (
              <div className="space-y-4">
                {outOfStockItems.length > 0 && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex items-center mb-3">
                      <AlertTriangle className="text-red-500 mr-2" size={20} />
                      <h3 className="text-lg font-semibold text-red-800">품절 상품</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {outOfStockItems.map(item => {
                        const product = products.find(p => p.id === item.productId);
                        const vending = VENDING_MACHINES.find(v => v.id === item.vendingId);
                        return (
                          <div key={item.id} className="bg-white rounded-lg p-3 border border-red-200">
                            <p className="font-medium text-red-800">{product?.name}</p>
                            <p className="text-sm text-red-600">{vending?.name}</p>
                            <p className="text-xs text-red-500 mt-1">재고: {item.currentStock}개</p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {lowStockItems.length > 0 && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <div className="flex items-center mb-3">
                      <AlertTriangle className="text-yellow-500 mr-2" size={20} />
                      <h3 className="text-lg font-semibold text-yellow-800">재고 부족 상품</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {lowStockItems.filter(item => item.currentStock > 0).map(item => {
                        const product = products.find(p => p.id === item.productId);
                        const vending = VENDING_MACHINES.find(v => v.id === item.vendingId);
                        return (
                          <div key={item.id} className="bg-white rounded-lg p-3 border border-yellow-200">
                            <p className="font-medium text-yellow-800">{product?.name}</p>
                            <p className="text-sm text-yellow-600">{vending?.name}</p>
                            <p className="text-xs text-yellow-500 mt-1">
                              재고: {item.currentStock}개 (최소: {item.minThreshold}개)
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 거래 내역 */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200">
              <div className="p-6 border-b border-slate-200 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-slate-900">최근 거래 내역</h3>
                <button
                  onClick={handlePrint}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
                >
                  <Download size={16} />
                  <span>PDF 다운로드</span>
                </button>
              </div>
              
              <div ref={printRef} className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">날짜</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">자판기</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">유형</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">금액</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">내용</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-slate-200">
                    {filteredTransactions.slice(0, 10).map(transaction => (
                      <tr key={transaction.id} className="hover:bg-slate-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                          {transaction.date}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                          {transaction.vendingName}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={clsx(
                            'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                            transaction.type === '매출' && 'bg-green-100 text-green-800',
                            transaction.type === '입금' && 'bg-blue-100 text-blue-800',
                            transaction.type === '출금' && 'bg-red-100 text-red-800',
                            transaction.type === '보충' && 'bg-purple-100 text-purple-800'
                          )}>
                            {transaction.type}
                          </span>
                        </td>
                        <td className={clsx(
                          'px-6 py-4 whitespace-nowrap text-sm font-medium text-right',
                          transaction.type === '출금' ? 'text-red-600' : 'text-slate-900'
                        )}>
                          {transaction.type === '출금' ? '-' : ''}{transaction.amount.toLocaleString()}원
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                          {transaction.note}
                        </td>
                      </tr>
                    ))}
                    {filteredTransactions.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                          거래 내역이 없습니다.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* 재고 관리 탭 */}
        {activeTab === 'inventory' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-slate-900">재고 관리</h2>
              <button
                onClick={() => setShowInventoryModal(true)}
                className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2.5 px-4 rounded-lg flex items-center space-x-2 transition-colors"
              >
                <RefreshCw size={18} />
                <span>재고 조정</span>
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {VENDING_MACHINES.map(vending => {
                const vendingInventory = inventory.filter(item => item.vendingId === vending.id);
                return (
                  <div key={vending.id} className="bg-white rounded-xl shadow-sm border border-slate-200">
                    <div className="p-6 border-b border-slate-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-lg font-semibold text-slate-900">{vending.name}</h3>
                          <p className="text-sm text-slate-600">{vending.location}</p>
                        </div>
                        <span className={clsx(
                          'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                          vending.status === 'active' && 'bg-green-100 text-green-800',
                          vending.status === 'maintenance' && 'bg-yellow-100 text-yellow-800',
                          vending.status === 'inactive' && 'bg-red-100 text-red-800'
                        )}>
                          {vending.status === 'active' ? '정상' : vending.status === 'maintenance' ? '점검중' : '비활성'}
                        </span>
                      </div>
                    </div>
                    
                    <div className="p-6 space-y-4">
                      {vendingInventory.length === 0 ? (
                        <p className="text-sm text-slate-500 text-center py-4">등록된 상품이 없습니다.</p>
                      ) : (
                        vendingInventory.map(item => {
                          const product = products.find(p => p.id === item.productId);
                          const stockPercentage = (item.currentStock / item.maxCapacity) * 100;
                          const isLowStock = item.currentStock <= item.minThreshold;
                          const isOutOfStock = item.currentStock === 0;
                          
                          return (
                            <div key={item.id} className="border border-slate-200 rounded-lg p-4">
                              <div className="flex items-center justify-between mb-2">
                                <span className="font-medium text-slate-900">{product?.name}</span>
                                <span className={clsx(
                                  'text-sm font-medium',
                                  isOutOfStock ? 'text-red-600' : isLowStock ? 'text-yellow-600' : 'text-slate-600'
                                )}>
                                  {item.currentStock}/{item.maxCapacity}개
                                </span>
                              </div>
                              
                              <div className="w-full bg-slate-200 rounded-full h-2 mb-2">
                                <div 
                                  className={clsx(
                                    'h-2 rounded-full transition-all duration-300',
                                    isOutOfStock ? 'bg-red-500' : isLowStock ? 'bg-yellow-500' : 'bg-green-500'
                                  )}
                                  style={{ width: `${Math.max(stockPercentage, 2)}%` }}
                                />
                              </div>
                              
                              <div className="flex justify-between items-center text-xs text-slate-500">
                                <span>최소 {item.minThreshold}개</span>
                                <span>마지막 보충: {item.lastRestocked || '미기록'}</span>
                              </div>
                              
                              {(isOutOfStock || isLowStock) && (
                                <div className="mt-2">
                                  <span className={clsx(
                                    'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium',
                                    isOutOfStock ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
                                  )}>
                                    <AlertTriangle size={12} className="mr-1" />
                                    {isOutOfStock ? '품절' : '재고 부족'}
                                  </span>
                                </div>
                              )}
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 상품 관리 탭 */}
        {activeTab === 'products' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-slate-900">상품 관리</h2>
              <button
                onClick={() => setShowProductModal(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 px-4 rounded-lg flex items-center space-x-2 transition-colors"
              >
                <Plus size={18} />
                <span>상품 추가</span>
              </button>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">상품명</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">카테고리</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">판매가</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">원가</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">마진</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">바코드</th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-slate-500 uppercase tracking-wider">작업</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-slate-200">
                    {products.map(product => {
                      const margin = product.price - product.cost;
                      const marginPercentage = ((margin / product.price) * 100).toFixed(1);
                      
                      return (
                        <tr key={product.id} className="hover:bg-slate-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-10 w-10 bg-slate-200 rounded-full flex items-center justify-center">
                                <Coffee size={20} className="text-slate-600" />
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-slate-900">{product.name}</div>
                                <div className="text-sm text-slate-500">ID: {product.id}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              {product.category}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900 text-right font-medium">
                            {product.price.toLocaleString()}원
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 text-right">
                            {product.cost.toLocaleString()}원
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                            <div className="text-slate-900 font-medium">{margin.toLocaleString()}원</div>
                            <div className="text-xs text-slate-500">({marginPercentage}%)</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                            {product.barcode || '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <div className="flex items-center justify-center space-x-2">
                              <button
                                onClick={() => {
                                  setEditingProduct(product);
                                  setProductForm({
                                    name: product.name,
                                    price: product.price.toString(),
                                    cost: product.cost.toString(),
                                    category: product.category,
                                    barcode: product.barcode || ''
                                  });
                                  setShowProductModal(true);
                                }}
                                className="text-slate-500 hover:text-blue-600 transition-colors"
                              >
                                <Edit3 size={16} />
                              </button>
                              <button
                                onClick={() => {
                                  if (window.confirm('정말로 이 상품을 삭제하시겠습니까?')) {
                                    setProducts(prev => prev.filter(p => p.id !== product.id));
                                  }
                                }}
                                className="text-slate-500 hover:text-red-600 transition-colors"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* 매출 등록 모달 */}
        <AnimatePresence>
          {showSaleModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
              onClick={(e) => e.target === e.currentTarget && setShowSaleModal(false)}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-white rounded-xl shadow-2xl w-full max-w-md"
              >
                <div className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-slate-900">매출 등록</h2>
                    <button
                      onClick={() => setShowSaleModal(false)}
                      className="text-slate-400 hover:text-slate-600 transition-colors"
                    >
                      <X size={24} />
                    </button>
                  </div>

                  <form onSubmit={handleSaleSubmit} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">자판기</label>
                      <select
                        className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        value={saleForm.vendingId}
                        onChange={e => setSaleForm(prev => ({ ...prev, vendingId: e.target.value }))}
                        required
                      >
                        <option value="">자판기 선택</option>
                        {VENDING_MACHINES.filter(v => v.status === 'active').map(v => (
                          <option key={v.id} value={v.id}>{v.name}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">상품</label>
                      <select
                        className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        value={saleForm.productId}
                        onChange={e => setSaleForm(prev => ({ ...prev, productId: e.target.value }))}
                        required
                      >
                        <option value="">상품 선택</option>
                        {products.map(p => (
                          <option key={p.id} value={p.id}>{p.name} - {p.price.toLocaleString()}원</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">수량</label>
                      <input
                        type="number"
                        min="1"
                        className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        value={saleForm.quantity}
                        onChange={e => setSaleForm(prev => ({ ...prev, quantity: Number(e.target.value) }))}
                        required
                      />
                    </div>

                    {/* 커스텀 금액 설정 */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="block text-sm font-medium text-slate-700">금액 설정</label>
                        <label className="flex items-center text-sm">
                          <input
                            type="checkbox"
                            checked={saleForm.useCustomAmount}
                            onChange={e => setSaleForm(prev => ({ 
                              ...prev, 
                              useCustomAmount: e.target.checked,
                              customAmount: e.target.checked ? prev.customAmount : ''
                            }))}
                            className="mr-2"
                          />
                          직접 입력
                        </label>
                      </div>
                      
                      {saleForm.useCustomAmount && (
                        <div className="relative">
                          <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
                          <input
                            type="number"
                            min="0"
                            step="100"
                            placeholder="금액을 입력하세요"
                            className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                            value={saleForm.customAmount}
                            onChange={e => setSaleForm(prev => ({ ...prev, customAmount: e.target.value }))}
                            required={saleForm.useCustomAmount}
                          />
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">결제 방법</label>
                      <div className="flex space-x-4">
                        <label className="flex items-center">
                          <input
                            type="radio"
                            name="paymentMethod"
                            value="cash"
                            checked={saleForm.paymentMethod === 'cash'}
                            onChange={e => setSaleForm(prev => ({ ...prev, paymentMethod: e.target.value as 'cash' | 'card' }))}
                            className="mr-2"
                          />
                          현금
                        </label>
                        <label className="flex items-center">
                          <input
                            type="radio"
                            name="paymentMethod"
                            value="card"
                            checked={saleForm.paymentMethod === 'card'}
                            onChange={e => setSaleForm(prev => ({ ...prev, paymentMethod: e.target.value as 'cash' | 'card' }))}
                            className="mr-2"
                          />
                          카드
                        </label>
                      </div>
                    </div>

                    {saleForm.productId && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <div className="flex justify-between items-center">
                          <span className="text-slate-700">총 금액:</span>
                          <span className="text-lg font-bold text-blue-600">
                            {saleForm.useCustomAmount && saleForm.customAmount 
                              ? Number(saleForm.customAmount).toLocaleString()
                              : ((products.find(p => p.id === Number(saleForm.productId))?.price || 0) * saleForm.quantity).toLocaleString()
                            }원
                          </span>
                        </div>
                        {saleForm.useCustomAmount && saleForm.customAmount && (
                          <div className="text-xs text-slate-500 mt-1">
                            기본 가격: {((products.find(p => p.id === Number(saleForm.productId))?.price || 0) * saleForm.quantity).toLocaleString()}원
                          </div>
                        )}
                      </div>
                    )}

                    <div className="flex space-x-3 pt-4">
                      <button
                        type="button"
                        onClick={() => setShowSaleModal(false)}
                        className="flex-1 px-4 py-3 text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors font-medium"
                      >
                        취소
                      </button>
                      <button
                        type="submit"
                        className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                      >
                        등록
                      </button>
                    </div>
                  </form>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 입출금 등록 모달 */}
        <AnimatePresence>
          {showTransactionModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
              onClick={(e) => e.target === e.currentTarget && setShowTransactionModal(false)}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-white rounded-xl shadow-2xl w-full max-w-md"
              >
                <div className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-slate-900">입출금 등록</h2>
                    <button
                      onClick={() => setShowTransactionModal(false)}
                      className="text-slate-400 hover:text-slate-600 transition-colors"
                    >
                      <X size={24} />
                    </button>
                  </div>

                  <form onSubmit={handleTransactionSubmit} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">자판기</label>
                      <select
                        className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        value={transactionForm.vendingId}
                        onChange={e => setTransactionForm(prev => ({ ...prev, vendingId: e.target.value }))}
                        required
                      >
                        <option value="">자판기 선택</option>
                        {VENDING_MACHINES.map(v => (
                          <option key={v.id} value={v.id}>{v.name}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">유형</label>
                      <div className="flex space-x-4">
                        <label className="flex items-center">
                          <input
                            type="radio"
                            name="type"
                            value="입금"
                            checked={transactionForm.type === '입금'}
                            onChange={e => setTransactionForm(prev => ({ ...prev, type: e.target.value as '입금' | '출금' }))}
                            className="mr-2"
                          />
                          입금
                        </label>
                        <label className="flex items-center">
                          <input
                            type="radio"
                            name="type"
                            value="출금"
                            checked={transactionForm.type === '출금'}
                            onChange={e => setTransactionForm(prev => ({ ...prev, type: e.target.value as '입금' | '출금' }))}
                            className="mr-2"
                          />
                          출금
                        </label>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">금액</label>
                      <input
                        type="number"
                        placeholder="금액을 입력하세요"
                        className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        value={transactionForm.amount}
                        onChange={e => setTransactionForm(prev => ({ ...prev, amount: e.target.value }))}
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">날짜</label>
                      <input
                        type="date"
                        className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        value={transactionForm.date}
                        onChange={e => setTransactionForm(prev => ({ ...prev, date: e.target.value }))}
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">비고</label>
                      <input
                        type="text"
                        placeholder="비고사항을 입력하세요"
                        className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        value={transactionForm.note}
                        onChange={e => setTransactionForm(prev => ({ ...prev, note: e.target.value }))}
                      />
                    </div>

                    <div className="flex space-x-3 pt-4">
                      <button
                        type="button"
                        onClick={() => setShowTransactionModal(false)}
                        className="flex-1 px-4 py-3 text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors font-medium"
                      >
                        취소
                      </button>
                      <button
                        type="submit"
                        className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                      >
                        등록
                      </button>
                    </div>
                  </form>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 상품 등록/수정 모달 */}
        <AnimatePresence>
          {showProductModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
              onClick={(e) => e.target === e.currentTarget && resetProductForm()}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-white rounded-xl shadow-2xl w-full max-w-md"
              >
                <div className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-slate-900">
                      {editingProduct ? '상품 수정' : '상품 등록'}
                    </h2>
                    <button
                      onClick={resetProductForm}
                      className="text-slate-400 hover:text-slate-600 transition-colors"
                    >
                      <X size={24} />
                    </button>
                  </div>

                  <form onSubmit={handleProductSubmit} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">상품명</label>
                      <input
                        type="text"
                        placeholder="상품명을 입력하세요"
                        className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        value={productForm.name}
                        onChange={e => setProductForm(prev => ({ ...prev, name: e.target.value }))}
                        required
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">판매가</label>
                        <input
                          type="number"
                          placeholder="판매가"
                          className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          value={productForm.price}
                          onChange={e => setProductForm(prev => ({ ...prev, price: e.target.value }))}
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">원가</label>
                        <input
                          type="number"
                          placeholder="원가"
                          className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          value={productForm.cost}
                          onChange={e => setProductForm(prev => ({ ...prev, cost: e.target.value }))}
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">카테고리</label>
                      <select
                        className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        value={productForm.category}
                        onChange={e => setProductForm(prev => ({ ...prev, category: e.target.value }))}
                      >
                        <option value="음료">음료</option>
                        <option value="과자">과자</option>
                        <option value="아이스크림">아이스크림</option>
                        <option value="기타">기타</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">바코드 (선택)</label>
                      <input
                        type="text"
                        placeholder="바코드를 입력하세요"
                        className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        value={productForm.barcode}
                        onChange={e => setProductForm(prev => ({ ...prev, barcode: e.target.value }))}
                      />
                    </div>

                    {productForm.price && productForm.cost && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <div className="flex justify-between items-center">
                          <span className="text-slate-700">예상 마진:</span>
                          <div className="text-right">
                            <div className="text-lg font-bold text-blue-600">
                              {(Number(productForm.price) - Number(productForm.cost)).toLocaleString()}원
                            </div>
                            <div className="text-sm text-slate-600">
                              ({(((Number(productForm.price) - Number(productForm.cost)) / Number(productForm.price)) * 100).toFixed(1)}%)
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="flex space-x-3 pt-4">
                      <button
                        type="button"
                        onClick={resetProductForm}
                        className="flex-1 px-4 py-3 text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors font-medium"
                      >
                        취소
                      </button>
                      <button
                        type="submit"
                        className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                      >
                        {editingProduct ? '수정' : '등록'}
                      </button>
                    </div>
                  </form>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 재고 조정 모달 */}
        <AnimatePresence>
          {showInventoryModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
              onClick={(e) => e.target === e.currentTarget && setShowInventoryModal(false)}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-white rounded-xl shadow-2xl w-full max-w-md"
              >
                <div className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-slate-900">재고 조정</h2>
                    <button
                      onClick={() => setShowInventoryModal(false)}
                      className="text-slate-400 hover:text-slate-600 transition-colors"
                    >
                      <X size={24} />
                    </button>
                  </div>

                  <form onSubmit={handleInventorySubmit} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">자판기</label>
                      <select
                        className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                        value={inventoryForm.vendingId}
                        onChange={e => setInventoryForm(prev => ({ ...prev, vendingId: e.target.value }))}
                        required
                      >
                        <option value="">자판기 선택</option>
                        {VENDING_MACHINES.map(v => (
                          <option key={v.id} value={v.id}>{v.name}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">상품</label>
                      <select
                        className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                        value={inventoryForm.productId}
                        onChange={e => setInventoryForm(prev => ({ ...prev, productId: e.target.value }))}
                        required
                      >
                        <option value="">상품 선택</option>
                        {products.map(p => (
                          <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">작업 유형</label>
                      <div className="flex space-x-4">
                        <label className="flex items-center">
                          <input
                            type="radio"
                            name="action"
                            value="restock"
                            checked={inventoryForm.action === 'restock'}
                            onChange={e => setInventoryForm(prev => ({ ...prev, action: e.target.value as 'restock' | 'adjust' }))}
                            className="mr-2"
                          />
                          보충 (현재 재고에 추가)
                        </label>
                        <label className="flex items-center">
                          <input
                            type="radio"
                            name="action"
                            value="adjust"
                            checked={inventoryForm.action === 'adjust'}
                            onChange={e => setInventoryForm(prev => ({ ...prev, action: e.target.value as 'restock' | 'adjust' }))}
                            className="mr-2"
                          />
                          조정 (정확한 수량 설정)
                        </label>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        {inventoryForm.action === 'restock' ? '보충 수량' : '조정 수량'}
                      </label>
                      <input
                        type="number"
                        min="0"
                        placeholder={inventoryForm.action === 'restock' ? '보충할 수량' : '정확한 재고 수량'}
                        className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                        value={inventoryForm.quantity}
                        onChange={e => setInventoryForm(prev => ({ ...prev, quantity: e.target.value }))}
                        required
                      />
                    </div>

                    {inventoryForm.vendingId && inventoryForm.productId && (
                      <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                        <div className="text-sm text-slate-700">
                          <div className="mb-2">
                            <span className="font-medium">현재 재고: </span>
                            <span>
                              {inventory.find(item => 
                                item.vendingId === Number(inventoryForm.vendingId) && 
                                item.productId === Number(inventoryForm.productId)
                              )?.currentStock || 0}개
                            </span>
                          </div>
                          {inventoryForm.quantity && (
                            <div>
                              <span className="font-medium">
                                {inventoryForm.action === 'restock' ? '보충 후 재고: ' : '조정 후 재고: '}
                              </span>
                              <span className="text-purple-600 font-bold">
                                {inventoryForm.action === 'restock' 
                                  ? (inventory.find(item => 
                                      item.vendingId === Number(inventoryForm.vendingId) && 
                                      item.productId === Number(inventoryForm.productId)
                                    )?.currentStock || 0) + Number(inventoryForm.quantity)
                                  : Number(inventoryForm.quantity)
                                }개
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="flex space-x-3 pt-4">
                      <button
                        type="button"
                        onClick={() => setShowInventoryModal(false)}
                        className="flex-1 px-4 py-3 text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors font-medium"
                      >
                        취소
                      </button>
                      <button
                        type="submit"
                        className="flex-1 px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
                      >
                        {inventoryForm.action === 'restock' ? '보충' : '조정'}
                      </button>
                    </div>
                  </form>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
} 