import os
from typing import Any, Dict, List
from .types import CompletionResponse
from .factory import CompletionFactory
from .providers import OpenAICompletionStrategy
from ..registry import ModelRegistry
try:
    from openai import OpenAI
    OPENAI_MODULE_AVAILABLE = True
except ImportError:
    OPENAI_MODULE_AVAILABLE = False


CompletionFactory.register_strategy("openai", OpenAICompletionStrategy)

@ModelRegistry.register(
    configs=[{
        # registry location
        "name" : "gpt-4o",
        "provider" : "openai",
        # init constants
        "base_url" : "https://api.openai.com/v1",
        "api_key"  : os.getenv("OPENAI_API_KEY", None),
    }]
)
class Client:
    def __init__(
        self,
        provider : str, 
        api_key: str = os.getenv("OPENAI_API_KEY", None),
        base_url: str = "https://api.openai.com/v1",
        **kwargs
    ):
        if OPENAI_MODULE_AVAILABLE and provider == "openai":
            self._client = OpenAI(
                api_key=api_key,
                base_url=base_url,
                **kwargs
            )
            self._strategy = CompletionFactory\
                .create_strategy("openai", 
                                 self._client)
    
    def generate(
            self,
            messages: List[Dict[str, str]],
            model: str,
            stream: bool = True,
            **kwargs
        ) -> CompletionResponse:
            """Generate a completion using the appropriate strategy"""
            return self._strategy.create_completion(
                messages=messages,
                stream=stream,
                model=model,
                **kwargs
            )
    
    def __call__(self, *args: Any, **kwargs: Any) -> CompletionResponse:
        return self.generate(*args, **kwargs)
