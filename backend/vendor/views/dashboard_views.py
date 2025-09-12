from .common import *
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
    
