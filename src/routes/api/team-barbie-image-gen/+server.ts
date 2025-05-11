import { DallEAPIWrapper } from "@langchain/openai";
import { json, type RequestHandler } from "@sveltejs/kit";
import { OPENAI_API_KEY } from "$env/static/private";
import { ImageGenSchema } from "./schema";
import { z } from "zod";

const dallE2Sizes = ['256x256', '512x512', '1024x1024'];
const dallE3Sizes = ['1024x1024', '1792x1024', '1024x1792'];

export const POST: RequestHandler = async ({ request }) => {
    try {
        const { prompt, amount, size, style, quality, format, model } = ImageGenSchema.parse(await request.json());


        if (model === 'dall-e-2' && !dallE2Sizes.includes(size)) {
            return json({
                message: "Invalid size for DALL·E 2",
                error: `DALL·E 2 only supports sizes: ${dallE2Sizes.join(', ')}`
            }, { status: 400 });
        }

        if (model === 'dall-e-3' && !dallE3Sizes.includes(size)) {
            return json({
                message: "Invalid size for DALL·E 3",
                error: `DALL·E 3 only supports sizes: ${dallE3Sizes.join(', ')}`
            }, { status: 400 });
        }

        const MODEL = new DallEAPIWrapper({
            n: amount,
            model: model,
            openAIApiKey: OPENAI_API_KEY,
            size: size,
            style: style,
            quality: quality,
            dallEResponseFormat: format,
        })

        const response = await MODEL.invoke(prompt);

        if (!response || response.length === 0) {
            return json({
                error: "No image generated"
            }, { status: 500 });
        }

        if (typeof response === 'string') {
            return json({
                format: format,
                images: [
                    {
                        type: format,
                        image_url: response
                    }
                ]
            }, { status: 200 });
        }

        if (format === 'b64_json') {
            return json({
                format: format,
                images: response.map((img: { type: string, image_url: { url: string } }) => {
                    return {
                        type: format,
                        image_url: img.image_url.url
                    }
                })
            }, { status: 200 });
        }

        if (format === 'url') {
            return json({
                format: format,
                images: response.map((img: { type: string, image_url: string }) => {
                    return {
                        type: format,
                        image_url: img.image_url
                    }
                })
            }, {
                status: 200
            })
        }

        return json({
            error: "Invalid response format"
        }, { status: 500 });

    } catch (error) {
        console.error("Error generating image:", error);
        return json({
            message: "Error generating image",
            error: error instanceof z.ZodError ? error.errors[0].message : error
        }, { status: error instanceof z.ZodError ? 400 : 500 });
    }
};
