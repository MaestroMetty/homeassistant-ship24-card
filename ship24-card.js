// Use absolute URLs with ?module parameter as per Home Assistant documentation
// Using lit directly as shown in the Home Assistant tutorial
// https://developers.home-assistant.io/docs/frontend/custom-ui/custom-card/
import {
  LitElement,
  html,
  css,
} from "https://unpkg.com/lit@2/index.js?module";

// Card Editor Component
class Ship24CardEditor extends LitElement {
  static get properties() {
    return {
      hass: { type: Object },
      config: { type: Object },
    };
  }

  setConfig(config) {
    this.config = {
      entities: [],
      device: null,
      ignored_entities: [],
      map_height: 400,
      show_list: true,
      default_zoom: 2,
      ...config,
    };
  }

  _valueChanged(ev) {
    if (!this.config) {
      return;
    }
    const target = ev.target;
    const value = target.type === "number" ? parseInt(target.value, 10) : target.value;
    const newConfig = { ...this.config };
    if (target.configValue) {
      if (value === "" || value === undefined) {
        delete newConfig[target.configValue];
      } else {
        newConfig[target.configValue] = value;
      }
    } else if (target.type === "checkbox") {
      newConfig[target.checked] = target.checked;
    }
    this.config = newConfig;
    this._fireChangedEvent();
  }

  _entitiesChanged(ev) {
    if (!this.config) {
      return;
    }
    const newConfig = { ...this.config };
    const value = ev.detail.value;
    if (Array.isArray(value)) {
      newConfig.entities = value;
    } else if (value) {
      newConfig.entities = [value];
    } else {
      newConfig.entities = [];
    }
    this.config = newConfig;
    this._fireChangedEvent();
  }

  _deviceChanged(ev) {
    if (!this.config) {
      return;
    }
    const newConfig = { ...this.config };
    newConfig.device = ev.detail.value || null;
    this.config = newConfig;
    this._fireChangedEvent();
  }

  _ignoredEntitiesChanged(ev) {
    if (!this.config) {
      return;
    }
    const newConfig = { ...this.config };
    const value = ev.detail.value;
    if (Array.isArray(value)) {
      newConfig.ignored_entities = value;
    } else if (value) {
      newConfig.ignored_entities = [value];
    } else {
      newConfig.ignored_entities = [];
    }
    this.config = newConfig;
    this._fireChangedEvent();
  }

  _fireChangedEvent() {
    const event = new CustomEvent("config-changed", {
      detail: { config: this.config },
      bubbles: true,
      composed: true,
    });
    this.dispatchEvent(event);
  }

  render() {
    if (!this.hass || !this.config) {
      return html``;
    }

    return html`
      <div class="card-config">
        <div class="config-section">
          <div class="config-section-header">Device Selection</div>
          <ha-device-picker
            .hass=${this.hass}
            .value=${this.config.device || ""}
            @value-changed=${this._deviceChanged}
            label="Ship24 Tracking Device"
            .includeDeviceClasses=${[]}
          ></ha-device-picker>
          <div class="config-help">
            Select the Ship24 Tracking device. If not specified, the card will search for devices with Ship24 sensors.
          </div>
        </div>

        <div class="config-section">
          <div class="config-section-header">Entities (Optional)</div>
          <ha-entity-picker
            .hass=${this.hass}
            .value=${this.config.entities || []}
            .includeDomains=${["sensor"]}
            .allowCustomEntity=${true}
            @value-changed=${this._entitiesChanged}
            label="Ship24 Sensor Entities"
            .multiple=${true}
          ></ha-entity-picker>
          <div class="config-help">
            Select specific Ship24 sensor entities to display, or leave empty to auto-discover all tracked packages from the selected device.
          </div>
        </div>

        <div class="config-section">
          <div class="config-section-header">Ignored Sensors</div>
          <ha-entity-picker
            .hass=${this.hass}
            .value=${this.config.ignored_entities || []}
            .includeDomains=${["sensor"]}
            .allowCustomEntity=${true}
            @value-changed=${this._ignoredEntitiesChanged}
            label="Sensors to Ignore"
            .multiple=${true}
          ></ha-entity-picker>
          <div class="config-help">
            Select sensors to exclude from the card (e.g., "last_message" sensor). These will not be shown even if they belong to the selected device.
          </div>
        </div>

        <div class="config-section">
          <div class="config-section-header">Map Settings</div>
          <div class="config-field">
            <ha-textfield
              label="Map Height (pixels)"
              type="number"
              .value=${this.config.map_height || 400}
              .configValue=${"map_height"}
              @input=${this._valueChanged}
              min="200"
              max="800"
            ></ha-textfield>
          </div>
          <div class="config-field">
            <ha-textfield
              label="Default Zoom Level"
              type="number"
              .value=${this.config.default_zoom || 2}
              .configValue=${"default_zoom"}
              @input=${this._valueChanged}
              min="0"
              max="18"
            ></ha-textfield>
          </div>
        </div>

        <div class="config-section">
          <div class="config-section-header">Display Options</div>
          <div class="config-field">
            <ha-switch
              .checked=${this.config.show_list !== false}
              .configValue=${"show_list"}
              @change=${this._valueChanged}
            >
              Show Package List
            </ha-switch>
            <div class="config-help">
              Display a list of packages below the map.
            </div>
          </div>
        </div>
      </div>
    `;
  }

  static get styles() {
    return css`
      .card-config {
        padding: 16px;
      }

      .config-section {
        margin-bottom: 24px;
      }

      .config-section-header {
        font-size: 16px;
        font-weight: 500;
        margin-bottom: 12px;
        color: var(--primary-text-color);
      }

      .config-field {
        margin-bottom: 16px;
      }

      .config-field ha-textfield {
        width: 100%;
      }

      .config-field ha-switch {
        margin-right: 8px;
      }

      .config-help {
        font-size: 12px;
        color: var(--secondary-text-color);
        margin-top: 4px;
      }
    `;
  }
}

customElements.define("ship24-card-editor", Ship24CardEditor);

// Load Leaflet CSS and JS dynamically
const loadLeaflet = () => {
  return new Promise((resolve) => {
    if (window.L) {
      resolve();
      return;
    }

    // Load Leaflet CSS
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
    link.integrity = "sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=";
    link.crossOrigin = "";
    document.head.appendChild(link);

    // Load Leaflet JS
    const script = document.createElement("script");
    script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
    script.integrity = "sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=";
    script.crossOrigin = "";
    script.onload = () => {
      // Load marker cluster plugin
      const clusterScript = document.createElement("script");
      clusterScript.src =
        "https://unpkg.com/leaflet.markercluster@1.5.3/dist/leaflet.markercluster.js";
      clusterScript.onload = () => {
        const clusterCss = document.createElement("link");
        clusterCss.rel = "stylesheet";
        clusterCss.href =
          "https://unpkg.com/leaflet.markercluster@1.5.3/dist/MarkerCluster.css";
        document.head.appendChild(clusterCss);
        resolve();
      };
      document.head.appendChild(clusterScript);
    };
    document.head.appendChild(script);
  });
};

class Ship24Card extends LitElement {
  static get properties() {
    return {
      hass: { type: Object },
      config: { type: Object },
      _packages: { state: true },
      _selectedPackage: { state: true },
      _showAddForm: { state: true },
      _map: { state: true },
      _markers: { state: true },
    };
  }

  static getConfigElement() {
    return document.createElement("ship24-card-editor");
  }

  static getStubConfig() {
    return {
      entities: [],
      device: null,
      ignored_entities: [],
      map_height: 400,
      show_list: true,
      default_zoom: 2,
    };
  }

  // The height of your card. Home Assistant uses this to automatically
  // distribute all cards over the available columns in masonry view
  getCardSize() {
    // Base size for map + header
    let size = Math.ceil(this.config.map_height / 50) + 1;
    // Add size for package list if shown
    if (this.config.show_list && this._packages) {
      size += Math.min(this._packages.length, 5) + 1;
    }
    return size;
  }

  // The rules for sizing your card in the grid in sections view
  getGridOptions() {
    return {
      rows: 4,
      columns: 12,
      min_rows: 3,
      max_rows: 8,
    };
  }

  constructor() {
    super();
    this._packages = [];
    this._selectedPackage = null;
    this._currentPackageIndex = 0;
    this._showAddForm = false;
    this._map = null;
    this._markers = [];
    this._markerCluster = null;
  }

  setConfig(config) {
    // Entities are optional - if not provided, card will auto-discover packages
    this.config = {
      entities: [],
      device: null,
      ignored_entities: [],
      map_height: 400,
      show_list: true,
      default_zoom: 2,
      ...config,
    };
    // Ensure entities is an array if provided
    if (this.config.entities && !Array.isArray(this.config.entities)) {
      this.config.entities = [this.config.entities];
    }
    // Ensure ignored_entities is an array if provided
    if (this.config.ignored_entities && !Array.isArray(this.config.ignored_entities)) {
      this.config.ignored_entities = [this.config.ignored_entities];
    }
  }

  firstUpdated() {
    this._updatePackages();
    if (this._packages.length > 0 && !this._selectedPackage) {
      this._selectedPackage = this._packages[0];
      this._currentPackageIndex = 0;
    }
  }

  updated(changedProperties) {
    if (changedProperties.has("hass") || changedProperties.has("config")) {
      this._updatePackages();
      if (this._packages.length > 0 && !this._selectedPackage) {
        this._selectedPackage = this._packages[0];
        this._currentPackageIndex = 0;
      }
    }
  }

  _updatePackages() {
    if (!this.hass || !this.config) return;

    const allStates = this.hass.states;
    const packageEntities = [];
    const ignoredEntities = new Set((this.config.ignored_entities || []).map(e => e.toLowerCase()));

    // If entities are explicitly configured, use them
    if (this.config.entities && this.config.entities.length > 0) {
      packageEntities.push(...this.config.entities);
    } else {
      // Auto-discover sensors based on device selection
      let deviceEntityIds = new Set();

      // If device is specified, try to get entities for that device
      if (this.config.device) {
        // Try to access device registry through hass
        // In Home Assistant frontend, we can access device info through entity registry
        try {
          // Get entity registry if available
          const entityRegistry = this.hass.entities || {};
          for (const [entityId, entity] of Object.entries(entityRegistry)) {
            if (entity && entity.device_id === this.config.device && entityId.startsWith('sensor.')) {
              deviceEntityIds.add(entityId);
            }
          }
        } catch (e) {
          // Fallback: if device registry not accessible, we'll search all sensors
          console.warn('Could not access device registry, searching all sensors');
        }
      }

      // Find all sensor entities that have tracking_number attribute
      for (const [entityId, state] of Object.entries(allStates)) {
        // Only process sensor entities
        if (!entityId.startsWith('sensor.')) continue;
        
        // Skip ignored entities (case-insensitive)
        if (ignoredEntities.has(entityId.toLowerCase())) continue;
        
        // Skip the logging sensor by default (unless explicitly included)
        if (!ignoredEntities.has(entityId.toLowerCase()) && 
            (entityId.includes('last_message') || entityId.includes('_logging'))) {
          continue;
        }
        
        const attrs = state.attributes || {};
        
        // If device is specified and we found device entities, filter by device
        if (this.config.device && deviceEntityIds.size > 0) {
          if (!deviceEntityIds.has(entityId)) {
            continue;
          }
        }
        
        // Check if this is a Ship24 package sensor (has tracking_number attribute)
        if (attrs.tracking_number) {
          packageEntities.push(entityId);
        }
      }
    }

    this._packages = packageEntities
      .map((entityId) => {
        // Skip ignored entities (case-insensitive)
        if (ignoredEntities.has(entityId.toLowerCase())) {
          return null;
        }

        const state = this.hass.states[entityId];
        if (!state) return null;

        const attrs = state.attributes || {};
        
        // Skip logging sensor if somehow included (unless explicitly allowed)
        if (!ignoredEntities.has(entityId.toLowerCase()) &&
            (entityId.includes('last_message') || entityId.includes('_logging'))) {
          return null;
        }
        
        // Only include if it has tracking_number (it's a package sensor)
        if (!attrs.tracking_number) {
          return null;
        }

        return {
          entityId,
          trackingNumber: attrs.tracking_number || entityId.replace('sensor.', ''),
          customName: attrs.custom_name,
          status: attrs.status,
          statusText: attrs.status_text || state.state,
          carrier: attrs.carrier,
          lastUpdate: attrs.last_update,
          estimatedDelivery: attrs.estimated_delivery,
          location: attrs.location,
          locationText: attrs.location_text,
          events: attrs.events || [],
          eventCount: attrs.event_count || 0,
          trackerId: attrs.tracker_id,
        };
      })
      .filter((pkg) => pkg !== null);
  }

  _initMap() {
    if (!window.L) return;

    const mapContainer = this.shadowRoot.getElementById("map");
    if (!mapContainer) return;

    this._map = window.L.map(mapContainer).setView([20, 0], this.config.default_zoom);

    window.L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(this._map);

    // Initialize marker cluster
    if (window.L.markerClusterGroup) {
      this._markerCluster = window.L.markerClusterGroup();
      this._map.addLayer(this._markerCluster);
    }

    this._updateMap();
  }

  _updateMap() {
    if (!this._map || !window.L) return;

    // Clear existing markers
    this._markers.forEach((marker) => {
      if (this._markerCluster) {
        this._markerCluster.removeLayer(marker);
      } else {
        this._map.removeLayer(marker);
      }
    });
    this._markers = [];

    // Add markers for each package
    this._packages.forEach((pkg) => {
      if (!pkg.location || !pkg.location.latitude || !pkg.location.longitude) {
        return;
      }

      const icon = this._getStatusIcon(pkg.status);
      const marker = window.L.marker(
        [pkg.location.latitude, pkg.location.longitude],
        { icon }
      );

      marker.bindPopup(
        `<b>${pkg.customName || pkg.trackingNumber}</b><br>${pkg.statusText}<br>${pkg.locationText || ""}`
      );

      marker.on("click", () => {
        this._showPackageDetails(pkg);
      });

      this._markers.push(marker);

      if (this._markerCluster) {
        this._markerCluster.addLayer(marker);
      } else {
        marker.addTo(this._map);
      }
    });

    // Fit map to show all markers
    if (this._markers.length > 0) {
      const group = new window.L.featureGroup(this._markers);
      this._map.fitBounds(group.getBounds().pad(0.1));
    }
  }

  _getStatusIcon(status) {
    const iconColors = {
      pending: "#FFA500",
      in_transit: "#2196F3",
      out_for_delivery: "#9C27B0",
      delivered: "#4CAF50",
      exception: "#F44336",
      unknown: "#9E9E9E",
    };

    const color = iconColors[status] || iconColors.unknown;

    return window.L.divIcon({
      className: "ship24-marker",
      html: `<div style="background-color: ${color}; width: 20px; height: 20px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>`,
      iconSize: [20, 20],
    });
  }

  _showPackageDetails(pkg) {
    const index = this._packages.findIndex(p => p.entityId === pkg.entityId);
    if (index !== -1) {
      this._currentPackageIndex = index;
      this._selectedPackage = pkg;
    }
  }

  _closeDetails() {
    this._selectedPackage = null;
  }

  _nextPackage() {
    if (this._packages.length === 0) return;
    this._currentPackageIndex = (this._currentPackageIndex + 1) % this._packages.length;
    this._selectedPackage = this._packages[this._currentPackageIndex];
  }

  _prevPackage() {
    if (this._packages.length === 0) return;
    this._currentPackageIndex = (this._currentPackageIndex - 1 + this._packages.length) % this._packages.length;
    this._selectedPackage = this._packages[this._currentPackageIndex];
  }

  _renderStyledMap(pkg) {
    if (!pkg || !pkg.location) {
      return html`<div class="map-placeholder">No location data</div>`;
    }

    // Calculate route path (simplified - you can enhance this with actual route data)
    const startX = 50;
    const startY = 50;
    const endX = 350;
    const endY = 150;
    
    // Create a wavy path
    const path = `M ${startX} ${startY} Q ${(startX + endX) / 2} ${startY - 30} ${endX} ${endY}`;
    
    return html`
      <div class="styled-map">
        <svg viewBox="0 0 400 200" class="map-svg">
          <!-- Background -->
          <rect width="400" height="200" fill="#e8e8e8"/>
          
          <!-- Water areas -->
          <ellipse cx="100" cy="80" rx="60" ry="40" fill="#b3d9ff" opacity="0.6"/>
          <ellipse cx="300" cy="120" rx="50" ry="35" fill="#b3d9ff" opacity="0.6"/>
          
          <!-- Green areas (parks) -->
          <ellipse cx="200" cy="60" rx="40" ry="30" fill="#c8e6c9" opacity="0.7"/>
          <ellipse cx="150" cy="150" rx="35" ry="25" fill="#c8e6c9" opacity="0.7"/>
          
          <!-- Roads -->
          <line x1="0" y1="100" x2="400" y2="100" stroke="white" stroke-width="3" opacity="0.8"/>
          <line x1="200" y1="0" x2="200" y2="200" stroke="white" stroke-width="3" opacity="0.8"/>
          <line x1="0" y1="50" x2="400" y2="150" stroke="white" stroke-width="2" opacity="0.6"/>
          
          <!-- Route path -->
          <path d="${path}" stroke="#2196F3" stroke-width="4" fill="none" stroke-linecap="round" class="route-path">
            <animate attributeName="stroke-dasharray" values="0,1000;1000,0" dur="3s" repeatCount="indefinite"/>
          </path>
          
          <!-- Package icon (start) -->
          <g transform="translate(${startX - 15}, ${startY - 20})">
            <!-- Package box -->
            <rect x="0" y="5" width="30" height="20" fill="#8B4513" rx="2"/>
            <rect x="2" y="7" width="26" height="16" fill="#A0522D"/>
            <!-- Barcode -->
            <line x1="5" y1="10" x2="5" y2="20" stroke="black" stroke-width="1"/>
            <line x1="8" y1="10" x2="8" y2="20" stroke="black" stroke-width="1"/>
            <line x1="11" y1="10" x2="11" y2="20" stroke="black" stroke-width="1"/>
            <line x1="14" y1="10" x2="14" y2="20" stroke="black" stroke-width="1"/>
            <!-- Icons -->
            <circle cx="20" cy="12" r="3" fill="black" opacity="0.3"/>
            <path d="M 22 10 L 24 12 L 22 14 Z" fill="black" opacity="0.3"/>
          </g>
          
          <!-- Destination pin (end) -->
          <g transform="translate(${endX}, ${endY})">
            <path d="M 0 0 L -8 15 L 8 15 Z" fill="black"/>
            <circle cx="0" cy="0" r="6" fill="black"/>
            <circle cx="0" cy="0" r="3" fill="white"/>
          </g>
        </svg>
      </div>
    `;
  }

  _toggleAddForm() {
    this._showAddForm = !this._showAddForm;
  }

  async _addPackage() {
    const form = this.shadowRoot.getElementById("add-form");
    const formData = new FormData(form);
    const trackingNumber = formData.get("tracking_number");
    const customName = formData.get("custom_name");

    if (!trackingNumber) {
      alert("Tracking number is required");
      return;
    }

    // Call Home Assistant service
    await this.hass.callService("ship24", "add_tracking", {
      tracking_number: trackingNumber,
      custom_name: customName || null,
    });

    // Reset form
    form.reset();
    this._showAddForm = false;

    // Refresh after a moment
    setTimeout(() => {
      this._updatePackages();
      if (this._packages.length > 0 && !this._selectedPackage) {
        this._selectedPackage = this._packages[0];
        this._currentPackageIndex = 0;
      }
    }, 1000);
  }

  _formatDate(dateString) {
    if (!dateString) return "N/A";
    try {
      return new Date(dateString).toLocaleString();
    } catch {
      return dateString;
    }
  }

  render() {
    if (!this.config) {
      return html`<ha-card><div class="error">Invalid configuration</div></ha-card>`;
    }

    const currentPkg = this._selectedPackage || (this._packages.length > 0 ? this._packages[this._currentPackageIndex] : null);
    const packageNumber = this._packages.length > 0 ? this._currentPackageIndex + 1 : 0;

    return html`
      <ha-card class="modern-card">
        <div class="card-header">
          <div class="title">Package Tracking</div>
          <ha-icon-button
            .label=${this._showAddForm ? "Close" : "Add Package"}
            @click=${this._toggleAddForm}
          >
            <ha-icon .icon=${this._showAddForm ? "mdi:close" : "mdi:plus"}></ha-icon>
          </ha-icon-button>
        </div>

        ${this._showAddForm
          ? html`
              <div class="add-form-container">
                <form id="add-form" @submit=${(e) => { e.preventDefault(); this._addPackage(); }}>
                  <div class="form-field">
                    <label>Tracking Number *</label>
                    <input
                      type="text"
                      name="tracking_number"
                      required
                      placeholder="Enter tracking number"
                    />
                  </div>
                  <div class="form-field">
                    <label>Custom Name (optional)</label>
                    <input
                      type="text"
                      name="custom_name"
                      placeholder="Enter custom name"
                    />
                  </div>
                  <div class="form-actions">
                    <mwc-button type="submit" raised>Add Package</mwc-button>
                    <mwc-button @click=${this._toggleAddForm}>Cancel</mwc-button>
                  </div>
                </form>
              </div>
            `
          : ""}

        ${currentPkg
          ? html`
              <!-- Styled Map Section -->
              <div class="map-container">
                ${this._renderStyledMap(currentPkg)}
              </div>

              <!-- Package Details Section -->
              <div class="package-details-section">
                <div class="package-header">
                  <button class="nav-button" @click=${this._prevPackage} ?disabled=${this._packages.length <= 1}>
                    <ha-icon icon="mdi:chevron-left"></ha-icon>
                  </button>
                  <div class="package-title">PARCEL#${packageNumber}</div>
                  <button class="nav-button" @click=${this._nextPackage} ?disabled=${this._packages.length <= 1}>
                    <ha-icon icon="mdi:chevron-right"></ha-icon>
                  </button>
                </div>
                
                <div class="updates-list">
                  ${currentPkg.events && currentPkg.events.length > 0
                    ? currentPkg.events
                        .slice()
                        .reverse()
                        .slice(0, 5)
                        .map(
                          (event, index) => html`
                            <div class="update-item">
                              - UPDATE ${currentPkg.events.length - index}${index === 0 && currentPkg.events.length > 5 ? "..." : ""}
                            </div>
                          `
                        )
                    : html`<div class="update-item">- No updates available</div>`}
                </div>
              </div>
            `
          : html`
              <div class="empty-state-container">
                <div class="map-placeholder">No packages tracked</div>
                <div class="package-details-section empty">
                  <div class="package-header">
                    <div class="package-title">No Packages</div>
                  </div>
                  <div class="updates-list">
                    <div class="update-item">Add a package to start tracking</div>
                  </div>
                </div>
              </div>
            `}
      </ha-card>
    `;
  }

  static get styles() {
    return css`
      ha-card.modern-card {
        padding: 0;
        overflow: hidden;
      }

      .card-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 16px;
        border-bottom: 1px solid var(--divider-color, rgba(0, 0, 0, 0.12));
      }

      .title {
        font-size: 20px;
        font-weight: 500;
        color: var(--primary-text-color);
      }

      .add-form-container {
        padding: 16px;
        background: var(--card-background-color, #fff);
      }

      .form-field {
        margin-bottom: 16px;
      }

      .form-field label {
        display: block;
        margin-bottom: 8px;
        font-weight: 500;
      }

      .form-field input {
        width: 100%;
        padding: 8px;
        border: 1px solid var(--divider-color, #ddd);
        border-radius: 4px;
        box-sizing: border-box;
      }

      .form-actions {
        display: flex;
        gap: 8px;
        justify-content: flex-end;
      }

      /* Styled Map Container */
      .map-container {
        width: 100%;
        height: 250px;
        background: #e8e8e8;
        border-radius: 8px 8px 0 0;
        overflow: hidden;
        position: relative;
      }

      .styled-map {
        width: 100%;
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .map-svg {
        width: 100%;
        height: 100%;
      }

      .route-path {
        filter: drop-shadow(0 2px 4px rgba(33, 150, 243, 0.3));
        animation: routeAnimation 3s ease-in-out infinite;
      }

      @keyframes routeAnimation {
        0%, 100% {
          opacity: 0.8;
        }
        50% {
          opacity: 1;
        }
      }

      .map-placeholder {
        width: 100%;
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        color: var(--secondary-text-color, #888);
        font-size: 16px;
      }

      /* Package Details Section */
      .package-details-section {
        background: #424242;
        padding: 20px;
        border-radius: 0 0 8px 8px;
        min-height: 150px;
      }

      .package-details-section.empty {
        background: #424242;
      }

      .package-header {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 16px;
        margin-bottom: 20px;
      }

      .nav-button {
        width: 40px;
        height: 40px;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.1);
        border: none;
        color: white;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: background 0.2s;
      }

      .nav-button:hover:not(:disabled) {
        background: rgba(255, 255, 255, 0.2);
      }

      .nav-button:disabled {
        opacity: 0.3;
        cursor: not-allowed;
      }

      .package-title {
        font-size: 24px;
        font-weight: 600;
        color: white;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        letter-spacing: 1px;
      }

      .updates-list {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }

      .update-item {
        color: white;
        font-size: 14px;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        padding: 4px 0;
      }

      .empty-state-container {
        display: flex;
        flex-direction: column;
      }

      .error {
        padding: 16px;
        color: var(--error-color, #f44336);
      }
    `;
  }
}

// Register custom elements
console.log("Ship24 Card: Registering custom elements...");
if (!customElements.get("ship24-card")) {
  customElements.define("ship24-card", Ship24Card);
  console.log("Ship24 Card: ship24-card registered");
} else {
  console.log("Ship24 Card: ship24-card already registered");
}

if (!customElements.get("ship24-card-editor")) {
  customElements.define("ship24-card-editor", Ship24CardEditor);
  console.log("Ship24 Card: ship24-card-editor registered");
} else {
  console.log("Ship24 Card: ship24-card-editor already registered");
}

// Register with custom cards registry
window.customCards = window.customCards || [];
if (!window.customCards.find(card => card.type === "ship24-card")) {
  window.customCards.push({
    type: "ship24-card",
    name: "Ship24 Package Tracking Card",
    description: "Track packages with interactive map and timeline",
  });
  console.log("Ship24 Card: Registered with custom cards registry");
} else {
  console.log("Ship24 Card: Already in custom cards registry");
}

