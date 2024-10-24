from datetime import datetime, timedelta, timezone
from typing import Any

import jwt
from passlib.context import CryptContext

from api.core.config import settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


ALGORITHM = "HS256"


def create_access_token(subject: str | Any, expires_delta: timedelta) -> str:
    """Creating an access token

    Args:
        subject (str | Any): extra information 
        expires_delta (timedelta): expiry date to when the token is not valid

    Returns:
        str: _description_
    """
    expire = datetime.now(timezone.utc) + expires_delta
    to_encode = {"exp": expire, "sub": str(subject)}
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """verify plaintext with cyphered-text

    Args:
        plain_password (str): un-hashed string
        hashed_password (str): hashed string

    Returns:
        bool: True if the hash-password is equal to the un-hashed password, else False
    """
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    """ return hash password """
    return pwd_context.hash(password)