export const isValidPatientId = (patientId: number): boolean => Number.isFinite(patientId) && patientId > 0;

export const isValidSendToPatientInput = (input: { patientId: number; subject: string; content: string }): boolean =>
    isValidPatientId(input.patientId) && Boolean(input.subject) && Boolean(input.content);