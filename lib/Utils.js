import path from 'path';

global.hardenFilename = function(raw, baseDir) {
    const BASE_DIR = path.resolve(baseDir);

    if (typeof raw !== 'string' || !raw.length) throw new Error('Kein gültiger Name');

    raw = raw.replace(/\0/g, '').slice(0, 200); // Nullbytes + Länge
    let name = path.basename(raw); // entfernt evtl. Pfadbestandteile
    name = name.replace(/[^A-Za-z0-9._-]/g, '_'); // nur erlaubte Zeichen

    if (!name || name === '.' || name === '..')
        throw new Error('Pfad nach Bereinigung leer.');

    const target = path.resolve(BASE_DIR, name);
    if (!target.startsWith(BASE_DIR + path.sep) && target !== BASE_DIR)
        throw new Error('Pfad außerhalb des erlaubten Bereichs');

    return target;
}