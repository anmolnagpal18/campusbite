import os
from telegram.ext import ApplicationBuilder, CommandHandler, MessageHandler, CallbackQueryHandler, filters
from bots.telegram_bot import handlers

def initialize_telegram_bot():
    token = os.environ.get("TELEGRAM_BOT_TOKEN")
    if not token:
        raise ValueError("TELEGRAM_BOT_TOKEN environment variable not set.")
    
    app = ApplicationBuilder().token(token).build()
    
    app.add_handler(CommandHandler("start", handlers.start_handler))
    app.add_handler(CallbackQueryHandler(handlers.callback_query_handler))
    app.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, handlers.message_handler))
    
    return app
