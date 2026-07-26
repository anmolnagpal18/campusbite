def build_text_message(to, body):
    return {
        "messaging_product": "whatsapp",
        "recipient_type": "individual",
        "to": to,
        "type": "text",
        "text": {"body": body}
    }

def build_interactive_buttons(to, body_text, buttons):
    """
    Builds a WhatsApp Cloud API interactive quick-reply buttons message (up to 3 buttons).
    buttons format: [{'id': 'btn_id', 'title': 'Button Text'}]
    """
    if len(buttons) > 3 or len(buttons) == 0:
        # Fall back to text menu if too many buttons
        list_str = body_text + "\n\n" + "\n".join(f"{idx+1}️⃣ {btn['title']}" for idx, btn in enumerate(buttons))
        return build_text_message(to, list_str)
        
    formatted_buttons = []
    for btn in buttons:
        formatted_buttons.append({
            "type": "reply",
            "reply": {
                "id": btn['id'],
                "title": btn['title'][:20] # WhatsApp limit is 20 chars
            }
        })
        
    return {
        "messaging_product": "whatsapp",
        "recipient_type": "individual",
        "to": to,
        "type": "interactive",
        "interactive": {
            "type": "button",
            "body": {"text": body_text},
            "action": {"buttons": formatted_buttons}
        }
    }
