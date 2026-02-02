# cancel_views.py (Updated)
from rest_framework.views import APIView
from django.shortcuts import get_object_or_404
from django.db import transaction
# Django Packages
from django.db.models import Q
# Restframework Packages
from rest_framework.response import Response
from rest_framework import generics, status
from rest_framework.permissions import AllowAny
# Serializers
from store.serializers import CartOrderSerializer, CouponSerializer, OrderCancellationSerializer, OrderReturnSerializer
# Models
from userauth.models import User
from store.models import CartOrderItem, Cart, CartOrder, Coupon, OrderCancellation, OrderReturn
# Others Packages
from decimal import Decimal
import logging

log = logging.getLogger(__name__)

class CancelOrderView(APIView):
    permission_classes = [AllowAny]  # Adjust with IsAuthenticated later

    @transaction.atomic
    def post(self, request):
        order_oid = request.data.get('order_oid')
        reason = request.data.get('reason')
        reason_detail = request.data.get('reason_detail', '')
        item_ids = request.data.get('item_ids', [])  # [] = full order
        user_id = request.data.get('user_id')

        if not order_oid or not reason:
            return Response({"error": "Order ID and reason are required"}, status=400)

        # Get the order
        try:
            if user_id:
                order = CartOrder.objects.get(oid=order_oid, buyer__id=user_id)
            else:
                order = CartOrder.objects.get(oid=order_oid)
        except CartOrder.DoesNotExist:
            return Response({"error": "Order not found"}, status=404)

        # Prevent cancellation if order is already in terminal states
        if order.order_status in ['Delivered', 'Returned', 'Cancelled']:
            return Response({"error": "Order cannot be cancelled as it is already in a terminal state"}, status=400)

        is_full = len(item_ids) == 0
        items = CartOrderItem.objects.filter(order=order)

        if not is_full:
            items = items.filter(id__in=item_ids)

        if not items.exists():
            return Response({"error": "No valid items to cancel"}, status=400)

        # NEW: Prevent cancellation of any delivered items
        delivered_items = items.filter(product_delivered=True)
        if delivered_items.exists():
            return Response({
                "error": "Cannot cancel delivered items. Return option is available for delivered items."
            }, status=400)

        # Create cancellation record
        log.info(f"Creating cancellation record. is_full={is_full}, item_count={items.count()}")
        cancellation = OrderCancellation.objects.create(
            order=order,
            cancelled_by=order.buyer,
            reason=reason,
            reason_detail=reason_detail,
            is_full_order=is_full
        )
        log.info(f"Cancellation created with ID: {cancellation.id}")

        # Associate items and mark them as cancelled
        cancellation.items.set(items)
        for item in items:
            item.delivery_status = "Cancelled"
            item.save(update_fields=['delivery_status'])

        log.info(f"Items marked as Cancelled. Item count: {items.count()}")

        # Restore stock
        log.info("Calling restore_stock()")
        cancellation.restore_stock()
        log.info("restore_stock() completed")

        # Update order status if full cancellation
        if is_full:
            order.order_status = "Cancelled"
            order.payment_status = "cancelled"
            order.save()
            log.info(f"Full order marked as cancelled")
        else:
            # For partial: check if ALL items are now cancelled
            total_items = order.orderitem.count()
            cancelled_items_count = order.orderitem.filter(delivery_status="Cancelled").count()
            if cancelled_items_count == total_items:
                order.order_status = "Cancelled"
                order.payment_status = "cancelled"
                order.save()
                log.info(f"All items cancelled - marking entire order as cancelled")

        log.info(f"Order {order_oid} cancellation processed successfully. Full order: {is_full}, Items cancelled: {items.count()}")
        return Response({
            "message": "Order cancellation request submitted successfully",
            "cancellation_id": cancellation.id
        }, status=200)


class ReturnOrderItemView(APIView):
    permission_classes = [AllowAny]

    @transaction.atomic
    def post(self, request):
        item_id = request.data.get('item_id')
        reason = request.data.get('reason')
        reason_detail = request.data.get('reason_detail', '')
        user_id = request.data.get('user_id')

        if not item_id or not reason:
            return Response({"error": "Item ID and reason are required"}, status=400)

        # Get the order item
        try:
            if user_id:
                item = CartOrderItem.objects.get(id=item_id, order__buyer__id=user_id)
            else:
                item = CartOrderItem.objects.get(id=item_id)
        except CartOrderItem.DoesNotExist:
            return Response({"error": "Order item not found"}, status=404)

        # Existing checks (unchanged)
        if not item.product_delivered:
            return Response({"error": "Item must be delivered before return"}, status=400)

        if hasattr(item, 'orderreturn'):
            return Response({"error": "Return already requested"}, status=400)

        # Create return request (unchanged)
        OrderReturn.objects.create(
            order_item=item,
            returned_by=item.order.buyer,
            reason=reason,
            reason_detail=reason_detail
        )
        log.info(f"Return request created for order item {item_id}")
        return Response({"message": "Return request submitted successfully"}, status=200)