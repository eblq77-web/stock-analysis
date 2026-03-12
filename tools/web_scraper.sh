#!/bin/bash
# 🕷️ Web Resource Scraper & Gallery Generator
# ===========================================
# Usage: ./web_scraper.sh [options]
#
# Options:
#   --url URL         Target website to scrape
#   --pattern PATTERN Image/pattern to match (e.g., "*.jpg", "*.png")
#   --gallery        Create HTML gallery
#   --download       Download matched files
#   --limit N        Max files to download (default: 50)
#   --output DIR     Output directory (default: ./downloads)
#   --help           Show this help
#
# Examples:
#   ./web_scraper.sh --url "https://example.com/gallery" --pattern "*.jpg" --download
#   ./web_scraper.sh --url "https://unsplash.com" --pattern "*.jpg" --gallery

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Default values
URL=""
PATTERN="*"
GALLERY=false
DOWNLOAD=false
LIMIT=50
OUTPUT_DIR="./downloads"

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --url)
            URL="$2"
            shift 2
            ;;
        --pattern)
            PATTERN="$2"
            shift 2
            ;;
        --gallery)
            GALLERY=true
            shift
            ;;
        --download)
            DOWNLOAD=true
            shift
            ;;
        --limit)
            LIMIT="$2"
            shift 2
            ;;
        --output)
            OUTPUT_DIR="$2"
            shift 2
            ;;
        --help)
            echo "🕷️ Web Scraper & Gallery Generator"
            echo "Usage: $0 [options]"
            echo ""
            echo "Options:"
            echo "  --url URL         Target website to scrape"
            echo "  --pattern PATTERN Image/pattern to match (e.g., '*.jpg', '*.png')"
            echo "  --gallery         Create HTML gallery"
            echo "  --download        Download matched files"
            echo "  --limit N         Max files to download (default: 50)"
            echo "  --output DIR      Output directory (default: ./downloads)"
            exit 0
            ;;
        *)
            echo "Unknown option: $1"
            exit 1
            ;;
    esac
done

# Check dependencies
check_deps() {
    echo -e "${BLUE}Checking dependencies...${NC}"
    
    if ! command -v curl &> /dev/null; then
        echo -e "${RED}curl not found. Installing...${NC}"
        brew install curl
    fi
    
    if ! command -v wget &> /dev/null; then
        echo -e "${RED}wget not found. Installing...${NC}"
        brew install wget
    fi
    
    echo -e "${GREEN}All dependencies OK!${NC}"
}

# Scrape images from URL
scrape_images() {
    local url=$1
    local pattern=$2
    local limit=$3
    
    echo -e "${BLUE}Scraping images from: $url${NC}"
    
    # Create temp file
    local temp_file=$(mktemp)
    
    # Get HTML
    curl -s "$url" > "$temp_file"
    
    # Extract image URLs (basic)
    grep -oE 'src="[^"]+\.(jpg|jpeg|png|gif|webp|svg)"' "$temp_file" | \
        sed 's/src="//g' | sed 's/"//g' | \
        grep -iE "$pattern" | \
        head -n "$limit"
    
    rm "$temp_file"
}

# Download images
download_images() {
    local urls=("$@")
    local count=0
    
    # Create output directory
    mkdir -p "$OUTPUT_DIR"
    
    echo -e "${GREEN}Downloading to: $OUTPUT_DIR${NC}"
    
    for url in "${urls[@]}"; do
        # Skip empty
        [[ -z "$url" ]] && continue
        
        # Handle relative URLs
        if [[ ! "$url" =~ ^http ]]; then
            url="${URL%/}/$url"
        fi
        
        # Get filename
        filename=$(basename "$url")
        
        # Download
        echo -e "${YELLOW}Downloading: $filename${NC}"
        curl -sL -o "$OUTPUT_DIR/$filename" "$url" 2>/dev/null &
        
        ((count++))
        
        # Limit
        if [[ $count -ge $LIMIT ]]; then
            break
        fi
    done
    
    # Wait for all downloads
    wait
    
    echo -e "${GREEN}Downloaded $count files!${NC}"
}

# Create gallery
create_gallery() {
    local output_file="gallery_$(date +%Y%m%d_%H%M%S).html"
    
    echo -e "${BLUE}Creating gallery: $output_file${NC}"
    
    cat > "$output_file" << 'EOF'
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>🖼️ Image Gallery</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: -apple-system, BlinkMacSystemFont, sans-serif;
            background: linear-gradient(135deg, #1a1a2e, #16213e);
            min-height: 100vh;
            padding: 20px;
        }
        h1 { 
            text-align: center; 
            color: #fff; 
            margin: 30px 0;
            font-size: 2em;
        }
        .gallery {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
            gap: 20px;
            max-width: 1400px;
            margin: 0 auto;
        }
        .card {
            background: rgba(255,255,255,0.1);
            border-radius: 15px;
            overflow: hidden;
            transition: transform 0.3s;
        }
        .card:hover { transform: scale(1.05); }
        .card img {
            width: 100%;
            height: 200px;
            object-fit: cover;
        }
        .card-info {
            padding: 15px;
            color: #fff;
        }
        .card-name {
            font-weight: bold;
            margin-bottom: 5px;
            word-break: break-all;
        }
        .card-size {
            font-size: 0.8em;
            opacity: 0.7;
        }
    </style>
</head>
<body>
    <h1>🖼️ Downloaded Gallery</h1>
    <div class="gallery">
EOF
    
    # Add images
    for img in "$OUTPUT_DIR"/*; do
        if [[ -f "$img" ]]; then
            filename=$(basename "$img")
            size=$(ls -lh "$img" | awk '{print $5}')
            
            echo "        <div class=\"card\">" >> "$output_file"
            echo "            <img src=\"$img\" alt=\"$filename\">" >> "$output_file"
            echo "            <div class=\"card-info\">" >> "$output_file"
            echo "                <div class=\"card-name\">$filename</div>" >> "$output_file"
            echo "                <div class=\"card-size\">Size: $size</div>" >> "$output_file"
            echo "            </div>" >> "$output_file"
            echo "        </div>" >> "$output_file"
        fi
    done
    
    cat >> "$output_file" << 'EOF'
    </div>
</body>
</html>
EOF
    
    echo -e "${GREEN}Gallery created: $output_file${NC}"
    open "$output_file"
}

# Main
main() {
    echo "🕷️ Web Scraper & Gallery Generator"
    echo "===================================="
    
    if [[ -z "$URL" ]]; then
        echo -e "${RED}Error: --url is required${NC}"
        echo "Use --help for usage"
        exit 1
    fi
    
    check_deps
    
    # Scrape URLs
    echo -e "${BLUE}Finding images...${NC}"
    mapfile -t urls < <(scrape_images "$URL" "$PATTERN" "$LIMIT")
    
    echo -e "${GREEN}Found ${#urls[@]} images${NC}"
    
    # Download
    if [[ "$DOWNLOAD" == true ]]; then
        download_images "${urls[@]}"
    fi
    
    # Gallery
    if [[ "$GALLERY" == true ]]; then
        create_gallery
    fi
    
    echo -e "${GREEN}Done!${NC}"
}

main
