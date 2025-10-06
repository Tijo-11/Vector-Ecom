# Add this file to your Django project, e.g., backend/custom_backends.py
from django.core.mail.backends.base import BaseEmailBackend
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError
import base64
from email.mime.text import MIMEText

class GmailBackend(BaseEmailBackend):
    def send_messages(self, email_messages):
        creds = Credentials.from_authorized_user_file('token.json', ['https://www.googleapis.com/auth/gmail.send'])
        service = build('gmail', 'v1', credentials=creds)
        sent_count = 0
        for message in email_messages:
            mime_message = MIMEText(message.body)
            mime_message['to'] = ','.join(message.to)
            mime_message['subject'] = message.subject
            mime_message['from'] = message.from_email
            raw = base64.urlsafe_b64encode(mime_message.as_bytes()).decode()
            try:
                service.users().messages().send(userId='me', body={'raw': raw}).execute()
                sent_count += 1
            except HttpError as error:
                print(f'An error occurred: {error}')
        return sent_count