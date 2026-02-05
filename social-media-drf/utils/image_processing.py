import sys
from io import BytesIO
from PIL import Image
from django.core.files.uploadedfile import InMemoryUploadedFile

def compress_image(image_file, quality=50, max_width=1920):
    """
    Compresses and resizes an uploaded image.
    
    Args:
        image_file: The uploaded image file (InMemoryUploadedFile or visible)
        quality (int): JPEG quality (1-100)
        max_width (int): Maximum width to resize to (maintaining aspect ratio)
        
    Returns:
        InMemoryUploadedFile: The compressed image file
    """
    try:
        # Open image using Pillow
        img = Image.open(image_file)
        
        # Convert to RGB (in case of RGBA/PNG)
        if img.mode != 'RGB':
            img = img.convert('RGB')
            
        # Resize if width exceeds max_width
        if img.width > max_width:
            # Calculate new height maintaining aspect ratio
            ratio = max_width / float(img.width)
            new_height = int(float(img.height) * ratio)
            img = img.resize((max_width, new_height), Image.Resampling.LANCZOS)
            
        # Save compressed image to BytesIO in WebP format
        output_io = BytesIO()
        img.save(output_io, format='WEBP', quality=quality, optimize=True)
        output_io.seek(0)
        
        # Create a new InMemoryUploadedFile
        new_image = InMemoryUploadedFile(
            file=output_io,
            field_name=None,
            name=f"{image_file.name.rsplit('.', 1)[0]}.webp", # Force webp extension
            content_type='image/webp',
            size=sys.getsizeof(output_io),
            charset=None
        )
        
        return new_image
        
    except Exception as e:
        # If compression fails, return original file or log error
        print(f"Image compression failed: {e}")
        return image_file
