import io
from datetime import datetime, timedelta
from django.http import HttpResponse
from django.db.models import Sum, Count
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from vendor.models import Vendor
from store.models import CartOrderItem
from reportlab.lib.pagesizes import A4
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.lib import colors
from openpyxl import Workbook

class SalesReportAPIView(APIView):
    permission_classes = (AllowAny,)

    def get(self, request, vendor_id):
        vendor = Vendor.objects.get(id=vendor_id)
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')
        period = request.query_params.get('period')  # 'daily', 'weekly', 'monthly', 'yearly', 'custom'

        queryset = CartOrderItem.objects.filter(vendor=vendor, order__payment_status="paid")

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

        if start_date and end_date:
            queryset = queryset.filter(order__date__date__gte=start_date, order__date__date__lte=end_date)

        aggregates = queryset.aggregate(
            total_orders=Count('order', distinct=True),
            total_amount=Sum('sub_total'),
            total_discount=Sum('saved'),  # assumes 'saved' is discount + coupon deduction per item
            total_items=Sum('qty')
        )

        items = queryset.values('order__date__date', 'product__title', 'qty', 'sub_total', 'saved')

        return Response({
            'summary': {
                'sales_count': aggregates['total_items'] or 0,
                'order_amount': aggregates['total_amount'] or 0,
                'total_discount': aggregates['total_discount'] or 0,
                'order_count': aggregates['total_orders'] or 0,
            },
            'items': list(items),
            'period': f"{start_date} to {end_date}" if start_date else "All time"
        })

class SalesReportPDFView(APIView):
    permission_classes = (AllowAny,)

    def get(self, request, vendor_id):
        # Reuse logic from SalesReportAPIView (you can extract to a helper if needed)
        response_data = SalesReportAPIView().get(request, vendor_id).data

        buffer = io.BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=A4)
        elements = []
        styles = getSampleStyleSheet()

        elements.append(Paragraph("Sales Report", styles['Title']))
        elements.append(Paragraph(f"Period: {response_data['period']}", styles['Normal']))
        elements.append(Paragraph("<br/>Summary:<br/>", styles['Normal']))
        elements.append(Paragraph(f"Orders: {response_data['summary']['order_count']}<br/>"
                                  f"Items Sold: {response_data['summary']['sales_count']}<br/>"
                                  f"Total Amount: ₹{response_data['summary']['order_amount']}<br/>"
                                  f"Total Discount/Coupons: ₹{response_data['summary']['total_discount']}", styles['Normal']))

        data = [['Date', 'Product', 'Qty', 'Amount', 'Discount']]
        for item in response_data['items']:
            data.append([item['order__date__date'], item['product__title'], item['qty'], item['sub_total'], item['saved']])

        table = Table(data)
        table.setStyle(TableStyle([('BACKGROUND', (0,0), (-1,0), colors.grey),
                                   ('GRID', (0,0), (-1,-1), 1, colors.black)]))
        elements.append(table)

        doc.build(elements)
        buffer.seek(0)
        response = HttpResponse(buffer, content_type='application/pdf')
        response['Content-Disposition'] = 'attachment; filename="sales_report.pdf"'
        return response

class SalesReportExcelView(APIView):
    permission_classes = (AllowAny,)

    def get(self, request, vendor_id):
        response_data = SalesReportAPIView().get(request, vendor_id).data

        wb = Workbook()
        ws = wb.active
        ws.title = "Sales Report"

        ws.append(['Sales Report'])
        ws.append([f"Period: {response_data['period']}"])
        ws.append([])
        ws.append(['Summary'])
        ws.append(['Orders', response_data['summary']['order_count']])
        ws.append(['Items Sold', response_data['summary']['sales_count']])
        ws.append(['Total Amount (₹)', response_data['summary']['order_amount']])
        ws.append(['Total Discount/Coupons (₹)', response_data['summary']['total_discount']])
        ws.append([])
        ws.append(['Date', 'Product', 'Qty', 'Amount', 'Discount'])

        for item in response_data['items']:
            ws.append([item['order__date__date'], item['product__title'], item['qty'], item['sub_total'], item['saved']])

        output = io.BytesIO()
        wb.save(output)
        output.seek(0)

        response = HttpResponse(output, content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
        response['Content-Disposition'] = 'attachment; filename="sales_report.xlsx"'
        return response