/* =============================================
   HELLION NEWTAB — i18n.js
   Internationalisierung: DE/EN Sprachumschaltung
   ============================================= */

const STRINGS = {
  de: {
    // Dialog-System
    'dialog.default_title':    'Hinweis',
    'dialog.ok':               'OK',
    'dialog.confirm_title':    'Bestätigung',
    'dialog.cancel':           'Abbrechen',
    'dialog.close':            'Schließen',

    // Boards
    'boards.empty_state_pre':  'Noch keine Boards. Klicke auf ',
    'boards.add_board':        '+ Board',
    'boards.empty_state_mid':  ' um eins zu erstellen, oder nutze ',
    'boards.import':           'Import',
    'boards.empty_state_post': ' um deine Browser-Lesezeichen zu laden.',
    'boards.drag_title':       'Board verschieben',
    'boards.blur':             'Blur (privat)',
    'boards.unblur':           'Unblur',
    'boards.rename':           'Umbenennen',
    'boards.delete':           'Löschen',
    'boards.delete_confirm':   'Board „{title}" wirklich löschen?',
    'boards.delete_confirm.title': 'Board löschen',
    'boards.show_more':        '{count} weitere anzeigen…',
    'boards.show_less':        'Weniger anzeigen',
    'boards.add_link':         ' Link hinzufügen',
    'boards.remove_bookmark':  'Entfernen',

    // Onboarding
    'onboarding.skip':         'Überspringen',
    'onboarding.back':         'Zurück',
    'onboarding.next':         'Weiter',
    'onboarding.start':        'Los geht\'s!',
    'onboarding.yes':          'Ja, gerne',
    'onboarding.no':           'Nein danke',
    'onboarding.s1.title':     'Willkommen bei Hellion Dashboard',
    'onboarding.s1.text':      'Dein neuer Browser-Startbildschirm. Minimalistisch, schnell und vollständig lokal — keine Cloud, kein Account, keine Datensammlung.',
    'onboarding.s2.title':     'Boards & Bookmarks',
    'onboarding.s2.f1':        'Erstelle Boards mit dem „+ Board" Button oben',
    'onboarding.s2.f2':        'Importiere Browser-Lesezeichen über den „Import" Button im Header',
    'onboarding.s2.f3':        'Drag & Drop zum Umsortieren von Boards und Links',
    'onboarding.s2.f4':        'Blur-Modus für private Boards (🔒 Icon)',
    'onboarding.s3.title':     '11 handgefertigte Themes',
    'onboarding.s3.text':      'Klicke auf den „Theme" Button im Header um dein Theme zu wählen. Jedes hat seinen eigenen Stil und Farbpalette.',
    'onboarding.s4.title':     'Widget-Toolbar',
    'onboarding.s4.f1':        'Die schwebenden Buttons rechts öffnen Widgets',
    'onboarding.s4.f2':        'Notes und Checklisten für schnelle Notizen',
    'onboarding.s4.f3':        'Taschenrechner mit History',
    'onboarding.s4.f4':        'Timer/Countdown mit speicherbaren Presets',
    'onboarding.s4.f5':        'Bild-Referenz Widgets (aktivierbar in Settings)',
    'onboarding.s4.f6':        'Notebook-Sidebar zeigt alle Notes auf einen Blick',
    'onboarding.s5.title':     'Backups nicht vergessen!',
    'onboarding.s5.text':      'Deine Daten sind lokal im Browser gespeichert. Wenn du Browserdaten löschst, gehen sie verloren! Sichere regelmäßig über Settings → Data → Export. Wir erinnern dich alle 7 Tage daran.',
    'onboarding.s6.title':     'Gaming Starter Board',
    'onboarding.s6.text':      'Spielst du Games wie Satisfactory, Factorio oder Star Citizen? Ich kann ein Board mit nützlichen Community-Links anlegen.',
    'onboarding.tradecenter_desc': 'Trade Center für Star Citizen',
    'onboarding.s7.title':     'Bereit!',
    'onboarding.s7.text':      'Erstelle dein erstes Board mit „+ Board" oder importiere deine Browser-Lesezeichen über den Import-Button im Header. Viel Spaß!',

    // Notes
    'notes.limit_message':     'Maximale Anzahl erreicht! Du kannst maximal {max} Notes gleichzeitig haben. Lösche eine bestehende Note um eine neue zu erstellen.',
    'notes.limit_title':       'Limit erreicht',
    'notes.checklist_title':   'Checkliste',
    'notes.default_title':     'Note',
    'notes.placeholder':       'Notiz schreiben...',
    'notes.checklist_placeholder': 'Neues Item...',
    'notes.delete_confirm':    'Note endgültig löschen? Das kann nicht rückgängig gemacht werden.',
    'notes.delete_title':      'Note löschen',
    'notes.delete_button':     'Löschen',
    'notes.checklist_progress': '{done}/{total} erledigt',
    'notes.empty_preview':     'Leer',
    'notes.export':            'Export',
    'notes.export_footer':     'Exportiert aus Hellion Dashboard',
    'notes.create':            '+ Note erstellen',
    'notes.text_type':         '✎ Freitext',
    'notes.checklist_type':    '☑ Checkliste',

    // Calculator
    'calculator.title':        'Taschenrechner',
    'calculator.history':      'History',
    'calculator.error':        'Fehler',
    'calculator.tab.standard': 'Standard',
    'calculator.tab.scientific':         'Wissenschaftlich',
    'calculator.sci.formulas':           'Formel-Helfer',
    'calculator.sci.select_formula':     'Formel wählen…',
    'calculator.sci.formula.circle_area':         'Kreisfläche (π×r²)',
    'calculator.sci.formula.circle_circumference':'Kreisumfang (2πr)',
    'calculator.sci.formula.celsius_to_fahrenheit':'°C → °F',
    'calculator.sci.formula.fahrenheit_to_celsius':'°F → °C',
    'calculator.sci.formula.pythagoras':          'Pythagoras (√(a²+b²))',
    'calculator.sci.formula.percentage':          'Prozentwert',
    'calculator.sci.field.radius':       'Radius',
    'calculator.sci.field.temp':         'Temperatur',
    'calculator.sci.field.a':            'Seite a',
    'calculator.sci.field.b':            'Seite b',
    'calculator.sci.field.value':        'Wert',
    'calculator.sci.field.percent':      'Prozent',
    'calculator.tab.converter':          'Umrechner',
    'calculator.conv.swap':              'Einheiten tauschen',
    'calculator.conv.cat.length':        'Länge',
    'calculator.conv.cat.weight':        'Gewicht',
    'calculator.conv.cat.temperature':   'Temperatur',
    'calculator.conv.cat.volume':        'Volumen',
    'calculator.conv.cat.speed':         'Geschwindigkeit',
    'calculator.conv.cat.area':          'Fläche',
    'calculator.tab.satisfactory':       'Satisfactory',
    'calculator.sat.tab.itemsPerMin':    'Items/Min',
    'calculator.sat.tab.power':          'Strom',
    'calculator.sat.tab.machines':       'Maschinen',
    'calculator.sat.items_per_craft':    'Items/Craft',
    'calculator.sat.craft_time':         'Craftzeit (s)',
    'calculator.sat.clock_speed':        'Taktrate (%)',
    'calculator.sat.base_power':         'Grundleistung (MW)',
    'calculator.sat.target_output':      'Ziel Output/Min',
    'calculator.sat.output_per_min':     'Output',
    'calculator.sat.power_usage':        'Stromverbrauch',
    'calculator.sat.efficiency':         'Effizienz',
    'calculator.sat.per_item':           'pro Item',
    'calculator.sat.machines_needed':    'Maschinen benötigt',
    'calculator.sat.total_power':        'Gesamtleistung',

    // Timer
    'timer.title':             'Timer',
    'timer.start':             'Start',
    'timer.pause':             'Pause',
    'timer.reset':             'Reset',
    'timer.restart':           'Neustart',
    'timer.presets':           'Presets',
    'timer.save_preset':       'Preset speichern',
    'timer.preset_name_placeholder': 'Name...',
    'timer.ok':                'OK',
    'timer.limit_title':       'Limit erreicht',
    'timer.limit_message':     'Maximale Anzahl erreicht! Du kannst maximal {max} Presets speichern.',
    'timer.no_time_title':     'Keine Zeit',
    'timer.no_time_message':   'Gib zuerst eine Zeit ein, bevor du ein Preset speicherst.',
    'timer.mute':              'Ton ausschalten',
    'timer.unmute':            'Ton einschalten',
    'timer.finished_title':    '[!] Timer abgelaufen',
    'timer.default_page_title': 'Hellion Dashboard',

    // Bild-Referenz
    'imageref.title':          'Bild-Referenz',
    'imageref.dropzone':       'Klicken oder Bild hierher ziehen',
    'imageref.replace':        'Bild ersetzen',
    'imageref.label_placeholder': 'Beschriftung (optional)',
    'imageref.storage_error':  'Bild konnte nicht gespeichert werden. Der Browser-Speicher ist voll.',
    'imageref.storage_error.title': 'Speicherfehler',
    'imageref.limit':          'Maximal {max} Bild-Widgets gleichzeitig. Schliesse eines um ein neues zu oeffnen.',
    'imageref.limit.title':    'Limit erreicht',
    'imageref.load_error':     'Bild konnte nicht geladen werden: {error}',
    'imageref.load_error.title': 'Bildfehler',
    'imageref.invalid_file':   'Bitte eine Bilddatei verwenden (PNG, JPG, WebP, etc.).',
    'imageref.invalid_file.title': 'Kein Bild',

    // Widget-Manager
    'widget.minimize':         'Minimieren',
    'widget.close':            'Schließen',

    // Daten (Export/Import)
    'data.invalid_format':     'Ungültiges Format',
    'data.no_boards':          'Keine gültigen Boards gefunden',
    'data.import_confirm':     '{count} Boards importieren? Bestehende Daten bleiben erhalten.',
    'data.import_confirm.title': 'JSON Import',
    'data.import_success':     '{boards} Board(s){notes}{calc}{timer} erfolgreich importiert.',
    'data.import_success.title': 'Import erfolgreich',
    'data.import_error':       'Fehler beim Import: {error}',
    'data.import_error.title': 'Import fehlgeschlagen',
    'data.notes_suffix':       ' + {count} Note(s)',
    'data.calc_suffix':        ' + Calculator-History',
    'data.timer_suffix':       ' + Timer-Presets',

    // Browser-Lesezeichen Import
    'bm_import.no_access':     'Zugriff auf Browser-Lesezeichen nicht möglich. Stelle sicher, dass die Extension die nötigen Berechtigungen hat.',
    'bm_import.title':         'Lesezeichen-Import',
    'bm_import.no_folders':    'Keine Lesezeichen-Ordner gefunden.',
    'bm_import.modal_title':   'Browser-Lesezeichen importieren',
    'bm_import.info':          'Wähle die Ordner aus, die als Boards importiert werden sollen. Jeder Ordner wird ein eigenes Board.',
    'bm_import.unnamed':       'Unbenannt',
    'bm_import.link_count':    '{count} Link(s)',
    'bm_import.folder_count':  '{count} Ordner',
    'bm_import.empty':         'leer',
    'bm_import.select_all':    'Alle auswählen',
    'bm_import.deselect_all':  'Alle abwählen',
    'bm_import.import_btn':    'Importieren',
    'bm_import.no_selection':  'Bitte wähle mindestens einen Ordner aus.',
    'bm_import.boards_created':    '{count} Board(s) erstellt',
    'bm_import.bookmarks_imported': '{count} Lesezeichen importiert',
    'bm_import.duplicates_skipped': '{count} Duplikat(e) übersprungen',
    'bm_import.success_title': 'Import abgeschlossen',

    // Storage
    'storage.quota_full':      'Speicher voll! Bitte lösche alte Boards oder das Hintergrundbild, um Platz zu schaffen.',
    'storage.quota_full.title': 'Speicher voll',

    // App
    'app.backup_reminder':     'Du hast seit über einer Woche kein Backup gemacht. Beim Löschen der Browserdaten gehen deine Boards verloren. Jetzt sichern?',
    'app.backup_reminder.title': 'Backup-Erinnerung',
    'app.backup_now':          'Jetzt sichern',
    'app.backup_later':        'Später',
    'app.no_bookmarks':        'Keine Bookmarks in dieser Datei gefunden.',
    'app.import_title':        'Import',
    'app.html_import_success': '{count} Board(s) mit {total} Bookmarks importiert.',
    'app.import_success_title': 'Import erfolgreich',
    'app.invalid_url':         'Ungültige URL. Bitte mit https:// beginnen.',
    'app.invalid_url.title':   'URL ungültig',

    // Uhr
    'clock.days.sun':          'So',
    'clock.days.mon':          'Mo',
    'clock.days.tue':          'Di',
    'clock.days.wed':          'Mi',
    'clock.days.thu':          'Do',
    'clock.days.fri':          'Fr',
    'clock.days.sat':          'Sa',
    'clock.months.jan':        'Jan',
    'clock.months.feb':        'Feb',
    'clock.months.mar':        'Mär',
    'clock.months.apr':        'Apr',
    'clock.months.may':        'Mai',
    'clock.months.jun':        'Jun',
    'clock.months.jul':        'Jul',
    'clock.months.aug':        'Aug',
    'clock.months.sep':        'Sep',
    'clock.months.oct':        'Okt',
    'clock.months.nov':        'Nov',
    'clock.months.dec':        'Dez',

    // Settings
    'settings.file_read_error': 'Fehler beim Lesen der Datei. Bitte eine andere Datei wählen.',
    'settings.file_read_error.title': 'Dateifehler',
    'settings.reset_confirm':  'Wirklich alle Boards und Einstellungen löschen? Das kann nicht rückgängig gemacht werden.',
    'settings.reset_confirm.title':   'Alles zurücksetzen',
    'settings.reset_confirm.button':  'Alles löschen',

    // Header
    'header.import':           'Import',
    'header.board':            'Board',
    'header.note':             'Note',
    'header.theme':            'Darstellung',
    'header.settings':         'Einstellungen',

    // Header Tooltips
    'header.import_title':       'Bookmarks importieren (HTML)',
    'header.board_title':        'Neues Board hinzufügen',
    'header.note_title':         'Schnellnotiz',
    'header.theme_title':        'Darstellung & Theme',
    'header.settings_title':     'Einstellungen',

    // Settings-Panel Überschrift
    'settings.title':          'Einstellungen',

    // Settings-Panel Sektionen
    'settings.section.widgets':   'WIDGETS',
    'settings.section.data':      'DATEN & HILFE',
    'settings.section.danger':    'DANGER ZONE',
    'settings.section.bg':        'HINTERGRUND',
    'settings.section.display':   'DARSTELLUNG',

    // Settings-Zeilen
    'settings.language':           'Sprache',
    'settings.language.desc':      'Anzeigesprache wählen',
    'settings.language.auto':      'Automatisch',
    'settings.toolbar_pos':        'Toolbar-Position',
    'settings.toolbar_pos.desc':   'Widget-Toolbar links oder rechts anzeigen',
    'settings.toolbar_pos.right':  'Rechts',
    'settings.toolbar_pos.left':   'Links',
    'settings.image_ref':          'Bild-Referenz Widgets',
    'settings.image_ref.desc':     'Bilder als Referenz anzeigen (nur aktuelle Session)',
    'settings.export':             'Backup exportieren',
    'settings.export.desc':        'Alle Boards, Notes und Einstellungen als JSON sichern',
    'settings.export.btn':         'Export',
    'settings.import':             'Backup importieren',
    'settings.import.desc':        'JSON-Backup wiederherstellen',
    'settings.browser_import':     'Browser-Lesezeichen',
    'settings.browser_import.desc': 'Lesezeichen direkt aus dem Browser importieren',
    'settings.onboarding':         'Onboarding wiederholen',
    'settings.onboarding.desc':    'Willkommens-Tour erneut anzeigen',
    'settings.reset':              'Alles zurücksetzen',
    'settings.reset.desc':         'Löscht alle Boards, Notes und Einstellungen',
    'settings.compact':            'Kompaktmodus',
    'settings.compact.desc':       'Weniger Abstand für mehr Bookmarks',
    'settings.shorten':            'Lange Titel kürzen',
    'settings.shorten.desc':       'Titel auf eine Zeile mit „…" kürzen',
    'settings.search':             'Suchleiste anzeigen',
    'settings.search.desc':        'Suchleiste unter dem Header ein/aus',
    'settings.newtab':             'Links in neuem Tab',
    'settings.newtab.desc':        'Bookmarks in neuem Browser-Tab öffnen',
    'settings.showdesc':           'Beschreibungen anzeigen',
    'settings.showdesc.desc':      'Gespeicherte Beschreibung unter Bookmarks',
    'settings.hideextra':          'Bookmarks ausblenden',
    'settings.hideextra.desc':     'Überzählige Bookmarks in langen Boards verstecken',
    'settings.visible_count':      'Sichtbare Bookmarks',
    'settings.visible_count.desc': 'Anzahl vor dem Ausblenden',
    'settings.bg_url':             'Bild-URL',
    'settings.bg_url.desc':        'Eigenes Hintergrundbild per URL',
    'settings.bg_change':          'Ändern',
    'settings.bg_apply':           'Übernehmen',
    'settings.bg_upload':          'Datei hochladen',
    'settings.bg_upload.desc':     'Lokales Bild als Hintergrund verwenden',
    'settings.search_engine_toggle': 'Suchmaschine wechseln',

    // Settings Buttons + Validierung
    'settings.onboarding_btn':   'Start',
    'settings.reset_btn':        'Reset',
    'settings.bg_upload_btn':    'Upload',
    'settings.bg_invalid_url':   'Nur lokale Bilder (Upload) sind als Hintergrund erlaubt.',
    'settings.bg_invalid_url.title': 'Ungültige URL',

    // Modals
    'modal.new_board':         'Neues Board',
    'modal.board_name':        'Board-Name...',
    'modal.create':            'Erstellen',
    'modal.new_bookmark':      'Neues Lesezeichen',
    'modal.bm_title':          'Titel...',
    'modal.bm_desc':           'Beschreibung (optional)',
    'modal.bm_add':            'Hinzufügen',
    'modal.rename':            'Umbenennen',
    'modal.rename_placeholder': 'Neuer Name...',
    'modal.rename_confirm':    'Umbenennen',
    'modal.theme_header':      'Darstellung',

    // About
    'about.title':             '⬡ HELLION NEWTAB',
    'about.impressum':         'Impressum',
    'about.developer':         'Entwickler',
    'about.company':           'Unternehmen',
    'about.license':           'Lizenz',
    'about.storage':           'Datenspeicherung',
    'about.storage.value':     '100% lokal · Kein Server · Kein Account',
    'about.bugreport':         'Bug Report / Feedback',
    'about.support':           'Support',
    'about.browsers':          'Kompatible Browser',

    // Notebook
    'notebook.title':          'Notebook',

    // Suche
    'search.placeholder':      'Im Web suchen…',
    'search.submit_title':     'Suchen',

    // Widget-Toolbar Tooltips
    'toolbar.note':            'Note erstellen',
    'toolbar.checklist':       'Checkliste erstellen',
    'toolbar.calculator':      'Taschenrechner',
    'toolbar.timer':           'Timer',
    'toolbar.imageref':        'Bild-Referenz',
    'toolbar.notebook':        'Alle Notes'
  },

  en: {
    // Dialog system
    'dialog.default_title':    'Notice',
    'dialog.ok':               'OK',
    'dialog.confirm_title':    'Confirmation',
    'dialog.cancel':           'Cancel',
    'dialog.close':            'Close',

    // Boards
    'boards.empty_state_pre':  'No boards yet. Click ',
    'boards.add_board':        '+ Board',
    'boards.empty_state_mid':  ' to create one, or use ',
    'boards.import':           'Import',
    'boards.empty_state_post': ' to load your browser bookmarks.',
    'boards.drag_title':       'Move board',
    'boards.blur':             'Blur (private)',
    'boards.unblur':           'Unblur',
    'boards.rename':           'Rename',
    'boards.delete':           'Delete',
    'boards.delete_confirm':   'Really delete board "{title}"?',
    'boards.delete_confirm.title': 'Delete board',
    'boards.show_more':        'Show {count} more…',
    'boards.show_less':        'Show less',
    'boards.add_link':         ' Add link',
    'boards.remove_bookmark':  'Remove',

    // Onboarding
    'onboarding.skip':         'Skip',
    'onboarding.back':         'Back',
    'onboarding.next':         'Next',
    'onboarding.start':        'Let\'s go!',
    'onboarding.yes':          'Yes please',
    'onboarding.no':           'No thanks',
    'onboarding.s1.title':     'Welcome to Hellion Dashboard',
    'onboarding.s1.text':      'Your new browser start screen. Minimalist, fast and fully local — no cloud, no account, no data collection.',
    'onboarding.s2.title':     'Boards & Bookmarks',
    'onboarding.s2.f1':        'Create boards with the "+ Board" button at the top',
    'onboarding.s2.f2':        'Import browser bookmarks via the "Import" button in the header',
    'onboarding.s2.f3':        'Drag & drop to reorder boards and links',
    'onboarding.s2.f4':        'Blur mode for private boards (🔒 icon)',
    'onboarding.s3.title':     '11 handcrafted themes',
    'onboarding.s3.text':      'Click the "Theme" button in the header to choose your theme. Each has its own style and color palette.',
    'onboarding.s4.title':     'Widget Toolbar',
    'onboarding.s4.f1':        'The floating buttons on the right open widgets',
    'onboarding.s4.f2':        'Notes and checklists for quick notes',
    'onboarding.s4.f3':        'Calculator with history',
    'onboarding.s4.f4':        'Timer/countdown with saveable presets',
    'onboarding.s4.f5':        'Image reference widgets (enable in Settings)',
    'onboarding.s4.f6':        'Notebook sidebar shows all notes at a glance',
    'onboarding.s5.title':     'Don\'t forget backups!',
    'onboarding.s5.text':      'Your data is stored locally in the browser. If you clear browser data, it\'s gone! Back up regularly via Settings → Data → Export. We\'ll remind you every 7 days.',
    'onboarding.s6.title':     'Gaming Starter Board',
    'onboarding.s6.text':      'Do you play games like Satisfactory, Factorio or Star Citizen? I can create a board with useful community links.',
    'onboarding.tradecenter_desc': 'Trade Center for Star Citizen',
    'onboarding.s7.title':     'Ready!',
    'onboarding.s7.text':      'Create your first board with "+ Board" or import your browser bookmarks via the Import button in the header. Have fun!',

    // Notes
    'notes.limit_message':     'Maximum reached! You can have at most {max} notes at the same time. Delete an existing note to create a new one.',
    'notes.limit_title':       'Limit reached',
    'notes.checklist_title':   'Checklist',
    'notes.default_title':     'Note',
    'notes.placeholder':       'Write a note...',
    'notes.checklist_placeholder': 'New item...',
    'notes.delete_confirm':    'Permanently delete note? This cannot be undone.',
    'notes.delete_title':      'Delete note',
    'notes.delete_button':     'Delete',
    'notes.checklist_progress': '{done}/{total} done',
    'notes.empty_preview':     'Empty',
    'notes.export':            'Export',
    'notes.export_footer':     'Exported from Hellion Dashboard',
    'notes.create':            '+ Create note',
    'notes.text_type':         '✎ Free text',
    'notes.checklist_type':    '☑ Checklist',

    // Calculator
    'calculator.title':        'Calculator',
    'calculator.history':      'History',
    'calculator.error':        'Error',
    'calculator.tab.standard': 'Standard',
    'calculator.tab.scientific':         'Scientific',
    'calculator.sci.formulas':           'Formula Helper',
    'calculator.sci.select_formula':     'Choose formula…',
    'calculator.sci.formula.circle_area':         'Circle Area (π×r²)',
    'calculator.sci.formula.circle_circumference':'Circle Circumference (2πr)',
    'calculator.sci.formula.celsius_to_fahrenheit':'°C → °F',
    'calculator.sci.formula.fahrenheit_to_celsius':'°F → °C',
    'calculator.sci.formula.pythagoras':          'Pythagoras (√(a²+b²))',
    'calculator.sci.formula.percentage':          'Percentage',
    'calculator.sci.field.radius':       'Radius',
    'calculator.sci.field.temp':         'Temperature',
    'calculator.sci.field.a':            'Side a',
    'calculator.sci.field.b':            'Side b',
    'calculator.sci.field.value':        'Value',
    'calculator.sci.field.percent':      'Percent',
    'calculator.tab.converter':          'Converter',
    'calculator.conv.swap':              'Swap units',
    'calculator.conv.cat.length':        'Length',
    'calculator.conv.cat.weight':        'Weight',
    'calculator.conv.cat.temperature':   'Temperature',
    'calculator.conv.cat.volume':        'Volume',
    'calculator.conv.cat.speed':         'Speed',
    'calculator.conv.cat.area':          'Area',
    'calculator.tab.satisfactory':       'Satisfactory',
    'calculator.sat.tab.itemsPerMin':    'Items/Min',
    'calculator.sat.tab.power':          'Power',
    'calculator.sat.tab.machines':       'Machines',
    'calculator.sat.items_per_craft':    'Items/Craft',
    'calculator.sat.craft_time':         'Craft Time (s)',
    'calculator.sat.clock_speed':        'Clock Speed (%)',
    'calculator.sat.base_power':         'Base Power (MW)',
    'calculator.sat.target_output':      'Target Output/Min',
    'calculator.sat.output_per_min':     'Output',
    'calculator.sat.power_usage':        'Power Usage',
    'calculator.sat.efficiency':         'Efficiency',
    'calculator.sat.per_item':           'per item',
    'calculator.sat.machines_needed':    'Machines needed',
    'calculator.sat.total_power':        'Total Power',

    // Timer
    'timer.title':             'Timer',
    'timer.start':             'Start',
    'timer.pause':             'Pause',
    'timer.reset':             'Reset',
    'timer.restart':           'Restart',
    'timer.presets':           'Presets',
    'timer.save_preset':       'Save preset',
    'timer.preset_name_placeholder': 'Name...',
    'timer.ok':                'OK',
    'timer.limit_title':       'Limit reached',
    'timer.limit_message':     'Maximum reached! You can save at most {max} presets.',
    'timer.no_time_title':     'No time',
    'timer.no_time_message':   'Enter a time before saving a preset.',
    'timer.mute':              'Mute sound',
    'timer.unmute':            'Unmute sound',
    'timer.finished_title':    '[!] Timer finished',
    'timer.default_page_title': 'Hellion Dashboard',

    // Image reference
    'imageref.title':          'Image Reference',
    'imageref.dropzone':       'Click or drag image here',
    'imageref.replace':        'Replace image',
    'imageref.label_placeholder': 'Caption (optional)',
    'imageref.storage_error':  'Image could not be saved. Browser storage is full.',
    'imageref.storage_error.title': 'Storage error',
    'imageref.limit':          'Maximum {max} image widgets at a time. Close one to open a new one.',
    'imageref.limit.title':    'Limit reached',
    'imageref.load_error':     'Image could not be loaded: {error}',
    'imageref.load_error.title': 'Image error',
    'imageref.invalid_file':   'Please use an image file (PNG, JPG, WebP, etc.).',
    'imageref.invalid_file.title': 'Not an image',

    // Widget manager
    'widget.minimize':         'Minimize',
    'widget.close':            'Close',

    // Data (export/import)
    'data.invalid_format':     'Invalid format',
    'data.no_boards':          'No valid boards found',
    'data.import_confirm':     'Import {count} boards? Existing data will be preserved.',
    'data.import_confirm.title': 'JSON Import',
    'data.import_success':     '{boards} board(s){notes}{calc}{timer} successfully imported.',
    'data.import_success.title': 'Import successful',
    'data.import_error':       'Import error: {error}',
    'data.import_error.title': 'Import failed',
    'data.notes_suffix':       ' + {count} note(s)',
    'data.calc_suffix':        ' + Calculator history',
    'data.timer_suffix':       ' + Timer presets',

    // Browser bookmark import
    'bm_import.no_access':     'Cannot access browser bookmarks. Make sure the extension has the required permissions.',
    'bm_import.title':         'Bookmark import',
    'bm_import.no_folders':    'No bookmark folders found.',
    'bm_import.modal_title':   'Import browser bookmarks',
    'bm_import.info':          'Select the folders to import as boards. Each folder becomes its own board.',
    'bm_import.unnamed':       'Unnamed',
    'bm_import.link_count':    '{count} link(s)',
    'bm_import.folder_count':  '{count} folder(s)',
    'bm_import.empty':         'empty',
    'bm_import.select_all':    'Select all',
    'bm_import.deselect_all':  'Deselect all',
    'bm_import.import_btn':    'Import',
    'bm_import.no_selection':  'Please select at least one folder.',
    'bm_import.boards_created':    '{count} board(s) created',
    'bm_import.bookmarks_imported': '{count} bookmarks imported',
    'bm_import.duplicates_skipped': '{count} duplicate(s) skipped',
    'bm_import.success_title': 'Import complete',

    // Storage
    'storage.quota_full':      'Storage full! Please delete old boards or the background image to free up space.',
    'storage.quota_full.title': 'Storage full',

    // App
    'app.backup_reminder':     'You haven\'t made a backup in over a week. If you clear browser data, your boards will be lost. Back up now?',
    'app.backup_reminder.title': 'Backup reminder',
    'app.backup_now':          'Back up now',
    'app.backup_later':        'Later',
    'app.no_bookmarks':        'No bookmarks found in this file.',
    'app.import_title':        'Import',
    'app.html_import_success': '{count} board(s) with {total} bookmarks imported.',
    'app.import_success_title': 'Import successful',
    'app.invalid_url':         'Invalid URL. Please start with https://.',
    'app.invalid_url.title':   'Invalid URL',

    // Clock
    'clock.days.sun':          'Sun',
    'clock.days.mon':          'Mon',
    'clock.days.tue':          'Tue',
    'clock.days.wed':          'Wed',
    'clock.days.thu':          'Thu',
    'clock.days.fri':          'Fri',
    'clock.days.sat':          'Sat',
    'clock.months.jan':        'Jan',
    'clock.months.feb':        'Feb',
    'clock.months.mar':        'Mar',
    'clock.months.apr':        'Apr',
    'clock.months.may':        'May',
    'clock.months.jun':        'Jun',
    'clock.months.jul':        'Jul',
    'clock.months.aug':        'Aug',
    'clock.months.sep':        'Sep',
    'clock.months.oct':        'Oct',
    'clock.months.nov':        'Nov',
    'clock.months.dec':        'Dec',

    // Settings
    'settings.file_read_error': 'Error reading file. Please choose a different file.',
    'settings.file_read_error.title': 'File error',
    'settings.reset_confirm':  'Really delete all boards and settings? This cannot be undone.',
    'settings.reset_confirm.title':   'Reset everything',
    'settings.reset_confirm.button':  'Delete all',

    // Header
    'header.import':           'Import',
    'header.board':            'Board',
    'header.note':             'Note',
    'header.theme':            'Theme',
    'header.settings':         'Settings',

    // Header Tooltips
    'header.import_title':       'Import bookmarks (HTML)',
    'header.board_title':        'Add new board',
    'header.note_title':         'Quick note',
    'header.theme_title':        'Appearance & Theme',
    'header.settings_title':     'Settings',

    // Settings panel heading
    'settings.title':          'Settings',

    // Settings panel sections
    'settings.section.widgets':   'WIDGETS',
    'settings.section.data':      'DATA & HELP',
    'settings.section.danger':    'DANGER ZONE',
    'settings.section.bg':        'BACKGROUND',
    'settings.section.display':   'DISPLAY',

    // Settings rows
    'settings.language':           'Language',
    'settings.language.desc':      'Choose display language',
    'settings.language.auto':      'Automatic',
    'settings.toolbar_pos':        'Toolbar position',
    'settings.toolbar_pos.desc':   'Show widget toolbar on the left or right',
    'settings.toolbar_pos.right':  'Right',
    'settings.toolbar_pos.left':   'Left',
    'settings.image_ref':          'Image reference widgets',
    'settings.image_ref.desc':     'Show images as reference (current session only)',
    'settings.export':             'Export backup',
    'settings.export.desc':        'Save all boards, notes and settings as JSON',
    'settings.export.btn':         'Export',
    'settings.import':             'Import backup',
    'settings.import.desc':        'Restore a JSON backup',
    'settings.browser_import':     'Browser bookmarks',
    'settings.browser_import.desc': 'Import bookmarks directly from the browser',
    'settings.onboarding':         'Replay onboarding',
    'settings.onboarding.desc':    'Show the welcome tour again',
    'settings.reset':              'Reset everything',
    'settings.reset.desc':         'Deletes all boards, notes and settings',
    'settings.compact':            'Compact mode',
    'settings.compact.desc':       'Less spacing for more bookmarks',
    'settings.shorten':            'Shorten long titles',
    'settings.shorten.desc':       'Truncate titles to one line with "…"',
    'settings.search':             'Show search bar',
    'settings.search.desc':        'Toggle search bar below the header',
    'settings.newtab':             'Links in new tab',
    'settings.newtab.desc':        'Open bookmarks in a new browser tab',
    'settings.showdesc':           'Show descriptions',
    'settings.showdesc.desc':      'Show saved description below bookmarks',
    'settings.hideextra':          'Hide bookmarks',
    'settings.hideextra.desc':     'Hide excess bookmarks in long boards',
    'settings.visible_count':      'Visible bookmarks',
    'settings.visible_count.desc': 'Number before hiding',
    'settings.bg_url':             'Image URL',
    'settings.bg_url.desc':        'Custom background image via URL',
    'settings.bg_change':          'Change',
    'settings.bg_apply':           'Apply',
    'settings.bg_upload':          'Upload file',
    'settings.bg_upload.desc':     'Use a local image as background',
    'settings.search_engine_toggle': 'Switch search engine',

    // Settings Buttons + Validation
    'settings.onboarding_btn':   'Start',
    'settings.reset_btn':        'Reset',
    'settings.bg_upload_btn':    'Upload',
    'settings.bg_invalid_url':   'Only local images (upload) are allowed as background.',
    'settings.bg_invalid_url.title': 'Invalid URL',

    // Modals
    'modal.new_board':         'New Board',
    'modal.board_name':        'Board name...',
    'modal.create':            'Create',
    'modal.new_bookmark':      'New Bookmark',
    'modal.bm_title':          'Title...',
    'modal.bm_desc':           'Description (optional)',
    'modal.bm_add':            'Add',
    'modal.rename':            'Rename',
    'modal.rename_placeholder': 'New name...',
    'modal.rename_confirm':    'Rename',
    'modal.theme_header':      'Theme',

    // About
    'about.title':             '⬡ HELLION NEWTAB',
    'about.impressum':         'Legal Notice',
    'about.developer':         'Developer',
    'about.company':           'Company',
    'about.license':           'License',
    'about.storage':           'Data storage',
    'about.storage.value':     '100% local · No server · No account',
    'about.bugreport':         'Bug Report / Feedback',
    'about.support':           'Support',
    'about.browsers':          'Compatible browsers',

    // Notebook
    'notebook.title':          'Notebook',

    // Search
    'search.placeholder':      'Search the web…',
    'search.submit_title':     'Search',

    // Widget toolbar tooltips
    'toolbar.note':            'Create note',
    'toolbar.checklist':       'Create checklist',
    'toolbar.calculator':      'Calculator',
    'toolbar.timer':           'Timer',
    'toolbar.imageref':        'Image reference',
    'toolbar.notebook':        'All notes'
  }
};

/** @type {string} Aktuell aktive Sprache */
let currentLang = 'de';

/**
 * Übersetzungsstring abrufen mit optionalen Platzhaltern
 * @param {string} key - Schlüssel im STRINGS-Objekt
 * @param {Object} [vars] - Platzhalter-Werte (z.B. { max: 5 })
 * @returns {string}
 */
function t(key, vars) {
  let str = (STRINGS[currentLang] && STRINGS[currentLang][key])
    || (STRINGS['en'] && STRINGS['en'][key])
    || key;
  if (vars) {
    for (const [k, v] of Object.entries(vars)) {
      str = str.replaceAll('{' + k + '}', v);
    }
  }
  return str;
}

/**
 * Alle data-i18n Elemente im Dokument mit aktueller Sprache befüllen
 */
function applyLanguage() {
  document.querySelectorAll('[data-i18n]').forEach(el => {
    el.textContent = t(el.dataset.i18n);
  });
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    el.placeholder = t(el.dataset.i18nPlaceholder);
  });
  document.querySelectorAll('[data-i18n-title]').forEach(el => {
    const text = t(el.dataset.i18nTitle);
    el.title = text;
    el.setAttribute('aria-label', text);
  });
}

/**
 * 'auto' auflösen zu konkretem Sprachcode
 * @param {string} lang - 'de', 'en' oder 'auto'
 * @returns {string} 'de' oder 'en'
 */
function resolveLang(lang) {
  return (lang === 'auto')
    ? (navigator.language.startsWith('de') ? 'de' : 'en')
    : lang;
}

/**
 * Sprache setzen, speichern und DOM aktualisieren
 * @param {string} lang - 'de', 'en' oder 'auto'
 */
function setLanguage(lang) {
  currentLang = resolveLang(lang);
  document.documentElement.lang = currentLang;
  applyLanguage();
}

/**
 * i18n-Modul — öffentliche API
 */
const I18n = {
  /** Aktuell aktive Sprache (nach Auto-Auflösung) */
  get currentLang() { return currentLang; },

  /**
   * Initialisierung: Sprache aus Settings lesen, auflösen, DOM anwenden
   * Muss NACH dem Laden des settings-Objekts aufgerufen werden
   */
  init() {
    const lang = (typeof settings !== 'undefined' && settings.language)
      ? settings.language
      : 'auto';
    currentLang = resolveLang(lang);
    document.documentElement.lang = currentLang;
    applyLanguage();
  }
};
