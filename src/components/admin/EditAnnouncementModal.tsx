import React, { useEffect } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { useAnnouncement } from '../../contexts/AnnouncementContext';
import { Announcement } from '../../types';
import Modal from '../common/Modal';

interface EditAnnouncementFormInputs {
  title: string;
  content: string;
  isPublished: boolean;
}

interface EditAnnouncementModalProps {
  isOpen: boolean;
  onClose: () => void;
  announcement: Announcement | null;
}

const EditAnnouncementModal: React.FC<EditAnnouncementModalProps> = ({ isOpen, onClose, announcement }) => {
  const { updateAnnouncement } = useAnnouncement();
  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<EditAnnouncementFormInputs>();

  useEffect(() => {
    if (announcement) {
      setValue('title', announcement.title);
      setValue('content', announcement.content);
      setValue('isPublished', announcement.isPublished === undefined ? true : announcement.isPublished);
    } else {
      // Reset form if no announcement is provided (e.g., modal closed and reopened for a new edit)
      reset({ title: '', content: '', isPublished: true });
    }
  }, [announcement, setValue, reset]);

  const onSubmit: SubmitHandler<EditAnnouncementFormInputs> = (data) => {
    if (!announcement) return;

    updateAnnouncement(announcement.id, { 
      ...announcement, // 기존 데이터 유지 (authorId, createdAt 등)
      ...data, // 폼에서 수정된 데이터 (title, content, isPublished)
      updatedAt: new Date().toISOString(), // 수정 시각 업데이트
    });
    onClose(); // 모달 닫기
  };

  if (!announcement) return null; // announcement가 없으면 모달을 렌더링하지 않음

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="공지사항 수정">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label htmlFor="edit-title" className="block text-sm font-medium text-gray-700">
            제목
          </label>
          <input
            id="edit-title"
            type="text"
            {...register('title', { required: '제목을 입력해주세요.' })}
            className={`mt-1 block w-full px-3 py-2 border ${errors.title ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm`}
          />
          {errors.title && <p className="mt-1 text-sm text-red-500">{errors.title.message}</p>}
        </div>

        <div>
          <label htmlFor="edit-content" className="block text-sm font-medium text-gray-700">
            내용
          </label>
          <textarea
            id="edit-content"
            rows={4}
            {...register('content', { required: '내용을 입력해주세요.' })}
            className={`mt-1 block w-full px-3 py-2 border ${errors.content ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm`}
          />
          {errors.content && <p className="mt-1 text-sm text-red-500">{errors.content.message}</p>}
        </div>

        <div className="flex items-center">
          <input
            id="edit-isPublished"
            type="checkbox"
            {...register('isPublished')}
            className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
          />
          <label htmlFor="edit-isPublished" className="ml-2 block text-sm text-gray-900">
            게시 (체크 해제 시 비공개)
          </label>
        </div>

        <div className="flex justify-end space-x-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            취소
          </button>
          <button
            type="submit"
            className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            수정 완료
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default EditAnnouncementModal;
