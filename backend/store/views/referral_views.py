# store/views/referral_views.py

import logging
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.conf import settings
from django.utils import timezone
from store.models.offer import ReferralOffer
from store.models import Coupon
from userauth.models import User
from userauth.tasks import send_async_email
import shortuuid
from store.serializers import CouponSerializer

# Set up logger
logger = logging.getLogger(__name__)


class GenerateReferralView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        logger.info(f"GenerateReferralView called by user: {request.user.id} ({request.user.email})")

        try:
            # Generate unique token
            token = shortuuid.uuid()[:16]  # Safer: fixed length, avoid collision
            logger.debug(f"Generated token: {token}")

            # Create referral offer
            offer = ReferralOffer.objects.create(
                referring_user=request.user,
                token=token  # Explicitly set to avoid any default issues
            )
            logger.info(f"ReferralOffer created successfully: ID={offer.id}, Token={offer.token}")

            # Build referral link
            referral_link = f"{settings.SITE_URL}/register/?ref={offer.token}"
            logger.debug(f"Generated referral link: {referral_link}")

            return Response(
                {"referral_link": referral_link},
                status=status.HTTP_201_CREATED
            )

        except Exception as e:
            logger.error(f"Error generating referral link for user {request.user.id}: {str(e)}", exc_info=True)
            return Response(
                {"error": "Failed to generate referral link. Please try again."},
                status=status.HTTP_400_BAD_REQUEST
            )


class ApplyReferralView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        token = request.data.get('token')
        new_user_id = request.data.get('new_user_id')

        logger.info(f"ApplyReferralView called with token={token}, new_user_id={new_user_id}")

        if not token or not new_user_id:
            logger.warning("ApplyReferralView: Missing token or new_user_id")
            return Response(
                {"error": "Token and new_user_id are required"},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            # Find unused referral
            offer = ReferralOffer.objects.get(token=token, is_used=False)
            logger.info(f"Valid referral found: ID={offer.id}, referrer={offer.referring_user.email}")

            # Check expiry
            if offer.expiry_date and offer.expiry_date < timezone.now():
                logger.info(f"Referral expired: {offer.expiry_date}")
                return Response(
                    {"error": "This referral link has expired"},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Validate new user
            try:
                new_user = User.objects.get(id=new_user_id)
                logger.info(f"New user validated: {new_user.email}")
            except User.DoesNotExist:
                logger.warning(f"Invalid new_user_id: {new_user_id}")
                return Response(
                    {"error": "Invalid user ID"},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Generate coupon code
            coupon_code = shortuuid.uuid()[:8].upper()
            coupon = Coupon.objects.create(
                vendor=None,  # Or assign a platform/admin vendor
                code=coupon_code,
                discount=10,  # You can make this configurable
                active=True
            )
            logger.info(f"Coupon created: {coupon_code} for referrer {offer.referring_user.email}")

            # Update referral
            offer.reward_coupon = coupon
            offer.is_used = True
            offer.save()
            logger.info(f"Referral marked as used: {offer.token}")

            # Send reward email to referrer
            subject = "Referral Reward - New User Signed Up!"
            message = (
                f"Hello {offer.referring_user.full_name or offer.referring_user.username},\n\n"
                f"Great news! A new user ({new_user.email}) has successfully signed up using your referral link.\n\n"
                f"As a thank you, here's your exclusive coupon:\n"
                f"Code: {coupon_code}\n"
                f"Discount: {coupon.discount}%\n\n"
                f"Use it on your next purchase!\n\n"
                f"Thank you for spreading the word!\n"
                f"— The Team"
            )

            send_async_email.delay(
                subject=subject,
                message=message,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[offer.referring_user.email],
                fail_silently=False,
            )
            logger.info(f"Reward email queued for {offer.referring_user.email}")

            return Response({
                "message": "Referral applied successfully!",
                "coupon_code": coupon_code
            }, status=status.HTTP_200_OK)

        except ReferralOffer.DoesNotExist:
            logger.warning(f"Invalid or already used referral token: {token}")
            return Response(
                {"error": "Invalid or already used referral link"},
                status=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            logger.error(f"Unexpected error in ApplyReferralView: {str(e)}", exc_info=True)
            return Response(
                {"error": "Something went wrong. Please try again later."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
            

class MyReferralCouponsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        logger.info(f"MyReferralCouponsView called by user: {request.user.id} ({request.user.email})")

        try:
            offers = ReferralOffer.objects.filter(
                referring_user=request.user,
                is_used=True
            ).select_related('reward_coupon')

            coupons = [
                offer.reward_coupon for offer in offers
                if offer.reward_coupon
            ]

            serializer = CouponSerializer(coupons, many=True)
            return Response(serializer.data, status=status.HTTP_200_OK)

        except Exception as e:
            logger.error(f"Error fetching referral coupons for user {request.user.id}: {str(e)}", exc_info=True)
            return Response(
                {"error": "Failed to fetch coupons. Please try again."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )