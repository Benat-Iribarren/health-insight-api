export interface WeeklyDashboardImageGenerator {
    generateWeeklyDashboardImage(input: { patientId: number }): Promise<{ buffer: Buffer; contentType: string }>;
}