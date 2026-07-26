import datetime
from django.utils import timezone
from bots.state_manager import BotStates, get_or_create_session
from bots.auth import check_session_auth, link_by_credentials
from bots import services as bot_services
from bots.whatsapp_bot import templates, services as wa_api

def handle_whatsapp_message(sender_phone, message_text, button_id=None):
    """
    State machine processing WhatsApp messages (text + quick replies).
    """
    session = get_or_create_session(sender_phone, 'WHATSAPP')
    text = (button_id or message_text).strip()

    # 1. Handle Auth States
    if not check_session_auth(session):
        if session.state == BotStates.START:
            session.state = BotStates.LOGIN_EMAIL
            session.save()
            payload = templates.build_text_message(
                sender_phone,
                "Welcome to CampusBite 2.0 WhatsApp Ordering!\n\nPlease reply with your email address to link your account:"
            )
            wa_api.send_whatsapp_payload(payload)
            return

        elif session.state == BotStates.LOGIN_EMAIL:
            session.context_data['email'] = text
            session.state = BotStates.LOGIN_PASSWORD
            session.save()
            payload = templates.build_text_message(
                sender_phone,
                "Thank you. Now please reply with your password:"
            )
            wa_api.send_whatsapp_payload(payload)
            return

        elif session.state == BotStates.LOGIN_PASSWORD:
            email = session.context_data.get('email')
            password = text
            success, msg = link_by_credentials(session, email, password)
            if success:
                payload = templates.build_text_message(
                    sender_phone,
                    f"✅ {msg}\n\nType 'menu' or choose an option below to begin."
                )
                wa_api.send_whatsapp_payload(payload)
                send_main_menu(sender_phone)
            else:
                session.state = BotStates.LOGIN_EMAIL
                session.save()
                payload = templates.build_text_message(
                    sender_phone,
                    f"❌ {msg}\nPlease reply with your email address to try again:"
                )
                wa_api.send_whatsapp_payload(payload)
            return

    # 2. Main Menu choices
    if text.lower() in ("menu", "help", "start", "home"):
        send_main_menu(sender_phone)
        session.state = BotStates.MAIN_MENU
        session.save()
        return

    # Handle SELECT_COLLEGE / lists selection
    if session.state == BotStates.MAIN_MENU:
        if text == "menu_browse" or text == "1":
            colleges = bot_services.get_colleges_list()
            college_list = "\n".join(f"*{idx+1}* - {c['name']}" for idx, c in enumerate(colleges))
            session.state = BotStates.SELECT_COLLEGE
            session.save()
            payload = templates.build_text_message(
                sender_phone,
                f"🏫 *Select your College (reply with the number):*\n\n{college_list}"
            )
            wa_api.send_whatsapp_payload(payload)

        elif text == "menu_cart" or text == "2":
            show_cart_view(sender_phone, session)

        elif text == "menu_orders" or text == "3":
            from ordering.models import Order
            orders = Order.objects.filter(user=session.user).order_by('-created_at')[:5]
            msg = "📦 *Recent Orders*\n\n"
            if not orders.exists():
                msg += "_No orders found._"
            else:
                for o in orders:
                    msg += f"• *{o.order_number}* — ₹{o.grand_total} ({o.status})\n"
            payload = templates.build_text_message(sender_phone, msg)
            wa_api.send_whatsapp_payload(payload)

    # State SELECT_COLLEGE
    elif session.state == BotStates.SELECT_COLLEGE:
        colleges = bot_services.get_colleges_list()
        try:
            choice_idx = int(text) - 1
            selected_college = colleges[choice_idx]
            session.context_data['college_id'] = selected_college['id']
            session.state = BotStates.SELECT_AREA
            session.save()
            
            areas = bot_services.get_areas_list(selected_college['id'])
            area_list = "\n".join(f"*{idx+1}* - {a}" for idx, a in enumerate(areas))
            payload = templates.build_text_message(
                sender_phone,
                f"📍 *Select Area (reply with the number):*\n\n{area_list}"
            )
            wa_api.send_whatsapp_payload(payload)
        except Exception:
            payload = templates.build_text_message(sender_phone, "Invalid selection. Please reply with a valid number choice.")
            wa_api.send_whatsapp_payload(payload)

    # State SELECT_AREA
    elif session.state == BotStates.SELECT_AREA:
        areas = bot_services.get_areas_list(session.context_data['college_id'])
        try:
            choice_idx = int(text) - 1
            selected_area = areas[choice_idx]
            session.context_data['area'] = selected_area
            session.state = BotStates.SELECT_BLOCK
            session.save()

            blocks = bot_services.get_blocks_list(session.context_data['college_id'], selected_area)
            block_list = "\n".join(f"*{idx+1}* - {b}" for idx, b in enumerate(blocks))
            payload = templates.build_text_message(
                sender_phone,
                f"🏢 *Select Block (reply with the number):*\n\n{block_list}"
            )
            wa_api.send_whatsapp_payload(payload)
        except Exception:
            payload = templates.build_text_message(sender_phone, "Invalid selection. Please reply with a number from the list.")
            wa_api.send_whatsapp_payload(payload)

    # State SELECT_BLOCK
    elif session.state == BotStates.SELECT_BLOCK:
        blocks = bot_services.get_blocks_list(session.context_data['college_id'], session.context_data['area'])
        try:
            choice_idx = int(text) - 1
            selected_block = blocks[choice_idx]
            session.context_data['block'] = selected_block
            session.state = BotStates.SELECT_RESTAURANT
            session.save()

            stalls = bot_services.get_restaurants_list(
                session.context_data['college_id'],
                session.context_data['area'],
                selected_block
            )
            stall_list = "\n".join(f"*{idx+1}* - {s['restaurant_name']} ({s['status']})" for idx, s in enumerate(stalls))
            payload = templates.build_text_message(
                sender_phone,
                f"🏪 *Select Stall (reply with the number):*\n\n{stall_list}"
            )
            wa_api.send_whatsapp_payload(payload)
        except Exception:
            payload = templates.build_text_message(sender_phone, "Invalid selection. Please select a valid number.")
            wa_api.send_whatsapp_payload(payload)

    # State SELECT_RESTAURANT
    elif session.state == BotStates.SELECT_RESTAURANT:
        stalls = bot_services.get_restaurants_list(
            session.context_data['college_id'],
            session.context_data['area'],
            session.context_data['block']
        )
        try:
            choice_idx = int(text) - 1
            selected_stall = stalls[choice_idx]
            session.context_data['restaurant_id'] = selected_stall['id']
            session.state = BotStates.SELECT_CATEGORY
            session.save()

            categories = bot_services.get_restaurant_categories(selected_stall['id'])
            cat_list = "\n".join(f"*{idx+1}* - {c['category_name']}" for idx, c in enumerate(categories))
            payload = templates.build_text_message(
                sender_phone,
                f"📂 *Select Category (reply with the number):*\n\n{cat_list}"
            )
            wa_api.send_whatsapp_payload(payload)
        except Exception:
            payload = templates.build_text_message(sender_phone, "Invalid selection. Please choose a valid number.")
            wa_api.send_whatsapp_payload(payload)

    # State SELECT_CATEGORY
    elif session.state == BotStates.SELECT_CATEGORY:
        categories = bot_services.get_restaurant_categories(session.context_data['restaurant_id'])
        try:
            choice_idx = int(text) - 1
            selected_category = categories[choice_idx]
            session.context_data['category_id'] = selected_category['id']
            session.state = BotStates.SELECT_ITEM
            session.save()

            items = bot_services.get_category_items(selected_category['id'])
            item_list = "\n".join(f"*{idx+1}* - {item['item_name']} (₹{item['price']})" for idx, item in enumerate(items))
            payload = templates.build_text_message(
                sender_phone,
                f"🍔 *Select Item to Add to Cart (reply with the number):*\n\n{item_list}"
            )
            wa_api.send_whatsapp_payload(payload)
        except Exception:
            payload = templates.build_text_message(sender_phone, "Invalid selection.")
            wa_api.send_whatsapp_payload(payload)

    # State SELECT_ITEM (Adding to cart)
    elif session.state == BotStates.SELECT_ITEM:
        items = bot_services.get_category_items(session.context_data['category_id'])
        try:
            choice_idx = int(text) - 1
            selected_item = items[choice_idx]
            
            # Add to cart
            bot_services.add_to_cart_bot(session.user, selected_item['id'], 1)
            payload = templates.build_text_message(
                sender_phone,
                f"🛒 Added *{selected_item['item_name']}* to your cart!\nReply with another item number, or type 'cart' to view cart."
            )
            wa_api.send_whatsapp_payload(payload)
        except Exception:
            if text.lower() == "cart":
                show_cart_view(sender_phone, session)
            else:
                payload = templates.build_text_message(sender_phone, "Invalid selection. Type 'cart' to view cart.")
                wa_api.send_whatsapp_payload(payload)

    # State VIEW_CART / Cart actions
    elif session.state == BotStates.VIEW_CART:
        if text == "cart_checkout":
            session.state = BotStates.CHECKOUT
            session.save()
            buttons = [
                {"id": "wa_checkout_INSTANT", "title": "Instant Order"},
                {"id": "wa_checkout_PREORDER", "title": "Pre-Order"}
            ]
            payload = templates.build_interactive_buttons(
                sender_phone,
                "Select order pickup type:",
                buttons
            )
            wa_api.send_whatsapp_payload(payload)
        elif text == "cart_clear_action":
            bot_services.clear_cart_bot(session.user)
            payload = templates.build_text_message(sender_phone, "Cart cleared successfully!")
            wa_api.send_whatsapp_payload(payload)
            session.state = BotStates.MAIN_MENU
            session.save()

    # State CHECKOUT
    elif session.state == BotStates.CHECKOUT:
        if text.startswith("wa_checkout_"):
            order_type = text.replace("wa_checkout_", "")
            session.context_data['order_type'] = order_type
            session.save()
            
            if order_type == "PREORDER":
                # Fallback pre-order slot (current time + 1 hr 15 mins)
                slot_time = timezone.now() + timezone.timedelta(hours=1, minutes=15)
                session.context_data['pickup_time'] = slot_time.strftime("%Y-%m-%d %H:%M")
                session.save()
                
            # Transition to Mock Payment
            # Checkout via connector service
            pickup_str = session.context_data.get('pickup_time')
            pickup_time = None
            if pickup_str:
                pickup_time = timezone.make_aware(datetime.datetime.strptime(pickup_str, "%Y-%m-%d %H:%M"))
            
            try:
                order = bot_services.checkout_bot(session.user, order_type, pickup_time)
                msg_body = (
                    f"✅ *Order Placed Successfully!*\n\n"
                    f"📦 *Order Number:* {order.order_number}\n"
                    f"💰 *Grand Total:* ₹{order.grand_total}\n"
                    f"🕒 *Pickup Mode:* {order_type}\n"
                    f"🔑 *QR Code ID:* {order.qr_uuid}\n\n"
                    f"Show the QR Code ID at the counter to claim your food pickup. Enjoy!"
                )
                payload = templates.build_text_message(sender_phone, msg_body)
                wa_api.send_whatsapp_payload(payload)
                
                # Clear session
                session.state = BotStates.MAIN_MENU
                session.context_data = {}
                session.save()
            except Exception as e:
                payload = templates.build_text_message(sender_phone, f"❌ *Checkout Error:* {str(e)}")
                wa_api.send_whatsapp_payload(payload)

def send_main_menu(to):
    buttons = [
        {"id": "menu_browse", "title": "Browse Food"},
        {"id": "menu_cart", "title": "View Cart"},
        {"id": "menu_orders", "title": "My Orders"}
    ]
    payload = templates.build_interactive_buttons(
        to,
        "🏠 *CampusBite 2.0 Main Menu*\nSelect an option to get started:",
        buttons
    )
    wa_api.send_whatsapp_payload(payload)

def show_cart_view(sender_phone, session):
    cart_details = bot_services.get_cart_details_bot(session.user)
    msg_text = f"🛒 *Your Cart* (from {cart_details['restaurant_name'] or 'No Stall'})\n\n"
    if not cart_details['items']:
        msg_text += "_Your cart is empty._"
        payload = templates.build_text_message(sender_phone, msg_text)
        wa_api.send_whatsapp_payload(payload)
    else:
        for item in cart_details['items']:
            msg_text += f"▪️ {item['name']} x{item['quantity']} — *₹{item['subtotal']:.2f}*\n"
        msg_text += f"\n💰 *Total Price: ₹{cart_details['total']:.2f}*"
        
        session.state = BotStates.VIEW_CART
        session.save()
        
        buttons = [
            {"id": "cart_checkout", "title": "Checkout"},
            {"id": "cart_clear_action", "title": "Clear Cart"}
        ]
        payload = templates.build_interactive_buttons(sender_phone, msg_text, buttons)
        wa_api.send_whatsapp_payload(payload)
