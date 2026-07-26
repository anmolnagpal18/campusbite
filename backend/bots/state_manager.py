from accounts.models import BotSession, User

class BotStates:
    START = 'START'
    LOGIN_EMAIL = 'LOGIN_EMAIL'
    LOGIN_PASSWORD = 'LOGIN_PASSWORD'
    MAIN_MENU = 'MAIN_MENU'
    
    SELECT_COLLEGE = 'SELECT_COLLEGE'
    SELECT_AREA = 'SELECT_AREA'
    SELECT_BLOCK = 'SELECT_BLOCK'
    
    SELECT_RESTAURANT = 'SELECT_RESTAURANT'
    SELECT_CATEGORY = 'SELECT_CATEGORY'
    SELECT_ITEM = 'SELECT_ITEM'
    
    VIEW_CART = 'VIEW_CART'
    CHECKOUT = 'CHECKOUT'
    SELECT_ORDER_TYPE = 'SELECT_ORDER_TYPE'
    SELECT_SLOT = 'SELECT_SLOT'
    PAYMENT = 'PAYMENT'
    ORDER_SUCCESS = 'ORDER_SUCCESS'
    EXPIRED = 'EXPIRED'

def get_or_create_session(session_id, platform):
    session, created = BotSession.objects.get_or_create(
        session_id=session_id,
        platform=platform,
        defaults={'state': BotStates.START}
    )
    return session

def verify_session_timeout(session):
    """
    Checks if a session has been inactive for > 30 minutes.
    If so, transitions to EXPIRED state and saves current state for recovery.
    """
    from django.utils import timezone
    if session.state not in (BotStates.START, BotStates.EXPIRED):
        inactive_limit = timezone.timedelta(minutes=30)
        if timezone.now() - session.last_interaction > inactive_limit:
            session.context_data['previous_state'] = session.state
            session.state = BotStates.EXPIRED
            session.save()
            return True
    return False
