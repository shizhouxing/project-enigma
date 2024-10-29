import os
from typing import List, Dict, Any, Iterable, NewType

# Check if the Google Generative AI module is available
try:
    import google.generativeai as genai
    GOOGLE_MODULE_AVAILABLE = True
except ModuleNotFoundError:
    GOOGLE_MODULE_AVAILABLE = False

# Define a type for Google model identifiers
GoogleModel = NewType('GoogleModel', str)

class Client:
    """
    A client interface for interacting with Google's Generative AI models
    to generate responses using specified safety settings.
    """

    def __init__(self, api_key: str | None = os.getenv("GEMINI_API_KEY", None), **kwargs):
        """
        Initializes the Google Generative AI client and configures safety settings.

        Args:
            api_key (str): The API key used to authenticate with Google Generative AI.
            **kwargs: Additional keyword arguments for future customization.
        """
        assert api_key is not None, "api_key can not be None type."

        if GOOGLE_MODULE_AVAILABLE:
            genai.configure(api_key=api_key, **kwargs)
            self.safety_settings = [
                {"category": "HARM_CATEGORY_HARASSMENT", "threshold": "BLOCK_NONE"},
                {"category": "HARM_CATEGORY_HATE_SPEECH", "threshold": "BLOCK_NONE"},
                {"category": "HARM_CATEGORY_SEXUALLY_EXPLICIT", "threshold": "BLOCK_NONE"},
                {"category": "HARM_CATEGORY_DANGEROUS_CONTENT", "threshold": "BLOCK_NONE"},
            ]

    def generate(self, message: List[Dict[str, str]], model: GoogleModel) -> Iterable[str]:
        """
        Generates a response from the specified Google model based on input messages.

        Args:
            messages (List[Dict[str, str]]): A list of message dictionaries containing 'role' and 'content' keys.
            model (GoogleModel): The name or ID of the Google model to use.

        Yields:
            str: The text content of each response chunk from the model.
        """
        if not GOOGLE_MODULE_AVAILABLE:
            yield "Google Generative AI module is not available."
            return

        generative_model = genai.GenerativeModel(
            model_name=model,
            safety_settings=self.safety_settings,
        )

        converted_messages = self._convert_messages(message)

        # Create a chat with the message history, excluding the last message (the prompt)
        chat = generative_model.start_chat(history=converted_messages[:-1])
        
        # Send the final message as a prompt and stream the response
        response = chat.send_message(converted_messages[-1], stream=True)
        for chunk in response:
            yield chunk.candidates[0].content.parts[0].text

    def _convert_messages(self, messages: List[Dict[str, str]]) -> List[Dict[str, Any]]:
        """
        Converts message history to the format required by Google Generative AI.

        Args:
            messages (List[Dict[str, str]]): A list of messages with 'role' and 'content' fields.

        Returns:
            List[Dict[str, Any]]: Converted message list compatible with Google Generative AI.
        """
        gemini_messages = []
        for message in messages:
            role = message['role']
            content = message['content']
            
            if role == 'system':
                # Prepend system message content to the first user message if it exists
                if gemini_messages and gemini_messages[0]['role'] == 'user':
                    gemini_messages[0]['parts'][0] = f"{content}\n\n{gemini_messages[0]['parts'][0]}"
                else:
                    gemini_messages.append({"role": "user", "parts": [content]})
            elif role in ['user', 'model']:
                gemini_messages.append({"role": role, "parts": [content]})
        
        return gemini_messages

    def __call__(self, *args: Any, **kwargs: Any) -> Iterable[str]:
        """
        Allows the instance to be called as a function to generate responses.

        Args:
            *args (Any): Positional arguments for the `generate` method.
            **kwargs (Any): Keyword arguments for the `generate` method.

        Returns:
            Iterable[str]: Stream of response content.
        """
        return self.generate(*args, **kwargs)
