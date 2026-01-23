export class NoDataError extends Error {
    constructor() {
        super('NO_DATA');
        this.name = 'NoDataError';
    }
}

export class AnalysisFailedError extends Error {
    constructor() {
        super('ANALYSIS_FAILED');
        this.name = 'AnalysisFailedError';
    }
}
