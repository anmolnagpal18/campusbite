import qrcode
import io

def generate_qr_image_bytes(scan_data_str):
    """
    Generates a QR code image as PNG bytes from the given string.
    """
    qr = qrcode.QRCode(
        version=1,
        box_size=10,
        border=4
    )
    qr.add_data(scan_data_str)
    qr.make(fit=True)
    img = qr.make_image(fill_color="black", back_color="white")
    
    bio = io.BytesIO()
    img.save(bio, format="PNG")
    bio.seek(0)
    return bio.getvalue()
