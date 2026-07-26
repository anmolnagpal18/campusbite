import logging
from django.core.management.base import BaseCommand
from bots.telegram_bot.services import initialize_telegram_bot

logger = logging.getLogger(__name__)

class Command(BaseCommand):
    help = "Runs the Telegram Bot polling instance."

    def handle(self, *args, **options):
        self.stdout.write("Initializing Telegram Bot...")
        try:
            app = initialize_telegram_bot()
            self.stdout.write("Telegram Bot is running and polling for updates... Press Ctrl+C to exit.")
            app.run_polling()
        except Exception as e:
            self.stderr.write(f"Error starting Telegram Bot: {e}")
