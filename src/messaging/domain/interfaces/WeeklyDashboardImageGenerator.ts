export interface WeeklyDashboardImageGenerator {
    generateWeeklyDashboard(stats: {
        completed: number;
        inProgress: number;
        notStarted: number;
    }): Promise<Buffer>;
}
