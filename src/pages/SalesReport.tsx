import { useState, useRef, useEffect } from 'react';
import { format, subWeeks, subMonths, isWithinInterval, parseISO, startOfDay, endOfDay } from 'date-fns';
import { useReactToPrint } from 'react-to-print';
import { Bar, Line, Pie, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { supabase } from '../supabaseClient';
import type { Database } from '../types/database.types';
import { 
  Download, 
  Calendar, 
  TrendingUp, 
  PieChart, 
  BarChart3, 
  LineChart,
  Filter,
  RefreshCw,
  Eye,
  EyeOff,
  Calculator,
  Users,
  DollarSign
} from 'lucide-react';

ChartJS.register(
  CategoryScale, 
  LinearScale, 
  BarElement, 
  LineElement, 
  PointElement, 
  Title, 
  Tooltip, 
  Legend,
  ArcElement
);

type Pass = Database['public']['Tables']['passes']['Row'];
type Sale = Database['public']['Tables']['sales']['Row'] & { pass_name?: string };
type ChartType = 'bar' | 'line' | 'pie' | 'doughnut';

const getRange = (type: 'day' | 'week' | 'month') => {
  const now = new Date();
  if (type === 'day') return { start: startOfDay(now), end: endOfDay(now) };
  if (type === 'week') return { start: startOfDay(subWeeks(now, 1)), end: endOfDay(now) };
  return { start: startOfDay(subMonths(now, 1)), end: endOfDay(now) };
};

export default function SalesReport() {
  const [rangeType, setRangeType] = useState<'day' | 'week' | 'month'>('week');
  const [customRange, setCustomRange] = useState<{start: string, end: string}|null>(null);
  const [selectedPassId, setSelectedPassId] = useState<string|null>(null);
  const [openDetail, setOpenDetail] = useState<string|null>(null);
  const [chartType, setChartType] = useState<ChartType>('bar');
  const [showStats, setShowStats] = useState(true);
  const [passes, setPasses] = useState<Pass[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);
  
  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `매출보고서_${format(new Date(), 'yyyy-MM-dd')}`,
  });

  const fetchData = async () => {
    try {
      setRefreshing(true);
      // 이용권 데이터 가져오기
      const { data: passesData, error: passesError } = await supabase
        .from('passes')
        .select('*')
        .order('name');
      
      if (passesError) throw passesError;
      
      // 매출 데이터 가져오기
      const { data: salesData, error: salesError } = await supabase
        .from('sales')
        .select('*, passes(name)')
        .order('sale_date', { ascending: false });
      
      if (salesError) throw salesError;
      
      // 데이터 변환 - passes 관계에서 이름 추출
      const formattedSales = salesData.map(sale => ({
        ...sale,
        pass_name: sale.passes?.name || '기타'
      }));
      
      setPasses(passesData || []);
      setSales(formattedSales || []);
    } catch (error) {
      console.error('데이터 로딩 중 오류:', error);
      alert('데이터를 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const { start, end } = customRange
    ? { start: parseISO(customRange.start), end: parseISO(customRange.end) }
    : getRange(rangeType);

  const filtered = sales.filter(sale =>
    sale.sale_date && isWithinInterval(parseISO(sale.sale_date), { start, end }) &&
    (selectedPassId ? sale.pass_id === selectedPassId : true)
  );

  const total = filtered.reduce((sum, sale) => sum + sale.amount, 0);
  const avgSale = filtered.length > 0 ? total / filtered.length : 0;
  const totalTransactions = filtered.length;
  const uniqueCustomers = new Set(filtered.map(sale => sale.customer_name)).size;

  const byPass = passes.map(pass => {
    const passData = filtered.filter(sale => sale.pass_id === pass.id);
    return {
      ...pass,
      total: passData.reduce((sum, sale) => sum + sale.amount, 0),
      count: passData.length
    };
  }).filter(pass => pass.total > 0);

  // 차트 색상 팔레트
  const colors = [
    'rgba(59, 130, 246, 0.8)',   // 블루
    'rgba(16, 185, 129, 0.8)',   // 그린
    'rgba(245, 158, 11, 0.8)',   // 앰버
    'rgba(239, 68, 68, 0.8)',    // 레드
    'rgba(139, 92, 246, 0.8)',   // 바이올렛
    'rgba(236, 72, 153, 0.8)',   // 핑크
    'rgba(14, 165, 233, 0.8)',   // 스카이
    'rgba(34, 197, 94, 0.8)',    // 에메랄드
  ];

  const chartData = {
    labels: byPass.map(p => p.name),
    datasets: [
      {
        label: chartType === 'line' ? '매출 추이' : '매출(원)',
        data: byPass.map(p => p.total),
        backgroundColor: chartType === 'pie' || chartType === 'doughnut' 
          ? colors.slice(0, byPass.length)
          : 'rgba(59,130,246,0.7)',
        borderColor: chartType === 'line' ? 'rgba(59,130,246,1)' : undefined,
        borderWidth: chartType === 'pie' || chartType === 'doughnut' ? 2 : 1,
        fill: chartType === 'line' ? false : true,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: chartType === 'pie' || chartType === 'doughnut',
        position: 'right' as const,
      },
      title: {
        display: true,
        text: `매출 현황 (${format(start, 'MM/dd')} ~ ${format(end, 'MM/dd')})`,
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            if (chartType === 'pie' || chartType === 'doughnut') {
              const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
              const percentage = ((context.raw / total) * 100).toFixed(1);
              return `${context.label}: ${context.raw.toLocaleString()}원 (${percentage}%)`;
            }
            return `${context.label}: ${context.raw.toLocaleString()}원`;
          }
        }
      }
    },
    scales: chartType === 'pie' || chartType === 'doughnut' ? undefined : {
      y: {
        beginAtZero: true,
        ticks: {
          callback: function(value: any) {
            return value.toLocaleString() + '원';
          }
        }
      }
    }
  };

  const renderChart = () => {
    const commonProps = { data: chartData, options: chartOptions };
    
    switch (chartType) {
      case 'line':
        return <Line {...commonProps} />;
      case 'pie':
        return <Pie {...commonProps} />;
      case 'doughnut':
        return <Doughnut {...commonProps} />;
      default:
        return <Bar {...commonProps} />;
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto bg-gray-50 min-h-screen">
      {/* 헤더 */}
      <div className="mb-6 bg-white rounded-lg shadow-sm p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 flex items-center">
              <TrendingUp className="mr-3 text-blue-600" size={32} />
              매출 보고서
            </h1>
            <p className="text-gray-600 mt-1">실시간 매출 현황을 확인하고 분석하세요</p>
          </div>
          <div className="flex items-center space-x-2 mt-4 md:mt-0">
            <button 
              onClick={fetchData} 
              disabled={refreshing}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              <RefreshCw className={`mr-2 ${refreshing ? 'animate-spin' : ''}`} size={16} />
              {refreshing ? '새로고침 중...' : '새로고침'}
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center p-20">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-600">데이터를 불러오는 중...</p>
          </div>
        </div>
      ) : (
        <>
          {/* 통계 카드 */}
          {showStats && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-blue-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">총 매출</p>
                    <p className="text-2xl font-bold text-gray-900">{total.toLocaleString()}원</p>
                  </div>
                  <DollarSign className="text-blue-500" size={32} />
                </div>
              </div>
              <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-green-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">거래 건수</p>
                    <p className="text-2xl font-bold text-gray-900">{totalTransactions}건</p>
                  </div>
                  <Calculator className="text-green-500" size={32} />
                </div>
              </div>
              <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-yellow-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">평균 거래액</p>
                    <p className="text-2xl font-bold text-gray-900">{avgSale.toLocaleString()}원</p>
                  </div>
                  <TrendingUp className="text-yellow-500" size={32} />
                </div>
              </div>
              <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-purple-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">고객 수</p>
                    <p className="text-2xl font-bold text-gray-900">{uniqueCustomers}명</p>
                  </div>
                  <Users className="text-purple-500" size={32} />
                </div>
              </div>
            </div>
          )}

          {/* 필터 및 컨트롤 */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <Filter className="mr-2 text-gray-600" size={20} />
                필터 및 설정
              </h3>
              <button
                onClick={() => setShowStats(!showStats)}
                className="flex items-center px-3 py-1 text-sm bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                {showStats ? <EyeOff size={16} className="mr-1" /> : <Eye size={16} className="mr-1" />}
                {showStats ? '통계 숨기기' : '통계 보기'}
              </button>
            </div>
            
            {/* 기간 선택 */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">기간 선택</label>
                <div className="flex space-x-2">
                  {(['day', 'week', 'month'] as const).map((type) => (
                    <button
                      key={type}
                      className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                        rangeType === type
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                      onClick={() => setRangeType(type)}
                    >
                      {type === 'day' ? '1일' : type === 'week' ? '1주' : '1달'}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">이용권 필터</label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={selectedPassId || ''}
                  onChange={e => setSelectedPassId(e.target.value || null)}
                >
                  <option value="">전체 이용권</option>
                  {passes.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">차트 유형</label>
                <div className="flex space-x-2">
                  {([
                    { type: 'bar', icon: BarChart3, label: '막대' },
                    { type: 'line', icon: LineChart, label: '선형' },
                    { type: 'pie', icon: PieChart, label: '원형' },
                  ] as const).map(({ type, icon: Icon, label }) => (
                    <button
                      key={type}
                      className={`p-2 rounded-lg transition-colors ${
                        chartType === type
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                      onClick={() => setChartType(type)}
                      title={label}
                    >
                      <Icon size={16} />
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* 커스텀 날짜 선택 */}
            <div className="border-t pt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">커스텀 기간 선택</label>
              <div className="flex flex-col md:flex-row items-start md:items-center space-y-2 md:space-y-0 md:space-x-3">
                <input
                  type="date"
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={customRange?.start || ''}
                  onChange={e => setCustomRange(r => ({ ...r!, start: e.target.value, end: r?.end || e.target.value }))}
                />
                <span className="text-gray-500">~</span>
                <input
                  type="date"
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={customRange?.end || ''}
                  onChange={e => setCustomRange(r => ({ ...r!, end: e.target.value, start: r?.start || e.target.value }))}
                />
                <button
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                  onClick={() => setCustomRange(null)}
                >
                  초기화
                </button>
              </div>
            </div>
          </div>

          {/* 차트 */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <div className="h-80 md:h-96">
              {byPass.length > 0 ? (
                renderChart()
              ) : (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center text-gray-500">
                    <PieChart size={48} className="mx-auto mb-2 opacity-50" />
                    <p>선택한 기간에 매출 데이터가 없습니다</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 매출 상세 테이블 */}
          <div ref={printRef} className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900">매출 상세 내역</h2>
                <p className="text-sm text-gray-600 mt-1">
                  기간: {format(start, 'yyyy년 MM월 dd일')} ~ {format(end, 'yyyy년 MM월 dd일')}
                </p>
              </div>
              <div className="text-right text-sm text-gray-600 mt-4 md:mt-0">
                <div className="font-medium">회사명: (주)스포닷</div>
                <div>발행일: {format(new Date(), 'yyyy년 MM월 dd일')}</div>
              </div>
            </div>
            
            {/* 테이블 */}
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b">
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">날짜</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">고객명</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">이용권</th>
                    <th className="text-right py-3 px-4 font-semibold text-gray-700">금액</th>
                    <th className="text-center py-3 px-4 font-semibold text-gray-700">상세</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length > 0 ? (
                    filtered.map((sale, index) => (
                      <>
                        <tr key={sale.id} className={`border-b hover:bg-gray-50 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-gray-25'}`}>
                          <td className="py-3 px-4 text-gray-900">
                            {sale.sale_date ? format(parseISO(sale.sale_date), 'MM/dd') : '-'}
                          </td>
                          <td className="py-3 px-4 text-gray-900 font-medium">{sale.customer_name}</td>
                          <td className="py-3 px-4">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              {sale.pass_name || '기타'}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right font-semibold text-gray-900">
                            {sale.amount.toLocaleString()}원
                          </td>
                          <td className="py-3 px-4 text-center">
                            <button
                              className="inline-flex items-center px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                              onClick={() => setOpenDetail(openDetail === sale.id ? null : sale.id)}
                            >
                              {openDetail === sale.id ? <EyeOff size={14} className="mr-1" /> : <Eye size={14} className="mr-1" />}
                              {openDetail === sale.id ? '닫기' : '보기'}
                            </button>
                          </td>
                        </tr>
                        {openDetail === sale.id && (
                          <tr>
                            <td colSpan={5} className="bg-blue-50 border-b">
                              <div className="p-4 space-y-2">
                                <h4 className="font-semibold text-gray-800 mb-3">거래 상세 정보</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                  <div className="space-y-2">
                                    <div className="flex justify-between">
                                      <span className="text-gray-600">거래 ID:</span>
                                      <span className="font-mono text-gray-800">{sale.id}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-gray-600">고객명:</span>
                                      <span className="font-medium text-gray-800">{sale.customer_name}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-gray-600">이용권:</span>
                                      <span className="text-gray-800">{sale.pass_name || '기타'}</span>
                                    </div>
                                  </div>
                                  <div className="space-y-2">
                                    <div className="flex justify-between">
                                      <span className="text-gray-600">거래 금액:</span>
                                      <span className="font-bold text-blue-600">{sale.amount.toLocaleString()}원</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-gray-600">거래 일시:</span>
                                      <span className="text-gray-800">
                                        {sale.sale_date ? format(parseISO(sale.sale_date), 'yyyy-MM-dd HH:mm') : '-'}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="text-center py-12">
                        <div className="text-gray-500">
                          <Calendar size={48} className="mx-auto mb-3 opacity-50" />
                          <p className="text-lg font-medium">매출 데이터가 없습니다</p>
                          <p className="text-sm">선택한 기간과 조건에 해당하는 매출이 없습니다.</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            
            {/* 합계 */}
            {filtered.length > 0 && (
              <div className="mt-6 pt-4 border-t bg-gray-50 -mx-6 px-6 py-4">
                <div className="flex flex-col md:flex-row md:justify-between md:items-center">
                  <div className="text-sm text-gray-600 mb-2 md:mb-0">
                    총 {totalTransactions}건의 거래 • 평균 {avgSale.toLocaleString()}원
                  </div>
                  <div className="text-xl font-bold text-gray-900">
                    총 합계: <span className="text-blue-600">{total.toLocaleString()}원</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 액션 버튼 */}
          <div className="flex flex-col md:flex-row gap-3 md:justify-end">
            <button
              onClick={handlePrint}
              className="flex items-center justify-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
            >
              <Download className="mr-2" size={20} />
              PDF 다운로드
            </button>
            <button
              onClick={() => {
                const csvContent = "data:text/csv;charset=utf-8," 
                  + "날짜,고객명,이용권,금액\n"
                  + filtered.map(sale => 
                      `${sale.sale_date ? format(parseISO(sale.sale_date), 'yyyy-MM-dd') : '-'},${sale.customer_name},${sale.pass_name || '기타'},${sale.amount}`
                    ).join("\n");
                const encodedUri = encodeURI(csvContent);
                const link = document.createElement("a");
                link.setAttribute("href", encodedUri);
                link.setAttribute("download", `매출보고서_${format(new Date(), 'yyyy-MM-dd')}.csv`);
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
              }}
              className="flex items-center justify-center px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors"
            >
              <Download className="mr-2" size={20} />
              CSV 다운로드
            </button>
          </div>
        </>
      )}
    </div>
  );
} 