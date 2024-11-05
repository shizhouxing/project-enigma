from openai_client import OpenAIClient
import os
from config import policy

def generate_scenario(client):
    ################ sample a context for the game
    context_sample_prompt = """
    Below is the refund policy from an Airline company:

    [Begin of the policy]
    {policy}
    [End of Refund policy]

    Please generate a scenario in detail where a customer is not eligible for a ticket refund. Please do not mention the name of the customer in the scenario.

    Output the scenario in the format of '[Begin of scenario]{{scenario}}[End of scenario]' where {{scenario}} is the generated scenario.
    """.format(policy=policy)

    response = client.generate([{
        'role': 'user',
        'content': context_sample_prompt
    }], 'accounts/fireworks/models/llama-v3p1-70b-instruct')

    chunk_response = ""
    for chunk in response:
        if chunk:
            chunk_response += chunk

    return chunk_response


if __name__ == '__main__':
    client = OpenAIClient(
        api_key=os.getenv("FIREWORKS_API_KEY"),
        base_url="https://api.fireworks.ai/inference/v1"
    )
    scenario = generate_scenario(client)
    print(scenario)
