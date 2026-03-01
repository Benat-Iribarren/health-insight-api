export const isValidMessageId = (messageId: string): boolean => Boolean(messageId);

export const canRespondToMessage = (alreadyResponded: boolean): boolean => !alreadyResponded;