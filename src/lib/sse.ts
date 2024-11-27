import {
  createParser,
  ParseError,
  type EventSourceMessage,
} from "eventsource-parser";

interface StreamConfig {
  /** Custom event types to process. If empty, processes all events */
  eventTypes?: string[];
  /** Custom data transformer function */
  transformData?: (data: string) => string;
  /** Error callback function */
  onError?: (error: Error) => void;
  /** Retry callback function */
  onRetry?: (retryInterval: number) => void;
  /** Event name for SSE events (default: 'message') */
  eventName?: string;
}

interface StreamReader {
  /** Read the next chunk from the stream */
  read(): Promise<{ value: string | null; done: boolean }>;
  /** Cancel the stream */
  cancel(): Promise<void>;
  /** Close the stream */
  close(): Promise<void>;
  /** Stream closed status */
  closed: boolean;
}

/**
 * Creates a StreamReader that makes it easy to consume SSE chunks as they arrive
 * 
 * @param stream - The ReadableStream to read from
 * @returns StreamReader object with methods to read and control the stream
 */
export function createStreamReader(stream: ReadableStream): StreamReader {
  const decoder = new TextDecoder();
  const reader = stream.getReader();
  let closed = false;

  // Initialize the reader

  return {
    async read() {
      try {
        const { done, value } = await reader.read();
        
        if (done) {
          closed = true;
          return { value: null, done: true };
        }

        // Decode the chunk and extract the SSE data
        const text = decoder.decode(value);
        const matches = text.match(/data: (.*)\n\n/);
        const data = matches ? matches[1] : text;

        return { value: data, done: false };
      } catch (error) {
        closed = true;
        throw error;
      }
    },

    async cancel() {
      closed = true;
      await reader.cancel();
    },

    async close() {
      closed = true;
      reader.releaseLock();
    },

    get closed() {
      return closed;
    }
  };
}

/**
 * Creates a ReadableStream from a Server-Sent Events (SSE) Response.
 * This utility transforms SSE messages into a proper SSE stream format.
 *
 * @param response - The Response object containing the SSE stream
 * @param config - Optional configuration for stream processing
 * @returns ReadableStream<Uint8Array> A readable stream of properly formatted SSE messages
 */
export function createStream(
  response: Response,
  config: StreamConfig = {}
): ReadableStream {
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();
  
  const {
    eventTypes = ['message'],
    transformData = (data: string) => data,
    onError = console.error,
    onRetry = console.log,
    eventName = 'message'
  } = config;

  let counter = 0;

  const transformStream = new TransformStream({
    async transform(chunk, controller) {
      try {
        const data = transformData(decoder.decode(chunk));
        if (data === "[DONE]") {
          controller.terminate();
          return;
        }

        if (counter < 2 && (data.match(/\n/) || []).length) {
          return;
        }

        let sseMessage = '';
        
        if (eventName !== 'message') {
          sseMessage += `event: ${eventName}\n`;
        }
        
        const dataLines = data.split('\n');
        dataLines.forEach(line => {
          sseMessage += `data: ${line}\n`;
        });
        
        sseMessage += '\n';
        
        controller.enqueue(encoder.encode(sseMessage));
        counter++;
      } catch (error) {
        onError(error as Error);
      }
    }
  });

  return new ReadableStream({
    async start(controller) {
      function onEvent(event: EventSourceMessage): void {
        try {
          if (eventTypes.includes(event.event ?? "message")) {
            controller.enqueue(encoder.encode(event.data));
          }
        } catch (error) {
          onError(error as Error);
        }
      }

      function handleParseError(error: ParseError): void {
        onError(new Error(`SSE Parse Error: ${error.message}`));
      }

      const parser = createParser({
        onEvent,
        onError: handleParseError,
        onRetry: (interval: number) => onRetry(interval)
      });

      try {
        if (!response.body) {
          throw new Error('Response body is null');
        }

        for await (const chunk of response.body as any) {
          parser.feed(decoder.decode(chunk))
        }
      } catch (error) {
        controller.error(error);
      } finally {
        controller.close();
      }
    }
  }).pipeThrough(transformStream);
}

/**
 * Helper function to iteratively read all chunks from a stream
 * 
 * @param stream - The ReadableStream to read from
 * @param onChunk - Callback function to handle each chunk
 * @returns Promise that resolves when the stream is fully consumed
 */
export async function readStream(
  stream: ReadableStream,
  onChunk: (chunk: string) => void | Promise<void>
): Promise<void> {
  const reader = createStreamReader(stream);
  
  try {
    while (!reader.closed) {
      const { value, done } = await reader.read();
      
      if (done) break;
      if (value) {
        await onChunk(value);
      }
    }
  } finally {
    await reader.close();
  }
}