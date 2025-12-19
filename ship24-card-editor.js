import { LitElement, html, css } from "lit";
import { property } from "lit/decorators.js";

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

