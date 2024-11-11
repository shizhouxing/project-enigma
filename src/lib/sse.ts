/**
 * @fileoverview Provides utilities for handling Server-Sent Events (SSE) streams.
 * @author Luca Vivona
 */

import {
    createParser,
    ParseError,
    type EventSourceMessage,
  } from "eventsource-parser";
  
  /**
   * Configuration options for the SSE stream processor
   * @interface StreamConfig
   */
  interface StreamConfig {
    /** Custom event types to process. If empty, processes all events */
    eventTypes?: string[];
    /** Custom data transformer function */
    transformData?: (data: string) => string;
    /** Error callback function */
    onError?: (error: Error) => void;
    /** Retry callback function */
    onRetry?: (retryInterval: number) => void;
  }
  
  /**
   * Creates a ReadableStream from a Server-Sent Events (SSE) Response.
   * This utility transforms SSE messages into a standard ReadableStream,
   * making it easier to consume SSE data in a streaming fashion.
   *
   * @param response - The Response object containing the SSE stream
   * @param config - Optional configuration for stream processing
   * @returns ReadableStream<Uint8Array> A readable stream of the processed SSE messages
   *
   * @example
   * ```typescript
   * const response = await fetch('https://api.example.com/stream');
   * const stream = createSSEStream(response, {
   *   eventTypes: ['message', 'update'],
   *   transformData: (data) => data.toUpperCase(),
   *   onError: (error) => console.error('Stream error:', error)
   * });
   * 
   * for await (const chunk of stream) {
   *   console.log(new TextDecoder().decode(chunk));
   * }
   * ```
   *
   * @throws {Error} If the response body is null or the stream encounters an error
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
      onRetry = console.log
    } = config;
  
    return new ReadableStream({
      async start(controller) {
        // Handle incoming SSE messages
        function onEvent(event: EventSourceMessage): void {
          try {
            // Process only specified event types
            console.log("event", event, event.id)
            if (eventTypes.includes(event.event ?? "message")) {
              const transformedData = transformData(event.data);
              controller.enqueue(encoder.encode(`${transformedData}\n`));
            }
          } catch (error) {
            onError(error as Error);
          }
        }
  
        // Handle parser errors
        function handleParseError(error: ParseError): void {
          onError(new Error(`SSE Parse Error: ${error.message}`));
        }
  
        // Create SSE parser
        const parser = createParser({
          onEvent,
          onError: handleParseError,
          onRetry: (interval: number) => onRetry(interval)
        });
  
        // Process the response body
        try {
          if (!response.body) {
            throw new Error('Response body is null');
          }
  
          const reader = response.body.getReader();
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            parser.feed(decoder.decode(value, { stream: true }));
          }
        } catch (error) {
          controller.error(error);
        } finally {
          controller.close();
        }
      }
    });
  }