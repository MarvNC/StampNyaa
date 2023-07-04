<p align="center">
  <img src="./assets/icon.png" alt="StampNyaa" width="250" height="250">
</p>
<h1 align="center">StampNyaa</h1>

## 🎉 Use LINE Stamps With Your Favorite Messaging Apps

StampNyaa is a simple cross-platform desktop app for using LINE stickers in your favorite messaging applications like Discord, Whatsapp, and anywhere else you can paste images.

## 📚 About

|          **Send Fun Stickers on Discord**           |
| :-------------------------------------------------: |
| ![Discord Send Sticker](img/DiscordSendSticker.gif) |

|     **Download New Sticker Packs from LINE**      |     **Manage and Sort Your Stickers**     |
| :-----------------------------------------------: | :---------------------------------------: |
| ![Download Line Packs](img/DownloadLinePacks.gif) | ![Manage and Sort](img/ManageAndSort.gif) |

Remember that sticker packs from LINE are created by talented artists and are not free to use. Please support the creators by purchasing the sticker packs you download; they deserve it!

Here are the creators whose stickers are shown in the above GIFs:

- [雪子](https://store.line.me/stickershop/author/1719182/ja) - Futaribeya mangaka
- [甘城なつき](https://store.line.me/stickershop/author/95033/ja) - Nyaa stamps
- [こもわた遙華](https://store.line.me/stickershop/author/674845/ja) - Famous eroge SD artist
- [ななひら](https://store.line.me/stickershop/author/283446/ja) - Nanahira
- [まどそふと](https://store.line.me/stickershop/author/106050/ja) - Madosoft, multiple packs
- [Navel](https://store.line.me/stickershop/author/79657/ja) - Navel, featuring 小倉朝日
- [clear_blue](https://store.line.me/stickershop/author/552857/ja) - Publisher of stickers for Yuzusoft and Lose
- [マインドウェイブ](https://store.line.me/stickershop/author/585746/ja) - Animated cat stickers
- [SNOOPY](https://store.line.me/stickershop/product/28777/ja) - Snoopy

## 🎨 Add Your Own Stickers

StampNyaa supports adding your own sticker packs to the app.

- Simply add a folder to the `stickers` directory in the app's sticker folder, which is located in your `{user}/Pictures` folder by default.
- The folder name will be used as the sticker pack name by default, and the images inside will be used as the stickers.
- You will also need to add a sticker named `main.png` to be used as the icon representing the sticker pack in the sidebar.
- Note that only `.png` images are currently supported.

## 🚀 Download

#### [Click here to go to the releases page](https://github.com/MarvNC/StampNyaa/releases) and download the appropriate installer for your operating system - `.exe` for Windows, `.dmg` for MacOS, and `.AppImage` for Linux.

## 🤝 Acknowledgements & Contribution

This app would not exist if it were not for jeffshee's **[LINEStickerKeyboard](https://github.com/jeffshee/LINEStickerKeyboard/)** Android app which I use frequently, inspiring me to build StampNyaa for desktop.

Contributions are welcome! If you have any bug reports, feature requests, or questions, please open an issue.

## Development

To run StampNyaa locally, you will need to have [Node.js](https://nodejs.org/en/) installed.

Then clone the repository and install dependencies with npm or yarn:

```bash
git clone https://github.com/MarvNC/StampNyaa.git
cd StampNyaa
npm install
```

To build an installer for your operating system, run:

```bash
npm run build
```

To run:

```bash
npm start
```
