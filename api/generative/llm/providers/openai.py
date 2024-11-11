from __future__ import annotations
from typing import Iterable, Optional, Any, Dict, List
from ..types import (CompletionCapability, 
                     CompletionMetadata,
                     CompletionResponse, 
                     FunctionCallable, 
                     CompletionStrategy)



class OpenAICompletionResponse(CompletionResponse["ChatCompletion", str], FunctionCallable["ChatCompletionFunctionCall"]):
    """OpenAI-specific completion response implementation"""
    
    def __init__(self, response: "ChatCompletion", metadata: CompletionMetadata):
        self._response = response
        self._metadata = metadata
    
    @property
    def raw_response(self) -> "ChatCompletion":
        return self._response
    
    @property
    def metadata(self) -> CompletionMetadata:
        return self._metadata
    
    def iter_tokens(self) -> Iterable[str]:
        if hasattr(self._response, "choices") and self._response.choices:
            if hasattr(self._response.choices[0], "delta"):
                # Streaming response
                for chunk in self._response.choices:
                    if chunk.delta.content:
                        yield chunk.delta.content
            else:
                # Non-streaming response
                yield self._response.choices[0].message.content
    
    def get_text(self) -> str:
        return "".join(self.iter_tokens())
    
    def get_function_call(self) -> Optional["ChatCompletionFunctionCall"]:
        if (hasattr(self._response.choices[0].message, "function_call") and 
            self._response.choices[0].message.function_call):
            return self._response.choices[0].message.function_call
        return None
    
    def get_available_functions(self) -> List[Dict[str, Any]]:
        return self._response.model_dump().get("functions", [])

class OpenAICompletionStrategy(CompletionStrategy["ChatCompletion", str]):
    """Strategy for handling OpenAI completions"""
    
    def __init__(self, client: Any):
        self.client = client
        self._capabilities = {
            CompletionCapability.STREAMING,
            CompletionCapability.FUNCTION_CALLING,
            CompletionCapability.SYSTEM_MESSAGES
        }
    
    def create_completion(
        self,
        messages: List[Dict[str, str]],
        stream: bool = True,
        **kwargs
    ) -> OpenAICompletionResponse:
        
        response = self.client.chat.completions.create(
            messages=messages,
            stream=stream,
            **kwargs
        )
        

        metadata = CompletionMetadata(
            model=kwargs.pop("model", None),
            created=response.response.ok,
            provider="openai",
            capabilities=list(self._capabilities)
        )
        
        return OpenAICompletionResponse(response, metadata)
    
    def supports_capability(self, capability: CompletionCapability) -> bool:
        return capability in self._capabilities