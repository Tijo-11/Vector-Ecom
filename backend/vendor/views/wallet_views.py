# vendor/views/wallet_views.py
"""
Views for vendor transaction management.
Shows all order transactions for a vendor - payments received and refunds issued.
"""
import io
from datetime import datetime, timedelta
from django.http import HttpResponse
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
from reportlab.lib.pagesizes import A4
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.lib import colors
from openpyxl import Workbook

log = logging.getLogger(__name__)


def _get_date_range(request):
    """Parse period/start_date/end_date query params and return (start, end) date objects or (None, None)."""
    period = request.query_params.get('period')
    start_date = request.query_params.get('start_date')
    end_date = request.query_params.get('end_date')

    if period == 'daily':
        start_date = datetime.today().date()
        end_date = start_date
    elif period == 'weekly':
        end_date = datetime.today().date()
        start_date = end_date - timedelta(days=7)
    elif period == 'monthly':
        end_date = datetime.today().date()
        start_date = end_date - timedelta(days=30)
    elif period == 'yearly':
        end_date = datetime.today().date()
        start_date = end_date.replace(month=1, day=1)
    elif period == 'custom' and start_date and end_date:
        start_date = datetime.strptime(start_date, '%Y-%m-%d').date()
        end_date = datetime.strptime(end_date, '%Y-%m-%d').date()
    else:
        return None, None, period

    return start_date, end_date, period


def _build_vendor_transactions(vendor, type_filter=None, start_date=None, end_date=None):
    """Build the transactions list for a vendor, optionally filtered by type and date range."""
    transactions = []

    vendor_order_items = CartOrderItem.objects.filter(
        vendor=vendor
    ).select_related('order', 'order__buyer', 'product').order_by('-date')

    vendor_orders = CartOrder.objects.filter(
        orderitem__vendor=vendor
    ).distinct().select_related('buyer').order_by('-date')

    # Apply date filter to orders
    if start_date and end_date:
        vendor_orders = vendor_orders.filter(date__date__gte=start_date, date__date__lte=end_date)

    # 1. Paid Orders
    if not type_filter or type_filter == 'payment':
        paid_orders = vendor_orders.filter(payment_status='paid')
        
        for order in paid_orders:
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
                    'payment_method': order.payment_method,
                },
                'payment_method': order.payment_method,
                'order_type': 'paid',
            })
    
    # 2. Pending Orders
    if not type_filter or type_filter == 'pending':
        pending_orders = vendor_orders.exclude(payment_status='paid').filter(
            payment_status__in=['processing', 'pending']
        )
        
        for order in pending_orders:
            vendor_items = order.orderitem.filter(vendor=vendor)
            vendor_total = sum(item.sub_total for item in vendor_items)
            
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
                    'payment_method': order.payment_method,
                },
                'payment_method': order.payment_method,
                'order_type': 'pending',
                'is_delivered': all_delivered,
            })
    
    # 3. Refunds
    if not type_filter or type_filter == 'refund':
        vendor_item_ids = vendor_order_items.values_list('id', flat=True)
        vendor_order_ids = vendor_orders.values_list('id', flat=True)
        
        refund_qs = WalletTransaction.objects.filter(
            Q(related_order_item__id__in=vendor_item_ids) |
            Q(related_order__id__in=vendor_order_ids),
            transaction_type='refund'
        ).select_related(
            'wallet', 'wallet__user', 'related_order', 'related_order_item'
        )

        if start_date and end_date:
            refund_qs = refund_qs.filter(created_at__date__gte=start_date, created_at__date__lte=end_date)
        
        for txn in refund_qs:
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
                    'payment_method': txn.related_order.payment_method if txn.related_order else None,
                } if txn.related_order else None,
                'payment_method': txn.related_order.payment_method if txn.related_order else None,
                'order_type': 'refund',
            })
    
    transactions.sort(key=lambda x: x['created_at'] or '', reverse=True)
    return transactions


class VendorTransactionsListView(APIView):
    """
    Lists all order transactions for a vendor.
    GET /vendor/wallet-transactions/<vendor_id>/
    Optional query params: ?type=payment|refund&period=daily|weekly|monthly|yearly|custom&start_date=&end_date=
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
        
        type_filter = request.query_params.get('type')
        start_date, end_date, period = _get_date_range(request)
        
        transactions = _build_vendor_transactions(vendor, type_filter, start_date, end_date)
        
        # Build summary
        total_payments = sum(float(t['amount']) for t in transactions if t['transaction_type'] == 'payment')
        total_refunds = sum(float(t['amount']) for t in transactions if t['transaction_type'] == 'refund')
        total_pending = sum(float(t['amount']) for t in transactions if t['transaction_type'] == 'pending')
        
        return Response({
            "count": len(transactions),
            "transactions": transactions,
            "summary": {
                "total_payments": total_payments,
                "total_refunds": total_refunds,
                "total_pending": total_pending,
                "payment_count": sum(1 for t in transactions if t['transaction_type'] == 'payment'),
                "refund_count": sum(1 for t in transactions if t['transaction_type'] == 'refund'),
                "pending_count": sum(1 for t in transactions if t['transaction_type'] == 'pending'),
            },
            "period": f"{start_date} to {end_date}" if start_date else "All time",
        }, status=status.HTTP_200_OK)


class VendorWalletTransactionDetailView(APIView):
    """
    Get detailed information about a specific wallet transaction.
    GET /vendor/wallet-transaction/<transaction_id>/
    """
    permission_classes = [AllowAny]
    
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
        
        vendor_orders = CartOrder.objects.filter(
            orderitem__vendor=vendor
        ).distinct()
        
        paid_orders = vendor_orders.filter(payment_status='paid')
        pending_orders = vendor_orders.exclude(payment_status='paid').filter(
            payment_status__in=['processing', 'pending']
        )
        
        total_paid = Decimal('0.00')
        for order in paid_orders:
            vendor_items = order.orderitem.filter(vendor=vendor)
            total_paid += sum(item.sub_total for item in vendor_items)
        
        total_pending = Decimal('0.00')
        for order in pending_orders:
            vendor_items = order.orderitem.filter(vendor=vendor)
            total_pending += sum(item.sub_total for item in vendor_items)
        
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
        
        total_refunds = refund_stats['total'] or Decimal('0.00')
        balance = total_paid - total_refunds
        
        stats = {
            'balance': float(balance),
            'total_earned': float(total_paid),
            'pending_payouts': float(total_pending),
            'total_refunded': float(total_refunds),
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
                'total': str(total_refunds),
            },
        }
        
        return Response(stats, status=status.HTTP_200_OK)


class WalletReportPDFView(APIView):
    """Generate a PDF wallet transaction report for a vendor."""
    permission_classes = [AllowAny]

    def get(self, request, vendor_id):
        try:
            vendor = Vendor.objects.get(id=vendor_id)
        except Vendor.DoesNotExist:
            return HttpResponse("Vendor not found", status=404)

        start_date, end_date, period = _get_date_range(request)
        transactions = _build_vendor_transactions(vendor, start_date=start_date, end_date=end_date)

        total_payments = sum(float(t['amount']) for t in transactions if t['transaction_type'] == 'payment')
        total_refunds = sum(float(t['amount']) for t in transactions if t['transaction_type'] == 'refund')
        total_pending = sum(float(t['amount']) for t in transactions if t['transaction_type'] == 'pending')
        period_label = f"{start_date} to {end_date}" if start_date else "All time"

        buffer = io.BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=A4)
        elements = []
        styles = getSampleStyleSheet()

        elements.append(Paragraph("Wallet Transaction Report", styles['Title']))
        elements.append(Paragraph(f"Vendor: {vendor.user.full_name}", styles['Normal']))
        elements.append(Paragraph(f"Period: {period_label}", styles['Normal']))
        elements.append(Spacer(1, 12))
        elements.append(Paragraph(
            f"Payments: ₹{total_payments:.2f} &nbsp;|&nbsp; "
            f"Refunds: ₹{total_refunds:.2f} &nbsp;|&nbsp; "
            f"Pending: ₹{total_pending:.2f} &nbsp;|&nbsp; "
            f"Total Transactions: {len(transactions)}",
            styles['Normal']
        ))
        elements.append(Spacer(1, 12))

        data = [['Date', 'Transaction ID', 'Type', 'User', 'Amount (₹)']]
        for tx in transactions:
            date_str = tx['created_at'][:10] if tx['created_at'] else 'N/A'
            data.append([
                date_str,
                tx['transaction_id'],
                tx['transaction_type_display'],
                tx['user']['full_name'] or 'N/A',
                tx['amount'],
            ])

        table = Table(data, repeatRows=1)
        table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('FONTSIZE', (0, 0), (-1, -1), 8),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.black),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.Color(0.95, 0.95, 0.95)]),
        ]))
        elements.append(table)

        doc.build(elements)
        buffer.seek(0)
        response = HttpResponse(buffer, content_type='application/pdf')
        response['Content-Disposition'] = 'attachment; filename="wallet_report.pdf"'
        return response


class WalletReportExcelView(APIView):
    """Generate an Excel wallet transaction report for a vendor."""
    permission_classes = [AllowAny]

    def get(self, request, vendor_id):
        try:
            vendor = Vendor.objects.get(id=vendor_id)
        except Vendor.DoesNotExist:
            return HttpResponse("Vendor not found", status=404)

        start_date, end_date, period = _get_date_range(request)
        transactions = _build_vendor_transactions(vendor, start_date=start_date, end_date=end_date)

        total_payments = sum(float(t['amount']) for t in transactions if t['transaction_type'] == 'payment')
        total_refunds = sum(float(t['amount']) for t in transactions if t['transaction_type'] == 'refund')
        total_pending = sum(float(t['amount']) for t in transactions if t['transaction_type'] == 'pending')
        period_label = f"{start_date} to {end_date}" if start_date else "All time"

        wb = Workbook()
        ws = wb.active
        ws.title = "Wallet Report"

        ws.append(["Wallet Transaction Report"])
        ws.append([f"Vendor: {vendor.user.full_name}"])
        ws.append([f"Period: {period_label}"])
        ws.append([])
        ws.append(["Summary"])
        ws.append(["Total Payments (₹)", f"{total_payments:.2f}"])
        ws.append(["Total Refunds (₹)", f"{total_refunds:.2f}"])
        ws.append(["Total Pending (₹)", f"{total_pending:.2f}"])
        ws.append(["Total Transactions", len(transactions)])
        ws.append([])
        ws.append(["Date", "Transaction ID", "Type", "User", "Email", "Amount (₹)", "Description"])

        for tx in transactions:
            date_str = tx['created_at'][:10] if tx['created_at'] else 'N/A'
            ws.append([
                date_str,
                tx['transaction_id'],
                tx['transaction_type_display'],
                tx['user']['full_name'] or 'N/A',
                tx['user']['email'] or 'N/A',
                float(tx['amount']),
                tx.get('description', ''),
            ])

        output = io.BytesIO()
        wb.save(output)
        output.seek(0)

        response = HttpResponse(
            output,
            content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        )
        response['Content-Disposition'] = 'attachment; filename="wallet_report.xlsx"'
        return response


