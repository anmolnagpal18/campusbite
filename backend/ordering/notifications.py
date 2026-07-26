from ordering.models import Notification

def create_notification(user, title, message, notification_type=Notification.NotificationType.SYSTEM):
    """
    Creates and saves a database notification for the user.
    Types can be ORDER, PAYMENT, SYSTEM, MESSAGE.
    """
    return Notification.objects.create(
        user=user,
        title=title,
        message=message,
        notification_type=notification_type
    )
