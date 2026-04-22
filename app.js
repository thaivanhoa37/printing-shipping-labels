// ===== State =====
let state = {
    customer: { name: '', phone: '', address: '' },
    products: [
        { name: 'Áo thun nam cao cấp', qty: 2, price: 250000 },
        { name: 'Quần jean slim fit', qty: 1, price: 450000 },
        { name: 'Giày sneaker trắng', qty: 1, price: 890000 }
    ],
    note: 'Cảm ơn quý khách đã mua hàng!',
    date: new Date().toISOString().split('T')[0],
    // Khối văn bản tự do — hiển thị thêm trên hóa đơn
    customBlocks: [],
    invoiceMode: 'standard', // 'standard' | 'custom'
    customHtml: '<p>Xin chào, hãy xóa dòng này và tự thiết kế nội dung hóa đơn của bạn ở đây...</p>',
    settings: {
        companyName: 'CÔNG TY TNHH ABC',
        companyAddress: '123 Nguyễn Văn Linh, Q.7, TP.HCM',
        companyPhone: '028 1234 5678',
        logo: '',
        primaryColor: '#E53935',
        font: "'Inter', sans-serif",
        paperSize: 'A5',
        orientation: 'portrait',
        copies: 1,
        toggles: {
            logo: true, company: true, customer: true,
            products: true, total: true, note: true, qr: true
        },
        writingMode: 'horizontal-tb',
        fontSizeScale: 1,
        printMode: 'tem',
        qrText: 'https://example.com',
        // Khổ giấy tùy chỉnh
        customPaper: {
            widthMM: 100,   // luôn lưu dạng mm
            heightMM: 150,
            unit: 'mm',     // đơn vị hiển thị: 'mm' hoặc 'cm'
            name: 'Tùy chỉnh'
        }
    }
};

let zoom = 100;

// ===== Init =====
document.addEventListener('DOMContentLoaded', () => {
    loadState();
    populateForm();
    renderProducts();
    renderBlocks();
    initCustomSizeUI();
    updatePreview();
});

// ===== LocalStorage =====
function saveState() {
    localStorage.setItem('invoiceAppState', JSON.stringify(state));
}
function loadState() {
    const saved = localStorage.getItem('invoiceAppState');
    if (saved) {
        try {
            const parsed = JSON.parse(saved);
            state = { ...state, ...parsed, settings: { ...state.settings, ...parsed.settings, toggles: { ...state.settings.toggles, ...(parsed.settings?.toggles || {}) } } };
        } catch (e) { console.warn('Failed to load state', e); }
    }
}

function populateForm() {
    document.getElementById('customerName').value = state.customer.name;
    document.getElementById('customerPhone').value = state.customer.phone;
    document.getElementById('customerAddress').value = state.customer.address;
    document.getElementById('invoiceDate').value = state.date;
    document.getElementById('invoiceNote').value = state.note;
    document.getElementById('companyName').value = state.settings.companyName;
    document.getElementById('companyAddress').value = state.settings.companyAddress;
    document.getElementById('companyPhone').value = state.settings.companyPhone;
    document.getElementById('primaryColor').value = state.settings.primaryColor;
    document.getElementById('colorHex').textContent = state.settings.primaryColor;
    document.getElementById('qrText').value = state.settings.qrText;

    // Custom Mode
    const editor = document.getElementById('customHtmlEditor');
    if (editor) editor.innerHTML = state.customHtml || '';
    switchInvoiceMode(state.invoiceMode || 'standard', true);

    // Font
    const fontSel = document.getElementById('fontSelect');
    for (let opt of fontSel.options) { if (opt.value === state.settings.font) opt.selected = true; }

    // Toggles
    Object.keys(state.settings.toggles).forEach(key => {
        const el = document.getElementById('toggle' + key.charAt(0).toUpperCase() + key.slice(1));
        if (el) el.checked = state.settings.toggles[key];
    });

    // Paper size & orientation
    selectSize(state.settings.paperSize, true);
    selectOrientation(state.settings.orientation, true);

    // Copies
    document.querySelectorAll('input[name="copies"]').forEach(r => {
        r.checked = parseInt(r.value) === state.settings.copies;
    });

    // Writing Mode
    document.querySelectorAll('input[name="writingMode"]').forEach(r => {
        r.checked = r.value === (state.settings.writingMode || 'horizontal-tb');
    });

    // Print Mode
    document.querySelectorAll('input[name="printMode"]').forEach(r => {
        r.checked = r.value === (state.settings.printMode || 'tem');
    });
    if (typeof onPrintModeChange === 'function') onPrintModeChange(true);

    // Logo
    if (state.settings.logo) {
        document.getElementById('logoPreviewImg').src = state.settings.logo;
        document.getElementById('logoPreviewWrap').style.display = 'flex';
    }

    // Font size scale
    const scaleInput = document.getElementById('fontSizeScale');
    if (scaleInput) {
        scaleInput.value = state.settings.fontSizeScale || 1;
        document.getElementById('fontSizeScaleLabel').textContent = Math.round((state.settings.fontSizeScale || 1) * 100) + '%';
    }

    // Apply color & font
    changePrimaryColor(state.settings.primaryColor, true);
    changeFont(state.settings.font, true);
}

// ===== Tabs =====
function switchTab(tab) {
    document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.nav-btn[data-tab]').forEach(el => el.classList.remove('active'));
    document.getElementById('tab-' + tab).classList.add('active');
    document.querySelector(`.nav-btn[data-tab="${tab}"]`).classList.add('active');

    const titles = { invoice: 'Tạo Hóa Đơn', template: 'Mẫu In', blocks: 'Văn Bản', settings: 'Cài Đặt' };
    document.getElementById('pageTitle').textContent = titles[tab] || 'Hóa Đơn Pro';
}

function switchInvoiceMode(mode, silent = false) {
    state.invoiceMode = mode;
    
    // Toggle active classes on the switcher buttons
    document.querySelectorAll('.mode-switch-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.mode === mode);
    });

    // Show/hide relevant panels
    const standardPanel = document.getElementById('standardInvoiceFields');
    const customPanel = document.getElementById('customInvoiceFields');
    if (standardPanel && customPanel) {
        if (mode === 'custom') {
            standardPanel.style.display = 'none';
            customPanel.style.display = 'block';
        } else {
            standardPanel.style.display = 'block';
            customPanel.style.display = 'none';
        }
    }

    if (!silent) updatePreview();
}

function toggleSidebar() {
    document.getElementById('sidebar').classList.toggle('open');
}

// ===== Products =====
function renderProducts() {
    const list = document.getElementById('productList');
    let html = '';
    state.products.forEach((p, i) => {
        const sub = p.qty * p.price;
        html += `
        <div class="product-item" data-index="${i}">
            <div>
                ${i === 0 ? '<label>Sản phẩm</label>' : ''}
                <input type="text" value="${escHtml(p.name)}" placeholder="Tên SP" onchange="updateProduct(${i},'name',this.value)">
            </div>
            <div>
                ${i === 0 ? '<label>SL</label>' : ''}
                <input type="number" value="${p.qty}" min="1" onchange="updateProduct(${i},'qty',this.value)">
            </div>
            <div>
                ${i === 0 ? '<label>Đơn giá</label>' : ''}
                <input type="number" value="${p.price}" min="0" onchange="updateProduct(${i},'price',this.value)">
            </div>
            <div class="subtotal">${i === 0 ? '<label>Thành tiền</label>' : ''}${formatCurrency(sub)}</div>
            <button class="btn-remove-product" onclick="removeProduct(${i})" title="Xóa">✕</button>
        </div>`;
    });

    const total = state.products.reduce((s, p) => s + p.qty * p.price, 0);
    html += `<div class="total-bar"><span>TỔNG CỘNG:</span><span>${formatCurrency(total)}</span></div>`;
    list.innerHTML = html;
}

function addProduct() {
    state.products.push({ name: '', qty: 1, price: 0 });
    renderProducts();
    updatePreview();
}

function updateProduct(i, field, val) {
    if (field === 'qty' || field === 'price') val = Number(val) || 0;
    state.products[i][field] = val;
    renderProducts();
    updatePreview();
}

function removeProduct(i) {
    state.products.splice(i, 1);
    renderProducts();
    updatePreview();
}

// ===== Settings =====
function selectSize(size, silent) {
    state.settings.paperSize = size;
    document.querySelectorAll('.size-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.size === size);
    });

    // Auto switch orientation based on default dimensions
    if (!silent && size !== 'custom' && PAPER_SIZES[size]) {
        const [w, h] = PAPER_SIZES[size];
        if (w > h && state.settings.orientation !== 'landscape') {
            selectOrientation('landscape', true);
        } else if (w <= h && state.settings.orientation !== 'portrait') {
            selectOrientation('portrait', true);
        }
    }

    const paper = document.getElementById('previewPaper');
    paper.setAttribute('data-size', size);
    if (!silent) updatePreview();
}

function selectOrientation(orient, silent) {
    const oldOrient = state.settings.orientation;
    state.settings.orientation = orient;
    document.querySelectorAll('.orient-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.orient === orient);
    });

    // Auto-swap custom size if user explicitly clicks orientation
    if (!silent && oldOrient && oldOrient !== orient && state.settings.paperSize === 'custom') {
        const wInput = document.getElementById('customWidth');
        const hInput = document.getElementById('customHeight');
        if (wInput && hInput) {
            const temp = wInput.value;
            wInput.value = hInput.value;
            hInput.value = temp;
            
            // Re-apply custom size (this will also update state and preview)
            const wVal = parseFloat(wInput.value) || 100;
            const hVal = parseFloat(hInput.value) || 150;
            const wMM = _customUnit === 'cm' ? Math.round(wVal * 10) : wVal;
            const hMM = _customUnit === 'cm' ? Math.round(hVal * 10) : hVal;
            
            if (!state.settings.customPaper) state.settings.customPaper = {};
            state.settings.customPaper.widthMM = wMM;
            state.settings.customPaper.heightMM = hMM;
            updatePreviewPaperCustom(wMM, hMM);
            updateCustomSizeDisplay();
            saveState();
        }
    }

    const paper = document.getElementById('previewPaper');
    paper.setAttribute('data-orient', orient);
    if (!silent) updatePreview();
}

function changePrimaryColor(color, silent) {
    state.settings.primaryColor = color;
    document.documentElement.style.setProperty('--primary', color);
    // Compute lighter variant
    const r = parseInt(color.slice(1, 3), 16), g = parseInt(color.slice(3, 5), 16), b = parseInt(color.slice(5, 7), 16);
    const lighter = `rgb(${Math.min(r + 40, 255)},${Math.min(g + 40, 255)},${Math.min(b + 40, 255)})`;
    document.documentElement.style.setProperty('--primary-light', lighter);
    document.getElementById('colorHex').textContent = color;
    if (!silent) updatePreview();
}

function changeFont(font, silent) {
    state.settings.font = font;
    if (!silent) updatePreview();
}

function updateFontSizeScale(val) {
    state.settings.fontSizeScale = parseFloat(val) || 1;
    document.getElementById('fontSizeScaleLabel').textContent = Math.round(state.settings.fontSizeScale * 100) + '%';
    updatePreview();
}

function handleLogoUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
        state.settings.logo = ev.target.result;
        document.getElementById('logoPreviewImg').src = ev.target.result;
        document.getElementById('logoPreviewWrap').style.display = 'flex';
        updatePreview();
    };
    reader.readAsDataURL(file);
}

function removeLogo() {
    state.settings.logo = '';
    document.getElementById('logoPreviewImg').src = '';
    document.getElementById('logoPreviewWrap').style.display = 'none';
    document.getElementById('logoUpload').value = '';
    updatePreview();
}

// ===== Print Mode (Tem/Bill) =====
function onPrintModeChange(silent = false) {
    const mode = document.querySelector('input[name="printMode"]:checked')?.value || 'tem';
    state.settings.printMode = mode;
    
    // Toggle UI
    const sizesTem = document.getElementById('sizesTem');
    const sizesBill = document.getElementById('sizesBill');
    
    if (mode === 'tem') {
        if (sizesTem) sizesTem.style.display = 'block';
        if (sizesBill) sizesBill.style.display = 'none';
    } else {
        if (sizesTem) sizesTem.style.display = 'none';
        if (sizesBill) sizesBill.style.display = 'block';
    }
    
    if (!silent) updatePreview();
}

// ===== Preview =====
function readFormState() {
    state.customer.name = document.getElementById('customerName').value;
    state.customer.phone = document.getElementById('customerPhone').value;
    state.customer.address = document.getElementById('customerAddress').value;
    state.date = document.getElementById('invoiceDate').value;
    state.note = document.getElementById('invoiceNote').value;
    state.settings.companyName = document.getElementById('companyName').value;
    state.settings.companyAddress = document.getElementById('companyAddress').value;
    state.settings.companyPhone = document.getElementById('companyPhone').value;
    state.settings.qrText = document.getElementById('qrText').value;
    state.settings.copies = parseInt(document.querySelector('input[name="copies"]:checked')?.value || '1');
    state.settings.writingMode = document.querySelector('input[name="writingMode"]:checked')?.value || 'horizontal-tb';
    state.settings.printMode = document.querySelector('input[name="printMode"]:checked')?.value || 'tem';
    state.settings.fontSizeScale = parseFloat(document.getElementById('fontSizeScale')?.value) || 1;

    const toggleKeys = ['logo', 'company', 'customer', 'products', 'total', 'note', 'qr'];
    toggleKeys.forEach(key => {
        const el = document.getElementById('toggle' + key.charAt(0).toUpperCase() + key.slice(1));
        if (el) state.settings.toggles[key] = el.checked;
    });
}

function updateCustomHtml() {
    const editor = document.getElementById('customHtmlEditor');
    if (editor) {
        state.customHtml = editor.innerHTML;
        updatePreview();
    }
}

function execWysiwyg(cmd, value = null) {
    document.execCommand(cmd, false, value);
    const editor = document.getElementById('customHtmlEditor');
    if (editor) editor.focus();
    updateCustomHtml();
}

function insertTable() {
    const rows = prompt('Số dòng:', '3');
    const cols = prompt('Số cột:', '3');
    if (!rows || !cols) return;
    let html = '<table class="inv-table" style="width:100%; border-collapse:collapse; margin-bottom:12px;"><tbody>';
    for (let r = 0; r < rows; r++) {
        html += '<tr>';
        for (let c = 0; c < cols; c++) {
            html += `<td style="border:1px solid #ccc; padding:6px;">Cell</td>`;
        }
        html += '</tr>';
    }
    html += '</tbody></table><p><br></p>';
    execWysiwyg('insertHTML', html);
}

function updatePreview() {
    readFormState();
    saveState();

    const t = state.settings.toggles;
    const total = state.products.reduce((s, p) => s + p.qty * p.price, 0);
    const invNum = 'INV-' + (state.date || '').replace(/-/g, '').slice(2) + '-' + String(Math.floor(Math.random() * 900) + 100);

    const writingModeStyle = state.settings.writingMode === 'vertical-rl' ? 'writing-mode: vertical-rl; text-orientation: mixed;' : '';
    const scaleValue = state.settings.fontSizeScale || 1;
    let html = `<div style="font-family:${state.settings.font}; ${writingModeStyle}; font-size: ${scaleValue}em;">`;

    // Header
    if (t.logo || t.company) {
        html += `<div class="inv-header">`;
        if (t.logo && state.settings.logo) {
            html += `<img class="inv-logo" src="${state.settings.logo}" alt="Logo">`;
        }
        if (t.company) {
            html += `<div class="inv-company-name">${escHtml(state.settings.companyName) || 'TÊN CÔNG TY'}</div>`;
            html += `<div class="inv-company-info">${escHtml(state.settings.companyAddress)}</div>`;
            if (state.settings.companyPhone) html += `<div class="inv-company-info">ĐT: ${escHtml(state.settings.companyPhone)}</div>`;
        }
        html += `</div>`;
    }

    if (state.invoiceMode === 'custom') {
        html += `<div class="inv-custom-mode-content" style="margin-bottom: 16px;">`;
        html += state.customHtml || '';
        html += `</div>`;
    } else {
        // Standard Invoice Body
        // Title
        html += `<div class="inv-title">HÓA ĐƠN BÁN HÀNG</div>`;
        html += `<div class="inv-meta"><span>Số: ${invNum}</span><span>Ngày: ${formatDate(state.date)}</span></div>`;

        // Customer
        if (t.customer) {
            html += `<div class="inv-customer">`;
            if (state.customer.name) html += `<p><strong>Khách hàng:</strong> ${escHtml(state.customer.name)}</p>`;
            if (state.customer.phone) html += `<p><strong>SĐT:</strong> ${escHtml(state.customer.phone)}</p>`;
            if (state.customer.address) html += `<p><strong>Địa chỉ:</strong> ${escHtml(state.customer.address)}</p>`;
            html += `</div>`;
        }

        // Products table
        if (t.products && state.products.length > 0) {
            html += `<table class="inv-table">
                <thead><tr><th>STT</th><th>Sản phẩm</th><th class="col-qty">SL</th><th class="col-price">Đơn giá</th><th style="text-align:right">Thành tiền</th></tr></thead><tbody>`;
            state.products.forEach((p, i) => {
                if (!p.name && !p.price) return;
                html += `<tr>
                    <td>${i + 1}</td>
                    <td>${escHtml(p.name)}</td>
                    <td class="col-qty">${p.qty}</td>
                    <td class="col-price">${formatCurrency(p.price)}</td>
                    <td style="text-align:right">${formatCurrency(p.qty * p.price)}</td>
                </tr>`;
            });
            html += `</tbody></table>`;
        }

        // Total
        if (t.total) {
            html += `<div class="inv-total">
                <div class="inv-total-label">Tổng cộng</div>
                <div class="inv-total-amount">${formatCurrency(total)}</div>
            </div>`;
        }

        // Note
        if (t.note && state.note) {
            html += `<div class="inv-note"><strong>Ghi chú:</strong> ${escHtml(state.note)}</div>`;
        }
    } // end standard body

    // QR
    if (t.qr && state.settings.qrText) {
        html += `<div class="inv-qr"><div id="qrcode"></div></div>`;
    }

    // Footer
    html += `<div class="inv-footer">Cảm ơn quý khách! — Hóa đơn được tạo bởi Hóa Đơn Pro</div>`;

    // Custom Blocks (văn bản tự do)
    const visibleBlocks = (state.customBlocks || []).filter(b => b.visible && b.text.trim());
    if (visibleBlocks.length > 0) {
        html += `<div class="inv-custom-blocks">`;
        visibleBlocks.forEach(b => {
            const styles = [
                `font-size:${b.fontSize}`,
                `font-weight:${b.bold ? '700' : '400'}`,
                `font-style:${b.italic ? 'italic' : 'normal'}`,
                `text-align:${b.align}`,
                `color:${b.color || 'inherit'}`,
                `white-space:pre-wrap`,
                `word-break:break-word`
            ].join(';');
            html += `<div class="inv-custom-block" style="${styles}">${escHtml(b.text)}</div>`;
        });
        html += `</div>`;
    }

    html += `</div>`;

    document.getElementById('invoicePreview').innerHTML = html;

    // QR Code
    if (t.qr && state.settings.qrText) {
        const qrEl = document.getElementById('qrcode');
        if (qrEl) {
            qrEl.innerHTML = '';
            try {
                new QRCode(qrEl, {
                    text: state.settings.qrText,
                    width: 80, height: 80,
                    colorDark: state.settings.primaryColor,
                    colorLight: '#ffffff',
                    correctLevel: QRCode.CorrectLevel.M
                });
            } catch (e) { console.warn('QR error', e); }
        }
    }
}

// ===== Zoom =====
function zoomPreview(delta) {
    zoom = Math.max(50, Math.min(200, zoom + delta));
    document.getElementById('zoomLevel').textContent = zoom + '%';
    document.getElementById('previewPaper').style.transform = `scale(${zoom / 100})`;
}

// ===== Print =====
// Bản đồ kích thước giấy: [width_mm, height_mm]
const PAPER_SIZES = {
    'A4':      [210, 297],
    'A5':      [148, 210],
    'A6':      [105, 148],
    'A7':      [75, 105],
    'A8':      [52, 74],
    '100x150': [100, 150],
    '80mm':    [80, 297],
    'custom':  null        // được điền từ state.settings.customPaper khi in
};

// Font size theo khổ giấy (pt) — đủ lớn để đọc được khi in
const PRINT_FONT_SIZES = {
    'A4':      '14pt',
    'A5':      '13pt',
    'A6':      '11pt',
    'A7':      '10pt',
    'A8':      '10pt',
    '100x150': '11pt',
    '80mm':    '12pt'
};

function printInvoice() {
    const copies    = state.settings.copies;
    const content   = document.getElementById('invoicePreview').innerHTML;
    const printArea = document.getElementById('printArea');
    const paperSize = state.settings.paperSize;
    const orient    = state.settings.orientation;
    const cp        = state.settings.customPaper || {};
    const printMode = state.settings.printMode || 'tem';

    // ─── Kích thước giấy (mm) ───
    let pw, ph;
    if (paperSize === 'custom') {
        pw = cp.widthMM || 100;
        ph = cp.heightMM || 150;
    } else {
        [pw, ph] = PAPER_SIZES[paperSize] || PAPER_SIZES['A5'];
    }
    if (orient === 'landscape' && paperSize !== 'custom') { [pw, ph] = [ph, pw]; }

    // ─── Font size theo khổ giấy ───
    let fontSize;
    if (paperSize === 'custom') {
        // Tính font tỉ lệ với chiều rộng (tối thiểu 10pt)
        fontSize = Math.max(10, Math.round(pw * 0.075)) + 'pt';
    } else {
        fontSize = PRINT_FONT_SIZES[paperSize] || '13pt';
    }

    // ─── Build HTML vùng in ───
    let printHtml = '';
    for (let i = 0; i < copies; i++) {
        if (printMode === 'tem') {
            printHtml += `
            <div class="print-invoice-page" style="width: ${pw}mm; height: ${ph}mm; overflow: hidden; page-break-inside: avoid; page-break-after: always; box-sizing: border-box;">
                <div class="invoice-preview" style="
                    font-family: ${state.settings.font};
                    font-size: ${fontSize};
                    line-height: 1.4;
                    width: 100%;
                    height: 100%;
                    padding: 3mm;
                    margin: 0;
                    box-sizing: border-box;
                ">
                    ${content}
                </div>
            </div>`;
        } else {
            printHtml += `
            <div class="print-invoice-page" style="width: ${pw}mm; min-height: ${ph}mm; overflow: visible; page-break-after: always; box-sizing: border-box;">
                <div class="invoice-preview" style="
                    font-family: ${state.settings.font};
                    font-size: ${fontSize};
                    line-height: 1.4;
                    width: 100%;
                    padding: 3mm;
                    margin: 0;
                    box-sizing: border-box;
                ">
                    ${content}
                </div>
            </div>`;
        }
    }
    printArea.innerHTML = printHtml;

    // ─── @page: khai báo đúng khổ giấy ───
    let styleEl = document.getElementById('printPageStyle');
    if (!styleEl) {
        styleEl = document.createElement('style');
        styleEl.id = 'printPageStyle';
        document.head.appendChild(styleEl);
    }
    if (printMode === 'bill' || paperSize === '80mm') {
        styleEl.textContent = `@page { size: ${pw}mm auto; margin: 0; }`;
    } else {
        styleEl.textContent = `@page { size: ${pw}mm ${ph}mm; margin: 0; }`;
    }

    // In — không zoom, không scale nhân tạo
    setTimeout(() => window.print(), 250);
}

// ===== Export PDF =====
function exportPDF() {
    const el = document.getElementById('invoicePreview');
    const paperSize = state.settings.paperSize;
    const orient = state.settings.orientation;

    // Sử dụng PAPER_SIZES đã khai báo
    let [w, h] = PAPER_SIZES[paperSize] || PAPER_SIZES['A5'];
    if (orient === 'landscape') { [w, h] = [h, w]; }

    showToast('Đang tạo PDF...', '');
    const opt = {
        margin: 0,
        filename: `hoadon_${state.date || 'export'}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, scrollY: 0 },
        jsPDF: { unit: 'mm', format: [w, h], orientation: orient },
        pagebreak: { mode: 'avoid-all' }
    };
    html2pdf().set(opt).from(el).save().then(() => {
        showToast('Đã xuất PDF thành công!', 'success');
    }).catch(err => {
        showToast('Lỗi xuất PDF: ' + err.message, 'error');
    });
}

// ===== Save / Load Invoice =====
function saveInvoice() {
    readFormState();
    const invoices = JSON.parse(localStorage.getItem('savedInvoices') || '[]');
    const entry = {
        id: Date.now(),
        date: state.date,
        customer: state.customer.name || 'Không tên',
        total: state.products.reduce((s, p) => s + p.qty * p.price, 0),
        data: JSON.parse(JSON.stringify(state))
    };
    invoices.unshift(entry);
    localStorage.setItem('savedInvoices', JSON.stringify(invoices));
    showToast('Đã lưu hóa đơn!', 'success');
}

function showSavedInvoices() {
    const invoices = JSON.parse(localStorage.getItem('savedInvoices') || '[]');
    const list = document.getElementById('savedList');

    if (invoices.length === 0) {
        list.innerHTML = '<p class="empty-msg">Chưa có hóa đơn nào được lưu</p>';
    } else {
        list.innerHTML = invoices.map((inv, i) => `
            <div class="saved-item">
                <div class="saved-item-info">
                    <strong>${escHtml(inv.customer)}</strong>
                    <span>${formatDate(inv.date)} — ${formatCurrency(inv.total)}</span>
                </div>
                <div class="saved-item-actions">
                    <button class="btn btn-sm btn-primary" onclick="loadInvoice(${i})">Tải</button>
                    <button class="btn btn-sm btn-danger" onclick="deleteInvoice(${i})">Xóa</button>
                </div>
            </div>
        `).join('');
    }
    document.getElementById('savedModal').style.display = 'flex';
}

function loadInvoice(idx) {
    const invoices = JSON.parse(localStorage.getItem('savedInvoices') || '[]');
    if (invoices[idx]) {
        state = invoices[idx].data;
        populateForm();
        renderProducts();
        updatePreview();
        closeSavedModal();
        showToast('Đã tải hóa đơn!', 'success');
    }
}

function deleteInvoice(idx) {
    const invoices = JSON.parse(localStorage.getItem('savedInvoices') || '[]');
    invoices.splice(idx, 1);
    localStorage.setItem('savedInvoices', JSON.stringify(invoices));
    showSavedInvoices();
    showToast('Đã xóa hóa đơn', '');
}

function closeSavedModal() {
    document.getElementById('savedModal').style.display = 'none';
}

// ===== Templates =====
function saveTemplate() {
    const name = prompt('Tên mẫu:');
    if (!name) return;
    const templates = JSON.parse(localStorage.getItem('invoiceTemplates') || '[]');
    templates.push({
        id: Date.now(), name,
        settings: JSON.parse(JSON.stringify(state.settings))
    });
    localStorage.setItem('invoiceTemplates', JSON.stringify(templates));
    renderTemplates();
    showToast('Đã lưu mẫu!', 'success');
}

function renderTemplates() {
    const templates = JSON.parse(localStorage.getItem('invoiceTemplates') || '[]');
    const list = document.getElementById('templateList');
    if (templates.length === 0) {
        list.innerHTML = '<p class="empty-msg">Chưa có mẫu nào được lưu</p>';
        return;
    }
    list.innerHTML = templates.map((t, i) => `
        <div class="template-item">
            <span class="template-item-name">${escHtml(t.name)}</span>
            <div class="template-item-actions">
                <button class="btn btn-sm btn-primary" onclick="loadTemplate(${i})">Áp dụng</button>
                <button class="btn btn-sm btn-danger" onclick="deleteTemplate(${i})">Xóa</button>
            </div>
        </div>
    `).join('');
}

function loadTemplate(idx) {
    const templates = JSON.parse(localStorage.getItem('invoiceTemplates') || '[]');
    if (templates[idx]) {
        state.settings = { ...state.settings, ...templates[idx].settings, toggles: { ...state.settings.toggles, ...templates[idx].settings.toggles } };
        populateForm();
        updatePreview();
        showToast('Đã áp dụng mẫu!', 'success');
    }
}

function deleteTemplate(idx) {
    const templates = JSON.parse(localStorage.getItem('invoiceTemplates') || '[]');
    templates.splice(idx, 1);
    localStorage.setItem('invoiceTemplates', JSON.stringify(templates));
    renderTemplates();
    showToast('Đã xóa mẫu', '');
}

// ===== Toast =====
function showToast(msg, type) {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = 'toast ' + (type || '');
    toast.textContent = msg;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

// ===== Helpers =====
function formatCurrency(n) {
    return new Intl.NumberFormat('vi-VN').format(n) + 'đ';
}
function formatDate(d) {
    if (!d) return '';
    const parts = d.split('-');
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
}
function escHtml(s) {
    if (!s) return '';
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// Init templates on load
document.addEventListener('DOMContentLoaded', renderTemplates);

// Close modal on overlay click
document.getElementById('savedModal')?.addEventListener('click', function (e) {
    if (e.target === this) closeSavedModal();
});

// ===== Custom Blocks (Văn bản tự do) =====

let blockIdCounter = 1;

/** Tạo 1 block mới với giá trị mặc định */
function addBlock() {
    const block = {
        id: Date.now(),
        text: '',
        fontSize: '16px',
        bold: false,
        italic: false,
        align: 'center',
        color: '#1D1D1F',
        visible: true
    };
    if (!state.customBlocks) state.customBlocks = [];
    state.customBlocks.push(block);
    renderBlocks();
    updatePreview();
    saveState();
    // Focus vào textarea mới thêm
    setTimeout(() => {
        const el = document.getElementById('blockText_' + block.id);
        if (el) el.focus();
    }, 50);
}

/** Xóa block */
function removeBlock(id) {
    state.customBlocks = (state.customBlocks || []).filter(b => b.id !== id);
    renderBlocks();
    updatePreview();
    saveState();
}

/** Cập nhật 1 trường của block */
function updateBlock(id, field, value) {
    const block = (state.customBlocks || []).find(b => b.id === id);
    if (!block) return;
    if (field === 'bold' || field === 'italic' || field === 'visible') value = !!value;
    block[field] = value;
    updatePreview();
    saveState();
}

/** Toggle hiển thị/ẩn block */
function toggleBlock(id) {
    const block = (state.customBlocks || []).find(b => b.id === id);
    if (!block) return;
    block.visible = !block.visible;
    renderBlocks();
    updatePreview();
    saveState();
}

/** Di chuyển block lên/xuống */
function moveBlock(id, dir) {
    const arr = state.customBlocks || [];
    const idx = arr.findIndex(b => b.id === id);
    if (idx < 0) return;
    const newIdx = idx + dir;
    if (newIdx < 0 || newIdx >= arr.length) return;
    [arr[idx], arr[newIdx]] = [arr[newIdx], arr[idx]];
    renderBlocks();
    updatePreview();
    saveState();
}

/** Render danh sách block editor trong tab Văn bản */
function renderBlocks() {
    const list = document.getElementById('blockList');
    if (!list) return;
    const blocks = state.customBlocks || [];

    if (blocks.length === 0) {
        list.innerHTML = `<p class="empty-msg" style="padding:16px 0">
            Chưa có khối nào. Nhấn <strong>Thêm khối</strong> để bắt đầu.
        </p>`;
        return;
    }

    list.innerHTML = blocks.map((b, idx) => `
    <div class="block-item ${b.visible ? '' : 'block-hidden'}" id="blockItem_${b.id}">
        <!-- Header: toggle + label + actions -->
        <div class="block-item-header">
            <label class="block-toggle" title="${b.visible ? 'Đang hiển thị — click để ẩn' : 'Đang ẩn — click để hiện'}">
                <input type="checkbox" ${b.visible ? 'checked' : ''}
                    onchange="toggleBlock(${b.id})">
                <span class="block-toggle-track"></span>
            </label>
            <span class="block-label">${b.visible ? '👁 Hiển thị' : '🙈 Ẩn'} · Khối ${idx + 1}</span>
            <div class="block-move-btns">
                ${idx > 0 ? `<button class="block-btn" onclick="moveBlock(${b.id}, -1)" title="Lên">↑</button>` : '<span class="block-btn-placeholder"></span>'}
                ${idx < blocks.length - 1 ? `<button class="block-btn" onclick="moveBlock(${b.id}, 1)" title="Xuống">↓</button>` : '<span class="block-btn-placeholder"></span>'}
            </div>
            <button class="block-delete-btn" onclick="removeBlock(${b.id})" title="Xóa khối">✕</button>
        </div>

        <!-- Textarea -->
        <textarea
            id="blockText_${b.id}"
            class="block-textarea"
            rows="3"
            placeholder="Nhập nội dung văn bản..."
            oninput="updateBlock(${b.id}, 'text', this.value)"
        >${escHtml(b.text)}</textarea>

        <!-- Format controls -->
        <div class="block-controls">
            <!-- Font size -->
            <select class="block-select" onchange="updateBlock(${b.id}, 'fontSize', this.value)">
                ${[['10px','Nhỏ (10)'],['12px','Nhỏ (12)'],['14px','Vừa (14)'],['16px','Vừa (16)'],
                   ['20px','To (20)'],['24px','To (24)'],['32px','Rất to (32)'],['40px','Cực to (40)'],['48px','Khổng lồ (48)']]
                  .map(([v, l]) => `<option value="${v}" ${b.fontSize === v ? 'selected' : ''}>${l}</option>`).join('')}
            </select>

            <!-- Bold -->
            <button class="block-fmt-btn ${b.bold ? 'active' : ''}"
                onclick="this.classList.toggle('active'); updateBlock(${b.id}, 'bold', this.classList.contains('active'))"
                title="In đậm"><b>B</b></button>

            <!-- Italic -->
            <button class="block-fmt-btn ${b.italic ? 'active' : ''}"
                onclick="this.classList.toggle('active'); updateBlock(${b.id}, 'italic', this.classList.contains('active'))"
                title="In nghiêng"><i>I</i></button>

            <!-- Align -->
            <select class="block-select block-select-sm" onchange="updateBlock(${b.id}, 'align', this.value)">
                <option value="left"   ${b.align==='left'   ? 'selected':''}>⬛ Trái</option>
                <option value="center" ${b.align==='center' ? 'selected':''}>⬛ Giữa</option>
                <option value="right"  ${b.align==='right'  ? 'selected':''}>⬛ Phải</option>
            </select>

            <!-- Color -->
            <input type="color" class="block-color-pick" value="${b.color || '#1D1D1F'}"
                onchange="updateBlock(${b.id}, 'color', this.value)"
                title="Màu chữ">
        </div>
    </div>`).join('');
}

// ===== Custom Paper Size =====

let _customUnit = 'mm'; // đơn vị hiện đang hiển thị trong input

/** Khởi tạo UI custom paper từ state đã lưu */
function initCustomSizeUI() {
    const cp = state.settings.customPaper || {};
    _customUnit = cp.unit || 'mm';

    // Cập nhật unit toggle
    document.getElementById('unitMM')?.classList.toggle('active', _customUnit === 'mm');
    document.getElementById('unitCM')?.classList.toggle('active', _customUnit === 'cm');
    document.querySelectorAll('.custom-unit-label').forEach(el => el.textContent = _customUnit);

    // Điền giá trị vào input (chuyển từ mm nếu đang dùng cm)
    const wInput = document.getElementById('customWidth');
    const hInput = document.getElementById('customHeight');
    if (wInput && hInput) {
        if (_customUnit === 'cm') {
            wInput.value = ((cp.widthMM || 100) / 10).toFixed(1);
            hInput.value = ((cp.heightMM || 150) / 10).toFixed(1);
        } else {
            wInput.value = cp.widthMM || 100;
            hInput.value = cp.heightMM || 150;
        }
    }

    // Khôi phục hiển thị customSizeDisplay (nếu cần)
    updateCustomSizeDisplay();
}

/** Đổi đơn vị mm ↔ cm, chuyển đổi giá trị trong input */
function setUnit(unit) {
    const wInput = document.getElementById('customWidth');
    const hInput = document.getElementById('customHeight');
    if (!wInput || !hInput) return;

    const wVal = parseFloat(wInput.value) || 0;
    const hVal = parseFloat(hInput.value) || 0;

    if (unit === 'cm' && _customUnit === 'mm') {
        wInput.value = (wVal / 10).toFixed(1);
        hInput.value = (hVal / 10).toFixed(1);
        wInput.step = '0.1'; hInput.step = '0.1';
        wInput.min = '1';    hInput.min = '1';
    } else if (unit === 'mm' && _customUnit === 'cm') {
        wInput.value = Math.round(wVal * 10);
        hInput.value = Math.round(hVal * 10);
        wInput.step = '0.5'; hInput.step = '0.5';
        wInput.min = '10';   hInput.min = '10';
    }

    _customUnit = unit;
    document.getElementById('unitMM')?.classList.toggle('active', unit === 'mm');
    document.getElementById('unitCM')?.classList.toggle('active', unit === 'cm');
    document.querySelectorAll('.custom-unit-label').forEach(el => el.textContent = unit);
    state.settings.customPaper.unit = unit;
    updateCustomSizeDisplay();
}

/** Khi người dùng nhập thủ công, cập nhật label hiển thị */
function onCustomSizeInput() {
    updateCustomSizeDisplay();
}

/** Áp dụng preset nhanh: điền vào input và áp dụng luôn */
function applyPreset(wMM, hMM, name) {
    const wInput = document.getElementById('customWidth');
    const hInput = document.getElementById('customHeight');
    if (!wInput || !hInput) return;

    if (_customUnit === 'cm') {
        wInput.value = (wMM / 10).toFixed(1);
        hInput.value = (hMM / 10).toFixed(1);
    } else {
        wInput.value = wMM;
        hInput.value = hMM;
    }

    // Gán tên preset
    if (!state.settings.customPaper) state.settings.customPaper = {};
    state.settings.customPaper.name = name;

    updateCustomSizeDisplay();
    applyCustomSize();
}

/** Áp dụng khổ giấy tùy chỉnh vào state và preview */
function applyCustomSize() {
    const wInput = document.getElementById('customWidth');
    const hInput = document.getElementById('customHeight');
    if (!wInput || !hInput) return;

    const wVal = parseFloat(wInput.value) || 100;
    const hVal = parseFloat(hInput.value) || 150;

    // Chuyển về mm để lưu
    const wMM = _customUnit === 'cm' ? Math.round(wVal * 10) : wVal;
    const hMM = _customUnit === 'cm' ? Math.round(hVal * 10) : hVal;

    if (!state.settings.customPaper) state.settings.customPaper = {};
    state.settings.customPaper.widthMM  = wMM;
    state.settings.customPaper.heightMM = hMM;
    state.settings.customPaper.unit     = _customUnit;

    // Auto switch orientation
    if (wMM > hMM && state.settings.orientation !== 'landscape') {
        selectOrientation('landscape', true);
    } else if (wMM <= hMM && state.settings.orientation !== 'portrait') {
        selectOrientation('portrait', true);
    }

    // Đánh dấu paperSize là 'custom'
    state.settings.paperSize = 'custom';

    // Bỏ active khỏi các size-btn có sẵn
    document.querySelectorAll('.size-btn').forEach(b => b.classList.remove('active'));

    // Cập nhật preview paper với kích thước pixel tương đương (1mm ≈ 3.7795px)
    updatePreviewPaperCustom(wMM, hMM);

    updateCustomSizeDisplay();
    saveState();
    showToast(`✓ Đã áp dụng: ${state.settings.customPaper.name || 'Tùy chỉnh'} — ${wMM}×${hMM}mm`, 'success');
}

/** Cập nhật kích thước previewPaper theo mm */
function updatePreviewPaperCustom(wMM, hMM) {
    const MM = 3.7795;
    const paper = document.getElementById('previewPaper');
    if (!paper) return;
    paper.style.width    = (wMM * MM) + 'px';
    paper.style.minHeight = (hMM * MM) + 'px';
    paper.setAttribute('data-size', 'custom');
}

/** Cập nhật label hiển thị kích thước đang nhập */
function updateCustomSizeDisplay() {
    const wInput = document.getElementById('customWidth');
    const hInput = document.getElementById('customHeight');
    const display = document.getElementById('customSizeDisplay');
    if (!wInput || !hInput || !display) return;

    const w = parseFloat(wInput.value) || 0;
    const h = parseFloat(hInput.value) || 0;
    const name = state.settings.customPaper?.name || 'Tùy chỉnh';
    display.textContent = `${name} — ${w} × ${h} ${_customUnit}`;
}
