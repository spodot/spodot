import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full text-center">
        <h1 className="text-9xl font-extrabold text-indigo-600">404</h1>
        <h2 className="mt-4 text-3xl font-bold text-gray-900">페이지를 찾을 수 없습니다</h2>
        <p className="mt-2 text-lg text-gray-600">
          요청하신 페이지가 존재하지 않거나, 이동되었거나, 삭제되었습니다.
        </p>
        <div className="mt-8">
          <Link
            to="/"
            className="inline-flex items-center px-4 py-2 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
          >
            홈으로 돌아가기
          </Link>
        </div>
      </div>
    </div>
  );
}