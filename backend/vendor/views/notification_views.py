# Restframework Packages
from rest_framework.response import Response
from rest_framework import generics
from rest_framework.permissions import AllowAny#, IsAuthenticated
# Serializers
from store.serializers import NotificationSerializer, NotificationSummarySerializer

# Models

from store.models import  Notification
from vendor.models import Vendor

#--------
class NotificationUnSeenListAPIView(generics.ListAPIView):
    serializer_class = NotificationSerializer
    queryset = Notification.objects.all()
    permission_classes = (AllowAny, )

    def get_queryset(self):
        vendor_id = self.kwargs['vendor_id']
        vendor = Vendor.objects.get(id=vendor_id)
        notifications = Notification.objects.filter(vendor=vendor, seen=False).order_by('seen')
        return notifications
    
class NotificationSeenListAPIView(generics.ListAPIView):
    serializer_class = NotificationSerializer
    queryset = Notification.objects.all()
    permission_classes = (AllowAny, )

    def get_queryset(self):
        vendor_id = self.kwargs['vendor_id']
        vendor = Vendor.objects.get(id=vendor_id)
        notifications = Notification.objects.filter(vendor=vendor, seen=True).order_by('seen')
        return notifications
    
class NotificationSummaryAPIView(generics.ListAPIView):
    serializer_class = NotificationSummarySerializer

    def get_queryset(self):
        vendor_id = self.kwargs['vendor_id']
        vendor = Vendor.objects.get(id=vendor_id)

        un_read_noti = Notification.objects.filter(vendor=vendor, seen=False).count()
        read_noti = Notification.objects.filter(vendor=vendor, seen=True).count()
        all_noti = Notification.objects.filter(vendor=vendor).count()

        return [{
            'un_read_noti': un_read_noti,
            'read_noti': read_noti,
            'all_noti': all_noti,
        }]

    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    
class NotificationMarkAsSeen(generics.RetrieveUpdateAPIView):
    serializer_class = NotificationSerializer
    permission_classes = (AllowAny, )

    def get_object(self):
        vendor_id = self.kwargs['vendor_id']
        noti_id = self.kwargs['noti_id']
        vendor = Vendor.objects.get(id=vendor_id)
        notification = Notification.objects.get(vendor=vendor, id=noti_id)
        notification.seen = True
        notification.save()
        return notification
    

############################ Less Redundant Notfication Code ############################
# class NotificationAPIView(generics.ListCreateAPIView, generics.RetrieveUpdateAPIView):
#     serializer_class = NotificationSerializer
#     permission_classes = (AllowAny, )

#     def get_queryset(self):
#         vendor_id = self.kwargs['vendor_id']
#         vendor = Vendor.objects.get(id=vendor_id)
        
#         seen_param = self.request.query_params.get('seen', None)

#         if seen_param == 'true':
#             return Notification.objects.filter(vendor=vendor, seen=True).order_by('seen')
#         elif seen_param == 'false':
#             return Notification.objects.filter(vendor=vendor, seen=False).order_by('seen')
#         else:
#             return Notification.objects.filter(vendor=vendor).order_by('seen')

#     def list(self, request, *args, **kwargs):
#         if 'summary' in request.query_params:
#             return self.get_summary(request, *args, **kwargs)
#         return super().list(request, *args, **kwargs)

#     def get_summary(self, request, *args, **kwargs):
#         vendor_id = kwargs['vendor_id']
#         vendor = Vendor.objects.get(id=vendor_id)

#         un_read_noti = Notification.objects.filter(vendor=vendor, seen=False).count()
#         read_noti = Notification.objects.filter(vendor=vendor, seen=True).count()
#         all_noti = Notification.objects.filter(vendor=vendor).count()

#         return Response({
#             'un_read_noti': un_read_noti,
#             'read_noti': read_noti,
#             'all_noti': all_noti,
#         })

#     def perform_update(self, serializer):
#         serializer.instance.seen = True
#         serializer.save()

# Example URL patterns in urls.py:
# path('notifications/<int:vendor_id>/', NotificationAPIView.as_view(), name='notification-list'),
# path('notifications/<int:vendor_id>/<int:pk>/', NotificationAPIView.as_view(), name='notification-detail'),