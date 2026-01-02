from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny
from django.shortcuts import get_object_or_404
from store.models import CartOrder
from store.serializers import CartOrderSerializer
import logging

log = logging.getLogger(__name__)


class GuestOrderTrackingView(APIView):
    """
    Allow guests to track their order using order number (oid) and email.
    This endpoint is public and does not require authentication.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        order_oid = request.data.get('order_oid')
        email = request.data.get('email')

        if not order_oid or not email:
            return Response(
                {"error": "Order number and email are required"},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            # Find order by OID and email (case-insensitive email match)
            order = CartOrder.objects.get(
                oid=order_oid,
                email__iexact=email
            )
            
            serializer = CartOrderSerializer(order, context={'request': request})
            log.info(f"Guest tracking: Order {order_oid} retrieved successfully")
            
            return Response(serializer.data, status=status.HTTP_200_OK)
            
        except CartOrder.DoesNotExist:
            log.warning(f"Guest tracking: Invalid order number or email combination attempted")
            return Response(
                {"error": "Order not found. Please check your order number and email."},
                status=status.HTTP_404_NOT_FOUND
            )
