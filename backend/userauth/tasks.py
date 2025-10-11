from celery import shared_task
from django.core.mail import send_mail
from django.conf import settings #noqa
    
from django.core.mail import EmailMultiAlternatives
from django.template.loader import render_to_string #noqa

@shared_task
def send_async_email(subject, message, from_email, recipient_list, fail_silently=False):
    send_mail(
        subject,
        message,
        from_email,
        recipient_list,
        fail_silently=fail_silently,
    )


@shared_task
def send_async_multipart_email(subject, text_body, html_body, from_email, to_email):
    msg = EmailMultiAlternatives(subject, text_body, from_email, [to_email])
    msg.attach_alternative(html_body, "text/html")
    msg.send()