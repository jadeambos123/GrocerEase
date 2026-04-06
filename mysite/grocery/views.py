from django.contrib.auth.models import User
from django.db import transaction  # ADDED: For data integrity
from django.db.models import F     # ADDED: For safe stock subtraction
from rest_framework import status
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated

# Import your models and serializers
from .models import Product, Cart, Category, Order, OrderItem, UserProfile
from .serializers import ProductSerializer, CartSerializer, CategorySerializer, OrderSerializer

# --- 1. AUTHENTICATION & REGISTRATION ---

@api_view(['POST'])
def register_user(request):
    username = request.data.get('username')
    password = request.data.get('password')
    email = request.data.get('email')

    if not username or not password:
        return Response({'error': 'Username and password required'}, status=status.HTTP_400_BAD_REQUEST)

    if User.objects.filter(username=username).exists():
        return Response({'error': 'Username already taken'}, status=status.HTTP_400_BAD_REQUEST)

    user = User.objects.create_user(username=username, password=password, email=email)
    return Response({'message': 'User created successfully'}, status=status.HTTP_201_CREATED)


# --- 2. PRODUCT & CATEGORY BROWSING ---

@api_view(['GET'])
def get_products(request):
    category_id = request.query_params.get('category')
    if category_id:
        products = Product.objects.filter(category_id=category_id)
    else:
        products = Product.objects.all()
        
    serializer = ProductSerializer(products, many=True, context={'request': request})
    return Response(serializer.data)

@api_view(['GET'])
def get_categories(request):
    categories = Category.objects.all()
    serializer = CategorySerializer(categories, many=True, context={'request': request})
    return Response(serializer.data)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_orders(request):
    orders = Order.objects.filter(user=request.user).order_by('-created_at')
    serializer = OrderSerializer(orders, many=True, context={'request': request})
    return Response(serializer.data)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def place_order(request):
    user = request.user
    first_name = request.data.get('first_name')
    last_name = request.data.get('last_name')
    address = request.data.get('address')
    city = request.data.get('city')
    contact = request.data.get('contact')
    notes = request.data.get('notes', '')
    payment_method = request.data.get('payment_method', 'cod')

    if not all([first_name, last_name, address, city, contact, payment_method]):
        return Response({'error': 'Please fill in all required fields.'}, status=status.HTTP_400_BAD_REQUEST)

    cart_items = Cart.objects.filter(user=user)
    if not cart_items.exists():
        return Response({'error': 'Your cart is empty.'}, status=status.HTTP_400_BAD_REQUEST)

    # Wrap in a transaction to ensure stock is only deducted if order is fully created
    try:
        with transaction.atomic():
            total = sum(item.quantity * item.product.price for item in cart_items)
            
            # Create the main order record
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

                # --- NEW STOCK VALIDATION ---
                if product.stock < item.quantity:
                    # Raising an exception inside atomic() will roll back the Order creation
                    raise ValueError(f"Not enough stock for {product.name}")

                # Create the individual order item
                OrderItem.objects.create(
                    order=order,
                    product=product,
                    product_name=product.name,
                    quantity=item.quantity,
                    unit_price=product.price,
                )

                # --- UPDATED STOCK LOGIC ---
                # Subtract quantity from the Product model
                product.stock = F('stock') - item.quantity
                product.save()

            # Clear user's cart after successful transaction
            cart_items.delete()

        return Response({'message': 'Order placed successfully.', 'order_id': order.id}, status=status.HTTP_201_CREATED)

    except ValueError as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        return Response({'error': 'An error occurred while processing your order.'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

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

# --- 4. PROFILE & CART HELPERS ---

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_profile(request):
    user = request.user
    profile, _ = UserProfile.objects.get_or_create(user=user)
    profile_image = None
    if profile.image:
        profile_image = request.build_absolute_uri(profile.image.url)
    return Response({
        'username': user.username,
        'email': user.email,
        'first_name': user.first_name,
        'last_name': user.last_name,
        'date_joined': user.date_joined,
        'profile_image': profile_image,
    })

@api_view(['PUT', 'PATCH'])
@permission_classes([IsAuthenticated])
def update_profile(request):
    user = request.user
    profile, _ = UserProfile.objects.get_or_create(user=user)
    first_name = request.data.get('first_name', user.first_name)
    last_name = request.data.get('last_name', user.last_name)
    email = request.data.get('email', user.email)

    if not first_name or not last_name or not email:
        return Response({'error': 'First name, last name, and email are required.'}, status=status.HTTP_400_BAD_REQUEST)

    if User.objects.filter(email=email).exclude(id=user.id).exists():
        return Response({'error': 'Email is already in use.'}, status=status.HTTP_400_BAD_REQUEST)

    profile_image = request.FILES.get('profile_image')
    if profile_image:
        profile.image = profile_image
        profile.save()

    user.first_name = first_name
    user.last_name = last_name
    user.email = email
    user.save()

    profile_image_url = None
    if profile.image:
        profile_image_url = request.build_absolute_uri(profile.image.url)

    return Response({
        'username': user.username,
        'email': user.email,
        'first_name': user.first_name,
        'last_name': user.last_name,
        'date_joined': user.date_joined,
        'profile_image': profile_image_url,
    })

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
    quantity = request.data.get('quantity', 1)

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
