from rest_framework import serializers
from .models import Product, Category, Cart, Order, OrderItem

class CategorySerializer(serializers.ModelSerializer):
    image = serializers.SerializerMethodField()

    class Meta:
        model = Category
        fields = ['id', 'name', 'image']

    def get_image(self, obj):
        if obj.image:
            request = self.context.get('request')
            return request.build_absolute_uri(obj.image.url) if request else obj.image.url
        return None

class ProductSerializer(serializers.ModelSerializer):
    category_name = serializers.ReadOnlyField(source='category.name')
    image = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = ['id', 'name', 'category', 'category_name', 'description', 'price', 'stock', 'image']

    def get_image(self, obj):
        if obj.image:
            request = self.context.get('request')
            return request.build_absolute_uri(obj.image.url) if request else obj.image.url
        return None

class OrderItemSerializer(serializers.ModelSerializer):
    product_image = serializers.SerializerMethodField()

    class Meta:
        model = OrderItem
        fields = ['id', 'product_name', 'quantity', 'unit_price', 'product_image']

    def get_product_image(self, obj):
        if obj.product and obj.product.image:
            request = self.context.get('request')
            return request.build_absolute_uri(obj.product.image.url) if request else obj.product.image.url
        return None

class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)
    created_at = serializers.DateTimeField(format='%b %d, %Y %I:%M %p', read_only=True)

    class Meta:
        model = Order
        fields = ['id', 'created_at', 'status', 'payment_method', 'first_name', 'last_name', 'address', 'city', 'contact', 'notes', 'total', 'items']

class CartSerializer(serializers.ModelSerializer):
    # These fields allow React to show the name and price without making extra API calls
    product_name = serializers.ReadOnlyField(source='product.name')
    product_price = serializers.ReadOnlyField(source='product.price')
    product_image = serializers.SerializerMethodField()

    class Meta:
        model = Cart
        fields = ['id', 'product', 'product_name', 'product_price', 'product_image', 'quantity']

    def get_product_image(self, obj):
        if obj.product.image:
            return self.context['request'].build_absolute_uri(obj.product.image.url)
        return None