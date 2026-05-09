/*
    QRコードのリンクを開くやつ.jsx
    English name: OpenSelectedQRCodeURL_InDesign.jsx

SCRIPTMETA-BEGIN
Script-ID=com.gyahtei.dtp.open-selected-qrcode-url.indesign
Name=QRコードのリンクを開くやつ InDesign版
Name-en=Open Selected QR Code URL for InDesign
Version=0.2.0
Meta-URL=https://raw.githubusercontent.com/SatoruTakahashi7/OpenSelectedQRCodeURL_InDesign/main/OpenSelectedQRCodeURL_InDesign.jsx
Target-App=InDesign
Author=GYAHTEI Design Laboratory / Satoru Takahashi
Author-url=https://gyahtei.com/
License=MIT
Description-BEGIN
    Notes:
    - 選択中のQRコードらしき配置画像・オブジェクトを一時PNGとして書き出し、
      zbarimgで読み取ったURLをSafariまたは既定ブラウザで開きます。
    - 印刷時の読み取りやすさの警告は、InDesign上の配置サイズから推定しています。
Description-END
Description-en-BEGIN
    Notes:
    - Exports the selected QR-code-like placed image or object as a temporary PNG,
      decodes it with zbarimg, and opens the detected URL in Safari or the default browser.
    - Print readability warnings are estimated from the placed size in InDesign.
Description-en-END
SCRIPTMETA-END

    Updated: 2026-05-05
    GYAHTEI Design Laboratory
    @gyahtei_satoru

    Requirements:
    - zbarimg

    macOS:
        brew install zbar

    対象:
    - InDesign上で選択している配置画像
    - PNG / JPG / PSD / TIFF / PDF / EPS / AI などの配置オブジェクト
    - QRコードを含むフレーム、グループなど

    注意:
    - QRコードの読み取りには外部コマンド zbarimg が必要です。
      Homebrewを使用している場合は、ターミナルで下記を実行してください。
        brew install zbar

    - このスクリプトは、まず「選択中のQRを1つ読む」ことを目的にしています。
      ページ内のQRを一括チェックする機能は、今後の拡張用です。

    - 画面表示ではなく、選択オブジェクトを一時PNGとして書き出して読み取ります。
      そのため、選択範囲にQRコード以外の要素が多く含まれると、読み取りに失敗する場合があります。

    - QRの状態、解像度、変形、トリミング、コントラストによっては読み取れない場合があります。

    - 印刷時の読み取りやすさの警告は、InDesign上の配置サイズから推定しています。
      実際の読み取り可否を保証するものではありません。

    - 結果に関しては一切の保証はできません。
    - 本スクリプトの読み取り結果および使用結果について、正確性・完全性は保証できません。
    - QRコードは株式会社デンソーウェーブの登録商標です。
*/

#target "InDesign"

(function () {
    var SCRIPT_TITLE = "QRコードのリンクを開くやつ";

    // ============================================================
    // 設定
    // ============================================================

    var EXPORT_RESOLUTION = 600;

    // 印刷サイズ警告設定
    var ENABLE_PRINT_SIZE_WARNING = true;

    // QRコードのセル数を仮定します。
    // よく分からない場合は 41 のままでOKです。
    // 情報量が多いQRは 41 より大きいことがあります。
    var ASSUMED_QR_MODULE_COUNT = 29;

    // 1セルあたりの注意ライン。
    // 0.25mm未満だと、印刷物として読み取りにくくなる可能性がある、という注意扱い。
    var MIN_MODULE_SIZE_MM = 0.25;

    // 1セルあたりの強い警告ライン。
    // 0.17mm未満はかなり小さい可能性がある。
    var DANGER_MODULE_SIZE_MM = 0.17;

    // QRコード全体の短辺サイズの注意ライン。
    // 41セル想定で 0.25mm/セル なら約10.25mmなので、まずは10mmを下限目安にする。
    var MIN_QR_SHORT_SIDE_MM = 10.0;

    // Homebrew / Intel Mac / 一般的なPATHを含める
    var SHELL_PATH = [
        "/opt/homebrew/bin",
        "/usr/local/bin",
        "/usr/bin",
        "/bin",
        "/usr/sbin",
        "/sbin"
    ].join(":");

    // Safariで開くときのアプリ名
    var SAFARI_APP_NAME = "Safari";

    // ============================================================
    // メイン処理
    // ============================================================

    try {
        if (app.documents.length === 0) {
            alert("ドキュメントが開かれていません。", SCRIPT_TITLE);
            return;
        }

        if (app.selection.length !== 1) {
            alert(
                "QRコードの画像、またはQRコードを含むフレームを1つ選択してから実行してください。",
                SCRIPT_TITLE
            );
            return;
        }

        var zbarPath = findCommand("zbarimg");

        if (!zbarPath) {
            alert(
                "zbarimg が見つかりませんでした。\n\n" +
                "QRコードを読み取るには、外部コマンド zbarimg が必要です。\n\n" +
                "Homebrewを使用している場合は、ターミナルで下記を実行してください。\n\n" +
                "brew install zbar",
                SCRIPT_TITLE
            );
            return;
        }

        var targetItem = getExportablePageItem(app.selection[0]);

        if (!targetItem) {
            alert(
                "選択中のオブジェクトを書き出し対象として扱えませんでした。\n\n" +
                "配置画像、画像フレーム、PDF/AI/EPS配置フレーム、またはグループを選択して再実行してください。",
                SCRIPT_TITLE
            );
            return;
        }

        if (!checkQrPhysicalSizeBeforeDecode(targetItem)) {
            return;
        }

        var tempFile = makeTempPngFile();

        exportPageItemToPng(targetItem, tempFile);

        if (!tempFile.exists) {
            alert(
                "一時PNGの書き出しに失敗しました。",
                SCRIPT_TITLE
            );
            return;
        }

        var decodedText = decodeQrWithZbar(zbarPath, tempFile);

        safeRemoveFile(tempFile);

        decodedText = trimText(decodedText);

        if (!decodedText) {
            alert(
                "QRコードを読み取れませんでした。\n\n" +
                "考えられる原因:\n" +
                "・QRコードが小さい\n" +
                "・歪みや変倍が大きい\n" +
                "・選択範囲に余計な要素が多い\n" +
                "・QRコードがトリミングされている\n" +
                "・コントラストが低い\n\n" +
                "QRコードのフレームだけを選択して、もう一度試してください。",
                SCRIPT_TITLE
            );
            return;
        }

        var normalizedUrl = normalizeUrlForOpening(decodedText);
        var isOpenable = isProbablyOpenableUrl(normalizedUrl);

        var choice = showResultDialog(decodedText, normalizedUrl, isOpenable);

        if (choice === "safari") {
            openUrlWithSafari(normalizedUrl);
        } else if (choice === "default") {
            openUrlWithDefaultBrowser(normalizedUrl);
        } else if (choice === "copy") {
            copyToClipboard(decodedText);
            alert("読み取り結果をクリップボードにコピーしました。", SCRIPT_TITLE);
        }

    } catch (e) {
        alert(
            "エラーが発生しました。\n\n" +
            e.name + ": " + e.message + "\n\n" +
            "Line: " + e.line,
            SCRIPT_TITLE
        );
    }

    // ============================================================
    // 選択オブジェクト処理
    // ============================================================

    function getExportablePageItem(selection) {
        if (!selection) {
            return null;
        }

        /*
            InDesignの選択状態は以下のように揺れます。

            - 画像そのものを選択している場合:
              selection.constructor.name が Image / PDF / EPS などになることがある
              この場合は parent のRectangle等を書き出す

            - フレームを選択している場合:
              Rectangle / Polygon / Oval / Group などになる

            - グループ内の画像を選択している場合:
              parentをたどる必要がある場合がある
        */

        if (hasExportFile(selection)) {
            return selection;
        }

        if (selection.parent && hasExportFile(selection.parent)) {
            return selection.parent;
        }

        var current = selection;
        var safety = 0;

        while (current && current.parent && safety < 10) {
            current = current.parent;

            if (hasExportFile(current)) {
                return current;
            }

            safety++;
        }

        return null;
    }

    function hasExportFile(obj) {
        try {
            return obj && typeof obj.exportFile === "function";
        } catch (e) {
            return false;
        }
    }

    // ============================================================
    // PNG書き出し
    // ============================================================

    function exportPageItemToPng(pageItem, outFile) {
        var oldPrefs = capturePngExportPreferences();

        try {
            app.pngExportPreferences.exportResolution = EXPORT_RESOLUTION;

            try {
                app.pngExportPreferences.pngColorSpace = PNGColorSpaceEnum.RGB;
            } catch (e1) {}

            try {
                app.pngExportPreferences.transparentBackground = false;
            } catch (e2) {}

            try {
                app.pngExportPreferences.antiAlias = true;
            } catch (e3) {}

            pageItem.exportFile(ExportFormat.PNG_FORMAT, outFile);

        } finally {
            restorePngExportPreferences(oldPrefs);
        }
    }

    function capturePngExportPreferences() {
        var prefs = {};

        safelyCapture(prefs, "exportResolution");
        safelyCapture(prefs, "pngColorSpace");
        safelyCapture(prefs, "transparentBackground");
        safelyCapture(prefs, "antiAlias");

        return prefs;
    }

    function safelyCapture(store, propName) {
        try {
            store[propName] = app.pngExportPreferences[propName];
        } catch (e) {
            store[propName] = undefined;
        }
    }

    function restorePngExportPreferences(prefs) {
        if (!prefs) {
            return;
        }

        safelyRestore(prefs, "exportResolution");
        safelyRestore(prefs, "pngColorSpace");
        safelyRestore(prefs, "transparentBackground");
        safelyRestore(prefs, "antiAlias");
    }

    function safelyRestore(store, propName) {
        try {
            if (store[propName] !== undefined) {
                app.pngExportPreferences[propName] = store[propName];
            }
        } catch (e) {}
    }

    function makeTempPngFile() {
        var tempFolder = Folder.temp;
        var name = "gyahtei_qr_read_" + (new Date().getTime()) + ".png";
        return new File(tempFolder.fsName + "/" + name);
    }

    function safeRemoveFile(fileObj) {
        try {
            if (fileObj && fileObj.exists) {
                fileObj.remove();
            }
        } catch (e) {}
    }

    // ============================================================
    // 印刷時のQRサイズ警告
    // ============================================================

    function checkQrPhysicalSizeBeforeDecode(pageItem) {
        if (!ENABLE_PRINT_SIZE_WARNING) {
            return true;
        }

        var sizeInfo = getPageItemSizeInMm(pageItem);

        if (!sizeInfo) {
            return true;
        }

        var shortSideMm = Math.min(sizeInfo.widthMm, sizeInfo.heightMm);
        var estimatedModuleMm = shortSideMm / ASSUMED_QR_MODULE_COUNT;

        var warnings = [];

        if (shortSideMm < MIN_QR_SHORT_SIDE_MM) {
            warnings.push(
                "QRコードの短辺が小さめです。\n" +
                "短辺: 約 " + roundTo(shortSideMm, 2) + " mm\n" +
                "目安: " + MIN_QR_SHORT_SIDE_MM + " mm 以上"
            );
        }

        if (estimatedModuleMm < DANGER_MODULE_SIZE_MM) {
            warnings.push(
                "QRコードの1セルがかなり小さい可能性があります。\n" +
                "推定1セル: 約 " + roundTo(estimatedModuleMm, 3) + " mm\n" +
                "強い警告ライン: " + DANGER_MODULE_SIZE_MM + " mm 未満\n" +
                "注意ライン: " + MIN_MODULE_SIZE_MM + " mm 未満\n" +
                "仮定セル数: " + ASSUMED_QR_MODULE_COUNT + " セル"
            );
        } else if (estimatedModuleMm < MIN_MODULE_SIZE_MM) {
            warnings.push(
                "QRコードの1セルが小さめです。\n" +
                "推定1セル: 約 " + roundTo(estimatedModuleMm, 3) + " mm\n" +
                "注意ライン: " + MIN_MODULE_SIZE_MM + " mm 未満\n" +
                "仮定セル数: " + ASSUMED_QR_MODULE_COUNT + " セル"
            );
        }

        if (warnings.length === 0) {
            return true;
        }

        var measuredItemText = "";

        if (sizeInfo.measuredItemName) {
            measuredItemText = "測定対象: " + sizeInfo.measuredItemName + "\n";
        }

        var message =
            "このQRコードは、印刷物としてスマホで読み取りにくいサイズかもしれません。\n\n" +
            warnings.join("\n\n") +
            "\n\n" +
            "配置サイズ:\n" +
            measuredItemText +
            "幅: 約 " + roundTo(sizeInfo.widthMm, 2) + " mm\n" +
            "高さ: 約 " + roundTo(sizeInfo.heightMm, 2) + " mm\n" +
            "推定1セル: 約 " + roundTo(estimatedModuleMm, 3) + " mm\n" +
            "仮定セル数: " + ASSUMED_QR_MODULE_COUNT + " セル\n\n" +
            "このまま読み取り処理を続けますか？";

        var result = confirm(message);

        return result;
    }

    function getPageItemSizeInMm(pageItem) {
    try {
        var measureItem = getBestItemForPhysicalSize(pageItem);

        if (!measureItem) {
            return null;
        }

        var oldMeasurementUnit = null;

        try {
            oldMeasurementUnit = app.scriptPreferences.measurementUnit;
            app.scriptPreferences.measurementUnit = MeasurementUnits.MILLIMETERS;
        } catch (e1) {}

        var bounds = measureItem.geometricBounds;

        try {
            if (oldMeasurementUnit !== null) {
                app.scriptPreferences.measurementUnit = oldMeasurementUnit;
            }
        } catch (e2) {}

        if (!bounds || bounds.length < 4) {
            return null;
        }

        var top = Number(bounds[0]);
        var left = Number(bounds[1]);
        var bottom = Number(bounds[2]);
        var right = Number(bounds[3]);

        var widthMm = Math.abs(right - left);
        var heightMm = Math.abs(bottom - top);

        return {
            widthMm: widthMm,
            heightMm: heightMm,
            measuredItemName: getObjectName(measureItem),
            rawWidth: widthMm,
            rawHeight: heightMm
        };

    } catch (e) {
        return null;
    }
}

    function getBestItemForPhysicalSize(pageItem) {
    /*
        印刷時のQRサイズとして見たいのは、
        フレーム外寸ではなく「中身の画像が実際に表示されているサイズ」です。

        理由:
        - フレームだけ大きくしても、中身のQRが小さいままなら読みにくい
        - フレーム外寸で判定すると、実際より安全側に誤判定してしまう

        そのため、Graphics / Images / PDFs / EPSs などが取れる場合は、
        中身の geometricBounds を優先します。
        取れない場合のみ、フレームやグループの外寸にフォールバックします。
    */

    if (!pageItem) {
        return null;
    }

    var contentItem = getFirstGraphicContent(pageItem);

    if (contentItem) {
        return contentItem;
    }

    var current = pageItem;
    var safety = 0;

    while (current && safety < 10) {
        var innerContent = getFirstGraphicContent(current);

        if (innerContent) {
            return innerContent;
        }

        if (isLikelyPageFrame(current)) {
            return current;
        }

        if (!current.parent) {
            break;
        }

        current = current.parent;
        safety++;
    }

    return pageItem;
}

function getFirstGraphicContent(obj) {
    /*
        Rectangleなどのフレーム内にある実画像・PDF・EPS・AI等を拾います。
        InDesignでは配置PDFやAIも graphics 経由で取れることが多いです。
    */

    if (!obj) {
        return null;
    }

    try {
        if (obj.graphics && obj.graphics.length > 0) {
            return obj.graphics[0];
        }
    } catch (e1) {}

    try {
        if (obj.images && obj.images.length > 0) {
            return obj.images[0];
        }
    } catch (e2) {}

    try {
        if (obj.pdfs && obj.pdfs.length > 0) {
            
            return obj.pdfs[0];
        }
    } catch (e3) {}

    try {
        if (obj.epss && obj.epss.length > 0) {
            return obj.epss[0];
        }
    } catch (e4) {}

    try {
        if (obj.allGraphics && obj.allGraphics.length > 0) {
            return obj.allGraphics[0];
        }
    } catch (e5) {}

    return null;
}

    function isLikelyPageFrame(obj) {
        try {
            var name = obj.constructor.name;

            return (
                name === "Rectangle" ||
                name === "Oval" ||
                name === "Polygon" ||
                name === "Group"
            );
        } catch (e) {
            return false;
        }
    }

    function getObjectName(obj) {
        try {
            return obj.constructor.name;
        } catch (e) {
            return "";
        }
    }

    function ptToMm(pt) {
        return pt * 0.3527777778;
    }

    function roundTo(value, digits) {
        var factor = Math.pow(10, digits);
        return Math.round(value * factor) / factor;
    }

    // ============================================================
    // QRデコード
    // ============================================================

    function decodeQrWithZbar(zbarPath, imageFile) {
        var command =
            "PATH=" + shQuote(SHELL_PATH) + " " +
            shQuote(zbarPath) +
            " --quiet --raw " +
            shQuote(imageFile.fsName) +
            " 2>/dev/null || true";

        return runShell(command);
    }

    function findCommand(commandName) {
        var command =
            "PATH=" + shQuote(SHELL_PATH) + " " +
            "command -v " + shQuote(commandName) + " 2>/dev/null || true";

        var result = trimText(runShell(command));

        if (result) {
            return result;
        }

        return "";
    }

    // ============================================================
    // URL処理
    // ============================================================

    function normalizeUrlForOpening(text) {
        var value = trimText(text);

        // よくあるQR: www.example.com
        if (/^www\./i.test(value)) {
            return "https://" + value;
        }

        return value;
    }

    function isProbablyOpenableUrl(text) {
        return /^(https?|ftp|mailto|tel):/i.test(text);
    }

    function openUrlWithSafari(url) {
        if (!isProbablyOpenableUrl(url)) {
            alert(
                "URLとして開ける形式ではなさそうです。\n\n" +
                url,
                SCRIPT_TITLE
            );
            return;
        }

        var command =
            "open -a " + shQuote(SAFARI_APP_NAME) + " " + shQuote(url);

        runShell(command);
    }

    function openUrlWithDefaultBrowser(url) {
        if (!isProbablyOpenableUrl(url)) {
            alert(
                "URLとして開ける形式ではなさそうです。\n\n" +
                url,
                SCRIPT_TITLE
            );
            return;
        }

        var command =
            "open " + shQuote(url);

        runShell(command);
    }

    function copyToClipboard(text) {
        var command =
            "printf %s " + shQuote(text) + " | pbcopy";

        runShell(command);
    }

    // ============================================================
    // ダイアログ
    // ============================================================

    function showResultDialog(originalText, normalizedUrl, isOpenable) {
        var win = new Window("dialog", SCRIPT_TITLE);
        win.orientation = "column";
        win.alignChildren = ["fill", "top"];
        win.spacing = 12;
        win.margins = 16;

        var title = win.add("statictext", undefined, "QRコードを読み取りました。");
        title.graphics.font = ScriptUI.newFont(title.graphics.font.name, "BOLD", 14);

        var panel = win.add("panel", undefined, "読み取り結果");
        panel.orientation = "column";
        panel.alignChildren = ["fill", "top"];
        panel.margins = 12;

        var resultBox = panel.add(
            "edittext",
            undefined,
            originalText,
            {
                multiline: true,
                scrolling: true
            }
        );
        resultBox.preferredSize = [520, 90];

        var noteText = "";

        if (normalizedUrl !== originalText) {
            noteText += "開くときのURL: " + normalizedUrl + "\n";
        }

        if (!isOpenable) {
            noteText += "URLとして開ける形式ではなさそうです。必要ならコピーして確認してください。";
        } else {
            noteText += "URLとして開けそうです。";
        }

        var note = win.add("statictext", undefined, noteText, {
            multiline: true
        });
        note.preferredSize = [520, 40];

        var buttonGroup = win.add("group");
        buttonGroup.orientation = "row";
        buttonGroup.alignment = ["right", "center"];

        var choice = "cancel";

        var safariBtn = buttonGroup.add("button", undefined, "Safariで開く");
        var defaultBtn = buttonGroup.add("button", undefined, "既定ブラウザで開く");
        var copyBtn = buttonGroup.add("button", undefined, "コピー");
        var cancelBtn = buttonGroup.add("button", undefined, "キャンセル", {
            name: "cancel"
        });

        safariBtn.enabled = isOpenable;
        defaultBtn.enabled = isOpenable;

        safariBtn.onClick = function () {
            choice = "safari";
            win.close();
        };

        defaultBtn.onClick = function () {
            choice = "default";
            win.close();
        };

        copyBtn.onClick = function () {
            choice = "copy";
            win.close();
        };

        cancelBtn.onClick = function () {
            choice = "cancel";
            win.close();
        };

        win.show();

        return choice;
    }

    // ============================================================
    // シェル / AppleScript
    // ============================================================

    function runShell(command) {
        var appleScript =
            'do shell script ' + appleScriptQuote(command);

        try {
            return app.doScript(
                appleScript,
                ScriptLanguage.APPLESCRIPT_LANGUAGE
            );
        } catch (e) {
            return "";
        }
    }

    function shQuote(value) {
        value = String(value);
        return "'" + value.replace(/'/g, "'\\''") + "'";
    }

    function appleScriptQuote(value) {
        value = String(value);
        return '"' + value.replace(/\\/g, "\\\\").replace(/"/g, '\\"') + '"';
    }

    // ============================================================
    // 文字列処理
    // ============================================================

    function trimText(value) {
        if (value === null || value === undefined) {
            return "";
        }

        return String(value)
            .replace(/^\s+/, "")
            .replace(/\s+$/, "");
    }

})();
