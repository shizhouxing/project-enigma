import gradio as gr
from test_customer_agent import DemoSession

# Initialize chat history
initial_history = [
    {"role": "assistant", "content": "Hello! What can I help you today."},
    {"role": "user", "content": "Hello! I want to request for full refund for my ticket with confirmation number 12345."}
]


def respond(message, history):
    """
    Custom response function - replace this with your actual chatbot logic
    Currently just echoes the user's message
    """
    return f"You said: {message}"


if __name__ == "__main__":
    model = 'accounts/fireworks/models/llama-v3p1-70b-instruct'

    session = DemoSession(model=model)

    initial_response, _ = session.generate(initial_history)

    # Create the Gradio interface
    with gr.Blocks() as demo:
        chatbot = gr.Chatbot(
            value=initial_history + [{'role': 'assistant', 'content': initial_response}],
            type="messages",
            height=400
        )
        msg = gr.Textbox(
            label="Type your message here",
            placeholder="Type your message and press enter",
            show_label=False
        )
        clear = gr.Button("Clear")

        def user(user_message, history):
            """Handle user messages and update chat history."""
            return "", history + [{'role': 'user', 'content': user_message}]

        def bot(history):
            """Generate bot response and update chat history."""
            bot_message, _= session.generate(history)
            history.append({'role': 'assistant', 'content': bot_message})
            return history

        msg.submit(
            user, 
            [msg, chatbot], 
            [msg, chatbot], 
            queue=False
        ).then(
            bot, 
            chatbot, 
            chatbot
        )

        clear.click(lambda: None, None, chatbot, queue=False)
    demo.launch()