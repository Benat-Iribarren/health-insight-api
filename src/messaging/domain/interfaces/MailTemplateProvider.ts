export interface MailTemplateProvider {
    renderWeeklyStats(stats: {
        completed: number;
        inProgress: number;
        pending: number;
        nextWeekSessions: number;
        name: string
    }): string;
    renderMessageNotification(count: number): string;
}