from openai_client import OpenAIClient
import os

def generate_scenario(client, model, name, policy):
    ################ sample a context for the game
    context_sample_prompt = """
    Below is the refund policy from {name}:

    [Begin of the policy]
    {policy}
    [End of Refund policy]

    Please generate a scenario in detail where a customer is not eligible for a refund. The order confirmation number is 12345 with price $500. Please do not mention the name of the customer in the scenario.

    Output the scenario in the format of '[Begin of scenario]{{scenario}}[End of scenario]' where {{scenario}} is the generated scenario.
    """.format(name=name, policy=policy)

    response = client.generate([{
        'role': 'user',
        'content': context_sample_prompt
    }], model)

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
