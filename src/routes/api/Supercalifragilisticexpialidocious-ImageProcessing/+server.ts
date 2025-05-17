import ollama from 'ollama';
import { ReadableStream } from 'stream/web';
import { z } from 'zod';

const requestSchema = z.object({
    image64Url: z.string().min(1, "Image data is required"),
    tags: z.string().array()
});

export const POST = async ({ request }: { request: Request }) => {
    try {
        const requestData = await request.json();
        const { image64Url, tags } = requestSchema.parse(requestData);


        // Create a streaming response
        const stream = new ReadableStream({
            async start(controller) {
                const response = await ollama.chat({
                    model: 'llava:latest',
                    messages: [{
                        role: 'user',
                        content: 'Create a story about the image with made up title with the following tags: ' + tags.join(', '),
                        images: [image64Url]
                    }],
                    stream: true
                });

                for await (const chunk of response) {
                    controller.enqueue(chunk.message?.content || '');
                }
                controller.close();
            }
        });

        return new Response(stream, {
            headers: {
                'Content-Type': 'text/plain; charset=utf-8',
                'Transfer-Encoding': 'chunked',
                'Cache-Control': 'no-cache'
            }
        });

    } catch (error) {

        if (error instanceof z.ZodError) {
            return new Response(JSON.stringify({
                error: 'Validation failed',
                details: error.errors.map(e => ({
                    path: e.path.join('.'),
                    message: e.message
                }))
            }), {
                status: 400,
                headers: {
                    'Content-Type': 'application/json'
                }
            });
        }

        return new Response(JSON.stringify({ error: 'Failed to process image' }), {
            status: 500,
            headers: {
                'Content-Type': 'application/json'
            }
        });
    }
};