/**
 * 날짜 문자열을 YYYY-MM-DD 형식에서 YYYY년 MM월 DD일 형식으로 변환
 */
export function formatDate(dateString?: string): string {
  if (!dateString) return '';
  
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch (error) {
    console.error('날짜 형식 변환 오류:', error);
    return dateString;
  }
}

/**
 * 시간 문자열을 HH:MM:SS 형식에서 HH:MM 형식으로 변환 (24시간 형식)
 */
export function formatTime(timeString?: string): string {
  if (!timeString) return '';
  
  try {
    // HH:MM:SS 형식에서 HH:MM 부분만 추출
    const timeMatch = timeString.match(/^(\d{2}):(\d{2})/);
    if (timeMatch) {
      return `${timeMatch[1]}:${timeMatch[2]}`;
    }
    
    return timeString;
  } catch (error) {
    console.error('시간 형식 변환 오류:', error);
    return timeString;
  }
} 