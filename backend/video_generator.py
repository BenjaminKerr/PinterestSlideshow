from moviepy import ImageClip, concatenate_videoclips
from PIL import Image
import os

class VideoGenerator:
    def create_slideshow(self, image_paths, output_path, duration=60):
        if not image_paths:
            raise ValueError('No images provided')
        
        # Each image gets exactly 3 seconds
        duration_per_image = 3.0
        
        clips = []
        for i, img_path in enumerate(image_paths):
            try:
                print(f'Processing image {i+1}/{len(image_paths)}: {img_path}', flush=True)
                img = Image.open(img_path)
                
                if img.mode == 'RGBA':
                    background = Image.new('RGB', img.size, (0, 0, 0))
                    background.paste(img, mask=img.split()[3])
                    img = background
                elif img.mode != 'RGB':
                    img = img.convert('RGB')
                
                img.thumbnail((1920, 1080), Image.Resampling.LANCZOS)
                
                background = Image.new('RGB', (1920, 1080), (0, 0, 0))
                offset = ((1920 - img.width) // 2, (1080 - img.height) // 2)
                background.paste(img, offset)
                
                temp_path = img_path.rsplit('.', 1)[0] + '_resized.jpg'
                background.save(temp_path, 'JPEG')
                
                clip = ImageClip(temp_path).with_duration(duration_per_image)
                clips.append(clip)
                
            except Exception as e:
                import traceback
                print(f'ERROR processing {img_path}: {str(e)}', flush=True)
                print(traceback.format_exc(), flush=True)
                continue
        
        if not clips:
            raise ValueError('No valid images could be processed')
        
        print(f'Concatenating {len(clips)} clips...', flush=True)
        final_clip = concatenate_videoclips(clips, method='compose')
        
        print(f'Writing video to {output_path}...', flush=True)
        final_clip.write_videofile(output_path, fps=24, codec='libx264', audio=False)
        
        # Cleanup
        for img_path in image_paths:
            temp_path = img_path.rsplit('.', 1)[0] + '_resized.jpg'
            if os.path.exists(temp_path):
                try:
                    os.remove(temp_path)
                except:
                    pass
        
        return output_path