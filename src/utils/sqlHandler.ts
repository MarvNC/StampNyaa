import { sqlite3, Database } from 'sqlite3';

const sqlite3 = require('sqlite3').verbose();

const sqlHandler = {
  db: null as Database | null,
  init: function (path: string) {
    this.db = new sqlite3.Database(path, (err: Error) => {
      if (err) {
        console.error(err.message);
      }
      console.log('Connected to the stickers database.');
    });
    if (this.db === null) {
      console.error('Failed to connect to the stickers database.');
      return;
    }
    // Create favorites table if it doesn't exist
    // PackID/StickerID key and position value
    this.db!.run(
      `CREATE TABLE IF NOT EXISTS favorites (
        PackID TEXT NOT NULL,
        StickerID TEXT NOT NULL,
        position INTEGER NOT NULL,
        PRIMARY KEY (packID, StickerID)
      )`
    );
    // Create most used table if it doesn't exist
    // PackID/StickerID key and count value
    this.db.run(
      `CREATE TABLE IF NOT EXISTS stickerUses (
        PackID TEXT NOT NULL,
        StickerID TEXT NOT NULL,
        count INTEGER NOT NULL,
        PRIMARY KEY (packID, StickerID)
      )`
    );
  },
  /**
   * Gets the favorites
   * @returns {Promise<Array>} Array of objects of the form {PackID, StickerID, position}
   */
  getFavorites: function () {
    return new Promise((resolve, reject) => {
      this.db!.all('SELECT * FROM favorites ORDER BY position', (err, rows) => {
        if (err) {
          reject(err);
        }
        resolve(rows);
      });
    });
  },
  /**
   * Sets the favorites
   * @param {Object<Array>} favorites Array of objects of the form {PackID, StickerID}; position is the index in the array
   * @returns
   */
  setFavorites: function (favorites: Record<string, any>[]) {
    return new Promise((resolve, reject) => {
      // Create a map of `PackID;StickerID` key and index value
      const favoritesKeyMap = favorites.reduce((acc, curr, index) => {
        acc[curr.PackID + ';' + curr.StickerID] = index;
        return acc;
      }, {});
      this.db!.serialize(() => {
        // Iterate through rows of db and update index accordingly, delete row if not in favorites
        this.db!.all('SELECT * FROM favorites', (err: Error, rows: any[]) => {
          if (err) {
            reject(err);
          }
          rows.forEach((row) => {
            const key = row.PackID + ';' + row.StickerID;
            if (favoritesKeyMap[key] === undefined) {
              // Delete row
              this.db!.run('DELETE FROM favorites WHERE PackID = ? AND StickerID = ?', [
                row.PackID,
                row.StickerID,
              ]);
            } else {
              // Update row
              this.db!.run('UPDATE favorites SET position = ? WHERE PackID = ? AND StickerID = ?', [
                favoritesKeyMap[key],
                row.PackID,
                row.StickerID,
              ]);
              delete favoritesKeyMap[key];
            }
          });
          // Insert new rows
          Object.keys(favoritesKeyMap).forEach((key) => {
            const [PackID, StickerID] = key.split(';');
            this.db!.run('INSERT INTO favorites (PackID, StickerID, position) VALUES (?, ?, ?)', [
              PackID,
              StickerID,
              favoritesKeyMap[key],
            ]);
          });
        });
        resolve(true);
      });
    });
  },
  /**
   * Gets the most used stickers
   * @param {number} count Amount of most used stickers to return
   */
  getMostUsed: function (count: number) {
    return new Promise((resolve, reject) => {
      this.db!.all(`SELECT * FROM stickerUses ORDER BY count DESC LIMIT ${count}`, (err, rows) => {
        if (err) {
          reject(err);
        }
        resolve(rows);
      });
    });
  },
  /**
   * Increments the count of the given sticker
   * @param {Object} sticker Object of the form {PackID, StickerID}
   */
  useSticker: function (sticker: { PackID: any; StickerID: any }) {
    return new Promise((resolve, reject) => {
      this.db!.run(
        `INSERT INTO stickerUses (PackID, StickerID, count) VALUES (?, ?, 1)
        ON CONFLICT(PackID, StickerID) DO UPDATE SET count = count + 1`,
        [sticker.PackID, sticker.StickerID],
        (err) => {
          if (err) {
            reject(err);
          }
          resolve(true);
        }
      );
    });
  },
};

export default sqlHandler;
