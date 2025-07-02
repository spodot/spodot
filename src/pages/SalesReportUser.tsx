import { useState, useRef, useEffect } from 'react';
import { format, subWeeks, subMonths, isWithinInterval, parseISO } from 'date-fns';
import { ko } from 'date-fns/locale';
import { useReactToPrint } from 'react-to-print';
import { Bar } from 'react-chartjs-2';
import { motion } from 'framer-motion';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { 
  Download, 
  Calendar, 
  TrendingUp, 
  BarChart3, 
  FileText, 
  RefreshCw,
  DollarSign,
  Filter,
  Eye
} from 'lucide-react';
import { supabase } from '../supabaseClient';
import type { Database } from '../types/database.types';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

type Pass = Database['public']['Tables']['passes']['Row'];
type Sale = Database['public']['Tables']['sales']['Row'] & { pass_name?: string };

const getRange = (type: 'day' | 'week' | 'month') => {
  const now = new Date();
  if (type === 'day') return { start: now, end: now };
  if (type === 'week') return { start: subWeeks(now, 1), end: now };
  return { start: subMonths(now, 1), end: now };
};

export default function SalesReportUser() {
  const [rangeType, setRangeType] = useState<'day' | 'week' | 'month'>('week');
  const [customRange, setCustomRange] = useState<{start: string, end: string}|null>(null);
  const [passes, setPasses] = useState<Pass[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const printRef = useRef<HTMLDivElement>(null);
  
  const handlePrint = useReactToPrint({
    documentTitle: '매출 보고서',
    contentRef: printRef,
  });

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        // 이용권 데이터 가져오기
        const { data: passesData, error: passesError } = await supabase
          .from('passes')
          .select('*');
        
        if (passesError) throw passesError;
        
        // 매출 데이터 가져오기
        const { data: salesData, error: salesError } = await supabase
          .from('sales')
          .select('*, passes(name)');
        
        if (salesError) throw salesError;
        
        // 데이터 변환 - passes 관계에서 이름 추출
        const formattedSales = salesData.map(sale => ({
          ...sale,
          pass_name: sale.passes?.name || '-'
        }));
        
        setPasses(passesData || []);
        setSales(formattedSales || []);
      } catch (error) {
        console.error('데이터 로딩 중 오류:', error);
      } finally {
        setLoading(false);
      }
    }
    
    fetchData();
  }, []);

  const { start, end } = customRange
    ? { start: parseISO(customRange.start), end: parseISO(customRange.end) }
    : getRange(rangeType);

  const filtered = sales.filter(sale =>
    sale.sale_date && isWithinInterval(parseISO(sale.sale_date), { start, end })
  );

  const total = filtered.reduce((sum, sale) => sum + sale.amount, 0);
  
  // 이용권별 데이터
  const byPass = passes.map(pass => ({
    ...pass,
    total: sales.filter(sale =>
      sale.sale_date && isWithinInterval(parseISO(sale.sale_date), { start, end }) && 
      sale.pass_id === pass.id
    ).reduce((sum, sale) => sum + sale.amount, 0)
  }));

  // 차트 데이터
  const chartData = {
    labels: byPass.map(p => p.name),
    datasets: [
      {
        label: '매출(원)',
        data: byPass.map(p => p.total),
        backgroundColor: 'rgba(99, 102, 241, 0.8)',
        borderColor: 'rgba(99, 102, 241, 1)',
        borderWidth: 1,
        borderRadius: 8,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: 'white',
        bodyColor: 'white',
        borderColor: 'rgba(99, 102, 241, 1)',
        borderWidth: 1,
        callbacks: {
          label: (context: any) => `${context.parsed.y.toLocaleString()}원`
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: (value: any) => `${value.toLocaleString()}원`
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.1)',
        }
      },
      x: {
        grid: {
          display: false,
        }
      }
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 }
  };

  return (
    <motion.div 
      className="p-4 sm:p-6 lg:p-8 space-y-6"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* 헤더 */}
      <motion.header variants={itemVariants} className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <div className="p-2 bg-indigo-100 rounded-lg">
              <BarChart3 className="w-8 h-8 text-indigo-600" />
            </div>
            매출 보고서
          </h1>
          <p className="text-gray-600 mt-1">매출 현황을 확인하고 보고서를 다운로드하세요</p>
        </div>
        <div className="flex items-center gap-3">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
          >
            <Download size={20} />
            PDF 다운로드
          </motion.button>
        </div>
      </motion.header>

      {loading ? (
        <motion.div 
          variants={itemVariants}
          className="flex flex-col items-center justify-center p-20"
        >
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-indigo-200 border-t-indigo-600 mb-4"></div>
          <p className="text-gray-600">데이터를 불러오는 중...</p>
        </motion.div>
      ) : (
        <>
          {/* 안내 메시지 */}
          <motion.div variants={itemVariants} className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6">
            <div className="flex items-start gap-4">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Eye className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-blue-900 mb-1">일반 사용자 매출 보고서</h3>
                <p className="text-blue-700 text-sm">이 페이지에서는 매출 현황을 조회하고 보고서를 인쇄할 수 있습니다. 상세 정보는 일부 제한될 수 있습니다.</p>
              </div>
            </div>
          </motion.div>

          {/* 기간 선택 */}
          <motion.div variants={itemVariants} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-gray-100 rounded-lg">
                <Filter className="w-5 h-5 text-gray-600" />
              </div>
              <h3 className="font-semibold text-gray-900">기간 선택</h3>
            </div>
            
            <div className="flex flex-wrap gap-3 items-center">
              {/* 기간 버튼들 */}
              <div className="flex gap-2">
                {[
                  { key: 'day', label: '1일' },
                  { key: 'week', label: '1주' },
                  { key: 'month', label: '1달' }
                ].map(({ key, label }) => (
                  <button
                    key={key}
                    onClick={() => setRangeType(key as 'day' | 'week' | 'month')}
                    className={`px-4 py-2 rounded-lg font-medium transition-all ${
                      rangeType === key
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {/* 직접 선택 */}
              <div className="flex items-center gap-2 ml-4">
                <span className="text-sm font-medium text-gray-700">직접선택:</span>
                <input
                  type="date"
                  value={customRange?.start || ''}
                  onChange={e => setCustomRange(r => ({ ...r!, start: e.target.value, end: r?.end || e.target.value }))}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
                <span className="text-gray-500">~</span>
                <input
                  type="date"
                  value={customRange?.end || ''}
                  onChange={e => setCustomRange(r => ({ ...r!, end: e.target.value, start: r?.start || e.target.value }))}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
                <button
                  onClick={() => setCustomRange(null)}
                  className="px-3 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <RefreshCw size={16} />
                </button>
              </div>
            </div>
          </motion.div>

          {/* 매출 요약 */}
          <motion.div variants={itemVariants} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-green-100 rounded-lg">
                <DollarSign className="w-5 h-5 text-green-600" />
              </div>
              <h3 className="font-semibold text-gray-900">매출 요약</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-lg border border-green-200">
                <p className="text-sm text-green-700 font-medium">총 매출</p>
                <p className="text-2xl font-bold text-green-900">{total.toLocaleString()}원</p>
              </div>
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-200">
                <p className="text-sm text-blue-700 font-medium">거래 건수</p>
                <p className="text-2xl font-bold text-blue-900">{filtered.length}건</p>
              </div>
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-4 rounded-lg border border-purple-200">
                <p className="text-sm text-purple-700 font-medium">평균 거래액</p>
                <p className="text-2xl font-bold text-purple-900">
                  {filtered.length > 0 ? Math.round(total / filtered.length).toLocaleString() : 0}원
                </p>
              </div>
            </div>
          </motion.div>

          {/* 차트 */}
          <motion.div variants={itemVariants} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-indigo-100 rounded-lg">
                <TrendingUp className="w-5 h-5 text-indigo-600" />
              </div>
              <h3 className="font-semibold text-gray-900">이용권별 매출 현황</h3>
            </div>
            <div className="h-80">
              <Bar data={chartData} options={chartOptions} />
            </div>
          </motion.div>

          {/* 인쇄용 보고서 */}
          <motion.div variants={itemVariants} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gray-100 rounded-lg">
                  <FileText className="w-5 h-5 text-gray-600" />
                </div>
                <h3 className="font-semibold text-gray-900">상세 보고서</h3>
              </div>
            </div>
            
            <div ref={printRef} className="p-6">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">매출 보고서</h2>
                  <p className="text-gray-600">
                    기간: {format(start, 'yyyy년 MM월 dd일', { locale: ko })} ~ {format(end, 'yyyy년 MM월 dd일', { locale: ko })}
                  </p>
                </div>
                <div className="text-right text-sm text-gray-600">
                  <p className="font-medium">회사명: (주)스포닷</p>
                  <p>발행일: {format(new Date(), 'yyyy년 MM월 dd일', { locale: ko })}</p>
                </div>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-gray-300">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="border border-gray-300 px-4 py-3 text-left font-semibold text-gray-900">날짜</th>
                      <th className="border border-gray-300 px-4 py-3 text-left font-semibold text-gray-900">이용권</th>
                      <th className="border border-gray-300 px-4 py-3 text-right font-semibold text-gray-900">금액(원)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((sale, index) => (
                      <tr key={sale.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        <td className="border border-gray-300 px-4 py-3 text-gray-900">
                          {sale.sale_date ? format(parseISO(sale.sale_date), 'yyyy-MM-dd') : '-'}
                        </td>
                        <td className="border border-gray-300 px-4 py-3 text-gray-900">{sale.pass_name || '-'}</td>
                        <td className="border border-gray-300 px-4 py-3 text-right font-medium text-gray-900">
                          {sale.amount.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                    {filtered.length === 0 && (
                      <tr>
                        <td colSpan={3} className="border border-gray-300 px-4 py-8 text-center text-gray-500">
                          선택한 기간에 데이터가 없습니다
                        </td>
                      </tr>
                    )}
                  </tbody>
                  <tfoot>
                    <tr className="bg-gray-100">
                      <td colSpan={2} className="border border-gray-300 px-4 py-3 font-bold text-gray-900">총 합계</td>
                      <td className="border border-gray-300 px-4 py-3 text-right font-bold text-gray-900">
                        {total.toLocaleString()}원
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </motion.div>
  );
} 