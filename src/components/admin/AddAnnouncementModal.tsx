import React from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { useAnnouncement } from '../../contexts/AnnouncementContext';
import Modal from '../common/Modal';

interface AddAnnouncementFormInputs {
  title: string;
  content: string;
  isPublished?: boolean;
}

interface AddAnnouncementModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AddAnnouncementModal: React.FC<AddAnnouncementModalProps> = ({ isOpen, onClose }) => {
  const { addAnnouncement } = useAnnouncement();
  const { register, handleSubmit, reset, formState: { errors } } = useForm<AddAnnouncementFormInputs>({
    defaultValues: {
      isPublished: true, // Default to 'published'
    }
  });

  const onSubmit: SubmitHandler<AddAnnouncementFormInputs> = (data) => {
    // authorId can be sourced from AuthContext or handled by the backend.
    // For now, it's passed as undefined, and addAnnouncement in Context might handle it.
    addAnnouncement({ 
      title: data.title,
      content: data.content,
      isPublished: data.isPublished,
      authorId: undefined // This could be replaced with the actual author's ID from context
    });
    reset(); // Reset form fields
    onClose(); // Close modal
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="새 공지사항 추가">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700">
            제목
          </label>
          <input
            id="title"
            type="text"
            {...register('title', { required: '제목을 입력해주세요.' })}
            className={`mt-1 block w-full px-3 py-2 border ${errors.title ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm`}
          />
          {errors.title && <p className="mt-1 text-sm text-red-500">{errors.title.message}</p>}
        </div>

        <div>
          <label htmlFor="content" className="block text-sm font-medium text-gray-700">
            내용
          </label>
          <textarea
            id="content"
            rows={4}
            {...register('content', { required: '내용을 입력해주세요.' })}
            className={`mt-1 block w-full px-3 py-2 border ${errors.content ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm`}
          />
          {errors.content && <p className="mt-1 text-sm text-red-500">{errors.content.message}</p>}
        </div>

        <div className="flex items-center">
          <input
            id="isPublished"
            type="checkbox"
            {...register('isPublished')}
            className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
          />
          <label htmlFor="isPublished" className="ml-2 block text-sm text-gray-900">
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
            공지사항 추가
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default AddAnnouncementModal;
