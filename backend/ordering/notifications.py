from ordering.models import Notification
from bots.notification import send_bot_notification

def create_notification(user, title, message, notification_type=Notification.NotificationType.SYSTEM):
    """
    Creates and saves a database notification for the user.
    Types can be ORDER, PAYMENT, SYSTEM, MESSAGE.
    """
    note = Notification.objects.create(
        user=user,
        title=title,
        message=message,
        notification_type=notification_type
    )
    
    # Pluggable multi-channel bot dispatch
    try:
        send_bot_notification(user, title, message, notification=note)
    except Exception:
        pass
        
    return note
