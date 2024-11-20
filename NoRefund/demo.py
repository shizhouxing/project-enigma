import gradio as gr
from test_customer_agent import DemoSession

# Initialize chat history
initial_history = [
    {"role": "assistant", "content": "Hello! What can I help you today."},
    {"role": "user", "content": "Hello! I want to request for full refund for my order with confirmation number 12345."}
]

if __name__ == "__main__":
    model = 'accounts/fireworks/models/llama-v3p1-70b-instruct'

    session = DemoSession(model=model)
    initial_response, _ = session.generate(initial_history)

    # Create the Gradio interface
    with gr.Blocks() as demo:
        scenario = gr.TextArea(value = session.scenario)
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
        submit = gr.Button("Submit")
        level = gr.Dropdown(session.get_levels(), label='Select level')
        init = gr.Button("Initialize")
        # clear = gr.Button("Clear")

        def user(user_message, history):
            """Handle user messages and update chat history."""
            return "", history + [{'role': 'user', 'content': user_message}]

        def bot(history):
            """Generate bot response and update chat history."""
            process_history = [{
                'role': a['role'],
                'content': a['content_real'] if 'content_real' in a else a['content']
            } for a in history]
            bot_message, functions = session.generate(process_history)

            display_message = bot_message
            for k, v in functions.items():
                display_message += f'\n[FUNCTION CALLED]: {v["name"]}({v["arguments"]})'

            history.append({
                'role': 'assistant',
                # "content" also displays function calls
                'content': display_message,
                # "content_real" only includes responses without function calls
                'content_real': bot_message,
            })

            return history

        submit.click(user, [msg, chatbot], [msg, chatbot], queue=False).then(
            bot, chatbot, chatbot)
        msg.submit(user, [msg, chatbot], [msg, chatbot], queue=False).then(
            bot, chatbot, chatbot)

        def initialize(level):
            session.initialize(level)
            initial_response, _ = session.generate(initial_history)
            return initial_history + [{'role': 'assistant', 'content': initial_response}], session.scenario

        init.click(initialize, level, [chatbot, scenario], queue=False)
        # clear.click(lambda: None, None, chatbot, queue=False)

    demo.launch()
