import { defaultPreferences, type Preferences, type PreferencesPatch, type PreferencesRecord } from './preference-values';
export type SyncView = { preferences: Preferences; status: 'loading' | 'synced' | 'saving' | 'error'; error: string; ready: boolean };
export interface PreferencesTransport {
  read(): Promise<PreferencesRecord | null>;
  write(patch: PreferencesPatch, initialize: boolean): Promise<PreferencesRecord>;
}
// One queue per signed-in identity. Only user-edited fields are sent; stale reads
// cannot replace pending edits, and a disposed account never starts another write.
export class PreferenceSync {
  private value = defaultPreferences();
  private pending: PreferencesPatch = {};
  private revision = -1;
  private alive = true;
  private ready = false;
  private writing: Promise<void> | null = null;
  private reading: Promise<void> | null = null;
  constructor(private transport: PreferencesTransport, private seed: Preferences, private emit: (view: SyncView) => void) {}
  private publish(status: SyncView['status'], error = '') { if (this.alive) this.emit({ preferences: this.value, status, error, ready: this.ready }); }
  private accept(record: PreferencesRecord) {
    if (record.revision < this.revision) return;
    this.revision = record.revision;
    this.value = { ...record.preferences, ...this.pending };
  }
  refresh(): Promise<void> {
    if (!this.alive) return Promise.resolve();
    if (this.writing || Object.keys(this.pending).length) return this.flush();
    if (this.reading) return this.reading;
    this.reading = (async () => {
      try {
        let record = await this.transport.read();
        if (!this.alive) return;
        if (!record) record = await this.transport.write(this.seed, true);
        if (!this.alive) return;
        this.accept(record); this.ready = true; this.publish(Object.keys(this.pending).length ? 'saving' : 'synced');
      } catch (error) { this.publish('error', error instanceof Error ? error.message : '同步失败，请重试。'); throw error; }
      finally { this.reading = null; }
    })();
    return this.reading;
  }
  change(patch: PreferencesPatch) {
    if (!this.alive || !this.ready) return false;
    this.pending = { ...this.pending, ...patch };
    this.value = { ...this.value, ...patch }; this.publish('saving');
    return true;
  }
  flush(): Promise<void> {
    if (!this.alive) return Promise.resolve();
    if (!this.ready) return Promise.resolve(); // No edits are accepted before initialization.
    if (this.writing) return this.writing;
    if (!Object.keys(this.pending).length) return Promise.resolve();
    this.writing = (async () => {
      // Wait for an older read before sending so its response cannot paint stale data.
      if (this.reading) await this.reading;
      while (this.alive && Object.keys(this.pending).length) {
        const sent = this.pending; this.pending = {};
        try {
          const record = await this.transport.write(sent, false);
          if (!this.alive) return;
          this.accept(record);
        } catch (error) {
          this.pending = { ...sent, ...this.pending };
          this.publish('error', error instanceof Error ? error.message : '保存失败，请重试。'); throw error;
        }
      }
      this.publish('synced');
    })().finally(() => { this.writing = null; });
    return this.writing;
  }
  hasPending() { return Object.keys(this.pending).length > 0 || Boolean(this.writing); }
  dispose() { this.alive = false; this.pending = {}; }
}
