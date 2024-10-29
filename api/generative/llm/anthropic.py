import os
from typing import List, Dict, Any, Iterable, NewType

# Check if the anthropic module is available
try:
    import anthropic
    ANTHROPIC_MODULE_AVAILABLE = True
except ModuleNotFoundError:
    ANTHROPIC_MODULE_AVAILABLE = False

AnthropicModel = NewType('AnthropicModel', str)

class Client:
    """
    A client interface for interacting with the Anthropic API to generate chat completions.

    Attributes:
        _client (Anthropic): An instance of the Anthropic API client configured with the provided API key and base URL.

    Methods:
        generate(message, model, stream): Generates a chat completion response using the specified model and parameters.
    """

    def __init__(self, 
                 api_key: str = os.getenv("ANTHROPIC_API_KEY", None),
                 base_url: str = "https://api.Anthropic.com/v1",
                 **kwargs):
        """
        Initializes the Anthropic API client.

        Args:
            api_key (str): The API key used to authenticate with Anthropic. Defaults to the "ANTHROPIC_API_KEY" environment variable.
            base_url (str): The base URL of the Anthropic API. Defaults to "https://api.Anthropic.com/v1".
            **kwargs: Additional keyword arguments passed to the Anthropic client configuration.

        Example:
            client = Client(api_key="your_api_key")
        """
        if ANTHROPIC_MODULE_AVAILABLE:
            self._client = anthropic.Anthropic(
                api_key=api_key,
                base_url=base_url,
                **kwargs
            )

    def generate(self, 
                 message: List[Any], 
                 model: AnthropicModel, 
                 stream: bool = True,
                 max_tokens : int = 1_000) -> Iterable:
        """
        Generates a stream of chat completions from the Anthropic API using the specified model.

        Args:
            message (List[Any]): A list of messages or prompts to be sent to the model for completion.
            model (AnthropicModel): The name or ID of the Anthropic model to use for generating responses.
            stream (bool): Whether to enable streaming for real-time responses. Defaults to True.

        Yields:
            str: The text content of each response chunk from the Anthropic model.

        Example:
            response_stream = client.generate(
                messages=[{"role": "user", "content": "Hello!"}],
                model="claude-3-5-sonnet-20241022"
            )
            for chunk in response_stream:
                print(chunk)
        """

        if not ANTHROPIC_MODULE_AVAILABLE:
            yield "Anthropic module is not available."
            return

        # Make an API request to create a chat completion with the specified parameters
        stream = self.client.messages.create(
            messages=message,
            model=model,
            max_tokens=max_tokens,
            stream=stream,
        )

        # Yield each chunk of response content from the API stream
        for event in stream:
            if event.type == 'content_block_delta':
                yield event.delta.text # event.content

    def __call__(self, *args: Any, **kwds: Any) -> Iterable:
        """
        Allows the instance to be called as a function to generate responses.

        Args:
            *args (Any): Positional arguments for the `generate` method.
            **kwargs (Any): Keyword arguments for the `generate` method.

        Returns:
            Iterable[str]: Stream of response content.
        """
        return self.generate(*args, **kwds)