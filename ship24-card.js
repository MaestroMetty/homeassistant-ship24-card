import { LitElement, html, css } from "lit";
import { property, state } from "lit/decorators.js";

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
          <div class="config-section-header">Entities</div>
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
            Select one or more Ship24 sensor entities to display on the card.
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
      map_height: 400,
      show_list: true,
      default_zoom: 2,
    };
  }

  constructor() {
    super();
    this._packages = [];
    this._selectedPackage = null;
    this._showAddForm = false;
    this._map = null;
    this._markers = [];
    this._markerCluster = null;
  }

  setConfig(config) {
    if (!config.entities || !Array.isArray(config.entities)) {
      throw new Error("Entities must be specified");
    }
    this.config = {
      map_height: 400,
      show_list: true,
      default_zoom: 2,
      ...config,
    };
  }

  firstUpdated() {
    this._updatePackages();
    loadLeaflet().then(() => {
      this._initMap();
    });
  }

  updated(changedProperties) {
    if (changedProperties.has("hass") || changedProperties.has("config")) {
      this._updatePackages();
      if (this._map) {
        this._updateMap();
      }
    }
  }

  _updatePackages() {
    if (!this.hass || !this.config) return;

    this._packages = this.config.entities
      .map((entityId) => {
        const state = this.hass.states[entityId];
        if (!state) return null;

        const attrs = state.attributes;
        return {
          entityId,
          trackingNumber: attrs.tracking_number || entityId,
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
    this._selectedPackage = pkg;
  }

  _closeDetails() {
    this._selectedPackage = null;
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
      if (this._map) {
        this._updateMap();
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

    return html`
      <ha-card>
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

        <div id="map" style="height: ${this.config.map_height}px; width: 100%;"></div>

        ${this.config.show_list
          ? html`
              <div class="package-list">
                <div class="list-header">Packages (${this._packages.length})</div>
                ${this._packages.length === 0
                  ? html`<div class="empty-state">No packages tracked</div>`
                  : this._packages.map(
                      (pkg) => html`
                        <div
                          class="package-item"
                          @click=${() => this._showPackageDetails(pkg)}
                        >
                          <div class="package-status ${pkg.status}">
                            <div class="status-dot"></div>
                          </div>
                          <div class="package-info">
                            <div class="package-name">
                              ${pkg.customName || pkg.trackingNumber}
                            </div>
                            <div class="package-meta">
                              ${pkg.statusText} • ${pkg.carrier || "Unknown Carrier"}
                            </div>
                            <div class="package-update">
                              Last update: ${this._formatDate(pkg.lastUpdate)}
                            </div>
                          </div>
                          <ha-icon icon="mdi:chevron-right"></ha-icon>
                        </div>
                      `
                    )}
              </div>
            `
          : ""}

        ${this._selectedPackage
          ? html`
              <ha-dialog
                open
                .heading=${this._selectedPackage.customName ||
                this._selectedPackage.trackingNumber}
                @closed=${this._closeDetails}
              >
                <div class="package-details">
                  <div class="detail-section">
                    <div class="detail-label">Tracking Number</div>
                    <div class="detail-value">${this._selectedPackage.trackingNumber}</div>
                  </div>
                  <div class="detail-section">
                    <div class="detail-label">Status</div>
                    <div class="detail-value status-${this._selectedPackage.status}">
                      ${this._selectedPackage.statusText}
                    </div>
                  </div>
                  <div class="detail-section">
                    <div class="detail-label">Carrier</div>
                    <div class="detail-value">${this._selectedPackage.carrier || "Unknown"}</div>
                  </div>
                  <div class="detail-section">
                    <div class="detail-label">Last Update</div>
                    <div class="detail-value">
                      ${this._formatDate(this._selectedPackage.lastUpdate)}
                    </div>
                  </div>
                  ${this._selectedPackage.estimatedDelivery
                    ? html`
                        <div class="detail-section">
                          <div class="detail-label">Estimated Delivery</div>
                          <div class="detail-value">
                            ${this._formatDate(this._selectedPackage.estimatedDelivery)}
                          </div>
                        </div>
                      `
                    : ""}
                  ${this._selectedPackage.locationText
                    ? html`
                        <div class="detail-section">
                          <div class="detail-label">Location</div>
                          <div class="detail-value">${this._selectedPackage.locationText}</div>
                        </div>
                      `
                    : ""}
                  ${this._selectedPackage.events && this._selectedPackage.events.length > 0
                    ? html`
                        <div class="detail-section">
                          <div class="detail-label">Tracking Timeline</div>
                          <div class="timeline">
                            ${this._selectedPackage.events
                              .slice()
                              .reverse()
                              .map(
                                (event) => html`
                                  <div class="timeline-item">
                                    <div class="timeline-time">
                                      ${this._formatDate(event.timestamp)}
                                    </div>
                                    <div class="timeline-content">
                                      <div class="timeline-status">${event.status_text || event.status || ""}</div>
                                      <div class="timeline-description">
                                        ${event.description || event.location || "Update"}
                                      </div>
                                      ${event.location
                                        ? html`<div class="timeline-location">${event.location}</div>`
                                        : ""}
                                    </div>
                                  </div>
                                `
                              )}
                          </div>
                        </div>
                      `
                    : ""}
                </div>
                <mwc-button slot="primaryAction" @click=${this._closeDetails}>Close</mwc-button>
              </ha-dialog>
            `
          : ""}
      </ha-card>
    `;
  }

  static get styles() {
    return css`
      ha-card {
        padding: 16px;
      }

      .card-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 16px;
      }

      .title {
        font-size: 24px;
        font-weight: 500;
      }

      .add-form-container {
        margin-bottom: 16px;
        padding: 16px;
        background: var(--card-background-color, #fff);
        border-radius: 4px;
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

      #map {
        border-radius: 4px;
        margin-bottom: 16px;
      }

      .package-list {
        margin-top: 16px;
      }

      .list-header {
        font-size: 18px;
        font-weight: 500;
        margin-bottom: 12px;
      }

      .empty-state {
        text-align: center;
        padding: 32px;
        color: var(--secondary-text-color, #888);
      }

      .package-item {
        display: flex;
        align-items: center;
        padding: 12px;
        margin-bottom: 8px;
        background: var(--card-background-color, #fff);
        border-radius: 4px;
        cursor: pointer;
        transition: background 0.2s;
      }

      .package-item:hover {
        background: var(--divider-color, #f0f0f0);
      }

      .package-status {
        margin-right: 12px;
      }

      .status-dot {
        width: 12px;
        height: 12px;
        border-radius: 50%;
        background: var(--status-color, #9e9e9e);
      }

      .package-status.pending .status-dot {
        background: #ffa500;
      }

      .package-status.in_transit .status-dot {
        background: #2196f3;
      }

      .package-status.out_for_delivery .status-dot {
        background: #9c27b0;
      }

      .package-status.delivered .status-dot {
        background: #4caf50;
      }

      .package-status.exception .status-dot {
        background: #f44336;
      }

      .package-info {
        flex: 1;
      }

      .package-name {
        font-weight: 500;
        margin-bottom: 4px;
      }

      .package-meta {
        font-size: 14px;
        color: var(--secondary-text-color, #888);
        margin-bottom: 4px;
      }

      .package-update {
        font-size: 12px;
        color: var(--secondary-text-color, #888);
      }

      .package-details {
        padding: 16px 0;
      }

      .detail-section {
        margin-bottom: 16px;
      }

      .detail-label {
        font-size: 12px;
        color: var(--secondary-text-color, #888);
        text-transform: uppercase;
        margin-bottom: 4px;
      }

      .detail-value {
        font-size: 16px;
      }

      .timeline {
        margin-top: 8px;
      }

      .timeline-item {
        padding: 12px;
        margin-bottom: 8px;
        background: var(--card-background-color, #f5f5f5);
        border-left: 3px solid var(--primary-color, #03a9f4);
        border-radius: 4px;
      }

      .timeline-time {
        font-size: 12px;
        color: var(--secondary-text-color, #888);
        margin-bottom: 4px;
      }

      .timeline-status {
        font-weight: 500;
        margin-bottom: 4px;
      }

      .timeline-description {
        margin-bottom: 4px;
      }

      .timeline-location {
        font-size: 12px;
        color: var(--secondary-text-color, #888);
      }

      .error {
        padding: 16px;
        color: var(--error-color, #f44336);
      }
    `;
  }
}

customElements.define("ship24-card", Ship24Card);

window.customCards = window.customCards || [];
window.customCards.push({
  type: "ship24-card",
  name: "Ship24 Package Tracking Card",
  description: "Track packages with interactive map and timeline",
});

