from django.contrib import admin
from django.urls import path, re_path
from django.conf import settings
from django.conf.urls.static import static
from django.http import JsonResponse
from django.views.static import serve
from grocery import views as grocery_views
from .views import CustomAuthToken

def home(request):
    return JsonResponse({
        'message': 'Grocery API is running',
        'backend': 'Render',
    })

urlpatterns = [
    path('', home),
    path('admin/', admin.site.urls),
    
    # Products & Categories
    path('api/products/', grocery_views.get_products, name='get-products'),
    path('api/categories/', grocery_views.get_categories, name='get-categories'),
    
    # Authentication
    path('api/register/', grocery_views.register_user, name='register-user'),
    
    # UPDATED: Use the custom view from grocery_views
    path('api-token-auth/', grocery_views.CustomAuthToken.as_view(), name='api-token-auth'),

    # Orders & profile
    path('api/orders/', grocery_views.get_orders, name='get-orders'),
    path('api/orders/place/', grocery_views.place_order, name='place-order'),
    path('api/orders/<int:order_id>/reorder/', grocery_views.reorder_order, name='reorder-order'),
    path('api/profile/', grocery_views.get_profile, name='get-profile'),
    path('api/profile/update/', grocery_views.update_profile, name='update-profile'),
    
    # Cart
    path('api/cart/', grocery_views.get_cart, name='get-cart'),
    path('api/cart/add/', grocery_views.add_to_cart, name='add-to-cart'),
    path('api/cart/remove/<int:cart_id>/', grocery_views.remove_from_cart, name='remove-from-cart'),
    
    re_path(r'^media/(?P<path>.*)$', serve, {'document_root': settings.MEDIA_ROOT})
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)