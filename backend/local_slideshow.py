import argparse
import sys
import os
from pathlib import Path
from video_generator import VideoGenerator
import random

def print_progress(progress):
    print(f'PROGRESS:{progress}', flush=True)

def print_status(status):
    print(f'STATUS:{status}', flush=True)

def main():
    parser = argparse.ArgumentParser(description='Generate slideshow from local images')
    parser.add_argument('--input-folder', required=True, help='Folder containing images')
    parser.add_argument('--duration', type=int, default=60, help='Video duration in seconds')
    parser.add_argument('--num-images', type=int, help='Number of images to include')
    parser.add_argument('--output', default='output/slideshow.mp4', help='Output video path')
    
    args = parser.parse_args()
    
    try:
        print_status('Loading images from folder...')
        print_progress(10)
        
        input_path = Path(args.input_folder)
        print(f'DEBUG: Looking for images in: {input_path}', flush=True)
        print(f'DEBUG: Path exists: {input_path.exists()}', flush=True)
        if not input_path.exists():
            raise ValueError(f'Folder not found: {args.input_folder}')
        
        image_extensions = {'.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp'}
        image_files = [
            str(f) for f in input_path.iterdir()
            if f.suffix.lower() in image_extensions
        ]

        print(f'DEBUG: Found {len(image_files)} image files', flush=True)
        if image_files:
            print(f'DEBUG: First few files: {image_files[:3]}', flush=True)
        if not image_files:
            raise ValueError('No images found in folder')
        
        print_status(f'Found {len(image_files)} images')
        print_progress(30)
        
        # Calculate number of images: duration / 5 seconds per image
        if args.num_images:
            num_images_to_use = args.num_images
        else:
            num_images_to_use = args.duration // 3  # Integer division
        
        # Shuffle and select images
        random.shuffle(image_files)
        image_files = image_files[:num_images_to_use]
        
        print_status(f'Using {len(image_files)} images (3 seconds each)...')
        print_progress(50)
        
        # Generate video - pass the exact duration
        print_status('Creating slideshow video...')
        output_path = Path(args.output)
        output_path.parent.mkdir(parents=True, exist_ok=True)
        
        if output_path.exists():
            print(f'Deleting old video: {output_path}', flush=True)
            output_path.unlink()

        generator = VideoGenerator()
        video_path = generator.create_slideshow(
            image_files,
            output_path=str(output_path),
            duration=args.duration
        )
        print_progress(90)
        
        print_status('Slideshow complete!')
        print_progress(100)
        print(f'OUTPUT:{video_path}', flush=True)
        
        return 0
        
    except Exception as e:
        print_status(f'Error: {str(e)}')
        print(f'ERROR:{str(e)}', file=sys.stderr, flush=True)
        return 1