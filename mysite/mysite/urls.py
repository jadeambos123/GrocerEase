from django.contrib import admin
from django.urls import path, re_path
from django.conf import settings
from django.conf.urls.static import static
from django.http import JsonResponse
from django.views.static import serve
from grocery import views as grocery_views

def home(request):
    return JsonResponse({
        'message': 'Grocery API is running',
        'backend': 'Render',
    })

urlpatterns = [
    path('', home),
    path('admin/', admin.site.urls),

    # ── Products & Categories ─────────────────────────────────────────────
    path('api/products/',    grocery_views.get_products,   name='get-products'),
    path('api/categories/',  grocery_views.get_categories, name='get-categories'),

    # ── Authentication ────────────────────────────────────────────────────
    path('api/register/',    grocery_views.register_user,        name='register-user'),
    path('api-token-auth/',  grocery_views.CustomAuthToken.as_view(), name='api-token-auth'),

    # ── Orders ────────────────────────────────────────────────────────────
    path('api/orders/',                             grocery_views.get_orders,    name='get-orders'),
    path('api/orders/place/',                       grocery_views.place_order,   name='place-order'),
    path('api/orders/<int:order_id>/reorder/',      grocery_views.reorder_order, name='reorder-order'),

    # ── Profile ───────────────────────────────────────────────────────────
    path('api/profile/',         grocery_views.get_profile,    name='get-profile'),
    path('api/profile/update/',  grocery_views.update_profile, name='update-profile'),

    # ── Cart ──────────────────────────────────────────────────────────────
    path('api/cart/',                           grocery_views.get_cart,          name='get-cart'),
    path('api/cart/add/',                       grocery_views.add_to_cart,       name='add-to-cart'),
    path('api/cart/remove/<int:cart_id>/',      grocery_views.remove_from_cart,  name='remove-from-cart'),

    # ── Admin ─────────────────────────────────────────────────────────────
    path('api/admin/stats/',                            grocery_views.admin_stats,          name='admin-stats'),
    path('api/admin/users/',                            grocery_views.admin_list_users,     name='admin-list-users'),
    path('api/admin/users/<int:user_id>/',              grocery_views.admin_update_user,    name='admin-update-user'),
    path('api/admin/orders/',                           grocery_views.admin_list_orders,    name='admin-list-orders'),
    path('api/admin/orders/<int:order_id>/',            grocery_views.admin_update_order,   name='admin-update-order'),
    path('api/admin/products/',                         grocery_views.admin_products,       name='admin-products'),
    path('api/admin/products/<int:product_id>/',        grocery_views.admin_product_detail, name='admin-product-detail'),

    re_path(r'^media/(?P<path>.*)$', serve, {'document_root': settings.MEDIA_ROOT}),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
