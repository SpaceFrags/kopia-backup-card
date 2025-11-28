// Copyright 2024 SpaceFrags
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
class KopiaBackupCard extends HTMLElement {
  // Home Assistant provides the hass object to the custom card
  set hass(hass) {
    this._hass = hass;
    this.render();
  }

  // Set the card's configuration
  setConfig(config) {
    // We require the 'device' property, which MUST be the unique Webhook ID
    if (!config.device) {
      throw new Error("You must define 'device'. Its value must be the unique Kopia instance's Webhook ID (e.g., 'kopia_backup').");
    }
    this.config = config;

    // Create the HTML structure of the card once.
    if (!this.shadowRoot) {
      this.attachShadow({ mode: 'open' });
      const card = document.createElement('div');
      card.className = 'card';

      const style = document.createElement('style');
      style.textContent = `
        :host {
          display: block;
          padding: 12px;
          /* Using HA variables for colors */
          background-color: var(--card-background-color, white);
          border-radius: var(--ha-card-border-radius, 12px);
          color: var(--primary-text-color, #333);
          font-family: var(--ha-card-font-family, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif);
          /* Keeping user's shadow logic */
          ${config.show_shadow !== false ? 'box-shadow: var(--ha-card-box-shadow, 0px 0px 10px rgba(0,0,0,0.1));' : ''}
        }
        .header {
          font-size: 16px;
          font-weight: bold;
          margin-bottom: 8px;
          color: var(--primary-text-color, #111);
        }
        .content {
          display: flex; 
          flex-direction: column;
          gap: 8px; /* Gap between individual backup-items */
        }
        .backup-item {
          display: flex;
          align-items: center;
          /* Restoring the "square" look with custom colors */
          background-color: var(--ha-card-background-color, #f0f0f0);
          border-radius: 8px;
          padding: 6px 8px;
          ${config.show_shadow !== false ? 'box-shadow: inset 0px 0px 5px rgba(0,0,0,0.05);' : ''}
        }
        .backup-icon-container {
            display: flex;
            align-items: center;
            justify-content: center;
            width: 32px;
            height: 32px;
            margin-right: 8px;
            background-color: var(--card-background-color, white);
            border-radius: 6px;
            box-shadow: 0px 1px 3px rgba(0,0,0,0.1);
        }
        .backup-details {
          display: flex;
          flex-direction: column; /* Stacks Name and Status vertically */
          flex-grow: 1;
        }
        .backup-name {
          font-size: 14px;
          font-weight: bold;
          color: var(--primary-text-color, #333);
        }
        .backup-status {
          display: flex;
          justify-content: space-between; /* Size left, Time right */
          align-items: center;
          width: 100%;
        }
        .backup-status-text {
          font-size: 12px;
          font-weight: bold;
        }
        .backup-info-text {
          font-size: 12px;
          color: var(--secondary-text-color, #555);
          white-space: nowrap;
        }
      `;

      card.appendChild(style);
      
      // Use config.title or config.name for the header, defaulting to 'Kopia Backups'
      if (this.config.show_title !== false) {
          const header = document.createElement('div');
          header.className = 'header';
          header.textContent = config.name || config.title || 'Kopia Backups';
          card.appendChild(header);
      }

      this.content = document.createElement('div');
      this.content.className = 'content';
      card.appendChild(this.content);
      
      this.shadowRoot.appendChild(card);
    }
  }

  // --- Helper to format time as "X time ago" ---
  formatTimeAgo(timestamp) {
    if (!timestamp) return 'N/A';
    
    // The attribute is a date string like: "Thu, 13 Nov 2025 01:00:48 +0100"
    const endDate = new Date(timestamp);
    const now = new Date();
    const timeAgoSeconds = Math.floor((now - endDate) / 1000); 

    if (isNaN(timeAgoSeconds) || timeAgoSeconds < 0) return 'N/A';

    if (timeAgoSeconds < 60) {
      return `${timeAgoSeconds}s ago`;
    } else if (timeAgoSeconds < 3600) {
      return `${Math.floor(timeAgoSeconds / 60)}m ago`;
    } else if (timeAgoSeconds < 86400) {
      return `${Math.floor(timeAgoSeconds / 3600)}h ago`;
    } else {
      return `${Math.floor(timeAgoSeconds / 86400)}d ago`;
    }
  }

  // --- Helper to select custom icon based on source name ---
  getCustomIcon(sourceName) {
    switch (sourceName.toLowerCase()) {
      case 'docker':
        return 'mdi:docker';
      case 'immich':
        return 'mdi:camera-iris';
      case 'nextcloud':
        return 'phu:nextcloud'; // Assuming 'phu' is a custom icon set the user has
      case 'paperless':
        return 'cust:paperless'; // Assuming 'cust' is a custom icon set the user has
      case 'homeassistant':
        return 'mdi:home-assistant';
      case 'photos':
        return 'mdi:image-multiple';
      case 'documents':
        return 'mdi:file-document';
      case 'git':
        return 'mdi:github';
      case 'ollama':
        return 'cust:ollama'; // Assuming 'cust' is a custom icon set the user has
      case 'romm':
        return 'cust:romm'; // Assuming 'cust' is a custom icon set the user has
      case 'vaultwarden':
        return 'cust:vaultwarden'; // Assuming 'cust' is a custom icon set the user has
      case 'plex':
        return 'mdi:plex';
      case 'radarr':
        return 'phu:radarr'; // Assuming 'phu' is a custom icon set the user has
      case 'sonarr':
        return 'phu:sonarr'; // Assuming 'phu' is a custom icon set the user has
      default:
        return 'mdi:database-sync'; // Generic backup icon
    }
  }

  // Main rendering logic
  render() {
    if (!this._hass || !this.config || !this.content) {
      return;
    }

    const webhookId = this.config.device;
    let html = '';

    // Construct the required unique prefix based on the Webhook ID
    // Reverting to the logic that filters by the dynamic entity IDs
    const requiredPrefix = `sensor.kopia_status_${webhookId}_snapshot_slot_`;

    // 1. Filter and find the LATEST snapshot for each unique source (state)
    const filteredEntities = Object.keys(this._hass.states)
      .filter(entityId => entityId.startsWith(requiredPrefix));

    const latestSnapshots = {}; 

    for (const entityId of filteredEntities) {
      const state = this._hass.states[entityId];
      
      // Ensure we have a valid source name (state) and the required end_time attribute
      if (state.state === 'unavailable' || state.state === 'unknown' || !state.attributes || !state.attributes.end_time) {
        continue;
      }

      const sourceName = state.state; 
      const endTime = new Date(state.attributes.end_time);

      // Store only the newest snapshot per sourceName
      if (!latestSnapshots[sourceName] || endTime > new Date(latestSnapshots[sourceName].attributes.end_time)) {
        latestSnapshots[sourceName] = state;
      }
    }

    // Prepare list for rendering
    let snapshotsToRender = Object.values(latestSnapshots);
    snapshotsToRender.sort((a, b) => a.state.localeCompare(b.state)); // Sort alphabetically

    if (snapshotsToRender.length === 0) {
        this.content.innerHTML = `<div style="padding: 16px; color: var(--secondary-text-color, #777); text-align: center;">
            No valid snapshots found for <strong>${webhookId}</strong>.
        </div>`;
        return;
    }

    // 2. Render the final, filtered list
    for (const state of snapshotsToRender) {
      
      // Capitalize the first letter for display ('docker' -> 'Docker')
      const sourceName = state.state;
      const name = sourceName.charAt(0).toUpperCase() + sourceName.slice(1);
      
      // --- Get Attributes (lowercase as requested) ---
      const status = state.attributes.status;
      
      // FIX: Get the size as a raw string (e.g., "2.7 GB")
      const sizeText = state.attributes.size || 'N/A';
      
      const endTime = state.attributes.end_time; 

      // Format data
      const formattedTime = this.formatTimeAgo(endTime);
      
      // Get Status and Icon
      let statusColor = 'var(--primary-color, #3498db)';
      let icon = this.getCustomIcon(sourceName); // Use custom icon helper
      let statusText = 'Unknown';
      
      if (status) {
        const lowerStatus = status.toLowerCase();
        if (lowerStatus === 'success') {
          statusColor = 'var(--label-badge-green, #2ecc71)'; 
          statusText = 'Success';
        } else if (lowerStatus === 'error' || lowerStatus === 'failure') {
          statusColor = 'var(--label-badge-red, #e74c3c)'; 
          statusText = 'Error';
        } else if (lowerStatus === 'in progress') {
          statusColor = 'var(--label-badge-yellow, #f39c12)';
          statusText = 'In Progress';
        } else {
          statusText = status;
        }
      }

      let detailsContent;
      if (statusText === 'In Progress' || statusText === 'Error') {
        // If status is not successful, show status text below the name
        detailsContent = `
          <div class="backup-status">
            <span class="backup-status-text" style="color: ${statusColor};">
              ${statusText}
            </span>
          </div>
        `;
      } else {
        // Successful backup: group size and time-ago below the name
        detailsContent = `
          <div class="backup-status">
            <span class="backup-info-text">
              ${sizeText} <!-- Now displaying raw size string -->
            </span>
            <span class="backup-info-text">
              ${formattedTime}
            </span>
          </div>
        `;
      }

      html += `
        <div class="backup-item">
          <div class="backup-icon-container">
            <ha-icon icon="${icon}" style="color: ${statusColor};"></ha-icon>
          </div>
          <div class="backup-details">
            <span class="backup-name" title="${name}">
              ${name}
            </span>
            ${detailsContent}
          </div>
        </div>
      `;
    }

    this.content.innerHTML = html;
  }

  // This method is required for the card to be recognized by Home Assistant.
  getCardSize() {
    return 3;
  }
}

// Register the card with Home Assistant
customElements.define('kopia-backup-card', KopiaBackupCard);
