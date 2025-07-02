import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, Filter, X, Check, AlertCircle, Calendar, User, CreditCard, Edit3, Trash2, MoreVertical, Shield } from 'lucide-react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import { useUser } from '../contexts/UserContext';
import type { Database } from '../types/database.types';
import clsx from 'clsx';

type Pass = Database['public']['Tables']['passes']['Row'];
type SaleInput = Database['public']['Tables']['sales']['Insert'];
type Sale = Database['public']['Tables']['sales']['Row'] & { pass_name?: string };

export default function SalesEntry() {
  const { user, isAdmin } = useAuth();
  const { staff } = useUser();
  const [passes, setPasses] = useState<Pass[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [form, setForm] = useState<SaleInput>({ 
    customer_name: '', 
    amount: 0, 
    pass_id: null,
    sale_date: new Date().toISOString().split('T')[0]
  });
  const [staffId, setStaffId] = useState<string>('');
  const [discountType, setDiscountType] = useState<'amount' | 'percentage'>('amount');
  const [discountValue, setDiscountValue] = useState<number>(0);
  
  const [paymentMethod, setPaymentMethod] = useState<string>('cash');
  const [notes, setNotes] = useState<string>('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string|null>(null);
  const [success, setSuccess] = useState<string|null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [selectedPassFilter, setSelectedPassFilter] = useState<string>('');
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  // 검색 및 필터링
  const filteredSales = sales.filter(sale => {
    const matchesSearch = sale.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         sale.pass_name?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesPass = selectedPassFilter === '' || sale.pass_id === selectedPassFilter;
    return matchesSearch && matchesPass;
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // 이용권 데이터 가져오기
      const { data: passesData, error: passesError } = await supabase
        .from('passes')
        .select('*')
        .order('name');
      
      if (passesError) throw passesError;
      
      // 매출 데이터 가져오기 (최근 30일)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const { data: salesData, error: salesError } = await supabase
        .from('sales')
        .select('*, passes(name)')
        .gte('sale_date', thirtyDaysAgo.toISOString().split('T')[0])
        .order('sale_date', { ascending: false });
      
      if (salesError) throw salesError;
      
      // 데이터 변환
      const formattedSales = salesData?.map(sale => ({
        ...sale,
        pass_name: sale.passes?.name || '-'
      })) || [];
      
      setPasses(passesData || []);
      setSales(formattedSales);
    } catch (err) {
      console.error('데이터 불러오기 오류:', err);
      setError('데이터를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.customer_name || !form.amount || !form.sale_date) return;
    
    // 데이터 검증
    if (form.amount <= 0) {
      setError('금액은 0보다 커야 합니다.');
      return;
    }
    
    const today = new Date().toISOString().split('T')[0];
    if (form.sale_date > today) {
      setError('미래 날짜는 선택할 수 없습니다.');
      return;
    }
    
    if (form.customer_name.trim().length < 2) {
      setError('고객명은 2글자 이상 입력해주세요.');
      return;
    }
    
    try {
      setSubmitting(true);
      
      if (editingId) {
        // 수정
        const { error } = await supabase
          .from('sales')
          .update({
            customer_name: form.customer_name,
            amount: form.amount,
            pass_id: form.pass_id,
            sale_date: form.sale_date,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingId);
          
        if (error) throw error;
      } else {
        // 추가
        const { error } = await supabase
          .from('sales')
          .insert([{
            customer_name: form.customer_name,
            amount: form.amount,
            pass_id: form.pass_id,
            sale_date: form.sale_date,
            // TODO: 실제 DB 스키마에 staff_id, payment_method, notes 컬럼 추가 후 활성화
            // staff_id: user?.id,
            // payment_method: paymentMethod,
            // notes: notes
          }]);
          
        if (error) throw error;
      }
      
      // 데이터 새로고침
      await fetchData();
      setSuccess(editingId ? '매출이 성공적으로 수정되었습니다.' : '매출이 성공적으로 등록되었습니다.');
      resetForm();
      
      // 성공 메시지 자동 제거
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('매출 저장 중 오류:', err);
      setError('매출 저장에 실패했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (sale: Sale) => {
    // 관리자만 수정 가능
    if (!isAdmin) {
      setError('수정 권한이 없습니다. 관리자만 매출을 수정할 수 있습니다.');
      setOpenDropdown(null);
      return;
    }

    setForm({
      customer_name: sale.customer_name,
      amount: sale.amount,
      pass_id: sale.pass_id,
      sale_date: sale.sale_date || new Date().toISOString().split('T')[0]
    });
    // TODO: 실제 DB에서 payment_method, notes 가져오기
    setPaymentMethod('cash');
    setNotes('');
    setEditingId(sale.id);
    setShowForm(true);
    setOpenDropdown(null);
  };

  const handleDelete = async (id: string) => {
    // 관리자만 삭제 가능
    if (!isAdmin) {
      setError('삭제 권한이 없습니다. 관리자만 매출을 삭제할 수 있습니다.');
      setOpenDropdown(null);
      return;
    }

    if (!window.confirm('정말로 이 매출 내역을 삭제하시겠습니까?')) return;
    
    try {
      setLoading(true);
      const { error } = await supabase
        .from('sales')
        .delete()
        .eq('id', id);
        
      if (error) throw error;
      
      // 데이터 새로고침
      await fetchData();
      setSuccess('매출이 성공적으로 삭제되었습니다.');
      setOpenDropdown(null);
      
      // 성공 메시지 자동 제거
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('삭제 중 오류:', err);
      setError('매출 삭제에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setForm({ 
      customer_name: '', 
      amount: 0, 
      pass_id: null,
      sale_date: new Date().toISOString().split('T')[0]
    });
    setStaffId('');
    setDiscountType('amount');
    setDiscountValue(0);
    setPaymentMethod('cash');
    setNotes('');
    setEditingId(null);
    setShowForm(false);
  };

  // 할인된 최종 금액 계산
  const finalAmount = useMemo(() => {
    if (!form.amount || discountValue <= 0) return form.amount;
    
    if (discountType === 'amount') {
      return Math.max(0, form.amount - discountValue);
    } else {
      const discountAmount = (form.amount * discountValue) / 100;
      return Math.max(0, form.amount - discountAmount);
    }
  }, [form.amount, discountType, discountValue]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: 'KRW'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const todayTotal = sales
    .filter(sale => sale.sale_date === new Date().toISOString().split('T')[0])
    .reduce((sum, sale) => sum + sale.amount, 0);

  const weekTotal = sales
    .filter(sale => {
      const saleDate = new Date(sale.sale_date || '');
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return saleDate >= weekAgo;
    })
    .reduce((sum, sale) => sum + sale.amount, 0);

  const monthTotal = sales
    .filter(sale => {
      const saleDate = new Date(sale.sale_date || '');
      const monthAgo = new Date();
      monthAgo.setDate(monthAgo.getDate() - 30);
      return saleDate >= monthAgo;
    })
    .reduce((sum, sale) => sum + sale.amount, 0);

  const averageTransaction = sales.length > 0 
    ? sales.reduce((sum, sale) => sum + sale.amount, 0) / sales.length 
    : 0;

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
                <span className="mr-3 text-green-600 text-4xl font-bold">₩</span>
                매출 등록
                <span className={clsx(
                  'ml-3 px-3 py-1 rounded-full text-xs font-medium',
                  isAdmin 
                    ? 'bg-blue-100 text-blue-800' 
                    : 'bg-amber-100 text-amber-800'
                )}>
                  {isAdmin ? '관리자' : '일반 직원'}
                </span>
              </h1>
              <p className="text-slate-600 mt-2">
                고객의 이용권 구매 및 매출을 등록하세요
                {!isAdmin && (
                  <span className="block text-sm text-amber-600 mt-1 flex items-center">
                    <Shield size={14} className="mr-1" />
                    일반 직원은 매출 등록만 가능합니다. 수정/삭제는 관리자 권한이 필요합니다.
                  </span>
                )}
              </p>
            </div>
            <button
              onClick={() => setShowForm(true)}
              className="inline-flex items-center px-6 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              <Plus size={20} className="mr-2" />
              매출 등록
            </button>
          </div>
        </div>

        {/* 통계 카드 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl shadow-sm border border-slate-200 p-6"
          >
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Calendar className="text-blue-600" size={24} />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-slate-600">오늘 매출</p>
                <p className="text-2xl font-bold text-slate-900">{formatCurrency(todayTotal)}</p>
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
              <div className="p-3 bg-green-100 rounded-lg">
                <span className="text-green-600 text-2xl font-bold">₩</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-slate-600">주간 매출</p>
                <p className="text-2xl font-bold text-slate-900">{formatCurrency(weekTotal)}</p>
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
              <div className="p-3 bg-purple-100 rounded-lg">
                <span className="text-purple-600 text-2xl font-bold">₩</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-slate-600">월간 매출</p>
                <p className="text-2xl font-bold text-slate-900">{formatCurrency(monthTotal)}</p>
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
              <div className="p-3 bg-orange-100 rounded-lg">
                <User className="text-orange-600" size={24} />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-slate-600">평균 거래액</p>
                <p className="text-2xl font-bold text-slate-900">{formatCurrency(averageTransaction)}</p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* 에러 메시지 */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-center"
            >
              <AlertCircle className="text-red-500 mr-3" size={20} />
              <span className="text-red-700">{error}</span>
              <button
                onClick={() => setError(null)}
                className="ml-auto text-red-500 hover:text-red-700"
              >
                <X size={16} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 성공 메시지 */}
        <AnimatePresence>
          {success && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4 flex items-center"
            >
              <Check className="text-green-500 mr-3" size={20} />
              <span className="text-green-700">{success}</span>
              <button
                onClick={() => setSuccess(null)}
                className="ml-auto text-green-500 hover:text-green-700"
              >
                <X size={16} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 검색 및 필터 */}
        <div className="mb-6 bg-white rounded-lg shadow-sm border border-slate-200 p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search size={16} className="text-slate-400" />
              </div>
              <input
                type="text"
                placeholder="고객명 또는 이용권으로 검색..."
                className="pl-10 pr-4 py-2 w-full border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex items-center space-x-4">
              <select
                className="border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                value={selectedPassFilter}
                onChange={(e) => setSelectedPassFilter(e.target.value)}
              >
                <option value="">모든 이용권</option>
                {passes.map(pass => (
                  <option key={pass.id} value={pass.id}>{pass.name}</option>
                ))}
              </select>
              <div className="text-sm text-slate-500">
                {filteredSales.length}건
              </div>
            </div>
          </div>
        </div>

        {/* 매출 목록 */}
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
              <p className="text-slate-500">매출 데이터를 불러오는 중...</p>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      날짜
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      고객명
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      이용권
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                      금액
                    </th>
                    {isAdmin && (
                      <th className="px-6 py-3 text-center text-xs font-medium text-slate-500 uppercase tracking-wider">
                        작업
                      </th>
                    )}
                    {!isAdmin && (
                      <th className="px-6 py-3 text-center text-xs font-medium text-slate-500 uppercase tracking-wider">
                        권한
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-200">
                  <AnimatePresence>
                    {filteredSales.map((sale, index) => (
                      <motion.tr
                        key={sale.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ delay: index * 0.05 }}
                        className="hover:bg-slate-50 transition-colors"
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                          {sale.sale_date ? formatDate(sale.sale_date) : '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-8 w-8 bg-slate-200 rounded-full flex items-center justify-center">
                              <User size={16} className="text-slate-600" />
                            </div>
                            <div className="ml-3">
                              <div className="text-sm font-medium text-slate-900">
                                {sale.customer_name}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            <CreditCard size={12} className="mr-1" />
                            {sale.pass_name || '기타'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium text-slate-900">
                          {formatCurrency(sale.amount)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          {isAdmin ? (
                            <div className="relative">
                              <button
                                onClick={() => setOpenDropdown(openDropdown === sale.id ? null : sale.id)}
                                className="p-1 rounded-full hover:bg-slate-100 transition-colors"
                              >
                                <MoreVertical size={16} className="text-slate-400" />
                              </button>
                              
                              {openDropdown === sale.id && (
                                <div className="absolute right-0 mt-2 w-32 bg-white rounded-lg shadow-lg border border-slate-200 z-10">
                                  <button
                                    onClick={() => handleEdit(sale)}
                                    className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center"
                                  >
                                    <Edit3 size={14} className="mr-2" />
                                    수정
                                  </button>
                                  <button
                                    onClick={() => handleDelete(sale.id)}
                                    className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center"
                                  >
                                    <Trash2 size={14} className="mr-2" />
                                    삭제
                                  </button>
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="flex items-center justify-center" title="관리자만 수정/삭제 가능">
                              <Shield size={16} className="text-slate-300" />
                            </div>
                          )}
                        </td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </tbody>
              </table>
              
              {filteredSales.length === 0 && !loading && (
                <div className="text-center py-20">
                  <span className="mx-auto text-slate-300 mb-4 text-6xl font-bold block">₩</span>
                  <h3 className="text-lg font-medium text-slate-900 mb-2">
                    {searchQuery || selectedPassFilter ? '검색 결과가 없습니다' : '등록된 매출이 없습니다'}
                  </h3>
                  <p className="text-slate-500 mb-6">
                    {searchQuery || selectedPassFilter ? '다른 조건으로 검색해보세요' : '첫 번째 매출을 등록해보세요'}
                  </p>
                  {!searchQuery && !selectedPassFilter && (
                    <button
                      onClick={() => setShowForm(true)}
                      className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                      <Plus size={16} className="mr-2" />
                      매출 등록
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* 매출 등록/수정 모달 */}
        <AnimatePresence>
          {showForm && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center p-4 z-50 overflow-y-auto"
              onClick={(e) => e.target === e.currentTarget && resetForm()}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-white rounded-xl shadow-2xl w-full max-w-md my-8 max-h-[calc(100vh-4rem)] overflow-y-auto"
              >
                <div className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-slate-900">
                      {editingId ? '매출 수정' : '매출 등록'}
                    </h2>
                    <button
                      onClick={resetForm}
                      className="text-slate-400 hover:text-slate-600 transition-colors"
                    >
                      <X size={24} />
                    </button>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        고객명 *
                      </label>
                      <input
                        type="text"
                        placeholder="고객 이름을 입력하세요"
                        className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        value={form.customer_name}
                        onChange={(e) => setForm(f => ({ ...f, customer_name: e.target.value }))}
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        담당자
                      </label>
                      <select
                        className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        value={staffId}
                        onChange={(e) => setStaffId(e.target.value)}
                      >
                        <option value="">담당자 선택 (선택사항)</option>
                        {staff?.map(member => (
                          <option key={member.id} value={member.id}>
                            {member.name} - {member.position || '직원'}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        이용권
                      </label>
                      <select
                        className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        value={form.pass_id || ''}
                        onChange={(e) => {
                          const selectedPassId = e.target.value || null;
                          const selectedPass = passes.find(p => p.id === selectedPassId);
                          setForm(f => ({ 
                            ...f, 
                            pass_id: selectedPassId,
                            amount: selectedPass ? selectedPass.amount : f.amount
                          }));
                        }}
                      >
                        <option value="">이용권 선택 (선택사항)</option>
                        {passes.map(pass => (
                          <option key={pass.id} value={pass.id}>
                            {pass.name} - {formatCurrency(pass.amount)}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        금액 *
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          placeholder="금액을 입력하세요"
                          className="w-full px-4 py-3 pr-12 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                          value={form.amount || ''}
                          onChange={(e) => setForm(f => ({ ...f, amount: Number(e.target.value) }))}
                          required
                        />
                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                          <span className="text-slate-500 text-sm">원</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        할인 유형
                      </label>
                      <div className="flex space-x-3">
                        <label className="flex items-center">
                          <input
                            type="radio"
                            name="discountType"
                            value="amount"
                            checked={discountType === 'amount'}
                            onChange={(e) => setDiscountType(e.target.value as 'amount' | 'percentage')}
                            className="mr-2 text-green-600 focus:ring-green-500"
                          />
                          <span className="text-sm">금액 할인</span>
                        </label>
                        <label className="flex items-center">
                          <input
                            type="radio"
                            name="discountType"
                            value="percentage"
                            checked={discountType === 'percentage'}
                            onChange={(e) => setDiscountType(e.target.value as 'amount' | 'percentage')}
                            className="mr-2 text-green-600 focus:ring-green-500"
                          />
                          <span className="text-sm">% 할인</span>
                        </label>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        할인 {discountType === 'amount' ? '금액' : '비율'}
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          placeholder={discountType === 'amount' ? '할인 금액을 입력하세요' : '할인 비율을 입력하세요 (예: 10)'}
                          className="w-full px-4 py-3 pr-12 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                          value={discountValue || ''}
                          onChange={(e) => setDiscountValue(Number(e.target.value))}
                          min="0"
                          max={discountType === 'percentage' ? '100' : undefined}
                        />
                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                          <span className="text-slate-500 text-sm">
                            {discountType === 'amount' ? '원' : '%'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {discountValue > 0 && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-slate-600">원가:</span>
                          <span className="font-medium">{formatCurrency(form.amount)}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm mt-1">
                          <span className="text-slate-600">
                            할인 ({discountType === 'amount' ? formatCurrency(discountValue) : `${discountValue}%`}):
                          </span>
                          <span className="font-medium text-red-600">
                            -{formatCurrency(discountType === 'amount' ? discountValue : (form.amount * discountValue) / 100)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-lg font-bold mt-2 pt-2 border-t border-blue-300">
                          <span className="text-slate-800">최종 금액:</span>
                          <span className="text-green-600">{formatCurrency(finalAmount)}</span>
                        </div>
                      </div>
                    )}

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        판매일 *
                      </label>
                      <input
                        type="date"
                        className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        value={form.sale_date || ''}
                        onChange={(e) => setForm(f => ({ ...f, sale_date: e.target.value }))}
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        결제 방법
                      </label>
                      <select
                        className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        value={paymentMethod}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                      >
                        <option value="cash">현금</option>
                        <option value="card">카드</option>
                        <option value="transfer">계좌이체</option>
                        <option value="other">기타</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        메모
                      </label>
                      <textarea
                        placeholder="추가 메모사항을 입력하세요"
                        rows={3}
                        className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 resize-none"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                      />
                    </div>

                    <div className="flex space-x-3 pt-4">
                      <button
                        type="button"
                        onClick={resetForm}
                        className="flex-1 px-4 py-3 text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors font-medium"
                        disabled={submitting}
                      >
                        취소
                      </button>
                      <button
                        type="submit"
                        disabled={submitting || !form.customer_name || !form.amount || !form.sale_date}
                        className={clsx(
                          'flex-1 px-4 py-3 rounded-lg font-medium transition-all duration-200 flex items-center justify-center',
                          submitting || !form.customer_name || !form.amount || !form.sale_date
                            ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                            : 'bg-green-600 text-white hover:bg-green-700 focus:ring-2 focus:ring-green-500'
                        )}
                      >
                        {submitting ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            {editingId ? '수정중...' : '등록중...'}
                          </>
                        ) : (
                          <>
                            <Check size={16} className="mr-2" />
                            {editingId ? '수정' : '등록'}
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 외부 클릭으로 드롭다운 닫기 */}
        {openDropdown && (
          <div 
            className="fixed inset-0 z-5" 
            onClick={() => setOpenDropdown(null)}
          />
        )}
      </div>
    </motion.div>
  );
} 