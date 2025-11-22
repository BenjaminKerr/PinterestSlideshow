from moviepy.editor import ImageClip, concatenate_videoclips
from PIL import Image

class VideoGenerator:
    def create_slideshow(self, image_paths, output_path, duration=60):
        """Create a slideshow video from images"""
        if not image_paths:
            raise ValueError("No images provided")
        
        # Calculate duration per image
        duration_per_image = duration / len(image_paths)
        
        clips = []
        for img_path in image_paths:
            # Resize image to 1920x1080 maintaining aspect ratio
            img = Image.open(img_path)
            img.thumbnail((1920, 1080), Image.Resampling.LANCZOS)
            
            # Create a new image with black background
            background = Image.new('RGB', (1920, 1080), (0, 0, 0))
            offset = ((1920 - img.width) // 2, (1080 - img.height) // 2)
            background.paste(img, offset)
            
            # Save temporary resized image
            temp_path = img_path.replace('.', '_resized.')
            background.save(temp_path)
            
            # Create clip
            clip = ImageClip(temp_path, duration=duration_per_image)
            clips.append(clip)
        
        # Concatenate clips
        final_clip = concatenate_videoclips(clips, method="compose")
        
        # Write video file
        final_clip.write_videofile(
            output_path,
            fps=24,
            codec='libx264',
            audio=False
        )
        
        return output_path