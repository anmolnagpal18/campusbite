from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.db import connection
from django.core.cache import cache
import logging

logger = logging.getLogger(__name__)

class LivenessProbeView(APIView):
    """ Returns 200 OK if Daphne/WSGI is running. Used for container restarts. """
    permission_classes = []
    
    def get(self, request):
        return Response({"status": "alive"}, status=status.HTTP_200_OK)

class ReadinessProbeView(APIView):
    """ Returns 200 OK if DB and Redis are connected. Used for Load Balancer routing. """
    permission_classes = []
    
    def get(self, request):
        health_status = {"status": "ready", "components": {}}
        is_ready = True
        
        # Check Database
        try:
            with connection.cursor() as cursor:
                cursor.execute("SELECT 1")
                row = cursor.fetchone()
            health_status['components']['database'] = "ok"
        except Exception as e:
            logger.error(f"Readiness Probe: Database failure - {e}")
            health_status['components']['database'] = "failed"
            is_ready = False
            
        # Check Redis Cache
        try:
            cache.set('health_check', 'ok', timeout=1)
            if cache.get('health_check') == 'ok':
                health_status['components']['redis'] = "ok"
            else:
                raise ValueError("Cache retrieved mismatch")
        except Exception as e:
            logger.error(f"Readiness Probe: Redis failure - {e}")
            health_status['components']['redis'] = "failed"
            is_ready = False

        if is_ready:
            return Response(health_status, status=status.HTTP_200_OK)
        return Response(health_status, status=status.HTTP_503_SERVICE_UNAVAILABLE)
