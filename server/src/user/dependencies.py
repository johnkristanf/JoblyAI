from imagekitio import ImageKit

from src.config import settings


def get_image_kit_method():
    return ImageKit(
        private_key=settings.IMAGE_KIT_PRIVATE_KEY,
        public_key=settings.IMAGE_KIT_PUBLIC_KEY,
        url_endpoint=settings.IMAGE_KIT_URL_ENDPOINT,
    )
