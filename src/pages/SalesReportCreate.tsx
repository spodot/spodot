import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Save, Plus, Trash2, FileText, Calculator, Calendar, TrendingUp, Users, DollarSign } from 'lucide-react';
import { format } from 'date-fns';
import { supabase } from '../supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import { useUser } from '../contexts/UserContext';
import clsx from 'clsx';

interface SalesReportForm {
  report_date: string;
  membership_sales: number;
  pt_sales: number;
  supply_sales: number;
  vending_sales: number;
  other_sales: number;
  total_revenue: number;
  membership_count: number;
  pt_sessions: number;
  notes: string;
  payment_cash: number;
  payment_card: number;
  payment_transfer: number;
  target_revenue: number;
}

interface SalesCategory {
  id: string;
  name: string;
  amount: number;
  description: string;
}

const SalesReportCreate: React.FC = () => {
  const { user } = useAuth();
  const { staff } = useUser();
  
  const [formData, setFormData] = useState<SalesReportForm>({
    report_date: format(new Date(), 'yyyy-MM-dd'),
    membership_sales: 0,
    pt_sales: 0,
    supply_sales: 0,
    vending_sales: 0,
    other_sales: 0,
    total_revenue: 0,
    membership_count: 0,
    pt_sessions: 0,
    notes: '',
    payment_cash: 0,
    payment_card: 0,
    payment_transfer: 0,
    target_revenue: 0,
  });

  const [salesCategories, setSalesCategories] = useState<SalesCategory[]>([
    { id: '1', name: '회원권 판매', amount: 0, description: '헬스, 테니스, 골프 회원권' },
    { id: '2', name: 'PT 판매', amount: 0, description: '개인 트레이닝 레슨' },
    { id: '3', name: '용품 판매', amount: 0, description: '운동용품, 보충제 등' },
    { id: '4', name: '자판기 관리', amount: 0, description: '음료, 간식류' },
    { id: '5', name: '기타 매출', amount: 0, description: '락커 대여, 부대시설 등' },
  ]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // 총 매출 자동 계산
  useEffect(() => {
    const total = salesCategories.reduce((sum, category) => sum + category.amount, 0);
    setFormData(prev => ({ ...prev, total_revenue: total }));
  }, [salesCategories]);

  // 카테고리 금액 변경
  const updateCategoryAmount = (id: string, amount: number) => {
    setSalesCategories(prev => 
      prev.map(category => 
        category.id === id ? { ...category, amount } : category
      )
    );
  };

  // 새 카테고리 추가
  const addCategory = () => {
    const newCategory: SalesCategory = {
      id: Date.now().toString(),
      name: '',
      amount: 0,
      description: ''
    };
    setSalesCategories(prev => [...prev, newCategory]);
  };

  // 카테고리 삭제
  const removeCategory = (id: string) => {
    setSalesCategories(prev => prev.filter(category => category.id !== id));
  };

  // 폼 데이터 변경
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name.includes('count') || name.includes('sessions') || name.includes('sales') || name.includes('revenue') || name.includes('payment') || name.includes('target') 
        ? Number(value) : value
    }));
  };

  // 카테고리 정보 변경
  const updateCategoryInfo = (id: string, field: 'name' | 'description', value: string) => {
    setSalesCategories(prev => 
      prev.map(category => 
        category.id === id ? { ...category, [field]: value } : category
      )
    );
  };

  // 폼 제출
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // 매출 보고서 저장 (임시로 tasks 테이블 활용)
      const reportData = {
        title: `매출보고서 - ${format(new Date(formData.report_date), 'yyyy년 MM월 dd일')}`,
        description: `총 매출: ${formData.total_revenue.toLocaleString()}원\n회원권: ${formData.membership_sales.toLocaleString()}원\nPT: ${formData.pt_sales.toLocaleString()}원\n용품: ${formData.supply_sales.toLocaleString()}원\n자판기: ${formData.vending_sales.toLocaleString()}원\n기타: ${formData.other_sales.toLocaleString()}원\n\n결제수단별:\n현금: ${formData.payment_cash.toLocaleString()}원\n카드: ${formData.payment_card.toLocaleString()}원\n계좌이체: ${formData.payment_transfer.toLocaleString()}원\n\n목표 대비: ${((formData.total_revenue / formData.target_revenue) * 100).toFixed(1)}%\n\n비고: ${formData.notes}`,
        status: 'completed' as const,
        priority: 'medium' as const,
        due_date: formData.report_date,
        assigned_to: user?.id,
        created_by: user?.id,
        category: 'report'
      };

      const { error: taskError } = await supabase
        .from('tasks')
        .insert(reportData);

      if (taskError) throw taskError;

      setSuccess('매출보고서가 성공적으로 저장되었습니다.');
      
      // 폼 초기화
      setFormData({
        report_date: format(new Date(), 'yyyy-MM-dd'),
        membership_sales: 0,
        pt_sales: 0,
        supply_sales: 0,
        vending_sales: 0,
        other_sales: 0,
        total_revenue: 0,
        membership_count: 0,
        pt_sessions: 0,
        notes: '',
        payment_cash: 0,
        payment_card: 0,
        payment_transfer: 0,
        target_revenue: 0,
      });

      setSalesCategories([
        { id: '1', name: '회원권 판매', amount: 0, description: '헬스, 테니스, 골프 회원권' },
        { id: '2', name: 'PT 판매', amount: 0, description: '개인 트레이닝 레슨' },
        { id: '3', name: '용품 판매', amount: 0, description: '운동용품, 보충제 등' },
        { id: '4', name: '자판기 관리', amount: 0, description: '음료, 간식류' },
        { id: '5', name: '기타 매출', amount: 0, description: '락커 대여, 부대시설 등' },
      ]);

      // 성공 메시지 자동 제거
      setTimeout(() => setSuccess(null), 5000);

    } catch (err) {
      console.error('매출보고서 저장 오류:', err);
      setError('매출보고서 저장에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  };

  // 달성률 계산
  const achievementRate = formData.target_revenue > 0 ? (formData.total_revenue / formData.target_revenue) * 100 : 0;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-slate-50 p-6"
    >
      <div className="max-w-6xl mx-auto">
        {/* 헤더 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 flex items-center">
            <FileText className="w-8 h-8 mr-3 text-green-600" />
            매출보고서 작성
          </h1>
          <p className="text-slate-600 mt-2">
            일일 매출 현황을 상세히 기록하고 분석하세요
          </p>
        </div>

        {/* 알림 메시지 */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg"
          >
            {error}
          </motion.div>
        )}

        {success && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg"
          >
            {success}
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* 기본 정보 */}
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
            <h2 className="text-xl font-semibold text-slate-900 mb-4 flex items-center">
              <Calendar className="w-5 h-5 mr-2 text-blue-600" />
              기본 정보
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  보고서 날짜 *
                </label>
                <input
                  type="date"
                  name="report_date"
                  value={formData.report_date}
                  onChange={handleInputChange}
                  className="form-input w-full"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  목표 매출 (원)
                </label>
                <input
                  type="number"
                  name="target_revenue"
                  value={formData.target_revenue || ''}
                  onChange={handleInputChange}
                  className="form-input w-full"
                  placeholder="0"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  작성자
                </label>
                <input
                  type="text"
                  value={user?.email || '익명'}
                  className="form-input w-full bg-slate-50"
                  disabled
                />
              </div>
            </div>
          </div>

          {/* 매출 카테고리 */}
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-slate-900 flex items-center">
                <DollarSign className="w-5 h-5 mr-2 text-green-600" />
                매출 카테고리
              </h2>
              <button
                type="button"
                onClick={addCategory}
                className="btn btn-outline btn-sm flex items-center"
              >
                <Plus className="w-4 h-4 mr-1" />
                카테고리 추가
              </button>
            </div>

            <div className="space-y-4">
              {salesCategories.map((category) => (
                <motion.div
                  key={category.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-slate-50 rounded-lg p-4 border border-slate-200"
                >
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                    <div className="md:col-span-3">
                      <input
                        type="text"
                        placeholder="카테고리명"
                        value={category.name}
                        onChange={(e) => updateCategoryInfo(category.id, 'name', e.target.value)}
                        className="form-input w-full text-sm"
                      />
                    </div>
                    
                    <div className="md:col-span-2">
                      <div className="relative">
                        <input
                          type="number"
                          placeholder="0"
                          value={category.amount || ''}
                          onChange={(e) => updateCategoryAmount(category.id, Number(e.target.value))}
                          className="form-input w-full text-sm pr-8"
                        />
                        <span className="absolute inset-y-0 right-3 flex items-center text-xs text-slate-500">원</span>
                      </div>
                    </div>
                    
                    <div className="md:col-span-6">
                      <input
                        type="text"
                        placeholder="설명 (선택사항)"
                        value={category.description}
                        onChange={(e) => updateCategoryInfo(category.id, 'description', e.target.value)}
                        className="form-input w-full text-sm"
                      />
                    </div>
                    
                    <div className="md:col-span-1">
                      {salesCategories.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeCategory(category.id)}
                          className="text-red-500 hover:text-red-700 p-1"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* 총 매출 */}
            <div className="mt-6 pt-4 border-t border-slate-200">
              <div className="flex justify-between items-center">
                <span className="text-lg font-semibold text-slate-900">총 매출:</span>
                <span className="text-2xl font-bold text-green-600">
                  {formData.total_revenue.toLocaleString()}원
                </span>
              </div>
              
              {formData.target_revenue > 0 && (
                <div className="mt-3 bg-slate-100 rounded-lg p-3">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-slate-600">목표 달성률</span>
                    <span className={clsx(
                      'text-sm font-semibold',
                      achievementRate >= 100 ? 'text-green-600' :
                      achievementRate >= 80 ? 'text-yellow-600' : 'text-red-600'
                    )}>
                      {achievementRate.toFixed(1)}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2">
                    <div
                      className={clsx(
                        'h-2 rounded-full transition-all duration-300',
                        achievementRate >= 100 ? 'bg-green-500' :
                        achievementRate >= 80 ? 'bg-yellow-500' : 'bg-red-500'
                      )}
                      style={{ width: `${Math.min(achievementRate, 100)}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 결제 수단별 분석 */}
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
            <h2 className="text-xl font-semibold text-slate-900 mb-4 flex items-center">
              <Calculator className="w-5 h-5 mr-2 text-purple-600" />
              결제 수단별 분석
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  현금 (원)
                </label>
                <input
                  type="number"
                  name="payment_cash"
                  value={formData.payment_cash || ''}
                  onChange={handleInputChange}
                  className="form-input w-full"
                  placeholder="0"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  카드 (원)
                </label>
                <input
                  type="number"
                  name="payment_card"
                  value={formData.payment_card || ''}
                  onChange={handleInputChange}
                  className="form-input w-full"
                  placeholder="0"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  계좌이체 (원)
                </label>
                <input
                  type="number"
                  name="payment_transfer"
                  value={formData.payment_transfer || ''}
                  onChange={handleInputChange}
                  className="form-input w-full"
                  placeholder="0"
                />
              </div>
            </div>

            {/* 결제 수단 차트 */}
            <div className="mt-6">
              <div className="grid grid-cols-3 gap-4">
                {[
                  { name: '현금', amount: formData.payment_cash, color: 'bg-green-500' },
                  { name: '카드', amount: formData.payment_card, color: 'bg-blue-500' },
                  { name: '계좌이체', amount: formData.payment_transfer, color: 'bg-purple-500' }
                ].map((payment) => {
                  const total = formData.payment_cash + formData.payment_card + formData.payment_transfer;
                  const percentage = total > 0 ? (payment.amount / total) * 100 : 0;
                  
                  return (
                    <div key={payment.name} className="text-center">
                      <div className="h-2 bg-slate-200 rounded-full mb-2">
                        <div
                          className={`h-full rounded-full ${payment.color} transition-all duration-300`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <div className="text-xs text-slate-600">{payment.name}</div>
                      <div className="text-sm font-semibold">{percentage.toFixed(1)}%</div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* 실적 지표 */}
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
            <h2 className="text-xl font-semibold text-slate-900 mb-4 flex items-center">
              <TrendingUp className="w-5 h-5 mr-2 text-orange-600" />
              실적 지표
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  신규 회원 수
                </label>
                <input
                  type="number"
                  name="membership_count"
                  value={formData.membership_count || ''}
                  onChange={handleInputChange}
                  className="form-input w-full"
                  placeholder="0"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  PT 세션 수
                </label>
                <input
                  type="number"
                  name="pt_sessions"
                  value={formData.pt_sessions || ''}
                  onChange={handleInputChange}
                  className="form-input w-full"
                  placeholder="0"
                />
              </div>
            </div>
          </div>

          {/* 비고 */}
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
            <h2 className="text-xl font-semibold text-slate-900 mb-4">
              비고 및 특이사항
            </h2>
            
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleInputChange}
              className="form-input w-full h-32"
              placeholder="특이사항, 이벤트, 문제점 등을 기록해주세요..."
            />
          </div>

          {/* 제출 버튼 */}
          <div className="flex justify-end space-x-4">
            <button
              type="button"
              className="btn btn-outline"
              onClick={() => window.history.back()}
            >
              취소
            </button>
            
            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary flex items-center"
            >
              <Save className="w-4 h-4 mr-2" />
              {loading ? '저장 중...' : '보고서 저장'}
            </button>
          </div>
        </form>
      </div>
    </motion.div>
  );
};

export default SalesReportCreate; 