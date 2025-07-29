# MONSTOR YouTube Downloader

## Project Overview
A modern web application for downloading YouTube thumbnails and videos. Features include:
- Real video downloads using yt-dlp for reliable extraction
- Thumbnail downloads in multiple qualities
- Modern UI/UX with animations and MONSTOR branding
- Bootstrap dark theme integration

## Recent Changes (July 29, 2025)
- ✓ Migrated from pytube to yt-dlp for better YouTube API compatibility
- ✓ Fixed JavaScript errors with null checks for DOM elements
- ✓ Implemented real video download functionality
- ✓ Enhanced UI with MONSTOR branding and animations
- ✓ Added proper error handling for video extraction

## Project Architecture
- **Backend**: Flask with yt-dlp for YouTube data extraction
- **Frontend**: Bootstrap 5 with custom animations and styling
- **Video Processing**: yt-dlp handles format extraction and downloading
- **File Handling**: Temporary files for secure video downloads

## User Preferences
- Prefers functional video downloads over limitations
- Wants modern UI/UX with animations
- Likes the MONSTOR branding theme

## Key Technical Decisions
- **yt-dlp over pytube**: More reliable for current YouTube API changes
- **Temporary file handling**: Secure download process with cleanup
- **Format selection**: Provides multiple quality options to users
- **Error handling**: Comprehensive error messages for better UX

## Current Status
Application is fully functional with real video and thumbnail download capabilities.