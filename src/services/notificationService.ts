import { supabaseApiService } from './supabaseApi';
import { supabase } from '../lib/supabase';
import { format, addDays, isAfter, isBefore, parseISO } from 'date-fns';
import { ko } from 'date-fns/locale';

export interface NotificationData {
  userId: string;
  type: 'info' | 'warning' | 'success' | 'error';
  title: string;
  message: string;
  link?: string;
}

class NotificationService {
  // 기본 알림 생성
  async createNotification(data: NotificationData) {
    try {
      const { error } = await supabase
        .from('notifications')
        .insert([{
          user_id: data.userId,
          type: data.type,
          title: data.title,
          message: data.message,
          link: data.link || null,
          is_read: false
        }]);

      if (error) throw error;
      console.log(`알림 생성됨: ${data.title} -> ${data.userId}`);
    } catch (error) {
      console.error('알림 생성 실패:', error);
    }
  }

  // 일괄 알림 생성
  async createBulkNotifications(notifications: NotificationData[]) {
    try {
      const { error } = await supabase
        .from('notifications')
        .insert(notifications.map(data => ({
          user_id: data.userId,
          type: data.type,
          title: data.title,
          message: data.message,
          link: data.link || null,
          is_read: false
        })));

      if (error) throw error;
      console.log(`${notifications.length}개의 알림이 생성됨`);
    } catch (error) {
      console.error('일괄 알림 생성 실패:', error);
    }
  }

  // 1. 업무 배정 알림
  async notifyTaskAssignment(taskData: {
    id: string;
    title: string;
    assigneeId: string;
    assigneeName: string;
    assignerName: string;
    dueDate: string;
  }) {
    const dueDateFormatted = format(parseISO(taskData.dueDate), 'M월 d일', { locale: ko });
    
    await this.createNotification({
      userId: taskData.assigneeId,
      type: 'info',
      title: '새로운 업무가 배정되었습니다',
      message: `${taskData.assignerName}님이 "${taskData.title}" 업무를 배정했습니다. (마감: ${dueDateFormatted})`,
      link: `/my-tasks?task=${taskData.id}`
    });
  }

  // 2. 업무 완료 알림 (배정자에게)
  async notifyTaskCompletion(taskData: {
    id: string;
    title: string;
    assignerId: string;
    assigneeName: string;
  }) {
    await this.createNotification({
      userId: taskData.assignerId,
      type: 'success',
      title: '업무가 완료되었습니다',
      message: `${taskData.assigneeName}님이 "${taskData.title}" 업무를 완료했습니다.`,
      link: `/all-tasks?task=${taskData.id}`
    });
  }

  // 3. 마감일 임박 알림 (1일, 3일 전)
  async checkAndNotifyUpcomingDeadlines() {
    try {
      // Supabase에서 진행중인 업무들 조회
      const { data: tasks, error } = await supabase
        .from('tasks')
        .select(`
          id,
          title,
          due_date,
          assigned_to,
          status
        `)
        .in('status', ['pending', 'in-progress'])
        .not('assigned_to', 'is', null);

      if (error) throw error;
      
      const today = new Date();
      const tomorrow = addDays(today, 1);
      const threeDaysLater = addDays(today, 3);

      for (const task of tasks || []) {
        if (!task.due_date || !task.assigned_to) continue;
        
        const dueDate = parseISO(task.due_date);
        const dueDateFormatted = format(dueDate, 'M월 d일', { locale: ko });

        // 1일 전 알림
        if (format(dueDate, 'yyyy-MM-dd') === format(tomorrow, 'yyyy-MM-dd')) {
          await this.createNotification({
            userId: task.assigned_to,
            type: 'warning',
            title: '⏰ 업무 마감일이 내일입니다',
            message: `"${task.title}" 업무의 마감일이 ${dueDateFormatted}입니다.`,
            link: `/my-tasks?task=${task.id}`
          });
        }

        // 3일 전 알림
        if (format(dueDate, 'yyyy-MM-dd') === format(threeDaysLater, 'yyyy-MM-dd')) {
          await this.createNotification({
            userId: task.assigned_to,
            type: 'info',
            title: '📅 업무 마감일 알림',
            message: `"${task.title}" 업무의 마감일이 3일 후(${dueDateFormatted})입니다.`,
            link: `/my-tasks?task=${task.id}`
          });
        }

        // 마감일 초과 알림 (오늘 하루에 한 번만)
        if (isAfter(today, dueDate)) {
          // 오늘 이미 같은 업무에 대한 마감일 초과 알림을 보냈는지 확인
          const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
          
          const { data: existingNotification } = await supabase
            .from('notifications')
            .select('id')
            .eq('user_id', task.assigned_to)
            .eq('title', '🚨 업무 마감일 초과')
            .like('message', `%"${task.title}"%`)
            .gte('created_at', todayStart.toISOString())
            .single();

          // 오늘 이미 알림을 보내지 않았다면 전송
          if (!existingNotification) {
            await this.createNotification({
              userId: task.assigned_to,
              type: 'error',
              title: '🚨 업무 마감일 초과',
              message: `"${task.title}" 업무의 마감일(${dueDateFormatted})이 지났습니다. 즉시 처리해주세요.`,
              link: `/my-tasks?task=${task.id}`
            });
          }
        }
      }
    } catch (error) {
      console.error('마감일 체크 실패:', error);
    }
  }

  // 4. 공지사항 등록 알림
  async notifyAnnouncementCreated(announcementData: {
    id: string;
    title: string;
    authorName: string;
    targetRoles: string[];
    priority: string;
  }) {
    try {
      // 대상 역할의 모든 사용자 조회
      const targetUsers = await this.getUsersByRoles(announcementData.targetRoles);
      
      const notifications: NotificationData[] = targetUsers.map(user => ({
        userId: user.id,
        type: announcementData.priority === 'urgent' ? 'warning' : 'info',
        title: '📢 새로운 공지사항',
        message: `${announcementData.authorName}님이 "${announcementData.title}" 공지사항을 등록했습니다.`,
        link: `/announcements?id=${announcementData.id}`
      }));

      await this.createBulkNotifications(notifications);
    } catch (error) {
      console.error('공지사항 알림 생성 실패:', error);
    }
  }

  // 5. 댓글 추가 알림
  async notifyTaskComment(commentData: {
    taskId: string;
    taskTitle: string;
    authorName: string;
    assigneeId: string;
    assignerId: string;
    authorId: string;
  }) {
    const notifications: NotificationData[] = [];

    // 담당자에게 알림 (댓글 작성자가 아닌 경우)
    if (commentData.assigneeId !== commentData.authorId) {
      notifications.push({
        userId: commentData.assigneeId,
        type: 'info',
        title: '💬 업무에 댓글이 추가되었습니다',
        message: `${commentData.authorName}님이 "${commentData.taskTitle}" 업무에 댓글을 남겼습니다.`,
        link: `/my-tasks?task=${commentData.taskId}`
      });
    }

    // 배정자에게 알림 (댓글 작성자가 아니고, 담당자와 다른 경우)
    if (commentData.assignerId !== commentData.authorId && 
        commentData.assignerId !== commentData.assigneeId) {
      notifications.push({
        userId: commentData.assignerId,
        type: 'info',
        title: '💬 업무에 댓글이 추가되었습니다',
        message: `${commentData.authorName}님이 "${commentData.taskTitle}" 업무에 댓글을 남겼습니다.`,
        link: `/all-tasks?task=${commentData.taskId}`
      });
    }

    await this.createBulkNotifications(notifications);
  }

  // 6. 일일 보고서 작성 알림 (관리자에게)
  async notifyDailyReportSubmitted(reportData: {
    id: string;
    authorName: string;
    date: string;
  }) {
    try {
      // 관리자 사용자들 조회
      const admins = await this.getUsersByRoles(['admin']);
      
      const notifications: NotificationData[] = admins.map(admin => ({
        userId: admin.id,
        type: 'info',
        title: '📋 일일 보고서가 제출되었습니다',
        message: `${reportData.authorName}님이 ${reportData.date} 일일 보고서를 제출했습니다.`,
        link: `/admin/reports?id=${reportData.id}`
      }));

      await this.createBulkNotifications(notifications);
    } catch (error) {
      console.error('일일 보고서 알림 생성 실패:', error);
    }
  }

  // 7. 메뉴얼 업데이트 알림
  async notifyManualUpdated(manualData: {
    id: string;
    title: string;
    authorName: string;
    category: string;
  }) {
    try {
      // 모든 직원에게 알림
      const allUsers = await this.getUsersByRoles(['admin', 'reception', 'fitness', 'tennis', 'golf']);
      
      const notifications: NotificationData[] = allUsers.map(user => ({
        userId: user.id,
        type: 'info',
        title: '📚 메뉴얼이 업데이트되었습니다',
        message: `${manualData.authorName}님이 "${manualData.title}" 메뉴얼을 업데이트했습니다.`,
        link: `/manuals?id=${manualData.id}`
      }));

      await this.createBulkNotifications(notifications);
    } catch (error) {
      console.error('메뉴얼 알림 생성 실패:', error);
    }
  }

  // 유틸리티: 역할별 사용자 조회
  private async getUsersByRoles(roles: string[]): Promise<Array<{id: string, name: string, email: string}>> {
    try {
      // 모든 역할을 포함하려면 'all' 사용
      const targetRoles = roles.includes('all') ? 
        ['admin', 'reception', 'fitness', 'tennis', 'golf'] : 
        roles;

      const { data, error } = await supabase
        .from('users')
        .select('id, name, email')
        .in('role', targetRoles);
      
      if (error) throw error;
      
      return data || [];
    } catch (error) {
      console.error('사용자 조회 실패:', error);
      return [];
    }
  }

  // 매일 실행할 스케줄러 함수
  async runDailyScheduler() {
    console.log('일일 알림 스케줄러 실행 중...');
    await this.checkAndNotifyUpcomingDeadlines();
    console.log('일일 알림 스케줄러 완료');
  }
}

// 싱글톤 인스턴스
export const notificationService = new NotificationService();
export default notificationService; 