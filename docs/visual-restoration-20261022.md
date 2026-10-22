# Restore circuit and playback visuals

The login page restores the original circuit SVG from commit `89bf46b`, while retaining the continuous ambient and circuit motion and the current account workflow. The viewing-entry card replaces the car image with a filled playback triangle. Neither surface imports or requests the concept-car artwork. The unapproved cartoon preview is not included.

The latest live-content transitions and persistent glass navigation are unchanged. Existing project checks, a production build and browser visual checks passed. Login markup contains one circuit and no car; the viewing entry contains the playback icon and no car image.

Rollback: `backup/pre-track-restore-20261022-3a75dbc`; preceding Cloudflare version `9bba6d02`.
