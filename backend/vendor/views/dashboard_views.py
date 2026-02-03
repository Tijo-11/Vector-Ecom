# Django Packages
from django.shortcuts import get_object_or_404
from django.db import models
from django.db.models.functions import ExtractMonth
from django.http import Http404
# Restframework Packages
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import generics
from rest_framework.permissions import AllowAny
# Serializers
from store.serializers import (CartOrderItemSerializer, SummarySerializer, ProductSerializer,
            CartOrderSerializer, EarningSummarySerializer, ReviewSerializer)
# Models
from store.models import  CartOrderItem,  Product,  CartOrder,  Review
from vendor.models import Vendor
from django.db.models.functions import ExtractYear, ExtractMonth

## Others Packages
from datetime import datetime, timedelta
from rest_framework.exceptions import ValidationError


class DashboardStatsAPIView(generics.ListAPIView):
    serializer_class = SummarySerializer

    def get_queryset(self):

        vendor_id = self.kwargs['vendor_id']
        vendor = get_object_or_404(Vendor, id=vendor_id)

        # Calculate summary values
        product_count = Product.objects.filter(vendor=vendor).count()
        order_count = CartOrder.objects.filter(
            vendor=vendor, payment_status="paid").count()
        revenue = CartOrderItem.objects.filter(vendor=vendor, order__payment_status="paid").aggregate(
            total_revenue=models.Sum(models.F('sub_total') + models.F('shipping_amount')))['total_revenue'] or 0

        # Return a dummy list as we only need one summary object
        return [{
            'products': product_count,
            'orders': order_count,
            'revenue': revenue
        }]

    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

######Monthly -order views
@api_view(('GET',))
def MonthlyOrderChartAPIFBV(request, vendor_id):
    vendor = get_object_or_404(Vendor,id=vendor_id)
    orders = CartOrder.objects.filter(vendor=vendor)
    orders_by_month = orders.annotate(month=ExtractMonth("date")).values(
        "month").annotate(orders=models.Count("id")).order_by("month")
    return Response(orders_by_month)
######-----Monthly Product (Cumulative Total)
@api_view(('GET',))
def MonthlyProductsChartAPIFBV(request, vendor_id):
    """
    Returns cumulative total products for each month.
    Shows growth of total products over time.
    """
    vendor = get_object_or_404(Vendor, id=vendor_id)
    
    # Get products with their creation dates
    products = Product.objects.filter(vendor=vendor).annotate(
        year=ExtractYear("date"),
        month=ExtractMonth("date")
    ).values("year", "month").annotate(
        count=models.Count("id")
    ).order_by("year", "month")
    
    # Convert to cumulative totals
    cumulative_data = []
    running_total = 0
    
    for item in products:
        running_total += item['count']
        cumulative_data.append({
            'month': item['month'],
            'year': item['year'],
            'orders': running_total  # Keep 'orders' key for frontend compatibility
        })
    
    return Response(cumulative_data)

#Products
class ProductsAPIView(generics.ListAPIView):
    serializer_class = ProductSerializer
    permission_classes = (AllowAny,)

    def get_queryset(self):
        vendor_id = self.kwargs['vendor_id']
        vendor = get_object_or_404(Vendor, id=vendor_id)
        products = Product.objects.filter(vendor=vendor)
        return products
    
#Orders
class OrdersAPIView(generics.ListAPIView):
    serializer_class = CartOrderSerializer
    permission_classes = (AllowAny,)

    def get_queryset(self):
        vendor_id = self.kwargs['vendor_id']
        vendor = get_object_or_404(Vendor,id=vendor_id)
        orders = CartOrder.objects.filter(vendor=vendor, payment_status="paid")
        return orders
    
#Revenue
class RevenueAPIView(generics.ListAPIView):
    serializer_class = CartOrderItemSerializer
    permission_classes = (AllowAny,)

    def get_queryset(self):
        vendor_id = self.kwargs['vendor_id']
        vendor = get_object_or_404(Vendor,id=vendor_id)
        revenue = CartOrderItem.objects.filter(vendor=vendor, order__payment_status="paid").aggregate(
            total_revenue=models.Sum(models.F('sub_total') + models.F('shipping_amount')))['total_revenue'] or 0
        return revenue
    
#OrderDetail
class OrderDetailAPIView(generics.RetrieveAPIView):
    serializer_class = CartOrderSerializer
    permission_classes = (AllowAny,)

    def get_object(self):
        vendor_id = self.kwargs['vendor_id']
        order_oid = self.kwargs['order_oid']
        
        try:
            vendor = Vendor.objects.get(id=int(vendor_id))
        except (ValueError, TypeError):
            raise ValidationError("Invalid vendor ID provided.")
        except Vendor.DoesNotExist:
            raise Http404("Vendor not found.")
        
        try:
            order = CartOrder.objects.get(vendor=vendor, payment_status="paid", oid=order_oid)
        except CartOrder.DoesNotExist:
            raise Http404("Order not found.")
        
        return order
    
##------Earning
class Earning(generics.ListAPIView):
    serializer_class = EarningSummarySerializer

    def get_queryset(self):

        vendor_id = self.kwargs['vendor_id']
        vendor = Vendor.objects.get(id=vendor_id)

        one_month_ago = datetime.today() - timedelta(days=30)
        monthly_revenue = CartOrderItem.objects.filter(vendor=vendor, order__payment_status="paid", date__gte=one_month_ago).aggregate(
            total_revenue=models.Sum(models.F('sub_total') + models.F('shipping_amount')))['total_revenue'] or 0
        total_revenue = CartOrderItem.objects.filter(vendor=vendor, order__payment_status="paid").aggregate(
            total_revenue=models.Sum(models.F('sub_total') + models.F('shipping_amount')))['total_revenue'] or 0

        return [{
            'monthly_revenue': monthly_revenue,
            'total_revenue': total_revenue,
        }]
# Handles GET requests to list all objects
    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()# Fetches filtered queryset 
        serializer = self.get_serializer(queryset, many=True)# Serializes multiple objects
        return Response(serializer.data) # Returns serialized data as JSON response




@api_view(('GET',))
def MonthlyEarningTracker(request, vendor_id):
    vendor = Vendor.objects.get(id=vendor_id)
    monthly_earning_tracker = (
        CartOrderItem.objects
        .filter(vendor=vendor, order__payment_status="paid")
        .annotate(
            year=ExtractYear("date"),
            month=ExtractMonth("date")
        )
        .values("year", "month")
        .annotate(
            sales_count=models.Sum("qty"),
            total_earning=models.Sum(models.F('sub_total') + models.F('shipping_amount'))
        )
        .order_by("-year", "-month")  # Newest first
    )
    return Response(monthly_earning_tracker)

##-------- Reviews

class ReviewsListAPIView(generics.ListAPIView):
    serializer_class = ReviewSerializer
    permission_classes = (AllowAny,)

    def get_queryset(self):
        vendor_id = self.kwargs['vendor_id']
        vendor = Vendor.objects.get(id=vendor_id)
        reviews = Review.objects.filter(product__vendor=vendor)
        return reviews


class ReviewsDetailAPIView(generics.RetrieveUpdateAPIView):
    serializer_class = ReviewSerializer
    permission_classes = (AllowAny,)

    def get_object(self):
        vendor_id = self.kwargs['vendor_id']
        review_id = self.kwargs['review_id']

        vendor = Vendor.objects.get(id=vendor_id)
        review = Review.objects.get(product__vendor=vendor, id=review_id)
        return review
    
class YearlyOrderReportChartAPIView(generics.ListAPIView):
    serializer_class = CartOrderItemSerializer
    permission_classes = (AllowAny,)

    def get_queryset(self):
        vendor_id = self.kwargs['vendor_id']
        vendor = Vendor.objects.get(id=vendor_id)

        # Include the 'product' field in the queryset
        report = CartOrderItem.objects.filter(
            vendor=vendor,
            order__payment_status="paid"
        ).select_related('product').values(
            'order__date', 'product'
        ).annotate(models.Count('id'))

        return report
    
####Order filter
class FilterOrderAPIView(generics.ListAPIView):
    serializer_class = CartOrderSerializer
    permission_classes = (AllowAny,)
    
    def get_queryset(self):
        vendor_id = self.kwargs['vendor_id']
        vendor = Vendor.objects.get(id=vendor_id)
        
        filter = self.request.GET.get("filter")
        if filter == 'paid':
            orders = CartOrder.objects.filter(vendor=vendor, payment_status = "paid").order_by("-id")
        elif filter == 'pending':
            orders = CartOrder.objects.filter(vendor=vendor, payment_status = "pending").order_by("-id")
        elif filter == 'processing':
            orders = CartOrder.objects.filter(vendor=vendor, payment_status = "processing").order_by("-id")
        elif filter == 'cancelled':
            orders = CartOrder.objects.filter(vendor=vendor, payment_status = "cancelled").order_by("-id")
        elif filter == 'latest':
            orders = CartOrder.objects.filter(vendor=vendor).order_by("-id")
        elif filter == 'oldest':
            orders = CartOrder.objects.filter(vendor=vendor).order_by("id")
        elif filter == 'Fulfilled':
            orders = CartOrder.objects.filter(vendor=vendor,payment_status = "paid", order_status="Fulfilled").order_by("-id")
        elif filter == 'Cancelled':
            orders = CartOrder.objects.filter(vendor=vendor,payment_status = "paid", order_status="Cancelled").order_by("-id")
        elif filter == 'Pending':
            orders = CartOrder.objects.filter(vendor=vendor,payment_status = "paid", order_status="Pending").order_by("-id")
        else:
            orders = CartOrder.objects.filter(vendor=vendor).order_by("id")
        return orders
            
        
    
    



    
