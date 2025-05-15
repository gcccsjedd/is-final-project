import { z } from "zod";

export const ImageGenSchema = z.object({
    prompt: z.string().min(1, "Prompt is required"),
    amount: z.number().min(1).max(10).optional().default(1),
    size: z.enum(["256x256", "512x512", "1024x1024", "1792x1024", "1024x1792"]).optional().default("1024x1024"),
    style: z.enum(['vivid', 'natural']).optional().default('vivid'),
    quality: z.enum(['standard', 'hd']).optional().default('standard'),
    format: z.enum(['url', 'b64_json']).optional().default('url'),
    model: z.enum(['dall-e-2', 'dall-e-3']).optional().default('dall-e-3'),
});
