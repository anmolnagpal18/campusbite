import os
import datetime
from django.utils import timezone
from asgiref.sync import sync_to_async
from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup
from telegram.ext import ContextTypes
from accounts.models import User, BotSession
from bots.state_manager import BotStates, get_or_create_session, verify_session_timeout
from bots.auth import check_session_auth, link_by_credentials
from bots import services as bot_services
from bots.telegram_bot import keyboards
from bots.telegram_bot.utils import generate_qr_image_bytes

def sync_start_handler(chat_id):
    session = get_or_create_session(chat_id, 'TELEGRAM')
    if check_session_auth(session):
        session.state = BotStates.MAIN_MENU
        session.save()
        return {
            "action": "reply",
            "text": "Welcome back to CampusBite 2.0!\nSelect an option below to begin.",
            "keyboard": keyboards.get_main_menu_keyboard()
        }
    else:
        session.state = BotStates.LINK_OR_REGISTER
        session.save()
        keyboard = InlineKeyboardMarkup([
            [InlineKeyboardButton("🔗 Link Existing Account", callback_data="auth_link")],
            [InlineKeyboardButton("📝 Register New Account", callback_data="auth_register")]
        ])
        return {
            "action": "reply",
            "text": "Welcome to CampusBite 2.0! To start ordering, please link your existing account or register a new one:",
            "keyboard": keyboard
        }

async def start_handler(update: Update, context: ContextTypes.DEFAULT_TYPE):
    chat_id = str(update.effective_chat.id)
    res = await sync_to_async(sync_start_handler)(chat_id)
    await update.message.reply_text(res["text"], reply_markup=res["keyboard"])


def sync_message_handler(chat_id, text):
    session = get_or_create_session(chat_id, 'TELEGRAM')

    # Session timeout check
    if verify_session_timeout(session) or session.state == BotStates.EXPIRED:
        keyboard = InlineKeyboardMarkup([
            [InlineKeyboardButton("▶ Continue Previous Action", callback_data="session_recover")],
            [InlineKeyboardButton("🔄 Start New Order", callback_data="session_reset")]
        ])
        return {
            "action": "reply",
            "text": "⏳ *Your session expired due to 30 minutes of inactivity.*\nWould you like to recover your previous action or start a new order?",
            "keyboard": keyboard
        }

    # LINK OR REGISTER STATE EXPLICIT PROMPT
    if session.state == BotStates.LINK_OR_REGISTER:
        keyboard = InlineKeyboardMarkup([
            [InlineKeyboardButton("🔗 Link Existing Account", callback_data="auth_link")],
            [InlineKeyboardButton("📝 Register New Account", callback_data="auth_register")]
        ])
        return {
            "action": "reply",
            "text": "Please select whether you want to Link or Register:",
            "keyboard": keyboard
        }

    # 1. Handle Auth States
    if session.state == BotStates.LOGIN_EMAIL:
        session.context_data['email'] = text.strip()
        session.state = BotStates.LOGIN_PASSWORD
        session.save()
        return {
            "action": "reply",
            "text": "Thank you. Now please enter your password:",
            "keyboard": None
        }

    elif session.state == BotStates.LOGIN_PASSWORD:
        email = session.context_data.get('email')
        password = text.strip()
        
        success, msg = link_by_credentials(session, email, password)
        if success:
            return {
                "action": "reply",
                "text": msg,
                "keyboard": keyboards.get_main_menu_keyboard()
            }
        else:
            session.state = BotStates.LOGIN_EMAIL
            session.save()
            return {
                "action": "reply",
                "text": f"❌ {msg}\nPlease enter your email address to try again:",
                "keyboard": None
            }

    # Registration States
    elif session.state == BotStates.REG_EMAIL:
        email_str = text.strip()
        if User.objects.filter(email=email_str).exists():
            return {
                "action": "reply",
                "text": "❌ An account with this email already exists.\nPlease enter a different email address to register:",
                "keyboard": None
            }
        session.context_data['reg_email'] = email_str
        session.state = BotStates.REG_PASSWORD
        session.save()
        return {
            "action": "reply",
            "text": "Email accepted. Please enter a password (minimum 8 characters):",
            "keyboard": None
        }

    elif session.state == BotStates.REG_PASSWORD:
        pass_str = text.strip()
        if len(pass_str) < 8:
            return {
                "action": "reply",
                "text": "❌ Password must be at least 8 characters long. Please enter a stronger password:",
                "keyboard": None
            }
        session.context_data['reg_password'] = pass_str
        session.state = BotStates.REG_CONFIRM
        session.save()
        return {
            "action": "reply",
            "text": "Please confirm your password:",
            "keyboard": None
        }

    elif session.state == BotStates.REG_CONFIRM:
        confirm_str = text.strip()
        reg_password = session.context_data.get('reg_password')
        reg_email = session.context_data.get('reg_email')
        
        if confirm_str != reg_password:
            session.state = BotStates.REG_PASSWORD
            session.save()
            return {
                "action": "reply",
                "text": "❌ Passwords do not match. Please enter your password again:",
                "keyboard": None
            }
        
        # Create user account and profile
        from django.db import transaction
        from accounts.models import Role, UserProfile
        
        try:
            with transaction.atomic():
                user = User.objects.create_user(
                    email=reg_email,
                    password=reg_password,
                    role=Role.USER
                )
                UserProfile.objects.create(user=user)
                
                # Link account to Telegram
                user.telegram_chat_id = session.session_id
                user.telegram_linked = True
                user.save()
                
                session.user = user
                session.state = BotStates.MAIN_MENU
                session.context_data = {}
                session.save()
                
            return {
                "action": "reply",
                "text": f"🎉 *Registration Successful!*\n\nYour account *{reg_email}* has been created and linked to this Telegram session. You can now use these credentials to log in on the website too!\n\nSelect an option below to start ordering:",
                "keyboard": keyboards.get_main_menu_keyboard()
            }
        except Exception as e:
            session.state = BotStates.START
            session.save()
            return {
                "action": "reply",
                "text": f"❌ *Registration Error:* {str(e)}\nType /start to try again.",
                "keyboard": None
            }

    # 2. Require Linked Account for Menu
    if not check_session_auth(session):
        return {
            "action": "reply",
            "text": "Your account is not linked. Please type /start to link your CampusBite account.",
            "keyboard": None
        }

    # 3. Main Menu Navigation
    if text == "🍽 Browse Food":
        colleges = bot_services.get_colleges_list()
        session.state = BotStates.SELECT_COLLEGE
        session.save()
        return {
            "action": "reply",
            "text": "🏫 *Select your College:*",
            "keyboard": keyboards.get_inline_colleges_keyboard(colleges)
        }

    elif text == "🛒 View Cart":
        cart_details = bot_services.get_cart_details_bot(session.user)
        msg_text = f"🛒 *Your Cart* (from {cart_details['restaurant_name'] or 'No Stall'})\n\n"
        if not cart_details['items']:
            msg_text += "_Your cart is empty._"
        else:
            for item in cart_details['items']:
                msg_text += f"▪️ {item['name']} x{item['quantity']} — *₹{item['subtotal']:.2f}*\n"
            msg_text += f"\n💰 *Total Price: ₹{cart_details['total']:.2f}*"
        
        session.state = BotStates.VIEW_CART
        session.save()
        return {
            "action": "reply",
            "text": msg_text,
            "keyboard": keyboards.get_cart_keyboard(cart_details)
        }

    elif text == "📦 My Orders":
        from ordering.models import Order
        orders = Order.objects.filter(user=session.user).order_by('-created_at')[:5]
        msg_text = "📦 *Recent Orders*\n\n"
        if not orders.exists():
            msg_text += "_No orders found._"
            return {"action": "reply", "text": msg_text, "keyboard": None}
        else:
            buttons = []
            for o in orders:
                msg_text += f"• *{o.order_number}* — ₹{o.grand_total} ({o.status})\n"
                buttons.append([InlineKeyboardButton(f"View {o.order_number}", callback_data=f"ordview_{o.id}")])
            return {
                "action": "reply",
                "text": msg_text,
                "keyboard": InlineKeyboardMarkup(buttons)
            }

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
        return {"action": "reply", "text": msg_text, "keyboard": None}

    elif text == "👤 My Profile":
        user = session.user
        profile_info = (
            f"👤 *My Profile*\n\n"
            f"📧 *Email:* {user.email}\n"
            f"🔗 *Telegram Link:* Linked ✅\n"
            f"🆔 *Chat ID:* `{chat_id}`\n"
        )
        keyboard = InlineKeyboardMarkup([
            [InlineKeyboardButton("🚪 Logout / Unlink Account", callback_data="auth_logout")]
        ])
        return {"action": "reply", "text": profile_info, "keyboard": keyboard}

    elif text == "❓ Help":
        help_text = (
            "❓ *CampusBite Bot Help*\n\n"
            "• Use the keyboard buttons to browse food stalls, manage your cart, and track orders.\n"
            "• If you update your cart on the website, it instantly synchronizes here!\n"
            "• All order statuses trigger push notifications to this chat in real time."
        )
        return {"action": "reply", "text": help_text, "keyboard": None}

    return {"action": "reply", "text": "I didn't quite catch that. Please select an option from the menu.", "keyboard": None}


async def message_handler(update: Update, context: ContextTypes.DEFAULT_TYPE):
    chat_id = str(update.effective_chat.id)
    text = update.message.text
    res = await sync_to_async(sync_message_handler)(chat_id, text)
    await update.message.reply_text(res["text"], reply_markup=res.get("keyboard"), parse_mode="Markdown")


def sync_callback_query_handler(chat_id, data):
    session = get_or_create_session(chat_id, 'TELEGRAM')

    if data == "auth_link":
        session.state = BotStates.LOGIN_EMAIL
        session.save()
        return {
            "action": "edit",
            "text": "🔗 Please enter your email address to link your account:",
            "keyboard": None
        }
        
    elif data == "auth_register":
        session.state = BotStates.REG_EMAIL
        session.save()
        return {
            "action": "edit",
            "text": "📝 Please enter a valid email address to register a new account:",
            "keyboard": None
        }

    elif data == "auth_logout":
        user = session.user
        if user:
            user.telegram_chat_id = None
            user.telegram_linked = False
            user.save()
        session.user = None
        session.state = BotStates.START
        session.context_data = {}
        session.save()
        return {
            "action": "edit",
            "text": "🚪 *Logout Successful!*\n\nYou have been logged out and unlinked from this Telegram session.\nType /start to link or register again.",
            "keyboard": None
        }

    if not check_session_auth(session):
        return {"action": "reply", "text": "Session expired. Please /start to link account."}

    # Session timeout check (except recovery actions)
    if data not in ("session_recover", "session_reset") and (verify_session_timeout(session) or session.state == BotStates.EXPIRED):
        keyboard = InlineKeyboardMarkup([
            [InlineKeyboardButton("▶ Continue Previous Action", callback_data="session_recover")],
            [InlineKeyboardButton("🔄 Start New Order", callback_data="session_reset")]
        ])
        return {
            "action": "edit",
            "text": "⏳ *Your session expired due to 30 minutes of inactivity.*\nWould you like to recover your previous action or start a new order?",
            "keyboard": keyboard
        }

    # Expiry Recovery Actions
    if data == "session_recover":
        prev_state = session.context_data.get('previous_state', BotStates.MAIN_MENU)
        session.state = prev_state
        session.save()
        return {
            "action": "edit",
            "text": f"🔄 *Session Recovered!* Resuming your previous activity. Type menu or choose options:",
            "keyboard": keyboards.get_main_menu_keyboard()
        }

    elif data == "session_reset":
        session.state = BotStates.MAIN_MENU
        session.context_data = {}
        session.save()
        return {
            "action": "edit",
            "text": "🔄 *Session Reset.* Starting a new session.",
            "keyboard": keyboards.get_main_menu_keyboard()
        }

    # Handle College selection
    if data.startswith("col_"):
        college_id = int(data.split("_")[1])
        session.context_data['college_id'] = college_id
        session.state = BotStates.SELECT_AREA
        session.save()
        areas = bot_services.get_areas_list(college_id)
        return {
            "action": "edit",
            "text": "📍 *Select Canteen Area:*",
            "keyboard": keyboards.get_inline_areas_keyboard(areas)
        }

    # Handle Area selection
    elif data.startswith("area_"):
        area = data.split("_")[1]
        session.context_data['area'] = area
        session.state = BotStates.SELECT_BLOCK
        session.save()
        blocks = bot_services.get_blocks_list(session.context_data['college_id'], area)
        return {
            "action": "edit",
            "text": "🏢 *Select Block:*",
            "keyboard": keyboards.get_inline_blocks_keyboard(blocks)
        }

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
        return {
            "action": "edit",
            "text": "🏪 *Select Canteen Stall:*",
            "keyboard": keyboards.get_inline_restaurants_keyboard(stalls)
        }

    # Handle Restaurant Stall selection
    elif data.startswith("rest_"):
        rest_id = int(data.split("_")[1])
        session.context_data['restaurant_id'] = rest_id
        session.state = BotStates.SELECT_CATEGORY
        session.save()
        categories = bot_services.get_restaurant_categories(rest_id)
        return {
            "action": "edit",
            "text": "📂 *Select Category:*",
            "keyboard": keyboards.get_inline_categories_keyboard(categories)
        }

    # Handle Category selection
    elif data.startswith("category_"):
        cat_id = int(data.split("_")[1])
        session.context_data['category_id'] = cat_id
        session.state = BotStates.SELECT_ITEM
        session.save()
        items = bot_services.get_category_items(cat_id)
        return {
            "action": "edit",
            "text": "🍔 *Add items to your cart:*",
            "keyboard": keyboards.get_inline_items_keyboard(items)
        }

    # Add item to cart
    elif data.startswith("add_"):
        item_id = int(data.split("_")[1])
        bot_services.add_to_cart_bot(session.user, item_id, 1)
        return {"action": "toast", "text": "Added to cart! 🛒"}

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
        return {
            "action": "edit",
            "text": msg_text,
            "keyboard": keyboards.get_cart_keyboard(cart_details)
        }

    elif data.startswith("cartinc_"):
        item_id = int(data.split("_")[1])
        bot_services.add_to_cart_bot(session.user, item_id, 1)
        cart_details = bot_services.get_cart_details_bot(session.user)
        msg_text = f"🛒 *Your Cart*\n\n"
        for item in cart_details['items']:
            msg_text += f"▪️ {item['name']} x{item['quantity']} — *₹{item['subtotal']:.2f}*\n"
        msg_text += f"\n💰 *Total Price: ₹{cart_details['total']:.2f}*"
        return {
            "action": "edit",
            "text": msg_text,
            "keyboard": keyboards.get_cart_keyboard(cart_details)
        }

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
        return {
            "action": "edit",
            "text": msg_text,
            "keyboard": keyboards.get_cart_keyboard(cart_details)
        }

    elif data.startswith("cartdel_"):
        item_id = int(data.split("_")[1])
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
        return {
            "action": "edit",
            "text": msg_text,
            "keyboard": keyboards.get_cart_keyboard(cart_details)
        }

    elif data == "cart_clear":
        bot_services.clear_cart_bot(session.user)
        return {"action": "edit", "text": "🗑 Cart cleared successfully!", "keyboard": None}

    # Checkout steps
    elif data == "checkout_start":
        return {
            "action": "edit",
            "text": "⚡ *Select Pickup Type:*",
            "keyboard": keyboards.get_checkout_type_keyboard()
        }

    elif data.startswith("checkouttype_"):
        order_type = data.split("_")[1]
        session.context_data['order_type'] = order_type
        session.save()

        if order_type == "PREORDER":
            return {
                "action": "edit",
                "text": "🕒 *Select pickup time slot (next 2 hours):*",
                "keyboard": keyboards.get_preorder_slots_keyboard()
            }
        else:
            session.context_data['pickup_time'] = None
            session.save()
            return {
                "action": "edit",
                "text": "💳 *Order Summary*\n\nInstant orders contain a +₹10 convenience surcharge.\nSelect payment mode below:",
                "keyboard": keyboards.get_payment_keyboard()
            }

    elif data.startswith("slotsel_"):
        slot_val = data.replace("slotsel_", "")
        session.context_data['pickup_time'] = slot_val
        session.save()
        return {
            "action": "edit",
            "text": f"📅 *Pickup Slot Selected:* {slot_val}\n\nSelect payment mode below:",
            "keyboard": keyboards.get_payment_keyboard()
        }

    elif data == "pay_mock":
        order_type = session.context_data.get('order_type')
        pickup_str = session.context_data.get('pickup_time')
        pickup_time = None
        if pickup_str:
            pickup_time = timezone.make_aware(datetime.datetime.strptime(pickup_str, "%Y-%m-%d %H:%M"))

        try:
            order = bot_services.checkout_bot(session.user, order_type, pickup_time)
            
            from ordering.qr import generate_qr_data
            import json
            qr_info = generate_qr_data(order)
            scan_payload = json.dumps({
                "order_uuid": qr_info["order_uuid"],
                "encrypted_token": qr_info["encrypted_token"]
            })
            qr_bytes = generate_qr_image_bytes(scan_payload)
            
            # Reset session
            session.state = BotStates.MAIN_MENU
            session.context_data = {}
            session.save()
            return {
                "action": "photo",
                "photo": qr_bytes,
                "caption": (
                    f"✅ *Payment Successful!*\n\n"
                    f"📦 *Order Number:* {order.order_number}\n"
                    f"💰 *Grand Total:* ₹{order.grand_total}\n"
                    f"🕒 *Pickup Mode:* {order_type}\n\n"
                    f"Show the QR code above at the canteen checkout counter to complete your pickup!"
                )
            }
        except Exception as e:
            return {"action": "edit", "text": f"❌ *Checkout Error:* {str(e)}", "keyboard": None}

    # View Order details
    elif data.startswith("ordview_"):
        from ordering.models import Order
        order_id = int(data.split("_")[1])
        try:
            o = Order.objects.get(id=order_id, user=session.user)
            
            from ordering.qr import generate_qr_data
            import json
            qr_info = generate_qr_data(o)
            scan_payload = json.dumps({
                "order_uuid": qr_info["order_uuid"],
                "encrypted_token": qr_info["encrypted_token"]
            })
            qr_bytes = generate_qr_image_bytes(scan_payload)
            return {
                "action": "photo",
                "photo": qr_bytes,
                "caption": (
                    f"📋 *Order: {o.order_number}*\n"
                    f"🏬 *Stall:* {o.restaurant.restaurant_name}\n"
                    f"🚦 *Status:* {o.status}\n"
                    f"💵 *Paid:* ₹{o.grand_total}"
                )
            }
        except Order.DoesNotExist:
            return {"action": "reply", "text": "Order not found."}

    # Back navigations
    elif data == "back_colleges":
        colleges = bot_services.get_colleges_list()
        return {
            "action": "edit",
            "text": "🏫 *Select your College:*",
            "keyboard": keyboards.get_inline_colleges_keyboard(colleges)
        }
    elif data == "back_areas":
        areas = bot_services.get_areas_list(session.context_data['college_id'])
        return {
            "action": "edit",
            "text": "📍 *Select Canteen Area:*",
            "keyboard": keyboards.get_inline_areas_keyboard(areas)
        }
    elif data == "back_blocks":
        blocks = bot_services.get_blocks_list(session.context_data['college_id'], session.context_data['area'])
        return {
            "action": "edit",
            "text": "🏢 *Select Block:*",
            "keyboard": keyboards.get_inline_blocks_keyboard(blocks)
        }
    elif data == "back_restaurants":
        stalls = bot_services.get_restaurants_list(
            session.context_data['college_id'],
            session.context_data['area'],
            session.context_data['block']
        )
        return {
            "action": "edit",
            "text": "🏪 *Select Canteen Stall:*",
            "keyboard": keyboards.get_inline_restaurants_keyboard(stalls)
        }
    elif data == "back_categories":
        categories = bot_services.get_restaurant_categories(session.context_data['restaurant_id'])
        return {
            "action": "edit",
            "text": "📂 *Select Category:*",
            "keyboard": keyboards.get_inline_categories_keyboard(categories)
        }

    return {"action": "reply", "text": "Action not supported."}


async def callback_query_handler(update: Update, context: ContextTypes.DEFAULT_TYPE):
    query = update.callback_query
    await query.answer()
    data = query.data
    chat_id = str(update.effective_chat.id)

    res = await sync_to_async(sync_callback_query_handler)(chat_id, data)
    
    if res["action"] == "toast":
        await query.answer(res["text"])
    elif res["action"] == "edit":
        await query.edit_message_text(res["text"], reply_markup=res.get("keyboard"), parse_mode="Markdown")
    elif res["action"] == "reply":
        await context.bot.send_message(chat_id=chat_id, text=res["text"], reply_markup=res.get("keyboard"), parse_mode="Markdown")
    elif res["action"] == "photo":
        await context.bot.send_photo(chat_id=chat_id, photo=res["photo"], caption=res["caption"], parse_mode="Markdown")
