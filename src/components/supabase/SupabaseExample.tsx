import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'

interface Profile {
  id: string
  username: string
  created_at: string
}

export default function SupabaseExample() {
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchProfiles() {
      try {
        setLoading(true)
        
        // 여기서 'profiles'는 실제 Supabase의 테이블 이름입니다. 
        // 실제 사용 시 적절한 테이블 이름으로 변경하세요.
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .limit(5)
        
        if (error) {
          throw error
        }
        
        if (data) {
          setProfiles(data)
        }
      } catch (error) {
        setError(error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다')
        console.error('데이터 가져오기 오류:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchProfiles()
  }, [])

  return (
    <div className="p-4 bg-white rounded-lg shadow-md">
      <h2 className="text-xl font-semibold mb-4">Supabase 데이터 예제</h2>
      
      {loading ? (
        <p>로딩 중...</p>
      ) : error ? (
        <div className="text-red-500">
          <p>오류: {error}</p>
          <p className="mt-2 text-sm">
            Supabase URL과 Anon Key가 환경 변수에 올바르게 설정되었는지 확인하세요.
          </p>
        </div>
      ) : (
        <div>
          <p className="mb-2">프로필 {profiles.length}개를 가져왔습니다:</p>
          <ul className="space-y-2">
            {profiles.map((profile) => (
              <li key={profile.id} className="p-2 border rounded">
                <p><strong>사용자명:</strong> {profile.username}</p>
                <p><strong>생성일:</strong> {new Date(profile.created_at).toLocaleDateString()}</p>
              </li>
            ))}
          </ul>
          {profiles.length === 0 && (
            <p className="text-slate-500">데이터가 없습니다.</p>
          )}
        </div>
      )}
    </div>
  )
} 