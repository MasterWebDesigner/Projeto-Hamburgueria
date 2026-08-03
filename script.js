var cart = [];
var WHATSAPP_NUM = (function(){ try { return localStorage.getItem('hb_whatsapp') || '5511999999999'; } catch(e) { return '5511999999999'; } })();
var EXTRAS_LIST = [
    { name: 'Picles', price: 2.00 },
    { name: 'Bacon', price: 4.00 },
    { name: 'Tomate', price: 2.00 },
    { name: 'Mussarela', price: 3.00 },
    { name: 'Cebola Roxa', price: 2.00 },
    { name: 'Alface', price: 1.50 },
    { name: 'Ovo', price: 3.00 },
    { name: 'Cheddar Extra', price: 4.00 },
    { name: 'Molho Especial', price: 2.50 },
    { name: 'Jalapeño', price: 2.00 },
    { name: 'Pepino', price: 2.00 }
];
var EXTRAS_ITEM_IDX = -1;

function formatPrice(v) {
    return 'R$ ' + v.toFixed(2).replace('.', ',');
}

function isStoreOpen() {
    try { return localStorage.getItem('hb_status') !== 'closed'; } catch(e) { return true; }
}

function openStoreBadge() {
    var el = document.getElementById('topMarquee');
    if (!el) return;
    if (isStoreOpen()) {
        var hours = localStorage.getItem('hb_hours');
        el.innerHTML = '🟢 Aberto | ' + (hours || 'Terça a Domingo, das 18h às 23h30') + ' | Delivery em Diadema';
    } else {
        var hours = localStorage.getItem('hb_hours');
        el.innerHTML = '🔴 Fechados no momento | ' + (hours || 'Voltamos em breve!') + ' | Delivery em Diadema';
    }
}

function isDelivery() {
    var el = document.getElementById('orderType');
    return el && el.value === 'Entregar';
}

function getChangeFor() {
    var sel = document.getElementById('orderPayment');
    return sel ? sel.value : '';
}

function toggleChangeField() {
    var el = document.getElementById('changeField');
    var troco = document.getElementById('changeFor');
    if (el && troco) {
        if (getChangeFor() === 'Dinheiro') {
            el.style.display = 'flex';
        } else {
            el.style.display = 'none';
            troco.value = '';
        }
    }
}

function getAddress() {
    var parts = [];
    var rua = document.getElementById('addrStreet');
    var num = document.getElementById('addrNumber');
    var bairro = document.getElementById('addrNeighborhood');
    var comp = document.getElementById('addrComplement');
    var ref = document.getElementById('addrReference');
    if (rua && rua.value.trim()) parts.push(rua.value.trim());
    if (num && num.value.trim()) parts.push('nº ' + num.value.trim());
    if (comp && comp.value.trim()) parts.push(comp.value.trim());
    if (bairro && bairro.value.trim()) parts.push(bairro.value.trim());
    if (ref && ref.value.trim()) parts.push('Ref: ' + ref.value.trim());
    return parts.length > 0 ? parts.join(', ') : '';
}

function parsePrice(text) {
    var cleaned = (text || '').replace(/R\$\s*/g, '').replace(/\./g, '').replace(',', '.').trim();
    return parseFloat(cleaned) || 0;
}

function getItemExtrasTotal(item) {
    if (!item.extras || item.extras.length === 0) return 0;
    return item.extras.reduce(function(s, e) { return s + e.price; }, 0) * item.qty;
}

function updateItemNote(idx, value) {
    if (cart[idx]) cart[idx].notes = value;
}

function addToCart(name, priceText, imgSrc) {
    var price = parsePrice(priceText);
    if (price <= 0) return;
    var existing = cart.find(function(item) { return item.name === name; });
    if (existing) {
        existing.qty++;
    } else {
        cart.push({ name: name, price: price, qty: 1, img: imgSrc, extras: [], notes: '' });
    }
    updateCartUI();
    showCartFeedback(name);
}

function removeFromCart(name) {
    var idx = cart.findIndex(function(item) { return item.name === name; });
    if (idx === -1) return;
    if (cart[idx].qty > 1) {
        cart[idx].qty--;
    } else {
        cart.splice(idx, 1);
    }
    updateCartUI();
}

function getCartTotal() {
    return cart.reduce(function(sum, item) {
        var base = item.price * item.qty;
        var extras = getItemExtrasTotal(item);
        return sum + base + extras;
    }, 0);
}

function getCartCount() {
    return cart.reduce(function(sum, item) { return sum + item.qty; }, 0);
}

function updateCartUI() {
    var count = getCartCount();
    var total = getCartTotal();
    var badge = document.getElementById('cartBadge');
    var totalEl = document.getElementById('cartTotal');
    if (badge) badge.textContent = count;
    if (totalEl) totalEl.textContent = formatPrice(total);
    if (count === 0) {
        if (badge) badge.style.display = 'none';
    } else {
        if (badge) badge.style.display = 'flex';
    }
    renderCartItems();
}

function showCartFeedback(name) {
    var el = document.createElement('div');
    el.className = 'cart-feedback';
    el.textContent = '✓ ' + name + ' adicionado';
    document.body.appendChild(el);
    setTimeout(function() { el.remove(); }, 2000);
}

function renderCartItems() {
    var list = document.getElementById('cartItemsList');
    if (!list) return;
    if (cart.length === 0) {
        list.innerHTML = '<div class="cart-empty">Seu carrinho está vazio</div>';
        return;
    }
    var couponVal = getCouponValue();
    var discount = getSelectedCoupons().length * couponVal;
    var subtotal = getCartTotal();
    var deliveryFee = isDelivery() ? getDeliveryFee() : 0;
    var total = subtotal - discount + deliveryFee;
    if (total < 0) total = 0;
    list.innerHTML = '';
    cart.forEach(function(item, idx) {
        var div = document.createElement('div');
        div.className = 'cart-item-row';
        var extrasHtml = '';
        var exTotal = getItemExtrasTotal(item);
        if (item.extras && item.extras.length > 0) {
            var exNames = item.extras.map(function(e) { return e.name + ' (+' + formatPrice(e.price) + ')'; }).join(', ');
            extrasHtml = '<div class="cart-item-extras">➕ ' + exNames + '</div>';
        }
        div.innerHTML = '<div class="cart-item-info"><span class="cart-item-name">' + item.name + '</span><span class="cart-item-price">' + formatPrice(item.price) + '</span>' + extrasHtml + '<input class="cart-item-note" type="text" placeholder="Observação (ex: sem cebola)" value="' + (item.notes || '').replace(/"/g, '&quot;') + '" oninput="updateItemNote(' + idx + ',this.value)"></div>' +
            '<div class="cart-item-controls"><div class="cart-item-qty"><button class="cart-qty-btn" onclick="removeFromCart(\'' + item.name.replace(/'/g, "\\'") + '\')">−</button><span>' + item.qty + '</span><button class="cart-qty-btn" onclick="addToCart(\'' + item.name.replace(/'/g, "\\'") + '\',\'' + item.price.toFixed(2).replace('.', ',') + '\',\'\')">+</button></div><button class="cart-extras-btn" onclick="openExtras(' + idx + ')" title="Adicionais">➕ Adicionais</button><span class="cart-item-subtotal">' + formatPrice(item.price * item.qty + exTotal) + '</span></div>';
        list.appendChild(div);
    });
    var totalDiv = document.createElement('div');
    totalDiv.className = 'cart-total-line';
    var totalHtml = '<strong>Subtotal:</strong> <span>' + formatPrice(subtotal) + '</span>';
    if (discount > 0) {
        totalHtml += '<br><span class="discount">🎫 Cupom -' + formatPrice(discount) + '</span>';
    }
    totalHtml += '<br><strong>Total:</strong> <span>' + formatPrice(total) + '</span>';
    totalDiv.innerHTML = totalHtml;
    list.appendChild(totalDiv);
}

function openCartModal() {
    renderCartItems();
    document.getElementById('couponArea').style.display = 'none';
    document.getElementById('couponArea').classList.remove('open');
    document.getElementById('cartModal').classList.add('open');
    updateDeliveryInfo();
    checkCoupons();
}

function updateDeliveryInfo() {
    var el = document.getElementById('deliveryEstimateDisplay');
    try {
        var parts = [];
        var est = localStorage.getItem('hb_delivery_estimate');
        var fee = getDeliveryFee();
        if (est) parts.push('⏱ ' + est);
        if (fee > 0 && isDelivery()) parts.push('🛵 Taxa entrega: ' + formatPrice(fee));
        if (parts.length > 0) {
            el.innerHTML = parts.join(' | ');
            el.style.display = 'flex';
        } else {
            el.style.display = 'none';
        }
    } catch(e) { el.style.display = 'none'; }
}

function closeCartModal() {
    document.getElementById('cartModal').classList.remove('open');
}

function getOrders() {
    try { return JSON.parse(localStorage.getItem('hb_orders')) || []; } catch(e) { return []; }
}

function saveOrders(orders) {
    localStorage.setItem('hb_orders', JSON.stringify(orders));
}

function getLoyalty() {
    try {
        var raw = localStorage.getItem('hb_loyalty');
        if (raw) { var p = JSON.parse(raw); if (p && p.customers) return p; }
    } catch(e) {}
    return { customers: {} };
}

function getCouponValue() {
    try {
        var raw = localStorage.getItem('hb_loyalty_config');
        if (raw) { var p = JSON.parse(raw); if (p && p.couponValue > 0) return p.couponValue; }
    } catch(e) {}
    return 30;
}

function getDeliveryFee() {
    try { var v = parseFloat(localStorage.getItem('hb_delivery_fee')); return isNaN(v) ? 0 : v; } catch(e) { return 0; }
}

function isDelivery() {
    var el = document.getElementById('orderType');
    return el && el.value === 'Entregar';
}

function normPhone(p) {
    var d = (p || '').replace(/\D/g, '');
    if (d.length === 11 && d.charAt(2) === '9') d = d.slice(0, 2) + d.slice(3);
    return d;
}

function checkCoupons() {
    var phone = document.getElementById('orderPhone').value.trim();
    var name = document.getElementById('orderName').value.trim();
    var area = document.getElementById('couponArea');
    area.style.display = 'none';
    area.classList.remove('open');
    if (!phone || !name || name.length < 2 || phone.replace(/\D/g, '').length < 8) return;
    var data = getLoyalty();
    var c = null;
    var key = (name + '|' + phone).toLowerCase().trim();
    c = data.customers[key];
    if (!c) {
        var phoneNorm = normPhone(phone);
        for (var k in data.customers) {
            if (data.customers[k].phone && normPhone(data.customers[k].phone) === phoneNorm) {
                c = data.customers[k];
                break;
            }
        }
    }
    if (!c) return;
    var available = [];
    c.coupons.forEach(function(cp, idx) { if (!cp.used) available.push(idx); });
    if (available.length === 0) {
        area.innerHTML = '<div class="no-coupons">Nenhum cupom disponível no momento</div>';
        area.style.display = 'block';
        area.classList.add('open');
        return;
    }
    var html = '<div class="title">🎫 Cupons disponíveis</div>';
    var couponStr = formatPrice(getCouponValue());
    available.forEach(function(idx) {
        html += '<label><input type="checkbox" class="coupon-check" value="' + idx + '" onchange="updateCouponDiscount()"> Cupom de <span class="coupon-value">' + couponStr + '</span> de desconto</label>';
    });
    area.innerHTML = html;
    area.style.display = 'block';
    area.classList.add('open');
    updateCouponDiscount();
}

function updateCouponDiscount() {
    var checks = document.querySelectorAll('.coupon-check:checked');
    var discount = checks.length * getCouponValue();
    // Re-render cart items to show discount
    renderCartItems();
}

function getSelectedCoupons() {
    var checks = document.querySelectorAll('.coupon-check:checked');
    return Array.from(checks).map(function(cb) { return parseInt(cb.value); });
}

function openExtras(idx) {
    EXTRAS_ITEM_IDX = idx;
    var modal = document.getElementById('extrasModal');
    modal.classList.add('open');
    renderExtrasModal();
}

function closeExtras() {
    document.getElementById('extrasModal').classList.remove('open');
    EXTRAS_ITEM_IDX = -1;
}

function renderExtrasModal() {
    var item = cart[EXTRAS_ITEM_IDX];
    if (!item) return;
    document.getElementById('extrasItemName').textContent = item.name;
    var list = document.getElementById('extrasList');
    list.innerHTML = '';
    var selected = item.extras || [];
    EXTRAS_LIST.forEach(function(e) {
        var checked = selected.some(function(s) { return s.name === e.name; });
        var div = document.createElement('div');
        div.className = 'extras-item';
        div.innerHTML = '<label><input type="checkbox" class="extras-check" data-name="' + e.name.replace(/"/g, '&quot;') + '" data-price="' + e.price + '"' + (checked ? ' checked' : '') + '> <span>' + e.name + '</span> <span class="extras-price">' + formatPrice(e.price) + '</span></label>';
        list.appendChild(div);
    });
}

function saveExtras() {
    var item = cart[EXTRAS_ITEM_IDX];
    if (!item) return;
    var checks = document.querySelectorAll('#extrasList .extras-check:checked');
    item.extras = Array.from(checks).map(function(cb) {
        return { name: cb.getAttribute('data-name'), price: parseFloat(cb.getAttribute('data-price')) };
    });
    updateCartUI();
    closeExtras();
}

function sendOrder() {
    if (cart.length === 0) { alert('Carrinho vazio!'); return; }
    if (!isStoreOpen()) { alert('A loja está fechada no momento. Volte em nosso horário de funcionamento!'); return; }
    var name = document.getElementById('orderName').value.trim();
    var phone = document.getElementById('orderPhone').value.trim();
    var address = getAddress();
    var payment = document.getElementById('orderPayment').value;
    var type = document.getElementById('orderType').value;
    var notes = document.getElementById('orderNotes').value.trim();
    var troco = document.getElementById('changeFor');
    var changeFor = troco && payment === 'Dinheiro' ? troco.value.trim() : '';
    if (!name) { alert('Digite seu nome'); return; }
    if (!phone) { alert('Digite seu celular'); return; }
    if (type === 'Entregar' && !address) { alert('Preencha o endereço de entrega (rua e número)'); return; }

    var discount = getSelectedCoupons().length * getCouponValue();
    var subtotal = getCartTotal();
    var deliveryFee = type === 'Entregar' ? getDeliveryFee() : 0;
    var total = subtotal - discount + deliveryFee;
    if (total < 0) total = 0;

    var now = new Date();
    var orderId = '#' + now.getFullYear().toString().slice(-2) + ('0'+(now.getMonth()+1)).slice(-2) + ('0'+now.getDate()).slice(-2) + '-' + Math.floor(Math.random() * 999).toString().padStart(3, '0');

    var items = cart.map(function(item) {
        var obj = { name: item.name, qty: item.qty, price: item.price, subtotal: item.price * item.qty };
        if (item.extras && item.extras.length > 0) {
            obj.extras = item.extras.slice();
            obj.extrasTotal = getItemExtrasTotal(item);
        }
        if (item.notes && item.notes.trim()) {
            obj.notes = item.notes.trim();
        }
        return obj;
    });

    var order = {
        id: orderId,
        timestamp: now.toISOString(),
        time: ('0'+now.getHours()).slice(-2) + ':' + ('0'+now.getMinutes()).slice(-2),
        date: ('0'+now.getDate()).slice(-2) + '/' + ('0'+(now.getMonth()+1)).slice(-2) + '/' + now.getFullYear(),
        customer: name,
        phone: phone,
        address: type === 'Entregar' ? address : '-',
        payment: payment,
        changeFor: changeFor,
        type: type,
        notes: notes,
        items: items,
        total: subtotal,
        couponDiscount: discount,
        deliveryFee: deliveryFee,
        finalTotal: total,
        status: 'Novo'
    };

    var orders = getOrders();
    orders.unshift(order);
    saveOrders(orders);

    // Mark used coupons in loyalty data
    if (discount > 0) {
        var data = getLoyalty();
        var custKey = (name + '|' + phone).toLowerCase().trim();
        var c = data.customers[custKey];
        if (!c) {
            // Try phone-only search
            for (var k in data.customers) {
                if (data.customers[k].phone && normPhone(data.customers[k].phone) === normPhone(phone)) {
                    c = data.customers[k];
                    break;
                }
            }
        }
        if (c) {
            getSelectedCoupons().forEach(function(idx) {
                if (c.coupons[idx] && !c.coupons[idx].used) {
                    c.coupons[idx].used = true;
                }
            });
            localStorage.setItem('hb_loyalty', JSON.stringify(data));
        }
    }

    var lines = ['🍔 *NOVO PEDIDO - Navarro Burguer*', '', '*Cliente:* ' + name, '*Tel:* ' + phone, '*Tipo:* ' + type, '*Endereço:* ' + (type === 'Entregar' ? address : '-'), '*Pagamento:* ' + payment + (changeFor ? ' (troco p/ ' + changeFor + ')' : ''), ''];
    if (notes) { lines.push('*Obs:* ' + notes); lines.push(''); }
    lines.push('━ ITENS ━');
    cart.forEach(function(item) {
        var line = item.qty + 'x ' + item.name + ' — ' + formatPrice(item.price * item.qty);
        if (item.notes && item.notes.trim()) {
            line += '\n   📝 ' + item.notes.trim();
        }
        if (item.extras && item.extras.length > 0) {
            var exStr = item.extras.map(function(e) { return e.name + ' (+' + formatPrice(e.price) + ')'; }).join(', ');
            var exTotal = getItemExtrasTotal(item);
            line += '\n   ➕ Adicionais: ' + exStr + '\n   ↳ Total com adicionais: ' + formatPrice(item.price * item.qty + exTotal);
        } else {
            line += '\n   ↳ Total: ' + formatPrice(item.price * item.qty);
        }
        lines.push(line);
    });
    lines.push('');
    lines.push('*Subtotal: ' + formatPrice(subtotal) + '*');
    if (discount > 0) {
        lines.push('*🎫 Cupom Fidelidade: -' + formatPrice(discount) + '*');
    }
    if (deliveryFee > 0) {
        lines.push('*🛵 Taxa de entrega: ' + formatPrice(deliveryFee) + '*');
    }
    lines.push('*Total: ' + formatPrice(total) + '*');
    lines.push('');
    lines.push('📍 Delivery em Diadema');
    lines.push('');
    lines.push('📋 Pedido: ' + orderId);

    var msg = encodeURIComponent(lines.join('\n'));
    window.open('https://wa.me/' + WHATSAPP_NUM + '?text=' + msg, '_blank');
    cart = [];
    updateCartUI();
    closeCartModal();
    document.getElementById('orderName').value = '';
    document.getElementById('orderPhone').value = '';
    document.getElementById('orderType').value = 'Entregar';
    document.getElementById('orderNotes').value = '';
    // Reset address fields
    ['addrStreet','addrNumber','addrNeighborhood','addrComplement','addrReference'].forEach(function(id) {
        var el = document.getElementById(id);
        if (el) el.value = '';
    });
    // Reset change field
    var troco = document.getElementById('changeFor');
    if (troco) troco.value = '';
    var ca = document.getElementById('couponArea');
    ca.style.display = 'none';
    ca.classList.remove('open');
    ca.innerHTML = '';
}

function initCartButtons() {
    document.querySelectorAll('.card .card-footer').forEach(function(footer) {
        if (footer.querySelector('.btn-add-cart')) return; // Already added
        var pedirBtn = footer.querySelector('.btn-sm');
        if (!pedirBtn) return;
        var card = footer.closest('.card');
        var title = card ? card.querySelector('h3') : null;
        var priceEl = card ? card.querySelector('.price') : null;
        if (!title || !priceEl) return;
        var img = card.querySelector('img');
        var imgSrc = img ? img.src : '';
        var addBtn = document.createElement('button');
        addBtn.className = 'btn-add-cart';
        addBtn.textContent = '+';
        addBtn.title = 'Adicionar ao carrinho';
        addBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            addToCart(title.textContent.trim(), priceEl.textContent, imgSrc);
        });
        footer.insertBefore(addBtn, pedirBtn);
    });
}

document.addEventListener('DOMContentLoaded', function() {
    initCartButtons();

    // Close cart modal on overlay click
    var cartModal = document.getElementById('cartModal');
    if (cartModal) {
        cartModal.querySelector('.cart-modal-overlay').addEventListener('click', closeCartModal);
        cartModal.querySelector('.cart-modal-close').addEventListener('click', closeCartModal);
    }

    // Close extras modal on overlay click
    var extrasModal = document.getElementById('extrasModal');
    if (extrasModal) {
        extrasModal.querySelector('.extras-overlay').addEventListener('click', closeExtras);
        extrasModal.querySelector('.extras-close').addEventListener('click', closeExtras);
    }

    // Update all WhatsApp links with configured number
    var waNum = WHATSAPP_NUM;
    document.querySelectorAll('a[href*="wa.me"]').forEach(function(a) {
        var href = a.getAttribute('href');
        href = href.replace(/wa\.me\/\d+/, 'wa.me/' + waNum);
        a.setAttribute('href', href);
    });

    // Coupon check while typing (live)
    document.getElementById('orderName').addEventListener('input', checkCoupons);
    document.getElementById('orderPhone').addEventListener('input', checkCoupons);
    document.getElementById('orderPhone').addEventListener('input', function() {
        if (!this.value.trim()) {
            var a = document.getElementById('couponArea');
            a.style.display = 'none';
            a.classList.remove('open');
        }
    });

    // Payment change → toggle change field
    var paySel = document.getElementById('orderPayment');
    if (paySel) paySel.addEventListener('change', toggleChangeField);

    // Toggle address fields + re-render when order type changes
    document.getElementById('orderType').addEventListener('change', function() {
        var addrFields = document.getElementById('addressFields');
        if (addrFields) addrFields.style.display = this.value === 'Entregar' ? 'flex' : 'none';
        renderCartItems();
        updateDeliveryInfo();
    });

    // Init badge, change field, address visibility on load
    openStoreBadge();
    toggleChangeField();
    var addrFields = document.getElementById('addressFields');
    var typeSel = document.getElementById('orderType');
    if (addrFields && typeSel) addrFields.style.display = typeSel.value === 'Entregar' ? 'flex' : 'none';
});
