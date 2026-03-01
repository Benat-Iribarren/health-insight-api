export type InlineAttachment = {
    filename: string;
    contentType: string;
    contentId: string;
    content: Buffer;
};

export interface MailRepository {
    sendMail(input: {
        to: string;
        subject: string;
        html: string;
        inlineAttachments?: InlineAttachment[];
    }): Promise<void>;
}