import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, X, Edit3, Trash2, MoreHorizontal, Settings, Download, FileSpreadsheet, FileText, File } from 'lucide-react';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import clsx from 'clsx';
// XLSX와 jsPDF를 동적 import로 변경
// import * as XLSX from 'xlsx';
// import jsPDF from 'jspdf';
import 'jspdf-autotable';

// 시트 타입 정의
interface SheetTab {
  id: string;
  name: string;
  type: string;
  data: any[];
  columns: SheetColumn[];
}

interface SheetColumn {
  id: string;
  name: string;
  type: 'text' | 'select' | 'date' | 'number';
  options?: string[];
  width?: number;
}

// 기본 시트 템플릿들
const sheetTemplates = {
  'customer-list': {
    name: '고객 관리',
    columns: [
      { id: 'name', name: '이름', type: 'text' as const, width: 120 },
      { id: 'phone', name: '전화번호', type: 'text' as const, width: 130 },
      { id: 'email', name: '이메일', type: 'text' as const, width: 180 },
      { id: 'address', name: '주소', type: 'text' as const, width: 150 },
      { id: 'birthDate', name: '생년월일', type: 'date' as const, width: 120 },
      { id: 'membershipType', name: '멤버십', type: 'select' as const, width: 100, options: ['기본', '프리미엄', 'VIP', '체험'] },
      { id: 'membershipStart', name: '시작일', type: 'date' as const, width: 120 },
      { id: 'membershipEnd', name: '종료일', type: 'date' as const, width: 120 },
      { id: 'trainer', name: '트레이너', type: 'select' as const, width: 100, options: ['', '박지민', '최준호', '김지연', '이민수'] },
      { id: 'status', name: '상태', type: 'select' as const, width: 80, options: ['활성', '비활성', '정지'] },
      { id: 'notes', name: '메모', type: 'text' as const, width: 200 },
    ],
    data: [
      {
        id: '1',
        name: '김철수',
        phone: '010-1234-5678',
        email: 'kim@example.com',
        address: '서울시 강남구',
        birthDate: '1990-01-15',
        membershipType: '프리미엄',
        membershipStart: '2024-01-01',
        membershipEnd: '2024-12-31',
        trainer: '박지민',
        status: '활성',
        notes: '주 3회 운동 선호',
      },
      {
        id: '2',
        name: '이영희',
        phone: '010-2345-6789',
        email: 'lee@example.com',
        address: '서울시 서초구',
        birthDate: '1985-05-20',
        membershipType: '기본',
        membershipStart: '2024-02-01',
        membershipEnd: '2024-08-01',
        trainer: '최준호',
        status: '활성',
        notes: '요가 클래스 참여',
      }
    ]
  },
  'phone-inquiry': {
    name: '전화문의',
    columns: [
      { id: 'date', name: '문의일', type: 'date' as const, width: 120 },
      { id: 'name', name: '이름', type: 'text' as const, width: 100 },
      { id: 'phone', name: '전화번호', type: 'text' as const, width: 130 },
      { id: 'inquiryType', name: '문의유형', type: 'select' as const, width: 120, options: ['가격문의', '시설문의', '프로그램문의', '기타'] },
      { id: 'content', name: '문의내용', type: 'text' as const, width: 300 },
      { id: 'response', name: '응답내용', type: 'text' as const, width: 300 },
      { id: 'status', name: '처리상태', type: 'select' as const, width: 100, options: ['대기', '처리중', '완료'] },
      { id: 'staff', name: '담당자', type: 'text' as const, width: 100 },
    ],
    data: []
  },
  'membership-reservation': {
    name: '회원권(PT포함)상담예약',
    columns: [
      { id: 'date', name: '예약일', type: 'date' as const, width: 120 },
      { id: 'time', name: '예약시간', type: 'text' as const, width: 100 },
      { id: 'name', name: '이름', type: 'text' as const, width: 100 },
      { id: 'phone', name: '전화번호', type: 'text' as const, width: 130 },
      { id: 'membershipType', name: '관심멤버십', type: 'select' as const, width: 120, options: ['기본', '프리미엄', 'VIP', 'PT패키지'] },
      { id: 'visitDate', name: '방문예정일', type: 'date' as const, width: 120 },
      { id: 'notes', name: '특이사항', type: 'text' as const, width: 200 },
      { id: 'status', name: '상태', type: 'select' as const, width: 100, options: ['예약', '방문완료', '취소', '노쇼'] },
    ],
    data: []
  },
  'consulting-reservation': {
    name: '상담예약',
    columns: [
      { id: 'date', name: '예약일', type: 'date' as const, width: 120 },
      { id: 'time', name: '예약시간', type: 'text' as const, width: 100 },
      { id: 'name', name: '이름', type: 'text' as const, width: 100 },
      { id: 'phone', name: '전화번호', type: 'text' as const, width: 130 },
      { id: 'consultingType', name: '상담유형', type: 'select' as const, width: 120, options: ['운동상담', '식단상담', '건강상담', '기타'] },
      { id: 'consultant', name: '상담사', type: 'select' as const, width: 100, options: ['박지민', '최준호', '김지연', '이민수'] },
      { id: 'notes', name: '상담내용', type: 'text' as const, width: 300 },
      { id: 'status', name: '상태', type: 'select' as const, width: 100, options: ['예약', '상담완료', '취소'] },
    ],
    data: []
  },
  'inquiry': {
    name: '문의',
    columns: [
      { id: 'date', name: '문의일', type: 'date' as const, width: 120 },
      { id: 'name', name: '이름', type: 'text' as const, width: 100 },
      { id: 'phone', name: '전화번호', type: 'text' as const, width: 130 },
      { id: 'email', name: '이메일', type: 'text' as const, width: 180 },
      { id: 'subject', name: '제목', type: 'text' as const, width: 200 },
      { id: 'content', name: '문의내용', type: 'text' as const, width: 300 },
      { id: 'response', name: '답변', type: 'text' as const, width: 300 },
      { id: 'status', name: '처리상태', type: 'select' as const, width: 100, options: ['접수', '처리중', '완료'] },
    ],
    data: []
  },
  'fc-log': {
    name: 'FC LOG',
    columns: [
      { id: 'date', name: '날짜', type: 'date' as const, width: 120 },
      { id: 'time', name: '시간', type: 'text' as const, width: 100 },
      { id: 'staff', name: '직원', type: 'text' as const, width: 100 },
      { id: 'activity', name: '활동', type: 'select' as const, width: 150, options: ['회원상담', '시설점검', '프로그램진행', '기타'] },
      { id: 'description', name: '상세내용', type: 'text' as const, width: 300 },
      { id: 'notes', name: '비고', type: 'text' as const, width: 200 },
    ],
    data: []
  },
  'unregistered-db': {
    name: '미등록자DB',
    columns: [
      { id: 'date', name: '방문일', type: 'date' as const, width: 120 },
      { id: 'name', name: '이름', type: 'text' as const, width: 100 },
      { id: 'phone', name: '전화번호', type: 'text' as const, width: 130 },
      { id: 'age', name: '나이', type: 'number' as const, width: 80 },
      { id: 'interest', name: '관심분야', type: 'select' as const, width: 120, options: ['헬스', '요가', '필라테스', '수영', '테니스'] },
      { id: 'source', name: '유입경로', type: 'select' as const, width: 120, options: ['온라인', '지인추천', '광고', '직접방문'] },
      { id: 'notes', name: '메모', type: 'text' as const, width: 200 },
      { id: 'followUp', name: '후속조치', type: 'select' as const, width: 100, options: ['연락예정', '재방문예정', '관심없음'] },
    ],
    data: []
  },
  'total-db': {
    name: '전체DB',
    columns: [
      { id: 'name', name: '이름', type: 'text' as const, width: 100 },
      { id: 'phone', name: '전화번호', type: 'text' as const, width: 130 },
      { id: 'email', name: '이메일', type: 'text' as const, width: 180 },
      { id: 'type', name: '구분', type: 'select' as const, width: 100, options: ['회원', '비회원', '잠재고객', '탈퇴회원'] },
      { id: 'registrationDate', name: '등록일', type: 'date' as const, width: 120 },
      { id: 'lastContact', name: '최종연락일', type: 'date' as const, width: 120 },
      { id: 'status', name: '상태', type: 'select' as const, width: 100, options: ['활성', '비활성', '휴면'] },
      { id: 'notes', name: '비고', type: 'text' as const, width: 200 },
    ],
    data: []
  },
  'ot-list': {
    name: 'OT리스트',
    columns: [
      { id: 'date', name: '날짜', type: 'date' as const, width: 120 },
      { id: 'time', name: '시간', type: 'text' as const, width: 100 },
      { id: 'member', name: '회원명', type: 'text' as const, width: 100 },
      { id: 'trainer', name: '트레이너', type: 'select' as const, width: 100, options: ['박지민', '최준호', '김지연', '이민수'] },
      { id: 'program', name: '프로그램', type: 'select' as const, width: 120, options: ['웨이트', '유산소', '기능성', '재활'] },
      { id: 'duration', name: '시간(분)', type: 'number' as const, width: 100 },
      { id: 'status', name: '상태', type: 'select' as const, width: 100, options: ['예약', '진행중', '완료', '취소'] },
      { id: 'notes', name: '특이사항', type: 'text' as const, width: 200 },
    ],
    data: []
  },
  'contact-schedule': {
    name: '연락망/스케줄',
    columns: [
      { id: 'date', name: '날짜', type: 'date' as const, width: 120 },
      { id: 'time', name: '시간', type: 'text' as const, width: 100 },
      { id: 'name', name: '이름', type: 'text' as const, width: 100 },
      { id: 'phone', name: '전화번호', type: 'text' as const, width: 130 },
      { id: 'purpose', name: '연락목적', type: 'select' as const, width: 120, options: ['상담예약', '만료안내', '프로그램안내', '기타'] },
      { id: 'result', name: '연락결과', type: 'select' as const, width: 120, options: ['연결성공', '부재중', '거부', '번호오류'] },
      { id: 'nextContact', name: '다음연락일', type: 'date' as const, width: 120 },
      { id: 'notes', name: '메모', type: 'text' as const, width: 200 },
    ],
    data: []
  },
  'tour-only': {
    name: '투어만',
    columns: [
      { id: 'date', name: '투어일', type: 'date' as const, width: 120 },
      { id: 'name', name: '이름', type: 'text' as const, width: 100 },
      { id: 'phone', name: '전화번호', type: 'text' as const, width: 130 },
      { id: 'age', name: '나이', type: 'number' as const, width: 80 },
      { id: 'interest', name: '관심분야', type: 'select' as const, width: 120, options: ['헬스', '요가', '필라테스', '수영', '테니스'] },
      { id: 'guide', name: '안내직원', type: 'text' as const, width: 100 },
      { id: 'satisfaction', name: '만족도', type: 'select' as const, width: 100, options: ['매우만족', '만족', '보통', '불만족'] },
      { id: 'followUp', name: '후속조치', type: 'select' as const, width: 120, options: ['가입예정', '재방문예정', '관심없음'] },
      { id: 'notes', name: '메모', type: 'text' as const, width: 200 },
    ],
    data: []
  },
  'question': {
    name: '질문',
    columns: [
      { id: 'date', name: '질문일', type: 'date' as const, width: 120 },
      { id: 'name', name: '질문자', type: 'text' as const, width: 100 },
      { id: 'category', name: '카테고리', type: 'select' as const, width: 120, options: ['운동방법', '식단', '시설이용', '요금', '기타'] },
      { id: 'question', name: '질문내용', type: 'text' as const, width: 300 },
      { id: 'answer', name: '답변', type: 'text' as const, width: 300 },
      { id: 'answerer', name: '답변자', type: 'text' as const, width: 100 },
      { id: 'status', name: '상태', type: 'select' as const, width: 100, options: ['대기', '답변완료'] },
    ],
    data: []
  },
  'feedback': {
    name: '피드백',
    columns: [
      { id: 'date', name: '피드백일', type: 'date' as const, width: 120 },
      { id: 'name', name: '작성자', type: 'text' as const, width: 100 },
      { id: 'type', name: '유형', type: 'select' as const, width: 100, options: ['칭찬', '불만', '제안', '기타'] },
      { id: 'category', name: '분야', type: 'select' as const, width: 120, options: ['시설', '서비스', '프로그램', '직원', '기타'] },
      { id: 'content', name: '피드백내용', type: 'text' as const, width: 300 },
      { id: 'response', name: '조치사항', type: 'text' as const, width: 300 },
      { id: 'status', name: '처리상태', type: 'select' as const, width: 100, options: ['접수', '처리중', '완료'] },
    ],
    data: []
  },
  'tennis-consult': {
    name: '테니스상담내역서',
    columns: [
      { id: 'date', name: '상담일', type: 'date' as const, width: 120 },
      { id: 'name', name: '이름', type: 'text' as const, width: 100 },
      { id: 'phone', name: '전화번호', type: 'text' as const, width: 130 },
      { id: 'experience', name: '경험수준', type: 'select' as const, width: 100, options: ['초급', '중급', '고급', '무경험'] },
      { id: 'goal', name: '목표', type: 'text' as const, width: 200 },
      { id: 'schedule', name: '희망시간', type: 'text' as const, width: 150 },
      { id: 'instructor', name: '희망강사', type: 'select' as const, width: 100, options: ['김코치', '이코치', '박코치', '상관없음'] },
      { id: 'notes', name: '특이사항', type: 'text' as const, width: 200 },
    ],
    data: []
  },
  'tennis-golf-free': {
    name: '테니스골프무료개방',
    columns: [
      { id: 'date', name: '이용일', type: 'date' as const, width: 120 },
      { id: 'time', name: '이용시간', type: 'text' as const, width: 100 },
      { id: 'name', name: '이름', type: 'text' as const, width: 100 },
      { id: 'phone', name: '전화번호', type: 'text' as const, width: 130 },
      { id: 'sport', name: '종목', type: 'select' as const, width: 100, options: ['테니스', '골프'] },
      { id: 'court', name: '코트/타석', type: 'text' as const, width: 100 },
      { id: 'companion', name: '동반자수', type: 'number' as const, width: 100 },
      { id: 'satisfaction', name: '만족도', type: 'select' as const, width: 100, options: ['매우만족', '만족', '보통', '불만족'] },
      { id: 'notes', name: '비고', type: 'text' as const, width: 200 },
    ],
    data: []
  },
  'fitness-free': {
    name: '헬스무료개방',
    columns: [
      { id: 'date', name: '이용일', type: 'date' as const, width: 120 },
      { id: 'time', name: '이용시간', type: 'text' as const, width: 100 },
      { id: 'name', name: '이름', type: 'text' as const, width: 100 },
      { id: 'phone', name: '전화번호', type: 'text' as const, width: 130 },
      { id: 'age', name: '나이', type: 'number' as const, width: 80 },
      { id: 'experience', name: '운동경험', type: 'select' as const, width: 100, options: ['초급', '중급', '고급', '무경험'] },
      { id: 'program', name: '이용프로그램', type: 'select' as const, width: 120, options: ['웨이트', '유산소', '그룹운동', '자유이용'] },
      { id: 'satisfaction', name: '만족도', type: 'select' as const, width: 100, options: ['매우만족', '만족', '보통', '불만족'] },
      { id: 'notes', name: '비고', type: 'text' as const, width: 200 },
    ],
    data: []
  },
  'visitor': {
    name: '방문객',
    columns: [
      { id: 'date', name: '방문일', type: 'date' as const, width: 120 },
      { id: 'time', name: '방문시간', type: 'text' as const, width: 100 },
      { id: 'name', name: '이름', type: 'text' as const, width: 100 },
      { id: 'phone', name: '전화번호', type: 'text' as const, width: 130 },
      { id: 'purpose', name: '방문목적', type: 'select' as const, width: 120, options: ['시설견학', '상담', '체험', '기타'] },
      { id: 'guide', name: '안내직원', type: 'text' as const, width: 100 },
      { id: 'result', name: '결과', type: 'select' as const, width: 100, options: ['가입', '재방문예정', '보류', '거절'] },
      { id: 'notes', name: '메모', type: 'text' as const, width: 200 },
    ],
    data: []
  },
  'tennis-lesson-unverified': {
    name: '테니스레슨회원(무인증정현황)',
    columns: [
      { id: 'name', name: '회원명', type: 'text' as const, width: 100 },
      { id: 'phone', name: '전화번호', type: 'text' as const, width: 130 },
      { id: 'level', name: '레벨', type: 'select' as const, width: 100, options: ['초급', '중급', '고급'] },
      { id: 'instructor', name: '담당강사', type: 'select' as const, width: 100, options: ['김코치', '이코치', '박코치'] },
      { id: 'schedule', name: '수업시간', type: 'text' as const, width: 150 },
      { id: 'startDate', name: '시작일', type: 'date' as const, width: 120 },
      { id: 'endDate', name: '종료일', type: 'date' as const, width: 120 },
      { id: 'status', name: '인증상태', type: 'select' as const, width: 100, options: ['미인증', '인증대기', '인증완료'] },
      { id: 'notes', name: '비고', type: 'text' as const, width: 200 },
    ],
    data: []
  }
};

const Clients = () => {
  const [sheets, setSheets] = useState<SheetTab[]>([
    {
      id: 'sheet-1',
      name: '고객 관리',
      type: 'customer-list',
      data: sheetTemplates['customer-list'].data,
      columns: sheetTemplates['customer-list'].columns
    },
    {
      id: 'sheet-2',
      name: '전화문의',
      type: 'phone-inquiry',
      data: sheetTemplates['phone-inquiry'].data,
      columns: sheetTemplates['phone-inquiry'].columns
    },
    {
      id: 'sheet-3',
      name: '회원권(PT포함)상담예약',
      type: 'membership-reservation',
      data: sheetTemplates['membership-reservation'].data,
      columns: sheetTemplates['membership-reservation'].columns
    },
    {
      id: 'sheet-4',
      name: '상담예약',
      type: 'consulting-reservation',
      data: sheetTemplates['consulting-reservation'].data,
      columns: sheetTemplates['consulting-reservation'].columns
    },
    {
      id: 'sheet-5',
      name: '문의',
      type: 'inquiry',
      data: sheetTemplates['inquiry'].data,
      columns: sheetTemplates['inquiry'].columns
    },
    {
      id: 'sheet-6',
      name: 'FC LOG',
      type: 'fc-log',
      data: sheetTemplates['fc-log'].data,
      columns: sheetTemplates['fc-log'].columns
    },
    {
      id: 'sheet-7',
      name: '미등록자DB',
      type: 'unregistered-db',
      data: sheetTemplates['unregistered-db'].data,
      columns: sheetTemplates['unregistered-db'].columns
    },
    {
      id: 'sheet-8',
      name: '전체DB',
      type: 'total-db',
      data: sheetTemplates['total-db'].data,
      columns: sheetTemplates['total-db'].columns
    },
    {
      id: 'sheet-9',
      name: 'OT리스트',
      type: 'ot-list',
      data: sheetTemplates['ot-list'].data,
      columns: sheetTemplates['ot-list'].columns
    },
    {
      id: 'sheet-10',
      name: '연락망/스케줄',
      type: 'contact-schedule',
      data: sheetTemplates['contact-schedule'].data,
      columns: sheetTemplates['contact-schedule'].columns
    },
    {
      id: 'sheet-11',
      name: '투어만',
      type: 'tour-only',
      data: sheetTemplates['tour-only'].data,
      columns: sheetTemplates['tour-only'].columns
    },
    {
      id: 'sheet-12',
      name: '질문',
      type: 'question',
      data: sheetTemplates['question'].data,
      columns: sheetTemplates['question'].columns
    },
    {
      id: 'sheet-13',
      name: '피드백',
      type: 'feedback',
      data: sheetTemplates['feedback'].data,
      columns: sheetTemplates['feedback'].columns
    },
    {
      id: 'sheet-14',
      name: '테니스상담내역서',
      type: 'tennis-consult',
      data: sheetTemplates['tennis-consult'].data,
      columns: sheetTemplates['tennis-consult'].columns
    },
    {
      id: 'sheet-15',
      name: '테니스골프무료개방',
      type: 'tennis-golf-free',
      data: sheetTemplates['tennis-golf-free'].data,
      columns: sheetTemplates['tennis-golf-free'].columns
    },
    {
      id: 'sheet-16',
      name: '헬스무료개방',
      type: 'fitness-free',
      data: sheetTemplates['fitness-free'].data,
      columns: sheetTemplates['fitness-free'].columns
    },
    {
      id: 'sheet-17',
      name: '방문객',
      type: 'visitor',
      data: sheetTemplates['visitor'].data,
      columns: sheetTemplates['visitor'].columns
    },
    {
      id: 'sheet-18',
      name: '테니스레슨회원(무인증정현황)',
      type: 'tennis-lesson-unverified',
      data: sheetTemplates['tennis-lesson-unverified'].data,
      columns: sheetTemplates['tennis-lesson-unverified'].columns
    }
  ]);
  
  const [activeSheetId, setActiveSheetId] = useState('sheet-1');
  const [searchQuery, setSearchQuery] = useState('');
  const [editingCell, setEditingCell] = useState<{rowId: string, field: string} | null>(null);
  const [editValue, setEditValue] = useState('');
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [showAddSheetMenu, setShowAddSheetMenu] = useState(false);
  const [showDownloadMenu, setShowDownloadMenu] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const downloadMenuRef = useRef<HTMLDivElement>(null);

  const activeSheet = sheets.find(sheet => sheet.id === activeSheetId);
  
  // 검색 필터링
  const filteredData = activeSheet?.data.filter(row =>
    Object.values(row).some(value => 
      String(value).toLowerCase().includes(searchQuery.toLowerCase())
    )
  ) || [];

  // 외부 클릭으로 메뉴 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (downloadMenuRef.current && !downloadMenuRef.current.contains(event.target as Node)) {
        setShowDownloadMenu(false);
      }
    };

    if (showDownloadMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showDownloadMenu]);

  // 새 시트 추가
  const addNewSheet = (templateType: keyof typeof sheetTemplates) => {
    const template = sheetTemplates[templateType];
    const newSheet: SheetTab = {
      id: `sheet-${Date.now()}`,
      name: template.name,
      type: templateType,
      data: [...template.data],
      columns: [...template.columns]
    };
    setSheets(prev => [...prev, newSheet]);
    setActiveSheetId(newSheet.id);
    setShowAddSheetMenu(false);
  };

  // 시트 삭제
  const deleteSheet = (sheetId: string) => {
    if (sheets.length <= 1) return; // 최소 1개 시트는 유지
    
    setSheets(prev => prev.filter(sheet => sheet.id !== sheetId));
    
    if (activeSheetId === sheetId) {
      const remainingSheets = sheets.filter(sheet => sheet.id !== sheetId);
      setActiveSheetId(remainingSheets[0]?.id || '');
    }
  };

  // 시트 이름 변경
  const renameSheet = (sheetId: string, newName: string) => {
    setSheets(prev => prev.map(sheet => 
      sheet.id === sheetId ? { ...sheet, name: newName } : sheet
    ));
  };

  // 셀 편집 시작
  const startEditing = (rowId: string, field: string, currentValue: string) => {
    setEditingCell({ rowId, field });
    setEditValue(currentValue);
  };

  // 셀 편집 완료
  const finishEditing = () => {
    if (editingCell && activeSheet) {
      setSheets(prev => prev.map(sheet => 
        sheet.id === activeSheetId 
          ? {
              ...sheet,
              data: sheet.data.map(row => 
                row.id === editingCell.rowId 
                  ? { ...row, [editingCell.field]: editValue }
                  : row
              )
            }
          : sheet
      ));
    }
    setEditingCell(null);
    setEditValue('');
  };

  // 편집 취소
  const cancelEditing = () => {
    setEditingCell(null);
    setEditValue('');
  };

  // 키보드 이벤트 처리
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      finishEditing();
    } else if (e.key === 'Escape') {
      cancelEditing();
    }
  };

  // 새 행 추가
  const addNewRow = () => {
    if (!activeSheet) return;
    
    const newRow: any = {
      id: Date.now().toString(),
    };
    
    // 컬럼에 따른 기본값 설정
    activeSheet.columns.forEach(column => {
      switch (column.type) {
        case 'date':
          newRow[column.id] = column.id.includes('start') ? format(new Date(), 'yyyy-MM-dd') : '';
          break;
        case 'select':
          newRow[column.id] = column.options?.[0] || '';
          break;
        default:
          newRow[column.id] = '';
      }
    });

    setSheets(prev => prev.map(sheet => 
      sheet.id === activeSheetId 
        ? { ...sheet, data: [...sheet.data, newRow] }
        : sheet
    ));
  };

  // 선택된 행 삭제
  const deleteSelectedRows = () => {
    if (!activeSheet) return;
    
    setSheets(prev => prev.map(sheet => 
      sheet.id === activeSheetId 
        ? { ...sheet, data: sheet.data.filter(row => !selectedRows.has(row.id)) }
        : sheet
    ));
    setSelectedRows(new Set());
  };

  // 행 선택 토글
  const toggleRowSelection = (id: string) => {
    setSelectedRows(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  // 전체 선택/해제
  const toggleAllSelection = () => {
    if (selectedRows.size === filteredData.length) {
      setSelectedRows(new Set());
    } else {
      setSelectedRows(new Set(filteredData.map(row => row.id)));
    }
  };

  // CSV 다운로드
  const downloadCSV = () => {
    if (!activeSheet) return;
    
    const headers = activeSheet.columns.map(col => col.name);
    const csvData = [
      headers,
      ...filteredData.map(row => 
        activeSheet.columns.map(col => row[col.id] || '')
      )
    ];
    
    const csvContent = csvData.map(row => 
      row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')
    ).join('\n');
    
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${activeSheet.name}_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.click();
    setShowDownloadMenu(false);
  };

  // Excel 다운로드
  const downloadExcel = async () => {
    if (!activeSheet) return;
    
    try {
      // 동적 import로 XLSX 로드
      const XLSX = await import('xlsx');
      
      const headers = activeSheet.columns.map(col => col.name);
      const excelData = [
        headers,
        ...filteredData.map(row => 
          activeSheet.columns.map(col => row[col.id] || '')
        )
      ];
      
      const ws = XLSX.utils.aoa_to_sheet(excelData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, activeSheet.name);
      
      // 컬럼 너비 설정
      const colWidths = activeSheet.columns.map(col => ({ wch: col.width ? col.width / 8 : 15 }));
      ws['!cols'] = colWidths;
      
      XLSX.writeFile(wb, `${activeSheet.name}_${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
      setShowDownloadMenu(false);
    } catch (error) {
      console.error('Excel 다운로드 오류:', error);
    }
  };

  // PDF 다운로드
  const downloadPDF = async () => {
    if (!activeSheet) return;
    
    try {
      // 동적 import로 jsPDF 로드
      const { default: jsPDF } = await import('jspdf');
      
      const doc = new jsPDF();
      
      // 한글 폰트 설정 (기본 폰트 사용)
      doc.setFont('helvetica');
      
      // 제목 추가
      doc.setFontSize(16);
      doc.text(activeSheet.name, 14, 20);
      doc.setFontSize(10);
      doc.text(`생성일: ${format(new Date(), 'yyyy-MM-dd HH:mm')}`, 14, 30);
      doc.text(`총 ${filteredData.length}개 항목`, 14, 36);
      
      // 테이블 데이터 준비
      const headers = activeSheet.columns.map(col => col.name);
      const tableData = filteredData.map(row => 
        activeSheet.columns.map(col => row[col.id] || '')
      );
      
      // 테이블 생성
      (doc as any).autoTable({
        head: [headers],
        body: tableData,
        startY: 45,
        styles: {
          fontSize: 8,
          cellPadding: 2,
        },
        headStyles: {
          fillColor: [59, 130, 246], // blue-500
          textColor: 255,
          fontStyle: 'bold',
        },
        alternateRowStyles: {
          fillColor: [248, 250, 252], // slate-50
        },
        columnStyles: activeSheet.columns.reduce((acc, col, index) => {
          acc[index] = { cellWidth: col.width ? col.width / 4 : 'auto' };
          return acc;
        }, {} as any),
      });
      
      doc.save(`${activeSheet.name}_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
      setShowDownloadMenu(false);
    } catch (error) {
      console.error('PDF 다운로드 오류:', error);
    }
  };

  // 편집 가능한 셀 컴포넌트
  const EditableCell = ({ 
    value, 
    rowId, 
    field, 
    column
  }: { 
    value: string, 
    rowId: string, 
    field: string, 
    column: SheetColumn
  }) => {
    const isEditing = editingCell?.rowId === rowId && editingCell?.field === field;

    if (isEditing) {
      if (column.type === 'select') {
        return (
          <select
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={finishEditing}
            onKeyDown={handleKeyDown}
            className="w-full px-3 py-2 text-sm border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white shadow-sm"
            autoFocus
          >
            {column.options?.map(option => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        );
      }

      return (
        <input
          ref={inputRef}
          type={column.type === 'date' ? 'date' : column.type === 'number' ? 'number' : 'text'}
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={finishEditing}
          onKeyDown={handleKeyDown}
          className="w-full px-3 py-2 text-sm border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white shadow-sm"
          autoFocus
        />
      );
    }

    return (
      <div
        onClick={() => startEditing(rowId, field, value)}
        className="w-full px-3 py-2 text-sm cursor-pointer hover:bg-blue-50 rounded-lg min-h-[36px] flex items-center transition-colors group"
        style={{ minWidth: column.width ? `${column.width}px` : 'auto' }}
      >
        {value ? (
          <span className="truncate">{value}</span>
        ) : (
          <span className="text-slate-400 group-hover:text-slate-500 italic">클릭하여 입력</span>
        )}
      </div>
    );
  };

  if (!activeSheet) {
    return <div className="p-6">시트를 찾을 수 없습니다.</div>;
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="h-full flex flex-col bg-white"
    >
            {/* 시트 탭 영역 */}
      <div className="border-b border-slate-200 bg-white shadow-sm">
        {/* 탭 영역 */}
        <div className="flex items-center justify-between px-4 py-2 border-b border-slate-100">
          <div className="flex items-center min-w-0 flex-1">
            <div className="flex items-center space-x-1 overflow-x-auto scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-slate-100 pb-1">
              {sheets.map((sheet) => (
                <div key={sheet.id} className="flex items-center group flex-shrink-0">
                  <button
                    onClick={() => setActiveSheetId(sheet.id)}
                    className={clsx(
                      'px-3 py-2 text-sm font-medium whitespace-nowrap rounded-t-lg transition-all duration-200 border-b-2',
                      activeSheetId === sheet.id
                        ? 'bg-blue-50 text-blue-700 border-blue-500'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 border-transparent hover:border-slate-300'
                    )}
                  >
                    {sheet.name}
                  </button>
                  {sheets.length > 1 && (
                    <button
                      onClick={() => deleteSheet(sheet.id)}
                      className="ml-1 p-1 text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all duration-200 rounded"
                    >
                      <X size={12} />
                    </button>
                  )}
                </div>
              ))}
              
              {/* 시트 추가 버튼 */}
              <div className="relative flex-shrink-0">
                <button
                  onClick={() => setShowAddSheetMenu(!showAddSheetMenu)}
                  className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  title="새 시트 추가"
                >
                  <Plus size={16} />
                </button>
                
                {showAddSheetMenu && (
                  <div className="absolute top-full left-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-xl z-20 min-w-[280px] max-h-96 overflow-y-auto">
                    <div className="py-2">
                      <div className="px-3 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-100">
                        새 시트 추가
                      </div>
                      {Object.entries(sheetTemplates).map(([key, template]) => (
                        <button
                          key={key}
                          onClick={() => addNewSheet(key as keyof typeof sheetTemplates)}
                          className="w-full px-4 py-2 text-left text-sm hover:bg-blue-50 hover:text-blue-700 transition-colors"
                        >
                          {template.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        
        {/* 도구 모음 */}
        <div className="flex items-center justify-between px-4 py-3 bg-slate-50">
          <div className="flex items-center space-x-3">
            <h2 className="text-lg font-semibold text-slate-800">
              {activeSheet?.name}
            </h2>
            <span className="text-sm text-slate-500">
              총 {filteredData.length}개 항목
              {selectedRows.size > 0 && ` • ${selectedRows.size}개 선택됨`}
            </span>
          </div>
          
          <div className="flex items-center space-x-3">
            {/* 검색 */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search size={16} className="text-slate-400" />
              </div>
              <input
                type="text"
                placeholder="검색..."
                className="pl-9 pr-4 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-64"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            {/* 액션 버튼들 */}
            {selectedRows.size > 0 && (
              <button 
                onClick={deleteSelectedRows}
                className="inline-flex items-center px-3 py-2 text-sm font-medium text-red-700 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors"
              >
                <Trash2 size={14} className="mr-2" />
                삭제 ({selectedRows.size})
              </button>
            )}
            
            {/* 다운로드 버튼 */}
            <div className="relative" ref={downloadMenuRef}>
              <button 
                onClick={() => setShowDownloadMenu(!showDownloadMenu)}
                className="inline-flex items-center px-3 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 focus:ring-2 focus:ring-blue-500 transition-colors"
              >
                <Download size={14} className="mr-2" />
                다운로드
              </button>
              
              {showDownloadMenu && (
                <div className="absolute top-full right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-xl z-20 min-w-[180px]">
                  <div className="py-2">
                    <div className="px-3 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-100">
                      파일 형식 선택
                    </div>
                    <button
                      onClick={downloadExcel}
                      className="w-full px-4 py-2 text-left text-sm hover:bg-green-50 hover:text-green-700 transition-colors flex items-center"
                    >
                      <FileSpreadsheet size={16} className="mr-3 text-green-600" />
                      Excel (.xlsx)
                    </button>
                    <button
                      onClick={downloadCSV}
                      className="w-full px-4 py-2 text-left text-sm hover:bg-blue-50 hover:text-blue-700 transition-colors flex items-center"
                    >
                      <FileText size={16} className="mr-3 text-blue-600" />
                      CSV (.csv)
                    </button>
                    <button
                      onClick={downloadPDF}
                      className="w-full px-4 py-2 text-left text-sm hover:bg-red-50 hover:text-red-700 transition-colors flex items-center"
                    >
                      <File size={16} className="mr-3 text-red-600" />
                      PDF (.pdf)
                    </button>
                  </div>
                </div>
              )}
            </div>
            
            <button 
              onClick={addNewRow}
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 transition-colors"
            >
              <Plus size={14} className="mr-2" />
              행 추가
            </button>
          </div>
        </div>
      </div>

            {/* 테이블 영역 */}
      <div className="flex-1 overflow-hidden bg-white">
        <div className="h-full overflow-auto">
          <table className="w-full border-collapse">
            <thead className="bg-slate-100 sticky top-0 z-10">
              <tr>
                <th className="w-12 px-4 py-3 border-b border-slate-200">
                  <input
                    type="checkbox"
                    checked={selectedRows.size === filteredData.length && filteredData.length > 0}
                    onChange={toggleAllSelection}
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                </th>
                {activeSheet.columns.map((column) => (
                  <th 
                    key={column.id}
                    className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider border-b border-slate-200 bg-slate-100"
                    style={{ minWidth: column.width ? `${column.width}px` : 'auto' }}
                  >
                    {column.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white">
              {filteredData.length === 0 ? (
                <tr>
                  <td 
                    colSpan={activeSheet.columns.length + 1} 
                    className="px-4 py-12 text-center text-slate-500"
                  >
                    <div className="flex flex-col items-center space-y-2">
                      <div className="text-4xl">📝</div>
                      <div className="text-lg font-medium">데이터가 없습니다</div>
                      <div className="text-sm">우측 상단의 "행 추가" 버튼을 클릭하여 새 데이터를 추가하세요</div>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredData.map((row, index) => (
                  <tr 
                    key={row.id}
                    className={clsx(
                      "border-b border-slate-100 transition-colors",
                      "hover:bg-blue-50/50",
                      selectedRows.has(row.id) && "bg-blue-50",
                      index % 2 === 0 ? "bg-white" : "bg-slate-50/30"
                    )}
                  >
                    <td className="px-4 py-2">
                      <input
                        type="checkbox"
                        checked={selectedRows.has(row.id)}
                        onChange={() => toggleRowSelection(row.id)}
                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      />
                    </td>
                    {activeSheet.columns.map((column) => (
                      <td key={column.id} className="px-4 py-2">
                        <EditableCell 
                          value={row[column.id] || ''} 
                          rowId={row.id} 
                          field={column.id}
                          column={column}
                        />
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* 하단 상태바 */}
      <div className="border-t border-slate-200 px-4 py-3 bg-slate-50">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-4 text-sm text-slate-600">
            <span className="font-medium">{activeSheet.name}</span>
            <span className="text-slate-400">•</span>
            <span>총 {filteredData.length}개 항목</span>
            {selectedRows.size > 0 && (
              <>
                <span className="text-slate-400">•</span>
                <span className="text-blue-600 font-medium">{selectedRows.size}개 선택됨</span>
              </>
            )}
          </div>
          <div className="flex items-center space-x-6 text-xs text-slate-500">
            <div className="flex items-center space-x-1">
              <span>💡</span>
              <span>셀을 클릭하여 편집</span>
            </div>
            <div className="flex items-center space-x-3">
              <span><kbd className="px-1 py-0.5 bg-slate-200 rounded text-xs">Enter</kbd> 저장</span>
              <span><kbd className="px-1 py-0.5 bg-slate-200 rounded text-xs">Esc</kbd> 취소</span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default Clients;