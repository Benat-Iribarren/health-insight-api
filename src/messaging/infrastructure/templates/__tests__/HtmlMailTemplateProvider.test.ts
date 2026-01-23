import { HtmlMailTemplateProvider } from '../HtmlMailTemplateProvider';

describe('HtmlMailTemplateProvider', () => {
    const provider = new HtmlMailTemplateProvider();

    it('should correctly pluralize sessions in weekly stats', () => {
        const statsSingular = { completed: 1, inProgress: 0, pending: 0, nextWeekSessions: 1, name: 'Beñat' };
        const statsPlural = { completed: 1, inProgress: 0, pending: 0, nextWeekSessions: 2, name: 'Beñat' };

        const htmlSingular = provider.renderWeeklyStats(statsSingular);
        const htmlPlural = provider.renderWeeklyStats(statsPlural);

        expect(htmlSingular).toContain('1 sesión programada');
        expect(htmlPlural).toContain('2 sesiones programadas');
    });

    it('should contain name and cid reference', () => {
        const stats = { completed: 1, inProgress: 0, pending: 0, nextWeekSessions: 1, name: 'Beñat' };
        const html = provider.renderWeeklyStats(stats);

        expect(html).toContain('Beñat');
        expect(html).toContain('src="cid:stats"');
    });

    it('should render message notification with correct count', () => {
        const html = provider.renderMessageNotification(5);
        expect(html).toContain('5 mensajes nuevos sin leer');
    });
});