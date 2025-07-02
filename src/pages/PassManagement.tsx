import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Edit3, Trash2, CreditCard, Search, Filter, X, Check, AlertCircle } from 'lucide-react';
import { supabase } from '../supabaseClient';
import type { Database } from '../types/database.types';
import clsx from 'clsx';

type Pass = Database['public']['Tables']['passes']['Row'];
type PassInput = Database['public']['Tables']['passes']['Insert'];

export default function PassManagement() {
  const [passes, setPasses] = useState<Pass[]>([]);
  const [form, setForm] = useState<PassInput>({ name: '', amount: 0, description: '' });
  const [editingId, setEditingId] = useState<string|null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string|null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchPasses();
  }, []);

  // 검색 필터링
  const filteredPasses = passes.filter(pass =>
    pass.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    pass.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const fetchPasses = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('passes')
        .select('*')
        .order('name');
      
      if (error) throw error;
      setPasses(data || []);
    } catch (err) {
      console.error('이용권 불러오기 오류:', err);
      setError('이용권을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || form.amount === undefined) return;
    
    try {
      setSubmitting(true);
      
      if (editingId) {
        // 수정
        const { error } = await supabase
          .from('passes')
          .update({ 
            name: form.name, 
            amount: form.amount, 
            description: form.description,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingId);
          
        if (error) throw error;
      } else {
        // 추가
        const { error } = await supabase
          .from('passes')
          .insert([form]);
          
        if (error) throw error;
      }
      
      // 데이터 새로고침
      await fetchPasses();
      resetForm();
    } catch (err) {
      console.error('저장 중 오류:', err);
      setError('이용권 저장에 실패했습니다.');
    } finally {
      setSubmitting(false);
    }
  };
  
  const handleEdit = (pass: Pass) => {
    setForm({
      name: pass.name,
      amount: pass.amount,
      description: pass.description
    });
    setEditingId(pass.id);
    setShowForm(true);
  };
  
  const handleDelete = async (id: string) => {
    if (!window.confirm('정말로 이 이용권을 삭제하시겠습니까?')) return;
    
    try {
      setLoading(true);
      const { error } = await supabase
        .from('passes')
        .delete()
        .eq('id', id);
        
      if (error) throw error;
      
      // 데이터 새로고침
      await fetchPasses();
    } catch (err) {
      console.error('삭제 중 오류:', err);
      setError('이용권 삭제에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setForm({ name: '', amount: 0, description: '' });
    setEditingId(null);
    setShowForm(false);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: 'KRW'
    }).format(amount);
  };

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
                <CreditCard className="mr-3 text-blue-600" size={32} />
                이용권 관리
              </h1>
              <p className="text-slate-600 mt-2">헬스장 이용권을 관리하고 새로운 이용권을 등록하세요</p>
            </div>
            <button
              onClick={() => setShowForm(true)}
              className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              <Plus size={20} className="mr-2" />
              새 이용권 등록
            </button>
          </div>
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

        {/* 검색 및 필터 */}
        <div className="mb-6 bg-white rounded-lg shadow-sm border border-slate-200 p-4">
          <div className="flex items-center space-x-4">
            <div className="relative flex-1 max-w-md">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search size={16} className="text-slate-400" />
              </div>
              <input
                type="text"
                placeholder="이용권명 또는 설명으로 검색..."
                className="pl-10 pr-4 py-2 w-full border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="text-sm text-slate-500">
              총 {filteredPasses.length}개 이용권
            </div>
          </div>
        </div>

        {/* 이용권 목록 */}
        {loading && passes.length === 0 ? (
          <div className="flex justify-center items-center py-20">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <p className="text-slate-500">이용권을 불러오는 중...</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            <AnimatePresence>
              {filteredPasses.map((pass, index) => (
                <motion.div
                  key={pass.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white rounded-xl shadow-sm border border-slate-200 hover:shadow-lg transition-all duration-200 overflow-hidden group"
                >
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="font-bold text-lg text-slate-900 mb-1 group-hover:text-blue-600 transition-colors">
                          {pass.name}
                        </h3>
                        <div className="text-2xl font-bold text-blue-600 mb-2">
                          {formatCurrency(pass.amount)}
                        </div>
                      </div>
                      <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleEdit(pass)}
                          className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="수정"
                        >
                          <Edit3 size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(pass.id)}
                          className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="삭제"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                    
                    {pass.description && (
                      <p className="text-slate-600 text-sm leading-relaxed">
                        {pass.description}
                      </p>
                    )}
                  </div>
                  
                  <div className="px-6 py-3 bg-slate-50 border-t border-slate-100">
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span>이용권</span>
                      <span className="font-medium">활성</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            
            {filteredPasses.length === 0 && !loading && (
              <div className="col-span-full">
                <div className="text-center py-20">
                  <CreditCard size={64} className="mx-auto text-slate-300 mb-4" />
                  <h3 className="text-lg font-medium text-slate-900 mb-2">
                    {searchQuery ? '검색 결과가 없습니다' : '등록된 이용권이 없습니다'}
                  </h3>
                  <p className="text-slate-500 mb-6">
                    {searchQuery ? '다른 검색어로 시도해보세요' : '새로운 이용권을 등록해보세요'}
                  </p>
                  {!searchQuery && (
                    <button
                      onClick={() => setShowForm(true)}
                      className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <Plus size={16} className="mr-2" />
                      첫 번째 이용권 등록
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* 이용권 등록/수정 모달 */}
        <AnimatePresence>
          {showForm && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
              onClick={(e) => e.target === e.currentTarget && resetForm()}
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
                      {editingId ? '이용권 수정' : '새 이용권 등록'}
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
                        이용권명 *
                      </label>
                      <input
                        type="text"
                        placeholder="예: 엔터프라이즈 이용권"
                        className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        value={form.name}
                        onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))}
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        금액 *
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          placeholder="500000"
                          className="w-full px-4 py-3 pr-12 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                        설명
                      </label>
                      <textarea
                        placeholder="이용권에 대한 상세 설명을 입력하세요"
                        rows={3}
                        className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                        value={form.description || ''}
                        onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))}
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
                        disabled={submitting || !form.name || !form.amount}
                        className={clsx(
                          'flex-1 px-4 py-3 rounded-lg font-medium transition-all duration-200 flex items-center justify-center',
                          submitting || !form.name || !form.amount
                            ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                            : 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-2 focus:ring-blue-500'
                        )}
                      >
                        {submitting ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            처리중...
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
      </div>
    </motion.div>
  );
} 