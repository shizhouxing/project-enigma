import os
from typing import List, Any, Iterable, NewType

# Define a new type for OpenAI model identifiers
OpenAIModel = NewType('OpenAIModel', str)

try:
    from openai import OpenAI
    OPENAI_MODULE_AVAILABLE = True
except ModuleNotFoundError:
    OPENAI_MODULE_AVAILABLE = False


class Client:
    """
    A client interface for interacting with the OpenAI API to generate chat completions.

    Attributes:
        _client (OpenAI): An instance of the OpenAI API client configured with the provided API key and base URL.

    Methods:
        generate(message, model, stream): Generates a chat completion response using the specified model and parameters.
    """

    def __init__(self, 
                 api_key: str = os.getenv("OPENAI_API_KEY", None),
                 base_url: str = "https://api.openai.com/v1",
                 **kwargs):
        """
        Initializes the OpenAI API client.

        Args:
            api_key (str): The API key used to authenticate with OpenAI. Defaults to the "OPENAI_API_KEY" environment variable.
            base_url (str): The base URL of the OpenAI API. Defaults to "https://api.openai.com/v1".
            **kwargs: Additional keyword arguments passed to the OpenAI client configuration.

        Example:
            client = Client(api_key="your_api_key")
        """
        if OPENAI_MODULE_AVAILABLE:
            self._client = OpenAI(
                api_key=api_key,
                base_url=base_url,
                **kwargs
            )

    def generate(self, message: List[Any], model: OpenAIModel, stream: bool = True) -> Iterable:
        """
        Generates a stream of chat completions from the OpenAI API using the specified model.

        Args:
            message (List[Any]): A list of messages or prompts to be sent to the model for completion.
            model (OpenAIModel): The name or ID of the OpenAI model to use for generating responses.
            stream (bool): Whether to enable streaming for real-time responses. Defaults to True.

        Yields:
            str: The text content of each response chunk from the OpenAI model.

        Example:
            response_stream = client.generate(
                message=[{"role": "user", "content": "Hello!"}],
                model="gpt-4"
            )
            for chunk in response_stream:
                print(chunk)
        """

        if not OPENAI_MODULE_AVAILABLE:
            yield "OpenAI module is not available."
            return

        # Make an API request to create a chat completion with the specified parameters
        response = self._client.chat.completions.create(
            model=model,
            message=message,
            stream=stream
        )

        # Yield each chunk of response content from the API stream
        for buffer in response:
            yield buffer.choices[0].delta.content

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