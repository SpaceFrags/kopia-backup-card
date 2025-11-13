# Kopia Backup Status Card (Lovelace Custom Card)

This custom Lovelace card provides a beautiful, streamlined overview of your Kopia snapshot statuses right in your Home Assistant dashboard.

It is **designed specifically to work with the data exposed by the official-unofficial Home Assistant custom component: [Kopia Webhook Integration](https://github.com/SpaceFrags/kopia_webhook).**

by default some icons are set to recognize some specific backups with custom icons based on external packs (table at the end).

<img width="524" height="242" alt="image" src="https://github.com/user-attachments/assets/eaccbc3c-c6ba-4423-bcfc-48da983498e1" />

---

## 💡 How It Works

This card listens for the status entities created by the Kopia Webhook Integration. The integration generates a unique sensor for each of the last few snapshots taken for every unique source path (e.g., `sensor.kopia_status_[WEBHOOK_ID]_snapshot_slot_0`, `sensor.kopia_status_[WEBHOOK_ID]_snapshot_slot_1`, etc.).

The **Kopia Backup Status Card** automatically performs the following:

1.  **Filters:** It finds all relevant sensors based on the `device` (Webhook ID) you provide.
2.  **Groups & Sorts:** It groups the results by **Source Path** (e.g., "docker," "nextcloud," "documents").
3.  **Shows Latest:** It only displays the **single, latest successful snapshot** for each unique source path, ensuring your card stays clean and relevant.
4.  **Formatting:** It shows the human-readable backup size (e.g., "2.7 GB") and the time elapsed since the snapshot (e.g., "5h ago").
5.  **Custom Icons:** It applies smart, recognizable icons based on common source names (e.g., `mdi:docker` for Docker).

---

## 🛠 Installation

### Option 1: HACS (Recommended)

1.  Ensure you have **HACS (Home Assistant Community Store)** installed.
2.  Click the **...** menu in the top right and select **Custom repositories**.
3.  Enter the URL of this GitHub repository and select **Lovelace** as the category.
4.  Click **Add**.
5.  Search for "Kopia Backup" in the HACS Frontend section and click **Install**.
6.  **Reload** your Home Assistant frontend (a hard refresh `Ctrl+F5` or `Shift+F5` is recommended).

### Option 2: Manual Installation

1.  Download the `kopia_backup_card.js` file from the latest release of this repository.
2.  Place the file into your Home Assistant configuration directory under `www/kopia_backup_card/`.
    * Path should look like: `/config/www/kopia_backup_card/kopia_backup_card.js`
3.  Add a resource reference in your Lovelace configuration (via the UI or `ui-lovelace.yaml`):

    **If using the UI:**
    * Go to **Settings** > **Dashboards** > **...** > **Resources**.
    * Click **Add Resource**.
    * **URL:** `/local/kopia_backup_card/kopia_backup_card.js`
    * **Type:** `JavaScript Module`

---

## ⚙️ Card Configuration

After installation, add a new **Custom: Kopia Backup Status Card** to your dashboard. The only mandatory parameter is `device`, which links the card to a specific instance of your Kopia Webhook Integration.

| Parameter | Required | Type | Description | Default | Example |
| :--- | :---: | :--- | :--- | :--- | :--- |
| **type** | Yes | string | Card type. | N/A | `custom:kopia-backup-card` |
| **device** | **Yes** | string | The **unique Webhook ID** defined during the setup of the Kopia Webhook Integration. This ID is used to find all related snapshot sensors. | N/A | `main_server_backups` |
| **name** | No | string | Custom title displayed in the card header. | `Kopia Backups` | `Production Server` |
| **title** | No | string | Alternative to `name` (standard HA practice). | `Kopia Backups` | `Backup Status` |
| **show\_title** | No | boolean | Controls the visibility of the card header. | `true` | `false` |
| **show\_shadow** | No | boolean | Controls the box shadow around the main card and individual backup items. | `true` | `false` |

### Example Lovelace YAML

```yaml
type: custom:kopia-backup-card
# REQUIRED: This must match the Webhook ID you configured in the Kopia Webhook Integration.
device: main_server_backups 
name: Home Server Backups
show_shadow: true # Optional: Keep the shadow effect
```
---

## 🖼 Custom icons

From line 133 of `kopia_backup_card.js` the custom icons can be changed or set with different combinations based on personal need, but some dafualt icons are already selected for some specific backups:

| State | Native icon | Icon name |
| :--- | :---: | :--- |
| **docker** | Yes | mdi:docker |
| **immich** | Yes | mdi:camera-iris |
| **nextcloud** | No | phu:nextcloud |
| **paperless** | No | cust:paperless |
| **homeassistant** | Yes | mdi:home-assistant |
| **photo** | Yes | mdi:image-multiple |
| **documents** | Yes | mdi:file-document |
| ***** | Yes | mdi:database-sync |

Custom icons pack used:
[custom-brand-icons](https://github.com/elax46/custom-brand-icons)
[Hass-Custom-Icons](https://github.com/MattFryer/Hass-Custom-Icons)


