from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from .views import RegisterView, CustomTokenObtainPairView, LogoutView, ProfileView

urlpatterns = [
    path('auth/register/', RegisterView.as_view(), name='auth_register'),
    path('auth/login/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('auth/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('auth/logout/', LogoutView.as_view(), name='auth_logout'),
    path('users/me/', ProfileView.as_view(), name='user_profile'),
]
