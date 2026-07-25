from rest_framework.views import exception_handler
from rest_framework.response import Response
from rest_framework import status
import logging

logger = logging.getLogger('api')

def standardized_exception_handler(exc, context):
    logger.exception("An exception occurred in view handler:")
    
    response = exception_handler(exc, context)

    if response is None:
        response = Response(
            {"detail": "An internal server error occurred."},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
        
    return response
