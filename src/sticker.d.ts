type StickerType = 'static' | 'animation' | 'popup';

/**
 * Interface for a sticker in a sticker pack.
 */
interface Sticker {
  stickerID: string;
  filepath: string;
  /**
   * The optional special path for the sticker if it is a popup or animation sticker.
   */
  specialPath?: string;
  type: StickerType;
  stickerPackID: string;
}

/**
 * Interface for a sticker pack.
 */
interface StickerPack {
  title: string;
  storeURL: string;
  author: string;
  authorURL: string;
  id: string;
  mainIcon: string;
  stickers: Sticker[];
}

// const stickerPackData: StickerPack = {
//   title: "つり目獣耳スタンプ",
//   storeURL: "https://store.line.me/stickershop/product/1265244/ja",
//   author: "甘城なつき",
//   authorURL: "https://store.line.me/stickershop/author/95033/ja",
//   id: "1265244",
//   mainIcon: "C:\\Users\\rotmi\\Pictures\\Stickers\\1265244\\main.png",
//   stickers: [
//     {
//       stickerID: "10753776",
//       filepath: "C:\\Users\\rotmi\\Pictures\\Stickers\\1265244\\10753776.png",
//       type: "static",
//       stickerPackID: "1265244",
//     },
//     {
//       stickerID: "10753777",
//       filepath: "C:\\Users\\rotmi\\Pictures\\Stickers\\1265244\\10753777.png",
//       type: "static",
//       stickerPackID: "1265244",
//     },
//   ],
// };
// const stickerPackData2: StickerPack = {
//   title: "すきがあふれる！かまちょなジャージちゃん",
//   storeURL: "https://store.line.me/stickershop/product/23517680/ja",
//   author: "ジョイネット",
//   authorURL: "https://store.line.me/stickershop/author/18378/ja",
//   id: "23517680",
//   mainIcon: "C:\\Users\\rotmi\\Pictures\\Stickers\\23517680\\main.png",
//   stickers: [
//     {
//       stickerID: "598625750",
//       filepath: "C:\\Users\\rotmi\\Pictures\\Stickers\\23517680\\598625750.png",
//       type: "popup",
//       stickerPackID: "23517680",
//       specialPath: "C:\\Users\\rotmi\\Pictures\\Stickers\\23517680\\598625750_popup.png"
//     },
//     {
//       stickerID: "598625751",
//       filepath: "C:\\Users\\rotmi\\Pictures\\Stickers\\23517680\\598625751.png",
//       type: "popup",
//       stickerPackID: "23517680",
//       specialPath: "C:\\Users\\rotmi\\Pictures\\Stickers\\23517680\\598625751_popup.png"
//     },
//   ]
// }
