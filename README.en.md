# OpenSelectedQRCodeURL_InDesign

**Open Selected QR Code URL for InDesign**  
A script for Adobe InDesign that reads a selected QR-code-like object and opens the detected URL in a web browser.

QR Code is a registered trademark of DENSO WAVE INCORPORATED.

[日本語 README](README.md)

## Overview

This script exports the selected QR-code-like placed image or object in an InDesign document as a temporary PNG, decodes it with `zbarimg`, and opens the detected URL in Safari or the default web browser.

It is intended as a helper tool for checking the destination URL of placed QR codes during print production.

## Features

- Reads a selected QR-code-like image or object in InDesign
- Opens the detected URL in Safari or the default web browser
- Performs a simple print-readability check based on the placed size of the QR code
- Shows a warning when the QR code may be too small for reliable printing
- Uses the Homebrew version of `zbarimg` on macOS

## Requirements

- macOS
- Adobe InDesign
- `zbarimg`

You can install `zbarimg` with Homebrew:

```sh
brew install zbar
```

## Installation

1. Download `OpenSelectedQRCodeURL_InDesign.jsx`.
2. Place it in the InDesign Scripts Panel folder.

Example:

```txt
/Users/your-user-name/Library/Preferences/Adobe InDesign/Version XX.0-J/ja_JP/Scripts/Scripts Panel/
```

3. Launch InDesign.
4. Open the Scripts panel from `Window > Utilities > Scripts`.
5. Run `OpenSelectedQRCodeURL_InDesign.jsx`.

## Usage

1. Select a QR-code-like image or object in InDesign.
2. Run `OpenSelectedQRCodeURL_InDesign.jsx` from the Scripts panel.
3. If the QR code is successfully decoded, the detected URL will open in a web browser.

## Notes

- Some QR codes may not be decoded successfully depending on their condition.
- Decoding may fail if the image is low-resolution, distorted, low-contrast, or missing sufficient quiet zone margins.
- Print-readability warnings are estimated from the placed size in InDesign. Actual results may vary depending on printing conditions, paper, ink, and scanning devices.
- QR codes placed inside PDF or Illustrator files may not be decoded correctly depending on their condition.
- Always test the script on duplicated data before using it in production.
- No warranty is provided for the results.
- The accuracy or completeness of the decoded result and the outcome of using this script are not guaranteed.

## SCRIPTMETA

This script includes a Scripta-compatible SCRIPTMETA block.

```txt
Script-ID=com.gyahtei.dtp.open-selected-qrcode-url.indesign
```

## License

MIT License

## Author

GYAHTEI Design Laboratory / Satoru Takahashi  
https://gyahtei.com/
