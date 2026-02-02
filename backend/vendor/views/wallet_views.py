# vendor/views/wallet_views.py
"""
Views for vendor transaction management.
Shows all order transactions for a vendor - payments received and refunds issued.
"""
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny
from django.db.models import Q, Sum, Count
from decimal import Decimal
import logging

from userauth.models import WalletTransaction, Wallet
from vendor.models import Vendor
from store.models import CartOrder, CartOrderItem

log = logging.getLogger(__name__)


class VendorTransactionsListView(APIView):
    """
    Lists all order transactions for a vendor.
    This includes:
    - Payments received (paid orders)
    - Refunds issued (for returns/cancellations)
    
    GET /vendor/wallet-transactions/<vendor_id>/
    Optional query params: ?type=payment|refund
    """
    permission_classes = [AllowAny]  # TODO: Add vendor authentication
    
    def get(self, request, vendor_id):
        try:
            vendor = Vendor.objects.get(id=vendor_id)
        except Vendor.DoesNotExist:
            return Response(
                {"error": "Vendor not found"},
                status=status.HTTP_404_NOT_FOUND
            )
        
        transactions = []
        type_filter = request.query_params.get('type')
        
        # Get all order items for this vendor with their orders
        vendor_order_items = CartOrderItem.objects.filter(
            vendor=vendor
        ).select_related('order', 'order__buyer', 'product').order_by('-date')
        
        # Get unique orders for this vendor
        vendor_orders = CartOrder.objects.filter(
            orderitem__vendor=vendor
        ).distinct().select_related('buyer').order_by('-date')
        
        # 1. Paid Orders
        if not type_filter or type_filter == 'payment':
            paid_orders = vendor_orders.filter(payment_status='paid')
            
            for order in paid_orders:
                # Calculate vendor's portion of the order
                vendor_items = order.orderitem.filter(vendor=vendor)
                vendor_total = sum(item.sub_total for item in vendor_items)
                
                transactions.append({
                    'id': f"ORD-{order.id}",
                    'transaction_id': f"PAY-{order.oid}",
                    'transaction_type': 'payment',
                    'transaction_type_display': 'Payment Received',
                    'amount': str(vendor_total),
                    'created_at': order.date.isoformat() if order.date else None,
                    'description': f"Payment received for order #{order.oid}",
                    'user': {
                        'id': order.buyer.id if order.buyer else None,
                        'email': order.buyer.email if order.buyer else order.email,
                        'full_name': order.buyer.full_name if order.buyer else order.full_name,
                    },
                    'related_order': {
                        'oid': order.oid,
                        'total': str(order.total),
                        'order_status': order.order_status,
                        'payment_status': order.payment_status,
                    },
                    'order_type': 'paid',
                })
        
        # 2. Pending Orders (not yet paid)
        if not type_filter or type_filter == 'pending':
            pending_orders = vendor_orders.exclude(payment_status='paid')
            
            for order in pending_orders:
                vendor_items = order.orderitem.filter(vendor=vendor)
                vendor_total = sum(item.sub_total for item in vendor_items)
                
                # Check if all items are delivered (for pending - likely COD)
                all_delivered = all(
                    item.delivery_status == 'Delivered' for item in vendor_items
                )
                
                status_display = 'Awaiting Payment'
                if all_delivered:
                    status_display = 'Delivered - Pending Payment'
                
                transactions.append({
                    'id': f"PEND-{order.id}",
                    'transaction_id': f"PEND-{order.oid}",
                    'transaction_type': 'pending',
                    'transaction_type_display': status_display,
                    'amount': str(vendor_total),
                    'created_at': order.date.isoformat() if order.date else None,
                    'description': f"Pending payment for order #{order.oid}",
                    'user': {
                        'id': order.buyer.id if order.buyer else None,
                        'email': order.buyer.email if order.buyer else order.email,
                        'full_name': order.buyer.full_name if order.buyer else order.full_name,
                    },
                    'related_order': {
                        'oid': order.oid,
                        'total': str(order.total),
                        'order_status': order.order_status,
                        'payment_status': order.payment_status,
                    },
                    'order_type': 'pending',
                    'is_delivered': all_delivered,
                })
        
        # 3. Refunds (from WalletTransaction)
        if not type_filter or type_filter == 'refund':
            vendor_item_ids = vendor_order_items.values_list('id', flat=True)
            vendor_order_ids = vendor_orders.values_list('id', flat=True)
            
            refund_transactions = WalletTransaction.objects.filter(
                Q(related_order_item__id__in=vendor_item_ids) |
                Q(related_order__id__in=vendor_order_ids),
                transaction_type='refund'
            ).select_related(
                'wallet', 'wallet__user', 'related_order', 'related_order_item'
            )
            
            for txn in refund_transactions:
                transactions.append({
                    'id': f"REF-{txn.id}",
                    'transaction_id': txn.transaction_id,
                    'transaction_type': 'refund',
                    'transaction_type_display': 'Refund',
                    'amount': str(txn.amount),
                    'created_at': txn.created_at.isoformat(),
                    'description': txn.description,
                    'user': {
                        'id': txn.wallet.user.id,
                        'email': txn.wallet.user.email,
                        'full_name': txn.wallet.user.full_name,
                    },
                    'related_order': {
                        'oid': txn.related_order.oid if txn.related_order else None,
                        'total': str(txn.related_order.total) if txn.related_order else None,
                        'order_status': txn.related_order.order_status if txn.related_order else None,
                        'payment_status': txn.related_order.payment_status if txn.related_order else None,
                    } if txn.related_order else None,
                    'order_type': 'refund',
                })
        
        # Sort by date (most recent first)
        transactions.sort(key=lambda x: x['created_at'] or '', reverse=True)
        
        return Response({
            "count": len(transactions),
            "transactions": transactions
        }, status=status.HTTP_200_OK)


class VendorWalletTransactionDetailView(APIView):
    """
    Get detailed information about a specific wallet transaction.
    GET /vendor/wallet-transaction/<transaction_id>/
    """
    permission_classes = [AllowAny]  # TODO: Add vendor authentication
    
    def get(self, request, transaction_id):
        try:
            transaction = WalletTransaction.objects.select_related(
                'wallet', 'wallet__user', 'related_order', 'related_order_item',
                'related_order_item__product'
            ).get(id=transaction_id)
        except WalletTransaction.DoesNotExist:
            return Response(
                {"error": "Transaction not found"},
                status=status.HTTP_404_NOT_FOUND
            )
        
        data = {
            'id': transaction.id,
            'transaction_id': transaction.transaction_id,
            'transaction_type': transaction.transaction_type,
            'transaction_type_display': transaction.get_transaction_type_display(),
            'amount': str(transaction.amount),
            'balance_after': str(transaction.balance_after),
            'created_at': transaction.created_at.isoformat(),
            'description': transaction.description,
            'user': {
                'id': transaction.wallet.user.id,
                'email': transaction.wallet.user.email,
                'full_name': transaction.wallet.user.full_name,
            },
            'related_order': None,
            'related_order_item': None,
        }
        
        if transaction.related_order:
            data['related_order'] = {
                'oid': transaction.related_order.oid,
                'total': str(transaction.related_order.total),
                'order_status': transaction.related_order.order_status,
                'payment_status': transaction.related_order.payment_status,
            }
        
        if transaction.related_order_item:
            data['related_order_item'] = {
                'id': transaction.related_order_item.id,
                'oid': transaction.related_order_item.oid,
                'product_title': transaction.related_order_item.product.title if transaction.related_order_item.product else None,
                'qty': transaction.related_order_item.qty,
                'sub_total': str(transaction.related_order_item.sub_total),
                'delivery_status': transaction.related_order_item.delivery_status,
            }
        
        return Response(data, status=status.HTTP_200_OK)


class VendorWalletStatsView(APIView):
    """
    Get transaction statistics for a vendor.
    GET /vendor/wallet-stats/<vendor_id>/
    """
    permission_classes = [AllowAny]
    
    def get(self, request, vendor_id):
        try:
            vendor = Vendor.objects.get(id=vendor_id)
        except Vendor.DoesNotExist:
            return Response(
                {"error": "Vendor not found"},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Get vendor's orders
        vendor_orders = CartOrder.objects.filter(
            orderitem__vendor=vendor
        ).distinct()
        
        # Calculate stats
        paid_orders = vendor_orders.filter(payment_status='paid')
        pending_orders = vendor_orders.exclude(payment_status='paid')
        
        # Calculate vendor's total from paid orders
        total_paid = Decimal('0.00')
        for order in paid_orders:
            vendor_items = order.orderitem.filter(vendor=vendor)
            total_paid += sum(item.sub_total for item in vendor_items)
        
        # Calculate vendor's total from pending orders
        total_pending = Decimal('0.00')
        for order in pending_orders:
            vendor_items = order.orderitem.filter(vendor=vendor)
            total_pending += sum(item.sub_total for item in vendor_items)
        
        # Get refund stats from WalletTransaction
        vendor_item_ids = CartOrderItem.objects.filter(vendor=vendor).values_list('id', flat=True)
        vendor_order_ids = vendor_orders.values_list('id', flat=True)
        
        refund_stats = WalletTransaction.objects.filter(
            Q(related_order_item__id__in=vendor_item_ids) |
            Q(related_order__id__in=vendor_order_ids),
            transaction_type='refund'
        ).aggregate(
            count=Count('id'),
            total=Sum('amount')
        )
        
        stats = {
            'total_transactions': paid_orders.count() + pending_orders.count() + (refund_stats['count'] or 0),
            'total_paid': {
                'count': paid_orders.count(),
                'total': str(total_paid),
            },
            'total_pending': {
                'count': pending_orders.count(),
                'total': str(total_pending),
            },
            'total_refunds': {
                'count': refund_stats['count'] or 0,
                'total': str(refund_stats['total'] or Decimal('0.00')),
            },
        }
        
        return Response(stats, status=status.HTTP_200_OK)
