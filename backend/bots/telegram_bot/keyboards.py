from telegram import ReplyKeyboardMarkup, InlineKeyboardMarkup, InlineKeyboardButton

def get_main_menu_keyboard():
    keyboard = [
        ["🍽 Browse Food", "🛒 View Cart"],
        ["📦 My Orders", "🔔 Notifications"],
        ["👤 My Profile", "❓ Help"]
    ]
    return ReplyKeyboardMarkup(keyboard, resize_keyboard=True)

def get_inline_colleges_keyboard(colleges):
    buttons = []
    for c in colleges:
        buttons.append([InlineKeyboardButton(c['name'], callback_data=f"col_{c['id']}")])
    return InlineKeyboardMarkup(buttons)

def get_inline_areas_keyboard(areas):
    buttons = []
    for area in areas:
        buttons.append([InlineKeyboardButton(area, callback_data=f"area_{area}")])
    buttons.append([InlineKeyboardButton("🔙 Back to Colleges", callback_data="back_colleges")])
    return InlineKeyboardMarkup(buttons)

def get_inline_blocks_keyboard(blocks):
    buttons = []
    for block in blocks:
        buttons.append([InlineKeyboardButton(block, callback_data=f"block_{block}")])
    buttons.append([InlineKeyboardButton("🔙 Back to Areas", callback_data="back_areas")])
    return InlineKeyboardMarkup(buttons)

def get_inline_restaurants_keyboard(restaurants):
    buttons = []
    for r in restaurants:
        status_emoji = "🟢" if r['status'] == 'OPEN' else "🔴"
        buttons.append([InlineKeyboardButton(f"{status_emoji} {r['restaurant_name']}", callback_data=f"rest_{r['id']}")])
    buttons.append([InlineKeyboardButton("🔙 Back to Blocks", callback_data="back_blocks")])
    return InlineKeyboardMarkup(buttons)

def get_inline_categories_keyboard(categories):
    buttons = []
    for cat in categories:
        buttons.append([InlineKeyboardButton(cat['category_name'], callback_data=f"category_{cat['id']}")])
    buttons.append([InlineKeyboardButton("🔙 Back to Restaurants", callback_data="back_restaurants")])
    return InlineKeyboardMarkup(buttons)

def get_inline_items_keyboard(items):
    buttons = []
    for item in items:
        # 🍔 Veg Burger (₹80) - [Add]
        row = [
            InlineKeyboardButton(f"{item['item_name']} - ₹{item['price']}", callback_data=f"iteminfo_{item['id']}"),
            InlineKeyboardButton("➕ Add", callback_data=f"add_{item['id']}")
        ]
        buttons.append(row)
    buttons.append([InlineKeyboardButton("🔙 Back to Categories", callback_data="back_categories")])
    return InlineKeyboardMarkup(buttons)

def get_cart_keyboard(cart_details):
    buttons = []
    for item in cart_details['items']:
        row = [
            InlineKeyboardButton(f"❌", callback_data=f"cartdel_{item['id']}"),
            InlineKeyboardButton(f"➖", callback_data=f"cartdec_{item['id']}"),
            InlineKeyboardButton(f"{item['name']} x{item['quantity']}", callback_data=f"cartinfo_{item['id']}"),
            InlineKeyboardButton(f"➕", callback_data=f"cartinc_{item['id']}")
        ]
        buttons.append(row)
    
    if cart_details['items']:
        buttons.append([InlineKeyboardButton("🚀 Proceed to Checkout", callback_data="checkout_start")])
        buttons.append([InlineKeyboardButton("🗑 Clear Cart", callback_data="cart_clear")])
    else:
        buttons.append([InlineKeyboardButton("🍽 Browse Food Now", callback_data="browse_food")])
    
    return InlineKeyboardMarkup(buttons)

def get_checkout_type_keyboard():
    buttons = [
        [
            InlineKeyboardButton("⚡ Instant Order (+₹10)", callback_data="checkouttype_INSTANT"),
            InlineKeyboardButton("🕒 Pre-Order", callback_data="checkouttype_PREORDER")
        ],
        [InlineKeyboardButton("🔙 Back to Cart", callback_data="view_cart")]
    ]
    return InlineKeyboardMarkup(buttons)

def get_preorder_slots_keyboard():
    # Generate preorder 15-minute slots starting 1 hour from now
    import datetime
    buttons = []
    now = datetime.datetime.now()
    start_time = now + datetime.timedelta(hours=1)
    
    # Round up to nearest 15 minutes
    minutes = (start_time.minute // 15 + 1) * 15
    start_time = start_time.replace(minute=0, second=0, microsecond=0) + datetime.timedelta(minutes=minutes)
    
    for i in range(8):  # 8 slots (next 2 hours)
        slot_time = start_time + datetime.timedelta(minutes=15 * i)
        slot_str = slot_time.strftime("%H:%M")
        # Store full date time in callback
        callback_val = slot_time.strftime("%Y-%m-%d %H:%M")
        buttons.append([InlineKeyboardButton(slot_str, callback_data=f"slotsel_{callback_val}")])
        
    buttons.append([InlineKeyboardButton("🔙 Back", callback_data="checkout_start")])
    return InlineKeyboardMarkup(buttons)

def get_payment_keyboard():
    buttons = [
        [InlineKeyboardButton("💳 Pay via Mock Wallet (₹0.00)", callback_data="pay_mock")],
        [InlineKeyboardButton("❌ Cancel Order", callback_data="view_cart")]
    ]
    return InlineKeyboardMarkup(buttons)
