import argparse
import sys
import os
from pathlib import Path
from dotenv import load_dotenv
from pinterest_api import PinterestAPI
from video_generator import VideoGenerator

# Load environment variables
load_dotenv()

def print_progress(progress):
    """Send progress update to Electron"""
    print(f"PROGRESS:{progress}", flush=True)

def print_status(status):
    """Send status message to Electron"""
    print(f"STATUS:{status}", flush=True)

def main():
    parser = argparse.ArgumentParser(description='Generate Pinterest board slideshow')
    parser.add_argument('--board-url', required=True, help='Pinterest board URL or ID')
    parser.add_argument('--duration', type=int, default=60, help='Video duration in seconds')
    parser.add_argument('--recency-weight', type=float, default=0.7, help='Weight for recent pins (0-1)')
    parser.add_argument('--num-images', type=int, help='Number of images to include')
    parser.add_argument('--output', default='output/slideshow.mp4', help='Output video path')
    
    args = parser.parse_args()
    
    try:
        # Initialize Pinterest API
        print_status("Connecting to Pinterest...")
        print_progress(10)
        
        api_token = os.getenv('PINTEREST_ACCESS_TOKEN')
        if not api_token:
            raise ValueError("Pinterest API token not found in .env file")
        
        api = PinterestAPI(api_token)
        
        # Extract board ID from URL
        board_id = api.extract_board_id(args.board_url)
        print_status(f"Fetching pins from board...")
        print_progress(20)
        
        # Fetch pins
        pins = api.fetch_board_pins(board_id)
        print_status(f"Found {len(pins)} pins")
        print_progress(40)
        
        # Download images
        print_status("Downloading images...")
        image_paths = api.download_pins(
            pins, 
            recency_weight=args.recency_weight,
            num_images=args.num_images
        )
        print_progress(60)
        
        # Generate video
        print_status("Creating slideshow video...")
        output_path = Path(args.output)
        output_path.parent.mkdir(parents=True, exist_ok=True)
        
        generator = VideoGenerator()
        video_path = generator.create_slideshow(
            image_paths,
            output_path=str(output_path),
            duration=args.duration
        )
        print_progress(90)
        
        print_status("Slideshow complete!")
        print_progress(100)
        print(f"OUTPUT:{video_path}", flush=True)
        
        return 0
        
    except Exception as e:
        print_status(f"Error: {str(e)}")
        print(f"ERROR:{str(e)}", file=sys.stderr, flush=True)
        return 1

if __name__ == '__main__':
    sys.exit(main())

