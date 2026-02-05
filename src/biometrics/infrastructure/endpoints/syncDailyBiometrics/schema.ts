import { errorSchema } from "@common/infrastructure/endpoints/errorSchema";

export const syncDailyBiometricsSchema = {
    schema: {
        headers: {
            type: "object",
            properties: {
                "x-health-insight-cron": { type: "string" },
            },
            additionalProperties: true,
        },
        body: false,
        response: {
            200: {
                type: "object",
                properties: {
                    dateProcessed: { type: "string" },
                    summary: {
                        type: "object",
                        properties: {
                            filesFound: { type: "number" },
                            rowsInserted: { type: "number" },
                        },
                        required: ["filesFound", "rowsInserted"],
                        additionalProperties: false,
                    },
                },
                required: ["dateProcessed", "summary"],
                additionalProperties: false,
            },
            202: {
                type: "object",
                properties: {
                    targetDate: { type: "string" },
                    message: { type: "string" },
                },
                required: ["targetDate", "message"],
                additionalProperties: false,
            },
            400: errorSchema,
            401: errorSchema,
            403: errorSchema,
            404: errorSchema,
            500: errorSchema,
        },
    },
};
