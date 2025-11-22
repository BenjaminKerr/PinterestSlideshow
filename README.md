# Pinterest Board Slideshow Generator

A Python tool that creates minute-long slideshow videos from your Pinterest board saves, with a preference for more recent pins.

## Features

- Fetches images from any Pinterest board you have access to
- Generates a 60-second video slideshow
- Weights selection toward recent saves
- Randomized image selection for variety
- Configurable slideshow duration and transitions

## Prerequisites

- Python 3.8+
- Pinterest Developer Account and API access
- ffmpeg (for video generation)

## Installation

1. Clone this repository:
```bash
git clone https://github.com/yourusername/pinterest-slideshow.git
cd pinterest-slideshow
```

2. Create a virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Install ffmpeg:
- **macOS**: `brew install ffmpeg`
- **Ubuntu/Debian**: `sudo apt-get install ffmpeg`
- **Windows**: Download from [ffmpeg.org](https://ffmpeg.org/download.html)

## Setup

1. Create a Pinterest Developer account at [developers.pinterest.com](https://developers.pinterest.com/)

2. Create a new app and obtain your API credentials

3. Copy the example environment file:
```bash
cp .env.example .env
```

4. Add your Pinterest API credentials to `.env`:
```
PINTEREST_ACCESS_TOKEN=your_access_token_here
PINTEREST_APP_ID=your_app_id_here
PINTEREST_APP_SECRET=your_app_secret_here
```

## Usage

Basic usage:
```bash
python slideshow.py --board-id YOUR_BOARD_ID
```

With options:
```bash
python slideshow.py --board-id YOUR_BOARD_ID --duration 60 --output my_slideshow.mp4
```

### Command Line Arguments

- `--board-id` - Pinterest board ID (required)
- `--duration` - Video duration in seconds (default: 60)
- `--output` - Output video filename (default: slideshow.mp4)
- `--recency-weight` - Weight for recent pins, 0-1 (default: 0.7)
- `--num-images` - Number of images to include (default: auto-calculated)

## How It Works

1. Authenticates with Pinterest API using your credentials
2. Fetches pins from your specified board
3. Downloads images with weighted random selection (favoring recent saves)
4. Generates a video slideshow with smooth transitions
5. Saves the output video to your specified location

## Important Legal Notes

**Content Ownership & Terms of Service**

- This tool is for **personal use only**
- You are responsible for complying with [Pinterest's Terms of Service](https://policy.pinterest.com/en/terms-of-service)
- You are responsible for complying with [Pinterest's API Terms](https://developers.pinterest.com/terms/)
- Images downloaded belong to their original creators and copyright holders
- Do not use this tool to download or distribute content you don't have rights to
- Do not use generated videos for commercial purposes without proper permissions
- Respect the intellectual property rights of content creators

**This code is licensed under the MIT License, but that license only applies to the code itself, NOT to any Pinterest content or images you download.**

## Limitations

- API rate limits apply (check Pinterest's developer documentation)
- Image quality depends on Pinterest's available resolutions
- Some boards may have restricted access
- Private boards require appropriate permissions

## Troubleshooting

**"Authentication failed"**
- Verify your `.env` file contains correct credentials
- Ensure your Pinterest app has the necessary scopes enabled

**"Board not found"**
- Confirm you have access to the board
- Check that the board-id is correct

**"ffmpeg not found"**
- Make sure ffmpeg is installed and in your system PATH

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

**Note**: This license applies only to the code in this repository. Pinterest content, images, and media are subject to their respective copyrights and Pinterest's Terms of Service.

## Disclaimer

This project is not affiliated with, endorsed by, or sponsored by Pinterest. Use at your own risk and ensure you comply with all applicable terms of service and laws.