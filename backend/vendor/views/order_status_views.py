# vendor/views/order_status_views.py
"""
Views for vendor order status management and return request handling.
"""
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import generics, status
from rest_framework.permissions import AllowAny
from django.shortcuts import get_object_or_404
from django.db import transaction
import logging

from store.models import CartOrderItem, OrderReturn
from store.serializers import CartOrderItemSerializer, OrderReturnSerializer
from vendor.models import Vendor

log = logging.getLogger(__name__)


class UpdateOrderStatusView(APIView):
    """
    Allows vendors to update the delivery status of an order item.
    PUT /vendor/order-item-status/<pk>/
    """
    permission_classes = [AllowAny]  # TODO: Add vendor authentication

    def put(self, request, pk):
        try:
            order_item = CartOrderItem.objects.get(id=pk)
        except CartOrderItem.DoesNotExist:
            return Response(
                {"error": "Order item not found"},
                status=status.HTTP_404_NOT_FOUND
            )

        if order_item.delivery_status == "Cancelled":
            return Response(
                {"error": "Cannot update status of a cancelled order."},
                status=status.HTTP_400_BAD_REQUEST
            )

        new_status = request.data.get('delivery_status')
        valid_statuses = [
            "On Hold", "Shipping Processing", "Shipped", 
            "Out for Delivery", "Arrived", "Delivered", 
            "Return Requested", "Returning", "Returned", "Cancelled"
        ]

        if not new_status:
            return Response(
                {"error": "delivery_status is required"},
                status=status.HTTP_400_BAD_REQUEST
            )

        if new_status not in valid_statuses:
            return Response(
                {"error": f"Invalid status. Must be one of: {valid_statuses}"},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Update status
        order_item.delivery_status = new_status

        # Update boolean flags based on status
        if new_status == "Shipped":
            order_item.product_shipped = True
        elif new_status in ["Arrived", "Out for Delivery"]:
            order_item.product_arrived = True
        elif new_status == "Delivered":
            order_item.product_delivered = True
            order_item.product_shipped = True
            order_item.product_arrived = True

        order_item.save()

        log.info(f"Order item {pk} status updated to '{new_status}'")

        serializer = CartOrderItemSerializer(order_item, context={'request': request})
        return Response({
            "message": f"Status updated to '{new_status}'",
            "data": serializer.data
        }, status=status.HTTP_200_OK)


class VendorReturnRequestsListView(generics.ListAPIView):
    """
    Lists all return requests for a vendor's products.
    GET /vendor/return-requests/<vendor_id>/
    Optional query params: ?status=pending|approved|rejected
    """
    serializer_class = OrderReturnSerializer
    permission_classes = [AllowAny]  # TODO: Add vendor authentication

    def get_queryset(self):
        vendor_id = self.kwargs.get('vendor_id')
        queryset = OrderReturn.objects.filter(
            order_item__vendor__id=vendor_id
        ).select_related('order_item', 'order_item__product', 'order_item__order')
        
        # Filter by status if provided
        status_filter = self.request.query_params.get('status')
        if status_filter in ['pending', 'approved', 'rejected']:
            queryset = queryset.filter(status=status_filter)
        
        return queryset.order_by('-requested_at')


class HandleReturnRequestView(APIView):
    """
    Allows vendors to accept or reject a return request.
    POST /vendor/return-request/<pk>/handle/
    Body: { "action": "approve" | "reject", "note": "optional note" }
    """
    permission_classes = [AllowAny]  # TODO: Add vendor authentication

    @transaction.atomic
    def post(self, request, pk):
        try:
            return_request = OrderReturn.objects.select_related(
                'order_item', 'order_item__product'
            ).get(id=pk)
        except OrderReturn.DoesNotExist:
            return Response(
                {"error": "Return request not found"},
                status=status.HTTP_404_NOT_FOUND
            )

        if return_request.status != 'pending':
            return Response(
                {"error": f"Return request already {return_request.status}"},
                status=status.HTTP_400_BAD_REQUEST
            )

        action = request.data.get('action')
        note = request.data.get('note', '')

        if action not in ['approve', 'reject']:
            return Response(
                {"error": "action must be 'approve' or 'reject'"},
                status=status.HTTP_400_BAD_REQUEST
            )

        if action == 'approve':
            return_request.approve(note=note)
            log.info(f"Return request {pk} approved")
            
            # Credit refund to user's wallet
            order_item = return_request.order_item
            refund_amount = order_item.sub_total  # Refund the item subtotal (excludes shipping)
            user = order_item.order.buyer
            
            if user and hasattr(user, 'wallet'):
                user.wallet.deposit(
                    amount=refund_amount,
                    transaction_type='refund',
                    description=f"Refund for returned item: {order_item.product.title}",
                    related_order=order_item.order,
                    related_order_item=order_item
                )
                log.info(f"Refund of ₹{refund_amount} credited to user {user.email}'s wallet")
                message = f"Return request approved. ₹{refund_amount} refunded to customer's wallet. Stock has been restored."
            else:
                log.warning(f"Could not credit refund - user or wallet not found for order item {order_item.id}")
                message = "Return request approved. Stock has been restored. (Note: Refund could not be processed - user wallet not found)"
        else:
            return_request.reject(note=note)
            log.info(f"Return request {pk} rejected")
            message = "Return request rejected."

        serializer = OrderReturnSerializer(return_request, context={'request': request})
        return Response({
            "message": message,
            "data": serializer.data
        }, status=status.HTTP_200_OK)


class VendorPendingReturnsCountView(APIView):
    """
    Get count of pending return requests for a vendor.
    GET /vendor/return-requests-count/<vendor_id>/
    """
    permission_classes = [AllowAny]

    def get(self, request, vendor_id):
        pending_count = OrderReturn.objects.filter(
            order_item__vendor__id=vendor_id,
            status='pending'
        ).count()
        
        return Response({
            "pending_count": pending_count
        }, status=status.HTTP_200_OK)
