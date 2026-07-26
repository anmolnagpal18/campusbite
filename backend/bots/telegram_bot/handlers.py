import os
import datetime
from django.utils import timezone
from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup
from telegram.ext import ContextTypes
from accounts.models import User, BotSession
from bots.state_manager import BotStates, get_or_create_session, verify_session_timeout
from bots.auth import check_session_auth, link_by_credentials
from bots import services as bot_services
from bots.telegram_bot import keyboards
from bots.telegram_bot.utils import generate_qr_image_bytes

async def send_or_edit_message(update: Update, context: ContextTypes.DEFAULT_TYPE, text: str, reply_markup=None):
    """
    Helper to edit previous bot message or send a new one to keep conversation clean.
    """
    query = update.callback_query
    if query:
        try:
            await query.edit_message_text(text=text, reply_markup=reply_markup, parse_mode="Markdown")
        except Exception:
            # Fallback if editing is not possible
            await context.bot.send_message(chat_id=update.effective_chat.id, text=text, reply_markup=reply_markup, parse_mode="Markdown")
    else:
        await context.bot.send_message(chat_id=update.effective_chat.id, text=text, reply_markup=reply_markup, parse_mode="Markdown")

async def start_handler(update: Update, context: ContextTypes.DEFAULT_TYPE):
    chat_id = str(update.effective_chat.id)
    session = get_or_create_session(chat_id, 'TELEGRAM')

    if check_session_auth(session):
        await update.message.reply_text(
            f"Welcome back to CampusBite 2.0!\nSelect an option below to begin.",
            reply_markup=keyboards.get_main_menu_keyboard()
        )
        session.state = BotStates.MAIN_MENU
        session.save()
    else:
        await update.message.reply_text(
            "Welcome to CampusBite 2.0! Please link your account to start ordering.\n\nPlease enter your email address:"
        )
        session.state = BotStates.LOGIN_EMAIL
        session.save()

async def message_handler(update: Update, context: ContextTypes.DEFAULT_TYPE):
    text = update.message.text
    chat_id = str(update.effective_chat.id)
    session = get_or_create_session(chat_id, 'TELEGRAM')

    # Session timeout check
    if verify_session_timeout(session) or session.state == BotStates.EXPIRED:
        reply_markup = InlineKeyboardMarkup([
            [InlineKeyboardButton("▶ Continue Previous Action", callback_data="session_recover")],
            [InlineKeyboardButton("🔄 Start New Order", callback_data="session_reset")]
        ])
        await update.message.reply_text(
            "⏳ *Your session expired due to 30 minutes of inactivity.*\nWould you like to recover your previous action or start a new order?",
            reply_markup=reply_markup,
            parse_mode="Markdown"
        )
        return

    # 1. Handle Auth States
    if session.state == BotStates.LOGIN_EMAIL:
        session.context_data['email'] = text.strip()
        session.state = BotStates.LOGIN_PASSWORD
        session.save()
        await update.message.reply_text("Thank you. Now please enter your password:")
        return

    elif session.state == BotStates.LOGIN_PASSWORD:
        email = session.context_data.get('email')
        password = text.strip()
        
        success, msg = link_by_credentials(session, email, password)
        if success:
            await update.message.reply_text(
                msg,
                reply_markup=keyboards.get_main_menu_keyboard()
            )
        else:
            await update.message.reply_text(
                f"❌ {msg}\nPlease enter your email address to try again:"
            )
            session.state = BotStates.LOGIN_EMAIL
            session.save()
        return

    # 2. Require Linked Account for Menu
    if not check_session_auth(session):
        await update.message.reply_text(
            "Your account is not linked. Please type /start to link your CampusBite account."
        )
        return

    # 3. Main Menu Navigation
    if text == "🍽 Browse Food":
        colleges = bot_services.get_colleges_list()
        await update.message.reply_text(
            "🏫 *Select your College:*",
            reply_markup=keyboards.get_inline_colleges_keyboard(colleges),
            parse_mode="Markdown"
        )
        session.state = BotStates.SELECT_COLLEGE
        session.save()

    elif text == "🛒 View Cart":
        cart_details = bot_services.get_cart_details_bot(session.user)
        msg_text = f"🛒 *Your Cart* (from {cart_details['restaurant_name'] or 'No Stall'})\n\n"
        if not cart_details['items']:
            msg_text += "_Your cart is empty._"
        else:
            for item in cart_details['items']:
                msg_text += f"▪️ {item['name']} x{item['quantity']} — *₹{item['subtotal']:.2f}*\n"
            msg_text += f"\n💰 *Total Price: ₹{cart_details['total']:.2f}*"
        
        await update.message.reply_text(
            msg_text,
            reply_markup=keyboards.get_cart_keyboard(cart_details),
            parse_mode="Markdown"
        )
        session.state = BotStates.VIEW_CART
        session.save()

    elif text == "📦 My Orders":
        from ordering.models import Order
        orders = Order.objects.filter(user=session.user).order_by('-created_at')[:5]
        msg_text = "📦 *Recent Orders*\n\n"
        if not orders.exists():
            msg_text += "_No orders found._"
            await update.message.reply_text(msg_text, parse_mode="Markdown")
        else:
            buttons = []
            for o in orders:
                msg_text += f"• *{o.order_number}* — ₹{o.grand_total} ({o.status})\n"
                buttons.append([InlineKeyboardButton(f"View {o.order_number}", callback_data=f"ordview_{o.id}")])
            await update.message.reply_text(
                msg_text,
                reply_markup=InlineKeyboardMarkup(buttons),
                parse_mode="Markdown"
            )

    elif text == "🔔 Notifications":
        from ordering.models import Notification
        notes = Notification.objects.filter(user=session.user).order_by('-created_at')[:5]
        msg_text = "🔔 *Recent Notifications*\n\n"
        if not notes.exists():
            msg_text += "_No notifications yet._"
        else:
            for n in notes:
                status_bullet = "▪️" if n.is_read else "🔹"
                msg_text += f"{status_bullet} *{n.title}*\n{n.message}\n\n"
        await update.message.reply_text(msg_text, parse_mode="Markdown")

    elif text == "👤 My Profile":
        user = session.user
        profile_info = (
            f"👤 *My Profile*\n\n"
            f"📧 *Email:* {user.email}\n"
            f"🔗 *Telegram Link:* Linked ✅\n"
            f"🆔 *Chat ID:* `{chat_id}`\n"
        )
        await update.message.reply_text(profile_info, parse_mode="Markdown")

    elif text == "❓ Help":
        help_text = (
            "❓ *CampusBite Bot Help*\n\n"
            "• Use the keyboard buttons to browse food stalls, manage your cart, and track orders.\n"
            "• If you update your cart on the website, it instantly synchronizes here!\n"
            "• All order statuses trigger push notifications to this chat in real time."
        )
        await update.message.reply_text(help_text, parse_mode="Markdown")

async def callback_query_handler(update: Update, context: ContextTypes.DEFAULT_TYPE):
    query = update.callback_query
    await query.answer()
    data = query.data
    chat_id = str(update.effective_chat.id)
    session = get_or_create_session(chat_id, 'TELEGRAM')

    if not check_session_auth(session):
        await query.message.reply_text("Session expired. Please /start to link account.")
        return

    # Check session timeout (skip check if they are clicking recover/reset)
    if data not in ("session_recover", "session_reset") and (verify_session_timeout(session) or session.state == BotStates.EXPIRED):
        reply_markup = InlineKeyboardMarkup([
            [InlineKeyboardButton("▶ Continue Previous Action", callback_data="session_recover")],
            [InlineKeyboardButton("🔄 Start New Order", callback_data="session_reset")]
        ])
        await send_or_edit_message(
            update, context,
            "⏳ *Your session expired due to 30 minutes of inactivity.*\nWould you like to recover your previous action or start a new order?",
            reply_markup=reply_markup
        )
        return

    # Expiry Recovery Handlers
    if data == "session_recover":
        prev_state = session.context_data.get('previous_state', BotStates.MAIN_MENU)
        session.state = prev_state
        session.save()
        await send_or_edit_message(
            update, context,
            f"🔄 *Session Recovered!* Resuming your previous activity. Type menu or choose options:",
            reply_markup=keyboards.get_main_menu_keyboard()
        )
        return

    elif data == "session_reset":
        session.state = BotStates.MAIN_MENU
        session.context_data = {}
        session.save()
        await send_or_edit_message(
            update, context,
            "🔄 *Session Reset.* Starting a new session.",
            reply_markup=keyboards.get_main_menu_keyboard()
        )
        return

    # Handle College selection
    if data.startswith("col_"):
        college_id = int(data.split("_")[1])
        session.context_data['college_id'] = college_id
        session.state = BotStates.SELECT_AREA
        session.save()
        areas = bot_services.get_areas_list(college_id)
        await send_or_edit_message(
            update, context,
            "📍 *Select Canteen Area:*",
            reply_markup=keyboards.get_inline_areas_keyboard(areas)
        )

    # Handle Area selection
    elif data.startswith("area_"):
        area = data.split("_")[1]
        session.context_data['area'] = area
        session.state = BotStates.SELECT_BLOCK
        session.save()
        blocks = bot_services.get_blocks_list(session.context_data['college_id'], area)
        await send_or_edit_message(
            update, context,
            "🏢 *Select Block:*",
            reply_markup=keyboards.get_inline_blocks_keyboard(blocks)
        )

    # Handle Block selection
    elif data.startswith("block_"):
        block = data.split("_")[1]
        session.context_data['block'] = block
        session.state = BotStates.SELECT_RESTAURANT
        session.save()
        stalls = bot_services.get_restaurants_list(
            session.context_data['college_id'],
            session.context_data['area'],
            block
        )
        await send_or_edit_message(
            update, context,
            "🏪 *Select Canteen Stall:*",
            reply_markup=keyboards.get_inline_restaurants_keyboard(stalls)
        )

    # Handle Restaurant Stall selection
    elif data.startswith("rest_"):
        rest_id = int(data.split("_")[1])
        session.context_data['restaurant_id'] = rest_id
        session.state = BotStates.SELECT_CATEGORY
        session.save()
        categories = bot_services.get_restaurant_categories(rest_id)
        await send_or_edit_message(
            update, context,
            "📂 *Select Category:*",
            reply_markup=keyboards.get_inline_categories_keyboard(categories)
        )

    # Handle Category selection
    elif data.startswith("category_"):
        cat_id = int(data.split("_")[1])
        session.context_data['category_id'] = cat_id
        session.state = BotStates.SELECT_ITEM
        session.save()
        items = bot_services.get_category_items(cat_id)
        await send_or_edit_message(
            update, context,
            "🍔 *Add items to your cart:*",
            reply_markup=keyboards.get_inline_items_keyboard(items)
        )

    # Add item to cart
    elif data.startswith("add_"):
        item_id = int(data.split("_")[1])
        bot_services.add_to_cart_bot(session.user, item_id, 1)
        await query.answer("Added to cart! 🛒", show_alert=False)

    # Handle Cart Actions
    elif data == "view_cart":
        cart_details = bot_services.get_cart_details_bot(session.user)
        msg_text = f"🛒 *Your Cart* (from {cart_details['restaurant_name'] or 'No Stall'})\n\n"
        if not cart_details['items']:
            msg_text += "_Your cart is empty._"
        else:
            for item in cart_details['items']:
                msg_text += f"▪️ {item['name']} x{item['quantity']} — *₹{item['subtotal']:.2f}*\n"
            msg_text += f"\n💰 *Total Price: ₹{cart_details['total']:.2f}*"
        await send_or_edit_message(
            update, context,
            msg_text,
            reply_markup=keyboards.get_cart_keyboard(cart_details)
        )

    elif data.startswith("cartinc_"):
        item_id = int(data.split("_")[1])
        bot_services.add_to_cart_bot(session.user, item_id, 1)
        # Refresh cart layout
        cart_details = bot_services.get_cart_details_bot(session.user)
        msg_text = f"🛒 *Your Cart*\n\n"
        for item in cart_details['items']:
            msg_text += f"▪️ {item['name']} x{item['quantity']} — *₹{item['subtotal']:.2f}*\n"
        msg_text += f"\n💰 *Total Price: ₹{cart_details['total']:.2f}*"
        await query.edit_message_text(msg_text, reply_markup=keyboards.get_cart_keyboard(cart_details), parse_mode="Markdown")

    elif data.startswith("cartdec_"):
        item_id = int(data.split("_")[1])
        bot_services.add_to_cart_bot(session.user, item_id, -1)
        cart_details = bot_services.get_cart_details_bot(session.user)
        msg_text = f"🛒 *Your Cart*\n\n"
        if not cart_details['items']:
            msg_text += "_Your cart is empty._"
        else:
            for item in cart_details['items']:
                msg_text += f"▪️ {item['name']} x{item['quantity']} — *₹{item['subtotal']:.2f}*\n"
            msg_text += f"\n💰 *Total Price: ₹{cart_details['total']:.2f}*"
        await query.edit_message_text(msg_text, reply_markup=keyboards.get_cart_keyboard(cart_details), parse_mode="Markdown")

    elif data.startswith("cartdel_"):
        item_id = int(data.split("_")[1])
        # Decrement all quantity
        from ordering.models import Cart
        cart = Cart.objects.get(user=session.user)
        cart.items.filter(food_item_id=item_id).delete()
        cart_details = bot_services.get_cart_details_bot(session.user)
        msg_text = f"🛒 *Your Cart*\n\n"
        if not cart_details['items']:
            msg_text += "_Your cart is empty._"
        else:
            for item in cart_details['items']:
                msg_text += f"▪️ {item['name']} x{item['quantity']} — *₹{item['subtotal']:.2f}*\n"
            msg_text += f"\n💰 *Total Price: ₹{cart_details['total']:.2f}*"
        await query.edit_message_text(msg_text, reply_markup=keyboards.get_cart_keyboard(cart_details), parse_mode="Markdown")

    elif data == "cart_clear":
        bot_services.clear_cart_bot(session.user)
        await send_or_edit_message(update, context, "🗑 Cart cleared successfully!")

    # Checkout Steps
    elif data == "checkout_start":
        await send_or_edit_message(
            update, context,
            "⚡ *Select Pickup Type:*",
            reply_markup=keyboards.get_checkout_type_keyboard()
        )

    elif data.startswith("checkouttype_"):
        order_type = data.split("_")[1]
        session.context_data['order_type'] = order_type
        session.save()

        if order_type == "PREORDER":
            await send_or_edit_message(
                update, context,
                "🕒 *Select pickup time slot (next 2 hours):*",
                reply_markup=keyboards.get_preorder_slots_keyboard()
            )
        else:
            session.context_data['pickup_time'] = None
            session.save()
            await send_or_edit_message(
                update, context,
                "💳 *Order Summary*\n\nInstant orders contain a +₹10 convenience surcharge.\nSelect payment mode below:",
                reply_markup=keyboards.get_payment_keyboard()
            )

    elif data.startswith("slotsel_"):
        slot_val = data.replace("slotsel_", "")
        session.context_data['pickup_time'] = slot_val
        session.save()
        await send_or_edit_message(
            update, context,
            f"📅 *Pickup Slot Selected:* {slot_val}\n\nSelect payment mode below:",
            reply_markup=keyboards.get_payment_keyboard()
        )

    elif data == "pay_mock":
        order_type = session.context_data.get('order_type')
        pickup_str = session.context_data.get('pickup_time')
        pickup_time = None
        if pickup_str:
            pickup_time = timezone.make_aware(datetime.datetime.strptime(pickup_str, "%Y-%m-%d %H:%M"))

        try:
            order = bot_services.checkout_bot(session.user, order_type, pickup_time)
            # Fetch secure QR code payload
            qr_data = order.qr_uuid
            scan_payload = f"ORDER:{order.order_number}:{qr_data}"
            qr_bytes = generate_qr_image_bytes(scan_payload)
            
            # Send QR image
            await context.bot.send_photo(
                chat_id=update.effective_chat.id,
                photo=qr_bytes,
                caption=(
                    f"✅ *Payment Successful!*\n\n"
                    f"📦 *Order Number:* {order.order_number}\n"
                    f"💰 *Grand Total:* ₹{order.grand_total}\n"
                    f"🕒 *Pickup Mode:* {order_type}\n\n"
                    f"Show the QR code above at the canteen checkout counter to complete your pickup!"
                ),
                parse_mode="Markdown"
            )
            # Reset session
            session.state = BotStates.MAIN_MENU
            session.context_data = {}
            session.save()
        except Exception as e:
            await send_or_edit_message(update, context, f"❌ *Checkout Error:* {str(e)}")

    # View Order Details / QR
    elif data.startswith("ordview_"):
        from ordering.models import Order
        order_id = int(data.split("_")[1])
        try:
            o = Order.objects.get(id=order_id, user=session.user)
            scan_payload = f"ORDER:{o.order_number}:{o.qr_uuid}"
            qr_bytes = generate_qr_image_bytes(scan_payload)
            await context.bot.send_photo(
                chat_id=update.effective_chat.id,
                photo=qr_bytes,
                caption=(
                    f"📋 *Order: {o.order_number}*\n"
                    f"🏬 *Stall:* {o.restaurant.restaurant_name}\n"
                    f"🚦 *Status:* {o.status}\n"
                    f"💵 *Paid:* ₹{o.grand_total}"
                ),
                parse_mode="Markdown"
            )
        except Order.DoesNotExist:
            await query.message.reply_text("Order not found.")

    # Back buttons navigation
    elif data == "back_colleges":
        colleges = bot_services.get_colleges_list()
        await send_or_edit_message(
            update, context,
            "🏫 *Select your College:*",
            reply_markup=keyboards.get_inline_colleges_keyboard(colleges)
        )
    elif data == "back_areas":
        areas = bot_services.get_areas_list(session.context_data['college_id'])
        await send_or_edit_message(
            update, context,
            "📍 *Select Canteen Area:*",
            reply_markup=keyboards.get_inline_areas_keyboard(areas)
        )
    elif data == "back_blocks":
        blocks = bot_services.get_blocks_list(session.context_data['college_id'], session.context_data['area'])
        await send_or_edit_message(
            update, context,
            "🏢 *Select Block:*",
            reply_markup=keyboards.get_inline_blocks_keyboard(blocks)
        )
    elif data == "back_restaurants":
        stalls = bot_services.get_restaurants_list(
            session.context_data['college_id'],
            session.context_data['area'],
            session.context_data['block']
        )
        await send_or_edit_message(
            update, context,
            "🏪 *Select Canteen Stall:*",
            reply_markup=keyboards.get_inline_restaurants_keyboard(stalls)
        )
    elif data == "back_categories":
        categories = bot_services.get_restaurant_categories(session.context_data['restaurant_id'])
        await send_or_edit_message(
            update, context,
            "📂 *Select Category:*",
            reply_markup=keyboards.get_inline_categories_keyboard(categories)
        )
