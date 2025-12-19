# Ship24 Package Tracking Card

[![hacs_badge](https://img.shields.io/badge/HACS-Custom-orange.svg)](https://github.com/custom-components/hacs)

A beautiful, multi-functional Lovelace card for tracking packages using the Ship24 integration. Features an interactive map, package list, and detailed package information.

## Features

- **Interactive Map**: Visualize package locations on a Leaflet map
  - Color-coded markers based on package status
  - Click markers to view package details
  - Marker clustering when zoomed out
- **Package List**: Scrollable list of all tracked packages
  - Status indicators
  - Custom names or tracking numbers
  - Last update timestamps
  - Quick access to package details
- **Add Package**: Quick form to add new tracking numbers
  - Tracking number input
  - Optional custom name
  - Direct integration with Ship24 integration
- **Package Details**: Full package information modal
  - Complete tracking timeline
  - Location visualization
  - Estimated delivery date
  - Carrier information
  - Editable custom name

## Installation

### HACS (Recommended)

1. Open HACS in Home Assistant
2. Go to Frontend
3. Click the three dots in the top right
4. Select "Custom repositories"
5. Add this repository URL
6. Click "Install"

### Manual Installation

1. Copy `ship24-card.js` to your `www/community/ship24-card/` directory
2. Add the card resource in Lovelace:
   ```yaml
   resources:
     - url: /local/community/ship24-card/ship24-card.js
       type: module
   ```
3. Restart Home Assistant

## Requirements

- Home Assistant 2024.1.0 or later
- Ship24 integration installed and configured
- Ship24 sensor entities created

## Usage

Add the card to your Lovelace dashboard:

```yaml
type: custom:ship24-card
entities:
  - sensor.ship24_1234567890
  - sensor.ship24_0987654321
map_height: 400
show_list: true
default_zoom: 2
```

## Card Configuration

| Name | Type | Default | Description |
|------|------|---------|-------------|
| `entities` | array | **Required** | List of Ship24 sensor entity IDs |
| `map_height` | number | `400` | Height of the map in pixels |
| `show_list` | boolean | `true` | Show package list below map |
| `default_zoom` | number | `2` | Default map zoom level (0-18) |

## Example

```yaml
type: custom:ship24-card
entities:
  - sensor.ship24_1z999aa10123456784
  - sensor.ship24_9400111899223197428490
map_height: 500
show_list: true
default_zoom: 3
title: My Packages
```

## Support

For issues, feature requests, or questions, please open an issue on [GitHub](https://github.com/yourusername/homeassistant-ship24-card/issues).

## License

MIT License

