import uuid
from typing import Any, Optional

from fastapi import HTTPException, status

from api.deps import Session
from api.core.security import get_password_hash, verify_password
from api.models import User, UserRegister

# = User ==============================================================

async def get_user_by_username(*, session: Session, username: str) -> Optional[User]:
    """Retrieve user from database by username.
    
    Args:
        session (Session): Database session
        username (str): Username to look up
        
    Returns:
        Optional[User]: User if found, None otherwise
    """
    user_data = await session.users.find_one({"username": username})
    if user_data:
        return User(**user_data)
    return None


async def create_user(*, session : Session, user_create : UserRegister) -> User:
    """Create new user in database.
    
    Args:
        session (Session): Database session
        user_create (UserRegister): User registration data
        
    Returns:
        User: Created user object
        
    Raises:
        HTTPException: If username already exists
    """
    existing_user = await get_user_by_username(
        session=session, username=user_create.username
    )
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already registered"
        )
        
    hashed_password = get_password_hash(user_create.password)
    user_data = user_create.dict()
    user_data["password"] = hashed_password
    
    result = await session.users.insert_one(user_data)
    user_data["id"] = str(result.inserted_id)
    return User(**user_data)

async def authenticate(*, session : Session, username : str, password : str) -> Optional[User]:
    """_summary_

    Args:
        session (Annotated[AsyncIOMotorDatabase, Depends(get_db)]): _description_
        username (str): _description_
        password (str): _description_

    Returns:
        Optional[User]: _description_
    """
    user = await get_user_by_username(session=session, username=username)
    print(user)
    if user is None:
        return None
    if not verify_password(password, user.password):
        return None
    return user
# =====================================================================


# = Game ==============================================================


# =====================================================================