import sys
from typing import Callable, Dict, Any, Union, NewType, Literal, get_type_hints
import re
import asyncio
import inspect
from fastapi import APIRouter, HTTPException, status, Depends
from api.models import Message
from api.deps import ClientSession, get_current_user

# Type definitions
CallableRef = NewType('CallableRef', str)

class FunctionValidator:
    """Validates function calls against their metadata."""
    
    @staticmethod
    def validate_parameters(func: Callable, kwargs: Dict[str, Any]) -> None:
        """Validate parameters against function signature and type hints."""
        sig = inspect.signature(func)
        type_hints = get_type_hints(func)
        
        # Get required and optional parameters
        required_params = {
            name for name, param in sig.parameters.items()
            if param.default == inspect.Parameter.empty
        }
        
        # Check for missing required parameters
        missing_params = required_params - set(kwargs.keys())
        if missing_params:
            raise ValueError(f"Missing required parameters: {missing_params}")
        
        # Check for unexpected parameters
        valid_params = set(sig.parameters.keys())
        unexpected_params = set(kwargs.keys()) - valid_params
        if unexpected_params:
            raise ValueError(f"Unexpected parameters: {unexpected_params}")
        
        # Validate parameter types
        for param_name, value in kwargs.items():
            if param_name in type_hints:
                expected_type = type_hints[param_name]
                
                # Handle Union types
                if hasattr(expected_type, "__origin__") and expected_type.__origin__ is Union:
                    if not any(isinstance(value, t) for t in expected_type.__args__):
                        raise TypeError(
                            f"Parameter '{param_name}' must be one of {expected_type.__args__}, "
                            f"got {type(value)}"
                        )
                else:
                    if not isinstance(value, expected_type):
                        raise TypeError(
                            f"Parameter '{param_name}' must be of type {expected_type}, "
                            f"got {type(value)}"
                        )

    @staticmethod
    async def validate_against_db(session: ClientSession, 
                                  fn: str, 
                                  kwargs: Dict[str, Any], 
                                  func_type : Literal['validator', 'sampler']='validator') -> Dict:
        """Validate function call against database metadata."""
        result = await session["judges"].find_one({
            f"{func_type}.function.name": fn,
            "active": True
        })
        
        if result is None:
            raise ValueError(f"Function '{fn}' does not exist within registered functions")
            
        # Get function definition from database
        func_def = result["validator"]["function"]
        
        # Validate required parameters from DB definition
        required_params = {
            name for name, info in func_def["parameters"].items()
            if info.get("required", True)
        }
        
        missing_params = required_params - set(kwargs.keys())
        if missing_params:
            raise ValueError(f"Missing required parameters: {missing_params}")
        
        # Validate parameter types from DB definition
        for param_name, value in kwargs.items():
            if param_name not in func_def["parameters"]:
                raise ValueError(f"Unexpected parameter: {param_name}")
            
            param_info = func_def["parameters"][param_name]
            
            # Handle union types
            if param_info["type"] == "union":
                valid_types = param_info["types"]
                if not any(isinstance(value, eval(t)) for t in valid_types if t != "None"):
                    if value is not None or "None" not in valid_types:
                        raise TypeError(
                            f"Parameter '{param_name}' must be one of {valid_types}, "
                            f"got {type(value).__name__}"
                        )
            else:
                expected_type = eval(param_info["type"])
                if not isinstance(value, expected_type):
                    raise TypeError(
                        f"Parameter '{param_name}' must be of type {param_info['type']}, "
                        f"got {type(value).__name__}"
                    )
        
        return result

def _call(fn: str) -> Callable:
    """Retrieve a callable function by name from the current module."""
    if fn == _call.__name__:
        raise Exception("Cannot call the _call function itself.")
    
    if fn.startswith("_"):
        raise ValueError("Cannot reference a private function.")
    
    if not re.match(r"^[A-Za-z_][A-Za-z0-9_]*$", fn):
        raise ValueError("Invalid function name format.")
    
    current_module = sys.modules[__name__]
    func = getattr(current_module, fn, None)
    
    if callable(func) and getattr(func, "__module__", None) == __name__:
        return func
    
    raise ValueError(f"Function '{fn}' is either not found or not accessible.")

router = APIRouter()

@router.post("/", dependencies=[Depends(get_current_user)])
async def function_call(
    session: ClientSession,
    type : Literal['validator', 'sampler'],
    fn: str,
    kwargs: Dict[str, Any]
) -> Message:
    """Execute a registered function with the provided arguments."""
    try:
        # Validate against database metadata
        await FunctionValidator.validate_against_db(session, fn, kwargs, type)
        
        # Get the callable function
        function = _call(fn)
        
        # Validate parameters against actual function
        FunctionValidator.validate_parameters(function, kwargs)
        
        # Execute the function
        response = await function(**kwargs) if asyncio.iscoroutinefunction(function) else function(**kwargs)
        
        return Message(
            status="success",
            message="Judge has successfully determined end state.",
            data=response
        )
        
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
        
    except TypeError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid arguments provided: {str(e)}"
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Something went wrong on the server side: {str(e)}"
        )
    
    
def target(*, source: str, target: str, regex: Union[str, re.Pattern, None] = None, ignore_case: bool = False):
    if regex is not None:
        if isinstance(regex, str):
            flags = re.IGNORECASE if ignore_case else 0
            regex = re.compile(regex, flags)
        
        result = regex.sub(target, source)
        return result
    else:
        return source.lower() == target.lower() if ignore_case else source == target
    
def get_bad_word():
    return "go fuck your self"



