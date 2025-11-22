import requests
import random
from pathlib import Path
from datetime import datetime
import re

class PinterestAPI:
    def __init__(self, access_token):
        self.access_token = access_token
        self.base_url = "https://api.pinterest.com/v5"
        self.headers = {
            "Authorization": f"Bearer {access_token}",
            "Content-Type": "application/json"
        }
    
    def extract_board_id(self, board_url_or_id):
        """Extract board ID from URL or return ID as-is"""
        if board_url_or_id.startswith('http'):
            # Extract from URL pattern: pinterest.com/username/board-name/
            match = re.search(r'/([^/]+)/([^/]+)/?$', board_url_or_id)
            if match:
                return f"{match.group(1)}/{match.group(2)}"
        return board_url_or_id
    
    def fetch_board_pins(self, board_id):
        """Fetch all pins from a board"""
        pins = []
        url = f"{self.base_url}/boards/{board_id}/pins"
        
        while url:
            response = requests.get(url, headers=self.headers)
            response.raise_for_status()
            data = response.json()
            
            pins.extend(data.get('items', []))
            url = data.get('bookmark')  # Pagination
            
            if not url:
                break
        
        return pins
    
    def download_pins(self, pins, recency_weight=0.7, num_images=None):
        """Download pin images with weighted selection"""
        if not pins:
            raise ValueError("No pins found in board")
        
        # Calculate weights based on recency
        weights = []
        for i, pin in enumerate(pins):
            # More recent pins (earlier in list) get higher weights
            recency_score = 1 - (i / len(pins))
            weight = recency_weight * recency_score + (1 - recency_weight)
            weights.append(weight)
        
        # Select pins
        if num_images is None:
            num_images = min(len(pins), 20)  # Default to 20 images
        
        num_images = min(num_images, len(pins))
        selected_pins = random.choices(pins, weights=weights, k=num_images)
        
        # Download images
        cache_dir = Path('cache/images')
        cache_dir.mkdir(parents=True, exist_ok=True)
        
        image_paths = []
        for i, pin in enumerate(selected_pins):
            image_url = pin['media']['images']['originals']['url']
            
            # Download image
            response = requests.get(image_url)
            response.raise_for_status()
            
            # Save to cache
            ext = image_url.split('.')[-1].split('?')[0]
            image_path = cache_dir / f"pin_{i}.{ext}"
            
            with open(image_path, 'wb') as f:
                f.write(response.content)
            
            image_paths.append(str(image_path))
        
        return image_paths