# OpenSelectedQRCodeURL_InDesign

**QRコードのリンクを開くやつ InDesign版**  
Adobe InDesign上で選択したQRコードを読み取り、検出したURLをブラウザで開くためのスクリプトです。

QRコードは株式会社デンソーウェーブの登録商標です。

## 概要

このスクリプトは、InDesignドキュメント上で選択中のQRコードらしき配置画像・オブジェクトを一時PNGとして書き出し、`zbarimg` で読み取ったURLをSafariまたは既定のブラウザで開きます。

印刷物制作中に、配置済みQRコードのリンク先を確認したいときの補助ツールです。

## 主な機能

- InDesign上で選択したQRコードを読み取り
- 読み取ったURLをSafariまたは既定ブラウザで開く
- QRコードの配置サイズから、印刷時の読み取りやすさを簡易チェック
- 小さすぎる可能性がある場合に警告を表示
- macOS環境でHomebrew版 `zbarimg` を利用

## 必要なもの

- macOS
- Adobe InDesign
- `zbarimg`

`zbarimg` はHomebrewでインストールできます。

brew install zbar

インストール

1. OpenSelectedQRCodeURL_InDesign.jsx をダウンロードします。
2. InDesignのScripts Panelフォルダに入れます。

　　例：  
  /Users/ユーザー名/Library/Preferences/Adobe InDesign/Version XX.0-J/ja_JP/Scripts/Scripts Panel//Users/ユーザー名/Library/Preferences/Adobe InDesign/Version XX.0-J/ja_JP/Scripts/Scripts Panel/

3. InDesignを起動します。
4. ウィンドウ > ユーティリティ > スクリプト からスクリプトパネルを開きます。
5. OpenSelectedQRCodeURL_InDesign.jsx を実行します。

使い方

1. InDesign上でQRコード画像、またはQRコードらしきオブジェクトを選択します。
2. スクリプトパネルから OpenSelectedQRCodeURL_InDesign.jsx を実行します。
3. QRコードが読み取れた場合、検出したURLをブラウザで開きます。

注意事項

* QRコードの状態によっては読み取れない場合があります。
* 画像が粗い、変形している、コントラストが低い、余白が不足している場合は、読み取りに失敗することがあります。
* 印刷時の読み取りやすさに関する警告は、InDesign上の配置サイズからの推定です。実際の印刷条件、紙質、インキ、読み取り端末によって結果は変わります。
* 配置PDFやIllustratorファイルの内部にあるQRコードは、状態によって正しく読み取れない場合があります。
* 使用前に必ず複製データなどで動作確認してください。

SCRIPTMETA

このスクリプトには、Scripta互換のSCRIPTMETAブロックを含めています。

Script-ID=com.gyahtei.dtp.open-selected-qrcode-url.indesign

License

MIT License

Author
GYAHTEI Design Laboratory / Satoru Takahashi
https://gyahtei.com/
