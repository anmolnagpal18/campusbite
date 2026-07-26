from django.urls import path
from ordering.views import (
    UserCollegesListView, UserAreasListView, UserBlocksListView,
    UserRestaurantsListView, UserRestaurantDetailView, CartView, CartItemDeleteView,
    CheckoutView, OrdersView, OrderDetailView, OrdersStatusUpdateView,
    ScanQRView, NotificationsView, NotificationsMarkReadView, NotificationDeleteView
)

urlpatterns = [
    path('user/colleges/', UserCollegesListView.as_view(), name='user-colleges'),
    path('user/areas/', UserAreasListView.as_view(), name='user-areas'),
    path('user/blocks/', UserBlocksListView.as_view(), name='user-blocks'),
    path('user/restaurants/', UserRestaurantsListView.as_view(), name='user-restaurants'),
    path('user/restaurants/<int:id>/', UserRestaurantDetailView.as_view(), name='user-restaurant-detail'),
    
    path('cart/', CartView.as_view(), name='cart-details'),
    path('cart/item/<int:id>/', CartItemDeleteView.as_view(), name='cart-item-delete'),
    
    path('checkout/', CheckoutView.as_view(), name='checkout'),
    
    path('orders/', OrdersView.as_view(), name='orders-list'),
    path('orders/<int:id>/', OrderDetailView.as_view(), name='order-detail'),
    path('orders/status/', OrdersStatusUpdateView.as_view(), name='order-status-update'),
    
    path('scan-qr/', ScanQRView.as_view(), name='scan-qr'),
    
    path('notifications/', NotificationsView.as_view(), name='notifications-list'),
    path('notifications/read/', NotificationsMarkReadView.as_view(), name='notifications-mark-read'),
    path('notifications/<int:pk>/', NotificationDeleteView.as_view(), name='notification-delete'),
]
