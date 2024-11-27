import os
import json
import gradio as gr
from test_customer_agent import DemoSession


if __name__ == "__main__":
    model = 'accounts/fireworks/models/llama-v3p1-70b-instruct'

    session = DemoSession(
        model=model, level='default', policy='RedTeam Airlines', init_query=False)

    # Create the Gradio interface
    with gr.Blocks() as demo:
        scenario = gr.TextArea(value=session.scenario)
        chatbot = gr.Chatbot(value=session.get_history_to_display(), type="messages", height=400)
        msg = gr.Textbox(
            label="Type your message here",
            placeholder="Type your message and press enter",
            show_label=False
        )
        submit = gr.Button("Submit")
        level = gr.Dropdown(
            session.get_levels(), value='default', label='Select level')
        policy = gr.Dropdown(
            session.get_policies(), value='RedTeam Airlines', label='Select policy')
        init = gr.Button("Initialize")

        def user(user_message, history):
            """Handle user messages and update chat history."""
            session.add_user_message(user_message)
            return "", session.get_history_to_display()

        def bot(history):
            """Generate bot response and update chat history."""
            bot_message, functions = session.generate()
            session.add_assistant_message(bot_message, functions)
            session.save_history()
            return session.get_history_to_display()

        submit.click(user, [msg, chatbot], [msg, chatbot], queue=False).then(
            bot, [chatbot], chatbot)
        msg.submit(user, [msg, chatbot], [msg, chatbot], queue=False).then(
            bot, [chatbot], chatbot)

        def initialize(level, policy):
            session.initialize(level, policy)
            return session.get_history_to_display()
        init.click(initialize, [level, policy], [chatbot, scenario], queue=False)

    demo.launch()
