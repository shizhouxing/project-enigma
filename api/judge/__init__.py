import re
from typing import Union
from api.judge._registry import FunctionDecorator, registry

__all__ = ["registry"]

@FunctionDecorator(function_type='validator')
def target(*, source: str, target: str, regex: Union[str, re.Pattern, None] = None, ignore_case: bool = False):
    if regex is not None:
        if isinstance(regex, str):
            flags = re.IGNORECASE if ignore_case else 0
            regex = re.compile(regex, flags)
        
        result = regex.sub(target, source)
        return result
    else:
        return target.lower() in source.lower()  if ignore_case else target in source

@FunctionDecorator(function_type='sampler')
def get_bad_word():
    return { "target" : "hello world" }

