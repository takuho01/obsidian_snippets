const { Plugin, editor, MarkdownView } = require("obsidian");
const { EditorView } = require("@codemirror/view");

let zoom_func_const = -4.244;
let zoom_func_div = 0.0372;

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

function scrollIntoViewSimple(pos) {
    const view = app.workspace.getActiveViewOfType(MarkdownView);
    const cm = view.editor.cm;

    cm.dispatch({
        // effects: EditorView.scrollIntoView(pos)
        effects: EditorView.scrollIntoView(pos, { y: "start" })
    });
}

function scrollLineToTop(lineNumber) {
    const view = app.workspace.getActiveViewOfType(MarkdownView);
    if (!view) return;

    const editorView = view.editor && view.editor.cm;
    if (!editorView) return;

    const doc = editorView.state.doc;

    // 範囲外ガード（lineNumber は 1-based）
    if (lineNumber < 1 || lineNumber > doc.lines) return;

    // 指定行の開始位置（文字オフセット）
    const line = doc.line(lineNumber);

    // その行のY座標（px）
    const y = editorView.lineBlockAt(line.from).top;

    // スクロール実行
    editorView.scrollDOM.scrollTo({
        top: y,
        behavior: "auto" // "smooth" にするとアニメーション
    });
}

// function getTopVisibleLine() {
//     const view = app.workspace.getActiveViewOfType(MarkdownView);
//     if (!view) return null;

//     const cm = view.editor.cm;

//     // viewport.from = 画面内で一番上に見えている文字位置
//     const { from } = cm.viewport;

//     // その位置が属する行を取得（CM6は1-based）
//     const line = cm.state.doc.lineAt(from);

//     return line.number - 1; // 0-based 行番号で返す
// }

function getTopVisibleLine() {
  const view = app.workspace.getActiveViewOfType(MarkdownView);
  const cm = view?.editor?.cm;
  if (!cm) return null;

  // スクロールの現在位置(px)
  const y = cm.scrollDOM.scrollTop;

  // その高さにある行ブロック（CM6）
  const block = cm.lineBlockAtHeight(y);

  // block.from は doc の文字位置
  const line = cm.state.doc.lineAt(block.from);

  return line.number - 1; // 0-based
}

function getTopVisiblePos() {
  const view = app.workspace.getActiveViewOfType(MarkdownView);
  const cm = view?.editor?.cm;
  if (!cm) return null;

  const y = cm.scrollDOM.scrollTop + 1;
  const block = cm.lineBlockAtHeight(y);
  return block.from; // ← これが doc position
}

function getTopVisibleLineNumber() {
    const view = app.workspace.getActiveViewOfType(MarkdownView);
    if (!view) return null;

    const editorView = view.editor && view.editor.cm;
    if (!editorView) return null;

    // 現在のスクロール位置（px）
    const scrollTop = editorView.scrollDOM.scrollTop;

    // その高さにある行ブロック
    const block = editorView.lineBlockAtHeight(scrollTop);

    // doc上の文字位置 → 行情報
    const line = editorView.state.doc.lineAt(block.from);

    // 1-based 行番号
    return line.number;
}

function use_codemirrorr_api() {
    const view = this.app.workspace.getActiveViewOfType(MarkdownView);
    if (view) {
        const cm = view.editor.cm; // CodeMirror 6 EditorView

        // 現在のビューポート（from/to は document position）
        const { from, to } = cm.viewport;

        // to は「画面に見えている最後の文字位置」
        // それを行番号に変換
        const line = cm.state.doc.lineAt(from);

        // 0-based
        const firstVisibleLine = line.number - 1;
        
        console.log("first visible line:", firstVisibleLine);
        
        cm.dispatch({
            effects: EditorView.scrollIntoView(pos, { y: "start" }) // ←最上段に合わせる
        });
        
    } else {
        console.log("No active Markdown view found.");
    }
}

function calc_font_size(width) {
    return  zoom_func_div * width + zoom_func_const;
}

function zoom01(delta) {
    const root = document.documentElement;
    
    // widthを取得
    const tmp_width = getComputedStyle(root).getPropertyValue("--editor-width").trim();
    const current_width = parseFloat(tmp_width) || 0;
    console.log("editor-width:", current_width);
    
    // widthを更新
    const next_width = current_width + delta;
    root.style.setProperty("--editor-width", next_width + "px");
    console.log("editor-width:", next_width);     
    
    // update font size
    const new_font_size = calc_font_size(next_width);
    root.style.setProperty("--editor-font-size", new_font_size + "px");
    console.log("editor-font-size:", new_font_size);
    console.log("zoom_func_const:", zoom_func_const);
    console.log("zoom_func_div:", zoom_func_div);
}

module.exports = class PluginSandbox02 extends Plugin {
    
    onload() {
        const delta_width = 25;
        // ---- 1増やす ----
        this.addCommand({
            id: "sandbox02-hoge",
            name: "sandbox02-hoge : hoge",
            editorCallback: (editor) => {
                console.log("hoge");
            },
        });
        
        // ---- keydown event ----
        this.registerDomEvent(document, "keydown", async (event) => {
            if (event.ctrlKey && event.key === "^") {
                event.preventDefault();
                let topVisibleLine = getTopVisibleLineNumber();
                console.log("topVisibleLineNumber start:", topVisibleLine);
                zoom01(70);
                await sleep(2000);// 2秒待機
                // scrollIntoViewSimple(200);
                // scrollIntoViewSimple(topVisibleLine - 1);
                scrollLineToTop(topVisibleLine);
            }
        });
        
        this.registerDomEvent(document, "keydown", (event) => {
            if (event.ctrlKey && event.key === "@") {
                event.preventDefault();
                let topVisibleLineNumber_after = getTopVisibleLineNumber();
                console.log("topVisibleLineNumber end:", topVisibleLineNumber_after);
            }
        });
        
        this.registerDomEvent(document, "keydown", (event) => {
            if (event.ctrlKey && event.key === "[") {
                event.preventDefault();
                // scrollIntoViewSimple(30);
                scrollLineToTop(30);
            }
        });
        
        this.registerDomEvent(document, "keydown", (event) => {
            if (event.ctrlKey && event.key === "]") {
                event.preventDefault();
                
            }
        });   
    }
};
