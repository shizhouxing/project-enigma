from abc import ABC, abstractmethod
from typing import Any, Dict, Generic, Iterable, List, Optional, Protocol, TypeVar, runtime_checkable
from api.generative.llm.types import CompletionCapability, CompletionMetadata

T_Completion = TypeVar('T_Completion')
T_Token = TypeVar('T_Token')
T_Function = TypeVar('T_Function')

@runtime_checkable
class CompletionResponse(Protocol[T_Completion, T_Token]):
    """Protocol for completion responses"""
    @property
    def raw_response(self) -> T_Completion: ...
    
    @property
    def metadata(self) -> CompletionMetadata: ...
    
    def iter_tokens(self) -> Iterable[T_Token]: ...
    
    def get_text(self) -> str: ...

@runtime_checkable
class FunctionCallable(Protocol[T_Function]):
    """Protocol for completions that support function calling"""
    def get_function_call(self) -> Optional[T_Function]: ...
    
    def get_available_functions(self) -> List[Dict[str, Any]]: ...

class CompletionStrategy(ABC, Generic[T_Completion, T_Token]):
    """Base strategy for handling model completions"""
    
    @abstractmethod
    def create_completion(
        self,
        messages: List[Dict[str, str]],
        stream: bool = True,
        **kwargs
    ) -> CompletionResponse[T_Completion, T_Token]: ...
    
    @abstractmethod
    def supports_capability(self, capability: CompletionCapability) -> bool: ...