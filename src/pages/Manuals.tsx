import { useState, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { useReactToPrint } from 'react-to-print';
import { 
  BookOpen, 
  Plus, 
  Search, 
  Calendar, 
  User, 
  ChevronRight,
  Edit3,
  Trash2,
  Download,
  Eye,
  X,
  Save,
  FileText,
  Hash,
  Type,
  List,
  CheckSquare,
  Quote,
  Image as ImageIcon,
  Bold,
  Italic,
  Underline,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Printer,
  AlertTriangle,
  Link,
  ListOrdered,
  Code
} from 'lucide-react';
import clsx from 'clsx';
import { useAuth } from '../contexts/AuthContext';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface Manual {
  id: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  authorId: string;
  authorName: string;
  createdAt: string;
  updatedAt: string;
  viewCount: number;
  isPublished: boolean;
}

interface ManualEditorProps {
  manual?: Manual;
  onSave: (manual: Omit<Manual, 'id' | 'createdAt' | 'updatedAt' | 'viewCount'>) => void;
  onClose: () => void;
}

const ManualEditor = ({ manual, onSave, onClose }: ManualEditorProps) => {
  const { user } = useAuth();
  const [title, setTitle] = useState(manual?.title || '');
  const [content, setContent] = useState(manual?.content || '');
  const [category, setCategory] = useState(manual?.category || '일반');
  const [tags, setTags] = useState<string[]>(manual?.tags || []);
  const [tagInput, setTagInput] = useState('');
  const [isPublished, setIsPublished] = useState(manual?.isPublished ?? true);
  const [showPreview, setShowPreview] = useState(false);
  const contentRef = useRef<HTMLTextAreaElement>(null);

  const categories = ['일반', '운영 가이드', '시설 관리', '고객 서비스', '안전 수칙', '기타'];



  const handleSave = () => {
    if (!title.trim() || !content.trim()) {
      alert('제목과 내용을 입력해주세요.');
      return;
    }

    onSave({
      title: title.trim(),
      content: content.trim(),
      category,
      tags,
      authorId: user?.id || '',
      authorName: user?.name || '',
      isPublished
    });
  };

  const addTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const insertText = (before: string, after: string = '') => {
    const textarea = contentRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = content.substring(start, end);
    const newText = content.substring(0, start) + before + selectedText + after + content.substring(end);
    
    setContent(newText);
    
    // 커서 위치 설정
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + before.length, start + before.length + selectedText.length);
    }, 0);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-white rounded-xl shadow-2xl w-full max-w-7xl max-h-[95vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-slate-200">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-slate-900 flex items-center">
              <BookOpen className="mr-3 text-blue-600" size={28} />
              {manual ? '메뉴얼 수정' : '새 메뉴얼 작성'}
            </h2>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* 기본 정보 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">제목</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="메뉴얼 제목을 입력하세요"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">카테고리</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
          </div>

          {/* 태그 */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">태그</label>
            <div className="flex flex-wrap gap-2 mb-2">
              {tags.map((tag, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800"
                >
                  {tag}
                  <button
                    onClick={() => removeTag(tag)}
                    className="ml-2 text-blue-600 hover:text-blue-800"
                  >
                    <X size={14} />
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addTag()}
                className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="태그를 입력하고 Enter를 누르세요"
              />
              <button
                onClick={addTag}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                추가
              </button>
            </div>
          </div>

          {/* 에디터 및 미리보기 */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-slate-700">내용</label>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowPreview(false)}
                  className={clsx(
                    'px-3 py-1 text-sm rounded-lg transition-colors',
                    !showPreview ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                  )}
                >
                  에디터
                </button>
                <button
                  onClick={() => setShowPreview(true)}
                  className={clsx(
                    'px-3 py-1 text-sm rounded-lg transition-colors',
                    showPreview ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                  )}
                >
                  미리보기
                </button>
              </div>
            </div>
            
            <div className="border border-slate-300 rounded-lg overflow-hidden">
              {/* 툴바 */}
              <div className="bg-slate-50 border-b border-slate-300 p-3 flex flex-wrap gap-2">
                <button
                  onClick={() => insertText('# ', '')}
                  className="p-2 text-slate-600 hover:bg-slate-200 rounded transition-colors"
                  title="제목 1"
                >
                  <Hash size={16} />
                </button>
                <button
                  onClick={() => insertText('## ', '')}
                  className="p-2 text-slate-600 hover:bg-slate-200 rounded transition-colors"
                  title="제목 2"
                >
                  <Type size={16} />
                </button>
                <button
                  onClick={() => insertText('**', '**')}
                  className="p-2 text-slate-600 hover:bg-slate-200 rounded transition-colors"
                  title="굵게"
                >
                  <Bold size={16} />
                </button>
                <button
                  onClick={() => insertText('*', '*')}
                  className="p-2 text-slate-600 hover:bg-slate-200 rounded transition-colors"
                  title="기울임"
                >
                  <Italic size={16} />
                </button>
                <button
                  onClick={() => insertText('- ', '')}
                  className="p-2 text-slate-600 hover:bg-slate-200 rounded transition-colors"
                  title="목록"
                >
                  <List size={16} />
                </button>
                <button
                  onClick={() => insertText('- [ ] ', '')}
                  className="p-2 text-slate-600 hover:bg-slate-200 rounded transition-colors"
                  title="체크리스트"
                >
                  <CheckSquare size={16} />
                </button>
                <button
                  onClick={() => insertText('> ', '')}
                  className="p-2 text-slate-600 hover:bg-slate-200 rounded transition-colors"
                  title="인용"
                >
                  <Quote size={16} />
                </button>
                <button
                  onClick={() => insertText('```\n', '\n```')}
                  className="p-2 text-slate-600 hover:bg-slate-200 rounded transition-colors"
                  title="코드 블록"
                >
                  <Code size={16} />
                </button>
              </div>

              {/* 에디터/미리보기 영역 */}
              <div className="flex">
                {/* 에디터 */}
                <div className={clsx('w-full', showPreview && 'w-1/2 border-r border-slate-300')}>
                  <textarea
                    ref={contentRef}
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    className="w-full h-80 p-4 border-none resize-none focus:outline-none"
                    placeholder="메뉴얼 내용을 작성하세요...

마크다운 문법을 사용할 수 있습니다:
# 제목 1
## 제목 2
**굵은 글씨**
*기울임 글씨*
- 목록
- [ ] 체크리스트
> 인용구
```코드```"
                    style={{ display: showPreview ? 'block' : 'block' }}
                  />
                </div>

                {/* 미리보기 */}
                {showPreview && (
                  <div className="w-1/2 h-80 p-4 overflow-y-auto bg-white">
                    <div className="prose prose-slate max-w-none">
                      {content ? (
                        <div className="text-slate-700 leading-relaxed">
                          <ReactMarkdown 
                            remarkPlugins={[remarkGfm]}
                            components={{
                              h1: ({ children }: any) => <h1 className="text-xl font-bold mb-3 text-slate-900">{children}</h1>,
                              h2: ({ children }: any) => <h2 className="text-lg font-semibold mb-2 text-slate-800">{children}</h2>,
                              h3: ({ children }: any) => <h3 className="text-base font-medium mb-2 text-slate-700">{children}</h3>,
                              p: ({ children }: any) => <p className="mb-3 text-slate-600 text-sm">{children}</p>,
                              ul: ({ children }: any) => <ul className="mb-3 pl-4 space-y-1">{children}</ul>,
                              ol: ({ children }: any) => <ol className="mb-3 pl-4 space-y-1 list-decimal">{children}</ol>,
                              li: ({ children }: any) => <li className="text-slate-600 text-sm">{children}</li>,
                              blockquote: ({ children }: any) => (
                                <blockquote className="border-l-3 border-blue-300 pl-3 py-1 my-2 bg-blue-50 italic text-slate-600 text-sm">
                                  {children}
                                </blockquote>
                              ),
                              code: ({ children, className }: any) => {
                                const isInline = !className;
                                return isInline ? (
                                  <code className="bg-slate-100 px-1 py-0.5 rounded text-xs font-mono text-slate-800">
                                    {children}
                                  </code>
                                ) : (
                                  <code className={className}>{children}</code>
                                );
                              },
                              pre: ({ children }: any) => (
                                <pre className="bg-slate-100 border border-slate-200 p-2 rounded my-2 overflow-x-auto text-xs">
                                  {children}
                                </pre>
                              ),
                              strong: ({ children }: any) => <strong className="font-semibold text-slate-800">{children}</strong>,
                              em: ({ children }: any) => <em className="italic">{children}</em>,
                              input: ({ checked, type }: any) => {
                                if (type === 'checkbox') {
                                  return (
                                    <input 
                                      type="checkbox" 
                                      checked={checked} 
                                      disabled 
                                      className="mr-1 rounded border-slate-300" 
                                    />
                                  );
                                }
                                return <input type={type} />;
                              }
                            }}
                          >
                            {content}
                          </ReactMarkdown>
                        </div>
                      ) : (
                        <p className="text-slate-400 italic">미리보기가 여기에 표시됩니다...</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 발행 설정 */}
          <div className="flex items-center">
            <input
              type="checkbox"
              id="isPublished"
              checked={isPublished}
              onChange={(e) => setIsPublished(e.target.checked)}
              className="mr-2"
            />
            <label htmlFor="isPublished" className="text-sm text-slate-700">
              즉시 발행 (체크 해제 시 임시저장)
            </label>
          </div>
        </div>

        <div className="p-6 border-t border-slate-200 flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-6 py-2.5 border border-slate-300 text-slate-700 font-medium rounded-lg hover:bg-slate-100 transition-colors"
          >
            취소
          </button>
          <button
            onClick={handleSave}
            className="px-6 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors flex items-center"
          >
            <Save className="mr-2" size={16} />
            {isPublished ? '발행' : '임시저장'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

interface ManualViewerProps {
  manual: Manual;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

const ManualViewer = ({ manual, onClose, onEdit, onDelete }: ManualViewerProps) => {
  const { user } = useAuth();
  const printRef = useRef<HTMLDivElement>(null);
  const handlePrint = useReactToPrint({ contentRef: printRef });

  const canEdit = user?.role === 'admin' || user?.id === manual.authorId;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[95vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-slate-200">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center mb-2">
                <BookOpen className="h-6 w-6 text-blue-600 mr-2" />
                <span className="text-sm font-medium text-slate-600">{manual.category}</span>
              </div>
              <h1 className="text-2xl font-bold text-slate-900 mb-3">{manual.title}</h1>
              <div className="flex flex-wrap gap-2 mb-4">
                {manual.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                  >
                    {tag}
                  </span>
                ))}
              </div>
              <div className="flex items-center text-sm text-slate-500 space-x-4">
                <div className="flex items-center">
                  <User className="h-4 w-4 mr-1" />
                  <span>{manual.authorName}</span>
                </div>
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 mr-1" />
                  <span>{format(new Date(manual.createdAt), 'yyyy.MM.dd', { locale: ko })}</span>
                </div>
                <div className="flex items-center">
                  <Eye className="h-4 w-4 mr-1" />
                  <span>{manual.viewCount} 회 조회</span>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2 ml-4">
              <button
                onClick={handlePrint}
                className="p-2 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                title="PDF 저장"
              >
                <Download size={20} />
              </button>
              {canEdit && (
                <>
                  <button
                    onClick={onEdit}
                    className="p-2 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="수정"
                  >
                    <Edit3 size={20} />
                  </button>
                  <button
                    onClick={onDelete}
                    className="p-2 text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="삭제"
                  >
                    <Trash2 size={20} />
                  </button>
                </>
              )}
              <button
                onClick={onClose}
                className="p-2 text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>
          </div>
        </div>

        <div ref={printRef} className="p-6">
          <div className="prose prose-slate max-w-none">
            <div className="text-slate-700 leading-relaxed">
              <ReactMarkdown 
                remarkPlugins={[remarkGfm]}
              components={{
                h1: ({ children }: any) => <h1 className="text-2xl font-bold mb-4 text-slate-900 border-b border-slate-200 pb-2">{children}</h1>,
                h2: ({ children }: any) => <h2 className="text-xl font-semibold mb-3 text-slate-800 mt-6">{children}</h2>,
                h3: ({ children }: any) => <h3 className="text-lg font-medium mb-2 text-slate-700 mt-4">{children}</h3>,
                h4: ({ children }: any) => <h4 className="text-base font-medium mb-2 text-slate-700 mt-3">{children}</h4>,
                p: ({ children }: any) => <p className="mb-4 text-slate-600 leading-relaxed">{children}</p>,
                ul: ({ children }: any) => <ul className="mb-4 pl-6 space-y-1">{children}</ul>,
                ol: ({ children }: any) => <ol className="mb-4 pl-6 space-y-1 list-decimal">{children}</ol>,
                li: ({ children }: any) => <li className="text-slate-600">{children}</li>,
                blockquote: ({ children }: any) => (
                  <blockquote className="border-l-4 border-blue-300 pl-4 py-2 my-4 bg-blue-50 italic text-slate-600">
                    {children}
                  </blockquote>
                ),
                code: ({ children, className }: any) => {
                  const isInline = !className;
                  return isInline ? (
                    <code className="bg-slate-100 px-1.5 py-0.5 rounded text-sm font-mono text-slate-800">
                      {children}
                    </code>
                  ) : (
                    <code className={className}>{children}</code>
                  );
                },
                pre: ({ children }: any) => (
                  <pre className="bg-slate-100 border border-slate-200 p-4 rounded-lg my-4 overflow-x-auto text-sm">
                    {children}
                  </pre>
                ),
                strong: ({ children }: any) => <strong className="font-semibold text-slate-800">{children}</strong>,
                em: ({ children }: any) => <em className="italic">{children}</em>,
                table: ({ children }: any) => (
                  <div className="overflow-x-auto my-4">
                    <table className="min-w-full border border-slate-200 rounded-lg">
                      {children}
                    </table>
                  </div>
                ),
                thead: ({ children }: any) => <thead className="bg-slate-50">{children}</thead>,
                tbody: ({ children }: any) => <tbody className="divide-y divide-slate-200">{children}</tbody>,
                tr: ({ children }: any) => <tr>{children}</tr>,
                th: ({ children }: any) => (
                  <th className="px-4 py-2 text-left font-medium text-slate-700 border-b border-slate-200">
                    {children}
                  </th>
                ),
                td: ({ children }: any) => (
                  <td className="px-4 py-2 text-slate-600 border-b border-slate-200">
                    {children}
                  </td>
                ),
                input: ({ checked, type }: any) => {
                  if (type === 'checkbox') {
                    return (
                      <input 
                        type="checkbox" 
                        checked={checked} 
                        disabled 
                        className="mr-2 rounded border-slate-300" 
                      />
                    );
                  }
                  return <input type={type} />;
                }
              }}
                          >
                {manual.content}
              </ReactMarkdown>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

// 삭제 확인 모달 컴포넌트
interface DeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
}

const DeleteConfirmModal = ({ isOpen, onClose, onConfirm, title, message }: DeleteConfirmModalProps) => {
  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-white rounded-xl shadow-2xl max-w-md w-full border border-slate-200"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-6">
          <div className="flex items-center mb-4">
            <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center mr-4">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
              <p className="text-sm text-slate-600 mt-1">{message}</p>
            </div>
          </div>
          
          <div className="flex justify-end space-x-3 mt-6">
            <button
              onClick={onClose}
              className="px-4 py-2 text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors font-medium"
            >
              취소
            </button>
            <button
              onClick={() => {
                onConfirm();
                onClose();
              }}
              className="px-4 py-2 text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors font-medium"
            >
              삭제
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default function Manuals() {
  const { user } = useAuth();
  const [manuals, setManuals] = useState<Manual[]>([
    {
      id: '1',
      title: '회원 계약서 작성 가이드',
      content: `# 회원 계약서 작성 가이드

## 1. 계약서 작성 준비사항

### 필수 확인 서류
- [ ] 신분증 (주민등록증, 운전면허증, 여권)
- [ ] 건강진단서 (3개월 이내 발급)
- [ ] 미성년자의 경우 법정대리인 동의서

### 계약서 작성 순서

#### 1단계: 개인정보 확인
- **성명**: 신분증과 정확히 일치하는지 확인
- **생년월일**: 신분증 확인 후 기재
- **연락처**: 휴대폰번호, 집 전화번호 모두 기재
- **주소**: 현재 거주지 주소 정확히 기재
- **비상연락처**: 가족 또는 지인 연락처 필수

#### 2단계: 이용 프로그램 선택
- **헬스회원**: 일반 헬스장 이용
- **수영회원**: 수영장 이용 포함
- **종합회원**: 모든 시설 이용 가능
- **PT회원**: 개인 트레이닝 포함

#### 3단계: 계약 기간 및 요금
- **계약기간**: 1개월, 3개월, 6개월, 12개월
- **등록비**: 신규 회원 50,000원
- **월 회비**: 프로그램별 차등 적용
- **할인 적용**: 학생할인, 직장인할인

## 2. 주의사항

> **중요**: 계약서 작성 전 반드시 회원에게 이용약관을 읽어주고 동의를 받으세요.

### 필수 설명 항목
- 이용시간 및 휴관일
- 환불 정책
- 시설 이용 규칙
- 개인정보 처리방침

### 결제 방법
- **현금**: 영수증 발행 필수
- **카드**: 즉시 승인 확인
- **계좌이체**: 자동이체 신청서 작성
- **할부**: 카드사별 무이자 혜택 안내

## 3. 계약 완료 후 처리

1. **회원카드 발급**: 즉시 발급 또는 익일 수령
2. **웰컴키트 제공**: 수건, 물병, 센터 안내서
3. **시설 안내**: 직원이 직접 시설 투어 진행
4. **오리엔테이션 예약**: 첫 운동 상담 일정 잡기

## 4. 트러블슈팅

### 자주 묻는 질문
**Q: 계약서 작성 후 변경이 가능한가요?**
A: 계약기간, 프로그램 변경은 가능하나 차액 발생 시 정산 필요

**Q: 환불은 언제까지 가능한가요?**
A: 계약일로부터 7일 이내 무조건 환불, 이후는 이용약관에 따라 처리

**Q: 가족 할인은 어떻게 적용되나요?**
A: 동일 세대 2인 이상 등록 시 각각 10% 할인 적용`,
      category: '운영 가이드',
      tags: ['계약서', '회원등록', '신규회원', '절차'],
      authorId: 'admin',
      authorName: '관리자',
      createdAt: '2024-01-15T09:00:00Z',
      updatedAt: '2024-01-15T09:00:00Z',
      viewCount: 156,
      isPublished: true
    },
    {
      id: '2',
      title: '오픈 업무 체크리스트',
      content: `# 오픈 업무 체크리스트

## 매일 오픈 시 필수 업무 (6:00 AM)

### 1. 시설 점검 (6:00-6:20)

#### 전체 시설 안전점검
- [ ] **조명 점검**: 모든 구역 조명 정상 작동 확인
- [ ] **온도 조절**: 헬스장 22-24°C, 수영장 26-28°C 설정
- [ ] **환기 시스템**: 공기순환 시스템 정상 작동 확인
- [ ] **음향 시설**: 배경음악 및 안내방송 시스템 점검

#### 운동기구 안전점검
- [ ] **유산소 기구**: 러닝머신, 자전거 등 전원 및 안전벨트 확인
- [ ] **웨이트 기구**: 케이블, 핀, 안전장치 점검
- [ ] **자유중량**: 덤벨, 바벨 정리 및 손상 여부 확인
- [ ] **매트 및 소도구**: 청결 상태 및 배치 확인

### 2. 수영장 점검 (6:20-6:30)

#### 수질 관리
- [ ] **수온 측정**: 26-28°C 적정온도 유지
- [ ] **pH 측정**: 7.2-7.6 범위 내 유지
- [ ] **염소 농도**: 0.4-1.0ppm 범위 확인
- [ ] **물 순환**: 여과 시스템 정상 작동 확인

#### 안전 시설
- [ ] **구조 장비**: 구명조끼, 구조봉 위치 확인
- [ ] **CCTV**: 수영장 감시 카메라 정상 작동
- [ ] **비상벨**: 긴급상황 알림 시스템 점검

### 3. 프론트 데스크 준비 (6:30-6:40)

#### 시스템 점검
- [ ] **회원 관리 시스템**: 프로그램 실행 및 로그인
- [ ] **결제 시스템**: POS기 정상 작동 확인
- [ ] **출입 통제**: 카드리더기 및 게이트 점검
- [ ] **프린터**: 용지 및 토너 확인

#### 업무 준비
- [ ] **당일 예약 확인**: PT, 그룹수업 스케줄 점검
- [ ] **신규 회원 준비**: 계약서, 회원카드 등 준비
- [ ] **현금 준비**: 거스름돈 및 금고 확인
- [ ] **공지사항**: 게시판 업데이트 내용 확인

### 4. 탈의실 및 샤워실 점검 (6:40-6:50)

#### 청결 상태 확인
- [ ] **청소 상태**: 어제 마감 청소 완료 여부 확인
- [ ] **비품 보충**: 샴푸, 린스, 바디워시 등 보충
- [ ] **락커 점검**: 고장난 사물함 확인 및 조치
- [ ] **온수 공급**: 샤워실 온수 정상 공급 확인

### 5. 최종 오픈 준비 (6:50-7:00)

#### 오픈 직전 체크
- [ ] **직원 복장**: 유니폼 착용 및 명찰 확인
- [ ] **긴급연락망**: 응급상황 대응 연락처 확인
- [ ] **오늘의 일정**: 특별 프로그램, 점검 일정 재확인
- [ ] **회원 맞이 준비**: 인사말 준비 및 미소 연습

## 6. 특별 점검 사항

### 월요일 추가 점검
- [ ] **주간 계획**: 이번 주 특별 이벤트 및 프로그램 확인
- [ ] **재고 확인**: 용품 및 비품 재고 상태 점검

### 월초 추가 점검
- [ ] **회원권 만료**: 이번 달 만료 회원 리스트 확인
- [ ] **장비 정기점검**: 월 1회 전문업체 점검 일정 확인

## 7. 문제 발생 시 대응

### 긴급상황 연락처
- **센터장**: 010-1234-5678
- **본사**: 02-1234-5678
- **장비 A/S**: 1588-1234
- **수영장 관리**: 010-9876-5432

### 즉시 보고해야 할 상황
- 안전사고 발생
- 장비 고장으로 운영 불가
- 수질 이상
- 정전 또는 주요 시설 고장`,
      category: '운영 가이드',
      tags: ['오픈업무', '체크리스트', '시설점검', '안전'],
      authorId: 'admin',
      authorName: '관리자',
      createdAt: '2024-01-10T08:30:00Z',
      updatedAt: '2024-01-10T08:30:00Z',
      viewCount: 234,
      isPublished: true
    },
    {
      id: '3',
      title: '마감 업무 체크리스트',
      content: `# 마감 업무 체크리스트

## 매일 마감 시 필수 업무 (22:00 PM)

### 1. 시설 정리 및 청소 (22:00-22:30)

#### 운동 구역 정리
- [ ] **웨이트 정리**: 덤벨, 바벨 원위치 배치
- [ ] **기구 청소**: 모든 운동기구 소독 및 청소
- [ ] **매트 정리**: 요가매트, 스트레칭 매트 정리 및 소독
- [ ] **바닥 청소**: 운동 구역 바닥 청소 및 소독

#### 수영장 관리
- [ ] **수질 점검**: 마지막 pH, 염소 농도 측정 기록
- [ ] **풀장 정리**: 부유물 제거 및 가장자리 청소
- [ ] **샤워실 청소**: 샤워부스 청소 및 배수구 점검
- [ ] **탈의실 정리**: 락커 정리 및 바닥 청소

### 2. 전산 업무 정리 (22:30-22:45)

#### 매출 정산
- [ ] **일일 매출**: 현금, 카드 매출 집계
- [ ] **회원 등록**: 신규 가입자 데이터 입력 완료
- [ ] **PT 세션**: 진행된 PT 세션 기록 및 정산
- [ ] **용품 판매**: 단백질, 음료 등 판매 내역 정리

#### 시스템 백업
- [ ] **데이터 백업**: 하루 업무 내용 자동 백업 확인
- [ ] **출입 기록**: 회원 출입 현황 저장
- [ ] **예약 현황**: 내일 PT 및 수업 예약 재확인

### 3. 안전 점검 (22:45-23:00)

#### 전체 시설 점검
- [ ] **화재 안전**: 비상구, 소화기 위치 및 상태 확인
- [ ] **전기 안전**: 콘센트, 전선 상태 점검
- [ ] **가스 밸브**: 온수 보일러 가스밸브 잠금 확인
- [ ] **창문 및 문**: 모든 창문 및 출입문 잠금 확인

#### 보안 시설 점검
- [ ] **CCTV**: 모든 카메라 정상 작동 확인
- [ ] **경비 시스템**: 센서 및 알람 시스템 활성화
- [ ] **금고**: 현금 보관 및 금고 잠금
- [ ] **열쇠 관리**: 모든 열쇠 제자리 보관

### 4. 내일 준비 사항 (23:00-23:10)

#### 익일 준비
- [ ] **수업 준비**: 내일 그룹수업 교구 및 음악 준비
- [ ] **PT 준비**: 개인 트레이닝 도구 점검
- [ ] **이벤트 준비**: 특별 행사 또는 프로모션 준비물
- [ ] **비품 확인**: 부족한 비품 주문 목록 작성

### 5. 최종 마감 (23:10-23:20)

#### 마감 체크
- [ ] **조명 소등**: 필요 구역만 남기고 모든 조명 소등
- [ ] **에어컨 조절**: 적정 온도 설정 후 절전 모드
- [ ] **음향 시스템**: 모든 음향 장비 전원 차단
- [ ] **정수기**: 전원 차단 및 위생 점검

#### 직원 퇴근 준비
- [ ] **업무 인수인계**: 다음 근무자에게 특이사항 전달
- [ ] **출입카드**: 직원 출입카드 반납
- [ ] **유니폼**: 다음날 착용할 깨끗한 유니폼 준비
- [ ] **마감 보고서**: 일일 마감 보고서 작성 및 제출

## 6. 주간별 추가 마감 업무

### 월요일 마감
- [ ] **주간 계획**: 이번 주 특별 일정 재점검
- [ ] **재고 조사**: 용품 재고 현황 파악

### 금요일 마감
- [ ] **주간 정산**: 주간 매출 집계 및 분석
- [ ] **장비 점검**: 주말 전 모든 장비 상태 점검
- [ ] **청소 점검**: 주말 대비 특별 청소 실시

### 월말 마감
- [ ] **월간 정산**: 월간 매출 및 회원 현황 정리
- [ ] **장비 정기점검**: 전문업체 점검일정 확인
- [ ] **직원 평가**: 월간 직원 근무 평가 및 피드백

## 7. 긴급상황 대응

### 마감 중 문제 발생 시
1. **즉시 센터장 연락**: 010-1234-5678
2. **상황 기록**: 발생 시간, 내용, 조치사항 기록
3. **관련 기관 신고**: 필요시 경찰서, 소방서 신고
4. **보험사 연락**: 사고 발생 시 보험사 즉시 연락

### 잊지 말아야 할 것들
- **절대 혼자 마감하지 않기**: 안전을 위해 2명 이상 마감
- **의심스러운 상황 즉시 신고**: 불심검문, 수상한 인물 목격 시
- **개인 물품 확인**: 회원들이 두고 간 물건 분실물 보관소 정리`,
      category: '운영 가이드',
      tags: ['마감업무', '체크리스트', '정산', '보안'],
      authorId: 'admin',
      authorName: '관리자',
      createdAt: '2024-01-12T21:45:00Z',
      updatedAt: '2024-01-12T21:45:00Z',
      viewCount: 189,
      isPublished: true
    },
    {
      id: '4',
      title: '고객 응대 매뉴얼',
      content: `# 고객 응대 매뉴얼

## 1. 기본 응대 원칙

### 응대 기본 자세
> **"고객은 우리의 소중한 파트너입니다"**

#### 첫인상의 중요성
- **미소**: 항상 밝은 미소로 맞이하기
- **인사**: "안녕하세요! 환영합니다" 밝은 목소리로
- **자세**: 바른 자세로 정중하게 서서 응대
- **복장**: 깔끔한 유니폼과 명찰 착용

### 응대 5원칙
1. **경청**: 고객의 말을 끝까지 듣기
2. **공감**: 고객의 입장에서 이해하기
3. **신속**: 빠르고 정확한 해결 제공
4. **친절**: 항상 따뜻하고 정중한 태도
5. **책임**: 문제 해결까지 끝까지 책임지기

## 2. 상황별 응대 가이드

### 신규 고객 응대

#### 첫 방문 고객
**인사말**: "안녕하세요! 처음 오신 건가요? 저희 센터에 관심 가져주셔서 감사합니다."

**진행 순서**:
1. **간단한 상담**: 운동 목적, 경험 여부 확인
2. **시설 투어**: 15-20분간 시설 안내
3. **프로그램 소개**: 개인에 맞는 프로그램 추천
4. **가격 안내**: 명확하고 투명한 요금 설명
5. **체험 제안**: 1일 무료 체험권 제공

#### 등록 의사 있는 고객
- **서두르지 않기**: 충분한 시간을 두고 상담
- **개인 맞춤 설명**: 고객의 니즈에 맞는 설명
- **할인 혜택**: 현재 진행 중인 프로모션 안내
- **등록 절차**: 계약서 작성 과정 친절히 안내

### 기존 회원 응대

#### 일반적인 인사
**아침**: "좋은 아침입니다! 오늘도 좋은 운동 되세요!"
**저녁**: "수고하셨습니다! 내일도 건강한 하루 되세요!"

#### 자주 오는 회원
- **개인적 관심**: "어제 말씀하신 목표는 어떠세요?"
- **운동 상담**: "새로운 운동 루틴 도움이 필요하시면 언제든 말씀하세요"
- **건강 관리**: "몸 상태는 어떠신지요? 무리하지 마세요"

### 불만 고객 응대

#### 불만 접수 시 기본 태도
1. **진정한 사과**: "죄송합니다. 불편을 드려서 정말 죄송합니다."
2. **경청 자세**: 끝까지 듣고 중간에 변명하지 않기
3. **공감 표현**: "정말 불편하셨겠습니다. 이해합니다."
4. **해결 의지**: "최선을 다해 해결해드리겠습니다."

#### 불만 유형별 대응

**시설 문제 (장비 고장, 청결 등)**:
- 즉시 확인하고 조치
- 임시 대안 제시
- 빠른 수리 일정 안내
- 불편에 대한 보상 제안

**서비스 문제 (직원 태도, 대기시간 등)**:
- 진심어린 사과
- 재발 방지 약속
- 담당자 교육 실시
- 개선 결과 피드백

**요금 문제 (과금, 환불 등)**:
- 정확한 내역 확인
- 약관 및 정책 설명
- 가능한 해결책 제시
- 본사 연계 필요시 즉시 연락

## 3. 전화 응대 매뉴얼

### 전화 받기
**3링 이내 응답**: "안녕하세요, ○○ 피트니스 센터입니다. 무엇을 도와드릴까요?"

### 전화 응대 원칙
- **명확한 발음**: 또박또박 정확하게
- **적절한 속도**: 너무 빠르거나 느리지 않게
- **메모 준비**: 중요한 내용은 반드시 기록
- **확인 과정**: 전달받은 내용 재확인

### 주요 문의 유형

#### 운영시간 문의
"운영시간은 평일 오전 6시부터 밤 11시까지, 주말은 오전 7시부터 밤 10시까지입니다. 매월 둘째, 넷째 월요일은 휴무입니다."

#### 가격 문의
"현재 진행 중인 프로모션이 있어서, 직접 오셔서 상담받으시면 더 자세히 안내해드릴 수 있습니다. 언제 방문 가능하신지요?"

#### 프로그램 문의
"고객님의 운동 목적과 경험에 따라 추천 프로그램이 달라집니다. 간단한 상담 후 맞춤 프로그램을 제안해드리겠습니다."

## 4. 특수 상황 응대

### 응급상황 발생 시
1. **즉시 119 신고**: 부상자 발생 시 최우선
2. **응급처치**: 기본 응급처치 실시
3. **센터장 연락**: 상황 즉시 보고
4. **현장 보존**: 사고 현장 보존 및 기록
5. **가족 연락**: 부상자 가족에게 연락

### 취객 또는 문제 고객
1. **안전 확보**: 다른 고객의 안전 최우선
2. **차분한 대응**: 흥분시키지 않도록 조심
3. **규정 설명**: 센터 이용규칙 명확히 설명
4. **퇴장 요청**: 불가피시 정중하게 퇴장 요청
5. **필요시 신고**: 위험 상황 시 112 신고

### 분실물 관련
- **즉시 수거**: 발견 즉시 분실물 보관소 보관
- **목록 작성**: 발견 일시, 장소, 물품 상세 기록
- **보관 기간**: 3개월간 보관 후 처리
- **찾아갈 때**: 신분증 확인 후 인계

## 5. 응대 시 주의사항

### 절대 하지 말아야 할 것
- **무관심한 태도**: 바쁘더라도 성의껏 응대
- **개인 정보 누설**: 다른 회원 정보 절대 누설 금지
- **약속 남발**: 확실하지 않은 약속하지 않기
- **차별 대우**: 모든 고객에게 공평한 서비스
- **감정적 대응**: 어떤 상황에서도 감정 조절

### 기억해야 할 것
- **고객명 기억**: 자주 오는 회원 이름 기억하기
- **감사 인사**: 작은 일에도 감사 표현
- **적극적 도움**: 먼저 다가가서 도움 제안
- **전문성**: 운동 관련 기본 지식 습득
- **팀워크**: 동료와 협력하여 더 나은 서비스

## 6. 응대 후 관리

### 고객 정보 기록
- **상담 내용**: CRM 시스템에 상담 기록
- **특이사항**: 고객의 특별한 요구사항 기록
- **follow-up**: 필요시 후속 연락 계획

### 서비스 개선
- **피드백 수집**: 고객 의견 적극 수렴
- **개선사항 제안**: 더 나은 서비스를 위한 아이디어 제안
- **팀 공유**: 좋은 응대 사례 팀원들과 공유`,
      category: '고객 서비스',
      tags: ['고객응대', '서비스', '매뉴얼', '소통'],
      authorId: 'admin',
      authorName: '관리자',
      createdAt: '2024-01-08T14:20:00Z',
      updatedAt: '2024-01-08T14:20:00Z',
      viewCount: 312,
      isPublished: true
    },
    {
      id: '5',
      title: '응급상황 대응 매뉴얼',
      content: `# 응급상황 대응 매뉴얼

## 1. 응급상황 분류 및 초기 대응

### 응급상황 단계별 분류

#### **Level 1: 생명 위험 상황**
- 심정지, 호흡곤란
- 의식불명 상태
- 심한 출혈
- 척추 손상 의심

#### **Level 2: 응급처치 필요**
- 골절, 탈구
- 화상, 열상
- 실신, 어지러움
- 알레르기 반응

#### **Level 3: 경미한 부상**
- 가벼운 타박상
- 근육 경련
- 찰과상
- 가벼운 어지러움

### 초기 대응 원칙 - **CARE**
- **C**all: 즉시 119 신고
- **A**ssess: 상황 및 환자 상태 파악
- **R**escue: 안전한 장소로 이동
- **E**valuate: 지속적인 상태 관찰

## 2. 상황별 응급처치 가이드

### 심정지 및 호흡정지

#### **CPR (심폐소생술) 절차**
1. **의식 확인**: 어깨를 두드리며 "괜찮으세요?" 큰 소리로 확인
2. **119 신고**: 즉시 신고 및 AED 요청
3. **가슴압박 시작**:
   - 위치: 양쪽 젖꼭지 중앙, 흉골 하부 1/3 지점
   - 깊이: 최소 5cm, 최대 6cm
   - 속도: 분당 100-120회
   - 압박 후 완전한 이완

4. **인공호흡**: 30회 압박 후 2회 인공호흡
5. **지속**: 119 구급대 도착까지 중단없이 반복

#### **AED 사용법**
1. **전원 켜기**: AED 전원 버튼 누르기
2. **패드 부착**: 
   - 우상: 오른쪽 쇄골 아래
   - 좌하: 왼쪽 겨드랑이 아래
3. **분석**: "분석 중" 음성 안내 시 환자에서 손 떼기
4. **제세동**: "쇼크 필요" 시 모든 사람 떨어뜨린 후 버튼 누르기
5. **CPR 재개**: 즉시 심폐소생술 재개

### 의식불명 및 실신

#### **즉시 조치사항**
1. **기도 확보**: 턱을 들어 올려 기도 개방
2. **회복 자세**: 옆으로 눕혀 기도 확보
3. **활력징후 확인**: 맥박, 호흡, 체온 확인
4. **보온**: 담요로 체온 유지
5. **관찰**: 의식 회복까지 지속 관찰

#### **주의사항**
- 물이나 음식 절대 금지
- 억지로 일으켜 세우지 않기
- 냄새나는 것으로 의식 깨우려 하지 않기

### 골절 및 탈구

#### **골절 의심 시 처치**
1. **부동**: 환자를 움직이지 않게 고정
2. **부목**: 신문지, 잡지 등을 이용해 임시 부목
3. **고정**: 부상 부위 위아래 관절 함께 고정
4. **거상**: 가능하면 심장보다 높게 올리기
5. **냉찜질**: 15-20분간 냉찜질 (직접 접촉 금지)

#### **척추 손상 의심 시**
- **절대 이동 금지**: 전문의료진 도착까지 대기
- **목 고정**: 목과 머리 움직임 방지
- **의식 확인**: 대화로 의식상태 지속 확인

### 출혈 및 상처

#### **출혈 조절 4단계**
1. **직접 압박**: 상처 부위 직접 압박
2. **거상**: 심장보다 높게 올리기
3. **압박점 압박**: 동맥 압박점 압박
4. **지혈대**: 최후의 수단으로 사용

#### **상처 처치**
- **소독**: 깨끗한 물로 세척
- **드레싱**: 멸균 거즈로 덮기
- **감염 예방**: 항생제 연고 도포
- **주의 관찰**: 감염 징후 지속 관찰

## 3. 운동 중 발생하는 응급상황

### 운동 중 심장 응급상황

#### **증상**
- 가슴 통증, 압박감
- 호흡곤란
- 식은땀, 구토
- 의식저하

#### **대응**
1. **즉시 운동 중단**: 안전한 곳에서 휴식
2. **119 신고**: 지체없이 응급신고
3. **편안한 자세**: 반좌위 자세로 안정
4. **약물**: 심장약 복용 중이면 도움
5. **관찰**: 상태 변화 지속 관찰

### 열사병 및 탈수

#### **열사병 증상**
- 체온 40°C 이상
- 의식 변화
- 뜨겁고 건조한 피부
- 빠른 맥박

#### **응급처치**
1. **즉시 냉각**: 서늘한 곳으로 이동
2. **옷 벗기기**: 통풍 잘 되게 옷 느슨하게
3. **냉각**: 젖은 수건으로 몸 전체 냉각
4. **수분**: 의식 있으면 시원한 물 조금씩
5. **119 신고**: 심한 경우 즉시 신고

### 근육 경련 및 부상

#### **근육 경련**
- **스트레칭**: 천천히 반대 방향으로 늘이기
- **마사지**: 부드럽게 근육 마사지
- **수분 보충**: 전해질 음료 섭취
- **휴식**: 충분한 휴식 취하기

#### **급성 근육 손상**
- **RICE 원칙**:
  - **R**est: 즉시 휴식
  - **I**ce: 15-20분 냉찜질
  - **C**ompression: 압박 붕대
  - **E**levation: 심장보다 높게 거상

## 4. 응급상황 대응 체계

### 응급상황 발생 시 행동 순서

#### **1단계: 즉시 대응 (0-2분)**
1. **상황 파악**: 환자 상태 및 주변 안전 확인
2. **119 신고**: 응급상황 신고
3. **초기 처치**: 생명구조 응급처치 시행
4. **동료 호출**: 추가 도움 요청

#### **2단계: 응급처치 (2-10분)**
1. **전문 처치**: 상황에 맞는 응급처치 실시
2. **상태 관찰**: 환자 상태 지속 모니터링
3. **정보 수집**: 환자 정보 및 사고 경위 파악
4. **가족 연락**: 환자 가족 또는 보호자 연락

#### **3단계: 인계 및 관리 (10분 이후)**
1. **구급대 인계**: 상황 및 처치 내용 전달
2. **사고 기록**: 사고 보고서 작성
3. **후속 조치**: 시설 점검 및 안전 조치
4. **보험 처리**: 필요시 보험사 연락

### 응급상황 연락망

#### **긴급연락처**
- **119**: 소방서 (응급의료)
- **112**: 경찰서 (치안)
- **센터장**: 010-1234-5678
- **본사**: 02-1234-5678

#### **의료기관**
- **○○대학병원**: 02-1234-5678 (24시간 응급실)
- **△△종합병원**: 02-9876-5432 (24시간 응급실)
- **지역보건소**: 02-1111-2222

### 응급상황 보고서 작성

#### **필수 기록 사항**
1. **발생 일시**: 정확한 날짜 및 시간
2. **발생 장소**: 센터 내 구체적 위치
3. **환자 정보**: 이름, 나이, 연락처, 주소
4. **사고 경위**: 상세한 사고 발생 과정
5. **처치 내용**: 실시한 응급처치 내용
6. **이송 병원**: 이송된 병원 및 담당의
7. **목격자**: 목격자 정보 및 진술

## 5. 예방 및 교육

### 응급상황 예방

#### **시설 안전 관리**
- **정기 점검**: 장비 안전 점검 주기적 실시
- **안전 교육**: 회원 대상 안전 교육
- **응급장비**: AED, 응급처치함 비치
- **표지판**: 응급상황 대응 안내 게시

#### **직원 교육**
- **CPR 교육**: 전 직원 심폐소생술 교육 (연 2회)
- **응급처치**: 기본 응급처치 교육
- **시뮬레이션**: 응급상황 모의 훈련
- **자격증**: 응급처치 자격증 취득 권장

### 회원 안전 교육

#### **운동 전 체크사항**
- **건강상태 확인**: 당일 컨디션 체크
- **준비운동**: 충분한 워밍업
- **수분 섭취**: 운동 전후 적절한 수분 보충
- **한계 인지**: 개인 체력 한계 인식

#### **위험 신호 인식**
- **가슴 통증**: 즉시 운동 중단
- **호흡곤란**: 과도한 운동 강도 조절
- **어지러움**: 휴식 및 수분 보충
- **관절 통증**: 무리한 동작 금지

**기억하세요: 응급상황에서는 빠른 판단과 신속한 행동이 생명을 구할 수 있습니다!**`,
      category: '안전 수칙',
      tags: ['응급상황', '안전', 'CPR', '응급처치'],
      authorId: 'admin',
      authorName: '관리자',
      createdAt: '2024-01-05T16:00:00Z',
      updatedAt: '2024-01-05T16:00:00Z',
      viewCount: 278,
      isPublished: true
    }
  ]);

  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [showEditor, setShowEditor] = useState(false);
  const [showViewer, setShowViewer] = useState(false);
  const [selectedManual, setSelectedManual] = useState<Manual | null>(null);
  const [editingManual, setEditingManual] = useState<Manual | undefined>();
  
  // 삭제 확인 모달 상태 추가
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingManualId, setDeletingManualId] = useState<string | null>(null);

  const categories = ['all', '일반', '운영 가이드', '시설 관리', '고객 서비스', '안전 수칙', '기타'];

  // 필터링된 메뉴얼
  const filteredManuals = useMemo(() => {
    return manuals.filter(manual => {
      const matchesSearch = manual.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           manual.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           manual.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
      
      const matchesCategory = categoryFilter === 'all' || manual.category === categoryFilter;
      
      return matchesSearch && matchesCategory && manual.isPublished;
    });
  }, [manuals, searchQuery, categoryFilter]);

  const handleSaveManual = (manualData: Omit<Manual, 'id' | 'createdAt' | 'updatedAt' | 'viewCount'>) => {
    const now = new Date().toISOString();
    
    if (editingManual) {
      // 수정
      setManuals(prev => prev.map(manual => 
        manual.id === editingManual.id 
          ? { ...manual, ...manualData, updatedAt: now }
          : manual
      ));
    } else {
      // 새로 추가
      const newManual: Manual = {
        ...manualData,
        id: Date.now().toString(),
        createdAt: now,
        updatedAt: now,
        viewCount: 0
      };
      setManuals(prev => [newManual, ...prev]);
    }
    
    setShowEditor(false);
    setEditingManual(undefined);
  };

  const handleViewManual = (manual: Manual) => {
    // 조회수 증가
    setManuals(prev => prev.map(m => 
      m.id === manual.id ? { ...m, viewCount: m.viewCount + 1 } : m
    ));
    setSelectedManual(manual);
    setShowViewer(true);
  };

  const handleEditManual = (manual: Manual) => {
    setEditingManual(manual);
    setShowEditor(true);
    setShowViewer(false);
  };

  const handleDeleteManual = (manualId: string) => {
    setDeletingManualId(manualId);
    setShowDeleteModal(true);
  };

  const confirmDeleteManual = () => {
    if (deletingManualId) {
      setManuals(prev => prev.filter(manual => manual.id !== deletingManualId));
      setShowViewer(false);
      setDeletingManualId(null);
    }
  };

  const canCreateManual = user?.role === 'admin' || ['fitness', 'tennis', 'golf'].includes(user?.role || '');

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-slate-50 p-6"
    >
      <div className="max-w-6xl mx-auto">
        {/* 헤더 */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 flex items-center">
                <BookOpen className="mr-3 text-blue-600" size={32} />
                메뉴얼
              </h1>
              <p className="text-slate-600 mt-2">업무 매뉴얼과 가이드라인을 관리하세요</p>
            </div>
            {canCreateManual && (
              <button
                onClick={() => {
                  setEditingManual(undefined);
                  setShowEditor(true);
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 px-4 rounded-lg flex items-center space-x-2 transition-colors"
              >
                <Plus size={18} />
                <span>새 메뉴얼</span>
              </button>
            )}
          </div>
        </div>

        {/* 검색 및 필터 */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
              <input
                type="text"
                placeholder="메뉴얼 검색..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {categories.map(category => (
                <option key={category} value={category}>
                  {category === 'all' ? '모든 카테고리' : category}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* 메뉴얼 목록 */}
        <div className="space-y-4">
          {filteredManuals.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
              <BookOpen className="mx-auto h-12 w-12 text-slate-400 mb-4" />
              <h3 className="text-lg font-medium text-slate-900 mb-2">메뉴얼이 없습니다</h3>
              <p className="text-slate-600">
                {searchQuery || categoryFilter !== 'all' 
                  ? '검색 조건에 맞는 메뉴얼이 없습니다.' 
                  : '등록된 메뉴얼이 없습니다.'
                }
              </p>
            </div>
          ) : (
            filteredManuals.map((manual) => (
              <motion.div
                key={manual.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 cursor-pointer transition-all hover:shadow-md"
                onClick={() => handleViewManual(manual)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center mb-3">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 mr-3">
                        {manual.category}
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {manual.tags.slice(0, 3).map((tag, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600"
                          >
                            {tag}
                          </span>
                        ))}
                        {manual.tags.length > 3 && (
                          <span className="text-xs text-slate-400">+{manual.tags.length - 3}</span>
                        )}
                      </div>
                    </div>
                    
                    <h3 className="text-lg font-semibold text-slate-900 mb-2 line-clamp-2">
                      {manual.title}
                    </h3>
                    
                    <p className="text-slate-600 mb-4 line-clamp-2">
                      {manual.content.replace(/[#*>\-\[\]]/g, '').substring(0, 150)}...
                    </p>
                    
                    <div className="flex items-center text-sm text-slate-500 space-x-4">
                      <div className="flex items-center">
                        <User className="h-4 w-4 mr-1" />
                        <span>{manual.authorName}</span>
                      </div>
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-1" />
                        <span>
                          {format(new Date(manual.createdAt), 'yyyy.MM.dd', { locale: ko })}
                        </span>
                      </div>
                      <div className="flex items-center">
                        <Eye className="h-4 w-4 mr-1" />
                        <span>{manual.viewCount} 회 조회</span>
                      </div>
                    </div>
                  </div>
                  
                  <ChevronRight className="h-5 w-5 text-slate-400 ml-4 flex-shrink-0" />
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>

      {/* 메뉴얼 에디터 */}
      <AnimatePresence>
        {showEditor && (
          <ManualEditor
            manual={editingManual}
            onSave={handleSaveManual}
            onClose={() => {
              setShowEditor(false);
              setEditingManual(undefined);
            }}
          />
        )}
      </AnimatePresence>

      {/* 메뉴얼 뷰어 */}
      <AnimatePresence>
        {showViewer && selectedManual && (
          <ManualViewer
            manual={selectedManual}
            onClose={() => {
              setShowViewer(false);
              setSelectedManual(null);
            }}
            onEdit={() => handleEditManual(selectedManual)}
            onDelete={() => handleDeleteManual(selectedManual.id)}
          />
        )}
      </AnimatePresence>

      {/* 삭제 확인 모달 */}
      <AnimatePresence>
        {showDeleteModal && (
          <DeleteConfirmModal
            isOpen={showDeleteModal}
            onClose={() => {
              setShowDeleteModal(false);
              setDeletingManualId(null);
            }}
            onConfirm={confirmDeleteManual}
            title="메뉴얼 삭제"
            message="정말로 이 메뉴얼을 삭제하시겠습니까? 삭제된 메뉴얼은 복구할 수 없습니다."
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
} 