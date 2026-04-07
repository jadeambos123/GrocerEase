from django.contrib.auth.models import User
from django.db import transaction
from django.db.models import F, Sum
from rest_framework import status
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from rest_framework.authtoken.views import ObtainAuthToken
from rest_framework.authtoken.models import Token

from .models import Product, Cart, Category, Order, OrderItem, UserProfile
from .serializers import ProductSerializer, CartSerializer, CategorySerializer, OrderSerializer


# ─────────────────────────────────────────────────────────────────────────────
# CUSTOM AUTH TOKEN  — returns is_staff and user_id alongside token
# ─────────────────────────────────────────────────────────────────────────────

class CustomAuthToken(ObtainAuthToken):
    def post(self, request, *args, **kwargs):
        serializer = self.serializer_class(data=request.data,
                                           context={'request': request})
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data['user']
        token, created = Token.objects.get_or_create(user=user)
        return Response({
            'token': token.key,
            'user_id': user.pk,
            'is_staff': user.is_staff,
            'username': user.username,
        })


# ─────────────────────────────────────────────────────────────────────────────
# 1. AUTHENTICATION & REGISTRATION
# ─────────────────────────────────────────────────────────────────────────────

@api_view(['POST'])
def register_user(request):
    username   = request.data.get('username')
    password   = request.data.get('password')
    email      = request.data.get('email')
    first_name = request.data.get('first_name', '')
    last_name  = request.data.get('last_name', '')

    if not username or not password:
        return Response({'error': 'Username and password required'},
                        status=status.HTTP_400_BAD_REQUEST)

    if User.objects.filter(username=username).exists():
        return Response({'error': 'Username already taken'},
                        status=status.HTTP_400_BAD_REQUEST)

    user = User.objects.create_user(
        username=username,
        password=password,
        email=email,
        first_name=first_name,
        last_name=last_name,
    )
    return Response({'message': 'User created successfully'}, status=status.HTTP_201_CREATED)


# ─────────────────────────────────────────────────────────────────────────────
# 2. PRODUCT & CATEGORY BROWSING
# ─────────────────────────────────────────────────────────────────────────────

@api_view(['GET'])
def get_products(request):
    category_id = request.query_params.get('category')
    products = Product.objects.filter(category_id=category_id) if category_id else Product.objects.all()
    serializer = ProductSerializer(products, many=True, context={'request': request})
    return Response(serializer.data)


@api_view(['GET'])
def get_categories(request):
    categories = Category.objects.all()
    serializer = CategorySerializer(categories, many=True, context={'request': request})
    return Response(serializer.data)


# ─────────────────────────────────────────────────────────────────────────────
# 3. ORDERS
# ─────────────────────────────────────────────────────────────────────────────

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_orders(request):
    orders = Order.objects.filter(user=request.user).order_by('-created_at')
    serializer = OrderSerializer(orders, many=True, context={'request': request})
    return Response(serializer.data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def place_order(request):
    user           = request.user
    first_name     = request.data.get('first_name')
    last_name      = request.data.get('last_name')
    address        = request.data.get('address')
    city           = request.data.get('city')
    contact        = request.data.get('contact')
    notes          = request.data.get('notes', '')
    payment_method = request.data.get('payment_method', 'cod')

    if not all([first_name, last_name, address, city, contact, payment_method]):
        return Response({'error': 'Please fill in all required fields.'},
                        status=status.HTTP_400_BAD_REQUEST)

    cart_items = Cart.objects.filter(user=user)
    if not cart_items.exists():
        return Response({'error': 'Your cart is empty.'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        with transaction.atomic():
            total = sum(item.quantity * item.product.price for item in cart_items)

            order = Order.objects.create(
                user=user,
                first_name=first_name,
                last_name=last_name,
                address=address,
                city=city,
                contact=contact,
                notes=notes,
                payment_method=payment_method,
                total=total,
            )

            for item in cart_items:
                product = item.product
                if product.stock < item.quantity:
                    raise ValueError(f"Not enough stock for {product.name}")

                OrderItem.objects.create(
                    order=order,
                    product=product,
                    product_name=product.name,
                    quantity=item.quantity,
                    unit_price=product.price,
                )
                product.stock = F('stock') - item.quantity
                product.save()

            cart_items.delete()

        return Response({'message': 'Order placed successfully.', 'order_id': order.id},
                        status=status.HTTP_201_CREATED)

    except ValueError as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
    except Exception:
        return Response({'error': 'An error occurred while processing your order.'},
                        status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def reorder_order(request, order_id):
    try:
        order = Order.objects.get(id=order_id, user=request.user)
    except Order.DoesNotExist:
        return Response({'error': 'Order not found.'}, status=status.HTTP_404_NOT_FOUND)

    for item in order.items.all():
        if not item.product:
            continue
        cart_item, created = Cart.objects.get_or_create(
            user=request.user,
            product=item.product,
            defaults={'quantity': item.quantity}
        )
        if not created:
            cart_item.quantity += item.quantity
            cart_item.save()

    return Response({'message': 'Order items added to your cart.'}, status=status.HTTP_200_OK)


# ─────────────────────────────────────────────────────────────────────────────
# 4. PROFILE
# ─────────────────────────────────────────────────────────────────────────────

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_profile(request):
    user = request.user
    profile, _ = UserProfile.objects.get_or_create(user=user)
    profile_image = request.build_absolute_uri(profile.image.url) if profile.image else None
    return Response({
        'username':     user.username,
        'email':        user.email,
        'first_name':   user.first_name,
        'last_name':    user.last_name,
        'date_joined':  user.date_joined,
        'is_staff':     user.is_staff,
        'profile_image': profile_image,
    })


@api_view(['PUT', 'PATCH'])
@permission_classes([IsAuthenticated])
def update_profile(request):
    user = request.user
    profile, _ = UserProfile.objects.get_or_create(user=user)

    first_name = request.data.get('first_name', user.first_name)
    last_name  = request.data.get('last_name',  user.last_name)
    email      = request.data.get('email',       user.email)

    if not first_name or not last_name or not email:
        return Response({'error': 'First name, last name, and email are required.'},
                        status=status.HTTP_400_BAD_REQUEST)

    if User.objects.filter(email=email).exclude(id=user.id).exists():
        return Response({'error': 'Email is already in use.'}, status=status.HTTP_400_BAD_REQUEST)

    profile_image = request.FILES.get('profile_image')
    if profile_image:
        profile.image = profile_image
        profile.save()

    user.first_name = first_name
    user.last_name  = last_name
    user.email      = email
    user.save()

    profile_image_url = request.build_absolute_uri(profile.image.url) if profile.image else None
    return Response({
        'username':      user.username,
        'email':         user.email,
        'first_name':    user.first_name,
        'last_name':     user.last_name,
        'date_joined':   user.date_joined,
        'profile_image': profile_image_url,
    })


# ─────────────────────────────────────────────────────────────────────────────
# 5. CART
# ─────────────────────────────────────────────────────────────────────────────

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_cart(request):
    cart_items = Cart.objects.filter(user=request.user)
    serializer = CartSerializer(cart_items, many=True, context={'request': request})
    return Response(serializer.data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def add_to_cart(request):
    product_id = request.data.get('product_id')
    quantity   = request.data.get('quantity', 1)

    try:
        product = Product.objects.get(id=product_id)
        cart_item, created = Cart.objects.get_or_create(
            user=request.user,
            product=product,
            defaults={'quantity': quantity}
        )
        if not created:
            cart_item.quantity += int(quantity)
            cart_item.save()
        return Response({'message': 'Added to cart'}, status=status.HTTP_201_CREATED)
    except Product.DoesNotExist:
        return Response({'error': 'Product not found'}, status=status.HTTP_404_NOT_FOUND)


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def remove_from_cart(request, cart_id):
    try:
        item = Cart.objects.get(id=cart_id, user=request.user)
        item.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
    except Cart.DoesNotExist:
        return Response(status=status.HTTP_404_NOT_FOUND)


# ─────────────────────────────────────────────────────────────────────────────
# 6. ADMIN — all views require is_staff
# ─────────────────────────────────────────────────────────────────────────────

def admin_required(view_func):
    """Decorator: must be authenticated AND is_staff."""
    @permission_classes([IsAuthenticated])
    def wrapped(request, *args, **kwargs):
        if not request.user.is_staff:
            return Response({'error': 'Admin access required.'},
                            status=status.HTTP_403_FORBIDDEN)
        return view_func(request, *args, **kwargs)
    return wrapped


# ── Stats ────────────────────────────────────────────────────────────────────

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def admin_stats(request):
    if not request.user.is_staff:
        return Response({'error': 'Admin access required.'}, status=status.HTTP_403_FORBIDDEN)

    total_revenue = Order.objects.aggregate(total=Sum('total'))['total'] or 0

    return Response({
        'users':    User.objects.count(),
        'products': Product.objects.count(),
        'orders':   Order.objects.count(),
        'revenue':  str(round(total_revenue, 2)),
    })


# ── Users ────────────────────────────────────────────────────────────────────

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def admin_list_users(request):
    if not request.user.is_staff:
        return Response({'error': 'Admin access required.'}, status=status.HTTP_403_FORBIDDEN)

    users = User.objects.all().order_by('-date_joined')
    data = [
        {
            'id':          u.id,
            'username':    u.username,
            'email':       u.email,
            'first_name':  u.first_name,
            'last_name':   u.last_name,
            'is_staff':    u.is_staff,
            'is_active':   u.is_active,
            'date_joined': u.date_joined,
        }
        for u in users
    ]
    return Response(data)


@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def admin_update_user(request, user_id):
    if not request.user.is_staff:
        return Response({'error': 'Admin access required.'}, status=status.HTTP_403_FORBIDDEN)

    try:
        user = User.objects.get(id=user_id)
    except User.DoesNotExist:
        return Response({'error': 'User not found.'}, status=status.HTTP_404_NOT_FOUND)

    # Prevent admin from deactivating themselves
    if user == request.user:
        return Response({'error': 'You cannot modify your own account here.'},
                        status=status.HTTP_400_BAD_REQUEST)

    if 'is_active' in request.data:
        user.is_active = request.data['is_active']
    if 'is_staff' in request.data:
        user.is_staff = request.data['is_staff']

    user.save()
    return Response({'message': 'User updated.', 'is_active': user.is_active, 'is_staff': user.is_staff})


# ── Orders (admin) ───────────────────────────────────────────────────────────

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def admin_list_orders(request):
    if not request.user.is_staff:
        return Response({'error': 'Admin access required.'}, status=status.HTTP_403_FORBIDDEN)

    orders = Order.objects.all().order_by('-created_at')
    serializer = OrderSerializer(orders, many=True, context={'request': request})
    return Response(serializer.data)


@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def admin_update_order(request, order_id):
    if not request.user.is_staff:
        return Response({'error': 'Admin access required.'}, status=status.HTTP_403_FORBIDDEN)

    try:
        order = Order.objects.get(id=order_id)
    except Order.DoesNotExist:
        return Response({'error': 'Order not found.'}, status=status.HTTP_404_NOT_FOUND)

    new_status = request.data.get('status')
    valid_statuses = ['pending', 'confirmed', 'delivering', 'delivered', 'cancelled']

    if new_status and new_status not in valid_statuses:
        return Response({'error': f'Invalid status. Choose from: {valid_statuses}'},
                        status=status.HTTP_400_BAD_REQUEST)

    if new_status:
        order.status = new_status
    order.save()

    serializer = OrderSerializer(order, context={'request': request})
    return Response(serializer.data)


# ── Products (admin CRUD) ────────────────────────────────────────────────────

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def admin_products(request):
    if not request.user.is_staff:
        return Response({'error': 'Admin access required.'}, status=status.HTTP_403_FORBIDDEN)

    if request.method == 'GET':
        products = Product.objects.all().order_by('-id')
        serializer = ProductSerializer(products, many=True, context={'request': request})
        return Response(serializer.data)

    # POST — create new product
    serializer = ProductSerializer(data=request.data, context={'request': request})
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET', 'PUT', 'DELETE'])
@permission_classes([IsAuthenticated])
def admin_product_detail(request, product_id):
    if not request.user.is_staff:
        return Response({'error': 'Admin access required.'}, status=status.HTTP_403_FORBIDDEN)

    try:
        product = Product.objects.get(id=product_id)
    except Product.DoesNotExist:
        return Response({'error': 'Product not found.'}, status=status.HTTP_404_NOT_FOUND)

    if request.method == 'GET':
        serializer = ProductSerializer(product, context={'request': request})
        return Response(serializer.data)

    if request.method == 'PUT':
        serializer = ProductSerializer(product, data=request.data,
                                       context={'request': request}, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    if request.method == 'DELETE':
        product.delete()
        return Response({'message': 'Product deleted.'}, status=status.HTTP_204_NO_CONTENT)
